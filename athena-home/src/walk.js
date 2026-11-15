// Walking: a floor map of the whole house (where Athena can stand) and a path finder.
// Furniture and walls are blocked; doorways are open, so she can walk into every room.
import { THREE } from './kit.js';
import { DOOR } from './rooms.js';

// Furniture footprints per room builder, in room coordinates: [x0, z0, x1, z1] (metres).
// A new room can also list its own in rooms.json as "blocked": [[x0, z0, x1, z1], ...].
export const BLOCKS = {
  bedroom: [
    [-3.0, -2.3, -1.05, -0.95],  // wardrobe + open doors
    [-0.65, -2.3, 0.45, -1.88],  // toy shelf
    [0.95, -2.3, 2.95, -1.18],   // bed
    [-2.85, 1.45, -2.3, 2.05],   // plant
  ],
  living: [
    [-1.12, -2.3, 1.25, -1.38],  // sofa (Mom)
    [-0.33, -0.98, 0.63, -0.02], // coffee table
    [1.4, -2.3, 1.8, -1.7],      // floor lamp
    [1.85, -2.3, 2.55, -1.5],    // big plant
    [-3.0, -1.85, -2.25, -0.45], // TV cabinet
  ],
  kitchen: [
    [-3.0, -2.3, 0.97, -1.66],   // counters
    [1.5, -2.3, 2.4, -1.55],     // fridge
    [0.2, -0.2, 1.3, 0.9],       // table
    [1.2, 0.05, 1.7, 0.55],      // chair
    [0.42, -0.62, 0.92, -0.12],  // chair
    [2.15, 0.3, 2.65, 0.8],      // basket
    [2.35, 1.3, 2.95, 1.9],      // plant
  ],
};

const CELL = 0.1, RAD = 0.18; // grid size and Athena's "body radius"

export function buildNav(house, extraBlocks = []) {
  const { W, D, T, S } = house;
  const n = house.rooms.length;
  const x0 = -W / 2, x1 = (n - 1) * S + W / 2, z0 = -D / 2, z1 = D / 2 - 0.15;
  const cols = Math.ceil((x1 - x0) / CELL), rows = Math.ceil((z1 - z0) / CELL);
  const free = new Uint8Array(cols * rows).fill(1);
  const cx = (i) => x0 + (i + 0.5) * CELL, cz = (j) => z0 + (j + 0.5) * CELL;
  const block = (bx0, bz0, bx1, bz1) => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = cx(i), z = cz(j);
      if (x > bx0 - RAD && x < bx1 + RAD && z > bz0 - RAD && z < bz1 + RAD) free[j * cols + i] = 0;
    }
  };
  // outer walls and the back wall
  block(-1e3, -1e3, x0, 1e3); block(x1, -1e3, 1e3, 1e3); block(-1e3, -1e3, 1e3, z0);
  house.rooms.forEach((r, i) => {
    const ox = r.x;
    for (const b of (BLOCKS[r.room.builder] || []).concat(r.room.blocked || [])) block(ox + b[0], b[1], ox + b[2], b[3]);
    // the wall to the next room, with the doorway left open
    if (i < n - 1) {
      const wx0 = ox + W / 2, wx1 = ox + W / 2 + T;
      block(wx0, -1e3, wx1, DOOR.z0);
      block(wx0, DOOR.z1, wx1, 1e3);
    }
  });
  for (const b of extraBlocks) block(...b);
  const at = (i, j) => i >= 0 && j >= 0 && i < cols && j < rows && free[j * cols + i] === 1;
  const toCell = (x, z) => [Math.floor((x - x0) / CELL), Math.floor((z - z0) / CELL)];

  // nearest free cell to a point (search in growing rings)
  function nearestFree(x, z) {
    let [i, j] = toCell(THREE.MathUtils.clamp(x, x0, x1 - 0.01), THREE.MathUtils.clamp(z, z0, z1 - 0.01));
    if (at(i, j)) return [i, j];
    for (let r = 1; r < 60; r++) {
      let best = null, bd = 1e9;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r || !at(i + di, j + dj)) continue;
        const d = di * di + dj * dj;
        if (d < bd) { bd = d; best = [i + di, j + dj]; }
      }
      if (best) return best;
    }
    return null;
  }
  // straight line clear? (for smoothing the path)
  function clear(a, b) {
    const dx = b[0] - a[0], dz = b[1] - a[1], steps = Math.ceil(Math.hypot(dx, dz) / (CELL * 0.5));
    for (let k = 0; k <= steps; k++) {
      const [i, j] = toCell(a[0] + (dx * k) / steps, a[1] + (dz * k) / steps);
      if (!at(i, j)) return false;
    }
    return true;
  }
  // A* on the grid (8 directions), then pull the string tight
  function path(fromX, fromZ, toX, toZ) {
    const s = nearestFree(fromX, fromZ), g = nearestFree(toX, toZ);
    if (!s || !g) return null;
    const N = cols * rows, gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1);
    const si = s[1] * cols + s[0], gi = g[1] * cols + g[0];
    const open = [si]; gs[si] = 0;
    const fs = new Float32Array(N).fill(Infinity);
    const h = (k) => Math.hypot((k % cols) - g[0], Math.floor(k / cols) - g[1]);
    fs[si] = h(si);
    const closed = new Uint8Array(N);
    while (open.length) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (fs[open[k]] < fs[open[bi]]) bi = k;
      const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (cur === gi) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const ci = cur % cols, cj = Math.floor(cur / cols);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (!at(ni, nj) || (di && dj && (!at(ci + di, cj) || !at(ci, cj + dj)))) continue;
        const nk = nj * cols + ni, cost = gs[cur] + (di && dj ? 1.414 : 1);
        if (cost < gs[nk]) { gs[nk] = cost; fs[nk] = cost + h(nk); came[nk] = cur; open.push(nk); }
      }
    }
    if (si !== gi && came[gi] < 0) return null;
    const cells = [];
    for (let k = gi; k !== -1; k = came[k]) { cells.push([cx(k % cols), cz(Math.floor(k / cols))]); if (k === si) break; }
    cells.reverse();
    // end exactly on the tapped point when it is free
    const [ti, tj] = toCell(toX, toZ);
    if (at(ti, tj) && ti === g[0] && tj === g[1]) cells[cells.length - 1] = [toX, toZ];
    const out = [[fromX, fromZ]];
    let a = out[0];
    for (let k = 1; k < cells.length; k++) {
      if (k === cells.length - 1 || !clear(a, cells[k + 1])) { out.push(cells[k]); a = cells[k]; }
    }
    return out;
  }
  return { path, nearestFree: (x, z) => { const c = nearestFree(x, z); return c && [cx(c[0]), cz(c[1])]; }, bounds: { x0, x1, z0, z1 } };
}
