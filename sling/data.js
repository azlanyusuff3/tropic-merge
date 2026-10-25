import{LAYOUTS}from'./levels.js';
export const SPECIES=[
 ['Slimelet','Jelly bounce','Bounces harder; tap for a forward jelly dash.','#81dc43',1,0.78],
 ['Bubblo','Bubble blast','Tap to push nearby structures apart.','#62d9ff',0.9,0.35],
 ['Puffling','Feather gust','Tap to create a wide, gentle shockwave.','#f892ca',0.85,0.3],
 ['Sproutiball','Vine burst','Tap to scatter three seed projectiles.','#dfdf6c',1,0.35],
 ['Rockro','Boulder smash','Heavy hitter. Tap for a powerful downward smash.','#fa9753',2.6,0.15],
 ['Frostbop','Frost burst','Tap to weaken and freeze nearby building pieces.','#a9ecff',1.2,0.25],
 ['Shadebub','Shadow slip','Tap to phase through obstacles briefly.','#b575ec',0.9,0.3],
 ['Groveling','Root quake','Tap to shake the foundations below.','#a4cc65',1.7,0.25],
 ['Tidalon','Tidal wave','Tap to sweep nearby enemies and blocks sideways.','#5bc9ec',1.5,0.3],
 ['Lumiorb','Star seeker','Tap to curve toward the nearest enemy.','#f7de87',1,0.4],
 ['Infernodon','Inferno blast','Tap for a powerful fiery explosion.','#fb9842',2,0.2]
].map(([name,skill,description,color,mass,bounce],id)=>({id,name,skill,description,color,mass,bounce,asset:`./assets/monsters/${String(id+1).padStart(2,'0')}-${name.toLowerCase()}.webp`}));
export const ISLANDS=[['Sunlit Shores','Learn the sling','#7bd9df','#e9e9a8'],['Bamboo Bluffs','Tall towers & tricky angles','#9ed6aa','#e8cf8e'],['Frost Lagoon','Glass bridges & icy ruins','#a5ddec','#daeced'],['Twilight Grove','Hidden supports & shadow tricks','#b4b2df','#c3bdce'],['Ember Summit','Bosses & volcanic strongholds','#e9ae83','#e5ba85']];
export const LEVELS=Array.from({length:30},(_,i)=>({id:i,island:Math.floor(i/6),number:i+1,title:LAYOUTS[i][0],pattern:i%6,rank:Math.floor(i/6),shots:i%6===5?5:4,boss:i%6===5}));
export const SAVE='monsterSlingSaveV1',BACKUP='monsterSlingBackupV1';
function parse(storage,key){try{return JSON.parse(storage.getItem(key))}catch{return null}}
function valid(s){return s?.version===1&&Array.isArray(s.results)&&s.results.length<=LEVELS.length&&s.results.every(x=>x===null||x&&Number.isFinite(x.score)&&Number.isInteger(x.stars)&&x.stars>=1&&x.stars<=3)&&Number.isInteger(s.selected)&&s.selected>=0&&s.selected<11}
export function load(storage){const a=parse(storage,SAVE),b=parse(storage,BACKUP);return valid(a)?a:valid(b)?b:{version:1,results:[],selected:0,sound:true,revision:0}}
export function save(storage,s){try{const old=parse(storage,SAVE);if(valid(old)){s.results=LEVELS.map((_,i)=>{const a=s.results[i],b=old.results[i];return a&&b?{score:Math.max(a.score,b.score),stars:Math.max(a.stars,b.stars)}:a||b||null});storage.setItem(BACKUP,JSON.stringify(old))}s.revision=(s.revision||0)+1;storage.setItem(SAVE,JSON.stringify(s));return true}catch{return false}}
// Legacy hero grants are captured once; subsequent Merge play cannot change Sling.
export function unlocked(s,storage){
 const wins=s.results.filter(Boolean).length;
 if(!Array.isArray(s.legacyHeroes)){
  let previous=[];
  if(wins>0){try{previous=JSON.parse(storage.getItem('monsterMergeCodexV1'))||[]}catch{}}
  s.legacyHeroes=Array.isArray(previous)?previous.filter(i=>Number.isInteger(i)&&i>=0&&i<SPECIES.length):[];
 }
 return [...new Set([0,1,4,...SPECIES.filter(d=>wins>=[0,0,2,4,0,7,10,13,16,20,25][d.id]).map(d=>d.id),...s.legacyHeroes])];
}
export function available(s,id){return Number.isInteger(id)&&id>=0&&id<LEVELS.length&&(id===0||!!s.results[id-1])}
export function record(s,id,score,shotsLeft){if(!Number.isInteger(id)||id<0||id>=LEVELS.length||!Number.isFinite(score)||score<0||!Number.isInteger(shotsLeft)||shotsLeft<0||shotsLeft>LEVELS[id].shots)throw new RangeError('Invalid campaign result');const stars=shotsLeft>=2?3:shotsLeft>=1?2:1;const old=s.results[id];s.results[id]={score:Math.max(old?.score||0,score),stars:Math.max(old?.stars||0,stars)};return stars}
