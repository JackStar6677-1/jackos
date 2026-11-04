// JackOS: esfera Jarvis fundida. Une un grafo global (todos tus proyectos), una flota Docker
// y un grafo de agentes/servicios en una sola bola. Sin etiquetas (apto para stream).
// Modo fondo: ?f=<fotograma>&fps=15&T=61.95 -> animacion determinista y periodica (bucle perfecto).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { cargarDataset, Hologram } from './holo.js';

const Q = new URLSearchParams(location.search);
const T = +(Q.get('T') || 61.95), FPS = +(Q.get('fps') || 15), WALL = Q.has('f');
const TAU = Math.PI * 2, R = 100;
const GOLD = [1, .62, .12];
const CPJ = [[1, .7, .2], [1, .45, .1], [1, .85, .4], [1, .3, .1], [.9, .6, .3], [1, .75, .05], [1, .5, .25], [.95, .9, .6]];

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setClearColor(0x000000, 1); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .85;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, 1, 1, 4000);
const composer = new EffectComposer(renderer);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .4, .3, .6);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(new OutputPass());
let W = innerWidth, H = innerHeight;
renderer.setPixelRatio(1); renderer.setSize(W, H, false); composer.setSize(W, H);
bloom.setSize(W * .5, H * .5);
camera.aspect = W / H; camera.updateProjectionMatrix();
const pxk = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));

// seeded rng para que cada render sea identico
let seed = 20261104; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false };
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.15, 'rgba(255,255,255,.55)'); g.addColorStop(.5, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

const root = new THREE.Group(); scene.add(root);
const ticks = [];   // animadores (t en [0,1) del bucle)

// ---------- 1) bola global (todos los grafos de SAORI)
const DATA = Q.get('data') || './demo/data', API = Q.get('api') || './demo/api';
const base = DATA;
const ds = await cargarDataset(base);
const holo = new Hologram(ds, { scale: R });
holo.setFrac({ node: 1, edge: 1, cross: 1, pulse: 1 });
holo.getU('uBase').set(...GOLD);
holo.getU('uCP').forEach((v, i) => v.set(...CPJ[i]));
holo.setU('uProjMix', .72); holo.setU('uCommMix', 0);
holo.setU('uEdgeA', holo.baseEdge * .55); holo.setU('uGain', holo.baseGain * .42); holo.setU('uSizeK', .22); holo.setU('uDashF', .28);
// pulsos con velocidad cuantizada a ciclos enteros por bucle
{ const s = holo.pulses.geometry.getAttribute('aS'); for (let k = 0; k < s.count; k++) s.setX(k, Math.max(1, Math.round(s.getX(k) * T)) / T); s.needsUpdate = true; }
root.add(holo.group);

// ---------- 2) anillos HUD estilo Jarvis
function arc(r, a0, a1, seg, color, op, dash) {
  const pts = []; for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const m = dash ? new THREE.LineDashedMaterial({ color, opacity: op, dashSize: dash, gapSize: dash * .7, ...additive }) : new THREE.LineBasicMaterial({ color, opacity: op, ...additive });
  const l = new THREE.Line(geo, m); if (dash) l.computeLineDistances(); return l;
}
function tickRing(r, n, len, color, op, every = 5) {
  const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, L = i % every === 0 ? len * 2 : len;
    p.push(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(a) * (r + L), 0, Math.sin(a) * (r + L)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, opacity: op, ...additive }));
}
const CY = 0x2fe0ff, AM = 0xffb000, VI = 0x9a6bff;
const rings = [
  { o: arc(R * 1.10, 0, TAU, 220, AM, .45), k: 1, tilt: [.0, 0, .0] },
  { o: arc(R * 1.22, 0, 4.2, 140, CY, .8), k: -1, tilt: [.0, 0, .0] },
  { o: arc(R * 1.34, .5, 5.5, 160, AM, .55, R * .035), k: 2, tilt: [.55, 0, .25] },
  { o: arc(R * 1.00, 0, 2.6, 90, CY, 1.0), k: -2, tilt: [1.0, 0, .6] },
  { o: arc(R * 1.46, 0, TAU, 240, VI, .5, R * .06), k: 1, tilt: [.4, 0, -.7] },
  { o: tickRing(R * 1.58, 180, R * .018, AM, .5), k: 1, tilt: [.0, 0, .0] },
  { o: arc(R * 1.74, 0, 1.4, 60, CY, .9), k: -3, tilt: [.0, 0, .0] },
  { o: arc(R * 1.74, 3.1, 4.3, 60, AM, .9), k: 2, tilt: [.0, 0, .0] },
  { o: tickRing(R * 1.9, 120, R * .014, CY, .35, 10), k: -1, tilt: [.0, 0, .0] },
];
for (const r of rings) { const h = new THREE.Group(); h.rotation.set(...r.tilt); h.add(r.o); const w = new THREE.Group(); w.add(h); root.add(w); r.w = w; }
ticks.push((t) => { for (const r of rings) r.w.rotation.y = TAU * r.k * t; });

// ---------- 3) flota Docker: puntos en una orbita, coloreados por estado, con radios hacia el nucleo
const fleet = JSON.parse(await (await fetch(`${API}/docker_list.json`)).text());
{
  const n = fleet.length, orbit = R * 1.34, P = [], C = [], L = [];
  fleet.forEach((c, i) => {
    const a = i / n * TAU, up = /^Up/.test(c.status), bad = /unhealthy|Exit/i.test(c.status);
    const col = bad ? [1, .2, .2] : up ? (/healthy/.test(c.status) ? [.2, 1, .75] : [1, .8, .3]) : [.5, .5, .6];
    P.push(Math.cos(a) * orbit, 0, Math.sin(a) * orbit); C.push(...col);
    L.push(Math.cos(a) * orbit, 0, Math.sin(a) * orbit, Math.cos(a) * R * 1.05, 0, Math.sin(a) * R * 1.05);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 7, map: glowTex, vertexColors: true, sizeAttenuation: true, ...additive }));
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2fe0ff, opacity: .22, ...additive }));
  const w = new THREE.Group(); const h = new THREE.Group(); h.rotation.set(.55, 0, .25); h.add(pts, lines, arc(orbit, 0, TAU, 200, CY, .5)); w.add(h); root.add(w);
  ticks.push((t) => { w.rotation.y = TAU * 2 * t; pts.material.size = 7 + 2 * Math.sin(TAU * 8 * t); });
}

// ---------- 4) grafo de SAORI (agentes y servicios): constelacion en una capa interior, con pulsos
const sg = JSON.parse(await (await fetch(`${API}/saori_grafo.json`)).text());
{
  const n = sg.nodes.length, shell = R * .62, P = [];
  sg.nodes.forEach((_, i) => { const y = 1 - 2 * (i + .5) / n, rr = Math.sqrt(1 - y * y), a = i * 2.399963;
    P.push(new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr).multiplyScalar(shell)); });
  const lp = []; sg.edges.forEach(([a, b]) => { if (P[a] && P[b]) lp.push(P[a].x, P[a].y, P[a].z, P[b].x, P[b].y, P[b].z); });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x9a6bff, opacity: .35, ...additive }));
  const pg = new THREE.BufferGeometry().setFromPoints(P);
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 5, map: glowTex, color: 0xc9b3ff, sizeAttenuation: true, ...additive }));
  const pulseN = 40, pe = []; for (let k = 0; k < pulseN; k++) pe.push({ e: sg.edges[Math.floor(rnd() * sg.edges.length)], c: 1 + Math.floor(rnd() * 5), ph: rnd() });
  const pp = new THREE.BufferGeometry(); const pa = new Float32Array(pulseN * 3); pp.setAttribute('position', new THREE.BufferAttribute(pa, 3));
  const pulses = new THREE.Points(pp, new THREE.PointsMaterial({ size: 6.5, map: glowTex, color: 0xffffff, sizeAttenuation: true, ...additive }));
  const w = new THREE.Group(); w.add(lines, pts, pulses); root.add(w);
  ticks.push((t) => { w.rotation.y = -TAU * t; w.rotation.x = .3 * Math.sin(TAU * t);
    pe.forEach((p, k) => { const q = (t * p.c + p.ph) % 1, A = P[p.e[0]] || P[0], B = P[p.e[1]] || P[0]; pa[3 * k] = A.x + (B.x - A.x) * q; pa[3 * k + 1] = A.y + (B.y - A.y) * q; pa[3 * k + 2] = A.z + (B.z - A.z) * q; });
    pp.attributes.position.needsUpdate = true; });
}

// ---------- 5) nucleo y polvo
const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa020, opacity: .35, ...additive })); root.add(core);
const dustN = 1600, dp = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) { const v = new THREE.Vector3(rnd() * 2 - 1, (rnd() * 2 - 1) * .8, rnd() * 2 - 1).normalize().multiplyScalar(R * (1.2 + rnd() * 1.3)); dp.set([v.x, v.y, v.z], i * 3); }
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 1.4, map: glowTex, color: 0x4fd8ff, opacity: .35, sizeAttenuation: true, ...additive })); root.add(dust);
ticks.push((t) => { core.scale.setScalar(R * (.5 + .05 * Math.sin(TAU * 4 * t))); dust.rotation.y = TAU * t; });

// ---------- animacion (todo periodico en T)
function frame(t01, camAng) {
  const t = t01 * T;
  holo.update(t, pxk);
  holo.group.rotation.y = TAU * t01;
  ticks.forEach((f) => f(t01));
  const ang = camAng ?? 0.35 * Math.sin(TAU * t01);
  camera.position.set(Math.sin(ang) * 20, 70 + 25 * Math.sin(TAU * t01 + 1), 395); camera.lookAt(0, 0, 0);
  composer.render();
}
window.renderFrame = (i) => { frame((i / (T * FPS)) % 1); return true; };
window.__listo = true;
if (!WALL) { let t0 = performance.now(); const loop = () => { frame(((performance.now() - t0) / 1000 / T) % 1); requestAnimationFrame(loop); }; loop(); }
