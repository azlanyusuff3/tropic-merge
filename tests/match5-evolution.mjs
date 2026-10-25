import assert from 'node:assert/strict';
import {createBoard,findRuns,isValidBoard,makeMove,findHint,hasMove,EVOLUTIONS} from '../match/engine.mjs';
const random=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
let verified=0;
for(let kind=0;kind<6;kind++){
  let found;
  for(let seed=1;seed<1200&&!found;seed++){
    const b=createBoard(random(seed*17+kind*70));
    // No existing match before this single swipe. After swapping (4,3)->(3,3)
    // a five-piece + is formed from two intersecting runs of three.
    for (const [r,c] of [[1,3],[2,3],[3,2],[3,4],[4,3]]) b[r][c].kind=kind;
    b[3][3].kind=(kind+1)%6;
    if(findRuns(b).length)continue;
    const m=makeMove(b,[4,3],[3,3],random(seed+3600));
    const created=m.stages[0]?.created.find(c=>c.special==='evolved');
    if(m.valid&&created&&created.r===3&&created.c===3&&m.stages[0].matches.some(g=>g.tier===5&&g.cells.length===5))found={b,m,created};
  }
  assert.ok(found,`A + shaped five-match MUST evolve ${kind}, not spawn a star bomb`);
  const {m,created}=found;
  assert.equal(m.stages[0].matches[0].tier,5);
  assert.equal(m.stages[0].matches[0].cells.length,5);
  assert.equal(created.evolution,EVOLUTIONS[kind]);
  assert.equal(m.stages[0].afterClear[3][3].special,'evolved');
  assert.equal(m.stages[0].afterClear[3][3].evolution,EVOLUTIONS[kind]);
  assert.equal(m.stages[0].created.some(c=>c.special==='bomb'),false);
  assert.ok(isValidBoard(m.board));
  assert.ok(hasMove(m.board));
  assert.ok(m.score>0);
  verified++;
}
// 5-in-a-row still works, and power must appear at swapped location.
for(let kind=0;kind<6;kind++){
  let found;
  for(let seed=1;seed<1200&&!found;seed++){
    const b=createBoard(random(seed*19+kind*100));
    for(const c of [1,2,4,5])b[3][c].kind=kind;
    b[3][3].kind=(kind+1)%6;b[4][3].kind=kind;
    if(findRuns(b).length)continue;
    const m=makeMove(b,[4,3],[3,3],random(seed+1500));
    const created=m.stages[0]?.created.find(c=>c.special==='evolved');
    if(m.valid&&created&&created.r===3&&created.c===3)found={m,created};
  }
  assert.ok(found,`five straight ${kind} must evolve at swipe landing`);
  assert.equal(found.created.evolution,EVOLUTIONS[kind]);
  verified++;
}
// L-shaped five-match: three vertical plus three horizontal sharing a corner.
for(let kind=0;kind<6;kind++){
  let found;
  for(let seed=1;seed<1500&&!found;seed++){
    const b=createBoard(random(seed*27+kind*99));
    for(const [r,c] of [[1,1],[2,1],[3,2],[3,3],[4,1]])b[r][c].kind=kind;
    b[3][1].kind=(kind+1)%6;
    if(findRuns(b).length)continue;
    const m=makeMove(b,[4,1],[3,1],random(seed+7500));
    const created=m.stages[0]?.created.find(c=>c.special==='evolved'&&c.r===3&&c.c===1);
    if(m.valid&&created&&m.stages[0].matches.some(g=>g.tier===5&&g.cells.length===5))found={m,created};
  }
  assert.ok(found,`An L-shaped five-match MUST evolve kind ${kind}`);
  assert.equal(found.created.evolution,EVOLUTIONS[kind]);
  assert.ok(isValidBoard(found.m.board));
  verified++;
}
// The five abilities keep working on these newly created evolved monsters.
for(let kind=0;kind<6;kind++){
  const b=createBoard(random(30000+kind));
  b[3][3]={...b[3][3],kind,special:'evolved',evolution:EVOLUTIONS[kind]};
  const m=makeMove(b,[3,3],[3,4],random(40000+kind));
  assert.ok(m.valid&&m.stages[0].effects.some(e=>e.evolution===EVOLUTIONS[kind]));
  verified++;
}
// Stress: cascades must finish with a valid board, without spontaneously creating bombs.
let totalChains=0;
for(let seed=0;seed<120;seed++){
  let board=createBoard(random(50000+seed));
  for(let move=0;move<12;move++){
    const hint=findHint(board);assert.ok(hint);
    const m=makeMove(board,...hint,random(seed*300+move+60000));
    assert.ok(m.valid);assert.ok(isValidBoard(m.board));assert.equal(findRuns(m.board).length,0);
    for (const stage of m.stages){
      for(const created of stage.created){
        assert.notEqual(created.special,'bomb','new special star bombs should no longer be created');
        assert.ok(stage.matches.some(group=>group.cells.some(([r,c])=>created.r===r&&created.c===c)), 'new specials always anchored inside matched tiles');
      }
      totalChains+=Number(stage.chain>1);
    }
    board=m.board; verified++;
  }
}
console.log('PASS Match 5 evolution/star regression:',verified,'cases;',totalChains,'automatic cascade stages verified');
