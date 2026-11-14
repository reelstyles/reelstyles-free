/* sets/places.js: scene recipes. Each builds a FULL set for any story in three parallax layers: far (back wall or horizon),
   mid (floor with a light pool, 3+ props on the sides, the centre x 300-780 free for the subject) and near (soft foreground),
   plus one visible light source (P.light, used by the grade lift and DKL.rim). Frame 0 of a shot is already the whole lit set.
     PLACE.stage({hz, name})            keynote stage: giant screen (P.screen, put the story's picture in it), spot from above,
                                        plinths, truss towers, stage edge; for launches, reveals, numbers, any "show" beat
     PLACE.room({hz, name, flip, monitor})  room at night (monitor = its scale, 0.85; up to 1.2 when the screen is the key): window with a skyline, shelf, desk + monitor (P.monitor._screen) and
                                        lamp (the light), plant; for anyone at work or at home
     PLACE.hall({hz, name, kind})       kind 'racks' (server hall, P.racks) or 'city' (street, skyline, moon, lamp posts);
                                        for big spaces, outages, cities, crowds
   Hero feet go on y hz + 300 to hz + 420 (in front of the props), x 380-700. */
(function () {
  var PL = (window.PLACE = {});
  var px = function (v) { return Math.round(v) + 'px'; };
  function wall(P, hz, top, bot) {
    DK.el(P.far, '', null, { position: 'absolute', left: '-700px', top: '-900px', width: '2480px', height: px(hz + 1200), background: 'linear-gradient(180deg,' + (top || '#0A0E17') + ',' + (bot || '#121A2A') + ')' });
    for (var x = -600; x < 1700; x += 240) DK.el(P.far, '', null, { position: 'absolute', left: px(x), top: '-900px', width: '2px', height: px(hz + 1200), background: 'rgba(255,255,255,.06)' });
  }
  function floor(P, hz, poolX) {
    var f = DK.el(P.mid, 'dkl-floor', null, { left: '-1000px', top: px(hz), width: '3080px', height: '1900px' });
    var g = '';   // the perspective grid, flat SVG (a CSS 3D plane paints over the hero and the props in Chrome)
    for (var k = -16; k <= 16; k++) g += '<line x1="' + (1540 + k * 60) + '" y1="0" x2="' + (1540 + k * 330) + '" y2="1900"/>';
    for (var j = 1; j < 14; j++) { var yy = Math.round(1900 * Math.pow(j / 13, 1.8)); g += '<line x1="0" y1="' + yy + '" x2="3080" y2="' + yy + '"/>'; }
    f.insertAdjacentHTML('beforeend', '<svg width="3080" height="1900" style="position:absolute;left:0;top:0" stroke="rgba(255,255,255,.15)" stroke-width="3">' + g + '</svg>');
    P.pool = DK.el(f, 'pool', null, { left: px(poolX + 1000 - 520), top: '160px', width: '1040px', height: '420px' });
    DK.el(P.mid, 'dkl-edge', null, { left: '-600px', top: px(hz - 2), width: '2280px', opacity: '.5' });
    return f;
  }
  function light(P, x, y, size, layer) {
    DK.el(layer || P.far, 'dkl-halo', null, { left: px(x - size), top: px(y - size), width: px(size * 2), height: px(size * 2) });
    DK.el(layer || P.far, 'dkl-src', null, { left: px(x - 60), top: px(y - 60), width: '120px', height: '120px' });
    P.light = { x: x, y: y };
  }
  function soft(P, x, y, w, h, r) {   // near layer: out-of-focus lights at a bottom corner (never over the subject)
    var b = DK.el(P.near, 'dkl-bokeh', null, { left: px(x + w / 2 - 70), top: px(y + 40), width: '140px', height: '140px' });
    DK.el(P.near, 'dkl-bokeh', null, { left: px(x + w / 2 + (x < 540 ? 70 : -150)), top: px(y + 200), width: '90px', height: '90px', opacity: '.7' }); return b;
  }

  PL.stage = function (o) {
    o = o || {}; var hz = o.hz || 1250, P = DKL.place(o.name || 'stage');
    wall(P, hz, '#06080D', '#101727');
    DK.el(P.far, 'dkl-beam', null, { left: '240px', top: '-260px', width: '600px', height: px(hz + 700), clipPath: 'polygon(44% 0,56% 0,100% 100%,0 100%)' });
    P.screen = DKP.box(P.far, 70, 120, 940, 620, { borderRadius: '28px', overflow: 'hidden', background: 'radial-gradient(90% 90% at 50% 40%,rgba(var(--light-rgb),.42),rgba(var(--light-rgb),0) 80%),#121A2C', border: '4px solid rgba(var(--light-rgb),.45)', boxShadow: '0 0 120px rgba(var(--light-rgb),.25),0 40px 90px rgba(0,0,0,.6)' });
    for (var i = 1; i < 4; i++) DK.el(P.screen, '', null, { position: 'absolute', left: px(i * 235), top: '0', width: '2px', height: '100%', background: 'rgba(0,0,0,.35)' });
    DKP.truss(P.far, { x: -60, y: hz + 120, h: 1200 }); DKP.truss(P.far, { x: 1140, y: hz + 120, h: 1200 });
    floor(P, hz, 540);
    DKP.plinth(P.mid, { x: 90, y: hz + 260, w: 260, h: 300 }); DKP.plinth(P.mid, { x: 990, y: hz + 260, w: 260, h: 300 });
    DKP.box(P.mid, 150, hz + 520, 200, 70, { borderRadius: '14px', transform: 'skewX(-14deg)' });   // floor wedge monitors
    DKP.box(P.mid, 730, hz + 520, 200, 70, { borderRadius: '14px', transform: 'skewX(14deg)' });
    light(P, 540, -150, 520, P.far);
    soft(P, -160, 1700, 360, 520); soft(P, 880, 1720, 360, 520);
    return P;
  };

  PL.room = function (o) {
    o = o || {}; var hz = o.hz || 1250, P = DKL.place(o.name || 'room'), fl = o.flip ? -1 : 1, X = function (x) { return fl > 0 ? x : 1080 - x; };
    wall(P, hz, '#0B0F19', '#151C2C');
    var win = DKP.box(P.far, X(o.flip ? 760 : 80), 160, 640, 760, { borderRadius: '22px', overflow: 'hidden', background: 'linear-gradient(180deg,#0B1530,#1B2C55 70%,#2A3C66)' });
    DK.el(win, 'dkl-halo', null, { left: '360px', top: '40px', width: '260px', height: '260px' });
    DK.el(win, '', null, { position: 'absolute', left: '440px', top: '110px', width: '100px', height: '100px', borderRadius: '50%', background: '#E8EEFF', boxShadow: '0 0 60px rgba(200,220,255,.8)' });
    [[60, 260, 1], [170, 380, 2], [300, 300, 4], [420, 420, 5], [550, 330, 6]].forEach(function (b) { DKP.tower(win, { x: b[0], y: 760, w: 120, h: b[1], seed: b[2] }); });
    DK.el(win, '', null, { position: 'absolute', left: '316px', top: '0', width: '8px', height: '100%', background: '#151A26' });
    DKP.shelf(P.far, { x: X(900), y: 600, w: 330 });
    DKP.box(P.far, -700, hz - 40, 2480, 40, { borderRadius: '0' });   // baseboard
    floor(P, hz, X(760));
    P.desk = DKP.desk(P.mid, { x: X(800), y: hz + 230, w: 440 });
    P.monitor = DKP.monitor(P.mid, { x: X(760), y: hz - 60, s: o.monitor || 0.85 });
    P.lamp = DKP.lamp(P.mid, { x: X(955), y: hz - 60, s: 0.6, dir: -fl });
    DKP.plant(P.mid, { x: X(90), y: hz + 280, s: 1.1 });
    light(P, P.lamp._bulb[0], P.lamp._bulb[1], 380, P.mid);
    soft(P, X(o.flip ? 960 : -140), 1640, 300, 600, 40);
    return P;
  };

  PL.hall = function (o) {
    o = o || {}; var hz = o.hz || 1250, P = DKL.place(o.name || 'hall'), city = o.kind === 'city';
    if (city) {
      DK.el(P.far, '', null, { position: 'absolute', left: '-700px', top: '-900px', width: '2480px', height: px(hz + 1200), background: 'linear-gradient(180deg,#060A16,#13224A 75%,#22345E)' });
      [[-300, 760], [-80, 980], [140, 640], [360, 860], [580, 700], [800, 1040], [1020, 760], [1240, 900], [1440, 680]].forEach(function (b, i) { DKP.tower(P.far, { x: b[0], y: hz + 40, w: 200, h: b[1], seed: i + 2 }); });
      light(P, 780, 60, 420);
      floor(P, hz, 540);
      DKP.post(P.mid, { x: 60, y: hz + 300, h: 1000 }); DKP.post(P.mid, { x: 1020, y: hz + 300, h: 1000 });
      DKP.box(P.mid, 150, hz + 120, 240, 90, { borderRadius: '16px' }); DKP.box(P.mid, 700, hz + 140, 240, 90, { borderRadius: '16px' });   // benches
    } else {
      wall(P, hz, '#070A12', '#111827');
      P.racks = [];
      [[-60, 0.62], [110, 0.56], [270, 0.5], [810, 0.5], [970, 0.56], [1140, 0.62]].forEach(function (r) { P.racks.push(DKP.rack(P.far, { x: r[0], y: hz + 40, s: r[1] })); });
      for (var i = 0; i < 4; i++) DK.el(P.far, '', null, { position: 'absolute', left: px(-200 + i * 420), top: '-40px', width: '300px', height: '24px', borderRadius: '12px', background: 'rgba(var(--light-rgb),.85)', boxShadow: '0 0 60px rgba(var(--light-rgb),.8)' });
      floor(P, hz, 540);
      [[150, 0.72], [930, 0.72]].forEach(function (r) { P.racks.push(DKP.rack(P.mid, { x: r[0], y: hz + 330, s: r[1] })); });
      DKP.box(P.mid, -400, -120, 1880, 60, { borderRadius: '12px' });   // cable tray
      light(P, 540, 120, 460, P.mid);
      DK.el(P.mid, 'dkl-beam', null, { left: '290px', top: '160px', width: '500px', height: px(hz + 200), clipPath: 'polygon(40% 0,60% 0,100% 100%,0 100%)' });
    }
    soft(P, -200, 1660, 340, 640); soft(P, 940, 1700, 340, 600);
    return P;
  };
})();
