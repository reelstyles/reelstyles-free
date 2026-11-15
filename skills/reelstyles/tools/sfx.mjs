#!/usr/bin/env node
// sfx.mjs <cues.json> <out.wav> --length <s>  -> one sound-effects track for a film, made from code (11-14).
// No audio files: every sound is an ffmpeg formula (aevalsrc / anoisesrc), so it ships in the free repo too
// (the plugin directory takes no audio files) and has no licence question. ffmpeg is already a kit requirement.
// cues.json: [{ "t": 1.2, "s": "whoosh", "v": 0.8 }, ...]   t = seconds, s = sound name, v = volume 0-1 (default 0.7)
// `node sfx.mjs --list` prints the sounds, `node sfx.mjs --test` runs the self-check.
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// name: [duration s, ffmpeg source filter, what it is for]
const SOUNDS = {
  whoosh: [0.6, "anoisesrc=c=pink:d=0.6:a=0.6,bandpass=f=1200:width_type=h:w=1600,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.3", "camera move, card flies in, cut"],
  swish: [0.3, "anoisesrc=c=white:d=0.3:a=0.4,highpass=f=2500,afade=t=in:d=0.12,afade=t=out:st=0.12:d=0.18", "small fast move, text slides"],
  pop: [0.15, "aevalsrc='0.8*sin(2*PI*(500+2500*exp(-40*t))*t)*exp(-28*t)':d=0.15", "object appears, card stands up, bubble"],
  click: [0.05, "aevalsrc='0.7*(random(0)*2-1)*exp(-250*t)':d=0.05", "UI tap, cursor, counter step"],
  tick: [0.06, "aevalsrc='0.5*sin(2*PI*2400*t)*exp(-90*t)':d=0.06", "clock, number counts up, list item"],
  thud: [0.7, "aevalsrc='0.9*sin(2*PI*(55+70*exp(-12*t))*t)*exp(-7*t)':d=0.7", "heavy landing, title slam, reveal"],
  impact: [0.9, "aevalsrc='0.8*sin(2*PI*(50+90*exp(-10*t))*t)*exp(-6*t)+0.4*(random(0)*2-1)*exp(-25*t)':d=0.9", "hit, crash, big number"],
  chime: [1.6, "aevalsrc='0.3*(sin(2*PI*880*t)+0.6*sin(2*PI*1320*t)+0.3*sin(2*PI*1760*t))*exp(-3*t)':d=1.6", "answer, good result, end card"],
  error: [0.5, "aevalsrc='0.4*sin(2*PI*180*t)*(1+0.5*sin(2*PI*30*t))*exp(-5*t)':d=0.5", "wrong answer, fail, warning"],
  riser: [1.5, "aevalsrc='0.35*sin(2*PI*(200*t+300*t*t))*(t/1.5)':d=1.5,afade=t=out:st=1.35:d=0.15", "tension before a reveal (place it to end on the reveal)"],
  paper: [0.35, "anoisesrc=c=white:d=0.35:a=0.5,highpass=f=1500,lowpass=f=7000,volume='0.6+0.4*sin(2*PI*28*t)':eval=frame,afade=t=out:st=0.15:d=0.2", "paper slide, page turn, card flip"],
  shimmer: [1.2, "anoisesrc=c=white:d=1.2:a=0.25,highpass=f=6000,afade=t=in:d=0.4,afade=t=out:st=0.6:d=0.6", "sparkle, magic, light sweep"],
};

const run = (args) => spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" });

export function build(cues, out, length) {
  if (!cues.length) throw new Error("no cues");
  const parts = [], labels = [];
  cues.forEach((c, i) => {
    const s = SOUNDS[c.s];
    if (!s) throw new Error(`unknown sound "${c.s}" (have: ${Object.keys(SOUNDS).join(" ")})`);
    if (!(c.t >= 0 && c.t < length)) throw new Error(`cue ${i} time ${c.t} outside 0-${length}`);
    const ms = Math.round(c.t * 1000), v = c.v ?? 0.7;
    // aformat first: anoisesrc and aevalsrc start at different rates/layouts, amix needs one
    parts.push(`${s[1]},aformat=sample_rates=48000:channel_layouts=stereo,volume=${v},adelay=${ms}|${ms}[c${i}]`);
    labels.push(`[c${i}]`);
  });
  // normalize=0 keeps each cue at its own volume; alimiter stops overlaps from clipping
  const graph = `${parts.join(";")};${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,apad,atrim=0:${length},alimiter=limit=0.9[out]`;
  const r = run(["-filter_complex", graph, "-map", "[out]", "-ar", "48000", out]);
  if (r.status !== 0) throw new Error(r.stderr);
}

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), "sfx-"));
  const out = join(dir, "t.wav");
  build(Object.keys(SOUNDS).map((s, i) => ({ t: i * 0.5, s })), out, 8);
  const d = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], { encoding: "utf8" });
  const vol = spawnSync("ffmpeg", ["-i", out, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const max = Number(/max_volume: (-?[\d.]+)/.exec(vol)?.[1]);
  const len = Number(d.stdout);
  if (Math.abs(len - 8) > 0.05) throw new Error(`length ${len}, want 8`);
  if (!(max > -20 && max <= 0)) throw new Error(`peak ${max} dB, want -20..0`);
  // every sound alone must be audible (a wrong filter width once made "whoosh" -56 dB)
  for (const s of Object.keys(SOUNDS)) {
    build([{ t: 0.1, s }], out, 2);
    const m = Number(/max_volume: (-?[\d.]+)/.exec(spawnSync("ffmpeg", ["-i", out, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr)?.[1]);
    if (!(m > -25)) throw new Error(`${s} too quiet: ${m} dB`);
  }
  let bad = false;
  try { build([{ t: 1, s: "nope" }], out, 2); } catch { bad = true; }
  rmSync(dir, { recursive: true, force: true });
  if (!bad) throw new Error("unknown sound accepted");
  console.log(`ok: ${Object.keys(SOUNDS).length} sounds, 8 s, peak ${max} dB`);
}

const a = process.argv.slice(2);
if (a[0] === "--list") for (const [k, [d, , use]] of Object.entries(SOUNDS)) console.log(`${k.padEnd(8)} ${d}s  ${use}`);
else if (a[0] === "--test") selfTest();
else {
  const li = a.indexOf("--length");
  if (a.length < 4 || li < 0) { console.error("usage: sfx.mjs <cues.json> <out.wav> --length <s> | --list | --test"); process.exit(2); }
  build(JSON.parse(readFileSync(a[0], "utf8")), a[1], Number(a[li + 1]));
  console.log(`wrote ${a[1]}`);
}
