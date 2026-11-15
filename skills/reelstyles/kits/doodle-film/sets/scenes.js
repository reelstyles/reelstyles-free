// =====================================================================
//  sets/scenes.js: scene recipes (11-14). One call gives a full, lit set in 3 depth layers for any place:
//  a far layer (sky + horizon, or the back wall), the floor, 3+ props, and a near foreground that frames the edges.
//    setOutdoor(o) · setRoom(o) · setStreet(o)      o = { x0, x1, hero, grade, floor, props, fg, air }
//      x0..x1  world span to fill (cover the camera's whole move)     hero  the hero's x: props and foreground keep 260 px off it
//      grade   one of GRADES (engine/look.js); the recipe calls look() with its own light unless o.light is given
//      props   override the default prop list: [[name, x], ...]  (names below; any prop is also a plain function)
//      fg      false = no near foreground          back  fn drawn in the far layer after the sky (a rainbow, a skyline)
//    returns { floor: (x) → y, light: [x, y] }: pass floor as pip({ ground: S.floor }) so the feet stand on it.
//  Props (world x, floor y): windowP, shelf, lampFloor, plant, table, chair, rug, picture, house, lampPost, fence, bush, rock, hill.
//  Backdrop pieces may bleed off an edge (unmeasured); the hero never does.
// =====================================================================
const FLOOR = 860;
const flatFloor = (y = FLOOR) => () => y;
const _bg = (fn) => unmeasured(fn);
const _keep = (x, hero, d = 260) => hero == null || Math.abs(x - hero) > d;

// ---- props (each one reads at a glance: bold outline, one marker colour, a hatch)
function windowP(x, y, w = 300, h = 340, o = {}) {
  const G = gradeOf(), r = rectP(x - w / 2, y - h, w, h);
  fillLoose(r, { c: G.sky, seed: 31, hatch: false, a: 0.95, off: [3, 3] });
  if (o.sun !== false && LOOK && /day|golden|dawn/.test(LOOK.grade)) { glow(x + w * 0.2, y - h * 0.7, 90, '255,224,138', 0.7); }
  if (LOOK && LOOK.grade === 'rain') { ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2, y - h, w, h); ctx.clip();
    for (let i = 0; i < 22; i++) { const rx = x - w / 2 + hash(i * 3.1) * w, ry = y - h + ((hash(i * 7.7) * h + TT * 420) % h); ink([[rx, ry], [rx - 8, ry + 50]], { c: PAL.white, w: 5, seed: i, dbl: false, a: 0.95 }); ink([[rx + 3, ry + 3], [rx - 5, ry + 53]], { c: '#4E6488', w: 2.5, seed: i + 30, dbl: false, a: 0.7 }); }
    for (let i = 0; i < 6; i++) { const dx = x - w / 2 + 20 + hash(i * 9.3) * (w - 40), dy = y - h + ((hash(i * 4.1) * h + TT * 90) % h); fillLoose(ellP(dx, dy, 8, 11, 10), { c: PAL.white, hatch: false, off: [1, 1], seed: i }); }   // drops running down the glass
    ctx.restore(); }
  ink(r, { w: 8, seed: 32 }); ink([[x, y - h], [x, y]], { w: 6, seed: 33, dbl: false }); ink([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2]], { w: 6, seed: 34, dbl: false });
  shape(rectP(x - w / 2 - 24, y - 4, w + 48, 22), { c: PAL.white, seed: 35, hatch: false, w: 5 });            // sill
  const sw = Math.sin(TT * 1.1) * 6;                                                                         // curtains breathe
  [-1, 1].forEach((d, i) => shape(splineP([[x + d * (w / 2 + 10), y - h - 30], [x + d * (w / 2 - 40) + sw, y - h * 0.5], [x + d * (w / 2 - 20), y - 10], [x + d * (w / 2 + 40), y - 10], [x + d * (w / 2 + 44), y - h - 30], [x + d * (w / 2 + 10), y - h - 30]], 5), { c: PAL.lilac, seed: 36 + i, hc: PAL.night, w: 5 }));
  ink([[x - w / 2 - 70, y - h - 34], [x + w / 2 + 70, y - h - 34]], { w: 9, seed: 39, dbl: false });
}
function shelf(x, y, w = 280) {
  shape(rectP(x - w / 2, y, w, 18), { c: '#C98F5E', seed: 41, w: 5, hatch: false });
  const cols = [PAL.coral, PAL.teal, PAL.mustard, PAL.lilac, PAL.coral, PAL.mint]; let bx = x - w / 2 + 16;
  cols.forEach((c, i) => { const bw = 26 + hash(i * 2.2) * 14, bh = 70 + hash(i * 4.4) * 40; shape(rectP(bx, y - bh, bw, bh), { c, seed: 42 + i, w: 4, hatch: false }); bx += bw + 4; });
  shape(splineP([[bx + 20, y], [bx + 14, y - 50], [bx + 60, y - 50], [bx + 54, y], [bx + 20, y]], 3), { c: PAL.teal, seed: 49, w: 4 });
}
function lampFloor(x, y, on = true) {                                                                          // the room's light source
  ink([[x, y], [x, y - 360]], { w: 10, seed: 51, dbl: false }); shape(ellP(x, y - 6, 60, 14, 16), { c: PAL.pencil, seed: 52, hatch: false, w: 5 });
  const shade = [[x - 80, y - 360], [x - 50, y - 460], [x + 50, y - 460], [x + 80, y - 360], [x - 80, y - 360]];
  if (on) glow(x, y - 380, 260 + Math.sin(TT * 3) * 8, '255,214,140', 0.75);
  shape(shade, { c: PAL.mustard, seed: 53, hc: PAL.coral, w: 6 });
  return [x, y - 400];
}
function plant(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const sw = Math.sin(TT * 1.4 + x) * 0.05;
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.38 + sw, L = 150 + hash(i * 1.3) * 70; const tip = [Math.cos(a) * L, -70 + Math.sin(a) * L];
    shape(splineP([[0, -70], [tip[0] * 0.5 - 22, -70 + (tip[1] + 70) * 0.5], tip, [tip[0] * 0.5 + 22, -70 + (tip[1] + 70) * 0.5], [0, -70]], 4), { c: PAL.teal, seed: 61 + i, hc: PAL.mint, w: 4 }); }
  shape(splineP([[-56, -80], [-44, 0], [44, 0], [56, -80], [-56, -80]], 3), { c: PAL.coral, seed: 68, w: 6 });
  ctx.restore();
}
function table(x, y, w = 300) {
  ink([[x - w / 2 + 20, y - 170], [x - w / 2 + 26, y]], { w: 10, seed: 71, dbl: false }); ink([[x + w / 2 - 20, y - 170], [x + w / 2 - 26, y]], { w: 10, seed: 72, dbl: false });
  shape(rectP(x - w / 2, y - 190, w, 26), { c: '#C98F5E', seed: 73, w: 6 });
  return y - 190;
}
function chair(x, y, face = 1) {
  ink([[x - 50, y], [x - 50, y - 120]], { w: 9, seed: 74, dbl: false }); ink([[x + 50, y], [x + 50, y - 120]], { w: 9, seed: 75, dbl: false });
  shape(rectP(x - 60, y - 130, 120, 20), { c: PAL.teal, seed: 76, w: 5, hatch: false });
  shape(rectP(x - face * 60 - 10, y - 300, 20, 180), { c: PAL.teal, seed: 77, w: 5, hatch: false });
}
function rug(x, y, w = 520) { const r = ellP(x, y + 30, w / 2, 40, 30); fillLoose(r, { c: PAL.coral, seed: 78, hc: PAL.mustard, a: 0.85 }); ink(r, { w: 5, seed: 79 }); ink(ellP(x, y + 30, w / 2 - 40, 24, 30), { c: PAL.mustard, w: 5, seed: 80, dbl: false }); }
function picture(x, y, w = 180, h = 140) {
  shape(rectP(x - w / 2, y - h / 2, w, h), { c: PAL.white, seed: 81, hatch: false, w: 7 });
  shape([[x - w / 2 + 14, y + h / 2 - 14], [x - 20, y - h / 2 + 30], [x + 10, y], [x + 40, y - 20], [x + w / 2 - 14, y + h / 2 - 14], [x - w / 2 + 14, y + h / 2 - 14]], { c: PAL.teal, seed: 82, w: 4, hatch: false });
  fillLoose(ellP(x + w / 2 - 40, y - h / 2 + 34, 16, 16, 12), { c: PAL.mustard, hatch: false, seed: 83 });
}
function house(x, y, w = 340, h = 300, c = PAL.coral, k = 0) {
  const lit = LOOK && /rain|dusk|night/.test(LOOK.grade);
  shape(rectP(x - w / 2, y - h, w, h), { c, seed: 90 + k, hc: PAL.ink, w: 7, gap: 34 });
  shape([[x - w / 2 - 34, y - h], [x, y - h - 170], [x + w / 2 + 34, y - h], [x - w / 2 - 34, y - h]], { c: k % 2 ? PAL.teal : PAL.night, seed: 91 + k, w: 7, hc: PAL.ink });
  shape(rectP(x - 45, y - 150, 90, 150), { c: PAL.lilac, seed: 92 + k, w: 6, hatch: false });
  [-1, 1].forEach((d, i) => { const wx = x + d * w * 0.3 - 40, wy = y - h + 50; if (lit) glow(wx + 40, wy + 40, 90, '255,214,140', 0.6);
    shape(rectP(wx, wy, 80, 80), { c: lit ? PAL.glow : PAL.sky, seed: 93 + k + i, w: 6, hatch: false }); ink([[wx + 40, wy], [wx + 40, wy + 80]], { w: 4, seed: 95 + i, dbl: false }); });
}
function lampPost(x, y) {                                                                                      // a street's light source
  ink([[x, y], [x + 4, y - 520]], { w: 14, seed: 101, dbl: false }); ink(splineP([[x + 4, y - 520], [x + 40, y - 560], [x + 90, y - 540]]), { w: 10, seed: 102, dbl: false });
  glow(x + 90, y - 500, 240 + Math.sin(TT * 3) * 8, '255,224,138', 0.7);
  shape([[x + 60, y - 540], [x + 120, y - 540], [x + 108, y - 490], [x + 72, y - 490], [x + 60, y - 540]], { c: PAL.glow, seed: 103, hc: PAL.mustard, w: 6 });
  return [x + 90, y - 510];
}
function fence(x0, x1, y) { for (let x = x0; x <= x1; x += 70) shape(rectP(x - 12, y - 150, 26, 150), { c: PAL.white, seed: x * 0.1, hatch: false, w: 5 }); ink([[x0 - 20, y - 110], [x1 + 30, y - 110]], { w: 8, seed: 104, dbl: false }); ink([[x0 - 20, y - 50], [x1 + 30, y - 50]], { w: 8, seed: 105, dbl: false }); }
function bush(x, y, s = 1) { const b = blobP(x, y - 60 * s, 110 * s, x * 0.01, 7, 0.24); fillLoose(b, { c: PAL.teal, seed: x * 0.02, hc: PAL.mint, a: 0.9 }); ink(b, { w: 6, seed: x * 0.03 }); [0, 1, 2].forEach((i) => fillLoose(ellP(x - 50 * s + i * 50 * s, y - 70 * s - (i % 2) * 40 * s, 10, 10, 10), { c: PAL.coral, hatch: false, seed: i })); }
function rock(x, y, s = 1) { const b = splineP([[x - 70 * s, y], [x - 50 * s, y - 60 * s], [x + 10 * s, y - 80 * s], [x + 70 * s, y - 30 * s], [x + 80 * s, y], [x - 70 * s, y]], 4); shape(b, { c: PAL.faint, seed: x * 0.01, hc: PAL.pencil, w: 6 }); }
function hill(x, y, w, h, c, k = 0) { const p = splineP([[x - w / 2, y], [x - w / 4, y - h * 0.8], [x, y - h], [x + w / 4, y - h * 0.7], [x + w / 2, y]], 6); fillLoose(p.concat([[x + w / 2, y + 400], [x - w / 2, y + 400]]), { c, seed: 110 + k, hc: PAL.teal, a: 0.85, gap: 40 }); ink(p, { w: 6, seed: 111 + k }); }

// near foreground: big bold shapes at the frame's lower corners (depth layer 1.4), never within 260 px of the hero
function nearFG(hero, kind = 'grass') {
  if (!CAM0) return; const hw = W / 2 / CAM0[2], yb = CAM0[1] + H / 2 / CAM0[2];
  layer(1.4, () => _bg(() => [CAM0[0] - hw + 70, CAM0[0] + hw - 70].forEach((x, i) => { if (!_keep(x, hero, 380)) return;
    if (kind === 'grass') for (let j = 0; j < 5; j++) { const sw = Math.sin(TT * 2 + j + i) * 10, d = i ? -1 : 1; ink(splineP([[x + d * j * 22, yb + 40], [x + d * (j * 30 - 10) + sw * 0.5, yb - 80], [x + d * (j * 40 - 20) + sw, yb - 170 - j * 14]]), { w: 14, seed: 120 + j + i * 7, dbl: false, c: PAL.teal }); }
    else if (kind === 'leaf') plant(x, yb + 90, 1.3);
    else bush(x, yb + 70, 1.1); })));
}

// ---- recipes
function setRoom(o = {}) {
  const { x0 = -200, x1 = 2400, hero = null, grade = 'cosy', floor = FLOOR, wall = '#F7DEB4', fg = true } = o;
  const props = o.props || [['picture', x0 + 520], ['window', x0 + 1050], ['shelf', x0 + 1700], ['lamp', x0 + 2200], ['plant', x0 + 380], ['rug', null]];
  let L = null; look({ grade });
  layer(0.6, () => _bg(() => {
    wash(x0 - 600, -500, x1 - x0 + 1200, floor + 500, wall, 2, 0.75, true);
    for (let x = x0 - 600; x < x1 + 600; x += 120) ink([[x, -400], [x + 8, floor - 10]], { c: PAL.paperD, w: 6, seed: x * 0.01, dbl: false, a: 0.8 });   // wallpaper
    ink([[x0 - 600, floor - 60], [x1 + 600, floor - 60]], { w: 7, seed: 130, dbl: false });                                                       // skirting
    props.forEach(([n, x]) => { if (n === 'window') windowP(x, floor - 300, 300, 300); if (n === 'shelf') shelf(x, floor - 470); if (n === 'picture') picture(x, floor - 470); });
  }));
  _bg(() => {
    fillLoose([[x0 - 900, floor - 60], [x1 + 900, floor - 60], [x1 + 900, floor + 900], [x0 - 900, floor + 900]], { c: '#D9A473', seed: 131, hc: '#9C6A44', gap: 38, a: 0.9 });
    for (let k = 0; k < 6; k++) ink([[x0 - 900, floor - 20 + k * 60], [x1 + 900, floor - 20 + k * 60]], { c: '#9C6A44', w: 4, seed: 132 + k, dbl: false, a: 0.6 });   // boards
    props.forEach(([n, x]) => { if (n === 'rug') rug(hero ?? (x0 + x1) / 2, floor); if (n === 'lamp') L = lampFloor(x, floor + 10); if (n === 'plant') plant(x, floor + 20, 1.2); if (n === 'table') table(x, floor + 20); if (n === 'chair') chair(x, floor + 20); });
  });
  const light = o.light || L || [x0 + 1050, floor - 500]; look({ grade, light, beams: o.beams ?? 0.6, hero: hero == null ? null : [hero, floor - 220] });
  if (fg) nearFG(hero, 'leaf');
  if (o.air !== false) air(o.air || 'motes', { n: 40 });
  return { floor: flatFloor(floor + 30), light };
}
function setStreet(o = {}) {
  const { x0 = -200, x1 = 2400, hero = null, grade = 'day', floor = FLOOR, fg = true } = o, G = GRADES[grade] || GRADES.day;
  const props = o.props || [['house', x0 + 300], ['house', x0 + 820], ['house', x0 + 1500], ['house', x0 + 2100], ['lampPost', x0 + 1180], ['fence', x0 + 1700], ['bush', x0 + 560]];
  look({ grade }); let L = null;
  layer(0.35, () => _bg(() => { wash(x0 - 900, -900, x1 - x0 + 1800, floor + 900, G.sky, 3, 0.85, true);
    if (o.light && /day|golden|dawn/.test(grade)) sun(o.light[0], o.light[1], 70);
    const far = /golden|dawn/.test(grade) ? '#F2D6BC' : /rain|night|dusk/.test(grade) ? '#C4C6D8' : '#CFE0EA';   // far = pale, no outline (air between)
    for (let x = x0 - 700; x < x1 + 700; x += 260) { const top = floor - 470 - hash(x) * 140;
      fillLoose(rectP(x, top, 200, 600), { c: far, seed: x * 0.01, hatch: false, a: 1, mult: false, off: [0, 0] });
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) fillLoose(rectP(x + 30 + q * 55, top + 40 + r * 90, 24, 30), { c: /rain|dusk|night/.test(grade) ? '#F3E3B0' : PAL.white, hatch: false, seed: r * 3 + q, off: [1, 1], a: 0.7, mult: false }); }
    if (o.back) o.back(); }));                                                                             // your own far piece (rainbow, moon): over the skyline, behind the houses
  let hk = 0;
  layer(0.75, () => _bg(() => props.forEach(([n, x]) => { if (n === 'house') house(x, floor - 70, 340, 300, [PAL.coral, PAL.mustard, PAL.sky, PAL.blush][hk % 4], hk++); })));
  _bg(() => {
    fillLoose([[x0 - 900, floor - 70], [x1 + 900, floor - 70], [x1 + 900, floor + 900], [x0 - 900, floor + 900]], { c: PAL.paperD, seed: 140, hatch: false, a: 0.95 });
    for (let k = 0; k < 5; k++) ink([[x0 - 900, floor - 10 + k * 70], [x1 + 900, floor - 10 + k * 70]], { c: PAL.pencil, w: 3, seed: 142 + k, dbl: false, a: 0.45 });
    ink([[x0 - 900, floor - 70], [x1 + 900, floor - 70]], { w: 7, seed: 141, dbl: false });
    for (let x = x0 - 900; x < x1 + 900; x += 160) ink([[x, floor - 70], [x - 60, floor + 300]], { c: PAL.pencil, w: 3, seed: x * 0.1, dbl: false, a: 0.5 });   // paving
    props.forEach(([n, x]) => { if (n === 'lampPost') L = lampPost(x, floor + 10); if (n === 'fence') fence(x, x + 420, floor + 10); if (n === 'bush') bush(x, floor + 10); if (n === 'rock') rock(x, floor + 10); });
  });
  const light = o.light || L || [x1 - 300, 100]; look({ grade, light, beams: o.beams ?? 0.5, hero: hero == null ? null : [hero, floor - 220] });
  if (fg) nearFG(hero, 'bush');
  if (o.air !== false) air(o.air || (grade === 'rain' ? 'rain' : 'motes'), { n: grade === 'rain' ? 90 : 40 });
  return { floor: flatFloor(floor + 30), light };
}
function setOutdoor(o = {}) {
  const { x0 = -200, x1 = 2400, hero = null, grade = 'day', fg = true } = o, G = GRADES[grade] || GRADES.day;
  const props = o.props || [['tree', x0 + 300], ['tree', x1 - 500], ['fence', x0 + 800], ['rock', x0 + 1500], ['bush', x1 - 900]];
  const L = o.light || [x1 - 600, 220]; look({ grade, light: L, beams: o.beams ?? 0.7, hero: hero == null ? null : [hero, GROUND - 200] });
  layer(0.3, () => _bg(() => { wash(x0 - 1000, -900, x1 - x0 + 2000, GROUND + 900, G.sky, 3, 0.85, true);
    if (/day|golden|dawn/.test(grade)) sun(L[0], L[1], 70); else if (grade === 'night' || grade === 'dusk') moon(L[0], L[1], 60);
    [[x0 + 200, 180], [x0 + 1100, 120], [x1 - 300, 300]].forEach(([x, y]) => cloud(x, y, 0.8, { c: grade === 'night' ? PAL.lilac : PAL.white })); }));
  layer(0.55, () => _bg(() => { hill(x0 + 300, GROUND - 40, 1500, 260, '#B9DFC4', 0); hill(x0 + 1500, GROUND - 30, 1700, 330, '#A8D6BB', 1); hill(x1, GROUND - 40, 1400, 240, '#B9DFC4', 2); }));
  _bg(() => {
    ground(x0 - 900, x1 + 900, { c: G.ground });
    props.forEach(([n, x]) => { if (n === 'tree') tree(x, groundY(x) + 4, 1); if (n === 'fence') fence(x, x + 350, groundY(x) + 10); if (n === 'rock') rock(x, groundY(x) + 14); if (n === 'bush') bush(x, groundY(x) + 12); if (n === 'house') house(x, groundY(x) + 10); });
    for (let x = x0; x < x1; x += 110) if (_keep(x, hero, 120)) tuft(x + hash(x) * 40, groundY(x) + 30 + hash(x * 2) * 40, 0.9);
  });
  if (fg) nearFG(hero, 'grass');
  if (o.air !== false) air(o.air || 'motes', { n: 40 });
  return { floor: groundY, light: L };
}
