// =====================================================================
//  engine/safe.js: vertical (9:16) layout guard, shared by every kit with a vertical template (same file in each kit).
//  Classic script, load it right after engine/runtime.js. Does nothing visible in 16:9 except the end card if you call it.
//
//  The vertical layout (1080x1920) every Short follows, in screen px:
//    LABEL band   y 270-500, x 108-918 (10%-85% of the width: the right edge holds the like/comment buttons)
//    head top     y >= 520 (under the label band), faces inside x 65-940, y 250-1470
//    FRAMING (owner 11-02: "too zoomed, like a crop of a large video"): wide and medium-wide shots carry the film, the whole
//    scene readable: the hero WHOLE (head to feet, feet on visible ground with floor below them, y <= 1780) at 30-55% of the
//    frame height (575-1050 px; of its panel in a stacked top/bottom film), the set around him. Close-ups (> 70%) are short
//    deliberate beats, at most 40% of the film; never under 25%. The hero box stays clear of all four edges on most frames.
//    key object   >= 12% of the frame height (230 px) and >= 65 px inside every edge
//
//    track(kind, x0, y0, x1, y1)  call INSIDE your character's / prop's transform with its LOCAL box; it is stored in screen px.
//                                 kinds: 'hero' (main character, whole body), 'face' (its head), 'key' (the beat's key object),
//                                 'panel' (screen box of a stacked panel), 'extra' (other people, pip({extra:true}) does it), 'prop' (a big set piece that must fit whole: a tank, a house; track('prop', ..., name)). The kit characters already call it.
//    labelY(h)                    screen y (centre) for a label of height h: above the hero's head, inside the label band.
//                                 The kit label helpers use it when you give no y.
//    keys(t0, dt, list)           list[i] for TT in [t0 + i*dt, ...): one shot per <= 2 s (dt 2.0), so no picture sits on 3 neighbouring 1-s stills.
//    endCard(t0, t1, [l1, l2])    last 2 s: the shot under it keeps playing (extend your payoff shot to DUR: the result stays
//                                 behind and keeps moving), dimmed, two lines centred (default "Made with" / "ReelStyles"),
//                                 complete from its first frame, breathing. Layout checks skip it.
//  QA: every frame the runtime calls qaFrame(); tools/layout-check.mjs reads window.__qa and fails the film on any rule above.
// =====================================================================
const LAYOUT = [], QAV = (window.__qa = window.__qa || {}), QAS = (window.__qs = window.__qs || {});   // __qs[t] = { h, edge } of the main subject; tools/layout-check.mjs sums it over the film
const VSAFE = { lx0: 108, lx1: 918, ly0: 270, ly1: 500, headTop: 520, fx0: 65, fx1: 940, fy0: 250, fy1: 1470, edge: 65, hero: 0.25, wide: 0.55, close: 0.7, key: 0.12 };
let END = null;

function track(kind, x0, y0, x1, y1, name = '') {
  const m = ctx.getTransform(), pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  LAYOUT.push({ kind, name, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });
}
const NOTES = [];
function qaNote(msg) { NOTES.push(msg); }   // any engine/character code can fail the frame with a one-line fix (e.g. pip: feet float)
const vertical = () => H > W;
const firstOf = (k) => LAYOUT.find((b) => b.kind === k);

function labelY(h) {
  const hero = firstOf('hero'), face = firstOf('face'), top = Math.min(hero ? hero.y0 : 1e9, face ? face.y0 : 1e9);
  const lo = VSAFE.ly0 + h / 2;
  return top < 1e9 ? Math.max(lo, Math.min(top - 30 - h / 2, VSAFE.fy1 - h / 2)) : lo + 60;
}
function keys(t0, dt, list) { return list[clamp(Math.floor((TT - t0) / dt), 0, list.length - 1)]; }

function endCard(t0, t1, lines = ['Made with', 'ReelStyles']) { END = { t0, t1, lines }; }
function drawEnd() {
  if (!END || TT < END.t0 || TT > END.t1 + 0.1) return;
  const font = typeof HAND !== 'undefined' ? HAND : SERIF, k = 1 + 0.015 * Math.sin((TT - END.t0) * 3);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(8,6,5,0.5)'; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2 - (vertical() ? 40 : 0), H * (vertical() ? 0.45 : 0.5)); ctx.scale(k, k);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f7f1e3'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18;
  const s = vertical() ? 128 : 110;
  const fit = (t, px) => { ctx.font = `700 ${px}px ${font}`; const w = ctx.measureText(t).width, mx = vertical() ? 800 : 1500; if (w > mx) ctx.font = `700 ${Math.floor(px * mx / w)}px ${font}`; };   // 10-25: wide fonts ran off the frame
  fit(END.lines[0], s); ctx.fillText(END.lines[0], 0, -s * 0.62);
  fit(END.lines[1] || '', s * 1.12); ctx.fillText(END.lines[1] || '', 0, s * 0.62);
  ctx.restore();
  LAYOUT.push({ kind: 'end', x0: W / 2 - 400, y0: H * 0.45 - 160, x1: W / 2 + 320, y1: H * 0.45 + 160 });
}

const ov = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
function qaFrame() {
  const t = Math.round(TT * 100) / 100, out = NOTES.splice(0);
  if (!vertical() || (END && TT >= END.t0)) { QAV[t] = out; return; }
  const heroes = LAYOUT.filter((b) => b.kind === 'hero'), faces = LAYOUT.filter((b) => b.kind === 'face');
  const labels = LAYOUT.filter((b) => b.kind === 'label'), panels = LAYOUT.filter((b) => b.kind === 'panel');
  if (!heroes.length && !LAYOUT.some((b) => b.kind === 'key')) out.push('nothing tracked: call track("hero", ...) + track("face", ...) in your character, or track("key", ...) on the main object of the shot (engine/safe.js)');
  for (const h of heroes) {
    const pan = panels.find((p) => h.y0 >= p.y0 - 40 && h.y0 < p.y1), ref = pan ? pan.y1 - pan.y0 : H;
    const vis = Math.min(h.y1, pan ? pan.y1 : H) - Math.max(h.y0, pan ? pan.y0 : 0);
    if (vis < VSAFE.hero * ref) out.push(`hero ${Math.round(vis)} px tall = ${Math.round(100 * vis / ref)}% of the ${pan ? 'panel' : 'frame'} (need >= 25%): move the camera in a little`);
    if (h.x0 < 0 || h.x1 > W) out.push(`hero cut by the ${h.x0 < 0 ? 'left' : 'right'} edge (box x ${Math.round(h.x0)}-${Math.round(h.x1)}): centre him or pull the camera back`);
    if (h.y0 < 0) out.push(`hero cut by the top edge (box y ${Math.round(h.y0)}): pull the camera back or lower him`);
    if (h.y0 < VSAFE.fy0 - 135) out.push(`hero top at y ${Math.round(h.y0)} (head in the top UI band): lower him so the head top is at y >= ${VSAFE.headTop}`);
  }
  for (const e of LAYOUT.filter((b) => b.kind === 'extra' || b.kind === 'prop')) if (e.x0 < 0 || e.x1 > W || e.y0 < 0) out.push(`${e.kind} ${e.name || 'figure'} cut by the ${e.x0 < 0 ? 'left' : e.x1 > W ? 'right' : 'top'} edge (box x ${Math.round(e.x0)}-${Math.round(e.x1)}, top ${Math.round(e.y0)}): widen the shot or move it inward (only sky, ground and feet bleed)`);
  const main = heroes.length ? heroes : LAYOUT.filter((b) => b.kind === 'key');   // the main subject: biggest hero, else biggest key object
  if (main.length) {
    const m = main.reduce((a, b) => (b.y1 - b.y0 > a.y1 - a.y0 ? b : a)), pan = panels.find((p) => m.y0 >= p.y0 - 40 && m.y0 < p.y1);
    const y0 = pan ? pan.y0 : 0, y1 = pan ? pan.y1 : H;   // in a stacked panel the panel is the frame
    QAS[t] = { h: (Math.min(m.y1, y1) - Math.max(m.y0, y0)) / (y1 - y0), edge: m.x0 <= 2 ? 'left' : m.x1 >= W - 2 ? 'right' : m.y0 <= y0 + 2 ? 'top' : m.y1 >= y1 - 2 ? 'bottom' : '' };
  }
  for (const f of faces) {
    if (f.x0 < VSAFE.fx0 || f.x1 > VSAFE.fx1 || f.y0 < VSAFE.fy0 || f.y1 > VSAFE.fy1) out.push(`face box x ${Math.round(f.x0)}-${Math.round(f.x1)} y ${Math.round(f.y0)}-${Math.round(f.y1)} is outside x ${VSAFE.fx0}-${VSAFE.fx1}, y ${VSAFE.fy0}-${VSAFE.fy1}`);
  }
  for (const l of labels) {
    if (l.x0 < VSAFE.lx0 - 2 || l.x1 > VSAFE.lx1 + 2) out.push(`label "${l.name}" x ${Math.round(l.x0)}-${Math.round(l.x1)} outside x ${VSAFE.lx0}-${VSAFE.lx1}: shorten it or let it wrap`);
    if (l.y0 < VSAFE.fy0 - 2 || l.y1 > VSAFE.fy1 + 2) out.push(`label "${l.name}" y ${Math.round(l.y0)}-${Math.round(l.y1)} outside y ${VSAFE.fy0}-${VSAFE.fy1}`);
    for (const f of faces) if (ov(l, f) > 0) out.push(`label "${l.name}" covers the face: give no y (auto above the head) or lower the hero's head to y >= ${VSAFE.headTop}`);
    for (const h of heroes) { const a = ov(l, h) / ((l.x1 - l.x0) * (l.y1 - l.y0) || 1); if (a > 0.15) out.push(`label "${l.name}" covers the body (${Math.round(a * 100)}% of the label): move it into the band y ${VSAFE.ly0}-${VSAFE.ly1}, head top below y ${VSAFE.headTop}`); }
  }
  for (const k of LAYOUT.filter((b) => b.kind === 'key')) {
    if (k.y1 - k.y0 < VSAFE.key * H) out.push(`key object "${k.name}" ${Math.round(k.y1 - k.y0)} px tall (need >= ${VSAFE.key * H}): scale it up or cut in close`);
    if (k.x0 < VSAFE.edge || k.x1 > W - VSAFE.edge || k.y0 < VSAFE.edge) out.push(`key object "${k.name}" within ${VSAFE.edge} px of an edge (x ${Math.round(k.x0)}-${Math.round(k.x1)}, top ${Math.round(k.y0)})`);
  }
  QAV[t] = out;
}
