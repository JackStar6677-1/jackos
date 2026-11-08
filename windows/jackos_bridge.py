#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JackOS Sovereign Bridge for Windows.
Proxies localhost:8096 -> 100.114.161.74:8096 (Star VPS).
Grants full Secure Context for Microphone / Web Speech STT in Brave & Chrome.
Can launch the JARVIS / SAORI console in standalone HUD app mode.
"""

import sys
import os
import time
import socket
import threading
import subprocess
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

LOCAL_PORT = 8096
REMOTE_HOST = "100.114.161.74"
REMOTE_PORT = 8096
REMOTE_BASE = f"http://{REMOTE_HOST}:{REMOTE_PORT}"

BRAVE_PATHS = [
    os.path.expandvars(r"%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe"),
    os.path.expandvars(r"%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"),
    os.path.expandvars(r"%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe"),
    os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
    os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
]

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class ProxyHandler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, format, *args):
        # Keep console clean; log only chat or wake
        if '/chat' in self.path or '/wake' in self.path:
            sys.stdout.write(f"[JackOS Bridge] {self.command} {self.path} -> {args[0] if args else ''}\n")
            sys.stdout.flush()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_HEAD(self):
        self._proxy('HEAD')

    def do_GET(self):
        self._proxy('GET')

    def do_POST(self):
        self._proxy('POST')

    def _proxy(self, method):
        target_url = f"{REMOTE_BASE}{self.path}"
        req_body = None
        if method == 'POST':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                req_body = self.rfile.read(content_length)

        headers = {}
        for key in self.headers:
            if key.lower() not in ('host', 'content-length', 'connection'):
                headers[key] = self.headers[key]

        req = urllib.request.Request(target_url, data=req_body, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read() if method != 'HEAD' else b''
                self.send_response(resp.status)
                for k, v in resp.getheaders():
                    if k.lower() not in ('transfer-encoding', 'connection', 'content-length'):
                        self.send_header(k, v)
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                if method != 'HEAD' and data:
                    self.wfile.write(data)
        except urllib.error.HTTPError as he:
            err_data = he.read()
            self.send_response(he.code)
            for k, v in he.headers.items():
                if k.lower() not in ('transfer-encoding', 'connection', 'content-length'):
                    self.send_header(k, v)
            self.send_header('Content-Length', str(len(err_data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(err_data)
        except Exception as e:
            err_json = f'{{"ok": false, "error": "Star VPS bridge error: {str(e)}"}}'.encode('utf-8')
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(err_json)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(err_json)

def find_browser():
    for p in BRAVE_PATHS:
        if os.path.exists(p):
            return p
    return None

def launch_hud_window():
    browser = find_browser()
    target = f"http://localhost:{LOCAL_PORT}/jarvis.html"
    if browser:
        print(f"[JackOS] Lanzando HUD en modo aplicación con: {browser}")
        subprocess.Popen([browser, f"--app={target}", "--window-size=1920,1080"])
    else:
        import webbrowser
        print(f"[JackOS] Abriendo en navegador predeterminado: {target}")
        webbrowser.open(target)

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def delayed_launch():
    time.sleep(1.2)
    launch_hud_window()

def main():
    print("=" * 60)
    print(" 🔮 JACKOS // BLACKWALL SOVEREIGN BRIDGE (WINDOWS)")
    print(f" Mapeo: http://localhost:{LOCAL_PORT} -> {REMOTE_BASE}")
    print(" Modo: Origen de Confianza (Secure Context) para Micrófono/STT")
    print("=" * 60)

    if "--no-browser" not in sys.argv:
        threading.Thread(target=delayed_launch, daemon=True).start()

    if not is_port_in_use(LOCAL_PORT):
        server = ThreadedHTTPServer(('127.0.0.1', LOCAL_PORT), ProxyHandler)
        print(f"[✓] Servidor puente activo y escuchando en http://127.0.0.1:{LOCAL_PORT}")
        print("[i] Presiona Ctrl+C para finalizar el puente JackOS.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Cerrando puente JackOS.")
            server.server_close()
    else:
        print(f"[!] Puerto {LOCAL_PORT} ya en escucha. Presiona Ctrl+C para salir.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
