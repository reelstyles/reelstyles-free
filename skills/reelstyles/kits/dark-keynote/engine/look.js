/* engine/look.js: the cinematic layer of dark-keynote (9:16 and any DKV film). Classic script after engine/dk-v.js.
   A shot = a PLACE (sets/places.js) seen through a moving camera: far layer (back wall or horizon, parallax 0.5), mid layer
   (floor, props, the hero, in #dk-cam) and near layer (soft foreground, parallax 1.4), one light source with glow and a rim on
   the subject, moving air (motes + haze), a mood grade, vignette and film grain. Everything is a pure function of t.
     DKL.init()                           once in build(), before the places
     DKL.frame(t, {cam, grade, place})    every frame first in render(): cam [x,y,s,rot] (stage px), grade name or a mixGrade()
     DKL.grade(a, b, k)                   a grade between two presets (the colour turns inside a shot)
     DKL.aimY(feetY, s)                   camera centre y that puts the subject's feet at screen y 1560 (the default wide)
     DKL.move(kind, x, y, s)              camera array for a PICS entry: 'push' 'pull' 'pan' 'panL' 'crane' 'drift'
     DKL.rim(el, place, k)                after hero.draw(): rim + glow from the place's light on that element
     DKL.show(place, ...sets)             show one place (all its layers) plus extra DKV sets */
(function () {
  var DKL = (window.DKL = {});
  var GR = (DKL.GRADES = {
    night: { lift: '#1E3060', light: '#9CC2FF', tint: '#3358B0', tintK: 0.26, vig: 0.62, haze: 0.16 },
    alarm: { lift: '#5A1A2E', light: '#FF6B78', tint: '#C0303F', tintK: 0.24, vig: 0.66, haze: 0.18 },
    focus: { lift: '#1E2840', light: '#E4ECFF', tint: '#5A6E96', tintK: 0.1, vig: 0.5, haze: 0.12 },
    win: { lift: '#124038', light: '#7CF5C8', tint: '#2FBF8F', tintK: 0.2, vig: 0.42, haze: 0.16 },
    gold: { lift: '#3E2C14', light: '#FFC46B', tint: '#E09A3A', tintK: 0.2, vig: 0.42, haze: 0.16 },
  });
  var hx = function (c) { return [1, 3, 5].map(function (i) { return parseInt(c.slice(i, i + 2), 16); }); };
  var mixHex = function (a, b, k) { var A = hx(a), B = hx(b); return '#' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0'); }).join(''); };
  DKL.grade = function (a, b, k) {
    a = typeof a === 'string' ? GR[a] : a; b = typeof b === 'string' ? GR[b] : b; k = clamp(k); k = k * k * (3 - 2 * k); var o = {};
    for (var key in a) o[key] = typeof a[key] === 'string' ? mixHex(a[key], b[key], k) : a[key] + (b[key] - a[key]) * k;
    return o;
  };
  // the default framing: feet of the subject at screen y 1560 (floor under them, set and label band above), zoom s
  DKL.aimY = function (feetY, s) { return feetY - 600 / s; };
  DKL.move = function (kind, x, y, s) {
    switch (kind) {
      case 'push': return [x, y + 20, s, x, y, s * 1.08, 0, 0];
      case 'pull': return [x, y - 20, s * 1.1, x, y, s, 0, 0];
      case 'pan': return [x - 70, y, s, x + 70, y, s * 1.02, -0.6, 0.6];
      case 'panL': return [x + 70, y, s, x - 70, y, s * 1.02, 0.6, -0.6];
      case 'crane': return [x, y + 110, s * 1.04, x, y - 40, s, 0, 0];
      default: return [x, y, s, x + 20, y - 15, s * 1.04, -1, 1];   // drift
    }
  };
  var st, cam, far, near, air, haze, tint, grain, vig, lift, motes = [], C = { x: 540, y: 960, s: 1, rot: 0 }, PL = [];
  var PAR = { far: 0.5, near: 1.4 };
  DKL.init = function () {
    st = document.getElementById('dk-stage'); cam = document.getElementById('dk-cam'); vig = document.getElementById('dk-vig'); lift = document.getElementById('dk-lift');
    far = DK.el(st, ''); far.id = 'dkl-far'; st.insertBefore(far, cam);
    near = DK.el(st, ''); near.id = 'dkl-near'; st.insertBefore(near, vig);
    air = DK.el(st, ''); air.id = 'dkl-air'; st.insertBefore(air, near);
    haze = DK.el(air, 'dkl-haze');
    var R = DK.rng(31);
    for (var i = 0; i < 44; i++) { var m = DK.el(air, 'dkl-mote'); m._x = R() * 1180 - 50; m._y = R() * 2000; m._v = 18 + R() * 50; m._s = 4 + R() * 9; m._p = R() * 6; m._a = 0.25 + R() * 0.55; m.style.width = m.style.height = m._s.toFixed(1) + 'px'; if (m._s > 10) m.style.filter = 'blur(3px)'; motes.push(m); }
    tint = DK.el(st, ''); tint.id = 'dkl-tint'; st.insertBefore(tint, vig);
    grain = DK.el(st, ''); grain.id = 'dkl-grain'; st.insertBefore(grain, vig.nextSibling);
  };
  /* a place: far / mid / near containers; recipes fill them (sets/places.js) */
  DKL.place = function (name) {
    var P = { name: name, far: DK.el(far, 'dkl-layer'), mid: DKV.set(name), near: DK.el(near, 'dkl-layer'), light: null };
    P.far.style.display = P.near.style.display = 'none'; PL.push(P); return P;
  };
  DKL.show = function (P) {
    var extra = [].slice.call(arguments, 1);
    PL.forEach(function (q) { q.far.style.display = q.near.style.display = q === P ? 'block' : 'none'; });
    DKV.show.apply(null, [P && P.mid].concat(extra));
  };
  function layer(el, p) {   // parallax: the layer moves p times the camera, zooms 1 + (s - 1) p
    var zp = 1 + (C.s - 1) * p, cx = 540 + (C.x - 540) * p, cy = 960 + (C.y - 960) * p;
    el.style.transform = 'translate(540px,960px) rotate(' + (C.rot * p).toFixed(3) + 'deg) scale(' + zp.toFixed(4) + ') translate(' + (-cx).toFixed(1) + 'px,' + (-cy).toFixed(1) + 'px)';
  }
  DKL.screen = function (x, y) { return [(x - C.x) * C.s + 540, (y - C.y) * C.s + 960]; };
  DKL.frame = function (t, o) {
    var c = o.cam; C = { x: c[0], y: c[1], s: c[2], rot: c[3] || 0 };
    DKV.cam(C.x, C.y, C.s, C.rot); layer(far, PAR.far); layer(near, PAR.near);
    var g = typeof o.grade === 'string' ? GR[o.grade] : o.grade, rgb = hx(g.light).join(',');
    st.style.setProperty('--light-rgb', rgb); st.style.setProperty('--light', g.light);
    var P = o.place, L = P && P.light, ls = L ? DKL.screen(L.x, L.y) : [540, 500];
    lift.style.background = 'radial-gradient(1100px 1300px at ' + ls[0].toFixed(0) + 'px ' + ls[1].toFixed(0) + 'px,' + g.lift + ' 0%,rgba(0,0,0,0) 72%)';
    tint.style.background = g.tint; tint.style.opacity = g.tintK.toFixed(3);
    vig.style.background = 'radial-gradient(ellipse 85% 72% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,' + g.vig.toFixed(2) + ') 100%)';
    haze.style.opacity = g.haze.toFixed(3); haze.style.transform = 'translateX(' + (Math.sin(t * 0.35) * 120).toFixed(1) + 'px)';
    motes.forEach(function (m) {
      var y = ((m._y - t * m._v) % 2000 + 2000) % 2000 - 40, x = m._x + Math.sin(t * 0.6 + m._p) * 30;
      m.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; m.style.opacity = (m._a * (0.6 + 0.4 * Math.sin(t * 1.3 + m._p))).toFixed(2);
    });
    var f = Math.floor(t * 24); grain.style.backgroundPosition = ((f * 137) % 256) + 'px ' + ((f * 71) % 256) + 'px';
    PL.forEach(function (q) { if (q.light && q.far.style.display !== 'none' && q.tick) q.tick(t); });
  };
  DKL.rim = function (el, P, k) {
    if (!P || !P.light) return; k = k == null ? 1 : k;
    var r = el.getBoundingClientRect(), ls = DKL.screen(P.light.x, P.light.y), dx = ls[0] - (r.left + r.right) / 2, dy = ls[1] - (r.top + r.bottom) / 2, d = Math.hypot(dx, dy) || 1;
    var ox = (dx / d * 9).toFixed(1), oy = (dy / d * 9).toFixed(1);
    el.style.filter = 'drop-shadow(' + ox + 'px ' + oy + 'px 0 rgba(var(--light-rgb),' + (0.75 * k).toFixed(2) + ')) drop-shadow(0 0 46px rgba(var(--light-rgb),' + (0.32 * k).toFixed(2) + '))';
  };
})();
