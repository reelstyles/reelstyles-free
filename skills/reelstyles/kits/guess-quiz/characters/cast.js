// =====================================================================
//  characters/cast.js: the guess-quiz hero. The style has no people: the hero is the round's ITEM (sets/items.js), drawn big.
//  Classic script; needs engine/runtime.js, engine/safe.js (9:16) and sets/items.js first. Used by quizRound() in 9:16.
//    itemBox(it)            local box {x0, y0, x1, y1} of an item, measured from its ops (flags: cloth + pole + wave)
//    Hero(it, t, o)         draws the item centred on (o.cx, o.cy), fitted to o.h px tall (default 760, 40% of the frame) and at most
//                           o.w px wide (860), times o.z (camera push), then calls track('hero', ...) inside its transform.
//      o.pose   'idle' (breathes, sways) | 'walk' (hops side to side) | 'reach' (leans in, swells) | 'cheer' (jumps, squashes)
//               | 'slump' (droops and tilts)
//      o.mood   'calm' | 'tense' (shivers, the countdown's last second) | 'happy' (bouncier, after the reveal)
//      o.in     entrance 0..1+ (a spring: drops in from above, overshoots); o.sil silhouette colour; o.wipe 0..1 colour reveal
//               (circle from the item centre, white rim while it grows)
//    returns the screen box of the item.
//  9:16 framing (owner 11-02, wide, never a crop): the item is 30-50% of the frame height, centre (540, 980), inside x 90-990.
// =====================================================================
const _BOX = new Map();
function itemBox(it) {
  if (_BOX.has(it)) return _BOX.get(it);
  const b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }, add = (x, y, p = 0) => { b.x0 = Math.min(b.x0, x - p); b.x1 = Math.max(b.x1, x + p); b.y0 = Math.min(b.y0, y - p); b.y1 = Math.max(b.y1, y + p); };
  if (it.kind === 'flag') { add(-184, -131); add(172, 251); }   // pole (-14..4, -14..fh+136) + cloth 340 x 230 + wave ±16, around (-170, -115)
  else for (const s of it.shapes) for (const o of s.ops) {
    if (o[0] === 'e') { const r = Math.max(o[3], o[4]); add(o[1], o[2], r); }
    else if (o[0] === 'r') { add(o[1], o[2]); add(o[1] + o[3], o[2] + o[4]); }
    else { const p = o[1], pad = o[0] === 'p' ? 8 : o[2] / 2; for (let i = 0; i < p.length; i += 2) add(p[i], p[i + 1], pad); }
  }
  _BOX.set(it, b);
  return b;
}

// pose → [dx, dy, rot, sx, sy] for the clock t (s) and speed sp
const HPOSE = {
  idle: (t, sp) => [0, Math.sin(t * 1.9 * sp) * 9, Math.sin(t * 1.3 * sp) * 0.035, 1, 1],
  walk: (t, sp) => { const p = t * 6 * sp; return [Math.sin(p / 2) * 26, -Math.abs(Math.sin(p)) * 34, Math.sin(p / 2) * 0.07, 1, 1]; },
  reach: (t, sp) => { const k = 0.5 + 0.5 * Math.sin(t * 3 * sp); return [0, -k * 12, 0.05 * Math.sin(t * 1.5), 1 + 0.06 * k, 1 + 0.06 * k]; },
  cheer: (t, sp) => { const j = Math.abs(Math.sin(t * 6.5 * sp)), q = 1 - j; return [0, -j * 46, Math.sin(t * 6.5 * sp) * 0.06, 1 + 0.06 * q, 1 - 0.05 * q]; },
  slump: (t, sp) => [0, 22 + Math.sin(t * 1.2) * 6, 0.11 + Math.sin(t * 1.1) * 0.02, 1.03, 0.94],
};
const HMOOD = { calm: { sp: 1, shiver: 0 }, tense: { sp: 1.5, shiver: 5 }, happy: { sp: 1.25, shiver: 0 } };

function Hero(it, t, o = {}) {
  const b = itemBox(it), bw = b.x1 - b.x0, bh = b.y1 - b.y0, mx = (b.x0 + b.x1) / 2, my = (b.y0 + b.y1) / 2;
  const z = o.z ?? 1, s = Math.min(((o.h ?? 760) * z) / bh, Math.min((o.w ?? 860) * z, 900) / bw);   // a push-in never takes a wide item past 900 px
  const M = HMOOD[o.mood] || HMOOD.calm, P = (HPOSE[o.pose] || HPOSE.idle)(t, M.sp), k = o.in ?? 1;
  const breathe = 1 + 0.025 * Math.sin(t * 2.6) + (o.pop ?? 0), sh = M.shiver ? Math.sin(t * 61) * M.shiver : 0;
  ctx.save();
  ctx.translate((o.cx ?? 540) + P[0] + sh, (o.cy ?? 980) + P[1] + (1 - Math.min(1, k)) * -160);
  ctx.translate(0, (bh * s) / 2); ctx.rotate(P[2]); ctx.scale(P[3], P[4]); ctx.translate(0, (-bh * s) / 2);   // pose pivots on the bottom
  const S = s * Math.max(0.01, k) * breathe;
  ctx.scale(S, S); ctx.translate(-mx, -my);
  ctx.shadowColor = 'rgba(20,10,60,0.38)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 24;   // shadows are in screen px
  drawItem(it, t, true, o.sil ?? '#1F1B3A');
  ctx.shadowColor = 'transparent';
  const w = o.wipe ?? 0;
  if (w > 0) {
    const rad = (Math.hypot(bw, bh) / 2 + 30) * EZ.o3(w);
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, rad, 0, TAU); ctx.clip(); drawItem(it, t, false); ctx.restore();
    if (w < 1) { ctx.strokeStyle = '#fff'; ctx.globalAlpha = 1 - w; ctx.lineWidth = 16 / S; ctx.beginPath(); ctx.arc(mx, my, rad, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  const m = ctx.getTransform(), box = { x0: m.a * b.x0 + m.e, y0: m.d * b.y0 + m.f, x1: m.a * b.x1 + m.e, y1: m.d * b.y1 + m.f };
  if (typeof track === 'function') track('hero', b.x0, b.y0, b.x1, b.y1, it.name);
  ctx.restore();
  return box;
}
