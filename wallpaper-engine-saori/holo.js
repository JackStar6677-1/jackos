// SAORI // JARVIS NEURAL CORE - AUDIO REACTIVE SHADERS & HOLOGRAM ENGINE
// High-performance GPU DataTexture points & instanced edges with dynamic audio reactivity.
import * as THREE from 'three';

const K_POS = 1.15 / 30000;
const TEXW = 2048;

export async function cargarDataset(base) {
  const get = async (f, t) => {
    const r = await fetch(`${base}/${f}`);
    if (!r.ok) throw new Error(`${f}: ${r.status}`);
    return t === 'json' ? await r.json() : await r.arrayBuffer();
  };
  const [meta, pos, nodes, edges, kinds] = await Promise.all([
    get('meta.json', 'json'), get('pos.bin'), get('nodes.bin'), get('edges.bin'), get('kinds.bin')
  ]);
  const n = meta.n, m = meta.m;
  const p16 = new Int16Array(pos);
  const J = new Float32Array(n * 3), U = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    J[i] = p16[i] * K_POS;
    U[i] = p16[n * 3 + i] * K_POS;
  }
  const nd = new Uint16Array(nodes);
  const ds = { base, meta, n, m, J, U, nd, edges: new Uint32Array(edges), kinds: new Uint8Array(kinds), labels: null };
  ds.proj = (i) => nd[i * 4];
  ds.tipo = (i) => nd[i * 4 + 1];
  ds.com = (i) => nd[i * 4 + 2];
  ds.deg = (i) => nd[i * 4 + 3];

  let maxd = 1;
  for (let i = 0; i < n; i++) maxd = Math.max(maxd, nd[i * 4 + 3]);
  ds.maxdeg = maxd;
  ds.ncross = meta.ncruzadas || 0;
  ds.nintra = m - ds.ncross;

  ds.bridge = new Uint8Array(n);
  for (let e = ds.nintra; e < m; e++) {
    ds.bridge[ds.edges[2 * e]] = 1;
    ds.bridge[ds.edges[2 * e + 1]] = 1;
  }
  return ds;
}

const COMMON = /* glsl */`
precision highp float;
precision highp sampler2D;

uniform sampler2D tJ, tU, tM, tP;
uniform float uMix, uScale, uTexW, uTime, uDim, uSelOn, uCore, uOnlyBridge;
uniform float uSizeK, uGain, uPx, uTypeMask, uComm, uProjMix, uCommMix, uNodeLim;
uniform float uAudioBass, uAudioMid, uAudioTreble, uShockwave;
uniform float uRage, uSpikeIntensity, uBreathing;
uniform vec3 uCP[8];
uniform vec3 uBase;
uniform vec3 uCoreColor;

vec4 pInfo(float p){ return texelFetch(tP, ivec2(int(p), 0), 0); }
ivec2 tcI(float i){ return ivec2(int(mod(i, uTexW)), int(i / uTexW)); }
vec3 nPos(float i){
  ivec2 c = tcI(i);
  return mix(texelFetch(tJ, c, 0).xyz, texelFetch(tU, c, 0).xyz, uMix) * uScale;
}
vec4 nMeta(float i){ return texelFetch(tM, tcI(i), 0); }
float hash(float x){ return fract(sin(x * 12.9898) * 43758.5453); }

float visOf(vec4 m, float i){
  float ty = mod(m.a, 16.);
  float br = mod(floor(m.a / 16.), 2.);
  float cm = floor(m.a / 32.);
  float v = pInfo(m.r).a * step(i, uNodeLim);
  v *= mod(floor(uTypeMask / exp2(ty)), 2.);
  if (uComm >= 0.) v *= step(abs(cm - uComm), 0.5);
  v *= step(uCore, m.g);
  v *= max(1. - uOnlyBridge, br);
  return v;
}

vec3 nCol(vec4 m){
  float cm = floor(m.a / 32.);
  vec3 c = mix(uBase, pInfo(m.r).rgb, uProjMix);
  return mix(c, uCP[int(mod(cm, 8.))], uCommMix);
}
`;

const NODE_VS = COMMON + /* glsl */`
varying vec3 vC;

void main(){
  float i = position.x;
  vec4 m = nMeta(i);
  float v = visOf(m, i);
  vec3 pos = nPos(i);

  // Pure radial breathing (active only when breathing option is enabled)
  float r = length(pos);
  if (uBreathing > 0.5) {
    pos *= 1.0 + (uAudioBass * 0.08 * sin(r * 0.05 - uTime * 2.0));
  }

  // Controlled Electric Needles / Rogue Spikes:
  // Triggers ONLY during heavy bass kicks (bass > 0.65) or AI rage (uRage > 0.05)
  // and ONLY for ~3.5% of outer surface nodes so the sphere NEVER breaks or turns into a sun
  float combRage = uRage + uSpikeIntensity;
  if (combRage > 0.05 || uAudioBass > 0.65) {
    float h = hash(i * 2.718 + floor(uTime * 14.0) * 0.1);
    if (h > 0.965) {
      float reach = (uAudioBass * 16.0 + combRage * 28.0);
      pos += normalize(pos + vec3(1e-4)) * reach;
    }
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = v > 0.5 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);

  float st = m.b;
  float dg = m.g;
  // Refined point size: crisp, high-contrast perceptron somas so the sphere remains transparent
  float sz = (0.75 + dg * dg * 3.5 + (st > 1.5 ? 3.5 : 0.0) + (st > 0.5 ? 1.2 : 0.0)) * uSizeK;

  // Bass scale reactivity (clean and controlled)
  sz *= 1.0 + uAudioBass * 0.25;

  // Expanding shockwave ring impact
  if (uShockwave > 0.0) {
    float swDist = abs(r - uShockwave);
    float swPulse = exp(-swDist * swDist * 0.02);
    sz += swPulse * 2.5;
  }

  // Clamped point size prevents hub nodes from overlapping into a solid white blur
  gl_PointSize = clamp(sz * uPx / max(-mv.z, 1.0), 1.0, 22.0);

  vec3 c = nCol(m);
  // Elegant node brightness: preserves individual node distinction and inner lattice visibility
  float br = 0.18 + dg * 0.28;
  br *= uSelOn > 0.5 ? (st > 0.5 ? 1.8 : uDim) : 1.0;
  br *= 0.88 + 0.12 * sin(uTime * 2.5 + i * 1.37);

  // Attenuate dense central cluster so thousands of overlapping nodes don't sum to pure white
  float centerDist = length(pos);
  float coreAttenuation = clamp(centerDist / 38.0, 0.20, 1.0);
  br *= coreAttenuation;

  // Audio brightness amplification (clean, preserves neural contrast)
  br *= 1.0 + uAudioBass * 0.40 + uAudioTreble * 0.18;

  if (uShockwave > 0.0) {
    float swDist = abs(r - uShockwave);
    br += exp(-swDist * swDist * 0.02) * 0.8;
  }

  // Preserve vivid core colors (purple, gold, cyan) without bleaching to pure white
  c = mix(c, vec3(1.0), clamp(dg * dg * 0.08, 0.0, 0.12));
  vC = c * br * uGain * 0.32;
}
`;

const NODE_FS = /* glsl */`
precision highp float;
varying vec3 vC;

void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  // Crisp neural perceptron: sharp electric firing nucleus + fast falloff (prevents additive whiteout)
  float a = exp(-d * d * 7.5) * 0.65 + exp(-d * d * 28.0) * 0.35;
  gl_FragColor = vec4(vC * a, a * 0.85);
}
`;

const EDGE_VS = COMMON + /* glsl */`
attribute float aA;
attribute float aB;
uniform float uBow, uEdgeA, uDashF;
varying vec3 vC;
varying float vDash, vDuty, vBase;

void main(){
  float t = position.x;
  vec3 pa = nPos(aA);
  vec3 pb = nPos(aB);
  vec4 ma = nMeta(aA);
  vec4 mb = nMeta(aB);
  float v = visOf(ma, aA) * visOf(mb, aB);

  // Synchronous radial breathing strictly matching node positions
  if (uBreathing > 0.5) {
    pa *= 1.0 + (uAudioBass * 0.08 * sin(length(pa) * 0.05 - uTime * 2.0));
    pb *= 1.0 + (uAudioBass * 0.08 * sin(length(pb) * 0.05 - uTime * 2.0));
  }

  vec3 p = mix(pa, pb, t);
  float len = distance(pa, pb);

  if (uBow > 0.0) {
    vec3 mid = (pa + pb) * 0.5;
    p += normalize(mid + vec3(1e-3, 0.0, 0.0)) * sin(3.14159 * t) * len * uBow * 0.3;
  }

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = v > 0.5 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);

  float hl = (ma.b > 0.5 && mb.b > 0.5) ? 1.0 : 0.0;
  float pth = (ma.b > 2.5 && mb.b > 2.5) ? 1.0 : 0.0;
  vec3 c = mix(nCol(ma), nCol(mb), t);
  float hubness = max(ma.g, mb.g);

  // Filaments: Synaptic connections clearly visible throughout the 3D interior!
  float br = uEdgeA * (1.20 - 0.70 * pow(hubness, 1.2)) * (uBow > 0.0 ? 1.5 : 1.0 / (1.0 + pow(len / (0.18 * uScale), 2.2)));
  if (uSelOn > 0.5) {
    br = hl > 0.5 ? 2.0 + pth * 1.8 : br * uDim * 0.4;
    c = mix(c, vec3(1.0), hl * 0.35 + pth * 0.35);
  }

  // Audio reactivity on filaments: Mid-frequencies illuminate synaptic connections
  br *= 1.0 + uAudioMid * 1.2 + uAudioBass * 0.4;

  vC = c * br * uGain * 0.65;
  float h1 = hash(aA * 3.17 + aB);
  float h2 = hash(aB * 1.91 + aA * 0.37);
  vDash = t * len * uDashF * (1.0 + uAudioMid * 0.4) + h1 * 40.0;
  vDuty = 0.16 + h2 * 0.38;
  vBase = (hl > 0.5 ? 0.80 : 0.04);
}
`;

const EDGE_FS = /* glsl */`
precision highp float;
varying vec3 vC;
varying float vDash, vDuty, vBase;

void main(){
  float f = fract(vDash);
  float m = f < vDuty ? 1.0 : vBase;
  if (m < 0.02) discard;
  gl_FragColor = vec4(vC * m, 1.0);
}
`;

const PULSE_VS = COMMON + /* glsl */`
attribute float aA;
attribute float aB;
attribute vec2 aS;
uniform float uBow;
varying vec3 vC;

void main(){
  vec4 ma = nMeta(aA);
  vec4 mb = nMeta(aB);
  float v = visOf(ma, aA) * visOf(mb, aB);

  // Audio reactivity: Speed up pulse traffic with mid/treble frequencies
  float speedBoost = 1.0 + uAudioMid * 1.5 + uAudioTreble * 0.5;
  float t = fract((uTime * aS.x * speedBoost) + aS.y);

  vec3 pa = nPos(aA);
  vec3 pb = nPos(aB);
  if (uBreathing > 0.5) {
    pa *= 1.0 + (uAudioBass * 0.08 * sin(length(pa) * 0.05 - uTime * 2.0));
    pb *= 1.0 + (uAudioBass * 0.08 * sin(length(pb) * 0.05 - uTime * 2.0));
  }
  vec3 p = mix(pa, pb, t);

  float bow = (ma.r != mb.r) ? uBow : 0.0;
  if (bow > 0.0) {
    vec3 mid = (pa + pb) * 0.5;
    p += normalize(mid + vec3(1e-3, 0.0, 0.0)) * sin(3.14159 * t) * distance(pa, pb) * bow * 0.3;
  }

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = v > 0.5 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);

  // Clean, crisp moving energy pulses inside the neural core
  float pSize = clamp(5.5 * uPx * 0.012 * uSizeK / max(-mv.z, 1.0) * 100.0, 2.0, 20.0);
  pSize *= 1.0 + uAudioBass * 0.4;
  gl_PointSize = pSize;

  float fade = sin(3.14159 * t);
  vC = mix(mix(nCol(ma), nCol(mb), t), vec3(1.0), 0.45) * (1.3 * fade) * (1.0 + uAudioMid * 1.1);
}
`;

const PULSE_FS = /* glsl */`
precision highp float;
varying vec3 vC;

void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = exp(-d * d * 6.0);
  gl_FragColor = vec4(vC * a, a);
}
`;

function mkTex(data, h) {
  const t = new THREE.DataTexture(data, TEXW, h, THREE.RGBAFormat, THREE.FloatType);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

export class Hologram {
  constructor(ds, opt = {}) {
    this.ds = ds;
    const n = ds.n;
    this.group = new THREE.Group();
    this.frac = { node: 1, edge: 1, cross: 1, pulse: 1 };

    const h = Math.ceil(n / TEXW);
    const tj = new Float32Array(TEXW * h * 4);
    const tu = new Float32Array(TEXW * h * 4);
    for (let i = 0; i < n; i++) {
      tj.set([ds.J[3 * i], ds.J[3 * i + 1], ds.J[3 * i + 2], 0], 4 * i);
      tu.set([ds.U[3 * i], ds.U[3 * i + 1], ds.U[3 * i + 2], 0], 4 * i);
    }

    this.meta = new Float32Array(TEXW * h * 4);
    const ln = Math.log1p(ds.maxdeg);
    for (let i = 0; i < n; i++) {
      const proj = ds.meta.colores ? ds.proj(i) : 0;
      this.meta.set([
        proj,
        Math.log1p(ds.deg(i)) / ln,
        0,
        ds.tipo(i) % 16 + 16 * ds.bridge[i] + 32 * Math.min(ds.com(i), 300)
      ], 4 * i);
    }
    this.tM = mkTex(this.meta, h);

    const cols = ds.meta.colores || [ds.meta.color || '#ffb000'];
    this.pdata = new Float32Array(256 * 4);
    for (let i = 0; i < 256; i++) {
      const c = new THREE.Color(cols[i % cols.length] || '#ffb000');
      this.pdata.set([c.r, c.g, c.b, 1], 4 * i);
    }
    this.tP = new THREE.DataTexture(this.pdata, 256, 1, THREE.RGBAFormat, THREE.FloatType);
    this.tP.minFilter = this.tP.magFilter = THREE.NearestFilter;
    this.tP.generateMipmaps = false;
    this.tP.needsUpdate = true;

    this.U = {
      tP: { value: this.tP },
      tJ: { value: mkTex(tj, h) },
      tU: { value: mkTex(tu, h) },
      tM: { value: this.tM },
      uMix: { value: opt.mix || 0 },
      uScale: { value: opt.scale || 100 },
      uTexW: { value: TEXW },
      uTime: { value: 0 },
      uDim: { value: 0.18 },
      uSelOn: { value: 0 },
      uCore: { value: 0 },
      uOnlyBridge: { value: 0 },
      uSizeK: { value: 0.18 },
      uGain: { value: 0.20 },
      uPx: { value: 600 },
      uTypeMask: { value: 65535 },
      uComm: { value: -1 },
      uProjMix: { value: 0.72 },
      uCommMix: { value: 0 },
      uNodeLim: { value: 1e9 },
      uCP: { value: Array.from({ length: 8 }, () => new THREE.Vector3(1, 1, 1)) },
      uBase: { value: new THREE.Vector3(1, 0.6, 0.1) },
      uCoreColor: { value: new THREE.Vector3(1, 0.8, 0.2) },
      uBow: { value: 0 },
      uEdgeA: { value: 0.38 },
      uDashF: { value: 0.28 },
      uAudioBass: { value: 0.0 },
      uAudioMid: { value: 0.0 },
      uAudioTreble: { value: 0.0 },
      uShockwave: { value: 0.0 },
      uRage: { value: 0.0 },
      uSpikeIntensity: { value: 0.0 },
      uBreathing: { value: 0.0 }
    };

    const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({
      uniforms: { ...this.U, ...extra },
      vertexShader: vs,
      fragmentShader: fs,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      ...(extra.__o || {})
    });

    // 1. Nodos
    const pg = new THREE.BufferGeometry();
    const pp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pp[3 * i] = i;
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    this.points = new THREE.Points(pg, mat(NODE_VS, NODE_FS));
    this.points.frustumCulled = false;

    // 2. Aristas
    const E = ds.edges;
    const mkEdges = (from, to, K, bow) => {
      const cnt = to - from;
      const g = new THREE.InstancedBufferGeometry();
      const base = new Float32Array(K * 2 * 3);
      for (let s = 0; s < K; s++) {
        base[(2 * s) * 3] = s / K;
        base[(2 * s + 1) * 3] = (s + 1) / K;
      }
      g.setAttribute('position', new THREE.BufferAttribute(base, 3));
      const A = new Float32Array(cnt), B = new Float32Array(cnt);
      for (let e = 0; e < cnt; e++) {
        A[e] = E[2 * (from + e)];
        B[e] = E[2 * (from + e) + 1];
      }
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 1));
      g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 1));
      g.instanceCount = cnt;
      const ls = new THREE.LineSegments(g, mat(EDGE_VS, EDGE_FS, { uBow: { value: bow } }));
      ls.frustumCulled = false;
      ls.userData = { cnt, A, B };
      return ls;
    };

    this.intra = mkEdges(0, ds.nintra, 1, 0);
    this.cross = ds.ncross ? mkEdges(ds.nintra, ds.m, 10, 1) : null;

    // 3. Pulsos de energía que viajan por las conexiones
    this.pulses = null;
    const np = ds.m < 40 ? 0 : Math.round(Math.min(1200, Math.max(120, ds.m / 280)));
    if (np > 20) {
      const g = new THREE.BufferGeometry();
      const A = new Float32Array(np), B = new Float32Array(np), S = new Float32Array(np * 2);
      const posn = new Float32Array(np * 3);
      for (let k = 0; k < np; k++) {
        let e;
        if (ds.ncross && Math.random() < 0.5) {
          e = ds.nintra + Math.floor(Math.random() * ds.ncross);
        } else {
          e = Math.floor(Math.pow(Math.random(), 2) * Math.max(ds.nintra, 1));
        }
        A[k] = E[2 * e];
        B[k] = E[2 * e + 1];
        S[2 * k] = 0.12 + Math.random() * 0.35;
        S[2 * k + 1] = Math.random();
      }
      g.setAttribute('position', new THREE.BufferAttribute(posn, 3));
      g.setAttribute('aA', new THREE.BufferAttribute(A, 1));
      g.setAttribute('aB', new THREE.BufferAttribute(B, 1));
      g.setAttribute('aS', new THREE.BufferAttribute(S, 2));
      this.pulses = new THREE.Points(g, mat(PULSE_VS, PULSE_FS, { uBow: { value: 1 } }));
      this.pulses.frustumCulled = false;
      this.pulses.userData = { cnt: np };
    }

    this.group.add(this.points, this.intra);
    if (this.cross) this.group.add(this.cross);
    if (this.pulses) this.group.add(this.pulses);

    this.baseGain = ds.meta.colores ? 0.36 : 0.44;
    this.baseEdge = ds.meta.colores ? 0.32 : 0.42;
    this.applyFrac();
  }

  setU(k, v) {
    for (const o of [this.points, this.intra, this.cross, this.pulses]) {
      if (o && o.material.uniforms[k]) o.material.uniforms[k].value = v;
    }
    this.U[k].value = v;
  }

  getU(k) { return this.U[k].value; }

  setFrac(f) {
    Object.assign(this.frac, f);
    this.applyFrac();
  }

  applyFrac() {
    const ds = this.ds, lim = Math.floor(ds.n * this.frac.node);
    this.setU('uNodeLim', lim);
    this.points.geometry.setDrawRange(0, lim);
    const prefix = (A, B, cnt) => {
      let lo = 0, hi = cnt;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (Math.max(A[mid], B[mid]) < lim) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    };
    const ia = this.intra.userData;
    this.intra.geometry.instanceCount = Math.floor(prefix(ia.A, ia.B, ia.cnt) * this.frac.edge);
    if (this.cross) {
      const ca = this.cross.userData;
      this.cross.geometry.instanceCount = Math.floor(prefix(ca.A, ca.B, ca.cnt) * this.frac.cross);
    }
  }

  updateAudio(bass, mid, treble, shockwave = 0.0, rage = 0.0, spike = 0.0, breathing = false) {
    this.setU('uAudioBass', Number.isFinite(bass) ? bass : 0.0);
    this.setU('uAudioMid', Number.isFinite(mid) ? mid : 0.0);
    this.setU('uAudioTreble', Number.isFinite(treble) ? treble : 0.0);
    this.setU('uShockwave', Number.isFinite(shockwave) ? shockwave : 0.0);
    this.setU('uRage', Number.isFinite(rage) ? rage : 0.0);
    this.setU('uSpikeIntensity', Number.isFinite(spike) ? spike : 0.0);
    this.setU('uBreathing', breathing ? 1.0 : 0.0);
  }
}
