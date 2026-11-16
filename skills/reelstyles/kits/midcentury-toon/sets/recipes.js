// =====================================================================
//  sets/recipes.js: generic props + 3 scene recipes that give any story a full, lit set from frame 0:
//  sky or back wall (far, parallax 0.3-0.5), a mid layer, a floor with 3+ props, the subject, a near foreground (1.5),
//  one light, one air layer. Needs engine/look.js and sets/sets.js. All coordinates are world px of the 1920 x 1080 frame
//  (camera default [960, 540, 1]); every layer over-draws so pushes and pans never show an edge.
//    prop(g, name, x, y, s)   one prop standing on y: pine · tree · bush · rock · tent · fence · lamppost · bench · house ·
//                             table · chair · lamp · plant · shelf · crate · sign · log · mailbox · cactus
//    setLand(g, o)    outdoors: o { mood, light {kind,x,y,s,k}, far 'hills'|'peaks'|'city'|'sea', trees true, fy, props, near 'grass'|'pines'|'rocks', air, subject(g, L) }
//    setRoom(g, o)    indoors:  o { mood, light, fy, wall, paper 'dots'|'stripes'|'atoms', window {x,y,w,h}, wallProps [[name,x,y,s]], props, rug, near 'plant'|'curtain', air, subject }
//    setStreet(g, o)  a town:   o { mood, light, fy, shops n, props, near 'hedge'|'rail', air, subject }
//  floor(g) draws marks on the ground behind the props and the light (a ring of stones under a fire, a rug, a path).
//  props = [[name, x, s]] standing on the floor line fy (default 800) or [[name, x, s, y]]. subject(g, L) draws the main
//  character with lit(g, L, [x, footY, height], (c) => drawPresenter(c, pose)). Wide default: presenter s 0.85-1.0.
// =====================================================================
function prop(g, name, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const sd = 700 + (name.length * 37 + Math.round(x)) % 200, S = (pts, fill, o = {}) => shape(g, pts, { fill, line: o.line ?? 4, seed: sd + (o.k || 0), grain: 0.32, breaks: 0.16, shade: o.shade });
  const half = (pts, col) => [{ pts, color: col, alpha: 0.5 }];
  if (name === 'pine') { S(rect(-12, -60, 24, 60), PAL.brown); for (let i = 0; i < 3; i++) S([[-110 + i * 22, -50 - i * 90], [0, -200 - i * 90], [110 - i * 22, -50 - i * 90]], i % 2 ? PAL.olive : PAL.avocadoD, { k: i + 1, shade: half([[0, -400], [200, -400], [200, 0], [0, 0]], PAL.tealDD) }); }
  else if (name === 'tree') { S([[-14, 0], [-10, -150], [10, -150], [14, 0]], PAL.brown); S(spline([[-120, -170], [-90, -290], [0, -330], [100, -280], [120, -170], [0, -130]], true, 6), PAL.avocado, { k: 1, shade: half([[10, -400], [200, -400], [200, -100], [10, -100]], PAL.avocadoD) }); }
  else if (name === 'bush') S(spline([[-90, 0], [-100, -60], [-40, -100], [30, -96], [96, -50], [90, 0]], true, 6), PAL.olive, { shade: half([[10, -120], [120, -120], [120, 0], [10, 0]], PAL.avocadoD) });
  else if (name === 'rock') S([[-90, 0], [-70, -56], [-16, -80], [50, -62], [92, -18], [96, 0]], PAL.chromeD, { shade: half([[20, -90], [120, -90], [120, 0], [20, 0]], PAL.inkSoft) });
  else if (name === 'tent') { S([[-190, 0], [0, -230], [190, 0]], PAL.coral, { shade: half([[0, -240], [220, -240], [220, 0], [0, 0]], PAL.coralD) }); S([[-60, 0], [0, -120], [60, 0]], PAL.ink, { k: 1, line: 0 }); ink(g, [[0, -230], [0, -270]], 5, { seed: sd + 2, taper: false }); }
  else if (name === 'fence') { for (let i = 0; i < 6; i++) S([[-150 + i * 60, 0], [-150 + i * 60, -100], [-132 + i * 60, -116], [-114 + i * 60, -100], [-114 + i * 60, 0]], PAL.white, { k: i, line: 3 }); S(rect(-160, -78, 330, 14), PAL.white, { k: 9, line: 3 }); }
  else if (name === 'lamppost') { ink(g, [[0, 0], [0, -420]], 12, { seed: sd, taper: false, wob: 0.1 }); S([[-34, -420], [34, -420], [22, -470], [-22, -470]], PAL.denim, { k: 1 }); S(ellipse(0, -400, 22, 22, 16), PAL.mustardL, { k: 2, line: 3 }); }
  else if (name === 'bench') { S(rect(-120, -64, 240, 16), PAL.kraft); S(rect(-120, -120, 240, 14), PAL.kraft, { k: 1 }); ink(g, [[-100, -48], [-104, 0]], 6, { seed: sd + 3, taper: false }); ink(g, [[100, -48], [104, 0]], 6, { seed: sd + 4, taper: false }); }
  else if (name === 'house') { S(rect(-150, -200, 300, 200), PAL.mustardL, { shade: half([[60, -220], [200, -220], [200, 0], [60, 0]], PAL.mustard) }); S([[-180, -196], [0, -330], [180, -196]], PAL.coralD, { k: 1 }); S(rect(-30, -110, 60, 110), PAL.denim, { k: 2 }); S(rect(-120, -150, 60, 50), PAL.sky, { k: 3, line: 3 }); S(rect(60, -150, 60, 50), PAL.sky, { k: 4, line: 3 }); }
  else if (name === 'table') { S(rrect(-130, -110, 260, 22, 8), PAL.teal); [-100, 100].forEach((d, i) => ink(g, [[d, -90], [d * 1.1, 0]], 8, { seed: sd + 5 + i, taper: false })); }
  else if (name === 'chair') { S(spline([[-60, -90], [60, -90], [56, -70], [-56, -70]], true, 3), PAL.mustard); S(spline([[-56, -100], [-70, -200], [40, -210], [60, -100]], true, 4), PAL.mustard, { k: 1 }); [-40, 40].forEach((d, i) => ink(g, [[d, -72], [d * 1.4, 0]], 5, { seed: sd + 6 + i, taper: false })); }
  else if (name === 'lamp') lampStd(g, 0, 0, 1);
  else if (name === 'plant') plant(g, 0, 0, 1, TT);
  else if (name === 'shelf') { S(rect(-120, -260, 240, 260), PAL.kraft, { shade: half([[40, -280], [140, -280], [140, 0], [40, 0]], PAL.kraftD) }); for (let i = 0; i < 3; i++) { S(rect(-104, -240 + i * 80, 208, 8), PAL.kraftD, { k: 10 + i, line: 0 }); for (let j = 0; j < 5; j++) S(rect(-96 + j * 30, -296 + i * 80 + 56 - (j % 2) * 10, 22, 58 + (j % 2) * 10 - 6), [PAL.coral, PAL.teal, PAL.mustard, PAL.denim, PAL.olive][(i + j) % 5], { k: 20 + i * 5 + j, line: 2.4 }); } }
  else if (name === 'crate') { S(rect(-70, -120, 140, 120), PAL.kraftL, { shade: half([[30, -130], [90, -130], [90, 0], [30, 0]], PAL.kraft) }); ink(g, [[-60, -110], [60, -10]], 4, { seed: sd + 7 }); }
  else if (name === 'sign') { ink(g, [[0, 0], [0, -200]], 10, { seed: sd, taper: false }); S(rrect(-90, -260, 180, 80, 10), PAL.coral, { k: 1 }); star(g, -56, -220, 14, { n: 8, inner: 0.4, fill: PAL.white, off: [0, 0] }); }
  else if (name === 'log') { S(rrect(-110, -50, 220, 50, 24), PAL.brown); S(ellipse(-96, -25, 18, 24, 16), PAL.kraftL, { k: 1, line: 3 }); }
  else if (name === 'mailbox') { ink(g, [[0, 0], [0, -110]], 9, { seed: sd, taper: false }); S(rrect(-50, -170, 100, 64, 26), PAL.denim, { k: 1 }); S(rect(40, -200, 8, 40), PAL.coral, { k: 2, line: 2 }); }
  else if (name === 'cactus') { S(rrect(-26, -240, 52, 240, 26), PAL.olive); S(rrect(-80, -170, 34, 90, 17), PAL.olive, { k: 1 }); S(rrect(46, -200, 34, 90, 17), PAL.olive, { k: 2 }); }
  g.restore();
}
const lkProps = (g, list, fy) => (list || []).forEach(([n, x, s, y]) => prop(g, n, x, y ?? fy, s ?? 1));
function lkSky(g, G, mood, t) {   // flat stepped bands toward the horizon (printed, never a gradient), stars at night, clouds by day
  plane(g, rect(-2200, -2200, 6400, 4400), G.sky, { grain: 0.2 });
  for (let i = 0; i < 4; i++) plane(g, rect(-2200, 420 + i * 70, 6400, 900), lkRgb(lkMix(hex2(G.sky), hex2(G.band), (i + 1) / 4)), { grain: 0.15 });
  if (mood === 'night' || mood === 'hearth') for (let i = 0; i < 44; i++) sparkle(g, -600 + hash(i, 4) * 3100, -300 + hash(i, 5) * 800, 3 + hash(i, 6) * 7, { fill: '#F6EFD8', rot: t * 0.4 + i, alpha: 0.6 + 0.4 * Math.sin(t * 2 + i) });
  else for (let i = 0; i < 4; i++) shape(g, kidney(-300 + i * 760 + (t * 10) % 760, 120 + hash(i, 7) * 160, 120 + hash(i, 8) * 60), { fill: lkRgb(lkMix(hex2(G.band), [255, 255, 255], 0.4)), line: 3, seed: 760 + i, grain: 0.1, breaks: 0.3 });
}
// a night sky without its own sky light still gets a small moon (no halo): the dark frame keeps one bright accent
function lkMoon(g, mood, o) { if ((mood !== 'night' && mood !== 'hearth') || o.moon === false) return; const [x, y] = o.moon || [1560, 200];
  shape(g, ellipse(x, y, 46, 46, 32), { fill: '#F6EFD8', line: 3, seed: 613, grain: 0.15 }); shape(g, ellipse(x + 14, y - 10, 10, 10, 12), { fill: '#E3D8BA', line: 0, off: [0, 0], grain: 0 }); }
const hex2 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function lkGround(g, G, fy) {
  plane(g, rect(-2200, fy, 6400, 2600), G.ground, { grain: 0.35 });
  for (let i = 0; i < 9; i++) shape(g, kidney(-400 + i * 330 + hash(i, 2) * 100, fy + 90 + hash(i, 3) * 160, 70 + hash(i, 4) * 50), { fill: G.groundD, line: 0, off: [0, 0], grain: 0.3, alpha: 0.7 });
  for (let x = -2200; x < 4200; x += 260) ink(g, [[x, fy], [x + 150 + 70 * hash(x, 3), fy + 0.6]], 4.2, { seed: 800 + x, taper: false, wob: 0.3 });   // the broken horizon line
}
function lkNear(g, kind, G, t) {   // dark foreground silhouettes at the frame edges only (the subject stays clear)
  const c = G.near, S = (pts, k) => shape(g, pts, { fill: c, line: 4, seed: 780 + k, grain: 0.3, breaks: 0.2 });
  if (kind === 'pines') { S([[-260, 1300], [-150, -100], [-60, 1300]], 1); S([[1960, 1300], [2080, 40], [2200, 1300]], 2); }
  else if (kind === 'rocks') { S(spline([[-200, 1200], [-160, 960], [40, 900], [200, 1010], [260, 1200]], true, 5), 3); S(spline([[1700, 1200], [1760, 990], [1960, 940], [2100, 1200]], true, 5), 4); }
  else if (kind === 'plant') { for (let i = -2; i <= 2; i++) S(xform(spline([[0, 0], [-30, -120], [0, -300], [30, -120]], true, 6), -40, 1160, i * 0.32 + Math.sin(twos(t) * 1.5) * 0.04, 1.4), 5 + i); }
  else if (kind === 'curtain') { S(spline([[-300, -200], [70, -200], [40, 300], [110, 1300], [-300, 1300]], true, 6), 11); }
  else if (kind === 'hedge') { S(spline([[-300, 1300], [-260, 980], [-100, 930], [80, 990], [140, 1300]], true, 6), 12); S(spline([[1780, 1300], [1820, 990], [1980, 940], [2200, 1300]], true, 6), 13); }
  else if (kind === 'rail') for (let i = 0; i < 3; i++) S(rect(-200 + i * 90, 880, 34, 400), 14 + i);
  else { for (let i = 0; i < 7; i++) S([[-200 + i * 50, 1200], [-170 + i * 50 + Math.sin(t * 1.4 + i) * 10, 930 + (i % 3) * 40], [-140 + i * 50, 1200]], 20 + i);   // grass tufts
    for (let i = 0; i < 6; i++) S([[1740 + i * 50, 1200], [1770 + i * 50 + Math.sin(t * 1.3 + i) * 10, 950 + (i % 2) * 50], [1800 + i * 50, 1200]], 30 + i); }
}
function lkFinish(g, o, G, L, t) {
  if (o.subject) depth(g, 1, (c) => o.subject(c, L));
  if (o.near !== false) depth(g, 1.5, (c) => lkNear(c, o.near || 'grass', G, t));
  if (o.air) air(g, o.air, t, o.airAt || {});
  return L;
}
const lkLight = (g, L, t) => { if (L) lightSrc(g, L, t); };
function setLand(g, o = {}) {
  const t = TT, mood = o.mood || 'day', G = grade(mood), fy = o.fy ?? 800, L = o.light || null; LK_MOOD = mood;
  depth(g, 0.25, (c) => { lkSky(c, G, mood, t); if (L && (L.kind === 'sun' || L.kind === 'moon')) lkLight(c, L, t); else lkMoon(c, mood, o); });
  depth(g, 0.45, (c) => {
    const far = o.far || 'hills', y0 = fy - 10;
    if (far === 'peaks') for (let i = 0; i < 7; i++) { const x = -400 + i * 420; shape(c, [[x - 320, y0], [x, y0 - 380 - hash(i, 1) * 180], [x + 320, y0]], { fill: G.far, line: 3.4, seed: 820 + i, grain: 0.25, breaks: 0.3, shade: [{ pts: [[x, y0 - 600], [x + 400, y0 - 600], [x + 400, y0], [x, y0]], color: G.mid, alpha: 0.35 }] }); shape(c, [[x - 70, y0 - 310 - hash(i, 1) * 180 + 70], [x, y0 - 380 - hash(i, 1) * 180], [x + 70, y0 - 310 - hash(i, 1) * 180 + 70]], { fill: '#F6EFD8', line: 0, off: [0, 0], grain: 0.1, alpha: 0.85 }); }
    else if (far === 'city') for (let i = 0; i < 14; i++) { const x = -500 + i * 230, h = 160 + hash(i, 2) * 260; shape(c, rect(x, y0 - h, 180, h + 20), { fill: G.far, line: 3, seed: 830 + i, grain: 0.25, breaks: 0.3 }); }
    else if (far === 'sea') { plane(c, rect(-2200, y0 - 120, 6400, 900), G.far, { grain: 0.2 }); for (let i = 0; i < 6; i++) dashed(c, [[-2200, y0 - 90 + i * 20], [4200, y0 - 90 + i * 20]], 3, 60, 40, t * 30 * (i % 2 ? 1 : -1), lkRgb(lkMix(hex2(G.band), [255, 255, 255], 0.3))); }
    else shape(c, spline([[-2200, y0 + 40], [-800, y0 - 260], [100, y0 - 120], [900, y0 - 320], [1800, y0 - 150], [2600, y0 - 300], [4200, y0 + 40]], false, 8).concat([[4200, y0 + 400], [-2200, y0 + 400]]), { fill: G.far, line: 3.4, seed: 840, grain: 0.25, breaks: 0.3 });
  });
  if (o.trees !== false) depth(g, 0.7, (c) => { for (let i = 0; i < 16; i++) { const x = -700 + i * 230 + hash(i, 3) * 80, h = 190 + hash(i, 4) * 150; shape(c, [[x - h * 0.32, fy + 4], [x, fy - h], [x + h * 0.32, fy + 4]], { fill: G.mid, line: 3, seed: 850 + i, grain: 0.2, breaks: 0.25 }); } });
  lkGround(g, G, fy); if (o.floor) o.floor(g); lkProps(g, o.props, fy);
  if (L && L.kind !== 'sun' && L.kind !== 'moon') lkLight(g, L, t);
  return lkFinish(g, o, G, L, t);
}
function setRoom(g, o = {}) {
  const t = TT, mood = o.mood || 'day', G = grade(mood), fy = o.fy ?? 800, L = o.light || null; LK_MOOD = mood;
  depth(g, 0.6, (c) => {
    plane(c, rect(-2200, -2200, 6400, 2200 + fy), o.wall || G.wall, { grain: 0.28 });
    const pp = o.paper || 'dots';
    if (pp === 'dots') polka(c, rect(-2200, -400, 6400, fy + 400), PAL.white, { step: 90, r: 9, alpha: 0.25 });
    else if (pp === 'stripes') for (let x = -2200; x < 4200; x += 120) plane(c, rect(x, -2200, 40, 2200 + fy), PAL.white, { alpha: 0.16 });
    else for (let i = 0; i < 18; i++) sparkle(c, -400 + (i % 6) * 520 + (i / 6 | 0) * 170, 80 + (i / 6 | 0) * 220, 14, { fill: PAL.white, alpha: 0.4 });
    plane(c, rect(-2200, fy - 200, 6400, 200), lkRgb(lkMix(hex2(o.wall || G.wall), [40, 30, 30], 0.18)), { grain: 0.3 });   // wainscot band
    if (o.window !== null) { const w = o.window || { x: 1180, y: 150, w: 360, h: 330 };
      shape(c, rect(w.x - 18, w.y - 18, w.w + 36, w.h + 36), { fill: PAL.white, line: 4.4, seed: 861, grain: 0.25 });
      c.save(); path(c, rect(w.x, w.y, w.w, w.h)); c.clip(); c.translate(w.x - 200, w.y - 200); c.scale(0.5, 0.5); lkSky(c, G, mood, t); c.restore();
      ink(c, [[w.x + w.w / 2, w.y], [w.x + w.w / 2, w.y + w.h]], 5, { seed: 862, taper: false }); ink(c, [[w.x, w.y + w.h / 2], [w.x + w.w, w.y + w.h / 2]], 5, { seed: 863, taper: false }); }
    (o.wallProps || []).forEach(([n, x, y, s]) => n === 'clock' ? wallClock(c, t, x, y, 56 * (s || 1)) : n === 'atom' ? atomicArt(c, x, y, s || 1, t)
      : n === 'frame' ? (shape(c, rect(x - 90 * (s || 1), y - 70 * (s || 1), 180 * (s || 1), 140 * (s || 1)), { fill: PAL.mustard, line: 4, seed: 870, off: [6, 6] }), shape(c, [[x - 60 * (s || 1), y + 50 * (s || 1)], [x, y - 40 * (s || 1)], [x + 60 * (s || 1), y + 50 * (s || 1)]], { fill: PAL.teal, line: 3, seed: 871 })) : prop(c, n, x, y, s || 1));
  });
  plane(g, rect(-2200, fy, 6400, 2600), o.floor || G.floor, { grain: 0.32 });
  shape(g, rect(-2200, fy - 22, 6400, 22), { fill: PAL.paperDD, line: 0, off: [0, 0], grain: 0.2 });
  for (let x = -2200; x < 4200; x += 260) ink(g, [[x, fy], [x + 150 + 70 * hash(x, 3), fy + 0.6]], 4.2, { seed: 800 + x, taper: false, wob: 0.3 });
  if (o.rug !== false) rugBand(g, -400, 2400, fy + 150, 120, o.rug || PAL.rose, t);
  if (o.floor) o.floor(g);
  lkProps(g, o.props, fy);
  lkLight(g, L, t);
  return lkFinish(g, Object.assign({ near: 'plant' }, o), G, L, t);
}
function setStreet(g, o = {}) {
  const t = TT, mood = o.mood || 'day', G = grade(mood), fy = o.fy ?? 800, L = o.light || null, dark = mood === 'night' || mood === 'dusk'; LK_MOOD = mood;
  depth(g, 0.25, (c) => { lkSky(c, G, mood, t); if (L && (L.kind === 'sun' || L.kind === 'moon')) lkLight(c, L, t); });
  depth(g, 0.45, (c) => { for (let i = 0; i < 14; i++) { const x = -500 + i * 230, h = 200 + hash(i, 2) * 240; shape(c, rect(x, fy - 120 - h, 180, h + 60), { fill: G.far, line: 3, seed: 830 + i, grain: 0.25, breaks: 0.3 }); } });
  depth(g, 0.8, (c) => { const n = o.shops || 6, cols = [PAL.mustardL, PAL.pink, PAL.tealL, PAL.kraftL, PAL.blueL, PAL.avocadoL];
    for (let i = -1; i < n + 1; i++) { const x = -200 + i * 420, h = 380 + hash(i, 5) * 80, col = cols[(i + 6) % 6];
      shape(c, rect(x, fy - 110 - h, 400, h), { fill: col, line: 4, seed: 880 + i + 1, grain: 0.3, breaks: 0.15 });
      shape(c, [[x + 40, fy - 110 - 210], [x + 360, fy - 110 - 210], [x + 380, fy - 110 - 150], [x + 20, fy - 110 - 150]], { fill: i % 2 ? PAL.coral : PAL.teal, line: 3.4, seed: 900 + i + 1, grain: 0.3 });
      shape(c, rect(x + 60, fy - 110 - 140, 280, 130), { fill: dark ? '#FFD98A' : PAL.sky, line: 3.4, seed: 920 + i + 1, grain: 0.15 });
      for (let k = 0; k < 2; k++) shape(c, rect(x + 70 + k * 170, fy - 110 - h + 50, 90, 90), { fill: dark && hash(i, k) > 0.4 ? '#FFD98A' : PAL.blueL, line: 3, seed: 940 + i * 2 + k + 2, grain: 0.1 }); } });
  plane(g, rect(-2200, fy - 110, 6400, 140), PAL.paperDD, { grain: 0.3 });   // sidewalk
  plane(g, rect(-2200, fy + 30, 6400, 2600), G.ground, { grain: 0.35 });
  for (let x = -2200; x < 4200; x += 260) ink(g, [[x, fy + 30], [x + 150 + 70 * hash(x, 3), fy + 30.6]], 4.2, { seed: 800 + x, taper: false, wob: 0.3 });
  dashed(g, [[-2200, fy + 200], [4200, fy + 200]], 8, 70, 60, 0, PAL.white);
  if (o.floor) o.floor(g);
  lkProps(g, o.props, fy);
  if (L && L.kind !== 'sun' && L.kind !== 'moon') lkLight(g, L, t);
  return lkFinish(g, Object.assign({ near: 'hedge' }, o), G, L, t);
}
