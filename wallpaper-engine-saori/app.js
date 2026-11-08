// SAORI // JARVIS NEURAL CORE - WALLPAPER ENGINE MASTER CONTROLLER
// Audio-reactive WebGL wallpaper with 134,668 nodes, 366,093 filaments & orbital HUD.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cargarDataset, Hologram } from './holo.js';

// Configuration & Themes
const THEMES = {
  jackos: {
    name: 'JackOS Blackwall',
    base: [0.49, 0.33, 0.85], // Violet
    accent: [0.85, 0.67, 0.35], // Gold
    core: [0.83, 0.0, 0.1], // Crimson
    rings: [0x7d55d9, 0xd9aa58, 0xd4001a],
    cp: [
      [0.85, 0.67, 0.35], [0.49, 0.33, 0.85], [0.83, 0.0, 0.1], [0.35, 0.85, 0.75],
      [0.95, 0.45, 0.25], [0.75, 0.55, 0.95], [1.0, 0.85, 0.4], [0.9, 0.15, 0.2]
    ]
  },
  jarvis: {
    name: 'Jarvis Classic',
    base: [0.0, 0.94, 1.0], // Cyan
    accent: [1.0, 0.82, 0.3], // Amber
    core: [0.0, 0.94, 1.0],
    rings: [0x00f0ff, 0xffd24d, 0x2fe0ff],
    cp: [
      [0.0, 0.94, 1.0], [1.0, 0.82, 0.3], [0.2, 0.7, 1.0], [0.9, 0.6, 0.2],
      [0.4, 0.9, 1.0], [1.0, 0.95, 0.6], [0.1, 0.85, 0.9], [1.0, 0.5, 0.1]
    ]
  },
  cyberpunk: {
    name: 'Cyberpunk 2077',
    base: [0.72, 0.49, 1.0], // Neon Purple
    accent: [0.96, 0.73, 0.26], // Neon Gold
    core: [1.0, 0.18, 0.55], // Hot Pink
    rings: [0xb77cff, 0xf5b942, 0xff2a85],
    cp: [
      [0.96, 0.73, 0.26], [0.72, 0.49, 1.0], [1.0, 0.18, 0.55], [0.2, 0.95, 0.85],
      [1.0, 0.5, 0.1], [0.85, 0.3, 0.95], [0.95, 0.9, 0.4], [1.0, 0.2, 0.3]
    ]
  },
  ultron: {
    name: 'Ultron Protocol',
    base: [1.0, 0.18, 0.3], // Crimson Red
    accent: [1.0, 0.52, 0.2], // Orange
    core: [1.0, 0.05, 0.1],
    rings: [0xff2e4d, 0xff8533, 0x8b0000],
    cp: [
      [1.0, 0.18, 0.3], [1.0, 0.52, 0.2], [0.8, 0.0, 0.1], [1.0, 0.7, 0.2],
      [0.9, 0.1, 0.1], [1.0, 0.4, 0.0], [0.7, 0.15, 0.25], [1.0, 0.8, 0.3]
    ]
  },
  matrix: {
    name: 'Matrix Neural',
    base: [0.13, 0.77, 0.37], // Neon Green
    accent: [0.4, 0.95, 0.6],
    core: [0.05, 0.9, 0.2],
    rings: [0x22c55e, 0x4ade80, 0x15803d],
    cp: [
      [0.13, 0.77, 0.37], [0.4, 0.95, 0.6], [0.1, 0.6, 0.2], [0.7, 1.0, 0.4],
      [0.05, 0.85, 0.3], [0.3, 0.9, 0.5], [0.85, 1.0, 0.6], [0.2, 0.7, 0.3]
    ]
  }
};

let currentTheme = THEMES.jackos;
let userSettings = {
  sensitivity: 1.2,
  bassPulse: 1.0,
  filamentGlow: 1.0,
  rotationSpeed: 1.0,
  showRings: true,
  showTelemetry: true,
  mouseInteraction: true
};

// Audio Reactive State
let rawBass = 0, rawMid = 0, rawTreble = 0;
let smoothBass = 0, smoothMid = 0, smoothTreble = 0;
let shockwaveRadius = 0, shockwaveActive = false;
let audioHistory = new Float32Array(64);
let isWallpaperEngine = false;

// Scene setup
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: 'high-performance',
  alpha: false
});
renderer.setClearColor(0x02040a, 1.0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 1, 5000);
camera.position.set(0, 30, 380);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.minDistance = 60;
controls.maxDistance = 650;
controls.enablePan = false;

// Post-Processing (Bloom)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
  0.35, // strength
  0.3,  // radius
  0.65  // threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// Resize Handler
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloomPass.setSize(w * 0.5, h * 0.5);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// Root Graph Group
const root = new THREE.Group();
scene.add(root);

// Additive Texture Helper
const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false };
const glowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

// 1. Central Plasma Star Core (Dyson Sun)
const coreGroup = new THREE.Group();
root.add(coreGroup);

const coreMat = new THREE.SpriteMaterial({
  map: glowTex,
  color: new THREE.Color(0xd4001a),
  opacity: 0.35,
  ...additive
});
const coreMesh = new THREE.Sprite(coreMat);
coreMesh.scale.set(45, 45, 1);
coreGroup.add(coreMesh);

// Coronal Glow Halo
const coronaGeo = new THREE.BufferGeometry();
const coronaCount = 200;
const coronaPos = new Float32Array(coronaCount * 3);
for (let i = 0; i < coronaCount; i++) {
  const u = Math.random(), v = Math.random();
  const theta = u * 2.0 * Math.PI, phi = Math.acos(2.0 * v - 1.0);
  const r = 16 + Math.random() * 16;
  coronaPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  coronaPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  coronaPos[i * 3 + 2] = r * Math.cos(phi);
}
coronaGeo.setAttribute('position', new THREE.BufferAttribute(coronaPos, 3));
const coronaMat = new THREE.PointsMaterial({
  size: 3.5,
  map: glowTex,
  color: new THREE.Color(0xd9aa58),
  opacity: 0.45,
  transparent: true,
  ...additive
});
const coronaPoints = new THREE.Points(coronaGeo, coronaMat);
coreGroup.add(coronaPoints);

// 2. HUD Concentric Orbital Rings
const ringsGroup = new THREE.Group();
root.add(ringsGroup);

function createArc(r, a0, a1, seg, color, op, dash = 0) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = a0 + (a1 - a0) * i / seg;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dash
    ? new THREE.LineDashedMaterial({ color, opacity: op, dashSize: dash, gapSize: dash * 0.7, ...additive })
    : new THREE.LineBasicMaterial({ color, opacity: op, ...additive });
  const line = new THREE.Line(geo, mat);
  if (dash) line.computeLineDistances();
  return line;
}

function createTickRing(r, n, len, color, op, every = 5) {
  const p = [];
  const TAU = Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU;
    const L = i % every === 0 ? len * 2.2 : len;
    p.push(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(a) * (r + L), 0, Math.sin(a) * (r + L));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, opacity: op, ...additive }));
}

const R = 100;
const ringsData = [
  { obj: createArc(R * 1.08, 0, Math.PI * 2, 220, 0xd9aa58, 0.4), speed: 0.15, tilt: [0, 0, 0] },
  { obj: createArc(R * 1.22, 0, 4.2, 140, 0x7d55d9, 0.75), speed: -0.22, tilt: [0, 0, 0] },
  { obj: createArc(R * 1.34, 0.5, 5.5, 160, 0xd4001a, 0.5, R * 0.035), speed: 0.3, tilt: [0.55, 0, 0.25] },
  { obj: createArc(R * 1.0, 0, 2.6, 90, 0x7d55d9, 0.9), speed: -0.28, tilt: [1.0, 0, 0.6] },
  { obj: createArc(R * 1.46, 0, Math.PI * 2, 240, 0xd9aa58, 0.45, R * 0.06), speed: 0.12, tilt: [0.4, 0, -0.7] },
  { obj: createTickRing(R * 1.58, 180, R * 0.018, 0xd9aa58, 0.5), speed: 0.08, tilt: [0, 0, 0] },
  { obj: createArc(R * 1.74, 0, 1.4, 60, 0x7d55d9, 0.85), speed: -0.35, tilt: [0, 0, 0] },
  { obj: createArc(R * 1.74, 3.1, 4.3, 60, 0xd4001a, 0.85), speed: 0.25, tilt: [0, 0, 0] },
  { obj: createTickRing(R * 1.9, 120, R * 0.014, 0x7d55d9, 0.35, 10), speed: -0.06, tilt: [0, 0, 0] },
];

for (const r of ringsData) {
  const holder = new THREE.Group();
  holder.rotation.set(...r.tilt);
  holder.add(r.obj);
  const wrapper = new THREE.Group();
  wrapper.add(holder);
  ringsGroup.add(wrapper);
  r.wrapper = wrapper;
}

// 3. Orbital Docker Fleet (17 Live Star Containers)
let fleetGroup = new THREE.Group();
root.add(fleetGroup);

async function initFleet() {
  try {
    const res = await fetch('./api/docker_list.json');
    const fleet = await res.json();
    const n = fleet.length;
    const orbit = R * 1.34;
    const P = [], C = [], L = [];
    const TAU = Math.PI * 2;

    fleet.forEach((c, i) => {
      const a = (i / n) * TAU;
      const up = /^Up/.test(c.status);
      const bad = /unhealthy|Exit/i.test(c.status);
      const col = bad ? [1, 0.2, 0.2] : up ? (/healthy/.test(c.status) ? [0.2, 1, 0.75] : [1, 0.8, 0.3]) : [0.5, 0.5, 0.6];
      const x = Math.cos(a) * orbit, z = Math.sin(a) * orbit;
      P.push(x, 0, z);
      C.push(...col);
      L.push(x, 0, z, Math.cos(a) * R * 1.05, 0, Math.sin(a) * R * 1.05);
    });

    const gPts = new THREE.BufferGeometry();
    gPts.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    gPts.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    const pts = new THREE.Points(gPts, new THREE.PointsMaterial({
      size: 8,
      map: glowTex,
      vertexColors: true,
      sizeAttenuation: true,
      ...additive
    }));

    const gLines = new THREE.BufferGeometry();
    gLines.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    const lines = new THREE.LineSegments(gLines, new THREE.LineBasicMaterial({
      color: 0xd9aa58,
      opacity: 0.28,
      ...additive
    }));

    fleetGroup.add(pts);
    fleetGroup.add(lines);
  } catch (err) {
    console.warn('Docker fleet info loaded fallback:', err);
  }
}
initFleet();

// 4. Load the Full 134,668 Node Neural Graph
let holoInstance = null;
async function initGraph() {
  try {
    const statusEl = document.getElementById('loading-indicator');
    if (statusEl) statusEl.textContent = 'CARGANDO 134.668 NODOS Y 366.093 FILAMENTOS...';

    const ds = await cargarDataset('./data');
    holoInstance = new Hologram(ds, { scale: R });
    holoInstance.setU('uSizeK', 0.22);
    holoInstance.setU('uGain', holoInstance.baseGain * 0.42);
    holoInstance.setU('uEdgeA', holoInstance.baseEdge * 0.55);
    holoInstance.setU('uDashF', 0.28);
    applyTheme(currentTheme);
    root.add(holoInstance.group);

    if (statusEl) {
      statusEl.style.opacity = '0';
      setTimeout(() => statusEl.remove(), 600);
    }
  } catch (err) {
    console.error('Error loading dataset:', err);
    const statusEl = document.getElementById('loading-indicator');
    if (statusEl) statusEl.textContent = 'ERROR CARGANDO DATOS: ' + err.message;
  }
}
initGraph();

// Theme Switcher
function applyTheme(theme) {
  currentTheme = theme;
  if (!holoInstance) return;

  holoInstance.getU('uBase').set(...theme.base);
  holoInstance.getU('uCoreColor').set(...theme.accent);
  holoInstance.getU('uCP').forEach((v, i) => v.set(...theme.cp[i]));

  coreMat.color.setRGB(...theme.core);
  coronaMat.color.setRGB(...theme.accent);

  ringsData.forEach((r, idx) => {
    const col = theme.rings[idx % theme.rings.length];
    if (r.obj.material) r.obj.material.color.setHex(col);
  });
}

// Wallpaper Engine Audio Hook
function onWallpaperAudio(audioArray) {
  isWallpaperEngine = true;
  // audioArray: 128 elements (0..63 left, 64..127 right)
  let b = 0, m = 0, t = 0;

  // Sub-bass & Bass: bins 0..7
  for (let i = 0; i < 8; i++) {
    b += (audioArray[i] + audioArray[i + 64]) * 0.5;
  }
  rawBass = (b / 8.0) * userSettings.sensitivity * userSettings.bassPulse;

  // Midrange (Vocals, synths): bins 8..28
  for (let i = 8; i < 28; i++) {
    m += (audioArray[i] + audioArray[i + 64]) * 0.5;
  }
  rawMid = (m / 20.0) * userSettings.sensitivity;

  // Highs / Treble: bins 28..56
  for (let i = 28; i < 56; i++) {
    t += (audioArray[i] + audioArray[i + 64]) * 0.5;
  }
  rawTreble = (t / 28.0) * userSettings.sensitivity;

  // Update HUD spectrum bar
  for (let i = 0; i < 64; i++) {
    audioHistory[i] = (audioArray[i] + audioArray[i + 64]) * 0.5;
  }
}

// Register Wallpaper Engine Hook
if (window.wallpaperRegisterAudioListener) {
  window.wallpaperRegisterAudioListener(onWallpaperAudio);
}

// Wallpaper Engine Property Listener
window.wallpaperPropertyListener = {
  applyUserProperties: function(props) {
    if (props.theme && THEMES[props.theme.value]) {
      applyTheme(THEMES[props.theme.value]);
    }
    if (props.audio_reactivity) {
      userSettings.sensitivity = props.audio_reactivity.value;
    }
    if (props.bass_pulse) {
      userSettings.bassPulse = props.bass_pulse.value;
    }
    if (props.filament_glow) {
      userSettings.filamentGlow = props.filament_glow.value;
      if (holoInstance) holoInstance.setU('uGain', holoInstance.baseGain * props.filament_glow.value);
    }
    if (props.rotation_speed) {
      userSettings.rotationSpeed = props.rotation_speed.value;
    }
    if (props.show_hud_rings) {
      userSettings.showRings = props.show_hud_rings.value;
      ringsGroup.visible = userSettings.showRings;
    }
    if (props.show_telemetry) {
      userSettings.showTelemetry = props.show_telemetry.value;
      const el = document.getElementById('hud-overlay');
      if (el) el.style.display = userSettings.showTelemetry ? 'block' : 'none';
    }
    if (props.mouse_interaction) {
      userSettings.mouseInteraction = props.mouse_interaction.value;
      controls.enabled = userSettings.mouseInteraction;
    }
    if (props.bloom_strength) {
      bloomPass.strength = props.bloom_strength.value;
    }
  }
};

// Standalone Browser Audio Fallback (Web Audio API / Simulated beats)
let fallbackAudioCtx = null;
let fallbackAnalyser = null;
let fallbackData = null;

function initFallbackAudio() {
  if (isWallpaperEngine) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      fallbackAudioCtx = new AudioCtx();
      fallbackAnalyser = fallbackAudioCtx.createAnalyser();
      fallbackAnalyser.fftSize = 128;
      fallbackData = new Uint8Array(fallbackAnalyser.frequencyBinCount);
      // Try to capture default mic or system audio if permitted
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          const src = fallbackAudioCtx.createMediaStreamSource(stream);
          src.connect(fallbackAnalyser);
        }).catch(() => {
          // Fall back to organic procedural pulsation
        });
      }
    }
  } catch (e) {}
}
window.addEventListener('click', initFallbackAudio, { once: true });

// Mouse Parallax
let mouseX = 0, mouseY = 0;
let targetRotX = 0, targetRotY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Animation Loop
const clock = new THREE.Clock();
let shockwaveTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // 1. Process Audio Signals (Smooth Exponential Filter)
  if (!isWallpaperEngine && fallbackAnalyser && fallbackData) {
    fallbackAnalyser.getByteFrequencyData(fallbackData);
    let b = 0, m = 0, t = 0;
    for (let i = 0; i < 6; i++) b += fallbackData[i] / 255;
    for (let i = 8; i < 24; i++) m += fallbackData[i] / 255;
    for (let i = 24; i < 48; i++) t += fallbackData[i] / 255;
    rawBass = (b / 6) * userSettings.sensitivity * userSettings.bassPulse;
    rawMid = (m / 16) * userSettings.sensitivity;
    rawTreble = (t / 24) * userSettings.sensitivity;
    for (let i = 0; i < 64; i++) audioHistory[i] = (fallbackData[i] || 0) / 255;
  } else if (!isWallpaperEngine && !fallbackAnalyser) {
    // Elegant procedural organic rhythm when idle in browser preview
    const bpm128 = time * (128 / 60) * Math.PI;
    const kick = Math.pow(Math.max(0, Math.sin(bpm128)), 12);
    const hihat = Math.pow(Math.max(0, Math.cos(bpm128 * 2)), 6) * 0.4;
    const synth = (Math.sin(time * 1.5) * 0.5 + 0.5) * 0.5;
    rawBass = kick * userSettings.bassPulse;
    rawMid = synth;
    rawTreble = hihat;
    for (let i = 0; i < 64; i++) {
      audioHistory[i] = Math.max(0, Math.sin(time * 2 + i * 0.2) * 0.4 + (i < 8 ? kick : 0));
    }
  }

  // Smooth filter
  smoothBass += (rawBass - smoothBass) * 0.35;
  smoothMid += (rawMid - smoothMid) * 0.25;
  smoothTreble += (rawTreble - smoothTreble) * 0.28;

  // 2. Beat Drop Shockwave Trigger
  if (rawBass - smoothBass > 0.45 && !shockwaveActive) {
    shockwaveActive = true;
    shockwaveRadius = 20;
    // Camera kick vibration
    camera.position.z += 2.5;
  }

  if (shockwaveActive) {
    shockwaveRadius += delta * 240;
    if (shockwaveRadius > R * 2.2) {
      shockwaveActive = false;
      shockwaveRadius = 0;
    }
  }

  // 3. Audio Reactivity on Central Core
  const coreScale = 1.0 + smoothBass * 0.45;
  coreGroup.scale.set(coreScale, coreScale, coreScale);
  coreGroup.rotation.y = time * 0.35 * userSettings.rotationSpeed;
  coreGroup.rotation.z = time * 0.15 * userSettings.rotationSpeed;

  // 4. Audio Reactivity on Orbital Rings
  const ringSpeedBoost = 1.0 + smoothMid * 2.2;
  ringsData.forEach((r) => {
    r.wrapper.rotation.y += r.speed * delta * ringSpeedBoost * userSettings.rotationSpeed;
  });
  ringsGroup.rotation.x = Math.sin(time * 0.15) * 0.1;

  // 5. Audio Reactivity on Docker Fleet
  fleetGroup.rotation.y = time * 0.18 * userSettings.rotationSpeed;

  // 6. Update Graph Hologram Uniforms
  if (holoInstance) {
    holoInstance.setU('uTime', time);
    holoInstance.updateAudio(smoothBass, smoothMid, smoothTreble, shockwaveRadius);
    holoInstance.group.rotation.y = time * 0.08 * userSettings.rotationSpeed;
  }

  // 7. Mouse Parallax (Gentle floating response)
  if (userSettings.mouseInteraction) {
    targetRotY = mouseX * 0.2;
    targetRotX = -mouseY * 0.15;
    root.rotation.y += (targetRotY - root.rotation.y) * 0.05;
    root.rotation.x += (targetRotX - root.rotation.x) * 0.05;
    controls.update();
  }

  // Camera relaxation back to nominal distance
  camera.position.z += (380 - camera.position.z) * 0.08;

  // Render
  composer.render();

  // Draw 2D HUD Overlays (Clock, Spectrum, Node Count)
  renderHud();
}

// 2D HUD Canvas
const hudCanvas = document.getElementById('hud-canvas');
const hudCtx = hudCanvas ? hudCanvas.getContext('2d') : null;

function renderHud() {
  if (!hudCtx || !userSettings.showTelemetry) return;
  hudCanvas.width = window.innerWidth;
  hudCanvas.height = window.innerHeight;
  const w = hudCanvas.width, h = hudCanvas.height;

  hudCtx.clearRect(0, 0, w, h);

  // Bottom Audio Spectrum Equalizer
  const barCount = 48;
  const barWidth = 4;
  const gap = 3;
  const startX = (w - (barCount * (barWidth + gap))) / 2;
  const bottomY = h - 28;

  for (let i = 0; i < barCount; i++) {
    const val = audioHistory[i] || 0;
    const barHeight = Math.max(3, val * 38);
    hudCtx.fillStyle = i < 8
      ? `rgba(217, 170, 88, ${0.4 + val * 0.6})`
      : `rgba(125, 85, 217, ${0.4 + val * 0.6})`;
    hudCtx.fillRect(startX + i * (barWidth + gap), bottomY - barHeight, barWidth, barHeight);
  }

  // HUD Top Status
  hudCtx.font = '11px "DM Mono", monospace';
  hudCtx.fillStyle = 'rgba(125, 85, 217, 0.85)';
  hudCtx.fillText('SAORI // JARVIS NEURAL CORE · AUDIO REACTIVE', 28, 36);

  hudCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  hudCtx.fillText('NODOS 134.668 · ARISTAS 366.093 · FLEET 17 ON', 28, 54);

  // Digital Clock UTC-3
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + ' UTC-3';
  hudCtx.fillStyle = 'rgba(217, 170, 88, 0.9)';
  hudCtx.fillText(timeStr, w - 130, 36);
}

// Start Loop
animate();
