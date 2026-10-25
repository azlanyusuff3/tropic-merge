import assert from 'node:assert/strict';
import {load,save,unlocked,campaignHeroes,HERO_UNLOCK_LEVELS,SAVE,BACKUP} from '../sling/data.js';
const m=new Map(),storage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};
for(let hero=0;hero<11;hero++){
 const n=HERO_UNLOCK_LEVELS[hero];
 const s={results:Array.from({length:Math.max(0,n-2)},()=>({stars:1,score:100}))};
 if(n>1)assert(!campaignHeroes(s).includes(hero));
 s.results=Array.from({length:n-1},()=>({stars:1,score:100}));assert(campaignHeroes(s).includes(hero));
}
assert.deepEqual(campaignHeroes({results:[null,{stars:3,score:100}]}),[0]);
m.set('monsterMergeCodexV1','[10]');const fresh=load(storage);assert(!unlocked(fresh,storage).includes(10));
const legacy={version:1,results:[{stars:3,score:200}],selected:6,sound:false};m.set(SAVE,JSON.stringify(legacy));
const migrated=load(storage);assert(unlocked(migrated,storage).includes(6));assert(unlocked(migrated,storage).includes(10));assert(save(storage,migrated));
m.set('monsterMergeCodexV1','[9]');assert(!unlocked(load(storage),storage).includes(9));assert.equal(load(storage).sound,false);
const stale=load(storage),newer=load(storage);newer.results[1]={stars:2,score:400};assert(save(storage,newer));assert(save(storage,stale));assert.equal(load(storage).results[1].score,400);
m.set(SAVE,'broken');const recovered=load(storage);assert.equal(recovered.results[0].stars,3);assert(save(storage,recovered));assert.equal(JSON.parse(m.get(BACKUP)).results[0].stars,3);
assert.equal(m.get('monsterMergeCodexV1'),'[9]');
assert.equal(save(storage,{version:1,results:[{stars:9,score:1}],selected:0}),false);
console.log('PASS 11 unlock boundaries, progression gaps, legacy hero preservation, settings, concurrent saves, corrupt-primary recovery, invalid save rejection, Merge key preservation');
