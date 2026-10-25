import assert from 'node:assert/strict';
import { SIZE, createBoard, isValidBoard, restoreIds, findRuns, findHint, hasMove, makeMove, adjacent } from '../match/engine.mjs';

function random(seed) { let n = seed >>> 0; return () => ((n = (Math.imul(1664525, n) + 1013904223) >>> 0) / 4294967296); }
let cases = 0;
for (let i = 1; i <= 80; i++) {
  const board = createBoard(random(i));
  assert.equal(board.length, SIZE);
  assert.equal(isValidBoard(board), true);
  assert.equal(findRuns(board).length, 0);
  assert.ok(hasMove(board));
  const hint = findHint(board);
  assert.equal(adjacent(...hint), true);
  const before = JSON.stringify(board);
  const result = makeMove(board, ...hint, random(i + 999));
  assert.equal(result.valid, true);
  assert.ok(result.score > 0);
  assert.ok(result.stages.length >= 1);
  assert.equal(isValidBoard(result.board), true);
  assert.equal(findRuns(result.board).length, 0);
  assert.ok(hasMove(result.board));
  assert.equal(JSON.stringify(board), before, 'move must not mutate input board');
  cases++;
}
let board = createBoard(random(12345));
for (let step = 0; step < 250; step++) {
  const hint = findHint(board);
  assert.ok(hint, 'no dead-end boards');
  const result = makeMove(board, ...hint, random(900 + step));
  assert.equal(result.valid, true);
  assert.equal(result.score, result.stages.reduce((sum, s) => sum + s.points, 0));
  assert.equal(findRuns(result.board).length, 0);
  assert.equal(isValidBoard(result.board), true);
  assert.ok(hasMove(result.board));
  board = result.board;
  cases++;
}
// A 4-run creates a row-clearing power tile.
let four;
for (let seed = 1; seed < 500 && !four; seed++) {
  const b = createBoard(random(seed + 2000));
  b[3][1].kind = 2; b[3][2].kind = 2; b[3][3].kind = 1; b[3][4].kind = 2; b[4][3].kind = 2;
  if (findRuns(b).length) continue;
  const r = makeMove(b, [4, 3], [3, 3], random(seed));
  if (r.valid && r.stages[0].created.some(s => s.special === 'row')) four = r;
}
assert.ok(four, 'four-matches must create a row blast');
assert.ok(four.board.flat().some(s => s.special === 'row'));
cases++;
// T / L and 5-in-a-row creations should both work.
for (const kind of ['bomb', 'rainbow']) {
  const b = createBoard(random(775));
  b[4][4].special = kind;
  const r = makeMove(b, [4, 4], [4, 5], random(222));
  assert.equal(r.valid, true);
  assert.ok(r.stages[0].removed >= 2);
  assert.equal(findRuns(r.board).length, 0);
  cases++;
}
const invalid = makeMove(board, [0, 0], [7, 7]);
assert.equal(invalid.valid, false);
assert.equal(invalid.board, board);
assert.equal(restoreIds(board), true);
const corrupted = structuredClone(board); corrupted[0][0].id = corrupted[0][1].id;
assert.equal(isValidBoard(corrupted), false);
cases++;
console.log(`PASS Monster Match engine: ${cases} board, move, combo, power, save checks`);
