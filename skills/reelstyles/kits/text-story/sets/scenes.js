// =====================================================================
//  sets/scenes.js: full places for the phone. SCENES.<name>(opts) → S = { y (surface top, world px), wallP (wall
//  parallax), light [x, y] (the key light), props [...], back(), surface(), near() }. Every recipe gives a floor or
//  surface, a back wall with a window to a far view, 3+ props and a blurred near layer. The phone is placed by the film:
//  S.props.push(PROPS.phone({ x: S.slot, y: S.y })). World: [0, 0, 1] shows x -960..960, y -540..540 (16:9).
//  Recipes: desk (lamp, books, mug, plant, picture), bedside (bed behind, lamp, clock, glass), kitchen (tiles, pendant, kettle, fruit bowl, mug).
//  view: 'city' | 'dawn' | 'trees' is what the window shows.
// =====================================================================
const SCENES = {};
const _rgb = (c, a) => LOOK.rgb(c, a);

// far view behind a window, drawn inside the window clip at parallax 0.3
function _farView(c, g, t, cam, kind, wx, wy, ww, wh) {
  LOOK.view(c, cam, 0.3);
  const sk = c.createLinearGradient(0, wy, 0, wy + wh); sk.addColorStop(0, _rgb(g.out[0])); sk.addColorStop(1, _rgb(g.out[1]));
  c.fillStyle = sk; c.fillRect(wx - ww, wy - wh, ww * 3, wh * 3);
  const moon = [wx + ww * 0.72, wy + wh * 0.25];
  if (kind === 'dawn') LOOK.glow(c, ...LOOK.toScreen(cam, moon[0], wy + wh * 0.7, 0.3), 420, g.light, 0.9); else {
    c.fillStyle = _rgb(LOOK.mixc(g.light, [255, 255, 255], 0.6)); c.beginPath(); c.arc(moon[0], moon[1], 34, 0, TAU); c.fill();
    for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(255,255,255,${0.25 + 0.4 * Math.abs(Math.sin(t * 1.3 + i))})`; c.fillRect(wx - ww * 0.4 + hash(i, 1) * ww * 1.8, wy - 60 + hash(i, 2) * wh * 0.45, 3, 3); }
  }
  if (kind === 'trees') { for (let i = 0; i < 12; i++) { const x = wx - ww * 0.5 + i * ww * 0.18, r = 70 + 50 * hash(i, 5);
    c.fillStyle = _rgb(LOOK.mixc(g.out[1], g.shade, 0.55 + 0.2 * (i % 2))); c.beginPath(); c.arc(x + Math.sin(t * 0.6 + i) * 4, wy + wh * 0.72, r, 0, TAU); c.fill(); c.fillRect(x - 8, wy + wh * 0.72, 16, wh); } return; }
  for (let i = 0; i < 16; i++) {                                   // skyline: two rows of blocks with lit windows
    const row = i % 2, bw = 90 + 70 * hash(i, 3), bx = wx - ww * 0.6 + i * ww * 0.14, bh = wh * (0.3 + 0.35 * hash(i, 4)) * (row ? 0.75 : 1);
    c.fillStyle = _rgb(LOOK.mixc(g.out[1], g.shade, row ? 0.45 : 0.7)); c.fillRect(bx, wy + wh - bh, bw, bh + 400);
    for (let k = 0; k < 9; k++) for (let j = 0; j < 4; j++) if (hash(i * 40 + k, j, 11) < 0.42) {
      c.fillStyle = _rgb(g.light, 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 3 + k + j))); c.fillRect(bx + 10 + j * bw / 4.4, wy + wh - bh + 16 + k * 30, bw / 8, 14); }
  }
}

// the room shell: wall (with stripes + skirting) and one window with curtains, at parallax wallP
function _room(o) {
  const S = { y: o.y ?? 200, wallP: o.wallP ?? 0.82, props: [], wall: o.wall || 'stripes', view: o.view || 'city' };
  const win = o.win || [-150, -470, 560, 520];   // x, y, w, h of the window (wall coordinates)
  S.back = (c, g, t, cam) => {
    const wg = c.createLinearGradient(0, -900, 0, S.y + 300); wg.addColorStop(0, _rgb(g.wall[0])); wg.addColorStop(1, _rgb(g.wall[1]));
    c.fillStyle = wg; c.fillRect(-3200, -2200, 6400, 4600);
    if (S.wall === 'stripes') { c.fillStyle = _rgb(g.shade, 0.07); for (let x = -3200; x < 3200; x += 70) c.fillRect(x, -2200, 26, 4600); }
    if (S.wall === 'tiles') { c.strokeStyle = _rgb(g.shade, 0.18); c.lineWidth = 3; for (let y = S.y - 420; y < S.y + 300; y += 70) { c.beginPath(); c.moveTo(-3200, y); c.lineTo(3200, y); c.stroke(); }
      for (let y = S.y - 420, r = 0; y < S.y + 300; y += 70, r++) for (let x = -3200 + (r % 2) * 70; x < 3200; x += 140) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 70); c.stroke(); } }
    const [wx, wy, ww, wh] = win, a = LOOK.toScreen(cam, wx - ww / 2, wy, S.wallP), b = LOOK.toScreen(cam, wx + ww / 2, wy + wh, S.wallP);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); c.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); c.clip();
    _farView(c, g, t, cam, S.view, wx, wy, ww * 1.4, wh); c.restore();
    LOOK.view(c, cam, S.wallP);
    const fr = _rgb(LOOK.mixc(g.wall[1], [250, 246, 236], 0.55));        // frame, cross bars, sill
    c.fillStyle = fr; c.fillRect(wx - ww / 2 - 22, wy - 22, ww + 44, 22); c.fillRect(wx - ww / 2 - 22, wy, 22, wh); c.fillRect(wx + ww / 2, wy, 22, wh);
    c.fillRect(wx - 9, wy, 18, wh); c.fillRect(wx - ww / 2, wy + wh * 0.45, ww, 14); c.fillRect(wx - ww / 2 - 46, wy + wh, ww + 92, 30);
    c.fillStyle = _rgb(g.shade, 0.25); c.fillRect(wx - ww / 2 - 46, wy + wh + 30, ww + 92, 14);
    [-1, 1].forEach((k) => {                                                // curtains with folds that sway
      const cx = wx + k * (ww / 2 + 70), sw = Math.sin(t * 0.8 + k) * 6;
      c.fillStyle = _rgb(LOOK.tone(o.curtain || '#c0566a', g, 0.35)); c.beginPath(); c.moveTo(cx - 90, wy - 60); c.lineTo(cx + 90, wy - 60);
      c.quadraticCurveTo(cx + 70 + sw, wy + wh * 0.6, cx + 100 + sw * 2, wy + wh + 140); c.lineTo(cx - 100 + sw * 2, wy + wh + 140); c.quadraticCurveTo(cx - 70 + sw, wy + wh * 0.6, cx - 90, wy - 60); c.fill();
      c.strokeStyle = _rgb(g.shade, 0.25); c.lineWidth = 6; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(cx + i * 45, wy - 50); c.quadraticCurveTo(cx + i * 50 + sw, wy + wh * 0.6, cx + i * 55 + sw * 2, wy + wh + 130); c.stroke(); }
    });
    c.fillStyle = _rgb(LOOK.tone('#2a2a38', g, 0.3)); c.fillRect(wx - ww / 2 - 200, wy - 76, ww + 400, 12);
    if (o.floorY) { const fg = c.createLinearGradient(0, o.floorY, 0, o.floorY + 600); fg.addColorStop(0, _rgb(LOOK.tone(o.floor || '#6a5a7a', g, 0.4))); fg.addColorStop(1, _rgb(g.shade));
      c.fillStyle = fg; c.fillRect(-3200, o.floorY, 6400, 2000); c.fillStyle = _rgb(LOOK.mixc(g.wall[1], [250, 246, 236], 0.4)); c.fillRect(-3200, o.floorY - 30, 6400, 30); }
  };
  return S;
}
// a long wooden/stone top at S.y with grain, a lit front edge and a dark front face
function _surface(S, o) {
  const x0 = o.x0 ?? -2600, x1 = o.x1 ?? 2600, depth = o.depth ?? 120;
  S.surface = (c, g, t) => {
    const tg = c.createLinearGradient(0, S.y - depth, 0, S.y + 40); tg.addColorStop(0, _rgb(LOOK.mixc(g.surface[0], g.shade, 0.2))); tg.addColorStop(1, _rgb(g.surface[0]));
    c.fillStyle = tg; c.beginPath(); c.roundRect(x0, S.y - depth, x1 - x0, depth + 40, 18); c.fill();
    c.strokeStyle = _rgb(g.shade, o.grain ?? 0.16); c.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const y = S.y - depth + 10 + i * (depth + 20) / 9; c.beginPath(); c.moveTo(x0, y); for (let x = x0; x <= x1; x += 160) c.lineTo(x, y + Math.sin(x * 0.004 + i * 1.7) * 4); c.stroke(); }
    c.fillStyle = _rgb(g.rim, 0.55); c.fillRect(x0 + 12, S.y + 38, x1 - x0 - 24, 5);
    const fg = c.createLinearGradient(0, S.y + 40, 0, S.y + 600); fg.addColorStop(0, _rgb(g.surface[1])); fg.addColorStop(1, _rgb(LOOK.mixc(g.surface[1], g.shade, 0.6)));
    c.fillStyle = fg; c.fillRect(x0, S.y + 43, x1 - x0, o.face ?? 1400);
    if (o.drawers) o.drawers.forEach((dx) => { c.strokeStyle = _rgb(g.shade, 0.4); c.lineWidth = 5; c.strokeRect(dx - 230, S.y + 90, 460, 170);
      c.fillStyle = _rgb(g.rim, 0.8); c.beginPath(); c.roundRect(dx - 50, S.y + 165, 100, 16, 8); c.fill(); });
  };
}

// Each recipe leaves a phone slot (S.slot, world x) and keeps its dressing on the side away from the chat column
// (the column floats on the right in 16:9). flip: true mirrors the whole place (for float: 'l').
const _near = (c, g, kind, m) => {           // one big out-of-focus foreground object in a lower corner (parallax 1.55)
  c.save(); c.scale(m, 1);
  if (kind === 'leaves') { c.fillStyle = _rgb(LOOK.tone('#2f6a46', g, 0.5));
    for (let i = 0; i < 7; i++) { c.save(); c.translate(-1020, 640); c.rotate(-1.15 + i * 0.2); c.beginPath(); c.ellipse(0, -260, 70, 260, 0, 0, TAU); c.fill(); c.restore(); } }
  if (kind === 'bottle') { c.fillStyle = _rgb(LOOK.tone('#2f5a3a', g, 0.45)); c.beginPath(); c.roundRect(-1060, 180, 190, 700, 60); c.roundRect(-1000, 20, 70, 220, 20); c.fill(); }
  if (kind === 'duvet') { c.fillStyle = _rgb(LOOK.tone('#8f9cc8', g, 0.4)); c.beginPath(); c.moveTo(-1400, 380); c.quadraticCurveTo(-900, 330, -760, 820); c.lineTo(-1400, 820); c.fill(); }
  c.restore(); };
SCENES.desk = (o = {}) => {
  const m = o.flip ? -1 : 1, X = (v) => v * m;
  const S = _room({ view: 'city', curtain: '#3f6f9a', win: [X(-250), -470, 560, 520], ...o }); _surface(S, o);
  const lamp = PROPS.lamp({ x: X(-760), y: S.y, s: 1, side: m });
  S.slot = X(-300);
  S.props.push(lamp, PROPS.books({ x: X(-540), y: S.y + 6, n: 3, s: 0.75 }), PROPS.mug({ x: X(-50), y: S.y + 10, s: 0.9 }),
    PROPS.plant({ x: X(260), y: S.y - 20, s: 0.85 }), PROPS.frame({ x: X(-760), y: -560, w: 260, h: 200 }));
  S.light = lamp.light;
  S.near = (c, g) => _near(c, g, 'leaves', m);
  return S;
};
SCENES.bedside = (o = {}) => {
  // the bed stands on the floor behind, on the far side; the bedside table carries lamp, phone, clock, glass
  const m = o.flip ? -1 : 1, X = (v) => v * m;
  const S = _room({ view: 'city', curtain: '#7a5a9a', win: [X(-380), -620, 420, 380], floorY: 330, floor: '#5a4a6a', ...o });
  _surface(S, { x0: m > 0 ? -820 : -1600, x1: m > 0 ? 1600 : 820, depth: 100, face: 700, drawers: [X(-60)], ...o });
  const lamp = PROPS.lamp({ x: X(-680), y: S.y, s: 0.8, side: m, color: '#3a2f4a' });
  S.slot = X(-150);
  S.props.push(PROPS.bed({ x: X(-400), y: 300, s: 0.95, len: 1000, lump: o.lump ?? false, flip: o.flip }), lamp,
    PROPS.clock({ x: X(30), y: S.y + 4, s: 0.8, time: o.time || '23:48' }), PROPS.glass({ x: X(-450), y: S.y + 10, s: 0.8 }));
  S.light = lamp.light;
  S.near = (c, g) => _near(c, g, 'duvet', m);
  return S;
};
SCENES.kitchen = (o = {}) => {
  const m = o.flip ? -1 : 1, X = (v) => v * m;
  const S = _room({ view: 'dawn', wall: 'tiles', curtain: '#d98a4a', win: [X(-200), -520, 600, 440], ...o }); _surface(S, { grain: 0.06, ...o });
  const lamp = { id: 'pendant', x: X(-560), y: -360, w: 220, h: 160, layer: 'mid', color: '#2e3a3a', shadow: false,
    path: () => { const p = new Path2D(); p.rect(-4, -900, 8, 760); p.moveTo(-110, 0); p.lineTo(-40, -150); p.lineTo(40, -150); p.lineTo(110, 0); p.closePath(); return p; },
    detail: (c, g) => { c.fillStyle = _rgb(g.light); c.beginPath(); c.ellipse(0, 0, 105, 16, 0, 0, TAU); c.fill(); } };
  S.slot = X(-300);
  S.props.push(lamp, PROPS.kettle({ x: X(-640), y: S.y, flip: o.flip }), PROPS.bowl({ x: X(0), y: S.y + 4, s: 0.85 }), PROPS.mug({ x: X(220), y: S.y + 10, s: 0.8, color: '#3f7fb0' }));
  S.light = [X(-560), -340];
  S.near = (c, g) => _near(c, g, 'bottle', m);
  return S;
};
