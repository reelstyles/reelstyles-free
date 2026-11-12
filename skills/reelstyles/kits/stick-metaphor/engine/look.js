// =====================================================================
//  engine/look.js: the cinematic layer of the stick-metaphor look. Load right after engine/runtime.js (before engine/safe.js).
//  The identity stays: white round-head figures, grey-outlined props, one yellow accent, a dark stage. This file lights that
//  stage like a film: a grade per mood, one light source with glow and rim, 3 depth layers with parallax, moving air,
//  film grain + vignette, bold captions and camera moves. Pure functions of film time (no Math.random / Date).
//
//    beat(dur, draw, { grade, cam })   grade = GRADES name for the beat (default 'night'); renderFrame applies it + post()
//    grade(name)                        switch the grade inside a beat (rare: a lamp coming on)
//    layer(f, fn)                       draw fn at depth f: 0.1 sky, 0.3 far, 0.6 back, 1 subject, 1.35 foreground (parallax)
//    lightAt(x, y, o)                   THE light source of the scene (world coords, call inside its layer):
//                                       o: { r glow radius, a strength, color }. Figures drawn after it get a rim + cast shadow.
//    pool(x, gy, w, a)                  light pool on the floor under a light
//    sky(o) / floorPlane(gy, o)         graded backdrop and a perspective floor (scenes call them)
//    air(kind, L, o)                    atmosphere: 'dust' 'fog' 'embers' 'rain' 'snow' (one per scene)
//    caption(str, t0, t1, o)            16:9 caption: Inter 800 caps >= 60 px, yellow bar, never over a face (auto top/bottom)
//    CAMS.push/pull/pan/crane/drift     camera moves for beat({ cam }); every one also drifts in x so parallax shows
//    heroSc(frac, z)                    figure scale so Pip is frac of the frame height at camera zoom z (default 0.42)
// =====================================================================
const GRADES = {
  //            sky top → mid → horizon        far hills / city   back layer   floor top → bottom    light       glow       tint (soft-light)        vignette grain
  night: { sky: ['#02040a', '#0a1222', '#1c2b46'], far: '#16223a', back: '#0d1526', floor: ['#121a2a', '#04060a'], light: '#cfe0ff', glow: '#6d8fe0', tint: 'rgba(60,90,170,0.16)', vig: 0.66, grain: 0.09 },
  cold:  { sky: ['#020707', '#0a1a1d', '#173236'], far: '#163236', back: '#0c1f22', floor: ['#10232a', '#030708'], light: '#c8fff8', glow: '#3fbfb6', tint: 'rgba(40,140,150,0.14)', vig: 0.66, grain: 0.09 },
  dusk:  { sky: ['#07050d', '#2b1426', '#8a4430'], far: '#3a1d2a', back: '#22111c', floor: ['#22141a', '#070405'], light: '#ffc58a', glow: '#ff7a3a', tint: 'rgba(170,70,40,0.14)', vig: 0.6, grain: 0.08 },
  ember: { sky: ['#0a0604', '#1e130b', '#2e1d10'], far: '#2a1a0e', back: '#1f140b', floor: ['#2a1a0e', '#080403'], light: '#ffd28a', glow: '#ff9a3a', tint: 'rgba(190,100,30,0.14)', vig: 0.7, grain: 0.09 },
  dawn:  { sky: ['#0d1022', '#463656', '#f0a058'], far: '#5a3c52', back: '#33243a', floor: ['#2e2030', '#0b080c'], light: '#fff0c8', glow: '#ffb24a', tint: 'rgba(230,140,60,0.14)', vig: 0.5, grain: 0.07 },
  gold:  { sky: ['#1a1208', '#6a4416', '#f2b450'], far: '#7a5024', back: '#4a3016', floor: ['#3a2610', '#0f0904'], light: '#fff3c8', glow: '#ffc65a', tint: 'rgba(240,170,60,0.16)', vig: 0.44, grain: 0.07 },
};
const LOOK = { name: 'night', g: GRADES.night, lights: [], on: true };
let CAMR = { z: 1, pop: 1, x: 500, y: 500, sx: 0, sy: 0 };
function grade(name) { LOOK.name = GRADES[name] ? name : 'night'; LOOK.g = GRADES[LOOK.name]; }
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mixHex = (a, b, u) => { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(u)).toString(16).padStart(2, '0')).join(''); };

// ---- depth: one camera, layers at depth f move and zoom f times as much (parallax)
function layer(f, fn) {
  ctx.save();
  const z = CAMR.pop * (1 + (CAMR.z - 1) * f), cx = 500 + (CAMR.x - 500) * f, cy = 500 + (CAMR.y - 500) * f, k = S * z;
  ctx.setTransform(k, 0, 0, k, CX - cx * k + CAMR.sx * S * f, CY - cy * k + CAMR.sy * S * f);
  try { fn(); } finally { ctx.restore(); }
}
// logical bounds of what layer f shows (for skies and floors that must cover the frame)
function viewBox(f = 1) { const z = CAMR.pop * (1 + (CAMR.z - 1) * f), cx = 500 + (CAMR.x - 500) * f, cy = 500 + (CAMR.y - 500) * f, k = S * z;
  return { x0: cx - CX / k - 20, x1: cx + (W - CX) / k + 20, y0: cy - CY / k - 20, y1: cy + (H - CY) / k + 20 }; }

// ---- light: one source per scene; glow is added in post() so it blooms over everything
function lightAt(x, y, o = {}) {
  const m = ctx.getTransform();
  LOOK.lights[o.key ? 'unshift' : 'push']({ x, y, sx: m.a * x + m.c * y + m.e, sy: m.b * x + m.d * y + m.f, r: (o.r ?? 260) * m.a, a: o.a ?? 1, color: o.color || LOOK.g.glow, core: o.core ?? 1 });
}
const mainLight = () => LOOK.lights[0] || null;
function pool(x, gy, w = 420, a = 0.5, color) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, gy); ctx.scale(1, 0.22);
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, w); gr.addColorStop(0, rgba(color || LOOK.g.glow, 0.55 * a)); gr.addColorStop(0.5, rgba(color || LOOK.g.glow, 0.16 * a)); gr.addColorStop(1, rgba(color || LOOK.g.glow, 0));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.fill(); ctx.restore();
}
// a cone of light from (x, y) down to the floor gy, width w at the floor (lamps, spotlights, windows)
function beam(x, y, gy, w, a = 0.35, color) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createLinearGradient(0, y, 0, gy); gr.addColorStop(0, rgba(color || LOOK.g.glow, 0.42 * a)); gr.addColorStop(1, rgba(color || LOOK.g.glow, 0.05 * a));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + w / 2, gy); ctx.lineTo(x - w / 2, gy); ctx.closePath(); ctx.fill(); ctx.restore();
}
// rim + cast shadow for a figure standing at (x, gy) with height h (characters/stick.js calls it; props may too)
function castShadow(x, gy, h, w = 70) {
  const l = mainLight(); ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(x, gy + 2, w * 0.7, w * 0.13, 0, 0, TAU); ctx.fill();   // contact shadow
  if (l) {   // long soft shadow away from the light, along the floor
    const m = ctx.getTransform(), lx = (l.sx - m.e) / m.a, dx = clamp((x - lx) / 600, -1.4, 1.4), len = h * (0.55 + 0.5 * Math.abs(dx));
    ctx.globalAlpha = 0.32 * GA; ctx.translate(x, gy + 2); ctx.beginPath(); ctx.ellipse(Math.sign(dx || 1) * len / 2, 0, len / 2, w * 0.16, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---- backdrop and floor (scenes call these inside their layers)
function sky(o = {}) {
  const v = viewBox(0.1), g = LOOK.g, hy = o.horizon ?? 640, c = o.colors || g.sky;
  const gr = ctx.createLinearGradient(0, hy - 900, 0, hy); gr.addColorStop(0, c[0]); gr.addColorStop(0.6, c[1]); gr.addColorStop(1, c[2]);
  ctx.fillStyle = gr; ctx.fillRect(v.x0 - 400, v.y0 - 400, v.x1 - v.x0 + 800, v.y1 - v.y0 + 800);
  if (o.stars) { const r = rng(o.seed || 9); ctx.fillStyle = g.light; for (let i = 0; i < 90; i++) { const x = v.x0 - 300 + r() * (v.x1 - v.x0 + 600), y = hy - 900 + r() * 700, tw = 0.5 + 0.5 * Math.sin(TT * (1 + r() * 2) + i);
    ctx.globalAlpha = GA * (0.15 + 0.5 * r()) * tw * clamp((hy - 120 - y) / 300); ctx.fillRect(x, y, 2.2, 2.2); } ctx.globalAlpha = GA; }
}
// a celestial or distant light: a disc with a halo (sun, moon); registers the scene light unless o.light === false
function orb(x, y, r, o = {}) {
  const g = LOOK.g; ctx.save();
  const gr = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 5); gr.addColorStop(0, rgba(g.glow, 0.5)); gr.addColorStop(1, rgba(g.glow, 0));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, TAU); ctx.fill();
  ctx.fillStyle = o.color || g.light; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  if (o.crescent) { ctx.save(); ctx.clip(); ctx.beginPath(); ctx.rect(x - r, y - r, 2 * r, 2 * r); ctx.arc(x + r * 0.45, y - r * 0.2, r * 0.9, 0, TAU); ctx.fill('evenodd'); ctx.restore(); } else ctx.fill();
  ctx.restore(); if (o.light !== false) lightAt(x, y, { r: r * 9, a: o.a ?? 0.7 });
}
// perspective floor from gy down: graded fill, converging seams toward the vanishing point (vx, horizon), soft horizon line
function floorPlane(gy, o = {}) {
  const v = viewBox(1), g = LOOK.g, hz = o.horizon ?? gy - 120, vx = o.vx ?? 500, bottom = v.y1 + 300;
  const gr = ctx.createLinearGradient(0, gy, 0, gy + 420); gr.addColorStop(0, o.top || g.floor[0]); gr.addColorStop(1, g.floor[1]);
  ctx.fillStyle = gr; ctx.fillRect(v.x0 - 600, gy, v.x1 - v.x0 + 1200, bottom - gy);
  ctx.save(); ctx.beginPath(); ctx.rect(v.x0 - 600, gy, v.x1 - v.x0 + 1200, bottom - gy); ctx.clip();
  ctx.strokeStyle = rgba(g.light, o.seams ?? 0.07); ctx.lineWidth = 3;
  for (let i = -14; i <= 14; i++) { const xb = vx + i * (o.gap ?? 150) * 2.4; ctx.beginPath(); ctx.moveTo(lerp(vx, xb, (gy - hz) / (bottom - hz)), gy); ctx.lineTo(xb, bottom); ctx.stroke(); }
  if (o.rows) for (let j = 1; j < 9; j++) { const y = gy + (bottom - gy) * (j / 9) ** 1.8; ctx.beginPath(); ctx.moveTo(v.x0 - 600, y); ctx.lineTo(v.x1 + 600, y); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = PAL.g2; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(v.x0 - 600, gy); ctx.lineTo(v.x1 + 600, gy); ctx.stroke(); ctx.restore();   // the kit's ground line
}
// a far silhouette ridge (hills, mountains, skyline) filled down to y1; seeded, no outline (atmospheric depth)
function ridge(y, amp, color, o = {}) {
  const v = viewBox(o.f ?? 0.3), r = rng(o.seed || 3), step = o.step || 90, x0 = v.x0 - 200, x1 = v.x1 + 200;
  ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x0, (o.y1 ?? y + 900));
  const pts = []; for (let x = x0; x <= x1 + step; x += step) pts.push([x, y - amp * (o.peaks ? Math.abs(Math.sin(x * 0.006 + r() * 2)) : 0.5 + 0.5 * Math.sin(x * 0.004 + (o.seed || 3))) - r() * amp * 0.35]);
  if (o.peaks) for (const p of pts) ctx.lineTo(p[0], p[1]);
  else { ctx.lineTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } }
  ctx.lineTo(x1 + step, o.y1 ?? y + 900); ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---- atmosphere: one moving layer per scene
const _ar = rng(311), AIR = Array.from({ length: 70 }, () => ({ x: _ar(), y: _ar(), s: _ar(), p: _ar() * TAU }));
function air(kind = 'dust', L = TT, o = {}) {
  const v = viewBox(1), g = LOOK.g, w = v.x1 - v.x0, h = v.y1 - v.y0, n = o.n ?? (kind === 'rain' ? 70 : 46);
  ctx.save();
  if (kind === 'fog') {
    for (let i = 0; i < 4; i++) { const y = (o.y ?? 760) - i * 70, x = v.x0 + ((TT * (14 + i * 6) + i * 400) % (w + 1200)) - 600;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, 520); gr.addColorStop(0, rgba(g.glow, 0.09)); gr.addColorStop(1, rgba(g.glow, 0));
      ctx.save(); ctx.translate(0, y); ctx.scale(1, 0.25); ctx.translate(0, -y); ctx.fillStyle = gr; ctx.fillRect(x - 520, y - 520, 1040, 1040); ctx.restore(); }
    ctx.restore(); return;
  }
  for (let i = 0; i < n; i++) {
    const d = AIR[i % AIR.length], sp = 0.5 + d.s;
    if (kind === 'rain') { const x = v.x0 + ((d.x * w + TT * 90) % w), y = v.y0 + (((d.y * h + TT * 900 * sp) % h) + h) % h;
      ctx.strokeStyle = rgba(g.light, 0.18 + 0.15 * d.s); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 34); ctx.stroke(); continue; }
    const up = kind === 'embers' ? -1 : kind === 'snow' ? 1 : -0.3, vy = (kind === 'embers' ? 60 : kind === 'snow' ? 40 : 10) * sp;
    const x = v.x0 + (((d.x * w + Math.sin(TT * 0.7 + d.p) * 30 + TT * 8 * sp) % w) + w) % w, y = v.y0 + (((d.y * h + up * TT * vy) % h) + h) % h;
    const col = kind === 'embers' ? '#ffb05a' : g.light, r = (kind === 'snow' ? 3 : 1.6) + d.s * 2.2;
    ctx.globalAlpha = GA * (0.18 + 0.35 * d.s) * (0.6 + 0.4 * Math.sin(TT * 2 + d.p)); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---- texture: film grain tiles (seeded once), grade tint, light bloom, vignette. renderFrame calls post() last.
const GRAIN = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256), r = rng(900 + s);
  for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return c; });
function post() {
  const g = LOOK.g; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  for (const l of LOOK.lights) {   // bloom: the light source glows over the whole picture
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(l.sx, l.sy, 0, l.sx, l.sy, l.r); gr.addColorStop(0, rgba(l.color, 0.5 * l.a)); gr.addColorStop(0.25, rgba(l.color, 0.18 * l.a)); gr.addColorStop(1, rgba(l.color, 0));
    ctx.fillStyle = gr; ctx.fillRect(l.sx - l.r, l.sy - l.r, l.r * 2, l.r * 2);
  }
  ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g.tint; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const vg = ctx.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${g.vig})`);
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const fi = Math.floor(TT * FPS), tile = GRAIN[fi % 4];
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = g.grain * 2; ctx.translate(-(fi * 37) % 256, -(fi * 91) % 256);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}

// ---- type: one caption per shot, <= 4 words, Inter 800 caps, yellow bar, soft shadow; box and text are one mark
function caption(str, t0, t1, o = {}) {
  if (TT < t0 || TT >= t1) return;
  if (VERT && typeof labelV === 'function') return labelV(str, t0, t1, o);
  const k = t0 <= 0.01 ? 1 : EZ.o3((TT - t0) / 0.22), out = 1 - EZ.i2((TT - (t1 - 0.15)) / 0.15), a = Math.min(k, out);
  let sz = o.size ?? 76; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  const setf = () => { ctx.font = `800 ${sz}px ${FONT}`; ctx.letterSpacing = `${sz * 0.06}px`; }; setf();
  const s = String(str).toUpperCase(); while (ctx.measureText(s).width > W * 0.7 && sz > 60) { sz -= 2; setf(); }
  const w = ctx.measureText(s).width, faces = (typeof LAYOUT !== 'undefined' ? LAYOUT : []).filter((b) => b.kind === 'face' || b.kind === 'hero');
  const top = o.y ?? 150, bot = H - 150, hit = (y) => faces.some((f) => f.y0 < y + sz && f.y1 > y - sz && f.x0 < W / 2 + w / 2 && f.x1 > W / 2 - w / 2);
  const y = (o.y ?? (o.pos === 'bottom' ? bot : top)) + (1 - k) * 16, cy = o.y != null ? y : hit(y) ? (hit(bot) ? top : bot) : y, cx = o.x ?? W / 2;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 24; ctx.fillStyle = PAL.white;
  ctx.fillText(s, cx + sz * 0.03, cy); ctx.shadowBlur = 0;
  ctx.fillStyle = PAL.accent; ctx.fillRect(cx - 50, cy + sz * 0.62, 100 * k, 9);
  ctx.restore();
  if (typeof LAYOUT !== 'undefined') LAYOUT.push({ kind: 'label', name: s, x0: cx - w / 2, y0: cy - sz / 2, x1: cx + w / 2, y1: cy + sz / 2 });
}

// ---- camera moves for beat({ cam }). z = zoom (1 = the whole stage), x/y = what the camera looks at (logical).
//      Every move drifts sideways too, so the depth layers slide against each other (parallax) on every shot.
const CAMS = {
  push: (z0 = 1, z1 = 1.12, x = 500, y = 520, dx = 30) => (L, d) => { const u = EZ.io(L / d); return { z: lerp(z0, z1, u), x: x - dx / 2 + dx * u, y }; },
  pull: (z0 = 1.15, z1 = 1, x = 500, y = 520, dx = -30) => CAMS.push(z0, z1, x, y, dx),
  pan: (x0 = 420, x1 = 580, z = 1.05, y = 520) => (L, d) => ({ z: z + 0.02 * EZ.io(L / d), x: lerp(x0, x1, EZ.io(L / d)), y }),
  crane: (y0 = 420, y1 = 560, z = 1.05, x = 500) => (L, d) => { const u = EZ.io(L / d); return { z: z + 0.03 * u, x: x - 20 + 40 * u, y: lerp(y0, y1, u) }; },
  drift: (z = 1.04, x = 500, y = 520) => (L, d) => ({ z: z + 0.025 * Math.sin(L / d * Math.PI), x: x - 25 + 50 * EZ.io(L / d), y }),
};
// figure scale for a target height: frac of the frame height (0.30-0.55 for wides) at camera zoom z
const FIG_H = 255;   // idle Pip at sc 1, head top to foot, logical px
const heroSc = (frac = 0.42, z = 1) => (frac * (H / S)) / (FIG_H * z);

// the default stage under a metaphor move (sets/metaphors*.js): graded backdrop, a far horizon, a top spotlight with a cone and
// a floor pool, fog. Moves draw their own ground line and props on top. Beats with a scene recipe pass { stage: false }.
function stageBack(L) {
  const gy = VERT ? GV : 760, g = LOOK.g;
  layer(0.1, () => sky({ horizon: gy - 40, stars: LOOK.name === 'night' || LOOK.name === 'cold', seed: 4 }));
  layer(0.35, () => ridge(gy - 90, 70, g.far, { f: 0.35, seed: 6, y1: gy + 400 }));
  layer(0.6, () => ridge(gy - 30, 40, g.back, { f: 0.6, seed: 8, step: 140, y1: gy + 400 }));
  layer(1, () => { floorPlane(gy, { horizon: gy - 160 }); beam(500, -200, gy, 900, 0.5); pool(500, gy, 620, 0.9); lightAt(500, -120, { r: 700, a: 0.55 }); air('fog', L, { y: gy - 10 }); });
}
