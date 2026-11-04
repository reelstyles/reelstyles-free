// =====================================================================
//  sets/stage.js: the quiz stage. Bands, background, HUD, ring timer, a full round and the band title card.
//    BANDS[id]            { label, g:[top,bottom], dark, accent, stars }
//    quizRound(L, cfg)    cfg = { band, item, n (round number), score (rounds already won), total, prompt }
//    titleCard(L, d, cfg) cfg = { band, sub }
//  Round timeline (seconds, L = local time): item springs in 0-0.6 · ring drains 0.6-3.6 (3 ticks) · zero at 3.6:
//  flash, colour wipe, name spring, confetti, score tick · hold with idle motion until the end (5.1 s).
// =====================================================================
const BANDS = {
  easy:       { label: 'EASY',       g: ['#46E39B', '#17A6D6'], dark: '#0F5C8A', accent: '#FFE14D', stars: 1 },
  medium:     { label: 'MEDIUM',     g: ['#5C9BFF', '#9457FF'], dark: '#2D1B7A', accent: '#FFE14D', stars: 2 },
  hard:       { label: 'HARD',       g: ['#FFA63D', '#FF3D86'], dark: '#7A1A4A', accent: '#FFF0A0', stars: 3 },
  impossible: { label: 'IMPOSSIBLE', g: ['#C0143F', '#2A0A55'], dark: '#12041F', accent: '#FFD84A', stars: 4 },
};
const T_IN = 0.6, T_RING = 3.0, T_ZERO = T_IN + T_RING, ROUND_LEN = 5.1;

// layout (1080p basis)
const LAY = VERT
  ? { item: [540, 690], ring: [540, 1420], rr: 175, ans: [540, 1085], bar: [540, 1700, 760], pill: [70, 215], tag: [W - 70, 215], itemS: 1.5 }
  : { item: [700, 480], ring: [1480, 470], rr: 155, ans: [700, 880], bar: [1480, 770, 520], pill: [70, 70], tag: [W - 70, 70], itemS: 1.45 };

function stageBg(t, band) {
  const a = t * 0.12, x = Math.cos(a) * W, y = Math.sin(a) * H;
  const g = ctx.createLinearGradient(W / 2 - x, H / 2 - y, W / 2 + x, H / 2 + y);
  g.addColorStop(0, band.g[0]); g.addColorStop(1, band.g[1]);
  ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, H + 200);
  // drifting diagonal stripes
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.translate(W / 2, H / 2); ctx.rotate(-0.5);
  const sp = 220, off = (t * 40) % (sp * 2), R = Math.hypot(W, H);
  for (let x0 = -R; x0 < R; x0 += sp * 2) ctx.fillRect(x0 + off, -R, sp, R * 2);
  ctx.restore();
  // bokeh bubbles floating up
  const r = rng(11);
  for (let i = 0; i < 16; i++) {
    const sz = 30 + r() * 90, v = 14 + r() * 30, px = r() * (W + 200) - 100, py0 = r() * (H + 300), ph = r() * TAU;
    const py = H + 150 - ((py0 + t * v) % (H + 300)), px2 = px + Math.sin(t * 0.6 + ph) * 26;
    ctx.fillStyle = `rgba(255,255,255,${0.07 + 0.05 * Math.sin(t + ph)})`; ctx.beginPath(); ctx.arc(px2, py, sz, 0, TAU); ctx.fill();
  }
  // spotlight behind the item
  const [ix, iy] = LAY.item, br = 1 + 0.04 * Math.sin(t * 2.1);
  const rg = ctx.createRadialGradient(ix, iy, 20, ix, iy, 420 * br);
  rg.addColorStop(0, 'rgba(255,255,255,0.42)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
}
function vignette(t, danger) {
  const rg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.hypot(W, H) * 0.62);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(${danger > 0 ? '120,0,20' : '10,0,40'},${0.32 + 0.3 * danger * (0.6 + 0.4 * Math.sin(t * 9))})`);
  ctx.fillStyle = rg; ctx.fillRect(-100, -100, W + 200, H + 200);
}

function star(x, y, r, rot, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.48 : r, a = rot - Math.PI / 2 + (i * Math.PI) / 5; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.strokeStyle = fill; ctx.lineWidth = r * 0.28; ctx.lineJoin = 'round'; ctx.fill(); ctx.stroke();
}

function hud(L, cfg, band, scoreNow, fillT) {
  const t = TT;
  // round pill, top-left, bobbing
  const [px, py] = LAY.pill, bob = Math.sin(t * 2.4) * 4;
  ctx.save(); ctx.translate(px, py + bob);
  ctx.shadowColor = 'rgba(20,10,60,.3)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.beginPath(); ctx.roundRect(0, 0, 330, 96, 48); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = band.dark; ctx.beginPath(); ctx.arc(48, 48, 36, 0, TAU); ctx.fill();
  ctx.restore();
  text(String(cfg.n), px + 48, py + 48 + bob, { size: 48, shadow: false });
  ctx.save(); ctx.translate(0, bob);
  text('ROUND', px + 215, py + 48, { size: 40, color: band.dark, shadow: false, maxW: 170 });
  ctx.restore();
  // level tag, top-right
  const [tx, ty] = LAY.tag, tw = 40 + band.label.length * 28 + 30, tb = Math.sin(t * 2.4 + 1.7) * 4;
  ctx.save(); ctx.translate(tx - tw, ty + tb);
  ctx.fillStyle = band.dark; ctx.beginPath(); ctx.roundRect(0, 0, tw, 96, 48); ctx.fill();
  ctx.restore();
  text(band.label, tx - tw / 2, ty + 48 + tb, { size: 42, color: band.accent, maxW: tw - 60, shadow: false, track: 0.05 });
  // score bar: 4 pills, new one fills with a spring
  const [bx, by, bw] = LAY.bar, n = cfg.total, gap = 16, pw = (bw - gap * (n - 1)) / n;
  text(`SCORE ${scoreNow} / ${n}`, bx, by - 66, { size: 40 });
  for (let i = 0; i < n; i++) {
    const x = bx - bw / 2 + i * (pw + gap);
    ctx.fillStyle = 'rgba(20,10,60,0.35)'; ctx.beginPath(); ctx.roundRect(x, by - 24, pw, 48, 24); ctx.fill();
    let f = i < cfg.score ? 1 : i === cfg.score ? spring(fillT, 9, 0.5) : 0;
    if (f > 0) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, by - 24, pw, 48, 24); ctx.clip();
      ctx.fillStyle = band.accent; ctx.fillRect(x, by - 24, pw * Math.min(f, 1.0), 48);
      const sx = ((t * 160) % (pw + 120)) - 60;                 // idle shine sweep
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.save(); ctx.translate(x + sx, by); ctx.rotate(0.5); ctx.fillRect(-9, -50, 18, 100); ctx.restore();
      ctx.restore();
      if (i === cfg.score && f > 1) { ctx.fillStyle = band.accent; const k = 1 + (f - 1) * 0.5; ctx.beginPath(); ctx.roundRect(x - pw * (k - 1) / 2, by - 24 * k, pw * k, 48 * k, 24); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; }
    }
  }
}

function ring(L, band, wonT) {
  const [rx, ry] = LAY.ring, R = LAY.rr, t = TT;
  const e = L - T_IN, left = clamp(e / T_RING), sec = Math.min(2, Math.floor(Math.max(0, e)));
  const since = e - sec, pulse = e >= 0 && e < T_RING ? Math.exp(-11 * since) : 0;   // a tick each second
  const appear = spring(L - 0.15, 9, 0.4), danger = e >= 2 && e < 3 ? 1 : 0;
  const out = wonT >= 0 ? 1 - EZ.i3(seg(wonT, 0.5, 1.0)) : 1;
  const sc = appear * (1 + 0.1 * pulse) * (wonT >= 0 ? 1 + 0.25 * Math.sin(Math.min(1, wonT * 2.2) * Math.PI) : 1) * (0.2 + 0.8 * out);
  if (sc <= 0.01 || out <= 0) return;
  ctx.save(); ctx.translate(rx + (danger ? Math.sin(t * 60) * 3 : 0), ry); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(20,10,60,.3)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  ctx.fillStyle = 'rgba(20,10,60,0.42)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 30; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(0, 0, R - 15, 0, TAU); ctx.stroke();
  const rem = wonT >= 0 ? 0 : 1 - left;
  if (rem > 0.002) {
    ctx.strokeStyle = danger ? '#FF5A6E' : band.accent; ctx.lineWidth = 30;
    ctx.beginPath(); ctx.arc(0, 0, R - 15, -Math.PI / 2, -Math.PI / 2 + TAU * rem); ctx.stroke();
    const a = -Math.PI / 2 + TAU * rem;                              // bright head of the arc
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(Math.cos(a) * (R - 15), Math.sin(a) * (R - 15), 9, 0, TAU); ctx.fill();
  }
  const num = wonT >= 0 ? null : String(3 - sec);
  if (num) text(num, 0, 6, { size: R * 1.05, scale: 1 + 0.22 * pulse, maxW: R * 1.2, color: danger ? '#FFD0D6' : '#fff' });
  else { ctx.strokeStyle = band.accent; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-50, 4); ctx.lineTo(-14, 42); ctx.lineTo(54, -36); ctx.stroke(); }
  ctx.restore();
}

function confetti(dt, band) {
  if (dt < 0 || dt > 1.7) return;
  const r = rng(5), cols = [band.accent, '#FFFFFF', '#FF5FA2', '#5CE1FF', '#8DFF7A'], [ix, iy] = LAY.item;
  for (let i = 0; i < 36; i++) {
    const a = r() * TAU, v = 260 + r() * 520, sz = 12 + r() * 16, col = cols[i % 5], sp = 4 + r() * 8;
    const x = ix + Math.cos(a) * v * Math.min(dt, 0.9) * 0.9, y = iy + Math.sin(a) * v * dt * 0.8 + 900 * dt * dt * 0.5 - 120 * dt;
    ctx.save(); ctx.globalAlpha = clamp(1.7 - dt) ; ctx.translate(x, y); ctx.rotate(sp * dt); ctx.scale(Math.cos(sp * dt * 1.7), 1);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-sz / 2, -sz / 4, sz, sz / 2, 4); ctx.fill(); ctx.restore();
  }
}

function quizRound(L, cfg) {
  const band = BANDS[cfg.band], it = ITEMS[cfg.item], t = TT;
  const wonT = L - T_ZERO;                                          // < 0 before zero
  stageBg(t, band);
  vignette(t, L > T_ZERO - 1 && L < T_ZERO ? 1 : 0);
  // item: spring in, then breathe / sway
  const [ix, iy] = LAY.item, sIn = spring(L - 0.05, 8, 0.4);
  const breathe = 1 + 0.025 * Math.sin(t * 2.6) + (wonT > 0 ? 0.1 * Math.exp(-6 * wonT) * Math.cos(18 * wonT) : 0);
  ctx.save(); ctx.translate(ix, iy + Math.sin(t * 1.9) * 9 + (1 - Math.min(1, sIn)) * -140);
  ctx.rotate(Math.sin(t * 1.3) * 0.035); ctx.scale(LAY.itemS * sIn * breathe, LAY.itemS * sIn * breathe);
  ctx.shadowColor = 'rgba(20,10,60,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  drawItem(it, t, true, band.dark);
  ctx.shadowColor = 'transparent';
  if (wonT > 0) {
    const rad = 380 * EZ.o3(wonT / 0.55);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.clip(); drawItem(it, t, false); ctx.restore();
    if (wonT < 0.6) { ctx.strokeStyle = '#fff'; ctx.globalAlpha = 1 - wonT / 0.6; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  ring(L, band, wonT);
  // prompt (before zero) / answer (after)
  const [ax, ay] = LAY.ans;
  if (wonT < 0) text(cfg.prompt, ax, ay, { size: 64, a: spring(L - 0.3, 9, 0.6) > 0.1 ? EZ.o2(seg(L, 0.35, 0.8)) * (1 - seg(L, T_ZERO - 0.15, T_ZERO)) : 0, scale: 0.98 + 0.02 * Math.sin(t * 5), maxW: VERT ? 960 : 1100 });
  else {
    const p = spring(wonT - 0.12, 9, 0.38);
    text(it.name, ax, ay, { size: 150, color: '#fff', a: clamp(p * 3), scale: Math.max(0.01, p) * (1 + 0.012 * Math.sin(t * 3)), rot: -0.04 * (1 - clamp(p)) + 0.012 * Math.sin(t * 2.2), maxW: VERT ? 960 : 1180 });
  }
  confetti(wonT - 0.1, band);
  if (wonT > 0 && wonT < 0.3) { ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - wonT / 0.3)})`; ctx.fillRect(-50, -50, W + 100, H + 100); }
  const gain = wonT > 0.4;
  hud(L, cfg, band, cfg.score + (gain ? 1 : 0), wonT - 0.4);
}

// full-screen band title card
function titleCard(L, d, cfg) {
  const band = BANDS[cfg.band], t = TT;
  stageBg(t * 1.6, band);
  // expanding rings from the centre
  for (let i = 0; i < 3; i++) {
    const k = ((L * 0.9 + i / 3) % 1); ctx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - k)})`; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 120 + k * Math.hypot(W, H) * 0.5, 0, TAU); ctx.stroke();
  }
  vignette(t, 0);
  const p = spring(L - 0.05, 8, 0.36), grow = 1 + 0.07 * (L / d);
  text(`LEVEL ${cfg.level}`, W / 2, H / 2 - (VERT ? 260 : 220), { size: 64, a: EZ.o2(seg(L, 0.15, 0.4)), color: band.accent });
  text(band.label, W / 2, H / 2 - 10, { size: VERT ? 190 : 270, scale: Math.max(0.01, p) * grow, rot: -0.05 + 0.02 * Math.sin(t * 3), maxW: W - 130 });
  for (let i = 0; i < 4; i++) {
    const sp = spring(L - 0.35 - i * 0.12, 9, 0.4), on = i < band.stars, x = W / 2 + (i - 1.5) * 130, y = H / 2 + (VERT ? 250 : 220);
    star(x, y, 52 * Math.max(0.01, sp) * (1 + 0.06 * Math.sin(t * 5 + i)), Math.sin(t * 2 + i) * 0.12, on ? band.accent : 'rgba(20,10,60,0.35)');
  }
  text(cfg.sub, W / 2, H / 2 + (VERT ? 400 : 345), { size: 48, a: EZ.o2(seg(L, 0.5, 0.8)), maxW: W - 200 });
}
