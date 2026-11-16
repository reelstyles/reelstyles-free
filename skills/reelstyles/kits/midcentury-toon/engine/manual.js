// =====================================================================
//  engine/manual.js: the instruction-sheet furniture of the look, all drawn with engine/toon.js.
//  Every helper takes the canvas context G first and the film time t where it animates.
//  LOOK is the one object a film edits to re-colour the furniture: grounds per step, the accent, the product colour.
//    stepHeader(G, t, t0, num, total, label)   ink numeral disc + "STEP n OF N" + slab title (revealed in place on twos).
//                                              Start it at transition end + 0.15 s (tc + dur*0.6 + 0.15), never while the wipe is still crossing it
//    tag(G, t, t0, str, x, y, o)               paper card with a star bullet, pops on its beat → {x,y,w,h}
//    callout(G, t, t0, cx, cy, r, inner, bg, leader)   round magnifier call-out with a dashed leader line
//    medallion(G, t, t0, x, y, i, r)           numbered stamp (the "door" the camera goes through)
//    caption(G, t, t0, t1, str)                the paper caption card, bottom-centre
//    banner(G, t, t0, x, y, w, kicker, str)    ribbon with a starburst kicker (tips, warnings)
//    title(G, t, t0, kicker, line, sub, cx, y) the poster / END-CARD title: script kicker, slab line, letter-spaced sub (fits inside the frame around cx)
//    curtainBurst(G, cx, cy, r, t, col)        slow-turning sunburst behind a reveal
// =====================================================================
const LOOK = {
  accent: PAL.coral,                              // presenter garment, stars, bullets
  product: PAL.teal, productD: PAL.tealD,         // the product keeps one colour through the film
  steps: [PAL.sky, PAL.mustard, PAL.olive],       // step grounds rotate through these (never the product colour)
};

function stepHeader(G, t, t0, num, total, label) {
  const k = eo(seg(twos(t), t0 + 0.05, t0 + 0.4));
  if (k <= 0) return;
  // revealed in place by a growing clip (the header never slides in through the frame edge, so no letter is ever cut mid-word)
  G.save(); G.beginPath(); G.rect(0, 40, 80 + 1300 * k, 190); G.clip();
  shape(G, ellipse(136, 136, 56, 56, 40), { fill: PAL.ink, line: 0, seed: 700, grain: 0.1, off: [0, 0] });
  text(G, String(num), 136, 160, { font: `64px ${FAMS.slab}`, fill: PAL.paper, align: 'center' });
  if (total) text(G, `STEP ${num} OF ${total}`, 214, 108, { font: `600 24px ${FAMS.sans}`, fill: PAL.ink, track: 7 });
  const f = fit(G, label, `{px}px ${FAMS.slab}`, 66, 1100, 1, 40);
  text(G, f.lines[0], 212, total ? 172 : 158, { font: f.font, fill: PAL.ink, plate: PAL.white, off: [4, 4] });
  G.restore();
}

function tag(G, t, t0, str, x, y, o = {}) {
  const p0 = pop(t, t0); if (p0 <= 0) return null;
  const k = 0.88 + 0.12 * p0, fade = clamp(p0 * 2.5);        // pops from 88 % with a fade: never a tiny unreadable tag mid pop-in
  const f = fit(G, str, `500 {px}px ${FAMS.sans}`, o.px || 40, o.maxW || 620, 2, 34);   // 34 px is the rubric floor
  const w = Math.max(...f.lines.map((l) => measure(G, l, f.font))) + 100, h = 32 + f.lines.length * f.px * 1.2;
  const X = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  G.save(); G.globalAlpha = fade; G.translate(X + w / 2, y + h / 2); G.scale(k, k); G.translate(-(X + w / 2), -(y + h / 2));
  shape(G, rrect(X, y, w, h, 14), { fill: PAL.paper, line: 3.6, seed: 710, grain: 0.15, off: [6, 5] });
  star(G, X + 40, y + h / 2, 18, { n: 8, inner: 0.42, fill: o.star || LOOK.accent, off: [0, 0], rot: t * 0.6 });
  f.lines.forEach((l, i) => text(G, l, X + 70, y + 16 + f.px * 0.92 + i * f.px * 1.2, { font: f.font, fill: PAL.ink }));
  G.restore();
  return { x: X, y, w, h };
}

function callout(G, t, t0, cx, cy, r, inner, bg, leader) {
  const k = back(seg(t, t0, t0 + 0.32), 1.5); if (k <= 0) return;
  const R = r * k;
  if (leader) {
    const a = Math.atan2(leader[1] - cy, leader[0] - cx);
    dashed(G, [[cx + Math.cos(a) * (R + 14), cy + Math.sin(a) * (R + 14)], leader], 4, 14, 10, -t * 40, PAL.ink, clamp(k));
    shape(G, ellipse(leader[0], leader[1], 9, 9, 12), { fill: PAL.ink, line: 0, off: [0, 0], grain: 0 });
  }
  shape(G, ellipse(cx, cy, R + 16, R + 16, 72), { fill: PAL.paper, line: 4.5, seed: 720, grain: 0.15, breaks: 0.05 });
  G.save(); G.beginPath(); G.arc(cx, cy, R, 0, TAU); G.clip();
  G.fillStyle = bg; G.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  G.translate(cx, cy); G.scale(k, k); inner(G); G.restore();
  ink(G, ellipse(cx, cy, R, R, 72), 4, { closed: true, seed: 721, breaks: 0.1 });
}

function medallion(G, t, t0, x, y, i, r = 104, icn = null) {
  const k = pop(t, t0, 0.24); if (k <= 0) return;
  G.save(); G.translate(x, y); G.scale(k, k); G.rotate((1 - k) * 0.4);
  star(G, 0, 0, r * 1.2, { n: 16, inner: 0.84, fill: PAL.white, off: [0, 0], rot: i * 0.2 });
  shape(G, ellipse(0, 0, r, r, 64), { fill: LOOK.steps[i % LOOK.steps.length], line: 5, seed: 730 + i, grain: 0.3 });
  if (icn) icon(G, icn, 0, 4, r * 1.25, { main: LOOK.product, light: PAL.white, dark: LOOK.productD });
  else text(G, String(i + 1), 0, r * 0.38, { font: `${Math.round(r * 1.1)}px ${FAMS.slab}`, fill: PAL.ink, plate: PAL.white, off: [5, 5], align: 'center' });
  if (icn) {
    shape(G, ellipse(-r * 0.74, -r * 0.74, r * 0.3, r * 0.3, 30), { fill: PAL.ink, line: 0, seed: 310 + i, grain: 0.1, off: [0, 0] });
    text(G, String(i + 1), -r * 0.74, -r * 0.74 + r * 0.14, { font: `${Math.round(r * 0.4)}px ${FAMS.slab}`, fill: PAL.paper, align: 'center' });
  }
  G.restore();
}

function caption(G, t, t0, t1, str) {
  const a = Math.min(ss(seg(t, t0, t0 + 0.16)), 1 - ss(seg(t, t1 - 0.16, t1)));
  if (a <= 0) return;
  const f = fit(G, str, `500 {px}px ${FAMS.sans}`, 44, 1360, 1, 30);
  const w = measure(G, f.lines[0], f.font) + 130, h = 80, x = W / 2 - w / 2, y = H - 58 - h;
  G.save(); G.globalAlpha = a; G.translate(0, (1 - a) * 10);
  shape(G, rrect(x, y, w, h, 12), { fill: PAL.paper, line: 3.2, seed: 901, grain: 0.15, breaks: 0.08, off: [5, 5] });
  star(G, x + 32, y + h / 2, 14, { n: 8, inner: 0.4, fill: LOOK.accent, off: [0, 0], rot: t * 0.8 });
  star(G, x + w - 32, y + h / 2, 14, { n: 8, inner: 0.4, fill: LOOK.accent, off: [0, 0], rot: -t * 0.8 });
  text(G, f.lines[0], W / 2, y + h / 2 + f.px * 0.34, { font: f.font, fill: PAL.ink, align: 'center' });
  G.restore();
}

function banner(G, t, t0, x, y, w, kicker, str, o = {}) {
  const k = pop(t, t0, 0.32, 1.5); if (k <= 0) return;
  const h = 96;
  G.save(); G.translate(x + w / 2, y + h / 2); G.scale(k, 1); G.translate(-(x + w / 2), -(y + h / 2));
  shape(G, ribbonPts(x, y, w, h), { fill: o.fill || PAL.rose, line: 4.2, seed: 740, grain: 0.3, breaks: 0.1, off: [7, 6] });
  star(G, x + 96, y + h / 2, 56, { n: 12, inner: 0.62, fill: LOOK.accent, line: 3.4, rot: t * 0.5, seed: 741 });
  text(G, kicker, x + 96, y + h / 2 + 11, { font: `28px ${FAMS.slab}`, fill: PAL.white, align: 'center', plate: PAL.ink, off: [2, 2] });
  const f = fit(G, str, `500 {px}px ${FAMS.sans}`, 44, w - 250, 1, 28);
  text(G, f.lines[0], x + 180, y + h / 2 + f.px * 0.34, { font: f.font, fill: PAL.ink });
  G.restore();
}

// the poster title block. t0 = start of the draw-on; the script kicker writes left to right
function title(G, t, t0, kicker, line, sub, cx = W / 2, y = 190) {
  const u = eo(seg(t, t0, t0 + 0.7)), half = Math.min(cx, W - cx) - 40;   // title never runs past the frame edge
  if (kicker && u > 0) {
    G.save(); G.beginPath(); G.rect(cx - 700, y - 190, 1400 * u, 260); G.clip();
    text(G, kicker, cx, y - 70, { font: `700 112px ${FAMS.script}`, fill: PAL.coral, plate: PAL.mustard, off: [4, 4], align: 'center', rot: -0.03 });
    G.restore();
  }
  const p = pop(t, t0 + 0.35, 0.4, 1.4);
  if (line && p > 0) { G.save(); G.translate(cx, y + 40); G.scale(p, p); const f = fit(G, line, `{px}px ${FAMS.slab}`, 150, 2 * half, 1, 50);
    text(G, f.lines[0], 0, f.px * 0.36, { font: f.font, fill: PAL.ink, plate: PAL.mustard, off: [7, 6], align: 'center' }); G.restore(); }
  if (sub) text(G, sub, cx, y + 150, { font: `600 38px ${FAMS.sans}`, fill: PAL.ink, track: 14, align: 'center', alpha: ss(seg(t, t0 + 0.9, t0 + 1.2)) });
}

function curtainBurst(G, cx, cy, r, t, col = PAL.mustard, n = 24) {
  rays(G, cx, cy, n, r, col, { rot: t * 0.12, k: 0.55, alpha: 0.9, r0: r * 0.42 });
}
