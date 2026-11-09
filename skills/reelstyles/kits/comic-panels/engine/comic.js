// =====================================================================
//  engine/comic.js: the print simulation. Scenes never fill pixels; they queue SHAPES, and flush() prints them like a four-ink press:
//    1. knock-out: the shape's footprint is cleared to newsprint (so later shapes hide earlier ones, painter's order)
//    2. colour layers [ink, tone]: tone 1 = solid ink, below 1 = Ben-Day dots (halftone screen at that ink's angle), each ink
//       printed with its own tiny misregistration offset, multiplied onto the paper (so yellow+magenta really make red)
//    3. ink outline in black, thick, on top
//  Ink lines "boil": every group of shapes gets a new 1-2 px wobble 8 times a second. Text is queued the same way.
//  Everything is a pure function of t.
// =====================================================================
const INK = { c: '#00ADEF', m: '#EC0A8C', y: '#FFE600', k: '#15110E' };
const PAPER = '#EDE0BE';
const RED = '#E8261C';                       // m + y overprint, for lettering
const REG = { c: [5, -4], m: [-4, 4], y: [4, 5], k: [0, 0] };          // misregistration, world px
const SCREEN = { c: 15, m: 75, y: 0, k: 45 };                          // halftone screen angles (degrees)
const DOT = H > W ? 12 : 9;                                            // dot pitch in world px (vertical: 12, Ben-Day dots that read on a phone)
// ready-made colour recipes: [ink, tone] pairs. Mix your own.
const L = {
  night: [['c', 1], ['m', 0.7], ['k', 0.4]], navy: [['c', 1], ['m', 0.75]], deep: [['c', 1], ['m', 0.9], ['k', 0.7]], blue: [['c', 1], ['m', 0.45]], cyan: [['c', 1]],
  sky: [['c', 0.6]], skin: [['y', 1], ['m', 0.3]], skinSh: [['y', 1], ['m', 0.55]], red: [['m', 1], ['y', 1]], yellow: [['y', 1]],
  orange: [['m', 0.5], ['y', 1]], pink: [['m', 0.6]], purple: [['c', 0.7], ['m', 1]], dusk: [['c', 0.5], ['m', 0.6], ['k', 0.2]],
  steel: [['c', 0.4], ['k', 0.3]], steelD: [['c', 0.55], ['k', 0.6]], black: [['k', 1]], grey: [['k', 0.3]], white: [], green: [['c', 1], ['y', 1]],
};

// ---------- dot screens
const _pat = {};
function dotPat(ink, tone) {
  const q = Math.max(1, Math.round(tone * 20)), key = ink + q;
  if (_pat[key]) return _pat[key];
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'); g.fillStyle = INK[ink];
  const r = S * Math.sqrt((q / 20) / (2 * Math.PI));                 // two dots per tile
  for (const [x, y] of [[S / 2, S / 2], [0, 0], [S, 0], [0, S], [S, S]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  return (_pat[key] = G.createPattern(cv, 'repeat'));
}
function setScreen(pat, ink) { pat.setTransform(new DOMMatrix().rotate(SCREEN[ink]).scale(DOT / 64)); }

// ---------- shape queue
const K = { cmds: [], m: new DOMMatrix(), st: [], jit: [0, 0], t: 0, safe: null };
function kBegin(ox, oy, t) { K.cmds.length = 0; K.m = new DOMMatrix().translate(ox, oy); K.st.length = 0; K.t = t; K.jit = [0, 0]; }
const kPush = () => K.st.push([K.m, K.jit]);
const kPop = () => { [K.m, K.jit] = K.st.pop(); };
const kTr = (x, y, rot = 0, sx = 1, sy = sx) => { K.m = K.m.translate(x, y).rotate(rot).scale(sx, sy); };
// ink boil: one wobble per group id, new every 1/8 s
function grp(id) { const f = Math.floor(K.t * 8 + 1e-6); K.jit = [(hash(id * 13.7 + f * 1.9) - 0.5) * 2.6, (hash(id * 7.3 + f * 3.1) - 0.5) * 2.6]; }
// shape(build, layers, ink = outline width, opts {fill:false => no knock-out (overprint only)})
function shape(build, layers = [], ink = 0, o = {}) {
  const p = new Path2D(); build(p);
  const q = new Path2D(); q.addPath(p, new DOMMatrix().translate(K.jit[0], K.jit[1]).multiply(K.m));
  const sc = Math.hypot(K.m.a, K.m.b);                                 // outlines shrink with the art, a little slower than it
  K.cmds.push({ p: q, layers, ink: ink * Math.pow(sc, 0.7), fill: o.fill !== false, cap: o.cap });
}
const poly = (pts, close = true) => (p) => { p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); if (close) p.closePath(); };
const blob = (pts) => (p) => {
  const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = mid(pts[n - 1], pts[0]); p.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  p.closePath();
};
const ell = (x, y, rx, ry = rx) => (p) => { p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };
const rect = (x, y, w, h) => (p) => p.rect(x, y, w, h);
const rrect = (x, y, w, h, r) => (p) => p.roundRect(x, y, w, h, r);

// ---------- text (queued so it layers with shapes). Never smaller than MIN_TEXT world px (= px at 1080p when the camera is at 1x or closer).
const MIN_TEXT = H > W ? 64 : 28;   // vertical: 64 px floor (phone)
function fontOf(size) { return `${size}px "Bangers", "Impact", sans-serif`; }
// wrap + shrink to a box; returns {lines, size, w, h, lh}; never below MIN_TEXT (then it widens the box instead of clipping)
function fitText(s, maxW, size, maxLines = 3, ls = 1) {
  G.save(); G.letterSpacing = ls + 'px';
  let sz = Math.max(size, MIN_TEXT), out;
  for (;;) {
    G.font = fontOf(sz);
    const words = s.toUpperCase().split(/\s+/), lines = []; let cur = '';
    for (const w of words) { const tryS = cur ? cur + ' ' + w : w; if (cur && G.measureText(tryS).width > maxW) { lines.push(cur); cur = w; } else cur = tryS; }
    if (cur) lines.push(cur);
    const w = Math.max(...lines.map((l) => G.measureText(l).width));
    out = { lines, size: sz, w, h: lines.length * sz * 1.04, lh: sz * 1.04 };
    if ((lines.length <= maxLines && w <= maxW) || sz <= MIN_TEXT) break;
    sz -= 2;
  }
  G.restore(); return out;
}
// txt: queue lines centred (or left) at local (x, y) = middle of the block
function txt(f, x, y, o = {}) {
  K.cmds.push({ text: true, f, x, y, m: new DOMMatrix().translate(K.jit[0], K.jit[1]).multiply(K.m), fill: o.fill || INK.k, stroke: o.stroke || null, sw: o.sw || 0, ext: o.ext || null, extCol: o.extCol || INK.k, align: o.align || 'center', ls: o.ls == null ? 1 : o.ls });
}
function drawText(c, B, d) {
  c.save(); c.setTransform(B.multiply(d.m)); c.globalCompositeOperation = 'source-over';
  c.font = fontOf(d.f.size); c.textBaseline = 'middle'; c.textAlign = d.align; c.letterSpacing = d.ls + 'px'; c.lineJoin = 'round'; c.miterLimit = 2;
  const y0 = d.y - (d.f.lines.length - 1) * d.f.lh / 2;
  d.f.lines.forEach((ln, i) => {
    const y = y0 + i * d.f.lh;
    if (d.ext) { c.fillStyle = d.extCol; for (let k = 1; k <= 6; k++) c.fillText(ln, d.x + d.ext[0] * k / 6, y + d.ext[1] * k / 6); }
    if (d.stroke) { c.lineWidth = d.sw; c.strokeStyle = d.stroke; c.strokeText(ln, d.x, y); }
    c.fillStyle = d.fill; c.fillText(ln, d.x, y);
  });
  c.restore();
}

// track(kind, local box) for engine/safe.js from inside a queued shape group: the canvas transform x the queue matrix (no-op in 16:9)
function kTrack(kind, x0, y0, x1, y1, name = '') {
  if (typeof track !== 'function') return;
  G.save(); G.setTransform(G.getTransform().multiply(K.m)); track(kind, x0, y0, x1, y1, name); G.restore();
}

// ---------- print the queue
function flush(c, t) {
  const B = c.getTransform(), f12 = Math.floor(t * 12 + 1e-6);
  for (const d of K.cmds) {
    if (d.text) { drawText(c, B, d); continue; }
    if (d.fill) { c.globalCompositeOperation = 'source-over'; c.fillStyle = PAPER; c.fill(d.p); }
    for (const [ink, tone] of d.layers) {
      c.save();
      const o = REG[ink], j = ink.charCodeAt(0);
      c.translate(o[0] + (hash(f12 * 3 + j) - 0.5) * 1.6, o[1] + (hash(f12 * 5 + j) - 0.5) * 1.6);
      c.globalCompositeOperation = 'multiply';
      if (tone >= 0.96) c.fillStyle = INK[ink]; else { const pt = dotPat(ink, tone); setScreen(pt, ink); c.fillStyle = pt; }
      c.fill(d.p); c.restore();
    }
    if (d.ink) { c.globalCompositeOperation = 'source-over'; c.strokeStyle = INK.k; c.lineWidth = d.ink; c.lineJoin = 'round'; c.lineCap = d.cap || 'round'; c.stroke(d.p); }
  }
  c.globalCompositeOperation = 'source-over';
}

// ---------- comic furniture
// speech balloon that pops in. o: {s, x, y (centre, local), size, tail:[tx,ty] | null, t0 (local time it starts), lt, maxW, shout}
function balloon(o) {
  const lt = o.lt - o.t0; if (lt < 0) return;
  const f = fitText(o.s, o.maxW || 330, o.size || 34, 3), pop = spring(lt / 0.5, 7, 0.4);
  const rx = f.w / 2 * 1.32 + 22, ry = f.h / 2 * 1.32 + 16;
  let { x, y } = o; const S = K.safe;
  if (S) { x = clamp(x, S.x0 + rx + 6, S.x1 - rx - 6); y = clamp(y, S.y0 + ry + 6, S.y1 - ry - 6); }
  const wob = Math.sin(q12(K.t) * 5 + o.x) * 0.5;                   // idle: the balloon breathes on twos
  kPush(); kTr(x, y, wob, pop * (1 + 0.012 * Math.sin(K.t * 5)));
  grp(900 + (o.id || 0));
  if (o.shout) {
    const n = 18, pts = []; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, r = i % 2 ? 0.86 : 1.06; pts.push([Math.cos(a) * rx * r, Math.sin(a) * ry * r]); }
    shape(poly(pts), L.white, 7);
  } else {
    shape(ell(0, 0, rx, ry), L.white, 7);
    if (o.tail) {
      const tx = o.tail[0] - x, ty = o.tail[1] - y, a = Math.atan2(ty / ry, tx / rx), da = 0.26;
      const b1 = [Math.cos(a - da) * rx * 0.96, Math.sin(a - da) * ry * 0.96], b2 = [Math.cos(a + da) * rx * 0.96, Math.sin(a + da) * ry * 0.96];
      const tip = [Math.cos(a) * rx + (tx - Math.cos(a) * rx) * 0.8, Math.sin(a) * ry + (ty - Math.sin(a) * ry) * 0.8];
      shape(poly([b1, tip, b2, [0, 0]]), L.white, 0);
      shape(poly([b1, tip, b2], false), [], 7, { fill: false });
    }
  }
  txt(f, 0, 2, { ls: 1.2 });
  kPop();
}
// yellow narration box. o: {s, x, y (top-left, local), size, t0, lt, maxW}
function caption(o) {
  const lt = o.lt - o.t0; if (lt < 0) return;
  const f = fitText(o.s, o.maxW || 360, o.size || 30, 3, 1.5), w = f.w + 34, h = f.h + 22, u = EZ.o3(lt / 0.28);
  let { x, y } = o; const S = K.safe;
  if (S) { x = clamp(x, S.x0 + 6, S.x1 - w - 6); y = clamp(y, S.y0 + 6, S.y1 - h - 6); }
  kPush(); kTr(x, y, 0); grp(950 + (o.id || 0));
  kTr(0, 0, 0, u, 1);                                                // slides open from its left edge
  shape(rect(0, 0, w, h), L.yellow, 6);
  if (u > 0.9) txt(f, w / 2, h / 2 + 2, { ls: 1.5, align: 'center' });
  kPop();
}
// star-burst with sound-effect lettering. o: {s, x, y, r, n, seed, t0, lt, rot, size}
function burst(o) {
  const lt = o.lt - o.t0; if (lt < 0) return;
  const pop = spring(lt / 0.45, 8, 0.32) * (1 + 0.03 * Math.sin(lt * 14)), n = o.n || 14, r = o.r || 150;
  const spikes = (R, seed, k) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, rr = i % 2 ? R * k : R * (0.9 + 0.2 * hash(seed + i * 1.7)); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return pts; };
  kPush(); kTr(o.x, o.y, (o.rot || -6) + Math.sin(K.t * 9) * 0.8, pop); grp(980 + (o.seed || 0));
  shape(poly(spikes(r, o.seed || 1, 0.62)), [['y', 1], ['m', 0.45]], 9);
  shape(poly(spikes(r * 0.74, (o.seed || 1) + 40, 0.7)), L.yellow, 6);
  const f = fitText(o.s, r * 1.15, o.size || 96, 2, 3);
  txt(f, 0, 0, { fill: RED, stroke: INK.k, sw: 14, ext: [7, 9], ls: 3 });
  kPop();
}
// speed lines: tapered black (or paper-coloured) wedges around a focus. o: {x, y, r0, r1, n, seed, w, paper, a0, span}
function speedLines(o) {
  const f = Math.floor(K.t * 12 + 1e-6), a0 = (o.a0 || 0) + hash(f * 0.7 + (o.seed || 0)) * 0.05, span = o.span || TAU, n = o.n || 36;
  const p = new Path2D();
  for (let i = 0; i < n; i++) {
    const a = a0 + i * span / n + (hash((o.seed || 0) + i) - 0.5) * span / n * 0.7;
    const r1 = o.r0 + (o.r1 - o.r0) * (0.45 + 0.55 * hash((o.seed || 0) + i * 3.1 + f * 0.37)), r0 = o.r0 * (0.9 + 0.3 * hash(i + 9.1));
    const w = (o.w || 12) * (0.4 + 0.6 * hash(i * 1.3 + (o.seed || 0)));
    const nx = -Math.sin(a), ny = Math.cos(a);
    p.moveTo(o.x + Math.cos(a) * r0, o.y + Math.sin(a) * r0);
    p.lineTo(o.x + Math.cos(a) * r1 + nx * w / 2, o.y + Math.sin(a) * r1 + ny * w / 2);
    p.lineTo(o.x + Math.cos(a) * r1 - nx * w / 2, o.y + Math.sin(a) * r1 - ny * w / 2); p.closePath();
  }
  shape((q) => q.addPath(p), o.paper ? [] : L.black, 0);
}
// parallel speed lines (motion across the panel). o: {x, y, w, h, dir: 1 right / -1 left, n, seed, paper}
function streaks(o) {
  const f = Math.floor(K.t * 12 + 1e-6), p = new Path2D(), n = o.n || 14;
  for (let i = 0; i < n; i++) {
    const yy = o.y + (i + hash((o.seed || 0) + i)) * o.h / n, len = o.w * (0.3 + 0.7 * hash(i * 2.1 + f * 0.31 + (o.seed || 0))), x0 = o.x + (o.dir > 0 ? 0 : o.w - len) + (hash(i + f * 0.2) - 0.5) * 30, th = 2 + 5 * hash(i * 4.4 + (o.seed || 0));
    p.moveTo(x0, yy); p.lineTo(x0 + len, yy - th / 2); p.lineTo(x0 + len, yy + th / 2); p.closePath();
  }
  shape((q) => q.addPath(p), o.paper ? [] : L.black, 0);
}
// sunburst: alternate rays out of a point, drawn as overprint dots only (no knock-out)
function sunburst(x, y, R, rays, layers, rot = 0, ko = false) {
  const p = new Path2D();
  for (let i = 0; i < rays; i += 1) { const a0 = rot + i * TAU / rays, a1 = a0 + TAU / rays / 2; p.moveTo(x, y); p.lineTo(x + Math.cos(a0) * R, y + Math.sin(a0) * R); p.lineTo(x + Math.cos(a1) * R, y + Math.sin(a1) * R); p.closePath(); }
  shape((q) => q.addPath(p), layers, 0, { fill: ko });
}

// ---------- paper: dust/grain tiles (screen space, swap 8 times a second) and an aged-edge vignette
const _grain = [];
function grainTiles() {
  if (_grain.length) return _grain;
  for (let v = 0; v < 3; v++) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const g = cv.getContext('2d');
    for (let i = 0; i < 900; i++) { const x = hash(i * 1.7 + v * 100) * 512, y = hash(i * 2.9 + v * 100 + 5) * 512, r = 0.6 + hash(i + v) * 1.4; g.fillStyle = hash(i * 3.3 + v) > 0.5 ? 'rgba(70,45,20,' + (0.08 + hash(i) * 0.16) + ')' : 'rgba(255,250,235,' + (0.1 + hash(i) * 0.2) + ')'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    for (let i = 0; i < 60; i++) { g.strokeStyle = 'rgba(90,60,30,0.07)'; g.lineWidth = 1; g.beginPath(); const x = hash(i * 5.1 + v * 7) * 512, y = hash(i * 6.3 + v * 9) * 512; g.moveTo(x, y); g.quadraticCurveTo(x + 14, y + 6 * (hash(i) - 0.5), x + 28 * (hash(i + 3) - 0.5), y + 22); g.stroke(); }
    _grain.push(G.createPattern(cv, 'repeat'));
  }
  return _grain;
}
function paperPost(c, t) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over'; c.fillStyle = grainTiles()[Math.floor(t * 8) % 3]; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'multiply';
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(160,125,70,0.32)');
  c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
}

// ---------- vertical label (engine/safe.js): queue it in SCREEN space after the scene (identity transform, kBegin(0, 0, t)).
// A yellow caption box ('cap'), a speech balloon ('say', tail to the speaker) or a shout ('shout'), centred in x 108-918, lettering
// >= 64 px, complete from its first frame (a small pop, no typing in), y = labelY() above the tracked hero's head unless o.y.
// o: {s, t0, t1, t, kind, tail: [x, y] screen, size, y, id}
function vlabel(o) {
  if (o.t < o.t0 || o.t >= o.t1) return;
  const lt = o.t - o.t0, cap = (o.kind || 'cap') === 'cap', sz = Math.max(MIN_TEXT, o.size || 76), cx = (VSAFE.lx0 + VSAFE.lx1) / 2;
  const f = fitText(o.s, cap ? 740 : 540, sz, cap ? 3 : 2, 1.5);
  const w = cap ? f.w + 48 : Math.min(800, f.w * 1.22 + 70), h = cap ? f.h + 34 : f.h * 1.3 + 64;
  const y = o.y ?? labelY(h), pop = 1 + 0.06 * Math.max(0, 1 - lt / 0.2) * Math.sin(lt * 40);
  LAYOUT.push({ kind: 'label', name: o.s, x0: cx - w / 2, y0: y - h / 2, x1: cx + w / 2, y1: y + h / 2 });
  kPush(); kTr(cx, y, 0, pop); grp(960 + (o.id || 0));
  if (cap) { shape(rect(-w / 2, -h / 2, w, h), L.yellow, 8); txt(f, 0, 3, { ls: 1.5 }); kPop(); return; }
  const rx = w / 2, ry = h / 2;
  if (o.kind === 'shout') {
    const n = 16, pts = []; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, r = i % 2 ? 0.88 : 1.0; pts.push([Math.cos(a) * rx * r, Math.sin(a) * ry * r]); }
    shape(poly(pts), L.white, 8);
  } else {
    if (o.tail) {   // wedge from the balloon's underside towards the speaker, stopping short of him
      const tx = o.tail[0] - cx, ty = o.tail[1] - y, a = Math.atan2(ty / ry, tx / rx), da = 0.2;
      const b1 = [Math.cos(a - da) * rx * 0.9, Math.sin(a - da) * ry * 0.9], b2 = [Math.cos(a + da) * rx * 0.9, Math.sin(a + da) * ry * 0.9];
      const tip = [Math.cos(a) * rx + (tx - Math.cos(a) * rx) * 0.55, Math.sin(a) * ry + (ty - Math.sin(a) * ry) * 0.55];
      shape(poly([b1, tip, b2]), L.white, 8);
    }
    shape(ell(0, 0, rx, ry), L.white, 8);
    if (o.tail) { const tx = o.tail[0] - cx, ty = o.tail[1] - y, a = Math.atan2(ty / ry, tx / rx); shape(ell(Math.cos(a) * rx * 0.86, Math.sin(a) * ry * 0.86, 30, 22), L.white, 0); }
  }
  txt(f, 0, 3, { ls: 1.5 });
  kPop();
}
