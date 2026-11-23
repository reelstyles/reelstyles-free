// =====================================================================
//  engine/look.js: the film look of the chat text story. The phone is a lit object in a real place (sets/scenes.js);
//  the conversation floats beside it in big bubbles. This file holds the grades per mood, the camera (parallax view),
//  the one light source with glow + rim, the air (dust), grain, bloom, vignette and the shot list helpers.
//  Load order: gsap → runtime → look → sets/props → sets/scenes → chat → film.js.
// =====================================================================
const LOOK = {};
const _hx = (v) => (typeof v === 'string' ? hex(v) : Array.isArray(v) && typeof v[0] === 'string' ? v.map(hex) : v);
const _grade = (o) => { const r = {}; for (const k in o) r[k] = _hx(o[k]); return r; };
// wall: top, bottom · surface: desk/counter top, its front · out: window view top, horizon · shade: what props sink to
// light: key light colour · glow: its strength · rim: lit edge · screen: the phone's own spill · dust · wash: overall tint
LOOK.GRADES = {
  night: _grade({ wall: ['#5868a2', '#8292c6'], surface: ['#b07858', '#7a5242'], out: ['#1d2a58', '#5a5f9a'], shade: '#1c2142', light: '#ffc98a', glow: 0.95, rim: '#ffd9a6', screen: '#9fb8ff', dust: '#ffe2b8', wash: '#2a2f6a', washA: 0.08 }),
  dread: _grade({ wall: ['#5a7a88', '#86a4ae'], surface: ['#928f88', '#646a6c'], out: ['#1f3240', '#4d6670'], shade: '#16232b', light: '#cfe8ff', glow: 0.7, rim: '#d8f0ff', screen: '#bfe2ff', dust: '#d8ecf4', wash: '#103a4a', washA: 0.14 }),
  dawn:  _grade({ wall: ['#8c7aa6', '#d3a9a6'], surface: ['#a87e63', '#7a5747'], out: ['#7c8fc4', '#ffcf9c'], shade: '#3a2f4c', light: '#ffe0b0', glow: 0.8, rim: '#fff0d6', screen: '#e8eeff', dust: '#fff0d8', wash: '#ff9a7a', washA: 0.06 }),
  day:   _grade({ wall: ['#c9c1ae', '#e2dac6'], surface: ['#b48a62', '#8a6446'], out: ['#73aee0', '#cfe6f2'], shade: '#4a4036', light: '#fff6e0', glow: 0.55, rim: '#fffaf0', screen: '#f4f7ff', dust: '#fff8e8', wash: '#ffe9c0', washA: 0.05 }),
  warm:  _grade({ wall: ['#8a4e46', '#c47a55'], surface: ['#9a5c3c', '#6a3a28'], out: ['#4a2c52', '#ff9e5e'], shade: '#2e1520', light: '#ffc46b', glow: 1.0, rim: '#ffd78a', screen: '#ffe8c8', dust: '#ffd9a0', wash: '#ff7a3a', washA: 0.08 }),
  neon:  _grade({ wall: ['#3c2a6a', '#6b3f8a'], surface: ['#4a3a6a', '#2c2248'], out: ['#140f3a', '#c04a9a'], shade: '#160c30', light: '#ff5fb0', glow: 1.0, rim: '#7ff0ff', screen: '#8ff6ff', dust: '#ffb0e0', wash: '#5a1f8a', washA: 0.1 }),
};
const _mixc = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
LOOK.mixc = _mixc;
LOOK.mix = (a, b, u) => { const r = {}; for (const k in a) { const x = a[k], y = b[k];
  r[k] = typeof x === 'number' ? lerp(x, y, u) : typeof x[0] === 'number' ? _mixc(x, y, u) : x.map((c, i) => _mixc(c, y[i], u)); } return r; };
const rgb = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
LOOK.rgb = rgb;
// a prop colour sunk into the grade: k 0 = the colour itself, 1 = the grade's shade
LOOK.tone = (col, g, k = 0.35) => _mixc(typeof col === 'string' ? hex(col) : col, g.shade, k);

// ---- shots (STORY.shots): { t0, t1, scene, set, grade, to, turn, cam: [[t, [x, y, zoom]], ...], float: 'l'|'r'|'b', caption }
LOOK.shotAt = (t) => { const S = LOOK.shots; for (let i = S.length - 1; i >= 0; i--) if (t >= S[i].t0) return S[i]; return S[0]; };
LOOK.camOf = (s, t) => { t = clamp(t, s.t0, s.t1); const k = s.cam || [0, 0, 1]; return Array.isArray(k[0]) ? kf(k, t) : k; };
LOOK.grade = (s, t) => { const a = LOOK.GRADES[s.grade || 'night'], b = LOOK.GRADES[s.to || s.grade || 'night'];
  if (a === b) return a; const tr = s.turn || [0, s.t1 - s.t0]; return LOOK.mix(a, b, ss(seg(t, s.t0 + tr[0], s.t0 + tr[1]))); };

// parallax view: p = 0 fixed to the screen, 1 = the subject plane (the phone), > 1 = near foreground
LOOK.view = (c, cam, p) => { const z = 1 + (cam[2] - 1) * p; c.setTransform(z, 0, 0, z, W / 2 - cam[0] * p * z, H / 2 - cam[1] * p * z); return z; };
LOOK.toScreen = (cam, x, y, p = 1) => { const z = 1 + (cam[2] - 1) * p; return [W / 2 + (x - cam[0] * p) * z, H / 2 + (y - cam[1] * p) * z]; };

// ---- one light source: a hot core, a wide soft glow (screen blend), flicker-free breathing
LOOK.glow = (c, x, y, r, col, a = 1) => {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'screen';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgb(col, 0.9 * a)); g.addColorStop(0.12, rgb(col, 0.45 * a)); g.addColorStop(0.45, rgb(col, 0.12 * a)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
};
// light pool: a soft warm ellipse on a wall or a surface, multiplied in brightness (not a flat disc)
LOOK.pool = (c, x, y, rx, ry, col, a) => {
  c.save(); c.globalCompositeOperation = 'soft-light'; c.translate(x, y); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgb(col, a)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(-rx, -rx, 2 * rx, 2 * rx); c.restore();
  c.save(); c.globalCompositeOperation = 'screen'; c.translate(x, y); c.scale(1, ry / rx);
  const h = c.createRadialGradient(0, 0, 0, 0, 0, rx * 0.8); h.addColorStop(0, rgb(col, a * 0.35)); h.addColorStop(1, rgb(col, 0));
  c.fillStyle = h; c.fillRect(-rx, -rx, 2 * rx, 2 * rx); c.restore();
};

// ---- props: contact shadow away from the light, rim pass toward the light, body, details
LOOK.props = (c, S, g, t, cam, layer) => {
  const [lx, ly] = S.light;
  for (const p of S.props) {
    if ((p.layer || 'mid') !== layer) continue;
    const dx = lx - p.x, dy = ly - (p.y - p.h * 0.5), d = Math.hypot(dx, dy) || 1, off = p.rimW || 4;
    c.save(); c.translate(p.x, p.y);
    if (p.shadow !== false) {
      const sh = c.createRadialGradient(-dx / d * p.w * 0.25, 2, 0, -dx / d * p.w * 0.25, 2, p.w * 0.75);
      sh.addColorStop(0, rgb(g.shade, 0.55)); sh.addColorStop(1, rgb(g.shade, 0));
      c.fillStyle = sh; c.save(); c.scale(1, 0.12); c.beginPath(); c.arc(-dx / d * p.w * 0.25, 0, p.w * 0.75, 0, TAU); c.restore(); c.fill();
    }
    const path = p.path ? p.path(t) : null;
    if (path) {
      c.save(); c.translate(dx / d * off, dy / d * off * 0.5); c.fillStyle = rgb(g.rim, 0.9); c.fill(path); c.restore();
      c.fillStyle = rgb(LOOK.tone(p.color || '#3a3550', g, p.sink ?? 0.35)); c.fill(path);
      // shading: the side away from the light darker
      c.save(); c.clip(path); const sg = c.createLinearGradient(-p.w / 2 * Math.sign(dx), 0, p.w / 2 * Math.sign(dx), 0);
      sg.addColorStop(0, rgb(g.shade, 0.45)); sg.addColorStop(1, rgb(g.shade, 0)); c.fillStyle = sg; c.fillRect(-p.w, -p.h * 1.2, p.w * 2, p.h * 1.4); c.restore();
    }
    if (p.detail) p.detail(c, g, t, cam);
    c.restore();
  }
};

// ---- air: dust motes drifting through the key light (deterministic from t)
LOOK.dust = (c, S, g, t, n = 70) => {
  const [lx, ly] = S.light, R = S.dustR || 520;
  for (let i = 0; i < n; i++) {
    const a = hash(i, 1, 7) * TAU, r = Math.sqrt(hash(i, 2, 7)) * R, sp = 8 + hash(i, 3, 7) * 18;
    const x = lx + Math.cos(a) * r + Math.sin(t * 0.5 + i) * 20, y = ly + 60 + ((Math.sin(a) * r * 0.8 - t * sp + 4 * R) % (1.6 * R)) - 0.8 * R;
    const fall = 1 - Math.min(1, Math.hypot(x - lx, y - ly) / R), tw = 0.5 + 0.5 * Math.sin(t * (1 + hash(i, 4, 7) * 2) + i);
    c.fillStyle = rgb(g.dust, 0.65 * fall * tw); c.beginPath(); c.arc(x, y, 1.6 + hash(i, 5, 7) * 2.6, 0, TAU); c.fill();
  }
};

// ---- grain: one seeded noise tile, shifted every frame
let _grain = null;
function _grainTile() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'), im = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = 128 + (hash(i, 3, 99) - 0.5) * 130; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); return g.createPattern(cv, 'repeat');
}
// ---- post: bloom around the light, grade wash, grain, vignette (screen space, every shot and the card)
LOOK.post = (c, g, t, lx, ly, bloom = 1) => {
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (lx != null) LOOK.glow(c, lx, ly, Math.max(W, H) * 0.75, g.light, 0.32 * g.glow * bloom);
  c.fillStyle = rgb(g.wash, g.washA); c.fillRect(0, 0, W, H);
  if (!_grain) _grain = _grainTile();
  const f = Math.floor(t * 30);
  c.save(); c.globalAlpha = 0.08; c.globalCompositeOperation = 'overlay';
  c.translate(-Math.floor(hash(f, 1, 5) * 256), -Math.floor(hash(f, 2, 5) * 256)); c.fillStyle = _grain; c.fillRect(0, 0, W + 256, H + 256); c.restore();
  const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, rgb(g.shade, 0.36)); c.fillStyle = vg; c.fillRect(0, 0, W, H);
};

// ---- caption (optional, one per shot): Inter 800 52 px on a plate; plate and text share one alpha. at: 'tl'|'tr'|'bl'|'br'
LOOK.box = null;
LOOK.caption = (c, t, s, g) => {
  LOOK.box = null; const k = s.caption; if (!k) return;
  const t0 = k.t0 == null ? s.t0 + 0.2 : k.t0, t1 = k.t1 == null ? s.t1 : k.t1;
  const a = Math.min(ss((t - t0) / 0.3), 1 - ss((t - t1 + 0.3) / 0.3)); if (a < 0.01) return;
  const px = Math.max(44, k.size || 52); c.setTransform(1, 0, 0, 1, 0, 0); c.font = `800 ${px}px "Inter"`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const tw = c.measureText(k.text).width, bw = tw + 56, bh = px * 1.6, at = k.at || 'bl', M = 90;
  const x = at[1] === 'l' ? M : W - M - bw, y = (at[0] === 't' ? M : H - M - bh) + (1 - a) * 12;
  c.globalAlpha = a; c.fillStyle = 'rgba(14,12,26,0.8)'; c.beginPath(); c.roundRect(x, y, bw, bh, 16); c.fill();
  c.fillStyle = '#FFC857'; c.fillRect(x, y + bh - 6, bw, 6); c.fillStyle = '#FFFFFF'; c.fillText(k.text, x + 28, y + bh / 2 + 1); c.globalAlpha = 1;
  LOOK.box = { kind: 'caption', name: k.text, px, x0: x, y0: y, x1: x + bw, y1: y + bh };
};

// ---- one scene frame: wall + window (far), surface, back props, light, mid props (phone), dust, near layer
LOOK.scene = (c, t, s, cam, g) => {
  const S = s.S; c.setTransform(1, 0, 0, 1, 0, 0);
  LOOK.view(c, cam, S.wallP); S.back(c, g, t, cam);                 // wall, window with its far view, wall decor
  LOOK.view(c, cam, S.wallP); LOOK.props(c, S, g, t, cam, 'back');
  LOOK.view(c, cam, 1); S.surface(c, g, t, cam);
  const [lx, ly] = S.light; LOOK.view(c, cam, 1);
  LOOK.pool(c, lx, S.y - 10, 900, 220, g.light, 0.55 * g.glow);    // light on the surface
  LOOK.pool(c, lx, ly - 40, 760, 640, g.light, 0.38 * g.glow);     // light on the wall
  LOOK.props(c, S, g, t, cam, 'mid');
  LOOK.dust(c, S, g, t);
  const ls = LOOK.toScreen(cam, lx, ly, 1); LOOK.glow(c, ls[0], ls[1], 380 * cam[2], g.light, g.glow);
  if (S.near) { LOOK.view(c, cam, 1.55); c.save(); c.filter = 'blur(9px)'; S.near(c, g, t, cam); c.restore(); c.filter = 'none'; }
  return ls;
};
