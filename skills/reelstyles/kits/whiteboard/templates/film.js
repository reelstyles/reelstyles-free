// =====================================================================
//  templates/film.js: an 11 s whiteboard demo. Copy it to the project root next to index.html and replace the content.
//  Pattern: register everything with times (write / draw / highlight / erase / magnet / caption), set the camera keys,
//  then mount(DUR) last. World = pixels; region A is the title board, region B (x + 2200) holds the diagram.
// =====================================================================
const DUR = 11;
const OX = 2200;                       // region B offset: distance on the board = distance in the argument

ghosts(-300, -200, 2000, 1400, 14, 3);   // faint leftovers of old lessons, region A
ghosts(OX - 200, -200, 2300, 1400, 14, 9);

// ---- A: title (0 - 3.2 s) ----
const a = write('SNOWBALL', 960, 450, { size: 175, anchor: 'c', t0: 0.25, dur: 1.5 });
draw(underline(a.x0, a.x1, 520), 1.8, 0.45, { col: 'hot', w: 12 });
write('how money grows on its own', 960, 660, { size: 74, anchor: 'c', t0: 2.0, dur: 1.2, col: 'ink' });

// ---- B: the graph (3.6 - 9 s) ----
const gx = OX, gy = 800;                    // graph origin
draw(axes(gx, gy, 1100, 560), 3.7, 0.9, { col: 'ink', w: 9 });
write('years', gx + 1100, gy + 70, { size: 46, anchor: 'r', t0: 4.5, dur: 0.5 });
write('€', gx - 40, gy - 560, { size: 56, anchor: 'r', t0: 4.6, dur: 0.3 });
const saving = (x) => gy - 30 - (x - gx) * 0.28;
const growth = (x) => gy - 30 - 14 * (Math.exp((x - gx) / 285) - 1);
draw(fn(saving, gx + 20, gx + 1000, 12), 5.0, 1.0, { col: 'ink', w: 9 });
draw(fn(growth, gx + 20, gx + 1000, 40), 5.4, 1.9, { col: 'sig', w: 10 });
write('saving', gx + 700, saving(gx + 700) + 70, { size: 42, t0: 6.1, dur: 0.5, col: 'ink' });
write('investing', gx + 560, growth(gx + 560) - 130, { size: 50, anchor: 'r', t0: 7.0, dur: 0.7, col: 'sig' });
// a magnet coin rides the curve, drops with a clack
magnet({ col: 'hot', r: 40, label: '€', keys: [[5.4, gx + 20, growth(gx + 20) - 10, 1], [5.9, gx + 20, growth(gx + 20) - 10, 0], [6.1, gx + 20, growth(gx + 20) - 10, 0], [7.3, gx + 640, growth(gx + 640) - 10, 0.35], [7.5, gx + 640, growth(gx + 640) - 10, 0], [8.4, gx + 1000, growth(gx + 1000) - 14, 0]] });
// the gap: highlighter + a circled answer
highlight(gx + 900, growth(gx + 1000), 110, saving(gx + 1000) - growth(gx + 1000), 7.7, 0.6);
draw(circle(gx + 955, (growth(gx + 1000) + saving(gx + 1000)) / 2, 120, 165), 8.2, 0.7, { col: 'hot', w: 9 });
write('the gap', gx + 700, growth(gx + 1000) + 40, { size: 56, anchor: 'c', t0: 8.7, dur: 0.6, col: 'hot' });
// the eraser rubs out the title region's subtitle at the end, seen from the pulled-back full-board view (a faint ghost stays)
erase(9.9, 10.7, 330, 600, 1260, 100);

// ---- subtitles ----
caption('Money can grow in two very different ways.', 0.3, 3.3);
caption('Saving adds a little. Investing multiplies.', 4.4, 7.8);
caption('The gap between them is time.', 8.0, 10.8);

// ---- camera: hold, whip to B, push to the curve, pull back to the whole board ----
cam([[0, 960, 540, 1, -0.006], [2.9, 980, 550, 1.05, 0], [3.7, OX + 560, 520, 1.0, 0.012], [5.2, OX + 560, 520, 1.0, 0], [7.6, OX + 700, 560, 1.28, 0], [8.9, OX + 760, 560, 1.28, 0], [9.9, OX / 2 + 700, 540, 0.62, 0], [11, OX / 2 + 700, 540, 0.62, 0]]);

mount(DUR);
