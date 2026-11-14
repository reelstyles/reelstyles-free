// =====================================================================
//  sets/stage.js: the quiz stage. Bands, background, HUD, ring timer, a full round and the band title card.
//    BANDS[id]            { label, g:[top,bottom], dark, accent, stars }
//    quizRound(L, cfg)    cfg = { band, item, n (round number), score (rounds already won), total, prompt }
//    titleCard(L, d, cfg) cfg = { band, sub }
//  9:16 (phone Shorts) runs quizRoundV / titleCardV below: the item is the hero (characters/cast.js), one set per countdown second.
//  Round timeline (seconds, L = local time): item springs in 0-0.6 · ring drains 0.6-3.6 (3 ticks) · zero at 3.6:
//  flash, colour wipe, name spring, confetti, score tick · hold with idle motion until the end (5.1 s).
// =====================================================================
const BANDS = {
  easy:       { label: 'EASY',       g: ['#46E39B', '#17A6D6'], dark: '#0F5C8A', accent: '#FFE14D', stars: 1 },
  medium:     { label: 'MEDIUM',     g: ['#5C9BFF', '#9457FF'], dark: '#2D1B7A', accent: '#FFE14D', stars: 2 },
  hard:       { label: 'HARD',       g: ['#FFA63D', '#FF3D86'], dark: '#7A1A4A', accent: '#FFF0A0', stars: 3 },
  impossible: { label: 'IMPOSSIBLE', g: ['#C0143F', '#2A0A55'], dark: '#12041F', accent: '#FFD84A', stars: 4 },
};
// 9:16 rounds are tighter (a new picture every <= 1.3 s, see quizRoundV): 0.3 s in, 3 s ring, 1.3 s payoff = 4.6 s
const T_IN = VERT ? 0.3 : 0.6, T_RING = 3.0, T_ZERO = T_IN + T_RING, ROUND_LEN = VERT ? 4.6 : 5.1;

// layout (1080p basis)
const LAY = VERT
  ? { item: [540, 690], ring: [540, 1420], rr: 175, ans: [540, 1085], bar: [540, 1700, 760], pill: [70, 215], tag: [W - 70, 215], itemS: 1.5 }
  : { item: [700, 480], ring: [1480, 380], rr: 150, ans: [700, 880], bar: [1480, 960, 520], pill: [70, 70], tag: [W - 70, 70], itemS: 1.45 };

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
  ctx.shadowColor = 'transparent'; ctx.fillStyle = band.dark; ctx.beginPath(); ctx.arc(282, 48, 36, 0, TAU); ctx.fill();
  ctx.restore();
  text(String(cfg.n), px + 282, py + 48 + bob, { size: 48, shadow: false });
  text('ROUND', px + 132, py + 48 + bob, { size: 44, color: band.dark, shadow: false, maxW: 200 });
  // level tag, top-right
  const [tx, ty] = LAY.tag, tw = 40 + band.label.length * 28 + 30, tb = Math.sin(t * 2.4 + 1.7) * 4;
  ctx.save(); ctx.translate(tx - tw, ty + tb);
  ctx.fillStyle = band.dark; ctx.beginPath(); ctx.roundRect(0, 0, tw, 96, 48); ctx.fill();
  ctx.restore();
  text(band.label, tx - tw / 2, ty + 48 + tb, { size: 42, color: band.accent, maxW: tw - 60, shadow: false, ls: 0.05 });
  // score bar: 4 pills, new one fills with a spring
  const [bx, by, bw] = LAY.bar, n = cfg.total, gap = 16, pw = (bw - gap * (n - 1)) / n;
  text(`SCORE ${scoreNow} / ${n}`, bx, by - 66, { size: 40 });
  for (let i = 0; i < n; i++) {
    const x = bx - bw / 2 + i * (pw + gap);
    ctx.fillStyle = 'rgba(20,10,60,0.55)'; ctx.beginPath(); ctx.roundRect(x, by - 24, pw, 48, 24); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4; ctx.stroke();
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

function ring(L, band, wonT, app) {
  const [rx, ry] = LAY.ring, R = LAY.rr, t = TT;
  const e = L - T_IN, left = clamp(e / T_RING), sec = Math.min(2, Math.floor(Math.max(0, e)));
  const since = e - sec, pulse = e >= 0 && e < T_RING ? Math.exp(-11 * since) : 0;   // a tick each second
  const appear = app ?? spring(L - 0.15, 9, 0.4), danger = e >= 2 && e < 3 ? 1 : 0;
  const out = wonT >= 0 ? 1 - EZ.i3(seg(wonT, 0, app != null ? 0.12 : 1.0)) * (app != null ? 1 : 0) - (app != null ? 0 : EZ.i3(seg(wonT, 0.5, 1.0))) : 1;   // set rounds: gone before the answer plate lands
  const sc = appear * (1 + 0.1 * pulse + 0.12 * danger) * (wonT >= 0 ? 1 + 0.25 * Math.sin(Math.min(1, wonT * 2.2) * Math.PI) : 1) * (0.2 + 0.8 * out);
  if (sc <= 0.01 || out <= 0) return;
  const shx = danger ? Math.sin(t * 60) * 3 : 0;
  ctx.save(); ctx.translate(rx + shx, ry); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(20,10,60,.3)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  ctx.fillStyle = 'rgba(20,10,60,0.42)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 30; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(0, 0, R - 15, 0, TAU); ctx.stroke();
  const rem = wonT >= 0 ? 0 : 1 - left;
  if (rem > 0.002) {
    ctx.strokeStyle = danger ? '#FF5A6E' : band.accent; ctx.lineWidth = 30;
    ctx.beginPath(); ctx.arc(0, 0, R - 15, -Math.PI / 2, -Math.PI / 2 + TAU * rem); ctx.stroke();
    const a = -Math.PI / 2 + TAU * rem;                              // bright head of the arc
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(Math.cos(a) * (R - 15), Math.sin(a) * (R - 15), 9, 0, TAU); ctx.fill();
  }
  const num = wonT >= 0 ? null : String(3 - sec);
  if (!num) { ctx.strokeStyle = band.accent; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-50, 4); ctx.lineTo(-14, 42); ctx.lineTo(54, -36); ctx.stroke(); }
  ctx.restore();
  if (num) text(num, rx + shx, ry + 6 * sc, { size: R * 1.05, scale: sc * (1 + 0.22 * pulse), maxW: R * 1.2, color: danger ? '#FFD0D6' : '#fff' });
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

// 16:9 round = a filmed scene: a full set (sets/scenes.js), a grade that turns (mood → tense in the last second → win), a camera
// that cuts between shots (shotCam), the hero (characters/cast.js) lit by the set's light with a rim. HUD, ring and type are screen space.
//   cfg = { band, item, prompt, n, score, total, set:'studio'|'outdoor'|'room', mood:'show'|'night'|'warm', tin (s before the ring),
//           len (round length), shots (optional, see defaultShots), pose, encore (local time of a second confetti burst) }
const HERO_H = 450;                                                // hero height in the world: 42% of 1080 on the wide shot
function defaultShots(set, tin, len) {
  const [sx, sy] = (SETS[set] || SETS.studio).spot, z = tin + T_RING, cy = sy - HERO_H / 2;
  return [
    { at: 0, z0: 1.0, z1: 1.07, x0: 980, x1: 940, y0: 540, y1: 530 },                       // wide: the whole set, slow push
    { at: tin + 1, z0: 1.16, z1: 1.2, x0: sx + 280, x1: sx + 250, y0: cy + 50, y1: cy + 30 },  // medium-wide, from the right
    { at: tin + 2, z0: 1.26, z1: 1.3, x0: sx + 200, x1: sx + 210, y0: cy + 20, y1: cy + 10 },  // closer beat: the last second
    { at: z, z0: 1.02, z1: 1.08, x0: 960, x1: 950, y0: 520, y1: 540 },                       // reveal: pull back wide
    { at: z + 1.5, z0: 1.12, z1: 1.16, x0: sx + 330, x1: sx + 290, y0: cy, y1: cy + 40 },      // payoff: medium-wide, crane down
  ].filter((s) => s.at < len);
}
function roundGrade(cfg, e, wonT) {
  const base = GRADES[cfg.mood] || GRADES.show;
  return wonT >= 0 ? gradeMix(gradeMix(base, 'tense', 1), 'win', EZ.o2(wonT / 0.5)) : gradeMix(base, 'tense', EZ.io(seg(e, 1.9, 2.3)));
}
function quizRound(L, cfg) {
  if (VERT) return quizRoundV(L, cfg);
  const band = BANDS[cfg.band], it = ITEMS[cfg.item], t = TT, tin = cfg.tin ?? T_IN, len = cfg.len ?? ROUND_LEN;
  const e = L - tin, wonT = L - (tin + T_RING), g = roundGrade(cfg, e, wonT), set = cfg.set || 'studio';
  CAM = shotCam(L, cfg.shots || defaultShots(set, tin, len), len);
  const danger = e >= 2 && wonT < 0;
  const S = drawSet(set, t, g, band, ([sx, sy]) => {
    Hero(it, t, { cx: sx, foot: sy - 2, h: HERO_H, w: 540, in: EZ.back(seg(L, -0.4, 0.3)), sil: band.dark, rim: g.rim,
      pose: wonT >= 0 ? 'cheer' : danger ? 'reach' : cfg.pose || 'idle', mood: danger ? 'tense' : wonT >= 0 ? 'happy' : 'calm',
      wipe: wonT > 0 ? clamp(wonT / 0.55) : 0, pop: wonT > 0 ? 0.1 * Math.exp(-6 * wonT) * Math.cos(18 * wonT) : 0 });
  });
  const [hx, hy] = toScreen(S.spot[0], S.spot[1] - HERO_H / 2);
  confettiAt(wonT - 0.1, band, hx, hy);
  if (cfg.encore != null) { confettiAt(L - cfg.encore, band, hx, hy - 60); if (L > cfg.encore && L < cfg.encore + 0.25) { ctx.fillStyle = `rgba(255,240,200,${0.35 * (1 - (L - cfg.encore) / 0.25)})`; ctx.fillRect(0, 0, W, H); } }   // a second burst on the last shot
  finish(g, t);
  ring(L - (tin - T_IN), band, wonT, EZ.back(seg(L, -0.35, 0.15)));
  // prompt plate under the ring before zero; after zero the answer plate takes the ring's place
  const [rx, ry] = LAY.ring;
  if (wonT < 0) {
    const a = EZ.o2(seg(L, -0.3, 0.15)) * (1 - seg(L, tin + T_RING - 0.15, tin + T_RING)), sc = 0.98 + 0.02 * Math.sin(t * 5);
    ctx.save(); ctx.globalAlpha = a; plate(rx, ry + 300, 560 * sc, 112, 'rgba(20,10,60,0.72)'); ctx.restore();
    text(cfg.prompt, rx, ry + 300, { size: 64, a, scale: sc, maxW: 500, shadow: false });
  } else {
    const p = EZ.back(seg(wonT, 0.1, 0.42)), sc = Math.max(0.01, p) * (1 + 0.012 * Math.sin(t * 3));
    ctx.save(); ctx.translate(rx, ry + 60); ctx.rotate(-0.04 * (1 - clamp(p)) + 0.012 * Math.sin(t * 2.2)); ctx.scale(sc, sc);
    ctx.shadowColor = band.accent; ctx.shadowBlur = 50; plate(0, 0, 600, 190, band.accent); ctx.restore();
    text(it.name + '!', rx, ry + 60, { size: 140, color: band.dark, scale: sc, maxW: 520, shadow: false });
  }
  if (wonT > 0 && wonT < 0.3) { ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - wonT / 0.3)})`; ctx.fillRect(0, 0, W, H); }
  hud(L, cfg, band, cfg.score + (wonT > 0.4 ? 1 : 0), wonT - 0.4);
}
function confettiAt(dt, band, ox, oy) {
  if (dt < 0 || dt > 2.4) return;
  const r = rng(5), cols = [band.accent, '#FFFFFF', '#FF5FA2', '#5CE1FF', '#8DFF7A'];
  for (let i = 0; i < 48; i++) {
    const a = r() * TAU, v = 300 + r() * 560, sz = 14 + r() * 18, col = cols[i % 5], sp = 4 + r() * 8, d = Math.min(dt, 1.1);
    const x = ox + Math.cos(a) * v * d * 0.9 + Math.sin(dt * 3 + i) * 20, y = oy + Math.sin(a) * v * d * 0.7 + 420 * dt * dt * 0.5 - 100 * dt;
    ctx.save(); ctx.globalAlpha = clamp(2.4 - dt); ctx.translate(x, y); ctx.rotate(sp * dt); ctx.scale(Math.cos(sp * dt * 1.7), 1);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-sz / 2, -sz / 4, sz, sz / 2, 4); ctx.fill(); ctx.restore();
  }
}

// full-screen band title card: the empty studio, camera pushing in, the band word on the LED arch
function titleCard(L, d, cfg) {
  if (VERT) return titleCardV(L, d, cfg);
  const band = BANDS[cfg.band], t = TT, g = gradeMix(cfg.mood || 'show', 'win', 0.4 + 0.4 * Math.sin(L * 4) ** 2);
  CAM = { z: 1.05 + 0.08 * EZ.io(L / d), x: 760 - 40 * (L / d), y: 470 };
  drawSet(cfg.set || 'studio', t, g, band, () => {});
  finish(g, t);
  const p = EZ.back(seg(L, 0, 0.35)), grow = 1 + 0.07 * (L / d);
  text(`LEVEL ${cfg.level}`, W / 2, H / 2 - 220, { size: 64, a: EZ.o2(seg(L, 0.1, 0.35)), color: band.accent });
  text(band.label, W / 2, H / 2 - 10, { size: 250, scale: Math.max(0.01, p) * grow, rot: -0.05 + 0.02 * Math.sin(t * 3), maxW: W - 200 });
  for (let i = 0; i < 4; i++) {
    const sp = EZ.back(seg(L, 0.2 + i * 0.1, 0.45 + i * 0.1)), on = i < band.stars, x = W / 2 + (i - 1.5) * 130, y = H / 2 + 220;
    star(x, y, 52 * Math.max(0.01, sp) * (1 + 0.06 * Math.sin(t * 5 + i)), Math.sin(t * 2 + i) * 0.12, on ? band.accent : 'rgba(20,10,60,0.55)');
  }
  text(cfg.sub, W / 2, H / 2 + 345, { size: 48, a: EZ.o2(seg(L, 0.4, 0.7)), maxW: W - 200 });
}

// =====================================================================
//  9:16 (1080 x 1920): the phone layout. Owner 11-02: wide, never a crop; labels >= 64 px; a new picture every <= 2 s.
//    label band y 270-500: round pill (y 310) + prompt / answer plate (y 440)   ·   item (the hero) centre (540, 1000), 740 px tall
//    ring = a halo around the item (r 440), countdown badge under it (y 1520), score pips (y 1700)
//  One SET per countdown second, so the 1-s contact sheet never shows the same picture three times:
//    'calm' (L < 1.3: stripes + bubbles) · 'burst' (sunburst rays, the item pushes in 12%) · 'danger' (dark red, item shivers)
//    · 'win' (accent rays, colour wipe, answer, confetti). Title cards are their own set (rings + stars).
// =====================================================================
const VL = { cx: 540, cy: 1000, h: 740, rr: 440, badge: 1520, pips: 1700, pill: 310, plate: 440 };
const DANGER = { g: ['#FF4A5E', '#3A0620'], dark: '#2A0614' };

function phaseOf(L) { const e = L - T_IN; return e >= T_RING ? 'win' : e < 1 ? 'calm' : e < 2 ? 'burst' : 'danger'; }

function rays(t, n, col, a, spin) {
  ctx.save(); ctx.translate(VL.cx, VL.cy); ctx.rotate(t * spin); ctx.fillStyle = col; ctx.globalAlpha = a;
  const R = 1700;
  for (let i = 0; i < n; i++) { const a0 = (i / n) * TAU, a1 = a0 + TAU / n / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R); ctx.closePath(); ctx.fill(); }
  ctx.restore(); ctx.globalAlpha = 1;
}
function stageBgV(t, band, mode) {
  const g = mode === 'danger' ? DANGER.g : band.g;
  stageBg(t, { ...band, g: mode === 'burst' ? [g[1], g[0]] : g });   // burst flips the gradient: the light end jumps to the other corner
  if (mode === 'burst') rays(t, 14, '#FFFFFF', 0.17, 0.35);
  if (mode === 'danger') { rays(t, 10, '#000000', 0.18, -0.6); const k = 0.5 + 0.5 * Math.sin(t * 9); ctx.fillStyle = `rgba(255,40,70,${0.1 + 0.12 * k})`; ctx.fillRect(0, 0, W, H); }
  if (mode === 'win') rays(t, 18, band.accent, 0.3, 0.5);
}

function plate(x, y, w, h, fill) { ctx.save(); ctx.shadowColor = 'rgba(20,10,60,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.restore(); }

function hudV(L, cfg, band, scoreNow, fillT) {
  const t = TT, bob = Math.sin(t * 2.4) * 4;
  // round pill: "ROUND 3 / 7" in the band's dark tone on white, the band word in its accent beside it
  plate(540, VL.pill + bob, 600, 100, band.dark);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(540 - 300, VL.pill + bob - 50, 600, 100, 50); ctx.stroke();
  text(`ROUND ${cfg.n} OF ${cfg.total}`, 540, VL.pill + bob, { size: 66, color: band.accent, shadow: false, maxW: 540, ls: 0.04, label: 'round' });
  // score pips (decor under the badge): one per round, the new one fills with a spring and a shine
  const n = cfg.total, gap = 14, pw = 84, bw = n * pw + (n - 1) * gap, by = VL.pips;
  for (let i = 0; i < n; i++) {
    const x = 540 - bw / 2 + i * (pw + gap);
    ctx.fillStyle = 'rgba(20,10,60,0.4)'; ctx.beginPath(); ctx.roundRect(x, by - 22, pw, 44, 22); ctx.fill();
    const f = i < cfg.score ? 1 : i === cfg.score ? spring(fillT, 9, 0.5) : 0;
    if (f > 0) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, by - 22, pw, 44, 22); ctx.clip();
      ctx.fillStyle = band.accent; ctx.fillRect(x, by - 22, pw * Math.min(f, 1), 44);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.translate(x + ((t * 160 + i * 40) % (pw + 120)) - 60, by); ctx.rotate(0.5); ctx.fillRect(-9, -50, 18, 100);
      ctx.restore();
    }
  }
}

// the ring: a halo behind the item, drains over 3 s, pulses on each tick, red in the last second; badge with the number under it
function ringV(L, band, wonT, phase) {
  const R = VL.rr, e = L - T_IN, left = clamp(e / T_RING), sec = Math.min(2, Math.floor(Math.max(0, e)));
  const pulse = e >= 0 && e < T_RING ? Math.exp(-11 * (e - sec)) : 0, danger = phase === 'danger';
  const appear = EZ.back(seg(L, -0.2, 0.25)), out = wonT >= 0 ? 1 - EZ.i3(seg(wonT, 0.35, 0.8)) : 1;
  const sc = appear * (1 + 0.04 * pulse) * (0.6 + 0.4 * out);
  if (out <= 0) return;
  ctx.save(); ctx.translate(VL.cx + (danger ? Math.sin(TT * 60) * 4 : 0), VL.cy); ctx.scale(sc, sc); ctx.globalAlpha = out;
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  ctx.lineWidth = 40; ctx.strokeStyle = 'rgba(20,10,60,0.28)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  const rem = wonT >= 0 ? 0 : 1 - left;
  if (rem > 0.002) {
    const a = -Math.PI / 2 + TAU * rem;
    ctx.strokeStyle = danger ? '#FFE3E8' : band.accent; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, a); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(Math.cos(a) * R, Math.sin(a) * R, 16, 0, TAU); ctx.fill();
  }
  ctx.restore(); ctx.globalAlpha = 1;
  // badge
  const bs = appear * (1 + 0.18 * pulse) * (wonT >= 0 ? 1 - EZ.i3(seg(wonT, 0.6, 1.0)) : 1);
  if (bs <= 0.01) return;
  ctx.save(); ctx.translate(VL.cx, VL.badge); ctx.scale(bs, bs);
  plate(0, 0, 200, 200, danger ? '#FF2E4D' : band.dark);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.stroke();
  if (wonT >= 0) { ctx.strokeStyle = band.accent; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-46, 4); ctx.lineTo(-12, 40); ctx.lineTo(50, -34); ctx.stroke(); }
  ctx.restore();
  if (wonT < 0) text(String(3 - sec), VL.cx, VL.badge + 6, { size: 150, scale: bs, color: '#fff', maxW: 180 });
}

function confettiV(dt, band) {
  if (dt < 0 || dt > 1.7) return;
  const r = rng(5), cols = [band.accent, '#FFFFFF', '#FF5FA2', '#5CE1FF', '#8DFF7A'];
  for (let i = 0; i < 44; i++) {
    const a = r() * TAU, v = 380 + r() * 620, sz = 24 + r() * 22, col = cols[i % 5], sp = 4 + r() * 8;
    const x = VL.cx + Math.cos(a) * v * Math.min(dt, 0.9) * 0.9, y = VL.cy + Math.sin(a) * v * dt * 0.8 + 900 * dt * dt * 0.5 - 140 * dt;
    ctx.save(); ctx.globalAlpha = clamp(1.7 - dt); ctx.translate(x, y); ctx.rotate(sp * dt); ctx.scale(Math.cos(sp * dt * 1.7), 1);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-sz / 2, -sz / 4, sz, sz / 2, 5); ctx.fill(); ctx.restore();
  }
}

function quizRoundV(L, cfg) {
  const band = BANDS[cfg.band], it = ITEMS[cfg.item], t = TT, wonT = L - T_ZERO, phase = phaseOf(L);
  stageBgV(t, band, phase);
  vignette(t, phase === 'danger' ? 1 : 0);
  ringV(L, band, wonT, phase);
  // the hero: springs in (frame 0 of a round is already mid-drop), pushes in on 'burst', shivers on 'danger', jumps after the reveal
  const e = L - T_IN, z = phase === 'burst' ? 1 + 0.12 * EZ.io(seg(e, 1, 1.35)) : phase === 'danger' ? 1.12 - 0.04 * EZ.o2(seg(e, 2, 2.3)) : 1;
  Hero(it, t, {
    cx: VL.cx, cy: VL.cy, h: VL.h, z, in: EZ.back(seg(L, -0.15, 0.3)), sil: band.dark,
    pose: phase === 'win' ? 'cheer' : phase === 'danger' ? 'reach' : cfg.pose || 'idle', mood: phase === 'danger' ? 'tense' : phase === 'win' ? 'happy' : 'calm',
    wipe: wonT > 0 ? clamp(wonT / 0.55) : 0, pop: wonT > 0 ? 0.1 * Math.exp(-6 * wonT) * Math.cos(18 * wonT) : 0,
  });
  confettiV(wonT - 0.1, band);
  // prompt plate (dark) before zero, answer plate (accent) after
  if (wonT < 0) {
    const a = EZ.o2(seg(L, -0.2, 0.2)), sc = 0.98 + 0.02 * Math.sin(t * 5);
    // one line on the plate: shrink a long prompt down to 64 px; longer still, the plate grows to two lines
    ctx.font = `900 72px ${FONT}`; ctx.letterSpacing = '1.4px';
    const fit = Math.max(64, Math.min(72, (72 * 740) / (ctx.measureText(cfg.prompt).width + 8))), two = (ctx.measureText(cfg.prompt).width * fit) / 72 > 740;
    ctx.save(); ctx.globalAlpha = a; plate(540, VL.plate, 810 * sc, two ? 170 : 112, 'rgba(20,10,60,0.62)'); ctx.restore();
    text(cfg.prompt, 540, VL.plate, { size: fit, a, scale: sc, maxW: 740, shadow: false, label: 'prompt' });
  } else {
    const p = EZ.back(seg(wonT, 0.02, 0.32)), sc = Math.max(0.01, p) * (1 + 0.012 * Math.sin(t * 3));
    ctx.save(); ctx.translate(540, VL.plate); ctx.rotate(-0.04 * (1 - clamp(p)) + 0.012 * Math.sin(t * 2.2)); ctx.scale(sc, sc);
    plate(0, 0, 760, 150, band.accent); ctx.restore();
    text(it.name + '!', 540, VL.plate, { size: 112, color: band.dark, scale: sc, maxW: 660, shadow: false, label: 'answer' });
  }
  if (wonT > 0 && wonT < 0.3) { ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - wonT / 0.3)})`; ctx.fillRect(0, 0, W, H); }
  hudV(L, cfg, band, cfg.score + (wonT > 0.4 ? 1 : 0), wonT - 0.4);
}

function titleCardV(L, d, cfg) {
  const band = BANDS[cfg.band], t = TT, cy = 960;
  stageBg(t * 1.6, band);
  rays(t, 22, '#FFFFFF', 0.1, 0.8);
  for (let i = 0; i < 3; i++) {
    const k = ((L * 1.2 + i / 3) % 1); ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - k)})`; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.arc(W / 2, cy, 140 + k * 900, 0, TAU); ctx.stroke();
  }
  vignette(t, 0);
  const p = EZ.back(seg(L, -0.1, 0.3)), grow = 1 + 0.08 * (L / d);
  text(`LEVEL ${cfg.level}`, W / 2, cy - 250, { size: 80, a: EZ.o2(seg(L, 0, 0.25)), color: band.accent, label: 'level' });
  const r = text(band.label, W / 2, cy - 20, { size: 220, scale: Math.max(0.01, p) * grow, rot: -0.05 + 0.02 * Math.sin(t * 3), maxW: 740 });
  for (let i = 0; i < 4; i++) {
    const sp = spring(L - 0.1 - i * 0.1, 9, 0.4), on = i < band.stars, x = W / 2 + (i - 1.5) * 170, y = cy + 210;
    star(x, y, 70 * Math.max(0.01, sp) * (1 + 0.06 * Math.sin(t * 5 + i)), Math.sin(t * 2 + i) * 0.12, on ? band.accent : 'rgba(20,10,60,0.4)');
  }
  text(cfg.sub, W / 2, cy + 400, { size: 64, a: EZ.o2(seg(L, 0.2, 0.45)), maxW: 780, label: 'sub' });
  // the key object of the card: band word + stars (the guard needs a tracked subject on every frame)
  const hw = Math.max(r.w / 2, 330) + 20;
  if (typeof track === 'function') track('key', W / 2 - hw, cy - 20 - 140, W / 2 + hw, cy + 210 + 80, band.label);
}
