// tools/layout-check.mjs: vertical layout QA (same file in every kit with engine/safe.js). Loads index.html in headless Chrome,
// steps the film every 0.25 s and prints the engine's layout violations (labels over faces/bodies, labels outside x 108-918,
// hero under 25% of the frame or its panel, hero/face/key object at the edges) as time ranges, then the film-wide framing rules
// (too zoomed: subject > 70% of the height on > 40% of the film, or <= 55% on < 50%; subject touching an edge on > 50%). Exit 1 on any.
//   usage: node tools/layout-check.mjs [dir with index.html]
// Needs puppeteer-core + a Chrome; both arrive with HyperFrames (npx hyperframes once). Override: PUPPETEER_CORE=<dir> CHROME=<binary>.
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';

// framing over the whole film (owner 11-02: "too zoomed, like a crop of a large video"); end card frames are not in __qs.
// stats = { t: { h: main subject height / frame (or panel), edge: '' | 'left' | 'right' | 'top' | 'bottom' } }
export function framing(stats, dur) {
  const v = Object.entries(stats).filter(([t]) => +t < dur - 0.01).map(([, s]) => s), n = v.length, out = [];
  if (n < 4) return out;
  const pc = (f) => Math.round((100 * v.filter(f).length) / n), close = pc((s) => s.h > 0.7), wide = pc((s) => s.h <= 0.55), edge = pc((s) => s.edge);
  if (close > 40) out.push(`framing: the main subject is over 70% of the frame height on ${close}% of the film (max 40%): too zoomed, pull the camera back to wide/medium-wide shots (whole figure, ground under the feet); keep close-ups as short beats`);
  else if (wide < 50) out.push(`framing: the main subject is 55% of the frame height or less on only ${wide}% of the film (need >= 50%): wide/medium-wide shots must carry the film`);
  if (edge > 50) { const side = ['left', 'right', 'top', 'bottom'].map((e) => [e, pc((s) => s.edge === e)]).sort((a, b) => b[1] - a[1])[0][0];
    out.push(`framing: the main subject touches the frame edge on ${edge}% of the film (max 50%, mostly ${side}): pull back so the whole figure sits inside the frame`); }
  return out;
}
if (process.argv[2] === '--selftest') {   // node tools/layout-check.mjs --selftest
  const mk = (h, edge = '') => Object.fromEntries([...Array(20)].map((_, i) => [i / 4, { h, edge }]));
  const ok = framing(mk(0.45), 9).length === 0, tight = framing(mk(0.8, 'bottom'), 9), midT = framing(mk(0.62), 9);
  if (!ok || tight.length !== 2 || !/70%/.test(tight[0]) || !/bottom/.test(tight[1]) || midT.length !== 1) { console.log('selftest FAIL', tight, midT); process.exit(1); }
  console.log('selftest ok'); process.exit(0);
}

const dir = resolve(process.argv[2] || '.'), home = homedir();
const find = (root, test, depth = 6) => {   // first path under root that passes test (breadth-first, small trees only)
  let q = [root];
  for (let d = 0; d < depth && q.length; d++) {
    const nq = [];
    for (const p of q) { let es = []; try { es = readdirSync(p, { withFileTypes: true }); } catch { continue; }
      for (const e of es) { const f = join(p, e.name); if (test(f, e)) return f; if (e.isDirectory()) nq.push(f); } }
    q = nq;
  }
  return null;
};
const pc = process.env.PUPPETEER_CORE || find(join(home, '.npm/_npx'), (f, e) => e.isDirectory() && f.endsWith('node_modules/puppeteer-core'), 3);
const chrome = process.env.CHROME || find(join(home, '.cache/hyperframes/chrome'), (f, e) => e.isFile() && /^(chrome-headless-shell|chrome)$/.test(e.name), 5);
if (!pc || !chrome) { console.log(`layout-check: skipped (no ${pc ? 'Chrome' : 'puppeteer-core'}: run npx hyperframes once)`); process.exit(0); }
const puppeteer = createRequire(join(pc, 'package.json'))(pc);
if (!existsSync(join(dir, 'index.html'))) { console.log('layout-check: no index.html'); process.exit(1); }
const dur = +(readFileSync(join(dir, 'index.html'), 'utf8').match(/data-duration="([\d.]+)"/) || [])[1] || 0;

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--allow-file-access-from-files', '--no-sandbox'] });
try {
  const page = await browser.newPage(), errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await page.setViewport({ width: 1080, height: 1920 });
  await page.goto('file://' + join(dir, 'index.html'));
  await page.waitForFunction('window.__timelines && Object.keys(window.__timelines).length > 0', { timeout: 60000 });
  if (errs.length) { console.log(`page error: ${errs[0]}`); process.exit(1); }
  if (!(await page.evaluate('typeof qaFrame === "function"'))) { console.log('layout-check: engine/safe.js is not loaded (copy templates/vertical.html)'); process.exit(1); }
  const runs = new Map();   // rule (message with numbers masked) → [[t0, t1, first message], ...]
  for (let t = 0; t < dur - 0.01; t += 0.25) {
    const out = await page.evaluate((t) => { renderFrame(t); return window.__qa[Math.round(t * 100) / 100] || []; }, t);
    for (const msg of new Set(out)) {
      const m = msg.replace(/-?\d+/g, '#'), r = runs.get(m) || [], last = r[r.length - 1];
      if (last && t - last[1] <= 0.26) last[1] = t; else r.push([t, t, msg]);
      runs.set(m, r);
    }
  }
  const lines = [...runs.values()].flat().sort((x, y) => x[0] - y[0]).map(([a, b, msg]) => `${a.toFixed(2)}-${(b + 0.25).toFixed(2)} s: ${msg}`);
  const fr = framing(await page.evaluate('window.__qs || {}'), dur);
  // FRAMING_WARN=1 (the runner sets it for kits listed in kits/framing-pending.txt): framing is a warning in framing-warn.txt, not a fail
  if (process.env.FRAMING_WARN === '1') { if (fr.length) writeFileSync(join(dir, 'framing-warn.txt'), fr.join('\n') + '\n'); } else lines.push(...fr);
  for (const l of lines) console.log(l);
  process.exitCode = lines.length ? 1 : 0;
} finally { await browser.close(); }
