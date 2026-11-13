/* engine/dk-v.js: the 9:16 (1080x1920) mode of dark-keynote and its bridge to the shared layout guard (engine/safe.js, a canvas
   file kept byte-identical in every kit). Classic script. Load order (templates/vertical.html):
     gsap -> engine/dk.js -> engine/dk-v.js -> engine/safe.js -> characters/cast.js -> film.js
   A vertical film is a pure function of t: build the DOM once, then place everything every frame (no tweens to keep in sync).
     DKV.film({ dur, accent }, build, render)   build(S) runs once after the fonts load; render(t, S) runs every frame
     DKV.set(name)            a set (one stage picture) in the camera; DKV.show(a, b, ...) each frame shows those sets and hides the others
     DKV.cam(x, y, s, rot)    the camera: stage point (x, y) at the frame centre, zoom s (call it every frame)
     DKV.glow(x, y)           where the accent glow sits this frame (stage px)
     DKV.track(el, kind, name)   'hero' | 'face' | 'key' | 'extra' | 'prop': its screen box goes to the guard every frame it shows
     DKV.label(html, cls)     a label plate (72 px Inter 800 on a raised plate, <b> accent, <i> problem coral); cls 'mark' = wordmark
     DKV.say(label, u)        show it this frame, u = seconds since its picture began (pops on whole); y comes from labelY()
     DKV.end(t0, t1, lines)   end card over the last picture (endCard() timing from safe.js, drawn in DOM, complete on its first frame)
   Safe zones, framing rules and keys(t0, 2.0, list) live in engine/safe.js; tools/layout-check.mjs fails a film that breaks them. */
var W = 1080, H = 1920, TT = 0;
var ctx = { getTransform: function () { return new DOMMatrix(); } };   // DOM boxes are measured in screen px already
function clamp(x, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return x < a ? a : x > b ? b : x; }
function renderFrame(t) { TT = t; if (window.DKV && DKV._render) DKV._render(t); }

(function () {
  var DKV = (window.DKV = {});
  var TR = [], LB = [], SHOWN = [], SETS = [], st, cam, grid, glow, hud, endEl = null, RENDER = null, S = {};
  DKV.ease = {
    io: function (k) { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    o3: function (k) { k = clamp(k); return 1 - Math.pow(1 - k, 3); },
    back: function (k) { k = clamp(k) - 1; return 1 + 2.70158 * k * k * k + 1.70158 * k * k; },
  };
  DKV.lerp = function (a, b, k) { return a + (b - a) * k; };
  DKV.set = function (name) { var d = DK.el(cam, 'dkv-set'); d.dataset.set = name; d.style.display = 'none'; SETS.push(d); return d; };
  DKV.show = function () { var on = [].slice.call(arguments); SETS.forEach(function (d) { d.style.display = on.indexOf(d) >= 0 ? 'block' : 'none'; }); };
  DKV.cam = function (x, y, s, rot) {
    cam.style.transform = 'translate(540px,960px) rotate(' + (rot || 0).toFixed(3) + 'deg) scale(' + s.toFixed(4) + ') translate(' + (-x).toFixed(1) + 'px,' + (-y).toFixed(1) + 'px)';
  };
  DKV.glow = function (x, y) { glow.style.transform = 'translate(' + (x - 700).toFixed(1) + 'px,' + (y - 700).toFixed(1) + 'px)'; };
  DKV.track = function (el, kind, name) { TR.push({ el: el, kind: kind, name: name || '' }); return el; };
  DKV.label = function (html, cls) { var d = DK.el(hud, 'dkv-label' + (cls ? ' ' + cls : ''), html); LB.push(d); return d; };
  DKV.say = function (l, u) { SHOWN.push([l, u || 0]); };
  DKV.end = function (t0, t1, lines) {
    endCard(t0, t1, lines);
    endEl = DK.el(st, ''); endEl.id = 'dkv-end';
    DK.el(endEl, 'l1', lines[0], { top: (H * 0.45 - 140) + 'px' }); DK.el(endEl, 'l2', lines[1] || '', { top: (H * 0.45 + 30) + 'px' });
  };

  function shown(el) {   // effective opacity, 0 when it or a parent is display:none
    if (!el.isConnected) return 0; var o = 1;
    for (var e = el; e && e !== document.body; e = e.parentElement) { var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; }
    return o;
  }
  function fitEnd() {   // measured while shown: a hidden element has no width (the first sample ran 'Made by Claude Code' off the frame)
    endEl.style.display = 'block';
    endEl.querySelectorAll('div').forEach(function (d) { var fs = 112; d.style.width = 'max-content'; d.style.fontSize = fs + 'px'; while (d.offsetWidth > 800 && fs > 64) { fs -= 4; d.style.fontSize = fs + 'px'; } d.style.width = '880px'; });
    endEl.style.display = 'none';
  }

  DKV._render = function (t) {
    if (typeof LAYOUT !== 'undefined') LAYOUT.length = 0;
    SHOWN.length = 0; LB.forEach(function (l) { l.style.display = 'none'; });
    grid.style.transform = 'translate(' + (-t * 5).toFixed(1) + 'px,' + (-t * 2.6).toFixed(1) + 'px)';   // the grid plane creeps: never a hold
    RENDER(t, S);
    for (var i = 0; i < TR.length; i++) {
      var tr = TR[i]; if (shown(tr.el) < 0.25) continue;
      var r = tr.el.getBoundingClientRect(); if (!r.width) continue;
      track(tr.kind, r.left, r.top, r.right, r.bottom, tr.name);
    }
    SHOWN.forEach(function (p) {   // labels after the hero: labelY() reads the hero's box of this frame
      var l = p[0], u = p[1]; l.style.display = 'block';
      var w = l.offsetWidth, h = l.offsetHeight, cy = labelY(h), pop = u < 0.2 ? 1 + 0.07 * Math.sin((u / 0.2) * Math.PI) : 1;
      var cx = (VSAFE.lx0 + VSAFE.lx1) / 2;
      l.style.transform = 'translate(' + (cx - w / 2).toFixed(1) + 'px,' + (cy - h / 2).toFixed(1) + 'px) scale(' + pop.toFixed(3) + ')';
      LAYOUT.push({ kind: 'label', name: l.textContent.slice(0, 40), x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 });
    });
    if (endEl) {
      var on = END && t >= END.t0;
      endEl.style.display = on ? 'block' : 'none';
      if (on) { var k = 1 + 0.015 * Math.sin((t - END.t0) * 3); endEl.style.transform = 'scale(' + k.toFixed(4) + ')'; }
    }
    if (typeof qaFrame === 'function') qaFrame();
  };

  DKV.film = function (o, build, render) {
    st = document.getElementById('dk-stage'); st.classList.add('dk-v');
    if (o.accent) { st.style.setProperty('--accent', o.accent); st.style.setProperty('--accent-rgb', DK.hex2rgb(o.accent).join(',')); }
    DK.el(st, '').id = 'dk-lift';
    cam = DK.el(st, ''); cam.id = 'dk-cam';
    grid = DK.el(cam, ''); grid.id = 'dk-grid';
    glow = DK.el(cam, ''); glow.id = 'dk-glow';
    DK.el(st, '').id = 'dk-vig';
    hud = DK.el(st, ''); hud.id = 'dk-hud';
    RENDER = render;
    var go = function () {
      build(S);
      if (endEl) fitEnd();
      var clock = { t: 0 }, tl = gsap.timeline({ paused: true });
      tl.to(clock, { t: o.dur, duration: o.dur, ease: 'none', onUpdate: function () { renderFrame(clock.t); } });
      renderFrame(0);
      window.__timelines = window.__timelines || {};
      window.__timelines['main'] = tl;   // register only after the build (HyperFrames rule)
    };
    Promise.all(['900 100px Inter', '800 72px Inter', '500 40px Inter', '500 40px "JetBrains Mono"'].map(function (f) { return document.fonts.load(f); })).then(go, go);
  };
})();
