// =====================================================================
//  sets/look.js: the film look layer of the guess-quiz kit (16:9 and 9:16). Load after engine/runtime.js, before sets/stage.js.
//  Every function is a pure function of the film time (TT) and its arguments.
//    GRADES[mood]               colour grade per mood: show | night | warm | tense | win (wall, floor, key light, rim, haze, tint, vig)
//    gradeMix(a, b, k)          blend two grades (mood turns inside a shot)
//    CAM                        the current camera {z, x, y}; shotCam(L, shots) picks the shot active at L and moves it
//    layer(k, fn)               draw fn in a depth layer: k 0.3 far (back wall), 1 mid (floor, hero), 1.5 near (foreground)
//    lightSource(x, y, r, col)  a visible lamp / sun: core + bloom
//    beam(x0, y0, x1, y1, w0, w1, col, a)   a light cone from a lamp to the floor
//    haze(g) · dust(t, x0, y0, w, h, col, n)   the moving air
//    contactShadow(x, y, w)     soft dark ellipse under anything that stands on a floor
//    finish(g, t)               grade tint + vignette + film grain over the whole frame (call last, in screen space)
// =====================================================================
const GRADES = {
  show:  { wall: ['#2B1D66', '#100833'], floor: ['#22164E', '#07041A'], key: '#FFF4CF', rim: '#A8EEFF', haze: 'rgba(170,150,255,0.10)', tint: 'rgba(0,0,0,0)', vig: 0.5, led: 1 },
  night: { wall: ['#14204A', '#04071A'], floor: ['#101A3C', '#03050F'], key: '#CFE0FF', rim: '#86AEFF', haze: 'rgba(120,150,255,0.10)', tint: 'rgba(20,40,140,0.16)', vig: 0.62, led: 0.7 },
  warm:  { wall: ['#5C2A14', '#1E0904'], floor: ['#3E1A0C', '#100402'], key: '#FFD58A', rim: '#FFB24A', haze: 'rgba(255,190,120,0.10)', tint: 'rgba(255,140,40,0.08)', vig: 0.5, led: 0.9 },
  tense: { wall: ['#46081F', '#13020A'], floor: ['#2E0614', '#080104'], key: '#FFB0B0', rim: '#FF4A5E', haze: 'rgba(255,60,90,0.12)', tint: 'rgba(200,0,40,0.14)', vig: 0.72, led: 0.75 },
  win:   { wall: ['#4A2A8C', '#1A0D48'], floor: ['#36206E', '#0E0628'], key: '#FFFFFF', rim: '#FFE14D', haze: 'rgba(255,230,150,0.14)', tint: 'rgba(255,210,90,0.06)', vig: 0.38, led: 1.25 },
};
const _hex = (c) => { if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255, 1]; } const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m[3] ?? 1]; };
const _mixC = (a, b, k) => { const A = _hex(a), B = _hex(b); return `rgba(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))},${lerp(A[3], B[3], k).toFixed(3)})`; };
function gradeMix(a, b, k) {
  a = typeof a === 'string' ? GRADES[a] : a; b = typeof b === 'string' ? GRADES[b] : b; k = clamp(k);
  if (k <= 0) return a; if (k >= 1) return b;
  return { wall: [0, 1].map((i) => _mixC(a.wall[i], b.wall[i], k)), floor: [0, 1].map((i) => _mixC(a.floor[i], b.floor[i], k)),
    key: _mixC(a.key, b.key, k), rim: _mixC(a.rim, b.rim, k), haze: _mixC(a.haze, b.haze, k), tint: _mixC(a.tint, b.tint, k),
    vig: lerp(a.vig, b.vig, k), led: lerp(a.led, b.led, k) };
}

// ---- camera: world = the 1920x1080 (or 1080x1920) set; CAM.x/y = world point at the frame centre, CAM.z = zoom
let CAM = { z: 1, x: W / 2, y: H / 2 };
// shots = [{ at, z0, z1, x0, x1, y0, y1 }]: each shot starts at local time `at`, eases from (z0,x0,y0) to (z1,x1,y1) until the next
// shot (a cut = a jump to the next shot's start values). Neighbouring shots must differ in z or x by a visible amount.
function shotCam(L, shots, dur) {
  let i = 0; while (i + 1 < shots.length && L >= shots[i + 1].at) i++;
  const s = shots[i], end = i + 1 < shots.length ? shots[i + 1].at : dur, k = EZ.io(seg(L, s.at, end));
  const g = (a, b, d) => lerp(s[a] ?? d, s[b] ?? s[a] ?? d, k);
  return { z: g('z0', 'z1', 1), x: g('x0', 'x1', W / 2), y: g('y0', 'y1', H / 2), shot: i, k };
}
function layer(k, fn) {
  const z = 1 + (CAM.z - 1) * k, dx = (CAM.x - W / 2) * k, dy = (CAM.y - H / 2) * k;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2 - dx, -H / 2 - dy); fn(); ctx.restore();
}
// world point → screen point for a layer of depth k (to put screen-space type next to a world object)
function toScreen(x, y, k = 1) { const z = 1 + (CAM.z - 1) * k; return [W / 2 + (x - W / 2 - (CAM.x - W / 2) * k) * z, H / 2 + (y - H / 2 - (CAM.y - H / 2) * k) * z]; }

// ---- light
function lightSource(x, y, r, col, a = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
  g.addColorStop(0, col); g.addColorStop(0.12, _mixC(col, 'rgba(255,255,255,0)', 0.45)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 6, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}
function beam(x0, y0, x1, y1, w0, w1, col, a = 0.3) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, _mixC(col, 'rgba(0,0,0,0)', 1 - a)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath();
  const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
  ctx.moveTo(x0 + (nx / l) * w0, y0 + (ny / l) * w0); ctx.lineTo(x1 + (nx / l) * w1, y1 + (ny / l) * w1);
  ctx.lineTo(x1 - (nx / l) * w1, y1 - (ny / l) * w1); ctx.lineTo(x0 - (nx / l) * w0, y0 - (ny / l) * w0); ctx.closePath(); ctx.fill();
  // pool of light where the beam lands
  const p = ctx.createRadialGradient(x1, y1, 0, x1, y1, w1 * 1.2);
  p.addColorStop(0, _mixC(col, 'rgba(0,0,0,0)', 1 - a * 1.2)); p.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = p; ctx.save(); ctx.translate(x1, y1); ctx.scale(1, 0.28); ctx.translate(-x1, -y1); ctx.beginPath(); ctx.arc(x1, y1, w1 * 1.2, 0, TAU); ctx.fill(); ctx.restore();
  ctx.restore();
}
function contactShadow(x, y, w, a = 0.55) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, w / 2);
  g.addColorStop(0, `rgba(5,0,20,${a})`); g.addColorStop(1, 'rgba(5,0,20,0)');
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.18); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w / 2, 0, TAU); ctx.fill(); ctx.restore();
}

// ---- air
function haze(g, y0 = H * 0.45, y1 = H) {
  const lg = ctx.createLinearGradient(0, y0, 0, y1); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.5, g.haze); lg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lg; ctx.fillRect(-400, y0, W + 800, y1 - y0);
}
function dust(t, x0, y0, w, h, col, n = 40, seed = 3) {
  const r = rng(seed); ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const px = r() * w, py = r() * h, v = 8 + r() * 22, sz = 1.5 + r() * 3.5, ph = r() * TAU;
    const x = x0 + ((px + Math.sin(t * 0.7 + ph) * 30) % w), y = y0 + ((py - t * v) % h + h) % h;
    ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2 + ph)); ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, sz, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---- finish: grade tint, vignette, grain (screen space, last)
let _GRAIN = null;
function _grainTile() {
  if (_GRAIN) return _GRAIN;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256), r = rng(77);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return (_GRAIN = c);
}
function finish(g, t, grain = 0.07) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g.tint; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(4,0,16,${g.vig})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const f = Math.floor(t * 30), ox = (f * 97) % 256, oy = (f * 61) % 256, tile = _grainTile();
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = grain;
  ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.translate(-ox, -oy); ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}
