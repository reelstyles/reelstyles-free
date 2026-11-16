// characters/presenter.js: two geometric presenters (June, Walt) + hands + props, drawn with engine/toon.js.
// Derived from lemo-opuscar styles/midcentury-toon/demo/engine/chars.js (MIT, (c) 2026 LemoLab; notice in LICENSES/).
// Changes: one body drawn for several people (OUTFITS: colours, hairdo, collar/tie), kneel + point + count hand poses,
// a held-drawing `idle()` breath, no product-specific props (a stove-top percolator and a mug instead).
//
// Limited animation: the body is a held drawing; only arms, hands, eyes, mouth and props move.
// pose: { x, y, s, dir (1 right / -1 left), view 'q'|'front'|'side'|'back', face, outfit (OUTFITS.june | OUTFITS.walt | your own),
//         armB/armF {a1,a2}, handB/handF 'open'|'point'|'grip'|'flat', blink 0..1, look [dx,dy], prop {kind, hand 'F'|'B', ...}, kneel }
// units: feet at (0,0); hair top about -560. Angles: 0 = right, π/2 = down (screen, before dir mirroring).
const NAVY = '#3B4766', NAVYD = '#2A3350';
const OUTFITS = {
  june: { top: PAL.coral, topD: PAL.coralD, pants: NAVY, pantsD: NAVYD, belt: PAL.mustard, hair: PAL.hair, band: PAL.mustard, hairdo: 'bob', collar: 'roll', skin: PAL.skin },
  walt: { top: PAL.olive, topD: '#6B7234', pants: '#5A4A3C', pantsD: '#3F3329', belt: PAL.brown, hair: '#2E2420', band: null, hairdo: 'crop', collar: 'tie', tie: PAL.coral, skin: '#E9B88F' },
};
const UA = 100, FA = 92;
function armJoints(pose, which) {
  const view = pose.view || 'q';
  const sh = view === 'front' ? [which === 'F' ? 46 : -46, -384] : (which === 'F' ? [40, -384] : [-36, -386]);
  const rest = view === 'front' ? (which === 'F' ? { a1: 1.36, a2: 1.5 } : { a1: 1.78, a2: 1.64 }) : (which === 'F' ? { a1: 1.3, a2: 1.52 } : { a1: 1.86, a2: 1.7 });
  const arm = pose[which === 'F' ? 'armF' : 'armB'] || rest;
  const el = [sh[0] + Math.cos(arm.a1) * UA, sh[1] + Math.sin(arm.a1) * UA];
  const ha = [el[0] + Math.cos(arm.a2) * FA, el[1] + Math.sin(arm.a2) * FA];
  return { sh, el, ha, a2: arm.a2 };
}
// local → screen for a pose (without camera)
function toScreen(pose, p) { const s = pose.s ?? 1, d = pose.dir ?? 1; return [pose.x + p[0] * s * d, pose.y + p[1] * s]; }

// UPA four-finger hand (three fingers + thumb). Drawn along angle a from the wrist at (x,y).
// kind: 'open' spread, 'flat' fingers together (pushing), 'point' index out, 'grip' curled fist. side ±1 = thumb side.
function drawHand(ctx, x, y, a, kind = 'open', side = 1, k = 1, skin = PAL.skin) {
  const parts = [], seps = [];
  const E = (cx, cy, rx, ry, rot = 0) => parts.push(ellipse(cx, cy, rx, ry, 18, 0, TAU, rot));
  E(12, 0, 15, 13.5);                                                   // palm
  if (kind === 'open') {
    [-0.62, 0, 0.62].forEach(r => E(12 + Math.cos(r) * 25, Math.sin(r) * 25, 12, 5, r));
    E(4, -15 * side, 10, 5, -1.35 * side);
  } else if (kind === 'flat') {
    [-10, 0, 10].forEach((dy, i) => E(34 + (i === 1 ? 3 : 0), dy, 13, 4.8));
    E(10, -15 * side, 9, 5, -0.9 * side);
    seps.push([[24, -5], [40, -5]], [[24, 5], [40, 5]]);
  } else if (kind === 'point') {
    E(38, -5 * side, 19, 4.8); E(25, 5 * side, 7, 6); E(20, 11 * side, 6, 5.5); E(8, -14 * side, 8.5, 5, -1.0 * side);
  } else { E(26, -8, 6.5, 6.5); E(28, 1, 6.5, 6.5); E(25, 10, 6, 6); E(12, -14 * side, 9, 5.5, -0.4 * side); seps.push([[22, -3.5], [30, -3.5]], [[22, 5.5], [29, 5.5]]); }
  const P = parts.map(p => xform(p, x, y, a, k));
  ctx.save(); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 6 * k; ctx.lineJoin = 'round';
  for (const p of P) { path(ctx, p); ctx.stroke(); }
  const o = reg(77, 0.6); ctx.fillStyle = skin;
  for (const p of P) { path(ctx, move(p, o[0] * 0.5, o[1] * 0.5)); ctx.fill(); }
  ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round';
  for (const s2 of seps) { const q = xform(s2, x, y, a, k); ctx.beginPath(); ctx.moveTo(...q[0]); ctx.lineTo(...q[1]); ctx.stroke(); }
  ctx.restore();
}

function sleeve(ctx, J, seed, O) {
  const P = spline([J.sh, [(J.sh[0] + J.el[0]) / 2, (J.sh[1] + J.el[1]) / 2], J.el, [(J.el[0] + J.ha[0]) / 2, (J.el[1] + J.ha[1]) / 2], J.ha], false, 6);
  ink(ctx, P, 26, { seed, taper: false, wob: 0.08 });
  const o = reg(seed, 1);
  ink(ctx, move(P, o[0] * 0.6, o[1] * 0.6), 17, { seed: seed + 1, taper: false, wob: 0.05, color: O.top });
  // cuff
  const a = J.a2, cx = J.ha[0] - Math.cos(a) * 8, cy = J.ha[1] - Math.sin(a) * 8;
  ink(ctx, [[cx + Math.cos(a + 1.57) * 12, cy + Math.sin(a + 1.57) * 12], [cx - Math.cos(a + 1.57) * 12, cy - Math.sin(a + 1.57) * 12]], 3, { seed: seed + 2, taper: false, color: O.topD });
}
function drawArm(ctx, pose, which, seed) {
  const J = armJoints(pose, which);
  const prop = pose.prop && (pose.prop.hand || 'F') === which ? pose.prop : null;
  if (prop && prop.behind) drawProp(ctx, prop, J, pose);
  sleeve(ctx, J, seed, pose.outfit || OUTFITS.june);
  const hk = pose[which === 'F' ? 'handF' : 'handB'] || 'open';
  drawHand(ctx, J.ha[0], J.ha[1], J.a2, hk, which === 'F' ? -1 : 1, 1, (pose.outfit || OUTFITS.june).skin);
  if (prop && !prop.behind) drawProp(ctx, prop, J, pose);
  return J;
}

function drawPresenter(ctx, pose, t = 0) {
  const O = pose.outfit || OUTFITS.june;
  const view = pose.view || 'q', face = pose.face || 'neutral';
  ctx.save(); ctx.translate(pose.x, pose.y); ctx.scale((pose.s ?? 1) * (pose.dir ?? 1), pose.s ?? 1);
  if (pose.shadow !== false) { ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.ellipse(6, 2, 86, 10, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  const front = view === 'front' || view === 'back';
  if (pose.kneel) { drawKneelLegs(ctx, O); ctx.translate(0, 150); }
  if (typeof track === 'function' && !pose.extra) {   // engine/safe.js layout QA: body (hair top to the floor) + head; pose.extra = not the hero
    track('hero', -95, -570, 95, pose.kneel ? -150 : 0); if (view !== 'back') track('face', front ? -72 : -64, -570, front ? 72 : 96, -405);
  }
  if (view !== 'back') drawArm(ctx, pose, 'B', 70);
  // legs (cigarette trousers), ankles, flats
  const legs = pose.kneel ? [] : front ? [[[-44, -286], [-2, -286], [-8, -26], [-34, -26]], [[2, -286], [44, -286], [34, -26], [8, -26]]]
    : [[[-40, -286], [4, -286], [-4, -26], [-30, -26]], [[-2, -286], [44, -286], [34, -26], [10, -26]]];
  legs.forEach((L, i) => {
    const ax = (L[2][0] + L[3][0]) / 2;
    shape(ctx, rect(ax - 7, -30, 14, 18), { fill: O.skin, line: 0, seed: 40 + i, grain: 0 });
    shape(ctx, L, { fill: O.pants, line: 3.8, seed: 42 + i, grain: 0.3, breaks: 0.15, shade: i === 1 && !front ? [{ pts: [[26, -290], [60, -290], [60, 0], [22, 0]], color: O.pantsD, alpha: 0.7 }] : null });
    const fx = ax, sh = front ? ellipse(fx, -7, 17, 8, 16) : spline([[fx - 16, -12], [fx + 6, -15], [fx + 28, -6], [fx + 24, 0], [fx - 16, 0]], true, 4);
    shape(ctx, sh, { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  });
  // sweater (turtleneck), tucked with a thin belt
  const torso = spline([[-52, -380], [-40, -398], [40, -398], [52, -380], [44, -310], [46, -282], [-44, -282], [-46, -310]], true, 6);
  shape(ctx, torso, { fill: O.top, line: 4.2, seed: 50, grain: 0.35, breaks: 0.2,
    shade: view === 'back' || front ? null : [{ pts: [[22, -400], [70, -400], [70, -270], [26, -270]], color: O.topD, alpha: 0.5 }] });
  shape(ctx, rrect(-45, -298, 91, 14, 5), { fill: O.belt, line: 2.8, seed: 51, grain: 0.2, breaks: 0.3 });
  if (O.collar === 'tie') {
    shape(ctx, [[-22, -400], [0, -380], [22, -400], [34, -384], [0, -362], [-34, -384]], { fill: PAL.white, line: 3.2, seed: 52, grain: 0.2, breaks: 0.1 });
    shape(ctx, [[-8, -376], [8, -376], [14, -310], [0, -296], [-14, -310]], { fill: O.tie, line: 3, seed: 53, grain: 0.3, breaks: 0.1 });
  } else {
    shape(ctx, rrect(-20, -424, 42, 30, 10), { fill: O.top, line: 3.4, seed: 52, grain: 0.3, breaks: 0.2 });
    for (let i = 0; i < 3; i++) ink(ctx, [[-16, -418 + i * 9], [18, -418 + i * 9]], 2, { seed: 53 + i, color: O.topD, taper: false });
  }
  drawHead(ctx, pose, view, face, t, O);
  if (view === 'back') { drawArm(ctx, pose, 'B', 70); }
  drawArm(ctx, pose, 'F', 60);
  ctx.restore();
}

// kneeling on one knee (facing +x): back knee on the floor, front foot flat; hips drop by 150
function drawKneelLegs(ctx, O) {
  const leg = (P, seed, col) => { ink(ctx, P, 44, { seed, taper: false, wob: 0.05 }); const o = reg(seed, 1); ink(ctx, move(P, o[0] * 0.6, o[1] * 0.6), 35, { seed: seed + 1, taper: false, wob: 0.04, color: col }); };
  leg([[-16, -128], [-20, -24], [-96, -20]], 44, O.pantsD);
  shape(ctx, spline([[-150, -30], [-100, -38], [-92, -6], [-150, -4]], true, 4), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  leg([[18, -128], [96, -134], [100, -30]], 46, O.pants);
  shape(ctx, spline([[84, -18], [110, -22], [140, -8], [136, 0], [84, 0]], true, 4), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
}
function hairQ() {
  return spline([[-8, -566], [-54, -546], [-74, -500], [-72, -452], [-90, -432], [-74, -424], [-50, -440], [-36, -490], [-8, -514], [28, -516], [54, -512], [60, -530], [34, -560]], true, 6);
}
function drawHead(ctx, pose, view, face, t, O) {
  const blink = pose.blink ?? 0, look = pose.look || [0, 0];
  if (view === 'front' || view === 'back') {
    const bob = spline([[-64, -524], [0, -566], [64, -524], [70, -454], [92, -432], [70, -426], [0, -440], [-70, -426], [-92, -432], [-70, -454]], true, 6);
    if (O.hairdo !== 'crop') shape(ctx, bob, { fill: O.hair, line: 0, seed: 60, grain: 0.3 });
    if (view === 'back') { shape(ctx, spline([[-66, -520], [0, -568], [66, -520], [70, -440], [0, -418], [-70, -440]], true, 6), { fill: O.hair, line: 0, seed: 61, grain: 0.3 });
      if (O.band) ink(ctx, spline([[-60, -528], [-20, -560], [26, -560], [62, -528]], false, 6), 10, { color: O.band, seed: 63, taper: false }); return; }
    shape(ctx, ellipse(0, -478, 54, 64, 36), { fill: O.skin, line: 4, seed: 61, grain: 0.15, breaks: 0.25 });
    shape(ctx, spline([[-58, -500], [-44, -548], [16, -560], [60, -508], [30, -518], [-6, -510], [-32, -518]], true, 6), { fill: O.hair, line: 0, seed: 62, grain: 0.3 });
    if (O.band) ink(ctx, spline([[-58, -516], [-20, -552], [26, -552], [60, -516]], false, 6), 10, { color: O.band, seed: 63, taper: false });
    [-21, 21].forEach((x, i) => eye(ctx, x + look[0], -484 + look[1], face, blink, i));
    ink(ctx, spline([[2, -482], [-7, -458], [5, -455]], false, 4), 3.4, { seed: 64 });
    mouth(ctx, 0, -436, face);
    cheeks(ctx, [[-34, -458], [34, -458]]);
    return;
  }
  // 3/4 and profile (facing +x): ONE outline that runs down the forehead, out to the nose point and back
  if (O.hairdo !== 'crop') shape(ctx, hairQ(), { fill: O.hair, line: 0, seed: 65, grain: 0.3 });
  const side = view === 'side';
  const chain = side ? [[48, -490], [46, -512], [30, -540], [-8, -552], [-46, -536], [-60, -496], [-56, -454], [-36, -424], [-4, -410], [24, -412], [40, -424], [44, -442], [50, -458]]
    : [[52, -488], [50, -512], [34, -538], [-6, -552], [-44, -536], [-60, -496], [-56, -454], [-38, -424], [-8, -410], [22, -412], [38, -424], [44, -442], [52, -458]];
  const tip = side ? [94, -470] : [88, -470];
  const head = [...spline(chain, false, 6), tip];
  shape(ctx, head, { fill: O.skin, line: 4, seed: 66, grain: 0.15, breaks: 0.12 });
  // bangs sweep over the forehead + headband; the crop is a short side-parted cap with a sideburn
  if (O.hairdo === 'crop') shape(ctx, spline([[-62, -470], [-60, -520], [-34, -556], [14, -566], [50, -548], [58, -520], [34, -532], [4, -528], [-24, -516], [-44, -494], [-46, -470]], true, 6), { fill: O.hair, line: 0, seed: 68, grain: 0.3 });
  else shape(ctx, spline([[-44, -522], [-12, -562], [40, -552], [58, -522], [40, -514], [8, -512], [-20, -506]], true, 6), { fill: O.hair, line: 0, seed: 68, grain: 0.3 });
  if (O.band) ink(ctx, spline([[-54, -512], [-24, -552], [22, -560], [52, -536]], false, 6), 10, { color: O.band, seed: 69, taper: false });
  const E = side ? [[30, -492]] : [[6, -490], [38, -493]];
  E.forEach(([x, y], i) => eye(ctx, x + look[0], y + look[1], face, blink, i, i === 1 ? 0.78 : 1));
  mouth(ctx, side ? 32 : 28, -432, face);
  cheeks(ctx, side ? [[2, -458]] : [[-14, -458]]);
}

function eye(ctx, x, y, face, blink, i, sx = 1) {
  if (face === 'happy' || blink > 0.5 || (face === 'wink' && i === 0)) {
    const up = face === 'happy' || face === 'wink';
    ink(ctx, up ? [[x - 8 * sx, y + 3], [x, y - 5], [x + 8 * sx, y + 3]] : [[x - 8 * sx, y], [x + 8 * sx, y]], 4, { seed: 80 + i, taper: false });
  } else {
    const r = face === 'wow' ? 8.5 : 6.8;
    shape(ctx, ellipse(x, y, r * 0.8 * sx, r * 1.3, 14), { fill: PAL.ink, line: 0, grain: 0, off: [0, 0] });
    shape(ctx, ellipse(x + 1.5, y - 3.5, 2.2, 2.6, 8), { fill: PAL.white, line: 0, grain: 0, off: [0, 0] });
  }
  const by = face === 'wow' ? y - 25 : face === 'focus' ? y - 14 : y - 19, tilt = face === 'focus' ? (i ? -3 : 3) : 0;
  ink(ctx, [[x - 9 * sx, by + tilt], [x + 9 * sx, by - tilt - 2]], 3.4, { seed: 90 + i, taper: true });
}
function mouth(ctx, x, y, face) {
  if (face === 'happy') shape(ctx, spline([[x - 16, y - 6], [x + 12, y - 8], [x + 4, y + 11], [x - 10, y + 9]], true, 6), { fill: PAL.coralD, line: 3.2, seed: 95, grain: 0, breaks: 0 });
  else if (face === 'wow') shape(ctx, ellipse(x - 2, y + 2, 7, 10, 16), { fill: PAL.coralD, line: 3.2, seed: 96, grain: 0, breaks: 0 });
  else if (face === 'focus') { ink(ctx, [[x - 12, y], [x + 8, y - 2]], 3.4, { seed: 97 }); shape(ctx, ellipse(x + 8, y + 4, 5.5, 4.5, 10), { fill: PAL.coralL, line: 2.4, seed: 98, grain: 0, breaks: 0 }); }
  else if (face === 'wink') ink(ctx, spline([[x - 16, y - 4], [x - 3, y + 6], [x + 11, y - 6]], false, 5), 3.6, { seed: 99 });
  else ink(ctx, spline([[x - 12, y - 2], [x - 1, y + 4], [x + 9, y - 3]], false, 5), 3.4, { seed: 100 });
}
function cheeks(ctx, pts) { pts.forEach(([x, y], i) => shape(ctx, ellipse(x, y, 11, 7.5, 14), { fill: PAL.pink, line: 0, grain: 0, seed: 101 + i, alpha: 0.85 })); }

// props held in a hand. J = arm joints (local units).
function drawProp(ctx, prop, J, pose) {
  const [hx, hy] = J.ha;
  if (prop.kind === 'phone') {
    ctx.save(); ctx.translate(hx + (prop.dx ?? 16), hy + (prop.dy ?? -30)); ctx.rotate(prop.rot ?? -0.2);
    shape(ctx, rrect(-26, -46, 52, 92, 10), { fill: PAL.ink, line: 0, seed: 130, grain: 0.1, off: [0, 0] });
    shape(ctx, rrect(-20, -38, 40, 70, 5), { fill: prop.screen || PAL.white, line: 0, seed: 131, grain: 0, off: [0, 0] });
    shape(ctx, ellipse(0, -8, 11, 11, 16), { fill: PAL.coral, line: 2, seed: 132, grain: 0 });
    ctx.restore();
  } else if (prop.kind === 'mug') {
    drawMug(ctx, hx + (prop.dx ?? 10), hy + (prop.dy ?? -4), prop.s ?? 0.5, prop.steam ?? 0);
  } else if (prop.kind === 'pot') {
    drawPercolator(ctx, hx + (prop.dx ?? 0), hy + (prop.dy ?? 0), prop.s ?? 0.5, prop.rot ?? 0, prop);
  } else if (prop.kind === 'clip') {
    ctx.save(); ctx.translate(hx + 8, hy - 20); ctx.rotate(prop.rot ?? -0.15);
    shape(ctx, rrect(-34, -44, 68, 92, 6), { fill: PAL.kraft, line: 3, seed: 135 });
    shape(ctx, rect(-26, -34, 52, 72), { fill: PAL.white, line: 0, seed: 136, grain: 0.1 });
    for (let i = 0; i < 4; i++) ink(ctx, [[-18, -20 + i * 15], [18 - (i % 2) * 8, -20 + i * 15]], 2.6, { seed: 137 + i, taper: false });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- the example products: a stove-top percolator and a mug
// o: { light 0..1 (the knob lamp), lid 0..1 (lid lifted), body, bodyD, steam 0..1 }
function drawPercolator(ctx, x, y, s = 1, rot = 0, o = {}) {
  const body = o.body || LOOK.product, bodyD = o.bodyD || LOOK.productD;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  if (o.key && typeof track === 'function') track('key', -130, -300, 176, 0, 'percolator');   // engine/safe.js: o.key = the beat's key object
  // handle + spout behind
  ink(ctx, spline([[92, -190], [168, -200], [176, -110], [96, -60]], false, 6), 17, { seed: 240, taper: false, wob: 0.06 });
  shape(ctx, [[-84, -196], [-130, -222], [-120, -178]], { fill: PAL.chrome, line: 4, seed: 241, grain: 0.1 });
  // body: a fat barrel with a darker flat plane on the right
  shape(ctx, spline([[-90, -230], [90, -230], [112, -120], [96, -20], [-96, -20], [-112, -120]], true, 7), { fill: body, line: 5, seed: 242, grain: 0.3,
    shade: [{ pts: [[40, -240], [130, -240], [130, 0], [56, 0]], color: bodyD, alpha: 0.65 }] });
  shape(ctx, rect(-100, -122, 200, 14), { fill: PAL.white, line: 0, seed: 243, grain: 0.1 });
  // glass knob on the lid, lifts with o.lid
  const lift = (o.lid ?? 0) * -46;
  ctx.save(); ctx.translate(0, lift);
  shape(ctx, spline([[-80, -230], [-50, -254], [50, -254], [80, -230]], true, 5), { fill: PAL.chrome, line: 4.5, seed: 244, grain: 0.1 });
  shape(ctx, ellipse(0, -276, 24, 24, 20, Math.PI, TAU), { fill: (o.light ?? 0) > 0.5 ? PAL.coral : PAL.paperD, line: 4, seed: 245, grain: 0 });
  ctx.restore();
  // dial + feet
  shape(ctx, ellipse(0, -60, 22, 22, 24), { fill: PAL.white, line: 4, seed: 246, grain: 0.1 });
  ink(ctx, [[0, -60], [14 * Math.cos(o.dial ?? -0.8), 14 * Math.sin(o.dial ?? -0.8) - 60]], 4, { seed: 247, taper: false });
  shape(ctx, rect(-80, -20, 26, 16), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 }); shape(ctx, rect(54, -20, 26, 16), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  ctx.restore();
}
function drawMug(ctx, x, y, s = 1, steam = 0, fill = PAL.mustard) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ink(ctx, ellipse(78, -62, 36, 40, 20, -1.5, 1.5), 12, { seed: 250, taper: false });
  shape(ctx, [[-70, -120], [70, -120], [56, 0], [-56, 0]], { fill, line: 5, seed: 251, grain: 0.3, shade: [{ pts: [[22, -130], [90, -130], [90, 0], [34, 0]], color: PAL.mustardD, alpha: 0.7 }] });
  shape(ctx, ellipse(0, -120, 70, 14, 30), { fill: PAL.brown, line: 4, seed: 252, grain: 0.2 });
  if (steam > 0) for (let i = 0; i < 3; i++) { const u = (twos(TT * 0.8) + i / 3) % 1; ink(ctx, spline([[-30 + i * 30, -150 - u * 60], [-42 + i * 30, -180 - u * 60], [-26 + i * 30, -210 - u * 60]], false, 6), 6, { seed: 253 + i, color: PAL.inkSoft, alpha: steam * (1 - u) }); }
  ctx.restore();
}

// a held-drawing breath: tiny vertical settle, on twos. add to pose.y
const idle = (t, amp = 2, seed = 0) => Math.sin(twos(t) * 2.2 + seed) * amp;
// blink schedule: returns 1 for ~0.13 s at each time in ts (film seconds)
const blinkAt = (t, ts) => ts.some((b) => t > b && t < b + 0.13) ? 1 : 0;
