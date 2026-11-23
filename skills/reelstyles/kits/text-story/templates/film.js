// film.js: the story. Edit this file only; the engine does layout, motion, the set, the light and the card.
//  history  messages already on screen at t=0 (no animation), { from: 'them'|'me', text, time }
//  events   in time order. A message: { at, from, text | photo: 'door'|'window'|fn(c, w, h, t), time }
//           'them' (and in the floating column also 'me' with typed: true) show three bouncing dots for `typing` s before `at`.
//           `time` shows under the last bubble of a run; `read` = s until our ticks turn read (default 1.0).
//           A reaction rides on a message:  react: { at, glyph: 'heart'|'bang'|'eyes'|'star' }
//  shots    the camera: { t0, t1, scene: 'desk'|'bedside'|'kitchen', set: {...scene options}, grade, to, turn,
//           cam: [[t, [x, y, zoom]], ...], float: 'r'|'l' (16:9) | 'b'|'t' (9:16) | 'none', phoneX, caption }
//           A new shot is a cut. Same scene + set = the same place seen again. Every shot moves.
//  cards    the twist: full-frame big type, { at, dur, lines: ['NOBODY', 'LOCKED IT.'], sub }. Last line gets the bar.
//  dur      film length in seconds = the root data-duration.
const STORY = {
  dur: 12,
  day: 'Today',
  contact: { name: 'Juno', initial: 'J', color: '#FFC857' },
  history: [
    { from: 'them', text: 'see you at the studio at 9', time: '9:02' },
    { from: 'me', text: 'ok. bringing the keys', time: '9:03' },
  ],
  events: [
    { at: 1.0, from: 'them', text: 'did you lock the studio?', typing: 0.7, time: '11:47' },
    { at: 2.4, from: 'me', text: 'yes. ten minutes ago', typed: true, typing: 0.9, time: '11:48' },
    { at: 3.9, from: 'them', text: "i'm standing outside it right now", typing: 0.8 },
    { at: 5.0, from: 'them', text: 'the door is open', typing: 0.6, time: '11:49', react: { at: 6.1, glyph: 'bang' } },
    { at: 6.1, from: 'them', photo: 'door', typing: 0.0, time: '11:49' },
    { at: 7.6, from: 'me', text: "i'm home. i never left the sofa", typed: true, typing: 1.0, time: '11:50' },
  ],
  shots: [
    { t0: 0, t1: 2.3, scene: 'desk', grade: 'night', phoneX: -330, cam: [[0, [-260, 0, 1.0]], [2.3, [-300, -10, 1.06]]], float: 'r' },
    { t0: 2.3, t1: 4.6, scene: 'desk', grade: 'night', phoneX: -330, cam: [[2.3, [-120, 20, 1.2]], [4.6, [-80, 10, 1.26]]], float: 'r' },
    { t0: 4.6, t1: 7.0, scene: 'desk', grade: 'night', to: 'dread', phoneX: -330, cam: [[4.6, [-420, 0, 1.12]], [7.0, [-380, -10, 1.2]]], float: 'r' },
    { t0: 7.0, t1: 9.4, scene: 'bedside', grade: 'dread', phoneX: -120, cam: [[7.0, [-60, 0, 1.0]], [9.4, [-40, -20, 1.07]]], float: 'r' },
  ],
  cards: [{ at: 9.4, dur: 2.6, lines: ['THEN WHO', 'TURNED THE', 'LIGHT ON?'], sub: 'Juno is typing…' }],
};
CHAT.mount(STORY);
