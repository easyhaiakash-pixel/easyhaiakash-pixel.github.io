// Gift items, all drawn in code. One builder per "model" name in data/items.json.
// Every builder draws the item standing on the floor at (0,0,0), facing the camera (+z).
// Colour comes from the item's "color". "generic-box" is the fallback for anything new.
import { THREE, Kit, G, C2, canvasTex, plane, blobTex } from './kit.js';

const W = '#ffffff';
const DEPTH_ONLY = new THREE.MeshBasicMaterial({ colorWrite: false });
export function tint(col, amt) { // amt > 0 = lighter (toward white), < 0 = darker
  const c = new THREE.Color(col);
  return '#' + (amt >= 0 ? c.lerp(new THREE.Color('#ffffff'), amt) : c.lerp(new THREE.Color('#5a2a30'), -amt)).getHexString();
}

function hanger(k, y) {
  k.add(G.tor(0.035, 0.008, 6, 16, Math.PI * 1.4), '#d8b07e', { p: [0, y + 0.06, 0], r: [0, 0, -0.2], lw: 0.006 });
  k.add(G.cap(0.012, 0.3), '#e8c18f', { p: [0, y, 0], r: [0, 0, Math.PI / 2], lw: 0.007 });
}

const B = {
  dress(k, it) {
    const c = it.color || '#ff8fb0';
    hanger(k, 0.7);
    if (it.variant === 'knit') {
      // knitted dress: A-line with knit ribs, puff sleeves and a cream bow
      k.add(G.lathe([[0, 0.12], [0.2, 0.12], [0.21, 0.15], [0.15, 0.42], [0.11, 0.6], [0.08, 0.68], [0, 0.69]]), c, { s: [1, 1, 0.6] });
      for (let i = 0; i < 6; i++) {
        const y = 0.17 + i * 0.075, r = 0.205 - i * 0.017;
        k.add(G.tor(r, 0.01, 6, 28), tint(c, -0.12), { p: [0, y, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.6, 1], line: false });
      }
      k.add(G.tor(0.205, 0.022, 8, 28), tint(c, 0.4), { p: [0, 0.13, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.6, 1] });
      for (const s of [-1, 1]) k.add(G.sph(0.06, 14, 10), c, { p: [s * 0.12, 0.62, 0], s: [1, 0.85, 0.75] });
      k.at([0, 0.52, 0.075], [0, 0, 0], () => {
        for (const s of [-1, 1]) k.add(G.cone(0.045, 0.09, 12), '#fff3e2', { p: [s * 0.05, 0, 0], r: [0, 0, s * Math.PI / 2], s: [1, 1, 0.5], lw: 0.007 });
        k.add(G.sph(0.024, 10, 8), '#ffe3c6', { lw: 0.007 });
      });
    } else {
      // party frock: fitted top + big layered tutu skirt + satin bow
      k.add(G.lathe([[0, 0.38], [0.11, 0.38], [0.1, 0.5], [0.09, 0.62], [0.07, 0.69], [0, 0.7]]), c, { s: [1, 1, 0.65] });
      const layers = [[0.27, 0.15, tint(c, 0.15)], [0.24, 0.22, c], [0.2, 0.3, tint(c, 0.08)]];
      for (const [r, y, col] of layers) {
        k.add(G.lathe([[0, y + 0.18], [0.1, y + 0.18], [r, y], [r * 0.96, y - 0.03], [0, y - 0.03]], 30), col, { s: [1, 1, 0.68] });
      }
      // tulle scallops along the hem
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        k.add(G.sph(0.04, 10, 8), tint(c, 0.3), { p: [Math.cos(a) * 0.26, 0.13, Math.sin(a) * 0.26 * 0.68], s: [1, 0.6, 1], line: false });
      }
      for (const s of [-1, 1]) k.add(G.sph(0.05, 12, 10), tint(c, 0.15), { p: [s * 0.11, 0.64, 0], s: [1, 0.8, 0.7] });
      k.add(G.tor(0.105, 0.016, 6, 24), '#fff1f4', { p: [0, 0.4, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.65, 1], line: false });
      k.at([0.06, 0.41, 0.07], [0, 0, 0.2], () => {
        for (const s of [-1, 1]) k.add(G.cone(0.04, 0.08, 12), '#fff1f4', { p: [s * 0.045, 0, 0], r: [0, 0, s * Math.PI / 2], s: [1, 1, 0.5], lw: 0.007 });
        k.add(G.sph(0.02, 10, 8), '#ffd6df', { lw: 0.007 });
      });
    }
  },

  'outfit-set'(k, it) {
    // "stand": true = on its own little clothes rack (for spots outside the wardrobe)
    if (it.stand) {
      const rc = '#ffb3c8';
      for (const s of [-1, 1]) {
        k.add(G.cyl(0.018, 0.018, 1.1, 10), rc, { p: [s * 0.36, 0.57, 0], lw: 0.007 });
        k.add(G.cap(0.025, 0.24, 8), rc, { p: [s * 0.36, 0.03, 0], r: [Math.PI / 2, 0, 0], lw: 0.007 });
        k.add(G.sph(0.035, 10, 8), '#ffd76a', { p: [s * 0.36, 1.13, 0], lw: 0.006 });
      }
      k.add(G.cyl(0.014, 0.014, 0.72, 10), '#e2b07f', { p: [0, 1.06, 0], r: [0, 0, Math.PI / 2], lw: 0.006 });
      k.add(G.heart(0.06, 0.02), '#ff8fb0', { p: [0, 1.16, 0], lw: 0.006 });
      k.at([0, 0.3, 0], [0, 0, 0], () => B['outfit-set'](k, { ...it, stand: false }));
      return;
    }
    const c = it.color || '#ff8fb8';
    hanger(k, 0.74);
    if (it.variant === 'sweatshirt') {
      // pink ruffle-sleeve sweatshirt with rainbow "The Birthday Girl", tulle tutu with confetti pom-poms, bow, heart bag
      k.add(G.box(0.28, 0.27, 0.09, 0.045), c, { p: [0, 0.6, 0] });
      for (const s of [-1, 1]) {
        k.add(G.cap(0.04, 0.2, 10), c, { p: [s * 0.18, 0.55, 0], r: [0, 0, s * 0.35] });
        k.add(G.sph(0.06, 12, 10), tint(c, 0.12), { p: [s * 0.15, 0.71, 0], s: [1.2, 0.6, 0.8] });
        k.add(G.tor(0.038, 0.014, 6, 14), tint(c, -0.08), { p: [s * 0.215, 0.45, 0], r: [Math.PI / 2, 0, s * 0.35], line: false });
      }
      const label = canvasTex(256, 128, (g) => {
        g.textAlign = 'center'; g.textBaseline = 'middle';
        const rb = ['#ff6f8f', '#ff9a3c', '#f5c400', '#4cc38a', '#3aa6e8', '#9a6bff'];
        g.font = '30px LilitaOne, sans-serif';
        'THE'.split('').forEach((ch, i) => { g.fillStyle = rb[i]; g.fillText(ch, 108 + i * 20, 22); });
        g.font = '38px LilitaOne, sans-serif';
        'BIRTHDAY'.split('').forEach((ch, i) => { g.fillStyle = rb[i % 6]; g.fillText(ch, 44 + i * 24, 62); });
        'GIRL'.split('').forEach((ch, i) => { g.fillStyle = rb[(i + 2) % 6]; g.fillText(ch, 92 + i * 24, 102); });
      });
      k.mesh(plane(0.22, 0.11, label, { transparent: true }), [0, 0.61, 0.047], [0, 0, 0]);
      // tulle tutu, two layers, with colourful pom-poms all over
      k.add(G.lathe([[0, 0.47], [0.12, 0.47], [0.28, 0.24], [0.27, 0.21], [0, 0.21]], 30), tint(c, 0.25), { s: [1, 1, 0.7] });
      k.add(G.lathe([[0, 0.46], [0.11, 0.46], [0.24, 0.28], [0.23, 0.26], [0, 0.26]], 30), tint(c, 0.4), { s: [1, 1, 0.7], line: false, p: [0, 0.02, 0] });
      const pom = ['#ff5f7a', '#ffd76a', '#6fc7ff', '#7fdc9c', '#b98cff', '#ff9a3c'];
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2, h = (i * 7) % 5 / 5;
        const r = 0.27 - h * 0.13;
        k.add(G.sph(0.02, 8, 6), pom[i % pom.length], { p: [Math.sin(a) * r, 0.23 + h * 0.2, Math.cos(a) * r * 0.7 + 0.005], line: false });
      }
      // satin bow at the waist
      k.at([0, 0.46, 0.085], [0, 0, 0], () => {
        for (const s of [-1, 1]) k.add(G.cone(0.045, 0.09, 12), tint(c, -0.05), { p: [s * 0.05, 0, 0], r: [0, 0, s * Math.PI / 2], s: [1, 1, 0.5], lw: 0.007 });
        k.add(G.sph(0.022, 10, 8), tint(c, -0.12), { lw: 0.007 });
      });
      // little ruffled heart bag hanging from the hook
      k.add(G.tor(0.09, 0.006, 5, 20, Math.PI), '#ffffff', { p: [0.2, 0.68, 0.02], r: [0, 0, Math.PI], line: false });
      k.add(G.heart(0.055, 0.025), tint(c, 0.1), { p: [0.2, 0.55, 0.03], r: [0, 0, Math.PI] });
      return;
    }
    // white tee with a "Birthday Girl" sash
    k.add(G.box(0.28, 0.26, 0.09, 0.04), W, { p: [0, 0.6, 0] });
    for (const s of [-1, 1]) k.add(G.box(0.1, 0.1, 0.08, 0.035), W, { p: [s * 0.17, 0.66, 0], r: [0, 0, s * -0.5] });
    k.add(G.box(0.07, 0.32, 0.012, 0.005), '#ffd76a', { p: [0, 0.6, 0.05], r: [0, 0, 0.75], lw: 0.006 });
    const label = canvasTex(256, 64, (g) => {
      g.font = '40px LilitaOne, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#e8507f'; g.fillText('Birthday Girl', 128, 34);
    });
    const lp = plane(0.25, 0.062, label, { transparent: true });
    k.mesh(lp, [0, 0.6, 0.058], [0, 0, 0.75]);
    // pink tutu skirt with pom-poms
    k.add(G.lathe([[0, 0.45], [0.12, 0.45], [0.26, 0.27], [0.25, 0.24], [0, 0.24]], 30), c, { s: [1, 1, 0.7] });
    k.add(G.lathe([[0, 0.44], [0.1, 0.44], [0.22, 0.3], [0.21, 0.28], [0, 0.28]], 30), tint(c, 0.3), { s: [1, 1, 0.7], line: false, p: [0, 0.02, 0] });
    const pom = ['#ffd76a', '#9fd8ff', '#b8f0c8', '#d6b8ff', '#ffffff', '#ffb0c8'];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      k.add(G.sph(0.03, 10, 8), pom[i % pom.length], { p: [Math.cos(a) * 0.255, 0.25, Math.sin(a) * 0.255 * 0.7], lw: 0.006 });
    }
    // matching headband hanging from the hook
    k.add(G.tor(0.08, 0.012, 6, 20, Math.PI), c, { p: [0.13, 0.76, 0.02], r: [0, 0, 0.3], lw: 0.006 });
    k.add(G.sph(0.03, 10, 8), '#ffd76a', { p: [0.16, 0.84, 0.03], lw: 0.006 });
  },

  plush(k, it) {
    const v = it.variant || 'teddy';
    const eyes = (x, y, z, sp = 0.05, r = 0.022) => {
      for (const s of [-1, 1]) {
        k.add(G.sph(r, 12, 10), '#3a2228', { p: [x + s * sp, y, z], line: false });
        k.add(G.sph(r * 0.4, 8, 6), W, { p: [x + s * sp - r * 0.3, y + r * 0.35, z + r * 0.8], line: false });
        k.add(G.sph(r * 1.1, 10, 8), '#ffb3c4', { p: [x + s * sp * 1.7, y - r * 1.6, z - 0.01], s: [1, 0.6, 0.4], line: false });
      }
    };
    if (v === 'unicorn') {
      const c = it.color || '#fff4fb';
      k.add(G.sph(0.15, 22, 16), c, { p: [0, 0.16, -0.02], s: [1.25, 0.95, 1] });
      for (const [x, z] of [[-0.1, 0.07], [0.1, 0.07], [-0.11, -0.1], [0.11, -0.1]]) k.add(G.cap(0.045, 0.06), c, { p: [x, 0.06, z] });
      for (const [x, z] of [[-0.1, 0.07], [0.1, 0.07], [-0.11, -0.1], [0.11, -0.1]]) k.add(G.cyl(0.046, 0.046, 0.025, 14), '#e9c2ff', { p: [x, 0.02, z], line: false });
      // head + snout
      k.add(G.sph(0.13, 22, 16), c, { p: [0, 0.38, 0.08] });
      k.add(G.sph(0.08, 16, 12), '#ffe3ef', { p: [0, 0.33, 0.18], s: [1.1, 0.85, 0.9] });
      eyes(0, 0.4, 0.2, 0.06, 0.021);
      // golden horn
      k.add(G.cone(0.035, 0.15, 14), '#ffd86b', { p: [0, 0.55, 0.11], r: [0.25, 0, 0] });
      for (let i = 0; i < 3; i++) k.add(G.tor(0.03 - i * 0.008, 0.006, 5, 14), '#f5b93c', { p: [0, 0.5 + i * 0.035, 0.1 + i * 0.008], r: [Math.PI / 2 + 0.25, 0, 0], line: false });
      for (const s of [-1, 1]) k.add(G.cone(0.035, 0.08, 10), c, { p: [s * 0.08, 0.5, 0.05], r: [0, 0, s * -0.4] });
      // rainbow mane and tail
      const rb = ['#ff9db5', '#ffc48a', '#ffe58a', '#a8e8b8', '#9fd2ff', '#c8a8ff'];
      rb.forEach((col, i) => {
        k.add(G.sph(0.045, 12, 10), col, { p: [-0.03 + (i % 2) * 0.05, 0.47 - i * 0.04, 0.0 - i * 0.025], lw: 0.007 });
        k.add(G.sph(0.04, 12, 10), col, { p: [-0.02 + (i % 2) * 0.03, 0.22 - i * 0.02, -0.2 - i * 0.012], lw: 0.007 });
      });
      it._glitter = true;
    } else if (v === 'elephant') {
      const c = it.color || '#c8b6ff';
      const rb = ['#ff9db5', '#ffc48a', '#ffe58a', '#a8e8b8', '#9fd2ff', '#c8a8ff'];
      k.add(G.sph(0.16, 22, 16), c, { p: [0, 0.17, -0.03], s: [1.15, 1, 1] });
      [[-0.1, 0.07], [0.1, 0.07], [-0.1, -0.11], [0.1, -0.11]].forEach(([x, z], i) => {
        k.add(G.cap(0.05, 0.06), c, { p: [x, 0.065, z] });
        k.add(G.cyl(0.052, 0.052, 0.025, 14), rb[i + 1], { p: [x, 0.02, z], line: false });
      });
      k.add(G.sph(0.14, 22, 16), c, { p: [0, 0.38, 0.06] });
      // big rainbow ears
      for (const s of [-1, 1]) {
        k.add(G.sph(0.11, 18, 12), rb[s > 0 ? 0 : 4], { p: [s * 0.15, 0.4, 0.02], s: [0.95, 1.1, 0.3], r: [0, s * 0.4, 0] });
        k.add(G.sph(0.075, 16, 10), rb[s > 0 ? 2 : 3], { p: [s * 0.155, 0.4, 0.055], s: [0.9, 1.05, 0.2], r: [0, s * 0.4, 0], line: false });
      }
      // curly trunk
      for (let i = 0; i < 6; i++) {
        const a = i / 5;
        k.add(G.sph(0.045 - a * 0.015, 12, 10), c, { p: [0, 0.32 - a * 0.12 + a * a * 0.1, 0.18 + a * 0.06], lw: 0.008 });
      }
      eyes(0, 0.42, 0.18, 0.06, 0.021);
      // rainbow saddle stripe
      rb.forEach((col, i) => k.add(G.tor(0.16, 0.012, 6, 24, Math.PI), col, { p: [0, 0.18, -0.12 + i * 0.012], r: [0, Math.PI / 2, 0], s: [1, 1.05, 1.15], line: false }));
      it._glow = true;
    } else {
      const c = it.color || '#d9a57a';
      k.add(G.sph(0.15, 20, 14), c, { p: [0, 0.15, 0], s: [1, 1.05, 0.9] });
      k.add(G.sph(0.08, 14, 10), tint(c, 0.45), { p: [0, 0.15, 0.1], s: [1, 1.1, 0.5], line: false });
      for (const s of [-1, 1]) { k.add(G.cap(0.05, 0.08), c, { p: [s * 0.13, 0.2, 0.03], r: [0, 0, s * 0.8] }); k.add(G.sph(0.06, 12, 10), c, { p: [s * 0.08, 0.04, 0.08] }); }
      k.add(G.sph(0.13, 20, 14), c, { p: [0, 0.38, 0.02] });
      for (const s of [-1, 1]) { k.add(G.sph(0.05, 12, 10), c, { p: [s * 0.1, 0.49, 0], s: [1, 1, 0.6] }); k.add(G.sph(0.028, 10, 8), tint(c, 0.45), { p: [s * 0.1, 0.49, 0.025], s: [1, 1, 0.4], line: false }); }
      k.add(G.sph(0.055, 12, 10), tint(c, 0.5), { p: [0, 0.35, 0.12], s: [1.1, 0.8, 0.7] });
      k.add(G.sph(0.018, 8, 6), '#3a2228', { p: [0, 0.37, 0.165], line: false });
      eyes(0, 0.41, 0.13, 0.05, 0.018);
      k.add(G.heart(0.035, 0.015), '#ff8fb0', { p: [0, 0.17, 0.135], lw: 0.006 });
    }
  },

  'doctor-kit'(k, it) {
    const c = it.color || '#ff9fc0';
    // pink case, lid open a little, white cross, handle
    k.add(G.box(0.4, 0.17, 0.26, 0.05), c, { p: [0, 0.085, 0] });
    k.at([0, 0.17, -0.12], [-0.6, 0, 0], () => {
      k.add(G.box(0.4, 0.04, 0.26, 0.02), tint(c, 0.12), { p: [0, 0, 0.13] });
      k.add(G.box(0.1, 0.012, 0.03, 0.006), W, { p: [0, 0.024, 0.13], line: false });
      k.add(G.box(0.03, 0.012, 0.1, 0.006), W, { p: [0, 0.024, 0.13], line: false });
    });
    k.add(G.box(0.1, 0.03, 0.012, 0.006), W, { p: [0, 0.09, 0.132], line: false });
    k.add(G.box(0.03, 0.1, 0.012, 0.006), W, { p: [0, 0.09, 0.132], line: false });
    k.add(G.tor(0.045, 0.012, 6, 16, Math.PI), tint(c, -0.15), { p: [0.0, 0.17, 0.12], r: [0, 0, 0] });
    // stethoscope lying in front
    k.add(G.tor(0.08, 0.012, 6, 24, Math.PI * 1.5), '#9fd2ff', { p: [0.2, 0.012, 0.2], r: [Math.PI / 2, 0, 0.8], lw: 0.006 });
    k.add(G.cyl(0.03, 0.03, 0.02, 16), '#d9e7f2', { p: [0.29, 0.012, 0.26], lw: 0.006 });
    // little thermometer and plaster
    k.add(G.cap(0.012, 0.1), W, { p: [-0.2, 0.012, 0.19], r: [Math.PI / 2, 0, 1.2], lw: 0.006 });
    k.add(G.box(0.08, 0.008, 0.03, 0.004), '#ffd6b0', { p: [-0.08, 0.005, 0.22], r: [0, 0.4, 0], lw: 0.005 });
  },

  'makeup-trolley'(k, it) {
    const c = it.color || '#ffb6d5';
    // wheels
    for (const [x, z] of [[-0.15, 0.08], [0.15, 0.08], [-0.15, -0.08], [0.15, -0.08]]) k.add(G.sph(0.03, 10, 8), '#fff1f7', { p: [x, 0.03, z], lw: 0.007 });
    // cabinet with 3 drawers
    k.add(G.box(0.4, 0.38, 0.24, 0.04), c, { p: [0, 0.25, 0] });
    for (let i = 0; i < 3; i++) {
      k.add(G.box(0.34, 0.095, 0.02, 0.02), tint(c, 0.25), { p: [0, 0.14 + i * 0.11, 0.12], lw: 0.007 });
      k.add(G.sph(0.016, 8, 6), '#ffd76a', { p: [0, 0.14 + i * 0.11, 0.135], lw: 0.005 });
    }
    k.add(G.box(0.44, 0.03, 0.27, 0.015), tint(c, 0.35), { p: [0, 0.455, 0] });
    // mirror on a heart frame
    k.add(G.cyl(0.012, 0.012, 0.16, 8), tint(c, 0.2), { p: [0, 0.54, -0.07], lw: 0.006 });
    k.add(G.cyl(0.13, 0.13, 0.03, 28), c, { p: [0, 0.73, -0.07], r: [Math.PI / 2, 0, 0], s: [0.85, 1, 1.1] });
    k.add(G.cyl(0.105, 0.105, 0.012, 28), '#d7f0ff', { p: [0, 0.73, -0.05], r: [Math.PI / 2, 0, 0], s: [0.85, 1, 1.1], line: false });
    k.add(G.box(0.025, 0.1, 0.004, 0.002), W, { p: [-0.03, 0.76, -0.042], r: [0, 0, 0.5], line: false });
    k.add(G.heart(0.035, 0.015), '#ff7aa2', { p: [0, 0.87, -0.07], lw: 0.006 });
    // lipstick, perfume, brush on top
    k.add(G.cyl(0.018, 0.018, 0.06, 10), '#ffd76a', { p: [-0.13, 0.5, 0.06], lw: 0.006 });
    k.add(G.cap(0.013, 0.02, 8), '#ff5f8f', { p: [-0.13, 0.55, 0.06], lw: 0.006 });
    k.add(G.sph(0.035, 12, 10), '#c7b0ff', { p: [0.12, 0.505, 0.05], lw: 0.006 });
    k.add(G.cyl(0.01, 0.01, 0.025, 8), '#ffd76a', { p: [0.12, 0.55, 0.05], lw: 0.005 });
    k.add(G.cyl(0.03, 0.03, 0.015, 16), '#9fe0c4', { p: [0.0, 0.48, 0.08], lw: 0.006 });
  },

  'makeup-case'(k, it) {
    // rainbow glitter case with a sleepy cat face and ears, plus a little palette, lipstick and brush in front
    const rb = ['#ffc3dc', '#ffd9b8', '#fff2b0', '#cdf2df', '#c9e3ff', '#e2d2ff'];
    const h = 0.26, w = 0.36, d = 0.14;
    k.add(G.box(w, h, d, 0.04), '#ffd3e6', { p: [0, 0.02 + h / 2, 0] });
    // rainbow glitter front
    const front = canvasTex(128, 128, (g) => {
      const gr = g.createLinearGradient(0, 0, 128, 128);
      rb.forEach((col, i) => gr.addColorStop(i / (rb.length - 1), col));
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 90; i++) { g.fillStyle = i % 3 ? 'rgba(255,255,255,.7)' : 'rgba(255,215,120,.8)'; g.fillRect((i * 53) % 128, (i * 97) % 128, 2, 2); }
    });
    k.mesh(plane(w - 0.03, h - 0.03, front), [0, 0.02 + h / 2, d / 2 + 0.002], [0, 0, 0]);
    k.add(G.box(w + 0.01, 0.025, d + 0.01, 0.012), '#ffb0cf', { p: [0, 0.02 + h * 0.62, 0], lw: 0.006 });
    // silver handle
    k.add(G.tor(0.07, 0.012, 8, 20, Math.PI), '#dfe4ec', { p: [0, 0.02 + h, 0], lw: 0.006 });
    // gold glitter cat ears
    for (const s of [-1, 1]) {
      k.add(G.cone(0.05, 0.08, 4), '#ffb0cf', { p: [s * 0.1, 0.02 + h * 0.86, d / 2 + 0.006], r: [0, Math.PI / 4, 0], s: [1, 1, 0.25] });
      k.add(G.cone(0.03, 0.05, 4), '#f2c94c', { p: [s * 0.1, 0.02 + h * 0.84, d / 2 + 0.012], r: [0, Math.PI / 4, 0], s: [1, 1, 0.2], line: false });
    }
    // sleepy face: closed eyes, nose, whiskers
    const face = canvasTex(256, 160, (g) => {
      g.strokeStyle = '#d9a21b'; g.fillStyle = '#d9a21b'; g.lineWidth = 7; g.lineCap = 'round';
      for (const x of [86, 170]) { g.beginPath(); g.arc(x, 62, 16, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
      g.beginPath(); g.moveTo(118, 92); g.lineTo(138, 92); g.lineTo(128, 104); g.closePath(); g.fill();
      g.lineWidth = 5;
      for (const s of [-1, 1]) for (const dy of [-8, 6]) { g.beginPath(); g.moveTo(128 + s * 34, 100 + dy / 2); g.lineTo(128 + s * 84, 96 + dy * 1.6); g.stroke(); }
    });
    k.mesh(plane(0.3, 0.19, face, { transparent: true }), [0, 0.02 + h * 0.4, d / 2 + 0.004], [0, 0, 0]);
    // sparkles
    for (const [x, y] of [[-0.14, 0.24], [0.15, 0.08], [-0.12, 0.07]]) k.add(G.star(0.014, 0.005), '#ffffff', { p: [x, y, d / 2 + 0.006], line: false });
    // compact palette, lipstick and brush on the floor in front
    k.add(G.box(0.11, 0.02, 0.08, 0.012), '#ffc3dc', { p: [-0.12, 0.01, d / 2 + 0.08], r: [0, 0.3, 0], lw: 0.005 });
    ['#ff7aa8', '#c58cff', '#ffb36b', '#ff5f8f'].forEach((col, i) => k.add(G.cyl(0.013, 0.013, 0.006, 10), col, { p: [-0.145 + (i % 2) * 0.03, 0.022, d / 2 + 0.065 + Math.floor(i / 2) * 0.03], line: false }));
    k.add(G.cyl(0.015, 0.015, 0.06, 10), '#ffffff', { p: [0.1, 0.03, d / 2 + 0.07], lw: 0.005 });
    k.add(G.cap(0.011, 0.018, 8), '#ff4f7a', { p: [0.1, 0.07, d / 2 + 0.07], lw: 0.005 });
    k.add(G.cap(0.007, 0.1, 6), '#ffc3dc', { p: [0.17, 0.008, d / 2 + 0.1], r: [Math.PI / 2, 0, 0.9], lw: 0.004 });
    k.add(G.sph(0.016, 8, 6), '#ff9fc4', { p: [0.21, 0.012, d / 2 + 0.13], s: [1, 0.8, 1.6], line: false });
  },

  'toy-kitchen'(k, it) {
    const c = it.color || '#a8e2d0';
    k.add(G.box(0.7, 0.5, 0.32, 0.04), c, { p: [0, 0.25, 0] });
    k.add(G.box(0.74, 0.04, 0.35, 0.02), '#fff8ef', { p: [0, 0.52, 0] });
    k.add(G.box(0.7, 0.42, 0.04, 0.03), tint(c, 0.25), { p: [0, 0.74, -0.15] });
    k.add(G.box(0.3, 0.03, 0.12, 0.015), '#fff8ef', { p: [0.15, 0.8, -0.09] });
    // oven door with window, burners, sink + tap
    k.add(G.box(0.26, 0.28, 0.02, 0.03), tint(c, 0.3), { p: [-0.17, 0.25, 0.165], lw: 0.007 });
    k.add(G.box(0.17, 0.13, 0.01, 0.03), '#ffe1a8', { p: [-0.17, 0.27, 0.178], line: false });
    for (const [x, z] of [[-0.25, 0.06], [-0.1, 0.06], [-0.25, -0.07], [-0.1, -0.07]]) k.add(G.tor(0.035, 0.01, 6, 16), '#5e4148', { p: [x, 0.545, z], r: [Math.PI / 2, 0, 0], line: false });
    k.add(G.cyl(0.1, 0.09, 0.02, 20), '#d7ecf5', { p: [0.17, 0.54, 0.02], lw: 0.006 });
    k.add(G.tor(0.05, 0.012, 6, 14, Math.PI), '#d4d9e0', { p: [0.17, 0.6, -0.1], lw: 0.006 });
    for (let i = 0; i < 3; i++) k.add(G.cyl(0.02, 0.02, 0.02, 10), ['#ff9db5', '#ffe58a', '#9fd2ff'][i], { p: [-0.22 + i * 0.08, 0.42, 0.17], r: [Math.PI / 2, 0, 0], lw: 0.005 });
    // little pot
    k.add(G.cyl(0.06, 0.055, 0.07, 18), '#ff9db5', { p: [-0.25, 0.59, 0.06], lw: 0.007 });
  },

  doll(k, it) {
    const c = it.color || '#ffb3c8';
    k.add(G.lathe([[0, 0.02], [0.1, 0.02], [0.07, 0.17], [0, 0.18]]), c);
    k.add(G.sph(0.08, 16, 12), '#ffe4d4', { p: [0, 0.25, 0] });
    k.add(G.sph(0.088, 16, 10), '#ffd76a', { p: [0, 0.27, -0.015], s: [1, 1, 0.95] });
    for (const s of [-1, 1]) k.add(G.cap(0.025, 0.08), '#ffd76a', { p: [s * 0.08, 0.2, -0.01] });
    for (const s of [-1, 1]) k.add(G.sph(0.012, 8, 6), '#3a2228', { p: [s * 0.03, 0.25, 0.075], line: false });
    k.add(G.sph(0.025, 8, 6), '#ff8fb0', { p: [0.06, 0.33, 0.04], lw: 0.005 });
  },

  shoes(k, it) {
    const c = it.color || '#ff8fb0';
    for (const s of [-1, 1]) {
      k.add(G.sph(0.06, 14, 10), c, { p: [s * 0.07, 0.035, 0], s: [0.8, 0.6, 1.6] });
      k.add(G.box(0.07, 0.01, 0.02, 0.004), tint(c, -0.15), { p: [s * 0.07, 0.07, -0.01], lw: 0.005 });
      k.add(G.sph(0.018, 8, 6), W, { p: [s * 0.07, 0.06, 0.06], lw: 0.005 });
    }
  },

  'hair-bows'(k, it) {
    const cols = [it.color || '#ff8fb0', '#ffd76a', '#9fd2ff'];
    k.add(G.box(0.36, 0.22, 0.02, 0.03), '#fff7ee', { p: [0, 0.13, 0], r: [-0.2, 0, 0] });
    cols.forEach((c, i) => k.at([-0.11 + i * 0.11, 0.14, 0.03], [-0.2, 0, 0], () => {
      for (const s of [-1, 1]) k.add(G.cone(0.035, 0.07, 12), c, { p: [s * 0.04, 0, 0], r: [0, 0, s * Math.PI / 2], s: [1, 1, 0.5], lw: 0.006 });
      k.add(G.sph(0.018, 8, 6), tint(c, -0.15), { lw: 0.005 });
    }));
  },

  'generic-box'(k, it) {
    const c = it.color || '#ffb3c8';
    const rib = it.ribbon || '#ffffff';
    k.add(G.box(0.3, 0.24, 0.3, 0.03), c, { p: [0, 0.12, 0] });
    k.add(G.box(0.33, 0.07, 0.33, 0.03), tint(c, 0.15), { p: [0, 0.255, 0] });
    k.add(G.box(0.06, 0.245, 0.305, 0.01), rib, { p: [0, 0.122, 0], line: false });
    k.add(G.box(0.305, 0.245, 0.06, 0.01), rib, { p: [0, 0.122, 0], line: false });
    k.add(G.box(0.065, 0.075, 0.335, 0.01), rib, { p: [0, 0.256, 0], line: false });
    k.add(G.box(0.335, 0.075, 0.065, 0.01), rib, { p: [0, 0.256, 0], line: false });
    for (const s of [-1, 1]) k.add(G.tor(0.045, 0.016, 8, 16), rib, { p: [s * 0.045, 0.32, 0], r: [0, 0, s * 0.5], s: [1, 0.8, 1], lw: 0.007 });
    k.add(G.sph(0.025, 10, 8), rib, { p: [0, 0.3, 0], lw: 0.007 });
    for (const [x, y] of [[-0.08, 0.06], [0.09, 0.15], [-0.05, 0.18]]) k.add(G.star(0.018, 0.006), '#ffe58a', { p: [x, y, 0.152], line: false });
  },
};

export const MODELS = Object.keys(B);

// Builds one item. Returns a Group with: body/line meshes, a tap box, and userData.size.
export function buildItem(it) {
  const k = new Kit(0.009);
  const fn = B[it.model] || B['generic-box'];
  fn(k, it);
  const ghost = it.status !== 'gifted';
  const g = k.build(ghost);
  if (ghost) {
    g.traverse((o) => { if (o.material && o.material.map) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; } });
    // depth-only copy drawn first, so the see-through ghost shows only its front skin (clean, not muddy)
    const body = g.getObjectByName('body');
    if (body) {
      const pre = new THREE.Mesh(body.geometry, DEPTH_ONLY);
      pre.renderOrder = 4; body.renderOrder = 5;
      const line = g.getObjectByName('line'); if (line) line.renderOrder = 5;
      g.add(pre);
    }
  }
  const box = new THREE.Box3().setFromObject(g);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  // soft fake shadow under items that stand on something
  // generous invisible tap box (fingers are big)
  const hit = new THREE.Mesh(new THREE.BoxGeometry(Math.max(size.x, 0.3) + 0.08, Math.max(size.y, 0.3) + 0.08, Math.max(size.z, 0.3) + 0.08), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(center);
  hit.name = 'hit';
  g.add(hit);
  g.userData = { item: it, size, box, ghost, glitter: !!it._glitter, glow: !!it._glow };
  return g;
}

export function shadowBlob(w, d, opacity = 0.18) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex(), color: '#8a4a50', transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}
