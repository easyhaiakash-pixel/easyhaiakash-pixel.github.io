// Drawing kit: every object on the site is built from simple shapes with this kit.
// Shapes get a soft toon colour and a thin warm-brown outline (the "One Life" cute style).
// All shapes of one object are merged into ONE mesh + ONE outline mesh, so phones stay fast.
import * as THREE from '../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';

export { THREE };
export const OL = '#6b4046'; // outline colour: warm plum-brown, never black

// ---------- materials (shared, so the GPU switches state rarely) ----------
function makeGradient() {
  // 3 soft light steps: shade, mid, light. Kept high so pastels never turn grey.
  const d = new Uint8Array([168, 168, 168, 255, 222, 222, 222, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
export const gradientMap = makeGradient();

export const MAT = {
  toon: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }),
  line: new THREE.MeshBasicMaterial({ color: OL, side: THREE.BackSide }),
  ghost: new THREE.MeshToonMaterial({
    vertexColors: true, gradientMap, transparent: true, opacity: 0.6, depthWrite: false,
    emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.12,
  }),
  ghostLine: new THREE.MeshBasicMaterial({ color: '#b07888', side: THREE.BackSide, transparent: true, opacity: 0.6, depthWrite: false }),
  hit: new THREE.MeshBasicMaterial({ visible: false }),
};

// ---------- shape shortcuts ----------
export const G = {
  box: (w, h, d, r = 0.05, seg = 2) => {
    const rr = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
    return new RoundedBoxGeometry(w, h, d, seg, rr);
  },
  cyl: (rt, rb, h, seg = 24) => new THREE.CylinderGeometry(rt, rb, h, seg),
  sph: (r, ws = 20, hs = 14) => new THREE.SphereGeometry(r, ws, hs),
  cap: (r, len, seg = 12) => new THREE.CapsuleGeometry(r, len, 4, seg),
  tor: (R, r, ts = 10, rs = 28, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, ts, rs, arc),
  cone: (r, h, seg = 24) => new THREE.ConeGeometry(r, h, seg),
  // profiles are always turned bottom-to-top, so the shape faces outward and its outline stays behind it
  lathe: (pts, seg = 28) => {
    const p = pts[0][1] > pts[pts.length - 1][1] ? [...pts].reverse() : pts;
    return new THREE.LatheGeometry(p.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  },
  // rounded flat shape (heart, star, cloud) pushed out a little, for cute details
  heart: (s, depth = 0.03) => {
    const sh = new THREE.Shape();
    sh.moveTo(0, -s * 0.9);
    sh.bezierCurveTo(-s * 1.5, s * 0.2, -s * 0.7, s * 1.2, 0, s * 0.4);
    sh.bezierCurveTo(s * 0.7, s * 1.2, s * 1.5, s * 0.2, 0, -s * 0.9);
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: s * 0.08, bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0, -depth / 2);
    return g;
  },
  star: (s, depth = 0.03) => {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? s * 0.48 : s;
      i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * 0.4, bevelSize: s * 0.1, bevelSegments: 2 });
    g.translate(0, 0, -depth / 2);
    return g;
  },
};

// ---------- the kit ----------
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const v3 = (a, d = 0) => new THREE.Vector3(a?.[0] ?? d, a?.[1] ?? d, a?.[2] ?? d);

function prep(geo) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}
function paint(g, col) {
  const c = new THREE.Color(col);
  const n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
}

export class Kit {
  constructor(lw = 0.016) {
    this.lw = lw;           // outline width in metres
    this.parts = [];
    this.lines = [];
    this.extra = [];        // ready meshes (textured decals, glows) added as they are
    this.stack = [new THREE.Matrix4()];
  }
  get top() { return this.stack[this.stack.length - 1]; }
  // draw inside a moved/rotated frame: kit.at([x,y,z], [rx,ry,rz], () => {...})
  at(p, r, fn, s) {
    _e.set(...(r || [0, 0, 0]));
    const m = new THREE.Matrix4().compose(v3(p), new THREE.Quaternion().setFromEuler(_e), v3(s, 1));
    this.stack.push(this.top.clone().multiply(m));
    fn();
    this.stack.pop();
    return this;
  }
  // add a shape. o: { p:[x,y,z], r:[rx,ry,rz], s:[sx,sy,sz], line:false, lw }
  add(geo, col, o = {}) {
    const g = prep(geo);
    _e.set(...(o.r || [0, 0, 0]));
    _q.setFromEuler(_e);
    const s = v3(o.s, 1);
    _m.compose(v3(o.p), _q, s).premultiply(this.top);
    const body = g.clone().applyMatrix4(_m);
    paint(body, col);
    this.parts.push(body);
    if (o.line !== false) {
      // outline = same shape grown by lw on every side (works without gaps on round and box shapes)
      g.computeBoundingBox();
      const bb = g.boundingBox, c = bb.getCenter(new THREE.Vector3()), d = bb.getSize(new THREE.Vector3());
      const lw = o.lw ?? this.lw;
      const sc = new THREE.Vector3(
        1 + (2 * lw) / Math.max(d.x * Math.abs(s.x), 1e-3),
        1 + (2 * lw) / Math.max(d.y * Math.abs(s.y), 1e-3),
        1 + (2 * lw) / Math.max(d.z * Math.abs(s.z), 1e-3));
      const og = g.clone().translate(-c.x, -c.y, -c.z).scale(sc.x, sc.y, sc.z).translate(c.x, c.y, c.z).applyMatrix4(_m);
      this.lines.push(og);
    }
    g.dispose();
    return this;
  }
  // add a ready mesh (keeps its own material), placed in the current frame
  mesh(m, p, r) {
    if (p) m.position.copy(v3(p));
    if (r) m.rotation.set(...r);
    m.updateMatrix();
    m.matrix.premultiply(this.top);
    m.matrix.decompose(m.position, m.quaternion, m.scale);
    this.extra.push(m);
    return m;
  }
  build(ghost = false) {
    const grp = new THREE.Group();
    if (this.parts.length) {
      const body = new THREE.Mesh(mergeGeometries(this.parts), ghost ? MAT.ghost : MAT.toon);
      body.name = 'body';
      grp.add(body);
    }
    if (this.lines.length) {
      const line = new THREE.Mesh(mergeGeometries(this.lines), ghost ? MAT.ghostLine : MAT.line);
      line.name = 'line';
      grp.add(line);
    }
    this.extra.forEach((m) => grp.add(m));
    this.parts.forEach((g) => g.dispose());
    this.lines.forEach((g) => g.dispose());
    this.parts = []; this.lines = []; this.extra = [];
    return grp;
  }
}

// ---------- canvas helpers (for faces, wallpaper, photos) ----------
export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
}
export const TAU = Math.PI * 2;
export const C2 = {
  el(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); },
  rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); },
  fin(g, fill, lw = 0, col = OL) {
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = col; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  },
  lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; },
  rad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; },
  heart(g, x, y, s) {
    g.beginPath(); g.moveTo(x, y + s * 0.9);
    g.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.7, y - s * 1.2, x, y - s * 0.4);
    g.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.5, y - s * 0.2, x, y + s * 0.9); g.closePath();
  },
  star4(g, x, y, s) {
    g.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, r = i % 2 ? s * 0.28 : s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath();
  },
  star5(g, x, y, s) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 ? s * 0.46 : s; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    g.closePath();
  },
  cloud(g, x, y, s) {
    g.beginPath();
    g.arc(x - s * 0.7, y, s * 0.5, Math.PI * 0.5, Math.PI * 1.5);
    g.arc(x - s * 0.2, y - s * 0.4, s * 0.55, Math.PI, Math.PI * 1.9);
    g.arc(x + s * 0.5, y - s * 0.15, s * 0.5, Math.PI * 1.3, Math.PI * 0.5);
    g.closePath();
  },
};

// textured flat plane (wallpaper, photos, faces of TV etc.)
export function plane(w, h, tex, o = {}) {
  const mat = o.basic
    ? new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.transparent, depthWrite: o.depthWrite ?? true })
    : new THREE.MeshToonMaterial({ map: tex, gradientMap, transparent: !!o.transparent });
  if (o.polygonOffset) { mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1; }
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

// soft round blob texture (fake shadows, glows)
let _blob;
export function blobTex() {
  if (_blob) return _blob;
  _blob = canvasTex(128, 128, (g) => {
    g.fillStyle = C2.rad(g, 64, 64, 0, 64, [[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]);
    g.fillRect(0, 0, 128, 128);
  });
  return _blob;
}
// sparkle star texture (for gifted items and sunlight dust)
let _spark;
export function sparkTex() {
  if (_spark) return _spark;
  _spark = canvasTex(128, 128, (g) => {
    g.fillStyle = C2.rad(g, 64, 64, 0, 40, [[0, 'rgba(255,250,220,0.9)'], [1, 'rgba(255,240,200,0)']]);
    g.fillRect(0, 0, 128, 128);
    C2.star4(g, 64, 64, 54);
    C2.fin(g, '#fffbe8');
    C2.star4(g, 64, 64, 24);
    C2.fin(g, '#ffffff');
  });
  return _spark;
}
