// Renderiza la esfera frame a frame (determinista) y lo manda a ffmpeg -> sphere.mp4
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
const [, , W = '2560', H = '1600', FPS = '15', T = '61.95', OUT = 'sphere.mp4', LIM = '0'] = process.argv;
const N = LIM > 0 ? +LIM : Math.round(+T * +FPS);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: [`--window-size=${W},${H}`, '--no-sandbox', '--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-webgl', '--disable-frame-rate-limit'] });
const p = await b.newPage(); await p.setViewport({ width: +W, height: +H, deviceScaleFactor: 1 });
p.on('pageerror', (e) => console.error('pageerror', e.message));
await p.goto(`${process.env.BASE || 'http://127.0.0.1:8765'}/esfera.html?f=0&fps=${FPS}&T=${T}`, { waitUntil: 'load' });
await p.waitForFunction('window.__listo === true', { timeout: 120000 });
console.log('gpu:', await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return g.getParameter(e.UNMASKED_RENDERER_WEBGL); }));
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', FPS, '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  await p.evaluate((i) => window.renderFrame(i), i);
  const buf = await p.screenshot({ type: 'jpeg', quality: 95, optimizeForSpeed: true });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 30 === 0) console.log(`${i}/${N} ${((Date.now() - t0) / (i + 1) / 1000).toFixed(2)} s/frame`);
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close(); console.log('listo', OUT);
