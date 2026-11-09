// Reusable backdrops. All take local coordinates and use the shape queue from engine/comic.js.
const multi = (fn) => (p) => fn(p);                                  // one shape built from many sub-paths (cheap)
// night sky: dark ink base, magenta dot glow rising from the horizon, twinkling stars
function nightSky(w, h, horizon, seed = 1) {
  grp(10 + seed); shape(rect(0, 0, w, h), L.night);
  const bands = 8; for (let i = 0; i < bands; i++) shape(rect(0, horizon - (bands - i) * 26, w, 27), [['m', 0.1 + i * 0.075]], 0, { fill: false });
  const s = new Path2D(), n = Math.round(w / 26), f = Math.floor(K.t * 3);
  for (let i = 0; i < n; i++) {
    if (hash(i * 3.1 + seed + f * 0.7 + hash(i)) < 0.22) continue;       // twinkle
    const x = hash(i * 1.9 + seed) * w, y = hash(i * 2.7 + seed) * (horizon - 120), r = 3 + hash(i * 5.3) * 5;
    s.moveTo(x, y - r * 2); s.lineTo(x + r * 0.5, y - r * 0.5); s.lineTo(x + r * 2, y); s.lineTo(x + r * 0.5, y + r * 0.5); s.lineTo(x, y + r * 2); s.lineTo(x - r * 0.5, y + r * 0.5); s.lineTo(x - r * 2, y); s.lineTo(x - r * 0.5, y - r * 0.5); s.closePath();
  }
  shape((q) => q.addPath(s), L.white, 0);
}
// skyline: blocks with lit windows that flicker. layers = building colour, base = ground y
function skyline(w, base, seed, layers, hMin, hMax, win, ink = 6) {
  grp(30 + seed);
  let x = -10, i = 0; const f = Math.floor(K.t * 1.5);
  while (x < w + 10) {
    const bw = 46 + hash(seed + i * 1.3) * 40, bh = hMin + hash(seed + i * 2.1) * (hMax - hMin);
    shape(rect(x, base - bh, bw, bh + 200), layers, ink);
    if (win) {
      const p = new Path2D();
      for (let yy = base - bh + 14; yy < base - 14; yy += 22) for (let xx = x + 8; xx < x + bw - 12; xx += 16)
        if (hash(xx * 0.37 + yy * 0.91 + seed + Math.floor(f + hash(xx + yy) * 4)) > 0.45) p.rect(xx, yy, 8, 11);
      shape((q) => q.addPath(p), L.yellow, 0);
    }
    x += bw + 4 + hash(i * 7.7 + seed) * 6; i++;
  }
}
// sparks flying out from a point (stepped on twos). o: {x, y, n, r, lt, seed}
function sparks(o) {
  if (o.lt < 0) return;
  const f = q12(o.lt), p = new Path2D();
  for (let i = 0; i < o.n; i++) {
    const a = hash(i * 2.3 + (o.seed || 0)) * TAU, d = (40 + hash(i * 5.1) * o.r) * EZ.o3(f / 0.9), s = 14 * (1 - EZ.i2(f / 1.2)) + 3 + Math.sin(K.t * 20 + i) * 1.5;
    const x = o.x + Math.cos(a) * d, y = o.y + Math.sin(a) * d;
    p.moveTo(x, y - s * 2); p.lineTo(x + s * 0.6, y); p.lineTo(x, y + s * 2); p.lineTo(x - s * 0.6, y); p.closePath();
  }
  shape((q) => q.addPath(p), L.yellow, 4);
}

// ---------- vertical sets (9:16 page, 1080 x 1920 screen units). Each draws from -BL to W + BL so a camera push or shake never shows an edge;
//            g = the ground line (feet stand on it). Big shapes, thick outlines, few details behind the hero: they read on a phone.
const BL = 170;
// skyline drawn k times bigger (thicker blocks and windows for a phone), base at y
function bigSkyline(base, seed, layers, hMin, hMax, win, k = 1.8, ink = 6) {
  kPush(); kTr(-BL, base, 0, k); skyline((W + 2 * BL) / k, 0, seed, layers, hMin / k, hMax / k, win, ink); kPop();
}
// night rooftop: starry sky with a magenta glow, moon, two skylines, the roof slab with a water tower. o: {seed, moonX, towerX}
function setRoof(g, o = {}) {
  kPush(); kTr(-BL, -BL, 0, 1.5); nightSky((W + 2 * BL) / 1.5, (H + 2 * BL) / 1.5, (g + BL - 300) / 1.5, o.seed || 1); kPop();
  grp(21); const mx = o.moonX ?? 790, my = g - 1060;
  shape(ell(mx, my, 190), [['y', 0.22]], 0, { fill: false });
  shape(ell(mx, my, 118), L.yellow, 8); shape(ell(mx - 34, my - 22, 22), L.skinSh, 0); shape(ell(mx + 40, my + 34, 15), L.skinSh, 0);
  bigSkyline(g - 150, 2, L.dusk, 260, 640, true);
  bigSkyline(g - 10, 5, L.deep, 120, 420, true);
  grp(41); shape(rect(-BL, g, W + 2 * BL, H - g + BL), L.deep, 9);
  shape(rect(-BL, g, W + 2 * BL, 34), L.steelD, 8);
  if (o.towerX != null) {   // water tower on stilts
    const x = o.towerX; grp(42);
    shape(rect(x - 70, g - 150, 14, 150), L.black, 5); shape(rect(x + 56, g - 150, 14, 150), L.black, 5);
    shape(rrect(x - 90, g - 330, 180, 190, 14), L.purple, 8); shape(poly([[x - 104, g - 330], [x, g - 410], [x + 104, g - 330]]), L.deep, 8);
  }
}
// street at dusk: purple sky with a slow sunburst, skyline, sidewalk, road, a street lamp. o: {lampX, seed}
function setStreet(g, o = {}) {
  grp(51); shape(rect(-BL, -BL, W + 2 * BL, H + 2 * BL), L.purple);
  sunburst(W / 2, g - 760, 1900, 44, [['m', 0.45]], K.t * 0.03, true);
  bigSkyline(g - 60, o.seed || 7, L.deep, 300, 820, true, 2.0, 7);
  grp(52); shape(rect(-BL, g - 30, W + 2 * BL, 70), [['k', 0.25], ['y', 0.3]], 8);              // sidewalk
  shape(rect(-BL, g + 40, W + 2 * BL, H - g + BL), L.steelD, 8);                                  // road
  for (let i = -1; i < 6; i++) shape(rect(i * 260 + 40, g + 190, 150, 26), L.yellow, 5);         // lane marks
  if (o.lampX != null) {
    const x = o.lampX; grp(53);
    shape(rect(x - 12, g - 820, 24, 800), L.black, 5); shape(poly([[x - 12, g - 820], [x + 90, g - 860], [x + 96, g - 836], [x + 12, g - 800]]), L.black, 5);
    shape(ell(x + 100, g - 820, 70 + 4 * Math.sin(K.t * 8), 50), [['y', 0.35]], 0, { fill: false }); shape(ell(x + 100, g - 830, 30, 20), L.yellow, 6);
  }
}
// power plant: riveted steel wall, two fat pipes, hazard stripes, a wall socket. o: {sockX, sockY, glow}
function setPlant(g, o = {}) {
  grp(61); shape(rect(-BL, -BL, W + 2 * BL, g + BL), L.steel, 0);
  for (let x = -BL; x < W + BL; x += 270) shape(rect(x, -BL, 270, g + BL), L.steel, 7);
  const rv = new Path2D(); for (let x = -BL + 20; x < W + BL; x += 270) for (let y = 60; y < g; y += 120) { rv.moveTo(x + 10, y); rv.arc(x, y, 10, 0, TAU); rv.moveTo(x + 260, y); rv.arc(x + 250, y, 10, 0, TAU); }
  shape((q) => q.addPath(rv), L.white, 4);
  grp(62); shape(rect(-BL, g - 1180, W + 2 * BL, 120), L.orange, 9); shape(rect(-BL, g - 1000, W + 2 * BL, 80), L.green, 9);
  for (let x = 30; x < W; x += 360) { shape(rect(x, g - 1196, 40, 152), L.steelD, 7); shape(rect(x + 180, g - 1012, 34, 104), L.steelD, 7); }
  grp(63); shape(rect(-BL, g, W + 2 * BL, H - g + BL), L.steelD, 9);
  const hz = new Path2D(); for (let x = -BL; x < W + BL; x += 120) { hz.moveTo(x, g - 70); hz.lineTo(x + 60, g - 70); hz.lineTo(x + 20, g); hz.lineTo(x - 40, g); hz.closePath(); }
  shape(rect(-BL, g - 70, W + 2 * BL, 70), L.yellow, 7); shape((q) => q.addPath(hz), L.black, 0);
  if (o.sockX != null) {   // wall socket: two slots, a bolt sign over it
    const x = o.sockX, y = o.sockY; grp(64);
    shape(rrect(x - 130, y - 150, 260, 300, 30), L.white, 10);
    shape(rrect(x - 60, y - 70, 34, 110, 10), L.black, 0); shape(rrect(x + 26, y - 70, 34, 110, 10), L.black, 0);
    shape(poly([[x, y - 330], [x + 92, y - 180], [x - 92, y - 180]]), L.yellow, 8);
    shape(poly([[x + 8, y - 300], [x - 22, y - 238], [x - 2, y - 238], [x - 12, y - 200], [x + 22, y - 258], [x + 2, y - 258]]), L.black, 0);
  }
}
// sky panel: cyan with a turning sunburst and fat clouds (flights, leaps)
function setSky(o = {}) {
  grp(71); shape(rect(-BL, -BL, W + 2 * BL, H + 2 * BL), L.cyan);
  sunburst(W / 2, H * 0.48, 2000, 40, [['c', 0.3]], -K.t * 0.05, true);
  grp(72); const dx = (K.t * 60) % 700;
  for (const [x, y, r] of [[120, 520, 120], [860, 1180, 150], [300, 1640, 140], [980, 320, 110]]) {
    const xx = ((x - dx + 1400) % 1400) - 160;
    shape(blob([[xx - r, y], [xx - r * 0.6, y - r * 0.6], [xx, y - r * 0.8], [xx + r * 0.7, y - r * 0.5], [xx + r, y], [xx + r * 0.5, y + r * 0.4], [xx - r * 0.5, y + r * 0.4]]), L.white, 8);
  }
}
// idea / shock panel: magenta dots and yellow rays out of a point (big emotional beats)
function setPop(fx, fy, o = {}) {
  grp(81); shape(rect(-BL, -BL, W + 2 * BL, H + 2 * BL), o.layers || L.pink);
  sunburst(fx, fy, 2200, 36, o.rays || [['y', 1]], K.t * 0.06, false);
}
// dawn rooftop: orange to yellow sky in bands, a huge half sun, pink skyline, purple roof
function setDawn(g, o = {}) {
  grp(91); shape(rect(-BL, -BL, W + 2 * BL, H + 2 * BL), L.yellow);
  for (let i = 0; i < 6; i++) shape(rect(-BL, -BL + i * 170, W + 2 * BL, 172), [['y', 1], ['m', 0.55 - i * 0.08]], 0, { fill: false });
  sunburst(o.sunX ?? 540, g - 300, 2000, 30, [['m', 0.25]], K.t * 0.04, false);
  shape(ell(o.sunX ?? 540, g - 300, 300 + 6 * Math.sin(K.t * 2)), [['y', 1], ['m', 0.2]], 10);
  bigSkyline(g - 20, 11, [['m', 0.6], ['c', 0.15]], 200, 560, false, 2.0, 7);
  grp(92); shape(rect(-BL, g, W + 2 * BL, H - g + BL), L.purple, 9); shape(rect(-BL, g, W + 2 * BL, 34), L.deep, 8);
}
