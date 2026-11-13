// =====================================================================
//  characters/cast.js: Max, the whiteboard hero, drawn live in marker every frame (load after engine/wb.js + engine/safe.js).
//  Same ink as the board: chisel outlines in PAL.ink, a teal (PAL.sig) shirt, navy trousers, a black hair cap; the lines
//  boil a little (re-jittered 8 times a second) so a held pose still lives. He tracks himself: track('hero') = whole body,
//  track('face') = head, so the layout guard (engine/safe.js) and labelY() know where he is.
//
//    hero(t0, t1, o)   registers him in a picture (live): o = { x, y (feet, board px), s (scale, 1 = 850 px tall), dir (1 faces +x),
//                      pose: name | (u) => name/object (u = seconds into the picture), ex: expression | (u) => ..., hold: prop in
//                      the front hand ('coin' | 'bag' | 'umbrella' | 'key'), reveal: seconds to draw him on with the pen (0 = already drawn) }
//    POSES             idle · walk (use walk(u)) · reach · cheer · slump · point · push · shrug · think · umbrella
//    blend(a, b, u0, u1)  pose a turning into pose b between u0 and u1 (seconds into the picture)
//    EXPR              happy · sad · shock · firm
//  Joints: arms [a, e] = upper-arm angle from straight down (+ = outward/up), elbow bend; legs [h, k] = hip swing, knee bend.
//  The front arm/leg is 'r' (towards dir). lean tilts the body forward round the hip, bob lifts him (px).
// =====================================================================
const POSES = {
  idle: { ra: [0.16, 0.12], la: [0.16, 0.12], rl: [0.05, 0], ll: [0.05, 0], lean: 0, head: 0, bob: 0 },
  cheer: { ra: [2.55, 0.25], la: [2.55, 0.25], rl: [0.12, 0], ll: [0.12, 0], lean: -0.04, head: -0.08, bob: 26 },
  slump: { ra: [0.02, 0.05], la: [-0.06, 0.05], rl: [0.14, 0.32], ll: [0.04, 0.3], lean: 0.24, head: 0.32, bob: -22 },
  reach: { ra: [2.05, 0.15], la: [0.28, 0.2], rl: [0.18, 0], ll: [0.1, 0.05], lean: 0.06, head: -0.12, bob: 6 },
  point: { ra: [1.5, 0.05], la: [0.2, 0.3], rl: [0.12, 0], ll: [0.05, 0], lean: 0.03, head: -0.04, bob: 0 },
  push: { ra: [1.32, 0.25], la: [-1.15, -0.25], rl: [0.32, 0.02], ll: [0.42, 0.18], lean: 0.2, head: -0.1, bob: -6 },
  shrug: { ra: [0.62, 1.35], la: [0.62, 1.35], rl: [0.08, 0], ll: [0.08, 0], lean: 0, head: 0.16, bob: 4 },
  think: { ra: [0.42, 2.45], la: [0.15, 0.6], rl: [0.08, 0], ll: [0.04, 0], lean: 0.02, head: 0.12, bob: 0 },
  umbrella: { ra: [1.85, 1.0], la: [0.18, 0.15], rl: [0.06, 0], ll: [0.06, 0], lean: 0, head: -0.06, bob: 0 },
};
function walk(u, speed = 1) {   // a stride every 0.55 s
  const p = u * TAU / 1.1 * speed, s = Math.sin(p);
  return { ra: [0.42 * s, 0.25], la: [0.42 * s, 0.25], rl: [-0.36 * s, 0.32 * Math.max(0, s)], ll: [-0.36 * s, 0.32 * Math.max(0, -s)], lean: 0.06, head: 0, bob: 12 * Math.abs(Math.cos(p)) };
}
const EXPR = {
  happy: { brow: -0.12, mouth: 'smile', eye: 1 },
  sad: { brow: 0.38, mouth: 'frown', eye: 0.85 },
  shock: { brow: -0.3, mouth: 'o', eye: 1.35 },
  firm: { brow: 0.22, mouth: 'flat', eye: 0.95 },
};
const poseOf = (p) => (typeof p === 'string' ? POSES[p] || POSES.idle : p);
function mixPose(a, b, k) {
  a = poseOf(a); b = poseOf(b); const o = {};
  for (const key of Object.keys(POSES.idle)) o[key] = Array.isArray(a[key]) ? [lerp(a[key][0], b[key][0], k), lerp(a[key][1], b[key][1], k)] : lerp(a[key] ?? 0, b[key] ?? 0, k);
  return o;
}
const blend = (a, b, u0, u1) => (u) => mixPose(a, b, EZ.io(seg(u, u0, u1)));

// ---- marker primitives (local px); every op = { pts, w, col, fill } so the pen can draw him on in order
const HERO_COL = { shirt: '#177f8c', pants: '#2c3a52', skin: '#fbf7ef', hair: '#20242b', shadow: 'rgba(32,36,43,0.13)' };
function boil(pts, B, n) {   // re-jittered 8x a second: the hand-drawn boil of a live marker line
  return pts.map(([x, y], i) => { const r = Math.sin(i * 127.1 + n * 311.7 + B * 74.7) * 43758.5453, q = Math.sin(i * 269.5 + n * 183.3 + B * 12.9) * 24634.6345; return [x + (r - Math.floor(r) - 0.5) * 3.2, y + (q - Math.floor(q) - 0.5) * 3.2]; });
}
function opPath(g, pts, k = 1) {
  const n = pts.length - 1, upto = k * n, last = Math.floor(upto);
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= Math.min(last, n); i++) g.lineTo(pts[i][0], pts[i][1]);
  if (last < n) g.lineTo(lerp(pts[last][0], pts[last + 1][0], upto - last), lerp(pts[last][1], pts[last + 1][1], upto - last));
}
function ellipsePts(cx, cy, rx, ry, n = 28, a0 = -2.2) { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + TAU * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
function limb(p0, a1, l1, a2, l2) { const p1 = [p0[0] + Math.sin(a1) * l1, p0[1] + Math.cos(a1) * l1]; return [p0, p1, [p1[0] + Math.sin(a2) * l2, p1[1] + Math.cos(a2) * l2]]; }
const rot = (p, c, a) => { const co = Math.cos(a), si = Math.sin(a), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * co - dy * si, c[1] + dx * si + dy * co]; };

// the ops list of one pose (local px, feet centre at 0,0, facing +x)
function heroOps(P, E, hold) {
  const ops = [], INK = PAL.ink, HIP = [0, -360 - P.bob], lean = P.lean;
  const R = (p) => rot([p[0], p[1] - P.bob], HIP, lean);   // upper body point (pose space) → leaned
  const hip = (side) => [side * 34, HIP[1]];
  const leg = (side, [h, k]) => limb(hip(side), h * side, 190, h * side - k, 178);
  const sh = (side) => R([side * 70, -600]);
  const arm = (side, [a, e]) => { const s0 = sh(side), u = a * side + lean, f = u + e * side; return limb(s0, u, 130, f, 122); };
  const shoe = (q, side) => ops.push({ pts: ellipsePts(q[0] + 16, q[1] - 8, 40, 19, 18), w: 8, col: INK, fill: INK });
  // ground shadow, back leg, front leg
  ops.push({ pts: ellipsePts(0, 4, 150, 22, 20), w: 0, col: INK, fill: HERO_COL.shadow, flat: true });
  const L = leg(-1, P.ll), Rl = leg(1, P.rl);
  ops.push({ pts: L, w: 44, col: HERO_COL.pants }); shoe(L[2], -1);
  ops.push({ pts: Rl, w: 44, col: HERO_COL.pants }); shoe(Rl[2], 1);
  // back arm (behind the shirt)
  const la = arm(-1, P.la);
  ops.push({ pts: [la[0], la[1]], w: 40, col: HERO_COL.shirt }); ops.push({ pts: [la[1], la[2]], w: 15, col: INK });
  ops.push({ pts: ellipsePts(la[2][0], la[2][1], 21, 21, 16), w: 8, col: INK, fill: HERO_COL.skin });
  // shirt: a rounded trapezoid, teal fill, ink outline, a collar V
  const body = [[-78, -612], [78, -612], [86, -560], [66, -366], [-66, -366], [-86, -560], [-78, -612]].map(R);
  ops.push({ pts: body, w: 10, col: INK, fill: HERO_COL.shirt });
  ops.push({ pts: [[-26, -612], [0, -572], [26, -612]].map(R), w: 8, col: INK });
  ops.push({ pts: [[-64, -380], [64, -380]].map(R), w: 14, col: HERO_COL.pants });   // belt line
  // head: hair cap, face circle, neck
  const NECK = R([0, -618]), HC = rot(R([0, -735]), NECK, P.head * 0.6), hr = 88;
  ops.push({ pts: [NECK, R([0, -660])], w: 26, col: INK });
  ops.push({ pts: ellipsePts(HC[0], HC[1], hr, hr * 1.02, 30), w: 10, col: INK, fill: HERO_COL.skin });
  const hairA = P.head * 0.6, hp = (x, y) => rot([HC[0] + x, HC[1] + y], HC, hairA);
  ops.push({ pts: [hp(-90, -8), hp(-84, -58), hp(-50, -96), hp(0, -108), hp(48, -100), hp(84, -66), hp(92, -24), hp(60, -46), hp(18, -40), hp(-30, -52), hp(-62, -30), hp(-90, -8)], w: 8, col: INK, fill: HERO_COL.hair });
  ops.push({ pts: [hp(10, -104), hp(30, -142), hp(46, -104)], w: 9, col: INK });   // tuft
  // face (towards +x a little)
  const fx = 16, eye = (side) => hp(fx + side * 30, -4);
  for (const side of [-1, 1]) {
    const c = eye(side);
    if (E.mouth === 'o' || E.eye > 1.2) { ops.push({ pts: ellipsePts(c[0], c[1], 17, 21, 16), w: 6, col: INK, fill: '#fff' }); ops.push({ pts: ellipsePts(c[0] + 3, c[1] + 2, 7, 8, 10), w: 4, col: INK, fill: INK }); }
    else ops.push({ pts: ellipsePts(c[0], c[1], 8.5, 12 * E.eye, 12), w: 4, col: INK, fill: INK });
    const b = hp(fx + side * 30, -36 + (E.brow > 0 ? 4 : 0)), ba = E.brow * side;
    ops.push({ pts: [[b[0] - 18 * Math.cos(ba), b[1] - 18 * Math.sin(ba)], [b[0] + 18 * Math.cos(ba), b[1] + 18 * Math.sin(ba)]], w: 8, col: INK });
  }
  const m = hp(fx, 40);
  if (E.mouth === 'smile') ops.push({ pts: [[m[0] - 32, m[1] - 8], [m[0] - 16, m[1] + 12], [m[0], m[1] + 17], [m[0] + 16, m[1] + 12], [m[0] + 32, m[1] - 8], [m[0] - 32, m[1] - 8]], w: 7, col: INK, fill: '#7a2a22' });
  else if (E.mouth === 'frown') ops.push({ pts: [[m[0] - 26, m[1] + 12], [m[0] - 12, m[1]], [m[0] + 12, m[1]], [m[0] + 26, m[1] + 12]], w: 8, col: INK });
  else if (E.mouth === 'o') ops.push({ pts: ellipsePts(m[0], m[1] + 4, 14, 19, 14), w: 7, col: INK, fill: '#7a2a22' });
  else ops.push({ pts: [[m[0] - 24, m[1] + 4], [m[0] + 24, m[1] - 2]], w: 8, col: INK });
  // front arm over the shirt, hand, held prop
  const ra = arm(1, P.ra), hand = ra[2];
  if (hold === 'umbrella') {   // handle up from the hand, canopy over the head
    const top = [HC[0] + 20, HC[1] - 210];   // canopy over the head, the shaft slants from the hand
    ops.push({ pts: [[hand[0] - 14, hand[1] + 30], [hand[0], hand[1] + 40], hand, top], w: 10, col: INK });
    const cx = top[0], cy = top[1] + 20, cw = 250, can = [[cx - cw, cy + 70]]; for (let i = 0; i <= 12; i++) { const a = Math.PI + Math.PI * i / 12; can.push([cx + Math.cos(a) * cw, cy + 70 + Math.sin(a) * 110]); }
    for (let i = 3; i >= 0; i--) { const x0 = cx + cw - (2 * cw) * (i + 1) / 4, x1 = cx + cw - (2 * cw) * i / 4; can.push([x1 - (x1 - x0) * 0.5, cy + 92], [x0, cy + 70]); }
    ops.push({ pts: can, w: 10, col: INK, fill: PAL.hot });
  }
  ops.push({ pts: [ra[0], ra[1]], w: 40, col: HERO_COL.shirt }); ops.push({ pts: [ra[1], ra[2]], w: 15, col: INK });
  ops.push({ pts: ellipsePts(hand[0], hand[1], 21, 21, 16), w: 8, col: INK, fill: HERO_COL.skin });
  if (hold === 'coin') { ops.push({ pts: ellipsePts(hand[0] + 6, hand[1] - 34, 34, 34, 20), w: 8, col: INK, fill: PAL.hi }); ops.push({ pts: [[hand[0] + 6, hand[1] - 52], [hand[0] + 6, hand[1] - 16]], w: 7, col: INK }); }
  if (hold === 'bag') { const x = hand[0], y = hand[1] + 18; ops.push({ pts: [[x - 52, y + 40], [x + 52, y + 40], [x + 62, y + 170], [x - 62, y + 170], [x - 52, y + 40]], w: 9, col: INK, fill: PAL.hot }); ops.push({ pts: [[x - 26, y + 40], [x - 18, y], [x + 18, y], [x + 26, y + 40]], w: 8, col: INK }); }
  if (hold === 'key') { const x = hand[0] + 10, y = hand[1] - 40; ops.push({ pts: ellipsePts(x, y - 30, 30, 30, 18), w: 9, col: INK, fill: PAL.hi }); ops.push({ pts: [[x, y], [x, y + 90], [x + 24, y + 90], [x, y + 66], [x + 20, y + 66]], w: 10, col: INK }); }
  return { ops, head: [HC[0] - hr - 4, HC[1] - hr - 60, HC[0] + hr + 4, HC[1] + hr + 4] };
}

// draws him at film time t (u = seconds into the picture); returns the screen pen tip while he is being drawn on
function drawHero(g, t, u, o) {
  const P = typeof o.pose === 'function' ? poseOf(o.pose(u)) : poseOf(o.pose || 'idle');
  const E = EXPR[(typeof o.ex === 'function' ? o.ex(u) : o.ex) || 'happy'] || EXPR.happy;
  const breathe = Math.sin(t * 2.6) * 4, Pb = { ...P, bob: P.bob + breathe };
  const { ops, head } = heroOps(Pb, E, o.hold);
  const s = o.s ?? 1, dir = o.dir ?? 1, B = Math.floor(t * 8), rv = o.reveal ? clamp(u / o.reveal) : 1;
  g.save(); g.translate(o.x, o.y); g.scale(s * dir, s);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const N = ops.length, upto = rv * N; let tip = null;
  ops.forEach((op, i) => {
    if (i >= upto) return;
    const k = clamp(upto - i), pts = op.flat ? op.pts : boil(op.pts, B, i);
    if (op.fill && k >= 1) { g.fillStyle = op.fill; opPath(g, pts); g.fill(); }
    if (op.w > 0) { g.strokeStyle = op.col; g.lineWidth = op.w; opPath(g, pts, k); g.stroke(); }
    if (k < 1) { const n = pts.length - 1, q = k * n, j = Math.min(n - 1, Math.floor(q)); tip = [lerp(pts[j][0], pts[j + 1][0], q - j), lerp(pts[j][1], pts[j + 1][1], q - j)]; }
  });
  // measured box: every point of every op, padded by half its stroke
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const op of ops) { if (op.flat) continue; const p = op.w / 2; for (const [x, y] of op.pts) { x0 = Math.min(x0, x - p); x1 = Math.max(x1, x + p); y0 = Math.min(y0, y - p); y1 = Math.max(y1, y + p); } }
  if (typeof track === 'function') {   // safe.js reads the main canvas transform: hand it this one for the two boxes
    ctx.setTransform(g.getTransform()); track('hero', x0, y0, x1, y1, 'Max'); track('face', head[0], head[1] + 50, head[2], head[3]); ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const m = g.getTransform(); g.restore();
  return tip ? [m.a * tip[0] + m.c * tip[1] + m.e, m.b * tip[0] + m.d * tip[1] + m.f] : null;
}
function hero(t0, t1, o) {
  live(t0, t1, (g, t) => {
    const tip = drawHero(g, t, t - t0, o);
    if (tip) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); drawMarker(g, tip[0], tip[1], 0.85, 0, PAL.ink, Math.sin(t * 9) * 0.03); g.restore(); }
  });
}
