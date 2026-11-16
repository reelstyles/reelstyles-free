// =====================================================================
//  engine/look.js: the film look for midcentury-toon, as general tools (load after engine/manual.js).
//  Everything stays flat and printed: glows are stepped rings of flat colour, shade is one flat plane, never a soft gradient
//  inside a shape. The look is applied per frame by runtime.js (lookFrame) after the shot and before the paper finish.
//    GRADES[mood]   set colours + frame shade per mood: day · dusk · night · hearth · gold · cool
//    gradeTrack([[t, mood, blendSeconds]...])   the frame shade turns across the film (cold first, warm payoff)
//    lightSrc(g, L, t)      draws the visible source L = {kind: 'sun'|'moon'|'lamp'|'fire'|'window', x, y, s, k} in world px
//                           and registers it: the frame darkens with the mood except around it (stepped printed halo)
//    lit(g, L, at, fn)      draws fn(ctx) as a subject lit by L: rim on the side facing the light, a flat shade plane
//                           on the far side, a cast shadow on the floor. at = [x, footY, height] of the subject (world px)
//    depth(g, p, fn)        draws fn in a parallax layer: p 0.3-0.5 far, 1 the subject, 1.3-1.6 near foreground
//    air(g, kind, t, o)     one moving atmosphere layer: 'dust' | 'snow' | 'rain' | 'embers' | 'leaves' | 'fireflies'
//    camMove(kind, t0, d, o)  -> cam(t): 'push' | 'pull' | 'pan' | 'tilt' | 'crane' | 'drift'; o {x, y, z, amt, dir}
//    label(g, t, t0, t1, str, x, y, o)   the one caption of a shot: slab type on an offset plate card, 64 px, in + out together
//    fire(g, x, y, s, t, k)  a flat cartoon campfire / hearth flame on twos (k 0..1 = size)
// =====================================================================
const GRADES = {
  day:    { sky: '#9CC4D8', band: '#CFE3EA', far: '#8FB3B5', mid: '#7E8538', ground: '#C9A86A', groundD: '#A2713F', wall: '#CFE0E6', floor: '#DDB47F', near: '#4F5A2C', shade: null, light: [255, 228, 150], halo: 0.18 },
  dusk:   { sky: '#E58F8A', band: '#F3C49A', far: '#8E5F7E', mid: '#5A4060', ground: '#8A5A3C', groundD: '#6A4028', wall: '#D9A08A', floor: '#A8704A', near: '#2E2230', shade: [200, 160, 185], light: [255, 176, 96], halo: 0.26 },
  night:  { sky: '#26304E', band: '#4A5A8A', far: '#4A5A86', mid: '#222A44', ground: '#5A5470', groundD: '#3A3450', wall: '#46527A', floor: '#54486A', near: '#141726', shade: [150, 165, 215], light: [255, 200, 120], halo: 0.34 },
  hearth: { sky: '#33284A', band: '#6A4458', far: '#6A4050', mid: '#4A2E3A', ground: '#6A4230', groundD: '#4E2E20', wall: '#9A5A40', floor: '#6E4430', near: '#24160F', shade: [238, 186, 150], light: [255, 170, 80], halo: 0.34 },
  gold:   { sky: '#F3C46A', band: '#F8E2A8', far: '#D29A62', mid: '#9A6A3A', ground: '#C9955D', groundD: '#A2713F', wall: '#F3D37F', floor: '#DDB47F', near: '#5A3A20', shade: [255, 225, 185], light: [255, 214, 120], halo: 0.24 },
  cool:   { sky: '#B5C8DE', band: '#DDE6EE', far: '#8EA0B8', mid: '#5B789E', ground: '#9AA49E', groundD: '#7A847E', wall: '#B5C8DE', floor: '#9AA0A8', near: '#2A3350', shade: [200, 210, 228], light: [235, 240, 255], halo: 0.16 },
};
const grade = (m) => GRADES[m] || GRADES.day;
const lkMix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const lkRgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// ---- per-frame state: the mood of the drawn set and the lights it registered (reset by runtime.js every frame)
let LK_MOOD = 'day', LK_LIGHTS = [], LK_TRACK = null, CAM = [960, 540, 1, 0];
function gradeTrack(list) { LK_TRACK = list.slice().sort((a, b) => a[0] - b[0]); }
function lookReset() { LK_LIGHTS = []; }
function lkShadeAt(t) {      // the frame shade colour now: [r,g,b] or null (= no darkening)
  const S = (m) => grade(m).shade || [255, 255, 255];
  if (!LK_TRACK) return grade(LK_MOOD).shade;
  let c = S(LK_TRACK[0][1]);
  for (let i = 1; i < LK_TRACK.length; i++) { const [t0, m, bl] = LK_TRACK[i], p = ss((t - t0) / Math.max(0.01, bl || 0.01)); if (p <= 0) break; c = lkMix(c, S(m), p); }
  return c;
}
// screen-space finish: darken by the mood shade except in stepped rings around each light, then a printed halo
let LK_BUF = null;
function lookFrame(g, t) {
  const sh = lkShadeAt(t);
  if (sh && sh[0] + sh[1] + sh[2] < 760) {
    if (!LK_BUF) LK_BUF = new OffscreenCanvas(W, H);
    const b = LK_BUF.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over';
    b.fillStyle = lkRgb(sh); b.fillRect(0, 0, W, H);
    LK_LIGHTS.forEach((L) => { for (let i = 0; i < 7; i++) { b.fillStyle = lkRgb(lkMix(sh, [255, 255, 255], (i + 1) / 7.6)); b.beginPath(); b.arc(L.sx, L.sy, L.r * (1 - i * 0.13), 0, TAU); b.fill(); } });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(LK_BUF, 0, 0); g.restore();
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'screen';
  LK_LIGHTS.forEach((L) => { for (let i = 0; i < 5; i++) { g.fillStyle = lkRgb(L.col, L.a * 0.2); g.beginPath(); g.arc(L.sx, L.sy, L.r * (0.5 - i * 0.085), 0, TAU); g.fill(); }
    if (L.pool) { g.fillStyle = lkRgb(L.col, L.a * 0.6); g.beginPath(); g.ellipse(L.pool[0], L.pool[1], L.pool[2], L.pool[2] * 0.16, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(L.pool[0], L.pool[1], L.pool[2] * 0.6, L.pool[2] * 0.1, 0, 0, TAU); g.fill(); } });
  g.restore();
}
const lkScreen = (g, x, y) => { const m = g.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };

// ---- the one light of a scene. L = {kind, x, y, s (size), k (0..1 level), col}. Draws the source and registers its halo.
function lightSrc(g, L, t) {
  const G = grade(LK_MOOD), k = L.k ?? 1, s = L.s ?? 1, col = L.col || (L.kind === 'moon' ? [235, 240, 255] : L.kind === 'fire' ? [255, 150, 60] : G.light);
  if (k <= 0) return;
  if (L.kind === 'sun') { rays(g, L.x, L.y, 16, 260 * s, lkRgb(col, 0.5), { rot: t * 0.05, k: 0.5, r0: 110 * s }); shape(g, ellipse(L.x, L.y, 90 * s, 90 * s, 40), { fill: lkRgb(lkMix(col, [255, 255, 255], 0.3)), line: 0, grain: 0.1, off: [0, 0] }); }
  else if (L.kind === 'moon') { shape(g, ellipse(L.x, L.y, 64 * s, 64 * s, 40), { fill: '#F6EFD8', line: 3, seed: 611, grain: 0.15 }); shape(g, ellipse(L.x + 18 * s, L.y - 14 * s, 14 * s, 14 * s, 16), { fill: '#E3D8BA', line: 0, off: [0, 0], grain: 0 }); }
  else if (L.kind === 'lamp') { shape(g, ellipse(L.x, L.y, 26 * s, 26 * s, 24), { fill: lkRgb(lkMix(col, [255, 255, 255], 0.5)), line: 3, seed: 612, grain: 0 }); }
  else if (L.kind === 'fire') fire(g, L.x, L.y, s, t, k);
  const [sx, sy] = lkScreen(g, L.x, L.kind === 'fire' ? L.y - 60 * s * k : L.y), z = Math.abs(g.getTransform().a);
  const fl = L.kind === 'fire' ? 1 + 0.05 * Math.sin(twos(t) * 17) : 1;
  const [px, py] = lkScreen(g, L.x, L.y);   // fire and lamps on the floor throw a flat light pool around their base
  LK_LIGHTS.push({ pool: L.kind === 'fire' || L.pool ? [px, py, 300 * s * z * (0.4 + 0.6 * k)] : null, sx, sy, r: (L.r || { sun: 900, moon: 700, lamp: 620, fire: 760, window: 820 }[L.kind] || 700) * z * fl * (0.4 + 0.6 * k), col, a: G.halo * k });
}
// ---- a subject lit by L: cast shadow away from the light, rim toward it, a flat shade plane on the far side
let LK_SUB = null, LK_SIL = null;
function lit(g, L, at, fn) {
  if (!L) { fn(g); return; }
  const [x, fy, h] = at, dx = x - L.x, d = Math.hypot(dx, fy - L.y) || 1, sgn = dx >= 0 ? 1 : -1, G = grade(LK_MOOD);
  // cast shadow: a flat ink ellipse stretched away from the light along the floor
  g.save(); g.globalAlpha = 0.28; g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(x + sgn * h * 0.32, fy + 4, h * 0.42, h * 0.045, 0, 0, TAU); g.fill(); g.restore();
  if (!LK_SUB) { LK_SUB = new OffscreenCanvas(W, H); LK_SIL = new OffscreenCanvas(W, H); }
  const a = LK_SUB.getContext('2d'), b = LK_SIL.getContext('2d');
  a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, W, H); a.setTransform(g.getTransform()); fn(a);
  const [lsx, lsy] = lkScreen(g, L.x, L.y), [csx, csy] = lkScreen(g, x, fy - h / 2), ux = (lsx - csx) / (Math.hypot(lsx - csx, lsy - csy) || 1), uy = (lsy - csy) / (Math.hypot(lsx - csx, lsy - csy) || 1);
  const col = L.col || (L.kind === 'fire' ? [255, 170, 80] : G.light), z = Math.abs(g.getTransform().a), rw = 7 * z * (L.rim ?? 1);
  // rim: the silhouette in light colour, offset toward the light, drawn under the subject
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); b.globalCompositeOperation = 'source-over'; b.drawImage(LK_SUB, 0, 0);
  b.globalCompositeOperation = 'source-in'; b.fillStyle = lkRgb(lkMix(col, [255, 255, 255], 0.35)); b.fillRect(0, 0, W, H);
  // shade plane on the subject: the half that faces away from the light
  a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-atop'; a.fillStyle = lkRgb(G.shade ? lkMix(G.shade, [40, 30, 50], 0.55) : [60, 40, 30], G.shade ? 0.42 : 0.18);
  a.beginPath(); const nx = -uy, ny = ux; a.moveTo(csx + nx * 3000, csy + ny * 3000); a.lineTo(csx - nx * 3000, csy - ny * 3000); a.lineTo(csx - nx * 3000 - ux * 3000, csy - ny * 3000 - uy * 3000); a.lineTo(csx + nx * 3000 - ux * 3000, csy + ny * 3000 - uy * 3000); a.closePath(); a.fill();
  a.fillStyle = lkRgb(col, 0.16); a.fillRect(0, 0, W, H); a.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(LK_SIL, ux * rw, uy * rw); g.drawImage(LK_SUB, 0, 0); g.restore();
}
// ---- parallax layers: p < 1 moves less than the camera (far), p > 1 more (near). CAM is set by runtime.js per shot.
function depth(g, p, fn) {
  const [cx, cy, z] = CAM, pz = 1 + (z - 1) * p, px = W / 2 + (cx - W / 2) * p, py = H / 2 + (cy - H / 2) * p;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.scale(pz, pz); if (CAM[3]) g.rotate(CAM[3] * p); g.translate(-px, -py); fn(g); g.restore();
}
// ---- one atmosphere layer, flat printed shapes (screen space, drawn after the near layer)
function air(g, kind, t, o = {}) {
  const n = o.n || { dust: 26, snow: 70, rain: 90, embers: 30, leaves: 14, fireflies: 16 }[kind] || 24, ox = o.x ?? W / 2, oy = o.y ?? H / 2, sp = o.w ?? W, sh = o.h ?? H;
  const wrap = (v, a) => ((v % a) + a) % a;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) {
    const r1 = hash(i, 1, 9), r2 = hash(i, 2, 9), r3 = hash(i, 3, 9), ph = r3 * TAU;
    if (kind === 'rain') { const x = wrap(r1 * W - t * 160, W), y = wrap(r2 * H + t * 1300 * (0.7 + r3 * 0.5), H); ink(g, [[x, y], [x - 8, y + 40]], 2.4, { color: 'rgba(220,232,245,0.55)', taper: false, seed: i }); continue; }
    if (kind === 'snow') { const x = wrap(r1 * W + Math.sin(t + ph) * 30, W), y = wrap(r2 * H + t * (50 + r3 * 50), H); g.fillStyle = 'rgba(251,246,234,0.9)'; g.beginPath(); g.arc(x, y, 4 + r3 * 5, 0, TAU); g.fill(); continue; }
    if (kind === 'leaves') { const x = wrap(r1 * W + t * (60 + r3 * 60), W), y = wrap(r2 * H + t * 70 + Math.sin(t * 2 + ph) * 30, H); shape(g, xform(spline([[0, -14], [9, 0], [0, 14], [-9, 0]], true, 4), x, y, t * 2 + ph, 1.3), { fill: r3 > 0.5 ? PAL.mustard : PAL.coral, line: 2, seed: 650 + i, grain: 0 }); continue; }
    if (kind === 'embers') { const x = ox + (r1 - 0.5) * sp * 0.4 + Math.sin(t * 1.6 + ph) * 26, life = wrap(t * (0.35 + r3 * 0.3) + r2, 1), y = oy - life * sh * 0.55;
      g.fillStyle = lkRgb([255, 170 + r3 * 60, 70], 1 - life); g.fillRect(x - 3, y - 3, 6 + r3 * 4, 6 + r3 * 4); continue; }
    if (kind === 'fireflies') { const x = r1 * W + Math.sin(t * 0.7 + ph) * 40, y = H * 0.35 + r2 * H * 0.45 + Math.cos(t * 0.9 + ph) * 26, f = 0.5 + 0.5 * Math.sin(t * 3 + ph * 4);
      g.fillStyle = lkRgb([255, 222, 120], 0.25 * f); g.beginPath(); g.arc(x, y, 16, 0, TAU); g.fill(); g.fillStyle = lkRgb([255, 240, 170], f); g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); continue; }
    const x = wrap(r1 * W + t * (14 + r3 * 18), W), y = wrap(r2 * H - t * (8 + r3 * 10), H);   // dust: tiny 4-point sparkles
    sparkle(g, x, y, 4 + r3 * 6, { fill: lkRgb([255, 246, 220], 0.55 + 0.4 * Math.sin(t * 2 + ph)), rot: t + ph });
  }
  g.restore();
}
// ---- camera moves (the stand: smooth, never handheld). Returns cam(t) -> [cx, cy, zoom, rot] for shot().
function camMove(kind, t0, d, o = {}) {
  const X = o.x ?? W / 2, Y = o.y ?? H / 2, Z = o.z ?? 1, A = o.amt ?? 1, dir = o.dir || 1;
  return (t) => {
    const p = eio(seg(t, t0, t0 + d));
    if (kind === 'push') return [X + 20 * A * p * dir, Y - 10 * A * p, Z + 0.09 * A * p, 0];
    if (kind === 'pull') return [X - 20 * A * p * dir, Y + 10 * A * p, Z + 0.09 * A * (1 - p), 0];
    if (kind === 'pan') return [X + lerp(-90, 90, p) * A * dir, Y, Z + 0.02 * p, 0];
    if (kind === 'tilt') return [X, Y + lerp(60, -40, p) * A * dir, Z + 0.02 * p, 0];
    if (kind === 'crane') return [X + 30 * A * p * dir, Y + lerp(70, -30, p) * A, Z + 0.05 * A * p, 0];
    return [X + 26 * A * Math.sin((t - t0) * 0.6), Y + 10 * A * Math.sin((t - t0) * 0.45), Z + 0.03 * A * p, 0];   // drift
  };
}
// ---- the one caption of a shot (4 words or fewer): slab on an offset plate card, readable on a phone, in + out together
function label(g, t, t0, t1, str, x, y, o = {}) {
  const a = Math.min(pop(t, t0, 0.28, 1.6), 1 - ss(seg(t, t1 - 0.18, t1)));
  if (a <= 0.01 || t >= t1) return;
  const px = o.px || 64, font = `${px}px ${FAMS.slab}`, w = (g.save(), g.font = font, g.measureText(str).width + 70), h = px + 44;
  g.restore(); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(x, y); g.scale(a, a); g.rotate(o.rot ?? -0.02);
  shape(g, rrect(-w / 2, -h / 2, w, h, 14), { fill: o.card || PAL.white, line: 4, seed: 671, grain: 0.15, breaks: 0.06, off: [9, 8] });
  text(g, str, 0, px * 0.36, { font, fill: PAL.ink, plate: o.plate || PAL.mustard, off: [4, 3], align: 'center' });
  g.restore();
}
// ---- a flat cartoon flame on logs; k 0..1 grows it. Origin = the fire's base on the floor.
function fire(g, x, y, s = 1, t = 0, k = 1) {
  const tw = twos(t);
  [[-1, 0.25], [1, -0.25]].forEach(([d, r], i) => shape(g, xform(rrect(-70, -11, 140, 22, 10), x + d * 8 * s, y - 10 * s, r, s), { fill: PAL.brown, line: 3.4, seed: 680 + i, grain: 0.4 }));
  if (k <= 0.02) return;
  const tongue = (dx, hgt, w, col, seed) => { const sw = Math.sin(tw * 9 + seed) * 10 * s, hh = hgt * s * k * (0.9 + 0.1 * Math.sin(tw * 13 + seed * 2));
    shape(g, spline([[x + dx * s - w * s, y - 14 * s], [x + dx * s - w * 0.6 * s + sw * 0.4, y - 14 * s - hh * 0.5], [x + dx * s + sw, y - 14 * s - hh], [x + dx * s + w * 0.6 * s + sw * 0.4, y - 14 * s - hh * 0.5], [x + dx * s + w * s, y - 14 * s]], true, 5),
      { fill: col, line: 3, seed, grain: 0.1, breaks: 0.3 }); };
  tongue(-30, 120, 34, PAL.coral, 691); tongue(30, 130, 34, PAL.coral, 692); tongue(0, 190, 46, PAL.coral, 693);
  tongue(-6, 130, 32, PAL.mustard, 694); tongue(8, 80, 20, PAL.mustardL, 695);
}
