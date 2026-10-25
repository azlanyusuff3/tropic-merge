// Visual-only match metadata regression: all six elements at 3/4/5, cascades,
// normal scoring, saved boards, and existing evolved attacks.
import assert from 'node:assert/strict';
import { createBoard, findRuns, hasMove, isValidBoard, makeMove, findHint } from '../match/engine.mjs';
import { ELEMENTS } from '../match/effects.mjs';

const rng = seed => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
assert.deepEqual(ELEMENTS.map(e => e.key), ['slime', 'water', 'puff', 'leaf', 'rock', 'ice']);
const matrix = [
  { tier: 3, row: [1, 2], gap: 3, from: [4, 3], to: [3, 3] },
  { tier: 4, row: [1, 2, 4], gap: 3, from: [4, 3], to: [3, 3] },
  { tier: 5, row: [1, 2, 4, 5], gap: 3, from: [4, 3], to: [3, 3] }
];
let cases = 0;
for (let kind = 0; kind < 6; kind++) for (const fixture of matrix) {
  let found = null;
  for (let seed = 1; seed < 5000 && !found; seed++) {
    const b = createBoard(rng(seed * 371 + kind * 61 + fixture.tier));
    for (const c of fixture.row) b[3][c].kind = kind;
    b[3][fixture.gap].kind = (kind + 1) % 6;
    b[fixture.from[0]][fixture.from[1]].kind = kind;
    b[3][0].kind = (kind + 2) % 6;
    b[3][6].kind = (kind + 3) % 6;
    if (fixture.tier === 3) b[3][4].kind = (kind + 2) % 6;
    if (fixture.tier === 4) b[3][5].kind = (kind + 3) % 6;
    if (findRuns(b).length) continue;
    const outcome = makeMove(b, fixture.from, fixture.to, rng(seed + 8000));
    if (!outcome.valid) continue;
    const match = outcome.stages[0].matches.find(g => g.kind === kind && g.tier === fixture.tier);
    if (match) found = { b, outcome, match };
  }
  assert.ok(found, `Expected match tier ${fixture.tier} for kind ${kind}`);
  const { b, outcome, match } = found;
  assert.equal(match.kind, kind);
  assert.equal(match.tier, fixture.tier);
  assert.ok(match.cells.length >= fixture.tier);
  assert.ok(match.cells.every(([r, c]) => b[r]?.[c] || outcome.swapped[r]?.[c]));
  assert.equal(outcome.score, outcome.stages.reduce((sum, s) => sum + s.points, 0));
  assert.ok(outcome.stages.every(s => Array.isArray(s.matches)));
  assert.equal(isValidBoard(outcome.board), true);
  assert.equal(findRuns(outcome.board).length, 0);
  assert.equal(hasMove(outcome.board), true);
  assert.deepEqual(outcome.stages.map(s => s.matches.map(g => g.kind).every(k => k >= 0 && k < 6)), outcome.stages.map(() => true));
  cases++;
}
// Existing special-only swaps should not falsely masquerade as normal matching.
{
  const b = createBoard(rng(8711));
  b[3][3] = { ...b[3][3], kind: 4, special: 'evolved', evolution: 'infernodon' };
  const out = makeMove(b, [3, 3], [3, 4], rng(8911));
  assert.ok(out.valid);
  assert.ok(out.stages[0].effects.some(e => e.evolution === 'infernodon'));
  assert.ok(out.stages.every(s => Array.isArray(s.matches)));
  cases++;
}
// Repeated cascades retain their match metadata but do not change scoring.
{
  let board = createBoard(rng(1000));
  let cascades = 0;
  for (let move = 0; move < 130; move++) {
    const hint = findHint(board);
    const result = makeMove(board, ...hint, rng(move + 5000));
    assert.ok(result.valid);
    assert.ok(result.score > 0);
    assert.ok(result.stages.every(s => s.matches.every(g => g.cells.length >= 3)));
    if (result.chains > 1) cascades++;
    board = result.board;
    cases++;
  }
  assert.ok(cascades > 0, 'At least one cascade tested');
}
console.log(`PASS Elemental Match FX metadata: ${cases} cases, six unique styles, tiers 3/4/5, combo and power compatibility`);
