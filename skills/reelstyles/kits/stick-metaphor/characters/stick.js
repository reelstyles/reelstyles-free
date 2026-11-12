// =====================================================================
//  characters/stick.js: the round-head stick figure ("Pip"), forward kinematics, drawn as white lines.
//
//    figure(x, ground, pose, o) → joints      draw one figure. x = hip x, ground = floor y (the lowest foot is planted on it
//                                              automatically, so bobbing and crouches need no hip maths).
//        o: { dir: 1|-1 facing, sc: scale, sq: squash (1 = none, <1 = squashed), air: px above the floor, ph: idle clock (s),
//             seed, a: alpha, far: 0..1 dims the far limbs }
//        returns { hand: [[x,y],[x,y]], head: [x,y], hip, foot: [[x,y],[x,y]], top } in logical coordinates (props attach here)
//    pose fields (degrees, 0 = hanging straight down, + = toward the way the figure faces, 180 = straight up):
//        lean (torso, 0 = upright), tilt (head), al1 al2 (near arm: upper, lower), ar1 ar2 (far arm), tl1 tl2 (near leg:
//        thigh, shin), tr1 tr2 (far leg), hx (hip x offset), look (eye shift px)
//    poseKeys(list, L) → pose                 keyframes [[t, pose, ease?], ...]: snappy eased tweens between poses (keys() is engine/safe.js's shot stepper)
//    POSES.idle/reach/cheer/slump/crouch/recoil/push   ready poses for the hero (pass to figure, or mixPose two of them)
//    figure(..., { ex })                      expression on the round head: 'calm' 'happy' 'sad' 'shock' 'firm' (none = the classic one eye)
//    figure(..., { lw })                      line width in logical px before scale (default 11); vertical heroes use 8
//    figure() calls track('hero') / track('face') (engine/safe.js layout QA) unless o.extra
//    walk(phase, o) → pose                    walk cycle (phase in cycles); o: { amp, bend, lean, arms: [a1,a2] to override }
//    sweat(x, y, L) / puff(x, y, L, t0)       small effect drawings
// =====================================================================
const FIG = { head: 24, torso: 78, neck: 5, arm1: 44, arm2: 42, leg1: 62, leg2: 62, lw: 11 };
const POSE0 = { lean: 0, tilt: 0, al1: 6, al2: 12, ar1: -6, ar2: -12, tl1: 3, tl2: 0, tr1: -3, tr2: 0, hx: 0, look: 0 };
const P = (p) => Object.assign({}, POSE0, p);
const mixPose = (a, b, u) => { const o = {}; for (const k in POSE0) o[k] = a[k] + (b[k] - a[k]) * u; return o; };
function poseKeys(list, L) {
  const ks = list.map(([t, p, e]) => [t, P(p), e || EZ.o3]);
  if (L <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (L < ks[i][0]) return mixPose(ks[i - 1][1], ks[i][1], ks[i][2]((L - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
  return ks[ks.length - 1][1];
}
const POSES = {
  idle: {}, reach: { lean: 8, tilt: -22, al1: 168, al2: 176, ar1: -24, ar2: -12, tl1: 12, tl2: -6, tr1: -16, tr2: -12 },
  cheer: { lean: -3, tilt: -14, al1: 150, al2: 168, ar1: -150, ar2: -168, tl1: 12, tl2: 0, tr1: -12, tr2: 0 },
  slump: { lean: 32, tilt: 34, al1: 12, al2: 6, ar1: 6, ar2: 0, tl1: 26, tl2: -22, tr1: 14, tr2: -16 },
  crouch: { lean: 26, tilt: 30, al1: 40, al2: 70, ar1: 30, ar2: 60, tl1: 78, tl2: -62, tr1: 66, tr2: -72 },
  recoil: { lean: -22, tilt: -16, al1: 125, al2: 150, ar1: -105, ar2: -130, tl1: 26, tl2: 0, tr1: -22, tr2: -12 },
  push: { lean: 30, tilt: -12, al1: 70, al2: 100, ar1: 62, ar2: 95, tl1: 22, tl2: -10, tr1: -26, tr2: -10 },
};
function walk(ph, o = {}) {
  const A = o.amp ?? 28, bend = o.bend ?? 50, f = ph * TAU, g = f + Math.PI;
  const t1 = A * Math.sin(f), t2 = A * Math.sin(g);
  const p = { lean: o.lean ?? 5, tl1: t1, tl2: t1 - bend * (0.5 + 0.5 * Math.cos(f)), tr1: t2, tr2: t2 - bend * (0.5 + 0.5 * Math.cos(g)),
    al1: -0.8 * t1, al2: -0.8 * t1 + 14, ar1: -0.8 * t2, ar2: -0.8 * t2 + 14 };
  if (o.arms) { p.al1 = o.arms[0]; p.al2 = o.arms[1]; p.ar1 = o.arms[2] ?? o.arms[0]; p.ar2 = o.arms[3] ?? o.arms[1]; }
  return P(Object.assign(p, o.extra || {}));
}
const _rad = (d) => (d * Math.PI) / 180;
const _dv = (deg, len) => [Math.sin(_rad(deg)) * len, Math.cos(_rad(deg)) * len];   // from-down angle → x,y

function figure(x, ground, pose, o = {}) {
  const p = Object.assign({}, POSE0, pose), s = o.sc || 1, dir = o.dir || 1, ph = o.ph || 0, sd = o.seed || 0;
  const br = Math.sin(ph * TAU / 2.3 + sd), sw = Math.sin(ph * TAU / 3.1 + sd * 1.7);   // idle: never fully still
  const lean = p.lean + 1.3 * br, tilt = p.tilt + 2 * sw;
  const al1 = p.al1 + 2.4 * br, ar1 = p.ar1 - 2.4 * br, al2 = p.al2 + 3 * sw, ar2 = p.ar2 - 3 * sw;
  // local joints, hip at origin, y down, facing +x
  const up = [Math.sin(_rad(lean)), -Math.cos(_rad(lean))];
  const neck = [up[0] * FIG.torso, up[1] * FIG.torso];
  const hd = [Math.sin(_rad(lean + tilt)), -Math.cos(_rad(lean + tilt))];
  const head = [neck[0] + hd[0] * (FIG.head + FIG.neck), neck[1] + hd[1] * (FIG.head + FIG.neck)];
  const sh = [up[0] * (FIG.torso - 6), up[1] * (FIG.torso - 6)];
  const arm = (a1, a2) => { const e = _dv(a1, FIG.arm1), h = _dv(a2, FIG.arm2); return [[sh[0] + e[0], sh[1] + e[1]], [sh[0] + e[0] + h[0], sh[1] + e[1] + h[1]]]; };
  const leg = (a1, a2) => { const k = _dv(a1, FIG.leg1), f = _dv(a2, FIG.leg2); return [k, [k[0] + f[0], k[1] + f[1]]]; };
  const aN = arm(al1, al2), aF = arm(ar1, ar2), lN = leg(p.tl1, p.tl2), lF = leg(p.tr1, p.tr2);
  const low = Math.max(lN[1][1], lF[1][1]);
  const sq = o.sq || 1, air = o.air || 0, hx = p.hx;
  const T = (q) => [x + dir * (q[0] + hx) * s / Math.sqrt(sq), ground - air + (q[1] - low) * s * sq];   // squash widens by 1/sqrt(sq)
  const pt = (q) => T(q);
  const J = { hip: pt([0, 0]), neck: pt(neck), head: pt(head), sh: pt(sh), hand: [pt(aN[1]), pt(aF[1])], elbow: [pt(aN[0]), pt(aF[0])], knee: [pt(lN[0]), pt(lF[0])], foot: [pt(lN[1]), pt(lF[1])] };
  J.top = J.head[1] - FIG.head * s;
  // engine/look.js: contact + cast shadow on the floor, then a rim in the light's colour on the side that faces the light
  const lit = typeof LOOK !== 'undefined' && (o.a ?? 1) > 0 && o.rim !== false, Lt = lit ? mainLight() : null;
  if (lit && o.shadow !== false && air < 30) castShadow(x, ground, (J.foot[0][1] - J.top), 46 * s);
  ctx.save();
  alpha(o.a ?? 1);
  ctx.strokeStyle = PAL.white; ctx.lineWidth = (o.lw ?? FIG.lw) * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const line = (pts, dim) => { ctx.save(); if (dim) ctx.globalAlpha *= (o.far ?? 0.62); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); ctx.restore(); };
  const body = () => {
    line([J.sh, J.elbow[1], J.hand[1]], true);
    line([J.hip, J.knee[1], J.foot[1]], true);
    line([J.hip, J.neck]);
    line([J.hip, J.knee[0], J.foot[0]]);
    line([J.sh, J.elbow[0], J.hand[0]]);
    ctx.beginPath(); ctx.arc(J.head[0], J.head[1], FIG.head * s, 0, TAU); ctx.fill();
  };
  if (Lt) {
    const m = ctx.getTransform(), lx = (Lt.sx - m.e) / m.a, ly = (Lt.sy - m.f) / m.d, dx = lx - J.neck[0], dy = ly - J.neck[1], dl = Math.hypot(dx, dy) || 1, off = 3 * s;
    ctx.save(); ctx.translate((dx / dl) * off, (dy / dl) * off); ctx.strokeStyle = ctx.fillStyle = Lt.color; ctx.shadowColor = rgba(Lt.color, 0.45); ctx.shadowBlur = 12; ctx.globalAlpha *= 0.85;
    ctx.lineWidth = ((o.lw ?? FIG.lw) + 1) * s; body(); ctx.restore();
  }
  ctx.fillStyle = PAL.white; body();
  if (o.ex) face(J.head, s, dir, o.ex, o.ph || 0);
  else { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(J.head[0] + dir * (9 + p.look) * s, J.head[1] - 2 * s, 4.4 * s, 0, TAU); ctx.fill(); }   // one eye, looks where the figure faces
  ctx.restore();
  if (typeof track === 'function' && !o.extra) {   // engine/safe.js layout QA: the whole figure (hands included) and the head
    const xs = [J.head[0] - FIG.head * s, J.head[0] + FIG.head * s, J.hand[0][0], J.hand[1][0], J.foot[0][0], J.foot[1][0], J.elbow[0][0], J.elbow[1][0]], ys = [J.top, J.hand[0][1], J.hand[1][1], J.foot[0][1], J.foot[1][1]];
    const pad = (o.lw ?? FIG.lw) * s / 2;
    track('hero', Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad);
    track('face', J.head[0] - FIG.head * s, J.head[1] - FIG.head * s, J.head[0] + FIG.head * s, J.head[1] + FIG.head * s);
  }
  return J;
}
// the round head's features (black on white): eye, brow, mouth; s = figure scale, dir = facing
function face(h, s, dir, ex, ph) {
  const ex0 = h[0] + dir * 9 * s, ey = h[1] - 3 * s, blink = Math.floor(ph * 8) % 31 === 4;
  ctx.save(); ctx.fillStyle = '#000'; ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; ctx.lineWidth = 3.2 * s;
  const line = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  if (blink) line(ex0 - 4 * s, ey, ex0 + 4 * s, ey);
  else if (ex === 'happy') { ctx.beginPath(); ctx.arc(ex0, ey + 2 * s, 5 * s, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  else if (ex === 'shock') { ctx.beginPath(); ctx.arc(ex0, ey - 1 * s, 6.5 * s, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(ex0 + dir * 1.2 * s, ey - 1 * s, 2.6 * s, 0, TAU); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(ex0, ey + (ex === 'sad' ? 1.5 * s : 0), 4.6 * s, 0, TAU); ctx.fill(); }
  const by = ey - 9 * s;   // brow: the inner end is toward the back of the head
  if (ex === 'sad') line(ex0 - dir * 6 * s, by - 3 * s, ex0 + dir * 5 * s, by + 1 * s);
  else if (ex === 'firm') line(ex0 - dir * 6 * s, by + 2 * s, ex0 + dir * 6 * s, by - 2 * s);
  else if (ex === 'shock') line(ex0 - dir * 6 * s, by - 4 * s, ex0 + dir * 6 * s, by - 4 * s);
  const mx = h[0] + dir * 11 * s, my = h[1] + 10 * s;
  if (ex === 'happy') { ctx.beginPath(); ctx.moveTo(mx - 6 * s, my - 2 * s); ctx.quadraticCurveTo(mx, my + 7 * s, mx + 6 * s, my - 2 * s); ctx.closePath(); ctx.fill(); }
  else if (ex === 'shock') { ctx.beginPath(); ctx.ellipse(mx, my + 1 * s, 3.4 * s, 4.6 * s, 0, 0, TAU); ctx.fill(); }
  else if (ex === 'sad') { ctx.beginPath(); ctx.moveTo(mx - 5 * s, my + 3 * s); ctx.quadraticCurveTo(mx, my - 2 * s, mx + 5 * s, my + 3 * s); ctx.stroke(); }
  else line(mx - 5 * s, my, mx + 5 * s, my - (ex === 'firm' ? 0.5 : -1) * s);
  if (ex === 'sad') { ctx.fillStyle = PAL.g1; ctx.beginPath(); ctx.ellipse(ex0 - dir * 2 * s, ey + 8 * s + (Math.floor(ph * 6) % 3) * 2 * s, 2 * s, 3.4 * s, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// effects --------------------------------------------------------------
function sweat(x, y, L, n = 3) {                            // drops that bead, fall and fade, staggered
  ctx.save(); ctx.fillStyle = PAL.g1;
  for (let i = 0; i < n; i++) {
    const u = (((L * 1.4 + i / n) % 1) + 1) % 1, a = Math.sin(u * Math.PI);
    ctx.globalAlpha = GA * a * 0.9; ctx.beginPath(); ctx.ellipse(x + i * 15 - 14 + 6 * u, y - 20 + u * 62, 5, 8, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function puff(x, y, L, t0, n = 5, r = 16) {                 // dust ring: grey dots drift out and fade
  if (L < t0 || L > t0 + 0.8) return;
  const u = (L - t0) / 0.8; ctx.save(); ctx.fillStyle = PAL.g1;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI * 0.9 + (i % 2 ? 0.05 : 0), d = 12 + 60 * EZ.o3(u);
    ctx.globalAlpha = GA * (1 - u) * 0.8; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d * (i % 2 ? 1 : -1), y - 6 + Math.sin(a) * d * 0.5, r * (1 - u * 0.5) * (0.6 + 0.1 * (i % 3)), 0, TAU); ctx.fill();
  }
  ctx.restore();
}
