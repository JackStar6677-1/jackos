#!/usr/bin/env python3
"""JackOS: superpone grafos vivos (pulsos de energia recorriendo aristas) sobre un video de fondo.
Sin etiquetas a proposito: el fondo se puede mostrar en stream sin filtrar nombres.
Entrada de grafo: JSON {"nodes":[{"c":comunidad}...], "links":[[a,b],...]}.
Uso: python3 grafos_vivos.py --base fondo.mp4 --grande grafo_grande.json [--chico grafo_chico.json] --out salida.mp4
Necesita: pillow, numpy y ffmpeg."""
import argparse, json, math, random, subprocess
import numpy as np
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument("--base", required=True)
ap.add_argument("--grande", required=True)
ap.add_argument("--chico")
ap.add_argument("--out", required=True)
ap.add_argument("--size", default="2560x1600")
ap.add_argument("--secs", type=float, default=0, help="limitar duracion (0 = todo el video base)")
ap.add_argument("--fps", type=int, default=15)
ap.add_argument("--oscurecer", type=float, default=0.38, help="brillo del video base (0-1)")
ap.add_argument("--max-nodos", type=int, default=650, help="solo los nodos mas conectados del grafo grande")
ap.add_argument("--frame", type=int, default=-1, help="solo guardar el PNG de ese fotograma y salir")
a = ap.parse_args()
W, H = map(int, a.size.lower().split("x"))
S = W / 2560
VIOLETA, DORADO, ROJO = (125, 85, 217), (217, 170, 88), (212, 0, 26)

def dur(p):
    o = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout
    return float(o.strip())
DUR = a.secs or dur(a.base)
FPS = a.fps
N = int(DUR * FPS)

def layout(n, links, iters=120, seed=3):
    rng = np.random.default_rng(seed)
    p = rng.random((n, 2)) * 2 - 1
    e = np.array(links, dtype=np.int64)
    k = math.sqrt(4.0 / n)
    for it in range(iters):
        disp = np.zeros_like(p)
        for i in range(0, n, 400):
            d = p[i:i + 400, None, :] - p[None, :, :]
            dist2 = (d ** 2).sum(-1) + 1e-4
            disp[i:i + 400] += (d / dist2[..., None] * (k * k)).sum(1)
        d = p[e[:, 0]] - p[e[:, 1]]
        dist = np.sqrt((d ** 2).sum(-1) + 1e-6)[:, None]
        f = d * dist / k
        np.add.at(disp, e[:, 0], -f); np.add.at(disp, e[:, 1], f)
        ln = np.sqrt((disp ** 2).sum(-1) + 1e-9)[:, None]
        p += disp / ln * np.minimum(ln, 0.1 * (1 - it / iters) + 0.003)
    p -= np.median(p, axis=0)
    r = np.percentile(np.abs(p), 96)
    return np.clip(p / r, -1.2, 1.2)

def principal(d, tope):
    """Se queda con los nodos mas conectados y la componente mayor, renumerados."""
    n = len(d["nodes"]); grado = np.zeros(n, int)
    for u, v in d["links"]:
        grado[u] += 1; grado[v] += 1
    keep = set(np.argsort(-grado)[:tope].tolist()) if n > tope else set(range(n))
    padre = {i: i for i in keep}
    def raiz(x):
        while padre[x] != x:
            padre[x] = padre[padre[x]]; x = padre[x]
        return x
    ar = [(u, v) for u, v in d["links"] if u in keep and v in keep and u != v]
    for u, v in ar:
        padre[raiz(u)] = raiz(v)
    cuenta = {}
    for i in keep:
        cuenta[raiz(i)] = cuenta.get(raiz(i), 0) + 1
    mayor = max(cuenta, key=cuenta.get)
    ids = {i: k for k, i in enumerate(i for i in sorted(keep) if raiz(i) == mayor)}
    return {"nodes": [d["nodes"][i] for i in ids], "links": [[ids[u], ids[v]] for u, v in ar if u in ids and v in ids]}

def cargar(path, box, seed, tope=10**9):
    d = principal(json.load(open(path)), tope)
    links = d["links"]
    p = layout(len(d["nodes"]), links, iters=220, seed=seed)
    x0, y0, x1, y1 = [v * s for v, s in zip(box, (W, H, W, H))]
    pts = np.stack([x0 + (p[:, 0] + 1.2) / 2.4 * (x1 - x0), y0 + (p[:, 1] + 1.2) / 2.4 * (y1 - y0)], 1)
    return pts, links, [n.get("c", 0) for n in d["nodes"]]

G = [cargar(a.grande, (0.03, 0.04, 0.80, 0.88), 3, a.max_nodos)]
G[0] = G[0] + ((110, 85, 200), 0.55, 2.2 * S, 40)      # color, alpha base de aristas, radio de nodo, pulsos
if a.chico:
    c = cargar(a.chico, (0.62, 0.12, 0.96, 0.72), 7)
    G.append(c + (DORADO, 0.8, 4.0 * S, 12))

# capa estatica: aristas y nodos tenues
est = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(est, "RGBA")
for pts, links, com, col, al, rad, _ in G:
    for u, v in links:
        d.line([tuple(pts[u]), tuple(pts[v])], fill=col + (int(255 * al * .35),), width=max(1, int(S)))
    for i, (x, y) in enumerate(pts):
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=col + (int(255 * min(1, al + .25)),))
base_arr = np.asarray(est)

# pulsos: cada uno recorre una arista en un ciclo entero de la duracion
rnd = random.Random(11)
pulsos = []
for gi, (pts, links, com, col, al, rad, npul) in enumerate(G):
    for _ in range(npul * 4):
        u, v = rnd.choice(links)
        pulsos.append((gi, u, v, rnd.randint(2, 6), rnd.random(), rnd.random() < .12))
latidos = [(gi, i, rnd.random()) for gi, g in enumerate(G) for i in rnd.sample(range(len(g[0])), min(len(g[0]), 160 if gi == 0 else 20))]

def fotograma(f):
    t = f / N
    im = est.copy(); d = ImageDraw.Draw(im, "RGBA")
    for gi, i, ph in latidos:
        x, y = G[gi][0][i]
        a_ = .5 + .5 * math.sin(2 * math.pi * (t * 8 + ph))
        r = G[gi][5] * (1.6 + 1.6 * a_); col = DORADO if gi else VIOLETA
        d.ellipse([x - r, y - r, x + r, y + r], fill=col + (int(60 + 150 * a_),))
    for gi, u, v, ciclos, ph, rojo in pulsos:
        pts = G[gi][0]; q = (t * ciclos + ph) % 1
        (x0, y0), (x1, y1) = pts[u], pts[v]
        x, y = x0 + (x1 - x0) * q, y0 + (y1 - y0) * q
        col = ROJO if rojo else DORADO if gi == 0 else (255, 235, 190)
        r = (2.4 if gi == 0 else 4.0) * S
        d.ellipse([x - r * 2.4, y - r * 2.4, x + r * 2.4, y + r * 2.4], fill=col + (50,))
        d.ellipse([x - r, y - r, x + r, y + r], fill=col + (230,))
    return im

if a.frame >= 0:
    fotograma(a.frame).save("grafos_frame.png"); print("frame guardado"); raise SystemExit

ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-i", a.base, "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                       "-filter_complex", f"[0:v]fps={FPS},scale={W}:{H},lutrgb=r=val*{a.oscurecer}:g=val*{a.oscurecer}:b=val*{a.oscurecer*1.15}[b];[b][1:v]overlay=shortest=1:format=auto",
                       "-t", str(DUR), "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", a.out],
                      stdin=subprocess.PIPE)
for f in range(N):
    ff.stdin.write(fotograma(f).tobytes())
    if f % (FPS * 10) == 0: print(f"{f}/{N}", flush=True)
ff.stdin.close(); ff.wait(); print("listo ->", a.out)
