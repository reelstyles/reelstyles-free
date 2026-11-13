// =====================================================================
//  engine/runtime.js: frame clock + drawing helpers for the guessing-quiz look.
//  Classic script. Load order: gsap → engine/runtime.js → (9:16: engine/safe.js) → sets/items.js → sets/stage.js → (9:16: characters/cast.js) → film.js.
//  9:16: with engine/safe.js loaded every frame clears the layout boxes, draws the end card and runs the layout QA (qaFrame).
//  The text option for letter spacing is `ls` (safe.js owns the global track()).
//  Every frame is a pure function of film time t (no Math.random / Date).
//
//  Coordinates are plain pixels on a 1080p basis: 1920 x 1080 (16:9) or 1080 x 1920 (9:16). `VERT` tells which.
//    beat(dur, draw, opts)   register a beat; draw(L, dur) reads local time L (s). opts: { cam(L,d) → {z,x,y} }
//    mountFilm(total)        waits for the font, paints the canvas on every seek. Call once, last, in film.js.
//    text(str, x, y, opts)   the ONLY way to put text on screen: min 30 px, wraps + shrinks to maxW, clamped inside the frame;
//                            opts.label = 'name' reports its screen box to the 9:16 guard as a label (x 108-918, never on the hero)
//    EZ / spring / seg / wob eases + idle wobble;  rng(seed) seeded random;  alpha(a) global-alpha helper
// =====================================================================
const _cv = document.getElementById('c');
const W = _cv.width, H = _cv.height, FPS = 30, TAU = Math.PI * 2;
const VERT = H > W;
const HAND = 'Inter';                                   // the font engine/safe.js draws the end card with
const MIN_PX = 30;                                        // smallest allowed text size in px (rule: >= 28 at 1080p)
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
let ctx = null, TT = 0, GA = 1;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const EZ = {
  o2: (t) => 1 - (1 - clamp(t)) ** 2, o3: (t) => 1 - (1 - clamp(t)) ** 3, o4: (t) => 1 - (1 - clamp(t)) ** 4,
  i2: (t) => clamp(t) ** 2, i3: (t) => clamp(t) ** 3,
  io: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; },
  back: (t) => { t = clamp(t) - 1; return 1 + 2.70158 * t * t * t + 1.70158 * t * t; },
};
// damped spring 0 → 1 with overshoot (pops, name reveal)
const spring = (t, k = 8, z = 0.32) => { t = Math.max(0, t); return 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * t * 1.6); };
const wob = (L, seed = 0, amp = 1, f = 1) => amp * Math.sin(L * TAU * 0.37 * f + seed * 2.1) * 0.6 + amp * Math.sin(L * TAU * 0.91 * f + seed * 4.7) * 0.4;
function rng(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const alpha = (a = 1) => { ctx.globalAlpha = clamp(a * GA); };

// ---- text: chunky rounded look = Inter 900 + a same-colour round-join stroke, soft drop shadow, never clipped
function text(str, x, y, o = {}) {
  const { size = 60, weight = 900, color = '#FFFFFF', maxW = W - 160, a = 1, lh = 1.08, ls = 0.02, scale = 1, rot = 0, shadow = true, align = 'center', label = '' } = o;
  let sz = Math.max(size, MIN_PX);
  ctx.save(); alpha(a);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const setf = () => { ctx.font = `${weight} ${sz}px ${FONT}`; ctx.letterSpacing = `${sz * ls}px`; };
  setf();
  const words = String(str).split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
  lines.push(cur);
  let wmax = Math.max(...lines.map((l) => ctx.measureText(l).width));
  if (wmax > maxW && sz > MIN_PX) { sz = Math.max(MIN_PX, sz * (maxW / wmax)); setf(); wmax = Math.max(...lines.map((l) => ctx.measureText(l).width)); }
  const half = (wmax * scale) / 2 + 20;
  const cx = align === 'left' ? Math.max(40 + half, x + half) : clamp(x, half + 24, W - half - 24);   // keep the box inside the frame
  ctx.translate(cx, y); ctx.rotate(rot); ctx.scale(scale, scale);
  if (shadow) { ctx.shadowColor = 'rgba(20,10,60,0.38)'; ctx.shadowBlur = sz * 0.28; ctx.shadowOffsetY = sz * 0.1; }
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = sz * 0.07;
  const y0 = -((lines.length - 1) * sz * lh) / 2;
  lines.forEach((l, i) => { const w = ctx.measureText(l).width; ctx.strokeText(l, -w / 2, y0 + i * sz * lh); ctx.fillText(l, -w / 2, y0 + i * sz * lh); });
  if (label && typeof track === 'function') { ctx.shadowColor = 'transparent'; const hw = wmax / 2 + sz * 0.05, hh = (lines.length * sz * lh) / 2; track('label', -hw, y0 - sz * lh / 2, hw, y0 - sz * lh / 2 + hh * 2, label); }
  ctx.restore();
  return { w: wmax * scale, h: lines.length * sz * lh * scale, size: sz };
}

// ---- beat registry
const BEATS = [];
let _t = 0;
function beat(dur, draw, opts = {}) { BEATS.push({ t0: _t, t1: _t + dur, dur, draw, index: BEATS.length, ...opts }); _t += dur; return BEATS[BEATS.length - 1]; }
const beatAt = (t) => BEATS.find((b) => t >= b.t0 && t < b.t1) || BEATS[BEATS.length - 1];

function renderFrame(t) {
  TT = t; GA = 1; if (typeof LAYOUT !== 'undefined') LAYOUT.length = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const b = beatAt(t), L = t - b.t0;
  const c = b.cam ? b.cam(L, b.dur) : { z: VERT ? 1 : 1 + 0.04 * (L / b.dur) };   // 9:16: the stage pushes the item itself, labels stay put
  const z = c.z || 1, cx = c.x ?? W / 2, cy = c.y ?? H / 2;
  ctx.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  b.draw(L, b.dur, b);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  if (typeof LAYOUT !== 'undefined') { drawEnd(); qaFrame(); }   // engine/safe.js: end card + layout QA (tools/layout-check.mjs)
}

function mountFilm(total, id = 'main') {
  ctx = document.getElementById('c').getContext('2d');
  const root = document.getElementById('root'), want = root && parseFloat(root.getAttribute('data-duration'));
  if (want && Math.abs(want - _t) > 0.01) console.warn(`data-duration ${want} != sum of beats ${_t}`);
  Promise.all([document.fonts.load('800 40px Inter'), document.fonts.load('900 40px Inter')]).then(() => {
    const st = { t: 0 }, tl = gsap.timeline({ paused: true });
    tl.to(st, { t: total, duration: total, ease: 'none', onUpdate: () => renderFrame(st.t) });
    renderFrame(0);
    window.__timelines[id] = tl;                          // register only after the build (HyperFrames rule)
  });
}
