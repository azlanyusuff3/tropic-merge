// Level QA: every fort must stand on its own, and every level must be clearable with the
// heroes a player has when the level unlocks. `node tests/sling-levels.mjs solve` searches for
// winning shot sequences and writes tests/sling-solutions.json; without arguments the stored
// solutions are replayed exactly as a player would fire them.
import fs from'node:fs';
import{LEVELS,SPECIES,HERO_UNLOCK_LEVELS}from'../sling/data.js';
import{Battle,SLING}from'../sling/battle.js';
import{GROUND}from'../sling/physics.js';

// Heroes a new player has on reaching level id+1 (Sling progress only, no legacy or Merge grants).
export const heroesFor=id=>SPECIES.filter(d=>HERO_UNLOCK_LEVELS[d.id]<=id+1).map(d=>d.id);

export function stability(){
 const report=[];
 for(const level of LEVELS){
  const w=new Battle(level),fixed=w.blocks.filter(b=>!b.static&&!(b.density<1)),start=fixed.map(b=>({x:b.x,y:b.y,a:b.a}));
  for(let i=0;i<240;i++)w.tick(1/60);
  let moved=0,turned=0;fixed.forEach((b,i)=>{moved=Math.max(moved,Math.hypot(b.x-start[i].x,b.y-start[i].y));turned=Math.max(turned,Math.abs(b.a-start[i].a))});
  const ok=w.remaining===w.initialCount&&moved<6&&turned<.08&&w.bodies.every(b=>[b.x,b.y,b.a,b.vx,b.vy].every(Number.isFinite))&&Math.max(...fixed.map(b=>b.y))<GROUND+5;
  report.push({level:level.number,ok,moved:+moved.toFixed(2),turned:+turned.toFixed(3),enemies:w.initialCount,blocks:w.blocks.length});
 }
 return report;
}

// Fire one shot: angle in degrees above horizontal, power 0..1, optional skill when the monster passes x=skillAt.
export function fire(w,shot){
 const [species,angle,power,skillAt,delay=0]=shot;w.species=species;for(let i=0;i<delay;i++)w.tick(1/60);
 const a=angle*Math.PI/180,n=100*power;w.launch(Math.cos(a)*n,-Math.sin(a)*n);
 let skill=skillAt==null;
 for(let i=0;i<1400&&w.status==='flight';i++){if(!skill&&w.projectile&&w.projectile.x>=skillAt){w.skill();skill=true}w.tick(1/60)}
 for(let i=0;i<600&&w.status==='settling';i++)w.tick(1/60);
 // Let the fort finish falling before the next shot, as a player would wait.
 for(let i=0;i<240&&w.status==='ready'&&w.busy();i++)w.tick(1/60);
}
export function play(level,shots){const w=new Battle(level,shots[0]?.[0]??0);for(let i=0;i<90;i++)w.tick(1/60);for(const s of shots){if(w.status!=='ready')break;fire(w,s)}for(let i=0;i<600&&!['won','lost'].includes(w.status);i++)w.tick(1/60);return w}

function search(level){
 const heroes=heroesFor(level.id),candidates=[];
 const prefer=[...heroes].sort((a,b)=>b-a).slice(0,4);
 const targets=new Battle(level).enemies.map(e=>e.x);
 for(const sp of prefer)for(let angle=8;angle<=62;angle+=3)for(const power of[.82,.92,1])for(const skillAt of[null,...new Set(targets.map(x=>Math.round(x-130)))])candidates.push([sp,angle,power,skillAt]);
 let shots=[];
 for(let k=0;k<level.shots;k++){
  let best=null;
  for(const c of candidates){const w=play(level,[...shots,c]);const value=(w.status==='won'?1e6+w.shots*1e4:0)+(w.initialCount-w.remaining)*1000+w.score/100;if(!best||value>best.value)best={value,c,w}}
  shots.push(best.c);if(best.w.status==='won')return{shots,stars:best.w.shots>=2?3:best.w.shots>=1?2:1};
 }
 return{shots,stars:0};
}

import{pathToFileURL}from'node:url';
if(import.meta.url===pathToFileURL(process.argv[1]).href){
const mode=process.argv[2];
const stab=stability();const bad=stab.filter(r=>!r.ok);
console.log(bad.length?'UNSTABLE '+JSON.stringify(bad):'PASS All 30 forts stand on their own (no drift, no free kills)');
if(mode==='stability'){process.exit(bad.length?1:0)}
if(mode==='solve'){
 const only=process.argv[3]?process.argv[3].split(',').map(Number):null;
 const file=new URL('./sling-solutions.json',import.meta.url);const out=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};
 for(const level of LEVELS){if(only&&!only.includes(level.number))continue;const t=Date.now();const r=search(level);out[level.number]=r;console.log(level.number,level.title,r.stars?`${r.stars}★`:'UNSOLVED',JSON.stringify(r.shots),((Date.now()-t)/1000).toFixed(1)+'s');fs.writeFileSync(file,JSON.stringify(out,null,1))}
}else{
 const sol=JSON.parse(fs.readFileSync(new URL('./sling-solutions.json',import.meta.url)));let fail=[];
 for(const level of LEVELS){const s=sol[level.number];const w=s?play(level,s.shots):null;const legal=s&&s.shots.every(x=>heroesFor(level.id).includes(x[0]));if(!w||w.status!=='won'||!legal)fail.push(level.number)}
 console.log(fail.length?'FAIL unsolved levels '+fail:'PASS All 30 levels cleared by recorded shots using only heroes available at unlock');
 if(fail.length||bad.length)process.exit(1);
}
}
