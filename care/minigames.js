import{paintMonster,prepareMonster,react}from'./renderer.js';
import{paintArt,artImage}from'./art.js';
import{SPECIES}from'./model.js';
export const GAME_INFO={catch:{title:'Catch Food',description:'Slide your friend to catch fruit. Let the gray stones fall!',duration:30,target:12},bubble:{title:'Bubble Pop',description:'Tap the floating bubbles before they drift away.',duration:25,target:20},jump:{title:'Jump Challenge',description:'Tap to jump over driftwood. Three bumps end the run.',duration:35,target:10},hide:{title:'Hide & Seek',description:'Watch the little peek, then tap a hiding spot. Find your friend five times!',duration:45,target:5}};
export function startMini(host,{kind,pet,onFinish,sound}){
 const info=GAME_INFO[kind];host.innerHTML=`<div class="game-hud"><span id="mini-score">0 / ${info.target}</span><b id="mini-clock">${info.duration}s</b></div><div class="game-stage"><canvas width="360" height="380" tabindex="0" role="application" aria-label="${info.title}. ${info.description}"></canvas></div><p class="game-guide">${info.description}</p>`;
 const canvas=host.querySelector('canvas'),c=canvas.getContext('2d'),scoreEl=host.querySelector('#mini-score'),clock=host.querySelector('#mini-clock');
 let stopped=false,frame=0,last=0,elapsed=0,spawn=0,score=0,hits=0,round=0,target=Math.floor(Math.random()*6),revealUntil=1.9,message='',msgUntil=0,objects=[],sparks=[];
 const player={id:1,level:pet.species,x:180,y:309,r:38,vx:0,vy:0,contact:true,rot:0};let jumpY=0,jumpV=0;
 const spots=Array.from({length:6},(_,i)=>({x:64+i%3*116,y:160+Math.floor(i/3)*139,prop:['palm','stool','bed','flower','hammock','lamp'][i]}));
 ['mango','berry','milk','cookie','palm','stool','bed','flower','hammock','lamp','ball','rock','log','bubble'].forEach(artImage);
 const backdrop=(()=>{const k=document.createElement('canvas');k.width=720;k.height=760;const g=k.getContext('2d');g.scale(2,2);
  let gr=g.createLinearGradient(0,0,0,250);gr.addColorStop(0,'#46b8ea');gr.addColorStop(.6,'#a7e3f5');gr.addColorStop(1,'#e8f8f0');g.fillStyle=gr;g.fillRect(0,0,360,380);
  gr=g.createRadialGradient(300,46,0,300,46,70);gr.addColorStop(0,'rgba(255,253,235,1)');gr.addColorStop(.3,'rgba(255,240,170,.85)');gr.addColorStop(1,'rgba(255,240,170,0)');g.fillStyle=gr;g.fillRect(200,0,160,140);g.fillStyle='#fffbe6';g.beginPath();g.arc(300,46,20,0,Math.PI*2);g.fill();
  const cloud=(x,y,s)=>{g.fillStyle='rgba(255,255,255,.92)';for(const[a,b,r]of[[0,0,16],[18,-8,20],[38,0,15],[20,6,16]]){g.beginPath();g.arc(x+a*s,y+b*s,r*s,0,Math.PI*2);g.fill()}};cloud(40,60,1);cloud(170,40,.8);cloud(250,110,.6);const dy=kind==='hide'?-120:0;g.save();g.translate(0,dy);
  g.fillStyle='#4aa86a';g.beginPath();g.moveTo(40,232);g.quadraticCurveTo(80,186,120,224);g.quadraticCurveTo(150,200,178,232);g.fill();g.fillStyle='#3c9a5f';g.beginPath();g.moveTo(230,232);g.quadraticCurveTo(262,204,300,232);g.fill();
  gr=g.createLinearGradient(0,226,0,290);gr.addColorStop(0,'#2fc6cc');gr.addColorStop(1,'#1d93ad');g.fillStyle=gr;g.fillRect(0,228,360,62);
  g.strokeStyle='rgba(210,250,248,.75)';g.lineWidth=2;g.lineCap='round';for(const[x,y,w]of[[20,240,26],[90,250,34],[170,238,22],[230,256,30],[300,244,24],[60,270,22],[150,276,28],[270,278,20]]){g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y);g.stroke()}
  gr=g.createLinearGradient(0,280,0,380);gr.addColorStop(0,'#ffeec2');gr.addColorStop(.5,'#f6d79a');gr.addColorStop(1,'#e8bb72');g.fillStyle=gr;g.beginPath();g.moveTo(0,292);g.quadraticCurveTo(90,276,180,288);g.quadraticCurveTo(270,300,360,284);g.lineTo(360,380-dy);g.lineTo(0,380-dy);g.fill();
  g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=3;g.beginPath();g.moveTo(0,292);g.quadraticCurveTo(90,276,180,288);g.quadraticCurveTo(270,300,360,284);g.stroke();
  g.fillStyle='rgba(170,110,50,.25)';for(let i=0;i<140-dy;i++){const x=(i*73)%360,y=300+((i*37)%(80-dy));g.fillRect(x,y,1.4,1.4)}g.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<60;i++){const x=(i*131)%360,y=298+((i*53)%80);g.fillRect(x,y,1.2,1.2)}
  const shell=(x,y)=>{g.fillStyle='#ffc1a8';g.strokeStyle='#c5604f';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.arc(x,y,7,Math.PI,0);g.closePath();g.fill();g.stroke()};shell(30,360-dy*.3);shell(330,350-dy*.6);g.restore();
  return k})();
 const shadowSprite=(()=>{const k=document.createElement('canvas');k.width=128;k.height=32;const g=k.getContext('2d'),gr=g.createRadialGradient(64,16,0,64,16,64);gr.addColorStop(0,'rgba(90,55,20,.4)');gr.addColorStop(.6,'rgba(90,55,20,.12)');gr.addColorStop(1,'rgba(90,55,20,0)');g.setTransform(1,0,0,.25,0,12);g.fillStyle=gr;g.fillRect(0,-64,128,128);return k})();prepareMonster(pet.species).catch(()=>{});
 function pop(x,y,color='#ffe08a'){for(let i=0;i<9;i++)sparks.push({x,y,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160,life:.65,color})}
 function feedback(text,x,y){message=text;msgUntil=elapsed+.8;pop(x,y);sound?.(score%2?630:830)}
 function finish(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);cleanup();const points=kind==='hide'?score*20:Math.min(100,Math.round(score/info.target*65));onFinish({score:points,count:score,won:score>=info.target,kind})}
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*360,y:(e.clientY-r.top)/r.height*380}}
 function move(e){if(kind==='catch'){player.x=Math.max(30,Math.min(330,point(e).x));e.preventDefault()}}
 function down(e){e.preventDefault();const p=point(e);if(kind==='catch'){move(e);canvas.setPointerCapture(e.pointerId)}
  if(kind==='jump'&&jumpY===0){jumpV=-470;react(player,'surprise',400);sound?.(400)}
  if(kind==='bubble'){const idx=objects.findIndex(o=>Math.hypot(o.x-p.x,o.y-p.y)<o.r+9);if(idx>=0){const o=objects.splice(idx,1)[0];score++;feedback('+1',o.x,o.y);react(player,'happy',700)}}
  if(kind==='hide'&&elapsed>=revealUntil){const idx=spots.findIndex(o=>Math.abs(o.x-p.x)<48&&p.y>o.y-90&&p.y<o.y+20);if(idx>=0){if(idx===target){score++;round++;feedback('Found you!',p.x,p.y);if(round>=5)return finish();target=Math.floor(Math.random()*6);revealUntil=elapsed+1.5}else{feedback('Try another spot!',p.x,p.y);hits++}}}
 }
 function keys(e){if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(kind==='jump'&&jumpY===0)jumpV=-470}if(kind==='catch'){if(e.code==='ArrowLeft')player.x=Math.max(30,player.x-25);if(e.code==='ArrowRight')player.x=Math.min(330,player.x+25)}}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('keydown',keys);
 function cleanup(){canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('keydown',keys)}
 function update(dt){elapsed+=dt;spawn-=dt;
  if(kind==='catch'){
   if(spawn<=0){spawn=.65;objects.push({x:24+Math.random()*312,y:-30,bad:Math.random()<.24,speed:92+elapsed*1.8,food:Math.random()<.6?SPECIES[pet.species].favorite:'mango'})}
   for(let i=objects.length-1;i>=0;i--){const o=objects[i];o.y+=o.speed*dt;if(o.y>273&&o.y<330&&Math.abs(o.x-player.x)<36){if(o.bad){score=Math.max(0,score-1);feedback('Stone!',o.x,o.y);react(player,'hurt',450)}else{score++;feedback('+1',o.x,o.y);react(player,'happy',550)}objects.splice(i,1)}else if(o.y>410)objects.splice(i,1)}
  }else if(kind==='bubble'){
   if(spawn<=0&&objects.length<12){spawn=.4;objects.push({x:25+Math.random()*310,y:395,r:19+Math.random()*13,speed:30+Math.random()*25,color:['#99dfd9','#edb4d3','#ffdc8d','#a9d9ed'][Math.floor(Math.random()*4)]})}
   objects.forEach(o=>o.y-=o.speed*dt);objects=objects.filter(o=>o.y>-40);
  }else if(kind==='jump'){
   jumpV+=1060*dt;jumpY+=jumpV*dt;if(jumpY>0){jumpY=0;jumpV=0}player.x=76;player.y=302+jumpY;
   if(spawn<=0){spawn=Math.max(.83,1.8-elapsed*.02)+Math.random()*.4;objects.push({x:390,w:20+Math.random()*17,h:24+Math.random()*16,passed:false})}
   for(const o of objects){o.x-=(140+elapsed*3.5)*dt;if(!o.passed&&o.x<100&&o.x+o.w>52&&player.y+25>330-o.h){o.passed=true;hits++;feedback('Bump! '+hits+'/3',o.x,290);react(player,'hurt',600);if(hits>=3)return finish()}if(!o.passed&&o.x+o.w<50){o.passed=true;score++;feedback('+1',80,200)}}objects=objects.filter(o=>o.x>-50);
  }
  for(const s of sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=80*dt;s.life-=dt}sparks=sparks.filter(s=>s.life>0);
  scoreEl.textContent=`${score} / ${info.target}${kind==='jump'?' · '+(3-hits)+' hearts':''}`;clock.textContent=Math.ceil(Math.max(0,info.duration-elapsed))+'s';
  if(elapsed>=info.duration)finish();
 }
 function draw(now){c.clearRect(0,0,360,380);c.drawImage(backdrop,0,0,360,380);
  if(kind==='hide'){for(let i=0;i<spots.length;i++){const s=spots[i];c.drawImage(shadowSprite,s.x-42,s.y-2,84,20);if(i===target&&elapsed<revealUntil){player.x=s.x;player.y=s.y-66;player.r=25;paintMonster(c,player,now)}paintArt(c,s.prop,s.x-45,s.y-78,90)}c.font='900 14px system-ui';c.textAlign='center';c.lineJoin='round';c.strokeStyle='#1d6b5a';c.lineWidth=4;c.strokeText(elapsed<revealUntil?'Watch closely…':'Where did I hide?',180,30);c.fillStyle='#fff';c.fillText(elapsed<revealUntil?'Watch closely…':'Where did I hide?',180,30)}
  else{player.r=kind==='bubble'?34:30;if(kind==='bubble'){player.x=180;player.y=290}{const lift=Math.max(0,309-player.y),k=1-Math.min(.5,lift/160);c.globalAlpha=k;c.drawImage(shadowSprite,player.x-40*k,333,80*k,18*k);c.globalAlpha=1}paintMonster(c,player,now);
   for(const o of objects){if(kind==='catch'){if(o.bad){c.save();c.translate(o.x,o.y);c.rotate(o.y/90);paintArt(c,'rock',-22,-22,44);c.restore()}else{c.save();c.translate(o.x,o.y);c.rotate(Math.sin(o.y/40)*.25);paintArt(c,o.food,-23,-23,46);c.restore()}}
    if(kind==='bubble'){const wob=1+Math.sin(now/260+o.x)*.04;c.fillStyle=o.color+'70';c.beginPath();c.ellipse(o.x,o.y,o.r*wob,o.r/wob,0,0,Math.PI*2);c.fill();c.strokeStyle='#ffffffd0';c.lineWidth=2;c.stroke();paintArt(c,'bubble',o.x-o.r*wob,o.y-o.r/wob,o.r*2*wob,o.r*2/wob)}
    if(kind==='jump'){c.drawImage(shadowSprite,o.x-6,324,o.w+12,12);paintArt(c,'log',o.x-3,330-o.h-7,o.w+6,o.h+9)}}
  }
  for(const s of sparks){const a=Math.max(0,s.life/.65),r=2+3*a;c.globalAlpha=a;c.fillStyle=s.color;c.beginPath();c.moveTo(s.x,s.y-r*1.8);c.quadraticCurveTo(s.x,s.y,s.x+r*1.8,s.y);c.quadraticCurveTo(s.x,s.y,s.x,s.y+r*1.8);c.quadraticCurveTo(s.x,s.y,s.x-r*1.8,s.y);c.quadraticCurveTo(s.x,s.y,s.x,s.y-r*1.8);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(s.x,s.y,r*.35,0,Math.PI*2);c.fill()}c.globalAlpha=1;if(elapsed<msgUntil){c.font='900 22px system-ui';c.textAlign='center';c.lineJoin='round';c.strokeStyle='#1d6b5a';c.lineWidth=5;c.strokeText(message,180,70);c.fillStyle='#fff6c8';c.fillText(message,180,70)}
 }
 function loop(t){if(stopped)return;const dt=last?Math.min(.05,(t-last)/1000):0;last=t;update(dt);if(stopped)return;draw(t);frame=requestAnimationFrame(loop)}frame=requestAnimationFrame(loop);
 return ()=>{stopped=true;cancelAnimationFrame(frame);cleanup()};
}
