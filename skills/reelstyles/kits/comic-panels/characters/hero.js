// The courier hero (ours): blue suit, red cape, yellow bolt on the chest, domino mask. Origin = feet centre, about 278 units tall (fin to boots).
// o: {x, y, s, flip, t, id, pose, ex, track}. Poses are stepped on twos (q12) and the whole body breathes, so a held pose is never frozen.
//   pose: 'idle' (fists on hips) | 'walk' | 'run' | 'reach' (right arm out) | 'punch' | 'cheer' | 'slump' | 'think' (fist at chin) | 'shake' (hurt hand)
//   ex:   'smirk' | 'happy' | 'shock' | 'ouch' | 'think'
//   Vertical (engine/safe.js): calls track('hero') with the whole body and track('face') with the head; track: false skips it (a background extra).
// arm angles in degrees per side [upper, elbow]: 0 = hanging down, 90 = straight out sideways, 180 = straight up; elbow is relative to the upper arm
const HERO_POSES = {
  idle: { a: [[35, -80], [35, -80]], l: [0, 0] },
  reach: { a: [[35, -80], [100, -8]], l: [-4, 8] },
  punch: { a: [[30, -60], [92, 0]], l: [-14, 16] },
  cheer: { a: [[150, 18], [150, 18]], l: [-8, 8] },
  slump: { a: [[6, 4], [6, 4]], l: [-3, 3], drop: 10 },
  think: { a: [[35, -80], [22, -158]], l: [0, 0] },
  shake: { a: [[35, -80], [70, 60]], l: [-6, 6] },
};
function hero(o) {
  const t = q12(o.t), br = Math.sin(o.t * 2.6), w = (k) => Math.sin(t * 9 + k), name = o.pose || 'idle';
  let P = HERO_POSES[name] || HERO_POSES.idle;
  if (name === 'walk' || name === 'run') {   // limbs swing on twos
    const k = name === 'run' ? 1.6 : 1, ph = Math.sin(t * (name === 'run' ? 14 : 9)) * k;
    P = { a: [[18 + 22 * ph, -30], [18 - 22 * ph, -30]], l: [22 * ph, -22 * ph] };
  }
  if (name === 'shake') P = { ...P, a: [P.a[0], [70 + 18 * Math.sin(t * 40), 60]] };
  const drop = P.drop || 0, bob = name === 'walk' || name === 'run' ? Math.abs(w(0.3)) * 5 : 0;
  kPush(); kTr(o.x, o.y, 0, (o.flip ? -1 : 1) * (o.s || 1), o.s || 1); grp(o.id || 1);
  kTr(0, drop - bob);
  // cape, blowing back in a wind that never stops
  shape(blob([[-16, -170], [18, -170], [46, -120 + w(0) * 5], [78 + w(1) * 10, -64 + w(2) * 6], [58 + w(3) * 8, -26 + w(4) * 5], [14, -44 + w(5) * 4], [-34, -70 - w(6) * 3]]), L.red, 6);
  shape(poly([[20, -150], [62 + w(1) * 8, -72 + w(2) * 4]], false), [], 3, { fill: false });
  // legs + boots (a leg turns around its hip, the boot follows the ankle)
  for (const [i, sd] of [[0, -1], [1, 1]]) {
    const a = P.l[i] * Math.PI / 180, hx = sd * 12, ax = hx + Math.sin(a) * 62, ay = -88 + Math.cos(a) * 62 + drop * 0.4;
    shape(limb(hx, -88, ax, ay, 10), L.blue, 6);
    shape(poly([[ax - 14, ay - 2], [ax + 14, ay - 2], [ax + 15 + sd * 3, ay + 22], [ax - 15 + sd * 3, ay + 22]]), L.red, 6);
  }
  // torso (breathing)
  kPush(); kTr(0, -86, 0, 1, 1 + br * 0.012);
  shape(poly([[-27, -84], [27, -84], [22, 0], [-22, 0]]), L.blue, 6);
  shape(rect(-23, -9, 46, 10), L.yellow, 4);
  shape(ell(0, -48, 15), L.white, 4);
  shape(poly([[3, -63], [-8, -46], [-1, -46], [-5, -33], [9, -52], [2, -52]]), L.yellow, 3);
  kPop();
  // arms: shoulder -> elbow -> fist, two segments
  const fists = [];
  for (const [i, sd] of [[0, -1], [1, 1]]) {
    const a1 = P.a[i][0] * Math.PI / 180, a2 = a1 + P.a[i][1] * Math.PI / 180, sx = sd * 25, sy = -162;
    const ex = sx + sd * Math.sin(a1) * 40, ey = sy + Math.cos(a1) * 40, fx = ex + sd * Math.sin(a2) * 40, fy = ey + Math.cos(a2) * 40;
    shape(limb(sx, sy, ex, ey, 10), L.blue, 6); shape(ell(ex, ey, 9), L.blue, 0); shape(limb(ex, ey, fx, fy, 9), L.blue, 6);
    shape(ell(fx, fy, 11), L.yellow, 4); fists.push([fx, fy]);
  }
  // head
  const tilt = name === 'slump' ? 10 : name === 'think' ? -6 : 0;
  kPush(); kTr(0, -188 + Math.round(br * 1.4) + drop * 0.6, tilt, 1.32); kTr(0, 188);
  shape(rect(-8, -188, 16, 16), L.skinSh, 4);
  shape(ell(0, -204, 23, 26), L.skin, 6);
  shape(blob([[-26, -208], [-22, -230], [0, -238], [22, -230], [26, -208], [14, -216], [-14, -216]]), L.blue, 6);   // helmet cap
  shape(poly([[0, -238], [-6, -256], [12, -240]]), L.red, 4);                                                         // fin
  shape(poly([[-24, -208], [24, -208], [22, -194], [-22, -194]]), L.navy, 4);                                          // mask
  face(o.ex || (name === 'slump' ? 'ouch' : name === 'cheer' ? 'happy' : 'smirk'), o.t);
  kTrack('face', -28, -258, 28, -174);
  kPop();
  if (o.track !== false) {
    const xs = fists.map((f) => f[0]), ys = fists.map((f) => f[1]);
    kTrack('hero', Math.min(-42, ...xs.map((x) => x - 12)), Math.min(-278, ...ys.map((y) => y - 12)), Math.max(84, ...xs.map((x) => x + 12)), 0);
  }
  kPop();
}
// thick limb: a quad around the segment (x0, y0) -> (x1, y1), half-width w
function limb(x0, y0, x1, y1, w) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w;
  return poly([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]);
}
// the face inside the mask (head-local units, before the head scale)
function face(ex, tt) {
  const look = Math.round(Math.sin(tt * 0.8) * 2);
  if (ex === 'ouch') {   // eyes squeezed shut, gritted teeth, two sweat drops
    shape(poly([[-16, -205], [-6, -201], [-16, -197]], false), [], 3, { fill: false }); shape(poly([[16, -205], [6, -201], [16, -197]], false), [], 3, { fill: false });
    shape(rect(-11, -189, 22, 9), L.white, 3); shape(poly([[-11, -184.5], [11, -184.5]], false), [], 2, { fill: false });
    const d = (q12(tt) * 3) % 1;
    for (const [x, y] of [[30, -226], [-32, -214]]) shape(blob([[x, y - 8 + d * 6], [x + 5, y + 2 + d * 6], [x, y + 6 + d * 6], [x - 5, y + 2 + d * 6]]), L.cyan, 2);
    return;
  }
  const big = ex === 'shock' ? 1.35 : 1, py = ex === 'think' ? -204 : -201, px = ex === 'think' ? 3 : look;
  if (ex === 'happy') { for (const x of [-10, 10]) shape(poly([[x - 7, -199], [x, -205], [x + 7, -199]], false), [], 3, { fill: false }); }
  else {
    shape(ell(-10, -201, 7 * big, 5 * big), L.white, 3); shape(ell(10, -201, 7 * big, 5 * big), L.white, 3);
    shape(ell(-9 + px, py, ex === 'shock' ? 1.8 : 2.6), L.black, 0); shape(ell(11 + px, py, ex === 'shock' ? 1.8 : 2.6), L.black, 0);
  }
  if (ex === 'happy') shape((p) => { p.moveTo(-11, -188); p.lineTo(11, -188); p.quadraticCurveTo(0, -172, -11, -188); p.closePath(); }, L.red, 3);
  else if (ex === 'shock') shape(ell(0, -183, 5, 7), L.black, 2);
  else if (ex === 'think') shape(poly([[-8, -184], [9, -187]], false), [], 3, { fill: false });
  else shape(poly([[-9, -185], [0, -181], [10, -186]], false), [], 3, { fill: false });                                // smirk
}
// Fist in close-up for a punch panel. o: {x, y, s, t, id}; points right.
function fist(o) {
  kPush(); kTr(o.x, o.y, 0, o.s || 1); grp(o.id || 2);
  shape(poly([[-210, -64], [-30, -84], [-30, 84], [-210, 70]]), L.blue, 7);                  // sleeve
  shape(poly([[-170, -66], [-110, -72], [-110, 80], [-170, 74]]), L.red, 5);
  shape(rrect(-60, -92, 170, 184, 48), L.yellow, 8);                                         // glove
  for (let i = 0; i < 4; i++) shape(rrect(70, -86 + i * 44, 70, 46, 22), L.yellow, 7);       // knuckles
  shape(rrect(-30, 40, 110, 40, 20), L.yellow, 7);                                           // thumb
  shape(poly([[-20, -60], [60, -60]], false), [], 4, { fill: false });
  shape(poly([[-20, -10], [60, -10]], false), [], 4, { fill: false });
  kPop();
}
