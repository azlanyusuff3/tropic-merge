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


// Monster Evolution regression: all 11 identities, 3x3 and mega 5x5, chains and old saves.
import { EVOLUTIONS, cloneBoard } from '../match/engine.mjs';
const intended = ['groveling','bubblo','shadebub','groveling','infernodon','lumiorb'];
assert.deepEqual([...EVOLUTIONS],intended);
for(let kind=0;kind<6;kind++){
 let match5;
 for(let seed=1;seed<=3000&&!match5;seed++){
  const b=createBoard(random(seed*367+kind));
  for(const col of [1,2,4,5])b[3][col].kind=kind;
  b[3][3].kind=(kind+1)%6;b[4][3].kind=kind;
  if(findRuns(b).length)continue;
  const result=makeMove(b,[4,3],[3,3],random(seed+3600));
  const created=result.stages?.[0]?.created.find(c=>c.special==='evolved');
  if(result.valid&&created&&created.evolution===intended[kind])match5={result,created};
 }
 assert.ok(match5,'All six base kinds must evolve with Match 5: '+kind);
 const {result,created}=match5;
 const newborn=result.stages[0].afterClear[created.r][created.c];
 assert.equal(newborn.special,'evolved');
 assert.equal(newborn.evolution,intended[kind]);
 assert.equal(newborn.kind,kind);
 assert.equal(isValidBoard(result.board),true);
 assert.equal(findRuns(result.board).length,0);
 assert.ok(hasMove(result.board));
 cases++;
}
for(let kind=0;kind<6;kind++){
 const b=createBoard(random(8000+kind));
 b[3][3]={...b[3][3],kind,special:'evolved',evolution:intended[kind]};
 assert.equal(isValidBoard(b),true);
 assert.equal(findRuns(b).length,0);
 const before=JSON.stringify(b);
 const result=makeMove(b,[3,3],[3,4],random(8200+kind));
 assert.equal(result.valid,true);
 assert.equal(JSON.stringify(b),before,'blast does not mutate input');
 assert.ok(result.stages[0].effects.some(e=>e.type==='evolved'&&e.evolution===intended[kind]&&e.radius===1));
 const cleared=new Set(result.stages[0].clear.map(x=>x.join(',')));
 for(let r=2;r<=4;r++)for(let c=3;c<=5;c++)assert.ok(cleared.has(r+','+c),'3x3 clear must contain all nine cells');
 assert.equal(result.board.flat().some(x=>x?.id===b[3][3].id),false);
 assert.equal(isValidBoard(result.board),true);
 cases++;
}
{
 const b=createBoard(random(9200));
 b[3][3]={...b[3][3],kind:2,special:'evolved',evolution:'shadebub'};
 b[3][4]={...b[3][4],kind:4,special:'evolved',evolution:'infernodon'};
 const result=makeMove(b,[3,3],[3,4],random(9300));
 assert.equal(result.valid,true);
 assert.ok(result.stages[0].effects.some(e=>e.type==='mega'&&e.radius===2));
 const cleared=new Set(result.stages[0].clear.map(x=>x.join(',')));
 for(let r=1;r<=5;r++)for(let c=2;c<=6;c++)assert.ok(cleared.has(r+','+c),'mega blast must clear 5x5');
 assert.ok(result.score>25*70);
 assert.equal(result.board.flat().some(x=>x?.special==='evolved'),false);
 cases++;
}
{
 const b=createBoard(random(9450));
 b[3][3]={...b[3][3],kind:0,special:'evolved',evolution:'groveling'};
 b[4][5]={...b[4][5],kind:5,special:'evolved',evolution:'lumiorb'};
 const result=makeMove(b,[3,3],[3,4],random(9451));
 assert.equal(result.valid,true);
 assert.equal(result.stages[0].effects.filter(e=>e.type==='evolved').length,2);
 assert.ok(result.stages[0].clear.some(([r,c])=>r===4&&c===6));
 cases++;
}
{
 const original=createBoard(random(9500));
 original[3][3].special='rainbow';
 assert.ok(isValidBoard(original));assert.ok(restoreIds(original));
 assert.ok(makeMove(original,[3,3],[3,4],random(9501)).valid);
 const corrupted=cloneBoard(original);corrupted[3][3].special='evolved';
 assert.equal(isValidBoard(corrupted),false);
 corrupted[3][3].evolution='shadebub';
 assert.equal(isValidBoard(corrupted),false);
 corrupted[3][3].evolution=EVOLUTIONS[corrupted[3][3].kind];
 assert.equal(isValidBoard(corrupted),true);
 cases++;
}
console.log('PASS Monster Evolution: '+cases+' total checks; 11 identities, 3x3, mega 5x5, chains and old saves');
