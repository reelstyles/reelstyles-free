//  templates/film-look.js: a 10 s 16:9 model of the look layer (grade turn, three scenes from sets/sets.js, one light each,
//  depth layers, snow, a live story object with track('key'), 5 cuts with push + pan). Copy as film.js next to templates/index.html (data-duration 10).
// look-test: "Why your phone dies in the cold", 10 s, 5 shots, no voice.
//  0-2.2 night street, snow: Max under the street lamp, his phone at 20% and falling
//  2.2-4.4 closer, other side: 2%, Max shocked, it is -10 °C
//  4.4-6.6 home, cold grade: the board on the wall shows inside the battery: cold ions crawl
//  6.6-8.4 closer: the room warms, the ions race
//  8.4-10 wide payoff: the phone is back to 18%, Max cheers
const DUR = 10, X0 = 0, X1 = 5000, F = 900;

grade([[0, 'night'], [4.4, 'cold', 0.01], [7.2, 'warm', 0.8], [8.4, 'gold', 0.01]]);
street(X0, F, { mood: 'night' });
air('snow', { x: X0 - 1300, y: F - 1100, w: 2600, h: 1500, n: 140 });
interior(X1, F, { mood: 'warm', light: 'lamp', lx: -720, wallProps: [] });

// ---- the phone: a story object, drawn live so its number and bar can change
function lt_phone(x, y, s, pct, t0, t1) {   // (x, y) = bottom centre, board px
  live(t0, t1, (g, t) => {
    const p = Math.round(pct(t)), w = 170 * s, h = 300 * s;
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(20,22,30,0.35)'; g.beginPath(); g.ellipse(0, 6, w * 0.6, 14, 0, 0, TAU); g.fill();
    g.fillStyle = '#20242b'; g.beginPath(); g.roundRect(-w / 2, -h, w, h, 22 * s); g.fill();
    const sc = p <= 5 ? '#3a1f22' : '#d7eef2'; g.fillStyle = sc; g.beginPath(); g.roundRect(-w / 2 + 12 * s, -h + 26 * s, w - 24 * s, h - 52 * s, 10 * s); g.fill();
    const bw = 104 * s, bh = 48 * s, by = -h * 0.62;   // battery icon
    g.strokeStyle = p <= 5 ? '#e0523b' : '#20242b'; g.lineWidth = 7 * s; g.strokeRect(-bw / 2, by, bw, bh); g.fillStyle = g.strokeStyle; g.fillRect(bw / 2, by + bh * 0.3, 10 * s, bh * 0.4);
    g.fillStyle = p <= 20 ? '#e0523b' : '#2a9d5c'; g.fillRect(-bw / 2 + 6 * s, by + 6 * s, (bw - 12 * s) * Math.max(0.04, p / 100), bh - 12 * s);
    g.fillStyle = p <= 5 ? '#ff8a73' : '#20242b'; g.font = `bold ${Math.round(70 * s)}px ${HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${p}%`, 0, -h * 0.3);
    g.strokeStyle = PAL.ink; g.lineWidth = 6; g.beginPath(); g.roundRect(-w / 2, -h, w, h, 22 * s); g.stroke();
    ctx.setTransform(g.getTransform()); track('key', -w / 2, -h, w / 2, 0, 'phone'); ctx.setTransform(1, 0, 0, 1, 0, 0);
    g.restore();
  });
}
// ---- inside the battery: ions crossing, speed by temperature
function lt_battery(cx, cy, t0) {
  wash(rectW(cx - 330, cy - 230, 660, 420), '#fbf7ef', t0 - 1.2, 0.2, { a: 0.96 });                 // a board on the wall
  draw(box(cx - 330, cy - 230, 660, 420, 10), t0 - 1.2, 0.2, { nopen: true, w: 9, col: PAL.ghost });
  draw([...box(cx - 240, cy - 110, 440, 220, 18), ...box(cx + 200, cy - 40, 34, 80, 6)], t0 - 1.1, 0.3, { w: 14, nopen: true });   // the battery is there when the shot opens
  write('-', cx - 190, cy + 165, { size: 80, t0: t0 - 0.8, dur: 0.1, col: 'sig', nopen: true });
  write('+', cx + 150, cy + 165, { size: 80, t0: t0 - 0.8, dur: 0.1, col: 'hot', nopen: true });
  live(t0 + 0.6, DUR, (g, t) => {
    const warm = clamp((t - 6.9) / 1.0), sp = lerp(0.12, 1.4, warm), col = warm > 0.5 ? '#e0523b' : '#177f8c';
    for (let i = 0; i < 9; i++) {
      const lane = (i % 3) - 1, u = ((i * 0.37 + (t - t0) * sp * (0.8 + (i % 4) * 0.12)) % 1);
      const x = cx - 210 + u * 380, y = cy + lane * 55 + Math.sin(t * 4 + i) * 6;
      g.fillStyle = col; g.beginPath(); g.arc(x, y, 17, 0, TAU); g.fill(); g.strokeStyle = PAL.ink; g.lineWidth = 4; g.stroke();
      if (warm > 0.5) { g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 26, y); g.lineTo(x - 60, y); g.stroke(); }
    }
    ctx.setTransform(g.getTransform()); track('key', cx - 240, cy - 110, cx + 234, cy + 110, 'battery'); ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
}

// ---- 0-4.4 street
const pct1 = (t) => lerp(20, 2, EZ.io(seg(t, 0, 3.4)));
hero(0, 2.2, { x: X0 - 200, y: F, s: 0.55, dir: 1, pose: blend('point', 'reach', 0.2, 1.4), ex: 'firm', hold: 'phone' });
draw(dashed(X0 - 90, F - 400, X0 + 60, F - 330, 16, 12), -1, 0.1, { nopen: true, col: PAL.ghost, w: 7 });   // the callout of the phone in his hand
lt_phone(X0 + 170, F - 120, 1, pct1, 0, 2.2);
hero(2.2, 4.4, { x: X0 - 200, y: F, s: 0.55, dir: 1, pose: blend('point', 'slump', 0.3, 1.2), ex: 'shock', hold: 'phone' });
lt_phone(X0 + 170, F - 120, 1, pct1, 2.2, 4.4);

// ---- 4.4-10 home
lt_battery(X1 - 150, F - 420, 4.4);
hero(4.4, 6.6, { x: X1 + 330, y: F, s: 0.55, dir: -1, pose: blend('idle', 'point', 0, 0.5), ex: (u) => (u < 2.6 ? 'firm' : 'happy') });
write('slow', X1 - 420, F - 560, { size: 64, t0: 5.0, dur: 0.5, col: 'sig' });
write('fast!', X1 - 130, F - 560, { size: 64, t0: 7.3, dur: 0.5, col: 'hot' });
draw(underline(X1 - 140, X1 + 30, F - 540), 7.8, 0.3, { col: 'hot', w: 10 });
hero(8.4, DUR, { x: X1 + 250, y: F, s: 0.55, dir: 1, pose: (u) => (Math.floor(u * 3) % 2 ? 'cheer' : mixPose('cheer', 'idle', 0.4)), ex: 'happy' });
lt_phone(X1 + 560, F - 230, 0.95, (t) => lerp(2, 18, EZ.o2(seg(t, 8.4, 8.9))), 8.4, DUR);

caption('-10°C outside', 2.4, 4.3);
caption('cold ions crawl', 4.7, 6.5);
caption('warm it back up', 8.6, 9.9);

// ---- camera: 5 pictures, each a new angle that moves
shot([
  [0, X0 - 60, F - 300, 1.0, -0.006, 0, 1.12, 120, 0],
  [2.2, X0 + 60, F - 290, 1.3, 0.008, 0, 1.36, -70, 10],
  [4.4, X1 + 20, F - 330, 1.02, 0, 0, 1.08, -60, 0],
  [6.6, X1 - 260, F - 420, 1.45, -0.008, 0, 1.55, 60, 0],
  [8.4, X1 + 140, F - 320, 1.0, 0, 0, 1.06, 40, 0],
]);
mount(DUR);
