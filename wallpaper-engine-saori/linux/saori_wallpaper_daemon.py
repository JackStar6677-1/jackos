#!/usr/bin/env python3
"""SAORI wallpaper en Linux: sirve la carpeta del wallpaper (127.0.0.1:18765) y emite el
audio del sistema como los 128 valores de Wallpaper Engine (64 izq + 64 der, 0..1) por
WebSocket (127.0.0.1:18766). Audio: monitor del sink por defecto de PipeWire/Pulse (parec)."""
import asyncio, functools, http.server, json, os, subprocess, threading
import numpy as np
import websockets

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, ".."))
HTTP_PORT, WS_PORT = 18765, 18766
RATE, BLOQUE, BANDAS, FPS = 44100, 2048, 64, 30
clientes = set()

# 64 bandas logaritmicas entre 40 Hz y 16 kHz
bordes = np.geomspace(40, 16000, BANDAS + 1)
frecs = np.fft.rfftfreq(BLOQUE, 1 / RATE)
idx = [np.where((frecs >= bordes[i]) & (frecs < bordes[i + 1]))[0] for i in range(BANDAS)]
ventana = np.hanning(BLOQUE)
ref = 1e-3

def bandas(x):
    global ref
    esp = np.abs(np.fft.rfft(x * ventana)) / BLOQUE
    v = np.array([esp[i].mean() if len(i) else 0.0 for i in idx])
    ref = max(v.max(), ref * 0.995, 1e-4)          # auto-ganancia suave
    return np.clip(np.sqrt(v / ref), 0, 1)

def servir_http():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=RAIZ)
    h.log_message = lambda *a, **k: None
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    http.server.ThreadingHTTPServer(("127.0.0.1", HTTP_PORT), h).serve_forever()

def sink():
    return subprocess.run(["pactl", "get-default-sink"], capture_output=True, text=True).stdout.strip()

async def audio(loop):
    while True:
        actual = sink()
        p = await asyncio.create_subprocess_exec(
            "parec", "-d", actual + ".monitor", "--format=s16le", f"--rate={RATE}",
            "--channels=2", "--latency-msec=20", stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL)
        cada = 0
        try:
            while True:
                datos = await asyncio.wait_for(p.stdout.readexactly(BLOQUE * 4), 3)
                s = np.frombuffer(datos, np.int16).reshape(-1, 2) / 32768.0
                if clientes:
                    msg = json.dumps([round(float(v), 3) for v in np.concatenate([bandas(s[:, 0]), bandas(s[:, 1])])])
                    websockets.broadcast(clientes, msg)
                cada += 1
                if cada % 100 == 0 and sink() != actual:
                    break                            # cambio de salida: reengancha
        except Exception:
            pass
        finally:
            try: p.kill()
            except ProcessLookupError: pass
        await asyncio.sleep(1)

async def conexion(ws):
    clientes.add(ws)
    try:
        await ws.wait_closed()
    finally:
        clientes.discard(ws)

async def main():
    threading.Thread(target=servir_http, daemon=True).start()
    async with websockets.serve(conexion, "127.0.0.1", WS_PORT):
        await audio(asyncio.get_running_loop())

asyncio.run(main())
