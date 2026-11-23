// sfx.mjs: writes audio/sfx.wav (mono 16-bit) from the cues in film.js: pop for their messages, tick for ours,
// shutter for photos, low hit for the twist card. Pure node, deterministic, no dependencies.  Run: node sfx.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
let story; new Function('CHAT', 'window', readFileSync('film.js', 'utf8'))({ mount: (s) => { story = s; } }, {});
const SR = 44100, buf = new Float32Array(Math.ceil((story.dur + 1) * SR));
let seed = 5; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const add = (t, dur, f) => { const i0 = Math.floor(t * SR); for (let i = 0; i < dur * SR && i0 + i < buf.length; i++) buf[i0 + i] += f(i / SR, i / SR / dur); };
const pop = (t, f0, f1, g) => add(t, 0.11, (x, p) => g * Math.sin(2 * Math.PI * (f0 + (f1 - f0) * p) * x) * (1 - p) ** 2);
for (const e of story.events) {
  if (e.from === 'them') { for (let k = 0; k < 3 && e.typing; k++) pop(e.at - e.typing + k * 0.16, 420, 380, 0.05); pop(e.at, 700, 1100, 0.4); }
  if (e.from === 'me') pop(e.at, 520, 360, 0.35);
  if (e.photo) add(e.at, 0.16, (x, p) => 0.3 * rnd() * (1 - p) ** 3);
  if (e.react) pop(e.react.at, 1200, 1600, 0.25);
}
for (const c of story.cards || []) add(c.at, 0.9, (x, p) => 0.7 * (Math.sin(2 * Math.PI * 52 * x) + 0.25 * rnd()) * (1 - p) ** 2);
const pcm = Buffer.alloc(buf.length * 2); buf.forEach((v, i) => pcm.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32000 | 0, i * 2));
const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
mkdirSync('audio', { recursive: true }); writeFileSync('audio/sfx.wav', Buffer.concat([h, pcm])); console.log('audio/sfx.wav');
