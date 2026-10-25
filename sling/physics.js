// Small independent rigid-body solver: oriented boxes, circles, angular impulses and friction.
export const GROUND=590,GRAVITY=540;
let sequence=0;
export function body(opts){const b={id:sequence++,x:0,y:0,vx:0,vy:0,a:0,w:40,h:40,r:0,omega:0,mass:1,restitution:.13,friction:.55,static:false,hp:100,kind:'wood',...opts};b.inv=b.static?0:1/b.mass;const inertia=b.r?b.mass*b.r*b.r/2:b.mass*(b.w*b.w+b.h*b.h)/12;b.invI=b.static?0:1/inertia;return b}
const dot=(a,b)=>a.x*b.x+a.y*b.y;
function axes(b){return [{x:Math.cos(b.a),y:Math.sin(b.a)},{x:-Math.sin(b.a),y:Math.cos(b.a)}]}
function radius(b,n){if(b.r)return b.r;const [u,v]=axes(b);return Math.abs(dot(u,n))*b.w/2+Math.abs(dot(v,n))*b.h/2}
function vertices(b){const [u,v]=axes(b);return[-1,1].flatMap(x=>[-1,1].map(y=>({x:b.x+u.x*x*b.w/2+v.x*y*b.h/2,y:b.y+u.y*x*b.w/2+v.y*y*b.h/2})))}
function inside(box,p,eps){const [u,v]=axes(box),dx=p.x-box.x,dy=p.y-box.y;return Math.abs(dx*u.x+dy*u.y)<=box.w/2+eps&&Math.abs(dx*v.x+dy*v.y)<=box.h/2+eps}
export function contact(a,b){
 let ns;if(a.r&&b.r){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=a.r+b.r)return null;ns=[{x:d?dx/d:1,y:d?dy/d:0}]}
 else{ns=[...(!a.r?axes(a):[]),...(!b.r?axes(b):[])];if(a.r||b.r){const c=a.r?a:b,box=a.r?b:a;const vs=vertices(box).sort((p,q)=>(p.x-c.x)**2+(p.y-c.y)**2-((q.x-c.x)**2+(q.y-c.y)**2));const dx=vs[0].x-c.x,dy=vs[0].y-c.y,d=Math.hypot(dx,dy);if(d>0.001)ns.push({x:dx/d,y:dy/d})}}
 let depth=Infinity,normal;const delta={x:b.x-a.x,y:b.y-a.y};for(const axis of ns){const overlap=radius(a,axis)+radius(b,axis)-Math.abs(dot(delta,axis));if(overlap<=0)return null;if(overlap<depth){depth=overlap;const sign=dot(delta,axis)>=0?1:-1;normal={x:axis.x*sign,y:axis.y*sign}}}
 const n=normal,t={x:-n.y,y:n.x};
 // Box on box: use every corner that sits inside the other box, so a resting block gets a two-point
 // footing and resists tipping. Circles and edge crossings fall back to the single mid-point.
 if(!a.r&&!b.r){const eps=.5+depth;const pts=[...vertices(a).filter(p=>inside(b,p,eps)),...vertices(b).filter(p=>inside(a,p,eps))];if(pts.length>=2){
  // Keep the two points furthest apart along the contact face.
  pts.sort((p,q)=>dot(p,t)-dot(q,t));const plane=(dot(a,n)+radius(a,n)+dot(b,n)-radius(b,n))/2;const ends=[pts[0],pts[pts.length-1]].map(p=>({x:p.x+n.x*(plane-dot(p,n)),y:p.y+n.y*(plane-dot(p,n))}));
  if(Math.abs(dot(ends[0],t)-dot(ends[1],t))>1)return{n,depth,points:ends,x:(ends[0].x+ends[1].x)/2,y:(ends[0].y+ends[1].y)/2}}}
 const range=o=>{const center=dot(o,t),r=radius(o,t);return[center-r,center+r]};const ra=range(a),rb=range(b),tangent=(Math.max(ra[0],rb[0])+Math.min(ra[1],rb[1]))/2;
 const plane=(dot(a,n)+radius(a,n)+dot(b,n)-radius(b,n))/2;
 const x=n.x*plane+t.x*tangent,y=n.y*plane+t.y*tangent;return {n,depth,points:[{x,y}],x,y};
}
function impulse(a,b,m,onHit){const {n,depth}=m,sum=a.inv+b.inv;if(!sum)return;
 const correction=Math.max(0,depth-.12)*.55/sum;a.x-=n.x*correction*a.inv;a.y-=n.y*correction*a.inv;b.x+=n.x*correction*b.inv;b.y+=n.y*correction*b.inv;
 const mu=Math.sqrt((a.friction??.55)*(b.friction??.55)),share=1/m.points.length;let hit=0,hj=0;
 // Jacobi pass: every footing point is solved from the same velocity snapshot and shares the
 // impulse, so a block resting on two corners receives a symmetric push and does not creep.
 const pending=[];
 for(const p of m.points){
  const ar={x:p.x-a.x,y:p.y-a.y},br={x:p.x-b.x,y:p.y-b.y};const rv={x:b.vx-b.omega*br.y-a.vx+a.omega*ar.y,y:b.vy+b.omega*br.x-a.vy-a.omega*ar.x},vn=dot(rv,n);if(vn>=0)continue;
  const ac=ar.x*n.y-ar.y*n.x,bc=br.x*n.y-br.y*n.x,den=sum+ac*ac*a.invI+bc*bc*b.invI;
  const restitution=Math.abs(vn)>35?Math.max(a.restitution,b.restitution):0;const j=-(1+restitution)*vn/den*share;
  const t={x:-n.y,y:n.x},at=ar.x*t.y-ar.y*t.x,bt=br.x*t.y-br.y*t.x;const jt=Math.max(-j*mu,Math.min(j*mu,-dot(rv,t)/(sum+at*at*a.invI+bt*bt*b.invI)*share));
  pending.push({ar,br,px:n.x*j+t.x*jt,py:n.y*j+t.y*jt});if(-vn>hit){hit=-vn;hj=j/share}
 }
 for(const {ar,br,px,py} of pending){a.vx-=px*a.inv;a.vy-=py*a.inv;a.omega-=(ar.x*py-ar.y*px)*a.invI;b.vx+=px*b.inv;b.vy+=py*b.inv;b.omega+=(br.x*py-br.y*px)*b.invI}
 if(hit>45)onHit?.(a,b,hit,hj,m.x,m.y);
}
export const SUBSTEPS=3;
// Environment: wind pushes airborne projectiles; water zones give buoyancy and drag.
// env={wind:number (u/s²), water:[{x0,x1,y0,y1}]}. Shared by the simulation and the preview.
function inWater(b,env){if(!env?.water)return null;for(const z of env.water)if(b.x>z.x0&&b.x<z.x1&&b.y>z.y0&&b.y<z.y1)return z;return null}
function integrate(b,h,env){
 const z=inWater(b,env);
 if(!b.fly)b.vy+=GRAVITY*h;
 if(env?.wind&&b.windy&&!z)b.vx+=env.wind*h;
 if(z){const sub=Math.min(1,(b.y-z.y0)/Math.max(8,(b.r||b.h/2)*2)),dens=b.density??1;b.vy-=GRAVITY*h*sub*(b.kind==='stone'?.6:b.kind==='monster'?.85:1.45)/dens;const d=Math.exp(-2.4*h);b.vx*=d;b.vy*=d;b.omega*=Math.exp(-3*h)}b.vx*=Math.exp(-.09*h);b.vy*=Math.exp(-.035*h);b.omega*=Math.exp(-.7*h);b.x+=b.vx*h;b.y+=b.vy*h;b.a+=b.omega*h;b.vx=Math.max(-1050,Math.min(1050,b.vx));b.vy=Math.max(-1000,Math.min(1000,b.vy));b.omega=Math.max(-10,Math.min(10,b.omega))}
// Free-flight path using exactly the simulation's integrator and tick rate (1/60 s, SUBSTEPS substeps).
export function predict(x,y,vx,vy,ticks=120,stride=4,env=null){const b={x,y,vx,vy,a:0,omega:0,windy:true,kind:'monster'},out=[];const h=1/60/SUBSTEPS;for(let i=1;i<=ticks;i++){for(let s=0;s<SUBSTEPS;s++)integrate(b,h,env);if(i%stride===0)out.push({x:b.x,y:b.y,t:i/60});if(b.y>GROUND+40||b.x>1600||inWater(b,env))break}return out}
// Sleeping: a body that has been still for a moment stops integrating until something moving
// touches it, an explosion reaches it or a neighbour breaks. Standing forts therefore stay put
// instead of slowly creeping, and every collapse is still caused by a real impact.
const SLEEP_SPEED=5,SLEEP_SPIN=.06,SLEEP_TIME=.6,WAKE_SPEED=8;
export function wake(b){if(b&&!b.static&&b.sleep){b.sleep=false;b.sleepT=0}}
const inert=b=>(b.static&&!b.kin)||b.sleep;
export function wakeNear(bodies,x,y,r){for(const b of bodies)if(b.sleep&&Math.hypot(b.x-x,b.y-y)<r+(b.r||Math.hypot(b.w,b.h)/2))wake(b)}
const speed=b=>Math.hypot(b.vx,b.vy);
function freeze(b){const s={inv:b.inv,invI:b.invI};b.inv=0;b.invI=0;return s}
export function step(bodies,dt,onHit,env){
 const n=SUBSTEPS,h=dt/n;
 for(let sub=0;sub<n;sub++){
  for(const b of bodies){if(b.dead)continue;if(b.kin){b.x+=b.vx*h;b.y+=b.vy*h;b.a+=b.omega*h;continue}if(!b.static&&!b.sleep)integrate(b,h,env)}
  for(let k=0;k<6;k++)for(let i=0;i<bodies.length;i++){const a=bodies[i];if(a.dead)continue;for(let j=i+1;j<bodies.length;j++){const b=bodies[j];if(b.dead||a.static&&b.static||a.phase>0&&b.kind!=='ground'||b.phase>0&&a.kind!=='ground')continue;
   if(a.static&&b.static)continue;const inertA=inert(a),inertB=inert(b);if(inertA&&inertB)continue;
   if(Math.abs(a.x-b.x)>(a.r||Math.hypot(a.w,a.h)/2)+(b.r||Math.hypot(b.w,b.h)/2)+2)continue;
   const m=contact(a,b);if(!m)continue;
   // A moving body wakes the sleeper it touches; a slow, resting one leans on it as if it were solid.
   if(a.sleep&&(speed(b)>WAKE_SPEED||Math.abs(b.omega)>.3))wake(a);if(b.sleep&&(speed(a)>WAKE_SPEED||Math.abs(a.omega)>.3))wake(b);
   const fa=a.sleep?freeze(a):null,fb=b.sleep?freeze(b):null;impulse(a,b,m,k===0?onHit:null);if(fa)Object.assign(a,fa);if(fb)Object.assign(b,fb);
  }}
 }
 for(const b of bodies){if(b.static||b.dead||b.sleep||b.fly||b.noSleep||b.kind==='monster'||b.kind==='seed')continue;if(speed(b)<SLEEP_SPEED&&Math.abs(b.omega)<SLEEP_SPIN){b.sleepT=(b.sleepT||0)+dt;if(b.sleepT>SLEEP_TIME){b.sleep=true;b.vx=b.vy=b.omega=0}}else b.sleepT=0}
}
