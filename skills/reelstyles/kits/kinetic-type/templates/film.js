// Sample film for kinetic-type: 11 s. Five beats: title slam → poster stack → flash-word ticker → slot-machine swap → logo reveal.
// Rules this file follows: one focal point per shot, every word keeps moving after it lands, text ≥ 28 px, shots tile 0..DUR.
const DUR = 11;

// ---- 1. title slam (0 - 2.2)
shot(0, 2.2, (t) => {
  small('STUDIO PRESENTS', W / 2, 330, t, { t0: 0.25, col: PAL.amber });
  echo('MOTION', W / 2, 520, 330, t, { anim: 'drop', t0: 0.75, stagger: 0.07, dur: 0.7, col: PAL.pink, alpha: 0.7, drift: 1.5 });
  word('MOTION', W / 2, 520, 330, t, { anim: 'drop', t0: 0.15, stagger: 0.07, dur: 0.7, shadow: PAL.violet, drift: 1.5 });
  small('WORDS ARE THE ACTORS', W / 2, 760, t, { t0: 1.0, size: 40 });
}, pushCam(0, 2.2, 1.0, 1.08, 40, 0, (t) => shake(t, 0.62, 16)));

// ---- 2. poster stack (2.2 - 4.2)
shot(2.2, 4.2, (t) => {
  stack([{ s: 'MAKE', col: PAL.cream }, { s: 'WORDS', col: PAL.violet }, { s: 'MOVE', col: PAL.mint }], 540, 330, t, { t0: 2.3, gap: 0.2, drift: 3 });
}, pushCam(2.2, 4.2, 1.0, 1.06, -50, 20), { base: PAL.ink, blobs: [[PAL.pink, 0.15, 0.2, 760], [PAL.violet, 0.85, 0.85, 700], [PAL.mint, 0.95, 0.1, 480]] });

// ---- 3. flash-word ticker (4.2 - 6.6): one hard-cut word per beat, each its own colour field
[['FAST', PAL.mint, PAL.ink], ['LOUD', PAL.pink, PAL.cream], ['CLEAR', PAL.amber, PAL.ink], ['BOLD', PAL.violet, PAL.cream]].forEach(([s, bg, fg], i) => {
  const a = 4.2 + i * 0.6;
  shot(a, a + 0.6, (t) => {
    word(s, W / 2, 540, 440, t, { cond: 0.82, anim: 'slam', t0: a, stagger: 0.025, dur: 0.26, col: fg, shadow: i % 2 ? PAL.ink : PAL.cream + '55', drift: 2 });
  }, (t) => { const k = seg(t, a, a + 0.6), e = shake(t, a, 18, 10); return [W / 2 + e[0], H / 2 + e[1], lerp(1.1, 1.0, EZ.o3(k * 1.6)) + k * 0.03, 0]; },
  { base: bg, blobs: [['#FFFFFF', 0.25, 0.2, 700], [PAL.ink, 0.9, 0.9, 600]] });
});

// ---- 4. slot swap (6.6 - 8.6): a static line + a window of rolling words, the last one lands and pops
const SLOT = ['SCROLL', 'SWIPE', 'SKIP', 'STAY'], SLOT_COL = [PAL.cream, PAL.pink, PAL.violet, PAL.amber];
shot(6.6, 8.6, (t) => {
  word('PEOPLE', W / 2, 250, 150, t, { cond: 0.9, t0: 6.7, anim: 'rise', mask: true, col: PAL.cream, drift: 1 });
  const step = 300, wy = 640;
  const pos = [6.95, 7.25, 7.55].reduce((a, ti) => a + EZ.back(seg(t, ti, ti + 0.24)), 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, wy - 175, W, 350); ctx.clip();
  SLOT.forEach((s, k) => {
    const y = wy + (k - pos) * step; if (Math.abs(y - wy) > step) return;
    word(s, W / 2, y, 300, t, { cond: 0.82, anim: 'fade', t0: -9, dur: 0.1, col: SLOT_COL[k], drift: 1.2 });
  });
  ctx.restore();
  const lk = 1 + Math.sin(t * 2.6) * 0.15;   // window hairlines breathe so the frame is never dead
  ctx.fillStyle = PAL.cream; ctx.globalAlpha = 0.8; ctx.fillRect(W / 2 - 520 * lk, wy - 182, 1040 * lk, 5); ctx.fillRect(W / 2 - 520 * lk, wy + 177, 1040 * lk, 5); ctx.globalAlpha = 1;
}, pushCam(6.6, 8.6, 1.0, 1.06, 0, -30), { base: PAL.ink2, blobs: [[PAL.blue, 0.8, 0.2, 760], [PAL.pink, 0.1, 0.9, 600]] });

// ---- 5. logo reveal (8.6 - 11): letters fly in and spin to place, dot pops, bracket + light line close, tagline
shot(8.6, 11, (t) => {
  const size = 340, name = 'orbit', tw = _layout(name, size, 1, 0).total, dot = 62, gap = 22;
  const total = tw + gap + dot, left = W / 2 - total / 2, cy = 500;
  brackets(t, 9.2, PAL.cream, 1240, 480, W / 2, 520);
  word(name, left + tw / 2, cy, size, t, { anim: 'spin', t0: 8.75, stagger: 0.07, dur: 0.6, drift: 0.4 });
  const dk = spring((t - 9.35) * 1.3, 6, 0.4);
  if (dk > 0) { ctx.fillStyle = PAL.amber; ctx.beginPath(); ctx.arc(left + tw + gap + dot / 2, cy + size * 0.30 - Math.sin(t * 3) * 4, dot / 2 * Math.max(0, dk), 0, TAU); ctx.fill(); }
  // light line: grows from the middle, then a bright glint loops along it
  const lk = EZ.o5(seg(t, 9.5, 10.1)), ly = 690, half = 520 * lk;
  if (lk > 0) {
    ctx.fillStyle = 'rgba(246,241,231,0.35)'; ctx.fillRect(W / 2 - half, ly, half * 2, 4);
    const gx = W / 2 - half + ((t * 0.9) % 1) * half * 2, g = ctx.createLinearGradient(gx - 140, 0, gx + 140, 0);
    g.addColorStop(0, 'rgba(255,181,52,0)'); g.addColorStop(0.5, PAL.amber); g.addColorStop(1, 'rgba(255,181,52,0)');
    ctx.fillStyle = g; ctx.fillRect(Math.max(W / 2 - half, gx - 140), ly - 2, Math.min(280, W / 2 + half - gx + 140), 8);
  }
  small('MOTION FOR EVERY WORD', W / 2, 760, t, { t0: 9.9, size: 36, col: PAL.cream });
}, pushCam(8.6, 11, 1.0, 1.05, 0, 0), { base: PAL.ink, blobs: [[PAL.violet, 0.2, 0.3, 760], [PAL.pink, 0.75, 0.85, 640], [PAL.mint, 0.92, 0.2, 520]] });

// transitions: slanted wipes on the cuts between beats (the ticker cuts hard on the beat)
wipeTo(2.2, 0.5, PAL.violet, PAL.pink);
wipeTo(4.2, 0.4, PAL.mint, PAL.amber);
wipeTo(6.6, 0.4, PAL.pink, PAL.violet);
wipeTo(8.6, 0.5, PAL.amber, PAL.violet);

mountFilm(DUR);
