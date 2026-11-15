// Extra cute decorations: glowing fairy lights, balloons, a star mobile, a rainbow, plush bunny,
// cupcake stand and cookie jar. Placed on walls, shelves and tables so they never block Athena's walk.
import { THREE, G } from './kit.js';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';

const BULBS = ['#ffd27a', '#ff9fc4', '#9fdcff', '#b8f0c4', '#e2c4ff'];

// little bulbs glow by themselves (no light needed), all merged into one mesh named "glow"
function glowMesh(points, cols, r = 0.045) {
  const geos = points.map((p, i) => {
    const g = new THREE.SphereGeometry(r, 10, 8);
    g.translate(p[0], p[1], p[2]);
    const c = new THREE.Color(cols[i % cols.length]);
    const arr = new Float32Array(g.attributes.position.count * 3);
    for (let k = 0; k < arr.length; k += 3) { arr[k] = c.r; arr[k + 1] = c.g; arr[k + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    g.deleteAttribute('uv');
    return g;
  });
  const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ vertexColors: true }));
  m.name = 'glow';
  return m;
}

// a sagging wire with round glowing bulbs, from (x0, y) to (x1, y) along the back wall at depth z
export function fairyLights(k, group, x0, x1, y, z, sag = 0.1, step = 0.2) {
  const yAt = (x) => { const t = ((x - x0) / (x1 - x0)) * 2 - 1; return y - sag * (1 - t * t); };
  const segs = 14;
  for (let i = 0; i < segs; i++) {
    const a = x0 + ((x1 - x0) * i) / segs, b = x0 + ((x1 - x0) * (i + 1)) / segs;
    const ya = yAt(a), yb = yAt(b), len = Math.hypot(b - a, yb - ya);
    k.add(G.cyl(0.006, 0.006, len, 4), '#7a8a6a', { p: [(a + b) / 2, (ya + yb) / 2, z], r: [0, 0, Math.atan2(yb - ya, b - a) - Math.PI / 2], line: false });
  }
  const pts = [];
  for (let x = x0 + step / 2; x < x1; x += step) pts.push([x, yAt(x) - 0.045, z + 0.02]);
  group.add(glowMesh(pts, BULBS));
}

// a bunch of shiny balloons tied at `tie`, floating up and leaning a little
export function balloons(k, tie, cols = ['#ff9fc4', '#ffd27a', '#9fdcff'], height = 1.3) {
  const [tx, ty, tz] = tie;
  cols.forEach((c, i) => {
    const dx = (i - (cols.length - 1) / 2) * 0.2, dz = (i % 2) * 0.08;
    const top = [tx + dx, ty + height + (i % 2) * 0.15, tz + dz];
    const len = Math.hypot(dx, top[1] - ty - 0.18, dz);
    // string
    k.add(G.cyl(0.004, 0.004, len, 4), '#ffffff', { p: [tx + dx / 2, ty + (top[1] - ty - 0.18) / 2, tz + dz / 2], r: [dz / len, 0, -dx / len], line: false });
    if (i === 1) {
      k.add(G.heart(0.13, 0.08), c, { p: [top[0], top[1] - 0.05, top[2]], lw: 0.01 });
    } else {
      k.add(G.sph(0.16, 18, 14), c, { p: top, s: [1, 1.15, 1], lw: 0.01 });
      k.add(G.cone(0.03, 0.05, 8), c, { p: [top[0], top[1] - 0.2, top[2]], r: [Math.PI, 0, 0], line: false });
      // shine
      k.add(G.sph(0.035, 8, 6), '#ffffff', { p: [top[0] - 0.06, top[1] + 0.07, top[2] + 0.12], s: [0.7, 1.2, 0.4], line: false });
    }
  });
}

// a baby mobile: wooden ring with hanging stars and a glowing moon
export function mobile(k, group, p) {
  const [x, y, z] = p;
  k.add(G.cyl(0.006, 0.006, 0.5, 4), '#e2b07f', { p: [x, y + 0.25, z], line: false });
  k.add(G.tor(0.28, 0.018, 8, 28), '#ffc9d8', { p: [x, y, z], r: [Math.PI / 2, 0, 0], lw: 0.007 });
  const things = [['star', '#ffd27a'], ['heart', '#ff9fc4'], ['star', '#9fdcff'], ['cloud', '#ffffff'], ['star', '#b8f0c4']];
  things.forEach(([kind, c], i) => {
    const a = (i / things.length) * Math.PI * 2, hx = x + Math.cos(a) * 0.28, hz = z + Math.sin(a) * 0.28, drop = 0.18 + (i % 2) * 0.14;
    k.add(G.cyl(0.004, 0.004, drop, 4), '#ffffff', { p: [hx, y - drop / 2, hz], line: false });
    const py = y - drop - 0.07;
    if (kind === 'star') k.add(G.star(0.07, 0.025), c, { p: [hx, py, hz], lw: 0.007 });
    else if (kind === 'heart') k.add(G.heart(0.06, 0.025), c, { p: [hx, py, hz], lw: 0.007 });
    else { k.add(G.sph(0.06, 12, 10), c, { p: [hx, py, hz], s: [1.5, 1, 0.7], lw: 0.007 }); k.add(G.sph(0.045, 12, 10), c, { p: [hx + 0.06, py + 0.03, hz], s: [1.2, 1, 0.7], line: false }); }
  });
  // glowing crescent moon in the middle
  const moon = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 10, 20, Math.PI * 1.25), new THREE.MeshBasicMaterial({ color: '#fff0a8' }));
  moon.name = 'glow';
  moon.position.set(x, y - 0.3, z); moon.rotation.z = 0.9;
  group.add(moon);
  k.add(G.cyl(0.004, 0.004, 0.22, 4), '#ffffff', { p: [x, y - 0.12, z], line: false });
}

// a soft rainbow on a wall; ry turns it to face into the room
export function rainbow(k, p, ry, s = 1) {
  const cols = ['#ff9fb3', '#ffc98a', '#ffe98a', '#b8f0c4', '#9fdcff', '#d8c4ff'];
  k.at(p, [0, ry, 0], () => {
    cols.forEach((c, i) => k.add(G.tor(0.42 - i * 0.055, 0.03, 8, 30, Math.PI), c, { p: [0, 0, 0.01 * i], lw: 0.007 }));
    for (const sx of [-1, 1]) {
      k.add(G.sph(0.1, 12, 10), '#ffffff', { p: [sx * 0.34, 0.0, 0.07], s: [1.4, 1, 0.6], lw: 0.008 });
      k.add(G.sph(0.08, 12, 10), '#ffffff', { p: [sx * 0.24, 0.05, 0.08], s: [1.2, 1, 0.6], lw: 0.008 });
    }
  }, [s, s, s]);
}

// plush bunny sitting on the bed
export function bunny(k, p, ry = 0, col = '#ffffff', inner = '#ffc9d8') {
  k.at(p, [0, ry, 0], () => {
    k.add(G.sph(0.1, 14, 12), col, { p: [0, 0.09, 0], s: [1, 0.95, 0.9] });
    k.add(G.sph(0.085, 14, 12), col, { p: [0, 0.24, 0.01] });
    for (const s of [-1, 1]) {
      k.add(G.cap(0.03, 0.12, 8), col, { p: [s * 0.04, 0.38, 0], r: [0, 0, s * 0.18] });
      k.add(G.cap(0.015, 0.09, 6), inner, { p: [s * 0.04, 0.38, 0.018], r: [0, 0, s * 0.18], line: false });
      k.add(G.sph(0.012, 6, 6), '#5a3a3a', { p: [s * 0.03, 0.26, 0.08], line: false });
      k.add(G.sph(0.02, 8, 6), '#ffb3c8', { p: [s * 0.05, 0.23, 0.07], s: [1, 0.6, 0.4], line: false });
    }
    k.add(G.sph(0.012, 6, 6), '#ff8fb0', { p: [0, 0.245, 0.09], line: false });
  });
}

// cupcakes on a little stand
export function cupcakes(k, p) {
  const [x, y, z] = p;
  k.add(G.cyl(0.03, 0.05, 0.08, 10), '#ffffff', { p: [x, y + 0.04, z] });
  k.add(G.cyl(0.19, 0.19, 0.02, 24), '#ffffff', { p: [x, y + 0.09, z] });
  [['#ff9fc4', -0.09, 0], ['#9fdcff', 0.09, 0.02], ['#ffe08a', 0, -0.09], ['#b8f0c4', 0.01, 0.09]].forEach(([c, dx, dz]) => {
    k.add(G.cyl(0.045, 0.035, 0.05, 10), '#f4c08a', { p: [x + dx, y + 0.125, z + dz], lw: 0.005 });
    k.add(G.sph(0.05, 10, 8), c, { p: [x + dx, y + 0.16, z + dz], s: [1, 0.8, 1], lw: 0.005 });
    k.add(G.sph(0.014, 6, 6), '#ff5a7a', { p: [x + dx, y + 0.205, z + dz], line: false });
  });
}

// bear-shaped cookie jar
export function cookieJar(k, p) {
  const [x, y, z] = p;
  k.add(G.cyl(0.11, 0.1, 0.2, 20), '#ffe3ec', { p: [x, y + 0.1, z] });
  k.add(G.sph(0.115, 16, 10), '#ffb3c8', { p: [x, y + 0.2, z], s: [1, 0.45, 1] });
  for (const s of [-1, 1]) k.add(G.sph(0.035, 8, 6), '#ffb3c8', { p: [x + s * 0.07, y + 0.26, z] });
  k.add(G.cyl(0.05, 0.05, 0.005, 14), '#c8935f', { p: [x, y + 0.1, z + 0.105], r: [Math.PI / 2, 0, 0], line: false });
  for (const [dx, dy] of [[-0.015, 0.11], [0.02, 0.09], [0.0, 0.08]]) k.add(G.sph(0.008, 6, 6), '#6b4046', { p: [x + dx, y + dy, z + 0.108], line: false });
}
