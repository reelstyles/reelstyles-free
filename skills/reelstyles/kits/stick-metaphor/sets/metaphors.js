// =====================================================================
//  sets/metaphors.js: the six ready metaphors ("moves"). Each is M.name(L, d, opts): L = seconds into the beat, d = beat length.
//  Every one is its own picture with its own camera feel; none is stretched over the whole Short.
//
//    M.split(L, d, {left, right, still, question:[l1, l2, accentChar]})   hard way vs smart way (the loop beat: still=true)
//    M.grow(L, d, {labels:[3]})                                           today / a month / a year: stacks build, figures rise
//    M.stairs(L, d, {a, b})                                               stairs vs slope to the same flag
//    M.drop(L, d, {words:[3], goal})                                      carrying weight, throwing it off, keeping the goal
//    M.door(L, d, {force, find})                                          pushing a wall, then finding the door
//    M.domino(L, d, {tip})                                                one small push topples ever bigger dominoes
//  New metaphor = copy one, keep the rules: 1-3 grey props, accent only on the point, text only through text().
// =====================================================================
const M = {};
function lab(str, x, y, L, t0, o = {}) {
  const f = t0 <= -1 ? 1 : fade(L, t0, 0.3); if (f <= 0.01) return;
  text(str, x, y + (1 - f) * 18 + 1.8 * Math.sin(L * 1.7 + x * 0.01), { size: o.size || 42, weight: 800, a: (o.a ?? 1) * f, color: o.color, maxW: o.maxW || 430, align: o.align });
}
const cyc = (L, per) => ((L % per) + per) % per;

// ---------- 1. hard way vs smart way (also the looping end beat) ----------
M.split = (L, d, o = {}) => {
  const left = o.left || 'HARD WAY', right = o.right || 'SMART WAY';
  const a = o.still ? 0 : L, ph = L, gy = 725;
  let qa = 0;
  if (o.question) qa = EZ.o3((L - (-d + 0.2)) / 0.35) * (1 - EZ.o3((L + 0.55) / 0.45));
  // moving dashed divider
  ctx.save(); ctx.strokeStyle = PAL.g3; ctx.lineWidth = 5; ctx.setLineDash([20, 18]); ctx.lineDashOffset = -ph * 34;
  ctx.beginPath(); ctx.moveTo(500, 300); ctx.lineTo(500, 800); ctx.stroke(); ctx.restore();
  const f = EZ.o3(seg(a, 2.5, 3.0)), f2 = EZ.o3(seg(a, 2.6, 3.0));
  ground(gy, 40, 485, ph, 22 * (1 - f)); ground(gy, 515, 960, ph, 150 * (1 - 0.8 * f2));
  // hard way: bare block, strained walk in place
  const hardP = mixPose(walk(ph * 0.8, { amp: 13, bend: 26, lean: 30, arms: [80, 84], extra: { tilt: 14, hx: 2.2 * Math.sin(ph * 38) } }),
    P({ lean: 66, tilt: 25, al1: 36, al2: 8, ar1: 30, ar2: 6, tl1: 28, tl2: -14, tr1: 18, tr2: -8 }), f);
  const jh = figure(205, gy, hardP, { ph, seed: 1, sq: 1 - 0.1 * f * (1 - EZ.o3(seg(a, 3.0, 3.6))) });
  const bx = jh.hand[0][0] + 6 + (q8(ph * 2) * 7 % 3) * 0.7;
  block(bx + 82, gy, 164, 156, { rot: 0 });
  for (let i = 0; i < 3; i++) { const u = (ph * 2.6 + i / 3) % 1; ctx.save(); ctx.strokeStyle = PAL.g2; ctx.lineWidth = 5; alpha(1 - u); ctx.beginPath(); ctx.moveTo(bx + 164 + 14 + 26 * u, gy - 8 - i * 7); ctx.lineTo(bx + 164 + 40 + 26 * u, gy - 8 - i * 7); ctx.stroke(); ctx.restore(); }
  if (f < 0.9) sweat(jh.head[0] - 14, jh.head[1], ph, 3);
  // smart way: same block on a cart whose wheels are the point (accent)
  const smartP = mixPose(walk(ph * 1.15, { amp: 27, bend: 50, lean: 7, arms: [72, 64] }),
    P({ lean: -3, tilt: -6, al1: 168, al2: 176 + 12 * Math.sin(ph * 9), ar1: 20, ar2: 10, tl1: 4, tl2: 0, tr1: -4, tr2: 0, look: 2 }), f2);
  const js = figure(585, gy, smartP, { ph, seed: 2, air: 10 * Math.max(0, Math.sin(seg(a, 2.9, 3.4) * Math.PI)) });
  const cx0 = js.hand[0][0] + 4, wr = 30, wspin = ph * 150 * (1 - 0.8 * f2) / wr;
  block(cx0 + 84, gy - 2 * wr + 2, 168, 100, { rot: 0 });
  wheel(cx0 + 36, gy - wr, wr, wspin, true); wheel(cx0 + 132, gy - wr, wr, wspin, true);
  if (f2 < 0.9) chev(cx0 + 195, gy - 70, ph, 2, PAL.g2);
  lab(left, 260, 190, L, -1, { a: 1 - qa }); lab(right, 740, 190, L, -1, { a: 1 - qa });
  if (o.question && qa > 0.01) {
    const q = o.question;
    text(q[0], 500, 205, { size: 60, weight: 800, a: qa, maxW: 880 });
    const r = text(q[1], 500 - 20, 295, { size: 60, weight: 800, a: qa, maxW: 880 });
    if (q[2]) text(q[2], r.cx + r.w / 2 + 14, 295, { size: 60, weight: 800, a: qa, color: PAL.accent, align: 'left', track: 0 });
  }
};

// ---------- 2. growth row: today / a month / a year ----------
M.grow = (L, d, o = {}) => {
  const labs = o.labels || ['TODAY', '1 MONTH', '1 YEAR'];
  const gy = 790, xs = [190, 500, 810], counts = [1, 3, 6], bh = 46, bw = 150;
  const t0 = [0.05, 0.55, 1.2], gap = [0.25, 0.24, 0.27];
  ground(gy, 40, 960, L, 28);
  xs.forEach((x, c) => {
    let landed = 0, lastT = -9;
    for (let i = 0; i < counts[c]; i++) {
      const ti = t0[c] + i * gap[c], u = (L - ti) / 0.26;
      if (u <= 0) continue;
      const fall = u < 1 ? (1 - EZ.i2(u)) * 380 : 0;
      landed += clamp((L - ti - 0.24) / 0.1); if (u >= 0.95) lastT = ti + 0.25;
      const by = gy - i * bh + wob(L, c * 7 + i, 0.8) * 0.5 - fall;
      block(x, by + (u >= 1 ? 0 : 0), bw - i * 3, bh + 2, { accent: c === 2 && i === 5, lw: 6, a: 1 });
    }
    const topY = gy - bh * landed, sc = [0.72, 0.84, 0.98][c];
    const arms = c === 2 ? seg(L, 3.0, 3.25) : 0;
    const pose = mixPose(P({ lean: 2, al1: 10, al2: 16, ar1: -10, ar2: -16, tl1: 4, tr1: -4 }), P({ lean: -2, al1: 165, al2: 176 + 10 * Math.sin(L * 10), ar1: 168, ar2: 180 - 10 * Math.sin(L * 10), tl1: 6, tr1: -6 }), EZ.o3(arms));
    if (L > t0[c] - 0.02 || c === 0) figure(x, topY, pose, { sc, ph: L, seed: c * 2 + 1, sq: land(L, lastT, 0.1), air: c === 2 ? 16 * Math.max(0, Math.sin(seg(L, 3.25, 3.75) * Math.PI)) : 0 });
    lab(labs[c], x, 872, L, [-1, 0.45, 1.1][c], { size: 40, maxW: 300 });
  });
};

// ---------- 3. stairs vs slope ----------
M.stairs = (L, d, o = {}) => {
  const sc = 0.62, nSteps = 5, sh = 40, tw = 130;
  const yA = (i) => 480 - sh * i, xT = (i) => 105 + 130 * i;
  // lane A: stairs
  ctx.save(); ctx.strokeStyle = PAL.g1; ctx.lineWidth = 8; ctx.fillStyle = PAL.fill; ctx.beginPath(); ctx.moveTo(60, 520);
  ctx.lineTo(60, yA(0)); ctx.lineTo(170, yA(0));
  for (let i = 1; i <= nSteps; i++) { ctx.lineTo(170 + (i - 1) * tw, yA(i)); ctx.lineTo(170 + i * tw, yA(i)); }
  ctx.lineTo(940, yA(nSteps)); ctx.lineTo(940, 520); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  // lane B: slope
  const yB = (x) => 860 - 200 * clamp((x - 105) / 650);
  ctx.save(); ctx.strokeStyle = PAL.g1; ctx.lineWidth = 8; ctx.fillStyle = PAL.fill; ctx.beginPath(); ctx.moveTo(60, 900); ctx.lineTo(60, 860); ctx.lineTo(105, 860); ctx.lineTo(755, 660); ctx.lineTo(940, 660); ctx.lineTo(940, 900); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  flag(850, yA(nSteps), 110, L, false); flag(850, 660, 110, L, true);
  // figure A hops tread to tread
  let ia = 0, ua = 0; const tA = (i) => 0.35 + i * 0.66;
  for (let i = 0; i < nSteps; i++) if (L >= tA(i)) { ia = i + 1; ua = seg(L, tA(i), tA(i) + 0.36); }
  const prev = Math.max(0, ia - 1), e = ia === 0 ? 0 : EZ.io(ua), hop = ia === 0 ? 0 : Math.sin(ua * Math.PI);
  const xa = lerp(xT(prev), xT(ia), e), ya = lerp(yA(prev), yA(ia), e);
  const tired = ia > 0 ? 1 : 0.4, end = seg(L, tA(nSteps - 1) + 0.4, tA(nSteps - 1) + 0.8);
  const poseA = mixPose(P({ lean: 14 * tired, tilt: 8, al1: 30 * tired, al2: 6, ar1: 10, ar2: 4, tl1: 70 * hop, tl2: 12 * hop, tr1: -8 * hop, tr2: -4 }),
    P({ lean: 40, tilt: 20, al1: 40, al2: 10, ar1: 36, ar2: 8, tl1: 22, tl2: -14, tr1: 14, tr2: -8 }), EZ.o3(end));
  const jA = figure(xa, ya, poseA, { sc, ph: L, seed: 3, sq: land(L, ia ? tA(ia - 1) + 0.36 : -9, 0.16) });
  sweat(jA.head[0] - 8, jA.head[1], L, 3);
  // figure B strolls up the ramp, arrives first and cheers
  const wB = seg(L, 0.15, 2.95), xb = lerp(105, 755, EZ.io(wB * 0.9 + 0.1 * wB));
  const cheer = EZ.o3(seg(L, 3.0, 3.25));
  const poseB = mixPose(walk(L * 1.55, { amp: 24, bend: 44, lean: 9 }), P({ lean: -2, al1: 168, al2: 178 + 10 * Math.sin(L * 10), ar1: 12, ar2: 8 }), cheer);
  figure(xb, yB(xb), poseB, { sc, ph: L, seed: 4, air: 12 * Math.max(0, Math.sin(seg(L, 3.1, 3.6) * Math.PI)) });
  lab(o.a || 'STAIRS', 70, 160, L, -1, { align: 'left', maxW: 400 }); lab(o.b || 'SLOPE', 70, 565, L, -1, { align: 'left', maxW: 400 });
};

// ---------- 4. drop what weighs ----------
M.drop = (L, d, o = {}) => {
  const words = o.words || ['PAST', 'DOUBT', 'NOISE'], gy = 800, bh = 86, bw = 220;
  const tt = [2.3, 1.7, 1.1];                                  // throw times: top block first
  const remaining = tt.reduce((n, t) => n + (L < t ? 1 : 0), 0);
  const smoothRem = tt.reduce((n, t) => n + 1 - EZ.o3(seg(L, t, t + 0.25)), 0);
  const load = smoothRem / 3, done = EZ.o3(seg(L, 2.55, 2.9));
  const sh = Math.sin(L * 50) * (0.4 + 2.6 * load) * (1 - done);
  const squat = P({ lean: -2, al1: 160, al2: 174, ar1: 164, ar2: 178, tl1: 46, tl2: -38, tr1: 38, tr2: -34, hx: sh });
  const stand = P({ lean: 0, al1: 164, al2: 178, ar1: 168, ar2: 180, tl1: 5, tl2: 0, tr1: -5, tr2: 0 });
  const strut = walk(L * 1.7, { amp: 22, bend: 44, lean: 2, arms: [164, 178, 168, 180] });
  const pose = mixPose(mixPose(stand, squat, load * (1 - done)), strut, done * 0.9);
  ground(gy, 40, 960, L, 30 + 150 * done);
  const hop = Math.max(0, Math.sin(seg(L, 2.9, 3.5) * Math.PI)) * 24;
  const bumps = tt.map((t) => Math.max(0, Math.sin(seg(L, t, t + 0.3) * Math.PI)) * 14).reduce((a, b) => a + b, 0);
  const j = figure(500, gy, pose, { ph: L, seed: 5, air: hop + bumps, sq: land(L, 2.9, 0.1) });
  const hy = (j.hand[0][1] + j.hand[1][1]) / 2 - 4, hxm = (j.hand[0][0] + j.hand[1][0]) / 2 + wob(L, 3, 2.5) * load;
  block(hxm, hy, bw, bh, { accent: true, label: o.goal || 'GOAL', lw: 8, rot: wob(L, 1, 0.7) });
  [0, 1, 2].forEach((k) => {                                 // k=0 PAST (lowest), 1 DOUBT, 2 NOISE (top)
    const t = tt[k], by = hy - bh * (k + 1) - 4 * (k + 1);
    if (L < t) block(hxm + wob(L, k, 3) * load, by, bw, bh, { label: words[k], rot: wob(L, k + 4, 1.2) * load });
    else if (L < t + 0.9) {
      const u = L - t, dirx = k % 2 ? -1 : 1;
      block(hxm + dirx * 340 * u, by - 520 * u + 1500 * u * u + 0, bw, bh, { label: words[k], rot: dirx * 320 * u, a: 1 - seg(u, 0.6, 0.9) });
    }
  });
  if (remaining > 0) sweat(j.head[0] - 6, j.head[1], L, 3);
  chev(300, 700, L, 0, PAL.g2);
};

// ---------- 5. push the wall, find the door ----------
M.door = (L, d, o = {}) => {
  const gy = 770, wx = 610, ww = 300, wh = 440;
  ground(gy, 40, 960, L, 20);
  const per = 0.6, ncyc = 3, ram = L < per * ncyc, u = cyc(L, per);
  let dx = 0;
  if (ram) dx = u < 0.38 ? -72 * EZ.io(u / 0.38) : u < 0.5 ? -72 * (1 - EZ.i3((u - 0.38) / 0.12)) : 0;
  let shake = 0; for (let k = 0; k < ncyc; k++) { const tk = k * per + 0.5; if (L > tk) shake = 6 * Math.exp(-9 * (L - tk)); }
  wall(wx, gy, ww, wh, L, shake);
  const hitSq = ram && u >= 0.5 ? 1 - 0.1 * Math.exp(-14 * (u - 0.5)) : 1;
  const found = seg(L, 2.05, 2.45), turn = L > 2.25, go = EZ.io(seg(L, 2.3, 3.25));
  const doorPop = EZ.back(seg(L, 2.1, 2.5));
  const op = EZ.o3(seg(L, 3.2, 3.6));
  if (L > 2.1) { ctx.save(); ctx.translate(165, gy); ctx.scale(doorPop, doorPop); ctx.translate(-165, -gy); door(165, gy, 130, 270, op, EZ.o3(seg(L, 3.3, 3.8)) * (0.85 + 0.1 * Math.sin(L * 9))); ctx.restore(); }
  let x = 480 + dx, dir = 1, pose;
  if (!turn) {
    const lunge = ram && u >= 0.38 && u < 0.5 ? 1 : 0;
    const braced = P({ lean: 34, tilt: 6, al1: 96, al2: 98, ar1: 90, ar2: 92, tl1: -30, tl2: -6, tr1: 30, tr2: -4 + 6 * Math.sin(L * 30) });
    const away = P({ lean: -8, tilt: -4, al1: 20, al2: 30, ar1: 10, ar2: 20, tl1: 8, tl2: -6, tr1: -8, tr2: 0 });
    pose = ram ? (u < 0.38 ? mixPose(braced, away, EZ.io(u / 0.38)) : braced) : L < 2.0 ? P({ lean: 40, tilt: 20, al1: 40, al2: 12, ar1: 36, ar2: 10, tl1: 16, tl2: -10, tr1: 10, tr2: -6 }) : P({ lean: 0, tilt: -16, look: 3, al1: 6, al2: 12, tl1: 3, tr1: -3 });
    figure(x, gy, pose, { ph: L, seed: 6, sq: hitSq });
  } else {
    x = lerp(480, 275, go); dir = -1;
    pose = L < 3.25 ? walk((L - 2.25) * 1.9, { amp: 26, bend: 48, lean: 8 }) : P({ lean: 2, al1: 120, al2: 130, ar1: 8, ar2: 10, tl1: 3, tr1: -3 });
    if (L < 3.3) figure(x, gy, pose, { ph: L, seed: 6, dir }); else figure(x, gy, pose, { ph: L, seed: 6, dir, sq: land(L, 3.25, 0.1) });
  }
  const f1 = 1 - fade(L, 1.9, 0.25);
  lab(o.force || 'FORCE IT', 500, 190, L, -1, { a: f1 }); lab(o.find || 'FIND THE DOOR', 500, 190, L, 2.0, { maxW: 700 });
};

// ---------- 6. one small push, ever bigger dominoes ----------
M.domino = (L, d, o = {}) => {
  const gy = 780, X = [200, 250, 312, 382, 462, 560], Wd = [22, 26, 30, 36, 42, 50], Hd = [44, 68, 100, 142, 190, 250];
  const t = X.map((_, i) => 0.95 + i * 0.3), fin = [78, 76, 74, 72, 70, 86];
  ground(gy, 40, 960, L, 14);
  const poke = poseKeys([[0, { lean: 16, tl1: 70, tl2: -52, tr1: 62, tr2: -46, al1: 40, al2: 60, ar1: 20, ar2: 30 }], [0.55, { lean: 12, tl1: 70, tl2: -52, tr1: 62, tr2: -46, al1: -20, al2: 0, ar1: 20, ar2: 30 }, EZ.o2], [0.85, { lean: 26, tl1: 72, tl2: -52, tr1: 62, tr2: -46, al1: 75, al2: 100, ar1: 22, ar2: 30 }, EZ.i3], [1.25, { lean: 20, tl1: 66, tl2: -50, tr1: 60, tr2: -46, al1: 40, al2: 60, ar1: 20, ar2: 30 }]], L);
  const cheer = EZ.o3(seg(L, 2.9, 3.2));
  const pose = mixPose(poke, P({ lean: -3, al1: 168, al2: 178 + 10 * Math.sin(L * 10), ar1: 166, ar2: 178, tl1: 5, tr1: -5 }), cheer);
  figure(128, gy, pose, { sc: 0.72, ph: L, seed: 7, air: L > 3.1 ? 16 * Math.abs(Math.sin((L - 3.1) * 5.5)) : 0 });
  for (let i = 0; i < 6; i++) {
    const a = fin[i] * EZ.i2(seg(L, t[i], t[i] + 0.4)) + wob(L, i, 0.6) * (L < t[i] ? 1 : 0);
    domino(X[i], gy, Wd[i], Hd[i], a, i === 0);
    if (i >= 3) puff(X[i] + Wd[i] + Hd[i] * Math.sin(_rad(fin[i])), gy, L, t[i] + 0.4, 5, 8 + i * 2);
  }
  lab(o.tip || 'START SMALL', 215, 870, L, -1, { align: 'left', maxW: 520 });
};
