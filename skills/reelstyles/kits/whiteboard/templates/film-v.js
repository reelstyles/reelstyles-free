// =====================================================================
//  templates/film-v.js: an 8 s VERTICAL (1080x1920) whiteboard demo. Copy it to the project root as film.js next to vertical.html (as index.html).
//  Composed for a tall frame: stacked title, a tall graph, camera moves that travel DOWN the board and push into the answer.
//  Safe area: text/faces inside x 90-940, y 250-1470 on screen; the bottom 450 px and top 250 px carry platform UI.
//  World = pixels; region A (title) at y 0-1920, region B (graph) is OY lower. At zoom 1 with the camera centre at (540, 960 + k) screen = world.
// =====================================================================
const DUR = 8;
const OY = 1500;                       // region B offset: distance on the board = distance in the argument

ghosts(-80, -80, 1240, 2100, 18, 3);   // faint leftovers of old lessons fill the whole tall frame
ghosts(-80, OY - 80, 1240, 2100, 12, 9);

// ---- A: stacked title (0 - 3.1 s) ----
const s1 = write('SNOW', 515, 560, { size: 195, anchor: 'c', t0: 0.15, dur: 1.0 });
const s2 = write('BALL', 515, 810, { size: 195, anchor: 'c', t0: 1.0, dur: 1.0 });
draw(underline(s2.x0, s2.x1, 890), 2.0, 0.5, { col: 'hot', w: 14 });
write('grows on its own', 515, 1090, { size: 80, anchor: 'c', t0: 2.2, dur: 0.9, col: 'ink' });
// a snowball rolling and growing, left to right, fills the lower third of the title shot
draw(circle(250, 1250, 34), 2.3, 0.3, { col: 'sig', w: 10 });
draw(circle(450, 1225, 62), 2.5, 0.35, { col: 'sig', w: 10 });
draw(circle(740, 1170, 118), 2.7, 0.45, { col: 'sig', w: 10 });
draw(arrow(300, 1255, 365, 1245, 22), 2.45, 0.2, { col: 'ink', w: 8 });
draw(arrow(530, 1245, 600, 1235, 22), 2.65, 0.2, { col: 'ink', w: 8 });

// ---- B: the tall graph (3.2 - 7.8 s) ----
const gx = 170, gy = OY + 1040;             // graph origin (screen y 1040 at rest): labels end by y 1200, clear of the two-line caption (top about y 1250)
write('TWO WAYS', 515, OY + 380, { size: 100, anchor: 'c', t0: 3.85, dur: 0.6, col: 'ink' });
draw(axes(gx, gy, 740, 600), 4.1, 0.5, { col: 'ink', w: 10 });
write('years', gx + 740, gy + 80, { size: 64, anchor: 'r', t0: 4.4, col: 'ink', dur: 0.4 });
write('€', gx + 20, gy - 620, { size: 64, anchor: 'l', t0: 4.5, dur: 0.3 });
const saving = (x) => gy - 30 - (x - gx) * 0.28;
const growth = (x) => gy - 30 - 37 * (Math.exp((x - gx) / 230) - 1);
draw(fn(saving, gx + 20, gx + 670, 12), 4.4, 0.9, { col: 'ink', w: 10 });
draw(fn(growth, gx + 20, gx + 670, 40), 4.7, 1.6, { col: 'sig', w: 12 });
write('saving', gx + 400, saving(gx + 400) + 85, { size: 64, anchor: 'c', t0: 5.2, dur: 0.5, col: 'ink' });
write('investing', gx + 420, growth(gx + 420) - 90, { size: 70, anchor: 'r', t0: 5.8, dur: 0.7, col: 'sig' });
// a magnet coin rides the curve and drops with a clack
const my = (x) => growth(x) - 14;
magnet({ col: 'hot', r: 46, label: '€', keys: [[4.7, gx + 20, my(gx + 20), 1], [5.1, gx + 20, my(gx + 20), 0], [5.3, gx + 20, my(gx + 20), 0], [6.2, gx + 450, my(gx + 450), 0.35], [6.4, gx + 450, my(gx + 450), 0], [7.0, gx + 640, my(gx + 640), 0]] });
// the gap: highlighter + circle + label
const gapMid = (growth(gx + 640) + saving(gx + 640)) / 2;
highlight(gx + 590, growth(gx + 640), 100, saving(gx + 640) - growth(gx + 640), 6.4, 0.6);
draw(circle(gx + 640, gapMid, 96, 215), 6.9, 0.6, { col: 'hot', w: 11 });
write('the gap', gx + 500, gapMid - 150, { size: 78, anchor: 'r', t0: 7.3, dur: 0.45, col: 'hot' });
draw(arrow(gx + 520, gapMid - 130, gx + 575, gapMid - 70, 24), 7.65, 0.25, { col: 'hot', w: 9 });

// ---- subtitles (at most two lines, inside the safe area; the engine lifts them above the bottom UI zone) ----
caption('Money can grow in two ways.', 0.3, 3.1);
caption('Saving adds. Investing multiplies.', 4.3, 6.4);
caption('The gap between them is time.', 6.5, 7.9);

// ---- camera: slow push, whip DOWN the board, ride up the curve, push into the circled gap ----
// the chart spans world x 170-910: keep the centre at x 540 and zoom <= 1.06 there (x 170 -> 148, x 910 -> 932); a sideways drift or zoom above 1.1 clips the axis and labels
cam([[0, 540, 940, 1.0, -0.005], [2.9, 540, 1000, 1.08, 0], [3.8, 540, OY + 960, 1.0, 0.008], [4.6, 540, OY + 945, 1.02, 0], [6.3, 540, OY + 935, 1.04, 0], [7.2, 540, OY + 930, 1.05, 0], [8, 540, OY + 925, 1.06, 0]]);

mount(DUR);
