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
 {key:'shore',sky:['#1b95ee','#55c2fb','#c4f0ff'],sun:'#fffbe0',sea:['#0f9fd8','#28c4e6','#9af2ee'],far:['#4f9b78','#b9e6dc'],cliff:['#d2a676','#a0744c','#7a5434'],fall:'#f2fdff',mid:'#2f9a46',midDark:'#1d7535',back:'#4fbf44',top:'#7fdc48',lip:'#3ca836',soil:['#c79a66','#a77a50','#875e3e'],rock:'#b8a48c',fg:'#2f9a3e',fgDark:'#1b6c2a',props:'palm'},
 {key:'bamboo',sky:['#2ba6db','#7ad6ea','#dcf7e0'],sun:'#fffbe0',sea:['#159ec2','#3ec6d0','#acefd8'],far:['#4a8c68','#a8d8c2'],cliff:['#b9a07a','#8e7656','#6a563e'],fall:'#f2fdff',mid:'#3e8a42',midDark:'#28642e',back:'#64b84a',top:'#8ad84c',lip:'#4a9c32',soil:['#b99062','#957049','#73533a'],rock:'#a99070',fg:'#357a2e',fgDark:'#21511c',props:'bamboo'},
 {key:'frost',sky:['#2f97ec','#86cdff','#eaf9ff'],sun:'#ffffff',sea:['#1985cc','#4fb6e6','#c8f0ff'],far:['#8bb6d8','#dbeefa'],cliff:['#cfe6f6','#9cc4e0','#7aa2c4'],fall:'#e4f9ff',mid:'#6aa8d0',midDark:'#4a86b0',back:'#bfe2f4',top:'#ffffff',lip:'#bfe3f6',soil:['#b2d4ea','#8ab4d2','#6c94b4'],rock:'#a8c8de',fg:'#6fa8cc',fgDark:'#4c84aa',props:'ice'},
 {key:'grove',sky:['#2f2f86','#8a5cbc','#ffadc0'],sun:'#ffe0f0',sea:['#4848a4','#7a62c4','#d8a4d8'],far:['#4a3f88','#8a76c0'],cliff:['#8a74b8','#66549a','#4a3c78'],fall:'#d8c4ff',mid:'#3a3376',midDark:'#272258',back:'#4f8a66',top:'#7fdc7a',lip:'#3ea05e',soil:['#7d6c9c','#5f507e','#45395f'],rock:'#8a7aa0',fg:'#2b5a4a',fgDark:'#183a30',props:'grove'},
 {key:'ember',sky:['#ff7d45','#ffb46c','#ffe4ac'],sun:'#fff3c8',sea:['#d65a36','#f28a48','#ffc486'],far:['#9a5244','#d29280'],cliff:['#8a5644','#6a3c30','#4c2a22'],fall:'#ff9a2a',mid:'#5e3a36',midDark:'#432826',back:'#8a5c46',top:'#a6866a',lip:'#6c4c3a',soil:['#7d5242','#5c3b31','#402823'],rock:'#7a5546',fg:'#4a302a',fgDark:'#2e1c18',props:'ember'}
];

// ───────────────────────────── Scenery ─────────────────────────────
function wave(c,P,base,amp,freqs,seed,color,flat=0){const r=rng(seed),ph=freqs.map(()=>r()*TAU);c.fillStyle=color;c.beginPath();c.moveTo(0,base+400);for(let x=0;x<=P;x+=8){let y=0;freqs.forEach((f,i)=>y+=Math.sin(x/P*TAU*f+ph[i])/(i+1));c.lineTo(x,base-Math.max(flat,(y*.5+.6))*amp)}c.lineTo(P,base+400);c.closePath();c.fill()}
function palm(c,x,base,h,lean,trunk,leaf,dark){c.save();c.translate(x,base);c.strokeStyle=trunk;c.lineCap='round';const tx=lean*h,ty=-h;for(let i=0;i<9;i++){const t=i/9,t2=(i+1)/9;c.lineWidth=lerp(h*.075,h*.04,t);c.beginPath();c.moveTo(tx*t*t,ty*t);c.lineTo(tx*t2*t2,ty*t2);c.stroke()}c.translate(tx,ty);for(let i=0;i<7;i++){const a=-Math.PI*.95+i*Math.PI*.95/6+(i%2)*.1,len=h*(.55+.12*(i%3));c.fillStyle=i%2?leaf:dark;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(Math.cos(a)*len*.6,Math.sin(a)*len*.6-h*.18,Math.cos(a)*len,Math.sin(a)*len+h*.12);c.quadraticCurveTo(Math.cos(a)*len*.5,Math.sin(a)*len*.5-h*.02,0,0);c.fill()}c.fillStyle=dark;c.beginPath();c.arc(0,4,h*.05,0,TAU);c.fill();c.restore()}
function bamboo(c,x,base,h,col,dark){c.save();c.translate(x,base);const w=h*.035;for(let y=0;y>-h;y-=h*.12){c.fillStyle=col;c.fillRect(-w,y-h*.12+2,w*2,h*.12-2);c.fillStyle=dark;c.fillRect(-w*1.15,y-h*.12-1,w*2.3,3)}c.fillStyle=dark;for(let i=0;i<4;i++){const y=-h*(.3+i*.17),s=i%2?1:-1;c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(s*h*.12,y-h*.05,s*h*.2,y+h*.02);c.quadraticCurveTo(s*h*.1,y+h*.01,0,y);c.fill()}c.restore()}
function spire(c,x,base,h,w,col,light){c.fillStyle=col;c.beginPath();c.moveTo(x-w,base);c.lineTo(x-w*.25,base-h*.7);c.lineTo(x,base-h);c.lineTo(x+w*.3,base-h*.65);c.lineTo(x+w,base);c.fill();c.fillStyle=light;c.beginPath();c.moveTo(x,base-h);c.lineTo(x+w*.3,base-h*.65);c.lineTo(x+w*.1,base-h*.2);c.lineTo(x-w*.05,base-h*.55);c.fill()}
function roundTree(c,x,base,h,col,dark,glow){c.fillStyle=dark;c.fillRect(x-h*.04,base-h*.55,h*.08,h*.55);for(const [dx,dy,r] of[[0,-.7,.32],[-.22,-.55,.24],[.22,-.56,.25],[0,-.45,.22]]){c.fillStyle=dy<-.6?col:dark;c.beginPath();c.arc(x+dx*h,base+dy*h,r*h,0,TAU);c.fill()}if(glow){c.fillStyle=glow;for(let i=0;i<4;i++){c.beginPath();c.arc(x+(i-1.5)*h*.12,base-h*(.5+.12*(i%2)),h*.025,0,TAU);c.fill()}}}
function boulder(c,x,base,w,h,col,light){c.fillStyle=col;c.beginPath();c.moveTo(x-w/2,base);c.quadraticCurveTo(x-w*.55,base-h*.8,x-w*.1,base-h);c.quadraticCurveTo(x+w*.45,base-h*1.02,x+w/2,base);c.fill();c.fillStyle=light;c.globalAlpha*=.35;c.beginPath();c.ellipse(x-w*.15,base-h*.7,w*.18,h*.15,-.4,0,TAU);c.fill();c.globalAlpha/=.35}

// Flat-topped cliff with a grassy (or snowy) cap, rock striations and an optional waterfall.
function cliff(c,x,base,w,h,th,falls,r,far){const top=base-h,[lt,md,dk]=th.cliff;
 const g=c.createLinearGradient(0,top,0,base);g.addColorStop(0,lt);g.addColorStop(.55,md);g.addColorStop(1,dk);c.fillStyle=g;
 c.beginPath();c.moveTo(x-w*.62,base);c.lineTo(x-w*.56,top+h*.35);c.quadraticCurveTo(x-w*.58,top+h*.08,x-w*.48,top);c.lineTo(x+w*.5,top);c.quadraticCurveTo(x+w*.6,top+h*.1,x+w*.55,top+h*.4);c.lineTo(x+w*.66,base);c.closePath();c.fill();
 c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=3;for(let i=0;i<6;i++){const sx=x-w*.45+i*w*.18+(r()-.5)*10;c.beginPath();c.moveTo(sx,top+18+r()*20);c.lineTo(sx+(r()-.5)*14,base-r()*30);c.stroke()}
 c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.moveTo(x-w*.48,top+8);c.lineTo(x-w*.3,top+8);c.lineTo(x-w*.42,base-h*.3);c.lineTo(x-w*.54,base-h*.3);c.fill();
 // cap
 c.fillStyle=th.top;c.beginPath();c.moveTo(x-w*.56,top+10);for(let k=0;k<=8;k++){const px=x-w*.56+k*w*1.12/8;c.quadraticCurveTo(px-w*.07,top+22+(k%2)*8,px,top+12)}c.lineTo(x+w*.56,top-6);c.quadraticCurveTo(x,top-16,x-w*.56,top-6);c.fill();
 if(th.props==='palm'||th.props==='bamboo'){for(let k=0;k<2;k++){const px=x-w*.25+k*w*.4+(r()-.5)*20;if(th.props==='palm')palm(c,px,top-4,50+r()*30,(r()-.5)*.6,th.midDark,th.mid,th.midDark);else bamboo(c,px,top-4,60+r()*40,th.mid,th.midDark)}}
 if(falls){const fx=x+(r()-.5)*w*.4,fw=w*(.1+r()*.08);const fg=c.createLinearGradient(fx-fw,0,fx+fw,0);fg.addColorStop(0,th.fall+'aa');fg.addColorStop(.5,th.fall);fg.addColorStop(1,th.fall+'aa');c.fillStyle=fg;c.beginPath();c.moveTo(fx-fw*.8,top+2);c.lineTo(fx+fw*.8,top+2);c.lineTo(fx+fw,base-6);c.lineTo(fx-fw,base-6);c.fill();
  c.strokeStyle=th.key==='ember'?'rgba(255,240,180,.7)':'rgba(255,255,255,.75)';c.lineWidth=2;for(let k=0;k<4;k++){const lx=fx-fw*.6+k*fw*.4;c.beginPath();c.moveTo(lx,top+8);c.lineTo(lx+2,base-14);c.stroke()}
  c.fillStyle=th.key==='ember'?'rgba(255,190,120,.6)':'rgba(255,255,255,.75)';for(let k=0;k<5;k++){c.beginPath();c.arc(fx+(k-2)*fw*.7,base-6-(k%2)*6,fw*.7,0,TAU);c.fill()}}
}
// Small rocky islet with grass, a prop and surf around the base.
function islet(c,x,base,w,h,th,r){c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(x,base+4,w*.75,10,0,0,TAU);c.fill();
 const [lt,md,dk]=th.cliff,g=c.createLinearGradient(0,base-h,0,base);g.addColorStop(0,lt);g.addColorStop(1,dk);c.fillStyle=g;c.beginPath();c.moveTo(x-w*.62,base);c.quadraticCurveTo(x-w*.62,base-h*.9,x-w*.3,base-h);c.lineTo(x+w*.35,base-h);c.quadraticCurveTo(x+w*.66,base-h*.8,x+w*.62,base);c.fill();
 c.fillStyle=th.top;c.beginPath();c.moveTo(x-w*.42,base-h+8);c.quadraticCurveTo(x,base-h-14,x+w*.46,base-h+8);c.quadraticCurveTo(x,base-h+16,x-w*.42,base-h+8);c.fill();
 const t=base-h+2;if(th.props==='palm')palm(c,x+(r()-.5)*w*.3,t,70+r()*50,(r()-.5)*.6,th.midDark,th.mid,th.midDark);else if(th.props==='bamboo')bamboo(c,x,t,90+r()*50,th.mid,th.midDark);else if(th.props==='ice')spire(c,x,t,50+r()*40,18,th.mid,'#fff');else if(th.props==='grove')roundTree(c,x,t,70+r()*40,th.mid,th.midDark,'rgba(255,240,160,.9)');else boulder(c,x,t,40,30,th.rock,'#fff')}

function buildLayers(th,seed){
 const L={};const R=1;
 // Far: tall flat-topped sea cliffs with waterfalls (lava falls on Ember Summit), softened by haze.
 {const P=2000,H=560,[cv,c]=canvas(P*R,H*R);c.scale(R,R);const r=rng(seed+1);
  if(th.key==='ember'){for(const o of[-P,0,P]){c.fillStyle=th.far[0];c.beginPath();c.moveTo(o+420,H);c.lineTo(o+860,H-420);c.lineTo(o+960,H-420);c.lineTo(o+1420,H);c.fill();c.fillStyle='#ffb36b';c.beginPath();c.moveTo(o+860,H-420);c.lineTo(o+960,H-420);c.lineTo(o+935,H-350);c.lineTo(o+885,H-360);c.fill()}}
  wave(c,P,H,70,[3,7],seed+11,th.far[1],.25);
  const n=5;for(let i=0;i<n;i++){const x=i*P/n+r()*120,w=150+r()*130,h=200+r()*200,falls=r()<.75;for(const o of[-P,0,P])cliff(c,x+o,H,w,h,th,falls,r,true)}
  const g=c.createLinearGradient(0,H-300,0,H);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,th.key==='grove'?'rgba(130,100,180,.35)':'rgba(220,245,255,.45)');c.fillStyle=g;c.fillRect(0,0,P,H);
  L.far={cv,P,H,R,p:.12};}
 // Mid: little rocky islets in the water, each with its own vegetation.
 {const P=1700,H=420,[cv,c]=canvas(P*R,H*R);c.scale(R,R);const r=rng(seed+2);
  const count=4;for(let i=0;i<count;i++){const x=(i+.5)*P/count+(r()-.5)*160,w=90+r()*110,h=50+r()*70;for(const o of[-P,0,P]){const X=x+o;islet(c,X,H-16,w,h,th,r)}}
  L.mid={cv,P,H,R,p:.35};}
 // Back: bushes and dunes just behind the playfield.
 {const P=1500,H=220,[cv,c]=canvas(P*R,H*R);c.scale(R,R);const r=rng(seed+4);
  wave(c,P,H,70,[4,9],seed+5,th.back,.15);
  for(let i=0;i<10;i++){const x=r()*P,s=26+r()*26;for(const o of[-P,0,P]){for(const [dx,dy,k] of[[-.8,.2,.75],[.8,.25,.7],[0,0,1]]){c.fillStyle=k===1?th.back:th.midDark;c.beginPath();c.arc(x+o+dx*s,H-s*.8+dy*s,s*k,0,TAU);c.fill()}c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.arc(x+o-s*.25,H-s*1.15,s*.35,0,TAU);c.fill()}}
  L.back={cv,P,H,R,p:.7};}
 // Clouds (or wisps of smoke) as reusable sprites.
 L.clouds=[0,1,2].map(i=>{const [cv,c]=canvas(260,110),r=rng(seed+20+i);const col=th.key==='ember'?'rgba(120,80,70,.55)':th.key==='grove'?'rgba(220,190,240,.35)':'rgba(255,255,255,.92)';c.fillStyle=col;for(let k=0;k<7;k++){c.beginPath();c.arc(40+k*28+r()*10,70-Math.sin(k/6*Math.PI)*28-r()*8,24+r()*16,0,TAU);c.fill()}c.fillRect(30,70,200,24);return cv});
 // Ground: a rocky cliff face of rounded stones under the grass.
 {const [cv,c]=canvas(256,256),r=rng(seed+9);const g=c.createLinearGradient(0,0,0,256);g.addColorStop(0,th.soil[1]);g.addColorStop(1,th.soil[2]);c.fillStyle=g;c.fillRect(0,0,256,256);
  for(let row=0;row<6;row++){let x=-20+(row%2)*24;while(x<276){const w=34+r()*30,h=36+r()*8,y=row*43+4;c.fillStyle=r()<.5?th.soil[0]:th.rock;c.strokeStyle='rgba(0,0,0,.28)';c.lineWidth=2.5;for(const o of[-256,0,256]){c.beginPath();c.roundRect(x+o,y,w,h,12);c.fill();c.stroke()}
   c.fillStyle='rgba(255,255,255,.22)';for(const o of[-256,0,256]){c.beginPath();c.roundRect(x+o+5,y+4,w*.5,5,3);c.fill()}x+=w+4}}
  L.soil=cv;}
 return L;
}

function leafCluster(th){const [cv,c]=canvas(260,240);const leaf=(x,y,a,len,col)=>{c.save();c.translate(x,y);c.rotate(a);c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(len*.5,-len*.28,len,0);c.quadraticCurveTo(len*.5,len*.28,0,0);c.fill();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=2;c.beginPath();c.moveTo(4,0);c.lineTo(len*.9,0);c.stroke();c.restore()};
 try{c.filter='blur(3px)'}catch{}
 const cols=[th.fgDark,th.fg,th.fgDark,th.fg,th.fgDark];[[30,240,-1.2,170],[20,230,-.85,190],[60,240,-1.55,150],[0,210,-.5,170],[90,240,-1.05,120]].forEach(([x,y,a,l],i)=>leaf(x,y,a,l,cols[i]));
 c.filter='none';return cv}
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
  c.save();c.fillStyle=this.soilPattern;c.translate(0,GROUND+14);c.fillRect(-600,0,2600,1400);c.restore();
  const g=c.createLinearGradient(0,GROUND+10,0,GROUND+70);g.addColorStop(0,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(-600,GROUND+10,2600,60);
  // thick rounded grass (snow / ash) cap with drooping edge
  c.fillStyle=th.lip;c.beginPath();c.moveTo(-600,GROUND-2);for(let x=-600;x<=2000;x+=26)c.quadraticCurveTo(x+13,GROUND+26+((x/26)%3)*4,x+26,GROUND+14);c.lineTo(2000,GROUND-2);c.fill();
  c.fillStyle=th.top;c.beginPath();c.moveTo(-600,GROUND-6);for(let x=-600;x<=2000;x+=22)c.quadraticCurveTo(x+11,GROUND+14+((x/22)%2)*3,x+22,GROUND+6);c.lineTo(2000,GROUND-6);c.quadraticCurveTo(700,GROUND-9,-600,GROUND-6);c.fill();
  c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=2.5;c.beginPath();c.moveTo(-600,GROUND-5);c.lineTo(2000,GROUND-5);c.stroke();
  if(th.key!=='frost'&&th.key!=='ember'){c.strokeStyle=th.lip;c.lineWidth=2.2;c.beginPath();for(let x=-560;x<1960;x+=19){const h=7+((x*7)%10);c.moveTo(x,GROUND-3);c.quadraticCurveTo(x+3,GROUND-h*.6,x+6,GROUND-h)}c.stroke();
   // flowers
   for(let x=-540;x<1960;x+=67){const fx=x+((x*13)%23),fy=GROUND-4-((x*7)%6);c.fillStyle=th.key==='grove'?'#ffd8f4':'#fff';for(let k=0;k<5;k++){const a=k/5*TAU;c.beginPath();c.arc(fx+Math.cos(a)*3,fy+Math.sin(a)*3,2.4,0,TAU);c.fill()}c.fillStyle='#ffd13b';c.beginPath();c.arc(fx,fy,1.8,0,TAU);c.fill()}}
  if(th.key==='ember'){c.strokeStyle='rgba(255,140,40,.8)';c.lineWidth=3;c.beginPath();for(let x=-500;x<1900;x+=170){c.moveTo(x,GROUND+30);c.lineTo(x+30,GROUND+48);c.lineTo(x+18,GROUND+70)}c.stroke()}
  // sling mound
  c.fillStyle=th.top;c.beginPath();c.ellipse(190,GROUND+1,74,14,0,Math.PI,0);c.fill();boulder(c,138,GROUND+2,36,20,th.rock,'#fff');boulder(c,240,GROUND+2,28,15,th.rock,'#fff');
 }
 // Foreground: big soft-focus leaves in the bottom corners, kept below the ground line.
 front(c,cam,now){const {w,h,S,cx,cy}=cam,gy=cam.groundScreen(cy);if(gy>h+20)return;const room=h-gy;if(room<24)return;
  if(!this.leafSprite)this.leafSprite=leafCluster(this.th);const sp=this.leafSprite,size=Math.min(h*.42,Math.max(90,room*1.5)),sway=reducedMotionQuery.matches?0:Math.sin(now/1700)*4,shift=((cx-600)*S*.08)%40;
  c.save();c.globalAlpha=.95;c.drawImage(sp,-size*.32-shift+sway,h-size*.78,size*1.1,size);c.translate(w,0);c.scale(-1,1);c.drawImage(sp,-size*.32+shift-sway,h-size*.72,size*1.1,size);c.restore()}
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
  const g=c.createLinearGradient(long?0:-w/2,long?-h/2:0,long?0:w/2,long?h/2:0);g.addColorStop(0,'#ffc56c');g.addColorStop(.5,'#eb9a3a');g.addColorStop(1,'#c4742a');shape();c.fillStyle=g;c.fill();
  c.save();shape();c.clip();
  // planks and grain along the long axis
  const across=long?h:w,along=long?w:h,planks=Math.max(1,Math.round(across/9));
  for(let i=1;i<planks;i++){const o=-across/2+i*across/planks;c.strokeStyle='rgba(92,50,20,.45)';c.lineWidth=1.1;c.beginPath();long?(c.moveTo(-w/2,o),c.lineTo(w/2,o)):(c.moveTo(o,-h/2),c.lineTo(o,h/2));c.stroke()}
  c.strokeStyle='rgba(110,62,26,.28)';c.lineWidth=.8;for(let i=0;i<Math.max(3,across/3);i++){const o=-across/2+r()*across;c.beginPath();for(let t=-along/2;t<=along/2;t+=6){const v=o+Math.sin(t*.09+i)*1.2;long?c.lineTo(t,v):c.lineTo(v,t)}c.stroke()}
  for(let i=0;i<Math.floor(along/45)+1;i++){const t=(r()-.5)*along*.8,o=(r()-.5)*across*.5;c.fillStyle='rgba(100,55,22,.5)';c.beginPath();long?c.ellipse(t,o,3.2,1.6,0,0,TAU):c.ellipse(o,t,1.6,3.2,0,0,TAU);c.fill()}
  c.fillStyle='rgba(255,236,190,.35)';long?c.fillRect(-w/2,-h/2,w,2):c.fillRect(-w/2,-h/2,2,h);
  c.restore();
  if(Math.abs(w-h)<10&&w>=40){c.save();shape();c.clip();const f=Math.max(5,w*.14);c.strokeStyle='#b8661f';c.lineWidth=f;c.strokeRect(-w/2+f/2,-h/2+f/2,w-f,h-f);c.lineWidth=f*.9;c.beginPath();c.moveTo(-w/2+f,-h/2+f);c.lineTo(w/2-f,h/2-f);c.stroke();c.strokeStyle='rgba(255,220,160,.55)';c.lineWidth=1.4;c.strokeRect(-w/2+f,-h/2+f,w-f*2,h-f*2);c.restore()}
  shape();c.strokeStyle='#5e300c';c.lineWidth=2.6;c.stroke();
  // iron nails at the ends
  c.fillStyle='#5a4a3e';for(const e of[-1,1]){const t=e*(along/2-5);for(const o of planks>1?[-across/4,across/4]:[0]){c.beginPath();long?c.arc(t,o,1.4,0,TAU):c.arc(o,t,1.4,0,TAU);c.fill()}}
 }else if(kind==='stone'){
  const g=c.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,'#dfe4e8');g.addColorStop(1,'#98a3ad');shape();c.fillStyle=g;c.fill();
  c.save();shape();c.clip();
  // irregular masonry facets
  const cells=Math.max(2,Math.round(w*h/700));for(let i=0;i<cells;i++){const x=(r()-.5)*w,y=(r()-.5)*h,s=8+r()*12;c.fillStyle=r()<.5?'rgba(255,255,255,.12)':'rgba(40,50,60,.12)';c.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+r()*.4;c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s*.8)}c.fill()}
  for(let i=0;i<w*h/40;i++){c.fillStyle=r()<.5?'rgba(255,255,255,.25)':'rgba(30,35,40,.2)';c.fillRect((r()-.5)*w,(r()-.5)*h,1,1)}
  c.strokeStyle='rgba(60,68,75,.35)';c.lineWidth=1;const rows=Math.max(1,Math.round(h/16));for(let i=1;i<rows;i++){const y=-h/2+i*h/rows;c.beginPath();c.moveTo(-w/2,y);c.lineTo(w/2,y);c.stroke();const off=(i%2)*14;for(let x=-w/2+off+20;x<w/2;x+=28){c.beginPath();c.moveTo(x,y-h/rows);c.lineTo(x,y);c.stroke()}}
  c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-w/2,-h/2,w,2.2);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-w/2,h/2-2.5,w,2.5);
  c.restore();shape();c.strokeStyle='#424b55';c.lineWidth=2.6;c.stroke();
 }else{ // glass
  const g=c.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,'rgba(200,246,255,.92)');g.addColorStop(.5,'rgba(86,196,248,.85)');g.addColorStop(1,'rgba(40,140,226,.9)');shape();c.fillStyle=g;c.fill();
  c.save();shape();c.clip();c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=2.4;c.beginPath();c.moveTo(-w*.35,h*.5);c.lineTo(w*.15,-h*.5);c.stroke();c.lineWidth=1.2;c.beginPath();c.moveTo(-w*.1,h*.5);c.lineTo(w*.38,-h*.5);c.stroke();
  c.fillStyle='rgba(255,255,255,.28)';c.fillRect(-w/2+2,-h/2+2,w-4,Math.min(5,h*.3));c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;c.beginPath();c.moveTo(0,-h/2);c.lineTo(w/2,0);c.lineTo(0,h/2);c.lineTo(-w/2,0);c.closePath();c.stroke();c.restore();
  shape();c.strokeStyle='#1a5f9e';c.lineWidth=2.4;c.stroke();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=.8;c.beginPath();c.roundRect(-w/2+1.6,-h/2+1.6,w-3.2,h-3.2,Math.max(1,rr-1));c.stroke();
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
export const FORK={base:{x:188,y:GROUND+4},crotch:{x:190,y:494},back:{x:164,y:434},front:{x:216,y:434}};
function limb(c,a,b,w0,w1){const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;c.beginPath();c.moveTo(a.x+nx*w0,a.y+ny*w0);c.lineTo(b.x+nx*w1,b.y+ny*w1);c.arc(b.x,b.y,w1,Math.atan2(ny,nx),Math.atan2(ny,nx)+Math.PI,true);c.lineTo(a.x-nx*w0,a.y-ny*w0);c.closePath()}
function wood(c,x0,y0,x1,y1){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'#9a5a26');g.addColorStop(.42,'#e3a35a');g.addColorStop(1,'#7c431b');return g}
function wrap(c,tip,flip){c.save();c.translate(tip.x,tip.y+7);c.rotate(flip?-.35:.35);c.fillStyle='#c22d22';c.strokeStyle='#4a0d07';c.lineWidth=2;c.beginPath();c.roundRect(-10,-6,20,12,4);c.fill();c.stroke();c.strokeStyle='rgba(255,170,150,.6)';c.lineWidth=1.4;c.beginPath();c.moveTo(-7,-3);c.lineTo(7,-3);c.stroke();c.restore()}
export function drawSlingBack(c){const F=FORK;c.save();c.lineJoin='round';c.strokeStyle='#3c1f0a';c.lineWidth=3;
 limb(c,F.crotch,F.back,9,7.5);c.fillStyle=wood(c,F.back.x-11,0,F.back.x+11,0);c.fill();c.stroke();
 limb(c,F.base,F.crotch,11.5,10);c.fillStyle=wood(c,F.base.x-12,0,F.base.x+12,0);c.fill();c.stroke();
 c.strokeStyle='rgba(60,31,10,.4)';c.lineWidth=1.4;for(let y=508;y<586;y+=13){c.beginPath();c.moveTo(181,y);c.quadraticCurveTo(189,y+4,197,y);c.stroke()}
 c.fillStyle='rgba(255,230,180,.35)';c.beginPath();c.roundRect(181,500,4,80,2);c.fill();
 wrap(c,F.back,false);c.restore()}
export function drawSlingFront(c){const F=FORK;c.save();c.lineJoin='round';c.strokeStyle='#3c1f0a';c.lineWidth=3;limb(c,F.crotch,F.front,9,7.5);c.fillStyle=wood(c,F.front.x-11,0,F.front.x+11,0);c.fill();c.stroke();wrap(c,F.front,true);c.restore()}
// Red rubber band from a fork tip to the pouch. Tension 0..1 thins and brightens it.
export function drawBand(c,tip,to,tension){c.save();c.lineCap='round';c.strokeStyle='#4a0d07';c.lineWidth=lerp(10,6,tension)+3;c.beginPath();c.moveTo(tip.x,tip.y+5);c.lineTo(to.x,to.y);c.stroke();c.strokeStyle=`rgb(${Math.round(lerp(214,250,tension))},${Math.round(lerp(58,90,tension))},${Math.round(lerp(44,60,tension))})`;c.lineWidth=lerp(10,6,tension);c.stroke();c.strokeStyle='rgba(255,190,170,.6)';c.lineWidth=1.6;c.beginPath();c.moveTo(tip.x,tip.y+2);c.lineTo(to.x,to.y-2.5);c.stroke();c.restore()}
export function drawPouch(c,x,y,angle,r){c.save();c.translate(x,y);c.rotate(angle);const g=c.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#e2402f');g.addColorStop(1,'#8f1d14');c.fillStyle=g;c.strokeStyle='#4a0d07';c.lineWidth=2.4;c.beginPath();c.ellipse(-r*.12,0,r*.46,r*.86,0,0,TAU);c.fill();c.stroke();c.strokeStyle='rgba(255,200,180,.55)';c.lineWidth=1.4;c.beginPath();c.ellipse(-r*.12,0,r*.32,r*.68,0,-1.2,1.2);c.stroke();c.restore()}

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
   case'text':c.rotate(-p.a);c.font=`700 ${p.size}px Fredoka, ui-rounded, system-ui, sans-serif`;c.textAlign='center';c.lineWidth=p.size*.22;c.strokeStyle='rgba(60,30,10,.85)';c.strokeText(p.text,0,0);c.fillStyle=p.color;c.fillText(p.text,0,0);break;
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
