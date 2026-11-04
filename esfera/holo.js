// Nucleo grafico: carga de datos + Hologram (Points + LineSegments instanciados + pulsos), todo en GPU.
// Posiciones en DataTexture (layout JARVIS y ULTRON) -> morph por uniform uMix.
import * as THREE from 'three';

const K_POS = 1.15 / 30000;
const TEXW = 2048;

export async function cargarDataset(base, onProg) {
  const get = async (f, t) => {
    const r = await fetch(`${base}/${f}`);
    if (!r.ok) throw new Error(`${f}: ${r.status}`);
    const v = t === 'json' ? await r.json() : await r.arrayBuffer();
    onProg && onProg(f);
    return v;
  };
  const [meta, pos, nodes, edges, kinds] = await Promise.all([
    get('meta.json', 'json'), get('pos.bin'), get('nodes.bin'), get('edges.bin'), get('kinds.bin')]);
  const n = meta.n, m = meta.m;
  const p16 = new Int16Array(pos);
  const J = new Float32Array(n * 3), U = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) { J[i] = p16[i] * K_POS; U[i] = p16[n * 3 + i] * K_POS; }
  const nd = new Uint16Array(nodes);
  const ds = { base, meta, n, m, J, U, nd, edges: new Uint32Array(edges), kinds: new Uint8Array(kinds), labels: null };
  ds.proj = (i) => nd[i * 4]; ds.tipo = (i) => nd[i * 4 + 1]; ds.com = (i) => nd[i * 4 + 2]; ds.deg = (i) => nd[i * 4 + 3];
  let maxd = 1; for (let i = 0; i < n; i++) maxd = Math.max(maxd, nd[i * 4 + 3]);
  ds.maxdeg = maxd;
  ds.ncross = meta.ncruzadas || 0;       // cruzadas al final del array de aristas
  ds.nintra = m - ds.ncross;
  // CSR de adyacencia
  const off = new Uint32Array(n + 1);
  for (let e = 0; e < m; e++) { off[ds.edges[2 * e] + 1]++; off[ds.edges[2 * e + 1] + 1]++; }
  for (let i = 0; i < n; i++) off[i + 1] += off[i];
  const cur = off.slice(0, n), adj = new Uint32Array(off[n]);
  for (let e = 0; e < m; e++) { const a = ds.edges[2 * e], b = ds.edges[2 * e + 1]; adj[cur[a]++] = b; adj[cur[b]++] = a; }
  ds.off = off; ds.adj = adj;
  // nodos puente
  ds.bridge = new Uint8Array(n);
  for (let e = ds.nintra; e < m; e++) { ds.bridge[ds.edges[2 * e]] = 1; ds.bridge[ds.edges[2 * e + 1]] = 1; }
  return ds;
}

export async function cargarEtiquetas(ds) {
  if (ds.labels) return ds.labels;
  const t = await (await fetch(`${ds.base}/labels.txt`)).text();
  const L = t.split('\n'), lab = new Array(ds.n), fi = new Uint32Array(ds.n);
  for (let i = 0; i < ds.n; i++) {
    const s = L[i] || ''; const k = s.lastIndexOf('\t');
    lab[i] = k < 0 ? s : s.slice(0, k); fi[i] = k < 0 ? 0 : +s.slice(k + 1);
  }
  ds.labels = lab; ds.fidx = fi; ds.low = lab.map((s) => s.toLowerCase());
  return lab;
}

const COMMON = /* glsl */`
precision highp float; precision highp sampler2D;
uniform sampler2D tJ, tU, tM;
uniform float uMix, uScale, uTexW, uTime, uDim, uSelOn, uCore, uOnlyBridge, uSizeK, uGain, uPx, uTypeMask, uComm, uProjMix, uCommMix, uNodeLim;
uniform sampler2D tP;
vec4 pInfo(float p){ return texelFetch(tP,ivec2(int(p),0),0); }
uniform vec3 uCP[8];
uniform vec3 uBase;
ivec2 tcI(float i){ return ivec2(int(mod(i,uTexW)), int(i/uTexW)); }
vec3 nPos(float i){ ivec2 c=tcI(i); return mix(texelFetch(tJ,c,0).xyz, texelFetch(tU,c,0).xyz, uMix)*uScale; }
vec4 nMeta(float i){ return texelFetch(tM,tcI(i),0); }
float hash(float x){ return fract(sin(x*12.9898)*43758.5453); }
float visOf(vec4 m, float i){
  float ty=mod(m.a,16.); float br=mod(floor(m.a/16.),2.); float cm=floor(m.a/32.);
  float v=pInfo(m.r).a*step(i,uNodeLim);
  v*=mod(floor(uTypeMask/exp2(ty)),2.);
  if(uComm>=0.) v*=step(abs(cm-uComm),.5);
  v*=step(uCore,m.g);
  v*=max(1.-uOnlyBridge,br);
  return v;
}
vec3 nCol(vec4 m){
  float cm=floor(m.a/32.);
  vec3 c=mix(uBase,pInfo(m.r).rgb,uProjMix);
  return mix(c,uCP[int(mod(cm,8.))],uCommMix);
}
`;

const NODE_VS = COMMON + /* glsl */`
varying vec3 vC;
void main(){
  float i=position.x; vec4 m=nMeta(i); float v=visOf(m,i);
  vec4 mv=modelViewMatrix*vec4(nPos(i),1.);
  gl_Position = v>.5 ? projectionMatrix*mv : vec4(2.,2.,2.,1.);
  float st=m.b, dg=m.g;
  float sz=(0.9+dg*dg*dg*8.+(st>1.5?9.:0.)+(st>.5?2.5:0.))*uSizeK;
  gl_PointSize=clamp(sz*uPx/max(-mv.z,1.),1.,64.);
  vec3 c=nCol(m);
  float br=0.55+dg*dg*1.6;
  br*= uSelOn>.5 ? (st>.5 ? 2.0 : uDim) : 1.;
  br*=0.82+0.18*sin(uTime*2.23123+i*1.37);
  c=mix(c,vec3(1.),clamp(dg*dg*dg*.9+(st>1.5?.9:0.)+(st>2.5?.5:0.),0.,1.));
  vC=c*br*uGain;
}`;
const NODE_FS = /* glsl */`
precision highp float; varying vec3 vC;
void main(){ float d=length(gl_PointCoord-.5)*2.; if(d>1.) discard;
  float a=exp(-d*d*5.)+exp(-d*d*38.)*.9; gl_FragColor=vec4(vC*a,a); }`;

const EDGE_VS = COMMON + /* glsl */`
attribute float aA; attribute float aB;
uniform float uBow, uEdgeA, uDashF;
varying vec3 vC; varying float vDash, vDuty, vBase;
void main(){
  float t=position.x;
  vec3 pa=nPos(aA), pb=nPos(aB); vec4 ma=nMeta(aA), mb=nMeta(aB);
  float v=visOf(ma,aA)*visOf(mb,aB);
  vec3 p=mix(pa,pb,t); float len=distance(pa,pb);
  if(uBow>0.){ vec3 mid=(pa+pb)*.5; p+=normalize(mid+vec3(1e-3,0.,0.))*sin(3.14159*t)*len*uBow*.3; }
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position = v>.5 ? projectionMatrix*mv : vec4(2.,2.,2.,1.);
  float hl=(ma.b>.5&&mb.b>.5)?1.:0.; float pth=(ma.b>2.5&&mb.b>2.5)?1.:0.;
  vec3 c=mix(nCol(ma),nCol(mb),t);
  float hubness=max(ma.g,mb.g);
  float br=uEdgeA*(1.25-.95*pow(hubness,1.2))*(uBow>0.?2.0:1./(1.+pow(len/(.3*uScale),1.6)));
  if(uSelOn>.5){ br = hl>.5 ? 2.2+pth*2. : br*uDim*.35; c=mix(c,vec3(1.),hl*.45+pth*.4); }
  vC=c*br*uGain;
  float h1=hash(aA*3.17+aB), h2=hash(aB*1.91+aA*.37);
  vDash=t*len*uDashF+h1*40.; vDuty=0.18+h2*0.5; vBase=(hl>.5?.8:0.05);
}`;
const EDGE_FS = /* glsl */`
precision highp float; varying vec3 vC; varying float vDash, vDuty, vBase;
void main(){ float f=fract(vDash); float m=f<vDuty?1.:vBase; if(m<.01) discard; gl_FragColor=vec4(vC*m,1.); }`;

const PULSE_VS = COMMON + /* glsl */`
attribute float aA; attribute float aB; attribute vec2 aS; uniform float uBow;
varying vec3 vC;
void main(){
  vec4 ma=nMeta(aA), mb=nMeta(aB);
  float v=visOf(ma,aA)*visOf(mb,aB);
  float t=fract(uTime*aS.x+aS.y);
  vec3 pa=nPos(aA), pb=nPos(aB);
  vec3 p=mix(pa,pb,t);
  float bow = (ma.r!=mb.r)?uBow:0.;
  if(bow>0.){ vec3 mid=(pa+pb)*.5; p+=normalize(mid+vec3(1e-3,0.,0.))*sin(3.14159*t)*distance(pa,pb)*bow*.3; }
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position = v>.5 ? projectionMatrix*mv : vec4(2.,2.,2.,1.);
  gl_PointSize=clamp(7.*uPx*0.012*uSizeK/max(-mv.z,1.)*100.,2.,26.);
  float fade=sin(3.14159*t);
  vC=mix(mix(nCol(ma),nCol(mb),t),vec3(1.),.6)*(.9*fade);
}`;
const PULSE_FS = NODE_FS;

function mkTex(data, h) {
  const t = new THREE.DataTexture(data, TEXW, h, THREE.RGBAFormat, THREE.FloatType);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
}

export class Hologram {
  constructor(ds, opt = {}) {
    this.ds = ds; const n = ds.n;
    this.group = new THREE.Group();
    this.frac = { node: 1, edge: 1, cross: 1, pulse: 1 };
    const h = Math.ceil(n / TEXW);
    const tj = new Float32Array(TEXW * h * 4), tu = new Float32Array(TEXW * h * 4);
    for (let i = 0; i < n; i++) {
      tj.set([ds.J[3 * i], ds.J[3 * i + 1], ds.J[3 * i + 2], 0], 4 * i);
      tu.set([ds.U[3 * i], ds.U[3 * i + 1], ds.U[3 * i + 2], 0], 4 * i);
    }
    this.meta = new Float32Array(TEXW * h * 4);
    const ln = Math.log1p(ds.maxdeg);
    for (let i = 0; i < n; i++) {
      const proj = ds.meta.colores ? ds.proj(i) : 0;
      this.meta.set([proj, Math.log1p(ds.deg(i)) / ln, 0, ds.tipo(i) % 16 + 16 * ds.bridge[i] + 32 * Math.min(ds.com(i), 300)], 4 * i);
    }
    this.tM = mkTex(this.meta, h);
    const cols = ds.meta.colores || [ds.meta.color];
    this.nproj = cols.length;
    this.pdata = new Float32Array(256 * 4);
    for (let i = 0; i < 256; i++) { const c = new THREE.Color(cols[i % cols.length] || '#ffb000'); this.pdata.set([c.r, c.g, c.b, 1], 4 * i); }
    this.tP = new THREE.DataTexture(this.pdata, 256, 1, THREE.RGBAFormat, THREE.FloatType);
    this.tP.minFilter = this.tP.magFilter = THREE.NearestFilter; this.tP.generateMipmaps = false; this.tP.needsUpdate = true;
    const vis = new Float32Array(256).fill(1);
    this.vis = vis;
    this.U = {
      tP: { value: this.tP }, tJ: { value: mkTex(tj, h) }, tU: { value: mkTex(tu, h) }, tM: { value: this.tM },
      uMix: { value: opt.mix || 0 }, uScale: { value: opt.scale || 100 }, uTexW: { value: TEXW }, uTime: { value: 0 },
      uDim: { value: .18 }, uSelOn: { value: 0 }, uCore: { value: 0 }, uOnlyBridge: { value: 0 }, uSizeK: { value: 1 }, uGain: { value: .5 },
      uPx: { value: 600 }, uTypeMask: { value: 65535 }, uComm: { value: -1 }, uProjMix: { value: .7 }, uCommMix: { value: 0 },
      uNodeLim: { value: 1e9 },
      uCP: { value: Array.from({ length: 8 }, () => new THREE.Vector3(1, 1, 1)) }, uBase: { value: new THREE.Vector3(1, .6, .1) },
      uBow: { value: 0 }, uEdgeA: { value: .3 }, uDashF: { value: .35 },
    };
    const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({
      uniforms: { ...this.U, ...extra }, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending, ...(extra.__o || {}) });
    // nodos
    const pg = new THREE.BufferGeometry(); const pp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pp[3 * i] = i;
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    this.points = new THREE.Points(pg, mat(NODE_VS, NODE_FS)); this.points.frustumCulled = false;
    // aristas
    const E = ds.edges;
    const mkEdges = (from, to, K, bow) => {
      const cnt = to - from; const g = new THREE.InstancedBufferGeometry();
      const base = new Float32Array(K * 2 * 3); for (let s = 0; s < K; s++) { base[(2 * s) * 3] = s / K; base[(2 * s + 1) * 3] = (s + 1) / K; }
      g.setAttribute('position', new THREE.BufferAttribute(base, 3));
      const A = new Float32Array(cnt), B = new Float32Array(cnt);
      for (let e = 0; e < cnt; e++) { A[e] = E[2 * (from + e)]; B[e] = E[2 * (from + e) + 1]; }
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 1)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 1));
      g.instanceCount = cnt;
      const ls = new THREE.LineSegments(g, mat(EDGE_VS, EDGE_FS, { uBow: { value: bow } })); ls.frustumCulled = false; ls.userData.cnt = cnt;
      ls.userData.A = A; ls.userData.B = B; return ls;
    };
    this.intra = mkEdges(0, ds.nintra, 1, 0);
    this.cross = ds.ncross ? mkEdges(ds.nintra, ds.m, 10, 1) : null;
    // pulsos
    this.pulses = null;
    const np = ds.m < 40 ? 0 : Math.round(Math.min(700, Math.max(60, ds.m / 350)));
    if (np > 20) {
      const g = new THREE.BufferGeometry(); const A = new Float32Array(np), B = new Float32Array(np), S = new Float32Array(np * 2);
      const posn = new Float32Array(np * 3);
      for (let k = 0; k < np; k++) {
        let e;
        if (ds.ncross && Math.random() < .5) e = ds.nintra + Math.floor(Math.random() * ds.ncross);
        else e = Math.floor(Math.pow(Math.random(), 2) * Math.max(ds.nintra, 1));
        A[k] = E[2 * e]; B[k] = E[2 * e + 1]; S[2 * k] = .08 + Math.random() * .22; S[2 * k + 1] = Math.random();
      }
      g.setAttribute('position', new THREE.BufferAttribute(posn, 3));
      g.setAttribute('aA', new THREE.BufferAttribute(A, 1)); g.setAttribute('aB', new THREE.BufferAttribute(B, 1)); g.setAttribute('aS', new THREE.BufferAttribute(S, 2));
      this.pulses = new THREE.Points(g, mat(PULSE_VS, PULSE_FS, { uBow: { value: 1 } })); this.pulses.frustumCulled = false; this.pulses.userData.cnt = np;
    }
    this.group.add(this.points, this.intra);
    if (this.cross) this.group.add(this.cross);
    if (this.pulses) this.group.add(this.pulses);
    this.baseGain = ds.meta.colores ? .3 : .4;
    this.baseEdge = ds.meta.colores ? .12 : .35;
    this.state = new Float32Array(n);
    this.filters = { onlyBridge: false, core: false, typeMask: 65535, comm: -1 };
    this.selOn = false;
    this.applyFrac();
  }

  // todas las materiales comparten valores: copiamos en cada uno por seguridad
  setU(k, v) { for (const o of [this.points, this.intra, this.cross, this.pulses]) if (o && o.material.uniforms[k]) o.material.uniforms[k].value = v; this.U[k].value = v; }
  getU(k) { return this.U[k].value; }
  setFrac(f) { Object.assign(this.frac, f); this.applyFrac(); }
  applyFrac() {
    const ds = this.ds, lim = Math.floor(ds.n * this.frac.node);
    this.setU('uNodeLim', lim);
    this.points.geometry.setDrawRange(0, lim);
    const prefix = (A, B, cnt) => { // aristas ordenadas por max-rank asc -> prefijo con max < lim
      let lo = 0, hi = cnt; while (lo < hi) { const mid = (lo + hi) >> 1; if (Math.max(A[mid], B[mid]) < lim) lo = mid + 1; else hi = mid; } return lo; };
    const ia = this.intra.userData; this.intra.geometry.instanceCount = Math.floor(prefix(ia.A, ia.B, ia.cnt) * this.frac.edge);
    if (this.cross) { const ca = this.cross.userData; this.cross.geometry.instanceCount = Math.floor(prefix(ca.A, ca.B, ca.cnt) * this.frac.cross); }
    if (this.pulses) this.pulses.geometry.setDrawRange(0, Math.floor(this.pulses.userData.cnt * this.frac.pulse));
  }
  visible(i) {
    const ds = this.ds, f = this.filters;
    if (i >= this.getU('uNodeLim') || !this.vis[ds.proj(i)]) return false;
    if (!((f.typeMask >> (ds.tipo(i) % 16)) & 1)) return false;
    if (f.comm >= 0 && ds.com(i) !== f.comm) return false;
    if (f.core && Math.log1p(ds.deg(i)) / Math.log1p(ds.maxdeg) < this.getU('uCore')) return false;
    if (f.onlyBridge && !ds.bridge[i]) return false;
    return true;
  }
  applyFilters() {
    const f = this.filters;
    this.setU('uOnlyBridge', f.onlyBridge ? 1 : 0); this.setU('uCore', f.core ? .55 : 0);
    this.setU('uTypeMask', f.typeMask); this.setU('uComm', f.comm);
  }
  setStates(map) { // map: Map idx->estado, o null
    const st = this.state, d = this.meta; st.fill(0);
    if (map) for (const [i, s] of map) st[i] = s;
    for (let i = 0; i < this.ds.n; i++) d[4 * i + 2] = st[i];
    this.tM.needsUpdate = true; this.selOn = !!map; this.setU('uSelOn', map ? 1 : 0);
  }
  pos(i, out, mix) {
    const m = mix ?? this.getU('uMix'), s = this.getU('uScale'), J = this.ds.J, U = this.ds.U;
    return out.set((J[3 * i] * (1 - m) + U[3 * i] * m) * s, (J[3 * i + 1] * (1 - m) + U[3 * i + 1] * m) * s, (J[3 * i + 2] * (1 - m) + U[3 * i + 2] * m) * s);
  }
  // picking CPU: nodo visible mas cercano al puntero (px CSS)
  pick(camera, px, py, W, H, maxd = 16) {
    this.group.updateWorldMatrix(true, false);
    const M = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, new THREE.Matrix4().multiplyMatrices(camera.matrixWorldInverse, this.group.matrixWorld)).elements;
    const m = this.getU('uMix'), s = this.getU('uScale'), J = this.ds.J, U = this.ds.U, lim = Math.min(this.ds.n, this.getU('uNodeLim'));
    let best = -1, bs = 1e18; const mx = (px / W) * 2 - 1, my = 1 - (py / H) * 2;
    for (let i = 0; i < lim; i++) {
      const x = (J[3 * i] * (1 - m) + U[3 * i] * m) * s, y = (J[3 * i + 1] * (1 - m) + U[3 * i + 1] * m) * s, z = (J[3 * i + 2] * (1 - m) + U[3 * i + 2] * m) * s;
      const w = M[3] * x + M[7] * y + M[11] * z + M[15]; if (w <= 0) continue;
      const nx = (M[0] * x + M[4] * y + M[8] * z + M[12]) / w, ny = (M[1] * x + M[5] * y + M[9] * z + M[13]) / w;
      const dx = (nx - mx) * W / 2, dy = (ny - my) * H / 2, d2 = dx * dx + dy * dy;
      if (d2 > maxd * maxd) continue;
      if (!this.visible(i)) continue;
      const sc = d2 / (1 + this.ds.deg(i) * .15) + w * .002;
      if (sc < bs) { bs = sc; best = i; }
    }
    return best;
  }
  update(t, px) {
    let ch = false; for (let i = 0; i < 256; i++) { if (this.pdata[4 * i + 3] !== this.vis[i]) { this.pdata[4 * i + 3] = this.vis[i]; ch = true; } } if (ch) this.tP.needsUpdate = true;
    this.setU('uTime', t); if (px) this.setU('uPx', px); }
  dispose() {
    for (const o of [this.points, this.intra, this.cross, this.pulses]) if (o) { o.geometry.dispose(); o.material.dispose(); }
    this.U.tJ.value.dispose(); this.U.tU.value.dispose(); this.tM.dispose(); this.tP.dispose();
  }
}
