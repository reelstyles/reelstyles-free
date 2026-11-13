// =====================================================================
//  templates/film-v.js: the 34 s VERTICAL (1080x1920) kinetic-type Short, VS proverb format: "Slow and steady wins the race".
//  Copy it to the project root as film.js next to templates/vertical.html (as index.html). The 16:9 sample stays templates/film.js.
//  The hero is the word block (Hero, characters/cast.js): 2-3 stacked lines, 33-52% of the frame, centre (515, 1010), that act
//  (walk, reach, cheer, slump) in a mood (calm, loud, sad). One label per picture above it (label(), 64-76 px on an ink plate).
//  A new picture every 2 s (keys), hard cuts on the beat, each picture on its own set; neighbours never share a dark or a light base:
//    stage (ink, blobs) · mint / pink / amber / violet / coral fields with a ghost outline word · track (lane rules racing past)
//    · slot (hairlines over and under the block) · brackets (corner brackets around the block)
//  Frame 0 is mid-slam; the last picture keeps playing under the end card (DUR - 2).
// =====================================================================
const DUR = 34, CX = 515, CY = 1010;

const FIELD = (base, ink) => ({ theme: { base, blobs: [['#FFFFFF', 0.25, 0.15, 900], [PAL.ink, 0.85, 0.92, 900]] }, ink, ghost: true });
const SETS = {
  stage: { theme: { base: PAL.ink, blobs: [[PAL.violet, 0.15, 0.2, 980], [PAL.pink, 0.85, 0.75, 940], [PAL.mint, 0.2, 0.95, 760]] }, ink: PAL.cream },
  mint: FIELD(PAL.mint, PAL.ink), pink: FIELD(PAL.pink, PAL.cream), amber: FIELD(PAL.amber, PAL.ink),
  violet: FIELD(PAL.violet, PAL.cream), coral: FIELD(PAL.coral, PAL.ink),
  track: { theme: { base: PAL.ink2, blobs: [[PAL.blue, 0.85, 0.2, 980], [PAL.mint, 0.1, 0.9, 820]] }, ink: PAL.cream, lanes: true },
  slot: { theme: { base: PAL.ink2, blobs: [[PAL.blue, 0.1, 0.15, 980], [PAL.pink, 0.9, 0.9, 860]] }, ink: PAL.cream, rules: true },
  brackets: { theme: { base: PAL.ink, blobs: [[PAL.violet, 0.85, 0.15, 980], [PAL.coral, 0.1, 0.85, 860]] }, ink: PAL.cream, brackets: true },
};
// one picture = 2 s: set, label, hero lines (string = the set's ink colour, or {s, col}), pose, mood, entrance
const PICS = [
  { set: 'stage', label: 'WHO WINS?', hero: [{ s: 'FAST', col: PAL.pink }, { s: 'VS', col: PAL.amber, size: 200 }, { s: 'STEADY', col: PAL.mint }], pose: 'cheer', mood: 'loud', anim: 'slam' },
  { set: 'mint', label: 'THIS ONE RUNS', hero: ['FAST', 'FAST', 'FAST'], pose: 'walk', mood: 'loud', anim: 'drop' },
  { set: 'track', label: 'THIS ONE WALKS', hero: ['STEP', { s: 'BY', col: PAL.amber, size: 220 }, 'STEP'], pose: 'walk', mood: 'calm', anim: 'rise' },
  { set: 'pink', label: 'FAST IS FAR AHEAD', hero: ['WAY', 'OUT', 'FRONT'], pose: 'reach', mood: 'loud', anim: 'slam' },
  { set: 'slot', label: 'STEADY KEEPS GOING', hero: ['KEEP', { s: 'ON', col: PAL.mint, size: 220 }, 'GOING'], pose: 'walk', mood: 'calm', anim: 'rise' },
  { set: 'amber', label: 'FAST GETS TIRED', hero: ['SO', 'TIRED'], pose: 'slump', mood: 'sad', anim: 'drop' },
  { set: 'violet', label: 'FAST TAKES A NAP', hero: [{ s: 'ZZZ', col: PAL.amber, size: 220 }, 'NAP', 'TIME'], pose: 'slump', mood: 'sad', anim: 'pop' },
  { set: 'track', label: 'STEADY WALKS PAST', hero: ['STILL', { s: 'WALK', col: PAL.mint }, 'ING'], pose: 'walk', mood: 'calm', anim: 'rise' },
  { set: 'coral', label: 'FAST WAKES UP', hero: ['WAIT', 'WHAT?'], pose: 'reach', mood: 'loud', anim: 'slam', dir: -1 },
  { set: 'brackets', label: 'THE FINISH LINE', hero: ['ONE', { s: 'MORE', col: PAL.amber }, 'STEP'], pose: 'walk', mood: 'calm', anim: 'drop' },
  { set: 'mint', label: 'STEADY WINS', hero: ['STEADY', 'WINS!'], pose: 'cheer', mood: 'loud', anim: 'slam' },
  { set: 'pink', label: 'FAST LOSES', hero: ['TOO', 'LATE'], pose: 'slump', mood: 'sad', anim: 'drop' },
  { set: 'stage', label: 'THE LESSON', hero: [{ s: 'SLOW', col: PAL.mint }, { s: 'AND', col: PAL.amber, size: 220 }, { s: 'STEADY', col: PAL.pink }], pose: 'idle', mood: 'calm', anim: 'rise' },
  { set: 'amber', label: 'WINS THE RACE', hero: ['WINS', 'THE', 'RACE'], pose: 'cheer', mood: 'loud', anim: 'slam' },
  { set: 'slot', label: 'EVERY SINGLE DAY', hero: ['SMALL', { s: 'STEPS', col: PAL.amber }], pose: 'walk', mood: 'calm', anim: 'rise' },
  { set: 'violet', label: 'JUST DON\'T STOP', hero: ['DON\'T', { s: 'STOP', col: PAL.amber }], pose: 'cheer', mood: 'loud', anim: 'slam' },
];
const pic = () => { const i = keys(0, 2.0, PICS.map((_, k) => k)); return { i, p: PICS[i], T: i * 2 }; };

// lane rules racing past (the track set): dashed lines scroll left, faster for the runner
function lanes(t, sp) {
  ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = PAL.cream;
  for (const [y, k] of [[700, 1], [1010, 1.4], [1330, 1.8]]) { const o = (t * 420 * sp * k) % 160; for (let x = -160 - o; x < W + 160; x += 160) ctx.fillRect(x, y, 96, 8); }
  ctx.restore();
}
shot(0, DUR, (t) => {
  const { i, p, T } = pic(), S = SETS[p.set], first = (typeof p.hero[0] === 'string' ? p.hero[0] : p.hero[0].s);
  if (S.ghost) {   // ghost word: outline copy of the hero's first line at 2.7x, bleeding past the edges (decor, not tracked)
    const k = seg(t, T, T + 2);
    ctx.save(); ctx.translate(CX, CY); ctx.scale(2.6 + k * 0.3, 2.6 + k * 0.3); ctx.translate(-CX, -CY); ctx.globalAlpha = 0.22;
    word(first, CX, CY, 340, t, { cond: 0.82, outline: 4, col: S.ink, anim: 'fade', t0: T - 1, idle: 0, drift: 0, free: true, maxW: 900 });
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (S.lanes) lanes(t, p.mood === 'loud' ? 1.6 : 0.7);
  const hero = p.hero.map((l) => (typeof l === 'string' ? { s: l, col: S.ink } : l));
  const sh = S.ghost ? (S.ink === PAL.ink ? 'rgba(255,255,255,0.35)' : PAL.ink) : PAL.ink2;
  if (t >= DUR - 2) ctx.globalAlpha = lerp(1, 0.45, EZ.o3(seg(t, DUR - 2, DUR - 1.6)));   // under the end card the block keeps playing, dimmed
  const b = Hero(hero, t, { cx: CX, cy: CY, t0: T - 0.12, pose: p.pose, mood: p.mood, anim: p.anim, dir: p.dir ?? 1, shadow: sh, echoCol: S.ghost ? S.ink : PAL.pink });
  ctx.globalAlpha = 1;
  if (S.rules) {   // slot hairlines over and under the block, full width, breathing
    const lk = 1 + Math.sin(t * 2.6) * 0.08; ctx.fillStyle = PAL.cream; ctx.globalAlpha = 0.85;
    ctx.fillRect(CX - 470 * lk, b.y0 - 26, 940 * lk, 7); ctx.fillRect(CX - 470 * lk, b.y1 + 26, 940 * lk, 7); ctx.globalAlpha = 1;
  }
  if (S.brackets) brackets(t, T + 0.1, PAL.amber, Math.min(900, b.x1 - b.x0 + 70), b.y1 - b.y0 + 90, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
  label(p.label, { t0: T + 0.05 });
}, (t) => {   // camera: a push in on even pictures, a pull out on odd ones, drifting up or down; loud pictures land with a shake
  const { i, p, T } = pic(), k = EZ.io(seg(t, T, T + 2)), z = i % 2 ? lerp(1.05, 1.0, k) : lerp(1.0, 1.05, k);
  const e = p.mood === 'loud' ? shake(t, T + 0.15, 16, 8) : [0, 0];
  return [W / 2 + e[0], H / 2 + (k - 0.5) * (i % 2 ? 50 : -50) + e[1], z, 0];
}, () => SETS[pic().p.set].theme);

endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model']);
mountFilm(DUR);
