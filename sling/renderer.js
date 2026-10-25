// Sling-only visual rig reused from Monster Merge b3afe41. No physics or game loop.
const ballKinds=[
{name:'Slimelet',r:15,artScale:2.3957,c1:'#83ed3a',value:2,asset:'./assets/monsters/01-slimelet.webp'},
{name:'Bubblo',r:20,artScale:2.34604,c1:'#50d5ff',value:4,asset:'./assets/monsters/02-bubblo.webp'},
{name:'Puffling',r:26,artScale:2.50111,c1:'#ff86c9',value:8,asset:'./assets/monsters/03-puffling.webp'},
{name:'Sproutiball',r:33,artScale:3.28399,c1:'#ffe75d',value:16,asset:'./assets/monsters/04-sproutiball.webp'},
{name:'Rockro',r:41,artScale:2.64509,c1:'#ff6945',value:32,asset:'./assets/monsters/05-rockro.webp'},
{name:'Frostbop',r:50,artScale:3.26568,c1:'#b7f1ff',value:64,asset:'./assets/monsters/06-frostbop.webp'},
{name:'Shadebub',r:60,artScale:3.20121,c1:'#be73f9',value:128,asset:'./assets/monsters/07-shadebub.webp'},
{name:'Groveling',r:70,artScale:2.95471,c1:'#b7de5e',value:256,asset:'./assets/monsters/08-groveling.webp'},
{name:'Tidalon',r:82,artScale:2.97948,c1:'#51c9f9',value:512,asset:'./assets/monsters/09-tidalon.webp'},
{name:'Lumiorb',r:95,artScale:2.88566,c1:'#ffdf7c',value:1024,asset:'./assets/monsters/10-lumiorb.webp'},
{name:'Infernodon',r:106,artScale:2.78328,c1:'#ff8b35',value:2048,asset:'./assets/monsters/11-infernodon.webp'}
];

const monsterImages=[],ballSprites=new Map();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const gameOver=false,dragging=false,box={danger:-10000};
function getBallSprite(level){
 if(ballSprites.has(level))return ballSprites.get(level);
 const im=monsterImages[level];if(!im)return null;
 const k=ballKinds[level],logical=k.r*k.artScale,side=Math.ceil(logical*2),sc=document.createElement('canvas');sc.width=sc.height=side;
 const c=sc.getContext('2d');c.imageSmoothingQuality='high';c.drawImage(im,0,0,side,side);
 const sp={body:sc,logical,r:k.r,side};
 const fa=faceAssets[level];
 if(fa){const bs=document.createElement('canvas');bs.width=bs.height=side;const bc=bs.getContext('2d');bc.imageSmoothingQuality='high';bc.drawImage(fa.bare,0,0,side,side);sp.bareS=bs;sp.face=fa}
 ballSprites.set(level,sp);return sp;
}
// ---- Living monsters: purely visual animation. Physics, radii and hit areas are never touched. ----
// Set MONSTER_UPRIGHT=false to bring back the old "rolling ball" look (full rotation).
const MONSTER_UPRIGHT=true;
let frameNow=0;
// Personality per level. br/sp = breathing size/speed, sw = idle sway, jel = jelly on impact,
// fl/fs = wing-flutter size/speed, glow = pulsing light.
const monsterMoves=[
 {br:.050,sp:2.6,sw:.050,jel:1.25,fl:0,fs:0,glow:0},      // Slimelet: wobbly jelly
 {br:.042,sp:3.2,sw:.040,jel:1.15,fl:0,fs:0,glow:0},      // Bubblo: bubbly bob
 {br:.045,sp:2.2,sw:.080,jel:1.0,fl:0,fs:0,glow:0},       // Puffling: fluffy sway
 {br:.040,sp:2.9,sw:.090,jel:.9,fl:0,fs:0,glow:0},        // Sproutiball: perky bounce
 {br:.016,sp:1.6,sw:.025,jel:.45,fl:0,fs:0,glow:0},       // Rockro: sturdy, barely squashes
 {br:.022,sp:1.4,sw:.035,jel:.55,fl:0,fs:0,glow:0},       // Frostbop: slow and chilly
 {br:.034,sp:2.0,sw:.050,jel:.8,fl:.022,fs:11,glow:0},    // Shadebub: fluttering wings
 {br:.030,sp:1.5,sw:.045,jel:.7,fl:0,fs:0,glow:0},        // Groveling: calm forest sway
 {br:.032,sp:1.3,sw:.040,jel:.8,fl:0,fs:0,glow:0},        // Tidalon: slow swimming sway
 {br:.030,sp:1.8,sw:.040,jel:.8,fl:.024,fs:9,glow:.16},   // Lumiorb: floaty, glowing
 {br:.028,sp:1.2,sw:.030,jel:.6,fl:.016,fs:7,glow:.18}    // Infernodon: slow menacing, glowing
];
// Impact "wobble": remembers the strongest recent hit; draw time turns it into a decaying jelly spring.
function jellyKick(b,j){const n=performance.now(),cur=(b.jig||0)*Math.exp(-(n-(b.jigT||0))/260);if(j>cur){b.jig=j;b.jigT=n}if(j>.17)faceEvent(b,'hurt',380);else if(j>.075)faceEvent(b,'surprise',300)}
function monsterPose(b,now){
 const m=monsterMoves[b.level]||monsterMoves[0],t=now/1000;
 const ph=b.ph??(b.ph=(((b.id??b.level)||0)*2.399)%6.2832);
 const vx=b.vx||0,vy=b.vy||0;
 // idle breathing (squash and stretch, anchored at the monster's feet)
 const br=Math.sin(t*m.sp*Math.PI+ph)*m.br;
 let sy=1+br,sx=1-br*.7;
 // stretch along motion: taller when falling, wider when sliding sideways
 const sv=Math.min(.16,Math.abs(vy)/2600)*m.jel,sh=Math.min(.10,Math.abs(vx)/3600)*m.jel;
 sy+=sv-sh*.5;sx+=sh-sv*.7;
 // jelly spring after hits and landings
 if(b.jig){const dt=now-(b.jigT||0),amp=b.jig*Math.exp(-dt/260)*Math.cos(dt/1000*19);sy-=amp*m.jel*.8;sx+=amp*m.jel*.64}
 // wing flutter
 if(m.fl){const f=Math.sin(t*m.fs+ph*2)*m.fl;sx*=1+f;sy*=1-f*.6}
 // pop-in when born from a merge
 if(b.popT){const dt=(now-b.popT)/1000;if(dt<.7){const s=1-Math.exp(-dt*9)*Math.cos(dt*20)*.35;sx*=s;sy*=s}}
 // lean into the direction of travel plus a lazy sway
 const lean=Math.max(-.3,Math.min(.3,vx*.0016)),tilt=lean+Math.sin(t*m.sp*Math.PI*.5+ph*1.3)*m.sw;
 return{sx,sy,tilt,glow:m.glow,ph};
}
// =====================================================================================
// LIVING FACES. Each sprite's eyes and mouth are cut out at load time and the skin under
// them is painted back in ("bare" sprite). At draw time the eyes and mouth are drawn back
// on top so they can blink, look around, widen, squint and react. Visual only.
// Rig coordinates are in the 512x512 source sprite: [centerX, centerY, radiusX, radiusY].
// t:'open' = painted open eyes; t:'closed' = painted happy crescents (they "peek" open).
const faceRig=[
 {t:'open',  e:[[194.5,236,34,38],[347.5,236.5,32,38]], m:[271.5,277,40,37]}, // Slimelet
 {t:'open',  e:[[181.5,209,35,41],[344,228,35,42]],     m:[257.5,249,39,34]}, // Bubblo
 {t:'closed',e:[[191,234,42,25],[353.5,220,42,24]],     m:[273,272.5,36,36]}, // Puffling
 {t:'open',  e:[[206.5,234,30,31],[334,233.5,30,31]],   m:[269,264,29,29]},   // Sproutiball
 {t:'open',  e:[[177,212,32,26],[320,223,35,23]],       m:[239.5,255.5,51,20]}, // Rockro (brows stay painted)
 {t:'closed',e:[[216.5,196,29,17],[345.5,183,25,15]],   m:[285.5,217.5,34,24]}, // Frostbop
 {t:'open',  e:[[218,229,27,21],[340,231,23,20]],       m:[284.5,256.5,28,24], ink:'#f6cdff'}, // Shadebub (light lines on dark fur)
 {t:'closed',e:[[249.5,169,26,12],[363,169.5,20,11]],   m:[310,192,46,9]},    // Groveling
 {t:'open',  e:[[201.5,174,20,21],[373,193.5,15,21]],   m:[292.5,200.5,53,32]}, // Tidalon
 {t:'closed',e:[[223,174,31,17],[346.5,168.5,26,15]],   m:[289,199.5,26,25]},   // Lumiorb
 {t:'open',  e:[[236,170,26,20],[354,170,22,19]],       m:[295,207,60,18], ink:'#ffc24a'}  // Infernodon (glowing lines on dark rock)
];
// Slime / liquid bodies: jelly ripple (A), top sway (C), oozing feet (B), drips, shine, inner bubbles.
const slimeKinds={
 0:{A:.040,C:.040,B:.055,w:3.0,shine:.55,drip:.45,bub:0,col:'#83ed3a',ink:'#2f7d12'},
 1:{A:.024,C:.022,B:.022,w:2.3,shine:.45,drip:.16,bub:4,col:'#62d9ff',ink:'#1b67b5'}
};
const faceAssets=[];
// Fill masked pixels smoothly from their surroundings (pyramid push-pull, then relaxation).
function pushPull(v,wt,w,h){
 if(w<=2&&h<=2){let s=[0,0,0],n=0;for(let i=0;i<w*h;i++)if(wt[i]>0){for(let k=0;k<3;k++)s[k]+=v[i*3+k]*wt[i];n+=wt[i]}
  for(let i=0;i<w*h;i++)if(wt[i]<1){for(let k=0;k<3;k++)v[i*3+k]=n?s[k]/n:128;wt[i]=1}return}
 const cw=(w+1)>>1,ch=(h+1)>>1,cv=new Float32Array(cw*ch*3),cwt=new Float32Array(cw*ch);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,a=wt[i];if(a<=0)continue;const c=(y>>1)*cw+(x>>1);for(let k=0;k<3;k++)cv[c*3+k]+=v[i*3+k]*a;cwt[c]+=a}
 for(let c=0;c<cw*ch;c++)if(cwt[c]>0){for(let k=0;k<3;k++)cv[c*3+k]/=cwt[c];cwt[c]=Math.min(1,cwt[c])}
 pushPull(cv,cwt,cw,ch);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,a=wt[i];if(a>=1)continue;
  let fx=Math.max(0,Math.min(cw-1,(x+.5)/2-.5)),fy=Math.max(0,Math.min(ch-1,(y+.5)/2-.5)),x0=fx|0,y0=fy|0,x1=Math.min(cw-1,x0+1),y1=Math.min(ch-1,y0+1),ax=fx-x0,ay=fy-y0;
  for(let k=0;k<3;k++){const s=(cv[(y0*cw+x0)*3+k]*(1-ax)+cv[(y0*cw+x1)*3+k]*ax)*(1-ay)+(cv[(y1*cw+x0)*3+k]*(1-ax)+cv[(y1*cw+x1)*3+k]*ax)*ay;v[i*3+k]=v[i*3+k]*a+s*(1-a)}wt[i]=1}
}
function buildFaceAssets(level,im){
 const rig=faceRig[level];if(!rig)return null;
 const N=512,cv=document.createElement('canvas');cv.width=cv.height=N;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(im,0,0,N,N);
 const img=c.getImageData(0,0,N,N),d=img.data,orig=new Uint8ClampedArray(d);
 const feats=[...rig.e.map((e,i)=>({kind:'eye',i,e})),{kind:'mouth',i:0,e:rig.m}];
 const K=1.22,mask=new Uint8Array(N*N);let X0=N,Y0=N,X1=0,Y1=0;
 for(const f of feats){const[cx,cy,rx,ry]=f.e;for(let y=Math.max(0,Math.floor(cy-ry*K));y<=Math.min(N-1,Math.ceil(cy+ry*K));y++)for(let x=Math.max(0,Math.floor(cx-rx*K));x<=Math.min(N-1,Math.ceil(cx+rx*K));x++){const q=((x-cx)/(rx*K))**2+((y-cy)/(ry*K))**2;if(q<=1){mask[y*N+x]=1;X0=Math.min(X0,x);Y0=Math.min(Y0,y);X1=Math.max(X1,x);Y1=Math.max(Y1,y)}}}
 X0=Math.max(0,X0-3);Y0=Math.max(0,Y0-3);X1=Math.min(N-1,X1+3);Y1=Math.min(N-1,Y1+3);
 const w=X1-X0+1,h=Y1-Y0+1,v=new Float32Array(w*h*3),wt=new Float32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=(y+Y0)*N+x+X0,i=y*w+x;for(let k=0;k<3;k++)v[i*3+k]=d[j*4+k];wt[i]=mask[j]?0:1}
 pushPull(v,wt,w,h);
 for(let it=0;it<36;it++)for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const j=(y+Y0)*N+x+X0;if(!mask[j])continue;const i=y*w+x;for(let k=0;k<3;k++)v[i*3+k]=(v[(i-1)*3+k]+v[(i+1)*3+k]+v[(i-w)*3+k]+v[(i+w)*3+k])*.25}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=(y+Y0)*N+x+X0;if(!mask[j])continue;const i=y*w+x;for(let k=0;k<3;k++)d[j*4+k]=v[i*3+k]}
 c.putImageData(img,0,0);
 const out={bare:cv,t:rig.t,feats:[]};
 for(const f of feats){const[cx,cy,rx,ry]=f.e,PK=1.2,px=Math.max(0,Math.floor(cx-rx*PK)),py=Math.max(0,Math.floor(cy-ry*PK)),pw=Math.min(N,Math.ceil(cx+rx*PK))-px,ph=Math.min(N,Math.ceil(cy+ry*PK))-py;
  const pc=document.createElement('canvas');pc.width=pw;pc.height=ph;const pctx=pc.getContext('2d'),pd=pctx.createImageData(pw,ph),lums=[];
  for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const j=((y+py)*N+x+px)*4,o=(y*pw+x)*4,rho=Math.sqrt(((x+px-cx)/rx)**2+((y+py-cy)/ry)**2),fa=rho<=1?1:rho>=1.17?0:1-(rho-1)/.17;
   pd.data[o]=orig[j];pd.data[o+1]=orig[j+1];pd.data[o+2]=orig[j+2];pd.data[o+3]=orig[j+3]*fa;if(rho<1&&orig[j+3]>200)lums.push([.299*orig[j]+.587*orig[j+1]+.114*orig[j+2],orig[j],orig[j+1],orig[j+2]])}
  pctx.putImageData(pd,0,0);lums.sort((a,b)=>a[0]-b[0]);const n=Math.max(1,Math.floor(lums.length*.12));let r=0,g=0,bl=0;for(let k=0;k<n;k++){r+=lums[k][1];g+=lums[k][2];bl+=lums[k][3]}
  const dark=k=>Math.round(k/n*.8);out.feats.push({kind:f.kind,i:f.i,cx,cy,rx,ry,px,py,pw,ph,patch:pc,lid:rig.ink||`rgb(${dark(r)},${dark(g)},${dark(bl)})`})}
 return out}
// Shared per-frame context: what the monsters can look at.
let faceCtx={held:false},attention=null;const heldBall={x:0,y:0,r:15,level:-1,vx:0,vy:0,held:true};
const MOOD_PRI={hurt:3,surprise:2,happy:2,dizzy:2};
function faceEvent(b,k,ms){const n=performance.now();if(n<(b.moodUntil||0)&&MOOD_PRI[b.moodK]>MOOD_PRI[k])return;b.moodK=k;b.moodUntil=n+ms}
const ease=t=>t<=0?0:t>=1?1:1+2.7*(t-1)**3+1.7*(t-1)**2; // easeOutBack
function faceState(b,now){
 let f=b.face;if(!f)f=b.face={blinkAt:now+400+Math.random()*3200,blink0:-1,lx:0,ly:.15,tx:0,ty:.15,wanderAt:0,peekAt:now+1500+Math.random()*6000,peek0:-1e9,open:0,sweat:0,last:now};
 const dt=Math.min(.1,Math.max(0,(now-f.last)/1000));f.last=now;
 const rig=faceRig[b.level],vy=b.vy||0;
 let mood=now<(b.moodUntil||0)?b.moodK:null;
 const falling=!b.held&&!b.contact&&vy>380&&b.entered!==undefined;
 const worried=!b.held&&!gameOver&&((b.danger||0)>.05||(b.entered&&b.y-b.r<box.danger+14&&Math.hypot(b.vx||0,vy)<60));
 if(!mood){if(falling)mood='surprise';else if(worried)mood='worried';else if(b.held&&dragging)mood='excited'}
 // where to look
 let tx=null,ty=null;
 if(b.held){tx=Math.max(-.6,Math.min(.6,(b.vx||0)/120));ty=.95}
 else if(mood==='worried'){tx=Math.sin(now/230+(b.id||0))*.9;ty=-.75}
 else if(falling){tx=0;ty=1}
 else{let px=null,py=null,best=1e9;
  if(faceCtx.held){px=faceCtx.hx;py=faceCtx.hy}
  else if(attention&&now-attention.t<1000&&Math.hypot(attention.x-b.x,attention.y-b.y)<300){px=attention.x;py=attention.y}
  else for(const o of faceCtx.fast||[]){if(o===b)continue;const dd=Math.hypot(o.x-b.x,o.y-b.y);if(dd<260&&dd<best){best=dd;px=o.x;py=o.y}}
  if(px!==null){const dx=px-b.x,dy=py-b.y,dl=Math.hypot(dx,dy)||1;if(dl>b.r*.6){tx=dx/dl;ty=dy/dl}}}
 if(tx===null){if(now>f.wanderAt){f.wanderAt=now+1100+Math.random()*2800;const r=Math.random();if(r<.35){f.tx=0;f.ty=.2}else{f.tx=Math.random()*2-1;f.ty=Math.random()*1.3-.65}}}
 else{f.tx=tx;f.ty=ty}
 const k=1-Math.exp(-dt*15);f.lx+=(f.tx-f.lx)*k;f.ly+=(f.ty-f.ly)*k;
 // blinking
 if(f.blink0<0&&now>=f.blinkAt)f.blink0=now;
 let lid=0;if(f.blink0>=0){const t=now-f.blink0,D=170;if(t<D)lid=t<D*.4?t/(D*.4):1-(t-D*.4)/(D*.6);else{f.blink0=-1;const quick=Math.random()<.16;f.blinkAt=now+(quick?120:mood==='worried'?450+Math.random()*600:1700+Math.random()*3800)}}
 // painted-closed eyes peek open now and then, and pop open when startled
 if(rig&&rig.t==='closed'){if(now>=f.peekAt){f.peek0=now;f.peekAt=now+5200+Math.random()*7500}
  const want=(mood==='surprise'||mood==='worried'||mood==='excited'||now-f.peek0<1150)?1:0;f.open+=(want-f.open)*(1-Math.exp(-dt*(want?13:8)))}
 f.sweat+=((mood==='worried'?1:0)-f.sweat)*(1-Math.exp(-dt*6));
 const ph=b.ph??0,talk=Math.sin(now/1000*2.4+ph);
 let msx=1,msy=1+.05*talk,wide=0;
 if(mood==='surprise'){msx=.84;msy=1.3;wide=1}
 else if(mood==='hurt'){msx=1.12;msy=.72}
 else if(mood==='happy'){msx=1.08;msy=1.22}
 else if(mood==='worried'){msx=.9;msy=.84+.05*Math.sin(now/45);wide=.35}
 else if(mood==='excited'){msx=1.04;msy=1.18;wide=.45}
 if(mood==='worried'||mood==='hurt')lid=Math.max(lid,mood==='hurt'?0:.12);
 const jit=mood==='worried'?1.2:0;
 return{lx:f.lx,ly:f.ly,lid,wide,mood,open:ease(f.open),msx,msy,jx:(Math.random()-.5)*jit,jy:(Math.random()-.5)*jit,sweat:f.sweat,now}}
// Draw eyes + mouth. (u,v) in 512 sprite space maps to (ox+u*q, oy+v*q) on context c.
// wp (optional): slime warp, v(0..1 down the sprite) -> [horizontal scale, horizontal shift]; keeps the face glued to the wobbling body.
function drawFace(c,fa,f,q,ox,oy,wp){
 for(const ft of fa.feats){
  const w=wp?wp(ft.cy/512):null,kx=w?w[0]:1,X=(ox+ft.cx*q)*kx+(w?w[1]:0),Y=oy+ft.cy*q,RX=ft.rx*q*kx,RY=ft.ry*q,pd=(dx,dy,sx,sy,ay)=>{c.save();c.translate(X+dx,Y+ay+dy);c.scale(sx*kx,sy);c.drawImage(ft.patch,(ft.px-ft.cx)*q,(ft.py-ft.cy)*q-ay,ft.pw*q,ft.ph*q);c.restore()};
  if(ft.kind==='mouth'){const ay=-RY*.55;pd(0,0,f.msx,f.msy,ay);continue}
  const side=ft.i===0?1:-1,lw=Math.max(1,Math.min(RX,RY)*.24);
  c.lineCap='round';c.lineJoin='round';c.strokeStyle=ft.lid;
  if(f.mood==='hurt'){c.lineWidth=lw;c.beginPath();c.moveTo(X-RX*.5*side,Y-RY*.55);c.lineTo(X+RX*.42*side,Y);c.lineTo(X-RX*.5*side,Y+RY*.55);c.stroke();continue}
  if(f.mood==='happy'&&fa.t==='open'){c.lineWidth=lw;c.beginPath();c.ellipse(X,Y+RY*.3,RX*.78,RY*.62,0,Math.PI*1.1,Math.PI*1.9);c.stroke();continue}
  const dx=f.lx*RX*.17+f.jx*q,dy=f.ly*RY*.15+f.jy*q;
  if(fa.t==='open'){
   const sc=1+f.wide*.16,sq=Math.max(.07,1-f.lid),ay=RY*.3;
   pd(dx,dy,sc,sc*sq,ay);
   if(f.lid>.45){c.globalAlpha*=1;c.save();c.globalAlpha*=Math.min(1,(f.lid-.45)/.4);c.lineWidth=lw*.9;c.beginPath();c.ellipse(X+dx,Y+ay*.85+dy,RX*.86*sc,RY*.32,0,Math.PI*.08,Math.PI*.92);c.stroke();c.restore()}
  }else{
   const o=f.open;
   if(o<.98){c.save();c.globalAlpha*=1-o;pd(dx*.35,dy*.35,f.mood==='happy'?1.12:1,f.mood==='happy'?1.12:1,0);c.restore()}
   if(o>.02){const er=RX*.6*o,eh=RX*.74*o*Math.max(.08,1-f.lid),ex=X+dx*1.4,ey=Y+RY*.1+dy*1.4;
    c.save();const g=c.createRadialGradient(ex-er*.3,ey-eh*.35,er*.1,ex,ey,Math.max(er,eh));g.addColorStop(0,'#4a3a52');g.addColorStop(1,'#120c18');
    c.fillStyle=g;c.beginPath();c.ellipse(ex,ey,er,eh,0,0,Math.PI*2);c.fill();
    if(eh>er*.35){c.fillStyle='#fff';c.beginPath();c.ellipse(ex-er*.32,ey-eh*.38,er*.34,Math.min(er*.34,eh*.3),0,0,Math.PI*2);c.fill();c.globalAlpha*=.8;c.beginPath();c.arc(ex+er*.28,ey+eh*.3,er*.14,0,Math.PI*2);c.fill()}
    c.restore()}
  }
  if(ft.i===1&&f.sweat>.03){const s=f.sweat,dr=Math.max(2,RY*.38),sxp=X+RX*1.2,syp=Y-RY*.7+((f.now/900)%1)*RY*.9;
   c.save();c.globalAlpha*=s*.95;c.fillStyle='#a8ecff';c.strokeStyle='#2b86c4';c.lineWidth=Math.max(.8,dr*.22);c.beginPath();c.moveTo(sxp,syp-dr*1.6);c.quadraticCurveTo(sxp+dr,syp-dr*.1,sxp,syp+dr*.55);c.quadraticCurveTo(sxp-dr,syp-dr*.1,sxp,syp-dr*1.6);c.fill();c.stroke();
   c.fillStyle='#fff';c.beginPath();c.arc(sxp-dr*.3,syp-dr*.2,dr*.22,0,Math.PI*2);c.fill();c.restore()}
 }}
// Slime: the bare body is drawn in horizontal strips that ripple, sway at the top and ooze at the feet.
// Face, shine and inner bubbles are drawn on top using the same warp. No per-frame scratch canvas (cheap).
let glowDot=null;function getGlowDot(){if(glowDot)return glowDot;const g=document.createElement('canvas');g.width=g.height=64;const c=g.getContext('2d'),gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,64,64);return glowDot=g}
function slimeWarp(b,now,cfg,size){
 const t=now/1000,ph=b.ph??0,jig=b.jig?b.jig*Math.exp(-(now-(b.jigT||0))/300):0,ooze=.5+.5*Math.sin(t*1.3+ph),A=cfg.A+jig*.35,C=size*(cfg.C+jig*.12);
 return v=>{const bot=Math.max(0,(v-.62)/.38);return[1+A*Math.sin(t*cfg.w-v*7+ph)*(.35+.65*v)+cfg.B*ooze*bot*bot,C*Math.sin(t*cfg.w*.62+v*2.2+ph)*Math.pow(1-v,1.3)]}}
function drawSlime(c,sp,b,f,now,cfg,size){
 const wp=slimeWarp(b,now,cfg,size),img=sp.bareS,S=img.width,n=Math.max(9,Math.min(16,Math.round(S/9))),hS=S/n,hD=size/n,r=b.r,t=now/1000,ph=b.ph??0;
 for(let i=0;i<n;i++){const[sx,sh]=wp((i+.5)/n),dw=size*sx;c.drawImage(img,0,i*hS,S,hS+.5,-dw/2+sh,-size/2+i*hD,dw,hD+.6)}
 if(f)drawFace(c,sp.face,f,size/512,-size/2,-size/2,wp);
 const at=(x,y)=>{const w=wp(.5+y/size);return[x*w[0]+w[1],y]};
 if(cfg.shine){const gd=getGlowDot();let[gx,gy]=at(-.38*r+.12*r*Math.sin(t*.9+ph),-.45*r+.06*r*Math.cos(t*1.3+ph)),R=.34*r;
  c.save();c.globalAlpha*=cfg.shine*.6;c.drawImage(gd,gx-R,gy-R,R*2,R*2);[gx,gy]=at(.32*r*Math.sin(t*.55+ph*2),.38*r);R=.15*r;c.globalAlpha*=.55;c.drawImage(gd,gx-R,gy-R,R*2,R*2);c.restore()}
 for(let k=0;k<cfg.bub;k++){const p=(t*.22+k/cfg.bub+ph*.1)%1,[bx,by]=at((k%2?.6:-.6)*r+Math.sin(t*2+k*3)*.05*r,(.55-.7*p)*r),br=(.05+.03*(k%3))*r;
  c.save();c.globalAlpha*=Math.sin(p*Math.PI)*.7;c.strokeStyle='#fff';c.lineWidth=Math.max(.7,br*.3);c.fillStyle='rgba(255,255,255,.2)';c.beginPath();c.arc(bx,by,br,0,Math.PI*2);c.fill();c.stroke();c.restore()}}
// Slime drips: a blob that swells at the bottom edge, stretches, lets go and falls.
function drawDrips(c,b,now,cfg){
 const r=b.r,still=b.contact&&Math.hypot(b.vx||0,b.vy||0)<30;let ds=b.drips||(b.drips=[]);
 if(still&&ds.length<2&&Math.random()<cfg.drip/30)ds.push({x:(Math.random()-.5)*1.1,t0:now,grow:900+Math.random()*700});
 for(let i=ds.length-1;i>=0;i--){const d=ds[i],t=now-d.t0,x=d.x*r,base=r*.86;let y,len,rad=r*.13,al=1;
  if(t<d.grow){const g=t/d.grow;len=r*.04+r*.14*g*g;y=base}else{const ft=(t-d.grow)/1000;if(ft>.38){ds.splice(i,1);continue}len=r*.1;y=base+r*.18+Math.min(r*.45,420*ft*ft);al=1-ft/.38;rad*=.85-ft}
  c.save();c.globalAlpha*=al;c.fillStyle=cfg.col;c.strokeStyle=cfg.ink;c.lineWidth=Math.max(.8,r*.035);c.beginPath();
  if(t<d.grow){c.moveTo(x-rad*1.1,y-rad*.4);c.quadraticCurveTo(x-rad,y+len*.6,x-rad*.85,y+len);c.arc(x,y+len,rad*.85,Math.PI,0,true);c.quadraticCurveTo(x+rad,y+len*.6,x+rad*1.1,y-rad*.4);c.fill();c.stroke()}
  else{c.ellipse(x,y,rad*.8,rad*1.05,0,0,Math.PI*2);c.fill();c.stroke()}
  c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(x-rad*.3,(t<d.grow?y+len:y)-rad*.3,rad*.25,0,Math.PI*2);c.fill();c.restore()}}
function drawRealFruit(c,b,alpha=1,live=false){const sp=getBallSprite(b.level);if(!sp)return;
 const size=sp.logical*b.r/sp.r;c.save();c.globalAlpha*=alpha;
 if(live&&!reducedMotion){
  const now=frameNow||performance.now(),p=monsterPose(b,now),foot=b.r*.985;
  c.translate(b.x,b.y+foot);c.rotate(MONSTER_UPRIGHT?p.tilt:(b.rot||0)+p.tilt);c.scale(p.sx,p.sy);c.translate(0,-foot);
  const f=sp.face?faceState(b,now):null;if(f&&b.asleep){f.lid=1;f.open=0;f.mood=null;f.msx=.9;f.msy=.8}const cfg=slimeKinds[b.level];
  if(cfg&&sp.face){drawSlime(c,sp,b,f,now,cfg,size);drawDrips(c,b,now,cfg)}
  else if(sp.face){c.drawImage(sp.bareS,-size/2,-size/2,size,size);drawFace(c,sp.face,f,size/512,-size/2,-size/2)}
  else c.drawImage(sp.body,-size/2,-size/2,size,size);
  if(p.glow){c.globalCompositeOperation='lighter';c.globalAlpha*=p.glow*(.6+.4*Math.sin(now/1000*2.2+p.ph));c.drawImage(sp.bareS||sp.body,-size/2,-size/2,size,size)}
 }else{c.translate(b.x,b.y);c.rotate(b.rot||0);c.drawImage(sp.body,-size/2,-size/2,size,size)}
 c.restore();}

export async function prepareMonster(level){
 if(monsterImages[level])return;
 const im=new Image();im.src=ballKinds[level].asset;await im.decode();
 monsterImages[level]=im;faceAssets[level]=buildFaceAssets(level,im);getBallSprite(level);
}
export function paintMonster(c,b,now,pointer){frameNow=now;faceCtx={held:!!pointer,hx:pointer?.x,hy:pointer?.y};drawRealFruit(c,b,1,true)}
export function react(b,mood,ms=1600){faceEvent(b,mood,ms);b.jig=.12;b.jigT=performance.now()}
