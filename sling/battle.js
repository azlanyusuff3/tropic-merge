// Turn logic, damage and the eleven hero skills. Purely simulation: no DOM, no randomness.
import{SPECIES}from'./data.js';
import{body,step,GROUND,wake,wakeNear}from'./physics.js';
import{buildLevel}from'./levels.js';

export const SLING={x:190,y:430};
export const POINTS={enemy:500,boss:1500,stone:150,wood:100,glass:100};
// The launch vector is a pull of up to 100 world units; speed scales to 700 u/s.
export function launchVelocity(dx,dy){const n=Math.hypot(dx,dy)||1,f=Math.min(1,100/n);return{vx:dx*f*7,vy:dy*f*7}}
// The monster leaves from where it was pulled back to (the pouch), not from the fork.
export function launchOrigin(dx,dy){const n=Math.hypot(dx,dy)||1,f=Math.min(1,100/n);return{x:SLING.x-dx*f,y:SLING.y-dy*f}}

export class Battle{
 constructor(level,species=0){
  const built=buildLevel(level);this.bodies=built.bodies;this.blocks=built.blocks;this.enemies=built.enemies;this.crystal=built.crystal;
  this.level=level;this.species=species;this.shots=level.shots;this.score=0;this.projectile=null;this.age=0;this.time=0;this.status='ready';
  this.effects=[];this.events=[];this.used=false;this.quiet=0;this.impacts=new Map();this.launches=0;this.initialCount=this.enemies.length;
  this.focus=null;this.shotKills=0;
 }
 get remaining(){return this.enemies.filter(b=>!b.dead).length}
 launch(dx,dy){
  if(this.status!=='ready'||Math.hypot(dx,dy)<8)return false;
  const d=SPECIES[this.species],v=launchVelocity(dx,dy);
  const o=launchOrigin(dx,dy);this.projectile=body({x:o.x,y:o.y,r:25,kind:'monster',species:d.id,mass:d.mass,restitution:d.bounce,hp:10000,friction:.5,...v});
  this.bodies.push(this.projectile);this.shots--;this.age=0;this.used=false;this.quiet=0;this.status='flight';this.launches++;this.shotKills=0;
  this.events.push({t:'launch',species:d.id});return true;
 }
 damage(b,amount,cause){
  if(b.static||b.dead||b.kind==='monster'||b.kind==='seed'||!(amount>0))return;
  b.hp-=amount;b.hitT=this.time;b.hitAmt=amount;
  if(b.hp<=0){
   b.dead=true;wakeNear(this.bodies,b.x,b.y,(b.r||Math.hypot(b.w,b.h)/2)+12);const pts=b.kind==='enemy'?(b.boss?POINTS.boss:POINTS.enemy):POINTS[b.kind]||100;this.score+=pts;
   if(b.kind==='enemy')this.shotKills++;
   this.effects.push({x:b.x,y:b.y,color:b.kind==='enemy'?'#b3d47c':'#e9c183',r:30,life:.6});
   this.events.push(b.kind==='enemy'?{t:'pop',x:b.x,y:b.y,boss:!!b.boss,points:pts,r:b.r}:{t:'break',kind:b.kind,x:b.x,y:b.y,w:b.w,h:b.h,a:b.a,vx:b.vx,vy:b.vy,points:pts,cause});
  }else if(amount>4)this.events.push({t:'hurt',kind:b.kind,x:b.x,y:b.y,amount,boss:!!b.boss,id:b.id});
 }
 blast(x,y,r,force,damage){
  this.effects.push({x,y,r,color:SPECIES[this.species].color,life:.65});this.focus={x,y,time:this.time};
  for(const b of this.bodies){if(b.static||b.dead)continue;const dx=b.x-x,dy=b.y-y,d=Math.max(10,Math.hypot(dx,dy));if(d>r)continue;wake(b);const factor=1-d/r;b.vx+=dx/d*force*factor/Math.sqrt(b.mass);b.vy+=(dy/d*force-70)*factor/Math.sqrt(b.mass);b.omega+=(dx>0?1:-1)*factor*2;this.damage(b,damage*factor,'skill')}
 }
 skill(){
  const p=this.projectile;if(this.status!=='flight'||this.used||!p||p.dead)return false;this.used=true;
  this.events.push({t:'skill',species:p.species,x:p.x,y:p.y,vx:p.vx,vy:p.vy});
  switch(p.species){
   case 0:p.vx+=310;p.vy-=90;p.restitution=.92;this.blast(p.x,p.y,80,80,35);break;
   case 1:this.blast(p.x,p.y,190,500,110);break;
   case 2:this.blast(p.x,p.y,250,580,65);p.vy-=100;break;
   case 3:for(let i=-1;i<=1;i++)this.bodies.push(body({x:p.x+28,y:p.y,r:11,kind:'seed',mass:.8,vx:470,vy:i*170-40,hp:10000}));this.blast(p.x,p.y,80,150,40);break;
   case 4:p.vy=850;p.mass=5;p.inv=.2;this.blast(p.x,p.y+65,155,280,90);break;
   case 5:for(const b of this.blocks)if(!b.dead&&Math.hypot(b.x-p.x,b.y-p.y)<240){b.frozen=true;b.hp*=.25;wake(b)}this.blast(p.x,p.y,200,160,35);break;
   case 6:p.phase=.8;p.vx=Math.max(480,p.vx);this.effects.push({x:p.x,y:p.y,r:100,life:.8,color:'#b979f4'});break;
   case 7:this.blast(p.x,GROUND-25,260,400,110);break;
   case 8:this.blast(p.x+60,p.y,270,660,110);break;
   case 9:{const target=this.enemies.filter(b=>!b.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(target){const dx=target.x-p.x,dy=target.y-p.y,n=Math.hypot(dx,dy)||1;p.vx=dx/n*700;p.vy=dy/n*700;p.seeking=target}break}
   case 10:this.blast(p.x,p.y,300,720,230);break;
  }
  return true;
 }
 next(){
  if(this.status!=='flight'||this.age<1)return false;
  if(this.projectile)this.projectile.dead=true;this.projectile=null;for(const b of this.bodies)if(b.kind==='seed')b.dead=true;
  this.status=this.shots>0?'ready':'settling';this.age=0;this.events.push({t:'shotEnd'});return true;
 }
 tick(dt){
  if(this.status==='won'||this.status==='lost')return;dt=Math.min(dt,1/30);this.time+=dt;this.age+=dt;
  for(const b of this.bodies)if(b.phase)b.phase=Math.max(0,b.phase-dt);
  step(this.bodies,dt,(a,b,speed,j,cx,cy)=>{
   if(this.launches===0)return;
   const key=Math.min(a.id,b.id)+':'+Math.max(a.id,b.id),last=this.impacts.get(key)||-99;if(this.time-last<.16)return;this.impacts.set(key,this.time);
   const projectile=[a,b].find(x=>x.kind==='monster'||x.kind==='seed'),energy=(speed-55)*.6;
   for(const q of[a,b])this.damage(q,Math.max(0,energy)*(projectile?1.65:1),'impact');
   if(projectile){if(speed>130)this.effects.push({x:projectile.x,y:projectile.y,r:28,life:.3,color:'#fff4aa'});this.focus={x:cx,y:cy,time:this.time};if(projectile.kind==='monster')this.events.push({t:'thud',speed,x:cx,y:cy})}
   if(speed>80){const solid=[a,b].find(x=>x.kind!=='ground'&&x.kind!=='monster'&&x.kind!=='seed')||a;this.events.push({t:'impact',kind:solid.kind==='ground'?(a.kind==='ground'?b.kind:a.kind):solid.kind,x:cx,y:cy,speed,ground:a.kind==='ground'||b.kind==='ground'})}
  });
  for(const b of this.bodies){if(!b.static&&!b.dead&&(b.y>850||b.x>1500||b.x<-250)){if(b.kind==='enemy')this.damage(b,9999,'fall');else b.dead=true}}
  for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);this.bodies=this.bodies.filter(b=>!b.dead);if(this.impacts.size>400)this.impacts.clear();
  if(!this.remaining){this.status='won';this.score+=this.shots*350;this.events.push({t:'win'});return}
  if(this.status==='flight'){const p=this.projectile;if(this.age>8||p?.dead||this.age>2&&Math.hypot(p?.vx||0,p?.vy||0)<22)this.next()}
  if(this.status==='settling'){this.quiet=this.busy()?0:this.quiet+dt;if(this.quiet>1.2||this.age>10){this.status='lost';this.events.push({t:'lose'})}}
 }
 // Is anything still visibly moving? Used for camera holds and the end of a level.
 busy(threshold=25){return this.bodies.some(b=>!b.static&&!b.dead&&b.kind!=='monster'&&b.kind!=='seed'&&Math.hypot(b.vx,b.vy)>threshold)}
}
