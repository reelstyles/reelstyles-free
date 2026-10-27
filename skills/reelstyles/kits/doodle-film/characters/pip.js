// =====================================================================
//  characters/pip.js: Pip, a round-headed doodle kid, and a second cast member (Dot, a paper-white cat).
//  pip({x, y, s, face, ph, armL, armR, look, mouth, brow, hop, lean, hold})
//    x,y      feet on the ground (world)         s     scale (1 ≈ 300 px tall)       face  1 right, -1 left
//    ph       walk phase in radians (0 = standing; pass TT * 9 to walk). Idle breathing, blinking and scarf flutter always run.
//    armL/R   arm angle from hanging down, radians, positive swings forward   look [lx,ly] -1..1 pupils
//    mouth    'smile' | 'grin' | 'o' | 'flat' | 'sad'      brow 0..1 (0 calm, 1 startled)   hop 0..1 height of a jump   lean radians
//    hold     function(handX, handY) drawn in the right hand (local, upright), for the prop being carried
//  Seeds are fixed per body part so the hand-drawn wobble stays on-model between frames.
// =====================================================================
function pip(o) {
  const { x, y, s = 1, face = 1, ph = 0, armL = 0.25, armR = -0.25, look = [0.3, 0.1], mouth = 'smile', brow = 0, hop = 0, lean = 0, hold = null, tint = PAL.coral } = o;
  const breathe = Math.sin(TT * 3.1 + 1) * 3, walking = ph !== 0, bob = walking ? Math.abs(Math.sin(ph)) * -10 : breathe * 0.5;
  const blink = (TT % 2.6) > 2.5;
  ctx.save(); ctx.translate(x, y - hop * 120); ctx.scale(face * s, s); ctx.rotate(lean);
  if (typeof track === 'function' && !o.extra) { track('hero', -72, -345, 72, 12); track('face', -68, -312, 68, -182); }   // engine/safe.js layout QA (o.extra: a second Pip that is not the hero)
  // shadow scribble on the ground (shrinks as he jumps)
  ctx.save(); ctx.translate(0, hop * 120); ink(ellP(0, 4, 70 - hop * 20, 12), { c: PAL.faint, w: 4, seed: 3, dbl: false, a: 0.7 }); ctx.restore();
  const hip = [[-18, -66 + bob], [18, -66 + bob]], leg = (i, f) => {
    const sw = walking ? Math.sin(ph + (i ? Math.PI : 0)) : 0, lift = walking ? Math.max(0, Math.cos(ph + (i ? Math.PI : 0))) * 16 : 0;
    const fx = hip[i][0] + sw * 40 * f + (hop ? (i ? 12 : -4) : 0), fy = -lift - hop * 0;
    ink(splineP([hip[i], [(hip[i][0] + fx) / 2 + 6, (hip[i][1] + fy) / 2], [fx, fy - 6]]), { w: 9, seed: 11 + i, dbl: false });
    ink(ellP(fx + 12, fy - 3, 15, 8, 14), { w: 6, seed: 13 + i, dbl: false });          // shoe
  };
  leg(0, 1); leg(1, 1);
  // body: a bean in the jumper colour
  const body = splineP([[-34, -168 + bob], [32, -170 + bob], [40, -110 + bob * 0.5], [26, -62 + bob * 0.3], [-26, -62 + bob * 0.3], [-40, -112 + bob * 0.5], [-34, -168 + bob]], 6);
  shape(body, { c: tint, seed: 21, hc: PAL.coral, w: 6 });
  ink([[-36, -108 + bob], [36, -108 + bob]], { c: PAL.white, w: 6, seed: 23, a: 0.8, dbl: false });   // stripe
  // arms (behind head, in front of body)
  const sh = [[-34, -150 + bob], [34, -150 + bob]], arm = (i, a) => {
    const L = 78, hx = sh[i][0] + Math.sin(a) * L, hy = sh[i][1] + Math.cos(a) * L, ex = (sh[i][0] + hx) / 2 + Math.cos(a) * 8, ey = (sh[i][1] + hy) / 2 - Math.sin(a) * 8;
    ink(splineP([sh[i], [ex, ey], [hx, hy]]), { w: 8, seed: 31 + i, dbl: false }); ink(ellP(hx, hy, 8, 8, 12), { w: 5, seed: 33 + i, c: PAL.ink, dbl: false });
    return [hx, hy];
  };
  arm(0, armL); const rh = arm(1, armR);
  if (hold) hold(rh[0], rh[1]);
  // scarf: a mustard band with a tail that flutters on its own
  const fl = Math.sin(TT * 5) * 10, tail = splineP([[-24, -176 + bob], [-60, -168 + fl + bob], [-92, -150 + fl * 1.6 + bob], [-120, -158 + fl * 0.6 + bob]], 6);
  ink(tail, { c: PAL.mustard, w: 16, seed: 41, dbl: false, a: 0.95 }); ink(tail, { w: 3.5, seed: 42, dbl: false, a: 0.8 });
  shape(rectP(-40, -188 + bob, 80, 24), { c: PAL.mustard, seed: 43, hc: PAL.coral, w: 5, hatch: true });
  // head
  const hy = -246 + bob + (hop ? -6 : 0), head = ellP(0, hy, 66, 62, 34);
  shape(head, { c: PAL.blush, seed: 51, w: 6, off: [5, 4], hatch: false });
  for (let k = 0; k < 3; k++) ink(splineP([[-6 + k * 14, hy - 60], [-12 + k * 20 + Math.sin(TT * 4 + k) * 4, hy - 88 - k * 2], [-2 + k * 22, hy - 96 + (k === 1 ? -8 : 0)]]), { w: 6, seed: 55 + k, dbl: false });   // hair tuft
  ink(ellP(-30, hy + 22, 13, 9, 12), { c: PAL.coral, w: 8, seed: 58, a: 0.55, dbl: false }); ink(ellP(36, hy + 22, 13, 9, 12), { c: PAL.coral, w: 8, seed: 59, a: 0.55, dbl: false });
  const ex = [-22, 26], ey = hy - 4;
  ex.forEach((e, i) => {
    if (blink) { ink([[e - 11, ey], [e + 11, ey]], { w: 5, seed: 61 + i, dbl: false }); return; }
    const big = 11 + brow * 5; ink(ellP(e, ey, big, big + 3, 16), { w: 4, seed: 63 + i, c: PAL.ink, dbl: false, p: 1 }); fillLoose(ellP(e, ey, big, big + 3, 16), { c: PAL.white, hatch: false, off: [0, 0], a: 1, seed: 7 });
    ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(e + look[0] * 6, ey + look[1] * 6, 6 + brow * 1.5, 0, TAU); ctx.fill();
    ink([[e + (i ? 12 : -12), ey - big - 8 - brow * 10], [e + (i ? -12 : 12), ey - big - 16 - brow * 10]], { w: 5, seed: 65 + i, dbl: false });
  });
  const my = hy + 36;
  if (mouth === 'o') { fillLoose(ellP(2, my, 10, 13, 14), { c: PAL.coral, hatch: false, a: 1, off: [0, 0], seed: 3 }); ink(ellP(2, my, 10, 13, 14), { w: 5, seed: 71, dbl: false }); }
  else if (mouth === 'grin') { const m = splineP([[-24, my - 6], [-10, my + 10], [14, my + 10], [28, my - 8]]); ink(m, { w: 6, seed: 72, dbl: false }); ink([[-24, my - 6], [28, my - 8]], { w: 4, seed: 73, dbl: false }); }
  else if (mouth === 'flat') ink([[-12, my + 2], [16, my]], { w: 6, seed: 74, dbl: false });
  else if (mouth === 'sad') ink(splineP([[-14, my + 8], [2, my - 2], [18, my + 8]]), { w: 6, seed: 75, dbl: false });
  else ink(splineP([[-14, my], [2, my + 9], [18, my - 1]]), { w: 6, seed: 76, dbl: false });
  ctx.restore();
}

// Dot the cat: a small white sidekick with a tail that never stops, ears that twitch. Sits or walks (ph).
function dot(o) {
  const { x, y, s = 1, face = 1, ph = 0, sit = false, look = [0.4, 0], mouth = false } = o, bob = ph ? Math.abs(Math.sin(ph)) * -6 : Math.sin(TT * 2.6) * 2;
  ctx.save(); ctx.translate(x, y); ctx.scale(face * s, s);
  const tw = Math.sin(TT * 4.2) * 24, tail = splineP([[-50, -46 + bob], [-90, -60], [-112 + tw * 0.3, -110 + tw], [-92 + tw * 0.6, -150 + tw * 1.2]], 6);
  ink(tail, { w: 12, seed: 81, c: PAL.ink, dbl: false }); ink(tail, { w: 6, seed: 82, c: PAL.white, dbl: false });
  const bd = splineP([[-56, -30 + bob], [-44, -78 + bob], [20, -80 + bob], [56, -50 + bob], [50, -8], [-50, -8], [-56, -30 + bob]], 6);
  shape(bd, { c: PAL.white, seed: 83, hatch: true, hc: PAL.paperD, w: 5, a: 1 });
  for (let i = 0; i < 2; i++) { const lx = -28 + i * 66 + (ph ? Math.sin(ph + i * 3) * 10 : 0); ink([[lx, -12], [lx + 2, 2]], { w: 8, seed: 85 + i, dbl: false }); }
  const hx = 58, hy = -92 + bob;
  const hd = ellP(hx, hy, 40, 34, 24); shape(hd, { c: PAL.white, seed: 87, hatch: false, w: 5, a: 1 });
  const ear = Math.sin(TT * 6.5) > 0.92 ? -5 : 0;
  ink([[hx - 28, hy - 20], [hx - 26, hy - 56 + ear], [hx - 6, hy - 32]], { w: 5, seed: 88, dbl: false }); ink([[hx + 10, hy - 32], [hx + 26, hy - 58], [hx + 34, hy - 18]], { w: 5, seed: 89, dbl: false });
  const bl = (TT + 0.9) % 3.1 > 3.0;
  [[hx - 10, hy - 4], [hx + 16, hy - 4]].forEach(([ex, ey], i) => bl ? ink([[ex - 7, ey], [ex + 7, ey]], { w: 4, seed: 90 + i, dbl: false }) : (ctx.fillStyle = PAL.ink, ctx.beginPath(), ctx.arc(ex + look[0] * 3, ey + look[1] * 3, 6, 0, TAU), ctx.fill()));
  ink([[hx + 2, hy + 6], [hx + 8, hy + 12]], { w: 4, seed: 92, dbl: false });
  if (mouth) ink(splineP([[hx - 8, hy + 14], [hx + 4, hy + 20], [hx + 16, hy + 12]]), { w: 4, seed: 93, dbl: false });
  [-1, 1].forEach((d, i) => { ink([[hx + 12, hy + 6], [hx + 12 + d * 34, hy + 2 + d * 8]], { w: 3, seed: 95 + i, dbl: false, a: 0.7 }); });   // whiskers
  ctx.restore();
}
