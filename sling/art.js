// Monster Sling artwork: layered island scenery, textured building materials with damage stages,
// animated shell bandits, the wooden sling and a pooled particle system. Everything is drawn
// procedurally once and cached; per-frame work is mostly drawImage calls.
import{GROUND}from'./physics.js';

export const reducedMotionQuery=matchMedia('(prefers-reduced-motion: reduce)');
function rng(seed){let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function canvas(w,h){const cv=document.createElement('canvas');cv.width=Math.max(1,Math.ceil(w));cv.height=Math.max(1,Math.ceil(h));return[cv,cv.getContext('2d')]}
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;

// ───────────────────────────── Island themes ─────────────────────────────
export const THEMES=[
 {key:'shore',sky:['#5cc6ee','#a6e6f4','#fff0c4'],sun:'#fff6d0',sea:['#2fb6cf','#6fd9d6','#c9f2e4'],far:['#6fb59c','#a9dccd'],mid:'#2f8a5f',midDark:'#1f6a49',back:'#58a85a',top:'#86c95a',lip:'#5ea640',soil:['#efd39a','#d6ab6c','#b4834e'],rock:'#c49a68',fg:'#2f7d45',fgDark:'#1f5b33',props:'palm'},
 {key:'bamboo',sky:['#6cc9c0','#bfead6','#fbe7b4'],sun:'#fff3c6',sea:['#3aaeb4','#7fd2c4','#d6efd4'],far:['#5e9a7a','#9fcbb1'],mid:'#3e7d42',midDark:'#2a5c30',back:'#6ca04f',top:'#93c45a',lip:'#678f3a',soil:['#d9b47a','#b98a55','#8f653c'],rock:'#a98a62',fg:'#3b6f2e',fgDark:'#24491d',props:'bamboo'},
 {key:'frost',sky:['#7ec2ec','#cdeefa','#f4fbff'],sun:'#ffffff',sea:['#4aa4cf','#8fcfe6','#e3f6fb'],far:['#93b9d6','#d4e8f4'],mid:'#6fa6c6',midDark:'#4d84a8',back:'#b7d8ea',top:'#f6fcff',lip:'#c9e6f4',soil:['#cfe6f2','#a9cbe0','#86abc4'],rock:'#9fbdd2',fg:'#7fb2cf',fgDark:'#5a8db0',props:'ice'},
 {key:'grove',sky:['#2c2a62','#6a4f93','#e59aa3'],sun:'#ffd9e6',sea:['#3b3a7a','#6a5aa0','#b98bb5'],far:['#433b7a','#6e5c9c'],mid:'#2e2a5c',midDark:'#1f1c44',back:'#3f5c58',top:'#6fa56f',lip:'#4d7c55',soil:['#6c5a7c','#53455f','#3c3248'],rock:'#7a6a8c',fg:'#253c3a',fgDark:'#16262a',props:'grove'},
 {key:'ember',sky:['#e8875a','#f6b77c','#fde2b0'],sun:'#fff0c0',sea:['#b8574a','#d9825e','#f3b98a'],far:['#9a5a52','#c98b78'],mid:'#5e3a36',midDark:'#432826',back:'#7a5244',top:'#8a6a52',lip:'#5f4636',soil:['#7a5444','#5b3b31','#3f2722'],rock:'#6f4d42',fg:'#3f2b27',fgDark:'#2a1b19',props:'ember'}
];

// ───────────────────────────── Scenery ─────────────────────────────
function wave(c,P,base,amp,freqs,seed,color,flat=0){const r=rng(seed),ph=freqs.map(()=>r()*TAU);c.fillStyle=color;c.beginPath();c.moveTo(0,base+400);for(let x=0;x<=P;x+=8){let y=0;freqs.forEach((f,i)=>y+=Math.sin(x/P*TAU*f+ph[i])/(i+1));c.lineTo(x,base-Math.max(flat,(y*.5+.6))*amp)}c.lineTo(P,base+400);c.closePath();c.fill()}
function palm(c,x,base,h,lean,trunk,leaf,dark){c.save();c.translate(x,base);c.strokeStyle=trunk;c.lineCap='round';const tx=lean*h,ty=-h;for(let i=0;i<9;i++){const t=i/9,t2=(i+1)/9;c.lineWidth=lerp(h*.075,h*.04,t);c.beginPath();c.moveTo(tx*t*t,ty*t);c.lineTo(tx*t2*t2,ty*t2);c.stroke()}c.translate(tx,ty);for(let i=0;i<7;i++){const a=-Math.PI*.95+i*Math.PI*.95/6+(i%2)*.1,len=h*(.55+.12*(i%3));c.fillStyle=i%2?leaf:dark;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(Math.cos(a)*len*.6,Math.sin(a)*len*.6-h*.18,Math.cos(a)*len,Math.sin(a)*len+h*.12);c.quadraticCurveTo(Math.cos(a)*len*.5,Math.sin(a)*len*.5-h*.02,0,0);c.fill()}c.fillStyle=dark;c.beginPath();c.arc(0,4,h*.05,0,TAU);c.fill();c.restore()}
function bamboo(c,x,base,h,col,dark){c.save();c.translate(x,base);const w=h*.035;for(let y=0;y>-h;y-=h*.12){c.fillStyle=col;c.fillRect(-w,y-h*.12+2,w*2,h*.12-2);c.fillStyle=dark;c.fillRect(-w*1.15,y-h*.12-1,w*2.3,3)}c.fillStyle=dark;for(let i=0;i<4;i++){const y=-h*(.3+i*.17),s=i%2?1:-1;c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(s*h*.12,y-h*.05,s*h*.2,y+h*.02);c.quadraticCurveTo(s*h*.1,y+h*.01,0,y);c.fill()}c.restore()}
function spire(c,x,base,h,w,col,light){c.fillStyle=col;c.beginPath();c.moveTo(x-w,base);c.lineTo(x-w*.25,base-h*.7);c.lineTo(x,base-h);c.lineTo(x+w*.3,base-h*.65);c.lineTo(x+w,base);c.fill();c.fillStyle=light;c.beginPath();c.moveTo(x,base-h);c.lineTo(x+w*.3,base-h*.65);c.lineTo(x+w*.1,base-h*.2);c.lineTo(x-w*.05,base-h*.55);c.fill()}
function roundTree(c,x,base,h,col,dark,glow){c.fillStyle=dark;c.fillRect(x-h*.04,base-h*.55,h*.08,h*.55);for(const [dx,dy,r] of[[0,-.7,.32],[-.22,-.55,.24],[.22,-.56,.25],[0,-.45,.22]]){c.fillStyle=dy<-.6?col:dark;c.beginPath();c.arc(x+dx*h,base+dy*h,r*h,0,TAU);c.fill()}if(glow){c.fillStyle=glow;for(let i=0;i<4;i++){c.beginPath();c.arc(x+(i-1.5)*h*.12,base-h*(.5+.12*(i%2)),h*.025,0,TAU);c.fill()}}}
function boulder(c,x,base,w,h,col,light){c.fillStyle=col;c.beginPath();c.moveTo(x-w/2,base);c.quadraticCurveTo(x-w*.55,base-h*.8,x-w*.1,base-h);c.quadraticCurveTo(x+w*.45,base-h*1.02,x+w/2,base);c.fill();c.fillStyle=light;c.globalAlpha*=.35;c.beginPath();c.ellipse(x-w*.15,base-h*.7,w*.18,h*.15,-.4,0,TAU);c.fill();c.globalAlpha/=.35}

function buildLayers(th,seed){
 const L={};const R=1;
 // Far: distant islands, bluffs, peaks, hills or a volcano, softened by haze.
 {const P=2000,H=520,[cv,c]=canvas(P*R,H*R);c.scale(R,R);const r=rng(seed+1);
  if(th.key==='frost'){for(let i=0;i<9;i++){const x=i*P/9+r()*90,h=170+r()*200,w=90+r()*80;for(const o of[-P,0,P])spire(c,x+o,H,h,w,th.far[0],th.far[1]);}}
  else if(th.key==='ember'){wave(c,P,H,120,[2,5],seed,th.far[1]);for(const o of[-P,0,P]){c.fillStyle=th.far[0];c.beginPath();c.moveTo(o+500,H);c.lineTo(o+880,H-360);c.lineTo(o+960,H-360);c.lineTo(o+1360,H);c.fill();c.fillStyle='#ffb36b';c.globalAlpha=.8;c.beginPath();c.moveTo(o+880,H-360);c.lineTo(o+960,H-360);c.lineTo(o+940,H-300);c.lineTo(o+900,H-310);c.fill();c.globalAlpha=1}}
  else if(th.key==='bamboo'){for(let i=0;i<7;i++){const x=i*P/7+r()*80,w=120+r()*80,h=220+r()*160;for(const o of[-P,0,P]){c.fillStyle=i%2?th.far[0]:th.far[1];c.beginPath();c.moveTo(x+o-w,H);c.bezierCurveTo(x+o-w*.9,H-h,x+o-w*.2,H-h*1.05,x+o,H-h);c.bezierCurveTo(x+o+w*.3,H-h,x+o+w*.8,H-h*.9,x+o+w,H);c.fill()}}}
  else{wave(c,P,H-30,150,[2,3,7],seed,th.far[1]);wave(c,P,H,110,[3,5,9],seed+7,th.far[0])}
  // haze toward the horizon
  const g=c.createLinearGradient(0,H-260,0,H);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,th.key==='grove'?'rgba(120,90,160,.45)':'rgba(255,255,255,.5)');c.fillStyle=g;c.fillRect(0,0,P,H);
  L.far={cv,P,H,R,p:.12};}
 // Mid: shoreline vegetation and silhouettes across the water.
 {const P=1700,H=560,[cv,c]=canvas(P*R,H*R);c.scale(R,R);const r=rng(seed+2);
  wave(c,P,H,40,[3,6],seed+3,th.midDark,.2);
  const count=th.props==='bamboo'?12:th.props==='palm'?6:8;
  for(let i=0;i<count;i++){const x=(i+.5)*P/count+(r()-.5)*70;for(const o of[-P,0,P]){const X=x+o;
   if(th.props==='palm')palm(c,X,H-14,130+r()*110,(r()-.5)*.5,th.midDark,th.mid,th.midDark);
   else if(th.props==='bamboo'){bamboo(c,X,H-10,170+r()*160,i%2?th.mid:th.midDark,th.midDark)}
   else if(th.props==='ice')spire(c,X,H-10,100+r()*120,34+r()*30,th.mid,th.back);
   else if(th.props==='grove')roundTree(c,X,H-10,150+r()*100,th.mid,th.midDark,'rgba(255,240,160,.85)');
   else boulder(c,X,H-10,100+r()*100,60+r()*90,th.mid,th.far[1]);}}
  L.mid={cv,P,H,R,p:.35};}
 // Back: bushes and dunes just behind the playfield.
 {const P=1500,H=220,[cv,c]=canvas(P*R,H*R);c.scale(R,R);const r=rng(seed+4);
  wave(c,P,H,70,[4,9],seed+5,th.back,.15);
  for(let i=0;i<10;i++){const x=r()*P,s=26+r()*26;for(const o of[-P,0,P]){for(const [dx,dy,k] of[[-.8,.2,.75],[.8,.25,.7],[0,0,1]]){c.fillStyle=k===1?th.back:th.midDark;c.beginPath();c.arc(x+o+dx*s,H-s*.8+dy*s,s*k,0,TAU);c.fill()}c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.arc(x+o-s*.25,H-s*1.15,s*.35,0,TAU);c.fill()}}
  L.back={cv,P,H,R,p:.7};}
 // Clouds (or wisps of smoke) as reusable sprites.
 L.clouds=[0,1,2].map(i=>{const [cv,c]=canvas(260,110),r=rng(seed+20+i);const col=th.key==='ember'?'rgba(120,80,70,.55)':th.key==='grove'?'rgba(220,190,240,.35)':'rgba(255,255,255,.92)';c.fillStyle=col;for(let k=0;k<7;k++){c.beginPath();c.arc(40+k*28+r()*10,70-Math.sin(k/6*Math.PI)*28-r()*8,24+r()*16,0,TAU);c.fill()}c.fillRect(30,70,200,24);return cv});
 // Ground strata pattern and the grassy/snowy lip.
 {const [cv,c]=canvas(256,256),r=rng(seed+9);const g=c.createLinearGradient(0,0,0,256);g.addColorStop(0,th.soil[0]);g.addColorStop(.5,th.soil[1]);g.addColorStop(1,th.soil[2]);c.fillStyle=g;c.fillRect(0,0,256,256);
  for(let i=0;i<5;i++){c.strokeStyle='rgba(0,0,0,.07)';c.lineWidth=2;c.beginPath();const y=30+i*48;for(let x=0;x<=256;x+=16)c.lineTo(x,y+Math.sin((x/256)*TAU*2+i)*5);c.stroke()}
  for(let i=0;i<40;i++){const x=r()*256,y=r()*256,s=2+r()*6;c.fillStyle=r()<.5?'rgba(255,255,255,.18)':'rgba(0,0,0,.14)';c.beginPath();c.ellipse(x,y,s,s*.7,r()*3,0,TAU);c.fill()}
  L.soil=cv;}
 return L;
}

export class Scenery{
 constructor(island,seed=7){this.th=THEMES[island]||THEMES[0];this.island=island;this.layers=buildLayers(this.th,seed+island*31);this.soilPattern=null;this.skyCache=null;this.stars=Array.from({length:60},(_,i)=>{const r=rng(99+i);return{x:r(),y:r()*.6,s:r()*1.6+.4,p:r()*TAU}})}
 // Screen-space background behind the world. cam: {cx,cy,S,w,h,cy0,groundY}
 back(c,cam,now){
  const {w,h,S,cx,cy}=cam,th=this.th;
  if(!this.skyCache||this.skyCache.h!==h){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,th.sky[0]);g.addColorStop(.55,th.sky[1]);g.addColorStop(1,th.sky[2]);this.skyCache={h,g}}
  c.fillStyle=this.skyCache.g;c.fillRect(0,0,w,h);
  const horizon=cam.horizon+(cam.cy0-cy)*S*.12;
  // sun / moon glow
  const sx=w*.72-(cx-600)*S*.03,sy=horizon-h*.32;const sg=c.createRadialGradient(sx,sy,2,sx,sy,h*.38);sg.addColorStop(0,th.sun);sg.addColorStop(.12,th.sun+'cc');sg.addColorStop(1,th.sun+'00');c.fillStyle=sg;c.fillRect(0,0,w,h);
  if(th.key==='grove'){c.fillStyle='#fff';for(const st of this.stars){c.globalAlpha=.4+.4*Math.sin(now/700+st.p);c.fillRect(st.x*w,st.y*horizon,st.s,st.s)}c.globalAlpha=1}
  // drifting clouds
  const clouds=this.layers.clouds,span=w+400;for(let i=0;i<6;i++){const sp=th.key==='ember'?10:6,x=((i*330+now/1000*sp*(1+i%3)-(cx-600)*S*.06)%span+span)%span-200,y=horizon-h*.18-((i*97)%5)*h*.07,k=S*(.55+(i%3)*.18);c.globalAlpha=.85;c.drawImage(clouds[i%3],x,y,260*k,110*k)}c.globalAlpha=1;
  this.strip(c,this.layers.far,cam,horizon+6);
  // sea band
  const seaTop=horizon,seaBot=cam.groundScreen(cy)+10;if(seaBot>seaTop){const g=c.createLinearGradient(0,seaTop,0,seaBot);g.addColorStop(0,th.sea[0]);g.addColorStop(.6,th.sea[1]);g.addColorStop(1,th.sea[2]);c.fillStyle=g;c.fillRect(0,seaTop,w,seaBot-seaTop);
   c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1.5;for(let i=0;i<9;i++){const y=lerp(seaTop+6,seaBot-8,i/9),off=(now/1000*12*(1+i*.2)+i*130-(cx*S*.3))%160;c.beginPath();for(let x=-160+off;x<w;x+=160){c.moveTo(x,y);c.lineTo(x+40+i*4,y)}c.stroke()}}
  this.strip(c,this.layers.mid,cam,seaTop+(seaBot-seaTop)*.55);
  this.strip(c,this.layers.back,cam,cam.groundScreen(cy)+4*S);
 }
 strip(c,L,cam,base){const {w,S,cx}=cam,Sl=S*(.55+.45*L.p),tile=L.P*Sl,hh=L.H*Sl;let x=(w/2-(cx-600)*L.p*Sl-tile/2)%tile;if(x>0)x-=tile;for(;x<w;x+=tile)c.drawImage(L.cv,x,base-hh,tile,hh)}
 // World-space terrain (call inside the world transform).
 ground(c,S){
  const th=this.th;if(!this.soilPattern)this.soilPattern=c.createPattern(this.layers.soil,'repeat');
  c.save();c.fillStyle=this.soilPattern;c.translate(0,GROUND);c.fillRect(-600,0,2600,1400);c.restore();
  // thickness shading under the lip
  const g=c.createLinearGradient(0,GROUND,0,GROUND+60);g.addColorStop(0,'rgba(0,0,0,.18)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(-600,GROUND,2600,60);
  // lip: grass / snow / ash with a highlight edge
  c.fillStyle=th.lip;c.beginPath();c.moveTo(-600,GROUND+14);for(let x=-600;x<=2000;x+=18)c.lineTo(x,GROUND+9+Math.sin(x*.21)*3+Math.sin(x*.05)*2);c.lineTo(2000,GROUND-2);c.lineTo(-600,GROUND-2);c.fill();
  c.fillStyle=th.top;c.beginPath();c.moveTo(-600,GROUND+4);for(let x=-600;x<=2000;x+=14)c.lineTo(x,GROUND+3+Math.sin(x*.33)*2.2);c.lineTo(2000,GROUND-5);c.quadraticCurveTo(700,GROUND-7,-600,GROUND-5);c.fill();
  c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=2;c.beginPath();c.moveTo(-600,GROUND-4);c.lineTo(2000,GROUND-4);c.stroke();
  // grass blades / pebbles along the top
  if(th.key!=='frost'&&th.key!=='ember'){c.strokeStyle=th.lip;c.lineWidth=2;c.beginPath();for(let x=-560;x<1960;x+=23){const h=6+((x*7)%9);c.moveTo(x,GROUND-2);c.quadraticCurveTo(x+3,GROUND-h*.6,x+5,GROUND-h)}c.stroke()}
  if(th.key==='ember'){c.strokeStyle='rgba(255,140,60,.55)';c.lineWidth=2.5;c.beginPath();for(let x=-500;x<1900;x+=170){c.moveTo(x,GROUND+30);c.lineTo(x+30,GROUND+48);c.lineTo(x+18,GROUND+70)}c.stroke()}
  // sling mound
  c.fillStyle=th.lip;c.beginPath();c.ellipse(190,GROUND+2,70,12,0,Math.PI,0);c.fill();boulder(c,140,GROUND+2,34,18,th.rock,'#fff');boulder(c,236,GROUND+2,26,13,th.rock,'#fff');
 }
 // Foreground silhouettes in front of the world, below the ground line.
 front(c,cam,now){const {w,S,cx,cy}=cam,th=this.th,gy=cam.groundScreen(cy),k=S*1.25;if(gy>cam.h+40)return;c.save();
  const off=-(cx-600)*S*1.25;for(let i=-1;i<5;i++){const x=((i*520+off)%2600+2600)%2600-500,base=gy+175*S;
   c.fillStyle=i%2?th.fg:th.fgDark;c.beginPath();for(let j=0;j<5;j++){const a=-Math.PI/2+(j-2)*.42+Math.sin(now/1600+i+j)*.04*(reducedMotionQuery.matches?0:1),len=(70+j%3*25)*k;c.moveTo(x,base+20*k);c.quadraticCurveTo(x+Math.cos(a)*len*.5-12*k,base+Math.sin(a)*len*.5,x+Math.cos(a)*len,base+Math.sin(a)*len);c.quadraticCurveTo(x+Math.cos(a)*len*.45+12*k,base+Math.sin(a)*len*.5,x,base+20*k)}c.fill()}
  c.restore()}
}

// ───────────────────────────── Building materials ─────────────────────────────
const RES=2.5,PAD=3,blockCache=new Map();
export function damageStage(b){const r=b.hp/(b.maxHp||1);return r>.66?0:r>.33?1:2}
function crackPath(c,w,h,r,n,width,col){c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';for(let k=0;k<n;k++){let x=(r()-.5)*w*.7,y=(r()-.5)*h*.7;c.beginPath();c.moveTo(x,y);const steps=3+Math.floor(r()*3);for(let i=0;i<steps;i++){x+=(r()-.5)*w*.5;y+=(r()-.5)*h*.5;x=clamp(x,-w/2+2,w/2-2);y=clamp(y,-h/2+2,h/2-2);c.lineTo(x,y);if(r()<.4){c.moveTo(x,y);c.lineTo(x+(r()-.5)*w*.25,y+(r()-.5)*h*.25);c.moveTo(x,y)}}c.stroke()}}
function blockSprite(kind,w,h,stage,frozen){
 const key=kind+'|'+w+'|'+h+'|'+stage+'|'+(frozen?1:0);let s=blockCache.get(key);if(s)return s;
 const [cv,c]=canvas((w+PAD*2)*RES,(h+PAD*2)*RES);c.scale(RES,RES);c.translate(w/2+PAD,h/2+PAD);const r=rng(w*131+h*17+kind.length*7),long=w>=h;
 const rr=Math.min(4,Math.min(w,h)*.25);const shape=()=>{c.beginPath();c.roundRect(-w/2,-h/2,w,h,rr)};
 if(kind==='wood'){
  const g=c.createLinearGradient(long?0:-w/2,long?-h/2:0,long?0:w/2,long?h/2:0);g.addColorStop(0,'#e0a463');g.addColorStop(.5,'#c98a4b');g.addColorStop(1,'#a76a35');shape();c.fillStyle=g;c.fill();
  c.save();shape();c.clip();
  // planks and grain along the long axis
  const across=long?h:w,along=long?w:h,planks=Math.max(1,Math.round(across/9));
  for(let i=1;i<planks;i++){const o=-across/2+i*across/planks;c.strokeStyle='rgba(92,50,20,.45)';c.lineWidth=1.1;c.beginPath();long?(c.moveTo(-w/2,o),c.lineTo(w/2,o)):(c.moveTo(o,-h/2),c.lineTo(o,h/2));c.stroke()}
  c.strokeStyle='rgba(110,62,26,.28)';c.lineWidth=.8;for(let i=0;i<Math.max(3,across/3);i++){const o=-across/2+r()*across;c.beginPath();for(let t=-along/2;t<=along/2;t+=6){const v=o+Math.sin(t*.09+i)*1.2;long?c.lineTo(t,v):c.lineTo(v,t)}c.stroke()}
  for(let i=0;i<Math.floor(along/45)+1;i++){const t=(r()-.5)*along*.8,o=(r()-.5)*across*.5;c.fillStyle='rgba(100,55,22,.5)';c.beginPath();long?c.ellipse(t,o,3.2,1.6,0,0,TAU):c.ellipse(o,t,1.6,3.2,0,0,TAU);c.fill()}
  c.fillStyle='rgba(255,236,190,.35)';long?c.fillRect(-w/2,-h/2,w,2):c.fillRect(-w/2,-h/2,2,h);
  c.restore();shape();c.strokeStyle='#6b3d1b';c.lineWidth=1.6;c.stroke();
  // iron nails at the ends
  c.fillStyle='#5a4a3e';for(const e of[-1,1]){const t=e*(along/2-5);for(const o of planks>1?[-across/4,across/4]:[0]){c.beginPath();long?c.arc(t,o,1.4,0,TAU):c.arc(o,t,1.4,0,TAU);c.fill()}}
 }else if(kind==='stone'){
  const g=c.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,'#c8cfd2');g.addColorStop(1,'#8c979c');shape();c.fillStyle=g;c.fill();
  c.save();shape();c.clip();
  // irregular masonry facets
  const cells=Math.max(2,Math.round(w*h/700));for(let i=0;i<cells;i++){const x=(r()-.5)*w,y=(r()-.5)*h,s=8+r()*12;c.fillStyle=r()<.5?'rgba(255,255,255,.12)':'rgba(40,50,60,.12)';c.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+r()*.4;c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s*.8)}c.fill()}
  for(let i=0;i<w*h/40;i++){c.fillStyle=r()<.5?'rgba(255,255,255,.25)':'rgba(30,35,40,.2)';c.fillRect((r()-.5)*w,(r()-.5)*h,1,1)}
  c.strokeStyle='rgba(60,68,75,.35)';c.lineWidth=1;const rows=Math.max(1,Math.round(h/16));for(let i=1;i<rows;i++){const y=-h/2+i*h/rows;c.beginPath();c.moveTo(-w/2,y);c.lineTo(w/2,y);c.stroke();const off=(i%2)*14;for(let x=-w/2+off+20;x<w/2;x+=28){c.beginPath();c.moveTo(x,y-h/rows);c.lineTo(x,y);c.stroke()}}
  c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-w/2,-h/2,w,2.2);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-w/2,h/2-2.5,w,2.5);
  c.restore();shape();c.strokeStyle='#545e64';c.lineWidth=1.8;c.stroke();
 }else{ // glass
  const g=c.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,'rgba(214,250,255,.78)');g.addColorStop(.5,'rgba(140,215,232,.6)');g.addColorStop(1,'rgba(96,180,205,.72)');shape();c.fillStyle=g;c.fill();
  c.save();shape();c.clip();c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=2.4;c.beginPath();c.moveTo(-w*.35,h*.5);c.lineTo(w*.15,-h*.5);c.stroke();c.lineWidth=1.2;c.beginPath();c.moveTo(-w*.1,h*.5);c.lineTo(w*.38,-h*.5);c.stroke();
  c.fillStyle='rgba(255,255,255,.22)';c.fillRect(-w/2+2,-h/2+2,w-4,Math.min(5,h*.3));c.restore();
  shape();c.strokeStyle='rgba(50,128,152,.9)';c.lineWidth=1.5;c.stroke();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=.8;c.beginPath();c.roundRect(-w/2+1.6,-h/2+1.6,w-3.2,h-3.2,Math.max(1,rr-1));c.stroke();
 }
 if(frozen){c.save();shape();c.clip();c.fillStyle='rgba(190,240,255,.45)';c.fillRect(-w/2,-h/2,w,h);c.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<w*h/220+2;i++){const x=(r()-.5)*w,y=(r()-.5)*h,s=1.2+r()*1.8;c.fillRect(x-s,y-.4,s*2,.8);c.fillRect(x-.4,y-s,.8,s*2)}c.restore();shape();c.strokeStyle='rgba(120,210,240,.95)';c.lineWidth=1.6;c.stroke()}
 if(stage>0){c.save();shape();c.clip();const col=kind==='glass'?'rgba(255,255,255,.95)':kind==='stone'?'rgba(40,44,48,.75)':'rgba(70,35,12,.7)';crackPath(c,w,h,rng(w+h*3+stage*999),stage===1?1:3,kind==='glass'?1:1.4,col);
  if(stage===2){c.fillStyle=kind==='glass'?'rgba(255,255,255,.3)':'rgba(0,0,0,.18)';for(const [sx,sy] of[[-1,-1],[1,1]]){c.beginPath();c.moveTo(sx*w/2,sy*h/2);c.lineTo(sx*w/2-sx*Math.min(9,w*.3),sy*h/2);c.lineTo(sx*w/2,sy*h/2-sy*Math.min(9,h*.4));c.fill()}}c.restore()}
 s={cv,pad:PAD};blockCache.set(key,s);return s;
}
export function drawBlock(c,b,time){
 const s=blockSprite(b.kind,b.w,b.h,damageStage(b),!!b.frozen);c.save();
 let jx=0;const since=time-(b.hitT??-9);if(since<.18&&!reducedMotionQuery.matches)jx=Math.sin(since*90)*(1-since/.18)*Math.min(2.5,(b.hitAmt||0)/12);
 c.translate(b.x+jx,b.y);c.rotate(b.a);c.drawImage(s.cv,-b.w/2-s.pad,-b.h/2-s.pad,b.w+s.pad*2,b.h+s.pad*2);
 if(since<.1){c.globalAlpha=(1-since/.1)*.45;c.fillStyle='#fff';c.beginPath();c.roundRect(-b.w/2,-b.h/2,b.w,b.h,3);c.fill()}
 c.restore();
}
export function drawShadow(c,x,y,halfW,alpha=.25){const d=GROUND-y;if(d>160)return;const k=1-d/160;c.save();c.globalAlpha=alpha*k;c.fillStyle='#1d2a20';c.beginPath();c.ellipse(x,GROUND-1,halfW*(.7+.3*k),4+3*k,0,0,TAU);c.fill();c.restore()}

// ───────────────────────────── Shell bandits ─────────────────────────────
const shellCache=new Map();
function shellSprite(r,boss,stage){const key=r+'|'+boss+'|'+stage;let s=shellCache.get(key);if(s)return s;const S=3,size=r*2.6,[cv,c]=canvas(size*S,size*S);c.scale(S,S);c.translate(size/2,size/2);
 const base=boss?['#c79be6','#8a5bb5','#4f2d72']:['#b5dc72','#6fa83f','#38602a'];
 // shell dome
 const g=c.createRadialGradient(-r*.25,-r*.45,r*.1,0,0,r*1.05);g.addColorStop(0,base[0]);g.addColorStop(.6,base[1]);g.addColorStop(1,base[2]);c.fillStyle=g;c.beginPath();c.ellipse(r*.1,0,r*.95,r*.86,0,0,TAU);c.fill();
 c.strokeStyle=base[2];c.lineWidth=2;c.stroke();
 // plates
 c.strokeStyle='rgba(30,50,20,.45)';if(boss)c.strokeStyle='rgba(50,20,70,.5)';c.lineWidth=1.4;const plates=[[.15,-.35],[-.25,.05],[.5,.05],[.15,.42]];for(const [px,py] of plates){c.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+.5;c.lineTo(px*r+Math.cos(a)*r*.28,py*r+Math.sin(a)*r*.26)}c.closePath();c.stroke()}
 // rim
 c.fillStyle=boss?'#e9c46a':'#e3cf86';c.beginPath();c.ellipse(r*.1,r*.62,r*.82,r*.2,0,0,Math.PI);c.fill();c.strokeStyle=boss?'#9c7a2c':'#a8904c';c.lineWidth=1.2;c.stroke();
 if(boss){c.fillStyle='#ffd45e';c.strokeStyle='#a97a1f';c.lineWidth=1.2;for(const [sx,sy,a] of[[-.2,-.82,-.35],[.25,-.86,0],[.65,-.62,.45]]){c.save();c.translate(sx*r,sy*r);c.rotate(a);c.beginPath();c.moveTo(-r*.12,0);c.lineTo(0,-r*.3);c.lineTo(r*.12,0);c.closePath();c.fill();c.stroke();c.restore()}}
 if(stage>0)crackPath(c,r*1.6,r*1.4,rng(r*7+stage),stage,1.3,'rgba(30,25,20,.7)');
 // gloss
 c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(-r*.1,-r*.52,r*.38,r*.14,-.25,0,TAU);c.fill();
 s={cv,size};shellCache.set(key,s);return s}
export function drawBandit(c,e,o){
 const {now,time,look,scared}=o,r=e.r,boss=!!e.boss,stage=damageStage(e),hitAge=time-(e.hitT??-9),hurt=hitAge<.45,t=now/1000,ph=e.id*1.7;
 const breathe=reducedMotionQuery.matches?0:Math.sin(t*(boss?2.2:3)+ph)*.035,bob=boss&&!hurt&&!reducedMotionQuery.matches?Math.abs(Math.sin(t*2.4+ph))*-2.5:0;
 c.save();c.translate(e.x,e.y+bob);c.rotate(clamp(Math.sin(e.a)*.6,-.6,.6));
 if(hurt&&!reducedMotionQuery.matches)c.translate(Math.sin(hitAge*70)*(1-hitAge/.45)*2,0);
 c.scale(1-breathe*.5,1+breathe);
 // feet
 c.fillStyle=boss?'#7c5a96':'#7fa452';c.strokeStyle=boss?'#43295a':'#3d5a26';c.lineWidth=1.4;const step=Math.sin(t*6+ph)*(scared?2:0);for(const fx of[-.42,.48]){c.beginPath();c.ellipse(fx*r+(fx<0?step:-step),r*.78,r*.2,r*.13,0,0,TAU);c.fill();c.stroke()}
 const sh=shellSprite(r,boss,stage);c.drawImage(sh.cv,-sh.size/2,-sh.size/2,sh.size,sh.size);
 // head, facing the sling (left)
 const hx=-r*.62,hy=-r*.08,hr=r*.5;
 c.fillStyle=boss?'#d9b7ef':'#c6e48a';c.strokeStyle=boss?'#5d3b78':'#4e6e2c';c.lineWidth=1.6;c.beginPath();c.arc(hx,hy,hr,0,TAU);c.fill();c.stroke();
 // bandana mask with fluttering knot tails
 const mask=boss?'#3a2350':'#b8323f',maskDark=boss?'#1e1030':'#7d1e28';c.fillStyle=mask;c.beginPath();c.moveTo(hx-hr*1.02,hy-hr*.42);c.quadraticCurveTo(hx,hy-hr*.62,hx+hr*1.02,hy-hr*.4);c.lineTo(hx+hr*1.02,hy+hr*.12);c.quadraticCurveTo(hx,hy-hr*.02,hx-hr*1.02,hy+hr*.08);c.closePath();c.fill();
 const fl=reducedMotionQuery.matches?0:Math.sin(t*7+ph)*.25;c.fillStyle=maskDark;for(const k of[0,1]){c.save();c.translate(hx+hr*.95,hy-hr*.18);c.rotate(.25+k*.45+fl*(k?1:-1));c.beginPath();c.moveTo(0,-2);c.quadraticCurveTo(hr*.5,-3,hr*.75,2);c.quadraticCurveTo(hr*.45,3,0,3);c.fill();c.restore()}
 // eyes
 const blinkCycle=(t*1000+e.id*937)%(boss?3600:2900),blink=blinkCycle<120?1-Math.abs(blinkCycle-60)/60:0;
 let lx=-1,ly=0;if(look){const dx=look.x-e.x,dy=look.y-e.y,d=Math.hypot(dx,dy)||1;lx=dx/d;ly=dy/d}
 const wide=scared?1.25:1;for(const ex of[-.36,.3]){const X=hx+ex*hr,Y=hy-hr*.18;
  if(hurt){c.strokeStyle='#2a1a12';c.lineWidth=1.8;c.beginPath();c.moveTo(X-hr*.16,Y-hr*.1);c.lineTo(X+hr*.12,Y);c.lineTo(X-hr*.16,Y+hr*.1);c.stroke();continue}
  c.fillStyle='#fffdf2';c.beginPath();c.ellipse(X,Y,hr*.22*wide,hr*.26*wide*(1-blink*.9),0,0,TAU);c.fill();
  if(blink<.6){c.fillStyle='#1f1a16';c.beginPath();c.arc(X+lx*hr*.08,Y+ly*hr*.08,hr*.12*(scared?.8:1),0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(X+lx*hr*.08-hr*.04,Y+ly*hr*.08-hr*.05,hr*.04,0,TAU);c.fill()}}
 // brows
 c.strokeStyle=boss?'#1e1030':'#3a2416';c.lineWidth=boss?2.6:2;c.lineCap='round';const browTilt=scared?-.25:hurt?.1:.35;for(const ex of[-.36,.3]){const X=hx+ex*hr,Y=hy-hr*.55;c.beginPath();c.moveTo(X-hr*.2,Y+(ex<0?-1:1)*browTilt*hr*.3*-1);c.lineTo(X+hr*.2,Y+(ex<0?1:-1)*browTilt*hr*.3*-1);c.stroke()}
 // mouth
 c.strokeStyle='#3a2416';c.lineWidth=1.6;c.fillStyle='#6a2a2a';const mx=hx-hr*.05,my=hy+hr*.42;
 if(scared||hurt){c.beginPath();c.ellipse(mx,my,hr*.14,hr*(hurt?.08:.16),0,0,TAU);c.fill();c.stroke()}
 else{c.beginPath();c.moveTo(mx-hr*.3,my-hr*.04);c.quadraticCurveTo(mx,my+hr*.24,mx+hr*.28,my-hr*.08);c.stroke();c.fillStyle='#fff';c.beginPath();c.moveTo(mx-hr*.08,my+hr*.06);c.lineTo(mx-hr*.01,my+hr*.17);c.lineTo(mx+hr*.05,my+hr*.05);c.fill()}
 if(stage===2){c.fillStyle='#f3e3c3';c.strokeStyle='#b49a6a';c.lineWidth=.8;c.save();c.translate(hx+hr*.2,hy-hr*.75);c.rotate(.5);c.fillRect(-hr*.35,-hr*.1,hr*.7,hr*.2);c.strokeRect(-hr*.35,-hr*.1,hr*.7,hr*.2);c.restore()}
 if(boss){// crown
  c.save();c.translate(hx+hr*.1,hy-hr*.95);c.rotate(stage===2?-.35:-.12);c.fillStyle='#ffd45e';c.strokeStyle='#9c7121';c.lineWidth=1.4;c.beginPath();c.moveTo(-hr*.5,0);c.lineTo(-hr*.55,-hr*.5);c.lineTo(-hr*.22,-hr*.22);c.lineTo(0,-hr*.62);c.lineTo(hr*.22,-hr*.22);c.lineTo(hr*.55,-hr*.5);c.lineTo(hr*.5,0);c.closePath();c.fill();c.stroke();c.fillStyle='#e0457b';c.beginPath();c.arc(0,-hr*.18,hr*.09,0,TAU);c.fill();c.restore()}
 if(hitAge<.12){c.globalCompositeOperation='source-atop';c.globalAlpha=(1-hitAge/.12)*.6;c.fillStyle='#fff';c.fillRect(-r*1.4,-r*1.4,r*2.8,r*2.8)}
 c.restore();
 if(boss){const w=r*2,x=e.x-w/2,y=e.y-r-24;c.save();c.fillStyle='rgba(40,20,50,.55)';c.beginPath();c.roundRect(x-2,y-2,w+4,9,5);c.fill();const k=clamp(e.hp/(e.maxHp||240),0,1);c.fillStyle=k>.5?'#ff7fb0':k>.25?'#ffb347':'#ff5a5a';c.beginPath();c.roundRect(x,y,w*k,5,3);c.fill();c.restore()}
}

// ───────────────────────────── The sling ─────────────────────────────
export const FORK={base:{x:188,y:GROUND+4},crotch:{x:190,y:492},back:{x:168,y:434},front:{x:214,y:434}};
function limb(c,a,b,w0,w1){const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;c.beginPath();c.moveTo(a.x+nx*w0,a.y+ny*w0);c.lineTo(b.x+nx*w1,b.y+ny*w1);c.arc(b.x,b.y,w1,Math.atan2(ny,nx),Math.atan2(ny,nx)+Math.PI,true);c.lineTo(a.x-nx*w0,a.y-ny*w0);c.closePath()}
function wood(c,x0,y0,x1,y1){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'#a8703c');g.addColorStop(.45,'#d39a5c');g.addColorStop(1,'#7a4a24');return g}
export function drawSlingBack(c){const F=FORK;c.save();c.lineJoin='round';c.strokeStyle='#4a2a12';c.lineWidth=2;
 limb(c,F.crotch,F.back,6.5,5);c.fillStyle=wood(c,F.back.x-8,0,F.back.x+8,0);c.fill();c.stroke();
 limb(c,F.base,F.crotch,8.5,7.5);c.fillStyle=wood(c,F.base.x-9,0,F.base.x+9,0);c.fill();c.stroke();
 c.strokeStyle='rgba(70,38,14,.45)';c.lineWidth=1;for(let y=505;y<585;y+=14){c.beginPath();c.moveTo(183,y);c.quadraticCurveTo(189,y+4,196,y);c.stroke()}
 // rope wraps
 c.strokeStyle='#e9d3a0';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(F.back.x-6,F.back.y+6+i*3.2);c.lineTo(F.back.x+6,F.back.y+3+i*3.2);c.stroke()}
 c.restore()}
export function drawSlingFront(c){const F=FORK;c.save();c.lineJoin='round';c.strokeStyle='#4a2a12';c.lineWidth=2;limb(c,F.crotch,F.front,6.5,5);c.fillStyle=wood(c,F.front.x-8,0,F.front.x+8,0);c.fill();c.stroke();
 c.strokeStyle='#e9d3a0';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(F.front.x-6,F.front.y+3+i*3.2);c.lineTo(F.front.x+6,F.front.y+6+i*3.2);c.stroke()}c.restore()}
// Elastic band from a fork tip to the pouch. tension 0..1 thins and warms the rubber.
export function drawBand(c,tip,to,tension){c.save();c.lineCap='round';c.strokeStyle=`rgb(${Math.round(lerp(96,170,tension))},${Math.round(lerp(52,44,tension))},${Math.round(lerp(34,30,tension))})`;c.lineWidth=lerp(6.5,3.6,tension);c.beginPath();c.moveTo(tip.x,tip.y+3);c.lineTo(to.x,to.y);c.stroke();c.strokeStyle='rgba(255,200,170,.35)';c.lineWidth=1.2;c.beginPath();c.moveTo(tip.x,tip.y+1.5);c.lineTo(to.x,to.y-1.5);c.stroke();c.restore()}
export function drawPouch(c,x,y,angle,r){c.save();c.translate(x,y);c.rotate(angle);const g=c.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#8a5a34');g.addColorStop(1,'#5a3418');c.fillStyle=g;c.strokeStyle='#3e220e';c.lineWidth=1.6;c.beginPath();c.ellipse(-r*.15,0,r*.42,r*.78,0,0,TAU);c.fill();c.stroke();c.strokeStyle='rgba(255,220,180,.4)';c.lineWidth=1;c.beginPath();c.ellipse(-r*.15,0,r*.3,r*.62,0,-1.2,1.2);c.stroke();c.restore()}

// ───────────────────────────── Crystal objective ─────────────────────────────
export function drawCrystal(c,x,now,saved){const t=now/1000,y=GROUND-30-(reducedMotionQuery.matches?0:Math.sin(t*1.6)*3)-(saved?Math.min(60,saved*60):0);c.save();
 const g=c.createRadialGradient(x,y,2,x,y,46);g.addColorStop(0,'rgba(170,255,255,.65)');g.addColorStop(1,'rgba(170,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,46,0,TAU);c.fill();
 c.fillStyle='#8be9ee';c.strokeStyle='#2f7891';c.lineWidth=2.4;c.beginPath();c.moveTo(x,y-30);c.lineTo(x+15,y-10);c.lineTo(x+10,y+12);c.lineTo(x,y+22);c.lineTo(x-12,y+10);c.lineTo(x-15,y-10);c.closePath();c.fill();c.stroke();
 c.fillStyle='rgba(255,255,255,.65)';c.beginPath();c.moveTo(x-9,y-8);c.lineTo(x,y-24);c.lineTo(x+4,y-10);c.closePath();c.fill();
 c.fillStyle='#9b7a55';c.beginPath();c.ellipse(x,GROUND-2,18,5,0,0,TAU);c.fill();c.restore()}

// ───────────────────────────── Particles ─────────────────────────────
export const PALETTE={wood:['#d49a5a','#a86c34','#e8bb7f'],stone:['#a9b2b6','#7d878c','#cdd3d5'],glass:['rgba(200,245,255,.9)','rgba(140,215,235,.85)','rgba(255,255,255,.95)'],enemy:['#9fd05a','#6fa83f','#e3cf86'],boss:['#b88ad8','#7a4fa0','#ffd45e'],ground:['#d9b97f','#b48a55','#efdcae']};
export class Particles{
 constructor(){this.list=[];this.budget=260}
 setBudget(n){this.budget=n;if(this.list.length>n)this.list.length=n}
 add(p){if(this.list.length>=this.budget){// recycle the oldest cosmetic particle
   const i=this.list.findIndex(q=>q.type!=='text');if(i<0)return;this.list.splice(i,1)}
  this.list.push({vx:0,vy:0,a:0,va:0,g:0,drag:0,life:1,age:0,size:4,alpha:1,grow:0,...p})}
 update(dt){for(const p of this.list){p.age+=dt;p.vy+=p.g*dt;const d=Math.exp(-p.drag*dt);p.vx*=d;p.vy*=d;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.va*dt;p.size+=p.grow*dt;
   if(p.floor&&p.y>GROUND-2){p.y=GROUND-2;p.vy*=-.3;p.vx*=.6;p.va*=.5}}
  this.list=this.list.filter(p=>p.age<p.life)}
 draw(c){for(const p of this.list){const k=1-p.age/p.life;c.save();c.globalAlpha=p.alpha*(p.fade===false?1:Math.min(1,k*1.6));c.translate(p.x,p.y);c.rotate(p.a);
  switch(p.type){
   case'chip':c.fillStyle=p.color;c.fillRect(-p.size,-p.size*.35,p.size*2,p.size*.7);break;
   case'chunk':c.fillStyle=p.color;c.beginPath();c.moveTo(-p.size,-p.size*.4);c.lineTo(p.size*.2,-p.size);c.lineTo(p.size,p.size*.1);c.lineTo(-p.size*.1,p.size*.8);c.closePath();c.fill();c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=.8;c.stroke();break;
   case'shard':c.fillStyle=p.color;c.beginPath();c.moveTo(0,-p.size);c.lineTo(p.size*.55,p.size*.7);c.lineTo(-p.size*.45,p.size*.4);c.closePath();c.fill();c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=.7;c.stroke();break;
   case'dust':{const g=c.createRadialGradient(0,0,0,0,0,p.size);g.addColorStop(0,p.color);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();break}
   case'spark':c.strokeStyle=p.color;c.lineWidth=p.width||2;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(-p.vx*.03,-p.vy*.03);c.stroke();break;
   case'ring':c.strokeStyle=p.color;c.lineWidth=p.width||4;c.beginPath();c.arc(0,0,Math.max(1,p.size),0,TAU);c.stroke();break;
   case'star':c.fillStyle=p.color;c.beginPath();for(let i=0;i<10;i++){const r=i%2?p.size*.45:p.size,a=i/10*TAU-Math.PI/2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();break;
   case'bubble':c.strokeStyle=p.color;c.lineWidth=1.4;c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(-p.size*.35,-p.size*.35,p.size*.22,0,TAU);c.fill();break;
   case'feather':c.fillStyle=p.color;c.beginPath();c.ellipse(0,0,p.size,p.size*.35,0,0,TAU);c.fill();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.6;c.beginPath();c.moveTo(-p.size,0);c.lineTo(p.size,0);c.stroke();break;
   case'leaf':c.fillStyle=p.color;c.beginPath();c.moveTo(-p.size,0);c.quadraticCurveTo(0,-p.size*.7,p.size,0);c.quadraticCurveTo(0,p.size*.7,-p.size,0);c.fill();break;
   case'drop':c.fillStyle=p.color;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(-p.size*.3,-p.size*.3,p.size*.3,0,TAU);c.fill();break;
   case'flake':c.strokeStyle=p.color;c.lineWidth=1.2;for(let i=0;i<3;i++){c.rotate(Math.PI/3);c.beginPath();c.moveTo(-p.size,0);c.lineTo(p.size,0);c.stroke()}break;
   case'ember':{c.globalCompositeOperation='lighter';const g=c.createRadialGradient(0,0,0,0,0,p.size);g.addColorStop(0,'#fff3b0');g.addColorStop(.4,p.color);g.addColorStop(1,'rgba(255,80,0,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();break}
   case'puff':c.fillStyle=p.color;c.beginPath();c.arc(0,0,p.size,0,TAU);c.fill();break;
   case'text':c.rotate(-p.a);c.font=`900 ${p.size}px ui-rounded, system-ui, sans-serif`;c.textAlign='center';c.lineWidth=p.size*.22;c.strokeStyle='rgba(60,30,10,.85)';c.strokeText(p.text,0,0);c.fillStyle=p.color;c.fillText(p.text,0,0);break;
  }c.restore()}}
}
// Material-specific debris for a broken block.
export function breakBurst(fx,e,scale=1){const pal=PALETTE[e.kind]||PALETTE.wood,n=Math.round((e.kind==='glass'?16:12)*scale),size=Math.max(e.w,e.h);
 for(let i=0;i<n;i++){const t=i/n-.5,along=t*size,ca=Math.cos(e.a),sa=Math.sin(e.a),x=e.x+(e.w>=e.h?along*ca:-along*sa),y=e.y+(e.w>=e.h?along*sa:along*ca);
  fx.add({type:e.kind==='glass'?'shard':e.kind==='stone'?'chunk':'chip',x,y,vx:(e.vx||0)*.4+(Math.random()-.5)*260,vy:(e.vy||0)*.3-80-Math.random()*220,g:900,va:(Math.random()-.5)*16,a:Math.random()*6,size:e.kind==='stone'?3+Math.random()*4:2.5+Math.random()*4,color:pal[i%3],life:1+Math.random()*.7,floor:true})}
 for(let i=0;i<Math.round(5*scale);i++)fx.add({type:'dust',x:e.x+(Math.random()-.5)*size*.6,y:e.y+(Math.random()-.5)*10,vx:(Math.random()-.5)*60,vy:-20-Math.random()*30,drag:2,size:10+Math.random()*10,grow:26,color:e.kind==='glass'?'rgba(230,250,255,.7)':e.kind==='stone'?'rgba(200,200,195,.6)':'rgba(230,200,150,.6)',life:.8+Math.random()*.4,alpha:.8})}
export function popBurst(fx,e,scale=1){const pal=PALETTE[e.boss?'boss':'enemy'];
 for(let i=0;i<Math.round((e.boss?22:12)*scale);i++)fx.add({type:i%3?'chunk':'star',x:e.x,y:e.y,vx:(Math.random()-.5)*360,vy:-120-Math.random()*260,g:820,va:(Math.random()-.5)*14,size:i%3?3+Math.random()*3:5+Math.random()*3,color:i%3?pal[i%3]:'#fff6b0',life:.9+Math.random()*.5,floor:true});
 for(let i=0;i<Math.round(7*scale);i++)fx.add({type:'dust',x:e.x+(Math.random()-.5)*e.r,y:e.y+(Math.random()-.5)*e.r,vx:(Math.random()-.5)*90,vy:-30-Math.random()*40,drag:2.2,size:e.r*.6,grow:40,color:'rgba(240,240,230,.85)',life:.7+Math.random()*.4});
 fx.add({type:'ring',x:e.x,y:e.y,size:e.r,grow:220,width:3,color:'rgba(255,255,255,.85)',life:.35});
 fx.add({type:'text',x:e.x,y:e.y-e.r-8,vy:-46,drag:1.2,size:e.boss?26:18,text:'+'+e.points,color:e.boss?'#ffd45e':'#fff7c2',life:1.3,fade:true})}
export function impactDust(fx,x,y,kind,speed,scale=1){const n=Math.round(Math.min(6,speed/90)*scale);const col=kind==='glass'?'rgba(225,250,255,.6)':kind==='stone'?'rgba(210,210,205,.55)':kind==='ground'?'rgba(225,200,150,.6)':'rgba(230,200,150,.55)';
 for(let i=0;i<n;i++)fx.add({type:'dust',x:x+(Math.random()-.5)*12,y:y+(Math.random()-.5)*6,vx:(Math.random()-.5)*120,vy:-10-Math.random()*50,drag:2.5,size:5+Math.random()*7,grow:20,color:col,life:.55+Math.random()*.3});
 if(kind==='glass'&&speed>200)for(let i=0;i<3*scale;i++)fx.add({type:'shard',x,y,vx:(Math.random()-.5)*200,vy:-60-Math.random()*120,g:900,va:(Math.random()-.5)*14,size:2+Math.random()*2,color:PALETTE.glass[i%3],life:.7,floor:true})}

// Signature visuals for each hero's skill.
export function skillBurst(fx,species,x,y,scale=1){const R=Math.random,n=k=>Math.max(1,Math.round(k*scale));
 const ring=(size,grow,color,width=5,life=.45)=>fx.add({type:'ring',x,y,size,grow,color,width,life});
 switch(species){
  case 0:ring(14,260,'rgba(140,235,80,.9)',6);for(let i=0;i<n(14);i++)fx.add({type:'drop',x,y,vx:(R()-.5)*340,vy:(R()-.5)*340,g:600,size:3+R()*4,color:'#8ee34d',life:.7});for(let i=0;i<n(6);i++)fx.add({type:'spark',x:x-20,y:y+(R()-.5)*30,vx:-500,vy:0,color:'rgba(255,255,255,.8)',width:2,life:.25});break;
  case 1:ring(20,520,'rgba(120,220,255,.9)',6,.5);for(let i=0;i<n(22);i++){const a=R()*6.28,s=120+R()*300;fx.add({type:'bubble',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,drag:2.4,size:4+R()*9,color:'rgba(150,230,255,.95)',life:.8+R()*.4})}break;
  case 2:ring(30,640,'rgba(255,170,215,.8)',8,.55);for(let i=0;i<n(16);i++){const a=R()*6.28,s=200+R()*260;fx.add({type:'feather',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,drag:2,g:60,va:(R()-.5)*8,a:R()*6,size:5+R()*4,color:i%2?'#ffc2e2':'#ff8cc8',life:1.2+R()*.5})}break;
  case 3:ring(12,200,'rgba(220,230,90,.9)',5);for(let i=0;i<n(12);i++)fx.add({type:'leaf',x,y,vx:(R()-.2)*300,vy:(R()-.5)*280,g:240,drag:1.5,va:(R()-.5)*12,size:5+R()*3,color:i%2?'#6fc048':'#a8d84a',life:1.1});break;
  case 4:for(let i=0;i<n(10);i++)fx.add({type:'spark',x:x+(R()-.5)*30,y:y-30,vx:(R()-.5)*30,vy:900,color:'rgba(255,190,120,.9)',width:3,life:.22});ring(16,300,'rgba(255,150,80,.85)',7,.4);for(let i=0;i<n(10);i++)fx.add({type:'chunk',x,y:y+20,vx:(R()-.5)*260,vy:-80-R()*200,g:900,va:(R()-.5)*12,size:3+R()*3,color:i%2?'#5b4a44':'#e07848',life:1,floor:true});break;
  case 5:ring(20,460,'rgba(190,245,255,.95)',6,.6);for(let i=0;i<n(18);i++){const a=R()*6.28,s=80+R()*240;fx.add({type:'flake',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,drag:1.8,g:40,va:(R()-.5)*4,size:3+R()*4,color:'#e8fbff',life:1.1+R()*.5})}break;
  case 6:for(let i=0;i<n(14);i++)fx.add({type:'puff',x:x+(R()-.5)*40,y:y+(R()-.5)*40,vx:(R()-.5)*60,vy:-20-R()*40,drag:1.6,size:8+R()*10,grow:14,color:'rgba(150,90,220,.45)',life:.9});ring(18,240,'rgba(185,120,245,.8)',4,.5);break;
  case 7:{const gx=x;for(let i=0;i<n(18);i++)fx.add({type:'chunk',x:gx+(R()-.5)*360,y:GROUND-4,vx:(R()-.5)*80,vy:-160-R()*260,g:900,va:(R()-.5)*10,size:3+R()*4,color:i%2?'#8b6a3e':'#5f8f3a',life:1.1,floor:true});for(let i=0;i<n(8);i++)fx.add({type:'dust',x:gx+(R()-.5)*420,y:GROUND-8,vx:(R()-.5)*60,vy:-30,drag:2,size:14,grow:40,color:'rgba(210,180,120,.6)',life:1});fx.add({type:'ring',x:gx,y:GROUND-10,size:20,grow:620,width:6,color:'rgba(160,210,100,.8)',life:.5});break}
  case 8:for(let i=0;i<n(26);i++)fx.add({type:'drop',x:x+20+(R()-.5)*30,y:y+(R()-.5)*80,vx:380+R()*360,vy:(R()-.5)*160-60,g:500,size:3+R()*5,color:i%2?'#7ad7ff':'#c9f3ff',life:.9});ring(24,520,'rgba(90,200,240,.85)',8,.5);break;
  case 9:for(let i=0;i<n(16);i++){const a=R()*6.28;fx.add({type:'star',x,y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,drag:2.5,va:4,size:4+R()*4,color:i%2?'#ffe48a':'#fff8d8',life:.9})}break;
  case 10:ring(30,760,'rgba(255,170,70,.9)',10,.5);fx.add({type:'dust',x,y,size:60,grow:180,color:'rgba(255,230,160,.9)',life:.35});for(let i=0;i<n(26);i++){const a=R()*6.28,s=150+R()*420;fx.add({type:'ember',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,drag:1.8,g:120,size:6+R()*10,color:'#ff8a2a',life:.8+R()*.5})}for(let i=0;i<n(8);i++)fx.add({type:'dust',x:x+(R()-.5)*60,y:y+(R()-.5)*60,vx:(R()-.5)*80,vy:-60,drag:1.5,size:20,grow:50,color:'rgba(80,60,60,.45)',life:1.4});break;
 }}
// Gentle ambient particles that make each species read at a glance.
export function ambient(fx,species,x,y,flying){const R=Math.random;
 switch(species){
  case 0:if(flying)fx.add({type:'drop',x,y:y+10,vx:(R()-.5)*30,vy:20,g:500,size:2+R()*2,color:'#8ee34d',life:.5});break;
  case 1:fx.add({type:'bubble',x:x+(R()-.5)*30,y:y+(R()-.5)*30,vx:(R()-.5)*20,vy:-30,size:2+R()*3,color:'rgba(150,230,255,.9)',life:.8});break;
  case 2:fx.add({type:'feather',x,y,vx:(R()-.5)*40,vy:20,g:30,drag:2,va:3,size:3,color:'#ffc2e2',life:1});break;
  case 3:fx.add({type:'leaf',x,y:y-16,vx:(R()-.5)*40,vy:10,g:80,drag:2,va:5,size:3,color:'#8fd04a',life:1});break;
  case 4:if(flying)fx.add({type:'chunk',x,y,vx:(R()-.5)*40,vy:20,g:600,size:2,color:'#5b4a44',life:.6});break;
  case 5:fx.add({type:'flake',x:x+(R()-.5)*30,y:y+(R()-.5)*30,vx:(R()-.5)*20,vy:20,size:2+R()*2,color:'#ffffff',life:1});break;
  case 6:fx.add({type:'puff',x:x+(R()-.5)*20,y:y+(R()-.5)*20,vx:0,vy:-14,size:4,grow:8,color:'rgba(150,90,220,.35)',life:.8});break;
  case 7:fx.add({type:'leaf',x:x+(R()-.5)*30,y:y-10,vx:(R()-.5)*30,vy:10,g:60,drag:2,va:4,size:3,color:i2('#7fbf4a','#f6f2d8'),life:1.1});break;
  case 8:fx.add({type:'drop',x:x+(R()-.5)*30,y:y-20,vx:(R()-.5)*60,vy:-60,g:400,size:2,color:'#9be4ff',life:.7});break;
  case 9:fx.add({type:'star',x:x+(R()-.5)*36,y:y+(R()-.5)*36,va:3,size:2+R()*2,color:'#fff1a8',life:.7});break;
  case 10:fx.add({type:'ember',x:x+(R()-.5)*30,y:y+(R()-.5)*20,vx:(R()-.5)*30,vy:-40,size:3+R()*3,color:'#ff8a2a',life:.6});break;
 }}
function i2(a,b){return Math.random()<.7?a:b}
