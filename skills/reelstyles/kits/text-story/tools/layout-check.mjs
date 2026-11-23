// tools/layout-check.mjs: text-story layout QA, runs before every render (tools/render.sh). Loads index.html in headless
// Chrome, seeks the film every 0.25 s and reads FFQA() (the shot hero box, the caption plate):
//   hero / extra / prop / key   whole inside the frame, hero + key at least 65 px from the left, right and top edge
//   hero                        at least 25% of the frame height; key object (no hero in the shot) at least 12%
//   captions                    at least 44 px, 65 px inside the frame, never over a hero or the key object (feet included)
//   film-wide framing           main subject <= 55% of the height on >= 50% of the film, > 70% on <= 40%
// usage: node tools/layout-check.mjs [dir]   exit 1 on any problem. Needs puppeteer-core + Chrome (both arrive with HyperFrames).
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
let W = 1920, H = 1080, EDGE = 65;
const dir = resolve(process.argv[2] || '.'), home = homedir();
const find = (root, test, depth = 6) => { let q = [root];
  for (let d = 0; d < depth && q.length; d++) { const nq = [];
    for (const p of q) { let es = []; try { es = readdirSync(p, { withFileTypes: true }); } catch { continue; }
      for (const e of es) { const f = join(p, e.name); if (test(f, e)) return f; if (e.isDirectory()) nq.push(f); } }
    q = nq; }
  return null; };
const pc = process.env.PUPPETEER_CORE || find(join(home, '.npm/_npx'), (f, e) => e.isDirectory() && f.endsWith('node_modules/puppeteer-core'), 3);
const chrome = process.env.CHROME || find(join(home, '.cache/hyperframes/chrome'), (f, e) => e.isFile() && /^(chrome-headless-shell|chrome)$/.test(e.name), 5);
if (!pc || !chrome) { console.log(`layout-check: skipped (no ${pc ? 'Chrome' : 'puppeteer-core'}: run npx hyperframes once)`); process.exit(0); }
const puppeteer = createRequire(join(pc, 'package.json'))(pc);
if (!existsSync(join(dir, 'index.html'))) { console.log('layout-check: no index.html'); process.exit(1); }
if (/data-height="1920"/.test(readFileSync(join(dir, 'index.html'), 'utf8'))) { W = 1080; H = 1920; }
const dur = +(readFileSync(join(dir, 'index.html'), 'utf8').match(/data-duration="([\d.]+)"/) || [])[1] || 0;
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--allow-file-access-from-files', '--no-sandbox'] });
try {
  const page = await browser.newPage(), errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await page.setViewport({ width: W, height: H });
  await page.goto('file://' + join(dir, 'index.html'));
  const ready = () => page.evaluate('!!(window.__timelines && window.__timelines.main && window.FFQA)');
  for (let i = 0; i < 240 && !errs.length && !(await ready()); i++) await new Promise((r) => setTimeout(r, 250));
  if (errs.length) { console.log(`page error: ${errs[0]} (fix film.js)`); process.exit(1); }
  if (!(await ready())) { console.log('layout-check: no timeline after 60 s (open index.html in a browser and read the console)'); process.exit(1); }
  await page.evaluate('document.fonts.ready');
  const runs = new Map(), stats = [];
  for (let t = 0; t < dur - 0.01; t += 0.25) {
    const boxes = await page.evaluate((t) => { window.__timelines.main.seek(t, false); return FFQA(); }, t);
    const out = [], r = Math.round, heroes = boxes.filter((b) => b.kind === 'hero'), keys = boxes.filter((b) => b.kind === 'key');
    for (const b of boxes) {
      if (['hero', 'extra', 'prop', 'key'].includes(b.kind) && (b.x0 < 0 || b.x1 > W || b.y0 < 0 || b.y1 > H + 4))
        out.push(`${b.kind} ${b.name} cut by the ${b.x0 < 0 ? 'left' : b.x1 > W ? 'right' : b.y0 < 0 ? 'top' : 'bottom'} edge (x ${r(b.x0)}-${r(b.x1)}, y ${r(b.y0)}-${r(b.y1)}): move it inward or pull the camera back`);
      else if ((b.kind === 'hero' || b.kind === 'key') && (b.x0 < EDGE || b.x1 > W - EDGE || b.y0 < EDGE))
        out.push(`${b.kind} ${b.name} within ${EDGE} px of an edge (x ${r(b.x0)}-${r(b.x1)}, top ${r(b.y0)}): move it inward`);
      if (b.kind === 'label' && (b.x0 < 0 || b.x1 > W || b.y0 < 0 || b.y1 > H)) out.push(`label "${b.name}" leaves the frame: change lab: [dx, dy]`);
      if (b.kind === 'caption') {
        if (b.px < 44) out.push(`caption "${b.name}" is ${b.px} px (min 44)`);
        if (b.x0 < EDGE || b.x1 > W - EDGE || b.y1 > H - 20) out.push(`caption "${b.name}" leaves the frame (x ${r(b.x0)}-${r(b.x1)})`);
        for (const h of [...heroes, ...keys]) if (b.x1 > h.x0 + 4 && b.x0 < h.x1 - 4 && b.y1 > h.y0 + 4 && b.y0 < h.y1 - 4) out.push(`caption "${b.name}" covers the ${h.kind} ${h.name}: use at: 'tl'|'tr'|'bl'|'br' or change the shot's yaw`);
      }
    }
    for (const h of heroes) if (h.y1 - h.y0 < 0.25 * H) out.push(`hero ${h.name} only ${r(100 * (h.y1 - h.y0) / H)}% of the frame height (min 25%): move the camera in`);
    if (!heroes.length) for (const k of keys) if (k.y1 - k.y0 < 0.12 * H) out.push(`key object ${k.name} only ${r(k.y1 - k.y0)} px tall (min ${0.12 * H}): scale it up`);

    const main = heroes.length ? heroes : keys;
    if (main.length) stats.push(Math.max(...main.map((b) => (Math.min(b.y1, H) - Math.max(b.y0, 0)) / H)));
    for (const msg of new Set(out)) { const m = msg.replace(/-?\d+/g, '#'), rr = runs.get(m) || [], last = rr[rr.length - 1];
      if (last && t - last[1] <= 0.26) last[1] = t; else rr.push([t, t, msg]); runs.set(m, rr); }
  }
  const lines = [...runs.values()].flat().sort((a, b) => a[0] - b[0]).map(([a, b, m]) => `${a.toFixed(2)}-${(b + 0.25).toFixed(2)} s: ${m}`);
  if (stats.length >= 4) { const pc = (f) => Math.round(100 * stats.filter(f).length / stats.length);
    if (pc((h) => h > 0.7) > 40) lines.push(`framing: main subject over 70% of the height on ${pc((h) => h > 0.7)}% of the film (max 40%): pull back to wide/medium-wide`);
    if (pc((h) => h <= 0.55) < 50) lines.push(`framing: main subject 55% of the height or less on only ${pc((h) => h <= 0.55)}% of the film (need 50%)`); }
  for (const l of lines) console.log(l);
  if (!lines.length) console.log('layout-check: ok');
  process.exitCode = lines.length ? 1 : 0;
} finally { await browser.close(); }
