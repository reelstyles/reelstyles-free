/* templates/film-v.js: a 34 s vertical Short (1080x1920), the VS proverb format: "A place for everything, everything in its place".
   Copy to the kit root as film.js next to templates/vertical.html (as index.html). DUR = data-duration on #dk-stage.
   Eight sets, one hero (characters/cast.js: the app window "Tidy" with a screen face). The old way first, then the new way:
     0-4 the pile · 4-8 the inbox flood · 8-12 the double-booked week · 12-16 the click · 16-20 the snap wall
     20-24 the checklist ring · 24-30 the number (glyph noise, old vs new) · 30-34 the wordmark (end card from 32)
   Every picture is 2 s (keys(0, 2.0, PICS)): its own set or framing, a camera move, one label above the hero (labelY()).
   Framing (owner 11-02): the hero whole at 30-57% of the frame, head under y 520, nothing cut by an edge; frame 0 mid-fall. */
(function () {
  var DUR = 34, E = DKV.ease, lerp = DKV.lerp, rnd = DK.rng(11);
  var CAT = ['#7CA8FF', '#FFB454', '#B58CFF', '#5ED6A8', '#FF7DA8'];
  var GLYPH = function (c) { return '<svg viewBox="0 0 64 64" width="100%" height="100%"><path d="M14 6h26l14 14v38H14z" fill="' + c + '"/><path d="M40 6v14h14z" fill="#fff" fill-opacity=".4"/><rect x="22" y="32" width="24" height="5" rx="2.5" fill="#06080D" fill-opacity=".45"/><rect x="22" y="43" width="16" height="5" rx="2.5" fill="#06080D" fill-opacity=".45"/></svg>'; };
  var px = function (v) { return v.toFixed(1) + 'px'; };

  // a picture: set(s) to show, camera [x0, y0, s0, x1, y1, s1, rot0, rot1], hero pose (or null), label, set animation
  var PICS = [
    { set: 'pile', cam: [540, 1000, 1.06, 540, 990, 1.0], hero: { x: 540, y: 1540, s: 0.95, pose: 'slump', face: 'worried', body: 'mess', badge: '9+' }, label: '<i>12,408</i> files. One screen.' },
    { set: 'pile', cam: [560, 1060, 0.8, 570, 1070, 0.74], hero: { x: 560, y: 1540, s: 0.95, pose: 'slump', face: 'worried', body: 'mess', badge: '9+', dir: -1 }, label: 'Nothing has a place.' },
    { set: 'inbox', cam: [540, 1000, 0.92, 540, 1000, 0.96], hero: { x: 380, x1: 640, y: 1560, s: 0.9, pose: 'walk', face: 'surprised', body: 'mess', badge: 'count' }, label: 'Inbox: <i>99+</i>' },
    { set: 'inbox', cam: [600, 1050, 1.32, 600, 1045, 1.36], hero: { x: 600, y: 1560, s: 0.9, pose: 'idle', face: 'worried', body: 'mess', badge: '99+' }, label: 'Pinged every minute.' },
    { set: 'cal', cam: [540, 1050, 0.84, 540, 1040, 0.88], hero: { x: 540, y: 1600, s: 0.85, pose: 'slump', face: 'worried', body: 'mess', badge: '9+' }, label: 'Every hour, booked twice.' },
    { set: 'cal', cam: [460, 1150, 1.12, 470, 1150, 1.16, 2, 1.2], hero: { x: 460, y: 1600, s: 0.85, pose: 'slump', face: 'worried', body: 'mess', badge: '9+', dir: -1 }, label: 'The old way: <i>everywhere</i>.' },
    { set: 'click', cam: [540, 1090, 0.95, 540, 1080, 1.0], hero: { x: 540, y: 1340, s: 0.78, pose: 'reach', face: 'calm', body: 'blank' }, label: 'One click.' },
    { set: 'click', cam: [540, 1150, 0.84, 540, 1130, 0.9], hero: { x: 540, y: 1340, s: 0.78, pose: 'cheer', face: 'happy', body: 'sorted', k: 'u', glow: 1 }, label: 'A place for <b>everything</b>.' },
    { set: 'snap', cam: [540, 1000, 0.78, 540, 1010, 0.82], hero: { x: 540, y: 1620, s: 0.8, pose: 'idle', face: 'calm', body: 'sorted', glow: 0.6 }, label: 'Everything in its place.' },
    { set: 'snap', cam: [540, 1240, 1.25, 540, 1240, 1.3], hero: { x: 540, y: 1620, s: 0.8, pose: 'idle', face: 'happy', body: 'sorted', glow: 0.8 }, label: 'Sorted by kind. <b>Instantly.</b>' },
    { set: 'check', cam: [540, 1150, 0.86, 540, 1140, 0.9], hero: { x: 540, y: 1580, s: 0.85, pose: 'idle', face: 'calm', body: 'check', k: 'half' }, label: 'Backed up. Synced.' },
    { set: 'check', cam: [540, 1100, 1.1, 540, 1095, 1.16, -1.5, -0.5], hero: { x: 540, y: 1580, s: 0.85, pose: 'cheer', face: 'happy', body: 'check', k: 'rest', glow: 1 }, label: 'Done <b>before you blink</b>.' },
    { set: 'num', cam: [540, 1060, 1.0, 540, 1060, 1.08], hero: null, label: 'Time to find any file:' },
    { set: 'cmp', cam: [540, 1150, 0.95, 540, 1140, 1.0], hero: null, label: 'Old way vs new way.' },
    { set: 'num', cam: [540, 1080, 1.06, 540, 1080, 1.12], hero: null, label: '<b>12,408</b> files, sorted.' },
    { set: 'end', cam: [540, 1080, 0.92, 540, 1060, 0.98], hero: { x: 540, y: 1560, s: 0.72, pose: 'cheer', face: 'happy', body: 'sorted', glow: 1 }, label: 'mark' },
    { set: 'end', cam: [540, 1060, 0.98, 540, 1050, 1.04], hero: { x: 540, y: 1560, s: 0.72, pose: 'cheer', face: 'happy', body: 'sorted', glow: 1 }, label: null },
  ];
  var GLOW = { pile: [300, 700], inbox: [800, 600], cal: [300, 1300], click: [540, 900], snap: [800, 1300], check: [540, 1150], num: [540, 1060], cmp: [300, 900], end: [540, 900] };

  function build(S) {
    var sets = S.sets = {};
    ['pile', 'inbox', 'cal', 'click', 'snap', 'check', 'num', 'cmp', 'end'].forEach(function (n) { sets[n] = DKV.set(n); });

    /* the pile: 36 windows rain in around the hero (frame 0 is mid-fall), each trembling once it lands */
    var titles = ['Untitled', 'Draft', 'Copy of', 'Final v2', 'Notes', 'Scan', 'Inbox'];
    S.pile = [];
    for (var i = 0; i < 36; i++) {
      var w = 360 + Math.round(rnd() * 90), h = 240 + Math.round(rnd() * 50);
      var win = DK.win(sets.pile, { w: w, h: h, x: -240 + rnd() * 1300, y: -80 + rnd() * 2050, title: titles[i % titles.length] + ' ' + (2 + i), color: CAT[i % 5], badge: rnd() < 0.5 ? (rnd() < 0.5 ? '9+' : String(2 + Math.floor(rnd() * 80))) : null, lines: [0.8, 0.5, 0.65] });
      win._t = -0.5 + i * 0.1; win._x = gsap.getProperty(win, 'x'); win._y = gsap.getProperty(win, 'y'); win._r = (rnd() - 0.5) * 16; win.style.zIndex = 10 + i;
      S.pile.push(win);
    }
    /* the inbox flood: three columns of notifications streaming down behind the hero */
    S.notes = [];
    var msgs = ['New mail', 'Ping', '@you', 'Reminder', 'Re: Re:', 'Urgent'];
    for (var c = 0; c < 3; c++) for (var j = 0; j < 9; j++) {
      var n = DK.el(sets.inbox, '', '<span style="display:block;width:30px;height:30px;border-radius:50%;background:var(--problem);box-shadow:0 0 18px rgba(255,92,108,.8);flex:none"></span><span>' + msgs[(c * 3 + j) % msgs.length] + '</span>',
        { position: 'absolute', left: '0', top: '0', width: '330px', height: '128px', display: 'flex', alignItems: 'center', gap: '22px', padding: '0 28px', boxSizing: 'border-box', borderRadius: '30px', background: 'linear-gradient(180deg,#232A3C,#181E2C)', border: '2px solid rgba(255,255,255,.14)', boxShadow: '0 18px 40px rgba(0,0,0,.5)', font: '500 40px/1 "JetBrains Mono",monospace', color: '#D5DCE8', whiteSpace: 'nowrap' });
      n._c = c; n._j = j; S.notes.push(n);
    }
    /* the double-booked week: a calendar board, coral blocks keep dropping on top of each other */
    var board = DK.el(sets.cal, '', null, { position: 'absolute', left: '20px', top: '360px', width: '1040px', height: '1360px', borderRadius: '36px', background: 'linear-gradient(180deg,#141A27,#0E121B)', border: '2px solid rgba(255,255,255,.12)' });
    'MTWTFSS'.split('').forEach(function (d, k) { DK.el(board, '', d, { position: 'absolute', left: (20 + k * 143) + 'px', top: '24px', width: '143px', textAlign: 'center', font: '500 48px/1 "JetBrains Mono",monospace', color: '#9AA3B5' }); });
    for (var r = 0; r < 9; r++) DK.el(board, '', null, { position: 'absolute', left: '20px', right: '20px', top: (110 + r * 138) + 'px', height: '2px', background: 'rgba(255,255,255,.08)' });
    S.blocks = [];
    for (var b = 0; b < 30; b++) {
      var col = Math.floor(rnd() * 7), row = Math.floor(rnd() * 8);
      var bl = DK.el(board, '', null, { position: 'absolute', left: (26 + col * 143 + rnd() * 20) + 'px', top: (118 + row * 138 + rnd() * 40) + 'px', width: '128px', height: (150 + rnd() * 120) + 'px', borderRadius: '18px', background: b % 3 ? 'rgba(255,92,108,.85)' : 'rgba(124,168,255,.85)', border: '3px solid rgba(255,255,255,.3)', boxSizing: 'border-box' });
      bl._t = 7.2 + b * 0.16; S.blocks.push(bl);
    }
    /* the click: a spotlight, the big accent button, the pointer */
    DK.el(sets.click, '', null, { position: 'absolute', left: '90px', top: '-200px', width: '900px', height: '1900px', background: 'linear-gradient(180deg,rgba(124,245,200,.0),rgba(170,200,255,.10) 55%,rgba(170,200,255,0))', clipPath: 'polygon(38% 0,62% 0,100% 100%,0 100%)' });
    DK.el(sets.click, '', null, { position: 'absolute', left: '140px', top: '1290px', width: '800px', height: '120px', borderRadius: '50%', background: 'radial-gradient(closest-side,rgba(124,245,200,.25),rgba(124,245,200,0))' });
    S.btn = DK.el(sets.click, 'dk-pill acc', 'Tidy up', { left: '250px', top: '1440px', width: '580px', height: '150px', borderRadius: '75px', fontSize: '76px', justifyContent: 'center', transformOrigin: '50% 50%' });
    S.rips = [0, 1, 2].map(function () { return DK.el(sets.click, '', null, { position: 'absolute', left: '250px', top: '1440px', width: '580px', height: '150px', borderRadius: '75px', border: '6px solid var(--accent)', boxSizing: 'border-box', opacity: 0 }); });
    S.ptr = DK.el(sets.click, '', '<svg viewBox="0 0 40 52" width="110" height="143"><path d="M4 2v40l11-10 8 18 8-4-8-17h15z" fill="#F2F5FA" stroke="#06080D" stroke-width="3" stroke-linejoin="round"/></svg>', { position: 'absolute', left: '0', top: '0', zIndex: 400, filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.7))', transformOrigin: '8px 6px' });
    /* the snap wall: 63 tiles fly into typed rows behind the hero, then a light band sweeps them on */
    S.tiles = [];
    for (var q = 0; q < 63; q++) {
      var tc = q % 7, tr = Math.floor(q / 7), T = DK.el(sets.snap, '', GLYPH(CAT[tr % 5]), { position: 'absolute', left: '0', top: '0', width: '118px', height: '118px', borderRadius: '28px', background: '#121826', border: '2px solid rgba(255,255,255,.14)', padding: '16px', boxSizing: 'border-box' });
      T._x = 62 + tc * 140; T._y = 300 + tr * 140; T._sx = -300 + rnd() * 1680; T._sy = -200 + rnd() * 2300; T._sr = (rnd() - 0.5) * 120; T._t = 15.7 + q * 0.012 + rnd() * 0.25;
      S.tiles.push(T);
    }
    S.sweep = DK.el(sets.snap, 'dk-sweep', null, { left: '0', top: '200px', width: '520px', height: '1500px', zIndex: 150 });
    /* the checklist ring: a big progress ring around the hero */
    var R = 480, CIRC = 2 * Math.PI * R;
    sets.check.insertAdjacentHTML('beforeend', '<svg width="1200" height="1200" viewBox="0 0 1200 1200" style="position:absolute;left:-60px;top:550px;overflow:visible"><circle cx="600" cy="600" r="' + R + '" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="44"/><circle class="arc" cx="600" cy="600" r="' + R + '" fill="none" stroke="var(--accent)" stroke-width="44" stroke-linecap="round" transform="rotate(-90 600 600)" stroke-dasharray="' + CIRC.toFixed(1) + '" style="filter:drop-shadow(0 0 22px rgba(124,245,200,.7))"/></svg>');
    S.arc = sets.check.querySelector('.arc'); S.CIRC = CIRC;
    S.pct = DK.el(sets.check, 'dk-label', '0%', { left: '0', top: '1690px', width: '1080px', textAlign: 'center', fontSize: '64px', color: '#F2F5FA' });
    /* the number: glyph noise locks into 0.8 s; the dot it grows from */
    S.dot = DK.el(sets.num, '', null, { position: 'absolute', left: '510px', top: '1030px', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 80px rgba(var(--accent-rgb),.9)' });
    S.num = DK.el(sets.num, 'dk-num', '', { left: '0', top: '0', fontSize: '540px', lineHeight: '1', width: 'max-content', transformOrigin: '50% 50%' });
    S.sub = DK.el(sets.num, 'dk-label', 'seconds, any file', { left: '0', top: '1380px', width: '1080px', textAlign: 'center', fontSize: '60px' });
    DKV.track(S.num, 'hero', 'the number');
    /* old vs new: one card, two rows */
    S.cmp = DK.el(sets.cmp, '', null, { position: 'absolute', left: '90px', top: '700px', width: '900px', height: '900px', borderRadius: '48px', background: 'linear-gradient(180deg,#1F2638,#141A27)', border: '3px solid rgba(255,255,255,.18)', boxShadow: '0 40px 90px rgba(0,0,0,.6)', overflow: 'hidden' });
    DK.el(S.cmp, 'dk-label', 'OLD WAY', { left: '60px', top: '60px', fontSize: '56px' });
    S.old = DK.el(S.cmp, '', '3<span style="font-size:.5em;margin-left:16px">h</span>', { position: 'absolute', left: '60px', top: '120px', font: '900 300px/1 "Inter",sans-serif', letterSpacing: '-.05em', color: 'var(--problem)' });
    S.strike = DK.el(S.cmp, '', null, { position: 'absolute', left: '40px', top: '270px', width: '820px', height: '22px', borderRadius: '11px', background: '#F2F5FA', transformOrigin: '0 50%' });
    DK.el(S.cmp, '', null, { position: 'absolute', left: '0', right: '0', top: '450px', height: '3px', background: 'rgba(255,255,255,.12)' });
    DK.el(S.cmp, 'dk-label', 'NEW WAY', { left: '60px', top: '510px', fontSize: '56px', color: 'var(--accent)' });
    S.neu = DK.el(S.cmp, '', '0.8<span style="font-size:.5em;margin-left:16px">s</span>', { position: 'absolute', left: '60px', top: '570px', font: '900 300px/1 "Inter",sans-serif', letterSpacing: '-.05em', color: 'var(--accent)', transformOrigin: '0 50%' });
    DKV.track(S.cmp, 'hero', 'old vs new card');
    /* the end: a lit row of sorted tiles under the hero */
    S.row = [];
    for (var e = 0; e < 7; e++) S.row.push(DK.el(sets.end, '', GLYPH(CAT[e % 5]), { position: 'absolute', left: (40 + e * 145) + 'px', top: '1620px', width: '122px', height: '122px', borderRadius: '28px', background: '#121826', border: '2px solid rgba(255,255,255,.16)', padding: '16px', boxSizing: 'border-box' }));

    S.hero = DK.hero(DK.el(document.getElementById('dk-cam'), '', null, { position: 'absolute', left: '0', top: '0', zIndex: 200 }), { title: 'Tidy', seed: 0.7 });
    S.near = DKV.set('near'); S.near.style.zIndex = 300;   // the depth layer in front of the hero (the pile's closest windows, soft)
    S.nearW = [[-260, 260, 7], [820, 520, 11], [-300, 1500, 5], [860, 1720, 9]].map(function (p, k) {
      var w2 = DK.win(S.near, { w: 520, h: 340, x: p[0], y: p[1], title: 'Copy of ' + (40 + k), color: CAT[k], badge: '9+', lines: [0.8, 0.6, 0.7] });
      w2.style.filter = 'blur(5px) brightness(1.15)'; w2._r = p[2]; return w2;
    });
    S.labels = PICS.map(function (p) { return p.label === 'mark' ? DKV.label('Tidy<span style="display:inline-block;width:22px;height:240px;margin-left:16px;vertical-align:-14px;border-radius:5px;background:var(--accent);box-shadow:0 0 30px rgba(var(--accent-rgb),.9)"></span>', 'mark') : p.label ? DKV.label(p.label) : null; });
    DKV.end(DUR - 2, DUR, ['Made by Claude Code', 'No video model']);
  }

  function render(t, S) {
    var i = keys(0, 2.0, PICS.map(function (_, k) { return k; })), p = PICS[i], u = t - i * 2, k = E.io(u / 2), c = p.cam, sets = S.sets;
    DKV.show(sets[p.set], p.set === 'pile' ? S.near : null);
    DKV.cam(lerp(c[0], c[3], k), lerp(c[1], c[4], k), lerp(c[2], c[5], k), lerp(c[6] || 0, c[7] || 0, k));
    var g = GLOW[p.set]; DKV.glow(g[0] + Math.sin(t * 0.7) * 60, g[1] + Math.cos(t * 0.5) * 50);

    var h = p.hero, hv = S.hero.el.parentElement;
    hv.style.display = h ? 'block' : 'none';
    if (h) {
      var hk = h.k === 'u' ? clamp(u / 1.4) : h.k === 'half' ? 0.5 * clamp(u / 1.6) : h.k === 'rest' ? 0.5 + 0.5 * clamp(u / 1.2) : 1;
      var badge = h.badge === 'count' ? (u > 1.5 ? '99+' : String(12 + Math.floor(u * 58))) : h.badge;
      S.hero.draw({ x: h.x1 ? lerp(h.x, h.x1, E.io(u / 2)) : h.x, y: h.y, s: h.s, pose: h.pose, u: u, t: t, face: h.face, body: h.body, k: hk, glow: h.glow, badge: badge, dir: h.dir });
    }

    if (p.set === 'pile') {
      S.pile.forEach(function (w) {
        var a = t - w._t, f = E.back(a / 0.32);
        w.style.opacity = a < 0 ? 0 : 1;
        w.style.transform = 'translate(' + px(w._x) + ',' + px(w._y - (1 - f) * 90) + ') rotate(' + (w._r * (2 - f)).toFixed(2) + 'deg) scale(' + (0.6 + 0.4 * f).toFixed(3) + ')';
        if (a > 0.32) w._ci.style.transform = 'translate(' + px(Math.sin(t * 31 + w._r) * 4) + ',' + px(Math.cos(t * 27 + w._r) * 3) + ')';
      });
      S.nearW.forEach(function (w, j) { w.style.transform = 'translate(' + px(gsap.getProperty(w, 'x') + Math.sin(t * 0.9 + j) * 30) + ',' + px(gsap.getProperty(w, 'y') + Math.cos(t * 0.7 + j) * 24) + ') rotate(' + (w._r + Math.sin(t + j) * 2).toFixed(2) + 'deg)'; });
    }
    if (p.set === 'inbox') S.notes.forEach(function (n) {
      var span = 9 * 250, y = ((n._j * 250 + (t - 4) * (520 + n._c * 140)) % span) - 300;
      n.style.transform = 'translate(' + px(30 + n._c * 360 + Math.sin(t * 2 + n._j) * 10) + ',' + px(y) + ') rotate(' + (Math.sin(n._j * 2.1 + t) * 3).toFixed(2) + 'deg)';
    });
    if (p.set === 'cal') S.blocks.forEach(function (b) {
      var a = t - b._t, f = E.back(a / 0.3);
      b.style.opacity = a < 0 ? 0 : 1; b.style.transform = 'translateY(' + px(-(1 - f) * 160) + ') scale(' + (0.7 + 0.3 * f).toFixed(3) + ') rotate(' + (Math.sin(t * 9 + b._t * 7) * 2).toFixed(2) + 'deg)';
    });
    if (p.set === 'click') {
      var press = i === 7 ? u : -1;
      var pop = i === 6 ? E.back(u / 0.35) : 1, sq = press >= 0 && press < 0.1 ? 0.9 : press >= 0.1 && press < 0.35 ? 0.9 + 0.1 * E.back((press - 0.1) / 0.25) : 1;
      S.btn.style.transform = 'scale(' + (pop * sq * (1 + 0.015 * Math.sin(t * 9))).toFixed(4) + ')';
      var fly = i === 6 ? E.io((u - 0.3) / 1.3) : 1, fx = lerp(980, 600, E.o3(fly)), fy = lerp(380, 1490, fly);
      S.ptr.style.opacity = i === 6 || press < 0.6 ? 1 : Math.max(0, 1 - (press - 0.6) / 0.3);
      S.ptr.style.transform = 'translate(' + px(fx) + ',' + px(fy) + ') scale(' + (press >= 0 && press < 0.1 ? 0.85 : 1) + ')';
      S.rips.forEach(function (r, j) { var a = press - j * 0.22; r.style.opacity = a > 0 && a < 1.2 ? (0.9 * (1 - a / 1.2)).toFixed(2) : 0; r.style.transform = 'scale(' + (1 + Math.max(0, a) * 1.6).toFixed(3) + ',' + (1 + Math.max(0, a) * 4).toFixed(3) + ')'; });
    }
    if (p.set === 'snap') {
      var sx = i === 9 ? lerp(-600, 1500, clamp((u - 0.15) / 1.3)) : -2000;
      S.sweep.style.transform = 'translateX(' + px(sx) + ') skewX(-12deg)';
      S.tiles.forEach(function (T, j) {
        var f = E.io((t - T._t) / 0.75), x = lerp(T._sx, T._x, f), y = lerp(T._sy, T._y, f) - 6 * Math.sin(t * 5 + j * 0.4) * f;
        var lit = i === 9 ? clamp((sx + 260 - T._x) / 200) : 0;
        T.style.transform = 'translate(' + px(x) + ',' + px(y) + ') rotate(' + (T._sr * (1 - f)).toFixed(2) + 'deg)';
        T.style.filter = 'brightness(' + (0.55 + 0.25 * f + 0.45 * lit).toFixed(2) + ')';
      });
    }
    if (p.set === 'check') {
      var prog = i === 10 ? 0.5 * clamp(u / 1.6) : 0.5 + 0.5 * clamp(u / 1.2);
      S.arc.setAttribute('stroke-dashoffset', (S.CIRC * (1 - prog)).toFixed(1));
      S.pct.textContent = Math.round(prog * 100) + '%';
    }
    if (p.set === 'num') {
      var lockT = i === 12 ? [0.5, 0.8, 1.1] : [-1, -1, -1], ch = ['0', '.', '8'].map(function (cc, j) {
        if (cc === '.' || u >= lockT[j]) return cc; var x = (Math.imul(Math.floor(t * 30) + 1, 2654435761) ^ Math.imul(j + 7, 40503)) >>> 0; return String(x % 10);
      });
      var html = ch.join('') + '<small>s</small>'; if (S.num.innerHTML !== html) S.num.innerHTML = html;
      var grow = i === 12 ? E.o3(u / 0.4) : 1, wN = S.num.offsetWidth, hN = S.num.offsetHeight;
      S.num.style.transform = 'translate(' + px(540 - wN / 2) + ',' + px(1060 - hN / 2) + ') scale(' + ((0.92 + 0.08 * grow) * (1 + 0.02 * Math.sin(t * 4))).toFixed(4) + ')';
      S.num.style.opacity = i === 12 ? 0.3 + 0.7 * clamp(u / 0.15) : 1;
      S.num.style.color = i === 14 ? 'var(--accent)' : '#F2F5FA';
      S.dot.style.opacity = i === 12 ? Math.max(0, 1 - u / 0.5) : 0; S.dot.style.transform = 'scale(' + (i === 12 ? 1 + 40 * E.o3(u / 0.5) : 1).toFixed(2) + ')';
      S.sub.style.opacity = i === 12 && u < 1.1 ? 0 : 1; S.sub.style.transform = 'translateY(' + px(Math.sin(t * 2.4) * 6) + ')';
    }
    if (p.set === 'cmp') {
      S.strike.style.transform = 'scaleX(' + E.o3((u - 0.3) / 0.4).toFixed(3) + ') rotate(-4deg)';
      S.old.style.opacity = (1 - 0.45 * clamp((u - 0.7) / 0.4)).toFixed(2);
      S.neu.style.transform = 'scale(' + (1 + 0.08 * E.back(clamp((u - 0.9) / 0.4)) + 0.015 * Math.sin(t * 5)).toFixed(4) + ')';
      S.cmp.style.transform = 'translateY(' + px(Math.sin(t * 2) * 8) + ')';
    }
    if (p.set === 'end') S.row.forEach(function (T, j) { T.style.transform = 'translateY(' + px(-10 * Math.abs(Math.sin(t * 3 + j * 0.5))) + ')'; T.style.filter = 'brightness(' + (0.9 + 0.4 * Math.max(0, Math.sin(t * 3 - j * 0.6))).toFixed(2) + ')'; });

    var L = S.labels[i]; if (L) DKV.say(L, u);
  }

  DKV.film({ dur: DUR, accent: '#7CF5C8' }, build, render);
})();
