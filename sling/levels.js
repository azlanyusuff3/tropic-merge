// Monster Sling campaign layouts. Thirty hand-built forts, one function per level.
// World units: the ground surface is at y=590, the sling sits at x=190. Forts live between x≈650 and x≈1250.
import{body,GROUND}from'./physics.js';

export const MATERIAL={
 wood:{mass:1.1,hp:95,friction:.6},
 glass:{mass:.65,hp:55,friction:.35},
 stone:{mass:2.8,hp:180,friction:.75}
};

function builder(){
 const blocks=[],enemies=[];
 const api={
  blocks,enemies,
  // Generic block, centre coordinates.
  add(x,y,w,h,kind='wood'){const m=MATERIAL[kind];const b=body({x,y,w,h,kind,mass:m.mass*(w*h)/(18*86)*.62+m.mass*.38,hp:m.hp,friction:m.friction});b.maxHp=b.hp;blocks.push(b);return b},
  // A block standing on `base` (the y of the surface below it). Returns its top surface.
  stand(x,base,w,h,kind){api.add(x,base-h/2,w,h,kind);return base-h},
  post(x,base,h=86,kind='wood',w=18){return api.stand(x,base,w,h,kind)},
  slab(x,base,w,kind='wood',h=14){return api.stand(x,base,w,h,kind)},
  crate(x,base,s=56,kind='wood'){return api.stand(x,base,s,s,kind)},
  // Two posts and a roof. Returns the roof's top surface.
  frame(x,base,span=96,h=86,kind='wood',roof=kind){api.post(x-span/2,base,h,kind);api.post(x+span/2,base,h,kind);return api.slab(x,base-h,span+34,roof)},
  // Stacked frames with a bandit on every floor, like a classic tower.
  tower(x,tiers,kinds=['wood'],base=GROUND,roofs,guards=true){let y=base;for(let t=0;t<tiers;t++){const k=kinds[Math.min(t,kinds.length-1)],r=roofs?roofs[Math.min(t,roofs.length-1)]:k;const top=api.frame(x,y,96,86,k,r);if(guards)api.bandit(x,y);y=top}return y},
  bandit(x,base){const e=body({x,y:base-23,r:22,mass:1,hp:65,kind:'enemy',friction:.7});e.maxHp=e.hp;enemies.push(e);return e},
  boss(x,base){const e=body({x,y:base-33,r:32,mass:2.4,hp:240,kind:'enemy',boss:true,friction:.7});e.maxHp=e.hp;enemies.push(e);return e},
  pyramid(x,base,rows,s=50,kind='glass'){let y=base;for(let r=rows;r>0;r--){for(let i=0;i<r;i++)api.add(x+(i-(r-1)/2)*s,y-s/2,s-1,s-1,kind);y-=s}return y}
 };
 return api;
}

const G=GROUND;
// Each entry: [title, crystal x, build(b)]
export const LAYOUTS=[
 // ── Island 1 · Sunlit Shores: aim, hit, topple ──
 ['Beachside bandits',960,b=>{b.frame(860,G);b.bandit(860,G)}],
 ['Double trouble',940,b=>{b.frame(790,G);b.bandit(790,G);const t=b.crate(1030,G,60);b.bandit(1030,t)}],
 ['Sky bridge',910,b=>{const a=b.frame(780,G),c=b.frame(1040,G);b.bandit(780,G);b.bandit(1040,G);const top=b.slab(910,a,180,'wood',18);b.bandit(910,top)}],
 ['Crystal keep',1010,b=>{const t=b.tower(880,2,['wood']);b.crate(880,t,46,'glass');const w=b.post(1010,G,110,'wood',20);b.bandit(1080,G)}],
 ['The leaning fort',990,b=>{const t=b.frame(890,G,110,120,'wood');b.bandit(860,t);b.bandit(920,t);const c=b.crate(1090,G,58);b.bandit(1090,c)}],
 ['Guardian showdown',940,b=>{const t=b.frame(800,G);b.bandit(800,G);b.bandit(800,t);b.frame(1010,G,116,86,'wood');b.boss(1010,G);b.bandit(1150,G)}],
 // ── Island 2 · Bamboo Bluffs: tall towers and chain reactions ──
 ['Bamboo spire',1010,b=>{b.tower(900,3,['wood'])}],
 ['Twin spires',940,b=>{const a=b.tower(800,2,['wood'],G,null,false),c=b.tower(1080,2,['wood'],G,null,false);b.bandit(800,G);b.bandit(1080,G);const top=b.slab(940,a,250,'wood',18);b.bandit(940,top)}],
 ['Bluff stairs',1110,b=>{let s1=b.crate(820,G,60);b.bandit(820,s1);let s2=b.crate(900,G,60);s2=b.crate(900,s2,60);b.bandit(900,s2);let s3=b.crate(980,G,60);s3=b.crate(980,s3,60);s3=b.crate(980,s3,60);b.bandit(980,s3)}],
 ['High lookout',900,b=>{b.frame(800,G);b.bandit(800,G);const a=b.frame(1030,G,100,120,'wood');b.bandit(1030,G);const c=b.frame(1030,a,80,86,'wood');b.bandit(1030,a);b.bandit(1030,c)}],
 ['Domino grove',1170,b=>{for(const x of[720,770,820,870])b.post(x,G,124,'wood',16);b.frame(965,G);b.bandit(965,G);const c=b.crate(1100,G,50,'wood');b.bandit(1100,c)}],
 ['Bamboo warlord',1110,b=>{b.tower(790,2,['wood']);const a=b.frame(990,G,116,86,'wood');b.boss(990,G);const c=b.frame(990,a,96,86,'wood');b.bandit(990,a);b.bandit(1170,G)}],
 // ── Island 3 · Frost Lagoon: fragile glass and lobbed shots ──
 ['Glass huts',860,b=>{for(const x of[760,900,1040]){b.frame(x,G,80,80,'glass');b.bandit(x,G)}}],
 ['Ice bridge',920,b=>{const a=b.tower(780,1,['wood']),c=b.tower(1060,1,['wood']);const top=b.slab(920,a,180,'glass',18);b.bandit(920,top);b.bandit(920,G)}],
 ['Frozen pyramid',830,b=>{const t=b.pyramid(940,G,4,50,'glass');b.bandit(940,t);b.frame(1130,G,80,80,'glass');b.bandit(1130,G)}],
 ['Stone shield',1120,b=>{b.post(760,G,112,'stone',30);b.frame(870,G,90,86,'glass');b.bandit(870,G);const a=b.frame(1020,G,90,110,'wood','glass');b.bandit(1020,a);b.bandit(1020,G)}],
 ['Crystal shelves',1080,b=>{b.tower(910,3,['wood'],G,['glass','glass','wood']);const c=b.crate(1100,G,50,'glass');b.bandit(1100,c)}],
 ['Frost tyrant',940,b=>{b.tower(780,2,['glass']);const a=b.frame(960,G,116,86,'glass','stone');b.boss(960,G);b.crate(960,a,50,'glass');b.tower(1140,1,['glass']);}],
 // ── Island 4 · Twilight Grove: hidden and heavy supports ──
 ['Balancing act',1110,b=>{const t=b.crate(900,G,56,'stone');const top=b.slab(900,t,250,'wood',16);b.bandit(800,top);b.bandit(1000,top);b.frame(1100,G);b.bandit(1100,G)}],
 ['Heavy roof',960,b=>{const a=b.frame(860,G,96,86,'wood','stone');b.bandit(860,G);const c=b.frame(860,a,96,86,'wood','stone');b.bandit(860,a);b.frame(1070,G,96,86,'wood','stone');b.bandit(1070,G)}],
 ['Root bunker',1150,b=>{b.crate(860,G,56,'stone');b.crate(1000,G,56,'stone');const r=b.slab(930,G-56,200,'wood',16);b.bandit(930,G);b.bandit(930,r)}],
 ['Hidden pillar',840,b=>{const a=b.frame(950,G,96,86,'glass','wood');b.bandit(950,G);const c=b.frame(950,a,96,86,'wood');b.bandit(950,a);b.bandit(950,c);b.frame(1160,G,80,80,'wood');b.bandit(1160,G)}],
 ['Long shadow fort',1150,b=>{for(const x of[760,880,1000]){b.frame(x,G,86,86,'wood');b.bandit(x,G)}const r=b.slab(880,G-100,120,'wood',14);b.bandit(880,r)}],
 ['Grove guardian',930,b=>{b.tower(780,1,['wood']);const a=b.frame(960,G,118,90,'stone','stone');b.boss(960,G);b.bandit(960,a);b.tower(1150,2,['wood'])}],
 // ── Island 5 · Ember Summit: stone strongholds ──
 ['Basalt towers',940,b=>{b.tower(820,2,['stone'],G,['wood']);b.tower(1070,2,['stone'],G,['wood'])}],
 ['Summit keep',1120,b=>{b.tower(920,3,['stone','wood','glass']);const c=b.crate(1100,G,56,'stone');b.bandit(1100,c)}],
 ['Three peaks',860,b=>{b.tower(760,1,['glass']);b.tower(960,2,['wood']);b.tower(1170,1,['stone'],G,['wood'])}],
 ['Lava walls',1160,b=>{const s=b.crate(790,G,56,'stone');b.crate(790,s,56,'stone');const a=b.frame(940,G,96,86,'glass','stone');b.bandit(940,G);b.bandit(940,a);b.frame(1080,G,80,80,'glass');b.bandit(1080,G)}],
 ['Ember castle',940,b=>{const a=b.tower(800,2,['stone','wood']),c=b.tower(1080,2,['stone','wood']);const top=b.slab(940,a,250,'wood',18);b.bandit(940,top)}],
 ['Ember overlord',1170,b=>{b.tower(780,2,['glass']);const a=b.frame(990,G,118,90,'stone','stone');b.boss(990,G);const c=b.frame(990,a,96,86,'wood','stone');b.bandit(990,a);b.bandit(990,c);b.crate(1150,G,50,'glass')}]
];

export function buildLevel(level){
 const b=builder();LAYOUTS[level.id][2](b);
 const ground=body({x:600,y:GROUND+60,w:3400,h:120,kind:'ground',static:true,friction:.8});
 for(const x of[...b.blocks,...b.enemies])x.sleep=true;// forts start at rest
 return {bodies:[ground,...b.blocks,...b.enemies],blocks:b.blocks,enemies:b.enemies,crystal:LAYOUTS[level.id][1]};
}
