// =====================================================================
//  engine/runtime.js: frame clock + math for the Pop comic panels look.
//  Classic script. Load order: gsap -> runtime.js -> comic.js -> characters/*.js -> sets/*.js -> film.js.
//  Every frame is a pure function of film time t (seconds): seeded hash only, no Math.random / Date.
//    mountFilm(duration, frameFn)   waits for the font, then hands HyperFrames a paused GSAP timeline that calls renderFrame(t)
//    renderFrame(t)                 frameFn(t), then (vertical, engine/safe.js loaded) the end card + layout QA (tools/layout-check.mjs calls it)
// =====================================================================
const _cv = document.getElementById('c');
const W = (_cv && _cv.width) || 1920, H = (_cv && _cv.height) || 1080, FPS = 30, TAU = Math.PI * 2;
let G = null;   // the 2D context
let ctx = null, TT = 0;   // engine/safe.js (vertical guard) reads ctx (= G) and TT (film seconds)
const HAND = '"Bangers", "Impact", sans-serif';   // engine/safe.js end-card font

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const EZ = {
  o2: (t) => 1 - (1 - clamp(t)) ** 2, o3: (t) => 1 - (1 - clamp(t)) ** 3, o4: (t) => 1 - (1 - clamp(t)) ** 4,
  i2: (t) => clamp(t) ** 2,
  io: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; },
  back: (t) => { t = clamp(t) - 1; return 1 + 2.70158 * t * t * t + 1.70158 * t * t; },
};
// damped spring 0 -> 1 with overshoot: pops, balloons, bursts
const spring = (t, k = 7, z = 0.35) => { t = Math.max(0, t); return 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * t * 1.6); };
// deterministic noise in 0..1 from any number
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// time stepped on twos (12 fps) for limited animation; the camera and dots still move every frame
const q12 = (t) => Math.floor(t * 12 + 1e-6) / 12;

let FRAME = null;
function renderFrame(t) {
  TT = t; if (typeof LAYOUT !== 'undefined') LAYOUT.length = 0;
  FRAME(t);
  if (typeof LAYOUT !== 'undefined') { G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'source-over'; drawEnd(); qaFrame(); }   // engine/safe.js: end card + layout QA
}
function mountFilm(duration, frameFn, id = 'main') {
  G = ctx = document.getElementById('c').getContext('2d'); FRAME = frameFn;
  document.fonts.load('40px "Bangers"').then(() => {
    const st = { t: 0 }, tl = gsap.timeline({ paused: true });
    tl.to(st, { t: duration, duration, ease: 'none', onUpdate: () => renderFrame(st.t) });
    renderFrame(0);
    window.__timelines[id] = tl;   // register only after the build (HyperFrames rule)
  });
}
