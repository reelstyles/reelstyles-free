// =====================================================================
//  engine/kinetic.js: the kinetic-type toolbox. Classic script; needs engine/runtime.js first.
//    PAL                         palette (the only colours a film uses)
//    drawStage(t, theme)         ink stage: drifting blurred colour blobs, dot grid, vignette (called by the runtime)
//    word(str, cx, cy, size, t, o)   per-letter animated word; size is clamped to ≥ 28 px and fitted to o.maxW
//    stack(lines, cy, size, t, o)    several words stacked, each with its own colour and entrance
//    small(str, cx, cy, t, o)        eyebrow / caption line (Inter 800, ≥ 30 px, tracked; ≥ 48 px and kept in the safe box in 9:16)
//    9:16: word()/small() clamp to the safe box x 90-940, y 250-1470 (pass free:true only for ghost/outline decor)
//    wipeTo(tc, dur, col1, col2, up?, slant?)  slanted double wipe (up=true: rises bottom to top, for 9:16) centred on cut time tc (register with trans())
//    brackets(t, t0, ...)            four corner brackets that close in and then keep breathing
//    shake(t, t0, amp)               decaying camera shake offset for impacts (add to cam())
//    wordBox(str, size, cond, tall)  {w, up, down}: the inked size of a word (up/down from its centre line), for layouts and the guard
//    label(str, o)                   9:16: the one label of a picture, queued and drawn in screen space after the shot on an ink plate
//                                    (Inter 800 caps, 64-76 px), centred x 513, above the hero (labelY of engine/safe.js), never on it
//  Every word keeps moving after it lands (idle bob + drift), so no hold is ever static.
// =====================================================================
const PAL = {
  ink: '#0C0B16', ink2: '#171428', cream: '#F6F1E7', violet: '#8B5CFF', pink: '#FF4FA3',
  mint: '#2EE6C5', amber: '#FFB534', blue: '#4C7DFF', coral: '#FF6B4A',
};
const DISPLAY = '"Archivo Black", "Arial Black", sans-serif';
const UI = '"Inter", "Helvetica Neue", Arial, sans-serif';
const HAND = DISPLAY;   // the font engine/safe.js draws the end card with
const _warned = {};
const warnOnce = (k, msg) => { if (!_warned[k]) { _warned[k] = 1; console.warn('[kinetic] ' + msg); } };

// ---------- stage
const THEME_DEFAULT = { base: PAL.ink, blobs: [[PAL.violet, 0.2, 0.25, 760], [PAL.pink, 0.72, 0.8, 640], [PAL.mint, 0.92, 0.88, 560]] };
function drawStage(t, th) {
  th = th || THEME_DEFAULT;
  ctx.fillStyle = th.base; ctx.fillRect(0, 0, W, H);
  th.blobs.forEach(([col, bx, by, r], i) => {
    const x = bx * W + Math.sin(t * 0.55 + i * 2.1) * 130, y = by * H + Math.cos(t * 0.47 + i * 1.7) * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col + '88'); g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
  // dot grid drifting diagonally (a loop every 60 px, so it never jumps)
  const P = H > W ? 72 : 60, D = H > W ? 5 : 3;   // 9:16: 5 px dots, 72 px pitch (3 px dots vanish on a phone)
  ctx.fillStyle = 'rgba(246,241,231,0.10)';
  const o = (t * 14) % P;
  for (let y = -P; y < H + P; y += P) for (let x = -P; x < W + P; x += P) ctx.fillRect(x + o, y + o * 0.5, D, D);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.0);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
function drawProgress(t) {   // hairline timeline at the bottom edge, moves every frame
  ctx.fillStyle = 'rgba(246,241,231,0.16)'; ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = PAL.amber; ctx.fillRect(0, H - 6, W * clamp(t / DURATION), 6);
}

// ---------- text
function _setFont(size, cond) { ctx.font = `${Math.round(size)}px ${DISPLAY}`; }
// inked box of a word drawn by word() at (cx, cy): w wide, up px above cy, down px below (tall stretches it upright)
function wordBox(str, size, cond = 1, tall = 1, track = 0) {
  const L = _layout(str, size, cond, track); _setFont(size); ctx.textBaseline = 'middle';
  const m = ctx.measureText(str);
  return { w: L.total, up: (m.actualBoundingBoxAscent - size * 0.04) * tall, down: (m.actualBoundingBoxDescent + size * 0.04) * tall };
}
function _layout(str, size, cond, track) {
  _setFont(size);
  const ws = [...str].map((c) => ctx.measureText(c).width * cond + track * size);
  return { ws, total: ws.reduce((a, b) => a + b, 0) - track * size };
}
// per-letter entrance. o: {col, t0, stagger, dur, anim:'rise'|'drop'|'pop'|'slam'|'spin'|'fade', cond, track, maxW, mask, drift, idle, out:[tOut,dur], rot, stroke,
//   tall (upright stretch, 1 = none), fx(i, n, t) → [dx, dy, rot, scale] extra per-letter motion (the hero poses of characters/cast.js)}
// returns {w, size, x0, y0, x1, y1}: the word's resting box in the current (world) coordinates
function word(str, cx, cy, size, t, o = {}) {
  const cond = o.cond ?? 1, track = o.track ?? 0, VERT = H > W;
  let maxW = o.maxW ?? (VERT ? 780 : W - 160);
  if (VERT && !o.free) {   // 9:16: keep text in the safe box x 90-940, y 250-1470 (o.free:true for ghost/outline decor)
    maxW = Math.min(maxW, 820); cy = clamp(cy, 250 + size * 0.5, 1470 - size * 0.5); 
  }
  size = Math.max(VERT ? 44 : MIN_TEXT, size);
  let L = _layout(str, size, cond, track);
  if (L.total > maxW) { size = Math.max(MIN_TEXT, size * maxW / L.total); L = _layout(str, size, cond, track); }
  if (L.total > W - 80) warnOnce('w' + str, `"${str}" is wider than the frame; shorten it or split it over two lines`);
  const t0 = o.t0 ?? 0, st = o.stagger ?? 0.05, dur = o.dur ?? 0.5, anim = o.anim ?? 'rise';
  const drift = (o.drift ?? 1) * Math.sin(t * 0.7 + cx * 0.01) * 14;
  if (VERT && !o.free) cx = clamp(cx, 90 + L.total / 2 + 14, 940 - L.total / 2 - 14);
  let x = cx - L.total / 2 + drift;
  const baseA = ctx.globalAlpha;
  const outK = o.out ? seg(t, o.out[0], o.out[0] + o.out[1]) : 0;
  ctx.save();
  if (o.mask) { ctx.beginPath(); ctx.rect(0, cy - size * 0.62, W, size * 1.3); ctx.clip(); }
  [...str].forEach((ch, i) => {
    const w = L.ws[i], u = (t - t0 - i * st) / dur;
    if (u > 0 && ch !== ' ' && outK < 1) {
      const k = clamp(u); let dy = 0, sc = 1, a = 1, rot = 0, dx = 0;
      if (anim === 'rise') dy = (1 - EZ.o5(k)) * size * 1.15;
      else if (anim === 'drop') { dy = -(1 - spring(u * 1.2, 6, 0.4)) * size * 1.4; a = clamp(k * 6); }
      else if (anim === 'pop') { sc = EZ.back(k) * 1; a = clamp(k * 5); }
      else if (anim === 'slam') { sc = 1 + (1 - EZ.o5(k)) * 2.4; a = clamp(k * 6); }
      else if (anim === 'spin') { rot = (1 - EZ.o5(k)) * 1.6 * (i % 2 ? 1 : -1); sc = EZ.o3(k); dy = (1 - EZ.o3(k)) * size * 0.4; }
      else if (anim === 'fade') a = k;
      const idle = o.idle ?? 1;
      dy += Math.sin(t * 2.2 + i * 0.8) * size * 0.012 * idle;
      sc *= 1 + Math.sin(t * 1.5 + i * 0.5) * 0.006 * idle;
      if (outK > 0) { dy -= EZ.i3(outK) * size * 0.8; a *= 1 - outK; }
      if (o.fx) { const f = o.fx(i, str.length, t); dx += f[0]; dy += f[1]; rot += f[2]; sc *= f[3]; }
      ctx.save();
      ctx.translate(x + w / 2 - (track * size) / 2 + dx, cy + dy); ctx.rotate(rot + (o.rot ?? 0)); ctx.scale(sc * cond, sc * (o.tall ?? 1));
      ctx.globalAlpha = a * baseA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; _setFont(size);
      if (o.stroke) { ctx.lineWidth = size * 0.04; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(ch, 0, size * 0.04); }
      if (o.outline) { ctx.lineWidth = o.outline; ctx.strokeStyle = o.col ?? PAL.cream; ctx.lineJoin = 'round'; ctx.strokeText(ch, 0, size * 0.04); }
      else {
        if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(ch, size * 0.04, size * 0.07); }
        ctx.fillStyle = o.col ?? PAL.cream; ctx.fillText(ch, 0, size * 0.04);
      }
      ctx.restore();
    }
    x += w;
  });
  ctx.restore();
  const B = wordBox(str, size, cond, o.tall ?? 1, track), x0 = cx - L.total / 2 + drift;
  return { w: L.total, size, x0, y0: cy - B.up, x1: x0 + L.total, y1: cy + B.down };
}
// outline echoes: rings of the same word that breathe outward behind it (call BEFORE the solid word, same args plus n)
function echo(str, cx, cy, size, t, o = {}, n = 2) {
  for (let k = n; k >= 1; k--) {
    const sc = 1 + k * 0.07 + Math.sin(t * 1.8 - k * 0.9) * 0.025;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    ctx.globalAlpha = (o.alpha ?? 0.5) / k;
    word(str, cx, cy, size, t, { ...o, outline: H > W ? 9 : 5, shadow: null, idle: 0 });   // 9:16: 9 px rings (5 px is a hair on a phone)
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
// lines: [{s, col, t0?, anim?}]; tight line pitch 0.86 × size is the poster-stack look
function stack(lines, cy, size, t, o = {}) {
  const pitch = size * (o.pitch ?? 0.86);
  lines.forEach((ln, i) => {
    const dir = i % 2 ? -1 : 1;
    word(ln.s, W / 2 + (o.offset ?? 0) * dir * (i - (lines.length - 1) / 2), cy + (i - (lines.length - 1) / 2) * pitch, size, t,
      { cond: 0.82, stagger: 0.03, dur: 0.45, mask: true, anim: 'rise', drift: dir, ...o, ...ln, col: ln.col, t0: ln.t0 ?? (o.t0 ?? 0) + i * (o.gap ?? 0.18) });
  });
}
// eyebrow / caption: Inter 800, tracked capitals, never below 30 px. Fades up; drifts slowly.
function small(str, cx, cy, t, o = {}) {
  const size = Math.max(H > W ? 48 : 30, o.size ?? 34), track = o.track ?? 0.22, t0 = o.t0 ?? 0;
  const k = EZ.o3(seg(t, t0, t0 + 0.5)); if (k <= 0) return;
  ctx.save(); ctx.font = `800 ${size}px ${UI}`; ctx.textBaseline = 'middle';
  const chars = [...str], ws = chars.map((c) => ctx.measureText(c).width + track * size);
  const total = ws.reduce((a, b) => a + b, 0) - track * size;
  if (total > W - 120) warnOnce('s' + str, `caption "${str}" is wider than the frame`);
  if (H > W && !o.free) { cx = clamp(cx, 90 + total / 2 + 8, 940 - total / 2 - 8); cy = clamp(cy, 275, 1445); }
  let x = cx - total / 2 + Math.sin(t * 0.8) * 6; const y = cy + (1 - k) * 24 + Math.sin(t * 1.9) * 3;
  ctx.globalAlpha = k; ctx.fillStyle = o.col ?? PAL.cream; ctx.textAlign = 'left';
  chars.forEach((c, i) => { ctx.fillText(c, x, y); x += ws[i]; });
  ctx.restore();
}

// ---------- transitions + furniture
// slanted double wipe: back band in col2, front band in col1. At tc the screen is fully covered: cut the shot there.
function wipeTo(tc, dur, col1 = PAL.violet, col2 = PAL.pink, up = false, slant = 360) {
  trans((t) => {
    const p = (t - (tc - dur / 2)) / dur; if (p <= 0 || p >= 1.15) return;
    const X = (k) => lerp(-slant - 200, (up ? H : W) + slant + 200, k);
    [[col2, 0.08], [col1, 0]].forEach(([col, lag]) => {
      const q = p - lag, b = EZ.io(seg(q, 0, 0.5)), a = EZ.io(seg(q, 0.5, 1));
      if (a >= 1 || b <= 0) return;
      const x1 = X(a), x2 = X(b);
      ctx.fillStyle = col; ctx.beginPath();
      if (up) {   // 9:16: the band rises from the bottom edge to the top (slanted edge)
        const Y = (v) => H - v;
        ctx.moveTo(0, Y(x1 + slant)); ctx.lineTo(0, Y(x2 + slant)); ctx.lineTo(W, Y(x2 - slant)); ctx.lineTo(W, Y(x1 - slant));
      } else { ctx.moveTo(x1 + slant, 0); ctx.lineTo(x2 + slant, 0); ctx.lineTo(x2 - slant, H); ctx.lineTo(x1 - slant, H); }
      ctx.closePath(); ctx.fill();
    });
  });
}
function brackets(t, t0, col = PAL.cream, w = 760, h = 300, cx = W / 2, cy = H / 2) {
  const k = EZ.o5(seg(t, t0, t0 + 0.7)); if (k <= 0) return;
  const s = 1 + (1 - k) * 0.5 + Math.sin(t * 1.4) * 0.012, len = 54;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = k; ctx.strokeStyle = col; ctx.lineWidth = H > W ? 9 : 5;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(sx * w / 2 - sx * len, sy * h / 2); ctx.lineTo(sx * w / 2, sy * h / 2); ctx.lineTo(sx * w / 2, sy * h / 2 - sy * len); ctx.stroke();
  });
  ctx.restore();
}
function shake(t, t0, amp = 14, decay = 7) {
  const u = t - t0; if (u < 0) return [0, 0];
  const e = Math.exp(-decay * u) * amp; return [Math.sin(u * 61) * e, Math.cos(u * 47) * e * 0.7];
}
// slow push-in camera for a shot (never a still frame): cam: pushCam(t0, t1, z0, z1, driftX, driftY)
function pushCam(t0, t1, z0 = 1, z1 = 1.07, dx = 0, dy = 0, extra = null) {
  return (t) => {
    const k = seg(t, t0, t1), e = extra ? extra(t) : [0, 0];
    return [W / 2 + (k - 0.5) * dx + e[0], H / 2 + (k - 0.5) * dy + e[1], lerp(z0, z1, k), 0];
  };
}

// ---------- 9:16 labels (engine/safe.js): one per picture. label() inside the shot queues it; the runtime draws the queue in screen space
// after the shot, so the hero is already tracked and labelY() puts the plate above its top (the label band y 270-500), never on it.
// o: {t0 (pop-in time), col (text, cream), plate (PAL.ink), accent (PAL.amber), size (76)}. 64 px is the floor; a long line wraps into two.
const LABELQ = [];
function label(str, o = {}) { LABELQ.push({ str, ...o }); }
function drawLabels(t) {
  const q = LABELQ.splice(0);
  if (typeof labelY === 'undefined' || (END && t >= END.t0)) return;   // 16:9 has no label band; the end card shows no label
  for (const l of q) {
    const max = 810 - 2 * 44, tr = 0.06;
    const fit = (s, px) => { ctx.font = `800 ${px}px ${UI}`; return [...s].reduce((a, c) => a + ctx.measureText(c).width, 0) + tr * px * (s.length - 1); };
    let px = l.size ?? 76, lines = [l.str];
    while (px > 64 && fit(l.str, px) > max) px -= 2;
    if (fit(l.str, px) > max) { const w = l.str.split(' '), h = Math.ceil(w.length / 2); lines = [w.slice(0, h).join(' '), w.slice(h).join(' ')]; px = l.size ?? 76; while (px > 64 && Math.max(...lines.map((s) => fit(s, px))) > max) px -= 2; }
    const tw = Math.max(...lines.map((s) => fit(s, px))), pw = tw + 88, lh = px * 1.12, ph = lines.length * lh + 44;
    const cx = 513, cy = labelY(ph), k = EZ.back(seg(t, l.t0 ?? 0, (l.t0 ?? 0) + 0.28)), sc = 0.86 + 0.14 * k + Math.sin(t * 2.4) * 0.006;
    LAYOUT.push({ kind: 'label', name: l.str, x0: cx - pw / 2, y0: cy - ph / 2, x1: cx + pw / 2, y1: cy + ph / 2 });
    if (k <= 0) continue;
    ctx.save(); ctx.translate(cx, cy + Math.sin(t * 1.9) * 3); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 3);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.roundRect(-pw / 2 + 8, -ph / 2 + 10, pw, ph, 22); ctx.fill();   // hard shadow
    ctx.fillStyle = l.plate ?? PAL.ink; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 22); ctx.fill();
    const aw = (pw - 88) * (0.35 + 0.1 * Math.sin(t * 2.2));   // amber accent bar breathing along the bottom edge
    ctx.fillStyle = l.accent ?? PAL.amber; ctx.fillRect(-aw / 2, ph / 2 - 12, aw, 8);
    ctx.fillStyle = l.col ?? PAL.cream; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = `800 ${px}px ${UI}`;
    lines.forEach((s, j) => { let x = -fit(s, px) / 2; const y = -ph / 2 + 22 + lh * (j + 0.5) + px * 0.04;
      for (const c of s) { ctx.fillText(c, x, y); x += ctx.measureText(c).width + tr * px; } });
    ctx.restore();
  }
}
