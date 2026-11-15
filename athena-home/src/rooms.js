// The house. Rooms sit side by side like a cut-open doll's house; the camera looks in from the front.
// Room list, colours and item "spots" come from data/rooms.json. Furniture for each "builder" is drawn here.
// A new room with an unknown builder still works: it gets walls, floor, window and its spots.
import { THREE, Kit, G, plane, canvasTex, C2, blobTex } from './kit.js';
import * as TX from './textures.js';
import { tint } from './items.js';

export const DOOR = { z0: 0.15, z1: 1.35, h: 2.2 };

// ---------- small shared pieces ----------
function texPlane(w, h, tex, repeat) {
  const t = repeat ? tex.clone() : tex;
  if (repeat) { t.repeat.set(...repeat); t.needsUpdate = true; }
  return plane(w, h, t);
}
function frame(k, p, ry, w, h, tex, col = '#fffaf2') {
  k.at(p, [0, ry, 0], () => {
    k.add(G.box(w + 0.1, h + 0.1, 0.05, 0.03), col);
    const m = plane(w, h, tex); k.mesh(m, [0, 0, 0.03]);
  });
}
function plant(k, p, s = 1, pot = '#ffc9b3') {
  k.at(p, [0, 0, 0], () => {
    k.add(G.lathe([[0, 0], [0.16, 0], [0.2, 0.3], [0.22, 0.32], [0, 0.32]]), pot);
    k.add(G.cyl(0.19, 0.19, 0.02, 20), '#9a6a4a', { p: [0, 0.31, 0], line: false });
    const L = ['#8fd39a', '#a8e2a8', '#7cc98e'];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      k.add(G.sph(0.13, 12, 10), L[i % 3], { p: [Math.cos(a) * 0.12, 0.5 + (i % 3) * 0.08, Math.sin(a) * 0.1], s: [0.7, 1.4, 0.45], r: [Math.sin(a) * 0.5, a, Math.cos(a) * 0.5] });
    }
    k.add(G.sph(0.12, 12, 10), L[0], { p: [0, 0.7, 0], s: [0.7, 1.3, 0.6] });
  }, [s, s, s]);
}
function bunting(k, x0, x1, y, z, sag = 0.18) {
  const cols = ['#ffb3c8', '#ffe08a', '#b9e6cb', '#b5d8ff', '#d9c2ff'];
  const n = Math.max(3, Math.round((x1 - x0) / 0.32));
  const yAt = (x) => { const t = ((x - x0) / (x1 - x0)) * 2 - 1; return y - sag * (1 - t * t); };
  for (let i = 0; i < 12; i++) {
    const a = x0 + ((x1 - x0) * i) / 12, b = x0 + ((x1 - x0) * (i + 1)) / 12;
    const ya = yAt(a), yb = yAt(b), len = Math.hypot(b - a, yb - ya);
    k.add(G.cyl(0.008, 0.008, len, 5), '#e2b07f', { p: [(a + b) / 2, (ya + yb) / 2, z], r: [0, 0, Math.atan2(yb - ya, b - a) - Math.PI / 2], line: false });
  }
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
    k.add(G.cone(0.1, 0.22, 3), cols[i % cols.length], { p: [x, yAt(x) - 0.11, z + 0.01], r: [0, 0, Math.PI], s: [1, 1, 0.12], lw: 0.008 });
  }
}
function curtain(k, x, y0, y1, z, col) {
  for (let i = 0; i < 3; i++) {
    k.add(G.cap(0.07, y1 - y0 - 0.14, 8), col, { p: [x + (i - 1) * 0.1, (y0 + y1) / 2, z + (i % 2) * 0.03], s: [1, 1, 0.6], lw: 0.01 });
  }
  k.add(G.tor(0.12, 0.02, 6, 16), tint(col, -0.15), { p: [x, y0 + (y1 - y0) * 0.38, z + 0.04], r: [Math.PI / 2, 0, 0], s: [1.3, 1, 0.6], lw: 0.008 });
}
// window on the back wall + sunbeams
const windowViews = {};
function windowBack(k, ctx, x, y, w, h, curtainCol, view = 'day') {
  const z = -ctx.D / 2;
  windowViews[view] ||= TX.windowView(view);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: windowViews[view] }));
  k.mesh(glass, [x, y, z + 0.012]);
  const f = '#ffffff';
  k.add(G.box(w + 0.16, 0.08, 0.1, 0.03), f, { p: [x, y + h / 2 + 0.04, z + 0.03] });
  k.add(G.box(w + 0.26, 0.07, 0.2, 0.03), f, { p: [x, y - h / 2 - 0.03, z + 0.08] });
  for (const s of [-1, 1]) k.add(G.box(0.08, h + 0.08, 0.1, 0.03), f, { p: [x + s * (w / 2 + 0.04), y, z + 0.03] });
  k.add(G.box(0.05, h, 0.06, 0.02), f, { p: [x, y, z + 0.03] });
  k.add(G.box(w, 0.05, 0.06, 0.02), f, { p: [x, y + 0.05, z + 0.03] });
  // rod + curtains
  k.add(G.cyl(0.02, 0.02, w + 0.7, 8), '#d9a36a', { p: [x, y + h / 2 + 0.2, z + 0.12], r: [0, 0, Math.PI / 2], lw: 0.008 });
  for (const s of [-1, 1]) {
    k.add(G.sph(0.04, 10, 8), '#d9a36a', { p: [x + s * (w / 2 + 0.36), y + h / 2 + 0.2, z + 0.12], lw: 0.008 });
    curtain(k, x + s * (w / 2 + 0.17), y - h / 2 - 0.25, y + h / 2 + 0.2, z + 0.14, curtainCol);
  }
  ctx.windows.push({ x, y, w, h, z });
}
let _rayTex;
function rayTex() {
  return (_rayTex ||= canvasTex(64, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,245,200,0.9)'); gr.addColorStop(1, 'rgba(255,245,200,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const sx = g.createLinearGradient(0, 0, 64, 0);
    sx.addColorStop(0, 'rgba(0,0,0,1)'); sx.addColorStop(0.3, 'rgba(0,0,0,0)'); sx.addColorStop(0.7, 'rgba(0,0,0,0)'); sx.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = sx; g.fillRect(0, 0, 64, 256);
  }));
}
function sunbeams(group, win) {
  const mat = new THREE.MeshBasicMaterial({ map: rayTex(), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beams = [];
  for (let i = 0; i < 3; i++) {
    const len = 3.2, m = new THREE.Mesh(new THREE.PlaneGeometry(win.w * 0.42, len), mat);
    m.geometry.translate(0, -len / 2, 0);
    m.position.set(win.x - win.w * 0.3 + i * win.w * 0.3, win.y + win.h * 0.35, win.z + 0.05);
    m.rotation.set(-0.85, 0, 0.12 - i * 0.04);
    m.renderOrder = 3;
    group.add(m); beams.push(m);
  }
  // warm patch of light on the floor
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(win.w * 1.8, 1.3), new THREE.MeshBasicMaterial({ map: blobTex(), color: '#ffe9b0', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  patch.rotation.x = -Math.PI / 2; patch.position.set(win.x + 0.1, 0.012, win.z + 1.9); patch.renderOrder = 1;
  group.add(patch);
  group.userData.beams = (group.userData.beams || []).concat(beams);
}
// dust sparkles floating in the sun
function dust(group, win) {
  const n = 18, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = win.x + (Math.random() - 0.5) * win.w * 1.4; pos[i * 3 + 1] = 0.4 + Math.random() * 1.8; pos[i * 3 + 2] = win.z + 0.4 + Math.random() * 1.8; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.05, map: blobTex(), color: '#fff6cf', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(pts);
  group.userData.dust = pts;
}

// ---------- room shell: floor, walls, wainscot, doors ----------
function shell(k, ctx, group) {
  const { W, D, H, T, room } = ctx;
  const wallCol = room.wall, wain = room.wainscot || '#d9f2e5';
  // back wall + gable roof shape above it
  k.add(G.box(W + 2 * T, H, T, 0.03), wallCol, { p: [0, H / 2, -D / 2 - T / 2] });
  const wp = texPlane(W, H - 0.95, ctx.wallTex, [3, 1.4]); k.mesh(wp, [0, 0.95 + (H - 0.95) / 2, -D / 2 + 0.004]);
  // wainscot + rail on back wall
  k.add(G.box(W, 0.9, 0.04, 0.015), wain, { p: [0, 0.45, -D / 2 + 0.02], lw: 0.01 });
  for (let x = -W / 2 + 0.35; x < W / 2 - 0.2; x += 0.7) k.add(G.box(0.5, 0.55, 0.02, 0.05), tint(wain, 0.25), { p: [x, 0.47, -D / 2 + 0.045], line: false });
  k.add(G.box(W, 0.06, 0.08, 0.02), '#ffffff', { p: [0, 0.93, -D / 2 + 0.04] });
  k.add(G.box(W, 0.1, 0.06, 0.02), '#ffffff', { p: [0, 0.05, -D / 2 + 0.03] });
  // side walls: left only for the first room (others share the neighbour's right wall)
  const side = (sx, hasDoor, boxes = true) => {
    const x = sx * (W / 2 + T / 2), zb = -D / 2 - T, zf = D / 2;
    const seg = (z0, z1, y0, y1) => {
      if (boxes) k.add(G.box(T, y1 - y0, z1 - z0, 0.03), wallCol, { p: [x, (y0 + y1) / 2, (z0 + z1) / 2] });
    };
    const inner = x - sx * (T / 2 + 0.004);
    const paper = (z0, z1, y0, y1) => {
      const m = texPlane(z1 - z0, y1 - y0, ctx.wallTex, [(z1 - z0) / 2, (y1 - y0) / 2.2]);
      k.mesh(m, [inner, (y0 + y1) / 2, (z0 + z1) / 2], [0, -sx * Math.PI / 2, 0]);
      // the room on the other side of a shared wall sees the same wall
    };
    const wainSeg = (z0, z1) => {
      k.add(G.box(0.04, 0.9, z1 - z0, 0.015), wain, { p: [inner - sx * 0.02, 0.45, (z0 + z1) / 2], lw: 0.01 });
      k.add(G.box(0.08, 0.06, z1 - z0, 0.02), '#ffffff', { p: [inner - sx * 0.04, 0.93, (z0 + z1) / 2] });
    };
    if (!hasDoor) { seg(zb, zf, 0, H); paper(-D / 2, zf, 0.95, H); wainSeg(-D / 2, zf); return; }
    seg(zb, DOOR.z0, 0, H); seg(DOOR.z1, zf, 0, H); seg(DOOR.z0, DOOR.z1, DOOR.h, H);
    paper(-D / 2, DOOR.z0, 0.95, H); paper(DOOR.z1, zf, 0.95, H); paper(DOOR.z0, DOOR.z1, DOOR.h, H);
    wainSeg(-D / 2, DOOR.z0); wainSeg(DOOR.z1, zf);
    // white door frame with a little heart on top
    if (boxes) for (const z of [DOOR.z0 - 0.03, DOOR.z1 + 0.03]) k.add(G.box(T + 0.08, DOOR.h, 0.08, 0.03), '#ffffff', { p: [x, DOOR.h / 2, z] });
    if (boxes) k.add(G.box(T + 0.08, 0.1, DOOR.z1 - DOOR.z0 + 0.14, 0.03), '#ffffff', { p: [x, DOOR.h + 0.05, (DOOR.z0 + DOOR.z1) / 2] });
    k.add(G.heart(0.07, 0.03), '#ff9fbf', { p: [x - sx * (T / 2 + 0.02), DOOR.h + 0.25, (DOOR.z0 + DOOR.z1) / 2], r: [0, -sx * Math.PI / 2, 0] });
  };
  if (ctx.index === 0) side(-1, false);
  else side(-1, true, false); // shared wall: only paint this room's side of it
  side(1, ctx.hasNext);
  // floor
  const fl = plane(W, D, ctx.floorTex); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.003, 0); group.add(fl);
  // front edge of each wall gets a cream cap so the cut looks finished
  // gable above the back wall (house shape)
  const gw = W + 2 * T;
  const gable = new THREE.Shape();
  gable.moveTo(-gw / 2, 0); gable.lineTo(gw / 2, 0); gable.lineTo(0, 1.25); gable.closePath();
  k.add(new THREE.ExtrudeGeometry(gable, { depth: T, bevelEnabled: false }), tint(wallCol, -0.04), { p: [0, H, -D / 2 - T] });
  for (const s of [-1, 1]) {
    const len = Math.hypot(gw / 2 + 0.25, 1.25 + 0.15);
    k.add(G.box(len, 0.16, T + 0.3, 0.06), ctx.roofCol, { p: [s * gw / 4, H + 0.66, -D / 2 - T / 2 + 0.02], r: [0, 0, -s * Math.atan2(1.4, gw / 2 + 0.25)] });
  }
  k.add(G.cyl(0.24, 0.24, T + 0.04, 24), '#ffffff', { p: [0, H + 0.48, -D / 2 - T / 2], r: [Math.PI / 2, 0, 0] });
  k.add(G.heart(0.13, 0.04), ctx.roofCol, { p: [0, H + 0.48, -D / 2 + 0.02] });
}

// ---------- furniture per room ----------
const BUILD = {
  bedroom(k, ctx, group) {
    const { D } = ctx, bz = -D / 2;
    // wardrobe with open doors (dresses hang inside)
    const wx = -2.03, ww = 1.7, wd = 0.62, wh = 2.25, wc = '#fff6ee', trim = '#ffb3c8';
    const wz = bz + wd / 2;
    k.add(G.box(ww, wh, 0.05, 0.02), '#f6dfe3', { p: [wx, wh / 2, bz + 0.03] });
    for (const s of [-1, 1]) k.add(G.box(0.06, wh, wd, 0.025), wc, { p: [wx + s * (ww / 2 - 0.03), wh / 2, wz] });
    k.add(G.box(ww + 0.08, 0.1, wd + 0.06, 0.04), trim, { p: [wx, wh + 0.05, wz] });
    k.add(G.box(ww, 0.38, wd, 0.03), wc, { p: [wx, 0.19 + 0.03, wz] });
    for (const s of [-1, 1]) {
      k.add(G.box(ww / 2 - 0.12, 0.26, 0.02, 0.03), tint(trim, 0.45), { p: [wx + s * ww / 4, 0.23, bz + wd + 0.01], lw: 0.008 });
      k.add(G.sph(0.025, 8, 6), '#ffd76a', { p: [wx + s * ww / 4, 0.23, bz + wd + 0.03], lw: 0.006 });
    }
    k.add(G.box(ww - 0.1, 0.03, wd - 0.06, 0.01), wc, { p: [wx, 1.98, wz] });
    k.add(G.cyl(0.018, 0.018, ww - 0.12, 10), '#e2b07f', { p: [wx, 1.88, wz], r: [0, 0, Math.PI / 2], lw: 0.008 });
    // things on the top shelf: hat boxes
    k.add(G.cyl(0.16, 0.16, 0.18, 20), '#b5d8ff', { p: [wx - 0.45, 2.1, wz], lw: 0.01 });
    k.add(G.cyl(0.13, 0.13, 0.15, 20), '#ffe08a', { p: [wx + 0.2, 2.08, wz], lw: 0.01 });
    // open doors
    for (const s of [-1, 1]) {
      const hx = wx + s * ww / 2, ang = s < 0 ? -1.62 : 1.75;
      k.at([hx, 0, bz + wd], [0, ang, 0], () => {
        const dx = -s * (ww / 4);
        k.add(G.box(ww / 2 - 0.02, wh - 0.05, 0.04, 0.02), wc, { p: [dx, wh / 2 + 0.02, 0] });
        k.add(G.box(ww / 2 - 0.2, wh - 0.5, 0.02, 0.06), tint(trim, 0.5), { p: [dx, wh / 2 + 0.1, 0.025], line: false });
        k.add(G.heart(0.08, 0.02), trim, { p: [dx, wh * 0.72, 0.035], lw: 0.008 });
      });
    }
    // window + toy shelf under it
    windowBack(k, ctx, -0.1, 1.85, 1.15, 1.2, '#ffe08a');
    const sx = -0.1, sw = 1.1, sh = 0.8, sd = 0.38, sz = bz + sd / 2;
    k.add(G.box(sw, sh, sd, 0.04), '#fff6ee', { p: [sx, sh / 2, sz] });
    const bins = ['#ffb3c8', '#b5d8ff', '#b9e6cb', '#ffe08a'];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      k.add(G.box(sw / 2 - 0.1, sh / 2 - 0.1, 0.04, 0.05), bins[r * 2 + c], { p: [sx - sw / 4 + c * sw / 2, sh / 4 + r * sh / 2, bz + sd + 0.005], lw: 0.008 });
      k.add(G.heart(0.04, 0.012), '#ffffff', { p: [sx - sw / 4 + c * sw / 2, sh / 4 + r * sh / 2, bz + sd + 0.03], line: false });
    }
    // picture frame between wardrobe and window
    frame(k, [-0.96, 2.35, bz + 0.03], 0, 0.3, 0.36, ctx.tex.photoOne, '#ffe08a');
    // bed (daybed along the back wall, headboard at the right)
    const bx0 = 1.0, bx1 = 2.88, bzF = bz + 1.08, bh = 0.5, bc = '#fff6ee';
    const bcx = (bx0 + bx1) / 2, bcz = (bz + bzF) / 2, bl = bx1 - bx0, bw = bzF - bz;
    for (const [x, z] of [[bx0 + 0.08, bzF - 0.08], [bx1 - 0.1, bzF - 0.08]]) k.add(G.cyl(0.05, 0.05, 0.16, 10), '#e2b07f', { p: [x, 0.08, z] });
    k.add(G.box(bl, 0.2, bw, 0.06), bc, { p: [bcx, 0.24, bcz] });
    k.add(G.box(bl - 0.08, 0.16, bw - 0.08, 0.07), '#ffffff', { p: [bcx, 0.42, bcz] });
    // quilt
    k.add(G.box(bl * 0.62, 0.06, bw + 0.04, 0.03), '#ffb3c8', { p: [bx0 + bl * 0.31 + 0.02, 0.5, bcz + 0.02] });
    k.add(G.box(bl * 0.62, 0.012, 0.04, 0.006), '#ffffff', { p: [bx0 + bl * 0.31 + 0.02, 0.5, bzF + 0.045], line: false });
    for (let i = 0; i < 4; i++) k.add(G.heart(0.045, 0.012), '#ffffff', { p: [bx0 + 0.2 + i * 0.3, 0.535, bcz + 0.15], r: [-Math.PI / 2, 0, 0], line: false });
    k.add(G.box(0.18, 0.08, bw + 0.06, 0.035), '#ffe08a', { p: [bx0 + bl * 0.62 + 0.08, 0.5, bcz + 0.02] });
    // pillow + headboard + footboard
    k.add(G.box(0.36, 0.14, 0.62, 0.07), '#ffffff', { p: [bx1 - 0.3, 0.57, bcz], r: [0, 0, 0.25] });
    k.add(G.box(0.1, 1.05, bw + 0.06, 0.05), '#ffc9d8', { p: [bx1 - 0.02, 0.53, bcz] });
    k.add(G.cyl(bw / 2 + 0.03, bw / 2 + 0.03, 0.1, 28), '#ffc9d8', { p: [bx1 - 0.02, 1.02, bcz], r: [0, 0, Math.PI / 2] });
    k.add(G.heart(0.13, 0.03), '#ff8fb0', { p: [bx1 - 0.08, 0.95, bcz], r: [0, -Math.PI / 2, 0] });
    k.add(G.box(0.08, 0.66, bw + 0.04, 0.04), bc, { p: [bx0 + 0.02, 0.33, bcz] });
    for (const z of [bz + 0.08, bzF - 0.06]) k.add(G.sph(0.05, 10, 8), '#ffe08a', { p: [bx0 + 0.02, 0.7, z] });
    // her name over the bed + bunting
    const nb = plane(1.7, 0.42, ctx.tex.name); nb.material.transparent = true; nb.material.alphaTest = 0.05;
    k.mesh(nb, [bcx - 0.05, 2.05, bz + 0.02]);
    bunting(k, -2.9, 2.9, 3.0, bz + 0.06, 0.22);
    // cloud night-light on the wall + stars
    k.add(G.sph(0.12, 14, 10), '#ffffff', { p: [2.35, 2.6, bz + 0.06], s: [1.6, 1, 0.4] });
    k.add(G.sph(0.09, 14, 10), '#ffffff', { p: [2.2, 2.66, bz + 0.07], s: [1.3, 1, 0.4] });
    for (const [x, y] of [[1.85, 2.7], [2.65, 2.42], [1.6, 2.5]]) k.add(G.star(0.06, 0.02), '#ffe08a', { p: [x, y, bz + 0.04], lw: 0.008 });
    // round play rug
    const rug = plane(2.1, 2.1, ctx.tex.rugRound, {}); rug.rotation.x = -Math.PI / 2; rug.position.set(-0.15, 0.008, 0.35); rug.material.transparent = true; rug.material.alphaTest = 0.1; group.add(rug);
    // toys on the floor: blocks and a ball
    const blocks = [['#ffb3c8', -0.08, 0.07, 0, 0.3], ['#b5d8ff', 0.1, 0.07, 0.15, -0.2], ['#ffe08a', 0.0, 0.21, 0.0, 0.5]].map(([c, x, y, z, r]) =>
      ctx.part([-1.28 + x, y, 1.25 + z], (kk) => kk.add(G.box(0.14, 0.14, 0.14, 0.025), c, { r: [0, r, 0], lw: 0.008 }), 0.008));
    ctx.touch({ name: 'blocks', box: [-1.25, 0.15, 1.3, 0.5, 0.35, 0.5], say: 'Crash! 🧱', act: 'reach', react: 'topple', parts: blocks, emoji: '✨' });
    const ball = ctx.part([1.4, 0.11, 0.95], (kk) => {
      kk.add(G.sph(0.11, 16, 12), '#b9e6cb', { lw: 0.01 });
      kk.add(G.tor(0.105, 0.02, 6, 20), '#ffffff', { r: [0.4, 0.3, 0], line: false });
    });
    ctx.touch({ name: 'ball', box: [1.4, 0.11, 0.95, 0.35, 0.35, 0.35], say: 'Kick! ⚽', act: 'kick', react: 'roll', target: ball, follow: true });
    // teddy on the shelf top (part of the room, not a gift)
    const teddy = ctx.part([sx + 0.38, sh, sz], (kk) => {
      const c = '#e3b48a';
      kk.add(G.sph(0.09, 12, 10), c, { p: [0, 0.09, 0] });
      kk.add(G.sph(0.08, 12, 10), c, { p: [0, 0.23, 0.01] });
      for (const s of [-1, 1]) kk.add(G.sph(0.03, 8, 6), c, { p: [s * 0.06, 0.3, 0] });
      kk.add(G.sph(0.03, 8, 6), '#fff1e2', { p: [0, 0.21, 0.07], line: false });
    }, 0.016, [0, -0.3, 0]);
    ctx.touch({ name: 'teddy', box: [sx + 0.38, sh + 0.17, sz, 0.3, 0.4, 0.3], say: 'My teddy! 🧸', act: 'hug', react: 'hop', target: teddy, emoji: '💕' });
    ctx.touch({ name: 'shelf', box: [sx, sh / 2, sz, sw, sh, sd + 0.05], say: 'My toys! 🧸', act: 'reach', emoji: '📚' });
    ctx.touch({ name: 'bed', box: [bcx, 0.5, bcz, bl, 1.0, bw + 0.1], say: 'Sleepy… 💤', act: 'sleep', emoji: '💤', stand: [bcx - 0.2, bzF + 0.35] });
    ctx.touch({ name: 'wardrobe', box: [wx, wh / 2, wz, ww, wh, wd], say: 'So many clothes! 👗', act: 'jump', emoji: '✨' });
    ctx.touch({ name: 'window', box: [-0.1, 1.85, bz + 0.1, 1.6, 1.4, 0.2], say: 'Sunny day! ☀️', act: 'reach', react: 'sun', emoji: '☀️' });
    ctx.touch({ name: 'banner', box: [bcx - 0.05, 2.05, bz + 0.05, 1.7, 0.45, 0.1], say: "That's my name! 💗", act: 'jump', emoji: '💗' });
    ctx.touch({ name: 'stars', box: [2.2, 2.6, bz + 0.05, 1.0, 0.5, 0.1], say: 'Twinkle twinkle! ⭐', act: 'dance', emoji: '⭐' });
    ctx.touch({ name: 'photo', box: [-0.96, 2.35, bz + 0.05, 0.4, 0.45, 0.1], say: 'Baby me! 📸', act: 'jump', emoji: '💕' });
    ctx.touch({ name: 'mirror', box: [-ctx.W / 2 + 0.05, 1.55, 1.0, 0.1, 0.75, 0.6], say: 'Hello, me! 🪞', act: 'spin', emoji: '✨', stand: [-2.45, 1.0] });
    // books on the shelf
    ['#ff9db5', '#9fd2ff', '#ffe58a'].forEach((c, i) => k.add(G.box(0.05, 0.22, 0.16, 0.01), c, { p: [sx - 0.42 + i * 0.06, sh + 0.11, sz], r: [0, 0, i === 2 ? -0.25 : 0], lw: 0.007 }));
    // plant in the front-left corner + mirror on the left wall
    ctx.plant([-2.6, 0, 1.75], 1.1, '#b5d8ff');
    k.at([-ctx.W / 2 + 0.03, 1.55, 1.0], [0, Math.PI / 2, 0], () => {
      k.add(G.cyl(0.3, 0.3, 0.05, 28), '#ffc9d8', { r: [Math.PI / 2, 0, 0], s: [0.8, 1, 1.2] });
      k.add(G.cyl(0.25, 0.25, 0.02, 28), '#dff2ff', { p: [0, 0, 0.025], r: [Math.PI / 2, 0, 0], s: [0.8, 1, 1.2], line: false });
    });
  },

  living(k, ctx, group) {
    const { D, W } = ctx, bz = -D / 2;
    // sofa
    const sx = 0.05, sw = 2.3, sd = 0.9, sc = '#a8e2cf', scz = bz + sd / 2;
    k.add(G.box(sw, 0.28, sd, 0.08), sc, { p: [sx, 0.22, scz] });
    k.add(G.box(sw - 0.3, 0.14, sd - 0.25, 0.07), tint(sc, 0.2), { p: [sx, 0.42, scz + 0.08] });
    k.add(G.box(sw, 0.62, 0.26, 0.1), sc, { p: [sx, 0.66, bz + 0.15] });
    for (const s of [-1, 1]) k.add(G.box(0.24, 0.5, sd, 0.1), sc, { p: [sx + s * (sw / 2 - 0.1), 0.45, scz] });
    for (const x of [-0.95, 1.05]) for (const z of [bz + 0.12, bz + sd - 0.12]) k.add(G.cyl(0.04, 0.03, 0.08, 8), '#e2b07f', { p: [sx + x, 0.04, z], line: false });
    k.add(G.box(0.36, 0.34, 0.12, 0.08), '#ffb3c8', { p: [sx - 0.82, 0.7, bz + 0.33], r: [-0.2, 0.15, 0.1] });
    k.add(G.box(0.34, 0.32, 0.12, 0.08), '#ffe08a', { p: [sx + 0.85, 0.7, bz + 0.33], r: [-0.2, -0.15, -0.1] });
    k.add(G.heart(0.06, 0.02), '#ffffff', { p: [sx - 0.82, 0.72, bz + 0.4], r: [-0.2, 0.15, 0.1], line: false });
    // blanket over the arm
    k.add(G.box(0.3, 0.06, sd + 0.06, 0.03), '#d9c2ff', { p: [sx + sw / 2 - 0.1, 0.72, scz] });
    // family photo wall
    const ph = ctx.tex;
    frame(k, [-0.7, 1.75, bz + 0.03], 0, 0.42, 0.5, ph.photoBaby, '#ffe08a');
    frame(k, [-0.05, 1.92, bz + 0.03], 0, 0.5, 0.6, ph.photoMom, '#ffffff');
    frame(k, [0.62, 1.72, bz + 0.03], 0, 0.36, 0.42, ph.photoOne, '#ffc9d8');
    frame(k, [-0.42, 2.5, bz + 0.03], 0, 0.3, 0.34, ph.photoHeart, '#b5d8ff');
    frame(k, [0.35, 2.55, bz + 0.03], 0, 0.42, 0.36, ph.photoDrawing, '#b9e6cb');
    // empty frame waiting for future family photos
    frame(k, [1.05, 2.35, bz + 0.03], 0, 0.28, 0.32, ph.photoFamily, '#ffe08a');
    // window on the right with a big plant
    windowBack(k, ctx, 2.15, 1.75, 0.85, 1.3, '#ffc9d8', 'flowers');
    ctx.plant([2.2, 0, bz + 0.45], 1.25, '#ffe08a');
    ctx.touch({ name: 'window', box: [2.15, 1.75, bz + 0.1, 1.2, 1.5, 0.2], say: 'Pretty flowers! 🌸', act: 'reach', react: 'sun', emoji: '🌸', stand: [1.9, -1.1] });
    // floor lamp
    k.add(G.cyl(0.15, 0.17, 0.04, 20), '#ffffff', { p: [1.6, 0.02, bz + 0.35] });
    k.add(G.cyl(0.02, 0.02, 1.4, 8), '#e2b07f', { p: [1.6, 0.72, bz + 0.35] });
    k.add(G.cyl(0.14, 0.25, 0.3, 20), '#fff1b8', { p: [1.6, 1.5, bz + 0.35] });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex(), color: '#fff0b0', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(1.1, 1.1, 1); k.mesh(glow, [1.6, 1.45, bz + 0.4]);
    ctx.touch({ name: 'lamp', box: [1.6, 0.85, bz + 0.35, 0.5, 1.7, 0.5], say: 'Click! 💡', act: 'reach', react: 'lamp', target: glow });
    ctx.touch({ name: 'sofa', box: [sx, 0.5, scz, sw, 1.0, sd], say: 'Boing boing! 🛋️', act: 'jump', emoji: '💫' });
    ctx.touch({ name: 'photos', box: [0.15, 2.15, bz + 0.05, 2.2, 1.3, 0.1], say: "That's us! 📸", act: 'jump', emoji: '💕', stand: [0.15, -1.15] });
    ctx.touch({ name: 'shelf', box: [-W / 2 + 0.12, 2.15, -1.2, 0.25, 0.45, 0.95], say: 'Story books! 📚', act: 'reach', emoji: '📚', stand: [-2.0, -0.2] });
    // rug + round coffee table
    const rug = plane(2.8, 1.75, ctx.tex.rugRect); rug.rotation.x = -Math.PI / 2; rug.position.set(0.1, 0.008, -0.45); rug.material.transparent = true; rug.material.alphaTest = 0.1; group.add(rug);
    const tx = 0.15, tz = -0.5;
    k.add(G.cyl(0.48, 0.48, 0.06, 32), '#fff6ee', { p: [tx, 0.38, tz] });
    ctx.touch({ name: 'table', box: [tx, 0.3, tz, 1.0, 0.65, 1.0], say: "Mom's tea! ☕", act: 'reach', emoji: '☕' });
    k.add(G.cyl(0.08, 0.14, 0.34, 16), '#e2b07f', { p: [tx, 0.18, tz] });
    k.add(G.cyl(0.06, 0.05, 0.1, 14), '#ff9db5', { p: [tx - 0.25, 0.46, tz + 0.1] });
    k.add(G.tor(0.03, 0.01, 6, 10), '#ff9db5', { p: [tx - 0.18, 0.46, tz + 0.1], line: false });
    k.add(G.box(0.24, 0.04, 0.18, 0.01), '#9fd2ff', { p: [tx + 0.25, 0.43, tz - 0.1], r: [0, 0.3, 0] });
    k.add(G.cyl(0.05, 0.07, 0.14, 14), '#ffffff', { p: [tx - 0.05, 0.48, tz - 0.22] });
    for (let i = 0; i < 3; i++) k.add(G.sph(0.04, 8, 6), ['#ff9db5', '#ffe58a', '#ffffff'][i], { p: [tx - 0.05 + (i - 1) * 0.05, 0.6 + (i % 2) * 0.03, tz - 0.22], lw: 0.006 });
    // TV on a low cabinet by the left wall
    k.at([-W / 2 + 0.3, 0, -1.15], [0, Math.PI / 2 - 0.35, 0], () => {
      k.add(G.box(1.2, 0.48, 0.42, 0.05), '#ffc9d8', { p: [0, 0.24, 0] });
      for (const s of [-1, 1]) { k.add(G.box(0.5, 0.34, 0.02, 0.04), '#ffe3ec', { p: [s * 0.29, 0.24, 0.215], lw: 0.008 }); k.add(G.sph(0.022, 8, 6), '#ffd76a', { p: [s * 0.08, 0.24, 0.23], lw: 0.005 }); }
      k.add(G.box(0.95, 0.6, 0.07, 0.05), '#6b5a78', { p: [0, 0.86, -0.05] });
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.5), new THREE.MeshBasicMaterial({ map: ctx.tex.tv })); k.mesh(scr, [0, 0.86, -0.012]);
      scr.userData.on = ctx.tex.tv; scr.userData.off = ctx.tex.tvOff; scr.name = 'tvscreen';
      k.add(G.box(0.2, 0.06, 0.12, 0.02), '#6b5a78', { p: [0, 0.52, -0.05] });
      plant(k, [0.48, 0.48, 0], 0.45, '#b9e6cb');
    });
    ctx.touch({ name: 'tv', box: [-W / 2 + 0.45, 0.65, -1.15, 0.7, 1.3, 1.25], say: 'Cartoons! 📺', act: 'dance', react: 'tv', stand: [-1.75, -0.6] });
    // wall shelf above the TV
    k.at([-W / 2 + 0.12, 2.05, -1.2], [0, Math.PI / 2, 0], () => {
      k.add(G.box(0.9, 0.05, 0.22, 0.02), '#fff6ee', {});
      ['#ff9db5', '#9fd2ff', '#ffe58a', '#b9e6cb'].forEach((c, i) => k.add(G.box(0.06, 0.24, 0.15, 0.01), c, { p: [-0.35 + i * 0.07, 0.145, 0], lw: 0.007 }));
      k.add(G.sph(0.08, 12, 10), '#ffffff', { p: [0.25, 0.1, 0], s: [1, 0.8, 1] });
      k.add(G.heart(0.07, 0.02), '#ff8fb0', { p: [0.05, 0.12, 0], lw: 0.007 });
    });
    bunting(k, -2.9, 2.9, 3.05, bz + 0.06, 0.15);
  },

  kitchen(k, ctx, group) {
    const { D, W } = ctx, bz = -D / 2;
    const cab = '#a8e2cf', top = '#fff8ef';
    // counter run along the back wall
    const cx0 = -W / 2 + 0.02, cx1 = 0.95, cd = 0.62, ch = 0.9;
    const cw = cx1 - cx0, ccx = (cx0 + cx1) / 2;
    const tl = plane(cw, 0.62, ctx.tex.tiles); k.mesh(tl, [ccx, ch + 0.33, bz + 0.006]);
    k.add(G.box(cw, ch - 0.08, cd - 0.04, 0.03), cab, { p: [ccx, (ch - 0.08) / 2 + 0.04, bz + cd / 2 - 0.02] });
    k.add(G.box(cw + 0.04, 0.06, cd + 0.02, 0.025), top, { p: [ccx, ch, bz + cd / 2] });
    k.add(G.box(cw - 0.1, 0.08, 0.02, 0.02), '#ffffff', { p: [ccx, 0.04, bz + cd - 0.02], line: false });
    const n = 5, dw = cw / n;
    for (let i = 0; i < n; i++) {
      const x = cx0 + dw * (i + 0.5);
      if (i === 3) continue; // oven goes here
      k.add(G.box(dw - 0.08, ch - 0.25, 0.02, 0.04), tint(cab, 0.3), { p: [x, 0.47, bz + cd + 0.0], lw: 0.008 });
      k.add(G.cap(0.015, 0.08, 6), '#ffd76a', { p: [x, ch - 0.18, bz + cd + 0.02], r: [0, 0, Math.PI / 2], lw: 0.005 });
    }
    // oven + stove
    const ox = cx0 + dw * 3.5;
    k.add(G.box(dw - 0.06, ch - 0.2, 0.03, 0.04), '#fff6ee', { p: [ox, 0.45, bz + cd], lw: 0.008 });
    k.add(G.box(dw - 0.22, 0.3, 0.01, 0.04), '#ffe1a8', { p: [ox, 0.42, bz + cd + 0.02], line: false });
    k.add(G.cap(0.015, dw - 0.3, 6), '#e2b07f', { p: [ox, 0.72, bz + cd + 0.04], r: [0, 0, Math.PI / 2], lw: 0.005 });
    for (const [dx, dz] of [[-0.14, 0.15], [0.14, 0.15], [-0.14, 0.42], [0.14, 0.42]]) k.add(G.tor(0.07, 0.012, 6, 18), '#6b5a78', { p: [ox + dx, ch + 0.035, bz + dz], r: [Math.PI / 2, 0, 0], line: false });
    k.add(G.cyl(0.13, 0.12, 0.16, 20), '#ff9db5', { p: [ox - 0.14, ch + 0.11, bz + 0.42] });
    const lid = ctx.part([ox - 0.14, ch + 0.2, bz + 0.42], (kk) => {
      kk.add(G.cyl(0.13, 0.13, 0.02, 20), '#ffb3c8', {});
      kk.add(G.sph(0.025, 8, 6), '#ffffff', { p: [0, 0.03, 0], lw: 0.005 });
    });
    ctx.touch({ name: 'stove', box: [ox, 0.6, bz + cd / 2, dw, 1.2, cd], say: 'Hot hot! ♨️', act: 'reach', react: 'hop', target: lid, emoji: '♨️' });
    // sink + tap under the window
    const skx = -1.0;
    k.add(G.box(0.55, 0.04, 0.38, 0.03), '#d7ecf5', { p: [skx, ch + 0.015, bz + 0.33], lw: 0.008 });
    k.add(G.cyl(0.02, 0.02, 0.24, 8), '#cfd8e0', { p: [skx, ch + 0.13, bz + 0.1], lw: 0.006 });
    k.add(G.tor(0.08, 0.02, 6, 12, Math.PI), '#cfd8e0', { p: [skx, ch + 0.25, bz + 0.18], r: [0, Math.PI / 2, 0], lw: 0.006 });
    windowBack(k, ctx, skx, 1.95, 1.0, 0.95, '#ffe08a', 'flowers');
    ctx.touch({ name: 'sink', box: [skx, 0.6, bz + cd / 2, 0.75, 1.2, cd], say: 'Splash! 💧', act: 'reach', emoji: '💧' });
    ctx.touch({ name: 'window', box: [skx, 1.95, bz + 0.1, 1.3, 1.1, 0.2], say: 'Birds outside! 🐦', act: 'reach', react: 'sun', emoji: '🐦' });
    ctx.touch({ name: 'counter', box: [-2.3, 0.5, bz + cd / 2, 1.3, 1.0, cd], say: "Mom's kitchen! 🍳", act: 'jump', emoji: '🍳' });
    ctx.touch({ name: 'pans', box: [-2.25, 1.35, bz + 0.1, 0.9, 0.45, 0.2], say: 'Clang clang! 🍳', act: 'reach', emoji: '🎶' });
    ctx.touch({ name: 'cupboard', box: [-2.35, 2.15, bz + 0.2, 1.25, 0.65, 0.4], say: 'Cookies up there? 🍪', act: 'reach', emoji: '🍪' });
    ctx.touch({ name: 'cupboard2', box: [0.35, 2.15, bz + 0.2, 1.2, 0.65, 0.4], say: 'Cookies up there? 🍪', act: 'reach', emoji: '🍪' });
    for (const [x, c] of [[skx - 0.3, '#ffc9b3'], [skx + 0.3, '#b5d8ff']]) plant(k, [x, 1.48, bz + 0.12], 0.45, c);
    // upper cabinets
    for (const [x0, x1] of [[cx0, -1.75], [-0.25, cx1]]) {
      const w = x1 - x0, x = (x0 + x1) / 2;
      k.add(G.box(w, 0.62, 0.36, 0.04), cab, { p: [x, 2.15, bz + 0.18] });
      const m = Math.max(1, Math.round(w / 0.55));
      for (let i = 0; i < m; i++) {
        const dx = x0 + (w / m) * (i + 0.5);
        k.add(G.box(w / m - 0.08, 0.52, 0.02, 0.04), tint(cab, 0.3), { p: [dx, 2.15, bz + 0.37], lw: 0.008 });
        k.add(G.heart(0.035, 0.012), '#ffffff', { p: [dx, 2.25, bz + 0.385], line: false });
      }
    }
    // hanging utensils rail
    k.add(G.cyl(0.012, 0.012, 0.8, 6), '#e2b07f', { p: [-2.25, 1.55, bz + 0.05], r: [0, 0, Math.PI / 2], lw: 0.005 });
    [['#ff9db5', 0.13], ['#ffe58a', 0.1], ['#9fd2ff', 0.11]].forEach(([c, r], i) => {
      const x = -2.5 + i * 0.25;
      k.add(G.cyl(0.006, 0.006, 0.1, 4), '#e2b07f', { p: [x, 1.49, bz + 0.06], line: false });
      k.add(G.cyl(r, r, 0.03, 18), c, { p: [x, 1.36 - r * 0.4, bz + 0.07], r: [Math.PI / 2, 0, 0], lw: 0.008 });
    });
    // fridge with magnets
    const fx = 1.95, fw = 0.85, fh = 2.0, fd = 0.7;
    ctx.touch({ name: 'fridge', box: [fx, fh / 2, bz + fd / 2 + 0.02, fw, fh, fd], say: 'Snack time! 🍎', act: 'jump', emoji: '🍎' });
    k.add(G.box(fw, fh, fd, 0.12), '#fff3e6', { p: [fx, fh / 2, bz + fd / 2 + 0.02] });
    k.add(G.box(fw - 0.02, 0.025, 0.02, 0.01), '#e9d6c8', { p: [fx, 1.3, bz + fd + 0.025], line: false });
    for (const y of [1.55, 0.95]) k.add(G.cap(0.022, 0.2, 6), '#e2b07f', { p: [fx - fw / 2 + 0.1, y, bz + fd + 0.06], lw: 0.006 });
    k.add(G.heart(0.06, 0.02), '#ff8fb0', { p: [fx + 0.15, 1.7, bz + fd + 0.04], lw: 0.007 });
    k.add(G.star(0.05, 0.02), '#ffe08a', { p: [fx - 0.05, 1.82, bz + fd + 0.04], lw: 0.007 });
    const dr = plane(0.28, 0.33, ctx.tex.photoDrawing); k.mesh(dr, [fx + 0.1, 1.0, bz + fd + 0.04], [0, 0, 0.08]);
    k.add(G.sph(0.025, 8, 6), '#9fd2ff', { p: [fx + 0.1, 1.16, bz + fd + 0.05], lw: 0.005 });
    // round table + chairs + booster seat
    const tx = 0.75, tz = 0.35;
    k.add(G.cyl(0.55, 0.55, 0.06, 32), '#fff6ee', { p: [tx, 0.74, tz] });
    ctx.touch({ name: 'table', box: [tx, 0.45, tz, 1.1, 0.9, 1.1], say: 'Yum, fruit! 🍓', act: 'jump', emoji: '🍓' });
    ctx.touch({ name: 'chair', box: [tx + 0.7, 0.5, tz - 0.05, 0.5, 1.0, 0.5], say: 'My chair! 🪑', act: 'jump', emoji: '💫' });
    ctx.touch({ name: 'chair2', box: [tx - 0.08, 0.5, tz - 0.72, 0.5, 1.0, 0.5], say: "Daddy's chair! 🪑", act: 'jump', emoji: '💫' });
    k.add(G.cyl(0.07, 0.07, 0.7, 12), '#e2b07f', { p: [tx, 0.37, tz] });
    k.add(G.cyl(0.28, 0.3, 0.04, 20), '#e2b07f', { p: [tx, 0.02, tz] });
    k.add(G.cyl(0.5, 0.5, 0.012, 32), '#ffc9d8', { p: [tx, 0.775, tz], line: false });
    // fruit bowl
    k.add(G.sph(0.17, 16, 10, ), '#b5d8ff', { p: [tx - 0.1, 0.8, tz - 0.1], s: [1, 0.45, 1] });
    [['#ff8a8a', -0.17, -0.12], ['#ffd76a', -0.03, -0.1], ['#a8e2a8', -0.1, -0.02]].forEach(([c, dx, dz]) => k.add(G.sph(0.06, 12, 10), c, { p: [tx + dx, 0.88, tz + dz], lw: 0.007 }));
    const chair = (x, z, ry, col) => k.at([x, 0, z], [0, ry, 0], () => {
      for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) k.add(G.cyl(0.025, 0.025, 0.45, 8), '#e2b07f', { p: [dx, 0.225, dz] });
      k.add(G.box(0.44, 0.06, 0.44, 0.03), col, { p: [0, 0.47, 0] });
      k.add(G.box(0.44, 0.45, 0.05, 0.08), col, { p: [0, 0.72, -0.2] });
      k.add(G.heart(0.06, 0.02), '#ffffff', { p: [0, 0.75, -0.17], line: false });
    });
    chair(tx + 0.7, tz - 0.05, -Math.PI / 2 + 0.2, '#ffc9d8');
    chair(tx - 0.08, tz - 0.72, 0, '#ffe08a');
    // wall clock on the right wall + bunting
    k.at([W / 2 - 0.02, 2.35, -0.3], [0, -Math.PI / 2, 0], () => {
      k.add(G.cyl(0.24, 0.24, 0.05, 28), '#ffb3c8', { r: [Math.PI / 2, 0, 0] });
      const cf = plane(0.4, 0.4, ctx.tex.clock); cf.material.transparent = true; k.mesh(cf, [0, 0, 0.03]);
    });
    ctx.touch({ name: 'clock', box: [W / 2 - 0.05, 2.35, -0.3, 0.1, 0.5, 0.5], say: 'Tick tock! ⏰', act: 'dance', emoji: '⏰', stand: [2.4, -0.3] });
    ctx.plant([W / 2 - 0.35, 0, 1.6], 1.0, '#ffc9d8');
    bunting(k, -2.9, 2.9, 3.05, bz + 0.06, 0.12);
    const run = plane(2.2, 0.75, ctx.tex.rugRect); run.rotation.x = -Math.PI / 2; run.position.set(-1.2, 0.008, bz + 1.15); run.material = run.material.clone(); run.material.map = ctx.tex.rugRunner; run.material.transparent = true; run.material.alphaTest = 0.1; group.add(run);
    // basket of play food by the wall
    k.add(G.cyl(0.2, 0.16, 0.2, 18), '#e9c08f', { p: [2.4, 0.1, 0.55] });
    k.add(G.tor(0.2, 0.02, 6, 20), '#d9a36a', { p: [2.4, 0.2, 0.55], r: [Math.PI / 2, 0, 0], line: false });
    const fruit = ctx.part([2.4, 0.24, 0.55], (kk) => [['#ff8a8a', -0.06, 0], ['#ffd76a', 0.07, 0.03], ['#a8e2a8', 0, -0.07]].forEach(([c, dx, dz]) => kk.add(G.sph(0.07, 12, 10), c, { p: [dx, 0, dz], lw: 0.008 })));
    ctx.touch({ name: 'basket', box: [2.4, 0.15, 0.55, 0.45, 0.35, 0.45], say: 'Play food! 🍋', act: 'reach', react: 'hop', target: fruit, emoji: '🍋' });
  },
};

// ---------- whole house ----------
export function buildHouse(cfg, rooms, scene) {
  const { width: W, depth: D, height: H } = cfg.size;
  const T = 0.16, S = W + T;
  const tex = {
    photoBaby: TX.photo('baby'), photoMom: TX.photo('mom'), photoOne: TX.photo('one'), photoHeart: TX.photo('heart'),
    photoDrawing: TX.photo('drawing'), photoFamily: TX.photo('family'),
    name: TX.nameBanner(cfg.name || 'ATHENA'), tv: TX.tvScreen(), clock: TX.clockFace(),
    rugRound: TX.roundRug('#ffc9d8', '#ffe3ec'), rugRect: TX.rectRug('#b5d8ff', '#e3f2ff'), rugRunner: TX.rectRug('#ffc9d8', '#fff0f4'),
    tiles: TX.tiles('#ffffff', '#e2f5ee'),
    tvOff: canvasTex(64, 40, (g) => { g.fillStyle = '#4e4560'; g.fillRect(0, 0, 64, 40); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(8, 0); g.lineTo(22, 0); g.lineTo(6, 40); g.lineTo(0, 40); g.closePath(); g.fill(); }),
  };
  const out = [];
  rooms.forEach((room, i) => {
    const group = new THREE.Group(); group.name = 'room:' + room.id;
    group.position.set(i * S, 0, 0);
    const ctx = {
      W, D, H, T, room, index: i, hasNext: i < rooms.length - 1, tex, windows: [],
      roofCol: room.roof || '#f7a8a0',
      wallTex: TX.wallpaper(room.wallpaper || 'dots', room.wall),
      floorTex: room.floorStyle === 'checker' ? TX.checker(room.floor, '#ffffff') : TX.planks(room.floor),
    };
    ctx.floorTex.repeat.set(W / 2.5, D / 2.5);
    ctx.touches = [];
    // a small object with its own mesh, so it can move when Athena touches it
    ctx.part = (p, fn, lw = 0.012, r) => {
      const kk = new Kit(lw); fn(kk);
      const g = kk.build(); g.position.set(...p); if (r) g.rotation.set(...r);
      g.userData.home = g.position.clone(); g.userData.homeRot = g.rotation.clone();
      group.add(g); return g;
    };
    ctx.touch = (def) => ctx.touches.push(def);
    ctx.plant = (p, sc, pot) => {
      const g = ctx.part(p, (kk) => plant(kk, [0, 0, 0], sc, pot));
      ctx.touch({ name: 'plant', box: [p[0], 0.45 * sc, p[2], 0.55 * sc, 0.9 * sc, 0.55 * sc], say: 'Hello, plant! 🌱', act: 'reach', react: 'wiggle', target: g, emoji: '🍃' });
    };
    const k = new Kit(0.016);
    shell(k, ctx, group);
    (BUILD[room.builder] || ((kk, c) => windowBack(kk, c, 0, 1.8, 1.2, 1.2, '#ffe08a')))(k, ctx, group);
    group.add(k.build());
    ctx.windows.forEach((w) => { sunbeams(group, w); dust(group, w); });
    // invisible tap boxes for everything Athena can touch
    for (const def of ctx.touches) {
      const [x, y, z, sx2, sy2, sz2] = def.box;
      const hit = new THREE.Mesh(new THREE.BoxGeometry(sx2, sy2, sz2), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(x, y, z); hit.name = 'touch';
      hit.userData.touch = { ...def, room: room.id };
      group.add(hit);
    }
    // doors: tap box in each doorway (the wall on the right side of this room)
    if (ctx.hasNext) {
      const hit = new THREE.Mesh(new THREE.BoxGeometry(T + 0.5, DOOR.h, DOOR.z1 - DOOR.z0), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(W / 2 + T / 2, DOOR.h / 2, (DOOR.z0 + DOOR.z1) / 2);
      hit.userData.door = [room.id, rooms[i + 1].id];
      hit.name = 'door';
      group.add(hit);
    }
    scene.add(group);
    out.push({ room, group, x: i * S });
  });
  // the ground, a floor slab, garden bits and clouds
  const k = new Kit(0.02);
  const x0 = -W / 2 - T, x1 = (rooms.length - 1) * S + W / 2 + T, cx = (x0 + x1) / 2, len = x1 - x0;
  k.add(G.box(len + 0.1, 0.32, D + T + 0.2, 0.06), '#fff3e6', { p: [cx, -0.16, -T / 2 + 0.05] });
  k.add(G.box(len + 0.3, 0.08, D + T + 0.4, 0.04), '#ffd7c2', { p: [cx, -0.36, -T / 2 + 0.05] });
  const bush = (x, z, s, flower) => {
    k.add(G.sph(0.35 * s, 14, 10), '#9fdcab', { p: [x, 0.05 * s - 0.25, z], s: [1.3, 0.9, 1] });
    k.add(G.sph(0.28 * s, 14, 10), '#b3e6b5', { p: [x + 0.3 * s, 0.0 - 0.22, z + 0.05], s: [1.2, 0.9, 1] });
    if (flower) for (let i = 0; i < 3; i++) k.add(G.sph(0.06 * s, 8, 6), flower, { p: [x - 0.2 * s + i * 0.25 * s, 0.22 * s - 0.2, z + 0.25 * s], lw: 0.008 });
  };
  const tree = (x, z, s) => {
    k.add(G.cyl(0.12 * s, 0.16 * s, 1.6 * s, 10), '#d9a36a', { p: [x, 0.8 * s - 0.3, z] });
    k.add(G.sph(0.8 * s, 16, 12), '#9fdcab', { p: [x, 1.9 * s - 0.3, z] });
    k.add(G.sph(0.6 * s, 16, 12), '#b3e6b5', { p: [x + 0.55 * s, 1.55 * s - 0.3, z + 0.2] });
    k.add(G.sph(0.55 * s, 16, 12), '#8fd39a', { p: [x - 0.5 * s, 1.5 * s - 0.3, z + 0.1] });
    for (let i = 0; i < 4; i++) k.add(G.sph(0.07 * s, 8, 6), '#ff9db5', { p: [x - 0.4 * s + i * 0.28 * s, 1.75 * s - 0.3 + (i % 2) * 0.3 * s, z + 0.7 * s], lw: 0.008 });
  };
  tree(x0 - 1.3, -1.2, 1.3); tree(x1 + 1.3, -1.0, 1.2);
  bush(x0 - 0.8, 1.6, 1, '#ffe58a'); bush(x1 + 0.7, 1.7, 1, '#ff9db5');
  for (let x = x0 + 0.6; x < x1; x += 1.9) bush(x, D / 2 + 0.55, 0.7, ['#ff9db5', '#ffe58a', '#ffffff', '#d9c2ff'][Math.round(x) % 4 < 0 ? 0 : Math.round(x) % 4]);
  // puffy clouds far behind
  for (const [x, y, z, s] of [[x0 + 1, 6.2, -9, 1.2], [cx, 7.2, -11, 1.6], [x1 - 1, 5.8, -9, 1.1]]) {
    k.add(G.sph(0.9 * s, 14, 10), '#ffffff', { p: [x, y, z], s: [1.6, 1, 0.6], lw: 0.03 });
    k.add(G.sph(0.7 * s, 14, 10), '#ffffff', { p: [x - 1.1 * s, y - 0.3 * s, z + 0.1], s: [1.4, 0.9, 0.6], lw: 0.03 });
    k.add(G.sph(0.65 * s, 14, 10), '#ffffff', { p: [x + 1.1 * s, y - 0.35 * s, z + 0.1], s: [1.4, 0.9, 0.6], lw: 0.03 });
  }
  const outside = k.build(); outside.name = 'outside';
  scene.add(outside);
  // ground: big soft lawn circle
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: '#d4f0c8' }));
  lawn.rotation.x = -Math.PI / 2; lawn.scale.set(len / 2 + 6, 9, 1); lawn.position.set(cx, -0.4, 0.5);
  scene.add(lawn);
  const lawnEdge = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: '#c3e8b5' }));
  lawnEdge.rotation.x = -Math.PI / 2; lawnEdge.scale.set(len / 2 + 6.15, 9.15, 1); lawnEdge.position.set(cx, -0.41, 0.5);
  scene.add(lawnEdge);
  return { rooms: out, S, W, D, H, T };
}
