// =====================================================================
//  sets/items.js: the quiz items, all drawn in code (flat vector, no images). Local box about ±200 px around (0,0).
//  An item = { name, kind:'shapes'|'flag', ... }.
//    shapes: list of { c: colour, ops:[...], x:1 }   x:1 = detail (eye, highlight, seed): left out of the silhouette
//      ops: ['e',x,y,rx,ry,rot] ellipse · ['r',x,y,w,h,rad] rounded rect · ['p',[x,y,x,y,...]] polygon (round corners)
//           ['l',[x,y,x,y,...],width] thick curved line through points
//    flag: { cols:[{c,s,r:[x,y,w,h]}] } in a 340 x 230 box, c = colour, s = dark silhouette tone. Drawn as a waving cloth.
//  drawItem(it, t, colour, sil) paints one pass; the stage draws the silhouette pass, then the colour pass inside the reveal wipe.
// =====================================================================
const ITEMS = {
  apple: { name: 'APPLE', kind: 'shapes', shapes: [
    { c: '#E6303E', ops: [['e', -62, 22, 112, 122, 0.12], ['e', 62, 22, 112, 122, -0.12], ['e', 0, 70, 120, 100]] },
    { c: '#7A4B2A', ops: [['l', [0, -78, 6, -122, 22, -150], 22]] },
    { c: '#3FBF5A', ops: [['e', 58, -118, 56, 24, -0.55]] },
    { c: 'rgba(255,255,255,.4)', x: 1, ops: [['e', -88, -4, 16, 44, 0.35]] },
  ] },
  banana: { name: 'BANANA', kind: 'shapes', shapes: [
    { c: '#FFD93A', ops: [['l', [-150, -60, -70, 70, 40, 100, 150, 20, 175, -70], 78]] },
    { c: '#EBB81A', x: 1, ops: [['l', [-120, -30, -60, 78, 40, 108, 130, 40], 10]] },
    { c: '#5B3A1E', ops: [['e', -160, -86, 22, 30, 0.3], ['e', 182, -92, 18, 22, -0.2]] },
  ] },
  strawberry: { name: 'STRAWBERRY', kind: 'shapes', shapes: [
    { c: '#F23A52', ops: [['e', 0, -20, 135, 120], ['p', [-125, 10, 0, 190, 125, 10]], ['e', 0, 70, 105, 100]] },
    { c: '#3FBF5A', ops: [['p', [-80, -118, -30, -140, 0, -108, 30, -140, 80, -118, 36, -90, 0, -72, -36, -90]], ['l', [0, -125, 4, -165], 14]] },
    { c: '#FFE9A6', x: 1, ops: [['e', -60, -20, 7, 11], ['e', 0, -40, 7, 11], ['e', 62, -18, 7, 11], ['e', -30, 40, 7, 11], ['e', 34, 38, 7, 11], ['e', -4, 100, 7, 11]] },
  ] },
  pineapple: { name: 'PINEAPPLE', kind: 'shapes', shapes: [
    { c: '#2FAE5B', ops: [['p', [0, -250, 40, -140, 0, -80, -40, -140]], ['p', [-80, -220, -20, -130, 0, -80, -62, -124]], ['p', [80, -220, 20, -130, 0, -80, 62, -124]], ['p', [-140, -170, -50, -120, 0, -80, -70, -100]], ['p', [140, -170, 50, -120, 0, -80, 70, -100]]] },
    { c: '#F7B52C', ops: [['e', 0, 40, 98, 140]] },
    { c: '#C9831A', x: 1, ops: [['l', [-70, -50, 70, 130], 7], ['l', [-90, 20, 20, 150], 7], ['l', [70, -50, -70, 130], 7], ['l', [90, 20, -20, 150], 7], ['l', [-30, -90, 90, 60], 7], ['l', [30, -90, -90, 60], 7]] },
  ] },
  elephant: { name: 'ELEPHANT', kind: 'shapes', shapes: [
    { c: '#8EA4BC', ops: [['e', 30, 10, 150, 104], ['r', -62, 70, 56, 130, 24], ['r', 6, 78, 56, 122, 24], ['r', 74, 70, 56, 130, 24], ['r', 134, 62, 56, 138, 24], ['e', -118, -22, 80, 76], ['l', [-170, 6, -196, 70, -178, 140, -142, 156], 46], ['l', [172, -8, 198, 30, 188, 70], 14]] },
    { c: '#7389A3', ops: [['e', -70, -8, 52, 78, 0.2]] },
    { c: '#FFF6E0', ops: [['l', [-162, 34, -196, 54, -214, 40], 18]] },
    { c: '#1F1B3A', x: 1, ops: [['e', -136, -40, 9, 11]] },
  ] },
  cat: { name: 'CAT', kind: 'shapes', shapes: [
    { c: '#F2994A', ops: [['e', 0, 96, 104, 112], ['e', 0, -46, 104, 90], ['p', [-98, -66, -92, -164, -22, -112]], ['p', [98, -66, 92, -164, 22, -112]], ['l', [96, 150, 168, 138, 186, 70, 160, 20], 30]] },
    { c: '#FFD2A0', x: 1, ops: [['e', 0, 100, 60, 80], ['e', 0, -22, 46, 34]] },
    { c: '#1F1B3A', x: 1, ops: [['e', -38, -58, 12, 17], ['e', 38, -58, 12, 17], ['p', [-10, -34, 10, -34, 0, -22]]] },
  ] },
  fish: { name: 'FISH', kind: 'shapes', shapes: [
    { c: '#2FA8E6', ops: [['e', -22, 0, 150, 92], ['p', [90, 0, 190, -78, 168, 0, 190, 78]], ['p', [-30, -80, 30, -150, 54, -70]], ['p', [-10, 74, 30, 130, 50, 70]]] },
    { c: '#7AD3FF', x: 1, ops: [['e', -20, 30, 110, 40]] },
    { c: '#FFFFFF', x: 1, ops: [['e', -102, -18, 22, 22]] },
    { c: '#1F1B3A', x: 1, ops: [['e', -106, -18, 10, 10]] },
    { c: '#1E86BD', x: 1, ops: [['l', [20, -60, 38, 0, 20, 60], 12], ['l', [-24, -66, -4, 0, -24, 66], 12]] },
  ] },
  duck: { name: 'DUCK', kind: 'shapes', shapes: [
    { c: '#FFD02E', ops: [['e', 24, 80, 160, 104], ['e', -60, -62, 74, 78], ['p', [150, 50, 200, -10, 196, 70]]] },
    { c: '#FF8A2B', ops: [['p', [-120, -52, -190, -38, -126, -20]]] },
    { c: '#EAB412', x: 1, ops: [['e', 30, 84, 70, 46, -0.25]] },
    { c: '#1F1B3A', x: 1, ops: [['e', -76, -78, 10, 12]] },
  ] },
  japan: { name: 'JAPAN', kind: 'flag', cols: [
    { c: '#F7F7F7', s: '#2A1B5E', r: [0, 0, 340, 230] }, { c: '#E5243B', s: '#3B2A78', circ: [170, 115, 66] }] },
  italy: { name: 'ITALY', kind: 'flag', cols: [
    { c: '#1FA45B', s: '#2A1B5E', r: [0, 0, 114, 230] }, { c: '#F7F7F7', s: '#3B2A78', r: [113, 0, 114, 230] }, { c: '#E5243B', s: '#2A1B5E', r: [226, 0, 114, 230] }] },
  sweden: { name: 'SWEDEN', kind: 'flag', cols: [
    { c: '#1E6FC8', s: '#2A1B5E', r: [0, 0, 340, 230] }, { c: '#FFD02E', s: '#3B2A78', r: [96, 0, 44, 230] }, { c: '#FFD02E', s: '#3B2A78', r: [0, 93, 340, 44] }] },
  switzerland: { name: 'SWITZERLAND', kind: 'flag', cols: [
    { c: '#E5243B', s: '#2A1B5E', r: [0, 0, 340, 230] }, { c: '#FFFFFF', s: '#3B2A78', r: [145, 45, 50, 140] }, { c: '#FFFFFF', s: '#3B2A78', r: [100, 90, 140, 50] }] },
};

function _ops(ops) {
  for (const o of ops) {
    if (o[0] === 'e') { ctx.beginPath(); ctx.ellipse(o[1], o[2], o[3], o[4], o[5] || 0, 0, TAU); ctx.fill(); }
    else if (o[0] === 'r') { ctx.beginPath(); ctx.roundRect(o[1], o[2], o[3], o[4], o[5] || 0); ctx.fill(); }
    else if (o[0] === 'p') {
      const p = o[1]; ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); ctx.closePath();
      ctx.fill(); ctx.lineWidth = 16; ctx.stroke();
    } else if (o[0] === 'l') {
      const p = o[1]; ctx.beginPath(); ctx.moveTo(p[0], p[1]);
      for (let i = 2; i < p.length - 2; i += 2) ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
      ctx.lineTo(p[p.length - 2], p[p.length - 1]); ctx.lineWidth = o[2]; ctx.stroke();
    }
  }
}

function drawItem(it, t, sil, silColor) {
  ctx.save();
  if (it.kind === 'shapes') {
    for (const s of it.shapes) {
      if (sil && s.x) continue;
      const c = sil ? silColor : s.c; ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      _ops(s.ops);
    }
  } else {                                              // waving flag: 4 px strips, each lifted by a travelling sine
    const fw = 340, fh = 230, sw = 4, n = fw / sw;
    ctx.translate(-fw / 2, -fh / 2);
    ctx.fillStyle = sil ? silColor : '#CFC6B8'; ctx.beginPath(); ctx.roundRect(-14, -14, 18, fh + 150, 9); ctx.fill();   // pole
    for (let i = 0; i < n; i++) {
      const x = i * sw, k = i / n, dy = Math.sin(t * 4.2 - k * 7) * 12 * k + Math.sin(t * 2.3 - k * 3) * 4 * k;
      ctx.save(); ctx.beginPath(); ctx.rect(x, -40, sw + 0.6, fh + 80); ctx.clip(); ctx.translate(0, dy);
      for (const f of it.cols) {
        ctx.fillStyle = sil ? f.s : f.c;
        if (f.r) ctx.fillRect(f.r[0], f.r[1], f.r[2], f.r[3]); else { ctx.beginPath(); ctx.arc(f.circ[0], f.circ[1], f.circ[2], 0, TAU); ctx.fill(); }
      }
      const sh = Math.cos(t * 4.2 - k * 7) * k;
      ctx.fillStyle = sh > 0 ? `rgba(0,0,0,${0.16 * sh})` : `rgba(255,255,255,${-0.2 * sh})`; ctx.fillRect(x, 0, sw + 0.6, fh);
      ctx.restore();
    }
  }
  ctx.restore();
}
