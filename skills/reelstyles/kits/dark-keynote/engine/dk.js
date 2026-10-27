/* dark-keynote engine. Classic script, needs gsap. Every frame is a pure function of film time t:
   everything is a tween on one paused timeline, randomness is seeded, nothing reads Date/Math.random.
   API (all take the master timeline `tl` first):
     DK.init({total, accent, problem, seed})        -> {tl, cam, hud, stage}
     DK.rng(seed)                                    seeded random 0..1
     DK.camera(tl, t0, t1, {s0,s1,x0,x1,y0,y1,rot0,rot1,ease})   continuous camera move (every shot needs one)
     DK.alive(tl, el, t0, t1, {y,x,rot,s,period})    idle breathing (finite yoyo, no infinite repeats)
     DK.blink(tl, el, t0, t1, period)                caret / dot blink
     DK.win(parent, {w,h,x,y,title,color,badge,lines,icon,cat})   a UI window card
     DK.toast(tl, text, t0, t1)                      bottom caption pill, min 28px, fit-to-box
     DK.scramble(tl, el, t0, locks, finalChars, o)   digit scramble that locks one char per beat
     DK.fit(el,maxW,maxH,min)                        shrink text to a box, never below min (28)
     DK.audit()                                      raises any text under 28px to 28px, warns in console */
(function () {
  var DK = (window.DK = {});
  DK.MIN = 28;
  DK.rng = function (a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  DK.el = function (parent, cls, html, css) { var d = document.createElement('div'); d.className = cls || ''; if (html != null) d.innerHTML = html; if (css) Object.assign(d.style, css); parent.appendChild(d); return d; };
  DK.hex2rgb = function (h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };

  DK.init = function (o) {
    var st = document.getElementById('dk-stage');
    if (o.accent) { var r = DK.hex2rgb(o.accent); st.style.setProperty('--accent', o.accent); st.style.setProperty('--accent-rgb', r.join(',')); }
    if (o.problem) st.style.setProperty('--problem', o.problem);
    var cam = DK.el(st, ''); cam.id = 'dk-cam';
    DK.el(st, '').id = 'dk-lift'; st.insertBefore(document.getElementById('dk-lift'), cam);
    var grid = DK.el(cam, ''); grid.id = 'dk-grid';
    var glow = DK.el(cam, ''); glow.id = 'dk-glow';
    DK.el(st, '').id = 'dk-vig';
    var hud = DK.el(st, ''); hud.id = 'dk-hud';
    var tl = gsap.timeline({ paused: true });
    // the stage is alive from frame 0: the glow drifts, the whole grid plane creeps (a camera slide, never a hold)
    gsap.set(glow, { x: 1000, y: -120 });
    tl.fromTo(glow, { x: 1000, y: -120 }, { x: 560, y: 120, duration: o.total, ease: 'sine.inOut' }, 0);
    tl.fromTo(grid, { x: 0, y: 0 }, { x: -96, y: -48, duration: o.total, ease: 'none' }, 0);
    tl.to(glow, { opacity: 0.55, duration: o.total / 4, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0);
    tl.set({}, {}, o.total);
    window.__timelines = window.__timelines || {};
    return { tl: tl, cam: cam, hud: hud, stage: st, grid: grid, glow: glow };
  };

  DK.camera = function (tl, t0, t1, o) {
    var cam = document.getElementById('dk-cam');
    tl.fromTo(cam, { scale: o.s0 == null ? 1 : o.s0, x: o.x0 || 0, y: o.y0 || 0, rotation: o.rot0 || 0 },
      { scale: o.s1 == null ? 1 : o.s1, x: o.x1 || 0, y: o.y1 || 0, rotation: o.rot1 || 0, duration: t1 - t0, ease: o.ease || 'sine.inOut', immediateRender: false }, t0);
  };

  // idle breathing: finite yoyo that fills [t0,t1]; keeps nothing static
  DK.alive = function (tl, el, t0, t1, o) {
    o = o || {}; var per = o.period || 1.1, n = Math.max(1, Math.round((t1 - t0) / per)), d = (t1 - t0) / n;
    var v = { duration: d, yoyo: true, repeat: n - 1, ease: 'sine.inOut', immediateRender: false };
    if (o.y) v.y = '+=' + o.y; if (o.x) v.x = '+=' + o.x; if (o.rot) v.rotation = '+=' + o.rot;
    if (o.s) v.scale = (o.s0 || 1) * (1 + o.s);
    tl.to(el, v, t0);
  };
  DK.blink = function (tl, el, t0, t1, per) {
    per = per || 0.5; var n = Math.floor((t1 - t0) / per);
    for (var i = 0; i < n; i++) tl.set(el, { opacity: i % 2 ? 0.12 : 1 }, t0 + i * per);
    tl.set(el, { opacity: 1 }, t0 + n * per);
  };

  var ICON = function (c) { return '<svg viewBox="0 0 64 64"><path d="M14 6h26l14 14v38H14z" fill="' + c + '" fill-opacity=".92"/><path d="M40 6v14h14z" fill="#fff" fill-opacity=".35"/><rect x="22" y="32" width="24" height="4" rx="2" fill="#06080D" fill-opacity=".45"/><rect x="22" y="42" width="16" height="4" rx="2" fill="#06080D" fill-opacity=".45"/></svg>'; };
  DK.win = function (parent, o) {
    var w = DK.el(parent, 'dk-win', null, { width: o.w + 'px', height: o.h + 'px' });
    var ci = DK.el(w, 'ci');
    var cont = DK.el(ci, '', null, { position: 'absolute', inset: '0' });
    DK.el(cont, 'bar', '<i style="background:' + o.color + '"></i>' + o.title);
    var ly = 82; (o.lines || []).forEach(function (L) { DK.el(cont, 'ln', null, { top: ly + 'px', width: Math.round((o.w - 44) * L) + 'px' }); ly += 30; });
    if (o.badge) DK.el(cont, 'bd', o.badge);
    var ic = DK.el(ci, 'ic', ICON(o.color));
    w._ci = ci; w._cont = cont; w._ic = ic;
    gsap.set(w, { x: o.x, y: o.y, transformOrigin: '50% 50%' });
    return w;
  };

  DK.fit = function (el, maxW, maxH, min) {
    min = Math.max(min || DK.MIN, DK.MIN); var fs = parseFloat(getComputedStyle(el).fontSize);
    while (fs > min && (el.scrollWidth > maxW || (maxH && el.scrollHeight > maxH))) { fs -= 2; el.style.fontSize = fs + 'px'; }
    if (fs < min) el.style.fontSize = min + 'px';
  };

  DK.toast = function (tl, text, t0, t1) {
    var hud = document.getElementById('dk-hud');
    var T = DK.el(hud, 'dk-toast', '<span class="dot"></span><span class="tx">' + text + '</span>');
    var tx = T.querySelector('.tx'), dot = T.querySelector('.dot');
    DK.fit(T, 1700, 0, 32);
    gsap.set(T, { xPercent: -50, left: '50%', x: 0, y: 18 });
    tl.fromTo(T, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.16, ease: 'power3.out', immediateRender: false }, t0);
    tl.to(T, { y: -4, duration: Math.max(0.1, t1 - t0 - 0.36), ease: 'sine.inOut' }, t0 + 0.16);   // the toast floats slightly while it is up
    tl.to(dot, { scale: 1.35, duration: 0.3, yoyo: true, repeat: Math.max(1, Math.floor((t1 - t0) / 0.3) - 1), ease: 'sine.inOut', immediateRender: false }, t0);
    tl.to(T, { y: -16, opacity: 0, duration: 0.2, ease: 'power2.in' }, t1 - 0.2);
    return T;
  };

  // digits scramble and lock one char per beat. finalChars: array of strings, locks: array of lock times (s)
  DK.scramble = function (tl, el, t0, locks, finalChars, o) {
    o = o || {}; var seed = o.seed || 7, fmt = o.fmt || function (s) { return s; };
    var tEnd = locks[locks.length - 1] + 0.01, st = { p: 0 }, R = '0123456789';
    function draw(t) {
      var out = finalChars.map(function (c, i) {
        if (!/[0-9]/.test(c) || t >= locks[Math.min(i, locks.length - 1)]) return c;
        var k = Math.floor(t * 30), x = (Math.imul(k + 1, 2654435761) ^ Math.imul(i + seed, 40503)) >>> 0; return R[x % 10];
      });
      el.innerHTML = fmt(out);
    }
    draw(t0);
    tl.fromTo(st, { p: t0 }, { p: tEnd, duration: tEnd - t0, ease: 'none', immediateRender: false, onUpdate: function () { draw(st.p); } }, t0);
  };

  DK.audit = function () {
    var n = 0; document.querySelectorAll('#dk-stage *').forEach(function (e) {
      var has = false; e.childNodes.forEach(function (c) { if (c.nodeType === 3 && c.textContent.trim()) has = true; });
      if (!has) return; var fs = parseFloat(getComputedStyle(e).fontSize);
      if (fs < DK.MIN) { e.style.fontSize = DK.MIN + 'px'; n++; console.warn('dark-keynote: text under 28px raised:', e.textContent.slice(0, 30)); }
    }); return n;
  };
})();
