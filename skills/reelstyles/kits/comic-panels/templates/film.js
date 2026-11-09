// =====================================================================
//  film.js: a 15 s sample page. Panels (quads on a 1920 x 1080 page), one scene function per panel, a camera path that pushes
//  into each panel until it fills the frame, an overlay for things that break the border, then a page turn to the end card.
//  Edit the PANELS (scene functions + view), SHOTS (arrive/leave times) and the end card; the engine does the print look.
// =====================================================================
const DUR = 15.2, TURN0 = 13.3, TURN1 = 13.72;

// ---------- panels: pts = the quad on the page, ox/oy/w/h = its bounding box (scene coordinates are local to it),
//            view = where the camera looks (world) and the part of the panel that is guaranteed on screen (iw x ih)
const PANELS = {
  A: { pts: [[40, 40], [760, 40], [744, 520], [40, 520]], ox: 40, oy: 40, w: 720, h: 480, view: [400, 280, 700, 470] },
  B: { pts: [[788, 40], [1880, 40], [1880, 520], [772, 520]], ox: 772, oy: 40, w: 1108, h: 480, view: [1330, 280, 1060, 470] },
  C: { pts: [[40, 548], [620, 548], [636, 1040], [40, 1040]], ox: 40, oy: 548, w: 596, h: 492, view: [330, 794, 570, 480] },
  D: { pts: [[648, 548], [1320, 548], [1304, 1040], [664, 1040]], ox: 648, oy: 548, w: 672, h: 492, view: [986, 794, 650, 480] },
  E: { pts: [[1348, 548], [1880, 548], [1880, 1040], [1332, 1040]], ox: 1332, oy: 548, w: 548, h: 492, view: [1612, 794, 530, 480] },
};
const cover = (v) => Math.max(W / v[2], H / v[3]);
// shots: arrive (camera has landed) / leave (camera starts moving to the next). z0 -> z1 is a slow push during the hold.
const SHOTS = [
  { id: 'page', a: 0, d: 1.5, cx: 960, cy: 540, z0: 1.0, z1: 1.05 },
  { id: 'A', a: 1.95, d: 3.6 }, { id: 'B', a: 4.05, d: 5.9 }, { id: 'C', a: 6.35, d: 7.9 }, { id: 'D', a: 8.35, d: 10.3 }, { id: 'E', a: 10.75, d: 11.9 },
  { id: 'page2', a: 12.35, d: TURN1 + 1, cx: 960, cy: 540, z0: 1.0, z1: 1.04 },
];
SHOTS.forEach((s, i) => {
  const P = PANELS[s.id];
  if (P) { const z = cover(P.view); s.cx = P.view[0]; s.cy = P.view[1]; s.z0 = z * 0.93; s.z1 = z * 1.03; s.pan = [(i % 2 ? -1 : 1) * 14, 6]; P.arr = s.a; P.z1 = s.z1; }
  const v = P ? P.view : null;
  if (P) { const hw = W / 2 / s.z1 - 22, hh = H / 2 / s.z1 - 22; P.safe = { x0: P.view[0] - P.ox - hw, x1: P.view[0] - P.ox + hw, y0: P.view[1] - P.oy - hh, y1: P.view[1] - P.oy + hh }; }
  s.pan = s.pan || [0, 0];
});
function hold(s, u) { return { cx: s.cx + s.pan[0] * u, cy: s.cy + s.pan[1] * u, z: lerp(s.z0, s.z1, u) }; }
function camAt(t) {
  for (let i = 0; i < SHOTS.length; i++) {
    const s = SHOTS[i];
    if (t >= s.a && t <= s.d) return { ...hold(s, (t - s.a) / (s.d - s.a)), rot: 0, mv: 0 };
    const n = SHOTS[i + 1];
    if (n && t > s.d && t < n.a) {
      const u = (t - s.d) / (n.a - s.d), e = EZ.io(u), A = hold(s, 1), B = hold(n, 0);
      return { cx: lerp(A.cx, B.cx, e), cy: lerp(A.cy, B.cy, e), z: Math.exp(lerp(Math.log(A.z), Math.log(B.z), e)), rot: Math.sin(u * Math.PI) * 0.012 * (B.cx > A.cx ? 1 : -1), mv: Math.sin(u * Math.PI), dx: B.cx - A.cx, dy: B.cy - A.cy };
    }
  }
  return { ...hold(SHOTS[SHOTS.length - 1], 1), rot: 0, mv: 0 };
}
// impacts shake the camera (stepped on twos)
const SHAKES = [{ t: PANELS.B.arr + 0.45, amp: 5, dur: 0.3 }, { t: PANELS.D.arr + 0.5, amp: 15, dur: 0.45 }];
function shakeAt(t) {
  let x = 0, y = 0; const f = Math.floor(t * 12 + 1e-6);
  for (const s of SHAKES) if (t >= s.t && t < s.t + s.dur) { const k = (1 - (t - s.t) / s.dur) ** 2; x += (hash(f * 1.7) - 0.5) * 2 * s.amp * k; y += (hash(f * 2.9) - 0.5) * 2 * s.amp * k; }
  return [x, y];
}

// ---------- scenes (local coordinates; t = film time, lt = time since the camera landed on this panel)
function sceneA(t, lt) {
  nightSky(720, 480, 360, 1);
  // moon with a dotted halo
  grp(20); shape(ell(560, 118, 96), [['y', 0.22]], 0, { fill: false });
  shape(ell(560, 118, 58), L.yellow, 6); shape(ell(540, 104, 12), [['y', 1], ['m', 0.35]], 0); shape(ell(580, 134, 8), [['y', 1], ['m', 0.35]], 0);
  skyline(720, 368, 2, L.dusk, 60, 150, true, 5);
  skyline(720, 420, 5, L.deep, 40, 110, true, 6);
  // rooftop
  grp(40); shape(poly([[0, 404], [720, 404], [720, 480], [0, 480]]), L.deep, 7);
  shape(poly([[0, 404], [720, 404]], false), [], 8, { fill: false });
  shape(rect(40, 350, 56, 56), L.black, 6); shape(rect(48, 372, 40, 6), L.yellow, 0, { fill: false });
  hero({ x: 508, y: 404, s: 1.05, flip: true, t, id: 41 });
  caption({ s: 'Midnight. Neon City.', x: 24, y: 96, size: 34, t0: 0.4, lt: t, maxW: 330, id: 1 });
}
function sceneB(t, lt) {
  grp(50); shape(rect(0, 0, 1108, 480), L.purple);
  sunburst(690, 220, 1200, 40, [['m', 0.45]], t * 0.02, true);
  skyline(1108, 480, 7, L.deep, 50, 150, false, 6);
  const lunge = EZ.o3(lt / 0.5);                                              // the brute leans in at the camera
  robotHead({ x: 690, y: 250, s: 1.12 * (0.84 + 0.16 * lunge) + Math.sin(t * 2) * 0.01, t, id: 51, mad: 1 });
  hero({ x: 160, y: 478, s: 0.8, t, id: 52 });
  burst({ s: 'CLANK!', x: 962, y: 110, r: 100, n: 11, seed: 3, t0: 0.5, lt, size: 56, rot: 8 });
  balloon({ s: 'Surrender, hero!', x: 330, y: 120, tail: [560, 200], size: 38, maxW: 300, t0: 0.95, lt, id: 1 });
}
function sceneC(t, lt) {
  grp(60); shape(rect(0, 0, 596, 492), L.skin);
  // helmet above the eyes and a cheek shadow below
  shape(poly([[-10, -10], [606, -10], [606, 170], [300, 140], [-10, 175]]), L.blue, 7);
  shape(poly([[-10, 330], [606, 345], [606, 500], [-10, 500]]), L.skinSh, 0, { fill: false });
  shape(poly([[-10, 200], [606, 200], [606, 318], [-10, 318]]), L.navy, 7);               // the mask band
  const look = Math.sin(t * 1.1) * 7, rp = 1 + Math.sin(t * 7) * 0.12;
  for (const ex of [168, 428]) {
    const dir = ex > 300 ? -1 : 1;
    grp(61 + ex);
    shape(blob([[ex - 78, 262], [ex - 40, 222], [ex + 40, 222], [ex + 78, 258], [ex + 30, 296], [ex - 40, 296]]), L.white, 6);
    shape(ell(ex + 6 + look, 258, 30, 30), L.cyan, 5); shape(ell(ex + 6 + look, 258, 14), L.black, 0);
    shape(ell(ex + 20 + look, 244, 7), L.white, 0);
    shape(ell(ex + 2 + look, 262, 7 * rp), L.red, 0);                                        // the robot's eye, mirrored
    shape(poly([[ex - 90 * dir, 176], [ex + 84 * dir, 220], [ex + 86 * dir, 200], [ex - 88 * dir, 158]]), L.black, 4);
  }
  // glint sweeps across the mask forever
  const gx = -140 + 900 * ((t / 1.8) % 1);
  grp(64); shape(poly([[gx, 190], [gx + 38, 190], [gx - 52, 330], [gx - 90, 330]]), L.white, 0);
  speedLines({ x: 298, y: 258, r0: 300, r1: 470, n: 26, seed: 7, w: 14 });
  balloon({ s: 'Not today.', x: 300, y: 112, tail: [300, 232], size: 42, maxW: 300, t0: 0.5, lt, id: 2 });
}
function sceneD(t, lt) {
  grp(70); shape(rect(0, 0, 672, 492), L.cyan);
  sunburst(380, 250, 900, 36, [['c', 0.3]], -t * 0.03, true);
  const hit = 0.5, post = lt - hit;
  // fist flies in on twos, then leans into the jaw
  const fx = lt < 0.34 ? -230 : lt < hit ? lerp(-230, 214, EZ.o2((q12(lt) - 0.34) / (hit - 0.34 - 0.04))) : 214 + Math.min(post, 1.5) * 10;
  const rx = post < 0 ? 0 : EZ.o3(post / 0.35) * 55 + Math.max(0, post) * 6;
  robotHead({ x: 470 + rx, y: 248 - Math.sin(post * 4) * 2, s: 0.98, rot: post < 0 ? 0 : 14 * EZ.o3(post / 0.25), t, id: 71, mad: post < 0 ? 1 : 0 });
  streaks({ x: 0, y: 60, w: 340, h: 380, dir: 1, n: 12, seed: 4 });
  fist({ x: fx, y: 262, s: 1.0, t, id: 72 });
  if (post > 0.02 && post < 0.1) shape(rect(0, 0, 672, 492), L.yellow, 0);                  // impact frame: the panel blanks for 3 frames
  sparks({ x: 360, y: 190, n: 9, r: 230, lt: post - 0.1, seed: 2 });
}
function sceneE(t, lt) {
  nightSky(548, 492, 400, 3);
  grp(80); shape(ell(110, 96, 40), L.yellow, 5);
  skyline(548, 492, 9, L.deep, 60, 130, true, 6);
  const u = clamp(lt / 1.6), px = lerp(120, 450, EZ.o2(u)) + lt * 8, py = lerp(380, 110, EZ.o2(u)) - lt * 6;
  streaks({ x: 60, y: 120, w: 300, h: 260, dir: 1, n: 10, seed: 6, paper: true });
  robotHead({ x: px, y: py, s: 0.34 * (1 - 0.25 * u), rot: lt * 240, t, id: 81, mad: 0 });
  burst({ s: 'ZOOM!', x: 190, y: 190, r: 92, n: 10, seed: 8, t0: 0.15, lt, size: 52, rot: -10 });
  caption({ s: 'Case closed.', x: 20, y: 400, size: 34, t0: 0.55, lt, maxW: 300, id: 3 });
}
PANELS.A.scene = sceneA; PANELS.B.scene = sceneB; PANELS.C.scene = sceneC; PANELS.D.scene = sceneD; PANELS.E.scene = sceneE;
const ORDER = ['A', 'B', 'C', 'D', 'E'];

// ---------- things that break the panel border (world coordinates, drawn unclipped after all panels)
function overlay(t) {
  kBegin(0, 0, t); K.safe = null;
  const B = PANELS.B, D = PANELS.D;
  // the claw reaches out of panel B over the gutter into E
  const lb = t - B.arr - 0.3;
  if (lb > 0) { const e = EZ.o3(lb / 0.5); kPush(); kTr(1790, 360, 128); kTr(-170 * (1 - e), 0); claw({ x: 0, y: 0, s: 0.72, t, curl: 0.4 + 0.3 * Math.sin(t * 2.4), id: 91 }); kPop(); }
  // BAM breaks out of the top of panel D
  burst({ s: 'BAM!', x: D.ox + 372, y: D.oy + 150, r: 200, n: 15, seed: 5, t0: D.arr + 0.55, lt: t, size: 150, rot: -7 });
}

// ---------- page
function clipQuad(c, pts) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
function drawPanel(c, P, i, t) {
  const pop = spring((t - (i * 0.09 - 0.12)) / 0.35, 8, 0.5);
  if (pop <= 0.002) return;
  const cx = P.ox + P.w / 2, cy = P.oy + P.h / 2;
  c.save(); c.translate(cx, cy); c.scale(pop, pop); c.rotate((1 - pop) * 0.05 * (i % 2 ? 1 : -1)); c.translate(-cx, -cy);
  clipQuad(c, P.pts); c.save(); c.clip();
  c.fillStyle = PAPER; c.fillRect(P.ox, P.oy, P.w, P.h);
  kBegin(P.ox, P.oy, t); K.safe = P.safe; P.scene(t, t - P.arr); flush(c, t);
  c.restore();
  clipQuad(c, P.pts); c.lineWidth = 12; c.lineJoin = 'miter'; c.strokeStyle = INK.k; c.stroke();
  c.restore();
}
function drawPage1(c, t) {
  c.fillStyle = '#0d0a08'; c.fillRect(0, 0, W, H);
  ORDER.forEach((id, i) => drawPanel(c, PANELS[id], i, t));
  overlay(t); flush(c, t);
}
function drawPage2(c, t) {
  const u = t - TURN0;
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  kBegin(0, 0, t); K.safe = { x0: 40, x1: W - 40, y0: 40, y1: H - 40 };
  sunburst(960, 500, 1500, 48, [['c', 0.55]], t * 0.05);
  grp(95); shape(rect(0, 0, W, 120), L.black, 0); shape(rect(0, H - 120, W, 120), L.black, 0);
  burst({ s: 'To be continued!', x: 960, y: 520, r: 420, n: 18, seed: 9, t0: TURN0 + 0.22, lt: t, size: 150, rot: -4 });
  caption({ s: 'Next: the brute returns', x: 730, y: 880, size: 44, t0: TURN0 + 0.9, lt: t, maxW: 800, id: 4 });
  flush(c, t);
}
function frame(t) {
  const c = G; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#0d0a08'; c.fillRect(0, 0, W, H);
  const cam = camAt(Math.min(t, SHOTS[SHOTS.length - 1].a + 0.01)), [sx, sy] = shakeAt(t);
  if (t >= TURN0) drawPage2(c, t);
  if (t < TURN1) {
    const p = seg(t, TURN0, TURN1), e = EZ.i2(p), off = -W * 1.2 * e;
    if (p > 0) {                                                                   // shadow the turning page throws
      const g = c.createLinearGradient(W + off, 0, W + off + 140, 0); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(W + off, 0, 140, H);
    }
    c.save(); c.translate(off, -40 * e); c.rotate(-0.07 * e);
    c.translate(W / 2 + sx, H / 2 + sy); c.rotate(cam.rot); c.scale(cam.z, cam.z); c.translate(-cam.cx, -cam.cy);
    drawPage1(c, t);
    c.restore();
  }
  // whoosh streaks while the camera travels between panels
  if (cam.mv > 0.05) {
    const f = Math.floor(t * 12), ang = Math.atan2(cam.dy || 0, cam.dx || 1) + Math.PI;
    c.save(); c.translate(W / 2, H / 2); c.rotate(ang); c.fillStyle = 'rgba(21,17,14,0.55)';
    for (let i = 0; i < 16; i++) { const y = (hash(i * 3.3) - 0.5) * H * 1.2, len = 300 + hash(i + f * 0.3) * 700, x = (hash(i * 1.1 + f * 0.17) - 0.5) * W * 1.3, th = (2 + hash(i * 7) * 7) * cam.mv; c.fillRect(x - len / 2, y, len, th); }
    c.restore();
  }
  paperPost(c, t);
}
mountFilm(DUR, frame);
