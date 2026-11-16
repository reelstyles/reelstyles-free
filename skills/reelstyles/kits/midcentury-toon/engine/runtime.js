// =====================================================================
//  engine/runtime.js: the film clock for the mid-century look inside a HyperFrames composition.
//  Classic script, every name is a global that engine/, characters/, sets/ and film.js use.
//  Load order in index.html: gsap → engine/runtime.js → engine/toon.js → engine/manual.js → characters/*.js → sets/sets.js → film.js.
//
//    shot(t0, t1, draw, title, cam)  register a shot; draw(G) reads TT (film seconds). cam(t) → [cx, cy, zoom, rot] = the
//                                    world point at frame centre. Shots must tile the film with no gap.
//    transition(tc, kind, o)         a transition at the cut tc: 'iris' (circle opens from o.at, ink ring), 'wipe' (colour block
//                                    from o.dir 'right'|'left'|'up'|'down', ink edge). The outgoing shot keeps running under it.
//    overlay(fn)                     screen-space layer drawn last (captions, bugs); fn(G, t)
//    mountFilm(duration)             waits for the fonts, then hands HyperFrames a paused GSAP timeline that paints the canvas
//                                    at every seek. Call it once, last, in film.js.
//  Deterministic: every frame is a pure function of t (seeded hashes only; no Math.random, Date or performance.now).
// =====================================================================
// frame size: 1920 x 1080 unless a page sets window.FRAME = { w, h } before this script (templates/vertical.html: 1080 x 1920)
const W = (window.FRAME && window.FRAME.w) || 1920, H = (window.FRAME && window.FRAME.h) || 1080, FPS = 30, TAU = Math.PI * 2;
const FAMS = { script: '"Oleo", "Brush Script MT", cursive', slab: '"Slab", "Rockwell", serif', sans: '"Jost", "Helvetica Neue", Arial, sans-serif' };
let G = null, TT = 0, ctx = null;   // ctx = G (engine/safe.js track() reads the global ctx)
const SERIF = FAMS.slab;            // engine/safe.js end card font

// ---- math
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const eo = (t) => 1 - Math.pow(1 - clamp(t), 3);
const ei = (t) => Math.pow(clamp(t), 3);
const eio = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };     // overshoot pop 0 → 1
const pop = (t, t0, d = 0.28, s = 1.9) => back(seg(t, t0, t0 + d), s);
// hold one drawing for two frames: poses, hand shapes and the cel jitter run at 12 fps; cameras and wipes at full rate
const twos = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;

// ---- shot + transition registry
const SHOTS = [], TRANS = [], OVER = [];
function shot(t0, t1, draw, title = '', cam = null) { SHOTS.push({ t0, t1, draw, title, cam }); }
function transition(tc, kind = 'iris', o = {}) { TRANS.push({ tc, kind, dur: o.dur ?? 0.5, at: o.at || [W / 2, H / 2], dir: o.dir || 'right', label: o.label ?? null, ...o }); }
function overlay(fn) { OVER.push(fn); }
const shotAt = (t) => SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];

function drawShot(s, t) {
  TT = t; setClock(t);
  G.save(); G.setTransform(1, 0, 0, 1, 0, 0);
  const c = s.cam ? s.cam(t) : null;
  if (typeof CAM !== 'undefined') CAM = c ? [c[0], c[1], c[2] ?? 1, c[3] ?? 0] : [W / 2, H / 2, 1, 0];   // engine/look.js depth()
  if (c) { G.translate(W / 2, H / 2); G.scale(c[2] ?? 1, c[2] ?? 1); if (c[3]) G.rotate(c[3]); G.translate(-c[0], -c[1]); }
  s.draw(G);
  G.restore();
}
// world → screen under a shot camera (for aiming an iris at an object)
function camToScreen(c, x, y) { const z = c[2] ?? 1, r = c[3] ?? 0, dx = x - c[0], dy = y - c[1]; return [W / 2 + z * (Math.cos(r) * dx - Math.sin(r) * dy), H / 2 + z * (Math.sin(r) * dx + Math.cos(r) * dy)]; }

function renderFrame(t) {
  if (typeof LAYOUT !== 'undefined') LAYOUT.length = 0;   // engine/safe.js: boxes of this frame
  if (typeof lookReset === 'function') lookReset();       // engine/look.js: lights of this frame
  G.setTransform(1, 0, 0, 1, 0, 0);
  G.fillStyle = PAL.paper; G.fillRect(0, 0, W, H);
  const tr = TRANS.find((x) => t >= x.tc - x.dur * 0.4 && t < x.tc + x.dur * 0.6);
  if (tr) {
    const k = eio(seg(t, tr.tc - tr.dur * 0.4, tr.tc + tr.dur * 0.6));
    const prev = shotAt(tr.tc - 1e-3), next = shotAt(tr.tc + 1e-3);
    drawShot(prev, t);
    G.save(); G.beginPath();
    let ring = null;
    if (tr.kind === 'iris') {
      const r = lerp(0, 1400, k * k), cx = lerp(tr.at[0], W / 2, k), cy = lerp(tr.at[1], H / 2, k);
      G.arc(cx, cy, Math.max(r, 0.01), 0, TAU); ring = ellipse(cx, cy, r, r, 96);
    } else {
      const d = tr.dir;
      if (d === 'right') G.rect(W * (1 - k), 0, W, H); else if (d === 'left') G.rect(0, 0, W * k, H);
      else if (d === 'up') G.rect(0, H * (1 - k), W, H); else G.rect(0, 0, W, H * k);
      ring = d === 'right' ? [[W * (1 - k), -10], [W * (1 - k), H + 10]] : d === 'left' ? [[W * k, -10], [W * k, H + 10]]
        : d === 'up' ? [[-10, H * (1 - k)], [W + 10, H * (1 - k)]] : [[-10, H * k], [W + 10, H * k]];
    }
    G.clip(); G.fillStyle = PAL.paper; G.fillRect(0, 0, W, H); drawShot(next, Math.max(t, tr.tc + 1e-3)); G.restore();
    setClock(t);
    if (k > 0.001 && k < 0.999) ink(G, ring, 8, { closed: tr.kind === 'iris', seed: 960 + Math.round(tr.tc * 10), breaks: 0.05 });
    if (tr.kind === 'iris' && tr.label != null && k < 0.55) {      // the numeral that is the door
      G.save(); G.globalAlpha = 1 - k / 0.55; G.translate(tr.at[0], tr.at[1]); G.scale(1 + k * 4, 1 + k * 4);
      text(G, String(tr.label), 0, 40, { font: `118px ${FAMS.slab}`, fill: PAL.ink, plate: PAL.white, off: [5, 5], align: 'center' }); G.restore();
    }
  } else {
    drawShot(shotAt(t), t);
  }
  G.setTransform(1, 0, 0, 1, 0, 0); TT = t; setClock(t);
  if (typeof lookFrame === 'function') lookFrame(G, t);   // engine/look.js: mood shade, light halos
  paperFinish(G, W, H, 1);
  OVER.forEach((f) => f(G, t));
  if (typeof LAYOUT !== 'undefined') { drawEnd(); qaFrame(); }   // engine/safe.js: end card + layout QA (after the overlays)
}

function mountFilm(duration, id = 'main') {
  G = ctx = document.getElementById('c').getContext('2d');
  SHOTS.sort((a, b) => a.t0 - b.t0);
  for (let i = 1; i < SHOTS.length; i++) if (Math.abs(SHOTS[i].t0 - SHOTS[i - 1].t1) > 1e-3) console.warn(`shot gap/overlap at ${SHOTS[i - 1].t1} → ${SHOTS[i].t0}`);
  const fonts = ['400 80px Oleo', '700 80px Oleo', '80px Slab', '400 40px Jost', '500 40px Jost', '600 40px Jost', '700 40px Jost'];
  Promise.all(fonts.map((f) => document.fonts.load(f))).then(() => {
    textures();
    const st = { t: 0 }, tl = gsap.timeline({ paused: true });
    tl.to(st, { t: duration, duration, ease: 'none', onUpdate: () => renderFrame(st.t) });
    renderFrame(0);
    window.__timelines[id] = tl;   // register only after the build (HyperFrames rule)
  });
}
