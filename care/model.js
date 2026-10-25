// All Care writes stay in these two keys. Merge progress is strictly read-only.
export const KEY='monsterCareSaveV1',BACKUP='monsterCareBackupV1';
export const SPECIES=[
 ['Slimelet','Affectionate jelly • always ready for a snack','mango',1.2,1.2,1.15,'jelly'],
 ['Bubblo','Cheerful • happiest in a bubble bath','berry',1,1.25,1.05,'bubble'],
 ['Puffling','Cuddly • needs naps and gentle attention','milk',.7,.75,1.4,'nap'],
 ['Sproutiball','Curious • loves chasing its ball','mango',1.5,.9,1.1,'hop'],
 ['Rockro','A sturdy little softie • trusts slowly','cookie',.55,1.4,.7,'stomp'],
 ['Frostbop','Calm • a fan of long, peaceful rests','milk',.6,.85,1.2,'nap'],
 ['Shadebub','Mischievous • watch for disappearing tricks','berry',1.4,.85,1.05,'hide'],
 ['Groveling','Gentle • feels at home among plants','mango',.65,1.2,.75,'sway'],
 ['Tidalon','A splash-loving ocean friend','berry',1.15,1.2,.9,'splash'],
 ['Lumiorb','Graceful • shares magical affection','milk',.85,1.35,.85,'magic'],
 ['Infernodon','Proud • dramatic, but loyal once bonded','cookie',1.3,.7,.95,'flare']
].map(([name,description,favorite,activity,affection,tiredness,quirk],i)=>({i,name,description,favorite,activity,affection,tiredness,quirk,asset:`./assets/monsters/${String(i+1).padStart(2,'0')}-${name.toLowerCase()}.webp`}));
export const FOODS={mango:{name:'Sun mango',price:8,fill:25},berry:{name:'Berry bowl',price:10,fill:30},milk:{name:'Coconut milk',price:8,fill:23},cookie:{name:'Star biscuit',price:12,fill:34}};
export const SHOP=[
 {id:'ball',name:'Beach ball',price:40,slot:'toy',kind:'ball',note:'Extra happiness when playing'},
 {id:'kite',name:'Island kite',price:65,slot:'toy',kind:'kite',note:'Play together for extra XP'},
 {id:'bed',name:'Cloud cushion',price:60,slot:'bed',kind:'bed',note:'Sleep recovers energy faster'},
 {id:'hammock',name:'Lazy hammock',price:95,slot:'bed',kind:'hammock',note:'A cozy place to rest'},
 {id:'palm',name:'Little palm',price:35,slot:'plant',kind:'palm',note:'A leafy friend for your room'},
 {id:'flower',name:'Hibiscus pot',price:45,slot:'plant',kind:'flower',note:'A touch of tropical color'},
 {id:'lamp',name:'Firefly lantern',price:50,slot:'shelf',kind:'lamp',note:'Warm island evenings'},
 {id:'shell',name:'Seashell keepsake',price:25,slot:'shelf',kind:'shell',note:'A tiny ocean treasure'},
 {id:'stool',name:'Bamboo stool',price:45,slot:'furniture',kind:'stool',note:'Handmade island furniture'},
 {id:'rug',name:'Sunrise rug',price:55,slot:'rug',kind:'rug',note:'Soft under little feet'}
];
export const GAMES=['catch','bubble','jump','hide'];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
export const dayKey=(t=Date.now())=>{const d=new Date(t);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
export function readJSON(storage,key,fallback){try{return JSON.parse(storage.getItem(key))??fallback}catch{return fallback}}
export function unlocked(storage){const c=readJSON(storage,'monsterMergeCodexV1',[]);return [...new Set([0,...(Array.isArray(c)?c.filter(i=>Number.isInteger(i)&&i>=0&&i<11):[])])]}
export function newPet(species,now=Date.now()){return {id:`pet-${species}-${now}`,species,adopted:now,last:now,hunger:85,happiness:85,energy:85,cleanliness:90,friendship:10,xp:0,feeds:0,plays:0,baths:0,careDays:[],sleeping:false,lastAction:0,lastTouch:0,lastCareReward:0,birthday:''}}
export function fresh(now=Date.now()){const p=newPet(0,now);return {version:1,revision:0,pets:[p],active:p.id,coins:120,foods:{mango:5,berry:3,milk:3,cookie:2},owned:['bed','rug'],slots:{bed:'bed',rug:'rug'},achievements:[],claimed:[],daily:'',games:{},gardenVisits:0,settings:{sound:true},last:now}}
function valid(s){return s?.version===1&&Array.isArray(s.pets)&&s.pets.length>0&&s.pets.length<=33&&s.pets.every(p=>Number.isInteger(p.species)&&p.species>=0&&p.species<11&&typeof p.id==='string'&&['hunger','happiness','energy','cleanliness','friendship','xp','adopted','last'].every(k=>Number.isFinite(p[k])))&&Number.isFinite(s.coins)&&s.coins>=0&&s.coins<=1e9&&s.foods&&typeof s.foods==='object'&&Array.isArray(s.owned)&&Array.isArray(s.claimed)&&Array.isArray(s.achievements)&&s.slots&&typeof s.slots==='object'}
export function load(storage,now=Date.now()){
 const a=readJSON(storage,KEY,null),b=readJSON(storage,BACKUP,null);let s=valid(a)?a:valid(b)?b:fresh(now);
 if(!s.pets.some(p=>p.id===s.active))s.active=s.pets[0].id;
 s.games ||= {};s.settings ||= {sound:true};s.gardenVisits ||=0;
 s.owned=s.owned.filter(x=>SHOP.some(y=>y.id===x));
 for(const [k,v]of Object.entries(s.slots))if(!s.owned.includes(v))delete s.slots[k];
 for(const k of Object.keys(FOODS))s.foods[k]=clamp(Number(s.foods[k])||0,0,999);
 s.pets.forEach(p=>{for(const k of ['hunger','happiness','energy','cleanliness','friendship'])p[k]=clamp(p[k]);p.careDays=Array.isArray(p.careDays)?p.careDays.filter(x=>typeof x==='string'):[];p.feeds=Number(p.feeds)||0;p.plays=Number(p.plays)||0;p.baths=Number(p.baths)||0;advance(p,now,s)});return s;
}
export function save(storage,s,now=Date.now()){
 try{if(!valid(s))throw Error('Invalid care save');s.last=now;s.revision=(s.revision||0)+1;const data=JSON.stringify(s),old=storage.getItem(KEY);if(valid(readJSON(storage,KEY,null)))storage.setItem(BACKUP,old);storage.setItem(KEY,data);return true}catch{return false}
}
export function active(s){return s.pets.find(p=>p.id===s.active)||s.pets[0]}
export function advance(p,now=Date.now(),s={slots:{}}){
 // Cap a long absence to 12 hours. A backwards clock only rebases time; pets never die.
 const hours=clamp((now-p.last)/3600000,0,12),d=SPECIES[p.species];
 p.hunger=Math.max(15,p.hunger-hours*3.2*(d.activity*.4+.6));p.happiness=Math.max(25,p.happiness-hours*1.7);p.cleanliness=Math.max(20,p.cleanliness-hours*2.3);
 p.energy=p.sleeping?clamp(p.energy+hours*(s.slots.bed?28:22)):Math.max(20,p.energy-hours*2.4*d.tiredness);
 p.last=now;
}
export const level=p=>1+Math.floor(p.xp/80);
export function stage(p){if(p.xp>=650&&p.feeds>=15&&p.plays>=10&&p.friendship>=65&&p.careDays.length>=3)return 'Adult';if(p.xp>=160&&p.feeds>=4&&p.plays>=3&&p.friendship>=25&&p.careDays.length>=1)return 'Young';return 'Baby'}
export function growthHint(p){return stage(p)==='Adult'?'All grown up. Keep making memories!':stage(p)==='Young'?`Adult: 650 XP · 15 feeds · 10 plays · 65 bond · 3 care days (${p.careDays.length}/3)`:`Young: 160 XP · 4 feeds · 3 plays · 25 bond`}
export function mood(p){return p.sleeping?'Dreaming':p.hunger<35?'A little hungry':p.energy<35?'Ready for a nap':p.cleanliness<35?'Bath time?':p.happiness<40?'Could use a cuddle':p.friendship>75?'Feeling loved':'Happy at home'}
function cared(s,p,now,xp=8){p.xp+=xp;const day=dayKey(now);if(!p.careDays.includes(day))p.careDays.push(day);if(now-(p.lastCareReward||0)>=60000){s.coins+=3;p.lastCareReward=now}return true}
export function care(s,kind,value,now=Date.now()){
 const p=active(s),d=SPECIES[p.species];advance(p,now,s);
 if(kind==='sleep'){p.sleeping=!p.sleeping;return {ok:true,text:p.sleeping?'Sweet island dreams…':'Good morning, little friend!'}}
 if(p.sleeping)return {ok:false,text:'Wake your monster first.'};
 if(now-(p.lastAction||0)<1200)return {ok:false,text:'One little moment…'};
 if(kind==='feed'){
  if(!FOODS[value]||!s.foods[value])return {ok:false,text:'Pick up some food in the shop.'};
  if(p.hunger>96)return {ok:false,text:'That little tummy is full!'};
  s.foods[value]--;p.hunger=clamp(p.hunger+FOODS[value].fill);p.happiness=clamp(p.happiness+(value===d.favorite?9:4));p.friendship=clamp(p.friendship+(value===d.favorite?3:1)*d.affection);p.feeds++;cared(s,p,now,12);
 }else if(kind==='bath'){
  if(p.cleanliness>98)return {ok:false,text:'Already squeaky clean!'};
  p.cleanliness=100;p.happiness=clamp(p.happiness+([1,8].includes(p.species)?16:7));p.friendship=clamp(p.friendship+2*d.affection);p.baths++;cared(s,p,now,14);
 }else if(kind==='play'){
  if(p.energy<12)return {ok:false,text:'A little nap will help first.'};
  p.energy=clamp(p.energy-7*d.tiredness);p.happiness=clamp(p.happiness+(s.slots.toy?16:10));p.friendship=clamp(p.friendship+3*d.affection);p.cleanliness=clamp(p.cleanliness-3);p.plays++;cared(s,p,now,s.slots.toy==='kite'?18:12);
 }else if(kind==='pet'||kind==='tickle'){
  if(now-(p.lastTouch||0)<5000)return {ok:false,text:'Enjoying your company…'};
  p.lastTouch=now;const gentle=[2,5].includes(p.species)&&kind==='tickle';p.happiness=clamp(p.happiness+(gentle?-2:3));p.friendship=clamp(p.friendship+(gentle?.3:1.3)*d.affection);cared(s,p,now,3);
 }else return {ok:false,text:'Try a care activity.'};
 p.lastAction=now;
 return {ok:true,text:kind==='feed'?(value===d.favorite?'My favorite! Thank you!':'Yum! That hit the spot.'):kind==='bath'?'Fresh, fluffy and sparkling!':kind==='play'?'Again! That was so much fun!':kind==='tickle'&&[2,5].includes(p.species)?'Hehe… gently, please!':'You make my island brighter!'}
}
export function adopt(s,i,storage,now=Date.now()){
 if(!unlocked(storage).includes(i))return false;
 const existing=s.pets.find(p=>p.species===i);if(existing){s.active=existing.id;return true}
 const p=newPet(i,now);s.pets.push(p);s.active=p.id;return true;
}
export function purchase(s,id){const f=FOODS[id],item=SHOP.find(x=>x.id===id);if(!f&&!item)return false;if(item&&s.owned.includes(id)){s.slots[item.slot]=id;return true}const price=f?.price??item.price;if(s.coins<price)return false;s.coins-=price;if(f)s.foods[id]=Math.min(999,s.foods[id]+1);else{s.owned.push(id);s.slots[item.slot]=id}return true}
export function daily(s,now=Date.now()){const day=dayKey(now);if(s.daily===day)return false;s.daily=day;s.coins+=25;s.foods.mango+=2;return true}
export function milestones(s,storage){let reward=0;const best=Number(storage.getItem('tropicBest'))||0;for(const n of [500,1500,5000,10000,25000])if(best>=n&&!s.claimed.includes('score'+n)){s.claimed.push('score'+n);s.coins+=25;reward+=25}return reward}
export const ACHIEVEMENTS=[
 ['first','Island family','Adopt your first friend',s=>s.pets.length>0],
 ['feed5','Little foodie','Feed one monster 5 times',s=>s.pets.some(p=>p.feeds>=5)],
 ['bond','Best friends','Reach 100 friendship',s=>s.pets.some(p=>p.friendship>=100)],
 ['adult','All grown up','Raise an Adult monster',s=>s.pets.some(p=>stage(p)==='Adult')],
 ['games','Island champion','Finish all four mini-games',s=>GAMES.every(k=>s.games[k]?.played)],
 ['all','Whole wide world','Discover all 11 species in Merge',(s,st)=>unlocked(st).length===11],
 ['three','A growing family','Give care to 3 species',s=>s.pets.filter(p=>p.careDays.length).length>=3],
 ['inferno','A warm heart','Reach 80 bond with Infernodon',s=>s.pets.some(p=>p.species===10&&p.friendship>=80)]
];
export function achievements(s,storage){const added=[];for(const [id,title,,check]of ACHIEVEMENTS)if(!s.achievements.includes(id)&&check(s,storage)){s.achievements.push(id);s.coins+=20;added.push(title)}return added}
export function anniversary(s,p,now=Date.now()){const days=Math.floor((now-p.adopted)/86400000),day=dayKey(now);if(days>0&&days%30===0&&p.birthday!==day){p.birthday=day;s.coins+=20;return true}return false}
export function gameReward(s,kind,score,now=Date.now()){
 if(!GAMES.includes(kind))return 0;score=clamp(Math.floor(Number(score)||0),0,100);const p=active(s);advance(p,now,s);const coins=5+Math.min(30,Math.floor(score/2));s.coins+=coins;s.games[kind]={played:(s.games[kind]?.played||0)+1,best:Math.max(score,s.games[kind]?.best||0)};p.happiness=clamp(p.happiness+10);p.energy=clamp(p.energy-5);p.friendship=clamp(p.friendship+2);p.plays++;cared(s,p,now,10+Math.min(25,score));return coins;
}
