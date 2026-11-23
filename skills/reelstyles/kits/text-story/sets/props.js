// =====================================================================
//  sets/props.js: generic set dressing for the places a phone lies in, and the phone itself (the hero).
//  A prop: { id, x, y (floor contact, world px), w, h, layer: 'back'|'mid', color, path(t) → Path2D (origin = bottom
//  centre, up = -y), detail(c, g, t) }. LOOK.props gives every prop a contact shadow, a rim toward the light and shading.
//  New object: one Path2D silhouette, at most two details, colours from LOOK.tone(). Prove it on a still first (FILM.md).
// =====================================================================
const PROPS = {};
const _P = (fn) => { const p = new Path2D(); fn(p); return p; };
const _rr = (p, x, y, w, h, r) => p.roundRect(x, y, w, h, r);

// the hero: a phone standing on a small stand, its screen = the live chat (CHAT.texture). s 1 = 430 px tall
PROPS.phone = ({ x = 0, y = 0, s = 1, tilt = 0 } = {}) => {
  const h = 430 * s, w = h * 0.5, R = w * 0.16;
  return { id: 'phone', x, y, w: w * 1.1, h: h + 26 * s, layer: 'mid', color: '#14151f', sink: 0, rimW: 3,
    path: () => _P((p) => { _rr(p, -w / 2, -h - 26 * s, w, h, R); _rr(p, -w * 0.36, -30 * s, w * 0.72, 30 * s, 8 * s); }),
    detail: (c, g, t) => {
      const sx = -w / 2 + 9 * s, sy = -h - 26 * s + 9 * s, sw = w - 18 * s, sh = h - 18 * s;
      c.save(); c.beginPath(); c.roundRect(sx, sy, sw, sh, R * 0.8); c.clip();
      if (CHAT.tex) c.drawImage(CHAT.tex, sx, sy, sw, sh);
      const sheen = c.createLinearGradient(sx, sy, sx + sw, sy + sh * 0.6);               // glass sheen
      sheen.addColorStop(0, 'rgba(255,255,255,0.10)'); sheen.addColorStop(0.45, 'rgba(255,255,255,0.0)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0.07)'); sheen.addColorStop(0.56, 'rgba(255,255,255,0)');
      c.fillStyle = sheen; c.fillRect(sx, sy, sw, sh); c.restore();
      // the screen lights the surface in front of it and the wall behind it
      c.save(); c.globalCompositeOperation = 'screen';
      const fl = c.createRadialGradient(0, 6, 0, 0, 6, w * 1.6); fl.addColorStop(0, rgb(g.screen, 0.45)); fl.addColorStop(1, rgb(g.screen, 0));
      c.scale(1, 0.25); c.fillStyle = fl; c.fillRect(-w * 1.6, -w * 1.6 + 24, w * 3.2, w * 3.2); c.restore();
      c.strokeStyle = rgb(g.rim, 0.55); c.lineWidth = 2; c.beginPath(); c.roundRect(-w / 2 + 1, -h - 26 * s + 1, w - 2, h - 2, R); c.stroke();
    } };
};
// desk lamp (the key light). side 1 = shade leans right. Its bulb position is lamp.light (world px)
PROPS.lamp = ({ x = 0, y = 0, s = 1, side = 1, color = '#2b2f3f' } = {}) => {
  const h = 470 * s, hx = side * 120 * s, hy = -h + 60 * s;
  const L = { id: 'lamp', x, y, w: 300 * s, h, layer: 'mid', color, sink: 0.2,
    path: () => _P((p) => { _rr(p, -70 * s, -22 * s, 140 * s, 22 * s, 10 * s);
      p.moveTo(-8 * s, -20 * s); p.lineTo(side * 40 * s - 8 * s, -h * 0.62); p.lineTo(side * 40 * s + 8 * s, -h * 0.62); p.lineTo(8 * s, -20 * s);
      p.moveTo(side * 40 * s - 7 * s, -h * 0.62); p.lineTo(hx - 7 * s, hy - 40 * s); p.lineTo(hx + 7 * s, hy - 40 * s); p.lineTo(side * 40 * s + 7 * s, -h * 0.62);
      p.moveTo(hx - 105 * s, hy + 20 * s); p.lineTo(hx - 50 * s, hy - 60 * s); p.lineTo(hx + 50 * s, hy - 60 * s); p.lineTo(hx + 105 * s, hy + 20 * s); p.closePath(); }),
    detail: (c, g) => { c.fillStyle = rgb(g.light); c.beginPath(); c.ellipse(hx, hy + 20 * s, 100 * s, 16 * s, 0, 0, TAU); c.fill();
      const cone = c.createLinearGradient(0, hy, 0, 0); cone.addColorStop(0, rgb(g.light, 0.32)); cone.addColorStop(1, rgb(g.light, 0));
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = cone; c.beginPath(); c.moveTo(hx - 100 * s, hy + 20 * s); c.lineTo(hx + 100 * s, hy + 20 * s); c.lineTo(hx + 330 * s, 0); c.lineTo(hx - 330 * s, 0); c.fill(); c.restore(); } };
  L.light = [x + hx, y + hy + 26 * s]; return L;
};
PROPS.mug = ({ x = 0, y = 0, s = 1, color = '#e05d4a', steam = true } = {}) => ({ id: 'mug', x, y, w: 150 * s, h: 130 * s, layer: 'mid', color,
  path: () => _P((p) => { _rr(p, -55 * s, -120 * s, 110 * s, 120 * s, [6 * s, 6 * s, 22 * s, 22 * s]); p.moveTo(55 * s, -95 * s); p.arc(60 * s, -66 * s, 30 * s, -Math.PI / 2, Math.PI / 2); p.lineTo(55 * s, -46 * s); p.arc(58 * s, -66 * s, 16 * s, Math.PI / 2, -Math.PI / 2, true); p.closePath(); }),
  detail: (c, g, t) => { c.fillStyle = rgb(LOOK.tone('#2a1a14', g, 0.2)); c.beginPath(); c.ellipse(0, -118 * s, 50 * s, 9 * s, 0, 0, TAU); c.fill();
    if (steam) { c.strokeStyle = rgb(g.dust, 0.35); c.lineWidth = 6 * s; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) { c.beginPath(); for (let i = 0; i <= 12; i++) { const v = i / 12, yy = -130 * s - v * 170 * s, xx = (k - 1) * 22 * s + Math.sin(v * 5 + t * 2.2 + k * 2) * 14 * s * v; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
        c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.5 + k); c.stroke(); } c.globalAlpha = 1; } } });
PROPS.books = ({ x = 0, y = 0, s = 1, n = 3, colors = ['#3f6db0', '#d9a441', '#8a3f5a', '#3f8a6a'] } = {}) => {
  const bk = Array.from({ length: n }, (_, i) => ({ w: (230 - i * 18) * s, h: (34 + 10 * hash(i, 9)) * s, dx: (hash(i, 4) - 0.5) * 30 * s, col: colors[i % colors.length] }));
  const H2 = bk.reduce((a, b) => a + b.h, 0);
  return { id: 'books', x, y, w: 250 * s, h: H2, layer: 'mid', color: '#2a2a3a',
    path: () => _P((p) => { let yy = 0; bk.forEach((b) => { yy -= b.h; _rr(p, b.dx - b.w / 2, yy, b.w, b.h, 4 * s); }); }),
    detail: (c, g) => { let yy = 0; bk.forEach((b) => { yy -= b.h; c.fillStyle = rgb(LOOK.tone(b.col, g, 0.3)); c.fillRect(b.dx - b.w / 2 + 4 * s, yy + 3 * s, b.w - 8 * s, b.h - 6 * s);
      c.fillStyle = rgb(LOOK.tone('#f4ead2', g, 0.3)); c.fillRect(b.dx + b.w / 2 - 14 * s, yy + 6 * s, 8 * s, b.h - 12 * s); }); } };
};
PROPS.plant = ({ x = 0, y = 0, s = 1, color = '#c9784f' } = {}) => ({ id: 'plant', x, y, w: 260 * s, h: 380 * s, layer: 'mid', color,
  path: () => _P((p) => { p.moveTo(-62 * s, -130 * s); p.lineTo(62 * s, -130 * s); p.lineTo(48 * s, 0); p.lineTo(-48 * s, 0); p.closePath(); }),
  detail: (c, g, t) => { for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28 + Math.sin(t * 0.9 + i) * 0.03, L = (170 + 90 * hash(i, 2, 3)) * s;
    c.save(); c.translate(0, -125 * s); c.rotate(a + Math.PI / 2); c.fillStyle = rgb(LOOK.tone(i % 2 ? '#3f8f5a' : '#5aa86a', g, 0.35));
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(30 * s, -L * 0.5, 0, -L); c.quadraticCurveTo(-30 * s, -L * 0.5, 0, 0); c.fill(); c.restore(); } } });
PROPS.glass = ({ x = 0, y = 0, s = 1 } = {}) => ({ id: 'glass', x, y, w: 90 * s, h: 150 * s, layer: 'mid', color: '#a8c4dc', sink: 0.5, shadow: true,
  path: () => _P((p) => { p.moveTo(-42 * s, -150 * s); p.lineTo(42 * s, -150 * s); p.lineTo(34 * s, 0); p.lineTo(-34 * s, 0); p.closePath(); }),
  detail: (c, g) => { c.fillStyle = rgb(g.light, 0.25); c.fillRect(-36 * s, -95 * s, 72 * s, 90 * s); c.fillStyle = rgb(g.rim, 0.6); c.fillRect(-30 * s, -140 * s, 8 * s, 120 * s); } });
// bedside clock with glowing digits: time '23:48'
PROPS.clock = ({ x = 0, y = 0, s = 1, time = '23:48' } = {}) => ({ id: 'clock', x, y, w: 200 * s, h: 110 * s, layer: 'mid', color: '#22232e', sink: 0.1,
  path: () => _P((p) => _rr(p, -95 * s, -110 * s, 190 * s, 110 * s, 22 * s)),
  detail: (c, g) => { c.fillStyle = '#0b0c12'; c.beginPath(); c.roundRect(-78 * s, -95 * s, 156 * s, 72 * s, 10 * s); c.fill();
    c.fillStyle = '#ff6b5a'; c.font = `800 ${Math.round(54 * s)}px "Inter"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(time, 0, -58 * s); } });
PROPS.kettle = ({ x = 0, y = 0, s = 1, color = '#d8d4cc', flip = false } = {}) => { const m = flip ? -1 : 1;
  return { id: 'kettle', x, y, w: 300 * s, h: 280 * s, layer: 'mid', color,
  path: () => _P((p) => { p.moveTo(-95 * s * m, 0); p.lineTo(-80 * s * m, -190 * s); p.quadraticCurveTo(0, -225 * s, 80 * s * m, -190 * s); p.lineTo(95 * s * m, 0); p.closePath();
    p.moveTo(85 * s * m, -60 * s); p.quadraticCurveTo(150 * s * m, -90 * s, 170 * s * m, -175 * s); p.lineTo(150 * s * m, -180 * s); p.quadraticCurveTo(130 * s * m, -120 * s, 82 * s * m, -110 * s); p.closePath();
    _rr(p, -24 * s, -230 * s, 48 * s, 18 * s, 9 * s); }),
  detail: (c, g) => { c.strokeStyle = rgb(LOOK.tone('#202020', g, 0.2)); c.lineWidth = 16 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(-70 * s * m, -190 * s); c.bezierCurveTo(-150 * s * m, -200 * s, -150 * s * m, -60 * s, -90 * s * m, -40 * s); c.stroke();
    c.fillStyle = rgb(g.rim, 0.5); c.fillRect(40 * s * m - 6 * s, -170 * s, 12 * s, 150 * s); c.fillStyle = rgb(LOOK.tone('#202020', g, 0.2)); c.fillRect(-95 * s, -16 * s, 190 * s, 16 * s); } }; };
PROPS.bowl = ({ x = 0, y = 0, s = 1, color = '#e8e2d4', fruit = ['#e8a33a', '#d9483a', '#9cc24a'] } = {}) => ({ id: 'bowl', x, y, w: 260 * s, h: 140 * s, layer: 'mid', color,
  path: () => _P((p) => { p.moveTo(-125 * s, -80 * s); p.lineTo(125 * s, -80 * s); p.quadraticCurveTo(110 * s, 0, 0, 0); p.quadraticCurveTo(-110 * s, 0, -125 * s, -80 * s); }),
  detail: (c, g) => { fruit.forEach((f, i) => { const fx = (i - 1) * 62 * s, fy = -98 * s - (i === 1 ? 22 * s : 0); c.fillStyle = rgb(LOOK.tone(f, g, 0.3)); c.beginPath(); c.arc(fx, fy, 46 * s, 0, TAU); c.fill();
    c.fillStyle = rgb(g.rim, 0.55); c.beginPath(); c.arc(fx - 16 * s, fy - 16 * s, 11 * s, 0, TAU); c.fill(); c.strokeStyle = rgb(LOOK.tone('#4a3020', g, 0.2)); c.lineWidth = 6 * s; c.beginPath(); c.moveTo(fx, fy - 44 * s); c.lineTo(fx + 6 * s, fy - 66 * s); c.stroke();
    c.fillStyle = rgb(LOOK.tone('#4f9a4a', g, 0.3)); c.beginPath(); c.ellipse(fx + 20 * s, fy - 60 * s, 16 * s, 7 * s, -0.5, 0, TAU); c.fill(); }); } });
// a bed seen from its side, behind the bedside table (layer back). lump: something lies under the duvet
PROPS.bed = ({ x = 0, y = 0, s = 1, color = '#c9cfe0', lump = false, len = 1400, flip = false } = {}) => { const m = flip ? -1 : 1;
  return { id: 'bed', x, y, w: len * s, h: 520 * s, layer: 'back', color, sink: 0.3, shadow: false,
  path: () => _P((p) => { const l = len * s; _rr(p, -l / 2, -330 * s, l, 230 * s, 40 * s); _rr(p, m > 0 ? -l / 2 - 40 * s : l / 2 - 20 * s, -520 * s, 60 * s, 520 * s, 14 * s); p.rect(-l / 2, -110 * s, l, 110 * s); }),
  detail: (c, g, t) => { const l = len * s; c.save(); c.scale(m, 1);
    const pg = c.createLinearGradient(0, -400 * s, 0, -290 * s); pg.addColorStop(0, rgb(LOOK.tone('#ffffff', g, 0.15))); pg.addColorStop(1, rgb(LOOK.tone('#d8d4e4', g, 0.3)));
    c.fillStyle = pg; c.beginPath(); c.roundRect(-l / 2 + 30 * s, -400 * s, 280 * s, 120 * s, 56 * s); c.fill();
    const dv = rgb(LOOK.tone('#6f7fb8', g, 0.3)), br = 1 + 0.035 * Math.sin(t * 2.1);
    c.fillStyle = dv; c.beginPath(); c.moveTo(-l / 2 + 170 * s, -300 * s);
    if (lump) { c.bezierCurveTo(-l / 2 + 190 * s, -370 * s, -l / 2 + 330 * s, -390 * s * br, -l / 2 + 360 * s, -350 * s);     // head bump by the pillow
      c.bezierCurveTo(-l / 2 + 420 * s, -460 * s * br, -l / 2 + 700 * s, -470 * s * br, -l / 2 + 780 * s, -330 * s); }        // the body
    c.lineTo(l / 2, -300 * s); c.lineTo(l / 2, -150 * s); c.lineTo(-l / 2 + 170 * s, -150 * s); c.closePath(); c.fill();
    if (lump) { c.strokeStyle = rgb(g.rim, 0.5); c.lineWidth = 5 * s; c.beginPath(); c.moveTo(-l / 2 + 370 * s, -400 * s * br); c.bezierCurveTo(-l / 2 + 480 * s, -455 * s * br, -l / 2 + 640 * s, -455 * s * br, -l / 2 + 730 * s, -380 * s); c.stroke();
      c.strokeStyle = rgb(g.shade, 0.35); c.lineWidth = 6 * s; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-l / 2 + 420 * s + i * 90 * s, -330 * s); c.quadraticCurveTo(-l / 2 + 470 * s + i * 120 * s, -250 * s, -l / 2 + 450 * s + i * 150 * s, -160 * s); c.stroke(); } }
    c.restore(); } }; };
// a framed picture on the wall (layer back): a small abstract landscape
PROPS.frame = ({ x = 0, y = -500, w = 300, h = 220, color = '#2a2433' } = {}) => ({ id: 'frame', x, y, w, h, layer: 'back', color, sink: 0.2, shadow: false,
  path: () => _P((p) => _rr(p, -w / 2, -h, w, h, 6)),
  detail: (c, g) => { const ix = -w / 2 + 18, iy = -h + 18, iw = w - 36, ih = h - 36; const sk = c.createLinearGradient(0, iy, 0, iy + ih);
    sk.addColorStop(0, rgb(LOOK.tone('#f0b27a', g, 0.3))); sk.addColorStop(1, rgb(LOOK.tone('#f6e3c4', g, 0.3))); c.fillStyle = sk; c.fillRect(ix, iy, iw, ih);
    c.fillStyle = rgb(LOOK.tone('#5a6a8a', g, 0.3)); c.beginPath(); c.moveTo(ix, iy + ih); c.lineTo(ix + iw * 0.35, iy + ih * 0.35); c.lineTo(ix + iw * 0.6, iy + ih * 0.7); c.lineTo(ix + iw * 0.8, iy + ih * 0.5); c.lineTo(ix + iw, iy + ih); c.fill(); } });
