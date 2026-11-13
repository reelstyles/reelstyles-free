// =====================================================================
//  engine/runtime.js: frame clock + shot registry for the kinetic-type look. Classic script, every name is a global.
//  Load order: gsap → engine/runtime.js → (9:16: engine/safe.js) → engine/kinetic.js → (9:16: characters/cast.js) → film.js.
//    shot(t0, t1, draw, cam, theme)  draw(t) paints in world space; cam(t) → [cx, cy, zoom, rot]; theme = {base, blobs} or theme(t) → one
//  9:16: when engine/safe.js is loaded the frame also draws the queued labels (label()), the end card, and runs the layout QA (qaFrame).
//    trans(fn)                        screen-space overlay after every shot (wipes)
//    mountFilm(duration)              waits for fonts, then gives HyperFrames a paused GSAP timeline that paints at each seek
//  Vertical films set window.FRAME_W = 1080 / window.FRAME_H = 1920 before this script (default 1920x1080).
//  The frame is a pure function of t: no Math.random, no Date.
// =====================================================================
const W = window.FRAME_W || 1920, H = window.FRAME_H || 1080, TAU = Math.PI * 2, MIN_TEXT = 28;
let ctx = null, TT = 0;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const EZ = {
  o2: (t) => 1 - (1 - clamp(t)) ** 2, o3: (t) => 1 - (1 - clamp(t)) ** 3, o5: (t) => 1 - (1 - clamp(t)) ** 5,
  i3: (t) => clamp(t) ** 3,
  io: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; },
  back: (t) => { t = clamp(t) - 1; return 1 + 2.70158 * t * t * t + 1.70158 * t * t; },
};
// damped spring 0 → 1 with overshoot (landings, slams)
const spring = (t, k = 7, z = 0.35) => { t = Math.max(0, t); return t === 0 ? 0 : 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * t * 1.6); };
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const SHOTS = [], TRANS = [];
function shot(t0, t1, draw, cam = null, theme = null) { SHOTS.push({ t0, t1, draw, cam, theme }); }
function trans(fn) { TRANS.push(fn); }
const shotAt = (t) => SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];

function renderFrame(t) {
  TT = t; if (typeof LAYOUT !== 'undefined') LAYOUT.length = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const s = shotAt(t);
  drawStage(t, s ? (typeof s.theme === 'function' ? s.theme(t) : s.theme) : null);
  if (s) {
    ctx.save();
    const c = s.cam ? s.cam(t) : [W / 2, H / 2, 1, 0];
    ctx.translate(W / 2, H / 2); ctx.scale(c[2] ?? 1, c[2] ?? 1); if (c[3]) ctx.rotate(c[3]); ctx.translate(-c[0], -c[1]);
    s.draw(t);
    ctx.restore();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  TRANS.forEach((f) => f(t));
  drawLabels(t);
  drawProgress(t);
  if (typeof LAYOUT !== 'undefined') { drawEnd(); qaFrame(); }   // engine/safe.js: end card + layout QA (tools/layout-check.mjs)
}

let DURATION = 1;
function mountFilm(duration, id = 'main') {
  DURATION = duration;
  ctx = document.getElementById('c').getContext('2d');
  SHOTS.sort((a, b) => a.t0 - b.t0);
  for (let i = 1; i < SHOTS.length; i++) if (Math.abs(SHOTS[i].t0 - SHOTS[i - 1].t1) > 1e-3) console.warn(`shot gap/overlap at ${SHOTS[i - 1].t1} → ${SHOTS[i].t0}`);
  Promise.all([document.fonts.load('100px "Archivo Black"'), document.fonts.load('800 30px "Inter"')]).then(() => {
    const st = { t: 0 }, tl = gsap.timeline({ paused: true });
    tl.to(st, { t: duration, duration, ease: 'none', onUpdate: () => renderFrame(st.t) });
    renderFrame(0);
    window.__timelines[id] = tl;   // register only after the build (HyperFrames rule)
  });
}
