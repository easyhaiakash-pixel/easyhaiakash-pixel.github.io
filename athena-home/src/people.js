// Athena (age 3) and Mom, drawn in code in the soft kawaii style of the videos.
// Faces are painted on a curved patch in front of the head (big glossy eyes, blush, small smile).
// No lip movement. Idle: breathing, blinking, swaying, a little wave now and then.
import { THREE, Kit, G, C2, canvasTex, OL, gradientMap } from './kit.js';

const SKIN = '#ffe4d4';

// ---------- face painting ----------
// Canvas 512x384 covers 2.0 rad across and 1.5 rad down the head (256 px per radian both ways).
const FACE = { w: 512, h: 384, phiLen: 2.0, thStart: 1.0, thLen: 1.5 };

function eye(g, x, y, rx, ry, col = '#6a3a24') {
  C2.el(g, x, y, rx, ry);
  g.fillStyle = C2.lin(g, 0, y - ry, 0, y + ry, [[0, '#2e1612'], [0.55, col], [1, '#b8743e']]);
  g.fill();
  g.lineWidth = 7; g.strokeStyle = '#4a2a2c'; g.stroke();
  C2.el(g, x - rx * 0.28, y - ry * 0.3, rx * 0.38, ry * 0.36); C2.fin(g, '#ffffff');
  C2.el(g, x + rx * 0.4, y + ry * 0.42, rx * 0.17, ry * 0.15); C2.fin(g, '#ffffff');
  C2.star4(g, x + rx * 0.42, y - ry * 0.42, rx * 0.26); C2.fin(g, '#ffffff');
}
function closedEye(g, x, y, rx) {
  g.beginPath(); g.arc(x, y - 6, rx * 0.8, Math.PI * 0.15, Math.PI * 0.85);
  g.lineWidth = 8; g.strokeStyle = '#4a2a2c'; g.lineCap = 'round'; g.stroke();
}
function happyEye(g, x, y, rx) {
  g.beginPath(); g.arc(x, y + 12, rx * 0.75, Math.PI * 1.15, Math.PI * 1.85);
  g.lineWidth = 8; g.strokeStyle = '#4a2a2c'; g.lineCap = 'round'; g.stroke();
}
function blush(g, x, y) {
  C2.el(g, x, y, 34, 18);
  g.fillStyle = C2.rad(g, x, y, 0, 36, [[0, 'rgba(255,140,160,0.75)'], [1, 'rgba(255,150,170,0)']]); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.lineCap = 'round';
  for (const dx of [-8, 6]) { g.beginPath(); g.moveTo(x + dx, y + 6); g.lineTo(x + dx + 8, y - 6); g.stroke(); }
}
function mouthOpen(g, x, y, w) {
  g.beginPath(); g.moveTo(x - w, y - 4); g.quadraticCurveTo(x, y - 8, x + w, y - 4);
  g.quadraticCurveTo(x + w * 0.8, y + w * 1.15, x, y + w * 1.15); g.quadraticCurveTo(x - w * 0.8, y + w * 1.15, x - w, y - 4);
  g.closePath(); C2.fin(g, '#c2445a', 6, '#4a2a2c');
  g.save(); g.clip(); C2.el(g, x, y + w * 1.05, w * 0.7, w * 0.45); C2.fin(g, '#ff9db0'); g.restore();
}
function faceTex(kind, closed) {
  return canvasTex(FACE.w, FACE.h, (g) => {
    const ey = 168, ex = 92;
    if (kind === 'athena') {
      // little brown curl on the forehead, like the videos
      g.beginPath(); g.arc(256, 78, 16, Math.PI * 1.1, Math.PI * 2.6);
      g.lineWidth = 11; g.strokeStyle = '#7a4a30'; g.lineCap = 'round'; g.stroke();
      // soft brows
      g.lineWidth = 5; g.strokeStyle = 'rgba(122,74,48,0.7)';
      for (const s of [-1, 1]) { g.beginPath(); g.arc(256 + s * ex, ey - 30, 26, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); }
      if (closed) { closedEye(g, 256 - ex, ey, 44); closedEye(g, 256 + ex, ey, 44); }
      else { eye(g, 256 - ex, ey, 40, 47); eye(g, 256 + ex, ey, 40, 47); }
      blush(g, 256 - 128, 222); blush(g, 256 + 128, 222);
      C2.el(g, 256, 214, 8, 6); C2.fin(g, '#ff9fb0');
      mouthOpen(g, 256, 250, 22);
    } else if (kind === 'dad') {
      const mx = 84;
      if (closed) { happyEye(g, 256 - mx, ey, 40); happyEye(g, 256 + mx, ey, 40); }
      else { eye(g, 256 - mx, ey, 28, 32, '#5a3426'); eye(g, 256 + mx, ey, 28, 32, '#5a3426'); }
      g.lineWidth = 7; g.strokeStyle = 'rgba(74,42,44,0.85)'; g.lineCap = 'round';
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * mx - 26, ey - 52); g.lineTo(256 + sx * mx + 22, ey - 56); g.stroke(); }
      blush(g, 256 - 128, 226); blush(g, 256 + 128, 226);
      C2.el(g, 256, 214, 8, 6); C2.fin(g, '#f4a0a8');
      mouthOpen(g, 256, 246, 30);
      // tiny happy sweat drop
      g.beginPath(); g.moveTo(256 + 170, ey - 40); g.quadraticCurveTo(256 + 186, ey - 8, 256 + 170, ey - 4); g.quadraticCurveTo(256 + 154, ey - 8, 256 + 170, ey - 40);
      C2.fin(g, '#bfe6ff', 4, '#4a2a2c');
    } else {
      const mx = 86;
      if (closed) { happyEye(g, 256 - mx, ey, 40); happyEye(g, 256 + mx, ey, 40); }
      else {
        eye(g, 256 - mx, ey, 32, 38, '#7a4630'); eye(g, 256 + mx, ey, 32, 38, '#7a4630');
        // lashes
        g.lineWidth = 6; g.strokeStyle = '#4a2a2c'; g.lineCap = 'round';
        for (const s of [-1, 1]) { const x = 256 + s * mx + s * 30; g.beginPath(); g.moveTo(x, ey - 22); g.lineTo(x + s * 14, ey - 34); g.stroke(); }
      }
      blush(g, 256 - 124, 222); blush(g, 256 + 124, 222);
      C2.el(g, 256, 212, 7, 5); C2.fin(g, '#f4a0a8');
      mouthOpen(g, 256, 246, 18);
    }
  });
}
function faceMesh(r, tex) {
  const geo = new THREE.SphereGeometry(r * 1.012, 40, 28, Math.PI / 2 - FACE.phiLen / 2, FACE.phiLen, FACE.thStart, FACE.thLen);
  const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap, transparent: true, depthWrite: false });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 2;
  return m;
}

// ---------- Athena, age 3 ----------
export function buildAthena() {
  const root = new THREE.Group(); root.name = 'athena';
  const body = new THREE.Group(); body.name = 'body'; root.add(body);
  const k = new Kit(0.012);
  // shoes + legs
  // legs on hip pivots so she can walk
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.name = s < 0 ? 'hipL' : 'hipR'; hip.position.set(s * 0.065, 0.22, 0);
    const l = new Kit(0.012);
    l.add(G.cap(0.052, 0.12), SKIN, { p: [0, -0.09, 0] });
    l.add(G.sph(0.07, 16, 12), '#ffb7c9', { p: [s * 0.003, -0.175, 0.025], s: [0.95, 0.6, 1.25] });
    hip.add(l.build()); body.add(hip); legs.push(hip);
  }
  // dress: cream bell with pink hem and white collar
  k.add(G.lathe([[0, 0.17], [0.215, 0.175], [0.22, 0.205], [0.185, 0.33], [0.14, 0.47], [0.11, 0.55], [0, 0.565]]), '#fff1ea');
  k.add(G.tor(0.205, 0.028, 8, 32), '#ffb3c8', { p: [0, 0.2, 0], r: [Math.PI / 2, 0, 0] });
  k.add(G.tor(0.1, 0.03, 8, 24), '#ffffff', { p: [0, 0.545, 0], r: [Math.PI / 2, 0, 0] });
  k.add(G.heart(0.035, 0.015), '#ff8fb0', { p: [0, 0.4, 0.165], r: [-0.25, 0, 0], lw: 0.008 });
  body.add(k.build());

  // arms (pivot at shoulder so they can wave)
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.name = s < 0 ? 'armL' : 'armR'; pivot.position.set(s * 0.125, 0.5, 0);
    const a = new Kit(0.011);
    a.add(G.cap(0.042, 0.13), '#fff1ea', { p: [0, -0.1, 0] });
    a.add(G.sph(0.05, 14, 10), SKIN, { p: [0, -0.2, 0.01] });
    const m = a.build(); pivot.add(m);
    pivot.rotation.z = s * 0.35;
    body.add(pivot); arms.push(pivot);
  }

  // head
  const head = new THREE.Group(); head.name = 'head'; head.position.set(0, 0.6, 0); body.add(head);
  const R = 0.29;
  const h = new Kit(0.013);
  h.add(G.sph(R, 32, 24), SKIN, { p: [0, R * 0.92, 0] });
  // brown hair framing the face under the hat
  h.add(G.sph(R * 1.05, 24, 16), '#8a5638', { p: [0, R * 0.86, -0.05], s: [1, 0.95, 0.95] });
  // pink-cream beanie with a cuff, bear ears and a bow (her mark since Day 2)
  const top = R * 0.92, hr = R * 1.06, cut = 1.28;
  h.add(new THREE.SphereGeometry(hr, 32, 16, 0, Math.PI * 2, 0, cut), '#fbd3df', { p: [0, top, 0] });
  h.add(G.tor(hr * Math.sin(cut) * 0.99, 0.034, 12, 40), '#f6a9c2', { p: [0, top + hr * Math.cos(cut), 0], r: [Math.PI / 2, 0, 0] });
  for (const s of [-1, 1]) {
    h.add(G.sph(0.085, 16, 12), '#fbd3df', { p: [s * 0.2, top + 0.27, -0.02], s: [1, 1, 0.65] });
    h.add(G.sph(0.05, 14, 10), '#ffb3c8', { p: [s * 0.205, top + 0.27, 0.03], s: [1, 1, 0.35], line: false });
  }
  // bow on the front-right of the hat: two round loops + a knot
  h.at([0.15, top + 0.2, 0.2], [0.35, 0.35, -0.35], () => {
    for (const s of [-1, 1]) h.add(G.sph(0.06, 14, 10), '#f07ca2', { p: [s * 0.06, 0, 0], r: [0, 0, s * 0.35], s: [1.2, 0.85, 0.5], lw: 0.01 });
    h.add(G.sph(0.03, 12, 10), '#e85f8c', { p: [0, 0, 0.02], lw: 0.01 });
  });
  const hm = h.build(); head.add(hm);
  const open = faceTex('athena', false), shut = faceTex('athena', true);
  const face = faceMesh(R, open); face.name = 'face'; face.userData.shutTex = shut; face.position.set(0, R * 0.92, 0); head.add(face);

  let nextBlink = 2, nextWave = 4, waveT = -1, walkW = 0, stepT = 0;
  let actName = null, actT = 0;
  root.userData.walking = false;
  // short actions when she touches things: jump, spin, dance, reach, hug, kick, sleep
  root.userData.act = (name) => { actName = name; actT = 0; waveT = -1; if (name === 'jump' || name === 'kick') hop.start(root.userData.now || 0); };
  root.userData.update = (t, dt) => {
    // blend between standing and walking
    walkW += ((root.userData.walking ? 1 : 0) - walkW) * Math.min(1, dt * 8);
    stepT += dt * (root.userData.fast ? 13 : 9) * walkW;
    const sw = Math.sin(stepT);
    legs[0].rotation.x = sw * 0.6 * walkW; legs[1].rotation.x = -sw * 0.6 * walkW;
    body.rotation.z = Math.sin(t * 1.5) * 0.05 * (1 - walkW) + sw * 0.04 * walkW;
    body.rotation.x = 0.08 * walkW;
    body.position.y = Math.abs(Math.sin(t * 1.5)) * 0.012 * (1 - walkW) + Math.abs(Math.cos(stepT)) * 0.035 * walkW;
    body.scale.set(1, 1 + Math.sin(t * 2.6) * 0.012, 1);
    head.rotation.z = Math.sin(t * 1.5 + 0.6) * 0.07;
    head.rotation.x = Math.sin(t * 0.7) * 0.04;
    // blink
    if (t > nextBlink) { face.material.map = shut; if (t > nextBlink + 0.13) { face.material.map = open; nextBlink = t + 2.2 + Math.random() * 2.5; } }
    // a little wave every few seconds
    if (t > nextWave && waveT < 0) waveT = 0;
    if (waveT >= 0) {
      waveT += dt;
      const up = Math.min(1, waveT * 4) * Math.min(1, Math.max(0, (1.9 - waveT) * 4));
      arms[1].rotation.z = 0.35 + up * 2.3 + up * Math.sin(waveT * 14) * 0.3;
      if (waveT > 1.9) { waveT = -1; arms[1].rotation.z = 0.35; nextWave = t + 6 + Math.random() * 4; }
    }
    arms[0].rotation.z = -0.35 - Math.sin(t * 1.5) * 0.06;
    arms[0].rotation.x = -sw * 0.5 * walkW;
    if (waveT < 0) arms[1].rotation.x = sw * 0.5 * walkW;
    if (walkW > 0.5 && waveT >= 0) { waveT = -1; arms[1].rotation.z = 0.35; }
    if (walkW > 0.5) nextWave = Math.max(nextWave, t + 3);
    root.userData.now = t;
    if (actName) {
      actT += dt;
      const len = { sleep: 2.6, spin: 0.9, dance: 1.8, hug: 1.5, reach: 1.1, kick: 0.6, jump: 0.6 }[actName] || 1;
      const k = Math.min(1, actT / len), env = Math.sin(Math.min(1, actT / len) * Math.PI);
      nextWave = t + 4;
      if (actName === 'spin') body.rotation.y = k * Math.PI * 2;
      if (actName === 'dance') { body.rotation.y = Math.sin(actT * 7) * 0.5; arms[0].rotation.z = -0.35 - env * 2.2; arms[1].rotation.z = 0.35 + env * 2.2; body.position.y = Math.abs(Math.sin(actT * 7)) * 0.06; }
      if (actName === 'reach') { arms[1].rotation.z = 0.35 + env * 2.6; arms[1].rotation.x = -env * 0.6; body.position.y = env * 0.03; }
      if (actName === 'hug') { arms[0].rotation.z = -0.35 + env * 0.9; arms[1].rotation.z = 0.35 - env * 0.9; arms[0].rotation.x = arms[1].rotation.x = -env * 1.3; head.rotation.z = env * 0.25; }
      if (actName === 'kick') { legs[1].rotation.x = -Math.sin(k * Math.PI) * 1.1; }
      if (actName === 'sleep') { face.material.map = shut; head.rotation.z = env * 0.45; body.rotation.z = env * 0.1; nextBlink = t + 0.5; }
      if (actT >= len) { actName = null; body.rotation.y = 0; arms[1].rotation.z = 0.35; arms[0].rotation.z = -0.35; arms[0].rotation.x = arms[1].rotation.x = 0; legs[1].rotation.x = 0; }
    }
    hop.tick(t);
  };
  const hop = makeHop(body);
  root.userData.hop = hop.start;
  return root;
}

// ---------- Mom, sitting ----------
export function buildMom() {
  const root = new THREE.Group(); root.name = 'mom';
  const body = new THREE.Group(); body.name = 'body'; root.add(body);
  const k = new Kit(0.013);
  const TOP = '#c8b4f4', HAIR = '#93593a';
  // legs (sitting): thighs forward, shins down
  for (const s of [-1, 1]) {
    k.add(G.cap(0.075, 0.28), '#9ec9ff', { p: [s * 0.1, 0.08, 0.2], r: [Math.PI / 2, 0, 0] });
    k.add(G.cap(0.068, 0.28), '#9ec9ff', { p: [s * 0.1, -0.12, 0.42] });
    k.add(G.sph(0.08, 14, 10), '#fff4e8', { p: [s * 0.1, -0.33, 0.46], s: [0.9, 0.55, 1.4] });
  }
  // sweater body
  k.add(G.lathe([[0, 0.0], [0.24, 0.02], [0.26, 0.12], [0.24, 0.36], [0.17, 0.5], [0.08, 0.54], [0, 0.545]]), TOP);
  k.add(G.tor(0.09, 0.025, 8, 22), '#efe6ff', { p: [0, 0.52, 0.0], r: [Math.PI / 2, 0, 0] });
  // arms resting on the lap
  for (const s of [-1, 1]) {
    k.add(G.cap(0.06, 0.26), TOP, { p: [s * 0.24, 0.3, 0.07], r: [0.55, 0, s * 0.15] });
    k.add(G.sph(0.058, 14, 10), SKIN, { p: [s * 0.16, 0.16, 0.25] });
  }
  body.add(k.build());

  const head = new THREE.Group(); head.name = 'head'; head.position.set(0, 0.52, 0); body.add(head);
  const R = 0.25;
  const h = new Kit(0.013);
  // long hair behind
  h.add(G.cap(0.24, 0.3), HAIR, { p: [0, 0.12, -0.08], s: [1.05, 1, 0.75] });
  h.add(G.sph(R, 30, 22), SKIN, { p: [0, R * 0.95, 0] });
  // hair cap with bangs (tilted forward)
  h.add(new THREE.SphereGeometry(R * 1.07, 30, 16, 0, Math.PI * 2, 0, 1.32), HAIR, { p: [0, R * 0.98, -0.01], r: [0.32, 0, 0] });
  for (const s of [-1, 1]) h.add(G.cap(0.07, 0.24), HAIR, { p: [s * 0.23, 0.15, -0.01], r: [0, 0, s * 0.1] });
  // little shine line on the hair
  h.add(G.tor(0.17, 0.012, 6, 24, Math.PI * 0.7), '#c98a64', { p: [0, R * 1.45, 0.06], r: [-0.6, 0, Math.PI * 0.15], line: false });
  head.add(h.build());
  const open = faceTex('mom', false), shut = faceTex('mom', true);
  const face = faceMesh(R, open); face.name = 'face'; face.userData.shutTex = shut; face.position.set(0, R * 0.95, 0); head.add(face);

  let nextBlink = 1.5, happyUntil = 0;
  root.userData.update = (t) => {
    body.scale.set(1, 1 + Math.sin(t * 2) * 0.01, 1);
    head.rotation.z = Math.sin(t * 0.8) * 0.08;
    head.rotation.y = Math.sin(t * 0.45) * 0.12;
    if (t < happyUntil) face.material.map = shut;
    else if (t > nextBlink) { face.material.map = shut; if (t > nextBlink + 0.13) { face.material.map = open; nextBlink = t + 2.5 + Math.random() * 3; } }
    else face.material.map = open;
    hop.tick(t);
  };
  const hop = makeHop(body);
  root.userData.hop = (t) => { happyUntil = t + 1.6; hop.start(t); };
  return root;
}

// ---------- Dad, sitting (same look as the style test: short dark hair, round glasses, mint sweater) ----------
export function buildDad() {
  const root = new THREE.Group(); root.name = 'dad';
  const body = new THREE.Group(); body.name = 'body'; root.add(body);
  const k = new Kit(0.013);
  const TOP = '#9fdcc8', HAIR = '#5a3a2c', PANTS = '#8fa3c8';
  for (const s of [-1, 1]) {
    k.add(G.cap(0.08, 0.3), PANTS, { p: [s * 0.11, 0.08, 0.21], r: [Math.PI / 2, 0, 0] });
    k.add(G.cap(0.072, 0.28), PANTS, { p: [s * 0.11, -0.12, 0.44] });
    k.add(G.sph(0.085, 14, 10), '#6b5a78', { p: [s * 0.11, -0.33, 0.48], s: [0.9, 0.55, 1.4] });
  }
  k.add(G.lathe([[0, 0.0], [0.27, 0.02], [0.29, 0.14], [0.27, 0.38], [0.19, 0.53], [0.09, 0.57], [0, 0.575]]), TOP);
  k.add(G.tor(0.1, 0.026, 8, 22), '#e3f7ef', { p: [0, 0.55, 0.0], r: [Math.PI / 2, 0, 0] });
  // one arm on the lap, one arm along the sofa back (towards Mom)
  k.add(G.cap(0.065, 0.26), TOP, { p: [0.27, 0.3, 0.07], r: [0.55, 0, -0.15] });
  k.add(G.sph(0.062, 14, 10), SKIN, { p: [0.18, 0.16, 0.26] });
  k.add(G.cap(0.065, 0.36), TOP, { p: [-0.36, 0.52, -0.12], r: [0, 0, 1.2] });
  k.add(G.sph(0.062, 14, 10), SKIN, { p: [-0.55, 0.6, -0.14] });
  body.add(k.build());

  const head = new THREE.Group(); head.name = 'head'; head.position.set(0, 0.55, 0); body.add(head);
  const R = 0.26;
  const h = new Kit(0.013);
  h.add(G.sph(R, 30, 22), SKIN, { p: [0, R * 0.95, 0] });
  for (const s of [-1, 1]) h.add(G.sph(0.055, 12, 10), SKIN, { p: [s * R * 0.98, R * 0.9, -0.02], s: [0.6, 1, 0.8] });
  // short hair cap
  h.add(new THREE.SphereGeometry(R * 1.06, 30, 16, 0, Math.PI * 2, 0, 1.05), HAIR, { p: [0, R * 0.98, -0.02], r: [0.22, 0, 0] });
  h.add(G.tor(0.15, 0.012, 6, 24, Math.PI * 0.7), '#8a6250', { p: [0, R * 1.55, 0.04], r: [-0.7, 0, Math.PI * 0.15], line: false });
  // round glasses in front of the eyes
  const ey = R * 0.95 + R * Math.cos(1.656), ez = R * 0.94 + 0.03, ex = R * 0.33;
  for (const s of [-1, 1]) {
    h.add(G.tor(R * 0.2, 0.009, 6, 28), '#4a2a2c', { p: [s * ex, ey, ez], r: [0, s * 0.3, 0], line: false });
    h.add(G.cyl(0.006, 0.006, R * 0.5, 5), '#4a2a2c', { p: [s * R * 0.75, ey + 0.01, ez - 0.1], r: [Math.PI / 2, s * -0.5, 0], line: false });
  }
  h.add(G.tor(R * 0.08, 0.008, 5, 12, Math.PI), '#4a2a2c', { p: [0, ey + 0.005, ez + 0.01], line: false });
  head.add(h.build());
  const open = faceTex('dad', false), shut = faceTex('dad', true);
  const face = faceMesh(R, open); face.name = 'face'; face.userData.shutTex = shut; face.position.set(0, R * 0.95, 0); head.add(face);

  let nextBlink = 2.5, happyUntil = 0;
  root.userData.update = (t) => {
    body.scale.set(1, 1 + Math.sin(t * 1.8 + 1) * 0.01, 1);
    head.rotation.z = Math.sin(t * 0.7 + 1) * 0.07;
    head.rotation.y = Math.sin(t * 0.4 + 2) * 0.1;
    if (t < happyUntil) face.material.map = shut;
    else if (t > nextBlink) { face.material.map = shut; if (t > nextBlink + 0.13) { face.material.map = open; nextBlink = t + 2.8 + Math.random() * 3; } }
    else face.material.map = open;
    hop.tick(t);
  };
  const hop = makeHop(body);
  root.userData.hop = (t) => { happyUntil = t + 1.6; hop.start(t); };
  return root;
}

// tap reaction: a small happy jump
function makeHop(obj) {
  let start = -10;
  return {
    start: (t) => { start = t; },
    tick: (t) => {
      const k = t - start;
      if (k >= 0 && k < 0.5) obj.position.y = Math.sin((k / 0.5) * Math.PI) * 0.14;
    },
  };
}

export function buildPerson(id) {
  if (id === 'athena') return buildAthena();
  if (id === 'mom') return buildMom();
  if (id === 'dad') return buildDad();
  return null;
}
export { OL };
