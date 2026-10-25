import{SPECIES}from'./data.js';
import{body,buildLevel,step,GROUND}from'./physics.js';
export class Battle{
 constructor(level,species=0){Object.assign(this,buildLevel(level));this.level=level;this.species=species;this.shots=level.shots;this.score=0;this.projectile=null;this.age=0;this.time=0;this.status='ready';this.effects=[];this.events=[];this.used=false;this.quiet=0;this.impacts=new Map();this.launches=0;this.initialCount=this.enemies.length;}
 get remaining(){return this.enemies.filter(b=>!b.dead).length}
 launch(dx,dy){if(this.status!=='ready'||Math.hypot(dx,dy)<8)return false;const n=Math.hypot(dx,dy),f=Math.min(1,100/n),d=SPECIES[this.species];this.projectile=body({x:190,y:430,r:25,kind:'monster',species:d.id,mass:d.mass,restitution:d.bounce,hp:10000,vx:dx*f*7,vy:dy*f*7});this.bodies.push(this.projectile);this.shots--;this.age=0;this.used=false;this.quiet=0;this.status='flight';this.launches++;this.events.push('launch');return true;}
 damage(b,amount){if(b.static||b.dead||b.kind==='monster'||b.kind==='seed')return;b.hp-=amount;if(b.hp<=0){b.dead=true;this.score+=b.kind==='enemy'?(b.boss?1500:500):b.kind==='stone'?150:100;this.effects.push({x:b.x,y:b.y,color:b.kind==='enemy'?'#b3d47c':'#e9c183',r:30,life:.6});this.events.push(b.kind==='enemy'?'pop':'break')}}
 blast(x,y,r,force,damage){this.effects.push({x,y,r,color:SPECIES[this.species].color,life:.65});for(const b of this.bodies){if(b.static||b.dead)continue;const dx=b.x-x,dy=b.y-y,d=Math.max(10,Math.hypot(dx,dy));if(d>r)continue;const factor=1-d/r;b.vx+=dx/d*force*factor/Math.sqrt(b.mass);b.vy+=(dy/d*force-70)*factor/Math.sqrt(b.mass);b.omega+=(dx>0?1:-1)*factor*2;this.damage(b,damage*factor)}}
 skill(){const p=this.projectile;if(this.status!=='flight'||this.used||!p||p.dead)return false;this.used=true;this.events.push('skill');
 switch(p.species){
 case 0:p.vx+=310;p.vy-=90;p.restitution=.92;this.blast(p.x,p.y,80,80,35);break;
 case 1:this.blast(p.x,p.y,190,500,110);break;
 case 2:this.blast(p.x,p.y,250,580,65);p.vy-=100;break;
 case 3:for(let i=-1;i<=1;i++)this.bodies.push(body({x:p.x+28,y:p.y,r:11,kind:'seed',mass:.8,vx:470,vy:i*170-40,hp:10000}));this.blast(p.x,p.y,80,150,40);break;
 case 4:p.vy=850;p.mass=5;p.inv=.2;this.blast(p.x,p.y+65,155,280,90);break;
 case 5:for(const b of this.blocks)if(!b.dead&&Math.hypot(b.x-p.x,b.y-p.y)<240){b.frozen=true;b.hp*=.25}this.blast(p.x,p.y,200,160,35);break;
 case 6:p.phase=.8;p.vx=Math.max(480,p.vx);this.effects.push({x:p.x,y:p.y,r:100,life:.8,color:'#b979f4'});break;
 case 7:this.blast(p.x,GROUND-25,260,400,110);break;
 case 8:this.blast(p.x+60,p.y,270,660,110);break;
 case 9:{const target=this.enemies.filter(b=>!b.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(target){const dx=target.x-p.x,dy=target.y-p.y,n=Math.hypot(dx,dy)||1;p.vx=dx/n*700;p.vy=dy/n*700;p.seeking=target}break}
 case 10:this.blast(p.x,p.y,300,720,230);break;
 }return true;}
 next(){if(this.status!=='flight'||this.age<1)return false;if(this.projectile)this.projectile.dead=true;this.projectile=null;if(this.shots>0)this.status='ready';else this.status='settling';this.age=0;return true;}
 tick(dt){if(this.status==='won'||this.status==='lost')return;dt=Math.min(dt,1/30);this.time+=dt;this.age+=dt;for(const b of this.bodies)if(b.phase)b.phase=Math.max(0,b.phase-dt);
 step(this.bodies,dt,(a,b,speed,j)=>{if(this.launches===0)return;const key=Math.min(a.id,b.id)+':'+Math.max(a.id,b.id),last=this.impacts.get(key)||-99;if(this.time-last<.16)return;this.impacts.set(key,this.time);const projectile=[a,b].find(x=>x.kind==='monster'||x.kind==='seed'),energy=(speed-55)*.6;for(const q of[a,b])this.damage(q,Math.max(0,energy)*(projectile?1.65:1));if(projectile&&speed>130)this.effects.push({x:projectile.x,y:projectile.y,r:28,life:.3,color:'#fff4aa'});});
 for(const b of this.bodies){if(!b.static&&!b.dead&&(b.y>850||b.x>1450||b.x<-250)){if(b.kind==='enemy')this.damage(b,9999);else b.dead=true}}
 for(const e of this.effects)e.life-=dt;this.effects=this.effects.filter(e=>e.life>0);this.bodies=this.bodies.filter(b=>!b.dead);if(this.impacts.size>400)this.impacts.clear();
 if(!this.remaining){this.status='won';this.score+=this.shots*350;this.events.push('win');return}
 if(this.status==='flight'){const p=this.projectile;if(this.age>8||p?.dead||this.age>2&&Math.hypot(p?.vx||0,p?.vy||0)<22){this.next()}}
 if(this.status==='settling'){const busy=this.bodies.some(b=>!b.static&&!b.dead&&Math.hypot(b.vx,b.vy)>25);this.quiet=busy?0:this.quiet+dt;if(this.quiet>1.2||this.age>10){this.status='lost';this.events.push('lose')}}
 }
}
