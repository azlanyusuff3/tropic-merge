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
 ['mango','berry','milk','cookie','palm','stool','bed','flower','hammock','lamp','ball'].forEach(artImage);prepareMonster(pet.species).catch(()=>{});
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
 function draw(now){c.clearRect(0,0,360,380);c.fillStyle='#d4efdf';c.fillRect(0,0,360,380);c.fillStyle='#f5e7ba';c.beginPath();c.ellipse(180,395,290,105,0,0,Math.PI*2);c.fill();c.fillStyle='#fdf6d0';c.beginPath();c.arc(300,44,28,0,Math.PI*2);c.fill();
  if(kind==='hide'){for(let i=0;i<spots.length;i++){const s=spots[i];if(i===target&&elapsed<revealUntil){player.x=s.x;player.y=s.y-66;player.r=25;paintMonster(c,player,now)}paintArt(c,s.prop,s.x-45,s.y-78,90)}c.fillStyle='#548571';c.font='bold 12px system-ui';c.textAlign='center';c.fillText(elapsed<revealUntil?'Watch closely…':'Where did I hide?',180,30)}
  else{player.r=kind==='bubble'?34:30;if(kind==='bubble'){player.x=180;player.y=290}c.fillStyle='#6b8e6b33';c.beginPath();c.ellipse(player.x,339,30,7,0,0,Math.PI*2);c.fill();paintMonster(c,player,now);
   for(const o of objects){if(kind==='catch'){if(o.bad){c.fillStyle='#939a94';c.strokeStyle='#66736b';c.lineWidth=3;c.beginPath();c.moveTo(o.x-14,o.y+12);c.lineTo(o.x-10,o.y-9);c.lineTo(o.x+5,o.y-15);c.lineTo(o.x+16,o.y+8);c.closePath();c.fill();c.stroke()}else paintArt(c,o.food,o.x-21,o.y-21,42)}
    if(kind==='bubble'){c.fillStyle=o.color+'99';c.strokeStyle='#fffaf0';c.lineWidth=2;c.beginPath();c.arc(o.x,o.y,o.r,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#ffffffb0';c.lineWidth=4;c.beginPath();c.arc(o.x,o.y,o.r*.7,Math.PI*1.1,Math.PI*1.5);c.stroke()}
    if(kind==='jump'){c.fillStyle='#b38355';c.strokeStyle='#855d3a';c.lineWidth=3;c.beginPath();c.roundRect(o.x,330-o.h,o.w,o.h,6);c.fill();c.stroke();c.strokeStyle='#dbb77d';c.beginPath();c.moveTo(o.x+5,335-o.h);c.lineTo(o.x+5,325);c.stroke()}}
  }
  for(const s of sparks){c.globalAlpha=Math.max(0,s.life/.65);c.fillStyle=s.color;c.beginPath();c.arc(s.x,s.y,3,0,Math.PI*2);c.fill()}c.globalAlpha=1;if(elapsed<msgUntil){c.fillStyle='#56836e';c.font='bold 20px system-ui';c.textAlign='center';c.fillText(message,180,70)}
 }
 function loop(t){if(stopped)return;const dt=last?Math.min(.05,(t-last)/1000):0;last=t;update(dt);if(stopped)return;draw(t);frame=requestAnimationFrame(loop)}frame=requestAnimationFrame(loop);
 return ()=>{stopped=true;cancelAnimationFrame(frame);cleanup()};
}
