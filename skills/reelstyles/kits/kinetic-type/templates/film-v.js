// Vertical 9:16 sample for kinetic-type: 8.6 s, 1080x1920. Composed for a tall frame, not a re-scaled 16:9 film.
// Five beats: stacked title slam → tall poster stack → ghost-word ticker → tall slot swap → stacked logo reveal.
// Safe area: text/faces inside x 90-940, y 250-1470 (Shorts/Reels/TikTok UI covers top 250, bottom 450, right 140). Art fills the whole frame.
const DUR = 8.6;
const CX = 515, MW = 780;   // centre of the safe column and the widest word (x 90-940)
const WIPE = (tc, dur, a, b) => wipeTo(tc, dur, a, b, true, 220);   // rising slanted wipe: uses the height

// ---- 1. stacked title slam (0 - 1.8): two huge lines one above the other, camera pushes up the column
shot(0, 1.8, (t) => {
  small('STUDIO PRESENTS', CX, 340, t, { t0: 0.2, col: PAL.amber });
  echo('WORDS', CX, 660, 340, t, { anim: 'drop', t0: 0.5, stagger: 0.07, dur: 0.7, col: PAL.pink, alpha: 0.7, drift: 1.5, maxW: MW });
  word('WORDS', CX, 660, 340, t, { anim: 'drop', t0: 0.1, stagger: 0.07, dur: 0.7, shadow: PAL.violet, drift: 1.5, maxW: MW });
  word('MOVE', CX, 990, 340, t, { anim: 'drop', t0: 0.5, stagger: 0.07, dur: 0.7, col: PAL.mint, shadow: PAL.ink2, drift: -1.5, maxW: MW });
  small('KINETIC TYPE', CX, 1260, t, { t0: 1.0, size: 44 });
}, pushCam(0, 1.8, 1.0, 1.06, 0, -60, (t) => shake(t, 0.55, 16)),
{ base: PAL.ink, blobs: [[PAL.pink, 0.1, 0.12, 900], [PAL.violet, 0.9, 0.55, 980], [PAL.mint, 0.2, 0.95, 820]] });

// ---- 2. tall poster stack (1.8 - 3.5): four lines fill the column
shot(1.8, 3.5, (t) => {
  stack([{ s: 'MAKE', col: PAL.cream }, { s: 'WORDS', col: PAL.violet }, { s: 'MOVE', col: PAL.mint }, { s: 'LOUD', col: PAL.pink }, { s: 'NOW', col: PAL.amber }], 860, 270, t, { t0: 1.9, gap: 0.16, drift: 2, maxW: 720 });
}, pushCam(1.8, 3.5, 1.0, 1.03, -20, 40), { base: PAL.ink, blobs: [[PAL.pink, 0.15, 0.2, 980], [PAL.violet, 0.85, 0.85, 940], [PAL.mint, 0.95, 0.1, 700]] });

// ---- 3. two-line ticker (3.5 - 5.0): one hard-cut pair per beat (small lead word over a huge one) in a colour field; an outline copy bleeds edge to edge behind
[['GO', 'FAST', PAL.mint, PAL.ink], ['SAY', 'LOUD', PAL.pink, PAL.cream], ['BE', 'BOLD', PAL.violet, PAL.cream]].forEach(([lead, s, bg, fg], i) => {
  const a = 3.5 + i * 0.5;
  shot(a, a + 0.5, (t) => {
    const k = seg(t, a, a + 0.5);
    ctx.save(); ctx.translate(CX, 860); ctx.scale(2.6 + k * 0.3, 2.6 + k * 0.3); ctx.translate(-CX, -860);
    ctx.globalAlpha = 0.25; word(s, CX, 860, 340, t, { cond: 0.82, outline: 3, col: fg, anim: 'fade', t0: a - 1, idle: 0, maxW: MW, drift: 0 });
    ctx.restore(); ctx.globalAlpha = 1;
    word(lead, CX, 590, 400, t, { cond: 0.82, anim: 'slam', t0: a, stagger: 0.025, dur: 0.24, col: fg, drift: -2, maxW: MW });
    word(s, CX, 1050, 500, t, { cond: 0.82, anim: 'slam', t0: a + 0.06, stagger: 0.025, dur: 0.24, col: fg, shadow: i % 2 ? PAL.ink : PAL.cream + '55', drift: 2, maxW: MW });
  }, (t) => { const k = seg(t, a, a + 0.5), e = shake(t, a, 18, 10); return [W / 2 + e[0], H / 2 + e[1] - k * 40, lerp(1.1, 1.0, EZ.o3(k * 1.6)) + k * 0.03, 0]; },
  { base: bg, blobs: [['#FFFFFF', 0.25, 0.15, 900], [PAL.ink, 0.85, 0.9, 900]] });
});

// ---- 4. tall slot swap (5.0 - 6.8): static line above, rolling window in the middle, a payoff line below
const SLOT = ['SCROLL', 'SWIPE', 'SKIP', 'STAY'], SLOT_COL = [PAL.cream, PAL.pink, PAL.violet, PAL.amber];
shot(5.0, 6.8, (t) => {
  word('PEOPLE', CX, 560, 200, t, { cond: 0.9, t0: 5.1, anim: 'rise', mask: true, col: PAL.cream, drift: 1, maxW: MW });
  const step = 400, wy = 880, half = 190;
  const pos = [5.35, 5.65, 5.95].reduce((a, ti) => a + EZ.back(seg(t, ti, ti + 0.24)), 0);
  ctx.save(); ctx.beginPath(); ctx.rect(0, wy - half, W, half * 2); ctx.clip();
  SLOT.forEach((s, k) => {
    const y = wy + (k - pos) * step; if (Math.abs(y - wy) > step) return;
    word(s, CX, y, 300, t, { cond: 0.82, anim: 'fade', t0: -9, dur: 0.1, col: SLOT_COL[k], drift: 1.2, maxW: 700 });
  });
  ctx.restore();
  const lk = 1 + Math.sin(t * 2.6) * 0.1;   // window hairlines breathe, full width so the frame is never dead
  ctx.fillStyle = PAL.cream; ctx.globalAlpha = 0.8; ctx.fillRect(CX - 450 * lk, wy - half - 6, 900 * lk, 5); ctx.fillRect(CX - 450 * lk, wy + half + 1, 900 * lk, 5); ctx.globalAlpha = 1;
  word('ALL DAY', CX, 1230, 180, t, { cond: 0.9, t0: 6.1, anim: 'pop', col: PAL.amber, shadow: PAL.ink, drift: -1, maxW: MW });
}, pushCam(5.0, 6.8, 1.0, 1.05, 0, -40), { base: PAL.ink2, blobs: [[PAL.blue, 0.85, 0.15, 980], [PAL.pink, 0.1, 0.85, 860]] });

// ---- 5. stacked logo reveal (6.8 - 8.6): eyebrow, wordmark inside tall brackets, light line, two-line tagline
shot(6.8, 8.6, (t) => {
  const name = 'orbit', dot = 50, gap = 18, size = Math.min(300, 700 / (_layout(name, 100, 1, 0).total / 100));
  const tw = _layout(name, size, 1, 0).total, total = tw + gap + dot, left = CX - total / 2, cy = 880;
  brackets(t, 7.3, PAL.cream, 860, 840, CX, 900);
  small('MEET', CX, 640, t, { t0: 7.2, col: PAL.amber, size: 44 });
  word(name, left + tw / 2, cy, size, t, { anim: 'spin', t0: 6.95, stagger: 0.07, dur: 0.6, drift: 0.4 });
  const dk = spring((t - 7.5) * 1.3, 6, 0.4);
  if (dk > 0) { ctx.fillStyle = PAL.amber; ctx.beginPath(); ctx.arc(left + tw + gap + dot / 2, cy + size * 0.30 - Math.sin(t * 3) * 4, dot / 2 * Math.max(0, dk), 0, TAU); ctx.fill(); }
  const lk = EZ.o5(seg(t, 7.6, 8.1)), ly = 1060, hw = 360 * lk;
  if (lk > 0) {
    ctx.fillStyle = 'rgba(246,241,231,0.35)'; ctx.fillRect(CX - hw, ly, hw * 2, 4);
    const gx = CX - hw + ((t * 0.9) % 1) * hw * 2, g = ctx.createLinearGradient(gx - 120, 0, gx + 120, 0);
    g.addColorStop(0, 'rgba(255,181,52,0)'); g.addColorStop(0.5, PAL.amber); g.addColorStop(1, 'rgba(255,181,52,0)');
    ctx.fillStyle = g; ctx.fillRect(Math.max(CX - hw, gx - 120), ly - 2, Math.min(240, CX + hw - gx + 120), 8);
  }
  small('MOTION FOR', CX, 1160, t, { t0: 8.0, size: 48 });
  small('EVERY WORD', CX, 1225, t, { t0: 8.1, size: 48 });
}, pushCam(6.8, 8.6, 1.0, 1.05, 0, -30), { base: PAL.ink, blobs: [[PAL.violet, 0.2, 0.25, 980], [PAL.pink, 0.8, 0.8, 900], [PAL.mint, 0.95, 0.15, 700]] });

// transitions: rising slanted wipes on the cuts between beats (the ticker cuts hard on the beat)
WIPE(1.8, 0.5, PAL.violet, PAL.pink);
WIPE(3.5, 0.4, PAL.mint, PAL.amber);
WIPE(5.0, 0.4, PAL.pink, PAL.violet);  
WIPE(6.8, 0.5, PAL.amber, PAL.violet);

mountFilm(DUR);
