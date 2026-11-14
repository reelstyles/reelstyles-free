/* characters/cast.js: the dark-keynote hero, an app window with a screen face (the product is the star, so the product is the cast).
   Classic script, after engine/dk.js (and engine/dk-v.js + engine/safe.js in 9:16). Pure function of t: call hero.draw() every frame.
     var me = DK.hero(parent, { title: 'Tidy', w: 600, h: 900 })   600 x 900 stage px at s 1 (47% of a 1920 frame)
     me.draw({ x, y, s, pose, u, face, body, k, glow, badge, dir })
       x, y   bottom centre in stage px (the card stands on y)      s      scale (1 = 900 px tall)
       pose   'idle' | 'walk' | 'reach' | 'cheer' | 'slump'         u      seconds into the pose (drives the motion)
       face   'calm' | 'worried' | 'happy' | 'surprised' (blinks by itself)
       body   'mess' | 'sorted' | 'check' | 'blank', k = progress 0..1 (tiles landed, items checked)
       glow   0..1 accent rim                                        badge  text on the coral counter in the title bar ('' = off)
       dir    reach / lean direction, 1 right, -1 left
   In 9:16 the hero tracks itself: the card is 'hero', the screen face is 'face' (labels never cover it). */
(function () {
  var CAT = ['#7CA8FF', '#FFB454', '#B58CFF', '#5ED6A8'];
  var GLYPH = function (c) { return '<svg viewBox="0 0 64 64" width="100%" height="100%"><path d="M14 6h26l14 14v38H14z" fill="' + c + '"/><path d="M40 6v14h14z" fill="#fff" fill-opacity=".4"/><rect x="22" y="32" width="24" height="5" rx="2.5" fill="#06080D" fill-opacity=".45"/><rect x="22" y="43" width="16" height="5" rx="2.5" fill="#06080D" fill-opacity=".45"/></svg>'; };
  var ss = function (k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };

  DK.hero = function (parent, o) {
    o = o || {}; var Wd = o.w || 600, Ht = o.h || 900;
    var shadow = DK.el(parent, 'dkp-shadow', null, { position: 'absolute', left: '0', top: '0', width: (Wd * 1.3) + 'px', height: '90px', transformOrigin: '50% 50%' });   // contact shadow on the floor
    var root = DK.el(parent, '', null, { position: 'absolute', left: '0', top: '0', width: Wd + 'px', height: Ht + 'px', transformOrigin: '50% 100%', zIndex: 200 });
    var ci = DK.el(root, '', null, { position: 'absolute', inset: '0', borderRadius: '48px', background: 'linear-gradient(180deg,#2A3349,#1A2133 60%,#151B2A)', border: '3px solid rgba(255,255,255,.2)', boxSizing: 'border-box', overflow: 'hidden' });
    var bar = DK.el(ci, '', '<i style="display:block;width:34px;height:34px;border-radius:10px;background:var(--accent);box-shadow:0 0 18px rgba(var(--accent-rgb),.8)"></i><span>' + (o.title || 'Tidy') + '</span>',
      { position: 'absolute', left: '0', right: '0', top: '0', height: '104px', display: 'flex', alignItems: 'center', gap: '20px', padding: '0 34px', font: '500 46px/1 "JetBrains Mono",monospace', letterSpacing: '.12em', textTransform: 'uppercase', color: '#C9D1E0', borderBottom: '2px solid rgba(255,255,255,.1)', boxSizing: 'border-box' });
    var badge = DK.el(ci, '', '', { position: 'absolute', right: '26px', top: '18px', minWidth: '68px', height: '68px', padding: '0 18px', borderRadius: '34px', background: 'var(--problem)', color: '#1a0508', font: '900 46px/68px "Inter",sans-serif', textAlign: 'center', boxSizing: 'border-box', boxShadow: '0 0 30px rgba(255,92,108,.6)', display: 'none' });
    // the screen face: two light pills and a caret mouth on a dark inset
    var face = DK.el(ci, '', null, { position: 'absolute', left: '40px', top: '136px', width: (Wd - 80) + 'px', height: '300px', borderRadius: '34px', background: '#090D15', border: '2px solid rgba(255,255,255,.08)', boxSizing: 'border-box', overflow: 'hidden' });
    var eyes = [0, 1].map(function () { return DK.el(face, '', null, { position: 'absolute', boxSizing: 'border-box', transformOrigin: '50% 50%' }); });
    var mouth = DK.el(face, '', null, { position: 'absolute', boxSizing: 'border-box', transformOrigin: '50% 50%' });
    var body = DK.el(ci, '', null, { position: 'absolute', left: '40px', top: '470px', width: (Wd - 80) + 'px', height: (Ht - 510) + 'px' });
    // body: mess lines, sorted tiles, checklist (all built once, shown by mode)
    var mess = DK.el(body, '', null, { position: 'absolute', inset: '0' }), rnd = DK.rng(5), messL = [];
    for (var i = 0; i < 6; i++) {
      var L = DK.el(mess, '', null, { position: 'absolute', left: (rnd() * 40) + 'px', top: (18 + i * 62) + 'px', width: (180 + rnd() * 280) + 'px', height: '26px', borderRadius: '13px', background: i % 3 === 1 ? 'rgba(255,92,108,.75)' : 'rgba(255,255,255,.26)' });
      L._r = (rnd() - 0.5) * 9; L._p = rnd() * 6; messL.push(L);
    }
    var sorted = DK.el(body, '', null, { position: 'absolute', inset: '0' }), tiles = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) {
      var T = DK.el(sorted, '', GLYPH(CAT[r]), { position: 'absolute', left: (14 + c * 124) + 'px', top: (10 + r * 124) + 'px', width: '104px', height: '104px', borderRadius: '24px', background: '#0E131E', border: '2px solid rgba(255,255,255,.12)', padding: '14px', boxSizing: 'border-box' });
      T._i = r * 4 + c; tiles.push(T);
    }
    var check = DK.el(body, '', null, { position: 'absolute', inset: '0' }), items = [];
    ['Backup', 'Sync', 'Sort', 'Ship'].forEach(function (name, j) {
      var row = DK.el(check, '', null, { position: 'absolute', left: '10px', top: (8 + j * 94) + 'px', display: 'flex', alignItems: 'center', gap: '28px', font: '500 46px/1 "JetBrains Mono",monospace', letterSpacing: '.08em', textTransform: 'uppercase', color: '#9AA3B5' });
      var box = DK.el(row, '', '', { width: '64px', height: '64px', borderRadius: '18px', border: '4px solid rgba(255,255,255,.35)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 46px/1 "Inter",sans-serif', color: '#04120D' });
      DK.el(row, '', name); items.push({ row: row, box: box });
    });
    var me = { el: root, card: ci, face: face, body: body };
    if (typeof DKV !== 'undefined') { DKV.track(ci, 'hero', o.title || 'hero'); DKV.track(face, 'face', 'screen face'); }

    function setFace(kind, t) {
      var fw = Wd - 80, cx = [fw / 2 - 110, fw / 2 + 110], acc = 'var(--accent)', bad = 'var(--problem)';
      var blink = ((t + (o.seed || 0)) % 2.6) < 0.12 && kind !== 'happy';
      eyes.forEach(function (e, j) {
        var S = e.style, w, h, y = 64; S.border = 'none'; S.borderRadius = '40px'; S.background = acc; S.boxShadow = '0 0 34px rgba(var(--accent-rgb),.75)'; S.rotate = '0deg';
        if (kind === 'worried') { w = 62; h = 96; y = 78; S.background = bad; S.boxShadow = '0 0 34px rgba(255,92,108,.7)'; S.rotate = (j ? -14 : 14) + 'deg'; }
        else if (kind === 'happy') { w = 104; h = 64; y = 84; S.background = 'none'; S.border = '20px solid ' + acc; S.borderBottom = 'none'; S.borderRadius = '60px 60px 0 0'; S.boxShadow = 'none'; }
        else if (kind === 'surprised') { w = 96; h = 96; y = 64; S.borderRadius = '50%'; }
        else { w = 68; h = 124; y = 50; }
        S.width = w + 'px'; S.height = h + 'px'; S.left = (cx[j] - w / 2) + 'px'; S.top = y + 'px';
        S.transform = blink ? 'scaleY(0.12)' : 'none';
      });
      var M = mouth.style; M.border = 'none'; M.background = 'none'; M.borderRadius = '0'; M.rotate = '0deg';
      if (kind === 'happy') { M.width = '170px'; M.height = '74px'; M.border = '18px solid var(--accent)'; M.borderTop = 'none'; M.borderRadius = '0 0 90px 90px'; M.left = (fw / 2 - 85) + 'px'; M.top = '176px'; }
      else if (kind === 'surprised') { M.width = '64px'; M.height = '64px'; M.border = '14px solid var(--accent)'; M.borderRadius = '50%'; M.left = (fw / 2 - 32) + 'px'; M.top = '196px'; }
      else if (kind === 'worried') { M.width = '96px'; M.height = '16px'; M.background = 'var(--problem)'; M.borderRadius = '8px'; M.left = (fw / 2 - 48) + 'px'; M.top = '218px'; M.rotate = (Math.sin(t * 9) * 6).toFixed(1) + 'deg'; }
      else { M.width = '20px'; M.height = '74px'; M.background = 'var(--accent)'; M.borderRadius = '5px'; M.left = (fw / 2 - 10) + 'px'; M.top = '200px'; M.opacity = (t % 0.8) < 0.4 ? 1 : 0.25; return; }   // calm: the blinking caret
      M.opacity = 1;
    }

    me.draw = function (p) {
      var u = p.u || 0, s = p.s || 1, dir = p.dir || 1, dx = 0, dy = 0, rot = 0, sx = 1, sy = 1, light = 1, ph;
      switch (p.pose) {
        case 'walk': ph = u / 0.5; dy = -28 * Math.abs(Math.sin(Math.PI * ph)); rot = 4 * Math.sin(Math.PI * ph) * dir; sy = 1 - 0.04 * Math.pow(1 - Math.abs(Math.sin(Math.PI * ph)), 4); sx = 2 - sy; break;
        case 'reach': ph = ss(u / 0.35); rot = 7 * ph * dir + Math.sin(u * 4) * 0.6; sx = 1 + 0.04 * ph; sy = 1 - 0.02 * ph; dx = 20 * ph * dir; break;
        case 'cheer': ph = u / 0.62; var j = Math.abs(Math.sin(Math.PI * ph)); dy = -80 * j; sy = 1 - 0.09 * Math.pow(1 - j, 8) + 0.03 * j; sx = 2 - sy; rot = 3 * Math.sin(Math.PI * ph * 0.5); break;
        case 'slump': rot = (-6 - 1.2 * Math.sin(u * 1.4)) * dir; sy = 0.93 + 0.008 * Math.sin(u * 3); sx = 1.04; dy = 6; light = 0.74; break;
        default: dy = -7 * Math.sin(u * Math.PI * 2 / 1.1); rot = 0.9 * Math.sin(u * 1.7); sy = 1 + 0.01 * Math.sin(u * 5.7); sx = 2 - sy;
      }
      shadow.style.transform = 'translate(' + (p.x - Wd * 0.65).toFixed(1) + 'px,' + (p.y - 45).toFixed(1) + 'px) scale(' + (s * (1 + dy / 400)).toFixed(3) + ')'; shadow.style.opacity = (1 + dy / 200).toFixed(2);
      root.style.left = (p.x - Wd / 2) + 'px'; root.style.top = (p.y - Ht) + 'px';
      root.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + (s * sx).toFixed(4) + ',' + (s * sy).toFixed(4) + ')';
      var g = p.glow == null ? 0.4 : p.glow;
      ci.style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb),' + (0.35 * g).toFixed(2) + '),0 0 ' + (60 + 80 * g).toFixed(0) + 'px rgba(var(--accent-rgb),' + (0.3 * g).toFixed(2) + '),0 40px 90px rgba(0,0,0,.65),inset 0 3px 0 rgba(255,255,255,.12)';
      ci.style.filter = light < 1 ? 'brightness(' + light + ')' : 'none';
      badge.style.display = p.badge ? 'block' : 'none'; if (p.badge && badge.textContent !== p.badge) badge.textContent = p.badge;
      setFace(p.face || 'calm', u + (p.t || 0));
      var mode = p.body || 'blank', k = p.k == null ? 1 : p.k;
      mess.style.display = mode === 'mess' ? 'block' : 'none'; sorted.style.display = mode === 'sorted' ? 'block' : 'none'; check.style.display = mode === 'check' ? 'block' : 'none';
      if (mode === 'mess') messL.forEach(function (L, i) { L.style.transform = 'translate(' + (Math.sin(u * 7 + L._p) * 8).toFixed(1) + 'px,' + (Math.cos(u * 5 + L._p) * 4).toFixed(1) + 'px) rotate(' + (L._r + Math.sin(u * 6 + i) * 2).toFixed(1) + 'deg)'; });
      if (mode === 'sorted') tiles.forEach(function (T) {
        var q = clamp(k * 1.5 - (T._i / 12) * 0.5), e = 1 - Math.pow(1 - q, 3), land = 1 + 0.12 * Math.sin(Math.PI * clamp((q - 0.8) / 0.2)) * (q < 1 ? 1 : 0);
        T.style.opacity = (0.15 + 0.85 * e).toFixed(2);
        T.style.transform = 'translate(' + ((1 - e) * ((T._i * 37) % 160 - 80)).toFixed(1) + 'px,' + ((1 - e) * -120).toFixed(1) + 'px) rotate(' + ((1 - e) * ((T._i % 3) - 1) * 30).toFixed(1) + 'deg) scale(' + land.toFixed(3) + ')';
      });
      if (mode === 'check') items.forEach(function (it, j) {
        var on = k * 4 - j, done = on >= 0;
        it.box.style.background = done ? 'var(--accent)' : 'none'; it.box.style.borderColor = done ? 'var(--accent)' : 'rgba(255,255,255,.35)';
        it.box.textContent = done ? '✓' : ''; it.box.style.transform = done ? 'scale(' + (1 + 0.25 * Math.max(0, 1 - on * 4)).toFixed(3) + ')' : 'none';
        it.row.style.color = done ? '#F2F5FA' : '#9AA3B5';
      });
    };
    return me;
  };
})();
