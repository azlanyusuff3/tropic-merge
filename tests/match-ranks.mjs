// Match 5/6/7+ evolution strengths; backwards-compatible board saves and previews.
import assert from 'node:assert/strict';
import { createBoard, findRuns, makeMove, powerCells, previewPower, isValidBoard, EVOLUTIONS, hasMove, cloneBoard } from '../match/engine.mjs';
const rng = seed => () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
let checks=0;
for (let kind=0;kind<6;kind++) for (const count of [5,6,7]) {
  const rows=count===5 ? [2,4] : [1,2,4];
  const cols=count===5 ? [2,4] : count===6 ? [2,4] : [1,2,4];
  let matched;
  for(let i=1;i<2500&&!matched;i++){
    const b=createBoard(rng(i*217+kind*101+count*907));
    for(const c of rows)b[3][c].kind=kind;
    for(const r of cols)b[r][3].kind=kind;
    b[3][3].kind=(kind+1)%6;
    b[4][3].kind=kind;
    if(findRuns(b).length)continue;
    const m=makeMove(b,[4,3],[3,3],rng(i+21000));
    const group=m.stages?.[0]?.matches?.find(g=>g.kind===kind&&g.cells.length===count);
    const created=m.stages?.[0]?.created?.find(c=>c.special==='evolved'&&c.r===3&&c.c===3);
    if(m.valid&&group&&created)matched={m,created,group};
  }
  assert.ok(matched,`Kind ${kind} must evolve for a connected ${count}-match`);
  const {m,created,group}=matched;
  const rank=count-4;
  assert.equal(group.tier,count,`FX tier for ${count}`);
  assert.equal(created.rank,rank);
  assert.equal(created.evolution,EVOLUTIONS[kind]);
  assert.equal(m.stages[0].afterClear[3][3].rank,rank);
  assert.ok(isValidBoard(m.board)&&hasMove(m.board));
  const score=m.stages.reduce((sum,s)=>sum+s.points,0);
  assert.equal(m.score,score);
  checks++;
}
for(const [name,kind] of [['bubblo',1],['shadebub',2],['groveling',3],['lumiorb',5],['infernodon',4]]){
  const b=createBoard(rng(3400+kind));
  for(let rank=1;rank<=3;rank++){
    b[3][3]={...b[3][3],kind,special:'evolved',evolution:name,rank};
    b[3][4]={...b[3][4],kind:2,special:null};
    assert.ok(isValidBoard(b),`${name} rank ${rank} board`);
    const preview=previewPower(b,[3,3],[3,4]);
    const m=makeMove(b,[3,3],[3,4],rng(4400+kind+rank));
    assert.equal(preview.rank,rank);
    assert.equal(m.valid,true);
    const fx=m.stages[0].effects.find(e=>e.evolution===name);
    assert.ok(fx);
    assert.equal(fx.rank,rank);
    assert.deepEqual(fx.cells,preview.cells);
    assert.ok(isValidBoard(m.board));
    if(rank===1){
      // Old saves didn't contain a rank and must stay valid with basic power.
      const old=cloneBoard(b);delete old[3][3].rank;
      assert.ok(isValidBoard(old));
      assert.deepEqual(previewPower(old,[3,3],[3,4]).cells,preview.cells);
    }
    checks++;
  }
  const counts=[1,2,3].map(rank=>powerCells(b,3,3,name,2,rank).length);
  assert.ok(counts[0]<counts[1]&&counts[1]<counts[2],`${name} rank strength: ${counts}`);
  checks++;
}
{
 const b=createBoard(rng(200));
 b[3][3]={...b[3][3],kind:4,special:'evolved',evolution:'infernodon',rank:4};
 assert.equal(isValidBoard(b),false,'no invalid rank 4');
 b[3][3].rank=2;assert.equal(isValidBoard(b),true);
 b[3][3].rank=0;assert.equal(isValidBoard(b),false);
 checks++;
}
console.log(`PASS Enhanced and Super evolution: ${checks} deterministic checks, 5/6/7 patterns, all five stronger powers, old save compatibility`);
