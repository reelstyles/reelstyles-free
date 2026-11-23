// tools/holdcheck.mjs: finds dead holds in a rendered film. Usage: node tools/holdcheck.mjs out.mp4 [maxStaticSeconds=1.2]
// Splits every frame (10 fps, 384x216 grey) into a 16x9 block grid; a block that is visibly lit (mean luma > 24) and
// whose pixels do not change for longer than the limit is a hit. Prints "t0-t1 s  block (col,row)" ranges; exit 1 on hits.
import { spawnSync } from 'node:child_process';
const file = process.argv[2], limit = Number(process.argv[3] || 1.2), FPS = 10, W = 384, H = 216, BC = 16, BR = 9;
if (!file) { console.error('usage: node tools/holdcheck.mjs out.mp4 [seconds]'); process.exit(2); }
const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `fps=${FPS},scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
if (r.status !== 0) { console.error(String(r.stderr)); process.exit(2); }
const buf = r.stdout, n = Math.floor(buf.length / (W * H)), bw = W / BC, bh = H / BR;
const run = new Array(BC * BR).fill(0), start = new Array(BC * BR).fill(0), hits = [];
const flush = (b, f) => { const sec = (f - start[b]) / FPS; if (sec > limit) hits.push({ t0: start[b] / FPS, t1: f / FPS, col: b % BC, row: Math.floor(b / BC) }); };
for (let f = 1; f < n; f++) {
  for (let b = 0; b < BC * BR; b++) {
    const cx = b % BC, cy = Math.floor(b / BC); let diff = 0, luma = 0;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = (cy * bh + y) * W + cx * bw + x, p = f * W * H + i; luma += buf[p]; diff += Math.abs(buf[p] - buf[p - W * H]);
    }
    luma /= bw * bh; diff /= bw * bh;
    const dead = luma > 24 && diff < 0.12;
    if (dead) { if (!run[b]) start[b] = f - 1; run[b]++; } else { if (run[b]) flush(b, f); run[b] = 0; }
  }
}
for (let b = 0; b < BC * BR; b++) if (run[b]) flush(b, n);
if (!hits.length) console.log(`holdcheck: ok (${n} frames, no lit block static > ${limit}s)`);
else { hits.sort((a, c) => a.t0 - c.t0); hits.forEach((h) => console.log(`${h.t0.toFixed(1)}-${h.t1.toFixed(1)} s  block (${h.col},${h.row}) static ${(h.t1 - h.t0).toFixed(1)}s`)); process.exit(1); }
