// =====================================================================
//  templates/film-v.js: 34 s VERTICAL 9:16 sample (1080x1920), "Brains beat brawn". Seventeen 2-second panels, each its own full-frame
//  picture (a new set, side, pose or framing every 2 s), six sets (street, roof, sky, pop, plant, dawn). Copy to film.js next to vertical.html (as index.html).
//  Scenes draw in SCREEN units (the set bleeds BL px past every edge); each panel's cam(lt) -> [cx, cy, zoom] pushes in a little (zoom 1.0-1.25).
//  HOUSE NUMBERS (they pass tools/vcheck.sh): ground g 1560-1640, hero s 2.3-3.0 = the whole hero at 33-48% of the frame (owner 11-02: wide, never a crop),
//    hero x 220-820 so the face stays inside x 65-940; the robot s 1.2-1.5 (it is the brute: bigger than him), tracked as the 'key' object when it is whole.
//  Labels: vlabel() in screen space after the scene, y 400 (the label band 270-500), lettering 76 px; bursts (sound effects) are art, keep them off faces.
//  HOOK: frame 0 is mid-stomp with the fact label on it ("Never punch a steel robot"), never a title. Hard cuts with a small panel slam, no wipes.
//  1 HOOK (0-4) the brute lands, the hero shrugs   2 TRY (4-12) run, leap, CLANK, OUCH   3 LOW (12-16) it laughs, he slumps
//  4 IDEA (16-26) the cable, the plant, the plug, YANK   5 PAYOFF (26-34) it powers down, he cheers, end card over the running payoff
// =====================================================================
const DUR = 34;
const PANELS = [];   // { t0, t1, draw(t, lt), cam(lt) }
const panel = (t0, draw, cam = () => [540, 960, 1]) => PANELS.push({ t0, t1: t0 + 2, draw, cam });
const push = (cx, cy, z0, z1, dx = 0, dy = 0) => (lt) => { const u = EZ.io(lt / 2); return [cx + dx * u, cy + dy * u, lerp(z0, z1, u)]; };
const SHAKES = [{ t: 0.25, amp: 18, dur: 0.4 }, { t: 8.3, amp: 22, dur: 0.45 }, { t: 24.35, amp: 14, dur: 0.35 }];
function shakeAt(t) {
  let x = 0, y = 0; const f = Math.floor(t * 12 + 1e-6);
  for (const s of SHAKES) if (t >= s.t && t < s.t + s.dur) { const k = (1 - (t - s.t) / s.dur) ** 2; x += (hash(f * 1.7) - 0.5) * 2 * s.amp * k; y += (hash(f * 2.9) - 0.5) * 2 * s.amp * k; }
  return [x, y];
}
// props
function bulb(x, y, lt) {   // idea bulb pops above the head
  const p = spring(lt / 0.4, 8, 0.4); if (lt < 0) return;
  kPush(); kTr(x, y, Math.sin(K.t * 6) * 3, p); grp(310);
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.2; shape(limb(Math.cos(a) * 110, Math.sin(a) * 110, Math.cos(a) * (150 + 10 * Math.sin(K.t * 12 + i)), Math.sin(a) * (150 + 10 * Math.sin(K.t * 12 + i)), 9), L.yellow, 5); }
  shape(ell(0, -10, 86, 92), L.yellow, 9); shape(ell(-30, -40, 18, 26), L.white, 0);
  shape(rrect(-42, 72, 84, 52, 10), L.steel, 8); shape(poly([[-42, 92], [42, 92]], false), [], 5, { fill: false });
  kPop();
}
function plug(x, y, rot, s = 1, cable = null) {   // side view: body, two brass prongs pointing +x; cable out of the back to [x, y] local
  kPush(); kTr(x, y, rot, s); grp(320);
  if (cable) shape((p) => { p.moveTo(-70, 0); p.bezierCurveTo(-200, 10, cable[0] * 0.4, cable[1], cable[0], cable[1]); }, [], 30, { fill: false });
  shape(rect(40, -40, 70, 22), L.yellow, 6); shape(rect(40, 18, 70, 22), L.yellow, 6);
  shape(rrect(-80, -66, 130, 132, 24), L.navy, 9); shape(rect(-58, -48, 22, 96), L.blue, 0);
  kPop();
}
function zzz(x, y, t) {
  for (let i = 0; i < 3; i++) { const u = (t * 0.5 + i / 3) % 1; txt(fitText('Z', 200, 70 + 30 * u), x + u * 90, y - u * 220, { fill: INK.c, stroke: INK.k, sw: 10 }); }
}

// 1. HOOK: the brute lands mid-stomp on frame 0
panel(0, (t, lt) => {
  setStreet(1600, { lampX: 130 });
  robot({ x: 700, y: 1600, s: 1.35, t, stomp: 1 - EZ.i2(lt / 0.25), mad: 1 });
  hero({ x: 260, y: 1600, s: 2.3, t, pose: 'idle', ex: 'shock' });
  burst({ s: 'STOMP!', x: 820, y: 1700, r: 200, n: 14, seed: 3, t0: 0.2, lt, size: 100, rot: 6 });
}, push(540, 1080, 1.0, 1.07, 0, -20));
panel(2, (t, lt) => {
  setRoof(1560, { towerX: 210, moonX: 300 });
  hero({ x: 660, y: 1560, s: 2.7, t, pose: 'idle', ex: 'smirk', flip: true });
}, push(640, 1160, 1.02, 1.1, -20, 0));
// 2. TRY: run, leap, CLANK, OUCH
panel(4, (t, lt) => {
  setStreet(1600, { lampX: 980, seed: 12 });
  const x = lerp(220, 560, lt / 2);
  streaks({ x: x - 520, y: 1000, w: 420, h: 520, dir: 1, n: 12, seed: 4 });
  hero({ x, y: 1600, s: 2.4, t, pose: 'run', ex: 'smirk' });
}, (lt) => [lerp(440, 600, lt / 2), 1080, 1.05]);
panel(6, (t, lt) => {
  setSky();
  const u = EZ.o2(lt / 2), x = lerp(440, 680, u), y = lerp(1560, 1380, u);
  streaks({ x: x - 640, y: y - 640, w: 520, h: 600, dir: 1, n: 14, seed: 6, paper: false });
  kPush(); kTr(x, y, -14); hero({ x: 0, y: 0, s: 2.6, t, pose: 'punch', ex: 'smirk' }); kPop();
  burst({ s: 'HI-YAH!', x: 330, y: 720, r: 210, n: 12, seed: 2, t0: 0.15, lt, size: 92, rot: -8 });
}, push(540, 1100, 1.0, 1.06));
panel(8, (t, lt) => {
  setStreet(1600, { lampX: 1000, seed: 17 });
  const hit = 0.3, post = lt - hit, back = post > 0 ? EZ.o3(post / 0.4) * 70 : 0;
  robot({ x: 720, y: 1600, s: 1.35, t, mad: 1 });
  hero({ x: lerp(250, 340, EZ.o2(lt / hit)) - back, y: 1600, s: 2.4, t, pose: 'punch', ex: post > 0 ? 'shock' : 'smirk' });
  if (post > 0.0 && post < 0.07) { grp(330); shape(rect(-BL, -BL, W + 2 * BL, H + 2 * BL), L.yellow, 0); }   // impact frame
  burst({ s: 'CLANK!', x: 700, y: 1060, r: 210, n: 15, seed: 5, t0: hit, lt, size: 100, rot: -7 });
  sparks({ x: 640, y: 1150, n: 9, r: 260, lt: post, seed: 2 });
}, push(580, 1080, 1.0, 1.05, 0, 10));
panel(10, (t, lt) => {
  setPop(760, 1150, { layers: L.pink, rays: [['y', 1]] });
  hero({ x: 520, y: 1640, s: 3.0, t, pose: 'shake', ex: 'ouch' });
  burst({ s: 'OUCH!', x: 250, y: 720, r: 190, n: 13, seed: 8, t0: 0.1, lt, size: 100, rot: -10 });
}, push(540, 1120, 1.0, 1.06));
// 3. LOW: it laughs, he slumps
panel(12, (t, lt) => {
  setRoof(1600, { towerX: 930, moonX: 180, seed: 4 });
  kPush(); kTr(540, 1600, Math.sin(t * 18) * 1.5); robot({ x: 0, y: 0, s: 1.5, t, mad: 0.6 }); kPop();
}, push(540, 1100, 1.0, 1.06, 0, -10));
panel(14, (t, lt) => {
  setStreet(1600, { lampX: 140, seed: 21 });
  robot({ x: 980, y: 1600, s: 1.7, t, mad: 1, track: false, flip: true });
  hero({ x: 400, y: 1600, s: 2.5, t, pose: 'slump' });
}, push(500, 1100, 1.02, 1.08, 20, 0));
// 4. IDEA: the cable, the plant, the plug, YANK
panel(16, (t, lt) => {
  setPop(470, 640, { layers: L.sky, rays: [['y', 1]] });
  hero({ x: 470, y: 1640, s: 3.0, t, pose: 'think', ex: 'think' });
  bulb(470, 640, lt - 0.5);
}, push(500, 1120, 1.0, 1.05));
panel(18, (t, lt) => {
  setStreet(1600, { lampX: 640, seed: 25 });
  robot({ x: 360, y: 1600, s: 1.2, t, mad: 1, cable: [740, -4] });
  hero({ x: 800, y: 1600, s: 2.3, t, pose: lt < 0.6 ? 'idle' : 'reach', ex: 'happy', flip: true });
}, push(520, 1100, 1.0, 1.06, 0, -10));
const PLUG_CABLE = (g) => { grp(340); shape((p) => { p.moveTo(-BL, g - 14); p.lineTo(820, g - 14); p.quadraticCurveTo(840, g - 14, 840, g - 60); p.lineTo(840, 1090); }, [], 30, { fill: false }); };
panel(20, (t, lt) => {
  setPlant(1640, { sockX: 820, sockY: 960 });
  PLUG_CABLE(1640);
  grp(341); shape(rrect(745, 880, 170, 190, 30), L.navy, 10); shape(rect(770, 900, 24, 150), L.blue, 0);
  kTrack('key', 690, 630, 950, 1110, 'socket');
  hero({ x: lerp(230, 420, lt / 2), y: 1640, s: 2.5, t, pose: 'walk', ex: 'smirk' });
}, (lt) => [lerp(520, 600, lt / 2), 1120, 1.02]);
panel(22, (t, lt) => {
  setPlant(1640, { sockX: 820, sockY: 960 });
  PLUG_CABLE(1640);
  grp(341); shape(rrect(745, 880, 170, 190, 30), L.navy, 10); shape(rect(770, 900, 24, 150), L.blue, 0);
  hero({ x: 560, y: 1640, s: 2.5, t, pose: 'reach', ex: 'shock' });
}, push(690, 1220, 1.2, 1.26, 0, -10));
panel(24, (t, lt) => {
  setPop(700, 900, { layers: L.red, rays: [['y', 1]] });
  const yank = EZ.back(lt / 0.35), x = 400 - 40 * yank;
  kPush(); kTr(x, 1640, -10 * yank); hero({ x: 0, y: 0, s: 2.7, t, pose: 'reach', ex: 'happy' }); kPop();
  plug(x + 300, 1150 - 30 * yank, -20 * yank, 1.3, [700, 600]);
  sparks({ x: x + 460, y: 1100, n: 10, r: 280, lt: lt - 0.3, seed: 4 });
  burst({ s: 'YANK!', x: 760, y: 700, r: 200, n: 14, seed: 11, t0: 0.3, lt, size: 104, rot: 8 });
}, push(540, 1100, 1.0, 1.05));
// 5. PAYOFF: it powers down, he cheers
panel(26, (t, lt) => {
  setStreet(1600, { lampX: 960, seed: 30 });
  robot({ x: 540, y: 1600, s: 1.45, t, mad: 0.4, power: 1 - EZ.io(seg(lt, 0.2, 1.4)) });
  burst({ s: 'WHIRRR...', x: 250, y: 620, r: 190, n: 16, seed: 13, t0: 0.6, lt, size: 80, rot: -6 });
}, push(540, 1080, 1.0, 1.06, 0, 10));
const DAWN = (t, lt, x, s, ex) => {
  setDawn(1600, { sunX: 700 });
  robot({ x: 820, y: 1600, s: 1.05, t, power: 0, track: false });
  zzz(860, 860, t);
  hero({ x, y: 1600, s, t, pose: 'cheer', ex });
};
panel(28, (t, lt) => DAWN(t, lt, 360, 2.6, 'happy'), push(520, 1100, 1.0, 1.06, 10, 0));
panel(30, (t, lt) => {
  setPop(560, 1100, { layers: L.cyan, rays: [['y', 1]] });
  hero({ x: 560, y: 1640, s: 3.0, t, pose: 'cheer', ex: 'happy' });
  burst({ s: 'WIN!', x: 840, y: 760, r: 170, n: 12, seed: 15, t0: 0.15, lt, size: 100, rot: 10 });
}, push(560, 1120, 1.0, 1.05));
panel(32, (t, lt) => DAWN(t, lt, 420, 2.4, 'happy'), push(560, 1060, 1.0, 1.04));
endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model']);

// labels (screen space, the label band): the fact on frame 0, two beats, the proverb at the payoff
const LABELS = [
  { s: 'Never punch a steel robot.', t0: 0, t1: 2 },
  { s: 'Watch this!', t0: 2, t1: 4, kind: 'say', tail: [560, 760] },
  { s: 'Puny hero!', t0: 12.2, t1: 14, kind: 'shout' },
  { s: 'Steel 1. Fist 0.', t0: 14.1, t1: 16 },
  { s: 'Then he saw the cable.', t0: 16, t1: 20 },
  { s: 'Brains beat brawn.', t0: 28, t1: 32 },
];

function frame(t) {
  const c = G; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#0d0a08'; c.fillRect(0, 0, W, H);
  const P = PANELS.find((p) => t >= p.t0 && t < p.t1) || PANELS[PANELS.length - 1], lt = t - P.t0;
  const [cx, cy, z] = P.cam(lt), [sx, sy] = shakeAt(t), slam = 1 + 0.035 * Math.max(0, 1 - lt / 0.12);   // each new panel lands with a small slam
  c.save(); c.translate(W / 2 + sx, H / 2 + sy); c.scale(z * slam, z * slam); c.translate(-cx, -cy);
  kBegin(0, 0, t); K.safe = null; P.draw(t, lt); flush(c, t);
  c.restore();
  c.setTransform(1, 0, 0, 1, 0, 0);
  kBegin(0, 0, t); for (const [i, l] of LABELS.entries()) vlabel({ ...l, t, y: l.y ?? 400, id: i }); flush(c, t);
  c.lineWidth = 26; c.strokeStyle = INK.k; c.strokeRect(13, 13, W - 26, H - 26);   // the panel border
  paperPost(c, t);
}
mountFilm(DUR, frame);
