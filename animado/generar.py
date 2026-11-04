#!/usr/bin/env python3
"""JackOS: genera un bucle de fondo animado (pulso, barrido, energia por las grietas, datos, glitch).
Basado en el generador de Blackwall-Kubuntu (Nixcobt), adaptado a la paleta JackOS.
Uso: python3 generar.py [--base imagen.png] [--out salida.mp4] [--secs 10] [--fps 30] [--size 1920x1080]
Necesita: pillow, numpy y ffmpeg."""
import argparse, math, os, random, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument("--base", default=os.path.join(AQUI, "..", "sddm", "jackos-sovereign", "background.png"))
ap.add_argument("--out", default=os.path.join(AQUI, "jackos-animado.mp4"))
ap.add_argument("--secs", type=int, default=10)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--size", default="1920x1080")
a = ap.parse_args()
W, H = map(int, a.size.lower().split("x"))
FPS, SECS = a.fps, a.secs
N = FPS * SECS
base = np.asarray(Image.open(a.base).convert("RGB").resize((W, H))).astype(np.int16)

# Paleta JackOS (RGB)
VIOLETA, DORADO, ROJO = (125, 85, 217), (217, 170, 88), (212, 0, 26)
GLOW = np.array([70, 40, 150], np.float32)      # resplandor violeta
BARRIDO = np.array([150, 110, 60], np.float32)  # barrido dorado

random.seed(77)
cx, cy = W / 2, H / 2
cracks = []
for _ in range(30):
    ang = random.uniform(0, 2 * math.pi); x, y = cx, cy; pts = [(x, y)]
    for _ in range(random.randint(5, 10)):
        ang += random.uniform(-.55, .55); L = random.uniform(60, 180) * W / 1920
        x += math.cos(ang) * L; y += math.sin(ang) * L; pts.append((x, y))
    cum = [0.0]
    for p, q in zip(pts, pts[1:]):
        cum.append(cum[-1] + math.hypot(q[0] - p[0], q[1] - p[1]))
    cracks.append((pts, cum))

def punto(c, u):
    pts, cum = c
    d = max(0.0, min(1.0, u)) * cum[-1]
    for i in range(1, len(cum)):
        if d <= cum[i]:
            t = (d - cum[i - 1]) / max(cum[i] - cum[i - 1], 1e-6)
            return (pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
                    pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t)
    return pts[-1]

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.sqrt(((xx - cx) / (W * .55)) ** 2 + ((yy - cy) / (H * .6)) ** 2)
glow = (np.clip(1 - r, 0, 1)[..., None] ** 2 * GLOW).astype(np.float32)
del xx, yy, r

random.seed(5)
fuente = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
mono = ImageFont.truetype(fuente, max(10, W // 150))
cols = [(random.randint(20, W - 20), random.randint(0, H), random.choice([1, 1, 2]),
         [random.choice("01ABCDEF") for _ in range(random.randint(8, 18))]) for _ in range(22)]
SPAN = H + 400
rafagas = {int(N * k) for k in (.12, .13, .37, .38, .6, .61, .82)}
rafagas |= {x + 1 for x in rafagas}

ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                       "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                       "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", a.out], stdin=subprocess.PIPE)
yrow = np.arange(H, dtype=np.float32)

for f in range(N):
    t = f / N
    fr = base.astype(np.float32)
    fr += glow * (0.30 + 0.28 * math.sin(2 * math.pi * 4 * t))
    ys = ((t * 2) % 1) * (H + 200) - 100
    band = np.exp(-((yrow - ys) / 18.0) ** 2)
    fr += band[:, None, None] * BARRIDO

    ov = Image.new("RGB", (W, H), (0, 0, 0)); d = ImageDraw.Draw(ov)
    for i, c in enumerate(cracks):
        pos = -0.18 + 1.36 * ((t * 3 + i * 0.137) % 1)
        puntos = [punto(c, pos - 0.18 + 0.18 * k / 10) for k in range(11)]
        d.line(puntos, fill=DORADO if i % 5 == 0 else VIOLETA, width=2)
    for x, y0, k, chars in cols:
        by = (y0 + t * SPAN * k) % SPAN - 200
        for j, ch in enumerate(chars):
            d.text((x, by + j * 17), ch, font=mono, fill=(90, 62, 150))
    small = ov.resize((W // 4, H // 4)).filter(ImageFilter.GaussianBlur(2)).resize((W, H))
    fr += np.asarray(ov, np.float32) + np.asarray(small, np.float32) * 1.4

    if f in rafagas:  # glitch con desplazamiento cromatico; el rojo Blackwall solo aqui
        rr = random.Random(f * 977)
        fr *= 1.12
        for _ in range(rr.randint(6, 10)):
            y = rr.randint(0, H - 50); h = rr.randint(6, 46); dx = rr.choice([-1, 1]) * rr.randint(30, 140)
            tira = fr[y:y + h].copy()
            fr[y:y + h] = np.roll(tira, dx, axis=1)
            fr[y:y + h, :, 0] = np.roll(tira[:, :, 0], dx + 14, axis=1)
            fr[y:y + h, :, 2] = np.roll(tira[:, :, 2], dx - 10, axis=1)
            if rr.random() < 0.5:
                x = rr.randint(0, max(1, W - 400))
                fr[y:y + 2, x:x + rr.randint(80, 400)] += np.array(ROJO, np.float32) * .7

    ff.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
    if f % FPS == 0:
        print(f"{f}/{N}", flush=True)
ff.stdin.close(); ff.wait()
print("listo ->", a.out)
