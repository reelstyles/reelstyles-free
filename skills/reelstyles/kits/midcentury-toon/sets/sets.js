// =====================================================================
//  sets/sets.js: abstract colour-plane rooms for the mid-century look. A scene is a wall plane, a floor band, a horizon line
//  with gaps and one or two props; never a full room. World = the 1920 x 1080 frame (camera default [960, 540, 1]); every
//  set over-draws -2200..4200 so a camera can push, tilt and rotate without showing the edge.
//    room(G, o)                 wall + floor + horizon line + baseboard; o { wall, floor, fy (floor y), trim, dots }
//    counterTop(G, x, y, w, o)  a kitchen counter / table top with a drawer front, returns the top surface y
//    wallClock(G, t, x, y, r)   sunburst clock; the second hand ticks on twos
//    windowPlane(G, x, y, w, h, t, o)   a window with a sky plane and a drifting cloud
//    atomicArt(G, x, y, s, t)   framed atom + stars wall art
//    lampStd(G, x, y, s)        a standing lamp with a cone shade
//    plant(G, x, y, s, t)       a pot with a leaf fan that sways on twos
//    rugBand(G, x0, x1, y, h, col)      wavy rug under the action
//    palette scenes: planeSplit(G, o)   two colour blocks side by side (do / don't, before / after)
// =====================================================================
function room(G, o = {}) {
  const wall = o.wall || PAL.paper, floor = o.floor || PAL.pink, fy = o.fy ?? 900, trim = o.trim || PAL.paperDD;
  plane(G, rect(-2200, -2200, 6400, fy + 2200), wall, { grain: 0.28 });
  if (o.dots) polka(G, rect(-2200, -400, 6400, fy + 400), o.dots, { step: 90, r: 9, alpha: 0.28, ox: 0, oy: 0 });
  plane(G, rect(-2200, fy, 6400, 2600), floor, { grain: 0.32 });
  shape(G, rect(-2200, fy - 26, 6400, 26), { fill: trim, line: 0, off: [0, 0], grain: 0.2 });
  const L = []; for (let x = -2200; x < 4200; x += 260) L.push([[x, fy], [x + 150 + 70 * hash(x, 3), fy + 0.6]]);   // the horizon line breaks
  L.forEach((p, i) => ink(G, p, 4.2, { seed: 800 + i, taper: false, wob: 0.3 }));
  if (o.ticks) for (let x = -2000; x < 4000; x += 210) sparkle(G, x + (hash(x, 5) - 0.5) * 60, fy + 70 + (hash(x, 9) * 50), 14, { fill: PAL.white, alpha: 0.7 });
  return fy;
}
function rugBand(G, x0, x1, y, h, col, ph = 0) {
  const P = wavyBand(x0, x1, y, h, 9, 150, ph);
  shape(G, P, { fill: col, line: 3.6, seed: 820, grain: 0.3, breaks: 0.25 });
  polka(G, P, PAL.white, { step: 40, r: 5, alpha: 0.55 });
}
function counterTop(G, x, y, w, o = {}) {
  const col = o.col || PAL.kraft, colD = o.colD || PAL.kraftD, d = o.depth ?? 190;
  shape(G, rect(x, y + 34, w, d), { fill: col, line: 4.2, seed: 830, grain: 0.35, breaks: 0.18, shade: [{ pts: rect(x + w * 0.62, y + 30, w, d + 10), color: colD, alpha: 0.35 }] });
  const n = Math.max(1, Math.round(w / 330)), cw = w / n;
  for (let i = 0; i < n; i++) {
    shape(G, rrect(x + i * cw + 22, y + 70, cw - 44, d - 78, 8), { fill: colD, line: 3, seed: 831 + i, grain: 0.3, breaks: 0.2 });
    shape(G, ellipse(x + i * cw + cw / 2, y + 70 + (d - 78) * 0.3, 11, 11, 12), { fill: PAL.mustard, line: 3, seed: 840 + i, grain: 0 });
  }
  shape(G, rect(x - 16, y, w + 32, 34), { fill: o.top || PAL.white, line: 4.4, seed: 850, grain: 0.2, breaks: 0.1, off: [4, 6] });
  return y;
}
function wallClock(G, t, x, y, r = 70) {
  star(G, x, y, r * 1.5, { n: 16, inner: 0.7, fill: PAL.mustard, line: 3.2, seed: 860, off: [3, 3] });
  shape(G, ellipse(x, y, r, r, 48), { fill: PAL.white, line: 4, seed: 861, grain: 0.2 });
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ink(G, [[x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78], [x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9]], 3.2, { seed: 862 + i, taper: false }); }
  const ts = Math.floor(t), a = -Math.PI / 2 + ((ts % 60) / 60) * TAU;
  ink(G, [[x, y], [x + Math.cos(-0.6) * r * 0.46, y + Math.sin(-0.6) * r * 0.46]], 6, { seed: 880, taper: false });
  ink(G, [[x, y], [x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8]], 3, { seed: 881, color: PAL.coral, taper: false });
  shape(G, ellipse(x, y, 6, 6, 10), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
}
function windowPlane(G, x, y, w, h, t, o = {}) {
  shape(G, rect(x - 18, y - 18, w + 36, h + 36), { fill: o.frame || PAL.white, line: 4.4, seed: 890, grain: 0.25 });
  G.save(); path(G, rect(x, y, w, h)); G.clip();
  G.fillStyle = o.sky || PAL.sky; G.fillRect(x, y, w, h);
  const cx = x + ((t * 14 + 120) % (w + 360)) - 180;                       // a cloud drifting right, wraps (pure function of t)
  shape(G, [...ellipse(cx, y + h * 0.3, 90, 30, 24, Math.PI, TAU), ...ellipse(cx, y + h * 0.3, 90, 18, 24, 0, Math.PI)], { fill: PAL.white, line: 0, off: [0, 0], grain: 0.1 });
  shape(G, ellipse(x + w * 0.78, y + h * 0.26, 30, 30, 24), { fill: PAL.mustardL, line: 0, off: [0, 0], grain: 0.1 });
  G.restore();
  ink(G, [[x + w / 2, y], [x + w / 2, y + h]], 5, { seed: 891, taper: false });
  ink(G, [[x, y + h / 2], [x + w, y + h / 2]], 5, { seed: 892, taper: false });
  ink(G, rect(x, y, w, h), 5, { closed: true, seed: 893, breaks: 0.1 });
}
function atomicArt(G, x, y, s = 1, t = 0) {
  shape(G, rrect(x - 110 * s, y - 110 * s, 220 * s, 220 * s, 8), { fill: PAL.white, line: 4, seed: 900, grain: 0.2, off: [6, 6] });
  atom(G, x, y, 74 * s, { rot: twos(t) * 0.25, w: 3, nucleus: PAL.coral });
  sparkle(G, x + 70 * s, y - 72 * s, 16 * s, { fill: PAL.mustard }); sparkle(G, x - 74 * s, y + 70 * s, 12 * s, { fill: PAL.teal });
}
function lampStd(G, x, y, s = 1) {
  ink(G, [[x, y], [x, y - 330 * s]], 7 * s, { seed: 910, taper: false, wob: 0.1 });
  shape(G, ellipse(x, y - 4, 44 * s, 10 * s, 20), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  shape(G, [[x - 40 * s, y - 330 * s], [x + 40 * s, y - 330 * s], [x + 76 * s, y - 440 * s], [x - 76 * s, y - 440 * s]], { fill: PAL.mustardL, line: 4, seed: 911, grain: 0.3 });
}
function plant(G, x, y, s = 1, t = 0) {
  const sw = Math.sin(twos(t) * 1.7) * 0.05;
  for (let i = -2; i <= 2; i++) shape(G, xform(spline([[0, 0], [-16, -70], [0, -170], [16, -70]], true, 6), x, y - 60 * s, i * 0.34 + sw * (1 + Math.abs(i) * 0.3), s), { fill: i % 2 ? PAL.olive : PAL.avocadoD, line: 3.6, seed: 920 + i, grain: 0.3 });
  shape(G, [[x - 52 * s, y - 70 * s], [x + 52 * s, y - 70 * s], [x + 38 * s, y], [x - 38 * s, y]], { fill: PAL.coral, line: 4, seed: 930, grain: 0.3 });
}
// two colour blocks side by side: right vs wrong, before vs after. split is 0..1 of the width
function planeSplit(G, o = {}) {
  const sx = (o.split ?? 0.5) * W;
  plane(G, rect(-2200, -2200, 2200 + sx, 4400), o.left || PAL.sky);
  plane(G, rect(sx, -2200, 4400, 4400), o.right || PAL.rose);
  ink(G, [[sx, -20], [sx, H + 20]], 7, { seed: 940, taper: false });
}
