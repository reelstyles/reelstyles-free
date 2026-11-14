/* templates/film-v.js: the worked example of a 9:16 film (1080x1920) on the look layer. Copy to the kit root as film.js next to
   templates/vertical.html (as index.html); DUR = data-duration on #dk-stage. Change the story, keep the shape:
     PICS: one picture per 2 s (keys(0, 2.0, PICS)): a PLACE, a camera move (DKL.move + DKL.aimY: wide, feet at screen y 1560),
     a grade turn (DKL.grade a -> b), the hero pose, at most one label.
     build: DKL.init(), the places (PLACE.stage / room / hall), the story's own pieces inside them, the hero, the labels.
     render: DKL.show(place) + DKL.frame(t, {cam, grade, place}) first, then hero.draw + DKL.rim, then the story's moving parts.
   The example, "3:07 AM": the site goes down at night, the app Relay rolls it back with one tap, the racks turn mint, the stage
   screen shows the downtime. */
(function () {
  var DUR = 10, E = DKV.ease, lerp = DKV.lerp;
  var PICS = [
    { place: 'hall', cam: DKL.move('pull', 540, DKL.aimY(1600, 0.94), 0.94), grade: ['alarm', 'alarm'], hero: { x: 540, y: 1600, s: 0.78, pose: 'slump', face: 'worried', body: 'mess', badge: '!' }, label: '<i>3:07 AM.</i> Site down.' },
    { place: 'room', cam: DKL.move('pan', 560, DKL.aimY(1590, 0.9), 0.9), grade: ['night', 'night'], hero: { x: 300, x1: 400, y: 1590, s: 0.74, pose: 'walk', face: 'worried', body: 'mess', badge: '!' }, label: null },
    { place: 'room2', cam: DKL.move('push', 520, DKL.aimY(1590, 0.93), 0.93), grade: ['night', 'focus'], hero: { x: 760, y: 1590, s: 0.66, pose: 'reach', face: 'calm', body: 'blank', dir: -1 }, label: 'One tap: <b>roll back</b>.', btn: 1 },
    { place: 'hall', cam: DKL.move('crane', 570, DKL.aimY(1640, 0.9), 0.9), grade: ['alarm', 'win'], hero: { x: 610, y: 1640, s: 0.78, pose: 'idle', face: 'happy', body: 'check', k: 'u', glow: 0.8 }, label: '<b>Back up.</b>' },
    { place: 'stage', cam: DKL.move('push', 540, DKL.aimY(1620, 0.86), 0.86), grade: ['win', 'gold'], hero: { x: 540, y: 1620, s: 0.76, pose: 'cheer', face: 'happy', body: 'sorted', glow: 1 }, label: null, confetti: 1 },
  ];

  function build(S) {
    DKL.init();
    S.P = { hall: PLACE.hall({ kind: 'racks' }), room: PLACE.room({ monitor: 1.15 }), room2: PLACE.room({ name: 'room2', flip: true, monitor: 0.9 }), stage: PLACE.stage({}) };
    // the monitor screens: a traffic graph that spikes coral, mint after the rollback; room2 also holds the button
    [S.P.room, S.P.room2].forEach(function (R, n) {
      R.monitor._screen.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 408 248" width="408" height="248" style="position:absolute;inset:0"><polyline class="g" fill="none" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" points=""/></svg>');
      R.graph = R.monitor._screen.querySelector('.g'); R.gy = n ? 0.5 : 1;
    });
    S.btn = DK.el(S.P.room2.monitor._screen, 'dk-pill acc', 'Roll back', { left: '64px', top: '146px', width: '280px', height: '84px', borderRadius: '42px', fontSize: '46px', justifyContent: 'center', padding: '0', transformOrigin: '50% 50%' });
    S.rips = [0, 1].map(function () { return DK.el(S.P.room2.monitor._screen, '', null, { position: 'absolute', left: '64px', top: '146px', width: '280px', height: '84px', borderRadius: '42px', border: '5px solid var(--accent)', boxSizing: 'border-box', opacity: 0 }); });
    S.ptr = DK.el(document.getElementById('dk-hud'), '', '<svg viewBox="0 0 40 52" width="84" height="109"><path d="M4 2v40l11-10 8 18 8-4-8-17h15z" fill="#F2F5FA" stroke="#06080D" stroke-width="3" stroke-linejoin="round"/></svg>', { position: 'absolute', left: '0', top: '0', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.7))', transformOrigin: '8px 6px', display: 'none' });
    // the payoff on the stage screen
    S.num = DK.el(S.P.stage.screen, 'dk-num', '0:09', { left: '0', top: '150px', width: '940px', textAlign: 'center', fontSize: '330px', color: 'var(--accent)', textShadow: '0 0 60px rgba(var(--accent-rgb),.6)' });
    DK.el(S.P.stage.screen, 'dk-label', 'DOWNTIME', { left: '0', top: '60px', width: '940px', textAlign: 'center', font: '900 64px/1 Inter,sans-serif', letterSpacing: '.12em', color: '#F2F5FA' });
    var R = DK.rng(9), CAT = ['#7CF5C8', '#7CA8FF', '#FFB454', '#B58CFF', '#F2F5FA'];
    S.conf = []; for (var i = 0; i < 40; i++) { var c = DK.el(S.P.stage.mid, '', null, { position: 'absolute', left: '0', top: '0', width: '26px', height: '16px', borderRadius: '5px', background: CAT[i % 5], zIndex: 250 }); c._a = R() * Math.PI * 2; c._v = 500 + R() * 700; c._r = R() * 720; S.conf.push(c); }
    S.hero = DK.hero(DK.el(document.getElementById('dk-cam'), '', null, { position: 'absolute', left: '0', top: '0', zIndex: 200 }), { title: 'Relay', seed: 0.4 });
    S.labels = PICS.map(function (p) { return p.label ? DKV.label(p.label) : null; });
  }

  function render(t, S) {
    var i = keys(0, 2.0, PICS.map(function (_, k) { return k; })), p = PICS[i], u = t - i * 2, k = E.io(u / 2), c = p.cam, P = S.P[p.place];
    var press = p.btn ? u - 0.75 : -1, fixed = i > 2 || press > 0.1;
    var gk = p.btn ? clamp((press - 0.1) / 0.8) : u / 1.4;
    DKL.show(P);
    DKL.frame(t, { cam: [lerp(c[0], c[3], k), lerp(c[1], c[4], k), lerp(c[2], c[5], k), lerp(c[6], c[7], k)], grade: DKL.grade(p.grade[0], p.grade[1], gk), place: P });
    var h = p.hero, hk = h.k === 'u' ? clamp(u / 1.3) : 1;
    S.hero.draw({ x: h.x1 ? lerp(h.x, h.x1, E.io(u / 1.6)) : h.x, y: h.y, s: h.s, pose: h.pose, u: u, t: t, face: p.btn && fixed ? 'happy' : h.face, body: h.body, k: hk, glow: h.glow, badge: h.badge, dir: h.dir });
    DKL.rim(S.hero.el, P, 1);

    if (P.racks) P.racks.forEach(function (r, ri) {
      r._leds.forEach(function (L, j) {
        var on, ok = false;
        if (i === 0) on = Math.sin(t * 11 + j * 1.7 + ri) > -0.2;
        else { var wave = u * 3 - Math.abs(ri - 2.5) * 0.2 - j * 0.03; ok = wave > 0; on = ok || Math.sin(t * 11 + j * 1.7 + ri) > -0.2; }
        var cc = ok ? '124,245,200' : '255,92,108';
        if (j === 0) r._body.style.boxShadow = ok ? '0 0 50px rgba(124,245,200,.45),inset 0 0 40px rgba(124,245,200,.25)' : '';
        L.style.background = on ? 'rgb(' + cc + ')' : '#2A3346'; L.style.boxShadow = on ? '0 0 16px rgba(' + cc + ',.9)' : 'none';
      });
    });
    if (P.graph) {
      var good = p.place === 'room2' && fixed, sy = P.gy, pts = good ? [150, 146, 150, 140, 144, 136, 140, 132, 136] : [190, 180, 186, 170, 60 + 20 * Math.sin(t * 9), 210, 40 + 25 * Math.sin(t * 7), 200, 190];
      P.graph.setAttribute('stroke', good ? '#7CF5C8' : '#FF5C6C'); P.graph.style.filter = 'drop-shadow(0 0 10px ' + (good ? '#7CF5C8' : '#FF5C6C') + ')';
      P.graph.setAttribute('points', pts.map(function (y, j) { return (20 + j * 46) + ',' + (y * sy).toFixed(0); }).join(' '));
    }
    S.ptr.style.display = p.btn ? 'block' : 'none';
    if (p.btn) {
      var pop = press >= 0 && press < 0.12 ? 0.9 : 1 + 0.02 * Math.sin(t * 8);
      S.btn.style.transform = 'scale(' + pop.toFixed(3) + ')';
      S.rips.forEach(function (r, j) { var a = press - j * 0.25; r.style.opacity = a > 0 && a < 0.8 ? (0.9 * (1 - a / 0.8)).toFixed(2) : 0; r.style.transform = 'scale(' + (1 + Math.max(0, a) * 0.25).toFixed(3) + ',' + (1 + Math.max(0, a) * 0.6).toFixed(3) + ')'; });
      var b = S.btn.getBoundingClientRect(), fly = E.io(u / 0.75), tx = b.right - 10, ty = b.top + b.height * 0.7;
      S.ptr.style.transform = 'translate(' + lerp(tx + 260, tx, fly).toFixed(1) + 'px,' + lerp(ty + 120, ty, fly).toFixed(1) + 'px) scale(' + (press >= 0 && press < 0.12 ? 0.85 : 1) + ')';
    }
    if (p.place === 'stage') S.num.style.transform = 'scale(' + (0.94 + 0.06 * E.back(clamp(u / 0.4)) + 0.012 * Math.sin(t * 5)).toFixed(4) + ')';
    if (p.confetti) S.conf.forEach(function (cf) {
      var a = u + 0.15, x = 540 + Math.cos(cf._a) * cf._v * a * 0.9, y = 1350 - Math.abs(Math.sin(cf._a)) * cf._v * a + 700 * a * a;
      cf.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (cf._r * a).toFixed(0) + 'deg)';
    });
    var L = S.labels[i]; if (L) DKV.say(L, u);
  }

  DKV.film({ dur: DUR, accent: '#7CF5C8' }, build, render);
})();
