// =====================================================================
//  engine/look.js: the film look of the whiteboard (load right after engine/wb.js). Still a dry-erase board drawn in marker:
//  this file adds what makes it read as a film, not a blank board (owner 11-12, sample judged 4/10 "mostly empty white").
//
//    grade([[t, mood]...])          the board's colour + light per mood, blended between keys: day · warm · cold · night · tense · gold
//    light({x, y, col, r, kind})    ONE light source per scene (world px): a glow on the board, shade away from it, a rim on Max
//    anchor(x, y)                   the scene centre for the depth layers below (the scene recipes in sets/sets.js set it)
//    draw/write/wash(..., {layer})  'far' (parallax 0.55, the back wall / horizon) · 'mid' (default, the subject) · 'near'
//                                   (parallax 1.45, drawn IN FRONT of Max, slightly soft: foreground that bleeds off an edge)
//    wash(poly, col, t0, dur, o)    a broad-marker colour fill (flat [x,y,...] polygon) swept on left to right; o.a alpha (0.9)
//    rectW(x, y, w, h) / ellW(cx, cy, rx, ry)   polygon makers for wash()
//    air(kind, o)                   one moving atmosphere: 'dust' | 'snow' | 'rain' | 'embers' | 'leaves'; o = {x, y, w, h, n, t0, t1, col}
//    sign(text, x, y, o)            bold board type: a colour plate (wash) + thick marker letters; o = {size, col, plate, t0, dur, anchor}
//  Grain (moving), vignette and a slow handheld drift on the camera are always on. Every frame is a pure function of t.
// =====================================================================
const MOODS = {   // board top/bottom, tint (multiply), shade (multiply far from the light), glow strength, vignette
  day:   { b0: '#f7f4ea', b1: '#e4dfd0', tint: [255, 250, 240, 0.0], shade: [120, 125, 140], sh: 0.22, glow: 0.35, vig: 0.22 },
  warm:  { b0: '#f6e6c8', b1: '#e2c495', tint: [255, 196, 130, 0.12], shade: [110, 70, 50], sh: 0.48, glow: 0.55, vig: 0.28 },
  gold:  { b0: '#fbe9bf', b1: '#f0c47c', tint: [255, 205, 120, 0.10], shade: [140, 85, 45], sh: 0.36, glow: 0.7, vig: 0.22 },
  cold:  { b0: '#dbe3ea', b1: '#b9c6d3', tint: [120, 160, 220, 0.34], shade: [60, 75, 105], sh: 0.38, glow: 0.45, vig: 0.32 },
  tense: { b0: '#d9cfc8', b1: '#b4a49c', tint: [190, 150, 150, 0.14], shade: [70, 45, 50], sh: 0.45, glow: 0.45, vig: 0.4 },
  night: { b0: '#8d9ab2', b1: '#5e6a84', tint: [90, 110, 160, 0.22], shade: [25, 30, 52], sh: 0.62, glow: 0.8, vig: 0.42 },
};
const GRADEK = [], LIGHTS = [], AIRS = [], PAR = { far: 0.55, mid: 1, near: 1.45 };
let ANCH = [960, 540];
const hex3 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixA = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
function grade(keys) { GRADEK.length = 0; GRADEK.push(...keys); }
function moodAt(t) {
  const K = GRADEK.length ? GRADEK : [[0, 'day']];
  let i = 0; while (i < K.length - 1 && t >= K[i + 1][0]) i++;
  const a = MOODS[K[i][1]] || MOODS.day, nb = K[i + 1], b = nb ? MOODS[nb[1]] || MOODS.day : a;
  const u = nb ? EZ.io(seg(t, nb[0] - (nb[2] ?? 0.6), nb[0])) : 0;   // a key blends in over its 3rd value (s, default 0.6) before its time
  return { b0: mixA(hex3(a.b0), hex3(b.b0), u), b1: mixA(hex3(a.b1), hex3(b.b1), u), tint: mixA(a.tint, b.tint, u), shade: mixA(a.shade, b.shade, u),
    sh: lerp(a.sh, b.sh, u), glow: lerp(a.glow, b.glow, u), vig: lerp(a.vig, b.vig, u) };
}
function anchor(x, y) { ANCH = [x, y]; }
function light(o) { LIGHTS.push({ col: '#ffd58a', r: 520, kind: 'lamp', flick: o.kind === 'fire' ? 1 : 0, ...o }); }
function lightAt(c) {   // the light of the scene the camera is in (nearest within 2000 px), in screen px
  let best = null, bd = 2000;
  for (const L of LIGHTS) { const d = Math.abs(L.x - c[0]); if (d < bd) { bd = d; best = L; } }
  if (!best) return null;
  const lc = layerCam(c, { layer: best.layer, ax: best.ax ?? ANCH[0], ay: best.ay ?? ANCH[1] }) || c, [sx, sy] = toScreen(lc, best.x, best.y);
  return { ...best, sx, sy, sr: best.r * c[2] };
}
function layerCam(c, it) {
  const p = PAR[it.layer || 'mid'] ?? 1; if (p === 1 || it.ax == null) return c;
  if (Math.abs(c[0] - it.ax) > 1800) return null;   // another scene: its far/near layers stay home
  return [it.ax + (c[0] - it.ax) * p, it.ay + (c[1] - it.ay) * p, Math.pow(c[2], p), c[3]];
}
// ---- washes: broad-marker colour fills (the colour masses that keep a board from reading as empty white)
function rectW(x, y, w, h) { return [x, y, x + w, y, x + w, y + h, x, y + h]; }
function ellW(cx, cy, rx, ry = rx, n = 28) { const p = []; for (let i = 0; i < n; i++) { const a = TAU * i / n; p.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); } return p; }
function wash(poly, col, t0, dur, o = {}) {
  const R = mulberry32(500 + seedN++ * 31), P = [];
  for (let i = 0; i < poly.length; i += 2) P.push([poly[i] + (R() - 0.5) * 5, poly[i + 1] + (R() - 0.5) * 5]);
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const s = { kind: 'wash', poly: P, col: colOf(col), a: o.a ?? 0.92, t0, t1: t0 + dur, w: 0, pen: '_', z: STROKES.length, layer: o.layer || 'mid', ax: ANCH[0], ay: ANCH[1],
    bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], grad: o.grad ? colOf(o.grad) : null, L: 0, P: [[xs[0], ys[0]], [xs[0], ys[0]]], cum: [0, 0] };
  STROKES.push(s); return s;
}
let STREAK = null;
function paintWash(g, s, k) {
  if (k <= 0) return;
  const [x0, y0, x1, y1] = s.bb, cut = lerp(x0 - 60, x1 + 60, k);
  g.save(); g.beginPath(); g.moveTo(x0 - 80, y0 - 10); g.lineTo(cut + 40, y0 - 10); g.lineTo(cut - 40, y1 + 10); g.lineTo(x0 - 80, y1 + 10); g.closePath(); g.clip();
  g.beginPath(); s.poly.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  if (s.grad) { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, s.col); gr.addColorStop(1, s.grad); g.fillStyle = gr; } else g.fillStyle = s.col;
  g.globalAlpha = s.a; g.fill();
  g.clip(); g.globalAlpha = 0.16; g.globalCompositeOperation = 'destination-out'; g.fillStyle = STREAK; g.fillRect(x0, y0, x1 - x0, y1 - y0);   // marker streaks
  g.restore();
}
// ---- bold type on the board
function sign(text, x, y, o = {}) {
  const size = o.size ?? 90, an = o.anchor || 'c', tw = textWidth(text, size), t0 = o.t0 ?? -1, x0 = an === 'c' ? x - tw / 2 : an === 'r' ? x - tw : x;
  if (o.plate !== false) wash(rectW(x0 - size * 0.35, y - size * 1.25, tw + size * 0.7, size * 1.65), o.plate || '#fbf7ef', t0, Math.min(0.3, o.dur ?? 0.3), { layer: o.layer, a: 0.95 });
  return write(text, x, y, { size, anchor: an, t0: t0 + 0.15, dur: o.dur ?? Math.max(0.4, text.length * 0.08), col: o.col || 'ink', w: size * 0.115, nopen: o.nopen ?? t0 < 0, layer: o.layer });
}
// ---- atmosphere
function air(kind, o = {}) { AIRS.push({ kind, n: o.n ?? (kind === 'rain' ? 120 : 60), x: o.x ?? ANCH[0] - 1300, y: o.y ?? ANCH[1] - 900, w: o.w ?? 2600, h: o.h ?? 1500, t0: o.t0 ?? -1, t1: o.t1 ?? 1e9, col: o.col, seed: AIRS.length * 97 + 11 }); }
function paintAir(g, c, t) {
  for (const A of AIRS) {
    if (t < A.t0 || t >= A.t1 || Math.abs(c[0] - (A.x + A.w / 2)) > 2200) continue;
    const R = mulberry32(A.seed); g.save(); applyCam(g, c);
    for (let i = 0; i < A.n; i++) {
      const bx = R(), by = R(), sp = 0.6 + R() * 0.8, ph = R() * TAU, depth = 0.6 + R() * 0.9;
      let vx = 0, vy = 0, r = 3, col = A.col || '#ffffff';
      if (A.kind === 'snow') { vy = 70 * sp; vx = 16 * Math.sin(t * 1.3 + ph); r = 4 + 4 * depth; }
      else if (A.kind === 'rain') { vy = 900 * sp; vx = -120; r = 2; col = A.col || 'rgba(200,215,235,0.8)'; }
      else if (A.kind === 'embers') { vy = -90 * sp; vx = 25 * Math.sin(t * 2 + ph); r = 3 + 2 * depth; col = A.col || '#ffb347'; }
      else if (A.kind === 'leaves') { vy = 60 * sp; vx = 90 * sp; r = 7 + 4 * depth; col = A.col || '#c8743a'; }
      else { vy = -10 * sp; vx = 14 * Math.sin(t * 0.7 + ph); r = 2 + 2.5 * depth; col = A.col || 'rgba(255,248,225,0.9)'; }
      const x = A.x + ((bx * A.w + vx * t) % A.w + A.w) % A.w, y = A.y + ((by * A.h + vy * t) % A.h + A.h) % A.h;
      g.globalAlpha = A.kind === 'dust' ? 0.35 + 0.35 * Math.sin(t * 1.7 + ph) ** 2 : 0.85; g.fillStyle = col; g.strokeStyle = col;
      if (A.kind === 'rain') { g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10, y + 46); g.stroke(); }
      else if (A.kind === 'leaves') { g.beginPath(); g.ellipse(x, y, r, r * 0.5, t * 2 + ph, 0, TAU); g.fill(); }
      else { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    }
    g.restore();
  }
}
// ---- grain + post (called by paintScene)
let GRAIN = null;
function buildLook() {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const R = mulberry32(73); GRAIN = [];
  for (let k = 0; k < 4; k++) { const c = mk(256, 256), d = c.getContext('2d'), im = d.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (R() - 0.5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } d.putImageData(im, 0, 0); GRAIN.push(ctx.createPattern(c, 'repeat')); }
  const st = mk(256, 256), s = st.getContext('2d'); for (let i = 0; i < 90; i++) { s.fillStyle = '#000'; s.globalAlpha = 0.3 + R() * 0.7; s.fillRect(R() * 256, R() * 256, 30 + R() * 120, 1 + R() * 2.5); }
  STREAK = ctx.createPattern(st, 'repeat');
}
function boardFill(g, t) { const m = moodAt(t), bg = g.createLinearGradient(0, 0, W * 0.3, H); bg.addColorStop(0, rgba(m.b0, 1)); bg.addColorStop(1, rgba(m.b1, 1)); return bg; }
function postLook(g, c, t) {
  const m = moodAt(t), L = lightAt(c);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (m.tint[3] > 0) { g.globalCompositeOperation = 'multiply'; g.fillStyle = rgba(m.tint, m.tint[3]); g.fillRect(0, 0, W, H); }
  const lx = L ? L.sx : W * 0.3, ly = L ? L.sy : -H * 0.2, lr = L ? L.sr : H * 0.9, fl = L && L.flick ? 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 7.3) : 1;
  g.globalCompositeOperation = 'multiply';   // shade: the room darkens away from its one light
  const sg = g.createRadialGradient(lx, ly, lr * 0.25, lx, ly, Math.max(W, H) * 1.25); sg.addColorStop(0, 'rgba(255,255,255,1)'); sg.addColorStop(1, rgba(m.shade, 1));
  g.globalAlpha = m.sh; g.fillStyle = sg; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  if (L) {   // glow: the light itself, screen-blended
    g.globalCompositeOperation = 'screen'; const lc = hex3(L.col);
    const gg = g.createRadialGradient(lx, ly, 0, lx, ly, lr * fl); gg.addColorStop(0, rgba(lc, Math.min(1, 1.1 * m.glow))); gg.addColorStop(0.12, rgba(lc, 0.6 * m.glow)); gg.addColorStop(0.45, rgba(lc, 0.18 * m.glow)); gg.addColorStop(1, rgba(lc, 0));
    g.fillStyle = gg; g.fillRect(0, 0, W, H);
  }
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.09; g.fillStyle = GRAIN[Math.floor(t * FPS) % 4];   // moving grain
  g.save(); g.translate((Math.floor(t * FPS) * 37) % 256, (Math.floor(t * FPS) * 91) % 256); g.fillRect(-256, -256, W + 512, H + 512); g.restore();
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 1.0); vg.addColorStop(0, 'rgba(20,18,26,0)'); vg.addColorStop(1, `rgba(20,18,26,${m.vig})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
