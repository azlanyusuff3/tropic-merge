// Monster Sling campaign: 30 hand-built levels on five islands.
// World units: the ground surface is at y=590. The sling stands on a ledge at x=190; a strip of sea
// separates it from the enemy plateau, which starts at x=560. Each level is one function.
import{body,GROUND}from'./physics.js';
import{makeEnemy}from'./enemies.js';

export const MATERIAL={
 wood:{mass:1.1,hp:95,friction:.6},
 bamboo:{mass:.9,hp:85,friction:.55},
 glass:{mass:.65,hp:55,friction:.35},
 stone:{mass:2.8,hp:180,friction:.75},
 obsidian:{mass:3.2,hp:150,friction:.75},
 lantern:{mass:.5,hp:28,friction:.4},
 boulder:{mass:3.6,hp:400,friction:.8}
};
export const LEDGE_END=360,PLATEAU=560;

function builder(){
 const blocks=[],enemies=[],movers=[],pits=[],decor=[];let crystal=null;
 const api={
  blocks,enemies,movers,pits,decor,
  add(x,y,w,h,kind='wood',extra){const m=MATERIAL[kind];const b=body({x,y,w,h,kind,mass:m.mass*(w*h)/(18*86)*.62+m.mass*.38,hp:m.hp,friction:m.friction,...extra});b.maxHp=b.hp;blocks.push(b);return b},
  stand(x,base,w,h,kind,extra){api.add(x,base-h/2,w,h,kind,extra);return base-h},
  post(x,base,h=86,kind='wood',w=18){return api.stand(x,base,w,h,kind)},
  slab(x,base,w,kind='wood',h=14){return api.stand(x,base,w,h,kind)},
  crate(x,base,s=56,kind='wood'){return api.stand(x,base,s,s,kind)},
  frame(x,base,span=96,h=86,kind='wood',roof=kind){api.post(x-span/2,base,h,kind);api.post(x+span/2,base,h,kind);return api.slab(x,base-h,span+34,roof)},
  pyramid(x,base,rows,s=50,kind='glass'){let y=base;for(let r=rows;r>0;r--){for(let i=0;i<r;i++)api.add(x+(i-(r-1)/2)*s,y-s/2,s-1,s-1,kind);y-=s}return y},
  lantern(x,base){return api.stand(x,base,22,34,'lantern')},
  pylon(x,base,h=110){return api.stand(x,base,34,h,'obsidian',{pylon:true})},
  boulder(x,base,r=30){const m=MATERIAL.boulder,b=body({x,y:base-r,r,kind:'boulder',mass:m.mass,hp:m.hp,friction:m.friction});b.maxHp=b.hp;blocks.push(b);return b},
  // Static scenery piece (ramp, rock shelf) that cannot break.
  rock(x,y,w,h,a=0){const b=body({x,y,w,h,a,kind:'rockwall',static:true});blocks.push(b);return y-h/2},
  // Kinematic obstacle following a sine path: {ax,ay,rot,period}
  mover(x,y,w,h,kind,path){const b=body({x,y,w,h,kind,static:true,kin:true,hp:9999});b.path={...path,x,y};b.maxHp=b.hp;movers.push(b);blocks.push(b);return b},
  enemy(type,x,base,opts){const e=makeEnemy(type,x,base,opts);enemies.push(e);return opts?.y!=null?e.y:e.y-(e.h||e.r*2)/2},
  pit(x0,x1,fill='water',depth=120){pits.push({x0,x1,fill,depth})},
  deco(type,x,base,extra){decor.push({type,x,base,...extra})},
  crystalAt(x){crystal=x},
  get crystal(){return crystal}
 };
 return api;
}

const G=GROUND;
// [title, shots, options, build(b)]. options: {wind}
export const LAYOUTS=[
 // ── Island 1 · Sunlit Shores ──
 ['First Sling',4,{},b=>{b.crate(760,G,40);b.enemy(0,860,G);b.crystalAt(980)}],
 ['Falling Crates',4,{},b=>{const t=b.frame(820,G,104,86);b.crate(795,t,48);b.crate(845,t,48);b.enemy(0,820,G);b.crate(960,G,56);b.enemy(0,1040,G);b.crystalAt(1120)}],
 ['Sky Bridge',4,{},b=>{const a=b.frame(780,G),c=b.frame(1040,G);b.enemy(0,780,G);b.enemy(0,1040,G);const top=b.slab(910,a,190,'wood',18);b.enemy(1,910,top);b.crystalAt(1150)}],
 ['The Weak Support',4,{},b=>{b.post(760,G,124,'wood',22);b.stand(1010,G,40,124,'stone');const top=b.slab(885,G-124,310,'stone',16);b.enemy(1,860,top);b.enemy(0,885,G);b.enemy(1,960,top);b.crystalAt(1110)}],
 ['Ink Trouble',4,{},b=>{let t=b.frame(860,G);b.enemy(0,860,G);t=b.frame(860,t,96,86,'wood','glass');b.enemy(2,860,t);b.crate(1010,G,56);b.enemy(1,1090,G);b.crystalAt(1180)}],
 ['Shore Fortress',5,{},b=>{let t=b.frame(780,G);b.enemy(0,780,G);t=b.frame(780,t);b.enemy(1,780,t-0);const c=b.frame(1030,G);b.enemy(2,1030,G);const br=b.slab(905,t,170,'wood',16);b.enemy(0,905,br);const r=b.frame(1030,c,90,80,'glass');b.enemy(2,1030,c);b.crate(1150,G,52);b.crate(1150,G-52,52);b.enemy(1,1150,G-104);b.crystalAt(1240)}],
 // ── Island 2 · Bamboo Bluffs ──
 ['Flying Trouble',4,{},b=>{b.frame(880,G,96,90,'bamboo');b.enemy(0,880,G);b.enemy(3,900,0,{y:380,patrol:{dx:150,dy:28,period:5}});b.crystalAt(1040)}],
 ['Windy Heights',4,{wind:-55},b=>{b.mover(700,440,18,120,'bamboo',{ay:70,period:3.2});b.post(910,G,170,'bamboo',20);b.post(1030,G,170,'bamboo',20);const t=b.slab(970,G-170,170,'bamboo',16);b.enemy(1,940,t);b.enemy(0,1005,t);b.enemy(0,970,G);b.deco('windsock',640,G);b.crystalAt(1130)}],
 ['Bamboo Domino',4,{},b=>{for(const x of[700,758,816,874])b.post(x,G,156,'bamboo',16);const t=b.frame(985,G,96,86,'bamboo');b.enemy(0,985,G);b.enemy(1,985,t);b.crate(1120,G,52);b.enemy(0,1120,G-52);b.crystalAt(1210)}],
 ['Spiky Surprise',4,{},b=>{const t=b.frame(850,G,104,92,'bamboo','stone');b.enemy(4,850,G);b.crate(830,t,44);b.crate(872,t,44);b.post(1010,G,120,'bamboo',18);b.post(1100,G,120,'bamboo',18);const s=b.slab(1055,G-120,140,'wood',16);b.enemy(4,1055,s);b.enemy(0,1055,G);b.crystalAt(1180)}],
 ['Stonebreaker',4,{},b=>{const t=b.frame(860,G,100,92,'stone','stone');b.enemy(0,860,G);b.enemy(1,860,t);const u=b.frame(1060,G,100,92,'stone','wood');b.enemy(4,1060,G);b.crate(1060,u,50,'stone');b.crystalAt(1170)}],
 ['Bamboo Citadel',5,{},b=>{let t=b.frame(780,G,96,90,'bamboo');b.enemy(0,780,G);t=b.frame(780,t,96,90,'bamboo');b.enemy(4,780,t);const c=b.frame(1020,G,110,96,'bamboo','stone');b.enemy(4,1020,G);b.enemy(1,1020,c);b.enemy(3,900,0,{y:262,patrol:{dx:120,dy:20,period:4.6}});b.enemy(3,1080,0,{y:200,patrol:{dx:90,dy:24,period:5.4,phase:2}});b.crystalAt(1170)}],
 // ── Island 3 · Coral Coves ──
 ['Shark Waters',4,{},b=>{b.pit(690,1000,'water',120);b.enemy(5,840,0,{y:G+48,swim:{x0:730,x1:960,y:G+48,leap:150,period:4.2}});b.add(845,G+8,150,16,'wood',{density:.6});b.enemy(0,845,G);const t=b.frame(1100,G);b.enemy(1,1100,G);b.enemy(0,1100,t);b.crystalAt(1200)}],
 ['Frozen Crossing',4,{},b=>{const a=b.frame(820,G,100,92,'stone','stone');b.enemy(1,820,G);b.enemy(0,820,a);const c=b.frame(1020,G,100,92,'stone','stone');b.enemy(1,1020,G);b.crate(1020,c,52,'glass');b.crystalAt(1140)}],
 ['Tidal Chain Reaction',4,{},b=>{b.pit(660,1060,'water',130);b.add(740,G+8,120,16,'wood',{density:.6});b.enemy(0,740,G);b.add(990,G+8,120,16,'wood',{density:.6});b.enemy(2,990,G);b.enemy(5,865,0,{y:G+70,swim:{x0:848,x1:882,y:G+70,leap:150,period:4.6,offset:1.4}});let t=b.post(1120,G,160,'wood',20);b.post(1200,G,160,'wood',20);t=b.slab(1160,t,120,'wood');b.enemy(1,1160,t);b.crystalAt(1240)}],
 ['Pirate Arrival',4,{},b=>{b.crate(860,G,60);b.crate(920,G,60);b.crate(980,G,60);const d=b.slab(920,G-60,210,'wood',16);b.enemy(6,930,d);b.deco('mast',1010,d);b.enemy(0,860,d);b.crate(1120,G,56);b.enemy(2,1120,G-56);b.crystalAt(1210)}],
 ['The Hidden Route',4,{},b=>{b.stand(800,G,22,100,'stone');b.stand(940,G,22,100,'stone');b.slab(870,G-100,166,'stone',18);b.enemy(1,850,G);b.enemy(2,895,G);b.stand(1040,G,22,90,'stone');b.stand(1160,G,22,90,'stone');b.slab(1100,G-90,146,'glass',16);b.enemy(0,1100,G);b.crystalAt(1230)}],
 ['Pirate Fortress',5,{},b=>{b.pit(650,800,'water',110);b.enemy(5,725,0,{y:G+46,swim:{x0:680,x1:770,y:G+46,leap:130,period:3.8}});b.crate(900,G,60);b.crate(1080,G,60);let d=b.slab(990,G-60,240,'wood',16);b.enemy(2,930,d);b.enemy(2,1050,d);const t=b.frame(990,d,110,90,'wood','wood');b.enemy(6,990,t);b.deco('mast',1090,t);b.enemy(0,990,G);b.crystalAt(1200)}],
 // ── Island 4 · Stormcliff Heights ──
 ['Stone Guardian',4,{},b=>{b.stand(820,G,40,110,'stone');b.stand(1000,G,40,110,'stone');const t=b.slab(910,G-110,230,'stone',18);b.enemy(7,910,G);b.enemy(0,880,t);b.enemy(1,950,t);b.crystalAt(1110)}],
 ['The Shockwave',4,{},b=>{for(const [x,h] of[[760,150],[860,180],[960,150]]){b.post(x-24,G,h,'wood',16);b.post(x+24,G,h,'wood',16);const t=b.slab(x,G-h,70,'stone',16);b.enemy(x===860?7:0,x,t)}b.enemy(1,1080,G);b.crystalAt(1170)}],
 ['Storm Tower',4,{wind:65},b=>{b.mover(760,420,140,16,'stone',{rot:.32,period:3.4});b.rock(1000,G-40,240,80);let t=b.frame(960,G-80,90,86,'wood','stone');b.enemy(0,960,G-80);b.enemy(1,960,t);b.frame(1070,G-80,80,86,'glass');b.enemy(7,1070,G-80);b.deco('windsock',640,G);b.crystalAt(1180)}],
 ['Mechanical Defense',4,{},b=>{b.crate(820,G,56);b.crate(820,G-56,56);b.enemy(8,920,G);const t=b.frame(1060,G);b.enemy(0,1060,G);b.enemy(1,1060,t);b.crystalAt(1160)}],
 ['Water Against Steel',4,{},b=>{b.enemy(8,860,G);const t=b.frame(1000,G,110,90,'stone','wood');b.enemy(8,1000,G);b.enemy(1,1000,t);b.crystalAt(1120)}],
 ['Ironclaw Citadel',5,{},b=>{b.mover(720,470,22,110,'stone',{ay:80,period:2.8});let t=b.frame(860,G,110,96,'stone','stone');b.enemy(8,860,G);b.enemy(0,860,t);const c=b.frame(1050,G,110,96,'wood','stone');b.enemy(7,1050,G);b.enemy(8,1050,c);b.crystalAt(1180)}],
 // ── Island 5 · Emberfall Isle ──
 ['Into the Shadows',4,{},b=>{b.lantern(800,G);const t=b.frame(880,G,104,92,'stone','wood');b.enemy(9,880,G,{offset:0});b.lantern(880,t);b.enemy(1,1040,G);b.lantern(1000,G);b.crystalAt(1140)}],
 ['Light in Darkness',4,{},b=>{const t=b.frame(840,G,100,90,'stone','stone');b.enemy(9,840,G,{offset:0});b.enemy(2,840,t);const u=b.frame(1040,G,100,90,'wood','stone');b.enemy(9,1040,G,{offset:1.6});b.lantern(1040,u);b.crystalAt(1160)}],
 ['Lava Crossing',4,{},b=>{b.pit(680,980,'lava',120);b.post(700,G,14,'stone',30);b.post(960,G,14,'stone',30);const br=b.slab(830,G-14,300,'wood',16);b.enemy(1,770,br);b.enemy(0,830,br);b.enemy(4,895,br);const t=b.frame(1090,G,96,90,'stone','wood');b.enemy(9,1090,G);b.crystalAt(1200)}],
 ['The Two Pathways',4,{},b=>{b.rock(700,G-90,90,180);b.boulder(700,G-180,30);b.rock(800,G-60,170,16,.42);const t=b.frame(950,G,104,92,'wood','stone');b.enemy(7,950,G);b.enemy(9,950,t);b.enemy(8,1110,G);b.lantern(1050,G);b.crystalAt(1200)}],
 ['Dragon Gateway',5,{},b=>{b.stand(820,G,36,130,'obsidian');b.stand(1060,G,36,130,'obsidian');const t=b.slab(940,G-130,290,'stone',20);b.enemy(7,900,G);b.enemy(8,990,G);b.enemy(6,940,t);b.enemy(9,1150,G);b.lantern(1110,G);b.crystalAt(1230)}],
 ['Magma Lord',6,{},b=>{b.pylon(860,G,120);b.pylon(1270,G,120);const s=b.frame(1070,G-0,170,170,'stone','wood');b.pylon(1070,s,70);b.boulder(1010,s,28);b.enemy(10,1070,G,{pylons:3});b.crystalAt(1340)}]
];

// Ground pieces: the sling ledge, the plateau (split around pits) and pit floors.
function terrain(pits){
 const segs=[{x0:-800,x1:LEDGE_END}],ground=[];let x=PLATEAU;
 for(const p of[...pits].sort((a,b)=>a.x0-b.x0)){segs.push({x0:x,x1:p.x0});x=p.x1}
 segs.push({x0:x,x1:2400});
 for(const s of segs)ground.push(body({x:(s.x0+s.x1)/2,y:GROUND+150,w:s.x1-s.x0,h:300,kind:'ground',static:true,friction:.8}));
 for(const p of pits)ground.push(body({x:(p.x0+p.x1)/2,y:GROUND+p.depth+60,w:p.x1-p.x0+40,h:120,kind:'ground',static:true,friction:.8}));
 return{segs,ground};
}

export function buildLevel(level){
 const b=builder(),L=LAYOUTS[level.id];L[3](b);
 const blocks=b.blocks,{segs,ground}=terrain(b.pits);
 for(const x of[...blocks,...b.enemies])if(!x.static&&!x.fly)x.sleep=true; // forts start at rest
 const water=b.pits.filter(p=>p.fill==='water').map(p=>({x0:p.x0,x1:p.x1,y0:GROUND+14,y1:GROUND+p.depth}));
 const lava=b.pits.filter(p=>p.fill==='lava').map(p=>({x0:p.x0,x1:p.x1,y0:GROUND+22,y1:GROUND+p.depth}));
 return{bodies:[...ground,...blocks,...b.enemies],blocks,enemies:b.enemies,movers:b.movers,crystal:b.crystal??1180,
  terrain:{segs,pits:b.pits,sea:{x0:LEDGE_END,x1:PLATEAU}},water,lava,decor:b.decor,wind:L[2].wind||0};
}
