// =====================================================================
//  templates/film-v.js: the 34 s vertical Short (1080 x 1920), VS proverb format: "Small steps beat one giant leap".
//  Copy to the project root as film.js next to templates/vertical.html (as index.html). The 16:9 sample stays templates/film.js.
//  One hero (Pip, characters/stick.js, sc ~2 = 1300 px tall) and six metaphor sets (sets/metaphors-v.js) seen through a close
//  camera (zoom 2.2-2.4). Every beat is 4 s: picture A (0-2 s) = the weak way, picture B (2-4 s) = the strong way, each with its
//  own camera and pose (keys(t0, 2.0, ['A', 'B'])), a label above the head (labelV, after the figure).
//    0-4 wall/door · 4-8 stairs · 8-12 worry weight · 12-16 dominoes · 16-20 the gap · 20-24 wall again, then the summit
//    24-34 summit (payoff, end card from 32)
// =====================================================================
const DUR = 34;
const SC = 1.95, WIDE = 0.72;   // WIDE: every camera pulled back x0.72, Pip whole at ~45% with the metaphor set around him (owner 11-02: wide, not a crop)
// one beat: pics = [{ set, label, pose(L) → hero options, z0, z1 }]; set = MV name (picture-local L, side 'A'/'B')
function vbeat(pics) {
  const n = pics.length;
  beat(n * 2, (L) => {
    const i = keys(TT - L, 2.0, pics.map((_, k) => k)), p = pics[i], u = L - i * 2, side = p.side || (i % 2 ? 'B' : 'A'), M = MV[p.set];
    const at = M.at(u, side), o = { sc: SC, ...p.hero(u) };
    frameV(at, o, () => { M.draw(u, side); const J = heroV(at, o); if (M.top) M.top(u, side, J); });   // auto-framed: pose box centred, top at y ~525
    if (p.label) labelV(p.label, TT - u, TT - u + 2);
  }, { pop: false, cam: (L) => { const i = clamp(Math.floor(L / 2), 0, n - 1), p = pics[i], k = EZ.io((L - i * 2) / 2); return { z: WIDE * lerp(p.z0 ?? 2.2, p.z1 ?? 2.3, k), x: 500, y: 500 }; } });
}
const hv = (pose, ex, more = {}) => (u) => ({ pose: typeof pose === 'function' ? pose(u) : pose, ex: typeof ex === 'function' ? ex(u) : ex, ...more });
const blend = (a, b, t0, t1) => (u) => ({ from: a, to: b, k: seg(u, t0, t1) });

vbeat([
  { set: 'wall', label: 'FORCES THE WALL', hero: hv('push', 'shock', { ph: 0 }), z0: 2.2, z1: 2.3 },
  { set: 'wall', label: 'FINDS THE DOOR', hero: hv((u) => walk(u * 1.4), 'happy'), z0: 2.35, z1: 2.25 },
]);
vbeat([
  { set: 'stairs', label: 'ONE GIANT LEAP', hero: hv(blend('reach', 'recoil', 0, 0.4), 'shock'), z0: 2.2, z1: 2.3 },
  { set: 'stairs', label: 'ONE STEP A DAY', hero: hv((u) => walk(u), 'firm'), z0: 2.3, z1: 2.25 },
]);
vbeat([
  { set: 'weight', label: 'CARRIES EVERY WORRY', hero: hv('slump', 'sad'), z0: 2.2, z1: 2.3 },
  { set: 'weight', label: 'DROPS THE WEIGHT', hero: hv(blend('push', 'cheer', 0, 0.4), 'happy'), z0: 2.3, z1: 2.2 },
]);
vbeat([
  { set: 'domino', label: 'WAITS TO START BIG', hero: hv(blend('idle', 'slump', 0, 0.6), 'sad'), z0: 2.2, z1: 2.3 },
  { set: 'domino', label: 'STARTS SMALL', hero: hv(blend('idle', 'push', 0, 0.3), 'firm'), z0: 2.3, z1: 2.2 },
]);
vbeat([
  { set: 'gap', label: 'FEARS THE GAP', hero: hv(blend('idle', 'recoil', 0, 0.4), 'shock'), z0: 2.2, z1: 2.3 },
  { set: 'gap', label: 'BUILDS A BRIDGE', hero: hv((u) => walk(u * 1.3), 'firm'), z0: 2.3, z1: 2.2 },
]);
vbeat([
  { set: 'wall', side: 'A', label: 'STILL PUSHING', hero: hv('push', 'sad', { ph: 0 }), z0: 2.25, z1: 2.2 },
  { set: 'summit', side: 'B', label: 'SMALL STEPS', hero: hv(blend('walk', 'cheer', 0, 0.5), 'happy', { sc: 1.85 }), z0: 2.2, z1: 2.3 },
]);
vbeat([
  { set: 'summit', side: 'B', label: 'BEAT ONE', hero: hv('reach', 'happy'), z0: 2.3, z1: 2.4 },
  { set: 'summit', side: 'B', label: 'GIANT LEAP', hero: hv('cheer', 'happy', { dir: -1, sc: 1.85 }), z0: 2.4, z1: 2.3 },
  { set: 'summit', side: 'B', label: 'START SMALL', hero: hv(blend('idle', 'reach', 0, 0.4), 'firm'), z0: 2.25, z1: 2.35 },
  { set: 'summit', side: 'B', label: 'START TODAY', hero: hv('cheer', 'happy', { sc: 1.85 }), z0: 2.35, z1: 2.25 },
  { set: 'summit', side: 'B', hero: hv('cheer', 'happy', { dir: -1, sc: 1.85 }), z0: 2.25, z1: 2.3 },
]);
endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model']);
mountFilm(DUR);
