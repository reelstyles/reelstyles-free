// =====================================================================
//  sets/metaphors-v.js: the metaphors re-staged for vertical (9:16) Shorts with ONE big hero (Pip at sc ~2, 60-70% of the
//  frame). The camera sits close (zoom 2.2-2.4 on the logical stage: the frame shows ~410 x 730 logical px); every prop is
//  drawn for that window around the hero, ground GV = 855, the point of the metaphor in yellow, 1-3 grey props.
//    MV.<name>.at(L, side)     where the hero stands for picture side 'A' (weak way) or 'B' (strong way): { x (hip), y (ground) }
//    MV.<name>.draw(L, side)   the set (props, ground); .top(L, side, J) optional, drawn over the hero (a load on his back)
//    frameV(at, o, draw)       AUTO-FRAMING: measures Pip's pose first, then shifts the stage so his pose box is centred on
//                              x 540 and his top lands at y ~525 (under the label band), then draws set + hero. Every pose
//                              (push, cheer, walk) stays whole without per-shot camera numbers; the camera only zooms.
//    heroV(at, o)              Pip: o = { sc, pose (POSES name, pose object, { from, to, k }), ex, dir, ph }
//  Names: wall, stairs, weight, domino, gap, summit.
// =====================================================================
const GV = 855;
const MV = {};
const poseOf = (p, ph = 0) => (typeof p === 'string' ? (p === 'walk' ? walk(ph) : P(POSES[p])) : p && p.from ? mixPose(poseOf(p.from, ph), poseOf(p.to, ph), EZ.io(p.k)) : P(p || {}));
function heroV(at, o, extra = false) { return figure(at.x, at.y, poseOf(o.pose || 'idle', o.ph ?? TT * 1.6), { sc: o.sc ?? 1.95, dir: o.dir ?? 1, ph: TT, seed: 3, ex: o.ex || 'calm', lw: 8, far: 0.7, extra, a: extra ? 0 : 1 }); }
function frameV(at, o, draw) {
  const J = heroV(at, o, true), s = o.sc ?? 1.95, pad = 8 * s / 2;   // invisible measuring pass (alpha 0, not tracked)
  const xs = [J.head[0] - FIG.head * s, J.head[0] + FIG.head * s, J.hand[0][0], J.hand[1][0], J.foot[0][0], J.foot[1][0], J.elbow[0][0], J.elbow[1][0]];
  const x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(J.top, J.hand[0][1], J.hand[1][1]) - pad;
  const m = ctx.getTransform(), k = m.a, mid = 0.8 * (x0 + x1) / 2 + 0.2 * J.hip[0];   // the box centre, a little the hip (steadier on swings)
  ctx.save(); ctx.translate((540 - (k * mid + m.e)) / k, (525 + (o.lift ?? 0) - (k * y0 + m.f)) / k);
  draw(); ctx.restore();
}
function stepsV(x0, y0, n, w, h, accentTop) {
  ctx.save(); styleFor(false, 7);
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.rect(x0 + i * w, y0 - (i + 1) * h, w * (n - i), h); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  if (accentTop) flag(x0 + n * w - 26, y0 - n * h, 120, TT, true);
}

MV.wall = {
  at: (L, side) => (side === 'A' ? { x: 400, y: GV } : { x: 400 + 40 * EZ.io(seg(L, 0, 2)), y: GV }),
  draw: (L, side) => {
    ground(GV, 0, 1000, L, side === 'A' ? 6 : 40);
    if (side === 'A') { wall(615, GV, 170, 580, L, 3); for (let i = 0; i < 3; i++) { const u = (L * 1.8 + i / 3) % 1; ctx.save(); ctx.strokeStyle = PAL.g2; ctx.lineWidth = 5; alpha(1 - u); ctx.beginPath(); ctx.moveTo(620 - 20 * u, GV - 320 - i * 40); ctx.lineTo(600 - 20 * u, GV - 320 - i * 40); ctx.stroke(); ctx.restore(); } return; }
    wall(150, GV, 110, 580, L, 0); door(590, GV, 150, 440, EZ.o3(seg(L, 0.2, 0.9)), EZ.o3(seg(L, 0.3, 1.0)));
  },
};
MV.stairs = {
  at: (L, side) => { if (side === 'A') { const u = seg(L, 0, 0.6); return { x: 420 - 30 * EZ.o3(u), y: GV - 50 * Math.sin(Math.PI * u) }; } const st = Math.min(2, Math.floor(L * 1.2)); return { x: 550 + st * 60, y: GV - (st + 1) * 55 }; },
  draw: (L, side) => { ground(GV, 0, 1000, L, 0); stepsV(500, GV, 4, 60, 55, true); if (side === 'A') puff(440, GV, L, 0.55); },
};
MV.weight = {
  at: () => ({ x: 480, y: GV }),
  draw: (L, side) => ground(GV, 0, 1000, L, side === 'A' ? 8 : 50),
  top: (L, side, J) => {
    if (side === 'A') { block(J.sh[0] - 60, J.sh[1] + 60, 160, 140, { rot: 22, label: 'WORRY', size: 34 }); sweat(J.head[0] + 30, J.head[1], L, 3); }
    else { const u = EZ.o3(seg(L, 0, 0.9)); block(lerp(J.sh[0], J.sh[0] + 260, u), lerp(J.sh[1], J.sh[1] - 120, u) + 300 * u * u, 150, 130, { rot: -70 * u, label: 'WORRY', size: 30, a: 1 - seg(L, 1.0, 1.6) }); chev(J.hip[0] + 60, J.hip[1] - 120, L, 3, PAL.accent); }
  },
};
MV.domino = {
  at: () => ({ x: 420, y: GV }),
  draw: (L, side) => {
    ground(GV, 0, 1000, L, 0);
    const sizes = [[520, 26, 60], [565, 38, 110], [620, 54, 190], [695, 80, 330]];
    if (side === 'A') { sizes.forEach(([x, w, h], i) => domino(x, GV, w, h, i === 3 ? 2 * Math.sin(L * 2) : 0, i === 3)); return; }
    sizes.forEach(([x, w, h], i) => domino(x, GV, w, h, 84 * EZ.i2(seg(L, 0.25 + i * 0.3, 0.55 + i * 0.3)), i === 0));
    puff(740, GV, L, 1.5);
  },
};
MV.gap = {
  at: (L, side) => (side === 'A' ? { x: 470, y: GV } : { x: 470 + 120 * EZ.io(seg(L, 0.5, 2)), y: GV }),
  draw: (L, side) => {
    ctx.save(); styleFor(false, 7); ctx.beginPath(); ctx.rect(0, GV, 570, 400); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.rect(680, GV, 400, 400); ctx.fill(); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 4; i++) { const u = (L * 0.8 + i / 4) % 1; ctx.save(); ctx.fillStyle = PAL.g2; alpha(1 - u); ctx.beginPath(); ctx.arc(600 + i * 20, GV + 40 + u * 220, 6, 0, TAU); ctx.fill(); ctx.restore(); }   // pebbles falling into the gap
    if (side === 'B') { const k = EZ.o3(seg(L, 0, 0.5)); ctx.save(); styleFor(true, 8); ctx.beginPath(); ctx.rect(560, GV - 18, 130 * k, 22); ctx.fill(); ctx.stroke(); ctx.restore(); }   // the plank: the point
  },
};
MV.summit = {
  at: () => ({ x: 490, y: GV }),
  draw: () => {
    ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.g3; ctx.fillStyle = '#0b0b0b'; ctx.beginPath(); ctx.moveTo(60, GV + 40); ctx.lineTo(300, GV - 330); ctx.lineTo(400, GV - 250); ctx.lineTo(580, GV - 400); ctx.lineTo(940, GV + 40); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();   // the peaks he climbed, behind him
    ctx.save(); styleFor(false, 7); ctx.beginPath(); ctx.moveTo(0, GV + 500); ctx.lineTo(380, GV); ctx.lineTo(620, GV); ctx.lineTo(1000, GV + 500); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();   // the summit ledge
    flag(600, GV, 330, TT, true);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + TT * 0.3, r = 300 + 20 * Math.sin(TT * 2 + i); ctx.save(); ctx.strokeStyle = PAL.accent; ctx.lineWidth = 5; alpha(0.35); ctx.beginPath(); ctx.moveTo(500 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.7); ctx.lineTo(500 + Math.cos(a) * (r + 40), 520 + Math.sin(a) * (r + 40) * 0.7); ctx.stroke(); ctx.restore(); }
  },
};
