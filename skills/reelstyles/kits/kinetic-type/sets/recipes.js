// =====================================================================
//  sets/recipes.js: three full, lit places for any story (load after engine/look.js). Each recipe registers one shot.
//  Frame 0 of every shot is already the whole set: sky or back wall, floor, light, 3+ props, near layer, air, grain.
//    setStreet(t0, t1, o)   outdoors: sky + light (sun/moon/neon), a skyline of TYPE TOWERS (o.far words), haze, a street floor
//    setRoom(t0, t1, o)     indoors: back wall with dot grid + a painted poster word (o.far), window or lamp light, plank floor
//    setStage(t0, t1, o)    a theatre: pleated backdrop, a spotlight cone from above, a round stage, footlights
//  o.floor 'wet' (street default) | 'tile' (room) | 'grid' (stage) | 'platform' (yellow edge + track gap) | 'boards'
//  o.back  wall / horizon furniture, see _ktBack: 'rows' (lit board) · 'windows' · 'seats' · 'pillars' · 'train'. o.far: null = no skyline
//  o: { mood (GRADES key), light: {kind, x, y, level}, far: ['WORD', ...], props: [[kind, x, z, arg, col]...],
//       subject: (t, S) => {...}, near: 'WORD', air: 'dust'|'rain'|..., cam: camMove(...), caption: [text, t0] }
//  S (passed to subject): { FY (subject floor line), base(z) (floor y at depth z 0 back - 1 front), sc(z) (prop scale), G (grade), c (cam) }
//  Props (type-made set dressing, standing on the floor at x, depth z 0-1):
//    'block'  arg = one big letter or digit, a lit slab      'sign'   arg = short text on a plate on a post
//    'board'  arg = amber text on a dark display board       'plinth' arg = word on the front of a lit box
//    'lamp'   a post lamp (its glow is decor, not the scene light)
// =====================================================================
const KT_HY = { street: 0.55, room: 0.62, stage: 0.6 };   // horizon / wall foot as a share of H

function _ktBase(hy, z) { return lerp(H * hy + 8, H - 50, z); }   // z 1 still leaves the feet 50 px inside the frame
function _ktScale(hy, z) { return 0.42 + z * 0.95; }

function _ktSky(G, t, hy) {
  const g = ctx.createLinearGradient(0, -200, 0, H * hy); g.addColorStop(0, G.sky[0]); g.addColorStop(1, G.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(-600, -400, W + 1200, H * hy + 400);
  const x = W * 0.3 + Math.sin(t * 0.5) * 120, y = H * 0.25 + Math.cos(t * 0.4) * 50, b = ctx.createRadialGradient(x, y, 0, x, y, 800);   // drifting colour blob (the kit's stage)
  b.addColorStop(0, _rgba(G.blob, 0.28)); b.addColorStop(1, _rgba(G.blob, 0)); ctx.fillStyle = b; ctx.fillRect(-600, -400, W + 1200, H * hy + 400);
}
let KT_WET = false;   // litWord draws a reflection when the floor is wet
function _ktFloor(G, t, hy, c, kind, mat) {
  const y0 = H * hy, g = ctx.createLinearGradient(0, y0, 0, H + 80);
  g.addColorStop(0, G.floor[0]); g.addColorStop(1, G.floor[1]); ctx.fillStyle = g; ctx.fillRect(-600, y0, W + 1200, H - y0 + 300);
  // perspective rails toward a vanishing point that follows the camera (parallax for free)
  const vx = W / 2 + c.x * 0.3; ctx.strokeStyle = G.line; ctx.lineWidth = 3;
  const rails = (n, step, spread) => { for (let i = -n; i <= n; i++) { ctx.beginPath(); ctx.moveTo(vx + i * step, y0); ctx.lineTo(vx + i * spread, H + 300); ctx.stroke(); } };
  const rows = (n, pw) => { for (let k = 0; k < n; k++) { const y = y0 + (H + 300 - y0) * ((k + 1) / n) ** pw; ctx.lineWidth = 2 + k * 0.4; ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(W + 600, y); ctx.stroke(); } };
  if (mat === 'grid') { rails(14, 40, 420); rows(9, 1.8); }
  else if (mat === 'tile') { ctx.globalAlpha = 0.7; rails(7, 80, 640); rows(6, 1.6); ctx.globalAlpha = 1; }
  else if (mat === 'boards') { ctx.globalAlpha = 0.6; rails(20, 28, 260); ctx.globalAlpha = 1; }
  else {   // 'wet' (asphalt) and 'platform' (concrete + yellow edge): sheen streaks that slide with the camera
    const r = mulberry32(5);
    for (let k = 0; k < 26; k++) { const y = y0 + 10 + (H - y0) * r() ** 1.4, x = r() * (W + 800) - 400 - c.x * 0.6, w = 120 + r() * 420;
      ctx.fillStyle = _rgba(G.hz, 0.05 + r() * 0.08); ctx.fillRect(x, y, w, 3 + r() * 4); }
    if (mat === 'platform') {
      const ey = _ktBase(hy, 0.93), g2 = ctx.createLinearGradient(0, ey, 0, H + 80);
      ctx.fillStyle = PAL.amber; ctx.fillRect(-600, ey - 26, W + 1200, 22);   // safety edge
      ctx.fillStyle = 'rgba(12,11,22,0.55)'; for (let x = -600 - (c.x % 40); x < W + 600; x += 40) ctx.fillRect(x, ey - 20, 10, 10);
      g2.addColorStop(0, '#05040C'); g2.addColorStop(1, '#000000'); ctx.fillStyle = g2; ctx.fillRect(-600, ey - 4, W + 1200, H);   // track gap
    }
    // the light's reflection: a vertical streak on the wet floor
    const rf = ctx.createLinearGradient(0, y0, 0, H); rf.addColorStop(0, _rgba(LIGHT.col, 0.35)); rf.addColorStop(1, _rgba(LIGHT.col, 0));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rf; ctx.fillRect(LIGHT.x - 50, y0, 100, H - y0); ctx.restore();
  }
  // light pool on the floor under the light
  const lx = LIGHT.x, p = ctx.createRadialGradient(lx, y0 + 140, 0, lx, y0 + 140, 900);
  p.addColorStop(0, _rgba(LIGHT.col, 0.22)); p.addColorStop(1, _rgba(LIGHT.col, 0));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p; ctx.fillRect(-600, y0, W + 1200, H - y0 + 300); ctx.restore();
  // the horizon edge catches the light
  ctx.fillStyle = _rgba(G.hz, 0.5); ctx.fillRect(-600, y0 - 2, W + 1200, 4);
}
// far skyline: towers whose windows are the letters of the far words (one letter per floor)
function _ktSkyline(G, t, hy, words) {
  const y0 = H * hy, r = mulberry32(31); let x = -500;
  const list = (words && words.length ? words : ['CITY', 'NIGHT', 'TOWN']);
  let n = 0;
  while (x < W + 500) {
    const wd = list[n % list.length], fs = 34 + r() * 18, wTower = fs * 1.5 + 40 + r() * 50, h = Math.min(wd.length, 7) * fs * 1.15 + 80 + r() * 260;
    ctx.fillStyle = _mixHex(G.wall, G.fog, 0.25 + r() * 0.3); ctx.fillRect(x, y0 - h, wTower, h + 4);
    ctx.fillStyle = _rgba(G.hz, 0.35); ctx.fillRect(x, y0 - h, wTower, 4);
    ctx.font = `${Math.round(fs)}px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    [...wd].slice(0, 7).forEach((ch, i) => { const on = Math.sin(t * 0.8 + n * 3 + i * 1.9) > -0.6;
      ctx.fillStyle = on ? _rgba(LIGHTS.window.col, 0.75) : _rgba(G.fog, 0.7); ctx.fillText(ch, x + wTower / 2, y0 - h + 50 + i * fs * 1.15); });
    x += wTower + 18 + r() * 60; n++;
  }
  const hz = ctx.createLinearGradient(0, y0 - 260, 0, y0 + 10);   // haze swallows the tower feet: depth
  hz.addColorStop(0, _rgba(G.fog, 0)); hz.addColorStop(1, _rgba(G.fog, 0.75)); ctx.fillStyle = hz; ctx.fillRect(-600, y0 - 260, W + 1200, 270);
}
function _ktWall(G, t, hy, words, kind) {
  const y0 = H * hy;
  ctx.fillStyle = G.wall; ctx.fillRect(-600, -400, W + 1200, y0 + 400);
  if (kind === 'stage') {   // pleated backdrop
    for (let x = -600; x < W + 600; x += 90) { const g = ctx.createLinearGradient(x, 0, x + 90, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(0.5, _rgba(G.blob, 0.16)); g.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = g; ctx.fillRect(x, -400, 90, y0 + 400); }
  } else {   // panels + the kit's dot grid
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = -600; x < W + 600; x += 320) ctx.fillRect(x, -400, 6, y0 + 400);
    ctx.fillStyle = _rgba('#F6F1E7', 0.09); const o = (t * 14) % 60;
    for (let y = -60; y < y0; y += 60) for (let x = -600; x < W + 600; x += 60) ctx.fillRect(x + o, y + o * 0.5, 4, 4);
  }
  if (words && words[0]) {   // the poster word painted big on the back wall (ghost, outline)
    ctx.save(); ctx.globalAlpha = 0.16; word(words[0], W / 2 + Math.sin(t * 0.3) * 30, Math.min(y0 * 0.3, 190), 260, t, { outline: 6, col: PAL.cream, cond: 0.82, anim: 'fade', t0: -9, idle: 0.3, free: true });
    ctx.restore();
  }
  const b = ctx.createLinearGradient(0, y0 - 40, 0, y0); b.addColorStop(0, 'rgba(0,0,0,0)'); b.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = b; ctx.fillRect(-600, y0 - 40, W + 1200, 40);   // skirting shade
  const lit = ctx.createRadialGradient(LIGHT.x, LIGHT.y, 0, LIGHT.x, LIGHT.y, 1100);   // the wall lit around the source
  lit.addColorStop(0, _rgba(LIGHT.col, 0.22)); lit.addColorStop(1, _rgba(LIGHT.col, 0));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = lit; ctx.fillRect(-600, -400, W + 1200, y0 + 400); ctx.restore();
}

// ---------- back furniture: o.back = [[kind, ...args]] on the wall / horizon layer (fills the upper frame with the place)
//   ['rows', title, [lines], hi]  a lit board of rows (departures, menu, scores, prices); row hi blinks amber
//   ['windows']  a strip of windows with lights streaking past (carriage, bus, plane)   ['seats']  seat backs along the wall foot
//   ['pillars']  hall columns with a lit edge   ['train', word]  a carriage body standing on the horizon, lit windows, livery word
function _ktBack(G, t, hy, list) {
  const y0 = H * hy;
  (list || []).forEach(([k, a, b, hi]) => {
    if (k === 'pillars') for (let x = -200; x < W + 400; x += 520) { ctx.fillStyle = _mixHex(G.wall, '#000000', 0.35); ctx.fillRect(x, -400, 90, y0 + 400);
      ctx.fillStyle = _rgba(LIGHT.col, 0.35); ctx.fillRect(LIGHT.x > x ? x + 84 : x, -400, 6, y0 + 400); }
    if (k === 'rows') {
      const L = b || [], bw = 980, rh = 64, bh = 110 + L.length * rh, bx = W / 2 - bw / 2 - 200, by = 40;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(bx + 14, by + 18, bw, bh);
      ctx.fillStyle = '#07060F'; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = _rgba(LIGHT.col, 0.6); ctx.fillRect(bx, by, bw, 5);
      ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = `800 46px ${UI}`; ctx.fillStyle = PAL.cream; ctx.fillText(a || '', bx + 40, by + 56);
      L.forEach((ln, i) => { const on = i === hi, blink = on && Math.sin(t * 9) > -0.3;
        ctx.fillStyle = on ? (blink ? PAL.amber : _rgba(PAL.amber, 0.5)) : _rgba(PAL.cream, 0.55); ctx.font = `800 44px ${UI}`;
        if (on) { ctx.save(); ctx.shadowColor = PAL.amber; ctx.shadowBlur = 16; }
        ctx.fillText(ln, bx + 40, by + 130 + i * rh); if (on) ctx.restore(); });
      ctx.restore();
    }
    if (k === 'windows') for (let x = -300; x < W + 300; x += 430) {
      const wy = y0 * 0.18, wh = y0 * 0.42; ctx.fillStyle = '#05040C'; ctx.beginPath(); ctx.roundRect(x, wy, 340, wh, 40); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, wy, 340, wh, 40); ctx.clip();
      for (let j = 0; j < 5; j++) { const lx = ((j * 260 + 377 * Math.floor(x) - t * 900) % 1400 + 1400) % 1400 - 300 + x; ctx.fillStyle = _rgba(j % 2 ? PAL.amber : PAL.cream, 0.7); ctx.fillRect(lx, wy + wh * (0.3 + j * 0.1), 120, 5); }
      ctx.restore(); ctx.strokeStyle = _rgba(LIGHT.col, 0.5); ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(x, wy, 340, wh, 40); ctx.stroke();
    }
    if (k === 'seats') for (let x = -200; x < W + 300; x += 300) { ctx.fillStyle = _mixHex(G.wall, PAL.coral, 0.35); ctx.beginPath(); ctx.roundRect(x, y0 - 170, 230, 190, 30); ctx.fill();
      ctx.fillStyle = _rgba(LIGHT.col, 0.35); ctx.fillRect(x + 20, y0 - 166, 190, 8); }
    if (k === 'train') {
      const ty = y0 - 360; ctx.fillStyle = _mixHex(G.wall, '#8A96B0', 0.35); ctx.fillRect(-600, ty, W + 1200, 360);
      ctx.fillStyle = _rgba(LIGHT.col, 0.5); ctx.fillRect(-600, ty, W + 1200, 6);
      for (let x = -560; x < W + 600; x += 300) { ctx.fillStyle = _rgba(LIGHTS.window.col, 0.85); ctx.beginPath(); ctx.roundRect(x, ty + 50, 200, 120, 18); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; for (let x = -260; x < W + 600; x += 1200) ctx.fillRect(x, ty + 30, 160, 330);
      if (a) { ctx.save(); ctx.globalAlpha = 0.5; ctx.font = `110px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.ink; ctx.fillText(a, W / 2, ty + 260); ctx.restore(); }
    }
  });
}

// ---------- props
function ktProp(kind, x, base, s, t, arg, col, G) {
  const c = col ?? PAL.cream;
  if (kind === 'block') { litWord(String(arg ?? 'A'), x, base, 260 * s, t, { col: c, anim: 'fade', t0: -9, idle: 0.4, drift: 0.2, cast: 0.4, free: true }); return; }
  if (kind === 'lamp') {
    const h = 420 * s; ctx.fillStyle = '#0C0B16'; ctx.fillRect(x - 6 * s, base - h, 12 * s, h); ctx.fillRect(x - 30 * s, base - 8 * s, 60 * s, 8 * s);
    ctx.fillRect(x - 4 * s, base - h, 60 * s, 8 * s);
    lightDraw({ kind: 'lamp', x: x + 56 * s, y: base - h + 22 * s, r: 16 * s }, t);
    lightCone(x + 56 * s, base - h + 22 * s, base, 30 * s, 260 * s, LIGHTS.lamp.col, 0.12); return;
  }
  ctx.save(); ctx.font = `800 ${Math.max(30, Math.round((kind === 'board' ? 78 : 48) * s))}px ${UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const txt = String(arg ?? ''), tw = ctx.measureText(txt).width + 0.08 * 48 * s * txt.length;
  const sh = ctx.createRadialGradient(x, base, 0, x, base, tw * 0.6 + 40); sh.addColorStop(0, 'rgba(0,0,0,0.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.translate(x, base); ctx.scale(1, 0.1); ctx.translate(-x, -base); ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x, base, tw * 0.6 + 40, 0, TAU); ctx.fill(); ctx.restore();
  const sideL = Math.sign(LIGHT.x - x) || 1;
  if (kind === 'sign' || kind === 'board') {
    const pw = tw + 70 * s, ph = (kind === 'board' ? 140 : 90) * s, py = base - (kind === 'board' ? 230 : 330) * s;
    ctx.fillStyle = '#0C0B16'; ctx.fillRect(x - (kind === 'board' ? pw * 0.38 : 5 * s), py, 10 * s, base - py); if (kind === 'board') ctx.fillRect(x + pw * 0.38 - 10 * s, py, 10 * s, base - py);
    ctx.fillStyle = _rgba(LIGHT.col, 0.9); ctx.beginPath(); ctx.roundRect(x - pw / 2 + sideL * 4, py - ph / 2 - 4, pw, ph, 10 * s); ctx.fill();   // rim
    ctx.fillStyle = kind === 'board' ? '#0C0B16' : (col ?? PAL.amber); ctx.beginPath(); ctx.roundRect(x - pw / 2, py - ph / 2, pw, ph, 10 * s); ctx.fill();
    const tc = kind === 'board' ? (col ?? PAL.amber) : PAL.ink;
    if (kind === 'board') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = tc; ctx.shadowBlur = 18; ctx.fillStyle = tc; ctx.fillText(txt, x, py + 2); ctx.restore(); }
    else { ctx.fillStyle = tc; ctx.fillText(txt, x, py + 2); }
  } else if (kind === 'plinth') {
    const pw = Math.max(tw + 80 * s, 260 * s), ph = 150 * s;
    ctx.fillStyle = _mixHex(G.wall, '#000000', 0.2); ctx.fillRect(x - pw / 2, base - ph, pw, ph);
    ctx.fillStyle = _mixHex(G.hz, G.wall, 0.4); ctx.fillRect(x - pw / 2, base - ph - 20 * s, pw, 22 * s);   // lit top face
    ctx.fillStyle = _rgba(LIGHT.col, 0.6); ctx.fillRect(sideL > 0 ? x + pw / 2 - 6 : x - pw / 2, base - ph, 6, ph);
    ctx.fillStyle = col ?? PAL.cream; ctx.fillText(txt, x, base - ph / 2);
  }
  ctx.restore();
}

// ---------- near layer: giant blurred letters at the frame corners, dark (foreground depth)
function _ktNear(G, t, str) {
  if (!str) return;
  ctx.save(); ctx.filter = 'blur(12px)'; ctx.globalAlpha = 0.85;
  const s = 620, col = _mixHex(G.fog, G.floor[1], 0.55);
  word(str[0], -30, H - 40, s, t, { col, anim: 'fade', t0: -9, idle: 0.2, cond: 0.82, free: true });
  word(str[str.length - 1], W + 30, H - 10, s, t, { col, anim: 'fade', t0: -9, idle: 0.2, cond: 0.82, free: true });
  ctx.restore();
}

function _ktSet(kind, t0, t1, o) {
  const hy = KT_HY[kind], G = gradeOf(o.mood), cam = o.cam ?? camMove('drift', { t0, d: t1 - t0 });
  const L0 = o.light ?? (kind === 'street' ? { kind: 'moon', x: W * 0.72, y: H * 0.2 } : kind === 'room' ? { kind: 'window', x: W * 0.78, y: H * 0.3 } : { kind: 'lamp', x: W * 0.5, y: -40 });
  shot(t0, t1, (t) => {
    const c = cam(t);
    LIGHT = { ...L0, col: (LIGHTS[L0.kind] || LIGHTS.lamp).col, level: L0.level ?? 1 };
    // the subject layer is p = 1; LIGHT positions are subject-plane coordinates
    layerIn(c, 0.15, () => { kind === 'street' ? _ktSky(G, t, hy) : _ktWall(G, t, hy, o.far, kind); if (kind !== 'stage') lightDraw(LIGHT, t); });
    if (kind === 'street' && o.far !== null) layerIn(c, 0.35, () => _ktSkyline(G, t, hy, o.far));
    if (o.back) layerIn(c, kind === 'street' ? 0.6 : 0.4, () => _ktBack(G, t, hy, o.back));
    layerIn(c, 1, () => {
      const mat = o.floor ?? (kind === 'street' ? 'wet' : kind === 'room' ? 'tile' : 'grid');
      KT_WET = mat === 'wet' || mat === 'platform';
      _ktFloor(G, t, hy, c, kind, mat);
      if (kind === 'stage') {
        lightCone(LIGHT.x, -200, H * 0.8, 160, 900, LIGHTS[LIGHT.kind].col, 0.16);
        const g = ctx.createRadialGradient(W / 2, H * 0.8, 0, W / 2, H * 0.8, 900); g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(-600, H * hy, W + 1200, H);
        for (let i = 0; i < 9; i++) lightDraw({ kind: 'lamp', x: 160 + i * 200, y: H - 30, r: 10, level: 0.6 }, t);   // footlights
      }
      const S = { FY: H * 0.78, base: (z) => _ktBase(hy, z), sc: (z) => _ktScale(hy, z), G, c };
      (o.props || []).filter((p) => p[2] < 0.55).forEach(([k, x, z, arg, col]) => ktProp(k, x, _ktBase(hy, z), _ktScale(hy, z), t, arg, col, G));
      if (o.subject) o.subject(t, S);
      KT_WET = false;
      (o.props || []).filter((p) => p[2] >= 0.55).forEach(([k, x, z, arg, col]) => ktProp(k, x, _ktBase(hy, z), _ktScale(hy, z), t, arg, col, G));
    });
    layerIn(c, 1.5, () => _ktNear(G, t, o.near));
    air(o.air, t, { col: o.airCol });
    if (o.caption) small(o.caption[0], W / 2, 110, t, { t0: o.caption[1] ?? t0, size: 48, col: PAL.cream });
    gradePost(t);
    grain(t, { amt: o.grain ?? 0.12 });
  }, null, null);
}
function setStreet(t0, t1, o = {}) { _ktSet('street', t0, t1, o); }
function setRoom(t0, t1, o = {}) { _ktSet('room', t0, t1, o); }
function setStage(t0, t1, o = {}) { _ktSet('stage', t0, t1, o); }
