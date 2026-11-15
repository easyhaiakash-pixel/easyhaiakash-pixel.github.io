// Painted textures for the house: wallpaper, floors, rugs, window views, family photos, TV.
// All painted in code on a canvas, soft pastel, warm-brown outlines.
import { canvasTex, C2, OL } from './kit.js';

// ---- wallpapers ----
export function wallpaper(style, base) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    if (style === 'stars') {
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const x = 32 + c * 64 + (r % 2) * 32, y = 32 + r * 64;
        if ((r + c) % 3 === 0) { C2.star4(g, x, y, 11); C2.fin(g, 'rgba(255,255,255,0.85)'); }
        else if ((r + c) % 3 === 1) { C2.heart(g, x, y, 6); C2.fin(g, 'rgba(255,170,190,0.45)'); }
        else { C2.el(g, x, y, 4, 4); C2.fin(g, 'rgba(255,190,160,0.6)'); }
      }
    } else if (style === 'stripes') {
      for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x, 0, 28, h); }
      for (let y = 40; y < h; y += 128) for (let x = 46; x < w; x += 128) { C2.el(g, x, y, 5, 5); C2.fin(g, 'rgba(255,200,120,0.55)'); }
    } else if (style === 'dots') {
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const x = 32 + c * 64 + (r % 2) * 32, y = 32 + r * 64;
        C2.el(g, x, y, 7, 7); C2.fin(g, 'rgba(255,255,255,0.7)');
      }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { C2.cloud(g, 64 + c * 128 + (r % 2) * 64, 70 + r * 128, 14); C2.fin(g, 'rgba(255,255,255,0.35)'); }
    }
  }, { repeat: [3, 2] });
}
export function tiles(a, b) {
  return canvasTex(256, 256, (g) => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      g.fillStyle = (r + c) % 2 ? a : b; g.fillRect(c * 64, r * 64, 64, 64);
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 4; g.strokeRect(c * 64, r * 64, 64, 64);
      if ((r + c) % 2) { C2.heart(g, c * 64 + 32, r * 64 + 32, 7); C2.fin(g, 'rgba(255,255,255,0.55)'); }
    }
  }, { repeat: [4, 1.5] });
}

// ---- floors ----
export function planks(base) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) {
      const y = r * 64;
      g.fillStyle = r % 2 ? 'rgba(255,255,255,0.1)' : 'rgba(180,110,70,0.06)'; g.fillRect(0, y, w, 64);
      g.fillStyle = 'rgba(150,90,60,0.25)'; g.fillRect(0, y, w, 3);
      const off = (r * 173) % 256;
      for (let x = off; x < w + 256; x += 256) g.fillRect((x % w), y, 3, 64);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, y + 8, w, 4);
    }
  }, { repeat: [2, 2] });
}
export function checker(a, b) {
  return canvasTex(256, 256, (g) => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.fillStyle = (r + c) % 2 ? a : b; g.fillRect(c * 64, r * 64, 64, 64); }
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
  }, { repeat: [5, 4] });
}

// ---- rugs ----
export function roundRug(a, b) {
  return canvasTex(512, 512, (g) => {
    C2.el(g, 256, 256, 250, 250); C2.fin(g, a);
    C2.el(g, 256, 256, 205, 205); C2.fin(g, b);
    g.setLineDash([18, 14]); g.lineWidth = 7; g.strokeStyle = 'rgba(255,255,255,0.9)';
    C2.el(g, 256, 256, 228, 228); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 6; i++) { const a2 = (i / 6) * Math.PI * 2; C2.heart(g, 256 + Math.cos(a2) * 120, 256 + Math.sin(a2) * 120, 18); C2.fin(g, 'rgba(255,255,255,0.7)'); }
    C2.star5(g, 256, 256, 40); C2.fin(g, 'rgba(255,240,170,0.9)');
  });
}
export function rectRug(a, b) {
  return canvasTex(512, 320, (g) => {
    C2.rr(g, 6, 6, 500, 308, 60); C2.fin(g, a);
    C2.rr(g, 36, 36, 440, 248, 40); C2.fin(g, b);
    g.setLineDash([16, 12]); g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.9)';
    C2.rr(g, 20, 20, 472, 280, 50); g.stroke(); g.setLineDash([]);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { C2.el(g, 96 + c * 80, 100 + r * 60, 10, 10); C2.fin(g, 'rgba(255,255,255,0.55)'); }
  });
}

// ---- window views ----
export function windowView(kind = 'day') {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = C2.lin(g, 0, 0, 0, 256, [[0, '#9fd6ff'], [1, '#eaf8ff']]); g.fillRect(0, 0, 256, 256);
    g.fillStyle = C2.rad(g, 70, 60, 0, 140, [[0, 'rgba(255,250,210,1)'], [0.3, 'rgba(255,246,190,0.6)'], [1, 'rgba(255,246,190,0)']]); g.fillRect(0, 0, 256, 256);
    C2.el(g, 70, 60, 26, 26); C2.fin(g, '#fffbe0');
    C2.cloud(g, 190, 90, 40); C2.fin(g, '#ffffff');
    C2.cloud(g, 110, 140, 30); C2.fin(g, '#ffffff');
    C2.el(g, 60, 280, 170, 90); C2.fin(g, '#bfe8b4');
    C2.el(g, 220, 290, 150, 100); C2.fin(g, '#a9dfa0');
    // a little tree
    g.fillStyle = '#c99a6b'; g.fillRect(196, 168, 10, 40);
    C2.el(g, 201, 160, 30, 30); C2.fin(g, '#8fd39a');
    C2.el(g, 190, 150, 6, 6); C2.fin(g, '#ff9db5');
    if (kind === 'flowers') for (let i = 0; i < 6; i++) { C2.el(g, 20 + i * 42, 236 - (i % 2) * 8, 6, 6); C2.fin(g, ['#ff9db5', '#ffe58a', '#ffffff'][i % 3]); }
  });
}

// ---- tiny 2D portraits for photo frames ----
function miniHead(g, x, y, s, o) {
  const skin = '#ffe4d4';
  if (o.hair) { C2.el(g, x, y + s * 0.25, s * 1.15, s * 1.3); C2.fin(g, o.hair, 4); }
  C2.el(g, x, y, s, s); C2.fin(g, skin, 4);
  if (o.hat) {
    g.beginPath(); g.arc(x, y - s * 0.05, s * 1.06, Math.PI, 0); g.closePath(); C2.fin(g, o.hat, 4);
    C2.rr(g, x - s * 1.08, y - s * 0.22, s * 2.16, s * 0.34, s * 0.17); C2.fin(g, o.cuff || o.hat, 4);
    if (o.ears) for (const d of [-1, 1]) { C2.el(g, x + d * s * 0.68, y - s * 0.95, s * 0.3, s * 0.3); C2.fin(g, o.hat, 4); }
    if (o.bow) { C2.el(g, x + s * 0.62, y - s * 0.62, s * 0.22, s * 0.16, -0.5); C2.fin(g, '#f07ca2', 3); C2.el(g, x + s * 0.92, y - s * 0.78, s * 0.22, s * 0.16, -0.5); C2.fin(g, '#f07ca2', 3); }
  }
  if (o.bangs) { g.beginPath(); g.arc(x, y - s * 0.15, s * 1.02, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(x, y - s * 0.3, x - s * 1.0, y - s * 0.2); C2.fin(g, o.hair, 4); }
  const ey = y + s * 0.18;
  for (const d of [-1, 1]) {
    if (o.happy) { g.beginPath(); g.arc(x + d * s * 0.38, ey + 4, s * 0.15, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 4; g.strokeStyle = OL; g.stroke(); }
    else { C2.el(g, x + d * s * 0.38, ey, s * 0.17, s * 0.2); C2.fin(g, '#5a3020'); C2.el(g, x + d * s * 0.38 - s * 0.05, ey - s * 0.07, s * 0.06, s * 0.06); C2.fin(g, '#fff'); }
    C2.el(g, x + d * s * 0.62, y + s * 0.45, s * 0.16, s * 0.09); C2.fin(g, 'rgba(255,140,160,0.7)');
  }
  g.beginPath(); g.arc(x, y + s * 0.45, s * 0.14, 0.1, Math.PI - 0.1); C2.fin(g, '#d9566e', 3);
}
const ATH = { hat: '#fbd3df', cuff: '#f6a9c2', ears: true, bow: true };
export function photo(kind) {
  return canvasTex(256, 300, (g) => {
    const bgs = { baby: '#d9efff', mom: '#ffe3ec', one: '#fff1c9', drawing: '#ffffff', heart: '#e6dcff', family: '#dff5e8' };
    g.fillStyle = bgs[kind] || '#fff'; g.fillRect(0, 0, 256, 300);
    if (kind === 'baby') {
      C2.el(g, 128, 230, 90, 60); C2.fin(g, '#fff7ea', 4);
      miniHead(g, 128, 150, 52, { hat: '#fff1cf', cuff: '#ffe3a6', ears: true });
      g.font = '30px LilitaOne, sans-serif'; g.textAlign = 'center'; g.fillStyle = OL; g.fillText('DAY 1', 128, 50);
    } else if (kind === 'mom') {
      miniHead(g, 92, 130, 48, { hair: '#93593a', bangs: true, happy: true });
      C2.rr(g, 40, 190, 104, 120, 40); C2.fin(g, '#c8b4f4', 4);
      miniHead(g, 170, 190, 36, ATH);
      C2.heart(g, 200, 70, 22); C2.fin(g, '#ff8fb0', 3);
    } else if (kind === 'one') {
      miniHead(g, 128, 160, 60, ATH);
      g.font = '34px LilitaOne, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#e8507f'; g.fillText('AGE 1', 128, 54);
    } else if (kind === 'drawing') {
      // a crayon drawing: house, sun, stick mom and girl
      g.lineWidth = 6; g.lineCap = 'round'; g.strokeStyle = '#ff7aa2';
      g.strokeRect(50, 130, 110, 90); g.beginPath(); g.moveTo(40, 135); g.lineTo(105, 75); g.lineTo(170, 135); g.stroke();
      C2.el(g, 210, 60, 22, 22); C2.fin(g, '#ffd76a');
      g.strokeStyle = '#7ab8ff'; g.beginPath(); g.moveTo(195, 160); g.lineTo(195, 230); g.moveTo(180, 250); g.lineTo(195, 230); g.lineTo(210, 250); g.stroke();
      C2.el(g, 195, 150, 14, 14); g.stroke();
      g.strokeStyle = '#8fd39a'; g.beginPath(); g.moveTo(0, 270); for (let x = 0; x < 256; x += 16) g.lineTo(x, 262 + (x % 32 ? 6 : 0)); g.stroke();
      g.font = '26px LilitaOne, sans-serif'; g.fillStyle = '#c87cff'; g.fillText('MOM + ME', 60, 40);
    } else if (kind === 'heart') {
      C2.heart(g, 128, 150, 80); C2.fin(g, '#ff9fbf', 5);
      g.font = '40px LilitaOne, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText('LOVE', 128, 160);
    } else {
      // Mom, Dad and Athena
      miniHead(g, 70, 130, 40, { hair: '#93593a', bangs: true, happy: true });
      miniHead(g, 186, 126, 40, { hat: '#5a3a2c', happy: true });
      for (const d of [-1, 1]) { C2.el(g, 186 + d * 15, 133, 11, 11); g.lineWidth = 3.5; g.strokeStyle = OL; g.stroke(); }
      miniHead(g, 128, 190, 36, ATH);
      g.font = '28px LilitaOne, sans-serif'; g.textAlign = 'center'; g.fillStyle = OL; g.fillText('HOME', 128, 270);
    }
  });
}

// ---- name banner over the bed ----
export function nameBanner(text) {
  return canvasTex(512, 128, (g) => {
    g.strokeStyle = '#d9a36a'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(10, 20); g.quadraticCurveTo(256, 60, 502, 20); g.stroke();
    const cols = ['#ffb3c8', '#ffe08a', '#b9e6cb', '#b5d8ff', '#d9c2ff', '#ffc8a8'];
    const n = text.length, step = 460 / n;
    g.font = '58px LilitaOne, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const x = 26 + step * (i + 0.5), t = (x - 256) / 246, y = 20 + 40 * (1 - t * t) + 40;
      C2.rr(g, x - 32, y - 36, 64, 72, 14); C2.fin(g, cols[i % cols.length], 4);
      g.fillStyle = '#ffffff'; g.lineWidth = 6; g.strokeStyle = OL; g.strokeText(text[i], x, y + 3); g.fillText(text[i], x, y + 3);
    }
  });
}

export function tvScreen() {
  return canvasTex(256, 160, (g) => {
    g.fillStyle = C2.lin(g, 0, 0, 0, 160, [[0, '#bfe6ff'], [1, '#fff0f6']]); g.fillRect(0, 0, 256, 160);
    const rb = ['#ff9db5', '#ffc48a', '#ffe58a', '#a8e8b8', '#9fd2ff', '#c8a8ff'];
    rb.forEach((c, i) => { g.beginPath(); g.arc(128, 170, 110 - i * 12, Math.PI, 0); g.lineWidth = 12; g.strokeStyle = c; g.stroke(); });
    C2.cloud(g, 60, 140, 34); C2.fin(g, '#fff'); C2.cloud(g, 210, 140, 34); C2.fin(g, '#fff');
    C2.el(g, 200, 40, 14, 14); C2.fin(g, '#fffbe0');
  });
}
export function clockFace() {
  return canvasTex(128, 128, (g) => {
    C2.el(g, 64, 64, 60, 60); C2.fin(g, '#fffaf2');
    g.font = '20px LilitaOne, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = OL;
    [[12, 64, 18], [3, 108, 64], [6, 64, 110], [9, 20, 64]].forEach(([n, x, y]) => g.fillText(n, x, y));
    g.lineCap = 'round'; g.strokeStyle = OL; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 34); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(88, 74); g.stroke();
    C2.heart(g, 64, 64, 6); C2.fin(g, '#ff8fb0');
  });
}
export function doorSign(text, emoji) {
  return canvasTex(256, 96, (g) => {
    C2.rr(g, 6, 6, 244, 84, 40); C2.fin(g, '#fffaf2', 6);
    g.font = '40px LilitaOne, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = OL;
    g.fillText(`${emoji} ${text}`, 128, 52);
  });
}
