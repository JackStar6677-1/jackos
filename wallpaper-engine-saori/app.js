// SAORI // JARVIS NEURAL CORE - AUDIO REACTIVE DESKTOP ENGINE v3.8
// Features: Three.js WebGL2 + 134k Points + Auroralis Sky Dome Shader (Auroralis-Next) + Cyber Grid Floor + Gyroscopic 3D Rings + Circular Equalizer + ASCII Rain + Braille Waveform + Media Widget + Blackwall Anomalies
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { cargarDataset, Hologram } from './holo.js';

// Themes Palette
const THEMES = {
  saori_universe: {
    name: 'SAORI Multiverse',
    base: [0.49, 0.33, 0.85],
    accent: [0.0, 0.94, 1.0],
    core: [1.0, 0.82, 0.3],
    rings: [0x7d55d9, 0x00f0ff, 0xffd24d, 0xff2a85],
    cp: [
      [0.49, 0.33, 0.85], [0.0, 0.94, 1.0], [1.0, 0.82, 0.3], [1.0, 0.18, 0.55],
      [0.2, 0.95, 0.85], [0.95, 0.45, 0.25], [0.75, 0.55, 0.95], [0.1, 0.85, 0.9]
    ]
  },
  capricorn: {
    name: 'Project Capricorn',
    base: [1.0, 0.0, 0.22],
    accent: [0.0, 1.0, 0.40],
    core: [0.70, 0.0, 1.0],
    rings: [0xff0038, 0x00ff66, 0xb000ff, 0x00f0ff],
    cp: [
      [1.0, 0.0, 0.22], [0.0, 1.0, 0.40], [0.70, 0.0, 1.0], [0.0, 0.94, 1.0],
      [1.0, 0.85, 0.0], [1.0, 0.0, 0.50], [0.1, 1.0, 0.7], [1.0, 1.0, 1.0]
    ]
  },
  jackos: {
    name: 'JackOS Blackwall',
    base: [0.49, 0.33, 0.85],
    accent: [0.85, 0.67, 0.35],
    core: [0.83, 0.0, 0.1],
    rings: [0xd9aa58, 0x7d55d9, 0xd4001a],
    cp: [
      [0.85, 0.67, 0.35], [0.49, 0.33, 0.85], [0.83, 0.0, 0.1], [0.35, 0.85, 0.75],
      [0.95, 0.45, 0.25], [0.75, 0.55, 0.95], [1.0, 0.85, 0.4], [0.9, 0.15, 0.2]
    ]
  },
  jarvis: {
    name: 'Jarvis Classic',
    base: [0.0, 0.94, 1.0],
    accent: [1.0, 0.82, 0.3],
    core: [0.0, 0.94, 1.0],
    rings: [0x00f0ff, 0xffd24d, 0x2fe0ff],
    cp: [
      [0.0, 0.94, 1.0], [1.0, 0.82, 0.3], [0.2, 0.7, 1.0], [0.9, 0.6, 0.2],
      [0.4, 0.9, 1.0], [1.0, 0.95, 0.6], [0.1, 0.85, 0.9], [1.0, 0.5, 0.1]
    ]
  },
  cyberpunk: {
    name: 'Cyberpunk 2077',
    base: [0.72, 0.49, 1.0],
    accent: [0.96, 0.73, 0.26],
    core: [1.0, 0.18, 0.55],
    rings: [0xb77cff, 0xf5b942, 0xff2a85],
    cp: [
      [0.96, 0.73, 0.26], [0.72, 0.49, 1.0], [1.0, 0.18, 0.55], [0.2, 0.95, 0.85],
      [1.0, 0.5, 0.1], [0.85, 0.3, 0.95], [0.95, 0.9, 0.4], [1.0, 0.2, 0.3]
    ]
  },
  ultron: {
    name: 'Ultron Rogue Overdrive',
    base: [0.95, 0.05, 0.12],
    accent: [1.0, 0.42, 0.0],
    core: [1.0, 0.02, 0.02],
    rings: [0xff1a1a, 0xff7700, 0x8b0000, 0xff3b30],
    cp: [
      [0.95, 0.05, 0.12], [1.0, 0.42, 0.0], [1.0, 0.02, 0.02], [1.0, 0.7, 0.2],
      [0.9, 0.1, 0.1], [1.0, 0.4, 0.0], [0.7, 0.15, 0.25], [1.0, 0.8, 0.3]
    ]
  },
  matrix: {
    name: 'Matrix Neural',
    base: [0.13, 0.77, 0.37],
    accent: [0.4, 0.95, 0.6],
    core: [0.05, 0.9, 0.2],
    rings: [0x22c55e, 0x4ade80, 0x15803d],
    cp: [
      [0.13, 0.77, 0.37], [0.4, 0.95, 0.6], [0.1, 0.6, 0.2], [0.7, 1.0, 0.4],
      [0.05, 0.85, 0.3], [0.3, 0.9, 0.5], [0.85, 1.0, 0.6], [0.2, 0.7, 0.3]
    ]
  }
};

let currentTheme = THEMES.saori_universe;
let userSettings = {
  sensitivity: 2.8,   // High-impact sensitivity default
  bassPulse: 2.4,     // High-impact bass drop punch
  filamentGlow: 1.25,
  bloomStrength: 0.42,
  rotationSpeed: 1.0,
  aiAggression: 'auto', // 'auto' (dynamic spikes on kicks), 'always' (hostile rogue overdrive), 'calm' (stable)
  showTerminal: true,
  showTelemetry: true,
  showMediaWidget: true,
  showSystemDeck: true,
  showOscilloscope: true,
  showAsciiPanel: true,
  showCodeRain: true,
  showCyberGrid: true,
  showAuroraSky: true,
  showCircularEq: true,
  blackwallFx: true,
  starfieldBg: true,
  showRings: true,
  mouseInteraction: true,
  fpsLimit: 60
};

// Frame Pacing & Performance Engine
let targetFps = 60;
let fpsInterval = 1000 / targetFps;
let lastFrameTime = performance.now();
let isWindowHidden = document.hidden;

document.addEventListener('visibilitychange', () => {
  isWindowHidden = document.hidden;
});

// Audio Reactive & AI Rage State
let rawBass = 0, rawMid = 0, rawTreble = 0;
let smoothBass = 0, smoothMid = 0, smoothTreble = 0;
let rageLevel = 0.0;
let spikeIntensity = 0.0;
let shockwaveRadius = 0, shockwaveActive = false;
let audioHistory = new Float32Array(64);
let peakCaps = new Float32Array(64);
let peakDecay = new Float32Array(64);
let isWallpaperEngine = false;
let lastAudioPacketTime = 0;
let lastBeatTime = 0;
let glitchTimer = 0;
let blackwallAnomalyTimer = 0;
let nextAnomalyCountdown = 14;

// Media Player (Now Playing) State
let mediaState = {
  title: '',
  artist: '',
  albumTitle: '',
  thumbnail: null,
  thumbnailImg: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  lastUpdate: 0
};

// Scene & Canvas Setup
const canvas = document.getElementById('gl');
const hudCanvas = document.getElementById('hud-canvas');
const hudCtx = hudCanvas ? hudCanvas.getContext('2d') : null;

// Camera Distance State
let targetCamDist = 380;
const MIN_CAM_DIST = 14.0;
const MAX_CAM_DIST = 720.0;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: 'high-performance',
  alpha: false
});
renderer.setClearColor(0x02040a, 1.0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02040a, 0.00075); // Atmospheric depth fog

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.5, 8000);
camera.position.set(0, 14, 380);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 1.2;
controls.minDistance = 2.0;  // Allows zooming all the way inside the Dyson core!
controls.maxDistance = 850;
controls.enablePan = false;

// Post-Processing (UnrealBloom)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
  0.26, // strength (Crisp neural spark glow, eliminates blown-out sun effect)
  0.30, // radius
  0.72  // threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// Resize & Mobile Framing Handler
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  const isPortrait = w < h;

  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloomPass.setSize(w * 0.5, h * 0.5);
  camera.aspect = w / h;

  // Frame sphere dynamically for mobile portrait vs widescreen desktop
  if (isPortrait) {
    const dist = Math.max(480, 240 / (w / h));
    camera.position.set(0, 0, dist);
    controls.minDistance = 30;
    controls.maxDistance = dist * 2.2;
  } else {
    if (camera.position.z > 450) camera.position.set(0, 0, 360);
    controls.minDistance = 20;
    controls.maxDistance = 850;
  }
  camera.updateProjectionMatrix();

  if (hudCanvas) {
    hudCanvas.width = w;
    hudCanvas.height = h;
  }
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

// ============================================================
// 1. AURORALIS SKY DOME & CYBER HORIZON ENGINE
// Ported from Jack's Auroralis-Next (aurora.glsl & end_sky.glsl)
// ============================================================
const skyGeo = new THREE.SphereGeometry(3200, 48, 24);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  depthTest: false,
  uniforms: {
    uTime: { value: 0 },
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioTreble: { value: 0 },
    uBaseColor: { value: new THREE.Color(0x492185) },
    uAccentColor: { value: new THREE.Color(0xd9aa58) },
    uCoreColor: { value: new THREE.Color(0xd4001a) }
  },
  vertexShader: /* glsl */`
    varying vec3 vWorldPos;
    varying vec3 vRayDir;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      vRayDir = normalize(position);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */`
    precision highp float;
    varying vec3 vWorldPos;
    varying vec3 vRayDir;
    uniform float uTime;
    uniform float uAudioBass;
    uniform float uAudioMid;
    uniform float uAudioTreble;
    uniform vec3 uBaseColor;
    uniform vec3 uAccentColor;
    uniform vec3 uCoreColor;

    // Procedural noise functions from Jack's Auroralis-Next
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.55;
      for (int i = 0; i < 3; i++) {
        v += a * noise(p);
        p = p * 2.05 + vec2(0.13, 0.29);
        a *= 0.5;
      }
      return v;
    }

    // Dancing Reactive Auroralis Curtains (Confined to upper celestial dome)
    vec3 drawAuroralisCurtains(vec3 rayDir, float time, float bass, float mid, float treble) {
      float h = rayDir.y;
      if (h < 0.08) return vec3(0.0);

      vec2 p = rayDir.xz / (h + 0.22);
      float t = time * 0.075;

      // Audio reactive domain distortion wave
      float audioWave = sin(length(p) * 0.20 - time * 2.2 + bass * 2.0) * 0.40;
      float warp = fbm(p * 0.14 + vec2(t * 0.45, -0.35 * t) + audioWave) * 2.0 - 1.0;
      
      float ribbon1 = sin(p.x * 0.70 + warp * 2.2 + t * 1.6);
      float ribbon2 = cos(p.y * 0.50 - warp * 1.8 - t * 1.3);
      float ribbon = pow(abs(ribbon1 * ribbon2), 2.4);

      // Dancing striations/chits
      float rayNoise = noise(vec2(p.x * 3.8 + warp * 1.4, t * 4.5 + treble * 2.2));
      float striations = 0.5 + 0.5 * sin(p.x * 14.0 + warp * 4.5 + time * 1.8) * rayNoise;

      // Height envelope: peaks at mid-dome, falls off before zenith and horizon
      float heightFade = smoothstep(0.08, 0.26, h) * (1.0 - smoothstep(0.55, 0.90, h));

      // Multi-spectral Aurora: Emerald Green, Quantum Cyan, Violet Plasma
      vec3 emerald = vec3(0.05, 0.95, 0.45);
      vec3 cyan = vec3(0.0, 0.88, 1.0);
      vec3 violet = vec3(0.72, 0.20, 0.95);
      
      float mixT = sin(p.x * 0.35 + time * 0.25) * 0.5 + 0.5;
      vec3 curCol = mix(mix(emerald, cyan, mixT), violet, striations * 0.55);
      curCol = mix(curCol, uAccentColor, 0.30);

      float reactiveGain = (0.40 + bass * 0.55 + mid * 0.40 + treble * 0.30);
      return curCol * ribbon * (0.5 + striations * 0.75) * heightFade * reactiveGain;
    }

    // Swirling Nebula & Data Clouds (Nubes de datos cósmicas)
    vec3 drawDataClouds(vec3 rayDir, float time, float bass, float mid) {
      float h = rayDir.y;
      if (h < 0.10) return vec3(0.0);

      vec2 uv = rayDir.xz / (h + 0.45);
      float t = time * 0.022;

      float n1 = fbm(uv * 0.50 + vec2(t * 0.35, t * 0.18));
      float n2 = fbm(uv * 1.05 - vec2(t * 0.25, -t * 0.42) + n1);
      float cloudDensity = smoothstep(0.38, 0.78, n2) * (0.22 + bass * 0.18);

      // Interstellar dark dust veins
      float darkVein = smoothstep(0.46, 0.54, n1);
      cloudDensity *= (0.45 + 0.55 * darkVein);

      float fade = smoothstep(0.10, 0.32, h) * (1.0 - smoothstep(0.68, 0.95, h));
      vec3 cloudCol = mix(uBaseColor * 0.5, vec3(0.08, 0.45, 0.85), n2);
      cloudCol = mix(cloudCol, uCoreColor * 0.4, n1 * 0.4);

      return cloudCol * cloudDensity * fade;
    }

    void main() {
      vec3 rayDir = normalize(vRayDir);
      float h = rayDir.y;

      // 1. Deep Space Obsidian Black Void (No bright wash-out!)
      vec3 voidColor = vec3(0.003, 0.004, 0.009);
      vec3 zenithColor = mix(voidColor, uBaseColor * 0.08, smoothstep(0.0, 1.0, max(0.0, h)));

      // 2. Distant Horizon Glow (Tight, subtle, cybernetic - NOT a bright beam!)
      float horizonFactor = exp(-abs(h) * 55.0);
      vec3 horizonGlow = mix(uAccentColor, uBaseColor, 0.5) * horizonFactor * (0.16 + uAudioBass * 0.14);

      // Deep ground void
      float groundFade = smoothstep(0.0, -0.4, h);
      vec3 groundColor = mix(voidColor, uBaseColor * 0.04, 0.5);
      vec3 sky = mix(zenithColor, groundColor, groundFade) + horizonGlow;

      // 3. Ethereal Reactive Auroras in Upper Sky
      vec3 aurora = drawAuroralisCurtains(rayDir, uTime, uAudioBass, uAudioMid, uAudioTreble);
      sky += aurora;

      // 4. Volumetric Nebula & Data Clouds
      vec3 clouds = drawDataClouds(rayDir, uTime, uAudioBass, uAudioMid);
      sky += clouds;

      // 5. Crisp Neon Horizon Grid Boundary
      float lineDist = abs(h);
      if (lineDist < 0.004) {
        float lineIntensity = (1.0 - lineDist / 0.004) * (0.45 + uAudioBass * 0.50);
        sky += uAccentColor * lineIntensity * 0.6;
      }

      gl_FragColor = vec4(sky, 1.0);
    }
  `
});
const skyMesh = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyMesh);

// 2. 3D Reactive Undulating Cyber Grid Floor (GPU Vertex Shader Accelerated)
const gridGeo = new THREE.PlaneGeometry(3400, 3400, 42, 42);
gridGeo.rotateX(-Math.PI / 2);
const gridMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uColor: { value: new THREE.Color(0x7d55d9) },
    uOpacity: { value: 0.28 }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    varying vec3 vWorldPos;
    void main() {
      vec3 pos = position;
      float dist = length(pos.xz);
      float wave = sin(dist * 0.007 - uTime * 3.5) * (10.0 + uBass * 36.0);
      float waveCross = cos(pos.x * 0.005 + uTime * 2.0) * (6.0 + uMid * 20.0);
      pos.y += wave + waveCross;
      vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec3 vWorldPos;
    void main() {
      float dist = length(vWorldPos.xz);
      float fade = smoothstep(1700.0, 300.0, dist);
      gl_FragColor = vec4(uColor, uOpacity * fade);
    }
  `,
  wireframe: true,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const gridMesh = new THREE.Mesh(gridGeo, gridMat);
gridMesh.position.y = -185;
scene.add(gridMesh);

// 3. 3D Reactive Twinkling Starfield System (4,200 Sparkling Multi-Spectral Stars)
const starCount = 4200;
const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
const starSeeds = new Float32Array(starCount);
const starColors = new Float32Array(starCount * 3);

const STAR_SPECTRA = [
  [1.0, 1.0, 1.0],      // Diamond pure white
  [0.35, 0.90, 1.0],    // Quantum cyan
  [1.0, 0.82, 0.42],    // Stellar amber
  [0.85, 0.55, 1.0]     // Supernova lilac
];

for (let i = 0; i < starCount; i++) {
  const u = Math.random(), v = Math.random();
  const theta = u * 2.0 * Math.PI, phi = Math.acos(2.0 * v - 1.0);
  const r = 850 + Math.random() * 2300;

  starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = Math.max(-120, r * Math.sin(phi) * Math.sin(theta));
  starPositions[i * 3 + 2] = r * Math.cos(phi);

  starSizes[i] = 1.8 + Math.pow(Math.random(), 3.2) * 8.0;
  starSeeds[i] = Math.random();

  const c = STAR_SPECTRA[Math.floor(Math.random() * STAR_SPECTRA.length)];
  starColors[i * 3] = c[0];
  starColors[i * 3 + 1] = c[1];
  starColors[i * 3 + 2] = c[2];
}

starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
starGeo.setAttribute('aSeed', new THREE.BufferAttribute(starSeeds, 1));
starGeo.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));

const starMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAudioTreble: { value: 0 },
    uAudioMid: { value: 0 }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uAudioTreble;
    uniform float uAudioMid;
    attribute float aSize;
    attribute float aSeed;
    attribute vec3 aColor;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = aColor;
      float tw = sin(uTime * (1.8 + aSeed * 4.2) + aSeed * 25.0) * 0.5 + 0.5;
      float flare = uAudioTreble * 1.5 + uAudioMid * 0.8;
      float sz = aSize * (0.70 + tw * 0.55 + flare * 0.90);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = clamp(sz * (900.0 / max(-mv.z, 1.0)), 1.5, 45.0);
      vAlpha = 0.60 + tw * 0.40 + flare * 0.45;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      if (d > 1.0) discard;
      float core = exp(-d * d * 32.0);
      float halo = exp(-d * d * 4.0) * 0.55;
      float crossFlare = max(0.0, 1.0 - abs(gl_PointCoord.x - 0.5) * 16.0) * max(0.0, 1.0 - abs(gl_PointCoord.y - 0.5) * 3.5) +
                         max(0.0, 1.0 - abs(gl_PointCoord.y - 0.5) * 16.0) * max(0.0, 1.0 - abs(gl_PointCoord.x - 0.5) * 3.5);
      vec3 col = vColor * (core * 2.2 + halo + crossFlare * 0.45);
      gl_FragColor = vec4(col, (core + halo) * vAlpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const starfieldPoints = new THREE.Points(starGeo, starMat);
scene.add(starfieldPoints);

// ============================================================
// 3B. 3D NEURAL DATA TREES (ÁRBOLES DE DATOS / DENDRITAS NEURONALES)
// 8 majestic branching cybernetic trees rising from the cyber floor
// ============================================================
const dataTreesGroup = new THREE.Group();
scene.add(dataTreesGroup);

const treeCount = 8;
const treeRadius = 370;
const treeSegments = [];
const treeLeaves = [];
const treePulses = [];

for (let t = 0; t < treeCount; t++) {
  const angle = (t / treeCount) * Math.PI * 2;
  const rootX = Math.cos(angle) * treeRadius;
  const rootZ = Math.sin(angle) * treeRadius;
  const rootY = -185;

  const trunkTop = new THREE.Vector3(rootX * 0.86, rootY + 98, rootZ * 0.86);
  const rootPos = new THREE.Vector3(rootX, rootY, rootZ);

  // Curved Trunk
  const trunkSteps = 4;
  let prevPt = rootPos.clone();
  for (let s = 1; s <= trunkSteps; s++) {
    const frac = s / trunkSteps;
    const pt = new THREE.Vector3(
      rootPos.x * (1.0 - frac * 0.14),
      rootPos.y + frac * 98,
      rootPos.z * (1.0 - frac * 0.14)
    );
    treeSegments.push(prevPt.x, prevPt.y, prevPt.z, pt.x, pt.y, pt.z);
    prevPt = pt;
  }

  // Primary Synaptic Branches
  const branchCount = 4;
  for (let b = 0; b < branchCount; b++) {
    const bAngle = angle + (b - (branchCount - 1) / 2) * 0.55;
    const bLen = 50 + (b % 2) * 25;
    const bTop = new THREE.Vector3(
      trunkTop.x + Math.cos(bAngle) * bLen,
      trunkTop.y + 35 + (b % 2) * 20,
      trunkTop.z + Math.sin(bAngle) * bLen
    );
    treeSegments.push(trunkTop.x, trunkTop.y, trunkTop.z, bTop.x, bTop.y, bTop.z);

    // Secondary Dendritic Twigs
    for (let d = 0; d < 2; d++) {
      const dAngle = bAngle + (d === 0 ? -0.42 : 0.42);
      const dLen = 28 + d * 15;
      const dTop = new THREE.Vector3(
        bTop.x + Math.cos(dAngle) * dLen,
        bTop.y + 22 + d * 14,
        bTop.z + Math.sin(dAngle) * dLen
      );
      treeSegments.push(bTop.x, bTop.y, bTop.z, dTop.x, dTop.y, dTop.z);
      treeLeaves.push(dTop.x, dTop.y, dTop.z);
    }
  }

  // Synaptic Energy Pulses traveling along tree
  for (let p = 0; p < 3; p++) {
    treePulses.push({
      treeIdx: t,
      root: rootPos,
      top: trunkTop,
      progress: Math.random(),
      speed: 0.35 + Math.random() * 0.45
    });
  }
}

// Tree Conduits
const treeLineGeo = new THREE.BufferGeometry();
treeLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(treeSegments, 3));
const treeLineMat = new THREE.LineBasicMaterial({
  color: 0x00f0ff,
  transparent: true,
  opacity: 0.55,
  ...additive
});
const treeLinesMesh = new THREE.LineSegments(treeLineGeo, treeLineMat);
dataTreesGroup.add(treeLinesMesh);

// Terminal Leaf Perceptrons
const leafGeo = new THREE.BufferGeometry();
leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(treeLeaves, 3));
const leafMat = new THREE.PointsMaterial({
  size: 5.5,
  map: glowTex,
  color: 0xffd24d,
  transparent: true,
  opacity: 0.85,
  ...additive
});
const leafPoints = new THREE.Points(leafGeo, leafMat);
dataTreesGroup.add(leafPoints);

// Synaptic Energy Pulses Mesh
const treePulseGeo = new THREE.BufferGeometry();
const treePulsePos = new Float32Array(treePulses.length * 3);
treePulseGeo.setAttribute('position', new THREE.BufferAttribute(treePulsePos, 3));
const treePulseMat = new THREE.PointsMaterial({
  size: 7.5,
  map: glowTex,
  color: 0xff2a85,
  transparent: true,
  opacity: 0.95,
  ...additive
});
const treePulsePoints = new THREE.Points(treePulseGeo, treePulseMat);
dataTreesGroup.add(treePulsePoints);

// 4. Central Plasma Star Core (Tightly bounded energetic nucleus)
const coreGroup = new THREE.Group();
root.add(coreGroup);

const coreMat = new THREE.SpriteMaterial({
  map: glowTex,
  color: new THREE.Color(0xd4001a),
  opacity: 0.22,
  ...additive
});
const coreMesh = new THREE.Sprite(coreMat);
coreMesh.scale.set(16, 16, 1);
coreMesh.visible = false; // Hidden to let the dense 3D neural soma shine with crisp contrast
coreGroup.add(coreMesh);

// Coronal Glow Halo
const coronaGeo = new THREE.BufferGeometry();
const coronaCount = 240;
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
coronaPoints.visible = false; // Hidden to prevent central over-bloom and wash-out
coreGroup.add(coronaPoints);

// 5. HUD Concentric Orbital Rings with Gyroscopic Precession
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
  { obj: createArc(R * 1.08, 0, Math.PI * 2, 220, 0xd9aa58, 0.4), speed: 0.15, tilt: [0, 0, 0], band: 'bass' },
  { obj: createArc(R * 1.22, 0, 4.2, 140, 0x7d55d9, 0.75), speed: -0.22, tilt: [0, 0, 0], band: 'mid' },
  { obj: createArc(R * 1.34, 0.5, 5.5, 160, 0xd4001a, 0.5, R * 0.035), speed: 0.3, tilt: [0.55, 0, 0.25], band: 'bass' },
  { obj: createArc(R * 1.0, 0, 2.6, 90, 0x7d55d9, 0.9), speed: -0.28, tilt: [1.0, 0, 0.6], band: 'treble' },
  { obj: createArc(R * 1.46, 0, Math.PI * 2, 240, 0xd9aa58, 0.45, R * 0.06), speed: 0.12, tilt: [0.4, 0, -0.7], band: 'mid' },
  { obj: createTickRing(R * 1.58, 180, R * 0.018, 0xd9aa58, 0.5), speed: 0.08, tilt: [0, 0, 0], band: 'bass' },
  { obj: createArc(R * 1.74, 0, 1.4, 60, 0x7d55d9, 0.85), speed: -0.35, tilt: [0, 0, 0], band: 'treble' },
  { obj: createArc(R * 1.74, 3.1, 4.3, 60, 0xd4001a, 0.85), speed: 0.25, tilt: [0, 0, 0], band: 'treble' },
  { obj: createTickRing(R * 1.9, 120, R * 0.014, 0x7d55d9, 0.35, 10), speed: -0.06, tilt: [0, 0, 0], band: 'bass' },
];

for (const r of ringsData) {
  const holder = new THREE.Group();
  holder.rotation.set(...r.tilt);
  holder.add(r.obj);
  const wrapper = new THREE.Group();
  wrapper.add(holder);
  ringsGroup.add(wrapper);
  r.wrapper = wrapper;
  r.holder = holder;
}

// 6. Dedicated 3D Circular Equalizer Ring (Stargate Arc Iris)
const circEqCount = 64;
const circEqRadius = R * 1.52;
const circEqGeo = new THREE.BufferGeometry();
const circEqPositions = new Float32Array(circEqCount * 2 * 3);
const circCos = new Float32Array(circEqCount);
const circSin = new Float32Array(circEqCount);
for (let i = 0; i < circEqCount; i++) {
  const a = (i / circEqCount) * Math.PI * 2;
  circCos[i] = Math.cos(a);
  circSin[i] = Math.sin(a);
  const x = circCos[i] * circEqRadius;
  const z = circSin[i] * circEqRadius;
  circEqPositions[i * 6] = x;
  circEqPositions[i * 6 + 1] = 0;
  circEqPositions[i * 6 + 2] = z;
  circEqPositions[i * 6 + 3] = x * 1.05;
  circEqPositions[i * 6 + 4] = 0;
  circEqPositions[i * 6 + 5] = z * 1.05;
}
circEqGeo.setAttribute('position', new THREE.BufferAttribute(circEqPositions, 3));
const circEqMat = new THREE.LineBasicMaterial({
  color: 0x00f0ff,
  opacity: 0.85,
  ...additive
});
const circEqMesh = new THREE.LineSegments(circEqGeo, circEqMat);
const circEqHolder = new THREE.Group();
circEqHolder.rotation.x = 0.35;
circEqHolder.add(circEqMesh);
ringsGroup.add(circEqHolder);

// 7. Orbital Docker Fleet (17 Star Modules)
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
    console.warn('Fleet fallback init:', err);
  }
}
initFleet();

// 8. Load Full 134,668 Node Neural Graph
let holoInstance = null;
async function initGraph() {
  try {
    const statusEl = document.getElementById('loading-indicator');
    if (statusEl) statusEl.textContent = 'CARGANDO 134.668 NODOS Y 366.093 FILAMENTOS...';

    const ds = await cargarDataset('./data');
    holoInstance = new Hologram(ds, { scale: R });
    holoInstance.setU('uSizeK', 0.20);
    holoInstance.setU('uGain', holoInstance.baseGain * 0.40 * userSettings.filamentGlow);
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

  if (gridMat && gridMat.uniforms) gridMat.uniforms.uColor.value.setRGB(...theme.base);
  if (circEqMat) circEqMat.color.setRGB(...theme.accent);
  if (typeof treeLineMat !== 'undefined' && treeLineMat) treeLineMat.color.setRGB(...theme.accent);
  if (typeof leafMat !== 'undefined' && leafMat) leafMat.color.setRGB(...theme.core);

  // Update Auroralis Sky Shader Uniform Colors
  if (skyMat) {
    skyMat.uniforms.uBaseColor.value.setRGB(...theme.base);
    skyMat.uniforms.uAccentColor.value.setRGB(...theme.accent);
    skyMat.uniforms.uCoreColor.value.setRGB(...theme.core);
  }
}

// Dynamic Wallpaper Engine Audio Processing
function onWallpaperAudio(audioArray) {
  if (!audioArray || !audioArray.length) return;
  isWallpaperEngine = true;
  lastAudioPacketTime = performance.now();

  const len = audioArray.length;
  const half = Math.floor(len / 2);

  // Sub-bass & Bass: Bins 0..7 (Punchy instant transients)
  let b = 0, m = 0, t = 0;
  const bassCount = Math.min(8, half);
  for (let i = 0; i < bassCount; i++) {
    b += (audioArray[i] + audioArray[i + half]) * 0.5;
  }
  rawBass = (b / bassCount) * userSettings.sensitivity * userSettings.bassPulse;

  // Midrange: Bins 8..27 (Vocals & synths)
  const midStart = bassCount;
  const midCount = Math.min(20, half - midStart);
  for (let i = midStart; i < midStart + midCount; i++) {
    m += (audioArray[i] + audioArray[i + half]) * 0.5;
  }
  rawMid = (m / Math.max(1, midCount)) * userSettings.sensitivity;

  // Treble: Bins 28..55 (Cymbals, transients, snares)
  const trebleStart = midStart + midCount;
  const trebleCount = Math.max(1, half - trebleStart);
  for (let i = trebleStart; i < half; i++) {
    t += (audioArray[i] + audioArray[i + half]) * 0.5;
  }
  rawTreble = (t / trebleCount) * userSettings.sensitivity;

  // Map to 64 spectrum channels for HUD & 3D circular visualizers
  for (let i = 0; i < 64; i++) {
    const srcIdx = Math.min(half - 1, Math.floor((i / 64) * half));
    const monoVal = (audioArray[srcIdx] + audioArray[srcIdx + half]) * 0.5;
    audioHistory[i] = monoVal * userSettings.sensitivity;
  }
}

// Resilient Wallpaper Engine Audio Hook Registration (Supports both listener and window hook)
window.wallpaperAudioListener = onWallpaperAudio;
function setupAudioHook() {
  window.wallpaperAudioListener = onWallpaperAudio;
  if (window.wallpaperRegisterAudioListener) {
    window.wallpaperRegisterAudioListener(onWallpaperAudio);
    return true;
  }
  return false;
}
if (!setupAudioHook()) {
  const regInterval = setInterval(() => {
    if (setupAudioHook()) clearInterval(regInterval);
  }, 200);
}

// Media Player (Now Playing) Integration
function setupMediaListeners() {
  if (window.wallpaperRegisterMediaPropertiesListener) {
    window.wallpaperRegisterMediaPropertiesListener((event) => {
      mediaState.title = event.title || '';
      mediaState.artist = event.artist || '';
      mediaState.albumTitle = event.albumTitle || '';
      mediaState.lastUpdate = performance.now();
    });
  }
  if (window.wallpaperRegisterMediaThumbnailListener) {
    window.wallpaperRegisterMediaThumbnailListener((event) => {
      if (event.thumbnail) {
        mediaState.thumbnail = event.thumbnail;
        const img = new Image();
        img.src = event.thumbnail;
        img.onload = () => { mediaState.thumbnailImg = img; };
      } else {
        mediaState.thumbnail = null;
        mediaState.thumbnailImg = null;
      }
    });
  }
  if (window.wallpaperRegisterMediaPlaybackListener) {
    window.wallpaperRegisterMediaPlaybackListener((event) => {
      const PLAYING = (window.wallpaperMediaIntegration && window.wallpaperMediaIntegration.PLAYBACK_PLAYING) || 1;
      mediaState.isPlaying = (event.state === PLAYING);
    });
  }
  if (window.wallpaperRegisterMediaTimelineListener) {
    window.wallpaperRegisterMediaTimelineListener((event) => {
      mediaState.position = event.position || 0;
      mediaState.duration = event.duration || 0;
    });
  }
}
setupMediaListeners();

// Wallpaper Engine Property Listener (Protected & Resilient)
window.wallpaperPropertyListener = {
  applyUserProperties: function(props) {
    if (!props) return;
    try {
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
        if (holoInstance) holoInstance.setU('uGain', holoInstance.baseGain * 0.40 * props.filament_glow.value);
      }
      if (props.bloom_strength) {
        userSettings.bloomStrength = props.bloom_strength.value;
        if (bloomPass) bloomPass.strength = props.bloom_strength.value;
      }
      if (props.rotation_speed) {
        userSettings.rotationSpeed = props.rotation_speed.value;
      }
      if (props.ai_aggression) {
        userSettings.aiAggression = props.ai_aggression.value;
      }
      if (props.show_terminal) {
        userSettings.showTerminal = props.show_terminal.value;
      }
      if (props.show_telemetry) {
        userSettings.showTelemetry = props.show_telemetry.value;
      }
      if (props.show_media_widget) {
        userSettings.showMediaWidget = props.show_media_widget.value;
      }
      if (props.show_system_deck) {
        userSettings.showSystemDeck = props.show_system_deck.value;
      }
      if (props.show_oscilloscope) {
        userSettings.showOscilloscope = props.show_oscilloscope.value;
      }
      if (props.show_ascii_panel) {
        userSettings.showAsciiPanel = props.show_ascii_panel.value;
      }
      if (props.show_code_rain) {
        userSettings.showCodeRain = props.show_code_rain.value;
      }
      if (props.show_cyber_grid) {
        userSettings.showCyberGrid = props.show_cyber_grid.value;
        if (typeof gridMesh !== 'undefined' && gridMesh) gridMesh.visible = userSettings.showCyberGrid;
      }
      if (props.show_aurora_sky) {
        userSettings.showAuroraSky = props.show_aurora_sky.value;
        if (typeof skyMesh !== 'undefined' && skyMesh) skyMesh.visible = userSettings.showAuroraSky;
      }
      if (props.show_circular_eq) {
        userSettings.showCircularEq = props.show_circular_eq.value;
        if (typeof circEqHolder !== 'undefined' && circEqHolder) circEqHolder.visible = userSettings.showCircularEq;
      }
      if (props.blackwall_fx) {
        userSettings.blackwallFx = props.blackwall_fx.value;
      }
      if (props.starfield_bg) {
        userSettings.starfieldBg = props.starfield_bg.value;
        if (typeof starfieldPoints !== 'undefined' && starfieldPoints) starfieldPoints.visible = userSettings.starfieldBg;
      }
      if (props.show_hud_rings) {
        userSettings.showRings = props.show_hud_rings.value;
        if (typeof ringsGroup !== 'undefined' && ringsGroup) ringsGroup.visible = userSettings.showRings;
      }
      if (props.mouse_interaction) {
        userSettings.mouseInteraction = props.mouse_interaction.value;
        if (controls) controls.enabled = userSettings.mouseInteraction;
      }
      if (props.fps_limit) {
        userSettings.fpsLimit = parseInt(props.fps_limit.value, 10) || 60;
        targetFps = userSettings.fpsLimit;
        fpsInterval = 1000 / targetFps;
      }
      if (props.camera_zoom) {
        if (props.camera_zoom.value === 'inside') {
          targetCamDist = 20;
        } else if (props.camera_zoom.value === 'closeup') {
          targetCamDist = 120;
        } else {
          targetCamDist = 380;
        }
      }
    } catch (err) {
      console.warn('applyUserProperties error:', err);
    }
  },
  setPaused: function(isPaused) {
    isWindowHidden = isPaused;
  }
};

// Standalone Browser Mic / Audio Fallback
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
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          const src = fallbackAudioCtx.createMediaStreamSource(stream);
          src.connect(fallbackAnalyser);
        }).catch(() => {});
      }
    }
  } catch (e) {}
}
window.addEventListener('click', initFallbackAudio, { once: true });

// Mouse Parallax & Dynamic Zoom Engine
let mouseX = 0, mouseY = 0;
let targetRotX = 0, targetRotY = 0;

function applyZoomStep(deltaY) {
  // deltaY < 0 = scroll up (zoom into core)
  // deltaY > 0 = scroll down (zoom out into deep space)
  const factor = deltaY < 0 ? 0.78 : 1.28;
  targetCamDist = Math.max(MIN_CAM_DIST, Math.min(MAX_CAM_DIST, targetCamDist * factor));
}

// Window & Document Wheel Listeners (Captures all desktop scroll events)
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  applyZoomStep(e.deltaY);
}, { passive: false });

document.addEventListener('wheel', (e) => {
  e.preventDefault();
  applyZoomStep(e.deltaY);
}, { passive: false });

// Double-click toggle inside / outside core
window.addEventListener('dblclick', () => {
  if (targetCamDist > 55) {
    targetCamDist = 20; // Dive straight into Dyson core!
  } else {
    targetCamDist = 380; // Return to standard orbit
  }
});

// Keyboard zoom shortcuts (+, -, W, S, Up, Down, PageUp, PageDown)
window.addEventListener('keydown', (e) => {
  if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'PageUp') {
    applyZoomStep(-100);
  } else if (e.key === '-' || e.key === '_' || e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'PageDown') {
    applyZoomStep(100);
  }
});

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Touch Events for Mobile (Drag to orbit rotate, pinch to zoom, double-tap to dive)
let touchStartDist = 0;
let lastTouchX = 0, lastTouchY = 0;
let lastTapTime = 0;

window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    const now = Date.now();
    if (now - lastTapTime < 300) {
      targetCamDist = targetCamDist > 55 ? 20 : (window.innerWidth < window.innerHeight ? 480 : 360);
    }
    lastTapTime = now;
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    touchStartDist = Math.sqrt(dx * dx + dy * dy);
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    const dx = e.touches[0].clientX - lastTouchX;
    const dy = e.touches[0].clientY - lastTouchY;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;

    mouseX = (lastTouchX / window.innerWidth) * 2 - 1;
    mouseY = -(lastTouchY / window.innerHeight) * 2 + 1;

    // Smooth manual orbit tilt
    root.rotation.y += dx * 0.008;
    root.rotation.x += dy * 0.008;
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    const delta = touchStartDist - currentDist;
    touchStartDist = currentDist;
    applyZoomStep(delta * 2.5);
  }
}, { passive: true });

// Easter Eggs Ticker Catalog (JackStar, DrakesCraft, Star-VPS, SAORI AI)
const EASTER_EGGS = [
  { tag: 'OPERATOR', color: '#ffd24d', text: 'JackStar // Sovereign Architect [ROOT ACCESS]' },
  { tag: 'DRAKES', color: '#22c55e', text: 'DrakesCraft · Purpur 1.21.11 [Dallas Ptero · Slimefun OK]' },
  { tag: 'SAORI', color: '#00f0ff', text: 'SAORI AI · Multi-Agent Neural Mesh [Discord & WA Bot]' },
  { tag: 'STAR-VPS', color: '#b77cff', text: 'Star 24/7 Cluster · 17 Dockers [Tailscale Mesh OK]' },
  { tag: 'SUITES', color: '#ff2a85', text: 'StarSuites · Tickets & Guilds [Bedrock Floodgate OK]' }
];

// Clean Sci-Fi Public Safe Telemetry Logs
const LOG_CATALOG = [
  { tag: 'SYS.FFM', color: '#b77cff', text: 'DirectMemory Arena: 8,192 MB allocated (AVX-512 SIMD dispatch)' },
  { tag: 'AURORA', color: '#00f0ff', text: 'Auroralis sky dome shader: Raymarching curtains @ 60 FPS' },
  { tag: 'SYNAPSE', color: '#ffd24d', text: 'Topology: 134,668 neural nodes | 366,093 synaptic conduits active' },
  { tag: 'JACKSTAR', color: '#ffd24d', text: 'Root override authorized: Operator JackStar verified [LVL-99]' },
  { tag: 'DRAKES', color: '#22c55e', text: 'DrakesCraft node: Purpur 1.21.11 [Dallas Ptero · Slimefun OK]' },
  { tag: 'SAORI.AI', color: '#00f0ff', text: 'SAORI neural mesh: Multi-agent Discord & WhatsApp bridge online' },
  { tag: 'STAR.NET', color: '#b77cff', text: 'Star-node VPS: 24/7 cluster heartbeat synchronized' },
  { tag: 'DAEMON', color: '#b77cff', text: 'Quantum hyper-thread cluster: 16 core engines synchronized' },
  { tag: 'DOCKER', color: '#2fe0ff', text: 'Constellation fleet: 17 orbital modules active [UPTIME 99.99%]' },
  { tag: 'WASAPI', color: '#00f0ff', text: 'Spectral stream online: 64 frequency channels @ 48kHz' },
  { tag: 'CIPHER', color: '#22c55e', text: 'Sub-net crypto: 4096-bit SHA-3 // Quantum-resistant key valid' },
  { tag: 'ORBIT', color: '#ffd24d', text: 'Gravitational Dyson containment: 99.8% flux stability' },
  { tag: 'GLSL.GPU', color: '#ff3344', text: 'WebGL2 Instanced parallel draw: 134k particles (CEF v146 @ 60 FPS)' },
  { tag: 'CACHE', color: '#b77cff', text: 'Neural vector embeddings cache hit rate: 99.8% [OPTIMAL]' },
  { tag: 'ANOMALY', color: '#ff2a85', text: 'Deep-Net quantum tunneling detected: Counter-intrusion engaged' },
  { tag: 'MATRIX', color: '#00f0ff', text: 'Off-heap direct buffer sync: 0.00ms lockless atomic arena' }
];

const liveTerminalLogs = [];
let nextLogCountdown = 0.5;
let logCatalogIdx = 0;

function addTerminalLog(tag, color, text) {
  const d = new Date();
  const timeStr = d.toTimeString().split(' ')[0] + '.' + Math.floor(d.getMilliseconds() / 100);
  liveTerminalLogs.push({ time: timeStr, tag, color, text });
  if (liveTerminalLogs.length > 9) liveTerminalLogs.shift();
}

for (let i = 0; i < 5; i++) {
  const entry = LOG_CATALOG[i];
  addTerminalLog(entry.tag, entry.color, entry.text);
}

// ASCII Matrix Code Rain Streams (Right Margin Only - Icons area clean)
const CODE_RAIN_CHARS = '01X§ø∆∑░▒▓0xFA9C82B4E17D35';
const rainStreams = [];
const rainStreamCount = 12;
for (let i = 0; i < rainStreamCount; i++) {
  rainStreams.push({
    xFrac: 1.0 - 0.010 - (i * 0.016),
    y: Math.random() * -1000,
    speed: 120 + Math.random() * 220,
    len: 12 + Math.floor(Math.random() * 16),
    chars: []
  });
}

// Animation Loop
const clock = new THREE.Clock();
let fpsCounter = 60;
let frameCount = 0;
let lastFpsTime = performance.now();

function animate(currentTime) {
  requestAnimationFrame(animate);

  if (!currentTime) currentTime = performance.now();
  const currentInterval = isWindowHidden ? 200 : fpsInterval;
  const deltaMs = currentTime - lastFrameTime;
  if (deltaMs < currentInterval) {
    return;
  }
  lastFrameTime = currentTime - (deltaMs % currentInterval);

  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();

  // FPS calculation
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 500) {
    fpsCounter = Math.round((frameCount * 1000) / (now - lastFpsTime));
    frameCount = 0;
    lastFpsTime = now;
  }

  // Audio Stream Activity Check
  const isAudioActive = isWallpaperEngine && (now - lastAudioPacketTime < 1200);

  if (!isAudioActive && fallbackAnalyser && fallbackData) {
    fallbackAnalyser.getByteFrequencyData(fallbackData);
    let b = 0, m = 0, t = 0;
    for (let i = 0; i < 6; i++) b += fallbackData[i] / 255;
    for (let i = 8; i < 24; i++) m += fallbackData[i] / 255;
    for (let i = 24; i < 48; i++) t += fallbackData[i] / 255;
    rawBass = (b / 6) * userSettings.sensitivity * userSettings.bassPulse;
    rawMid = (m / 16) * userSettings.sensitivity;
    rawTreble = (t / 24) * userSettings.sensitivity;
    for (let i = 0; i < 64; i++) audioHistory[i] = (fallbackData[i] || 0) / 255;
  } else if (!isAudioActive) {
    // Procedural organic rhythm when idle
    const bpm128 = time * (128 / 60) * Math.PI;
    const kick = Math.pow(Math.max(0, Math.sin(bpm128)), 14) * 0.55;
    const synth = (Math.sin(time * 1.4) * 0.5 + 0.5) * 0.22;
    const hihat = Math.pow(Math.max(0, Math.cos(bpm128 * 2)), 8) * 0.20;
    rawBass = kick * userSettings.bassPulse;
    rawMid = synth;
    rawTreble = hihat;
    for (let i = 0; i < 64; i++) {
      audioHistory[i] = Math.max(0, Math.sin(time * 1.6 + i * 0.15) * 0.15 + (i < 8 ? kick : 0));
    }
  }

  // Smooth filter
  const smoothFactor = Math.min(1.0, delta * 20.0);
  smoothBass += (rawBass - smoothBass) * smoothFactor;
  smoothMid += (rawMid - smoothMid) * (smoothFactor * 0.85);
  smoothTreble += (rawTreble - smoothTreble) * (smoothFactor * 0.9);

  // Peak caps decay for spectrum bars
  for (let i = 0; i < 64; i++) {
    const val = audioHistory[i] || 0;
    if (val > peakCaps[i]) {
      peakCaps[i] = val;
      peakDecay[i] = 0;
    } else {
      peakDecay[i] += delta * 1.8;
      peakCaps[i] = Math.max(0, peakCaps[i] - peakDecay[i] * delta);
    }
  }

  // Beat Drop Shockwave & Glitch Detection
  const bassKick = rawBass - smoothBass;
  if (bassKick > 0.40 && (time - lastBeatTime > 0.20)) {
    lastBeatTime = time;
    shockwaveActive = true;
    shockwaveRadius = 15;

    if (userSettings.blackwallFx) {
      glitchTimer = 0.22;
    }

    addTerminalLog('KICK', '#ff2a85', `Transient sub-bass spike: +${(bassKick * 10).toFixed(1)} dB // SHOCKWAVE DISPATCHED`);
  }

  // AI Rage Overdrive & Violent Spikes Dynamic Trigger
  if (userSettings.aiAggression === 'always') {
    rageLevel = 0.85 + Math.sin(time * 3.0) * 0.15;
    spikeIntensity = 0.90 + Math.sin(time * 4.0) * 0.10;
  } else if (userSettings.aiAggression === 'calm') {
    rageLevel = 0.0;
    spikeIntensity = 0.0;
  } else {
    // Auto mode: reacts violently to heavy bass drops, transient spikes, and high volume
    if (bassKick > 0.35 || rawBass > 1.85) {
      const punch = Math.max(0.40, bassKick * 0.85);
      rageLevel = Math.min(1.0, rageLevel + punch);
      spikeIntensity = Math.min(1.0, spikeIntensity + punch * 1.15);

      if (rageLevel > 0.65) {
        glitchTimer = Math.max(glitchTimer, 0.28);
        if (Math.random() < 0.35) {
          addTerminalLog('ROGUE_AI', '#ff003c', 'CONTAINMENT BREACH // Neural spikes erupting outward');
        }
      }
    }
    // Smooth damping decay
    rageLevel = Math.max(0.0, rageLevel - delta * 0.70);
    spikeIntensity = Math.max(0.0, spikeIntensity - delta * 0.80);
  }

  // Blackwall Anomaly Random Events
  nextAnomalyCountdown -= delta;
  if (nextAnomalyCountdown <= 0 && userSettings.blackwallFx) {
    nextAnomalyCountdown = 16 + Math.random() * 12;
    blackwallAnomalyTimer = 0.45;
    addTerminalLog('BLACKWALL', '#ff003c', 'ANOMALY DETECTED // Quantum neural breach attempt suppressed');
  }

  if (glitchTimer > 0) glitchTimer -= delta;
  if (blackwallAnomalyTimer > 0) blackwallAnomalyTimer -= delta;

  if (shockwaveActive) {
    shockwaveRadius += delta * 280;
    if (shockwaveRadius > R * 2.8) {
      shockwaveActive = false;
      shockwaveRadius = 0;
    }
  }

  // Live Terminal Log Streamer
  nextLogCountdown -= delta;
  if (nextLogCountdown <= 0) {
    nextLogCountdown = 1.8 + Math.random() * 1.2;
    const logItem = LOG_CATALOG[logCatalogIdx % LOG_CATALOG.length];
    logCatalogIdx++;
    addTerminalLog(logItem.tag, logItem.color, logItem.text);
  }

  // 1. Auroralis Sky Dome Shader Animation (Jack's Shader Engine)
  if (userSettings.showAuroraSky && skyMat) {
    skyMat.uniforms.uTime.value = time;
    skyMat.uniforms.uAudioBass.value = smoothBass;
    skyMat.uniforms.uAudioMid.value = smoothMid;
    skyMat.uniforms.uAudioTreble.value = smoothTreble;

    // SAORI Multiverse Dynamic Hue Progression (Preserves deep obsidian cosmic void)
    if (currentTheme === THEMES.saori_universe) {
      const cycleHue = (time * 0.012) % 1.0;
      const dynamicBase = new THREE.Color().setHSL(cycleHue, 0.85, 0.20);
      const dynamicAccent = new THREE.Color().setHSL((cycleHue + 0.35) % 1.0, 0.95, 0.40);
      skyMat.uniforms.uBaseColor.value.lerp(dynamicBase, 0.03);
      skyMat.uniforms.uAccentColor.value.lerp(dynamicAccent, 0.03);
      if (gridMat && gridMat.uniforms) {
        gridMat.uniforms.uColor.value.lerp(dynamicBase, 0.03);
      }
    }
  }

  // 2. 3D Undulating Cyber Grid Floor Wave Animation (Accelerated GPU Uniforms)
  if (userSettings.showCyberGrid && gridMat && gridMat.uniforms) {
    gridMat.uniforms.uTime.value = time;
    gridMat.uniforms.uBass.value = smoothBass;
    gridMat.uniforms.uMid.value = smoothMid;
    gridMesh.rotation.y = time * 0.03 * userSettings.rotationSpeed;
  }

  // 3. 3D Sparkling Starfield Twinkling & Audio Flare
  if (starfieldPoints && userSettings.starfieldBg && starMat.uniforms) {
    starMat.uniforms.uTime.value = time;
    starMat.uniforms.uAudioTreble.value = smoothTreble;
    starMat.uniforms.uAudioMid.value = smoothMid;
    starfieldPoints.rotation.y = time * 0.015 * userSettings.rotationSpeed;
    starfieldPoints.rotation.x = Math.sin(time * 0.04) * 0.015;
    const warp = 1.0 + smoothBass * 0.08;
    starfieldPoints.scale.set(warp, warp, warp);
  }

  // 3B. 3D Neural Data Trees Animation & Synaptic Conduit Pulses
  if (dataTreesGroup) {
    dataTreesGroup.rotation.y = time * 0.03 * userSettings.rotationSpeed;
    leafMat.size = 5.5 + smoothBass * 5.0 + smoothMid * 3.5;
    treeLineMat.opacity = 0.45 + smoothMid * 0.40;

    const pAttr = treePulseGeo.attributes.position;
    treePulses.forEach((p, idx) => {
      p.progress += delta * p.speed * (1.0 + smoothBass * 2.2 + smoothMid * 1.4);
      if (p.progress > 1.0) p.progress = 0.0;
      const curX = p.root.x + (p.top.x - p.root.x) * p.progress;
      const curY = p.root.y + (p.top.y - p.root.y) * p.progress;
      const curZ = p.root.z + (p.top.z - p.root.z) * p.progress;
      pAttr.setXYZ(idx, curX, curY, curZ);
    });
    pAttr.needsUpdate = true;
  }

  const camDist = camera.position.length();
  const isInside = camDist < 95;

  // 4. Central Energetic Singularity (Sharp, crisp, does not wash out inner neural filaments)
  const coreScale = 1.0 + smoothBass * 0.45;
  coreMesh.scale.set(22 * coreScale, 22 * coreScale, 1);
  coreGroup.rotation.y = time * 0.45 * userSettings.rotationSpeed;
  coreGroup.rotation.z = time * 0.20 * userSettings.rotationSpeed;

  if (camDist < 65) {
    const fade = Math.max(0.01, (camDist - 5) / 60);
    coreMat.opacity = fade * 0.20;
    coronaMat.opacity = fade * 0.35;
  } else {
    coreMat.opacity = 0.22 + Math.min(0.25, smoothBass * 0.25);
    coronaMat.opacity = 0.40;
  }

  // 5. Orbital Rings Dynamics: Gyroscopic Precession & Radius Expansion!
  const ringSpeedBoost = 1.0 + smoothMid * 2.6 + smoothBass * 1.4;
  ringsData.forEach((r, idx) => {
    r.wrapper.rotation.y += r.speed * delta * ringSpeedBoost * userSettings.rotationSpeed;

    let bandScale = 1.0;
    if (r.band === 'bass') bandScale += smoothBass * 0.55;
    else if (r.band === 'mid') bandScale += smoothMid * 0.45;
    else bandScale += smoothTreble * 0.40;

    r.holder.scale.set(bandScale, bandScale, bandScale);

    // 3D Gyroscopic Precession on X & Z
    r.holder.rotation.x = r.tilt[0] + Math.sin(time * 1.8 + idx * 1.1) * (0.22 + smoothBass * 0.40);
    r.holder.rotation.z = r.tilt[2] + Math.cos(time * 1.4 + idx * 0.9) * (0.22 + smoothMid * 0.35);
  });
  ringsGroup.rotation.x = Math.sin(time * 0.18) * 0.12;

  // 6. Dedicated 3D Circular Equalizer Ring Animation
  if (userSettings.showCircularEq) {
    const posAttr = circEqGeo.attributes.position;
    for (let i = 0; i < circEqCount; i++) {
      const cosA = circCos[i];
      const sinA = circSin[i];
      const val = audioHistory[i % 64] || 0;
      const pinLength = 6 + val * 48 * userSettings.sensitivity;
      const rOuter = circEqRadius + pinLength;

      posAttr.setXYZ(i * 2, cosA * circEqRadius, 0, sinA * circEqRadius);
      posAttr.setXYZ(i * 2 + 1, cosA * rOuter, 0, sinA * rOuter);
    }
    posAttr.needsUpdate = true;
    circEqHolder.rotation.y = time * 0.25 * userSettings.rotationSpeed;
    circEqHolder.rotation.z = Math.sin(time * 0.8) * 0.18;
  }

  // 7. Docker Fleet Dynamics
  fleetGroup.rotation.y = time * 0.22 * userSettings.rotationSpeed;

  // 8. Hologram Uniforms (Node Wave Deformation, Filament Vibration & Violent Spikes)
  if (holoInstance) {
    holoInstance.setU('uTime', time);
    // SAORI Multiverse Dynamic Topology Morphing (mixes between graph topologies tJ and tU)
    if (currentTheme === THEMES.saori_universe) {
      const mixPhase = Math.sin(time * 0.12) * 0.5 + 0.5;
      holoInstance.setU('uMix', mixPhase);
    }
    holoInstance.updateAudio(smoothBass, smoothMid, smoothTreble, shockwaveRadius, rageLevel, spikeIntensity);
    holoInstance.group.rotation.y = time * 0.10 * userSettings.rotationSpeed;
  }

  // Mouse Parallax & Smooth Camera Distance Interpolation
  if (userSettings.mouseInteraction) {
    targetRotY = mouseX * 0.25;
    targetRotX = -mouseY * 0.18;
    root.rotation.y += (targetRotY - root.rotation.y) * 0.06;
    root.rotation.x += (targetRotX - root.rotation.x) * 0.06;
  }

  // Smooth Camera Distance Interpolation towards targetCamDist
  const curDist = camera.position.length();
  if (Math.abs(curDist - targetCamDist) > 0.3) {
    const newDist = curDist + (targetCamDist - curDist) * 0.12;
    camera.position.setLength(newDist);
  }
  controls.update();

  // Render 3D Scene
  composer.render();

  // Render 2D Cyberpunk HUD & Overlays
  renderHud(time, delta, isAudioActive, isInside);
}

// ASCII Braille Audio Waveform Glyph Map
const BRAILLE_WAVE = [' ', '⡀', '⣀', '⣄', '⣤', '⣦', '⣶', '⣷', '⣿'];
const RADAR_GLYPHS = ['/', '—', '\\', '|'];

function renderHud(time, delta, isAudioActive, isInside = false) {
  if (!hudCtx) return;
  const w = window.innerWidth, h = window.innerHeight;
  if (hudCanvas.width !== w || hudCanvas.height !== h) {
    hudCanvas.width = w;
    hudCanvas.height = h;
  }

  hudCtx.clearRect(0, 0, w, h);

  const isAnomaly = blackwallAnomalyTimer > 0;
  const primaryAccent = isAnomaly ? '#ff003c' : 'rgba(125, 85, 217, 0.95)';
  const borderCol = isAnomaly ? 'rgba(255, 0, 60, 0.75)' : 'rgba(125, 85, 217, 0.45)';

  // 1. ASCII Matrix Code Rain Streams (Left & Right Margins)
  if (userSettings.showCodeRain) {
    hudCtx.font = '11px "DM Mono", monospace';
    const rainSpeedMult = 1.0 + smoothTreble * 1.8 + smoothBass * 1.2;

    for (const stream of rainStreams) {
      stream.y += stream.speed * delta * rainSpeedMult;
      if (stream.y > h + 200) {
        stream.y = -Math.random() * 300 - 50;
        stream.chars = [];
        for (let j = 0; j < stream.len; j++) {
          stream.chars.push(CODE_RAIN_CHARS[Math.floor(Math.random() * CODE_RAIN_CHARS.length)]);
        }
      }
      if (stream.chars.length === 0) {
        for (let j = 0; j < stream.len; j++) {
          stream.chars.push(CODE_RAIN_CHARS[Math.floor(Math.random() * CODE_RAIN_CHARS.length)]);
        }
      }

      const sx = stream.xFrac * w;
      for (let j = 0; j < stream.len; j++) {
        const sy = stream.y - j * 15;
        if (sy > 0 && sy < h) {
          if (j === 0) {
            hudCtx.fillStyle = isAnomaly ? '#ffffff' : '#ffd24d';
          } else {
            const alpha = Math.max(0, 1.0 - j / stream.len) * 0.45;
            hudCtx.fillStyle = isAnomaly ? `rgba(255, 0, 60, ${alpha})` : `rgba(125, 85, 217, ${alpha})`;
          }
          hudCtx.fillText(stream.chars[j], sx, sy);
        }
      }
    }
  }

  const isMobile = w < 768 || w < h;
  const isRogue = rageLevel > 0.40;

  if (isMobile) {
    // ==========================================
    // MOBILE / CELLULAR OPTIMIZED HUD LAYOUT
    // ==========================================
    // 1. Sleek Mobile Top Header
    hudCtx.font = 'bold 11px "DM Mono", monospace';
    hudCtx.fillStyle = isRogue ? '#ff0038' : (isAnomaly ? '#ff003c' : 'rgba(125, 85, 217, 0.95)');
    hudCtx.textAlign = 'left';
    hudCtx.fillText('SAORI // NEURAL CORE', 16, 26);

    // Status Beacon right
    const statusText = isRogue ? 'ROGUE' : (isAnomaly ? 'ICE' : (isAudioActive ? 'WASAPI' : 'STANDBY'));
    hudCtx.font = 'bold 10px "DM Mono", monospace';
    hudCtx.textAlign = 'right';
    hudCtx.fillStyle = isRogue ? '#ff0038' : (isAnomaly ? '#ff003c' : (isAudioActive ? '#22c55e' : 'rgba(255, 210, 77, 0.8)'));
    hudCtx.fillText(statusText, w - 16, 26);

    const sWidth = hudCtx.measureText(statusText).width;
    hudCtx.beginPath();
    hudCtx.arc(w - 16 - sWidth - 8, 22, 3, 0, Math.PI * 2);
    hudCtx.fillStyle = isRogue ? '#ff0038' : (isAnomaly ? '#ff003c' : (isAudioActive ? '#22c55e' : '#ffd24d'));
    hudCtx.fill();

    // Row 2: Subtitle
    hudCtx.textAlign = 'left';
    hudCtx.font = '9px "DM Mono", monospace';
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    hudCtx.fillText('134k NODES · 366k CONNS', 16, 40);

    hudCtx.textAlign = 'right';
    hudCtx.fillText(`${fpsCounter} FPS`, w - 16, 40);
    hudCtx.textAlign = 'left';

    // 2. Mobile Bottom Cyber Card (Docked cleanly above bottom margin)
    const mobH = 112;
    const mobY = h - mobH - 24;
    const mobW = w - 32;
    const mobX = 16;

    hudCtx.fillStyle = 'rgba(4, 8, 16, 0.85)';
    hudCtx.fillRect(mobX, mobY, mobW, mobH);
    hudCtx.strokeStyle = borderCol;
    hudCtx.lineWidth = 1;
    hudCtx.strokeRect(mobX, mobY, mobW, mobH);

    // Card Header Banner
    hudCtx.fillStyle = 'rgba(125, 85, 217, 0.22)';
    hudCtx.fillRect(mobX, mobY, mobW, 20);

    hudCtx.font = 'bold 9px "DM Mono", monospace';
    hudCtx.fillStyle = '#d9aa58';
    hudCtx.fillText('┌ MOBILE NEURAL TELEMETRY ┐', mobX + 8, mobY + 14);

    hudCtx.textAlign = 'right';
    hudCtx.fillStyle = '#00f0ff';
    hudCtx.fillText('JackStar ★', mobX + mobW - 8, mobY + 14);
    hudCtx.textAlign = 'left';

    // Digital Clock
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    hudCtx.font = 'bold 15px "DM Mono", monospace';
    hudCtx.fillStyle = '#00f0ff';
    hudCtx.fillText(`[ ${hh}:${mm}:${ss} ]`, mobX + 8, mobY + 40);

    hudCtx.font = '9px "DM Mono", monospace';
    hudCtx.fillStyle = '#ffffff';
    hudCtx.textAlign = 'right';
    hudCtx.fillText('UTC-3 · CHILE / DALLAS', mobX + mobW - 8, mobY + 39);
    hudCtx.textAlign = 'left';

    // Hardware CPU mini bar
    const dynCpu = (9.2 + smoothBass * 18.0 + smoothMid * 8.5).toFixed(1);
    hudCtx.font = '9px "DM Mono", monospace';
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    hudCtx.fillText(`CPU: ${dynCpu}%`, mobX + 8, mobY + 58);

    const barX = mobX + 70, barW = 60, barH = 5;
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    hudCtx.fillRect(barX, mobY + 52, barW, barH);
    const fillW = Math.min(barW, (parseFloat(dynCpu) / 100) * barW * 2.5);
    hudCtx.fillStyle = '#00f0ff';
    hudCtx.fillRect(barX, mobY + 52, fillW, barH);

    hudCtx.textAlign = 'right';
    hudCtx.fillStyle = '#ffd24d';
    hudCtx.fillText('RAM: 8GB · 17 DOCKERS', mobX + mobW - 8, mobY + 58);
    hudCtx.textAlign = 'left';

    // Media / Ticker Line
    hudCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    hudCtx.beginPath();
    hudCtx.moveTo(mobX + 8, mobY + 68);
    hudCtx.lineTo(mobX + mobW - 8, mobY + 68);
    hudCtx.stroke();

    const hasMedia = mediaState.title && mediaState.title.length > 0;
    if (hasMedia) {
      hudCtx.font = 'bold 9px "DM Mono", monospace';
      hudCtx.fillStyle = '#22c55e';
      hudCtx.fillText('● MUSIC: ' + (mediaState.title.length > 25 ? mediaState.title.substring(0, 23) + '..' : mediaState.title), mobX + 8, mobY + 84);
      hudCtx.fillStyle = 'rgba(217, 170, 88, 0.9)';
      hudCtx.fillText((mediaState.artist || 'Desconocido'), mobX + 8, mobY + 98);
    } else {
      const eggIdx = Math.floor(time / 4.0) % EASTER_EGGS.length;
      const currentEgg = EASTER_EGGS[eggIdx];
      hudCtx.font = 'bold 9px "DM Mono", monospace';
      hudCtx.fillStyle = currentEgg.color;
      hudCtx.fillText(`★ [${currentEgg.tag}]`, mobX + 8, mobY + 84);
      hudCtx.font = '9px "DM Mono", monospace';
      hudCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const shortText = currentEgg.text.length > 36 ? currentEgg.text.substring(0, 34) + '..' : currentEgg.text;
      hudCtx.fillText(shortText, mobX + 8, mobY + 98);
    }

    // Bottom Spectrum Audio Frequency Visualizer (Along bottom edge)
    if (userSettings.showOscilloscope && audioHistory.length >= 32) {
      const specY = h - 6;
      const step = w / 32;
      for (let i = 0; i < 32; i++) {
        const val = audioHistory[i] || 0;
        const bH = Math.min(16, val * 16);
        hudCtx.fillStyle = i < 8 ? '#ff2a85' : (i < 20 ? '#00f0ff' : '#22c55e');
        hudCtx.fillRect(i * step, specY - bH, step - 1, bH);
      }
    }

    // Mobile render finished: return to prevent overlapping with desktop cards
    return;
  }

  // Common Right-Side Cluster Bounds (Keeps left side 100% clean for desktop icons)
  const panelW = 420;
  const rightX = w - panelW - 24;

  // 2. Sleek Top Cyberpunk Status Header (Anchored Over Right Stack)
  hudCtx.font = 'bold 12px "DM Mono", monospace';
  hudCtx.fillStyle = isRogue ? '#ff0038' : (isAnomaly ? '#ff003c' : (isInside ? '#00f0ff' : 'rgba(125, 85, 217, 0.95)'));
  const statusTitle = isInside
    ? 'SAORI // INTERIOR CORE DECK'
    : (isRogue
        ? '⚠ ROGUE AI BREACH // UNCONFINED SPIKE ⚠'
        : (isAnomaly ? '⚠ SAORI // BLACKWALL ANOMALY ⚠' : 'SAORI // NEURAL CORE · v3.8'));
  hudCtx.textAlign = 'left';
  hudCtx.fillText(statusTitle, rightX, 26);

  // Status Beacon text right-aligned at w - 24 (Never collides with anything!)
  const statusText = isRogue ? 'ROGUE SPIKE' : (isAnomaly ? 'ICE BARRIER' : (isAudioActive ? 'WASAPI LIVE' : 'STANDBY'));
  hudCtx.font = 'bold 10px "DM Mono", monospace';
  hudCtx.textAlign = 'right';
  hudCtx.fillStyle = isRogue ? '#ff0038' : (isAnomaly ? '#ff003c' : (isAudioActive ? '#22c55e' : 'rgba(255, 210, 77, 0.8)'));
  hudCtx.fillText(statusText, w - 24, 26);

  // Status Beacon Dot (10px to the left of the status text)
  const statusMetrics = hudCtx.measureText(statusText);
  const dotX = w - 24 - statusMetrics.width - 9;
  hudCtx.beginPath();
  hudCtx.arc(dotX, 22, 3.5, 0, Math.PI * 2);
  hudCtx.fillStyle = isRogue ? '#ff0038' : (isAnomaly ? '#ff003c' : (isAudioActive ? '#22c55e' : '#ffd24d'));
  hudCtx.fill();

  // Subtitle (Second Row, Y = 42)
  hudCtx.textAlign = 'left';
  hudCtx.font = '10px "DM Mono", monospace';
  hudCtx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  hudCtx.fillText('134,668 NEURONS · 366,093 SYNAPSES', rightX, 42);

  hudCtx.textAlign = 'right';
  hudCtx.fillText(`${fpsCounter} FPS · AURORALIS & DATA TREES`, w - 24, 42);
  hudCtx.textAlign = 'left';

  // 3. Right Stack Panel 1: Hacker Diagnostic Terminal Logs
  const termX = rightX, termY = 56, termW = panelW, termH = 190;
  if (userSettings.showTerminal) {
    hudCtx.fillStyle = 'rgba(4, 8, 16, 0.80)';
    hudCtx.fillRect(termX, termY, termW, termH);

    hudCtx.strokeStyle = borderCol;
    hudCtx.lineWidth = 1;
    hudCtx.strokeRect(termX, termY, termW, termH);

    hudCtx.fillStyle = isAnomaly ? 'rgba(255, 0, 60, 0.25)' : 'rgba(125, 85, 217, 0.2)';
    hudCtx.fillRect(termX, termY, termW, 22);

    hudCtx.font = 'bold 10px "DM Mono", monospace';
    hudCtx.fillStyle = isAnomaly ? '#ffffff' : '#d9aa58';
    hudCtx.fillText('┌ TERMINAL // SAORI-NEURAL-DAEMON ┐', termX + 10, termY + 15);

    const blink = Math.sin(time * 4) > 0;
    hudCtx.fillStyle = isAnomaly ? '#ff003c' : (blink ? '#22c55e' : '#15803d');
    hudCtx.fillRect(termX + termW - 18, termY + 7, 7, 7);

    hudCtx.font = '10px "DM Mono", monospace';
    let lineY = termY + 38;
    for (const log of liveTerminalLogs) {
      hudCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      hudCtx.fillText(log.time, termX + 10, lineY);

      hudCtx.fillStyle = isAnomaly ? '#ff003c' : (log.color || '#00f0ff');
      hudCtx.fillText(`[${log.tag}]`, termX + 75, lineY);

      hudCtx.fillStyle = 'rgba(230, 238, 255, 0.88)';
      const maxChars = 40;
      const text = log.text.length > maxChars ? log.text.substring(0, maxChars - 3) + '...' : log.text;
      hudCtx.fillText(text, termX + 140, lineY);

      lineY += 17.0;
    }
  }

  // 4 & 5. Right Stack Middle Row: Telemetry (Left) + ASCII Reactor (Right) Side-By-Side
  const midY = termY + termH + 10;
  const midH = 195;
  const diagW = 205;
  const diagX = rightX;
  const ascW = 205;
  const ascX = rightX + 215;

  if (userSettings.showTelemetry) {
    hudCtx.fillStyle = 'rgba(4, 8, 16, 0.80)';
    hudCtx.fillRect(diagX, midY, diagW, midH);

    hudCtx.strokeStyle = borderCol;
    hudCtx.lineWidth = 1;
    hudCtx.strokeRect(diagX, midY, diagW, midH);

    hudCtx.fillStyle = isAnomaly ? 'rgba(255, 0, 60, 0.25)' : 'rgba(125, 85, 217, 0.2)';
    hudCtx.fillRect(diagX, midY, diagW, 22);

    hudCtx.font = 'bold 10px "DM Mono", monospace';
    hudCtx.fillStyle = isAnomaly ? '#ffffff' : '#d9aa58';
    hudCtx.fillText('┌ TELEMETRY // FLUX ┐', diagX + 10, midY + 15);

    const drawMeter = (label, val, y, color) => {
      hudCtx.font = '10px "DM Mono", monospace';
      hudCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      hudCtx.fillText(label, diagX + 10, y);

      const barBgW = 95, barH = 6;
      const barX = diagX + 50;
      hudCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      hudCtx.fillRect(barX, y - 7, barBgW, barH);

      const fillW = Math.min(barBgW, Math.max(0, val * 35));
      hudCtx.fillStyle = isAnomaly ? '#ff003c' : color;
      hudCtx.fillRect(barX, y - 7, fillW, barH);

      const db = (val * 5.0 - 2.5).toFixed(1);
      hudCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      hudCtx.fillText(`${db > 0 ? '+' : ''}${db}dB`, diagX + 152, y);
    };

    drawMeter('BASS', smoothBass, midY + 42, '#ff2a85');
    drawMeter('MID', smoothMid, midY + 59, '#00f0ff');
    drawMeter('TREB', smoothTreble, midY + 76, '#ffd24d');

    hudCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    hudCtx.beginPath();
    hudCtx.moveTo(diagX + 10, midY + 90);
    hudCtx.lineTo(diagX + diagW - 10, midY + 90);
    hudCtx.stroke();

    const neuralLoad = Math.min(99, Math.floor(45 + smoothBass * 35 + smoothMid * 20));
    hudCtx.font = '9.5px "DM Mono", monospace';
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    hudCtx.fillText('NEURAL LOAD:', diagX + 10, midY + 108);
    hudCtx.fillStyle = neuralLoad > 85 ? '#ff3344' : '#22c55e';
    hudCtx.fillText(`${neuralLoad}% [NOM]`, diagX + 102, midY + 108);

    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    hudCtx.fillText('OFF-HEAP FFM:', diagX + 10, midY + 124);
    hudCtx.fillStyle = '#ffd24d';
    hudCtx.fillText('8,192 MB', diagX + 102, midY + 124);

    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    hudCtx.fillText('DOCKER FLEET:', diagX + 10, midY + 140);
    hudCtx.fillStyle = '#00f0ff';
    hudCtx.fillText('17 NODES', diagX + 102, midY + 140);

    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    hudCtx.fillText('BLACKWALL ICE:', diagX + 10, midY + 156);
    hudCtx.fillStyle = isRogue ? '#ff0038' : (isAnomaly ? '#ff003c' : '#22c55e');
    hudCtx.fillText(isRogue ? 'BREACHED' : (isAnomaly ? 'CONFINED' : 'PASSIVE'), diagX + 102, midY + 156);

    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    hudCtx.fillText('THEME:', diagX + 10, midY + 172);
    hudCtx.fillStyle = '#b77cff';
    hudCtx.fillText(currentTheme.name.substring(0, 12), diagX + 102, midY + 172);
  }

  // Right Half: ASCII Matrix Reactor & Radar
  if (userSettings.showAsciiPanel) {
    hudCtx.fillStyle = 'rgba(4, 8, 16, 0.80)';
    hudCtx.fillRect(ascX, midY, ascW, midH);

    hudCtx.strokeStyle = borderCol;
    hudCtx.lineWidth = 1;
    hudCtx.strokeRect(ascX, midY, ascW, midH);

    hudCtx.fillStyle = 'rgba(125, 85, 217, 0.2)';
    hudCtx.fillRect(ascX, midY, ascW, 22);

    hudCtx.font = 'bold 10px "DM Mono", monospace';
    hudCtx.fillStyle = '#d9aa58';
    hudCtx.fillText('┌ NEURAL DATA TREE // RADAR ┐', ascX + 8, midY + 15);

    // Dynamic ASCII Bar Columns (10 bands)
    const cols = 10;
    const colStep = (ascW - 20) / cols;
    hudCtx.font = '10px "DM Mono", monospace';

    for (let c = 0; c < cols; c++) {
      const freqIdx = Math.floor(c * 6);
      const val = audioHistory[freqIdx] || 0;
      const heightInChars = Math.min(5, Math.floor(val * 5.8));
      const cx = ascX + 10 + c * colStep;

      for (let r = 0; r < 5; r++) {
        const cy = midY + 104 - r * 13;
        const char = r <= heightInChars ? (r === heightInChars ? '▓' : '█') : '·';

        hudCtx.fillStyle = c < 3
          ? `rgba(255, 42, 133, ${0.45 + val * 0.55})`
          : c < 7
          ? `rgba(0, 240, 255, ${0.45 + val * 0.55})`
          : `rgba(255, 210, 77, ${0.45 + val * 0.55})`;

        hudCtx.fillText(char, cx, cy);
      }
    }

    // ASCII Rotating Gyro Radar Scanner
    const radarGlyph = RADAR_GLYPHS[Math.floor(time * 8) % RADAR_GLYPHS.length];
    hudCtx.font = '9.5px "DM Mono", monospace';
    hudCtx.fillStyle = '#00f0ff';
    hudCtx.fillText(`[SYNAPSE] ${treeCount} DATA TREES · 64 DENDRITES`, ascX + 10, midY + 138);

    hudCtx.fillStyle = '#ffd24d';
    hudCtx.fillText(`[NEURONS] 134,668 PERCEPTRONS · ACTIVE`, ascX + 10, midY + 156);

    hudCtx.fillStyle = '#22c55e';
    hudCtx.fillText(`[ORBIT] NEURAL SYNC · GYRO OK`, ascX + 10, midY + 174);
  }

  // 6. Right Stack Panel 3: Cyberpunk Now Playing Media Widget
  const medW = panelW, medH = 76;
  const medX = rightX;
  const medY = midY + midH + 10;

  if (userSettings.showMediaWidget) {
    hudCtx.fillStyle = 'rgba(4, 8, 16, 0.80)';
    hudCtx.fillRect(medX, medY, medW, medH);

    hudCtx.strokeStyle = borderCol;
    hudCtx.lineWidth = 1;
    hudCtx.strokeRect(medX, medY, medW, medH);

    const thumbSize = 52;
    const thumbX = medX + 12, thumbY = medY + 12;

    if (mediaState.thumbnailImg) {
      hudCtx.drawImage(mediaState.thumbnailImg, thumbX, thumbY, thumbSize, thumbSize);
    } else {
      hudCtx.fillStyle = 'rgba(125, 85, 217, 0.25)';
      hudCtx.fillRect(thumbX, thumbY, thumbSize, thumbSize);
      hudCtx.strokeStyle = '#d9aa58';
      hudCtx.strokeRect(thumbX, thumbY, thumbSize, thumbSize);

      hudCtx.save();
      hudCtx.translate(thumbX + thumbSize / 2, thumbY + thumbSize / 2);
      hudCtx.rotate(time * 2.5);
      hudCtx.beginPath();
      hudCtx.arc(0, 0, 16, 0, Math.PI * 2);
      hudCtx.strokeStyle = '#00f0ff';
      hudCtx.stroke();
      hudCtx.beginPath();
      hudCtx.arc(0, 0, 5, 0, Math.PI * 2);
      hudCtx.fillStyle = '#ff2a85';
      hudCtx.fill();
      hudCtx.restore();
    }

    const textX = thumbX + thumbSize + 14;
    const hasMedia = mediaState.title && mediaState.title.length > 0;

    hudCtx.font = 'bold 9px "DM Mono", monospace';
    hudCtx.fillStyle = hasMedia ? '#22c55e' : 'rgba(255, 255, 255, 0.45)';
    hudCtx.fillText(hasMedia ? '● NOW PLAYING // AUDIO DECK' : '● MEDIA DECK // STANDBY', textX, medY + 22);

    hudCtx.font = 'bold 12px "DM Mono", monospace';
    hudCtx.fillStyle = '#ffffff';
    const displayTitle = hasMedia ? mediaState.title : 'SAORI AUDIO ENGINE · WASAPI 48kHz';
    const maxTitleLen = 32;
    hudCtx.fillText(displayTitle.length > maxTitleLen ? displayTitle.substring(0, maxTitleLen - 3) + '...' : displayTitle, textX, medY + 39);

    hudCtx.font = '10px "DM Mono", monospace';
    hudCtx.fillStyle = 'rgba(217, 170, 88, 0.9)';
    const displayArtist = hasMedia ? (mediaState.artist || 'Desconocido') : 'Active Frequency Responsive Protocol';
    hudCtx.fillText(displayArtist.length > 36 ? displayArtist.substring(0, 33) + '...' : displayArtist, textX, medY + 54);

    if (mediaState.duration > 0) {
      const progW = 320, progH = 3;
      const progX = textX, progY = medY + 63;
      const progFrac = Math.min(1.0, mediaState.position / mediaState.duration);

      hudCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      hudCtx.fillRect(progX, progY, progW, progH);

      hudCtx.fillStyle = '#00f0ff';
      hudCtx.fillRect(progX, progY, progW * progFrac, progH);
    }
  }

  // 6B. Right Stack Panel 4: Cyberpunk System Chrono, Telemetry & JackStar Root Deck
  if (userSettings.showSystemDeck) {
    const sysX = rightX;
    const sysY = userSettings.showMediaWidget ? (medY + medH + 10) : (midY + midH + 10);
    const sysW = panelW;
    const sysH = 158;

    hudCtx.fillStyle = 'rgba(4, 8, 16, 0.82)';
    hudCtx.fillRect(sysX, sysY, sysW, sysH);

    hudCtx.strokeStyle = borderCol;
    hudCtx.lineWidth = 1;
    hudCtx.strokeRect(sysX, sysY, sysW, sysH);

    // Top Banner
    hudCtx.fillStyle = 'rgba(125, 85, 217, 0.22)';
    hudCtx.fillRect(sysX, sysY, sysW, 22);

    hudCtx.font = 'bold 10px "DM Mono", monospace';
    hudCtx.fillStyle = '#d9aa58';
    hudCtx.textAlign = 'left';
    hudCtx.fillText('┌ SYSTEM // ROOT DECK · TELEMETRY ┐', sysX + 10, sysY + 15);

    // Root Badge
    hudCtx.textAlign = 'right';
    hudCtx.fillStyle = '#00f0ff';
    hudCtx.fillText('OPERATOR: JackStar ★', sysX + sysW - 10, sysY + 15);
    hudCtx.textAlign = 'left';

    // 1. Digital Clock & Date Row
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeFull = `${hours}:${minutes}:${seconds}`;

    // Large Bold Digital Clock
    hudCtx.font = 'bold 18px "DM Mono", monospace';
    hudCtx.fillStyle = '#00f0ff';
    hudCtx.fillText(`[ ${timeFull} ]`, sysX + 10, sysY + 45);

    hudCtx.font = '10px "DM Mono", monospace';
    hudCtx.fillStyle = '#ffffff';
    hudCtx.fillText('UTC-3 · CHILE / DALLAS SYNC', sysX + 140, sysY + 39);

    hudCtx.font = '9px "DM Mono", monospace';
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const dayName = dayNames[now.getDay()];
    const dateFormatted = `${dayName} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    hudCtx.fillText(`${dateFormatted} · UPTIME: 24/7 · QUANTUM TICK`, sysX + 140, sysY + 52);

    // Divider Line
    hudCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    hudCtx.beginPath();
    hudCtx.moveTo(sysX + 10, sysY + 62);
    hudCtx.lineTo(sysX + sysW - 10, sysY + 62);
    hudCtx.stroke();

    // 2. System Hardware Metrics (CPU, RAM, Neural Shaders)
    const dynCpu = (9.2 + smoothBass * 18.0 + smoothMid * 8.5).toFixed(1);
    hudCtx.font = '10px "DM Mono", monospace';
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    hudCtx.fillText('CPU LOAD:', sysX + 10, sysY + 78);

    // CPU mini bar
    const cpuBarX = sysX + 76, cpuBarW = 75, cpuBarH = 6;
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    hudCtx.fillRect(cpuBarX, sysY + 70, cpuBarW, cpuBarH);
    const cpuFill = Math.min(cpuBarW, (parseFloat(dynCpu) / 100) * cpuBarW * 2.8);
    hudCtx.fillStyle = dynCpu > 35 ? '#ff2a85' : '#00f0ff';
    hudCtx.fillRect(cpuBarX, sysY + 70, cpuFill, cpuBarH);

    hudCtx.fillStyle = '#00f0ff';
    hudCtx.fillText(`${dynCpu}%`, sysX + 158, sysY + 78);

    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    hudCtx.fillText('RAM DIRECT:', sysX + 215, sysY + 78);
    hudCtx.fillStyle = '#ffd24d';
    hudCtx.fillText('8,192 MB FFM', sysX + 295, sysY + 78);

    // 3. Process Engine & Thread Status
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    hudCtx.fillText('TASKS / FLEET:', sysX + 10, sysY + 96);
    hudCtx.fillStyle = '#22c55e';
    hudCtx.fillText('17 DOCKERS · 4 DAEMONS [CEF 60 FPS]', sysX + 105, sysY + 96);

    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    hudCtx.fillText('GPU SHADERS:', sysX + 10, sysY + 114);
    hudCtx.fillStyle = '#b77cff';
    hudCtx.fillText('WEBGL2 PARALLEL (134k NODES · 8 TREES)', sysX + 105, sysY + 114);

    // Divider Line
    hudCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    hudCtx.beginPath();
    hudCtx.moveTo(sysX + 10, sysY + 122);
    hudCtx.lineTo(sysX + sysW - 10, sysY + 122);
    hudCtx.stroke();

    // 4. JackStar, DrakesCraft, Star & SAORI Easter Eggs Ticker
    const eggIdx = Math.floor(time / 4.0) % EASTER_EGGS.length;
    const currentEgg = EASTER_EGGS[eggIdx];

    hudCtx.font = 'bold 9.5px "DM Mono", monospace';
    hudCtx.fillStyle = currentEgg.color;
    hudCtx.fillText(`[${currentEgg.tag}]`, sysX + 10, sysY + 138);

    hudCtx.font = '9.5px "DM Mono", monospace';
    hudCtx.fillStyle = '#e6eeff';
    hudCtx.fillText(currentEgg.text, sysX + 85, sysY + 138);

    // Bottom secondary node status
    hudCtx.font = '9px "DM Mono", monospace';
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.40)';
    hudCtx.fillText('NODE: star-vps // HOST: ccg-fisico // SAORI CORE v3.8 · ACTIVE', sysX + 10, sysY + 150);
  }

  // 7. Live Oscilloscope Sinusoidal Waveform Line
  if (userSettings.showOscilloscope) {
    const oscY = h - 110;
    const oscW = Math.min(840, w - 80);
    const oscX = (w - oscW) / 2;

    hudCtx.save();
    hudCtx.beginPath();
    hudCtx.strokeStyle = isAnomaly ? 'rgba(255, 0, 60, 0.85)' : 'rgba(0, 240, 255, 0.85)';
    hudCtx.lineWidth = 2.0;

    const points = 160;
    for (let p = 0; p <= points; p++) {
      const frac = p / points;
      const px = oscX + frac * oscW;

      const freqIdx = Math.min(63, Math.floor(Math.pow(frac, 1.35) * 64));
      const amp = (audioHistory[freqIdx] || 0) * 36.0;

      const wave1 = Math.sin(frac * 18.0 + time * 6.5) * amp;
      const wave2 = Math.sin(frac * 36.0 - time * 9.5) * (amp * 0.45);
      const waveBass = Math.cos(frac * 6.0 + time * 3.5) * (smoothBass * 16.0);

      const py = oscY + wave1 + wave2 + waveBass;

      if (p === 0) hudCtx.moveTo(px, py);
      else hudCtx.lineTo(px, py);
    }
    hudCtx.stroke();

    // Ghost Reflection Wave
    hudCtx.beginPath();
    hudCtx.strokeStyle = 'rgba(125, 85, 217, 0.38)';
    hudCtx.lineWidth = 1.0;
    for (let p = 0; p <= points; p++) {
      const frac = p / points;
      const px = oscX + frac * oscW;
      const freqIdx = Math.min(63, Math.floor(Math.pow(1.0 - frac, 1.35) * 64));
      const amp = (audioHistory[freqIdx] || 0) * 24.0;
      const wave = Math.sin(frac * 24.0 + time * 4.5) * amp;
      const py = oscY + wave;
      if (p === 0) hudCtx.moveTo(px, py);
      else hudCtx.lineTo(px, py);
    }
    hudCtx.stroke();
    hudCtx.restore();

    // High-Resolution ASCII Braille Waveform (Directly Under Oscilloscope)
    const brailleChars = 48;
    const brailleStep = oscW / brailleChars;
    hudCtx.font = '12px "DM Mono", monospace';
    hudCtx.textAlign = 'center';
    for (let b = 0; b < brailleChars; b++) {
      const frac = b / brailleChars;
      const freqIdx = Math.min(63, Math.floor(Math.pow(frac, 1.25) * 64));
      const val = audioHistory[freqIdx] || 0;
      const glyphIdx = Math.min(BRAILLE_WAVE.length - 1, Math.floor(val * (BRAILLE_WAVE.length - 1)));
      const glyph = BRAILLE_WAVE[glyphIdx];

      hudCtx.fillStyle = isAnomaly
        ? '#ff003c'
        : frac < 0.25
        ? `rgba(255, 42, 133, ${0.4 + val * 0.6})`
        : `rgba(0, 240, 255, ${0.4 + val * 0.6})`;

      hudCtx.fillText(glyph, oscX + b * brailleStep, oscY - 24);
    }
    hudCtx.textAlign = 'left';
  }

  // 8. Bottom Center Spectrum Equalizer with Peak-Hold Caps
  if (userSettings.showTelemetry) {
    const barCount = 48;
    const barWidth = 6;
    const gap = 3;
    const totalW = barCount * (barWidth + gap);
    const startX = (w - totalW) / 2;
    const bottomY = h - 38;
    const maxBarH = 65;

    for (let i = 0; i < barCount; i++) {
      const val = audioHistory[i] || 0;
      const barHeight = Math.max(2, Math.min(maxBarH, val * maxBarH * 1.35));
      const bx = startX + i * (barWidth + gap);

      const isBass = i < 8;
      const isMid = i >= 8 && i < 28;
      hudCtx.fillStyle = isAnomaly
        ? `rgba(255, 0, 60, ${0.5 + val * 0.5})`
        : isBass
        ? `rgba(217, 170, 88, ${0.45 + val * 0.55})`
        : isMid
        ? `rgba(125, 85, 217, ${0.45 + val * 0.55})`
        : `rgba(0, 240, 255, ${0.45 + val * 0.55})`;

      hudCtx.fillRect(bx, bottomY - barHeight, barWidth, barHeight);

      const capY = bottomY - Math.min(maxBarH + 4, peakCaps[i] * maxBarH * 1.35);
      hudCtx.fillStyle = isAnomaly ? '#ffffff' : (isBass ? '#ffd24d' : '#ffffff');
      hudCtx.fillRect(bx, capY - 2, barWidth, 2);
    }

    hudCtx.font = '9px "DM Mono", monospace';
    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    hudCtx.textAlign = 'center';
    hudCtx.fillText('20Hz        60Hz        250Hz        1kHz        4kHz        16kHz', w / 2, bottomY + 16);

    if (shockwaveActive || isAnomaly) {
      hudCtx.font = 'bold 10px "DM Mono", monospace';
      hudCtx.fillStyle = isAnomaly ? '#ff003c' : '#ff2a85';
      hudCtx.fillText(isAnomaly ? '◀ BLACKWALL QUANTUM TRANSIENT ACTIVE ▶' : '◀ BEAT RESONANCE // SHOCKWAVE DISPATCHED ▶', w / 2, bottomY - maxBarH - 12);
    }

    hudCtx.textAlign = 'left';
  }

  // 9. Blackwall Glitch Chromatic Slice Effect
  if ((glitchTimer > 0 || isAnomaly) && userSettings.blackwallFx) {
    const sliceCount = isAnomaly ? 6 : 3;
    for (let s = 0; s < sliceCount; s++) {
      const sy = Math.random() * h;
      const sh = 4 + Math.random() * 16;
      hudCtx.fillStyle = s % 2 === 0 ? 'rgba(255, 0, 60, 0.35)' : 'rgba(0, 240, 255, 0.30)';
      hudCtx.fillRect(0, sy, w, sh);
    }
  }
}

// Start Animation Loop
animate();
