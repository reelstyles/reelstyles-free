/* sets/props.js: generic set pieces in the dark-keynote surface language (navy steps, hairline border, top highlight, light
   only from var(--light-rgb)). Every prop stands with its bottom centre on (x, y) in stage px, scale s, with a contact shadow,
   and returns its element. Build story-only things the same way: DKP.box() is the raised surface every prop is made of.
     DKP.box(parent, x, y, w, h, css)          a raised surface, top-left at (x, y)
     DKP.rack(parent, {x, y, s})               server cabinet, ._leds (12 status lights) and ._body (glow it) to colour per frame
     DKP.desk(parent, {x, y, w})               a desk, top surface at y - 290
     DKP.monitor(parent, {x, y, s})            screen on a stand, ._screen (put story content in it; it glows)
     DKP.lamp(parent, {x, y, s, dir})          arm lamp, ._bulb is a light source position (stage px) for the place
     DKP.plant(parent, {x, y, s})              pot plant (calm, alive)
     DKP.shelf(parent, {x, y, w})              wall shelf with tiles
     DKP.plinth(parent, {x, y, w, h})          stage block
     DKP.truss(parent, {x, y, h})              light tower with a spot head
     DKP.tower(parent, {x, y, w, h, seed})     building card with lit windows (skylines)
     DKP.post(parent, {x, y, h})               street lamp */
(function () {
  var P = (window.DKP = {});
  var px = function (v) { return Math.round(v) + 'px'; };
  P.box = function (parent, x, y, w, h, css) {
    var d = DK.el(parent, 'dkp-s', null, { left: px(x), top: px(y), width: px(w), height: px(h) });
    if (css) for (var k in css) d.style[k] = css[k]; return d;
  };
  function root(parent, o, w, h) {   // a w x h box standing on (x, y), scale s, with its contact shadow
    var s = o.s || 1, sh = DK.el(parent, 'dkp-shadow', null, { left: px(o.x - w * s * 0.65), top: px(o.y - 26 * s), width: px(w * s * 1.3), height: px(52 * s) });
    var r = DK.el(parent, 'dkp', null, { left: px(o.x - w / 2), top: px(o.y - h), width: px(w), height: px(h), transform: 'scale(' + s + ')', transformOrigin: '50% 100%' });
    r._shadow = sh; return r;
  }
  P.rack = function (parent, o) {
    var r = root(parent, o, 240, 700); r._body = P.box(r, 0, 0, 240, 700, { borderRadius: '18px', borderTop: '4px solid rgba(var(--light-rgb),.5)' }); r._leds = [];
    for (var i = 0; i < 12; i++) {
      var y = 34 + i * 54; P.box(r, 20, y, 200, 40, { borderRadius: '8px', background: '#0C1018', boxShadow: 'none', border: '2px solid rgba(255,255,255,.08)' });
      DK.el(r, '', null, { position: 'absolute', left: '62px', top: px(y + 17), width: px(60 + (i * 37) % 70), height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,.24)' });
      r._leds.push(DK.el(r, 'dkp-led', null, { left: '34px', top: px(y + 11) }));
    }
    return r;
  };
  P.desk = function (parent, o) {
    var w = o.w || 640, r = root(parent, o, w, 300);
    P.box(r, 0, 0, w, 44, { borderRadius: '14px', background: 'linear-gradient(180deg,#2C3550,#1A2131)' });
    P.box(r, 30, 40, 34, 260, { borderRadius: '8px' }); P.box(r, w - 64, 40, 34, 260, { borderRadius: '8px' });
    P.box(r, w - 250, 50, 190, 120, { borderRadius: '12px' });   // drawer block
    return r;
  };
  P.monitor = function (parent, o) {
    var r = root(parent, o, 440, 360);
    P.box(r, 0, 0, 440, 280, { borderRadius: '20px', background: '#151A26' });
    r._screen = DK.el(r, '', null, { position: 'absolute', left: '16px', top: '16px', width: '408px', height: '248px', borderRadius: '10px', overflow: 'hidden', background: 'radial-gradient(120% 120% at 50% 0%,rgba(var(--light-rgb),.45),rgba(var(--light-rgb),0) 70%),#0B111C', boxShadow: '0 0 60px rgba(var(--light-rgb),.35)' });
    P.box(r, 195, 278, 50, 60, { borderRadius: '6px' }); P.box(r, 120, 334, 200, 26, { borderRadius: '10px' });
    return r;
  };
  P.lamp = function (parent, o) {
    var s = o.s || 1, dir = o.dir || 1, r = root(parent, o, 260, 420);
    P.box(r, 70, 392, 120, 28, { borderRadius: '14px' });
    P.box(r, 118, 170, 24, 230, { borderRadius: '12px', transform: 'rotate(' + (-12 * dir) + 'deg)', transformOrigin: '50% 100%' });
    P.box(r, dir > 0 ? 120 : 20, 120, 130, 22, { borderRadius: '11px', transform: 'rotate(' + (18 * dir) + 'deg)' });
    var head = P.box(r, dir > 0 ? 190 : -30, 120, 100, 70, { borderRadius: '50px 50px 14px 14px', transform: 'rotate(' + (30 * dir) + 'deg)' });
    DK.el(head, 'dkl-src', null, { left: '10px', top: '40px', width: '80px', height: '60px' });
    r._bulb = [o.x + (dir > 0 ? 110 : -110) * s, o.y - 260 * s]; return r;
  };
  P.plant = function (parent, o) {
    var r = root(parent, o, 220, 420);
    for (var i = 0; i < 7; i++) DK.el(r, '', null, { position: 'absolute', left: '95px', top: '40px', width: '34px', height: '230px', borderRadius: '34px 34px 6px 6px', transformOrigin: '50% 100%', transform: 'rotate(' + (-48 + i * 16) + 'deg)', background: 'linear-gradient(180deg,#5ED6A8,#2C6E5A)', opacity: '.85', border: '2px solid rgba(255,255,255,.12)', boxSizing: 'border-box' });
    P.box(r, 40, 260, 140, 160, { borderRadius: '18px 18px 36px 36px' });
    return r;
  };
  P.shelf = function (parent, o) {
    var w = o.w || 520, r = DK.el(parent, 'dkp', null, { left: px(o.x - w / 2), top: px(o.y - 170), width: px(w), height: '170px' }), C = ['#7CA8FF', '#FFB454', '#B58CFF', '#5ED6A8'];
    for (var i = 0; i < Math.floor(w / 110); i++) P.box(r, 14 + i * 110, (i % 2) * 24, 92, 130 - (i % 2) * 24, { borderRadius: '14px', borderTop: '6px solid ' + C[i % 4] });
    P.box(r, 0, 128, w, 30, { borderRadius: '10px' });
    return r;
  };
  P.plinth = function (parent, o) {
    var w = o.w || 300, h = o.h || 220, r = root(parent, o, w, h); P.box(r, 0, 0, w, h, { borderRadius: '16px' });
    DK.el(r, 'dkl-edge', null, { left: '20px', top: '0', width: px(w - 40) }); return r;
  };
  P.truss = function (parent, o) {
    var h = o.h || 1100, r = root(parent, o, 90, h);
    P.box(r, 0, 0, 22, h, { borderRadius: '8px' }); P.box(r, 68, 0, 22, h, { borderRadius: '8px' });
    for (var y = 40; y < h - 40; y += 90) DK.el(r, '', null, { position: 'absolute', left: '10px', top: px(y), width: '70px', height: '6px', background: 'rgba(255,255,255,.14)', transform: 'rotate(' + ((y / 90) % 2 ? 40 : -40) + 'deg)' });
    var head = P.box(r, -25, -60, 140, 90, { borderRadius: '24px' }); DK.el(head, 'dkl-src', null, { left: '25px', top: '50px', width: '90px', height: '70px' });
    return r;
  };
  P.tower = function (parent, o) {
    var w = o.w || 220, h = o.h || 700, R = DK.rng(o.seed || 3), r = DK.el(parent, 'dkp', null, { left: px(o.x - w / 2), top: px(o.y - h), width: px(w), height: px(h) });
    P.box(r, 0, 0, w, h, { borderRadius: '18px 18px 0 0', background: 'linear-gradient(180deg,#1B2234,#0E121B)' });
    for (var yy = 40; yy < h - 40; yy += 56) for (var xx = 24; xx < w - 40; xx += 48) if (R() < 0.42) DK.el(r, '', null, { position: 'absolute', left: px(xx), top: px(yy), width: '24px', height: '30px', borderRadius: '5px', background: R() < 0.25 ? 'rgba(var(--light-rgb),.85)' : 'rgba(255,224,170,.55)', boxShadow: '0 0 12px rgba(var(--light-rgb),.4)' });
    return r;
  };
  P.post = function (parent, o) {
    var h = o.h || 900, r = root(parent, o, 160, h);
    P.box(r, 66, 60, 28, h - 60, { borderRadius: '10px' }); P.box(r, 30, 0, 100, 70, { borderRadius: '30px 30px 12px 12px' });
    DK.el(r, 'dkl-src', null, { left: '35px', top: '45px', width: '90px', height: '70px' });
    DK.el(r, 'dkl-beam', null, { left: '-60px', top: '80px', width: '280px', height: px(h - 80), clipPath: 'polygon(42% 0,58% 0,100% 100%,0 100%)' });
    return r;
  };
})();
