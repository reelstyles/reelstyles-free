// tools/dead-holds.mjs: finds stretches where a text-sized region of the render does not move.
// Usage: node tools/dead-holds.mjs out.mp4 [maxStaticSeconds=1.2]     (needs ffmpeg on the PATH)
// It samples 10 fps at 480x270 grey, splits the frame into 24x15 px tiles, and flags every tile that has hard edges
// (text, bars, shapes) yet changes < 0.6 grey levels between samples for longer than the limit. Fix every hit:
// add camera push, idle bob, a staggered build or a moving accent. Exit code 1 when anything is flagged.
import { spawnSync } from 'node:child_process';
const [file, lim = '1.2'] = process.argv.slice(2);
if (!file) { console.error('usage: node tools/dead-holds.mjs out.mp4 [seconds]'); process.exit(2); }
const pr = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]);
const [FW, FH] = String(pr.stdout).trim().split(',').map(Number);
const portrait = FH > FW;   // 9:16 films are sampled at 288x480 so the tiles stay square
const w = portrait ? 288 : 480, h = portrait ? 480 : 270, fps = 10, TW = 24, TH = 15, SC = (FW || 1920) / w;
const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `fps=${fps},scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
if (r.status) { console.error(String(r.stderr)); process.exit(2); }
const buf = r.stdout, fsz = w * h, n = Math.floor(buf.length / fsz), need = Math.ceil(+lim * fps);
const tx = w / TW, ty = h / TH, runs = new Array(tx * ty).fill(0), hits = [];
for (let f = 1; f < n; f++) {
  for (let j = 0; j < ty; j++) for (let i = 0; i < tx; i++) {
    let d = 0, e = 0;
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const p = (j * TH + y) * w + i * TW + x;
      d += Math.abs(buf[f * fsz + p] - buf[(f - 1) * fsz + p]);
      if (x) e += Math.abs(buf[f * fsz + p] - buf[f * fsz + p - 1]);
    }
    const k = j * tx + i, edgy = e / (TW * TH) > 6, still = d / (TW * TH) < 0.6;
    runs[k] = edgy && still ? runs[k] + 1 : 0;
    if (runs[k] === need) hits.push({ t: ((f - need + 1) / fps).toFixed(1), x: Math.round(i * TW * SC), y: Math.round(j * TH * SC) });
  }
}
if (!hits.length) { console.log('OK: no static text-like region longer than ' + lim + ' s'); process.exit(0); }
const by = {}; hits.forEach((x) => { (by[x.t] ||= []).push(x); });
Object.entries(by).forEach(([t, a]) => console.log(`static from ${t}s: ${a.length} tiles around x≈${a[0].x}, y≈${a[0].y} (${FW || 1920}x${FH || 1080} coords)`));
process.exit(1);
