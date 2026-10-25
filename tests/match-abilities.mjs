// Elemental ability regression suite: gameplay footprints, targeted attacks, chain reactions and legacy saves.
import assert from 'node:assert/strict';
import { createBoard, makeMove, findRuns, hasMove, isValidBoard } from '../match/engine.mjs';
function random(seed) { let n = seed >>> 0; return () => ((n = (Math.imul(1664525, n) + 1013904223) >>> 0) / 4294967296); }
let cases = 0;
import { EVOLUTIONS, ABILITY_NAMES, powerCells, previewPower, cloneBoard } from '../match/engine.mjs';
const specialNames = ['bubblo','shadebub','groveling','lumiorb','infernodon'];
const kindFor = { bubblo: 1, shadebub: 2, groveling: 3, lumiorb: 5, infernodon: 4 };
for (const name of specialNames) {
  const b = createBoard(random(3400 + specialNames.indexOf(name)));
  const kind = kindFor[name];
  b[3][3] = { ...b[3][3], kind, special: 'evolved', evolution: name };
  b[3][4] = { ...b[3][4], kind: 2, special: null };
  assert.ok(ABILITY_NAMES[name]);
  assert.ok(isValidBoard(b));
  const initial = JSON.stringify(b);
  const preview = previewPower(b, [3,3], [3,4]);
  const overview = previewPower(b, [3,3]);
  assert.equal(preview.evolution, name);
  assert.equal(preview.precise, true);
  assert.equal(overview.precise, false);
  const afterSwap=cloneBoard(b);[afterSwap[3][3],afterSwap[3][4]]=[afterSwap[3][4],afterSwap[3][3]];
  const expected = new Set(powerCells(afterSwap,3,4,name,2).map(p=>p.join(',')));
  assert.equal(new Set(preview.cells.map(p=>p.join(','))).size, expected.size, `${name} preview geometry`);
  for(const p of preview.cells)assert.ok(expected.has(p.join(',')));
  if (name === 'bubblo') {
    assert.equal(preview.cells.length,16,'Water clears two complete horizontal rows');
    assert.ok(preview.cells.every(([r])=>r===3||r===4));
  }
  if (name === 'shadebub')assert.equal(preview.cells.length,9);
  if (name === 'groveling')assert.ok(preview.cells.every(([r,c])=>Math.abs(r-3)===Math.abs(c-4)));
  if (name === 'lumiorb')assert.ok(preview.cells.every(([r,c])=> r===3&&c===4 || !afterSwap[r][c].special && afterSwap[r][c].kind===2));
  if (name === 'infernodon') {
    assert.equal(preview.cells.length,15);
    assert.ok(preview.cells.every(([r,c])=>r===3||c===4));
  }
  const m=makeMove(b,[3,3],[3,4],random(5450));
  assert.equal(m.valid,true,name);
  assert.equal(JSON.stringify(b),initial,'original board never mutated');
  const fx=m.stages[0].effects.find(f=>f.evolution===name);
  assert.ok(fx,`${name} emits ability metadata`);
  assert.equal(fx.ability,ABILITY_NAMES[name]);
  assert.deepEqual(fx.cells,preview.cells,'preview matches actual powered cells');
  for(const p of fx.cells)assert.ok(m.stages[0].clear.some(c=>c[0]===p[0]&&c[1]===p[1]),'actual clear includes preview');
  assert.equal(findRuns(m.board).length,0);
  assert.ok(hasMove(m.board));
  cases++;
}
{
  const b=createBoard(random(5000));
  b[3][3]={...b[3][3],kind:1,special:'evolved',evolution:'bubblo'};
  b[4][6]={...b[4][6],kind:2,special:'evolved',evolution:'shadebub'};
  const m=makeMove(b,[3,3],[3,4],random(5002));
  assert.equal(m.valid,true);
  const names=m.stages[0].effects.filter(e=>e.type==='evolved').map(e=>e.evolution);
  assert.ok(names.includes('bubblo')&&names.includes('shadebub'),'power must chain-trigger another evolved monster');
  assert.ok(m.stages[0].clear.some(p=>p[0]===5&&p[1]===7),'Shadow explosion propagates outside water sweep');
  cases++;
}
{
  const b=createBoard(random(5100));
  b[3][3]={...b[3][3],kind:2,special:'evolved',evolution:'shadebub'};
  b[3][4]={...b[3][4],kind:4,special:'evolved',evolution:'infernodon'};
  const preview=previewPower(b,[3,3],[3,4]);
  assert.equal(preview.type,'mega');
  assert.equal(preview.cells.length,25);
  const m=makeMove(b,[3,3],[3,4],random(5103));
  assert.equal(m.valid,true);
  assert.ok(m.stages[0].effects.some(f=>f.type==='mega'));
  assert.equal(m.stages[0].effects.filter(f=>f.type==='evolved').length,0,'mega pair should not double-trigger its two powers');
  cases++;
}
{
  const b=createBoard(random(5200));
  b[3][3]={...b[3][3],kind:5,special:'evolved',evolution:'lumiorb'};
  const preferred=b[3][4].kind;
  const preview=previewPower(b,[3,3],[3,4]);
  assert.equal(preview.targetKind,preferred);
  assert.ok(preview.cells.every(([r,c])=>r===3&&c===4 || (r===3&&c===3) || !b[r][c].special && b[r][c].kind===preferred));
  // When chained without a direct target, Star Magic chooses the board's most frequent normal kind.
  const fallback=powerCells(b,3,3,'lumiorb');
  assert.ok(fallback.length>1);
  cases++;
}
{
  const b=createBoard(random(5300));
  assert.equal(previewPower(b,[3,3]),null,'ordinary monster has no unique power');
  assert.equal(previewPower(b,[3,3],[7,7]),null,'invalid swap has no preview');
  assert.equal(powerCells(b,3,3,'unknown').length,0);
  const corrupt=cloneBoard(b);
  corrupt[3][3].evolution='shadebub';
  assert.equal(isValidBoard(corrupt),false);
  cases++;
}
console.log(`PASS unique elemental powers: ${cases} total engine cases`);
