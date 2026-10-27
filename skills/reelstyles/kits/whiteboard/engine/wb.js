// =====================================================================
//  engine/wb.js: the frame clock for the whiteboard look inside a HyperFrames composition.
//  Classic script (no modules, no fetch): every name here is a global that film.js uses.
//  Load order in index.html: gsap → fonts/ems-tech.js → engine/wb.js → your film.js (film.js ends with mount(DUR)).
//
//  Everything is a pure function of film time t: you REGISTER strokes / erasers / magnets / camera keys with times,
//  and the engine redraws the whole board from that schedule at every seek. No Date, no Math.random.
//
//    World = pixel coordinates at zoom 1. The board is as big as you want; (960,540) is the default camera centre.
//    write(str,x,y,{size,t0,dur,col,anchor})     handwriting in stroke order (anchor 'l' | 'c' | 'r', y = baseline, size = cap height px)
//    draw(shapes,t0,dur,{col,w})                 draw a list of point lists as strokes inside one time window (speed is solved)
//    line / curve / circle / box / arrow / dashed / check / underline / axes / bars / person / bulb / bubble   shape makers → point lists
//    highlight(x,y,w,h,t0,dur)                   translucent chisel swipe under the ink
//    erase(t0,t1,x,y,w,h)                        a felt eraser zig-zags over a rectangle (a faint ghost stays)
//    magnet({col,r,keys:[[t,x,y,lift]]})         a glossy magnet that slides, lifts and drops (lift 0 = on the board)
//    cam([[t,cx,cy,zoom,rollRad]...])            camera keys; eased between keys (zoom interpolated in 1/z, so pushes feel like dollies)
//    ghosts(x,y,w,h,n,seed)                      faint marks of old lessons
//    caption(text,t0,t1)                         burned subtitle label (screen space)
//    mount(duration)                             hands HyperFrames a paused GSAP timeline that paints the canvas at every seek
//    soundEvents()                               stroke / magnet / eraser schedule (tools/foley.mjs turns it into a wav)
//
//  The stroke / pen / eraser / camera ideas follow lemo-opuscar styles/whiteboard (MIT, (c) 2026 LemoLab; notice in
//  LICENSES/MIT-lemo-opuscar.txt). This file is a rewrite as classic script with a flat schedule, plus highlighter, pens per
//  colour, diagram pieces, shutter blur and a foley export.
// =====================================================================
const _cv = typeof document !== 'undefined' && document.getElementById('c');   // frame size follows the canvas attributes (1920x1080 default, 1080x1920 for vertical)
const W = _cv ? _cv.width : 1920, H = _cv ? _cv.height : 1080, FPS = 30, TAU = Math.PI * 2;
const HAND = '"Architects Daughter", "Comic Sans MS", cursive';

// ---- math (deterministic)
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const EZ = { o2: (t) => 1 - (1 - clamp(t)) ** 2, o3: (t) => 1 - (1 - clamp(t)) ** 3, i2: (t) => clamp(t) ** 2, io: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; } };
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hand = (u) => { u = clamp(u); return u - 0.8 * Math.sin(TAU * u) / TAU; };   // slow-fast-slow, monotone

// ---- palette (three marker colours, each keeps one meaning for the whole film)
const PAL = {
  board: '#f7f6f1', board2: '#ecebe4', ink: '#20242b', sig: '#177f8c', hot: '#e0523b', hi: '#ffd84a', ghost: '#8a96a8', magnet: '#e0523b',
};
const PEN = { ink: PAL.ink, sig: PAL.sig, hot: PAL.hot };

// ---- schedule
const STROKES = [], ERASES = [], MAGNETS = [], CAMKEYS = [], CAPS = [], GHOSTS = [];
let ctx = null, sctx = null, ictx = null, hctx = null, SC = null, IC = null, HC = null, DUR_ = 10, seedN = 1;
const colOf = (c) => PEN[c] || c || PAL.ink;

function resample(pts, step, w, rnd, kind) {
  const out = [];
  let s = 0, ph1 = rnd() * TAU, ph2 = rnd() * TAU, ph3 = rnd() * TAU;
  const A = pts.length / 2 | 0;
  const raw = [];
  for (let i = 0; i < A; i++) raw.push([pts[2 * i], pts[2 * i + 1]]);
  for (let i = 0; i < A - 1; i++) {
    const [x0, y0] = raw[i], [x1, y1] = raw[i + 1], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(d / step));
    for (let k = 0; k < n; k++) out.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
  }
  out.push(raw[A - 1]);
  const cum = [0];
  for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  const L = cum[cum.length - 1];
  // low-frequency hand wobble + fine tremor along the normal (fades in/out so strokes start and end where they should)
  const P = out.map((p, i) => {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const e = Math.min(1, cum[i] / 14, (L - cum[i]) / 14), s2 = cum[i];
    const wm = kind === 'hi' ? 0.2 : 1, o = wm * (w * 0.34 * Math.sin(s2 / 120 + ph1) + w * 0.14 * Math.sin(s2 / 27 + ph2) + w * 0.05 * Math.sin(s2 / 7 + ph3)) * e;
    return [p[0] + nx * o, p[1] + ny * o];
  });
  return { P, cum, L };
}

function addStroke(pts, t0, t1, o = {}) {
  const w = o.w ?? 8, rnd = mulberry32(1000 + seedN++ * 7919);
  const r = resample(pts, Math.max(3, w * 0.55), w, rnd, o.kind);
  const s = { ...r, t0, t1, w, col: colOf(o.col), kind: o.kind || 'ink', pen: o.pen || o.col || 'ink', z: STROKES.length, rnd: rnd() };
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of r.P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  s.bb = [x0 - w * 2, y0 - w * 2, x1 + w * 2, y1 + w * 2];
  (o.ghost ? GHOSTS : STROKES).push(s);
  return s;
}

// ---- draw a list of point lists as strokes inside [t0, t0+dur]; stroke time ∝ length, with a floor so dots read
function draw(shapes, t0, dur, o = {}) {
  const sh = shapes.filter((p) => p && p.length >= 4);
  if (!sh.length) return t0;
  const len = sh.map((p) => { let d = 0; for (let i = 2; i < p.length; i += 2) d += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); return Math.max(d, 8); });
  const hop = Math.min(0.05, dur * 0.06), net = Math.max(0.05, dur - hop * (sh.length - 1));
  const wt = len.map((l) => Math.max(l, 40)), tot = wt.reduce((a, b) => a + b, 0);
  let t = t0;
  sh.forEach((p, i) => { const d = net * wt[i] / tot; addStroke(p, t, t + d, o); t += d + hop; });
  return t0 + dur;
}

// ---- lettering from the single-line font, written in stroke order; returns {x0,x1,y0,y1,t1}
function textWidth(str, size) { let w = 0; for (const ch of str) w += (WB_FONT[ch] || WB_FONT['?'] || { w: 500 }).w; return w * size / 700; }
function glyphStrokes(str, x, y, size, anchor, seed) {
  const sc = size / 700, rnd = mulberry32(seed), tw = textWidth(str, size);
  let cx = anchor === 'c' ? x - tw / 2 : anchor === 'r' ? x - tw : x;
  const out = [];
  for (const ch of str) {
    const g = WB_FONT[ch] || WB_FONT[ch.toLowerCase()] || WB_FONT['?'];
    const rot = (rnd() - 0.5) * 0.05, jy = (rnd() - 0.5) * size * 0.035, js = 1 + (rnd() - 0.5) * 0.06, co = Math.cos(rot), si = Math.sin(rot);
    for (const s of g.s) {
      const p = [];
      for (let i = 0; i < s.length; i += 2) {
        const gx = s[i] * sc * js, gy = s[i + 1] * sc * js;
        p.push(cx + gx * co - gy * si, y + jy - (gx * si + gy * co));
      }
      if (p.length === 4 && Math.hypot(p[2] - p[0], p[3] - p[1]) < size * 0.06) { p[0] -= 0.4; p[2] += 0.4; }   // a period is a dot, never a 1 px hair
      out.push(p);
    }
    cx += g.w * sc * js;
  }
  return { strokes: out, tw };
}
function write(str, x, y, o = {}) {
  const size = o.size ?? 60, anchor = o.anchor || 'l', w = o.w ?? Math.max(5, size * 0.056);
  const { strokes, tw } = glyphStrokes(str, x, y, size, anchor, 77 + seedN * 31 + str.length);
  const dur = o.dur ?? Math.max(0.35, str.length * 0.07);
  draw(strokes, o.t0 ?? 0, dur, { col: o.col, w, pen: o.col });
  const x0 = anchor === 'c' ? x - tw / 2 : anchor === 'r' ? x - tw : x;
  return { x0, x1: x0 + tw, y0: y - size, y1: y + size * 0.3, t1: (o.t0 ?? 0) + dur, cx: x0 + tw / 2 };
}

// ---- shape makers: return lists of point lists (flat [x,y,x,y...])
function line(x1, y1, x2, y2) { const bx = (y1 - y2) * 0.012, by = (x2 - x1) * 0.012; return [[x1, y1, (x1 + x2) / 2 + bx, (y1 + y2) / 2 + by, x2, y2]]; }
function curve(pts, n = 8) {   // Catmull-Rom through [x,y,...]
  const P = []; for (let i = 0; i < pts.length; i += 2) P.push([pts[i], pts[i + 1]]);
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push(0.5 * ((2 * b[0]) + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3),
        0.5 * ((2 * b[1]) + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3));
    }
  }
  out.push(...P[P.length - 1]);
  return [out];
}
function fn(f, x0, x1, n = 40, flip = true) { const p = []; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); p.push(x, f(x)); } return [p]; }
function circle(cx, cy, rx, ry = rx, a0 = -2.2) {   // starts at an angle, overlaps past closure, spirals a hair inward
  const p = [], N = 36, rev = 1.1;
  for (let i = 0; i <= N; i++) { const a = a0 + TAU * rev * i / N, k = 1 - 0.035 * i / N; p.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
  return [p];
}
function box(x, y, w, h, r = 14) {   // rounded rectangle as one stroke with an overshoot at the closing corner
  const p = [x + r, y, x + w - r, y, x + w, y + r, x + w, y + h - r, x + w - r, y + h, x + r, y + h, x, y + h - r, x, y + r, x + r, y, x + r + 26, y - 2];
  return [p];
}
function arrow(x1, y1, x2, y2, hs = 26) {
  const a = Math.atan2(y2 - y1, x2 - x1), c = Math.cos, s = Math.sin;
  return [...line(x1, y1, x2, y2), [x2 - hs * c(a - 0.5), y2 - hs * s(a - 0.5), x2, y2, x2 - hs * c(a + 0.5), y2 - hs * s(a + 0.5)]];
}
function dashed(x1, y1, x2, y2, dash = 22, gap = 16) {
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, out = [];
  for (let d = 0; d < L; d += dash + gap) { const e = Math.min(L, d + dash); out.push([x1 + ux * d, y1 + uy * d, x1 + ux * e, y1 + uy * e]); }
  return out;
}
function check(x, y, s = 60) { return [[x - s * 0.5, y, x - s * 0.15, y + s * 0.4, x + s * 0.6, y - s * 0.55]]; }
function underline(x0, x1, y, wob = 5) { return [[x0, y, lerp(x0, x1, 0.3), y - wob, lerp(x0, x1, 0.65), y + wob * 0.4, x1, y - wob * 0.5]]; }
function axes(x, y, w, h) { return [...arrow(x, y, x + w, y, 22), ...arrow(x, y, x, y - h, 22)]; }
function bars(x, y, ws, hs) { const out = []; let cx = x; ws.forEach((bw, i) => { out.push(...box(cx, y - hs[i], bw, hs[i], 4)); cx += bw * 1.5; }); return out; }
function person(cx, cy, s = 1) {   // stick figure: head circle, body, arms, legs; (cx,cy) = feet centre
  const h = 70 * s;
  return [...circle(cx, cy - 175 * s, h * 0.42), [cx, cy - 175 * s + h * 0.42, cx, cy - 70 * s], [cx - 55 * s, cy - 120 * s, cx, cy - 138 * s, cx + 55 * s, cy - 120 * s],
    [cx, cy - 70 * s, cx - 38 * s, cy], [cx, cy - 70 * s, cx + 38 * s, cy]];
}
function bulb(cx, cy, s = 1) {
  const ray = (a) => [cx + Math.cos(a) * 82 * s, cy - 60 * s + Math.sin(a) * 82 * s, cx + Math.cos(a) * 112 * s, cy - 60 * s + Math.sin(a) * 112 * s];
  return [...circle(cx, cy - 60 * s, 46 * s, 50 * s, -0.4), [cx - 22 * s, cy - 10 * s, cx - 20 * s, cy + 12 * s, cx + 20 * s, cy + 12 * s, cx + 22 * s, cy - 10 * s], [cx - 18 * s, cy + 28 * s, cx + 18 * s, cy + 28 * s],
    ray(-Math.PI / 2), ray(-Math.PI / 2 - 0.8), ray(-Math.PI / 2 + 0.8)];
}
function bubble(x, y, w, h, tail = 'l') { const tx = tail === 'l' ? x + 50 : x + w - 50, d = tail === 'l' ? -34 : 34; return [[x + 16, y, x + w - 16, y, x + w, y + 16, x + w, y + h - 16, x + w - 16, y + h, tx + 28, y + h, tx + d, y + h + 40, tx - 6, y + h, x + 16, y + h, x, y + h - 16, x, y + 16, x + 16, y]]; }

// ---- highlighter, eraser, magnets, camera, ghosts, captions
function highlight(x, y, w, h, t0, dur, col = PAL.hi) {   // a chisel swipe; tall areas are filled by a zig-zag of swipes
  const bw = Math.min(h, 44), rows = Math.max(1, Math.ceil((h - bw) / (bw * 0.6)) + 1), p = [];
  for (let r = 0; r < rows; r++) { const yy = rows === 1 ? y + h / 2 : y + bw / 2 + (h - bw) * r / (rows - 1); if (r % 2 === 0) p.push(x, yy, x + w, yy - 2); else p.push(x + w, yy + 2, x, yy); }
  addStroke(p, t0, t0 + dur, { w: bw, col, kind: 'hi', pen: 'hi' });
}
function erase(t0, t1, x, y, w, h) {
  const rows = Math.max(2, Math.round(h / 90)), p = [];
  for (let r = 0; r <= rows; r++) { const yy = y + h * r / rows; if (r % 2 === 0) p.push(x, yy, x + w, yy); else p.push(x + w, yy, x, yy); }
  ERASES.push({ t0, t1, rect: [x, y, w, h], ...resample(p, 12, 8, mulberry32(9)), bw: Math.max(70, h / rows * 1.15) });
}
function magnet(o) { MAGNETS.push({ col: colOf(o.col || 'hot'), r: o.r || 46, keys: o.keys, label: o.label || '' }); }
function cam(keys) { CAMKEYS.length = 0; CAMKEYS.push(...keys.map((k) => [k[0], k[1], k[2], k[3] ?? 1, k[4] ?? 0])); }
function ghosts(x, y, w, h, n, seed = 5) {
  const R = mulberry32(seed), words = ['?', 'x²', '=', '+', 'why', 'Δ', '%', 'so?'];
  for (let i = 0; i < n; i++) {
    const px = x + R() * w, py = y + R() * h, k = R();
    const sh = k < 0.3 ? circle(px, py, 30 + R() * 60) : k < 0.55 ? arrow(px, py, px + 80 + R() * 120, py + (R() - 0.5) * 80) : k < 0.8 ? glyphStrokes(words[(R() * words.length) | 0], px, py, 50 + R() * 50, 'l', seed + i).strokes : line(px, py, px + 100 + R() * 160, py + (R() - 0.5) * 30);
    for (const p of sh) addStroke(p, -2, -1, { w: 7, col: R() < 0.5 ? PAL.ghost : '#9fb2c8', ghost: true });
  }
}
function caption(text, t0, t1) { CAPS.push({ text, t0, t1 }); }

function camAt(t) {
  const K = CAMKEYS;
  if (!K.length) return [960, 540, 1, 0];
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1][0]) {
    const a = K[i], b = K[i + 1], u = EZ.io(seg(t, a[0], b[0])), z = 1 / lerp(1 / a[3], 1 / b[3], u);
    return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), z, lerp(a[4], b[4], u)];
  }
  return K[K.length - 1].slice(1);
}
const toScreen = (c, x, y) => { const k = c[2], co = Math.cos(-c[3]), si = Math.sin(-c[3]), dx = (x - c[0]) * k, dy = (y - c[1]) * k; return [W / 2 + dx * co - dy * si, H / 2 + dx * si + dy * co]; };
const toWorld = (c, sx, sy) => { const k = c[2], dx = (sx - W / 2), dy = (sy - H / 2), co = Math.cos(c[3]), si = Math.sin(c[3]); return [c[0] + (dx * co - dy * si) / k, c[1] + (dx * si + dy * co) / k]; };
function applyCam(g, c) { g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.rotate(-c[3]); g.scale(c[2], c[2]); g.translate(-c[0], -c[1]); }
function visible(bb, c, pad = 0) { const a = toWorld(c, 0, 0), b = toWorld(c, W, H), r = Math.hypot(W, H) / 2 / c[2] * 1.0, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; return !(bb[2] < mx - r - pad || bb[0] > mx + r + pad || bb[3] < my - r - pad || bb[1] > my + r + pad); }

// ---- textures (seeded, built once)
let TEX = null;
function buildTextures() {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const R = mulberry32(31);
  const dry = mk(512, 512), d = dry.getContext('2d');           // speckle + streaks, subtracted from the ink
  for (let i = 0; i < 2600; i++) { d.fillStyle = `rgba(0,0,0,${0.3 + R() * 0.7})`; const s = R() < 0.9 ? 1 + R() * 1.4 : 2 + R() * 2; d.fillRect(R() * 512, R() * 512, s, s); }
  for (let i = 0; i < 160; i++) { d.fillStyle = `rgba(0,0,0,${0.12 + R() * 0.25})`; d.fillRect(R() * 512, R() * 512, 14 + R() * 60, 0.8 + R() * 1.2); }
  const scuff = mk(1024, 1024), s = scuff.getContext('2d');      // faint scratches + haze, tiles in world space
  for (let i = 0; i < 70; i++) { s.strokeStyle = `rgba(${R() < 0.5 ? '120,130,150' : '255,255,255'},${0.05 + R() * 0.09})`; s.lineWidth = 0.7 + R() * 2.2; s.beginPath(); const x = R() * 1024, y = R() * 1024, a = -0.2 + R() * 0.4, l = 80 + R() * 340; s.moveTo(x, y); s.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); s.stroke(); }
  for (let i = 0; i < 26; i++) {   // soft haze, drawn at wrapped offsets so the tile has no seams
    const x = R() * 1024, y = R() * 1024, rr = 110 + R() * 180;
    for (const ox of [-1024, 0, 1024]) for (const oy of [-1024, 0, 1024]) { const g = s.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rr); g.addColorStop(0, 'rgba(150,155,165,0.05)'); g.addColorStop(1, 'rgba(150,155,165,0)'); s.fillStyle = g; s.fillRect(0, 0, 1024, 1024); }
  }
  TEX = { dry: ctx.createPattern(dry, 'repeat'), scuff: ctx.createPattern(scuff, 'repeat') };
}

// ---- stroke renderer
function tracePath(g, S, k, col, alpha, fixedW) {
  const P = S.P, n = P.length - 1, upto = k * n, last = Math.floor(upto), fr = upto - last, w = fixedW ? S.w : S.w;
  g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  const wAt = (i, a, b) => {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), chisel = 0.84 + 0.28 * Math.abs(Math.sin(ang + 0.7)), ramp = Math.min(1, 0.7 + S.cum[i] / 24), tail = Math.min(1, 0.78 + (S.L - S.cum[i]) / 36);
    return w * chisel * ramp * tail;
  };
  if (S.kind === 'hi') {   // highlighter: one wide flat band
    g.lineWidth = w; g.lineCap = 'butt'; g.globalAlpha = alpha; g.beginPath(); g.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i <= last && i <= n; i++) g.lineTo(P[i][0], P[i][1]);
    if (last < n) g.lineTo(lerp(P[last][0], P[last + 1][0], fr), lerp(P[last][1], P[last + 1][1], fr));
    g.stroke(); return;
  }
  g.globalAlpha = alpha;
  for (let i = 0; i <= last && i < n; i++) {
    const a = P[i], b = i === last ? [lerp(a[0], P[i + 1][0], fr), lerp(a[1], P[i + 1][1], fr)] : P[i + 1];
    g.lineWidth = wAt(i, a, P[i + 1]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  if (S.L > w * 3 && last >= 1) {   // darker pooled dot where the nib first landed (kept inside the stroke width)
    g.globalAlpha = alpha * 0.55; g.fillStyle = col; g.beginPath(); g.arc(P[0][0], P[0][1], w * 0.36, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}
const prog = (S, t) => (t <= S.t0 ? 0 : t >= S.t1 ? 1 : hand((t - S.t0) / (S.t1 - S.t0)));

function paintInk(g, hg, t, c) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, W, H);
  // time-ordered merge of strokes and erasers so a stroke drawn after a wipe stays
  const items = [];
  for (const s of STROKES) if (s.t0 < t && visible(s.bb, c)) items.push([s.t0, s]);
  for (const e of ERASES) if (e.t0 < t) items.push([e.t0, e]);
  items.sort((a, b) => a[0] - b[0] || (a[1].z ?? 0) - (b[1].z ?? 0));
  applyCam(g, c); applyCam(hg, c);
  for (const [, it] of items) {
    if (it.rect) {
      const k = clamp((t - it.t0) / (it.t1 - it.t0)), P = it.P, n = P.length - 1, upto = Math.min(n, Math.floor(k * n));
      g.save(); g.globalCompositeOperation = 'destination-out'; g.strokeStyle = 'rgba(0,0,0,0.9)'; g.lineWidth = it.bw; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i <= upto; i++) g.lineTo(P[i][0], P[i][1]); g.stroke(); g.restore();
    } else if (it.kind === 'hi') tracePath(hg, it, prog(it, t), it.col, 1);
    else tracePath(g, it, prog(it, t), it.col, 1);
  }
  const fade = clamp((c[2] - 0.35) / 0.5);   // dry-marker texture locked to board space, off when the camera is wide
  if (fade > 0) { g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.5 * fade; g.fillStyle = TEX.dry; const a = toWorld(c, W / 2, H / 2), r = Math.hypot(W, H) / 2 / c[2] + 40; g.fillRect(a[0] - r, a[1] - r, r * 2, r * 2); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
}

// ---- pens: one per marker colour; follow their own stroke tip, hop between strokes, park off-frame in long gaps
function strokeTip(S, t) { const P = S.P, k = prog(S, t) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(k)), f = k - i; return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)]; }
function penState(name, t) {
  const mine = STROKES.filter((s) => s.pen === name && s.kind !== 'hi' || (name === 'hi' && s.kind === 'hi')).sort((a, b) => a.t0 - b.t0);
  if (!mine.length) return null;
  const cur = mine.find((s) => t >= s.t0 && t <= s.t1);
  if (cur) return { p: strokeTip(cur, t), lift: 0, drawing: true, S: cur };
  const prev = [...mine].reverse().find((s) => s.t1 < t), next = mine.find((s) => s.t0 > t);
  const c = camAt(t), park = toWorld(c, W + 260, H + 160);
  const end = (s) => s.P[s.P.length - 1], start = (s) => s.P[0];
  if (prev && next) {
    const gap = next.t0 - prev.t1;
    if (gap > 1.8) {
      const lv = 0.5, rt = 0.55;
      if (t < prev.t1 + lv) { const u = EZ.io((t - prev.t1) / lv); return { p: [lerp(end(prev)[0], park[0], u), lerp(end(prev)[1], park[1], u)], lift: 1, S: prev }; }
      if (t > next.t0 - rt) { const u = EZ.io(1 - (next.t0 - t) / rt); return { p: [lerp(park[0], start(next)[0], u), lerp(park[1], start(next)[1], u)], lift: 1 - u * 0.9 }; }
      return null;
    }
    const u = EZ.io((t - prev.t1) / gap), d = Math.hypot(start(next)[0] - end(prev)[0], start(next)[1] - end(prev)[1]);
    return { p: [lerp(end(prev)[0], start(next)[0], u), lerp(end(prev)[1], start(next)[1], u)], lift: Math.sin(Math.PI * u) * clamp(d / 500) + 0.12 };
  }
  if (prev) { const lv = 0.6; if (t < prev.t1 + lv) { const u = EZ.io((t - prev.t1) / lv); return { p: [lerp(end(prev)[0], park[0], u), lerp(end(prev)[1], park[1], u)], lift: 1 }; } return null; }
  if (next) { const rt = 0.6; if (t > next.t0 - rt) { const u = EZ.io(1 - (next.t0 - t) / rt); return { p: [lerp(park[0], start(next)[0], u), lerp(park[1], start(next)[1], u)], lift: 1 - u * 0.9 }; } }
  return null;
}
function drawMarker(g, sx, sy, k, lift, col, wob) {
  const ang = -0.62 + wob;   // body leans up and to the right of the nib
  const L = 270 * k, bw = 36 * k, sh = 10 + lift * 34;
  const body = (ox, oy, shadow) => {
    g.save(); g.translate(sx + ox, sy + oy); g.rotate(ang);
    const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
    if (shadow) { g.fillStyle = 'rgba(20,25,35,0.20)'; g.filter = `blur(${3 + lift * 9}px)`; rr(0, -bw / 2, L, bw, 10 * k); g.fill(); g.filter = 'none'; g.restore(); return; }
    g.fillStyle = '#fbfbf8'; rr(34 * k, -bw / 2, L - 34 * k, bw, 12 * k); g.fill();
    g.strokeStyle = 'rgba(40,45,55,0.35)'; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = col; rr(L * 0.34, -bw / 2, 44 * k, bw, 2); g.fill();      // colour band
    g.fillStyle = col; rr(L - 70 * k, -bw / 2 - 1, 70 * k, bw + 2, 12 * k); g.fill();   // cap
    g.fillStyle = 'rgba(255,255,255,0.45)'; rr(L * 0.12, -bw / 2 + 4 * k, L * 0.7, 5 * k, 3); g.fill();   // specular
    g.fillStyle = '#2b2f36'; g.beginPath(); g.moveTo(34 * k, -bw * 0.3); g.lineTo(0, 0); g.lineTo(34 * k, bw * 0.3); g.closePath(); g.fill();   // nib
    g.fillStyle = col; g.beginPath(); g.arc(1, 0, 4 * k, 0, TAU); g.fill();
    g.restore();
  };
  body(sh * 0.6, sh, true); body(0, -lift * 12 * k, false);
}
function drawMagnet(g, c, M, t) {
  const K = M.keys; let a = K[0], b = K[0];
  if (t <= K[0][0]) { a = b = K[0]; } else if (t >= K[K.length - 1][0]) { a = b = K[K.length - 1]; } else for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1][0]) { a = K[i]; b = K[i + 1]; break; }
  if (t < K[0][0] - 0.0001) return;
  const u = a === b ? 0 : EZ.io(seg(t, a[0], b[0])), x = lerp(a[1], b[1], u), y = lerp(a[2], b[2], u);
  let lift = lerp(a[3] || 0, b[3] || 0, u);
  const mid = a === b ? 0 : Math.sin(Math.PI * u) * Math.min(0.5, Math.hypot(b[1] - a[1], b[2] - a[2]) / 900);   // a small lift while sliding
  lift = Math.max(lift, mid);
  const sq = a !== b && b[3] === 0 && (a[3] || 0) > 0 ? Math.sin(Math.PI * seg(u, 0.85, 1)) * 0.06 : 0;   // tiny squash on landing
  const [sx, sy] = toScreen(c, x, y), k = c[2], r = M.r * k * (1 + lift * 0.12 - sq);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = `rgba(20,25,35,${0.28 - lift * 0.1})`; g.filter = `blur(${4 + lift * 10}px)`; g.beginPath(); g.ellipse(sx + 6 + lift * 22, sy + 10 + lift * 30, r, r * 0.94, 0, 0, TAU); g.fill(); g.filter = 'none';
  const gr = g.createRadialGradient(sx - r * 0.35, sy - r * 0.4, r * 0.1, sx, sy, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.15, M.col); gr.addColorStop(1, '#00000055');
  g.fillStyle = M.col; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill();
  g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(sx - r * 0.35, sy - r * 0.42, r * 0.3, r * 0.16, -0.6, 0, TAU); g.fill();
  if (M.label) { g.fillStyle = '#fff'; g.font = `${Math.round(r * 0.95)}px ${HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(M.label, sx, sy + r * 0.05); }
  g.restore();
}
function drawEraser(g, c, E, t) {
  if (t < E.t0 - 0.35 || t > E.t1 + 0.5) return;
  const k = clamp((t - E.t0) / (E.t1 - E.t0)), P = E.P, i = Math.min(P.length - 1, Math.floor(k * (P.length - 1)));
  const park = toWorld(c, W + 260, H * 0.62);
  let p = P[i], lift = 0.1;
  if (t < E.t0) { const u = EZ.io((t - (E.t0 - 0.35)) / 0.35); p = [lerp(park[0], P[0][0], u), lerp(park[1], P[0][1], u)]; lift = 1 - u; }
  if (t > E.t1) { const u = EZ.io((t - E.t1) / 0.5); p = [lerp(P[P.length - 1][0], park[0], u), lerp(P[P.length - 1][1], park[1], u)]; lift = u; }
  const [sx, sy] = toScreen(c, p[0], p[1]), z = Math.min(1.3, c[2]);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(sx, sy); g.scale(z, z);
  g.fillStyle = 'rgba(20,25,35,0.2)'; g.filter = `blur(${5 + lift * 9}px)`; g.beginPath(); g.roundRect(-70 + 10 + lift * 22, -34 + 14 + lift * 26, 140, 70, 12); g.fill(); g.filter = 'none';
  g.translate(0, -lift * 16);
  g.fillStyle = '#2c3a52'; g.beginPath(); g.roundRect(-70, -34, 140, 44, 10); g.fill();       // felt
  g.fillStyle = '#4a4f58'; g.beginPath(); g.roundRect(-70, -4, 140, 36, [0, 0, 10, 10]); g.fill();   // grip
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.roundRect(-60, -30, 120, 6, 3); g.fill();
  g.restore();
}

// ---- one scene at time t onto the scratch canvas
function paintScene(t) {
  const c = camAt(t), g = sctx;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const bg = g.createLinearGradient(0, 0, W * 0.4, H); bg.addColorStop(0, PAL.board); bg.addColorStop(1, PAL.board2); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  applyCam(g, c); g.fillStyle = TEX.scuff; const a = toWorld(c, W / 2, H / 2), r = Math.hypot(W, H) / 2 / c[2] + 40; g.fillRect(a[0] - r, a[1] - r, r * 2, r * 2);
  // ghosts of old lessons, faint, always fully drawn
  g.globalCompositeOperation = 'multiply';
  for (const s of GHOSTS) if (visible(s.bb, c)) tracePath(g, s, 1, s.col, 0.11);
  g.globalAlpha = 1;
  paintInk(ictx, hctx, t, c);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.55; g.drawImage(HC, 0, 0); g.globalAlpha = 0.94; g.drawImage(IC, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  for (const M of MAGNETS) drawMagnet(g, c, M, t);
  for (const E of ERASES) drawEraser(g, c, E, t);
  const names = [...new Set(STROKES.map((s) => (s.kind === 'hi' ? 'hi' : s.pen)))];
  for (const nm of names) {
    const ps = penState(nm, t); if (!ps) continue;
    const [sx, sy] = toScreen(c, ps.p[0], ps.p[1]), k = clamp(Math.pow(c[2], 0.5), 0.6, 1.2) * 0.85, col = nm === 'hi' ? '#e8b800' : colOf(nm);
    drawMarker(g, sx, sy, k, ps.lift, col, Math.sin(t * 9 + names.indexOf(nm)) * (ps.drawing ? 0.025 : 0.05));
  }
  // glossy window sheen: a soft diagonal band that moves slower than the board
  g.setTransform(1, 0, 0, 1, 0, 0);
  const off = (c[0] * -0.35) % 2600, sh = g.createLinearGradient(0, 0, W, H * 0.55);
  const x0 = ((off % 2600) + 2600) % 2600 / 2600 * 1.6 - 0.3;
  sh.addColorStop(clamp(x0 - 0.16), 'rgba(255,255,255,0)'); sh.addColorStop(clamp(x0), 'rgba(255,255,255,0.13)'); sh.addColorStop(clamp(x0 + 0.16), 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(60,60,70,0)'); vg.addColorStop(1, 'rgba(60,60,70,0.10)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

function paintCaption(g, t) {
  const C = CAPS.find((x) => t >= x.t0 && t < x.t1); if (!C) return;
  const a = Math.min(seg(t, C.t0, C.t0 + 0.18), 1 - seg(t, C.t1 - 0.18, C.t1));
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.font = `${H > W ? 52 : 44}px ${HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (H > W) {   // vertical: up to two lines, label at most 800 px wide centred in the safe area (x 140-940), above the bottom UI zone
    const words = C.text.split(' '), lines = ['']; for (const wd of words) { const tryL = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + wd : wd; if (g.measureText(tryL).width > 700 && lines[lines.length - 1]) lines.push(wd); else lines[lines.length - 1] = tryL; }
    const w = Math.min(800, Math.max(...lines.map((l) => g.measureText(l).width)) + 90), hh = 30 + lines.length * 68 + 22, x = 540 - w / 2, y = 1470 - hh - 20 + (1 - a) * 12;
    g.fillStyle = 'rgba(20,24,32,0.10)'; g.beginPath(); g.roundRect(x + 4, y + 8, w, hh, 26); g.fill();
    g.fillStyle = 'rgba(252,251,247,0.92)'; g.beginPath(); g.roundRect(x, y, w, hh, 26); g.fill();
    g.fillStyle = PAL.hot; g.beginPath(); g.roundRect(x + 22, y + hh - 16, 44, 5, 3); g.fill();
    g.fillStyle = PAL.ink; lines.forEach((l, i) => g.fillText(l, 540, y + 44 + i * 68)); g.globalAlpha = 1; return;
  }
  const w = g.measureText(C.text).width + 90, x = W / 2 - w / 2, y = H - 128 + (1 - a) * 12;
  g.fillStyle = 'rgba(20,24,32,0.10)'; g.beginPath(); g.roundRect(x + 4, y + 8, w, 78, 26); g.fill();
  g.fillStyle = 'rgba(252,251,247,0.92)'; g.beginPath(); g.roundRect(x, y, w, 78, 26); g.fill();
  g.fillStyle = PAL.hot; g.beginPath(); g.roundRect(x + 22, y + 62, 44, 5, 3); g.fill();
  g.fillStyle = PAL.ink; g.fillText(C.text, W / 2, y + 36); g.globalAlpha = 1;
}

function renderFrame(t) {
  const c0 = camAt(t - 1 / FPS), c1 = camAt(t), sp = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) * c1[2] + Math.abs(c1[2] - c0[2]) * 900;
  const n = sp > 14 ? Math.min(4, Math.ceil(sp / 14)) : 1;   // shutter blur only when the camera really moves (sub-frames ≤ ~14 px apart)
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (n === 1) { paintScene(t); ctx.drawImage(SC, 0, 0); } else {
    for (let i = 0; i < n; i++) { paintScene(t + (i / (n - 1) - 0.5) * 0.5 / FPS); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(SC, 0, 0); }
    ctx.globalAlpha = 1;
  }
  paintCaption(ctx, t);
}

function mount(duration, id = 'main') {
  const cv = document.getElementById('c'); ctx = cv.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  SC = mk(); IC = mk(); HC = mk(); sctx = SC.getContext('2d'); ictx = IC.getContext('2d'); hctx = HC.getContext('2d');
  DUR_ = duration; buildTextures();
  document.fonts.load(`44px "Architects Daughter"`).then(() => {
    const st = { t: 0 }, tl = gsap.timeline({ paused: true });
    tl.to(st, { t: duration, duration, ease: 'none', onUpdate: () => renderFrame(st.t) });
    renderFrame(0);
    window.__timelines[id] = tl;   // register only after the build (HyperFrames rule)
  });
}

// ---- schedule export for tools/foley.mjs (also handy for cueing a voice track)
function soundEvents() {
  const ev = [];
  for (const s of STROKES) ev.push({ type: s.kind === 'hi' ? 'hi' : 'stroke', t0: s.t0, t1: s.t1, len: s.L, col: s.pen, x: s.P[0][0] });
  for (const e of ERASES) ev.push({ type: 'erase', t0: e.t0, t1: e.t1 });
  for (const M of MAGNETS) for (let i = 1; i < M.keys.length; i++) { const a = M.keys[i - 1], b = M.keys[i]; if ((a[3] || 0) > 0 && !(b[3] > 0)) ev.push({ type: 'click', t0: b[0] }); else if (a[1] !== b[1] || a[2] !== b[2]) ev.push({ type: 'slide', t0: a[0], t1: b[0] }); }
  return ev;
}
