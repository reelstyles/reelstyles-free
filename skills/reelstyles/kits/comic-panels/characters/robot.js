// The brute unit (ours): a riveted steel head with one red eye. Origin = head centre, head about 300 x 240.
// o: {x, y, s, t, id, rot, mad (0..1 how angry the eye is), power (1 on .. 0 off: the eye goes grey, stops scanning)}. The eye scans, the glow pulses, the antenna blinks.
function robotHead(o) {
  const t = o.t, ft = q12(t), mad = o.mad == null ? 1 : o.mad, pw = o.power == null ? 1 : o.power;
  kPush(); kTr(o.x, o.y, (o.rot || 0) + Math.sin(t * 1.7) * 0.6, o.s || 1); grp(o.id || 3);
  shape(rect(-6, -190, 12, 80), L.steelD, 5);                                                               // antenna
  shape(ell(0, -198, 17), pw < 0.5 ? L.grey : Math.floor(ft * 3) % 2 ? L.red : L.yellow, 5);
  shape(rrect(-190, -34, 50, 96, 12), L.steelD, 7); shape(rrect(140, -34, 50, 96, 12), L.steelD, 7);         // ear bolts
  shape(rrect(-60, 100, 120, 70, 8), L.steelD, 7);                                                          // neck
  shape(rrect(-150, -120, 300, 236, 38), L.steel, 8);                                                       // head
  shape(poly([[-120, -104], [-40, -104], [-70, -86], [-120, -86]]), L.white, 0);                            // shine
  shape(rrect(-128, -76, 256, 92, 22), L.black, 6);                                                         // visor
  const ex = Math.round(Math.sin(t * 1.4) * 64 * pw), pulse = 1 + Math.sin(t * 7) * 0.08;
  if (pw > 0.05) shape(ell(ex, -30, 58 * pulse, 40 * pulse), [['m', (0.35 + 0.15 * Math.sin(t * 7)) * pw]], 0, { fill: false });   // glow
  shape(ell(ex, -30, 36, 30 * (0.35 + 0.65 * pw)), pw < 0.5 ? L.grey : L.red, 6);
  if (pw > 0.5) shape(ell(ex + 5, -34, 11, 9), L.white, 0);
  shape(poly([[-140, -86 - 10 * mad], [140, -86 + 10 * mad], [140, -104 + 10 * mad], [-140, -104 - 10 * mad]]), L.steelD, 7);   // angry brow
  shape(rrect(-112, 36, 224, 66, 14), L.steelD, 7);                                                         // jaw
  for (let i = 0; i < 8; i++) shape(rect(-100 + i * 26, 46, 20, 46), L.white, 4);                           // teeth
  for (const [x, y] of [[-128, -98], [128, -98], [-128, 94], [128, 94]]) shape(ell(x, y, 8), L.white, 4);    // rivets
  kPop();
}
// Claw arm reaching in from the lower right. o: {x, y, s, t, curl (0..1), id}
function claw(o) {
  const c = o.curl == null ? 0.5 : o.curl, wig = Math.sin(o.t * 3) * 0.06;
  kPush(); kTr(o.x, o.y, -24 + Math.sin(o.t * 1.8) * 2, o.s || 1); grp(o.id || 4);
  shape(rrect(-40, -50, 260, 100, 24), L.steelD, 8);
  shape(rrect(190, -62, 70, 124, 18), L.steel, 8);
  for (let i = 0; i < 3; i++) {
    kPush(); kTr(250, -40 + i * 40, (-20 + i * 10) - c * 45 - wig * 100, 1);
    shape(poly([[0, -14], [100, -9], [140, 6 + c * 8], [92, 12], [0, 14]]), L.steel, 7);
    kPop();
  }
  shape(ell(60, 0, 11), L.white, 4); shape(ell(130, 0, 11), L.white, 4);
  kPop();
}
// The brute unit, whole body (ours): stubby steel legs, a boiler torso with a chest lamp, long arms with claw hands, robotHead on top.
// Origin = feet centre, about 600 units tall, 380 wide. o: {x, y, s, flip, t, id, mad, power, stomp (0..1 a leg raised), cable: [x, y] local end
// of the power cable out of its back (or null), track: 'key' | false}. power 0 = switched off: it sags, the head droops, the lamp goes grey.
function robot(o) {
  const t = o.t, pw = o.power == null ? 1 : o.power, sag = 1 - pw, ft = q12(t), st = o.stomp || 0;
  kPush(); kTr(o.x, o.y, 0, (o.flip ? -1 : 1) * (o.s || 1), o.s || 1); grp(o.id || 5);
  if (o.cable) {   // the power cable out of its back: a thick black line that sags to the floor, then runs to its end
    const [cx, cy] = o.cable;
    shape((p) => { p.moveTo(70, -250); p.bezierCurveTo(200, -230, 160, 0, cx * 0.5, -6); p.lineTo(cx, cy); }, [], 26, { fill: false, cap: 'round' });
    shape((p) => { p.moveTo(70, -250); p.bezierCurveTo(200, -230, 160, 0, cx * 0.5, -6); p.lineTo(cx, cy); }, [], 12, { fill: false, cap: 'round' });
  }
  // legs (one lifts for a stomp)
  for (const [sd, up] of [[-1, st], [1, 0]]) {
    kPush(); kTr(0, -up * 70);
    shape(rrect(sd * 55 - 35, -150, 70, 130, 12), L.steelD, 8);
    shape(rrect(sd * 55 - 55, -34, 110, 34, 12), L.steel, 8);
    shape(ell(sd * 55, -96, 13), L.white, 5);
    kPop();
  }
  kPush(); kTr(0, sag * 22);
  // arms hang from the shoulders, swing a little; claw hands
  for (const sd of [-1, 1]) {
    kPush(); kTr(sd * 140, -330, sd * (4 + 3 * Math.sin(t * 2 + sd) * pw) + sag * sd * -6);
    shape(rrect(-26, 0, 52, 190, 22), L.steelD, 8);
    shape(ell(0, 18, 16), L.white, 5);
    shape(poly([[-36, 180], [36, 180], [28, 236], [8, 214], [0, 246], [-8, 214], [-28, 236]]), L.steel, 7);
    kPop();
  }
  // boiler torso
  shape(rrect(-130, -360, 260, 230, 30), L.steel, 9);
  shape(poly([[-108, -344], [-30, -344], [-56, -326], [-108, -326]]), L.white, 0);
  shape(rrect(-84, -300, 168, 90, 14), L.black, 7);
  for (let i = 0; i < 5; i++) shape(rect(-70 + i * 30, -288, 16, 66), pw > 0.5 && (Math.floor(ft * 6) + i) % 5 === 0 ? L.yellow : L.steelD, 0);   // chest grille lights run
  shape(ell(0, -170, 26), pw < 0.5 ? L.grey : L.red, 7);
  for (const [x, y] of [[-110, -150], [110, -150], [-110, -340], [110, -340]]) shape(ell(x, y, 8), L.white, 4);
  robotHead({ x: 0, y: -470, s: 0.62, t, id: (o.id || 5) + 1, mad: o.mad, power: pw, rot: sag * 16 });
  kPop();
  if (o.track !== false) kTrack('key', -200, -470 - 216 * 0.62 + sag * 22, 200, 0, 'robot');
  kPop();
}
