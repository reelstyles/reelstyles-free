#!/usr/bin/env node
// clip-measure.mjs <clip.mp4> [--gate] -> one JSON line: measured picture properties of a clip (11-13, kit-look gate + builder self-check).
// ffmpeg decodes 2 frames/s at 160 px wide grayscale; plain pixel statistics, no model.
//   luma      mean brightness 0-1 (median over frames)       contrast  luma std 0-1 (median)
//   flat      share of 8x8 blocks with no detail (median)    motion    mean abs pixel change over 2 s, 0-1 (median)
//   f0        detail (non-flat share) of frame 0 / clip median detail
//   dead      longest run of 1 s steps with no visible change (2 = 3 neighbouring seconds the same)
// Calibration 11-13 on all 181 site samples vs catalog/showcase.json: only f0 and dead separate. Gate fails 2 of the 11
// clips scored <= 4 (16:9 and 9:16 counted apart; also the frozen low judge anchor), 2 of 55 scored 5-6, 0 of 112 scored >= 7. luma/contrast/flat/motion overlap
// between good and bad samples, so they are targets for the builder (FILM.md), never a fail.
// --gate: also prints "FAIL <metric> <value> (target ...)" lines, exit 1 on any.
import { spawnSync } from "node:child_process";
const [f, flag] = process.argv.slice(2);
if (!f) { console.error("usage: clip-measure.mjs <clip.mp4> [--gate]"); process.exit(2); }
const GATE = { f0: [0.5, Infinity], dead: [0, 1] };
const W = 160, FPS = 2;
const pr = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", f], { encoding: "utf8" });
const [sw, sh] = (pr.stdout || "").trim().split(",").map(Number);
if (!sw) { console.error("ffprobe failed: " + f); process.exit(2); }
const H = Math.round(W * sh / sw / 2) * 2;
const buf = spawnSync("ffmpeg", ["-v", "error", "-i", f, "-vf", `fps=${FPS},scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 28 }).stdout;
const n = buf ? Math.floor(buf.length / (W * H)) : 0;
if (!n) { console.error("no frames: " + f); process.exit(2); }
const frames = Array.from({ length: n }, (_, i) => buf.subarray(i * W * H, (i + 1) * W * H));
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
const per = frames.map(p => {
  let s = 0, s2 = 0; for (const v of p) { s += v; s2 += v * v; }
  const m = s / p.length, sd = Math.sqrt(Math.max(0, s2 / p.length - m * m));
  let flat = 0, blocks = 0; // 8x8 block std < 4/255 = no detail there
  for (let by = 0; by + 8 <= H; by += 8) for (let bx = 0; bx + 8 <= W; bx += 8) {
    let a = 0, a2 = 0; for (let y = by; y < by + 8; y++) for (let x = bx; x < bx + 8; x++) { const v = p[y * W + x]; a += v; a2 += v * v; }
    blocks++; if (a2 / 64 - (a / 64) ** 2 < 16) flat++;
  }
  return { luma: m / 255, contrast: sd / 255, flat: flat / blocks };
});
const diff = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]); return d / a.length / 255; };
const motion = []; for (let i = 0; i + 2 * FPS < n; i++) motion.push(diff(frames[i], frames[i + 2 * FPS]));
let dead = 0, run = 0; for (let i = 0; i + FPS < n; i += FPS) { run = diff(frames[i], frames[i + FPS]) < 0.004 ? run + 1 : 0; dead = Math.max(dead, run); }
const detail = per.map(x => 1 - x.flat), r3 = x => Math.round(x * 1000) / 1000;
const out = { file: f, luma: r3(med(per.map(x => x.luma))), contrast: r3(med(per.map(x => x.contrast))), flat: r3(med(per.map(x => x.flat))),
  motion: r3(med(motion)), f0: r3(detail[0] / Math.max(1e-3, med(detail))), dead };
console.log(JSON.stringify(out));
if (flag === "--gate") {
  const fails = Object.entries(GATE).filter(([k, [lo, hi]]) => out[k] < lo || out[k] > hi).map(([k, [lo, hi]]) => `FAIL ${k} ${out[k]} (target ${lo}-${hi})`);
  fails.forEach(l => console.log(l)); process.exit(fails.length ? 1 : 0);
}
