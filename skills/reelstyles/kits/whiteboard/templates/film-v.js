// =====================================================================
//  templates/film-v.js: the 32 s VERTICAL (1080x1920) whiteboard Short, VS proverb format: "Save first, spend the rest".
//  Copy it to the project root as film.js next to templates/vertical.html (as index.html). The 16:9 sample stays templates/film.js.
//  One hero (Max, characters/cast.js, s 1 = ~890 px, 46-52% of the frame) and six board sets drawn in marker around him:
//  payday desk · shop · jar shelf · rain street · chart · house. Every picture is 2 s in its own spot on the board
//  (PIC_X apart, so no picture sees another), a hard cut with a 0.3 s slide-in (shot()), a new pose, and one label above his head.
//    0-4 payday · 4-8 shop · 8-12 jar · 12-16 rain · 16-20 chart · 20-24 house · 24-28 payday + shop again · 28-32 house (end card 30)
//  Picture-local px: camera centre (540, 1000) at zoom 1 → screen = local - (0, 40); floor y 1540 (screen ~1500), head top ~ y 600.
//  The set sits on the side Max faces: side 'R' = x 600-1000 (Max at x 380, dir 1), 'L' = x 80-480 (Max at x 700, dir -1).
// =====================================================================
const DUR = 32, PIC_X = 1700, FLOOR = 1540;
const O = (k) => [k * PIC_X, 0];
const mv = (o, shapes) => shapes.map((p) => p.map((v, i) => v + o[i % 2]));
const D = (o, shapes, t0, dur, opt = {}) => draw(mv(o, shapes), t0, dur, opt);
const Wr = (o, str, x, y, opt) => write(str, o[0] + x, o[1] + y, opt);
const HL = (o, x, y, w, h, t0, dur, col = PAL.hi, nopen = false) => highlight(o[0] + x, o[1] + y, w, h, t0, dur, col, nopen);
const coin = (o, keys, r = 54) => magnet({ col: '#e0a020', r, label: '$', keys: keys.map(([t, x, y, l]) => [t, o[0] + x, o[1] + y, l]) });
const sx = (side, x) => (side === 'R' ? 600 + x : 80 + x);   // set x (0-400) on the side Max faces
const pre = (T) => ({ t0: T - 1.3, dur: 1.0 });               // the set is drawn before the camera arrives (no pen)
function room(o, T, seed) {                                   // floor line + hatch, faint old lessons on the board
  ghosts(o[0] - 60, 60, 1200, 1500, 6, seed);
  D(o, [[-140, FLOOR, 300, FLOOR + 3, 700, FLOOR - 2, 1220, FLOOR + 2]], T - 1.3, 0.3, { nopen: true, w: 12 });
  HL(o, -140, FLOOR + 14, 1360, 420, T - 1.2, 0.3, '#d9dde4', true);   // the floor is a soft grey wash: no empty white band under the feet
  D(o, [[60, FLOOR + 70, 200, FLOOR + 70], [420, FLOOR + 110, 640, FLOOR + 110], [820, FLOOR + 60, 980, FLOOR + 60]], T - 1.0, 0.3, { nopen: true, col: PAL.ghost, w: 9 });
}
// ---- the six sets (strokes; fills are highlighter swipes)
function payday(o, T, side) {
  const p = pre(T), x = (v) => sx(side, v);
  D(o, box(x(60), 640, 290, 300, 16), p.t0, 0.3, { nopen: true });                       // wall calendar
  HL(o, x(66), 646, 278, 70, p.t0 + 0.2, 0.2, PAL.hot, true);
  Wr(o, 'PAY', x(205), 700, { size: 56, anchor: 'c', t0: p.t0 + 0.3, dur: 0.2, nopen: true });
  for (let r = 0; r < 3; r++) D(o, [[x(95), 790 + r * 55, x(315), 790 + r * 55]], p.t0 + 0.4 + r * 0.05, 0.1, { nopen: true, col: PAL.ghost, w: 8 });
  D(o, [[x(0), 1180, x(400), 1180], [x(30), 1180, x(30), FLOOR], [x(370), 1180, x(370), FLOOR]], p.t0 + 0.5, 0.4, { nopen: true });   // desk
}
function shop(o, T, side) {
  const p = pre(T), x = (v) => sx(side, v);
  D(o, box(x(10), 760, 390, 780, 6), p.t0, 0.3, { nopen: true });                         // shop front
  for (let i = 0; i < 4; i++) HL(o, x(14 + i * 98), 700, 50, 110, p.t0 + 0.2 + i * 0.05, 0.1, PAL.hot, true);   // striped awning
  D(o, [[x(-10), 700, x(420), 700], [x(-10), 810, x(420), 810]], p.t0 + 0.3, 0.2, { nopen: true });
  D(o, box(x(50), 880, 300, 210, 10), p.t0 + 0.45, 0.2, { nopen: true });                // window
  Wr(o, 'SALE', x(200), 1010, { size: 84, anchor: 'c', t0: p.t0 + 0.6, dur: 0.3, col: 'hot', nopen: true });
}
function jarShelf(o, T, side) {
  const p = pre(T), x = (v) => sx(side, v);
  D(o, [[x(-10), 1250, x(410), 1250], [x(40), 1250, x(40), FLOOR], [x(360), 1250, x(360), FLOOR]], p.t0, 0.3, { nopen: true });   // table
  D(o, [[x(80), 860, x(70), 1230, x(330), 1230, x(320), 860], [x(70), 860, x(330), 860]], p.t0 + 0.3, 0.3, { nopen: true });   // jar
  D(o, box(x(100), 800, 200, 60, 12), p.t0 + 0.6, 0.2, { nopen: true, col: 'sig' });    // lid
  HL(o, x(104), 804, 192, 52, p.t0 + 0.7, 0.15, PAL.sig, true);
}
function rainStreet(o, T, side) {
  const p = pre(T), x = (v) => sx(side, v);
  D(o, curve([x(40), 820, x(30), 740, x(100), 690, x(160), 640, x(250), 610, x(330), 650, x(370), 710, x(410), 760, x(390), 820, x(40), 820], 8), p.t0, 0.5, { nopen: true, w: 14 });   // cloud
  HL(o, x(50), 660, 340, 150, p.t0 + 0.5, 0.25, '#9fb2c8', true);
  D(o, [[x(30), 1380, x(30), FLOOR], ...circle(x(30), 1360, 26)], p.t0 + 0.6, 0.2, { nopen: true });   // a bollard
  D(o, circle(x(250), FLOOR - 10, 150, 22), p.t0 + 0.8, 0.2, { nopen: true, col: 'sig' });   // puddle
}
function chart(o, T, side) {
  const p = pre(T), x = (v) => sx(side, v);
  D(o, box(x(-10), 780, 420, 660, 12), p.t0, 0.3, { nopen: true, col: PAL.ghost, w: 9 });   // the sheet
  D(o, axes(x(50), 1380, 330, 520), p.t0 + 0.3, 0.3, { nopen: true });
  Wr(o, '$', x(80), 900, { size: 90, t0: p.t0 + 0.6, dur: 0.2, nopen: true, col: 'hot' });
  Wr(o, 'years', x(390), 1440, { size: 60, anchor: 'r', t0: p.t0 + 0.7, dur: 0.2, nopen: true });
}
function house(o, T, side) {
  const p = pre(T), x = (v) => sx(side, v);
  D(o, [[x(30), 1130, x(30), FLOOR], [x(370), 1130, x(370), FLOOR]], p.t0, 0.2, { nopen: true });
  D(o, [[x(-10), 1150, x(200), 900, x(410), 1150, x(-10), 1150]], p.t0 + 0.2, 0.3, { nopen: true, col: 'hot', w: 14 });   // roof
  HL(o, x(60), 1060, 280, 80, p.t0 + 0.4, 0.2, PAL.hot, true);
  D(o, box(x(150), 1320, 100, 220, 8), p.t0 + 0.5, 0.2, { nopen: true });                // door
  D(o, box(x(60), 1200, 80, 80, 6), p.t0 + 0.6, 0.1, { nopen: true });
  D(o, box(x(260), 1200, 80, 80, 6), p.t0 + 0.65, 0.1, { nopen: true });
  HL(o, x(64), 1204, 72, 72, p.t0 + 0.75, 0.1, PAL.hi, true); HL(o, x(264), 1204, 72, 72, p.t0 + 0.8, 0.1, PAL.hi, true);
}
// ---- one picture: set + action + Max + label + camera key
const SH = [];
function pic(k, set, side, o) {
  const T = k * 2, B = O(k), t1 = o.t1 ?? T + 2, hx = side === 'R' ? 380 : 700;
  room(B, T, 3 + k * 7); set(B, T, side);
  if (o.act) o.act(B, T, (v) => sx(side, v));
  hero(T, t1, { x: B[0] + hx, y: FLOOR, s: 1, dir: side === 'R' ? 1 : -1, pose: o.pose, ex: o.ex, hold: o.hold });
  label(o.label, T + (k === 0 ? -0.2 : 0.05), Math.min(t1, DUR - 2), { col: o.col || 'ink' });
  const z = o.z ?? (k % 2 ? 1.04 : 0.98);
  SH.push([T, B[0] + 540 + (o.dx || 0), 1000, z, k % 2 ? 0.01 : -0.01, side === 'R' ? 170 : -170, z * 1.045]);   // slides in from the side away from Max
}
const P = (name) => () => name;

// 0-4 PAYDAY: spend first vs save first
pic(0, payday, 'R', { label: 'SPEND FIRST', col: 'hot', ex: 'happy', pose: (u) => (Math.floor(u * 3) % 2 ? 'cheer' : mixPose('cheer', 'reach', 0.4)),
  act: (o, T, x) => {
    [[330, 640, 120, 1180], [430, 600, 760, FLOOR - 40], [300, 620, -40, 900], [470, 660, 980, 1300]].forEach(([a, b, c, d], i) =>
      coin(o, [[T - 0.4 + i * 0.25, a, b, 1], [T + 0.5 + i * 0.25, (a + c) / 2, b - 140, 1], [T + 1.1 + i * 0.25, c, d, 0.6], [T + 1.4 + i * 0.25, c, d + 30, 0]], 46));
    D(o, [[260, 560, 220, 500], [520, 560, 560, 500], [390, 520, 390, 470]], T + 0.1, 0.4, { col: 'hot', w: 11 });   // flung lines
  } });
pic(1, payday, 'L', { label: 'SAVE FIRST', col: 'sig', ex: 'firm', pose: blend('reach', 'point', 0.6, 1.0),
  act: (o, T, x) => {
    D(o, [[x(130), 1000, x(120), 1170, x(290), 1170, x(280), 1000], [x(120), 1000, x(290), 1000]], T - 1.0, 0.3, { nopen: true, col: 'sig', w: 14 });   // jar on the desk
    Wr(o, 'SAVE', x(205), 1120, { size: 54, anchor: 'c', t0: T - 0.6, dur: 0.2, nopen: true, col: 'sig' });
    coin(o, [[T, x(205), 860, 1], [T + 0.7, x(205), 1080, 0], [T + 2, x(205), 1080, 0]], 46);
    HL(o, x(126), 1130, 160, 36, T + 0.8, 0.4);
    D(o, check(x(205), 820, 90), T + 1.0, 0.4, { col: 'sig', w: 14 });
  } });
// 4-8 SHOP: buy it all vs buy the rest
pic(2, shop, 'R', { label: 'BUY IT ALL', col: 'hot', ex: 'happy', pose: 'push', dx: 20,
  act: (o, T, x) => {
    D(o, [[x(-150), 980, x(-60), 1060, x(20), 1360, x(330), 1360, x(360), 1110, x(-30), 1110], ...circle(x(60), 1470, 34), ...circle(x(290), 1470, 34), [x(20), 1360, x(60), 1436], [x(330), 1360, x(290), 1436]], T - 1.0, 0.4, { nopen: true });   // cart
    [[0, 1000, 140, 110], [150, 960, 120, 150], [60, 880, 110, 120], [200, 860, 110, 100]].forEach(([bx, by, bw, bh], i) => { D(o, box(x(bx), by, bw, bh, 6), T + 0.1 + i * 0.3, 0.25, { col: i % 2 ? 'hot' : 'ink' }); HL(o, x(bx) + 6, by + 6, bw - 12, bh - 12, T + 0.3 + i * 0.3, 0.12, i % 2 ? PAL.hot : PAL.hi); });
  } });
pic(3, shop, 'L', { label: 'BUY THE REST', col: 'sig', ex: 'happy', pose: (u) => walk(u), hold: 'bag',
  act: (o, T, x) => { D(o, box(x(240), 1180, 140, 90, 10), T + 0.2, 0.3, { col: 'sig' }); Wr(o, '$5', x(310), 1248, { size: 64, anchor: 'c', t0: T + 0.5, dur: 0.3, col: 'sig' }); D(o, check(x(120), 1240, 100), T + 0.9, 0.4, { col: 'sig', w: 14 }); } });
// 8-12 JAR: empty vs full
pic(4, jarShelf, 'R', { label: 'EMPTY JAR', col: 'hot', ex: 'sad', pose: blend('idle', 'slump', 0, 0.6), z: 1.0,
  act: (o, T, x) => { Wr(o, '$0', x(200), 1110, { size: 150, anchor: 'c', t0: T + 0.2, dur: 0.7, col: 'hot' }); D(o, [[x(80), 880, x(160), 960], [x(160), 880, x(100), 960], [x(120), 875, x(130), 960]], T + 1.0, 0.5, { col: PAL.ghost, w: 7 }); } });
pic(5, jarShelf, 'L', { label: 'FULL JAR', col: 'sig', ex: 'happy', pose: blend('reach', 'cheer', 0.9, 1.3),
  act: (o, T, x) => {
    HL(o, x(82), 900, 238, 320, T - 0.9, 0.5, PAL.hi, true);
    [0, 1, 2].forEach((i) => coin(o, [[T + i * 0.35, x(130 + i * 70), 640, 1], [T + 0.45 + i * 0.35, x(130 + i * 70), 1000 - i * 40, 0], [T + 2, x(130 + i * 70), 1000 - i * 40, 0]], 44));
    Wr(o, '$$$', x(200), 1170, { size: 90, anchor: 'c', t0: T + 0.9, dur: 0.6, col: 'ink' });
  } });
// 12-16 RAIN: no fund vs a fund
const rain = (o, T, xs, y0, y1, n) => { for (let i = 0; i < n; i++) { const xx = xs[0] + (xs[1] - xs[0]) * ((i * 0.618) % 1), yy = y0 + ((i * 137) % (y1 - y0)); D(o, [[xx, yy, xx - 26, yy + 90]], T + 0.05 + (i % 6) * 0.2, 0.15, { col: 'sig', w: 9, nopen: i % 2 === 0 }); } };
pic(6, rainStreet, 'R', { label: 'NO FUND: SOAKED', col: 'hot', ex: 'shock', pose: blend('shrug', 'slump', 0.8, 1.4),
  act: (o, T) => { rain(o, T, [140, 1000], 860, 1420, 26); D(o, [[300, 600, 290, 640], [470, 610, 480, 650]], T + 1.2, 0.3, { col: 'sig', w: 10 }); } });
pic(7, rainStreet, 'L', { label: 'FUND: DRY', col: 'sig', ex: 'firm', pose: 'umbrella', hold: 'umbrella', z: 1.0,
  act: (o, T) => { rain(o, T, [80, 470], 860, 1420, 12); rain(o, T, [940, 1040], 880, 1400, 4); Wr(o, 'FUND', 560, 1700, { size: 80, anchor: 'c', t0: T + 0.3, dur: 0.5, col: 'hot' }); } });
// 16-20 CHART: spent = flat vs saved = grows
pic(8, chart, 'R', { label: 'SPENT: FLAT', col: 'hot', ex: 'sad', pose: 'shrug',
  act: (o, T, x) => { D(o, [[x(60), 1330, x(200), 1325, x(370), 1332]], T + 0.1, 0.9, { col: 'hot', w: 14 }); Wr(o, '$0', x(300), 1260, { size: 84, anchor: 'c', t0: T + 1.0, dur: 0.4, col: 'hot' }); } });
pic(9, chart, 'L', { label: 'SAVED: GROWS', col: 'sig', ex: 'happy', pose: blend('idle', 'point', 0, 0.4),
  act: (o, T, x) => {
    const g = (v) => 1340 - 34 * (Math.exp((v - x(60)) / 95) - 1);
    D(o, fn(g, x(60), x(370), 30), T + 0.1, 1.2, { col: 'sig', w: 15 });
    coin(o, [[T + 0.1, x(60), g(x(60)) - 10, 1], [T + 0.4, x(60), g(x(60)) - 10, 0], [T + 1.3, x(330), g(x(330)) - 10, 0]], 42);
    D(o, circle(x(345), g(x(350)) + 60, 70, 110), T + 1.4, 0.4, { col: 'hot', w: 12 });
  } });
// 20-24 HOUSE: a year later
pic(10, house, 'R', { label: 'A YEAR LATER', col: 'ink', ex: 'happy', pose: (u) => walk(u, 1.1), z: 1.0,
  act: (o, T, x) => { D(o, dashed(80, FLOOR - 20, x(150), FLOOR - 20, 30, 24), T + 0.1, 0.8, { col: 'sig', w: 10 }); D(o, [[x(320), 900, x(320), 1060], ...box(x(300), 880, 120, 70, 8)], T + 0.6, 0.4, {}); Wr(o, 'SOLD', x(360), 935, { size: 40, anchor: 'c', t0: T + 1.0, dur: 0.4, col: 'hot' }); } });
pic(11, house, 'L', { label: 'SAVE FIRST', col: 'sig', ex: 'happy', pose: 'reach', hold: 'key', z: 1.06,
  act: (o, T, x) => { HL(o, x(156), 1326, 88, 208, T + 0.2, 0.4); D(o, [...circle(x(232), 1440, 14)], T + 0.7, 0.2, {}); D(o, [[x(270), 1250, x(320), 1220], [x(270), 1290, x(330), 1290]], T + 1.0, 0.3, { col: 'hot', w: 10 }); } });
// 24-28 callbacks: payday saves, shop spends what is left
pic(12, payday, 'R', { label: 'EVERY PAYDAY', col: 'ink', ex: 'firm', pose: 'point',
  act: (o, T, x) => {
    D(o, [[x(130), 1000, x(120), 1170, x(290), 1170, x(280), 1000], [x(120), 1000, x(290), 1000]], T - 1.0, 0.3, { nopen: true, col: 'sig', w: 14 });
    HL(o, x(126), 1060, 160, 106, T - 0.7, 0.3, PAL.hi, true);
    D(o, circle(x(205), 830, 70, 50), T + 0.1, 0.5, { col: 'hot', w: 13 });
    coin(o, [[T + 0.3, x(205), 880, 1], [T + 1.0, x(205), 1060, 0], [T + 2, x(205), 1060, 0]], 46);
  } });
pic(13, shop, 'L', { label: 'THEN SPEND', col: 'hot', ex: 'happy', pose: (u) => (u < 0.9 ? walk(u, 1.2) : 'cheer'), hold: 'bag', z: 1.0,
  act: (o, T, x) => { D(o, check(x(200), 1240, 120), T + 0.3, 0.4, { col: 'sig', w: 16 }); D(o, [[x(140), 1360, x(260), 1360]], T + 0.8, 0.3, { col: 'hot', w: 12 }); } });
// 28-32 payoff: home, the sun comes out (end card from 30, the picture keeps playing under it)
pic(14, house, 'L', { label: 'SAVE FIRST', col: 'sig', ex: 'happy', pose: (u) => (Math.floor(u * 2.5) % 2 ? 'cheer' : mixPose('cheer', 'idle', 0.5)), t1: DUR, z: 0.98,
  act: (o, T) => {
    const sx0 = 880, sy0 = 760; D(o, circle(sx0, sy0, 70), T + 0.1, 0.4, { col: 'hot', w: 14 }); HL(o, sx0 - 50, sy0 - 50, 100, 100, T + 0.4, 0.3);
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.5; D(o, [[sx0 + Math.cos(a) * 100, sy0 + Math.sin(a) * 100, sx0 + Math.cos(a) * 150, sy0 + Math.sin(a) * 150]], T + 0.7 + i * 0.12, 0.12, { col: 'hot', w: 12 }); }
    Wr(o, 'home', 280, 1700, { size: 90, anchor: 'c', t0: T + 1.2, dur: 0.6, col: 'sig' });
  } });

shot(SH);
endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model']);
mount(DUR);
