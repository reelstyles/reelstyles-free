// =====================================================================
//  engine/look.js: the film look of kinetic-type as general tools (load after engine/kinetic.js, before sets/recipes.js).
//  The words stay the actors; this file gives them a lit place to stand in.
//    GRADES[mood]              sky, horizon, wall, floor, fog, tint per mood: night · dawn · day · dusk · neon · storm · hearth · gold · cold
//    gradeTrack([[t, mood, blend s]...])   the colour turn across the film (tint over every frame, soft-light)
//    LIGHTS kinds              sun · moon · lamp · neon · screen · window: lightDraw(L, t) paints the source with bloom (L.hang: ceiling lamp)
//    litWord(str, cx, base, size, t, o)    a word STANDING on the floor: feet on y = base, rim on the light side,
//                              hard shadow, contact shadow, cast shadow on the floor away from the light. Returns word()'s box.
//                              o.trail n: faded copies behind a moving word. o.pose 'walk' | 'reach' | 'cheer' | 'slump' (POSES of characters/cast.js) makes the word act.
//    camMove(kind, {t0, d, amt, x, y})     'push' | 'pull' | 'truck' | 'crane' | 'drift' -> cam(t) = {x, y, z}
//    layerIn(cam, t, p, fn)    draws fn in a depth layer: p 0.15 far, 0.4 wall, 1 subject, 1.5 near (parallax + scale)
//    air(kind, t, o)           one moving atmosphere: 'dust' | 'rain' | 'snow' | 'embers' | 'confetti' | 'haze'
//    grain(t)                  film grain + fine scanline texture (recipes call it last)
//  Pure functions of t: noise tiles come from mulberry32, never Math.random.
// =====================================================================
const GRADES = {
  night:  { sky: ['#0B0A1E', '#2A2152'], hz: '#6A4FC8', wall: '#1B1838', floor: ['#221E44', '#0E0C1E'], fog: '#3A3270', tint: [60, 70, 170], ta: 0.14, line: 'rgba(160,150,255,0.22)', blob: PAL.violet },
  dawn:   { sky: ['#2B2858', '#F29A7A'], hz: '#FFC48A', wall: '#4B3A68', floor: ['#5A4570', '#1E1630'], fog: '#C98AA0', tint: [255, 170, 140], ta: 0.08, line: 'rgba(255,220,200,0.22)', blob: PAL.coral },
  day:    { sky: ['#4C7DFF', '#BFD3FF'], hz: '#F6F1E7', wall: '#8FA6E8', floor: ['#6C7FC8', '#2C3470'], fog: '#C8D6FF', tint: [255, 245, 220], ta: 0.05, line: 'rgba(255,255,255,0.28)', blob: PAL.mint },
  dusk:   { sky: ['#1E1238', '#C2456E'], hz: '#FF8A5A', wall: '#3A1E46', floor: ['#3E2148', '#140A1C'], fog: '#8A3E6A', tint: [190, 80, 120], ta: 0.12, line: 'rgba(255,160,200,0.22)', blob: PAL.pink },
  neon:   { sky: ['#07061A', '#1E0F3A'], hz: '#FF4FA3', wall: '#160F30', floor: ['#1C1236', '#08061A'], fog: '#5A1E6A', tint: [200, 60, 200], ta: 0.12, line: 'rgba(46,230,197,0.30)', blob: PAL.pink },
  storm:  { sky: ['#11161E', '#3A4A5A'], hz: '#8AA4B8', wall: '#1E2630', floor: ['#26303C', '#0A0E14'], fog: '#4A5A6A', tint: [80, 110, 150], ta: 0.16, line: 'rgba(200,220,240,0.18)', blob: PAL.blue },
  hearth: { sky: ['#1A0E0A', '#5A2A16'], hz: '#FF9A4A', wall: '#3A1E14', floor: ['#4A2616', '#140804'], fog: '#7A3A1E', tint: [255, 140, 70], ta: 0.12, line: 'rgba(255,190,120,0.22)', blob: PAL.coral },
  gold:   { sky: ['#3A1E3A', '#FFB534'], hz: '#FFE2A0', wall: '#6A3A2A', floor: ['#7A4A2A', '#2A140C'], fog: '#E09A5A', tint: [255, 190, 90], ta: 0.14, line: 'rgba(255,230,170,0.30)', blob: PAL.amber },
  cold:   { sky: ['#0A1424', '#2C4A6A'], hz: '#7AC8E0', wall: '#14243A', floor: ['#1A2C44', '#08101C'], fog: '#3A5A7A', tint: [70, 130, 190], ta: 0.14, line: 'rgba(150,210,255,0.22)', blob: PAL.blue },
};
const gradeOf = (m) => GRADES[m] || GRADES.night;
const LIGHTS = {
  sun: { col: '#FFD38A', core: '#FFF4D6', r: 90, bloom: 3.6, flick: 0 },
  moon: { col: '#C8D4FF', core: '#F6F1E7', r: 64, bloom: 3.0, flick: 0 },
  lamp: { col: '#FFB534', core: '#FFF1C8', r: 34, bloom: 6.0, flick: 0.05 },
  neon: { col: '#FF4FA3', core: '#FFE0F0', r: 30, bloom: 7.0, flick: 0.08 },
  screen: { col: '#2EE6C5', core: '#E8FFF9', r: 40, bloom: 5.0, flick: 0.03 },
  window: { col: '#FFC870', core: '#FFF0C8', r: 70, bloom: 3.4, flick: 0 },
};
// the light of the current shot (recipes set it; litWord reads it): {kind, x, y, col, level}
let LIGHT = { kind: 'moon', x: W * 0.75, y: H * 0.25, col: LIGHTS.moon.col, level: 1 };

const _rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const _mixHex = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, k))); return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); };

// ---------- grade turn
let LK_TRACK = null;
function gradeTrack(list) { LK_TRACK = list.slice().sort((a, b) => a[0] - b[0]); }
function gradePost(t) {
  if (!LK_TRACK || !LK_TRACK.length) return;
  let tint = gradeOf(LK_TRACK[0][1]).tint, ta = gradeOf(LK_TRACK[0][1]).ta;
  for (let i = 1; i < LK_TRACK.length; i++) {
    const [t0, m, bl] = LK_TRACK[i], p = EZ.io((t - t0) / Math.max(0.01, bl || 0.01)), G = gradeOf(m);
    if (p <= 0) break;
    tint = tint.map((v, j) => lerp(v, G.tint[j], p)); ta = lerp(ta, G.ta, p);
  }
  ctx.save(); ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(${tint.map(Math.round).join(',')},${Math.min(0.6, ta * 2.4)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
}

// ---------- light source with bloom (draw it in the far layer; recipes add a second, screen-space bloom pass)
function lightDraw(L, t, scale = 1) {
  const S = LIGHTS[L.kind] || LIGHTS.lamp, fl = 1 + Math.sin(t * 13.1) * S.flick * 0.6 + Math.sin(t * 7.3 + 1) * S.flick * 0.4;
  const r = (L.r ?? S.r) * scale, lv = (L.level ?? 1) * fl;
  if (L.hang) {   // a hanging lamp: cord from the ceiling and a dark shade over the bulb
    ctx.fillStyle = '#0C0B16'; ctx.fillRect(L.x - 3, L.y - 900, 6, 900 - r);
    ctx.beginPath(); ctx.moveTo(L.x - r * 2.6, L.y + r * 0.2); ctx.lineTo(L.x - r * 0.8, L.y - r * 1.6); ctx.lineTo(L.x + r * 0.8, L.y - r * 1.6); ctx.lineTo(L.x + r * 2.6, L.y + r * 0.2); ctx.fill();
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, r * S.bloom * 2.2);
  g.addColorStop(0, _rgba(S.col, 0.55 * lv)); g.addColorStop(0.25, _rgba(S.col, 0.22 * lv)); g.addColorStop(1, _rgba(S.col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.x, L.y, r * S.bloom * 2.2, 0, TAU); ctx.fill();
  ctx.restore();
  if (L.kind === 'window') {   // a lit window: four panes
    ctx.fillStyle = S.core; const w = r * 1.5, h = r * 2;
    ctx.fillRect(L.x - w / 2, L.y - h / 2, w, h); ctx.fillStyle = S.col; ctx.fillRect(L.x - 4, L.y - h / 2, 8, h); ctx.fillRect(L.x - w / 2, L.y - 4, w, 8);
  } else if (L.kind === 'screen') {
    ctx.fillStyle = S.core; ctx.beginPath(); ctx.roundRect(L.x - r * 1.6, L.y - r, r * 3.2, r * 2, 10); ctx.fill();
  } else {
    ctx.fillStyle = S.core; ctx.beginPath(); ctx.arc(L.x, L.y, r, 0, TAU); ctx.fill();
    if (L.kind === 'moon') { ctx.fillStyle = _rgba('#8A96C8', 0.35); ctx.beginPath(); ctx.arc(L.x - r * 0.3, L.y - r * 0.2, r * 0.22, 0, TAU); ctx.arc(L.x + r * 0.35, L.y + r * 0.3, r * 0.14, 0, TAU); ctx.fill(); }
  }
}
// a cone of light from (x, y) down to the floor at base (spot / lamp light), additive
function lightCone(x, y, base, w0, w1, col, a = 0.18) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, y, 0, base); g.addColorStop(0, _rgba(col, a)); g.addColorStop(1, _rgba(col, a * 0.25));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w0 / 2, y); ctx.lineTo(x + w0 / 2, y); ctx.lineTo(x + w1 / 2, base); ctx.lineTo(x - w1 / 2, base); ctx.fill();
  const p = ctx.createRadialGradient(x, base, 0, x, base, w1 * 0.6); p.addColorStop(0, _rgba(col, a * 1.4)); p.addColorStop(1, _rgba(col, 0));
  ctx.fillStyle = p; ctx.save(); ctx.translate(x, base); ctx.scale(1, 0.18); ctx.translate(-x, -base); ctx.beginPath(); ctx.arc(x, base, w1 * 0.6, 0, TAU); ctx.fill(); ctx.restore();
  ctx.restore();
}

// ---------- a word standing on the floor (feet on base), lit by LIGHT
// o: word() options plus {rim (colour, default the light), cast (0-1 floor shadow strength), tall}. size = the word's font size.
function litWord(str, cx, base, size, t, o = {}) {
  const B = wordBox(str, size, o.cond ?? 1, o.tall ?? 1, o.track ?? 0), cy = base - B.down;
  const side = Math.sign(LIGHT.x - cx) || 1, rimC = o.rim ?? LIGHT.col, cast = o.cast ?? 0.5;
  const fade = o.alpha ?? 1;
  if (o.pose && typeof POSES !== 'undefined' && POSES[o.pose]) { const P = POSES[o.pose], dir = o.dir ?? 1; o = { ...o, fx: (i, n, tt) => P(i, n, tt, size, 0, o.sp ?? 1, dir) }; }
  ctx.save(); ctx.globalAlpha = fade;
  if (cast > 0) {   // cast shadow lying on the floor, away from the light
    ctx.save(); ctx.globalAlpha = cast * fade * 0.55; ctx.filter = 'blur(6px)';
    ctx.translate(cx, base); ctx.transform(1, 0, side * 0.9, -0.22, 0, 0); ctx.translate(-cx, -base);
    word(str, cx, cy, size, t, { ...o, col: '#000000', shadow: null, outline: null, stroke: null });
    ctx.restore();
    const cs = ctx.createRadialGradient(cx, base, 0, cx, base, B.w * 0.6);   // contact shadow
    cs.addColorStop(0, `rgba(0,0,0,${0.5 * fade})`); cs.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.translate(cx, base); ctx.scale(1, 0.09); ctx.translate(-cx, -base); ctx.fillStyle = cs; ctx.beginPath(); ctx.arc(cx, base, B.w * 0.6, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (typeof KT_WET !== 'undefined' && KT_WET && o.reflect !== false) {   // wet floor: a dim mirrored copy under the feet
    ctx.save(); ctx.globalAlpha = 0.22 * fade; ctx.translate(0, base * 2 + 6); ctx.scale(1, -1);
    word(str, cx, cy, size, t, { ...o, shadow: null, outline: null, stroke: null }); ctx.restore();
  }
  for (let k = o.trail ?? 0; k >= 1; k--) {   // motion trail: faded copies behind a moving word (o.trail = count, o.dir = travel direction)
    ctx.save(); ctx.globalAlpha = fade * 0.18 / k; ctx.translate(-(o.dir ?? 1) * k * size * 0.14, 0);
    word(str, cx, cy, size, t, { ...o, col: o.col ?? PAL.cream, shadow: null, outline: null }); ctx.restore();
  }
  // rim: a light copy pushed toward the light, the solid word over it leaves a lit edge
  const rd = Math.max(3, size * 0.022);
  ctx.save(); ctx.translate(side * rd, -rd * 0.8);
  word(str, cx, cy, size, t, { ...o, col: rimC, shadow: null, outline: null });
  ctx.restore();
  const r = word(str, cx, cy, size, t, { shadow: o.shadow ?? 'rgba(0,0,0,0.45)', ...o });
  ctx.restore();
  return r;
}

// ---------- camera: cam(t) -> {x, y, z}; x/y in px at the subject plane, z zoom (1 = wide)
function camMove(kind, o = {}) {
  const t0 = o.t0 ?? 0, d = o.d ?? 3, a = o.amt ?? 1, X = o.x ?? 0, Y = o.y ?? 0;
  return (t) => {
    const k = EZ.io(seg(t, t0, t0 + d)), s = Math.sin(t * 0.9) * 6;
    if (kind === 'push') return { x: X + s, y: Y + k * 10 * a, z: 1 + k * 0.08 * a };
    if (kind === 'pull') return { x: X + s, y: Y - k * 10 * a, z: 1 + (1 - k) * 0.08 * a };
    if (kind === 'truck') return { x: X + (k - 0.5) * 220 * a, y: Y, z: 1.03 };
    if (kind === 'crane') return { x: X + s, y: Y + (0.5 - k) * 120 * a, z: 1.02 + k * 0.03 * a };
    return { x: X + Math.sin(t * 0.6) * 40 * a, y: Y + Math.cos(t * 0.5) * 14 * a, z: 1.02 + Math.sin(t * 0.4) * 0.015 * a };   // drift
  };
}
// p: depth factor (0.15 far, 0.4 wall, 1 subject, 1.5 near). Anchor = subject floor line (H * 0.78).
function layerIn(c, p, fn) {
  const ax = W / 2, ay = H * 0.78, z = 1 + (c.z - 1) * p;
  ctx.save(); ctx.translate(ax, ay); ctx.scale(z, z); ctx.translate(-ax - c.x * p, -ay - c.y * p); fn(); ctx.restore();
}

// ---------- air: one moving layer (screen space, pure function of t)
const _AIRP = (() => { const r = mulberry32(77); return Array.from({ length: 90 }, () => [r(), r(), r(), r()]); })();
function air(kind, t, o = {}) {
  if (!kind) return;
  const col = o.col ?? (kind === 'embers' ? '#FFB534' : kind === 'rain' ? '#C8D4FF' : '#F6F1E7');
  ctx.save();
  if (kind === 'haze') {
    for (let i = 0; i < 3; i++) { const x = ((t * 40 * (i + 1) + i * 700) % (W + 1200)) - 600, y = H * (0.45 + i * 0.12);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 600); g.addColorStop(0, _rgba(col, 0.07)); g.addColorStop(1, _rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    ctx.restore(); return;
  }
  _AIRP.forEach(([a, b, c, d], i) => {
    const sz = 2 + c * 5;
    if (kind === 'rain') {
      const x = (a * W + t * 260) % W, y = ((b * H + t * (1500 + c * 600)) % (H + 80)) - 40;
      ctx.strokeStyle = _rgba(col, 0.22 + d * 0.2); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y - 46); ctx.stroke(); return;
    }
    const up = kind === 'embers' ? -1 : 1, sp = kind === 'snow' ? 70 : kind === 'embers' ? 90 : kind === 'confetti' ? 220 : 18;
    const x = ((a * W + Math.sin(t * (0.6 + d) + i) * 40 + t * (kind === 'dust' ? 12 : 0)) % W + W) % W;
    const y = (((b * H + up * t * sp * (0.6 + c)) % H) + H) % H;
    if (kind === 'confetti') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + i); ctx.fillStyle = [PAL.amber, PAL.pink, PAL.mint, PAL.violet, PAL.cream][i % 5];
      ctx.fillRect(-sz * 2, -sz, sz * 4, sz * 2); ctx.restore(); return;
    }
    const al = (kind === 'dust' ? 0.25 : 0.55) * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7));
    if (kind === 'embers') { ctx.globalCompositeOperation = 'lighter'; }
    ctx.fillStyle = _rgba(col, al); ctx.beginPath(); ctx.arc(x, y, sz * (kind === 'dust' ? 0.6 : 1), 0, TAU); ctx.fill();
  });
  ctx.restore();
}

// ---------- grain: 4 noise tiles, a new one every 1/12 s; scanline texture; vignette
const _GRAIN = (() => {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), im = g.createImageData(256, 256), r = mulberry32(900 + k);
    for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); out.push(c);
  }
  return out;
})();
function grain(t, o = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = o.amt ?? 0.1;
  const tile = _GRAIN[Math.floor(t * 12) % 4], p = ctx.createPattern(tile, 'repeat');
  ctx.fillStyle = p; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const v = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${o.vig ?? 0.55})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
