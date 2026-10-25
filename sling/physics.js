// Small independent rigid-body solver: oriented boxes, circles, angular impulses and friction.
export const GROUND=590,GRAVITY=540;
let sequence=0;
export function body(opts){const b={id:sequence++,x:0,y:0,vx:0,vy:0,a:0,w:40,h:40,r:0,omega:0,mass:1,restitution:.13,friction:.55,static:false,hp:100,kind:'wood',...opts};b.inv=b.static?0:1/b.mass;const inertia=b.r?b.mass*b.r*b.r/2:b.mass*(b.w*b.w+b.h*b.h)/12;b.invI=b.static?0:1/inertia;return b}
const dot=(a,b)=>a.x*b.x+a.y*b.y;
function axes(b){return [{x:Math.cos(b.a),y:Math.sin(b.a)},{x:-Math.sin(b.a),y:Math.cos(b.a)}]}
function radius(b,n){if(b.r)return b.r;const [u,v]=axes(b);return Math.abs(dot(u,n))*b.w/2+Math.abs(dot(v,n))*b.h/2}
function vertices(b){const [u,v]=axes(b);return[-1,1].flatMap(x=>[-1,1].map(y=>({x:b.x+u.x*x*b.w/2+v.x*y*b.h/2,y:b.y+u.y*x*b.w/2+v.y*y*b.h/2})))}
export function contact(a,b){
 let ns;if(a.r&&b.r){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=a.r+b.r)return null;ns=[{x:d?dx/d:1,y:d?dy/d:0}]}
 else{ns=[...(!a.r?axes(a):[]),...(!b.r?axes(b):[])];if(a.r||b.r){const c=a.r?a:b,box=a.r?b:a;const vs=vertices(box).sort((p,q)=>(p.x-c.x)**2+(p.y-c.y)**2-((q.x-c.x)**2+(q.y-c.y)**2));const dx=vs[0].x-c.x,dy=vs[0].y-c.y,d=Math.hypot(dx,dy);if(d>0.001)ns.push({x:dx/d,y:dy/d})}}
 let depth=Infinity,normal;const delta={x:b.x-a.x,y:b.y-a.y};for(const axis of ns){const overlap=radius(a,axis)+radius(b,axis)-Math.abs(dot(delta,axis));if(overlap<=0)return null;if(overlap<depth){depth=overlap;const sign=dot(delta,axis)>=0?1:-1;normal={x:axis.x*sign,y:axis.y*sign}}}
 const n=normal,t={x:-n.y,y:n.x};const range=o=>{const center=dot(o,t),r=radius(o,t);return[center-r,center+r]};const ra=range(a),rb=range(b),tangent=(Math.max(ra[0],rb[0])+Math.min(ra[1],rb[1]))/2;
 const plane=(dot(a,n)+radius(a,n)+dot(b,n)-radius(b,n))/2;
 return {n,depth,x:n.x*plane+t.x*tangent,y:n.y*plane+t.y*tangent};
}
function impulse(a,b,m,onHit){const {n,depth,x,y}=m,sum=a.inv+b.inv;if(!sum)return;
 const correction=Math.max(0,depth-.12)*.55/sum;a.x-=n.x*correction*a.inv;a.y-=n.y*correction*a.inv;b.x+=n.x*correction*b.inv;b.y+=n.y*correction*b.inv;
 const ar={x:x-a.x,y:y-a.y},br={x:x-b.x,y:y-b.y};const rv={x:b.vx-b.omega*br.y-a.vx+a.omega*ar.y,y:b.vy+b.omega*br.x-a.vy-a.omega*ar.x},vn=dot(rv,n);if(vn>=0)return;
 const ac=ar.x*n.y-ar.y*n.x,bc=br.x*n.y-br.y*n.x,den=sum+ac*ac*a.invI+bc*bc*b.invI;
 const restitution=Math.abs(vn)>35?Math.max(a.restitution,b.restitution):0;const j=-(1+restitution)*vn/den;
 function apply(px,py){a.vx-=px*a.inv;a.vy-=py*a.inv;a.omega-=(ar.x*py-ar.y*px)*a.invI;b.vx+=px*b.inv;b.vy+=py*b.inv;b.omega+=(br.x*py-br.y*px)*b.invI}apply(n.x*j,n.y*j);
 const t={x:-n.y,y:n.x},at=ar.x*t.y-ar.y*t.x,bt=br.x*t.y-br.y*t.x;const jt=Math.max(-j*.5,Math.min(j*.5,-dot(rv,t)/(sum+at*at*a.invI+bt*bt*b.invI)));apply(t.x*jt,t.y*jt);
 if(-vn>45)onHit?.(a,b,-vn,j);
}
export function step(bodies,dt,onHit){
 const n=3,h=dt/n;
 for(let sub=0;sub<n;sub++){
  for(const b of bodies)if(!b.static&&!b.dead){b.vy+=GRAVITY*h;b.vx*=Math.exp(-.09*h);b.vy*=Math.exp(-.035*h);b.omega*=Math.exp(-.7*h);b.x+=b.vx*h;b.y+=b.vy*h;b.a+=b.omega*h;b.vx=Math.max(-1050,Math.min(1050,b.vx));b.vy=Math.max(-1000,Math.min(1000,b.vy));b.omega=Math.max(-10,Math.min(10,b.omega))}
  for(let k=0;k<6;k++)for(let i=0;i<bodies.length;i++){const a=bodies[i];if(a.dead)continue;for(let j=i+1;j<bodies.length;j++){const b=bodies[j];if(b.dead||a.static&&b.static||a.phase>0&&b.kind!=='ground'||b.phase>0&&a.kind!=='ground')continue;if(Math.abs(a.x-b.x)>(a.r||Math.hypot(a.w,a.h)/2)+(b.r||Math.hypot(b.w,b.h)/2)+2)continue;const m=contact(a,b);if(m)impulse(a,b,m,k===0?onHit:null)}}
 }
}
export function buildLevel(level){
 const blocks=[],enemies=[];const add=(x,y,w,h,material='wood')=>blocks.push(body({x,y,w,h,kind:material,mass:material==='stone'?2.8:material==='glass'?.65:1.1,hp:material==='stone'?180:material==='glass'?55:95}));
 const enemy=(x,y,boss=false)=>enemies.push(body({x,y,r:boss?32:22,mass:boss?2.4:1,hp:boss?240:65,kind:'enemy',boss}));
 const tower=(x,tiers=1,mat='wood')=>{for(let t=0;t<tiers;t++){const floor=GROUND-t*100;add(x-48,floor-43,18,86,mat);add(x+48,floor-43,18,86,mat);add(x,floor-94,124,14,t%2?'wood':mat);enemy(x,floor-23)}return GROUND-tiers*100};
 const rank=level.rank,mat=rank>=2?'glass':'wood';
 switch(level.pattern){
  case 0:tower(865,1+Math.min(2,rank),mat);if(rank>0)tower(1065,1,'wood');break;
  case 1:tower(790,1+Math.floor(rank/2),mat);tower(1030,1+Math.floor(rank/3),'wood');break;
  case 2:tower(770,1,mat);tower(1050,1,'wood');add(910,474,165,18,rank>1?'stone':'wood');enemy(910,443);if(rank>1)enemy(910,GROUND-23);break;
  case 3:tower(870,2,mat);add(870,355,70,70,'glass');enemy(1050,GROUND-23);add(1025,GROUND-60,16,120,'wood');add(1080,GROUND-60,16,120,'wood');add(1052,461,100,18,'wood');break;
  case 4:tower(810,2,'wood');tower(1060,1,mat);add(940,GROUND-28,55,55,'stone');enemy(940,GROUND-76);break;
  case 5:tower(810,2,mat);tower(1050,2,rank>2?'stone':'wood');enemy(930,GROUND-34,true);add(930,435,150,18,'glass');break;
 }
 const ground=body({x:600,y:GROUND+60,w:3000,h:120,kind:'ground',static:true});return {bodies:[ground,...blocks,...enemies],blocks,enemies};
}
