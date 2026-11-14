// =====================================================================
//  sets/scenes.js: scene recipes. Each gives a FULL set (floor, back wall or horizon, 3+ props, one light source, air)
//  in three depth layers around the hero. 16:9 world = 1920 x 1080 (the camera CAM moves over it, sets/look.js).
//    drawSet(name, t, g, band, hero)   name 'studio' | 'outdoor' | 'room'; g = a grade (GRADES.show, gradeMix(...));
//                                      hero(spot) draws the subject in the mid layer, spot = [x, floorY] where it stands.
//    SETS[name].spot                   the stand point, so stage code can aim the camera and the type at it.
//  Recipe = far (k 0.3: wall / sky + the big shapes) · mid (k 1: floor, light source, props, hero, dust) · near (k 1.6: foreground).
//  Props here are generic set dressing (podiums, trees, a lamp), never story objects: the story's object is the hero.
// =====================================================================
const SETS = {
  // ---- game-show studio: LED arch in the band gradient behind the hero, glossy floor, pedestal, a podium, truss with a spotlight
  studio: {
    spot: [720, 770],
    far(t, g, band) {
      const lg = ctx.createLinearGradient(0, 0, 0, 760); lg.addColorStop(0, g.wall[0]); lg.addColorStop(1, g.wall[1]);
      ctx.fillStyle = lg; ctx.fillRect(-500, -300, W + 1000, 1100);
      // light columns on the side walls (they chase upward)
      for (const [x0, n] of [[-200, 4], [1180, 6]]) for (let i = 0; i < n; i++) {
        const x = x0 + i * 110, k = 0.5 + 0.5 * Math.sin(t * 3 - i * 0.8);
        const cg = ctx.createLinearGradient(0, 120, 0, 700); cg.addColorStop(0, `rgba(255,255,255,${0.04 + 0.1 * k * g.led})`); cg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = cg; ctx.fillRect(x, 120, 46, 580);
        ctx.fillStyle = _mixC(band.g[i % 2], 'rgba(0,0,0,0)', 0.35 - 0.25 * k); ctx.fillRect(x + 8, 140 + (1 - k) * 60, 30, 14);
      }
      // the LED arch: the band gradient (the kit's identity) with drifting stripes, bubbles and an LED dot grid
      const ax = 330, ay = 150, aw = 780, ah = 520;
      ctx.save(); ctx.beginPath(); ctx.roundRect(ax, ay, aw, ah, [260, 260, 26, 26]); ctx.clip();
      const a = t * 0.15, gg = ctx.createLinearGradient(ax + aw / 2 - Math.cos(a) * 500, ay + ah / 2 - Math.sin(a) * 300, ax + aw / 2 + Math.cos(a) * 500, ay + ah / 2 + Math.sin(a) * 300);
      gg.addColorStop(0, band.g[0]); gg.addColorStop(1, band.g[1]); ctx.fillStyle = gg; ctx.fillRect(ax, ay, aw, ah);
      ctx.globalAlpha = 0.22 * g.led; ctx.fillStyle = '#FFFFFF'; ctx.translate(ax + aw / 2, ay + ah); ctx.rotate(-0.5);
      for (let x = -1400 + (t * 50) % 240; x < 1400; x += 240) ctx.fillRect(x, -1400, 110, 2800);
      ctx.setTransform(ctx.getTransform()); ctx.rotate(0.5); ctx.translate(-(ax + aw / 2), -(ay + ah));
      ctx.globalAlpha = 1; const r = rng(11);
      for (let i = 0; i < 10; i++) { const sz = 20 + r() * 50, px = ax + r() * aw, py = ay + ah + 60 - ((r() * ah + t * (20 + r() * 30)) % (ah + 120)); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.arc(px + Math.sin(t + i) * 14, py, sz, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(10,0,30,0.22)'; for (let y = ay + 6; y < ay + ah; y += 12) ctx.fillRect(ax, y, aw, 4);   // LED rows
      ctx.restore();
      // brightness of the LED wall follows the grade
      ctx.save(); ctx.globalAlpha = clamp(1 - g.led) * 0.6; ctx.fillStyle = '#05010F'; ctx.beginPath(); ctx.roundRect(ax, ay, aw, ah, [260, 260, 26, 26]); ctx.fill(); ctx.restore();
      // marquee bulbs on the frame, a chase
      ctx.lineWidth = 22; ctx.strokeStyle = '#1A0F3A'; ctx.beginPath(); ctx.roundRect(ax - 14, ay - 14, aw + 28, ah + 28, [272, 272, 34, 34]); ctx.stroke();
      const P = [], R = 274, c0 = [ax + 260, ay + 260], c1 = [ax + aw - 260, ay + 260];
      for (let y = ay + ah; y > ay + 260; y -= 40) P.push([ax - 14, y]);
      for (let i = 0; i <= 7; i++) { const a = Math.PI + (i / 7) * Math.PI / 2; P.push([c0[0] + Math.cos(a) * R, c0[1] + Math.sin(a) * R]); }
      for (let x = c0[0] + 40; x < c1[0]; x += 40) P.push([x, ay - 14]);
      for (let i = 0; i <= 7; i++) { const a = -Math.PI / 2 + (i / 7) * Math.PI / 2; P.push([c1[0] + Math.cos(a) * R, c1[1] + Math.sin(a) * R]); }
      for (let y = ay + 300; y <= ay + ah; y += 40) P.push([ax + aw + 14, y]);
      P.forEach(([x, y], i) => {
        const on = (Math.floor(t * 8) + i) % 3 === 0;
        ctx.fillStyle = on ? '#FFF6C8' : '#7A6A3A'; ctx.beginPath(); ctx.arc(x, y, on ? 8 : 6, 0, TAU); ctx.fill();
        if (on) lightSource(x, y, 3, 'rgba(255,230,150,0.35)', 0.8);
      });
    },
    mid(t, g, band, hero) {
      const [sx, sy] = this.spot, fy = 690;
      const fg = ctx.createLinearGradient(0, fy, 0, H + 200); fg.addColorStop(0, g.floor[0]); fg.addColorStop(1, g.floor[1]);
      ctx.fillStyle = fg; ctx.fillRect(-500, fy, W + 1000, H);
      // reflection of the LED wall on the glossy floor
      ctx.save(); ctx.globalAlpha = 0.2 * g.led; const rg = ctx.createLinearGradient(0, fy, 0, fy + 260); rg.addColorStop(0, band.g[1]); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(330, fy, 780, 260); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 3;   // floor seams to a vanishing point
      for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 60, fy); ctx.lineTo(960 + i * 330, H + 200); ctx.stroke(); }
      for (const y of [740, 810, 910, 1050]) { ctx.beginPath(); ctx.moveTo(-500, y); ctx.lineTo(W + 500, y); ctx.stroke(); }
      // stage disc + light ring
      ctx.fillStyle = 'rgba(10,4,30,0.55)'; ctx.beginPath(); ctx.ellipse(sx, sy + 70, 360, 66, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU, on = (Math.floor(t * 6) + i) % 4 < 2; ctx.fillStyle = on ? band.accent : 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(sx + Math.cos(a) * 340, sy + 70 + Math.sin(a) * 58, 5, 0, TAU); ctx.fill(); }
      // contestant podium right of the pedestal: body, glowing front strip, buzzer
      for (const [px, pc] of [[1045, band.g[1]]]) {
        contactShadow(px, 905, 260, 0.6);
        ctx.fillStyle = '#1C1145'; ctx.beginPath(); ctx.moveTo(px - 95, 690); ctx.lineTo(px + 95, 690); ctx.lineTo(px + 80, 900); ctx.lineTo(px - 80, 900); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2E1F66'; ctx.beginPath(); ctx.roundRect(px - 110, 670, 220, 30, 10); ctx.fill();
        ctx.fillStyle = pc; ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 2 + px); ctx.fillRect(px - 86, 740, 172, 26); ctx.globalAlpha = 1;
        ctx.fillStyle = '#FF3D6E'; ctx.beginPath(); ctx.ellipse(px, 670, 34, 22, 0, Math.PI, TAU); ctx.fill();
      }
      // pedestal under the hero
      ctx.fillStyle = '#20154A'; ctx.fillRect(sx - 150, sy, 300, 70);
      ctx.fillStyle = '#35267A'; ctx.beginPath(); ctx.ellipse(sx, sy, 150, 26, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#20154A'; ctx.beginPath(); ctx.ellipse(sx, sy + 70, 150, 26, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = band.accent; ctx.globalAlpha = 0.8; ctx.fillRect(sx - 150, sy + 28, 300, 10); ctx.globalAlpha = 1;
      contactShadow(sx, sy + 2, 280, 0.75);
      // truss + the one spotlight (the scene's light source) aimed at the hero
      ctx.fillStyle = '#0B0620'; ctx.fillRect(-500, 28, W + 1000, 26);
      ctx.strokeStyle = '#1D1442'; ctx.lineWidth = 4; for (let x = -500; x < W + 500; x += 40) { ctx.beginPath(); ctx.moveTo(x, 28); ctx.lineTo(x + 40, 54); ctx.stroke(); }
      for (const lx of [120, 1260, 1700]) { ctx.fillStyle = '#140C30'; ctx.beginPath(); ctx.roundRect(lx - 26, 50, 52, 56, 10); ctx.fill(); }
      beam(sx, 108, sx, sy, 34, 230, g.key, 0.34);
      ctx.fillStyle = '#140C30'; ctx.beginPath(); ctx.roundRect(sx - 34, 48, 68, 64, 12); ctx.fill();
      lightSource(sx, 108, 14, g.key, 1);
      dust(t, sx - 230, 120, 460, 620, g.key, 36, 9);
      hero([sx, sy]);
    },
    near(t, g, band) {
      // dark stage lip with footlights, and two out-of-focus bulbs (bokeh) in the corners
      ctx.fillStyle = '#05020E'; ctx.fillRect(-500, 1030, W + 1000, 200);
      for (let i = 0; i < 16; i++) { const x = 60 + i * 120, on = (Math.floor(t * 5) + i) % 2; lightSource(x, 1040, on ? 5 : 3, on ? 'rgba(255,225,140,0.5)' : 'rgba(255,225,140,0.2)', 0.7); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, r] of [[-60, 980, 120], [W + 40, 300, 150]]) { const bg = ctx.createRadialGradient(x, y, 0, x, y, r); bg.addColorStop(0, 'rgba(255,220,160,0.12)'); bg.addColorStop(0.8, 'rgba(255,220,160,0.08)'); bg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      ctx.restore();
    },
  },

  // ---- outdoor: sky + sun/moon (the light), two hill rows, ground, tree, rocks, fence, signpost, grass in front
  outdoor: {
    spot: [760, 830],
    far(t, g) {
      const lg = ctx.createLinearGradient(0, -200, 0, 760); lg.addColorStop(0, g.wall[1]); lg.addColorStop(1, g.wall[0]);
      ctx.fillStyle = lg; ctx.fillRect(-500, -300, W + 1000, 1100);
      lightSource(1460, 250, 46, g.key, 0.9);
      for (const [y, c, f, amp] of [[560, 'rgba(255,255,255,0.10)', 0.004, 70], [640, 'rgba(0,0,0,0.25)', 0.006, 50]]) {
        ctx.fillStyle = _mixC(g.floor[0], c, 0.5); ctx.beginPath(); ctx.moveTo(-500, 900);
        for (let x = -500; x <= W + 500; x += 40) ctx.lineTo(x, y - Math.sin(x * f + y) * amp - Math.sin(x * f * 2.3) * amp * 0.4);
        ctx.lineTo(W + 500, 900); ctx.closePath(); ctx.fill();
      }
    },
    mid(t, g, band, hero) {
      const [sx, sy] = this.spot;
      const fg = ctx.createLinearGradient(0, 700, 0, H + 200); fg.addColorStop(0, g.floor[0]); fg.addColorStop(1, g.floor[1]);
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-500, 720); ctx.quadraticCurveTo(960, 670, W + 500, 720); ctx.lineTo(W + 500, H + 300); ctx.lineTo(-500, H + 300); ctx.fill();
      beam(1460, 250, sx, sy, 60, 260, g.key, 0.16);
      // tree (left): trunk + three canopy blobs, sways
      const sw = Math.sin(t * 0.9) * 6;
      contactShadow(260, 820, 300); ctx.fillStyle = '#2A160C'; ctx.beginPath(); ctx.moveTo(240, 820); ctx.lineTo(282, 820); ctx.lineTo(272, 520); ctx.lineTo(250, 520); ctx.fill();
      for (const [dx, dy, r, c] of [[-70, -330, 120, g.floor[0]], [70, -350, 130, g.floor[0]], [0, -440, 140, _mixC(g.floor[0], g.rim, 0.25)]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(260 + dx + sw, 820 + dy, r, 0, TAU); ctx.fill(); }
      // fence + signpost (right), rocks
      ctx.fillStyle = '#3A2414'; for (let i = 0; i < 6; i++) { const x = 1150 + i * 90; ctx.fillRect(x, 690, 18, 110); } ctx.fillRect(1140, 715, 470, 14); ctx.fillRect(1140, 760, 470, 14);
      ctx.fillStyle = '#4A2E18'; ctx.fillRect(1700, 640, 20, 220); ctx.beginPath(); ctx.roundRect(1630, 640, 170, 70, 10); ctx.fill();
      contactShadow(1040, 900, 220); ctx.fillStyle = '#3B3550'; ctx.beginPath(); ctx.ellipse(1040, 880, 100, 50, 0, Math.PI, TAU); ctx.fill();
      contactShadow(sx, sy + 4, 320, 0.6);
      dust(t, -100, 200, W + 200, 700, g.key, 30, 5);
      hero([sx, sy]);
    },
    near(t, g) {
      ctx.fillStyle = '#0A0612';
      for (let i = 0; i < 40; i++) { const x = -200 + i * 60, h = 50 + (i * 37) % 60, b = Math.sin(t * 1.4 + i) * 8; ctx.beginPath(); ctx.moveTo(x - 14, 1100); ctx.quadraticCurveTo(x + b, 1100 - h * 0.6, x + b * 2, 1100 - h); ctx.quadraticCurveTo(x + 4, 1100 - h * 0.5, x + 14, 1100); ctx.fill(); }
    },
  },

  // ---- room: wall with a window (the light), shelf, picture, floor lamp, boards, rug, side table
  room: {
    spot: [760, 850],
    far(t, g) {
      ctx.fillStyle = g.wall[0]; ctx.fillRect(-500, -300, W + 1000, 1100);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = -500; x < W + 500; x += 90) ctx.fillRect(x, -300, 40, 1100);
      ctx.fillStyle = '#1A0F08'; ctx.fillRect(1220, 170, 340, 400);
      const wg = ctx.createLinearGradient(0, 180, 0, 560); wg.addColorStop(0, g.key); wg.addColorStop(1, _mixC(g.key, g.wall[0], 0.6));
      ctx.fillStyle = wg; ctx.fillRect(1236, 186, 308, 368); ctx.fillStyle = '#1A0F08'; ctx.fillRect(1384, 186, 12, 368); ctx.fillRect(1236, 364, 308, 12);
      lightSource(1390, 370, 30, g.key, 0.5);
      ctx.fillStyle = '#2C1A10'; ctx.fillRect(160, 300, 380, 22);
      for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#7A2E2E', '#2E4A7A', '#C9A23A', '#3A6A3A'][i % 4]; ctx.fillRect(180 + i * 38, 300 - (70 + (i * 13) % 30), 30, 70 + (i * 13) % 30); }
      ctx.fillStyle = '#C9A23A'; ctx.fillRect(700, 200, 220, 160); ctx.fillStyle = g.wall[1]; ctx.fillRect(716, 216, 188, 128);
    },
    mid(t, g, band, hero) {
      const [sx, sy] = this.spot, fy = 700;
      ctx.fillStyle = g.floor[0]; ctx.fillRect(-500, fy, W + 1000, H);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4; for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 80, fy); ctx.lineTo(960 + i * 300, H + 200); ctx.stroke(); }
      beam(1390, 370, sx + 120, sy, 150, 300, g.key, 0.18);
      ctx.fillStyle = _mixC(band.g[1], g.floor[0], 0.4); ctx.beginPath(); ctx.ellipse(sx, sy + 20, 380, 70, 0, 0, TAU); ctx.fill();
      contactShadow(300, 900, 200); ctx.fillStyle = '#1A0F08'; ctx.fillRect(296, 420, 10, 480); ctx.fillStyle = '#E8C070'; ctx.beginPath(); ctx.moveTo(240, 420); ctx.lineTo(360, 420); ctx.lineTo(330, 340); ctx.lineTo(270, 340); ctx.fill();
      lightSource(300, 430, 10, g.key, 0.6);
      contactShadow(1300, 880, 260); ctx.fillStyle = '#2C1A10'; ctx.fillRect(1180, 720, 240, 26); ctx.fillRect(1196, 746, 18, 130); ctx.fillRect(1386, 746, 18, 130);
      contactShadow(sx, sy + 4, 320, 0.6);
      dust(t, 1000, 200, 700, 700, g.key, 26, 7);
      hero([sx, sy]);
    },
    near(t) { ctx.fillStyle = '#07030A'; ctx.beginPath(); ctx.roundRect(-140, 860, 260, 400, 40); ctx.fill(); },
  },
};

function drawSet(name, t, g, band, hero) {
  const S = SETS[name] || SETS.studio;
  layer(0.3, () => S.far(t, g, band));
  layer(1, () => { S.mid(t, g, band, hero); haze(g); });
  layer(1.6, () => S.near(t, g, band));
  return S;
}
