// Turn logic, damage, environment and the eleven hero skills. Pure simulation: no DOM, no randomness.
import{SPECIES}from'./data.js';
import{body,step,GROUND,wake,wakeNear}from'./physics.js';
import{buildLevel}from'./levels.js';
import{ENEMY,updateEnemy,filterDamage,skillOnEnemies}from'./enemies.js';

export const SLING={x:190,y:430};
export const POINTS={stone:150,obsidian:250,wood:100,bamboo:100,glass:100,lantern:200,boulder:0};
// The launch vector is a pull of up to 100 world units; speed scales to 700 u/s.
export function launchVelocity(dx,dy){const n=Math.hypot(dx,dy)||1,f=Math.min(1,100/n);return{vx:dx*f*7,vy:dy*f*7}}
// The monster leaves from where it was pulled back to (the pouch), not from the fork.
export function launchOrigin(dx,dy){const n=Math.hypot(dx,dy)||1,f=Math.min(1,100/n);return{x:SLING.x-dx*f,y:SLING.y-dy*f}}
const HEAVY=new Set([4,7,10]);

export class Battle{
 constructor(level,species=0){
  const L=buildLevel(level);Object.assign(this,{bodies:L.bodies,blocks:L.blocks,enemies:L.enemies,movers:L.movers,crystal:L.crystal,terrain:L.terrain,water:L.water,lava:L.lava,decor:L.decor,wind:L.wind});
  this.env={wind:this.wind,water:this.water};
  this.level=level;this.species=species;this.shots=level.shots;this.score=0;this.projectile=null;this.age=0;this.time=0;this.status='ready';
  this.effects=[];this.events=[];this.used=false;this.quiet=0;this.impacts=new Map();this.launches=0;this.initialCount=this.enemies.length;
  this.focus=null;this.shotKills=0;this.inks=[];this.shakeReq=0;
 }
 get remaining(){return this.enemies.filter(b=>!b.dead).length}
 shake(px){this.shakeReq=Math.max(this.shakeReq,px)}
 launch(dx,dy){
  if(this.status!=='ready'||Math.hypot(dx,dy)<8)return false;
  const d=SPECIES[this.species],v=launchVelocity(dx,dy),o=launchOrigin(dx,dy);
  this.projectile=body({x:o.x,y:o.y,r:25,kind:'monster',species:d.id,mass:d.mass,restitution:d.bounce,hp:10000,friction:d.id===3?1:.5,windy:true,...v});
  this.bodies.push(this.projectile);this.shots--;this.age=0;this.used=false;this.quiet=0;this.status='flight';this.launches++;this.shotKills=0;
  this.events.push({t:'launch',species:d.id});return true;
 }
 // ctx: {cause:'impact'|'crush'|'skill'|'fall'|'lava'|'light', src, cx, cy, species}
 damage(b,amount,ctx={}){
  if(typeof ctx==='string')ctx={cause:ctx};
  if(b.static||b.dead||b.kind==='monster'||b.kind==='seed'||!(amount>0))return;
  if(b.kind==='enemy'){const before=amount;amount=filterDamage(b,amount,ctx,this);if(!(amount>0)){if(before>20)this.events.push({t:'block',x:b.x,y:b.y,type:b.type});return}}
  b.hp-=amount;b.hitT=this.time;b.hitAmt=amount;wake(b);
  if(b.hp<=0){
   b.dead=true;wakeNear(this.bodies,b.x,b.y,(b.r||Math.hypot(b.w,b.h)/2)+12);
   const pts=b.kind==='enemy'?ENEMY[b.type].points:POINTS[b.kind]??100;this.score+=pts;
   if(b.kind==='enemy')this.shotKills++;
   if(b.kind==='lantern')this.light(b.x,b.y,240,70,false);
   this.events.push(b.kind==='enemy'?{t:'pop',x:b.x,y:b.y,boss:!!b.boss,type:b.type,points:pts,r:b.r||Math.max(b.w,b.h)/2}:{t:'break',kind:b.kind,x:b.x,y:b.y,w:b.w,h:b.h,a:b.a,vx:b.vx,vy:b.vy,points:pts,cause:ctx.cause});
   if(b.boss){this.shake(14)}
  }else if(amount>4)this.events.push({t:'hurt',kind:b.kind,x:b.x,y:b.y,amount,boss:!!b.boss,id:b.id,type:b.type});
 }
 // Spikes: a light hero bounces off a Prickfin.
 prick(src,e){if(src.kind!=='monster')return;src.vx=-Math.abs(src.vx)*.35-60;src.vy=Math.min(src.vy,0)-160;this.events.push({t:'prick',x:(src.x+e.x)/2,y:(src.y+e.y)/2})}
 addInk(x,y,r,life,dense){this.inks.push({x,y,r,life,max:life,dense,grow:0})}
 clearInk(x,y,r){const before=this.inks.length;this.inks=this.inks.filter(k=>Math.hypot(k.x-x,k.y-y)>r+k.r*.5);if(this.inks.length<before)this.events.push({t:'inkClear',x,y})}
 light(x,y,r,dmg,fromSkill){this.events.push({t:'light',x,y,r});for(const e of this.enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.y-y);if(e.type===9&&d<r){e.revealed=6;e.ghost=false;e.phase=0;this.damage(e,dmg*(1-d/(r*1.4)),{cause:'light',species:fromSkill?9:-1})}}}
 blast(x,y,r,force,damage,species=this.species,pull=false){
  this.effects.push({x,y,r,color:SPECIES[species].color,life:.65});this.focus={x,y,time:this.time};
  for(const b of this.bodies){if(b.static||b.dead||b===this.projectile)continue;const dx=b.x-x,dy=b.y-y,d=Math.max(10,Math.hypot(dx,dy));if(d>r)continue;wake(b);const f=1-d/r,dir=pull?-1:1;
   if(b.fly&&b.kind==='enemy'){b.bumped=true}
   b.vx+=dir*dx/d*force*f/Math.sqrt(b.mass);b.vy+=(dir*dy/d*force-70)*f/Math.sqrt(b.mass);b.omega+=(dx>0?1:-1)*f*2*dir;this.damage(b,damage*f,{cause:'skill',species,cx:x,cy:y})}
 }
 skill(){
  const p=this.projectile;if(this.status!=='flight'||this.used||!p||p.dead)return false;this.used=true;
  this.events.push({t:'skill',species:p.species,x:p.x,y:p.y,vx:p.vx,vy:p.vy});
  switch(p.species){
   case 0:p.vx+=310;p.vy-=90;p.restitution=.92;this.blast(p.x,p.y,80,80,35);break;                 // jelly dash
   case 1:this.blast(p.x,p.y,190,500,110);this.clearInk(p.x,p.y,160);break;                             // water burst
   case 2:p.r=42;p.mass=2.2;p.inv=1/2.2;p.puff=1.3;this.blast(p.x,p.y,240,560,60);this.clearInk(p.x,p.y,320);break; // puff up
   case 3:this.blast(p.x,p.y,250,420,30,3,true);p.restitution=0;p.friction=1;break;                     // vine pull
   case 4:p.vy=850;p.mass=5;p.inv=.2;this.blast(p.x,p.y+65,155,280,90);break;                          // boulder smash
   case 5:for(const b of this.blocks)if(!b.dead&&!b.static&&Math.hypot(b.x-p.x,b.y-p.y)<240){b.frozen=true;b.hp*=.25;wake(b)}this.blast(p.x,p.y,200,160,35);break;
   case 6:p.phase=.8;p.vx=Math.max(480,p.vx);this.effects.push({x:p.x,y:p.y,r:100,life:.8,color:'#b979f4'});break;
   case 7:{const gy=GROUND-25;this.blast(p.x,gy,260,400,110);break}                                   // root quake
   case 8:this.blast(p.x+60,p.y,270,660,110);this.clearInk(p.x+60,p.y,260);break;                      // tidal wave
   case 9:this.blast(p.x,p.y,260,260,60);this.light(p.x,p.y,300,110,true);this.clearInk(p.x,p.y,260);break; // light burst
   case 10:this.blast(p.x,p.y,300,720,230);break;                                                       // volcano blast
  }
  skillOnEnemies(this,p.species,p.x,p.y);
  return true;
 }
 next(){
  if(this.status!=='flight'||this.age<1)return false;
  if(this.projectile)this.projectile.dead=true;this.projectile=null;for(const b of this.bodies)if(b.kind==='seed')b.dead=true;
  this.status=this.shots>0?'ready':'settling';this.age=0;this.events.push({t:'shotEnd'});return true;
 }
 tick(dt){
  if(this.status==='won'||this.status==='lost')return;dt=Math.min(dt,1/30);this.time+=dt;this.age+=dt;
  for(const b of this.bodies)if(b.phase&&b.kind!=='enemy')b.phase=Math.max(0,b.phase-dt);
  // moving obstacles follow their sine paths
  for(const m of this.movers){const P=m.path,w=Math.PI*2/P.period,t1=this.time;m.vx=P.ax?Math.cos(w*t1)*w*P.ax:0;m.vy=P.ay?Math.cos(w*t1)*w*P.ay:0;m.omega=P.rot?Math.cos(w*t1)*w*P.rot:0}
  for(const e of this.enemies)if(!e.dead)updateEnemy(e,this,dt);
  const p=this.projectile;
  if(p&&p.puff>0){p.puff-=dt;if(p.puff<=0){p.r=25;p.mass=SPECIES[2].mass;p.inv=1/p.mass}}
  // dense pirate ink slows anything flying through it (Shadebub slips through)
  if(p&&!p.dead&&!(p.phase>0))for(const k of this.inks)if(k.dense&&Math.hypot(p.x-k.x,p.y-k.y)<k.r){const d=Math.exp(-5*dt);p.vx*=d;p.vy=p.vy*d+0}
  for(const k of this.inks){k.life-=dt;k.grow=Math.min(1,k.grow+dt*3)}this.inks=this.inks.filter(k=>k.life>0);
  step(this.bodies,dt,(a,b,speed,j,cx,cy)=>{
   if(this.launches===0)return;
   const key=Math.min(a.id,b.id)+':'+Math.max(a.id,b.id),last=this.impacts.get(key)||-99;if(this.time-last<.16)return;this.impacts.set(key,this.time);
   const projectile=[a,b].find(x=>x.kind==='monster'||x.kind==='seed'),energy=Math.max(0,(speed-55)*.6);
   for(const [q,o] of[[a,b],[b,a]]){
    if(q.kind==='enemy'&&o.kind!=='ground')q.bumped=true;
    let amt=energy*(projectile?1.65:1);
    if(projectile&&projectile.kind==='monster'&&HEAVY.has(projectile.species)&&(q.kind==='stone'||q.kind==='obsidian'))amt*=2.2;
    if(o.kind==='boulder'&&q.kind==='enemy'&&q.type===10&&speed>140&&q.stage===3){q.stun=5;q.mode='stunned';q.modeT=0;this.events.push({t:'steam',x:q.x,y:q.y})}
    this.damage(q,amt,{cause:projectile?'impact':'crush',src:o,cx,cy,species:projectile?.species})}
   if(projectile){if(speed>130)this.effects.push({x:projectile.x,y:projectile.y,r:28,life:.3,color:'#fff4aa'});this.focus={x:cx,y:cy,time:this.time};if(projectile.kind==='monster')this.events.push({t:'thud',speed,x:cx,y:cy})}
   if(speed>80){const solid=[a,b].find(x=>x.kind!=='ground'&&x.kind!=='monster'&&x.kind!=='seed')||a;this.events.push({t:'impact',kind:solid.kind==='ground'?(a.kind==='ground'?b.kind:a.kind):solid.kind,x:cx,y:cy,speed,ground:a.kind==='ground'||b.kind==='ground'})}
  },this.env);
  // environment: sea strip, water splashes, lava and the arena edges
  const sea=this.terrain.sea;
  for(const b of this.bodies){if(b.static||b.dead)continue;
   for(const z of this.water)if(b.x>z.x0&&b.x<z.x1&&b.y>z.y0&&!b.wet){b.wet=true;this.events.push({t:'splash',x:b.x,y:z.y0,big:b.kind==='monster'||b.mass>2})}
   for(const z of this.lava)if(b.x>z.x0&&b.x<z.x1&&b.y>z.y0){if(b.kind==='enemy'&&!(b.type===10))this.damage(b,9999,{cause:'lava'});else if(b.kind!=='enemy'){b.dead=true;this.events.push({t:'burn',x:b.x,y:z.y0,kind:b.kind})}}
   if(b.x>sea.x0&&b.x<sea.x1&&b.y>GROUND+40){if(b.kind==='enemy')this.damage(b,9999,{cause:'fall'});else b.dead=true;this.events.push({t:'splash',x:b.x,y:GROUND+40,big:true,sea:true})}
   if(b.y>GROUND+400||b.x>1650||b.x<-300){if(b.kind==='enemy')this.damage(b,9999,{cause:'fall'});else b.dead=true}}
  // Magma Lord eruptions incinerate a monster flying through the vent column
  for(const e of this.enemies)if(e.type===10&&!e.dead&&e.erupt==='live'&&p&&!p.dead){const vx=e.home.x-170;if(Math.abs(p.x-vx)<45&&p.y>GROUND-300){p.dead=true;this.events.push({t:'burn',x:p.x,y:p.y,kind:'monster'})}}
  for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);this.bodies=this.bodies.filter(b=>!b.dead);if(this.impacts.size>400)this.impacts.clear();
  if(!this.remaining){this.status='won';this.score+=this.shots*350;this.events.push({t:'win'});return}
  if(this.status==='flight'){const q=this.projectile;if(this.age>8||q?.dead||this.age>2&&Math.hypot(q?.vx||0,q?.vy||0)<22)this.next()}
  if(this.status==='settling'){this.quiet=this.busy()?0:this.quiet+dt;if(this.quiet>1.2||this.age>10){this.status='lost';this.events.push({t:'lose'})}}
 }
 // Is anything still visibly moving? Patrolling enemies and moving obstacles do not count.
 busy(threshold=25){return this.bodies.some(b=>!b.static&&!b.dead&&!b.fly&&b.kind!=='monster'&&b.kind!=='seed'&&Math.hypot(b.vx,b.vy)>threshold)}
}
