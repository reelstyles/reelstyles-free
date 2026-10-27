// tools/foley.mjs: turns the film's stroke / eraser / magnet schedule into a foley wav (marker on gloss, squeaks, clacks, eraser rub).
// Usage (from the project root, next to index.html):  node tools/foley.mjs [film.js] [out.wav]
// Loads engine + film in a stub DOM, so nothing is rendered. Pure synthesis, seeded: same film = same sound. Needs only Node >= 18.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const film = process.argv[2] || 'film.js', out = process.argv[3] || 'audio/foley.wav', SR = 44100;
const noop = new Proxy(function () {}, { get: () => noop, apply: () => noop, set: () => true });
const sandbox = { __timelines: {}, document: { getElementById: () => ({ getContext: () => noop }), createElement: () => ({ getContext: () => noop }), fonts: { load: () => new Promise(() => {}) } }, gsap: { timeline: () => noop }, console, Math };
sandbox.window = sandbox; vm.createContext(sandbox);
const src = ['fonts/ems-tech.js', 'engine/wb.js', film].map((f) => readFileSync(f, 'utf8')).join('\n;');
const dur = Number(/const DUR = ([\d.]+)/.exec(src)?.[1] || 10);
vm.runInContext(src + '\n;this.__EV = soundEvents();', sandbox);
const EV = sandbox.__EV;

let s = 1; const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const N = Math.ceil((dur + 1) * SR), L = new Float32Array(N), R = new Float32Array(N);
const add = (t, x, pan = 0.5) => { const i = Math.floor(t * SR); if (i >= 0 && i < N) { L[i] += x * (1 - pan) * 1.4; R[i] += x * pan * 1.4; } };
const hann = (u) => Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
function bp(state, x, f, q) {   // one-pole band-ish filter pair
  const a = Math.exp(-2 * Math.PI * f / SR / q); state.l += (x - state.l) * (1 - a); state.h = x - state.l; return state.l - state.h * 0.0 + (state.l - state.p) * 0.9;
}
for (const e of EV) {
  const pan = Math.min(0.85, Math.max(0.15, ((e.x ?? 960) % 2200) / 2200 * 0.5 + 0.25)), colF = e.col === 'sig' ? 1.15 : e.col === 'hot' ? 0.9 : 1;
  if (e.type === 'stroke' || e.type === 'hi' || e.type === 'erase') {
    const n = Math.floor((e.t1 - e.t0) * SR), st = { l: 0, p: 0 }, st2 = { l: 0, p: 0 }, sq = e.type === 'stroke' && e.len > 500 && rnd() < 0.5, vib = 7 + rnd() * 6;
    const amp = e.type === 'erase' ? 0.18 : e.type === 'hi' ? 0.1 : Math.min(0.2, 0.07 + e.len / 6000);
    for (let i = 0; i < n; i++) {
      const u = i / n, v = 1 - 0.8 * Math.cos(2 * Math.PI * u), env = Math.max(0, v) * hann(Math.min(1, u * 8)) * Math.min(1, (1 - u) * 10);   // follows the stroke's own slow-fast-slow speed
      let w = rnd() * 2 - 1, hiss = w - st.l; st.l += (w - st.l) * (0.32 * colF);   // bright hiss band
      let body = st2.l += ((rnd() * 2 - 1) - st2.l) * 0.06;                          // felt body
      let y = (hiss * 0.5 + body * 2.2) * env * amp * (e.type === 'erase' ? (0.7 + 0.3 * Math.sin(i / SR * 38)) : 1);
      if (rnd() < 0.002 * env) y += (rnd() - 0.5) * amp * 3;                          // stick-slip grain
      if (sq) y += Math.sin(2 * Math.PI * (1700 + 400 * u * colF) * i / SR + 4 * Math.sin(2 * Math.PI * vib * i / SR)) * env * 0.012 * hann(u);   // dry-erase squeak
      add(e.t0 + i / SR, y, pan);
    }
    if (e.type === 'stroke') for (let i = 0; i < 160; i++) add(e.t0 + i / SR, (rnd() - 0.5) * 0.25 * Math.exp(-i / 30), pan);   // nib tick
  } else if (e.type === 'click') {
    for (let i = 0; i < SR * 0.25; i++) { const t = i / SR; add(e.t0 + t, (Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 90) * 0.18 + Math.sin(2 * Math.PI * 940 * t) * Math.exp(-t * 40) * 0.1 + Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 22) * 0.35) + (rnd() - 0.5) * Math.exp(-t * 400) * 0.2, 0.5); }
  } else if (e.type === 'slide') {
    const n = Math.floor((e.t1 - e.t0) * SR), st = { l: 0 };
    for (let i = 0; i < n; i++) { const u = i / n; st.l += ((rnd() * 2 - 1) - st.l) * 0.05; add(e.t0 + i / SR, st.l * 0.35 * hann(u), 0.5); }
  }
}
// room tone + normalise to about -3 dBFS peak
let pk = 0; for (let i = 0; i < N; i++) { L[i] += (rnd() - 0.5) * 0.002; R[i] += (rnd() - 0.5) * 0.002; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.7 / (pk || 1), buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4); }
import { mkdirSync } from 'node:fs'; import { dirname } from 'node:path'; mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, buf);
console.log(`foley: ${EV.length} events, ${(N / SR).toFixed(1)} s → ${out}`);
