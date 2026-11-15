// =====================================================================
//  engine/look.js: the film look of the doodle kit (11-14). Load it after engine/doodle.js. Classic script, globals.
//  The doodle stays a doodle (ink + marker on paper); this file lights, grades and layers it like a film.
//
//    look({ grade, light: [wx, wy], beams, hero: [wx, wy] })   call once inside a shot's draw(): picks the mood grade and the ONE light
//                                              source (world point), hero = the key-lit subject's chest. renderFrame applies it after the shot, under the paper.
//    GRADES                                    the mood presets: day · dawn · cosy · rain · dusk · night · golden
//    layer(f, fn)                              draw fn as a depth layer: f 0.3-0.6 far (horizon, walls), 1 mid (the hero),
//                                              1.3-1.5 near (foreground). Moves against the shot's first camera = parallax.
//    halo(x, y, r, a)                          the rim glow behind the subject, in the grade's light colour (draw it BEFORE the figure)
//    air(kind, o)                              one moving atmosphere layer: 'motes' · 'rain' · 'snow' · 'leaves' · 'fireflies'
//    camPush / camPan / camCrane / camDrift    camera moves for shot(..., cam): every shot moves.
//  Every frame stays a pure function of TT (no Math.random).
// =====================================================================
const GRADES = {
  //          wash over the frame (multiply)      light colour + strength       shade far from the light     sky colour for sets
  day:    { mul: '#FFF4E0', ma: 0.10, lc: '255,244,214', la: 0.30, shade: '#B9A88A', sa: 0.16, sky: PAL.sky,    ground: PAL.mint },
  dawn:   { mul: '#FFD6BC', ma: 0.28, lc: '255,214,170', la: 0.36, shade: '#A98C8C', sa: 0.18, sky: '#F7C3B5',  ground: PAL.mint },
  cosy:   { mul: '#F6D2A2', ma: 0.34, lc: '255,214,140', la: 0.36, shade: '#8C6E5A', sa: 0.22, sky: PAL.sky,    ground: '#E9C08C' },
  rain:   { mul: '#BCCBDC', ma: 0.42, lc: '235,240,255', la: 0.20, shade: '#6C7896', sa: 0.20, sky: '#A9BACB',  ground: '#8FB8A8' },
  dusk:   { mul: '#D3BFEA', ma: 0.36, lc: '255,196,140', la: 0.38, shade: '#6E5E8E', sa: 0.22, sky: PAL.lilac,  ground: '#8CC2A4' },
  night:  { mul: '#7C86B8', ma: 0.42, lc: '255,224,138', la: 0.55, shade: '#2C3150', sa: 0.30, sky: '#5A6496',  ground: '#4F8C8A' },
  golden: { mul: '#FFD98E', ma: 0.32, lc: '255,226,150', la: 0.40, shade: '#B08A5A', sa: 0.14, sky: '#FFD9A0',  ground: PAL.mint },
};
let LOOK = null, CAM0 = null;           // LOOK: this frame's look(); CAM0: the camera at the shot's first frame (parallax origin)
function look(o = {}) { LOOK = { grade: 'day', ...o }; }
const gradeOf = () => GRADES[(LOOK && LOOK.grade) || 'day'] || GRADES.day;

// screen-space pass after the shot, before the paper grain: grade wash, light falloff away from the source, bloom, beams
function applyLook() {
  if (!LOOK) return; const G = gradeOf();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = G.ma; ctx.fillStyle = G.mul; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  const [lx, ly] = LOOK.light ? toScreen(LOOK.light[0], LOOK.light[1]) : [W * 0.75, H * 0.15], R = Math.hypot(W, H);
  const f = ctx.createRadialGradient(lx, ly, R * 0.12, lx, ly, R * 0.95);          // one light: the far side of the frame falls off
  f.addColorStop(0, 'rgba(255,255,255,0)'); f.addColorStop(1, G.shade);
  ctx.globalAlpha = G.sa; ctx.fillStyle = f; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1;
  const pulse = 1 + Math.sin(TT * 2.1) * 0.05, g = ctx.createRadialGradient(lx, ly, 0, lx, ly, R * 0.42 * pulse);
  g.addColorStop(0, `rgba(${G.lc},${G.la})`); g.addColorStop(0.35, `rgba(${G.lc},${G.la * 0.4})`); g.addColorStop(1, `rgba(${G.lc},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (LOOK.hero) {                                                                   // key light: the source's colour lands on the hero
    const [hx, hy] = toScreen(LOOK.hero[0], LOOK.hero[1]), r = 330 * CAM[2], k = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
    k.addColorStop(0, `rgba(${G.lc},${0.34 + G.la * 0.3})`); k.addColorStop(1, `rgba(${G.lc},0)`); ctx.fillStyle = k; ctx.fillRect(hx - r, hy - r, r * 2, r * 2);
  }
  if (LOOK.beams) {                                                                  // soft light shafts from the source, slowly turning
    const n = 5, dir = Math.atan2(H * 0.62 - ly, W * 0.5 - lx);
    for (let i = 0; i < n; i++) {
      const a = dir + (i - (n - 1) / 2) * 0.16 + Math.sin(TT * 0.5 + i) * 0.02, w = 0.035 + 0.02 * hash(i * 3.3), L = R * 1.1;
      const bg = ctx.createLinearGradient(lx, ly, lx + Math.cos(a) * L, ly + Math.sin(a) * L);
      bg.addColorStop(0, `rgba(${G.lc},${0.22 * LOOK.beams})`); bg.addColorStop(1, `rgba(${G.lc},0)`);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(a - w) * L, ly + Math.sin(a - w) * L); ctx.lineTo(lx + Math.cos(a + w) * L, ly + Math.sin(a + w) * L); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

// depth layers: f < 1 sits further away (moves and zooms less than the camera), f > 1 nearer (moves more)
function layer(f, fn) {
  if (!CAM0 || f === 1) return fn();
  const k = Math.pow(CAM[2] / CAM0[2], f - 1);
  ctx.save();
  ctx.translate(CAM[0], CAM[1]); ctx.scale(k, k); ctx.translate(-CAM[0], -CAM[1]);
  ctx.translate((CAM[0] - CAM0[0]) * (1 - f), (CAM[1] - CAM0[1]) * (1 - f));
  fn(); ctx.restore();
}

// rim / glow behind the subject: the light wraps it. A soft thing on the set, never on the character itself.
function halo(x, y, r = 260, a = 0.55) {
  unmeasured(() => { ctx.save(); ctx.globalCompositeOperation = 'screen'; glow(x, y, r * (1 + Math.sin(TT * 2.4) * 0.03), gradeOf().lc, a); ctx.restore(); });
}

// one atmosphere layer, drawn in screen space over the set (motion everywhere, so no held second is dead)
function air(kind = 'motes', o = {}) {
  const { n = 60, c = null, a = 1 } = o;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 7.3 + 1), h2 = hash(i * 3.9 + 2), h3 = hash(i * 5.5 + 3);
    if (kind === 'rain') {
      const v = 900 + h3 * 500, x = ((h1 * (W + 300) - TT * 260) % (W + 300) + W + 300) % (W + 300) - 150, y = ((h2 * (H + 200) + TT * v) % (H + 200)) - 100;
      ctx.strokeStyle = c || 'rgba(70,90,130,0.55)'; ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 46); ctx.stroke();
    } else if (kind === 'snow' || kind === 'fireflies' || kind === 'motes') {
      const v = kind === 'snow' ? 60 + h3 * 60 : 12 + h3 * 18, x = ((h1 * W + Math.sin(TT * 0.8 + i) * 30 + TT * 8) % W + W) % W;
      const y = ((h2 * H + (kind === 'snow' ? TT * v : -TT * v)) % H + H) % H, r = kind === 'fireflies' ? 5 + h3 * 4 : 3 + h3 * 4;
      const fl = kind === 'fireflies' ? 0.4 + 0.6 * Math.abs(Math.sin(TT * 2.5 + i)) : 1;
      if (kind === 'fireflies') glow(x, y, r * 6, '255,224,138', 0.5 * fl);
      ctx.globalAlpha = a * (kind === 'motes' ? 0.45 : 0.9) * fl; ctx.fillStyle = c || (kind === 'snow' ? PAL.white : kind === 'fireflies' ? PAL.glow : PAL.pencil);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    } else if (kind === 'leaves') {
      const x = ((h1 * (W + 200) + TT * (90 + h3 * 60)) % (W + 200)) - 100, y = ((h2 * H + TT * (40 + h3 * 40)) % H), rot = TT * (1 + h3) + i;
      ctx.save(); ctx.translate(x, y + Math.sin(TT * 2 + i) * 20); ctx.rotate(rot); ctx.globalAlpha = a;
      unmeasured(() => fillLoose(ellP(0, 0, 14, 7, 10), { c: c || [PAL.coral, PAL.mustard, PAL.teal][i % 3], hatch: false, off: [2, 1], seed: i }));
      ctx.restore();
    }
  }
  ctx.restore();
}

// camera moves: each returns cam(t) → [x, y, zoom, tilt] for shot(t0, t1, draw, title, cam). Eased, never still.
//   16:9 zoom: wide 1.0-1.1 (hero ~33% of the frame height), medium-wide 1.15-1.35, close 1.5-1.7 (short beats only)
const _k = (t, t0, t1) => EZ.io(seg(t, t0, t1)) * 0.75 + seg(t, t0, t1) * 0.25;    // eased but always moving
function camPush(x, y, z0, z1, t0, t1, dx = 0, dy = 0) { return (t) => { const k = _k(t, t0, t1); return [x + dx * k, y + dy * k, lerp(z0, z1, k), 0]; }; }
function camPan(x0, x1, y, z, t0, t1, tilt = 0) { return (t) => { const k = _k(t, t0, t1); return [lerp(x0, x1, k), y, z + 0.04 * k, tilt * (1 - k)]; }; }
function camCrane(x, y0, y1, z0, z1, t0, t1) { return (t) => { const k = _k(t, t0, t1); return [x, lerp(y0, y1, k), lerp(z0, z1, k), 0]; }; }
function camDrift(x, y, z, t0, t1, r = 40) { return (t) => { const k = seg(t, t0, t1); return [x + Math.sin(k * 2.2) * r, y - k * r * 0.5, z + 0.05 * k, Math.sin(k * 1.7) * 0.008]; }; }
