// Offline level solver (not part of npm test; slow). Finds a winning shot list for each level using
// only the heroes available when that level unlocks, then stores it for tests/sling-levels.mjs.
// Usage: node tests/sling-solver.mjs [levelNumbers]
import fs from'node:fs';
import{LEVELS}from'../sling/data.js';
import{Battle}from'../sling/battle.js';
import{heroesFor,fire}from'./sling-levels.mjs';

function clone(w){
 const c=Object.create(Battle.prototype);Object.assign(c,w);
 const map=new Map();c.bodies=w.bodies.map(b=>{const n={...b};map.set(b,n);return n});
 for(const n of c.bodies)if(n.seeking)n.seeking=map.get(n.seeking)||null;
 c.blocks=w.blocks.map(b=>map.get(b)||{...b,dead:true});c.enemies=w.enemies.map(b=>map.get(b)||{...b,dead:true});c.movers=w.movers.map(b=>map.get(b)||b);c.inks=w.inks.map(k=>({...k}));
 c.projectile=w.projectile?map.get(w.projectile):null;c.impacts=new Map(w.impacts);c.effects=[];c.events=[];c.focus=w.focus&&{...w.focus};return c;
}
const value=w=>(w.status==='won'?1e6+w.shots*1e4:0)+(w.initialCount-w.remaining)*1000+w.score/50;
function trial(base,shot){const w=clone(base);fire(w,shot);for(let i=0;i<600&&!['won','lost','ready'].includes(w.status);i++)w.tick(1/60);return w}
function solve(level){
 let w=new Battle(level);for(let i=0;i<90;i++)w.tick(1/60);
 const heroes=heroesFor(level.id),strong=[...heroes].sort((a,b)=>b-a);const shots=[];
 for(let k=0;k<level.shots&&w.status==='ready';k++){
  const alive=w.enemies.filter(e=>!e.dead).map(e=>e.x).sort((a,b)=>a-b);
  // Coarse sweep with two contrasting heroes, no skill.
  const moving=w.enemies.some(e=>!e.dead&&(e.fly||e.type===9||e.type===10)),delays=moving?[0,30,60,95,130]:[0];
  const sweep=[];for(const sp of[strong[0],0,4].filter((v,i,a)=>heroes.includes(v)&&a.indexOf(v)===i))for(let ang=6;ang<=66;ang+=4)for(const pw of[.86,1])for(const dl of delays)sweep.push([sp,ang,pw,null,dl]);
  let scored=sweep.map(c=>({c,w:trial(w,c)})).sort((a,b)=>value(b.w)-value(a.w));
  // Refine the best few: every hero, nearby angles, skill timings ahead of each live bandit.
  const top=scored.slice(0,5),fine=[];
  for(const t of top)for(const sp of heroes)for(const da of[-2,0,2])for(const skillAt of[null,...alive.slice(0,3).map(x=>Math.round(x-150)),...alive.slice(0,2).map(x=>Math.round(x-60))])fine.push([sp,t.c[1]+da,t.c[2],skillAt,t.c[4]||0]);
  scored=[...scored.slice(0,5),...fine.map(c=>({c,w:trial(w,c)}))].sort((a,b)=>value(b.w)-value(a.w));
  const best=scored[0];shots.push(best.c);w=best.w;
  if(w.status==='won')break;
 }
 for(let i=0;i<600&&!['won','lost'].includes(w.status);i++)w.tick(1/60);
 return{shots,won:w.status==='won',spare:w.shots,stars:w.status==='won'?(w.shots>=2?3:w.shots>=1?2:1):0};
}
const only=process.argv[2]?process.argv[2].split(',').map(Number):null;
const file=new URL('./sling-solutions.json',import.meta.url);const out=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};
for(const level of LEVELS){if(only&&!only.includes(level.number))continue;const t=Date.now();const r=solve(level);out[level.number]=r;fs.writeFileSync(file,JSON.stringify(out,null,1));console.log(level.number,level.title,r.won?r.stars+'★':'UNSOLVED',JSON.stringify(r.shots),((Date.now()-t)/1000).toFixed(0)+'s')}
