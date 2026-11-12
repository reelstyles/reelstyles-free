// =====================================================================
//  sets/scenes.js: scene recipes. Each one paints a FULL lit set for any story in three depth layers: back (sky or wall),
//  mid (floor + 3+ props, the subject plane), front (dark foreground pieces at depth 1.35 + the air). Load after sets/props.js.
//
//    SCENE.land(L, o, subject)    outdoors: sky + sun/moon, far ridge, hills, a path, tree, rocks, fence, grass in front
//    SCENE.street(L, o, subject)  town at night: skyline with windows, houses, pavement, street lamps, bench, bin, rain/fog
//    SCENE.room(L, o, subject)    interior: back wall, window, pendant lamp, table, chair, shelf, plant, floorboards
//    subject(gy)               your people and the beat's key object, drawn on the subject plane (depth 1) on floor gy
//    common o: { gy floor y, air 'dust'|'fog'|'embers'|'rain'|'snow'|false, seed, front: false (no foreground) }
//  Props are generic set dressing in the kit's line (dark fill, grey outline); the story's key object is yours to add.
//  Every recipe registers ONE light (sun, moon, lamp, window) before the subject so figures get rim + cast shadow.
// =====================================================================
const SCENE = {};
const propFill = () => mixHex(LOOK.g.back, '#000000', 0.35);
function pstyle(lw = 7) { ctx.lineWidth = lw; ctx.strokeStyle = PAL.g1; ctx.fillStyle = propFill(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }

// ---- set props (bottom-centre anchors, logical px). Silhouette variants (sil = colour) are for far/front layers.
function tree(x, gy, h = 330, o = {}) {
  ctx.save(); pstyle(); if (o.sil) { ctx.fillStyle = o.sil; ctx.strokeStyle = o.sil; }
  ctx.beginPath(); ctx.moveTo(x - 16, gy); ctx.lineTo(x - 9, gy - h * 0.5); ctx.lineTo(x + 9, gy - h * 0.5); ctx.lineTo(x + 16, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
  const r = h * 0.3, sx = wob(TT, x, 1.6), lobes = [[0, -0.66, 1], [-0.75, -0.5, 0.7], [0.75, -0.52, 0.68], [0, -0.45, 0.75]];
  const path = () => { ctx.beginPath(); for (const [dx, dy, k] of lobes) { ctx.moveTo(x + sx + dx * r + k * r, gy + dy * h); ctx.arc(x + sx + dx * r, gy + dy * h, k * r, 0, TAU); } };
  path(); ctx.lineWidth = 14; ctx.stroke(); path(); ctx.fill();   // one outline around the whole canopy
  ctx.restore();
}
function rock(x, gy, w = 120, o = {}) {   // a faceted boulder
  ctx.save(); pstyle(); if (o.sil) { ctx.fillStyle = o.sil; ctx.strokeStyle = 'transparent'; }
  ctx.beginPath(); ctx.moveTo(x - w / 2, gy); ctx.lineTo(x - w * 0.42, gy - w * 0.38); ctx.lineTo(x - w * 0.12, gy - w * 0.58); ctx.lineTo(x + w * 0.3, gy - w * 0.5); ctx.lineTo(x + w / 2, gy - w * 0.12); ctx.lineTo(x + w / 2, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (!o.sil) { ctx.lineWidth = 5; ctx.strokeStyle = PAL.g2; ctx.beginPath(); ctx.moveTo(x - w * 0.12, gy - w * 0.58); ctx.lineTo(x + w * 0.05, gy - w * 0.25); ctx.lineTo(x + w / 2, gy - w * 0.12); ctx.stroke(); }
  ctx.restore();
}
function fence(x0, x1, gy, h = 90) {
  ctx.save(); pstyle(6);
  for (let x = x0; x <= x1; x += 70) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - h); ctx.stroke(); }
  for (const f of [0.35, 0.75]) { ctx.beginPath(); ctx.moveTo(x0 - 10, gy - h * f); ctx.lineTo(x1 + 10, gy - h * f); ctx.stroke(); }
  ctx.restore();
}
// street lamp: on 0..1; when on > 0.5 the head is the accent-free light colour, the glow is registered by the caller (lightAt)
function lampPost(x, gy, h = 470, on = 1, o = {}) {
  ctx.save(); pstyle(7); if (o.sil) { ctx.strokeStyle = o.sil; }
  ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - h); ctx.quadraticCurveTo(x, gy - h - 34, x + 40, gy - h - 34); ctx.stroke();
  ctx.fillStyle = on > 0.05 ? mixHex(propFill(), o.color || PAL.accent, on) : propFill();
  ctx.beginPath(); ctx.moveTo(x + 18, gy - h - 34); ctx.lineTo(x + 62, gy - h - 34); ctx.lineTo(x + 70, gy - h - 6); ctx.lineTo(x + 10, gy - h - 6); ctx.closePath(); ctx.fill(); if (!o.sil) ctx.stroke();
  ctx.restore();
  return { x: x + 40, y: gy - h - 12 };
}
function bench(x, gy, w = 190) {
  ctx.save(); pstyle(7);
  rrect(x - w / 2, gy - 62, w, 16, 5); ctx.fill(); ctx.stroke(); rrect(x - w / 2, gy - 118, w, 16, 5); ctx.fill(); ctx.stroke();
  for (const sx of [-w / 2 + 18, w / 2 - 18]) { ctx.beginPath(); ctx.moveTo(x + sx, gy); ctx.lineTo(x + sx, gy - 118); ctx.stroke(); }
  ctx.restore();
}
function bin(x, gy) { ctx.save(); pstyle(7); ctx.beginPath(); ctx.moveTo(x - 34, gy - 100); ctx.lineTo(x + 34, gy - 100); ctx.lineTo(x + 27, gy); ctx.lineTo(x - 27, gy); ctx.closePath(); ctx.fill(); ctx.stroke(); rrect(x - 40, gy - 112, 80, 14, 5); ctx.fill(); ctx.stroke(); ctx.restore(); }
// a house / block front: lit = 0..1 share of windows on (seeded order, so windows light one by one as lit rises)
function building(x, gy, w, h, o = {}) {
  ctx.save(); const sil = o.sil || propFill(); ctx.fillStyle = sil; ctx.strokeStyle = PAL.g2; ctx.lineWidth = o.sil ? 0 : 6;
  ctx.beginPath(); ctx.rect(x - w / 2, gy - h, w, h); if (o.roof) { ctx.moveTo(x - w / 2 - 14, gy - h); ctx.lineTo(x, gy - h - o.roof); ctx.lineTo(x + w / 2 + 14, gy - h); }
  ctx.fill(); if (!o.sil) ctx.stroke();
  const r = rng(o.seed || Math.round(x)), cols = Math.max(1, Math.floor(w / 70)), rows = Math.max(1, Math.floor((h - 60) / 90)), ww = o.win || 34, lit = o.lit ?? 0.3;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const wx = x - w / 2 + (i + 0.5) * (w / cols) - ww / 2, wy = gy - h + 40 + j * 90, on = r() < lit;
    ctx.fillStyle = on ? (o.warm || '#ffcf6a') : mixHex(sil, '#000000', 0.4); ctx.globalAlpha = GA * (on ? 0.75 + 0.2 * Math.sin(TT * 1.3 + i + j) : 1);
    ctx.fillRect(wx, wy, ww, ww * 1.3);
  }
  ctx.restore();
}
function windowFrame(x, y, w, h, o = {}) {   // interior window (x, y = top-left), shows the night outside; the light source of a room
  ctx.save(); const g = LOOK.g, gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, g.sky[1]); gr.addColorStop(1, g.sky[2]);
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  if (o.outside) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); o.outside(); ctx.restore(); }
  pstyle(9); ctx.fillStyle = 'transparent'; ctx.strokeRect(x, y, w, h); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x - 20, y + h + 8); ctx.lineTo(x + w + 20, y + h + 8); ctx.stroke(); ctx.restore();
}
function table(x, gy, w = 240, h = 120) { ctx.save(); pstyle(7); rrect(x - w / 2, gy - h, w, 18, 5); ctx.fill(); ctx.stroke(); for (const sx of [-w / 2 + 20, w / 2 - 20]) { ctx.beginPath(); ctx.moveTo(x + sx, gy - h + 18); ctx.lineTo(x + sx, gy); ctx.stroke(); } ctx.restore(); }
function chair(x, gy, dir = 1) { ctx.save(); pstyle(7); ctx.beginPath(); ctx.moveTo(x - 36 * dir, gy); ctx.lineTo(x - 36 * dir, gy - 160); ctx.moveTo(x - 36 * dir, gy - 76); ctx.lineTo(x + 36 * dir, gy - 76); ctx.lineTo(x + 36 * dir, gy); ctx.stroke(); ctx.restore(); }
function shelf(x, y, w = 220) {   // wall shelf with seeded books; y = shelf board
  ctx.save(); pstyle(6); const r = rng(Math.round(x * 3));
  let bx = x - w / 2 + 12; while (bx < x + w / 2 - 30) { const bw = 16 + r() * 16, bh = 50 + r() * 34; ctx.save(); ctx.rotate(0); rrect(bx, y - bh, bw, bh, 3); ctx.fillStyle = mixHex(propFill(), PAL.g2, r() * 0.6); ctx.fill(); ctx.stroke(); ctx.restore(); bx += bw + 4; }
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke(); ctx.restore();
}
function plant(x, gy, h = 160) {
  ctx.save(); pstyle(6); rrect(x - 34, gy - 66, 68, 66, 8); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45 + 0.05 * Math.sin(TT * 1.4 + i); ctx.beginPath(); ctx.moveTo(x, gy - 66); ctx.quadraticCurveTo(x + Math.sin(a) * h * 0.4, gy - 66 - h * 0.6, x + Math.sin(a) * h * 0.55, gy - 66 - h * (0.75 + 0.2 * Math.cos(a * 2))); ctx.stroke(); }
  ctx.restore();
}
function pendant(x, y, on = 1) {   // hanging lamp, cord from above the frame; returns the bulb point
  ctx.save(); pstyle(5); ctx.beginPath(); ctx.moveTo(x, y - 900); ctx.lineTo(x, y - 40); ctx.stroke();
  ctx.lineWidth = 7; ctx.fillStyle = propFill(); ctx.beginPath(); ctx.moveTo(x - 20, y - 40); ctx.lineTo(x + 20, y - 40); ctx.lineTo(x + 56, y); ctx.lineTo(x - 56, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = mixHex(propFill(), LOOK.g.light, on); ctx.beginPath(); ctx.arc(x, y + 4, 14, 0, Math.PI); ctx.fill(); ctx.restore();
  return { x, y: y + 6 };
}

// ---- recipes
SCENE.land = (L, o = {}, subject) => {
  const gy = o.gy ?? 790, g = LOOK.g, sun = o.sun || { x: 760, y: 420, r: 46 };
  layer(0.08, () => { sky({ horizon: gy - 60, stars: o.stars ?? (LOOK.name === 'night'), seed: o.seed }); orb(sun.x, sun.y, sun.r, { crescent: o.moon, a: o.sunA ?? 0.85 }); });
  layer(0.3, () => ridge(gy - 150, 150, mixHex(g.far, g.sky[2], 0.25), { f: 0.3, seed: 11 + (o.seed || 0), peaks: true, step: 120, y1: gy + 300 }));
  layer(0.55, () => { ridge(gy - 60, 60, g.back, { f: 0.55, seed: 21 + (o.seed || 0), y1: gy + 300 }); for (const [tx, th] of [[-120, 120], [80, 90], [1040, 110], [1240, 95]]) tree(tx, gy - 40, th, { sil: g.back }); });
  layer(1, () => {
    floorPlane(gy, { horizon: gy - 140, seams: 0 });
    ctx.save(); ctx.fillStyle = rgba(g.light, 0.07); ctx.beginPath(); ctx.moveTo(470, gy); ctx.lineTo(540, gy); ctx.lineTo(820, gy + 400); ctx.lineTo(160, gy + 400); ctx.closePath(); ctx.fill(); ctx.restore();   // a path
    if (o.props !== false) { tree(o.treeX ?? 110, gy, 360); rock(o.rockX ?? 880, gy, 130); rock((o.rockX ?? 880) + 90, gy, 70); fence(-330, -60, gy, 80); fence(1080, 1360, gy, 80); }
    pool(sun.x, gy, 600, 0.45);
    if (subject) subject(gy);
  });
  if (o.front !== false) layer(1.35, () => { const v = viewBox(1.35); ctx.save(); ctx.lineWidth = 9; ctx.strokeStyle = mixHex(LOOK.g.back, '#000000', 0.3); for (const [x0, dirn] of [[v.x0 + 40, 1], [v.x1 - 40, -1]]) for (let i = 0; i < 8; i++) { const x = x0 + dirn * i * 24; ctx.beginPath(); ctx.moveTo(x, v.y1 + 10); ctx.quadraticCurveTo(x - 8 * dirn, v.y1 - 70, x + dirn * (14 + 8 * Math.sin(TT * 1.5 + i)), v.y1 - 120 - (i % 3) * 34); ctx.stroke(); } ctx.restore(); });
  if (o.air !== false) layer(1, () => air(o.air || 'dust', L, { y: gy }));
};

SCENE.street = (L, o = {}, subject) => {
  const gy = o.gy ?? 800, g = LOOK.g, lamps = o.lamps || [{ x: 760, on: 1 }], lit = o.lit ?? 0.3;
  layer(0.08, () => { sky({ horizon: gy - 80, stars: true, seed: o.seed }); orb(o.moonX ?? 230, o.moonY ?? 170, 34, { crescent: true, light: false }); });
  layer(0.3, () => { const r = rng(5 + (o.seed || 0)); for (let x = -600; x < 1700; x += 90 + r() * 60) building(x, gy - 40, 80 + r() * 60, 220 + r() * 260, { sil: g.far, lit: lit * 0.8, win: 14, seed: Math.round(x) }); });
  layer(0.6, () => { const r = rng(8 + (o.seed || 0)); for (let x = -500; x < 1600; x += 260 + r() * 40) building(x, gy - 10, 220 + r() * 30, 250 + r() * 120, { sil: g.back, lit, win: 30, roof: r() < 0.6 ? 70 : 0, seed: Math.round(x) + 7 }); });
  layer(1, () => {
    floorPlane(gy, { horizon: gy - 170, rows: true, gap: 120 });
    ctx.save(); ctx.strokeStyle = PAL.g2; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-900, gy + 90); ctx.lineTo(2000, gy + 90); ctx.stroke(); ctx.restore();   // kerb
    let first = true;
    for (const lp of lamps) { const on = typeof lp.on === 'function' ? lp.on(L) : lp.on, b = lampPost(lp.x, gy, lp.h ?? 470, on);
      if (on > 0.05) { beam(b.x, b.y, gy, 380, on); pool(b.x, gy, 360, on); if (first) { lightAt(b.x, b.y, { r: 420, a: on, color: g.glow }); first = false; } else lightAt(b.x, b.y, { r: 300, a: on * 0.8 }); } }
    if (first) lightAt(o.moonX ?? 230, -200, { r: 500, a: 0.3 });   // all lamps off: the moon is the light
    if (o.props !== false) { bench(o.benchX ?? 300, gy); bin(o.binX ?? 1010, gy); }
    if (subject) subject(gy);
  });
  if (o.front !== false) layer(1.35, () => { const v = viewBox(1.35), y = v.y1 - 40; ctx.save(); ctx.strokeStyle = mixHex(LOOK.g.back, '#000000', 0.2); ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(v.x1 - 420, y - 90); ctx.lineTo(v.x1 + 40, y - 90); for (let x = v.x1 - 400; x < v.x1 + 40; x += 64) { ctx.moveTo(x, y - 90); ctx.lineTo(x, y + 60); } ctx.stroke(); ctx.strokeStyle = rgba(LOOK.g.light, 0.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(v.x1 - 420, y - 97); ctx.lineTo(v.x1 + 40, y - 97); ctx.stroke(); ctx.restore(); });
  if (o.air !== false) layer(1, () => air(o.air || 'fog', L, { y: gy }));
};

SCENE.room = (L, o = {}, subject) => {
  const gy = o.gy ?? 810, g = LOOK.g, on = o.lamp ?? 1, wx = o.windowX ?? 640;
  layer(0.6, () => {
    const v = viewBox(0.6), gr = ctx.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, g.sky[0]); gr.addColorStop(1, g.back);
    ctx.fillStyle = gr; ctx.fillRect(v.x0 - 300, v.y0 - 300, v.x1 - v.x0 + 600, gy + 300 - v.y0);
    ctx.strokeStyle = rgba(g.light, 0.05); ctx.lineWidth = 4; for (let x = -800; x < 1900; x += 120) { ctx.beginPath(); ctx.moveTo(x, v.y0 - 300); ctx.lineTo(x, gy); ctx.stroke(); }   // wall panels
    windowFrame(wx, gy - 560, 280, 300, { outside: o.outside || (() => { orb(wx + 200, gy - 480, 22, { crescent: true, light: false }); for (let i = 0; i < 4; i++) building(wx + 30 + i * 70, gy - 260, 60, 90 + (i % 2) * 60, { sil: g.far, lit: 0.4, win: 10 }); }) });
    shelf(o.shelfX ?? 180, gy - 430, 240); ctx.save(); pstyle(5); ctx.strokeRect((o.shelfX ?? 180) - 260, gy - 560, 120, 150); ctx.restore();   // a framed picture
    ctx.save(); ctx.strokeStyle = PAL.g2; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(v.x0 - 300, gy - 30); ctx.lineTo(v.x1 + 300, gy - 30); ctx.stroke(); ctx.restore();   // skirting
  });
  layer(1, () => {
    floorPlane(gy, { horizon: gy - 240, rows: false, gap: 90, seams: 0.09 });
    const lx = o.lampX ?? 380, b = o.pendant === false ? { x: lx, y: 230 } : pendant(lx, o.lampY ?? 230, on);
    if (on > 0.05) { beam(b.x, b.y, gy, 620, on); pool(b.x, gy, 480, on); lightAt(b.x, b.y, { r: 520, a: on }); }
    else lightAt(wx + 140, gy - 410, { r: 380, a: 0.5 });   // lamp off: the window is the light
    { const sx = wx, sw = 280; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(0, gy - 260, 0, gy + 160); gr.addColorStop(0, rgba(g.glow, 0.16)); gr.addColorStop(1, rgba(g.glow, 0.02));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx, gy - 260); ctx.lineTo(sx + sw, gy - 260); ctx.lineTo(sx + sw - 260, gy + 160); ctx.lineTo(sx - 380, gy + 160); ctx.closePath(); ctx.fill(); ctx.restore(); }   // window light shaft
    ctx.save(); ctx.fillStyle = mixHex(propFill(), g.glow, 0.12); ctx.strokeStyle = PAL.g2; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(o.rugX ?? 420, gy + 70, 330, 44, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();   // rug
    if (o.props !== false) { table(o.tableX ?? 360, gy); chair((o.tableX ?? 360) - 170, gy, 1); plant(o.plantX ?? 1020, gy); }
    if (subject) subject(gy);
  });
  if (o.front !== false) layer(1.35, () => { const v = viewBox(1.35); ctx.save(); pstyle(9); ctx.fillStyle = mixHex(propFill(), '#000000', 0.4); rrect(v.x1 - 330, v.y1 - 110, 420, 200, 36); ctx.fill(); ctx.stroke(); rrect(v.x1 - 380, v.y1 - 170, 110, 260, 44); ctx.fill(); ctx.stroke(); ctx.restore(); });
  if (o.air !== false) layer(1, () => air(o.air || 'dust', L, { y: gy }));
};

// a hand lantern (the accent: the light the story is about). (x, y) = the hand; on 0..1. Registers a light when on.
function lantern(x, y, on = 1, o = {}) {
  ctx.save(); pstyle(5); ctx.beginPath(); ctx.arc(x, y + 12, 12, Math.PI, TAU); ctx.stroke();                     // handle
  ctx.fillStyle = mixHex(PAL.accentDeep, PAL.accent, on * (0.85 + 0.15 * Math.sin(TT * 9)));
  rrect(x - 17, y + 24, 34, 40, 5); ctx.fill();                                                                 // glass with the flame light
  ctx.strokeStyle = PAL.accent; ctx.lineWidth = 5; ctx.strokeRect(x - 17, y + 24, 34, 40);
  ctx.beginPath(); ctx.moveTo(x, y + 24); ctx.lineTo(x, y + 64); ctx.stroke();                                   // frame bar
  ctx.fillStyle = PAL.accent; rrect(x - 21, y + 16, 42, 10, 4); ctx.fill();   // cap
  rrect(x - 22, y + 62, 44, 9, 3); ctx.fill(); ctx.restore();                                                   // base
  if (on > 0.05 && o.light !== false) lightAt(x, y + 44, { r: o.r ?? 340, a: on, color: o.color || '#ffc65a' });
}
// Pip holding a lantern: measures the pose first so the lantern light exists before the figure is drawn (rim + shadow).
function holdLight(x, gy, pose, o = {}, on = 1) {
  const J0 = figure(x, gy, pose, { ...o, a: 0, extra: true }), h = J0.hand[0];
  if (on > 0.05) lightAt(h[0], h[1] + 40, { r: o.r ?? 340, a: on, color: '#ffc65a', key: o.key !== false });
  if (on > 0.05) pool(h[0], gy, 240, on * 0.8, '#ffc65a');
  const J = figure(x, gy, pose, o); lantern(J.hand[0][0], J.hand[0][1], on, { light: false }); return J;
}
