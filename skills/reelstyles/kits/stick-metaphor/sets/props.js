// =====================================================================
//  sets/props.js: grey props (dark fill, grey outline) + the accent prop. Anchors are bottom-centre unless noted.
//  Rule of the style: 1-3 grey props per beat; accent (yellow) ONLY on the prop that carries the point of the metaphor.
//
//    ground(y, x0, x1, L, speed)         floor line with ticks that scroll (the world moves, the figure stays)
//    block(cx, by, w, h, o)              box; o: { rot (deg, about bottom centre), accent, label, size, a, lw }
//    wheel(x, y, r, rot, accent)         spoked wheel
//    door(cx, by, w, h, open, glow)      door in a frame; open 0..1 swings the leaf, glow spills light (accent)
//    wall(x0, by, w, h, L, shake)        brick wall with a faint tremor
//    domino(x, by, w, h, ang, accent)    domino toppling around its bottom-right corner (ang 0..90 deg)
//    flag(x, by, h, L, accent)           pole + waving flag
//    stepsPath(x0, y0, n, w, h) / rampY  stairs and ramp helpers
//    chev(x, y, L, n)                    moving chevrons (direction / speed hint)
// =====================================================================
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function styleFor(accent, lw = 8) { ctx.lineWidth = lw; ctx.strokeStyle = accent ? PAL.accent : PAL.g1; ctx.fillStyle = accent ? PAL.accentDeep : PAL.fill; }
function ground(y, x0, x1, L, speed = 60) {
  ctx.save(); ctx.strokeStyle = PAL.g2; ctx.lineWidth = 5; alpha(1);
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.strokeStyle = PAL.g3; ctx.lineWidth = 4;
  const gap = 70, off = ((L * speed) % gap + gap) % gap;
  for (let x = x0 - off + gap; x < x1; x += gap) { if (x < x0 + 6) continue; ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x - 22, y + 16); ctx.stroke(); }
  ctx.restore();
}
function block(cx, by, w, h, o = {}) {
  const { rot = 0, accent = false, label = '', size = 34, a = 1, lw = 8 } = o;
  ctx.save(); alpha(a); ctx.translate(cx, by); ctx.rotate(_rad(rot)); styleFor(accent, lw);
  rrect(-w / 2, -h, w, h, 12); ctx.fill(); ctx.stroke();
  if (label) text(label, 0, -h / 2, { size, weight: 800, maxW: w - 24, clampX: false, color: accent ? PAL.accent : PAL.white });
  ctx.restore();
}
function wheel(x, y, r, rot, accent = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); styleFor(accent, 7);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 5;
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); ctx.lineTo(-Math.cos(a) * r * 0.9, -Math.sin(a) * r * 0.9); ctx.stroke(); }
  ctx.restore();
}
function door(cx, by, w, h, open = 0, glow = 0) {
  ctx.save();
  if (glow > 0) {                                           // light spill through the opening
    ctx.fillStyle = PAL.accent; ctx.globalAlpha = GA * glow * 0.9;
    ctx.beginPath(); ctx.moveTo(cx - w / 2, by - h); ctx.lineTo(cx + w / 2, by - h); ctx.lineTo(cx + w / 2 + 70 * glow, by); ctx.lineTo(cx - w / 2 - 20 * glow, by); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = GA; ctx.lineWidth = 9; ctx.strokeStyle = PAL.accent; ctx.fillStyle = open > 0.02 ? '#000' : PAL.accentDeep;
  rrect(cx - w / 2, by - h, w, h, 8); ctx.fill(); ctx.stroke();
  if (open > 0.02) {                                        // leaf: squeezed toward its hinge as it swings
    const lw = Math.max(8, w * (1 - 0.8 * open));
    ctx.fillStyle = PAL.accentDeep; rrect(cx - w / 2 - 2, by - h + 6, lw, h - 6, 6); ctx.fill(); ctx.stroke();
  } else { ctx.fillStyle = PAL.accent; ctx.beginPath(); ctx.arc(cx + w / 2 - 20, by - h * 0.45, 7, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function wall(x0, by, w, h, L, shake = 0) {
  ctx.save(); ctx.translate(x0 + shake * Math.sin(L * 61), 0); styleFor(false, 8);
  rrect(0, by - h, w, h, 6); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = PAL.g2; const rh = 56;
  for (let r = 1; r * rh < h; r++) { ctx.beginPath(); ctx.moveTo(0, by - r * rh); ctx.lineTo(w, by - r * rh); ctx.stroke(); }
  for (let r = 0; r * rh < h; r++) for (let c = 1; c < 3; c++) { const x = (r % 2 ? c - 0.5 : c) * (w / 3); ctx.beginPath(); ctx.moveTo(x, by - r * rh); ctx.lineTo(x, Math.max(by - h, by - (r + 1) * rh)); ctx.stroke(); }
  ctx.restore();
}
function domino(x, by, w, h, ang, accent = false) {
  ctx.save(); ctx.translate(x + w, by); ctx.rotate(_rad(ang)); styleFor(accent, 7);
  rrect(-w, -h, w, h, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent ? PAL.accent : PAL.g2; ctx.beginPath(); ctx.arc(-w / 2, -h * 0.72, Math.max(3, w * 0.12), 0, TAU); ctx.arc(-w / 2, -h * 0.28, Math.max(3, w * 0.12), 0, TAU); ctx.fill();
  ctx.restore();
}
function flag(x, by, h, L, accent = false) {
  ctx.save(); styleFor(accent, 7); ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by - h); ctx.stroke();
  ctx.fillStyle = accent ? PAL.accent : PAL.g2; ctx.beginPath(); ctx.moveTo(x, by - h);
  for (let i = 0; i <= 8; i++) { const u = i / 8; ctx.lineTo(x + u * 62, by - h + 4 * Math.sin(L * 7 - u * 5) * u + 0); }
  for (let i = 8; i >= 0; i--) { const u = i / 8; ctx.lineTo(x + u * 62, by - h + 34 + 4 * Math.sin(L * 7 - u * 5) * u); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function chev(x, y, L, n = 3, color = PAL.g2) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 6;
  for (let i = 0; i < n; i++) { const u = ((L * 1.2 + i / n) % 1 + 1) % 1; ctx.globalAlpha = GA * Math.sin(u * Math.PI); const px = x + u * 90; ctx.beginPath(); ctx.moveTo(px - 12, y - 18); ctx.lineTo(px, y); ctx.lineTo(px - 12, y + 18); ctx.stroke(); }
  ctx.restore();
}
function ramp(x0, y0, x1, y1) { ctx.save(); ctx.strokeStyle = PAL.g1; ctx.lineWidth = 8; ctx.fillStyle = PAL.fill; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1, y0 + 30); ctx.lineTo(x0, y0 + 30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
