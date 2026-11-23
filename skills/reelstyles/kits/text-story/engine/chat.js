// =====================================================================
//  engine/chat.js: the "Chat text story" engine (ReelStyles original, canvas-2D).
//  CHAT.mount(story) lays out the conversation twice: once for the phone's own screen (a texture drawn on the phone
//  prop, CHAT.tex) and once for the big floating column beside the phone (the text the viewer reads, 46+ px). Then it
//  paints any frame from t alone: the shot's scene (engine/look.js, sets/scenes.js), the phone, the floating chat, the
//  post (bloom, grade, grain, vignette), or the full-frame twist card.
//  Our own neutral messenger: two bubble colours, round initials, three bouncing dots, own ticks and glyphs.
// =====================================================================
const PAL = {
  night: '#0B0D18', screen: '#121629', them: '#323C66', me: '#FF7A59', saffron: '#FFC857', mint: '#7BE0C3',
  text: '#EEF2FF', dim: '#9AA3C7', ink: '#160F14', line: '#232A48',
};
const MIN_PX = 28;
const F = (w, px) => `${w} ${Math.round(Math.max(MIN_PX, px))}px "Inter", "Helvetica Neue", Arial, sans-serif`;

const CHAT = (() => {
  const portrait = H > W;
  // geometries: TEX = the phone's screen texture (600x1200), FLT = the floating column (local px, drawn 1:1 on screen)
  const geo = (o) => { o.lh = Math.round(o.text * 1.28); o.k = o.text / 42; o.maxB = Math.round(o.bw * (o.maxR || 0.8)); o.typeH = Math.round(84 * o.k); return o; };
  const TEX = geo({ bx: 0, bw: 600, hy: 0, hh: 150, vy: 150, vh: 900, cy: 1060, ch: 130, text: 30, side: 22, pad: 18, maxR: 0.76, tex: true });
  const FW = portrait ? 920 : 780;
  const FLT = geo({ bx: 0, bw: FW, hh: 120, vy: 0, vh: 0, text: portrait ? 50 : 46, side: 0, pad: 26, maxR: 0.86, meDots: true });

  let S = null, cards = [], LT = null, LF = null, tex = null, tctx = null; const QA = { fbox: null, hero: null };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

  function wrap(c, str, maxW, px) {
    c.font = F('500', px); const out = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        let w = word;
        while (c.measureText(w).width > maxW) { let i = w.length - 1; while (i > 1 && c.measureText(w.slice(0, i)).width > maxW) i--; if (line) { out.push(line); line = ''; } out.push(w.slice(0, i)); w = w.slice(i); }
        const trial = line ? line + ' ' + w : w;
        if (c.measureText(trial).width <= maxW) line = trial; else { out.push(line); line = w; }
      }
      out.push(line);
    }
    return out;
  }

  function layout(c, story, G) {
    const rows = [];
    (story.history || []).forEach((m) => rows.push({ ...m, at: -100, typing: 0 }));
    (story.events || []).forEach((e) => { if (e.text || e.photo) rows.push({ ...e }); });
    let y = Math.round(26 * G.k); const photoW = Math.min(G.maxB, Math.round(G.bw * 0.7)), padY = Math.round(20 * G.k);
    rows.forEach((m, i) => {
      const next = rows[i + 1];
      if (m.photo) { m.w = photoW; m.h = Math.round(photoW * 0.72); }
      else { m.lines = wrap(c, m.text, G.maxB - 2 * G.pad - 12, G.text); c.font = F('500', G.text);
        m.w = Math.ceil(Math.max(...m.lines.map((s) => c.measureText(s).width))) + 2 * G.pad + 12; m.h = m.lines.length * G.lh + 2 * padY; }
      m.final = !next || next.from !== m.from;
      m.typing = m.from === 'them' ? (m.typing ?? 0.9) : (m.typed ? (m.typing ?? 0.8) : 0);
      m.y = y; y += m.h + (m.final ? Math.round(80 * G.k) : Math.round(12 * G.k));
      m.bottom = m.y + m.h + (m.final ? Math.round(46 * G.k) : 0); m.at = m.at ?? 0;
    });
    const need = (b) => Math.max(0, b + 26 - G.vh), keys = []; let prev = 0;
    const pre = rows.filter((m) => m.at < 0); if (pre.length) prev = need(pre[pre.length - 1].bottom);
    keys.push({ t: -100, d: prev });
    rows.filter((m) => m.at >= 0).forEach((m) => {
      if ((m.from === 'them' || G.meDots) && m.typing > 0) { const tg = need(m.y + G.typeH); keys.push({ t: m.at - m.typing, d: tg - prev }); prev = tg; }
      const tg = need(m.bottom); keys.push({ t: m.at, d: tg - prev }); prev = tg;
    });
    return { items: rows, keys, G };
  }
  const scrollAt = (lay, t) => lay.keys.reduce((s, k) => s + (t >= k.t ? k.d * spring(t - k.t, 5.2, 0.85) : 0), 0);
  const typingNow = (t) => LT.items.find((m) => m.from === 'them' && m.typing > 0 && t >= m.at - m.typing && t < m.at);

  // ---------- small drawing helpers
  function glyph(c, kind, x, y, s, col) {
    c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
    if (kind === 'heart') { c.beginPath(); c.moveTo(0, s * 0.42); c.bezierCurveTo(-s * 0.75, -s * 0.05, -s * 0.38, -s * 0.62, 0, -s * 0.22); c.bezierCurveTo(s * 0.38, -s * 0.62, s * 0.75, -s * 0.05, 0, s * 0.42); c.fill(); }
    else if (kind === 'bang') { rr(c, -s * 0.08, -s * 0.5, s * 0.16, s * 0.62, s * 0.08); c.fill(); c.beginPath(); c.arc(0, s * 0.34, s * 0.1, 0, TAU); c.fill(); }
    else if (kind === 'eyes') { [-1, 1].forEach((k) => { c.beginPath(); c.ellipse(k * s * 0.3, 0, s * 0.2, s * 0.3, 0, 0, TAU); c.fill(); }); }
    else if (kind === 'star') { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * 0.2 : s * 0.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); }
    else if (kind === 'check') { c.lineWidth = s * 0.16; c.beginPath(); c.moveTo(-s * 0.4, 0); c.lineTo(-s * 0.1, s * 0.3); c.lineTo(s * 0.42, -s * 0.28); c.stroke(); }
    else if (kind === 'chev') { c.lineWidth = s * 0.14; c.beginPath(); c.moveTo(s * 0.2, -s * 0.4); c.lineTo(-s * 0.2, 0); c.lineTo(s * 0.2, s * 0.4); c.stroke(); }
    else if (kind === 'send') { c.lineWidth = s * 0.14; c.beginPath(); c.moveTo(0, s * 0.36); c.lineTo(0, -s * 0.34); c.moveTo(-s * 0.3, -s * 0.06); c.lineTo(0, -s * 0.36); c.lineTo(s * 0.3, -s * 0.06); c.stroke(); }
    c.restore();
  }
  function avatar(c, x, y, r, ch, col) {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = PAL.ink; c.font = F('900', r * 1.0); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, x, y + r * 0.04);
  }
  function bubble(c, x, y, w, h, from, final, col, k, lit) {
    const big = 38 * k, small = 10 * k, br = from === 'me' ? (final ? small : big) : big, bl = from === 'them' ? (final ? small : big) : big;
    if (lit) { c.save(); c.shadowColor = 'rgba(5,6,18,0.55)'; c.shadowBlur = 34; c.shadowOffsetY = 12; }
    c.fillStyle = col; rr(c, x, y, w, h, [big, big, br, bl]); c.fill();
    if (lit) { c.restore(); c.strokeStyle = from === 'me' ? 'rgba(255,230,210,0.55)' : 'rgba(190,205,255,0.28)'; c.lineWidth = 2.5; rr(c, x + 1, y + 1, w - 2, h - 2, [big, big, br, bl]); c.stroke(); }
  }

  // ---------- photos: code-drawn pictures (local box 0,0,w,h). Story photos: photo: 'door' | 'window' | a function (c, w, h, t)
  function photo(c, kind, w, h, t, dev) {
    c.save(); rr(c, 0, 0, w, h, 28); c.clip();
    const sc = 1.06 + 0.025 * Math.sin(t * 0.8); c.translate(w / 2, h / 2); c.scale(sc, sc); c.translate(-w / 2, -h / 2);
    const r = mulberry32(21);
    if (typeof kind === 'function') kind(c, w, h, t);
    else if (kind === 'door') {
      let g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2B3258'); g.addColorStop(1, '#151a33'); c.fillStyle = g; c.fillRect(-w, -h, w * 3, h * 3);
      c.fillStyle = '#0A0C1A'; c.fillRect(w * 0.32, h * 0.14, w * 0.36, h * 0.6);
      const fl = 0.86 + 0.14 * Math.sin(t * 9.1) * Math.sin(t * 3.7);
      g = c.createLinearGradient(w * 0.4, 0, w * 0.6, 0); g.addColorStop(0, `rgba(255,200,87,${0.95 * fl})`); g.addColorStop(1, `rgba(255,150,70,${0.8 * fl})`);
      c.fillStyle = g; c.fillRect(w * 0.43, h * 0.16, w * 0.12, h * 0.58);
      for (let i = 0; i < 22; i++) { const px = w * (0.34 + r() * 0.34), py = (r() * h + t * (10 + r() * 14)) % (h * 0.8); c.fillStyle = `rgba(255,230,170,${0.25 + 0.3 * r()})`; c.beginPath(); c.arc(px, h * 0.18 + py, 2 + r() * 2.5, 0, TAU); c.fill(); }
    } else {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2E3A6A'); g.addColorStop(1, '#141a36'); c.fillStyle = g; c.fillRect(-w, -h, w * 3, h * 3);
      c.fillStyle = '#F4EBD0'; c.beginPath(); c.arc(w * 0.76, h * 0.22, h * 0.09, 0, TAU); c.fill();
      for (let i = 0; i < 9; i++) { const bw = w * 0.14, bx = i * w * 0.115 - 10, bh = h * (0.28 + r() * 0.3); c.fillStyle = i % 2 ? '#1a1f3c' : '#141830'; c.fillRect(bx, h - bh, bw, bh);
        for (let k = 0; k < 6; k++) for (let j = 0; j < 4; j++) if (r() < 0.45) { c.fillStyle = `rgba(255,200,87,${0.45 + 0.45 * Math.sin(t * 2 + i * 3 + k + j) ** 2})`; c.fillRect(bx + 8 + j * (bw / 4.4), h - bh + 14 + k * (bh / 7), bw / 7, bh / 12); } }
    }
    c.restore();
    if (dev < 1) { c.save(); rr(c, 0, 0, w, h, 28); c.clip(); c.fillStyle = `rgba(18,22,41,${(1 - dev) * 0.92})`; c.fillRect(0, 0, w, h); c.restore(); }
  }

  // ---------- one message (or its typing dots) in geometry G; fade = fade-out band at the top of the view (px)
  function drawItem(c, m, t, lay, fade) {
    const G = lay.G, k = G.k, dt = t - m.at, sy = G.vy + m.y - scrollAt(lay, t);
    const typing = (m.from === 'them' || G.meDots) && m.typing > 0 && t >= m.at - m.typing && dt < 0;
    if (sy > G.vy + G.vh + 20 || sy + m.h < G.vy - 140 * k) return;
    const right = m.from === 'me', col = right ? PAL.me : PAL.them, tc = right ? PAL.ink : PAL.text;
    const x0 = right ? G.bx + G.bw - G.side : G.bx + G.side, lit = !G.tex;
    const fa = fade ? clamp((sy - G.vy + fade * 0.25) / fade) : 1;
    if (typing) {
      const p = spring(t - (m.at - m.typing), 8, 0.6), w = 150 * k, bx = right ? x0 - w : x0;
      c.save(); c.globalAlpha = clamp(p * 3) * fa * (right ? 0.85 : 1); c.translate(x0, sy + G.typeH); c.scale(0.8 + 0.2 * p, 0.8 + 0.2 * p); c.translate(-x0, -(sy + G.typeH));
      bubble(c, bx, sy, w, G.typeH, m.from, true, col, k, lit);
      for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin((t * 1.7 - i * 0.17) * TAU)) ** 1.5;
        c.fillStyle = right ? `rgba(22,15,20,${0.45 + 0.5 * b})` : `rgba(238,242,255,${0.45 + 0.5 * b})`; c.beginPath(); c.arc(bx + 40 * k + i * 35 * k, sy + G.typeH / 2 - b * 15 * k, 10 * k, 0, TAU); c.fill(); }
      c.restore(); return;
    }
    if (dt < 0) return;
    const p = spring(dt, 8.5, 0.6), a = clamp(dt / 0.12) * fa, bx = right ? x0 - m.w : x0, oy = sy + m.h;
    c.save(); c.globalAlpha = a; c.translate(x0, oy); const s = (0.9 + 0.1 * p) * (1 + 0.004 * Math.sin(t * 1.9 + m.y * 0.02)); c.scale(s, s); c.translate(-x0, -oy); c.translate(0, (1 - p) * 64 * k);
    if (m.photo) { c.save(); c.translate(bx, sy); photo(c, m.photo, m.w, m.h, t, clamp(dt / 0.7)); c.restore(); c.strokeStyle = col; c.lineWidth = 6 * k; rr(c, bx, sy, m.w, m.h, 28); c.stroke(); }
    else { bubble(c, bx, sy, m.w, m.h, m.from, m.final, col, k, lit);
      c.fillStyle = tc; c.font = F('500', G.text); c.textAlign = 'left'; c.textBaseline = 'middle';
      m.lines.forEach((s2, i) => c.fillText(s2, bx + G.pad + 6, sy + 20 * k + G.lh * (i + 0.5) + 1)); }
    if (m.final) {
      const ty = sy + m.h + 30 * k, mp = G.tex ? 22 : 30; c.font = F('600', mp); c.textBaseline = 'middle';
      const meta = lit ? 'rgba(255,255,255,0.86)' : PAL.dim;
      if (right) { c.textAlign = 'right'; c.fillStyle = meta; c.fillText(m.time || '', x0 - 46 * k, ty);
        const rd = dt > (m.read ?? 1.0), pr = spring(dt - (m.read ?? 1.0), 9, 0.5);
        c.fillStyle = rd ? PAL.saffron : '#3A4268'; c.beginPath(); c.arc(x0 - 18 * k, ty, 16 * k * (rd ? 0.85 + 0.15 * Math.min(pr, 1.3) : 1), 0, TAU); c.fill(); glyph(c, 'check', x0 - 18 * k, ty, 24 * k, rd ? PAL.ink : PAL.dim);
      } else { c.textAlign = 'left'; c.fillStyle = meta; c.fillText(m.time || '', bx + 6, ty); }
    }
    if (m.react) { const rt = t - m.react.at;
      if (rt >= 0) { const pr = spring(rt, 9, 0.45), bob = Math.sin(t * 3.1) * 3 * k, cx = right ? bx - 46 * k : Math.min(bx + m.w + 46 * k, G.bx + G.bw - 44 * k), cy = sy + m.h - 20 * k + bob, R = 40 * k;
        c.save(); c.translate(cx, cy); c.scale(pr, pr); c.fillStyle = PAL.screen; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.strokeStyle = PAL.saffron; c.lineWidth = 4 * k; c.stroke();
        glyph(c, m.react.glyph || 'heart', 0, 0, 44 * k, m.react.glyph === 'bang' ? PAL.saffron : PAL.me); c.restore(); } }
    c.restore();
  }

  // ---------- the phone's own screen, drawn into CHAT.tex every frame (header, list, composer)
  function texture(t) {
    const c = tctx, G = TEX, k = 0.72; c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = PAL.screen; c.fillRect(0, 0, 600, 1200);
    c.save(); c.beginPath(); c.rect(0, G.vy, 600, G.vh); c.clip(); LT.items.forEach((m) => drawItem(c, m, t, LT, 0)); c.restore();
    const kk = S.contact, y = G.hh / 2 + 10, typ = typingNow(t);
    c.fillStyle = '#171C35'; c.fillRect(0, 0, 600, G.hh); c.fillStyle = PAL.line; c.fillRect(0, G.hh - 3, 600, 3);
    glyph(c, 'chev', 36, y, 40, PAL.dim); avatar(c, 104, y, 38, kk.initial, kk.color);
    c.fillStyle = PAL.text; c.font = F('800', 34); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(kk.name, 158, y - 16);
    c.font = F('500', 28); c.fillStyle = typ ? PAL.saffron : PAL.mint; c.fillText(typ ? 'typing…' : 'online', 158, y + 22);
    c.fillStyle = PAL.screen; c.fillRect(0, G.cy - 30, 600, 200); c.fillStyle = PAL.line; rr(c, 20, G.cy - 10, 470, 96, 48); c.fill();
    const me = LT.items.find((m) => m.from === 'me' && m.typing > 0 && t >= m.at - m.typing && t < m.at);
    c.font = F('500', 28); c.textBaseline = 'middle'; c.save(); rr(c, 40, G.cy - 10, 430, 96, 0); c.clip();
    if (me) { const n = Math.floor(me.text.length * seg(t, me.at - me.typing, me.at - 0.08)); let sh = me.text.slice(0, n); while (sh.length && c.measureText(sh).width > 410) sh = sh.slice(1);
      c.fillStyle = PAL.text; c.fillText(sh, 44, G.cy + 38); if (Math.floor(t * 2.4) % 2 === 0) { c.fillStyle = PAL.saffron; c.fillRect(48 + c.measureText(sh).width, G.cy + 20, 4, 36); } }
    else { c.fillStyle = PAL.dim; c.fillText('Message', 44, G.cy + 38); }
    c.restore(); c.fillStyle = PAL.me; c.beginPath(); c.arc(545, G.cy + 38, 44 * k, 0, TAU); c.fill(); glyph(c, 'send', 545, G.cy + 38, 34, PAL.ink);
  }

  // ---------- the floating chat column (screen px): a contact chip on top, the last messages below
  function floatRect(s) {
    const f = s.float || (portrait ? 'b' : 'r');
    if (typeof f === 'object') return f;
    if (portrait) return { x: (W - FW) / 2, y: f === 't' ? 160 : H * 0.47, w: FW, h: f === 't' ? H * 0.4 : H * 0.53 - 260 };
    return { x: f === 'l' ? 120 : W - 120 - FW, y: 96, w: FW, h: H - 192 };
  }
  function floatChat(c, t, s, cam) {
    // the column rides the camera at half parallax and sways, so no part of it is ever a still block
    const R0 = floatRect(s), c0 = LOOK.camOf(s, s.t0), ax0 = R0.x + R0.w / 2, ay0 = R0.y + R0.h / 2;
    const zr = (1 + (cam[2] - 1) * 0.5) / (1 + (c0[2] - 1) * 0.5);
    const dx = ((ax0 - W / 2) * (zr - 1) - (cam[0] - c0[0]) * 0.5) + Math.sin(t * 1.3) * 12, dy = ((ay0 - H / 2) * (zr - 1) - (cam[1] - c0[1]) * 0.5) + Math.cos(t * 1.1) * 9;
    const R = { x: R0.x + dx, y: R0.y + dy, w: R0.w, h: R0.h }, G = FLT, a = s.floatIn == null ? 1 : ss((t - s.t0) / s.floatIn);
    G.bx = R.x; G.vy = R.y + G.hh + 24; G.vh = R.y + R.h - G.vy;
    if (Math.abs((LF._vh || 0) - G.vh) > 1) { LF = layout(c, S, G); LF._vh = G.vh; }       // a different column height re-lays out the scroll
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a;
    // frosted glass slab behind the column: the set shows through, blurred and darkened, so props under it read as depth
    c.save(); rr(c, R.x - 40, R.y - 30, R.w + 80, R.h + 60, 44); c.clip(); c.filter = 'blur(16px)'; c.drawImage(c.canvas, 0, 0); c.filter = 'none';
    c.fillStyle = 'rgba(12,14,34,0.34)'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 24; i++) {                                    // soft bokeh drifting inside the glass (the style's old stage)
      const bx = R.x + hash(i, 1, 3) * R.w + Math.sin(t * 0.7 + i) * 40, by = R.y + R.h - ((hash(i, 2, 3) * R.h + t * (40 + 30 * hash(i, 4, 3))) % (R.h + 120)) + 60, br = 30 + 60 * hash(i, 5, 3);
      c.fillStyle = i % 2 ? 'rgba(255,200,87,0.07)' : 'rgba(160,175,255,0.08)'; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; rr(c, R.x - 40, R.y - 30, R.w + 80, R.h + 60, 44); c.stroke();
    const kk = S.contact, typ = typingNow(t), cy = R.y + G.hh / 2, ax = s.float === 'l' || portrait ? R.x + 54 : R.x + 54;
    c.save(); c.shadowColor = 'rgba(5,6,18,0.5)'; c.shadowBlur = 30; c.shadowOffsetY = 10; c.fillStyle = 'rgba(18,22,41,0.82)'; rr(c, R.x, R.y, 560, G.hh, G.hh / 2); c.fill(); c.restore();
    avatar(c, ax, cy, 42, kk.initial, kk.color);
    c.fillStyle = PAL.text; c.font = F('800', 44); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(kk.name, ax + 66, cy - 16);
    c.font = F('500', 30); c.fillStyle = typ ? PAL.saffron : PAL.mint; c.fillText(typ ? 'typing…' : 'online', ax + 90, cy + 26);
    c.beginPath(); c.arc(ax + 74, cy + 26, 8 * (1 + 0.25 * Math.sin(t * 4)), 0, TAU); c.fill();
    c.beginPath(); c.rect(R.x - 60, G.vy - 6, R.w + 120, G.vh + 60); c.clip();
    LF.items.forEach((m) => drawItem(c, m, t, LF, 60));
    c.restore();
    QA.fbox = { kind: 'caption', name: 'chat column', px: G.text, x0: R.x, y0: R.y, x1: R.x + R.w, y1: R.y + R.h };
  }

  // ---------- twist card: hard cut to big type on a flat field, with glow, grain and vignette
  function card(c, cd, t) {
    const dt = t - cd.at, bg = cd.bg || PAL.saffron, fg = cd.fg || PAL.ink, hi = cd.hi || PAL.me;
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = 0.16; c.fillStyle = hi; const sw = Math.max(W, H) * 0.16, off = (dt * 60) % (sw * 2);
    for (let i = -6; i < 14; i++) { c.save(); c.translate(i * sw * 2 + off, 0); c.rotate(0.35); c.fillRect(-W, -H, sw, H * 3); c.restore(); } c.restore();
    const pulse = 0.5 + 0.5 * Math.sin(dt * 2.2), rg = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * (0.55 + 0.05 * pulse));
    rg.addColorStop(0, 'rgba(255,255,255,0.3)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    const boxW = W * (portrait ? 0.84 : 0.8), n = cd.lines.length, cap = portrait ? 210 : 230;
    let px = cap; while (px > MIN_PX && Math.max(...cd.lines.map((s) => (c.font = F('900', px), c.measureText(s.toUpperCase()).width))) > boxW) px -= 4;
    const lh = px * 1.02, tot = lh * n, zoom = 1 + 0.06 * Math.min(dt / 2.4, 1.6) + 0.01 * Math.sin(dt * 1.7);
    c.save(); c.translate(W / 2, H / 2); c.scale(zoom, zoom); c.rotate(Math.sin(dt * 0.8) * 0.004);
    cd.lines.forEach((s, i) => {
      const p = spring(dt - i * 0.2, 9, 0.55), y = -tot / 2 + lh * (i + 0.5), up = s.toUpperCase();
      c.save(); c.globalAlpha = clamp((dt - i * 0.2) / 0.08); c.translate(0, y + (1 - p) * 50); c.scale(1 + (1 - p) * 0.22, 1 + (1 - p) * 0.22);
      c.font = F('900', px); c.textAlign = 'center'; c.textBaseline = 'middle';
      if (i === n - 1 && n > 1) { const w = c.measureText(up).width; c.fillStyle = hi; rr(c, -w / 2 - 28, -lh * 0.5, w + 56, lh * 0.98, 26); c.fill(); c.fillStyle = PAL.ink; }
      else { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillText(up, 6, 12); c.fillStyle = fg; }
      c.fillText(up, 0, 4); c.restore();
    });
    c.restore();
    if (cd.sub) { const p = spring(dt - 0.2 * n - 0.2, 8, 0.7); c.save(); c.globalAlpha = clamp(p); c.fillStyle = fg; c.font = F('800', 60); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = cd.subCol || '#3a1d10';
      c.fillText(cd.sub, W / 2, H * (portrait ? 0.76 : 0.87) + (1 - p) * 20 + Math.sin(dt * 2) * 4); c.restore(); }
    LOOK.post(c, LOOK.GRADES[cd.grade || 'warm'], t, null, null, 0);
  }

  function render(c, t) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.filter = 'none'; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    const cd = cards.find((k) => t >= k.at && t < k.at + k.dur) || (t >= S.dur ? cards[cards.length - 1] : null);
    QA.fbox = null; LOOK.box = null; QA.hero = null;
    if (cd) { card(c, cd, t); return; }
    texture(t);
    const s = LOOK.shotAt(t), cam = LOOK.camOf(s, t), g = LOOK.grade(s, t);
    const ls = LOOK.scene(c, t, s, cam, g);
    LOOK.post(c, g, t, ls[0], ls[1]);
    if (s.float !== 'none') floatChat(c, t, s, cam);
    LOOK.caption(c, t, s, g);
    const ph = s.S.props.find((p) => p.id === (s.hero || 'phone'));
    if (ph) { const [x0, y0] = LOOK.toScreen(cam, ph.x - ph.w / 2, ph.y - ph.h), [x1, y1] = LOOK.toScreen(cam, ph.x + ph.w / 2, ph.y); QA.hero = { kind: 'hero', name: ph.id, x0, y0, x1, y1 }; }
  }

  return {
    QA, get tex() { return tex; },
    mount(story) {
      S = story; cards = story.cards || [];
      tex = document.createElement('canvas'); tex.width = 600; tex.height = 1200; tctx = tex.getContext('2d');
      // shots: default = one desk scene over the whole chat
      LOOK.shots = story.shots || [{ t0: 0, t1: story.dur, scene: 'desk', grade: 'night', cam: [[0, [-120, 0, 1]], [story.dur, [-120, -10, 1.08]]] }];
      const cache = {};
      LOOK.shots.forEach((s) => { const key = s.place || JSON.stringify([s.scene, s.set || {}]);
        s.S = s.S || (cache[key] = cache[key] || (() => { const sc = SCENES[s.scene || 'desk'](s.set || {}); if (!sc.props.some((p) => p.id === 'phone')) sc.props.push(PROPS.phone({ x: s.phoneX ?? sc.slot ?? 0, y: sc.y + 2, ...(s.phone || {}) })); if (s.dress) s.dress(sc); return sc; })()); });
      mountFilm(S.dur, render, (c) => { LT = layout(c, S, TEX); LF = layout(c, S, FLT); });
    },
  };
})();
// QA boxes for tools/layout-check.mjs: the hero (the phone) and the floating chat column / caption, in screen px
window.FFQA = () => [CHAT.QA.hero, CHAT.QA.fbox, LOOK.box].filter(Boolean);
