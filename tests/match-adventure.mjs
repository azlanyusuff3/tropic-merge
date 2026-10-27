import assert from 'node:assert/strict';
import { LEVELS, ISLANDS, getLevel, sealPositions, beginLevel, isLevelWon, starsFor, freshProgress, recordVictory, readProgress, totalStars } from '../match/adventure.mjs';
import { createBoard } from '../match/engine.mjs';
assert.equal(LEVELS.length,100);assert.equal(ISLANDS.length,10);
for(let i=1;i<=100;i++){const l=getLevel(i);assert.equal(l.id,i);assert.equal(l.boss,i%10===0);assert.ok(l.moves>0);assert.equal(new Set(sealPositions(l)).size,l.seals);assert.ok(l.boss||l.goals.length>0);}
const board=createBoard(),level=getLevel(1),run=beginLevel(1,board);
assert.equal(isLevelWon(level,run),false);
const won={...run,counts:level.goals.reduce((a,g)=>(a[g.kind]=g.count,a),Array(6).fill(0)),frozen:[]};
assert.equal(isLevelWon(level,won),true);
let progress=freshProgress();progress=recordVictory(progress,level,2000,5);
assert.equal(progress.unlocked,2);assert.equal(progress.stars[1],starsFor(level,5));assert.equal(totalStars(progress),progress.stars[1]);
assert.equal(readProgress(progress).unlocked,2);assert.equal(readProgress({version:2,unlocked:999}).unlocked,100);
assert.equal(getLevel(100).bossHp>getLevel(10).bossHp,true);
console.log('Adventure: 100 levels, 10 bosses, goals, saves, stars OK');
