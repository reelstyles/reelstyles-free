// =====================================================================
//  engine/runtime.js: frame clock + drawing helpers for the stick-metaphor look.
//  Classic script (no modules). Load order: gsap → engine/runtime.js → characters/stick.js → sets/props.js
//  → sets/metaphors.js → film.js. Every frame is a pure function of film time t (no Math.random / Date).
//
//  World: a 1000 x 1000 "logical" stage, centre (500, 500). It is scaled to the frame (width-fit on 9:16,
//  height-fit on 16:9), so every metaphor is drawn once and works in both. Ground lines sit near y 700-800.
//
//    beat(dur, draw, opts)    register a beat; draw(L, dur) reads local time L (s). opts: { cam(L, d) → {z,x,y}, pop }
//    mountFilm(total)         waits for the font, paints the canvas on every seek. Call once, last, in film.js.
//    text(str, x, y, opts)    the ONLY way to put text on screen: min 28 px at 1080p, wraps to maxW, clamped inside the frame
//    EZ / spring / seg / wob  eases and idle wobble;  rng(seed) seeded random;  alpha(a) global-alpha helper
// =====================================================================
const _cv = document.getElementById('c');
const W = _cv.width, H = _cv.height, FPS = 30, TAU = Math.PI * 2;
const VERT = H > W;
const S = VERT ? W / 900 : (H / 1000) * 0.97;           // logical → px
const CX = W / 2, CY = VERT ? H * 0.47 : H / 2;
const MIN_PX = 28;                                        // smallest allowed text height in px (1080p rule)
const PAL = { bg: '#000000', white: '#F4F4F0', g1: '#9A9A9A', g2: '#5C5C5C', g3: '#2E2E2E', fill: '#121212', accent: '#FFD21F', accentDeep: '#2B2300' };
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif', HAND = FONT;   // HAND = end-card font (engine/safe.js)
let ctx = null, TT = 0, CAMZ = 1, GA = 1;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const EZ = {
  o2: (t) => 1 - (1 - clamp(t)) ** 2, o3: (t) => 1 - (1 - clamp(t)) ** 3, o4: (t) => 1 - (1 - clamp(t)) ** 4,
  i2: (t) => clamp(t) ** 2, i3: (t) => clamp(t) ** 3,
  io: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; },
  back: (t) => { t = clamp(t) - 1; return 1 + 2.70158 * t * t * t + 1.70158 * t * t; },   // snappy overshoot
  lin: (t) => clamp(t),
};
// damped spring 0 → 1 (landings, pops)
const spring = (t, k = 8, z = 0.32) => { t = Math.max(0, t); return 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * t * 1.6); };
// squash value for a landing at time t0: dips below 1 then rings out to 1
const land = (L, t0, amt = 0.2) => (L < t0 ? 1 : 1 - amt * Math.exp(-9 * (L - t0)) * Math.cos(16 * (L - t0)));
const wob = (L, seed = 0, amp = 1, f = 1) => amp * Math.sin(L * TAU * 0.37 * f + seed * 2.1) * 0.6 + amp * Math.sin(L * TAU * 0.91 * f + seed * 4.7) * 0.4;
function rng(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const q8 = (t) => Math.floor(t * 8 + 1e-6) / 8;          // stepped time for jitter / boil
const alpha = (a = 1) => { ctx.globalAlpha = clamp(a * GA); };
const fade = (L, t0, d = 0.3) => EZ.o3((L - t0) / d);    // 0 → 1 appear, t0 <= -1 means "already there"

// ---- text: min size, fit-to-box, clamped inside the frame, never clipped by anything
function text(str, x, y, o = {}) {
  const { size = 40, weight = 500, color = PAL.white, align = 'center', maxW = 880, a = 1, lh = 1.12, track = 0.06, base = 'middle', clampX = true } = o;
  const minSize = (MIN_PX + 0.5) / (S * CAMZ);
  let sz = Math.max(size, minSize);
  ctx.save(); alpha(a);
  ctx.textBaseline = base; ctx.fillStyle = color; ctx.textAlign = 'left';
  const setf = () => { ctx.font = `${weight} ${sz}px ${FONT}`; ctx.letterSpacing = `${sz * track}px`; };
  setf();
  const words = String(str).split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
  lines.push(cur);
  let wmax = Math.max(...lines.map((l) => ctx.measureText(l).width));
  if (wmax > maxW && sz > minSize) { sz = Math.max(minSize, sz * (maxW / wmax)); setf(); wmax = Math.max(...lines.map((l) => ctx.measureText(l).width)); }
  const L0 = 85, R0 = 915;                               // safe logical x range (survives the slow push)
  const cx = !clampX ? x : align === 'left' ? Math.max(L0, x) + wmax / 2 : align === 'right' ? Math.min(R0, x) - wmax / 2 : clamp(x, L0 + wmax / 2, R0 - wmax / 2);
  const y0 = y - ((lines.length - 1) * sz * lh) / 2;
  lines.forEach((l, i) => { const w = ctx.measureText(l).width; ctx.fillText(l, cx - w / 2 + sz * track / 2, y0 + i * sz * lh); });
  ctx.restore();
  return { w: wmax, h: lines.length * sz * lh, size: sz, cx };
}

// ---- beat registry
const BEATS = [];
let _t = 0;
function beat(dur, draw, opts = {}) { BEATS.push({ t0: _t, t1: _t + dur, dur, draw, index: BEATS.length, ...opts }); _t += dur; return BEATS[BEATS.length - 1]; }
const beatAt = (t) => BEATS.find((b) => t >= b.t0 && t < b.t1) || BEATS[BEATS.length - 1];

// slow background dust: grey specks drifting through the whole (extended) frame, so even an empty corner lives
const _dr = rng(77), DUST = Array.from({ length: 46 }, () => ({ x: _dr() * 1500 - 250, y: _dr() * 1900 - 450, r: 1.2 + _dr() * 2.2, v: 5 + _dr() * 12, a: 0.1 + _dr() * 0.18, p: _dr() * TAU }));
function dust(t) {
  ctx.save();
  for (const d of DUST) {
    const x = ((d.x + t * d.v * 0.8 + 250) % 1500) - 250, y = ((d.y - t * d.v + 450) % 1900 + 1900) % 1900 - 450;
    ctx.fillStyle = PAL.white; alpha(d.a * (0.7 + 0.3 * Math.sin(t * 1.3 + d.p)));
    ctx.beginPath(); ctx.arc(x, y, d.r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function pips(idx) {                                        // beat progress, screen space, bottom
  const n = BEATS.length, gap = 38, y = VERT ? H - 150 : H - 46, x0 = W / 2 - ((n - 1) * gap) / 2;
  const L = TT - BEATS[idx].t0;
  for (let i = 0; i < n; i++) {
    const cur = i === idx, r = cur ? 9 + 1.6 * Math.sin(L * 5) : 6;
    ctx.globalAlpha = 1; ctx.fillStyle = cur ? PAL.white : i < idx ? PAL.g2 : PAL.g3;
    ctx.beginPath(); ctx.arc(x0 + i * gap, y, r, 0, TAU); ctx.fill();
  }
}

function renderFrame(t) {
  TT = t; GA = 1; if (typeof LAYOUT !== 'undefined') LAYOUT.length = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, W, H);
  const b = beatAt(t), L = t - b.t0, lk = typeof post === 'function';   // lk: engine/look.js loaded (grade, light, depth, grain)
  const c = b.cam ? b.cam(L, b.dur) : { z: 1 + 0.045 * EZ.io(L / b.dur), x: 490 + 20 * EZ.io(L / b.dur) };
  const pop = b.pop === false ? 1 : 1 + 0.05 * (1 - EZ.o3(L / 0.28));
  CAMZ = (c.z || 1) * pop;
  if (lk) { grade(b.grade || 'night'); LOOK.lights.length = 0; CAMR = { z: c.z || 1, pop, x: c.x ?? 500, y: c.y ?? 500, sx: c.sx || 0, sy: c.sy || 0 }; }
  const k = S * CAMZ, cx = c.x ?? 500, cy = c.y ?? 500;
  ctx.setTransform(k, 0, 0, k, CX - cx * k + (c.sx || 0) * S, CY - cy * k + (c.sy || 0) * S);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (lk && b.stage !== false) stageBack(L);   // the default lit stage under a metaphor move (scene recipes paint their own set)
  if (!lk || b.stage !== false) dust(t);
  b.draw(L, b.dur);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  if (lk) post();
  if ((!VERT || typeof LAYOUT === 'undefined') && (!lk || window.PIPS)) pips(b.index);   // look.js films: no dots unless window.PIPS   // vertical Shorts: no progress dots (they sit in the bottom UI band)
  if (typeof LAYOUT !== 'undefined') {
    ctx.setTransform(1, 0, 0, 1, 0, 0); drawEnd();
    if (!VERT) { const hs = LAYOUT.filter((e) => e.kind === 'hero'), m = hs.length && hs.reduce((a, e) => (e.y1 - e.y0 > a.y1 - a.y0 ? e : a));   // 16:9 framing stats (tools/layout-check.mjs)
      if (m && !(END && TT >= END.t0)) QAS[Math.round(TT * 100) / 100] = { h: (Math.min(m.y1, H) - Math.max(m.y0, 0)) / H, edge: m.x0 <= 2 ? 'left' : m.x1 >= W - 2 ? 'right' : m.y0 <= 2 ? 'top' : '' }; }
    qaFrame();
  }
}

// labelV(str, t0, t1): the vertical label, screen space: Inter 800 caps >= 64 px, white on the black stage with a short
// accent bar, above the tracked hero's head (label band y 270-500, centred on x 513 inside x 108-918), complete from its
// first frame, reported to the layout QA (engine/safe.js). Call it after the figure is drawn.
function labelV(str, t0, t1, o = {}) {
  if (TT < t0 || TT >= t1) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  let sz = o.size ?? 80; const setf = () => { ctx.font = `800 ${sz}px ${FONT}`; ctx.letterSpacing = `${sz * 0.04}px`; }; setf();
  const words = String(str).split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width <= 760 || !cur) cur = t; else { lines.push(cur); cur = w; } } lines.push(cur);
  while (sz > 64 && Math.max(...lines.map((l) => ctx.measureText(l).width)) > 760) { sz -= 2; setf(); }
  const wmax = Math.max(...lines.map((l) => ctx.measureText(l).width)), lh = sz * 1.08, bh = lines.length * lh + 30;
  const cy = o.y ?? (typeof labelY === 'function' ? labelY(bh) : 390), cx = 513;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.color || PAL.white;
  lines.forEach((l, i) => ctx.fillText(l, cx + sz * 0.02, cy - bh / 2 + lh * (i + 0.5)));
  ctx.fillStyle = PAL.accent; ctx.fillRect(cx - 60, cy + bh / 2 - 12, 120, 9);
  ctx.restore();
  if (typeof LAYOUT !== 'undefined') LAYOUT.push({ kind: 'label', name: str, x0: cx - wmax / 2, y0: cy - bh / 2, x1: cx + wmax / 2, y1: cy + bh / 2 });
}

function mountFilm(total, id = 'main') {
  ctx = document.getElementById('c').getContext('2d');
  const root = document.getElementById('root'), want = root && parseFloat(root.getAttribute('data-duration'));
  if (want && Math.abs(want - _t) > 0.01) console.warn(`data-duration ${want} != sum of beats ${_t}`);
  Promise.all([document.fonts.load('500 40px Inter'), document.fonts.load('800 40px Inter')]).then(() => {
    const st = { t: 0 }, tl = gsap.timeline({ paused: true });
    tl.to(st, { t: total, duration: total, ease: 'none', onUpdate: () => renderFrame(st.t) });
    renderFrame(0);
    window.__timelines[id] = tl;                          // register only after the build (HyperFrames rule)
  });
}
