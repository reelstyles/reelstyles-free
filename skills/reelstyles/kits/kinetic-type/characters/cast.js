// =====================================================================
//  characters/cast.js: the kinetic-type hero. A type kit has no people: the hero is the WORD BLOCK, 1-4 stacked lines of
//  Archivo Black that act. Classic script; needs engine/runtime.js, engine/safe.js (9:16) and engine/kinetic.js first.
//    Hero(lines, t, o)   lines: ['FAST', 'VS', 'STEADY'] or {s, col, size}. Draws the block centred on (o.cx, o.cy), every line as big
//                        as fits o.maxW, stretched upright (tall) until the block is >= o.minH, shrunk when it passes o.maxH, then
//                        calls track('hero', ...) with its resting box (plus the pose's reach), so labelY() and the guard see it.
//      o.pose   'idle' | 'walk' (letters hop one after another, the block strides) | 'reach' (leans forward, letters stretch apart)
//               'cheer' (letters jump in a wave) | 'slump' (letters droop and tilt, the block sags)
//      o.mood   'calm' (soft shadow) | 'loud' (hard shadow, outline echoes behind the biggest line) | 'sad' (no shadow, slow, dimmed)
//      o.t0     entrance time; o.anim entrance ('drop' default, 'slam', 'rise', 'pop'); o.col default colour; o.shadow; o.dir 1 | -1 (reach/walk)
//    returns the screen-free world box {x0, y0, x1, y1} of the block (for furniture: brackets, hairlines).
//  9:16 framing (owner 11-02): the block is 30-52% of the frame height (minH 620, maxH 1000 by default), centre y ~1010, x 515.
// =====================================================================
const POSES = {
  idle: () => [0, 0, 0, 1],
  walk: (i, n, t, s, ln, sp) => { const p = t * 7 * sp + i * 1.25 + ln * 0.7; return [0, -Math.abs(Math.sin(p)) * s * 0.07, Math.sin(p) * 0.05, 1]; },
  reach: (i, n, t, s, ln, sp, dir) => [dir * (i - (n - 1) / 2) * s * 0.05 * (0.6 + 0.4 * Math.sin(t * 3 * sp)), 0, dir * 0.04, 1],
  cheer: (i, n, t, s, ln, sp) => { const j = Math.max(0, Math.sin(t * 7 * sp - i * 0.7 - ln * 0.9)); return [0, -j * s * 0.15, (i % 2 ? 1 : -1) * j * 0.06, 1 + j * 0.06]; },
  slump: (i, n, t, s, ln, sp) => [0, s * (i % 2 ? 0.07 : 0.02) + Math.sin(t * 1.4 * sp + i) * s * 0.012, (i % 2 ? 0.1 : -0.08) + Math.sin(t * 1.2 + i) * 0.025, 0.97],
};
// how far a pose moves letters past the resting box (fraction of the line size): [up, down, x per letter]
const REACH = { idle: [0.02, 0.02, 0], walk: [0.09, 0.02, 0], reach: [0.02, 0.02, 0.05], cheer: [0.19, 0.03, 0.01], slump: [0.03, 0.1, 0.02] };
const MOODS = {
  calm: { shadow: (c) => c, idle: 1, sp: 0.8, alpha: 1 },
  loud: { shadow: (c) => c, idle: 1.6, sp: 1.25, alpha: 1, echo: true },
  sad: { shadow: () => null, idle: 0.5, sp: 0.55, alpha: 0.88 },
};

function Hero(lines, t, o = {}) {
  const cx = o.cx ?? 515, cy = o.cy ?? 1010; let maxW = o.maxW ?? 740; const minH = o.minH ?? 620, maxH = o.maxH ?? 1000;
  const pose = POSES[o.pose] ? o.pose : 'idle', M = MOODS[o.mood] || MOODS.calm, dir = o.dir ?? 1, t0 = o.t0 ?? 0, cond = o.cond ?? 0.86;
  if (pose === 'reach' && o.maxW == null) maxW = 660;   // a leaning block needs room for its lean
  const L = lines.map((l) => (typeof l === 'string' ? { s: l } : l));
  // 1. size: every line as big as fits maxW (capped at its own size), then stretch upright to minH or shrink to maxH
  let sz = L.map((l) => { const w = _layout(l.s, 100, cond, 0).total / 100; return Math.min(l.size ?? o.size ?? 360, maxW / w); });
  const gapOf = (s) => s * 0.1;
  const height = (tall) => L.reduce((a, l, i) => { const b = wordBox(l.s, sz[i], cond, tall); return a + b.up + b.down + (i ? gapOf(sz[i]) * tall : 0); }, 0);
  let tall = 1, h = height(1);
  if (h > maxH) { sz = sz.map((s) => s * maxH / h); h = height(1); }
  if (h < minH) { tall = Math.min(1.6, minH / h); h = height(tall); }
  // 2. lay the lines from the top, drive each with the pose, the mood and the entrance
  const R = REACH[pose], lean = pose === 'reach' ? dir * 0.12 : pose === 'slump' ? -0.03 : 0;
  const stride = pose === 'walk' ? dir * Math.sin(t * 3.5 * M.sp) * 16 : pose === 'reach' ? dir * (10 + 8 * Math.sin(t * 3 * M.sp)) : 0;
  const sag = pose === 'slump' ? 10 + Math.sin(t * 1.2) * 8 : 0;
  const box = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  let y = cy - h / 2, big = 0;
  sz.forEach((s, i) => { if (s > sz[big]) big = i; });
  ctx.save();
  if (lean) { ctx.translate(cx, cy + h / 2); ctx.transform(1, 0, -lean, 1, 0, 0); ctx.translate(-cx, -cy - h / 2); }   // lean around the feet
  ctx.globalAlpha *= M.alpha;
  L.forEach((l, i) => {
    const s = sz[i], b = wordBox(l.s, s, cond, tall), ly = y + b.up + sag * (i / Math.max(1, L.length - 1));
    const col = l.col ?? o.col ?? PAL.cream, sh = M.shadow(l.shadow ?? o.shadow ?? PAL.ink2);
    const wo = { cond, tall, col, shadow: sh, anim: l.anim ?? o.anim ?? 'drop', t0: t0 + i * (o.gap ?? 0.14), stagger: o.stagger ?? 0.05, dur: o.dur ?? 0.55,
      idle: M.idle, drift: (i % 2 ? -1 : 1) * 0.8, maxW: maxW + 40, free: true, fx: (k, n, tt) => POSES[pose](k, n, tt, s, i, M.sp, dir) };
    if (M.echo && i === big) echo(l.s, cx + stride, ly, s, t, { ...wo, col: o.echoCol ?? PAL.pink, alpha: 0.55 }, 2);
    const r = word(l.s, cx + stride, ly, s, t, wo);
    const px = R[2] * s * (l.s.length - 1) / 2 + 18, ln = lean * (cy + h / 2 - r.y0);   // letters spread + drift; the lean shifts the top
    box.x0 = Math.min(box.x0, r.x0 - px + Math.min(0, ln)); box.x1 = Math.max(box.x1, r.x1 + px + Math.max(0, ln));
    if (i === 0) box.y0 = r.y0 - R[0] * s * tall;
    box.y1 = r.y1 + R[1] * s * tall + sag;
    y += b.up + b.down + gapOf(s) * tall;
  });
  ctx.restore();
  if (typeof track === 'function') { ctx.save(); track('hero', box.x0, box.y0, box.x1, box.y1, L.map((l) => l.s).join(' ')); ctx.restore(); }
  return box;
}
