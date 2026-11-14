// =====================================================================
//  sets/sets.js: full places drawn in marker for ANY story (load after engine/look.js). Each recipe draws, before frame 0
//  (t0 -1, no pen): a back wall or sky + horizon (layer 'far'), a floor/ground wash with its line (mid), 3+ generic props,
//  a near-foreground piece that bleeds off an edge (layer 'near'), and its ONE light source (light()). Story objects are
//  yours: draw them with draw()/wash() in the same line and colours.
//
//    interior(cx, floor, o)   a room: wall + skirting, window or lamp light, shelf, picture, table, plant, chair
//    outdoor(cx, ground, o)   land: sky band, sun or moon, far hills, trees, rocks, fence, grass in front
//    street(cx, ground, o)    town: sky, far rooftops with lit windows, pavement + kerb, street lamp, bench, bin, sign post
//    o = { mood: 'day'|'warm'|'cold'|'night'|'tense'|'gold' (colours + light), light: 'lamp'|'window'|'sun'|'moon'|'fire'|'none',
//          lx (light x offset), props: { L: name, R: name } (override the two mid props), w: half width (1500), t0 (-1) }
//    prop(name, x, y, u, o)   one generic prop, feet at (x, y), u = size (1 matches Max at s 0.55): table chair plant lamp shelf
//                             window picture door tree rock bench streetlamp bin post fence crate building hill curtain grass
//  The camera frames cx (the scene centre). Put Max at cx - 250 .. cx + 250, feet on the floor line; the props sit outside that.
// =====================================================================
const SETC = {   // wall, low wall, floor, floor edge, sky top, sky low, far hills / roofs, ground, prop wood, leaf
  day:   ['#eadfca', '#dccbb0', '#c9b293', '#a58d6e', '#bcd4e6', '#e9eef0', '#a9b8c4', '#b9c48f', '#b07a4a', '#5f9a5a'],
  warm:  ['#ecc995', '#dcb07a', '#b98a5c', '#8e6440', '#f2c48a', '#f7dfb7', '#c99b77', '#c4ad6c', '#a2663a', '#6c8f4a'],
  gold:  ['#f2d49a', '#e5bb73', '#c8945a', '#9d6c3c', '#f6c983', '#fbe5b5', '#d6a774', '#cdb46a', '#a2663a', '#729a4c'],
  cold:  ['#bfcbd8', '#a9b7c7', '#8b98a8', '#6c7888', '#9fb6cc', '#d8e2ea', '#8597ab', '#dfe7ee', '#7b6a5c', '#4f7a66'],
  tense: ['#c8a79c', '#b38f84', '#8f6f68', '#6e5350', '#b9a0a0', '#dccaca', '#8b7378', '#a99a86', '#6f4e3c', '#5a6e4e'],
  night: ['#4d5a78', '#414c66', '#363e52', '#262c3c', '#27304a', '#3e4a6a', '#1f2638', '#c9d3e0', '#4f4038', '#2f4a44'],
};
const LIGHTC = { lamp: '#ffd27a', window: '#fff1c9', sun: '#ffe08a', moon: '#cfe0ff', fire: '#ffa448' };
const _sc = (o) => SETC[o.mood || 'day'] || SETC.day;
const _T = (o) => o.t0 ?? -1;
const _D = (shapes, o, opt = {}) => draw(shapes, _T(o), 0.2, { nopen: true, w: 10, ...opt });
const _F = (poly, col, o, opt = {}) => wash(poly, col, _T(o), 0.2, opt);
function prop(name, x, y, u = 1, o = {}) {
  const C = _sc(o), L = { layer: o.layer }, Lw = { layer: o.layer, w: o.lw ?? 10 }, s = u;
  const P = {
    table() { _F(rectW(x - 170 * s, y - 210 * s, 340 * s, 26 * s), C[8], o, L); _D([[x - 175 * s, y - 210 * s, x + 175 * s, y - 210 * s], [x - 140 * s, y - 186 * s, x - 140 * s, y], [x + 140 * s, y - 186 * s, x + 140 * s, y], [x - 175 * s, y - 184 * s, x + 175 * s, y - 184 * s]], o, Lw); },
    chair() { _F(rectW(x - 70 * s, y - 150 * s, 140 * s, 20 * s), C[8], o, L); _D([[x - 70 * s, y, x - 70 * s, y - 150 * s, x + 70 * s, y - 150 * s, x + 70 * s, y], [x + 70 * s, y - 150 * s, x + 76 * s, y - 300 * s], [x + 50 * s, y - 260 * s, x + 74 * s, y - 262 * s]], o, Lw); },
    plant() { _F([x - 60 * s, y - 120 * s, x + 60 * s, y - 120 * s, x + 46 * s, y, x - 46 * s, y], C[8], o, L); _F(ellW(x, y - 220 * s, 120 * s, 110 * s), C[9], o, L); _D([[x - 60 * s, y - 120 * s, x + 60 * s, y - 120 * s, x + 46 * s, y, x - 46 * s, y, x - 60 * s, y - 120 * s], ...curve([x, y - 120 * s, x - 70 * s, y - 230 * s, x - 110 * s, y - 300 * s], 6), ...curve([x, y - 120 * s, x + 50 * s, y - 250 * s, x + 100 * s, y - 310 * s], 6), ...curve([x, y - 120 * s, x, y - 330 * s], 4)], o, Lw); },
    lamp() { _F([x - 105 * s, y - 425 * s, x + 105 * s, y - 425 * s, x + 330 * s, y + 30 * s, x - 330 * s, y + 30 * s], '#fff0b8', o, { ...L, a: 0.38 }); _F(ellW(x, y + 20 * s, 360 * s, 60 * s), '#fff0b8', o, { ...L, a: 0.5 }); _F([x - 80 * s, y - 520 * s, x + 80 * s, y - 520 * s, x + 110 * s, y - 420 * s, x - 110 * s, y - 420 * s], '#f6d27c', o, L); _D([[x - 80 * s, y - 520 * s, x + 80 * s, y - 520 * s, x + 110 * s, y - 420 * s, x - 110 * s, y - 420 * s, x - 80 * s, y - 520 * s], [x, y - 420 * s, x, y], [x - 70 * s, y, x + 70 * s, y]], o, Lw); },
    shelf() { _F(rectW(x - 190 * s, y - 14 * s, 380 * s, 22 * s), C[8], o, L); for (let i = 0; i < 6; i++) { const bx = x - 170 * s + i * 52 * s, bh = (90 + (i * 37) % 50) * s; _F(rectW(bx, y - 14 * s - bh, 40 * s, bh), ['#c8553d', '#2c6e7a', '#d9a43b', '#5b4a7a', '#8a9a5b', '#b55a74'][i], o, L); _D([[bx, y - 14 * s, bx, y - 14 * s - bh, bx + 40 * s, y - 14 * s - bh, bx + 40 * s, y - 14 * s]], o, { ...Lw, w: 6 }); } _D([[x - 190 * s, y - 14 * s, x + 190 * s, y - 14 * s]], o, Lw); },
    window() { const sky = o.mood === 'night' ? '#26325a' : C[4]; _F(rectW(x - 150 * s, y - 340 * s, 300 * s, 340 * s), sky, o, { ...L, grad: o.mood === 'night' ? '#3d4c7a' : C[5] }); _F([x - 150 * s, y, x - 150 * s, y - 90 * s, x - 60 * s, y - 140 * s, x + 40 * s, y - 100 * s, x + 150 * s, y - 150 * s, x + 150 * s, y], C[6], o, L); _F(ellW(x + 70 * s, y - 250 * s, 34 * s), o.mood === 'night' ? '#eef3ff' : '#ffe08a', o, L); _D([...box(x - 150 * s, y - 340 * s, 300 * s, 340 * s, 6), [x, y - 340 * s, x, y], [x - 150 * s, y - 170 * s, x + 150 * s, y - 170 * s], [x - 180 * s, y + 8 * s, x + 180 * s, y + 8 * s]], o, Lw); },
    picture() { _F(rectW(x - 80 * s, y - 120 * s, 160 * s, 120 * s), C[5], o, L); _F([x - 70 * s, y - 10 * s, x - 20 * s, y - 80 * s, x + 20 * s, y - 40 * s, x + 40 * s, y - 60 * s, x + 70 * s, y - 10 * s], C[6], o, L); _D(box(x - 80 * s, y - 120 * s, 160 * s, 120 * s, 4), o, Lw); },
    door() { _F(rectW(x - 120 * s, y - 560 * s, 240 * s, 560 * s), C[8], o, L); _D([...box(x - 120 * s, y - 560 * s, 240 * s, 560 * s, 4), ...circle(x + 80 * s, y - 270 * s, 12 * s)], o, Lw); },
    tree() { _F([x - 26 * s, y, x - 18 * s, y - 330 * s, x + 18 * s, y - 330 * s, x + 26 * s, y], C[8], o, L); _F(ellW(x, y - 470 * s, 210 * s, 190 * s), C[9], o, L); _F(ellW(x - 110 * s, y - 380 * s, 120 * s, 100 * s), C[9], o, L); _D([[x - 26 * s, y, x - 18 * s, y - 330 * s], [x + 26 * s, y, x + 18 * s, y - 330 * s], ...curve([x - 220 * s, y - 360 * s, x - 200 * s, y - 560 * s, x, y - 670 * s, x + 200 * s, y - 590 * s, x + 220 * s, y - 400 * s, x + 120 * s, y - 310 * s], 7)], o, Lw); },
    rock() { const p = [x - 120 * s, y, x - 100 * s, y - 70 * s, x - 30 * s, y - 120 * s, x + 60 * s, y - 100 * s, x + 120 * s, y]; _F(p, C[6], o, L); _D([p], o, Lw); },
    bench() { _F(rectW(x - 160 * s, y - 120 * s, 320 * s, 22 * s), C[8], o, L); _F(rectW(x - 160 * s, y - 210 * s, 320 * s, 40 * s), C[8], o, L); _D([[x - 160 * s, y - 120 * s, x + 160 * s, y - 120 * s], [x - 130 * s, y - 98 * s, x - 130 * s, y], [x + 130 * s, y - 98 * s, x + 130 * s, y], ...box(x - 160 * s, y - 210 * s, 320 * s, 40 * s, 4), [x - 130 * s, y - 170 * s, x - 130 * s, y - 120 * s], [x + 130 * s, y - 170 * s, x + 130 * s, y - 120 * s]], o, Lw); },
    streetlamp() { _F([x - 65 * s, y - 695 * s, x + 65 * s, y - 695 * s, x + 380 * s, y + 40 * s, x - 380 * s, y + 40 * s], '#ffe9a8', o, { ...L, a: 0.22 }); _F(ellW(x, y + 30 * s, 420 * s, 70 * s), '#ffe9a8', o, { ...L, a: 0.35 }); _F([x - 50 * s, y - 760 * s, x + 50 * s, y - 760 * s, x + 70 * s, y - 690 * s, x - 70 * s, y - 690 * s], '#ffe39a', o, L); _D([[x, y, x, y - 690 * s], [x - 50 * s, y - 760 * s, x + 50 * s, y - 760 * s, x + 70 * s, y - 690 * s, x - 70 * s, y - 690 * s, x - 50 * s, y - 760 * s], [x - 40 * s, y, x + 40 * s, y]], o, { ...Lw, w: 12 }); },
    bin() { _F([x - 60 * s, y - 160 * s, x + 60 * s, y - 160 * s, x + 50 * s, y, x - 50 * s, y], '#4f6b5a', o, L); _D([[x - 66 * s, y - 160 * s, x + 66 * s, y - 160 * s], [x - 60 * s, y - 160 * s, x - 50 * s, y, x + 50 * s, y, x + 60 * s, y - 160 * s], [x - 20 * s, y - 130 * s, x - 18 * s, y - 30 * s], [x + 20 * s, y - 130 * s, x + 18 * s, y - 30 * s]], o, Lw); },
    post() { _F(rectW(x - 90 * s, y - 520 * s, 180 * s, 110 * s), '#2f6f8a', o, L); _D([[x, y, x, y - 410 * s], ...box(x - 90 * s, y - 520 * s, 180 * s, 110 * s, 8)], o, Lw); },
    fence() { for (let i = 0; i < 5; i++) _D([[x - 200 * s + i * 100 * s, y, x - 200 * s + i * 100 * s, y - 150 * s]], o, Lw); _D([[x - 230 * s, y - 120 * s, x + 230 * s, y - 120 * s], [x - 230 * s, y - 60 * s, x + 230 * s, y - 60 * s]], o, Lw); },
    curtain() { _F([x - 160 * s, y - 900 * s, x + 120 * s, y - 900 * s, x + 60 * s, y - 300 * s, x + 140 * s, y, x - 160 * s, y], o.col || '#7a3b3b', o, { ...L, grad: '#4a2228' }); _D([...curve([x + 120 * s, y - 900 * s, x + 60 * s, y - 300 * s, x + 140 * s, y], 6), ...curve([x + 20 * s, y - 880 * s, x - 10 * s, y - 400 * s, x + 50 * s, y - 20 * s], 6), ...curve([x - 70 * s, y - 880 * s, x - 90 * s, y - 380 * s, x - 50 * s, y - 20 * s], 6)], o, Lw); },
    grass() { for (let i = 0; i < 9; i++) { const gx = x - 260 * s + i * 65 * s, h = (110 + (i * 53) % 90) * s; _F([gx - 26 * s, y, gx + 6 * s, y - h, gx + 26 * s, y], C[9], o, L); _D([[gx - 26 * s, y, gx + 6 * s, y - h, gx + 26 * s, y]], o, Lw); } },
    crate() { _F(rectW(x - 90 * s, y - 160 * s, 180 * s, 160 * s), C[8], o, L); _D([...box(x - 90 * s, y - 160 * s, 180 * s, 160 * s, 4), [x - 90 * s, y - 160 * s, x + 90 * s, y], [x + 90 * s, y - 160 * s, x - 90 * s, y]], o, Lw); },
    building() { const h = (o.h ?? 700) * s, bw = 300 * s; _F(rectW(x - bw / 2, y - h, bw, h), C[6], o, L); _D([[x - bw / 2, y, x - bw / 2, y - h, x + bw / 2, y - h, x + bw / 2, y]], o, Lw);
      for (let r = 0; r < Math.floor(h / (120 * s)) - 1; r++) for (let k = 0; k < 2; k++) { const wx = x - bw / 2 + 50 * s + k * 130 * s, wy = y - h + 60 * s + r * 120 * s, lit = ((r * 3 + k * 5 + Math.round(x)) % 3) === 0; _F(rectW(wx, wy, 70 * s, 70 * s), lit ? '#ffd87a' : C[1], o, L); } },
    hill() { const p = [x - 700 * s, y, x - 400 * s, y - 180 * s, x - 100 * s, y - 260 * s, x + 250 * s, y - 160 * s, x + 700 * s, y]; _F(p, C[6], o, L); _D(curve(p.slice(0, 10), 6), o, Lw); },
  };
  (P[name] || P.crate)();
}
function _ground(cx, y, o, w) {   // the floor/ground: a wash, its line, a few marks, the contact zone
  const C = _sc(o), gcol = o.ground || C[2];
  _F(rectW(cx - w, y, 2 * w, 900), gcol, o, { grad: o.groundLow || C[3] });
  _D([[cx - w, y, cx - w / 3, y + 3, cx + w / 3, y - 2, cx + w, y + 2]], o, { w: 12 });
  for (let i = 0; i < 6; i++) { const x = cx - w * 0.85 + i * w * 0.34; _D([[x, y + 70 + (i % 3) * 50, x + 160, y + 70 + (i % 3) * 50]], o, { w: 7, col: C[3] }); }
}
function _lightOf(o, x, y, defKind) {
  const k = o.light ?? defKind; if (k === 'none') return;
  light({ x, y, col: LIGHTC[k] || '#ffd27a', r: k === 'sun' || k === 'moon' ? 900 : 620, kind: k, layer: k === 'sun' || k === 'moon' || k === 'window' ? 'far' : 'mid' });
}
function interior(cx, F, o = {}) {
  const C = _sc(o), w = o.w ?? 1500, lx = cx + (o.lx ?? -620); anchor(cx, F - 300);
  _F(rectW(cx - w * 1.2, F - 1300, w * 2.4, 1700), C[0], o, { layer: 'far', grad: C[1] });   // back wall (runs on under the floor: no gap when the layers slide)
  _F(rectW(cx - w * 1.2, F - 190, w * 2.4, 590), C[1], o, { layer: 'far' });                 // wainscot
  _D([[cx - w * 1.2, F - 190, cx + w * 1.2, F - 190]], o, { layer: 'far', w: 9 });
  const winK = (o.light ?? 'lamp') === 'window';
  prop('window', winK ? lx : cx + 520, F - 330, 1.2, { ...o, layer: 'far' });
  const wp = o.wallProps ?? ['shelf', 'picture'];   // [] keeps the back wall free for a board, a map, a poster of the story
  if (wp.includes('shelf')) prop('shelf', cx - 80, F - 560, 1.1, { ...o, layer: 'far' });
  if (wp.includes('picture')) prop('picture', winK ? cx + 560 : cx - 560, F - 420, 1.1, { ...o, layer: 'far' });
  _ground(cx, F, o, w * 1.2);
  prop(o.props?.L || (winK ? 'plant' : 'lamp'), winK ? cx - 700 : lx, F, 1, o);
  prop(o.props?.R || 'table', cx + 640, F, 1, o);
  prop('chair', cx + 900, F, 1, o);
  prop(o.near || 'curtain', cx - 940, F + 120, 1.2, { ...o, layer: 'near' });               // near: a soft curtain bleeding off the left edge
  _lightOf(o, winK ? lx : lx, winK ? F - 900 : F - 470, 'lamp');
  air('dust', { x: cx - 1000, y: F - 900, w: 2000, h: 900, n: 40 });
}
function outdoor(cx, G, o = {}) {
  const C = _sc(o), w = o.w ?? 1500, sk = o.light ?? (o.mood === 'night' ? 'moon' : 'sun'), lx = cx + (o.lx ?? 560); anchor(cx, G - 300);
  _F(rectW(cx - w * 1.3, G - 1500, w * 2.6, 1900), C[4], o, { layer: 'far', grad: C[5] });
  if (sk !== 'none') { _F(ellW(lx, G - 760, 85), sk === 'moon' ? '#eef3ff' : '#ffd36a', o, { layer: 'far' }); _D(circle(lx, G - 760, 85), o, { layer: 'far', w: 10 }); }
  prop('hill', cx - 650, G, 1.2, { ...o, layer: 'far' }); prop('hill', cx + 700, G, 0.9, { ...o, layer: 'far' });
  _ground(cx, G, o, w * 1.3);
  prop(o.props?.L || 'tree', cx - 720, G, 1, o); prop(o.props?.R || 'rock', cx + 620, G, 1, o); prop('fence', cx + 980, G, 1, o);
  prop(o.near || 'grass', cx + 1000, G + 330, 1.6, { ...o, layer: 'near' });
  _lightOf(o, lx, G - 760, sk);
}
function street(cx, G, o = {}) {
  const C = _sc(o), w = o.w ?? 1500, lx = cx + (o.lx ?? -560); anchor(cx, G - 300);
  _F(rectW(cx - w * 1.3, G - 1500, w * 2.6, 1500), C[4], o, { layer: 'far', grad: C[5] });
  [[-1050, 760], [-720, 560], [-380, 840], [-40, 620], [300, 900], [640, 580], [980, 780]].forEach(([dx, h]) => prop('building', cx + dx, G - 60, 1, { ...o, h, layer: 'far' }));
  _F(rectW(cx - w * 1.3, G - 60, w * 2.6, 460), C[1], o, { layer: 'far' });
  _ground(cx, G, { ...o, ground: o.mood === 'night' ? '#59627a' : '#a7a9ae', groundLow: o.mood === 'night' ? '#3a4052' : '#85878d' }, w * 1.3);
  _D([[cx - w * 1.3, G + 120, cx + w * 1.3, G + 120]], o, { w: 9 });   // kerb
  prop('streetlamp', lx, G, 1, o); prop(o.props?.R || 'bench', cx + 620, G, 1, o); prop(o.props?.L || 'bin', lx - 260, G, 1, o); prop('post', cx + 960, G, 1, o);
  prop(o.near || 'bin', cx + 1100, G + 380, 2.3, { ...o, layer: 'near' });
  _lightOf(o, lx, G - 720, 'lamp');
}
