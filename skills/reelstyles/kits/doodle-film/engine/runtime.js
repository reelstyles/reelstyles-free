// =====================================================================
//  engine/runtime.js: the frame clock of the doodle film. Classic script (no modules), every name is a global.
//  Load order in index.html: gsap → engine/runtime.js → engine/doodle.js → characters/pip.js → sets/sets.js → film.js.
//
//    shot(t0, t1, draw, title, cam)   register a shot; draw() reads TT (film seconds). cam(t) → [cx, cy, zoom, rot]
//                                     = the world point at frame centre. Shots must tile the film with no gap.
//    trans(fn)                        screen-space overlay drawn after every shot (scribble wipes)
//    mountFilm(duration)              waits for the font, then gives HyperFrames a paused GSAP timeline that paints the
//                                     canvas at every seek. Call it once, last, in film.js.
//  Every frame is a pure function of TT: seeded noise only, never Math.random / Date / performance.now.
// =====================================================================
const _C = document.getElementById('c');            // frame size = canvas size: 1920x1080 (index.html) or 1080x1920 (vertical.html)
const W = (_C && _C.width) || 1920, H = (_C && _C.height) || 1080, FPS = 30, TAU = Math.PI * 2;
const HAND = '"Caveat", "Comic Sans MS", cursive';
const MIN_TEXT = 34;               // smallest on-screen text size in px at 1080p (the QA floor is 28)
let ctx = null, TT = 0, CAM = [W / 2, H / 2, 1, 0];

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const EZ = {
  o2: (t) => 1 - (1 - clamp(t)) ** 2, o3: (t) => 1 - (1 - clamp(t)) ** 3, i2: (t) => clamp(t) ** 2,
  io: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; },
  back: (t) => { t = clamp(t) - 1; return 1 + 2.70158 * t * t * t + 1.70158 * t * t; },
};
// damped spring 0 → 1 with overshoot: landings, head turns, pops
const spring = (t, k = 7, z = 0.35) => { t = Math.max(0, t); return 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * t * 1.6); };
// hash + smooth value noise: the only source of randomness
const hash = (n) => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const nz = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };

const SHOTS = [], TRANS = [], QUEUE = [];
function shot(t0, t1, draw, title = '', cam = null) { SHOTS.push({ t0, t1, draw, title, cam }); }
function trans(fn) { TRANS.push(fn); }
const shotAt = (t) => SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];

function renderFrame(t) {
  TT = t; QUEUE.length = 0; if (typeof LAYOUT !== 'undefined') LAYOUT.length = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  paperBG();
  const s = shotAt(t);
  if (s) {
    const c = s.cam ? s.cam(t) : [W / 2, H / 2, 1, 0];
    CAM = [c[0], c[1], c[2] ?? 1, c[3] ?? 0];
    ctx.translate(W / 2, H / 2); ctx.scale(CAM[2], CAM[2]); if (CAM[3]) ctx.rotate(CAM[3]); ctx.translate(-CAM[0], -CAM[1]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    s.draw(t);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  paperFX();
  flushText();
  TRANS.forEach((f) => f());
  if (typeof LAYOUT !== 'undefined') { drawEnd(); qaFrame(); }   // engine/safe.js: end card + layout QA
}

function mountFilm(duration, id = 'main') {
  ctx = document.getElementById('c').getContext('2d');
  SHOTS.sort((a, b) => a.t0 - b.t0);
  for (let i = 1; i < SHOTS.length; i++) if (Math.abs(SHOTS[i].t0 - SHOTS[i - 1].t1) > 1e-3) console.warn(`shot gap/overlap at ${SHOTS[i - 1].t1} → ${SHOTS[i].t0}`);
  document.fonts.load('100px "Caveat"').then(() => {
    const st = { t: 0 }, tl = gsap.timeline({ paused: true });
    tl.to(st, { t: duration, duration, ease: 'none', onUpdate: () => renderFrame(st.t) });
    renderFrame(0);
    window.__timelines[id] = tl;   // register only after the build (HyperFrames rule)
  });
}
