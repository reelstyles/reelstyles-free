// =====================================================================
//  engine/runtime.js: frame clock + maths for the chat-story look. Classic script, globals only.
//  Load order: gsap → runtime → look → sets/props → sets/scenes → chat → film.js.
//  mountFilm(duration, renderFn) waits for the fonts, then gives HyperFrames a paused GSAP timeline that
//  calls renderFn(t) at every seek. Every frame is a pure function of t: no Date, no Math.random.
// =====================================================================
const CV = document.getElementById('c');
const W = (CV && CV.width) || 1920, H = (CV && CV.height) || 1080, TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const EZ = {
  o2: (t) => 1 - (1 - clamp(t)) ** 2, o3: (t) => 1 - (1 - clamp(t)) ** 3, o4: (t) => 1 - (1 - clamp(t)) ** 4,
  io: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; },
};
// damped spring 0 → 1 (soft overshoot): messages, badges, card lines
const spring = (t, k = 7, z = 0.5) => { t = Math.max(0, t); return 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * t * 1.6); };
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// integer hash -> [0,1): the only source of randomness besides mulberry32 (never Math.random / Date)
function hash(a, b = 0, c = 0) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; h = Math.imul(h, 2246822519); h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
// piecewise-smooth keyframes: kf([[t0,v0],[t1,v1],...], t) -> eased value (vectors allowed)
function kf(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const u = ss((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])), a = keys[i - 1][1], b = keys[i][1];
    return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], u)) : lerp(a, b, u);
  }
  return keys[keys.length - 1][1];
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
let TT = 0;   // the current film time (read by FFQA for tools/layout-check.mjs)

function mountFilm(duration, renderFn, prep, id = 'main') {
  const ctx = CV.getContext('2d');
  const fonts = ['500', '800', '900'].map((w) => document.fonts.load(`${w} 40px "Inter"`));
  Promise.all(fonts).then(() => {
    if (prep) prep(ctx);   // layout that measures text must wait for the fonts
    const st = { t: 0 }, tl = gsap.timeline({ paused: true });
    tl.to(st, { t: duration, duration, ease: 'none', onUpdate: () => { TT = st.t; renderFn(ctx, st.t); } });
    renderFn(ctx, 0);
    window.__timelines[id] = tl;   // register only after the build (HyperFrames rule)
  });
}
