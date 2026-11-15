// Athena's Home: main app. Loads the data files, builds the house, places gifts, runs the camera and the cards.
import { THREE, sparkTex, blobTex } from './kit.js';
import { buildHouse } from './rooms.js';
import { buildItem, shadowBlob } from './items.js';
import { buildPerson } from './people.js';
import { buildNav } from './walk.js';

const $ = (id) => document.getElementById(id);
const setP = (v) => window.__setProgress && window.__setProgress(v);
const DEBUG = /[?&]debug/.test(location.search);

async function getJSON(name) {
  const r = await fetch(`data/${name}?v=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Could not load data/${name}`);
  return r.json();
}

// India first for visitors in India, USA first for everyone else
function indiaFirst() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return true;
  } catch (e) { /* ignore */ }
  const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  return langs.some((l) => /^en-IN$/i.test(l) || /^hi(\b|-)/i.test(l));
}

// ---------------- cards ----------------
let ITEMS = [], ATHENA = {};
function statusText(it) {
  return it.status === 'gifted'
    ? (it.giftedOnDay ? `✨ Gifted by fans on Day ${it.giftedOnDay}` : '✨ Gifted by fans')
    : '🎁 Not gifted yet. Gift it to her!';
}
function buyButtons(it) {
  const links = it.links || {};
  const order = indiaFirst() ? ['in', 'us'] : ['us', 'in'];
  const label = { us: '🇺🇸 Get it (USA & world)', in: '🇮🇳 Get it (India)' };
  const out = [];
  for (const k of order) {
    const url = links[k];
    if (!url || typeof url !== 'string' || !url.trim()) continue;
    const a = document.createElement('a');
    a.className = k;
    a.setAttribute('href', url); // exactly as written in items.json (keeps the affiliate tag)
    a.target = '_blank';
    a.rel = 'noopener sponsored';
    a.textContent = label[k];
    a.dataset.item = it.id;
    out.push(a);
  }
  return out;
}
function openCard(it) {
  closeSheets(false);
  $('card-emoji').textContent = it.emoji || '🎁';
  $('card-name').textContent = it.name;
  const st = $('card-status');
  st.textContent = statusText(it);
  st.className = 'status ' + (it.status === 'gifted' ? 'gifted' : 'wish');
  $('card-note').textContent = it.note || '';
  const btns = $('card-btns');
  const b = buyButtons(it);
  const lead = document.createElement('div');
  lead.className = 'lead';
  lead.textContent = b.length ? (it.status === 'gifted' ? '💝 Get one for your little one' : '🎁 Gift it to Athena, or get one for your little one') : 'Shop link coming soon.';
  btns.replaceChildren(lead, ...b);
  $('card').hidden = false;
  $('card').dataset.item = it.id;
}
function openWall() {
  closeSheets(false);
  const list = $('wall-list');
  list.replaceChildren();
  const sec = (title, arr) => {
    if (!arr.length) return;
    const h = document.createElement('div'); h.className = 'wall-sec'; h.textContent = title; list.append(h);
    for (const it of arr) {
      const b = document.createElement('button');
      b.className = 'wrow ' + (it.status === 'gifted' ? 'gifted' : 'wish');
      b.innerHTML = `<span class="em"></span><span><div class="nm"></div><div class="sub"></div></span><span class="go"></span>`;
      b.querySelector('.em').textContent = it.emoji || '🎁';
      b.querySelector('.nm').textContent = it.name;
      b.querySelector('.sub').textContent = it.status === 'gifted' ? statusText(it).replace('✨ ', '') : 'Not gifted yet';
      b.querySelector('.go').textContent = it.status === 'gifted' ? 'See it ✨' : 'Gift it 🎁';
      b.onclick = () => { if (app) app.focusItem(it.id); else openCard(it); };
      list.append(b);
    }
  };
  sec(`✨ Gifted by fans (${ITEMS.filter((i) => i.status === 'gifted').length})`, ITEMS.filter((i) => i.status === 'gifted'));
  sec(`🎁 Her wish list (${ITEMS.filter((i) => i.status !== 'gifted').length})`, ITEMS.filter((i) => i.status !== 'gifted'));
  $('wall').hidden = false;
}
function closeSheets(notify = true) {
  const wasCard = !$('card').hidden;
  $('card').hidden = true; $('wall').hidden = true;
  if (notify && wasCard && app) app.unfocus();
}
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeSheets(true)));
$('share').addEventListener('click', async () => {
  const data = { title: "Athena's Home 🏠", text: 'Come see the gifts fans sent Athena in her home!', url: location.href.split('?')[0] };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(data.url); $('share').textContent = '✅ Link copied!'; }
  } catch (e) { /* user closed the share box */ }
});
$('open-wall').addEventListener('click', (e) => { e.preventDefault(); $('loader').classList.add('done'); openWall(); });

// ---------------- the 3D app ----------------
let app = null;

function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

async function start() {
  const [items, roomsCfg, athena, family] = await Promise.all([
    getJSON('items.json'), getJSON('rooms.json'), getJSON('athena.json'), getJSON('family.json'),
  ]);
  ITEMS = items; ATHENA = athena;
  setP(65);
  // top bar
  $('age').querySelector('b').textContent = athena.age ?? '?';
  if (athena.instagram) $('ig').setAttribute('href', athena.instagram);

  try { await Promise.race([document.fonts.load('40px LilitaOne'), new Promise((r) => setTimeout(r, 1200))]); } catch (e) { /* font optional */ }

  const canvas = $('scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    throw new Error('webgl');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
  scene.add(new THREE.HemisphereLight('#fff8f2', '#ffe2d2', 1.55));
  const sun = new THREE.DirectionalLight('#fff4e2', 1.7);
  sun.position.set(-4, 8, 7);
  scene.add(sun);

  const rooms = roomsCfg.rooms;
  const house = buildHouse(roomsCfg, rooms, scene);
  setP(80);

  // ----- people -----
  const people = [];
  for (const m of family.members || []) {
    const p = buildPerson(m.id);
    const r = house.rooms.find((x) => x.room.id === m.room) || house.rooms[0];
    if (!p) continue;
    p.position.set(...(m.pos || [0, 0, 0]));
    p.rotation.y = m.turn || 0;
    if (m.id === 'athena') {
      p.position.x += r.x;
      scene.add(p);
      const sh = shadowBlob(0.6, 0.45, 0.22); sh.position.set(0, 0.006, 0); p.add(sh);
    } else {
      r.group.add(p);
      const sh = shadowBlob(0.7, 0.5, 0.22); sh.position.set(m.pos[0], 0.02, m.pos[2] + 0.4);
      r.group.add(sh);
    }
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.65; hit.userData.person = m; p.add(hit);
    people.push({ obj: p, m, hit });
  }

  // ----- gifts -----
  const itemObjs = [];
  const sparkMat = new THREE.SpriteMaterial({ map: sparkTex(), transparent: true, depthWrite: false });
  const bySpot = {};
  for (const it of items) {
    let r = house.rooms.find((x) => x.room.id === it.room);
    if (!r) { console.warn(`Item "${it.id}": room "${it.room}" not found, using ${house.rooms[0].room.id}`); r = house.rooms[0]; }
    const key = r.room.id + '/' + it.spot;
    (bySpot[key] ||= { r, list: [] }).list.push(it);
  }
  for (const key of Object.keys(bySpot)) {
    const { r, list } = bySpot[key];
    const spotName = key.split('/')[1];
    let spot = r.room.spots?.[spotName];
    if (!spot) { console.warn(`Spot "${spotName}" not in room "${r.room.id}", placing on the floor`); spot = { pos: [0, 0, 1.2], along: [1, 0, 0], gap: 0.55 }; }
    const along = new THREE.Vector3(...(spot.along || [1, 0, 0])).normalize();
    list.forEach((it, i) => {
      const g = buildItem(it);
      const off = (i - (list.length - 1) / 2) * (spot.gap || 0.5);
      const box = g.userData.box;
      const p = new THREE.Vector3(...spot.pos).addScaledVector(along, off);
      g.position.set(p.x, spot.hang ? p.y - box.max.y : p.y - box.min.y, p.z);
      if (spot.turn) g.rotation.y = spot.turn;
      if (it.turn) g.rotation.y += it.turn;
      r.group.add(g);
      const top = new THREE.Vector3(0, box.max.y + 0.06, 0);
      const ent = { it, g, r, top, baseY: g.position.y, phase: Math.random() * 6 };
      if (!spot.hang && !g.userData.ghost) {
        const s = shadowBlob(Math.max(g.userData.size.x, 0.25) * 1.4, Math.max(g.userData.size.z, 0.25) * 1.4, 0.2);
        s.position.set(p.x, p.y + 0.006, p.z); r.group.add(s);
      }
      if (!g.userData.ghost) {
        // gifted: little twinkling sparkles
        ent.sparks = [0, 1, 2].map((k) => {
          const s = new THREE.Sprite(sparkMat); s.scale.setScalar(0.12);
          s.position.set((k - 1) * g.userData.size.x * 0.45, box.max.y * (0.55 + k * 0.2), 0.12); g.add(s); return s;
        });
        if (g.userData.glow) {
          const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: blobTex(), color: '#ffd1f0', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
          glow.scale.set(0.9, 0.8, 1); glow.position.set(0, box.max.y * 0.5, -0.05); g.add(glow); ent.glow = glow;
        }
      }
      itemObjs.push(ent);
    });
  }
  setP(92);

  // ----- walking map: furniture + floor gifts are blocked, doorways open -----
  const floorBlocks = [];
  for (const e of itemObjs) {
    const b = new THREE.Box3().setFromObject(e.g.getObjectByName('body') || e.g);
    if (b.min.y < 0.1 && b.max.y > 0.05) floorBlocks.push([b.min.x, b.min.z, b.max.x, b.max.z]);
  }
  const floorMap = buildNav(house, floorBlocks);
  const athenaP = people.find((p) => p.m.id === 'athena');
  const walker = { path: null, i: 0, follow: false, face: null, speed: 1.6 };
  const roomAtX = (x) => house.rooms[THREE.MathUtils.clamp(Math.round(x / house.S), 0, house.rooms.length - 1)].room.id;
  // send Athena to a point (world x, z). follow = camera follows her into other rooms
  function walkTo(x, z, opts = {}) {
    if (!athenaP) return;
    const a = athenaP.obj;
    const p = floorMap.path(a.position.x, a.position.z, x, z);
    if (!p || p.length < 2) { if (opts.face) walker.face = opts.face; if (opts.onArrive) opts.onArrive(); return; }
    walker.path = p; walker.i = 1; walker.follow = !!opts.follow; walker.face = opts.face || null; walker.onArrive = opts.onArrive || null;
    walker.dest = roomAtX(p[p.length - 1][0]);
    let len = 0; for (let k = 1; k < p.length; k++) len += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]);
    walker.speed = len > 4 ? 2.6 : 1.6; // trot on long walks
    a.userData.fast = len > 4;
    a.userData.walking = true;
    if (opts.marker !== false) showMarker(p[p.length - 1][0], p[p.length - 1][1]);
  }
  // little pink ring where she is going
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.16, 32), new THREE.MeshBasicMaterial({ color: '#ff8fb8', transparent: true, opacity: 0, depthWrite: false }));
  marker.rotation.x = -Math.PI / 2; marker.renderOrder = 6; scene.add(marker);
  let markerT = 9;
  function showMarker(x, z) { marker.position.set(x, 0.02, z); markerT = 0; }
  function stepWalker(dt, t) {
    if (!athenaP) return;
    const a = athenaP.obj;
    markerT += dt;
    marker.material.opacity = Math.max(0, 0.9 - markerT * 0.6);
    marker.scale.setScalar(1 + Math.min(markerT, 1) * 0.6);
    let wantYaw = null;
    if (walker.path) {
      let left = walker.speed * dt;
      while (left > 0 && walker.path) {
        const [tx, tz] = walker.path[walker.i];
        const dx = tx - a.position.x, dz = tz - a.position.z, d = Math.hypot(dx, dz);
        if (d > 1e-4) wantYaw = Math.atan2(dx, dz);
        if (d <= left) {
          a.position.x = tx; a.position.z = tz; left -= d; walker.i++;
          if (walker.i >= walker.path.length) {
            walker.path = null; a.userData.walking = false;
            const cb = walker.onArrive; walker.onArrive = null;
            if (cb) setTimeout(cb, 250); // let her turn to face it first
          }
        } else { a.position.x += (dx / d) * left; a.position.z += (dz / d) * left; left = 0; }
      }
      // camera follows her when she walks into another room
      const rid = roomAtX(a.position.x);
      if (walker.follow && rid === walker.dest && rid !== current && !focused) goRoom(rid);
    } else if (walker.face) {
      wantYaw = Math.atan2(walker.face[0] - a.position.x, walker.face[1] - a.position.z);
    } else {
      wantYaw = 0; // turn back to the visitor
    }
    if (wantYaw !== null) {
      let d = wantYaw - a.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      a.rotation.y += d * Math.min(1, dt * (walker.path ? 10 : 3));
    }
  }
  // walk to a room: just inside it, in front
  function walkToRoom(id) {
    const r = house.rooms.find((x) => x.room.id === id);
    const spot = r.room.standAt || [0.3, 0.7];
    walkTo(r.x + spot[0], spot[1], { follow: false });
  }

  // ----- labels (DOM chips that follow items and doors) -----
  const labels = $('labels');
  for (const e of itemObjs) {
    const d = document.createElement('div');
    const gifted = e.it.status === 'gifted';
    d.className = 'chip ' + (gifted ? 'gifted' : 'wish');
    d.innerHTML = `<span class="i"></span><span class="t"></span>`;
    d.querySelector('.i').textContent = gifted ? '✨' : '🎁';
    d.querySelector('.t').textContent = gifted ? (e.it.giftedOnDay ? `Gifted by you on Day ${e.it.giftedOnDay}` : 'Gifted by you') : 'Gift it to her!';
    d.addEventListener('click', (ev) => { ev.stopPropagation(); focusItem(e.it.id); });
    labels.append(d); e.label = d;
  }
  const doorChips = [];
  house.rooms.forEach((hr, i) => {
    if (i < house.rooms.length - 1) {
      const a = hr.room, b = house.rooms[i + 1].room;
      const pos = new THREE.Vector3(hr.x + house.W / 2 + house.T / 2, 0.35, 1.6);
      for (const [from, to, side] of [[a, b, 1], [b, a, -1]]) {
        const d = document.createElement('div');
        d.className = 'chip door';
        d.textContent = side > 0 ? `${to.short || to.name} ${to.emoji || ''} ›` : `‹ ${to.emoji || ''} ${to.short || to.name}`;
        d.addEventListener('click', (ev) => { ev.stopPropagation(); goRoom(to.id); walkToRoom(to.id); });
        labels.append(d);
        doorChips.push({ d, from: from.id, pos, side });
      }
    }
  });

  // ----- room buttons -----
  const nav = $('rooms');
  for (const hr of house.rooms) {
    const b = document.createElement('button');
    b.dataset.room = hr.room.id;
    b.innerHTML = `<span class="em"></span><span class="nm"></span>`;
    b.querySelector('.em').textContent = hr.room.emoji || '🏠';
    b.querySelector('.nm').textContent = hr.room.short || hr.room.name;
    b.onclick = () => { closeSheets(true); goRoom(hr.room.id); walkToRoom(hr.room.id); };
    nav.append(b);
  }
  const gw = document.createElement('button');
  gw.className = 'giftwall';
  gw.innerHTML = `<span class="em">🎁</span><span class="nm">Gift wall</span>`;
  gw.onclick = openWall;
  nav.append(gw);

  // ---------------- camera ----------------
  const cam = { tx: 0, ty: 1.3, tz: -0.4, dist: 10, yaw: 0, pitch: 0.2, off: 0 };
  let tween = null;
  const user = { yaw: 0, pitch: 0, zoom: 1 };
  let current = null, focused = null;

  function roomView(id) {
    const hr = house.rooms.find((r) => r.room.id === id) || house.rooms[0];
    const asp = camera.aspect;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const tanV = Math.tan(vfov / 2), tanH = tanV * asp;
    const portrait = asp < 0.85;
    const fitW = portrait ? 4.25 : 7.6, fitH = portrait ? 3.6 : 6.0;
    const dist = Math.max(fitW / 2 / tanH, fitH / 2 / tanV) + 2.3;
    return { tx: hr.x, ty: portrait ? 1.05 : 1.55, tz: -0.4, dist, yaw: 0, pitch: portrait ? 0.4 : 0.22, off: portrait ? -0.055 : -0.02 };
  }
  function itemView(e) {
    const wp = e.g.localToWorld(new THREE.Vector3(0, e.top.y * 0.5, 0));
    const portrait = camera.aspect < 0.85;
    return { tx: wp.x, ty: wp.y, tz: wp.z, dist: portrait ? 5.0 : 4.6, yaw: e.r.room.id === current ? cam.yaw * 0.4 : 0, pitch: 0.22, off: portrait ? 0.2 : 0.12 };
  }
  function tweenTo(v, dur = 1.0) {
    tween = { from: { ...cam }, to: v, t: 0, dur };
  }
  function setActive(id) {
    current = id;
    nav.querySelectorAll('button[data-room]').forEach((b) => b.classList.toggle('on', b.dataset.room === id));
  }
  function goRoom(id, instant) {
    focused = null; user.yaw = 0; user.pitch = 0; user.zoom = 1;
    setActive(id);
    const v = roomView(id);
    if (instant) Object.assign(cam, v); else tweenTo(v);
  }
  function focusItem(id) {
    const e = itemObjs.find((x) => x.it.id === id);
    if (!e) return;
    if (current !== e.r.room.id) setActive(e.r.room.id);
    focused = e; user.yaw = 0; user.pitch = 0; user.zoom = 1;
    tweenTo(itemView(e), current === e.r.room.id ? 0.8 : 1.1);
    openCard(e.it);
  }
  function unfocus() { if (focused) { focused = null; tweenTo(roomView(current), 0.8); } }
  app = { focusItem, unfocus, goRoom };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.85 ? 50 : 40;
    camera.updateProjectionMatrix();
    if (current && !tween) Object.assign(cam, focused ? itemView(focused) : roomView(current));
  }
  window.addEventListener('resize', resize);
  resize();

  function applyCam() {
    const yaw = cam.yaw + user.yaw, pitch = THREE.MathUtils.clamp(cam.pitch + user.pitch, -0.05, 1.4), dist = cam.dist * user.zoom;
    camera.position.set(
      cam.tx + Math.sin(yaw) * Math.cos(pitch) * dist,
      cam.ty + Math.sin(pitch) * dist,
      cam.tz + Math.cos(yaw) * Math.cos(pitch) * dist);
    $('resetview').hidden = Math.abs(user.yaw) < 0.02 && Math.abs(user.pitch) < 0.02 && Math.abs(user.zoom - 1) < 0.02;
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    // shift the picture up when the card covers the bottom of the screen
    const w = renderer.domElement.width, h = renderer.domElement.height;
    if (Math.abs(cam.off) > 0.001) camera.setViewOffset(w, h, 0, h * cam.off, w, h); else camera.clearViewOffset();
  }

  // ---------------- input: drag to look, tap to pick ----------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  // drag = turn all the way around, pinch / mouse wheel = zoom
  const pts = new Map();
  let pinch = null;
  const setZoom = (z) => { user.zoom = THREE.MathUtils.clamp(z, 0.3, 2.6); };
  const clampPitch = () => { user.pitch = THREE.MathUtils.clamp(user.pitch, -0.05 - cam.pitch, 1.4 - cam.pitch); };
  canvas.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    hideHint();
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: user.zoom };
      if (down) down.moved = true;
      return;
    }
    down = { x: e.clientX, y: e.clientY, t: performance.now(), yaw: user.yaw, pitch: user.pitch, moved: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      setZoom(pinch.zoom * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)));
      return;
    }
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (Math.abs(dx) + Math.abs(dy) > 8) down.moved = true;
    if (!down.moved) return;
    user.yaw = down.yaw - dx * 0.006;
    user.pitch = down.pitch + dy * 0.004;
    clampPitch();
  });
  const endPointer = (e, cancel) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (!down) return;
    const tap = !cancel && !down.moved && performance.now() - down.t < 600 && pts.size === 0;
    if (pts.size === 0) down = null;
    if (tap) pick(e.clientX, e.clientY);
  };
  canvas.addEventListener('pointerup', (e) => endPointer(e, false));
  canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); hideHint(); setZoom(user.zoom * Math.exp(e.deltaY * 0.0012)); }, { passive: false });
  $('resetview').addEventListener('click', () => {
    const from = { ...user }, t0 = performance.now();
    const step = () => {
      const k = ease(Math.min(1, (performance.now() - t0) / 600));
      user.yaw = from.yaw * (1 - k); user.pitch = from.pitch * (1 - k); user.zoom = from.zoom + (1 - from.zoom) * k;
      if (k < 1) requestAnimationFrame(step);
    };
    // turn the short way round
    from.yaw = Math.atan2(Math.sin(from.yaw), Math.cos(from.yaw));
    step();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheets(true);
    const i = house.rooms.findIndex((r) => r.room.id === current);
    const go = (id) => { goRoom(id); walkToRoom(id); };
    if (e.key === 'ArrowRight' && i < house.rooms.length - 1) go(house.rooms[i + 1].room.id);
    if (e.key === 'ArrowLeft' && i > 0) go(house.rooms[i - 1].room.id);
  });

  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitTargets = [];
  itemObjs.forEach((e) => { const h = e.g.getObjectByName('hit'); h.userData.ent = e; hitTargets.push(h); });
  house.rooms.forEach((r) => r.group.children.forEach((c) => { if (c.name === 'door') hitTargets.push(c); }));
  people.forEach((p) => hitTargets.push(p.hit));
  const touchTargets = [];
  house.rooms.forEach((r) => r.group.children.forEach((c) => { if (c.name === 'touch') { c.userData.touch.hit = c; c.userData.touch.roomGroup = r.group; touchTargets.push(c); } }));

  // ----- touching things -----
  const anims = [];
  const sunBoost = new Map();
  const say = document.createElement('div'); say.className = 'say hidden'; labels.append(say);
  let sayUntil = 0;
  function speak(text) { (window.__said ||= []).push(text); say.textContent = text; say.classList.remove('hidden'); sayUntil = clock.elapsedTime + 2.4; }
  function popAt(obj3d, emoji) {
    const v2 = obj3d.getWorldPosition(new THREE.Vector3()); v2.project(camera);
    const sx = (v2.x * 0.5 + 0.5) * window.innerWidth, sy = (-v2.y * 0.5 + 0.5) * window.innerHeight;
    hearts(sx, sy, [emoji, emoji, '✨']);
  }
  function react(def) {
    const tg = def.target, t0 = clock.elapsedTime;
    if (def.react === 'hop' && tg) anims.push((t) => { const k = (t - t0) / 0.7; tg.position.y = tg.userData.home.y + Math.abs(Math.sin(k * Math.PI * 2)) * 0.12 * (1 - k); return k >= 1 && (tg.position.y = tg.userData.home.y, true); });
    if (def.react === 'wiggle' && tg) anims.push((t) => { const k = (t - t0) / 1.4; tg.rotation.z = Math.sin(k * 25) * 0.12 * (1 - k); return k >= 1 && (tg.rotation.z = 0, true); });
    if (def.react === 'topple') def.parts.forEach((pt, i) => {
      const r0 = pt.rotation.clone(), y0 = pt.userData.home.y, spin = (Math.random() - 0.5) * 3, dx = (Math.random() - 0.5) * 0.25, x0 = pt.position.x, z0 = pt.position.z, dz = (Math.random() - 0.2) * 0.25;
      anims.push((t) => {
        const k = Math.min(1, (t - t0 - i * 0.08) / 0.6); if (k < 0) return false;
        pt.position.y = Math.max(0.07, y0 * (1 - k) + 0.07 * k) + Math.sin(k * Math.PI) * 0.15;
        pt.position.x = x0 + dx * k; pt.position.z = z0 + dz * k; pt.rotation.y = r0.y + spin * k;
        if (k >= 1) { pt.userData.home.y = 0.07; return true; }
        return false;
      });
    });
    if (def.react === 'roll' && tg) {
      const a = athenaP.obj.position, rx = def.roomGroup.position.x;
      const d = new THREE.Vector2(tg.position.x + rx - a.x, tg.position.z - a.z); if (d.length() < 0.01) d.set(1, 0); d.normalize();
      const from = tg.position.clone();
      const to = new THREE.Vector3(THREE.MathUtils.clamp(from.x + d.x * 1.4, -2.6, 2.6), from.y, THREE.MathUtils.clamp(from.z + d.y * 1.4, -0.9, 1.9));
      const dist = from.distanceTo(to), axis = new THREE.Vector3(d.y, 0, -d.x);
      anims.push((t) => {
        const k = Math.min(1, (t - t0) / 1.3), e = 1 - Math.pow(1 - k, 3);
        tg.position.lerpVectors(from, to, e);
        tg.rotateOnWorldAxis(axis, (dist / 0.11) * (e - (tg.userData.lastE || 0))); tg.userData.lastE = e;
        def.hit.position.set(tg.position.x, def.hit.position.y, tg.position.z);
        if (k >= 1) { tg.userData.lastE = 0; tg.userData.home.copy(tg.position); return true; }
        return false;
      });
    }
    if (def.react === 'tv') {
      const scr = def.roomGroup.getObjectByName('tvscreen');
      if (scr) { scr.userData.isOff = !scr.userData.isOff; scr.material.map = scr.userData.isOff ? scr.userData.off : scr.userData.on; speak(scr.userData.isOff ? 'TV off. Bye bye! 📺' : 'Cartoons! 📺'); }
    }
    if (def.react === 'lamp' && tg) { tg.visible = !tg.visible; speak(tg.visible ? 'Light on! 💡' : 'Light off! 🌙'); }
    if (def.react === 'sun') sunBoost.set(def.roomGroup, t0 + 2.5);
  }
  function touchThing(def) {
    const rx = def.roomGroup.position.x;
    const [bx, , bz, , , bd] = def.box;
    const st = def.stand ? [def.stand[0] + rx, def.stand[1]] : [bx + rx, bz + bd / 2 + 0.3];
    const faceAt = [def.target ? def.target.position.x + rx : bx + rx, def.target ? def.target.position.z : bz];
    if (def.react === 'roll') { const a = athenaP.obj.position; const d = new THREE.Vector2(faceAt[0] - a.x, faceAt[1] - a.z); const l = d.length() || 1; st[0] = faceAt[0] - (d.x / l) * 0.35; st[1] = faceAt[1] - (d.y / l) * 0.35; }
    walkTo(st[0], st[1], { face: faceAt, follow: true, marker: false, onArrive: () => {
      athenaP.obj.userData.act(def.act || 'reach');
      speak(def.say || '✨');
      if (def.emoji) popAt(def.hit, def.emoji);
      react(def);
    } });
  }

  // what a tap at (x, y) would hit (used by the test script)
  function whatIs(x, y) {
    ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(hitTargets, false);
    if (h.length) return 'other';
    const th = ray.intersectObjects(touchTargets, false);
    return th.length ? th[0].object : null;
  }
  function pick(x, y) {
    ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(hitTargets, false);
    if (!hits.length && athenaP) {
      const th = ray.intersectObjects(touchTargets, false);
      if (th.length) { if (!$('card').hidden) closeSheets(true); return touchThing(th[0].object.userData.touch); }
    }
    if (!hits.length) {
      // any other place: Athena walks there (furniture and walls: she walks as close as she can)
      if (!$('card').hidden) closeSheets(true);
      const pt = new THREE.Vector3();
      if (!ray.ray.intersectPlane(floorPlane, pt)) return;
      const b = floorMap.bounds;
      walkTo(THREE.MathUtils.clamp(pt.x, b.x0, b.x1), THREE.MathUtils.clamp(pt.z, b.z0, b.z1), { follow: true });
      return;
    }
    const o = hits[0].object;
    if (o.userData.ent) {
      const e = o.userData.ent, w = e.g.getWorldPosition(new THREE.Vector3());
      walkTo(w.x, w.z + 0.35, { face: [w.x, w.z], marker: false });
      return focusItem(e.it.id);
    }
    if (o.userData.door) {
      const [a, b] = o.userData.door;
      const to = current === a ? b : a;
      closeSheets(true);
      goRoom(to); walkToRoom(to);
      return;
    }
    if (o.userData.person) {
      const p = people.find((pp) => pp.m === o.userData.person);
      p.obj.userData.hop && p.obj.userData.hop(clock.elapsedTime);
      hearts(x, y);
      // tap Mom or Dad: Athena runs to them
      if (p.m.id !== 'athena' && athenaP) {
        const w = p.obj.getWorldPosition(new THREE.Vector3());
        walkTo(w.x + 0.45, w.z + 0.75, { face: [w.x, w.z], follow: true });
      }
    }
  }
  function hearts(x, y, list = ['💗', '💖', '💕']) {
    for (let i = 0; i < 5; i++) {
      const h = document.createElement('div');
      h.className = 'heartpop'; h.textContent = list[i % list.length];
      h.style.left = x + 'px'; h.style.top = y - 20 + 'px';
      h.style.setProperty('--dx', (i - 2) * 22 + 'px'); h.style.animationDelay = i * 0.06 + 's';
      labels.append(h); setTimeout(() => h.remove(), 1400);
    }
  }
  let hintGone = false;
  function hideHint() { if (!hintGone) { hintGone = true; $('hint').classList.add('gone'); } }
  setTimeout(hideHint, 6000);

  // ---------------- labels each frame ----------------
  const v = new THREE.Vector3();
  function placeLabels() {
    const W = window.innerWidth, H = window.innerHeight;
    const shown = [];
    for (const e of itemObjs) {
      const vis = e.r.room.id === current && $('card').hidden;
      if (!vis) { e.label.classList.add('hidden'); continue; }
      e.g.localToWorld(v.copy(e.top));
      v.project(camera);
      const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      if (v.z > 1 || sx < -40 || sx > W + 40 || sy < 40 || sy > H) { e.label.classList.add('hidden'); continue; }
      e.label.classList.remove('hidden');
      shown.push({ e, sx, sy });
    }
    // show the full text only when there is room for it
    for (const a of shown) {
      const crowded = shown.some((b) => b !== a && Math.abs(b.sx - a.sx) < 150 && Math.abs(b.sy - a.sy) < 34);
      a.e.label.classList.toggle('short', crowded || W < 360);
      // keep the whole chip on screen
      const half = (a.e.label.offsetWidth || 40) / 2 + 4;
      const x = THREE.MathUtils.clamp(a.sx, half, W - half);
      a.e.label.style.transform = `translate(${x}px, ${a.sy}px) translate(-50%, -100%)`;
    }
    for (const c of doorChips) {
      if (c.from !== current || !$('card').hidden || focused) { c.d.classList.add('hidden'); continue; }
      v.copy(c.pos); v.project(camera);
      let sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      const r = c.d.getBoundingClientRect();
      const half = (r.width || 100) / 2 + 6;
      sx = THREE.MathUtils.clamp(sx, half, W - half);
      sy = THREE.MathUtils.clamp(sy, 90, H - 140);
      c.d.classList.remove('hidden');
      c.d.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
    }
  }

  // ---------------- loop ----------------
  const clock = new THREE.Clock();
  let frames = 0, fpsT = 0, fps = 0;
  const fpsEl = DEBUG ? Object.assign(document.createElement('div'), { style: 'position:absolute;left:6px;top:60px;z-index:99;font:12px monospace;background:#fff;padding:2px 5px;border-radius:6px' }) : null;
  if (fpsEl) document.body.append(fpsEl);
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
    if (tween) {
      tween.t += dt / tween.dur;
      const k = ease(Math.min(1, tween.t));
      for (const key of Object.keys(tween.to)) cam[key] = tween.from[key] + (tween.to[key] - tween.from[key]) * k;
      if (tween.t >= 1) tween = null;
    }
    applyCam();
    stepWalker(dt, t);
    for (let i = anims.length - 1; i >= 0; i--) if (anims[i](t)) anims.splice(i, 1);
    if (athenaP && !say.classList.contains('hidden')) {
      if (t > sayUntil) say.classList.add('hidden');
      else {
        const hp = athenaP.obj.localToWorld(new THREE.Vector3(0, 1.35, 0)).project(camera);
        say.style.transform = `translate(${(hp.x * 0.5 + 0.5) * window.innerWidth}px, ${(-hp.y * 0.5 + 0.5) * window.innerHeight}px) translate(-50%, -100%)`;
      }
    }
    for (const p of people) p.obj.userData.update && p.obj.userData.update(t, dt);
    for (const e of itemObjs) {
      if (e.g.userData.ghost) e.g.position.y = e.baseY + Math.sin(t * 1.6 + e.phase) * 0.015;
      if (e.sparks) e.sparks.forEach((s, k) => { const a = Math.max(0, Math.sin(t * 2.2 + k * 2.1 + e.phase)); s.scale.setScalar(0.03 + a * 0.08); s.material.rotation = t; });
      if (e.glow) { e.glow.material.color.setHSL((t * 0.08) % 1, 0.9, 0.82); e.glow.material.opacity = 0.45 + Math.sin(t * 2) * 0.15; }
    }
    for (const hr of house.rooms) {
      const boost = (sunBoost.get(hr.group) || 0) > t ? 0.22 : 0;
      (hr.group.userData.beams || []).forEach((b, i) => { b.material.opacity = 0.16 + boost + Math.sin(t * 0.7 + i) * 0.04; });
      const d = hr.group.userData.dust;
      if (d) { d.rotation.y = Math.sin(t * 0.1) * 0.05; d.position.y = Math.sin(t * 0.5) * 0.05; }
    }
    renderer.render(scene, camera);
    placeLabels();
    if (fpsEl) { frames++; fpsT += dt; if (fpsT > 0.5) { fps = frames / fpsT; frames = 0; fpsT = 0; fpsEl.textContent = `${fps.toFixed(0)} fps · ${renderer.info.render.calls} calls`; } }
    window.__stats = { fps, calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    requestAnimationFrame(frame);
  }

  // start in the room from the link (#kitchen) or the bedroom
  const startRoom = (location.hash || '').slice(1);
  goRoom(house.rooms.some((r) => r.room.id === startRoom) ? startRoom : house.rooms[0].room.id, true);
  renderer.render(scene, camera);
  setP(100);
  clearInterval(window.__fake);
  requestAnimationFrame(frame);
  setTimeout(() => $('loader').classList.add('done'), 200);
  window.__ready = true;
  window.__app = { focusItem, goRoom, itemObjs, camera, walkTo, touchTargets, touchThing, user, whatIs, walker, athena: athenaP && athenaP.obj, nav: floorMap, look: (x, y, z, d, yaw = 0, pitch = 0.15) => { tween = null; Object.assign(cam, { tx: x, ty: y, tz: z, dist: d, yaw, pitch, off: 0 }); } };
  // open an item straight from a link: ?item=glitter-unicorn
  const q = new URLSearchParams(location.search).get('item');
  if (q) setTimeout(() => focusItem(q), 400);
}

start().catch((err) => {
  console.error(err);
  clearInterval(window.__fake);
  $('load-err').hidden = false;
  if (!ITEMS.length) getJSON('items.json').then((x) => { ITEMS = x; }).catch(() => {});
});
