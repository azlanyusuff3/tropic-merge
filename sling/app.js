// Monster Sling: campaign map, fullscreen battle stage, camera, gestures, HUD, overlays and audio.
import{SPECIES,ISLANDS,LEVELS,HERO_UNLOCK_LEVELS,load,save,unlocked,available,record}from'./data.js';
import{Battle,SLING,launchVelocity,launchOrigin}from'./battle.js';
import{GROUND,predict,step}from'./physics.js';
import{prepareMonster,paintMonster,react,kick,mood}from'./renderer.js';
import*as art from'./art.js';
import{ENEMY}from'./enemies.js';
art.preloadEnemies();

export const VERSION='19.0';
const $=(s,r=document)=>r.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>1-Math.pow(1-clamp(t,0,1),3);
const app=$('#app');
let storage;try{storage=localStorage;storage.getItem('x')}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Storage unavailable')}}}
let state=load(storage),game=null,noticeTimer;
const UNLOCK_AT=[0,0,2,4,0,7,10,13,16,20,25];
const reduced=()=>state.effects==='reduced'||art.reducedMotionQuery.matches;
function persist(){if(!save(storage,state))notify('Storage unavailable. Your progress cannot be saved on this browser.',true)}
function notify(text,warning=false){const el=$('#notice');el.textContent=text;el.className='show'+(warning?' storage-warning':'');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.className='',warning?7000:2600)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

// ───────────────────────────── Audio (synthesised, no files) ─────────────────────────────
const Sound={ctx:null,noise:null,last:new Map(),master:null,
 ensure(){if(!state.sound)return null;try{if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.55;this.master.connect(this.ctx.destination);const n=this.ctx.createBuffer(1,this.ctx.sampleRate*.6,this.ctx.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise=n}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return this.ctx}catch{return null}},
 tone(f,d,type='sine',g=.12,to=f*.5,delay=0){const c=this.ensure();if(!c)return;const t=c.currentTime+delay,o=c.createOscillator(),a=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,to),t+d);a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(this.master);o.start(t);o.stop(t+d+.02)},
 hiss(d,type='lowpass',f=800,g=.15,q=.8,delay=0,to){const c=this.ensure();if(!c)return;const t=c.currentTime+delay,s=c.createBufferSource(),fl=c.createBiquadFilter(),a=c.createGain();s.buffer=this.noise;fl.type=type;fl.frequency.setValueAtTime(f,t);if(to)fl.frequency.exponentialRampToValueAtTime(to,t+d);fl.Q.value=q;a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(a);a.connect(this.master);s.start(t,Math.random()*.3);s.stop(t+d+.02)},
 play(name,k=1){if(!state.sound)return;const now=performance.now(),gap={stretch:70,wood:45,stone:55,glass:45,ground:80}[name]||25;if(now-(this.last.get(name)||0)<gap)return;this.last.set(name,now);
  switch(name){
   case'ui':this.tone(660,.07,'triangle',.07,520);break;
   case'grab':this.tone(220,.08,'triangle',.08,260);break;
   case'stretch':k=clamp(k,0,1);this.tone(90+k*120,.06,'sawtooth',.025,110+k*130);break;
   case'launch':k=clamp(k,.5,1.3);this.hiss(.32,'bandpass',500,.22*k,1.2,0,2400);this.tone(190,.22,'triangle',.14,85);break;
   case'snap':this.tone(150,.12,'triangle',.08,70);break;
   case'wood':k=clamp(k,.2,1.2);this.hiss(.12,'lowpass',700,.18*k);this.tone(150,.12,'sine',.12*k,90);break;
   case'woodBreak':this.hiss(.22,'highpass',1300,.22);this.hiss(.18,'lowpass',500,.2);this.tone(120,.18,'triangle',.12,60);break;
   case'stone':k=clamp(k,.2,1.2);this.hiss(.14,'lowpass',380,.22*k);this.tone(90,.16,'sine',.16*k,55);break;
   case'stoneBreak':this.hiss(.4,'lowpass',900,.26,.7,0,200);this.tone(70,.32,'sine',.2,40);break;
   case'glass':k=clamp(k,.2,1.2);this.tone(1900+Math.random()*500,.18,'triangle',.06*k,1700);break;
   case'glassBreak':this.hiss(.35,'highpass',3200,.18);for(let i=0;i<4;i++)this.tone(1800+Math.random()*1800,.25,'triangle',.05,1500,i*.03);break;
   case'ground':k=clamp(k,.2,1.2);this.hiss(.16,'lowpass',300,.18*k);break;
   case'thud':k=clamp(k,.2,1.2);this.tone(110,.14,'sine',.16*k,60);this.hiss(.1,'lowpass',500,.12*k);break;
   case'pop':this.tone(720,.16,'sine',.14,200);this.hiss(.12,'bandpass',1600,.12,2);this.tone(1100,.09,'triangle',.06,1300,.05);break;
   case'boss':this.tone(300,.5,'sawtooth',.1,80);this.hiss(.5,'lowpass',700,.22);break;
   case'hurt':this.tone(420,.1,'square',.03,300);break;
   case'skill':{const f=[520,620,700,560,180,880,300,140,330,980,160][k|0]||600;this.tone(f,.28,'triangle',.12,f*1.6);this.hiss(.25,'bandpass',f*2,.1,2);if([4,7,10].includes(k|0)){this.tone(70,.45,'sine',.22,35);this.hiss(.5,'lowpass',600,.25)}break}
   case'star':this.tone(880+k*220,.22,'triangle',.11,1320+k*220);break;
   case'win':[523,659,784,1046].forEach((f,i)=>this.tone(f,.32,'triangle',.11,f*1.01,i*.11));break;
   case'lose':[440,370,311,262].forEach((f,i)=>this.tone(f,.32,'triangle',.09,f*.98,i*.14));break;
   case'unlock':[660,880,990,1320].forEach((f,i)=>this.tone(f,.35,'sine',.1,f,i*.09));break;
   case'hop':this.tone(380,.1,'sine',.08,620);break;
   case'ink':this.hiss(.35,'lowpass',500,.18,.8,0,200);this.tone(200,.25,'sine',.06,90);break;
   case'squawk':this.tone(900,.12,'sawtooth',.05,1300);this.tone(1200,.1,'sawtooth',.04,700,.1);break;
   case'prick':this.tone(1400,.08,'square',.04,900);break;
   case'splash':k=clamp(k,.3,1);this.hiss(.4,'bandpass',900,.22*k,.7,0,300);this.tone(320,.18,'sine',.06*k,120);break;
   case'burn':this.hiss(.5,'lowpass',1200,.2,.6,0,300);break;
   case'light':[880,1320,1760].forEach((f,i)=>this.tone(f,.3,'sine',.07,f*1.2,i*.04));break;
   case'short':for(let i=0;i<4;i++)this.tone(120+i*40,.06,'square',.05,90,i*.05);break;
   case'steam':this.hiss(.7,'highpass',2400,.16,.6,0,800);break;
   case'erupt':this.tone(60,.6,'sawtooth',.14,30);this.hiss(.7,'lowpass',500,.3);break;
  }},
 suspend(){this.ctx?.suspend().catch(()=>{})},
 resume(){if(state.sound&&this.ctx)this.ctx.resume().catch(()=>{})}
};

// ───────────────────────────── Shared bits ─────────────────────────────
const ICON={
 pause:'<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
 back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 sound:'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 mute:'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
 retry:'<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 11-2.05-4.95M19 4v4h-4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 map:'<svg viewBox="0 0 24 24"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
 play:'<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',
 next:'<svg viewBox="0 0 24 24"><path d="M6 5l9 7-9 7zM17 5h2.5v14H17z"/></svg>',
 target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="2.2"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
 help:'<svg viewBox="0 0 24 24"><path d="M9 9a3 3 0 115 2.2c-1.2.8-2 1.4-2 2.8M12 18h.01" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
 full:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
 rotate:'<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 13a9 9 0 009 9M21 11a9 9 0 00-9-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 2l2 0 0 2M14 22l-2 0 0-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 swap:'<svg viewBox="0 0 24 24"><path d="M5 9a7 7 0 0112-3l2 2M19 4v4h-4M19 15a7 7 0 01-12 3l-2-2M5 20v-4h4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 gear:'<svg viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm8.6 5.1l-1.9-.4a7 7 0 01-.6 1.5l1.1 1.6-2.1 2.1-1.6-1.1a7 7 0 01-1.5.6l-.4 1.9h-3l-.4-1.9a7 7 0 01-1.5-.6l-1.6 1.1-2.1-2.1 1.1-1.6a7 7 0 01-.6-1.5l-1.9-.4v-3l1.9-.4a7 7 0 01.6-1.5L4.9 6.4 7 4.3l1.6 1.1a7 7 0 011.5-.6L10.5 3h3l.4 1.9a7 7 0 011.5.6L17 4.3l2.1 2.1-1.1 1.6a7 7 0 01.6 1.5l1.9.4z"/></svg>',
 islands:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="18" rx="10" ry="3.5" fill="#3fc0ff"/><path d="M4 17q8-7 16 0z" fill="#f1cf7c"/><path d="M12 16V7" stroke="#7b4a20" stroke-width="1.6"/><path d="M12 7q-5-2-7 2q4-1 7-2zm0 0q5-2 7 2q-4-1-7-2zm0 0q-1-4-4-5q2 2 4 5zm0 0q1-4 4-5q-2 2-4 5z" fill="#3fb34a"/></svg>',
 sparkle:'<svg viewBox="0 0 24 24"><path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z"/></svg>',
 lock:'<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 018 0V10" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
 crown:'<svg viewBox="0 0 24 24"><path d="M3 18l1.5-10 5 4.5L12 5l2.5 7.5 5-4.5L21 18z"/></svg>',
 bandit:'<svg viewBox="0 0 24 24"><ellipse cx="13" cy="13" rx="9" ry="8" fill="#6fa83f"/><circle cx="7" cy="12" r="5" fill="#c6e48a"/><path d="M2 10.5q5-2 10 0v2.2q-5-1.6-10 0z" fill="#b8323f"/><circle cx="5.6" cy="11.4" r="1.1" fill="#fff"/><circle cx="8.6" cy="11.4" r="1.1" fill="#fff"/></svg>'
};
function heroCard(d,open,extra=''){return`<button class="hero-tile ${open?'':'locked'} ${extra}" data-hero="${d.id}" ${open?'':'aria-disabled="true"'} aria-label="${esc(d.name)}${open?'':' (locked)'}"><span class="hero-art" style="--hc:${d.color}"><img src="${d.asset}" alt="" draggable="false"></span><b>${esc(d.name)}</b><small>${open?esc(d.skill):UNLOCK_AT[d.id]?`Clear ${UNLOCK_AT[d.id]} levels`:'Find it in Merge'}</small></button>`}

// Overlay helper: one panel at a time inside a host element.
function overlay(host,html,cls=''){
 let el=host.querySelector(':scope > .overlay');if(!el){el=document.createElement('div');el.className='overlay';host.append(el)}
 el.className='overlay show '+cls;el.innerHTML=`<div class="panel" role="dialog" aria-modal="true">${html}</div>`;
 requestAnimationFrame(()=>el.querySelector('[autofocus], .panel button')?.focus({preventScroll:true}));return el}
function closeOverlay(host){const el=host?.querySelector(':scope > .overlay');if(el){el.className='overlay';el.innerHTML='';el.onclick=null}}
const overlayOpen=host=>!!host?.querySelector(':scope > .overlay.show');

function helpHTML(){return`<h2>How to sling</h2><div class="help-grid">
 <div><i class="help-ico pull"></i><b>Pull back</b><span>Grab your monster and drag away from the forts. The dots show the flight.</span></div>
 <div><i class="help-ico release"></i><b>Let go</b><span>A longer pull flies further. Drag back to the sling to cancel.</span></div>
 <div><i class="help-ico tap"></i><b>Tap in flight</b><span>Use your hero's skill once per launch. Timing is everything.</span></div>
 <div><i class="help-ico look"></i><b>Look around</b><span>Drag the sky to pan, pinch to zoom, then tap ${ICON.target.replace('<svg','<svg class="inline"')} to recenter.</span></div>
 </div><p class="help-foot">Defeat every enemy to rescue the crystal. Spare monsters earn stars: 2 spare = ★★★, 1 spare = ★★.</p>`}

// Try to switch to landscape: works in installed apps and in Chrome full screen on Android.
async function goLandscape(){const o=screen.orientation;if(!o?.lock)return false;try{await o.lock('landscape');return true}catch{}
 try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});await o.lock('landscape');return true}catch{return false}}
const rotateSeen=()=>{try{return sessionStorage.getItem('slingRotateTip')==='1'}catch{return true}};
const markRotateSeen=()=>{try{sessionStorage.setItem('slingRotateTip','1')}catch{}};

// ───────────────────────────── Loadout ─────────────────────────────
// One hero per launch. Saved per level; defaults favour the hero a level introduces.
function defaultLoadout(level,heroes){const fresh=SPECIES.find(d=>HERO_UNLOCK_LEVELS[d.id]===level.number&&heroes.includes(d.id));const order=[...heroes].sort((a,b)=>b-a);const first=[fresh?.id,state.selected].filter(x=>x!=null&&heroes.includes(x));const pool=[...new Set([...first,...order])];return Array.from({length:level.shots},(_,i)=>pool[i%pool.length])}
function loadoutFor(level){const heroes=unlocked(state,storage),saved=state.loadouts?.[level.id];if(Array.isArray(saved)&&saved.length===level.shots&&saved.every(id=>heroes.includes(id)))return[...saved];return defaultLoadout(level,heroes)}
function saveLoadout(level,lo){state.loadouts={...(state.loadouts||{}),[level.id]:[...lo]};persist()}

// ───────────────────────────── Campaign map ─────────────────────────────
function islandAvatar(i){const th=art.THEMES[i];return`<svg viewBox="0 0 60 60" aria-hidden="true"><rect width="60" height="60" fill="${th.sky[0]}"/><rect y="34" width="60" height="26" fill="${th.sea[0]}"/><path d="M6 46q24-22 48 0z" fill="${th.soil[0]}"/><path d="M12 42q18-16 36 0q-18-6-36 0z" fill="${th.top}"/><path d="M30 40V22" stroke="${th.midDark}" stroke-width="2.4"/><path d="M30 22q-9-4-13 3q8-2 13-3zm0 0q9-4 13 3q-8-2-13-3zm0 0q-2-7-8-9q4 4 8 9zm0 0q2-7 8-9q-4 4-8 9z" fill="${th.mid}"/><circle cx="48" cy="12" r="5" fill="${th.sun}"/></svg>`}
const NODES=[[22,87],[56,77],[80,62],[50,50],[22,37],[60,22]];
function islandArt(i){const th=art.THEMES[i],R=(n=>()=>(n=(n*16807)%2147483647)/2147483647)(97+i*31);
 const palm=(x,y,h,lean=0)=>{const tx=x+lean*h,ty=y-h;let f='';for(const [a,l] of[[-2.6,.62],[-2.0,.7],[-1.35,.6],[-.75,.66],[-.25,.58],[-3.1,.5]]){const ex=tx+Math.cos(a)*h*l,ey=ty+Math.sin(a)*h*l*.7+h*.2;f+=`<path d="M${tx} ${ty}Q${(tx+ex)/2} ${ty-h*.18} ${ex} ${ey}Q${(tx+ex)/2} ${ty-h*.02} ${tx} ${ty}" fill="${a<-1.6?th.mid:th.top}" stroke="${th.midDark}" stroke-width="2"/>`}return`<path d="M${x} ${y}Q${x+lean*h*.2} ${y-h*.5} ${tx} ${ty}" stroke="#7a4a20" stroke-width="${h*.09}" fill="none" stroke-linecap="round"/><path d="M${x} ${y}Q${x+lean*h*.2} ${y-h*.5} ${tx} ${ty}" stroke="#b07440" stroke-width="${h*.04}" fill="none" stroke-dasharray="3 5"/>${f}<circle cx="${tx}" cy="${ty+3}" r="${h*.07}" fill="#6b3d12"/>`};
 const bush=(x,y,r)=>`<g><circle cx="${x-r*.7}" cy="${y}" r="${r*.75}" fill="${th.midDark}"/><circle cx="${x+r*.7}" cy="${y+1}" r="${r*.7}" fill="${th.midDark}"/><circle cx="${x}" cy="${y-r*.35}" r="${r}" fill="${th.mid}"/><circle cx="${x-r*.3}" cy="${y-r*.6}" r="${r*.35}" fill="${th.top}" opacity=".8"/>${th.props==='storm'||th.props==='ember'?'':`<circle cx="${x+r*.3}" cy="${y-r*.2}" r="2.6" fill="#fff"/><circle cx="${x+r*.3}" cy="${y-r*.2}" r="1" fill="#ffd13b"/>`}</g>`;
 const rock=(x,y,w)=>`<g><path d="M${x-w} ${y}Q${x-w} ${y-w*.9} ${x-w*.1} ${y-w}Q${x+w} ${y-w*.9} ${x+w} ${y}z" fill="${th.rock}" stroke="#4d3a2a" stroke-width="2"/><path d="M${x-w*.6} ${y-w*.55}Q${x-w*.2} ${y-w*.85} ${x+w*.2} ${y-w*.75}" stroke="#fff" stroke-opacity=".45" stroke-width="2.5" fill="none"/></g>`;
 const shore=Array.from({length:12},(_,k)=>{const a=k/12*Math.PI*2+R()*.3,rx=170+R()*14,ry=205+R()*10;return rock(180+Math.cos(a)*rx,215+Math.sin(a)*ry,8+R()*10)}).join('');
 let props='';
 if(th.props==='bamboo')for(const [x,y] of[[52,170],[300,150],[70,330],[290,310]])props+=`<g stroke="${th.midDark}" stroke-width="5" stroke-linecap="round"><path d="M${x} ${y}v-60M${x+9} ${y}v-46M${x-8} ${y}v-38"/></g><g fill="${th.mid}"><path d="M${x} ${y-40}q14-8 20-2q-12 0-20 2zM${x+9} ${y-30}q-14-6-18 0q10-2 18 0z"/></g>`;
 else if(th.props==='ember')props+=`<path d="M120 120L170 40h22l52 80z" fill="#5e3a36" stroke="#2e1c18" stroke-width="3"/><path d="M170 40h22l-6 18h-10z" fill="#ffb36b"/><path d="M178 58q-6 30 6 60q8-30-2-60z" fill="#ff7a1a" opacity=".85"/><circle cx="180" cy="30" r="10" fill="#8a7a78" opacity=".6"/><circle cx="192" cy="16" r="13" fill="#8a7a78" opacity=".45"/>`;
 else if(th.props==='storm')for(const [x,y] of[[56,180],[300,160],[80,320]])props+=`<path d="M${x} ${y}l14-44l14 44z" fill="${th.midDark}" stroke="#16261e" stroke-width="2"/><path d="M${x+4} ${y-18}l10-34l10 34z" fill="${th.mid}"/>`;
 if(th.props!=='bamboo'&&th.props!=='ember')for(const [x,y,h,l] of[[48,200,62,-.25],[306,180,58,.25],[62,330,50,-.2],[296,318,54,.22]])props+=palm(x,y,h,l);
 if(th.props==='ember')for(const [x,y,h,l] of[[56,320,40,-.3],[300,300,44,.3]])props+=`<path d="M${x} ${y}q${l*20} ${-h*.6} ${l*h} ${-h}" stroke="#3a2620" stroke-width="5" fill="none" stroke-linecap="round"/>`;
 if(th.props==='coral')props+=`<g transform="translate(300 392)"><path d="M0 0v-46" stroke="#6b3d12" stroke-width="5"/><path d="M2 -44l26 10l-26 10z" fill="#1b1b22"/><circle cx="12" cy="-34" r="3" fill="#fff"/></g>`+[0,1,2,3].map(k=>`<path d="M${30+k*12} ${360+k*12}q-6-16 2-24q4 12 6 24z" fill="${['#ff7aa8','#ffb04a','#c47aff','#ff5a7a'][k]}"/>`).join('');
 let bushes='';for(const [x,y,r] of[[110,150,13],[250,120,12],[150,250,11],[240,280,13],[110,380,12],[200,190,9],[300,250,10]])bushes+=bush(x,y,r);
 const pier=`<g><path d="M262 396l46 30" stroke="#6b3d12" stroke-width="16" stroke-linecap="butt"/><path d="M262 396l46 30" stroke="#b07440" stroke-width="10" stroke-dasharray="6 3"/>${[[270,396],[290,410],[306,420]].map(([x,y])=>`<rect x="${x-3}" y="${y}" width="6" height="16" rx="2" fill="#5a3214"/>`).join('')}<path d="M318 416q18 4 30 0q-4 12-14 13q-12 0-16-13z" fill="#a8642c" stroke="#5a3214" stroke-width="2"/></g>`;
 return`<svg class="island-art" viewBox="0 0 360 430" preserveAspectRatio="none" aria-hidden="true"><defs><radialGradient id="sand${i}" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="${th.soil[0]}"/><stop offset="1" stop-color="${th.soil[1]}"/></radialGradient><radialGradient id="grass${i}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="${th.top}"/><stop offset="1" stop-color="${th.lip}"/></radialGradient></defs>
  <path d="M24 404C-16 330 4 236 24 166S64 30 150 12s180 2 200 76-8 144 12 206-40 128-126 134-198 44-212-24z" fill="${th.sea[2]}" opacity=".75"/>
  <path d="M30 400C-10 330 10 240 30 170S70 40 150 22s170 0 190 70-10 140 10 200-40 120-120 128-190 40-200-20z" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 8" opacity=".8"/>
  ${shore}
  <path d="M42 388C8 322 26 240 44 176S84 54 156 36s156 4 174 68-8 134 8 190-34 108-110 114-176 34-186-20z" fill="url(#sand${i})"/>
  <path d="M60 360C34 300 50 236 64 186S100 76 160 62s132 8 146 60-6 120 6 168-28 86-92 90-150 30-160-20z" fill="url(#grass${i})"/>
  <path d="M300 130q14 50 4 110q-6 30 4 60" stroke="${th.cliff[2]}" stroke-width="10" fill="none" opacity=".55" stroke-linecap="round"/>
  ${bushes}${props}${th.props==='ember'?'':pier}</svg>`}
function routePath(){const p=NODES.map(([x,y])=>[x*3.6,y*4.3]);let d=`M${p[0][0]} ${p[0][1]}`;for(let i=1;i<p.length;i++){const [x0,y0]=p[i-1],[x1,y1]=p[i];d+=` C${x0} ${(y0+y1)/2} ${x1} ${(y0+y1)/2} ${x1} ${y1}`}return d}
function mapScreen(){
 document.body.classList.remove('in-level');const heroes=unlocked(state,storage);if(!heroes.includes(state.selected))state.selected=0;
 const stars=state.results.reduce((n,r)=>n+(r?.stars||0),0),wins=state.results.filter(Boolean).length,next=LEVELS.find(l=>available(state,l.id)&&!state.results[l.id])?.id??29,hero=SPECIES[state.selected];
 app.innerHTML=`<div class="map-screen">
 <header class="map-top"><a class="icon-btn" href="#" aria-label="Back to title">${ICON.back}</a><div class="map-title mini-logo"><span class="w1">MONSTER</span><span class="w2">SLING</span></div><div class="star-total navy" aria-label="${stars} of 90 stars"><span class="pill"><span class="coin">★</span></span>${stars}<small>/90</small></div><button class="icon-btn" id="sound" aria-label="${state.sound?'Mute sound':'Turn sound on'}" aria-pressed="${!!state.sound}">${state.sound?ICON.sound:ICON.mute}</button></header>
 <div class="sea" id="sea">${ISLANDS.map(([name,note],i)=>{const done=LEVELS.filter(l=>l.island===i&&state.results[l.id]).length,open=available(state,i*6);return`<section class="island ${open?'':'island-locked'}" style="--sea:${art.THEMES[i].sea[1]};--sea2:${art.THEMES[i].sea[0]}" id="island-${i}"><div class="island-label"><small>ISLAND ${i+1}</small><h2>${esc(name)}</h2><p>${esc(note)} · ${done}/6</p></div><div class="island-stage">${islandArt(i)}<svg class="route" viewBox="0 0 360 430" preserveAspectRatio="none" aria-hidden="true"><path d="${routePath()}"/></svg>${LEVELS.filter(l=>l.island===i).map((l,k)=>{const ok=available(state,l.id),r=state.results[l.id],cur=l.id===next;return`<button class="level node ${l.boss?'boss':''} ${ok?'':'locked'} ${cur?'current':''} ${r?'done':''}" style="left:${NODES[k][0]}%;top:${NODES[k][1]}%" data-level="${l.id}" ${ok?'':'disabled'} aria-label="Level ${l.number}: ${esc(l.title)}${l.boss?' (boss)':''}${r?`, ${r.stars} stars`:ok?'':', locked'}">${cur?`<img class="node-hero" src="${hero.asset}" alt="">`:''}<span class="node-face">${ok?l.boss?ICON.crown:l.number:ICON.lock}</span><span class="node-stars">${[1,2,3].map(s=>`<i class="${r&&r.stars>=s?'on':''}">★</i>`).join('')}</span></button>`}).join('')}</div></section>`}).join('')}</div>
 <footer class="map-bar"><button class="squad-btn navy" id="squad" aria-label="Choose your hero. Current: ${esc(hero.name)}"><span class="hero-art" style="--hc:${hero.color}"><img src="${hero.asset}" alt=""></span><span><small>HERO</small><b>${esc(hero.name)}</b></span></button><button class="btn primary play-next" data-level="${next}">${ICON.play}<span>${wins?'Continue':'Play'} · ${LEVELS[next].number}</span></button></footer>
 <p class="build">Monster Sling v${VERSION} · progress saved on this device</p></div>`;
 const host=$('.map-screen');
 $('#sound').onclick=()=>{state.sound=!state.sound;persist();Sound.play('ui');mapScreen()};
 $('#squad').onclick=()=>squad(host,()=>mapScreen());
 host.addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(!b||b.disabled)return;const id=+b.dataset.level;if(b.classList.contains('play-next'))return go('#level-'+(id+1));levelCard(host,LEVELS[id])});
 requestAnimationFrame(()=>{const cur=$('.node.current');if(cur){const r=cur.getBoundingClientRect();window.scrollTo({top:Math.max(0,scrollY+r.top-innerHeight*.55),behavior:'instant'})}});
}
function levelCard(host,l,slot=0){const r=state.results[l.id],heroes=unlocked(state,storage),lo=loadoutFor(l);Sound.play('ui');
 const enemies=[...new Set(new Battle(l).enemies.map(e=>e.type))],fresh=SPECIES.find(d=>HERO_UNLOCK_LEVELS[d.id]===l.number);
 const el=overlay(host,`<button class="icon-btn close" data-close aria-label="Close">✕</button><small class="eyebrow">${esc(ISLANDS[l.island][0])} · ${l.boss?(l.number===30?'Final boss':'Island finale'):'Level '+l.number}</small><h2>${esc(l.title)}</h2><div class="card-stars">${[1,2,3].map(s=>`<i class="${r&&r.stars>=s?'on':''}">★</i>`).join('')}</div><p class="muted">${r?`Best score ${r.score.toLocaleString()}`:'Not rescued yet'} · ${l.shots} launches</p>
 <div class="foes" aria-label="Enemies in this level">${enemies.map(t=>`<span class="foe" title="${esc(ENEMY[t].name)}"><img src="${ENEMY[t].sprite}" alt="${esc(ENEMY[t].name)}"></span>`).join('')}</div>
 ${fresh?`<p class="new-hero">New hero: <b>${esc(fresh.name)}</b> · ${esc(fresh.skill)}</p>`:''}
 <div class="lo-head"><b>Your launch order</b><small>Tap a slot, then a hero</small></div>
 <div class="lo-row">${lo.map((id,i)=>`<button class="lo-slot ${i===slot?'on':''}" data-slot="${i}" aria-label="Launch ${i+1}: ${esc(SPECIES[id].name)}"><span class="hero-art" style="--hc:${SPECIES[id].color}"><img src="${SPECIES[id].asset}" alt=""></span><i>${i+1}</i></button>`).join('')}</div>
 <div class="lo-pick">${heroes.map(id=>`<button class="lo-hero ${lo[slot]===id?'on':''}" data-pick="${id}" aria-label="${esc(SPECIES[id].name)}: ${esc(SPECIES[id].skill)}"><span class="hero-art" style="--hc:${SPECIES[id].color}"><img src="${SPECIES[id].asset}" alt=""></span><small>${esc(SPECIES[id].name)}</small></button>`).join('')}</div>
 <p class="muted small">${esc(SPECIES[lo[slot]].name)} · ${esc(SPECIES[lo[slot]].description)}</p>
 <div class="actions"><button class="btn primary big" data-play autofocus>${ICON.play} Play</button></div>`,'card wide');
 el.onclick=e=>{if(e.target===el||e.target.closest('[data-close]'))return closeOverlay(host);if(e.target.closest('[data-play]'))return go('#level-'+l.number);
  const sb=e.target.closest('[data-slot]');if(sb)return levelCard(host,l,+sb.dataset.slot);
  const hb=e.target.closest('[data-pick]');if(hb){const n=[...lo];n[slot]=+hb.dataset.pick;saveLoadout(l,n);Sound.play('hop');return levelCard(host,l,Math.min(slot+1,l.shots-1))}}}
// Monster collection: all heroes with unlock levels and abilities, plus the enemies met so far.
function squad(host,after,tab='heroes'){const heroes=unlocked(state,storage);Sound.play('ui');let reached=1;while(state.results[reached-1]&&reached<30)reached++;
 const heroHTML=`<div class="hero-grid big">${SPECIES.map(d=>{const open=heroes.includes(d.id);return`<button class="hero-tile ${open?'':'locked'} ${d.id===state.selected?'selected':''}" data-hero="${d.id}" aria-label="${esc(d.name)}${open?'':' (locked)'}"><span class="hero-art" style="--hc:${d.color}"><img src="${d.asset}" alt=""></span><b>${esc(d.name)}</b><small>${open?esc(d.skill):'Unlocks at level '+HERO_UNLOCK_LEVELS[d.id]}</small><span class="desc">${esc(d.description)}</span>${d.id===state.selected?'<em class="fav">Leader</em>':''}</button>`}).join('')}</div><p class="muted small">Tap an unlocked hero to make it your leader. It goes first in new loadouts.</p>`;
 const foeHTML=`<div class="hero-grid big">${ENEMY.map(d=>{const met=reached>=d.level;return`<div class="hero-tile foe-tile ${met?'':'locked'}"><span class="hero-art foe-art"><img src="${d.sprite}" alt=""></span><b>${met?esc(d.name):'???'}</b><small>${met?'From level '+d.level:'Appears in level '+d.level}</small><span class="desc">${met?esc(d.tip):'Keep rescuing islands to meet this enemy.'}</span></div>`}).join('')}</div>`;
 const el=overlay(host,`<button class="icon-btn close" data-close aria-label="Close">✕</button><small class="eyebrow">MONSTER COLLECTION</small><h2>${tab==='heroes'?'Heroes':'Enemies'}</h2><div class="tabs"><button class="tab ${tab==='heroes'?'on':''}" data-tab="heroes">Heroes ${heroes.length}/11</button><button class="tab ${tab==='foes'?'on':''}" data-tab="foes">Enemies ${ENEMY.filter(d=>reached>=d.level).length}/11</button></div>${tab==='heroes'?heroHTML:foeHTML}`,'card wide collection');
 el.onclick=e=>{if(e.target===el||e.target.closest('[data-close]')){closeOverlay(host);after?.();return}const tb=e.target.closest('[data-tab]');if(tb)return squad(host,after,tb.dataset.tab);const t=e.target.closest('[data-hero]');if(!t)return;const id=+t.dataset.hero;if(!heroes.includes(id)){Sound.play('hurt');t.classList.remove('nudge');void t.offsetWidth;t.classList.add('nudge');return}state.selected=id;persist();Sound.play('hop');squad(host,after,'heroes')}}
// ───────────────────────────── Title screen ─────────────────────────────
function titleScreen(){
 document.body.classList.remove('in-level');window.scrollTo(0,0);const heroes=unlocked(state,storage);if(!heroes.includes(state.selected))state.selected=0;
 const stars=state.results.reduce((n,r)=>n+(r?.stars||0),0),next=LEVELS.find(l=>available(state,l.id)&&!state.results[l.id])?.id??29,wins=state.results.filter(Boolean).length;
 // Slimelet sits in the sling; the rest of the starring cast bounce around it (as in the key art).
 const cast=[[2,'6%','30%',30,0],[3,'64%','26%',28,1],[5,'2%','58%',31,2],[4,'66%','56%',30,3]];
 app.innerHTML=`<div class="title-screen"><canvas class="title-bg" aria-hidden="true"></canvas><div class="title-leaves" aria-hidden="true"></div>
 <div class="title-top"><a class="icon-btn" href="./index.html" aria-label="Back to Monster Island">${ICON.back}</a><div class="player navy" aria-label="${stars} of 90 stars"><span class="avatar">★</span><div><b>${stars}<small style="font-size:12px;opacity:.75"> / 90</small></b><div class="bar"><i style="width:${stars/90*100}%"></i></div></div></div><span class="spacer"></span><button class="icon-btn" id="t-sound" aria-label="${state.sound?'Mute sound':'Turn sound on'}">${state.sound?ICON.sound:ICON.mute}</button><button class="icon-btn" id="t-help" aria-label="How to play">${ICON.help}</button></div>
 <h1 class="logo" aria-label="Monster Sling"><span class="logo-board" aria-hidden="true"><i class="fl a"></i><i class="fl b"></i></span><span class="w1" aria-hidden="true">M<span class="o"><img src="${SPECIES[0].asset}" alt=""></span>NSTER</span><span class="w2" aria-hidden="true">SLING</span></h1>
 <div class="heroes-stage" aria-hidden="true">${cast.map(([id,l,t,w,i])=>`<img class="cast" src="${SPECIES[id].asset}" alt="" style="left:${l};top:${t};width:${w}%;animation-delay:${-i*.7}s">`).join('')}${slingSVG(SPECIES[0].asset)}</div>
 <div class="play-pedestal"><button class="play-big" data-level="${next}" aria-label="Play level ${LEVELS[next].number}">${ICON.play}PLAY</button><small class="continue">${wins?`Continue · Level ${LEVELS[next].number} — ${esc(LEVELS[next].title)}`:'Rescue the first island!'}</small></div>
 <div class="stone-row"><button class="stone-btn" id="t-squad"><span class="st-ico"><img src="${SPECIES[state.selected].asset}" alt=""></span>Monsters</button><button class="stone-btn" id="t-map"><span class="st-ico">${ICON.islands}</span>Islands</button><button class="stone-btn" id="t-settings"><span class="st-ico">${ICON.gear}</span>Settings</button></div>
 <p class="title-foot">Monster Sling v${VERSION} · progress saved on this device</p></div>`;
 const host=$('.title-screen');paintTitleBackdrop($('.title-bg'));
 $('.play-big').onclick=()=>{Sound.play('ui');go('#level-'+(next+1))};
 $('#t-map').onclick=()=>{Sound.play('ui');go('#map')};
 $('#t-squad').onclick=()=>squad(host,()=>titleScreen());
 $('#t-help').onclick=()=>{Sound.play('ui');const el=overlay(host,helpHTML()+'<div class="actions"><button class="btn primary" data-back autofocus>Got it</button></div>','help');el.onclick=e=>{if(e.target===el||e.target.closest('[data-back]'))closeOverlay(host)}};
 $('#t-sound').onclick=()=>{state.sound=!state.sound;persist();Sound.play('ui');titleScreen()};
 $('#t-settings').onclick=()=>settings(host);
}
// The title backdrop is drawn by the game's own scenery renderer: cliffs, waterfalls and the lagoon.
function paintTitleBackdrop(cv){try{const r=cv.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.max(1,r.width),h=Math.max(1,r.height);cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const sc=new art.Scenery(0),S=Math.max(.7,Math.min(1.6,h/620)),gy=h*.93;
  sc.back(c,{w,h,S,cx:600,cy:600,cy0:600,horizon:gy-150*S*1.35,groundScreen:()=>gy},2000);
  const g=c.createLinearGradient(0,gy-30,0,h);g.addColorStop(0,'#f6e3b0');g.addColorStop(1,'#e2c487');c.fillStyle=g;c.fillRect(0,gy-8,w,h);}catch{}}
function settings(host){Sound.play('ui');const fs=document.fullscreenEnabled?`<button class="toggle" data-act="full">${ICON.full}<span>${document.fullscreenElement?'Exit full screen':'Full screen'}</span></button>`:'';
 const el=overlay(host,`<button class="icon-btn close" data-close aria-label="Close">✕</button><small class="eyebrow">SETTINGS</small><h2>Settings</h2><div class="toggles"><button class="toggle ${state.sound?'on':''}" data-act="sound" aria-pressed="${!!state.sound}">${state.sound?ICON.sound:ICON.mute}<span>Sound ${state.sound?'on':'off'}</span></button><button class="toggle ${state.effects!=='reduced'?'on':''}" data-act="fx" aria-pressed="${state.effects!=='reduced'}">${ICON.sparkle}<span>${state.effects==='reduced'?'Calm effects':'Full effects'}</span></button>${fs}</div><p class="muted small">Progress is saved on this device. Clearing site data deletes it.</p><div class="actions"><button class="btn primary" data-close autofocus>Done</button></div>`,'card');
 el.onclick=e=>{if(e.target===el||e.target.closest('[data-close]')){closeOverlay(host);titleScreen();return}const a=e.target.closest('[data-act]')?.dataset.act;if(a==='sound'){state.sound=!state.sound;persist();settings(host)}if(a==='fx'){state.effects=state.effects==='reduced'?'full':'reduced';persist();settings(host)}if(a==='full'){const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen({navigationUI:'hide'});Promise.resolve(p).catch(()=>notify('Full screen is not available here.')).finally(()=>settings(host))}}}
// Wooden sling with a red band, drawn as SVG for the title screen.
function slingSVG(hero){return`<svg class="slingY" viewBox="0 0 400 300" aria-hidden="true"><defs><linearGradient id="tw" x1="0" x2="1"><stop offset="0" stop-color="#8a4f22"/><stop offset=".45" stop-color="#d8954e"/><stop offset="1" stop-color="#7a431b"/></linearGradient></defs>
 <path d="M200 300V170M200 170L96 40M200 170L304 40" fill="none" stroke="#3c1f0a" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"/>
 <path d="M200 300V170M200 170L96 40M200 170L304 40" fill="none" stroke="url(#tw)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
 <path d="M188 290V180M104 52l88 104" stroke="#f3c07e" stroke-width="6" stroke-linecap="round" opacity=".55" fill="none"/>
 <g fill="#c22d22" stroke="#4a0d07" stroke-width="4"><rect x="70" y="50" width="52" height="30" rx="8" transform="rotate(38 96 65)"/><rect x="278" y="50" width="52" height="30" rx="8" transform="rotate(-38 304 65)"/></g>
 ${hero?`<image href="${hero}" x="118" y="-6" width="164" height="164"/>`:''}<path d="M84 70Q200 190 316 70" fill="none" stroke="#4a0d07" stroke-width="34" stroke-linecap="round"/><path d="M84 70Q200 190 316 70" fill="none" stroke="#e2402f" stroke-width="26" stroke-linecap="round"/><path d="M100 76Q200 168 300 76" fill="none" stroke="#ff8a7a" stroke-width="5" stroke-linecap="round" opacity=".6"/>
 <g fill="#4fb33a" stroke="#1d5c18" stroke-width="3"><path d="M150 292q-36-30-10-58q14 34 10 58z"/><path d="M168 296q14-48 50-48q-20 32-50 48z"/><path d="M250 292q36-30 10-58q-14 34-10 58z"/><path d="M232 296q-14-48-50-48q20 32 50 48z"/></g><g fill="#fff"><circle cx="186" cy="282" r="7"/><circle cx="222" cy="288" r="6"/></g></svg>`}

// ───────────────────────────── Routing ─────────────────────────────
function go(hash){if(location.hash===hash)route();else location.hash=hash}
function route(){game?.destroy();game=null;state=load(storage);const m=location.hash.match(/^#level-(\d+)$/);if(m){const id=+m[1]-1;if(LEVELS[id]&&available(state,id)){game=new Game(LEVELS[id]);return}}if(location.hash==='#map')mapScreen();else titleScreen()}
addEventListener('hashchange',route);
addEventListener('pageshow',e=>{if(e.persisted)route()});
addEventListener('pagehide',()=>{game?.pause(true);Sound.suspend()});

// ───────────────────────────── Battle stage ─────────────────────────────
const MAXPULL=100,GRAB_PX=58;
class Game{
 constructor(level){
  this.level=level;this.abort=new AbortController();this.alive=true;
  const heroes=unlocked(state,storage);if(!heroes.includes(state.selected))state.selected=0;this.heroesBefore=heroes;
  this.loadout=loadoutFor(level);this.world=new Battle(level,this.loadout[0]);this.scenery=new art.Scenery(level.island);this.fx=new art.Particles();
  this.fortBox=this.bounds();
  this.cam={cx:0,cy:0,z:1,userZ:1,mode:'intro',t:0,shake:0,minZ:.4,maxZ:2};
  this.pointers=new Map();this.gesture=null;this.pull={x:0,y:0};this.pouch={x:0,y:0,vx:0,vy:0};
  this.load={t:1};this.loaded=false;this.ready=false;this.trails=[];this.trail=null;this.lastTrail=0;
  this.vis=new Map();this.squad=[];this.time=0;this.acc=0;this.last=0;this.result=null;this.frameTimes=[];this.quality=1;this.paused=false;this.trayOpen=false;
  this.firstFlightHint=!state.tutorial;this.score=0;
  this.build();this.resize();this.camToIntro();this.prepare(this.world.species);this.fx.setBudget(this.budget());this.syncSquad();
  this.raf=requestAnimationFrame(t=>this.frame(t));
  this.updateHud(true);
  this.cards=[];if(this.portrait&&!rotateSeen())this.cards.push(()=>this.rotateCard());
  const newEnemy=ENEMY.find(e=>e.level===level.number);if(newEnemy&&!state.results[level.id])this.cards.push(()=>this.enemyCard(newEnemy));
  this.nextCard();
 }
 // Portrait works, but landscape shows the sling and the fort together: recommend it once per session.
 nextCard(){const f=this.cards.shift();if(f)f()}
 enemyCard(d){Sound.play('ui');const el=overlay(this.stage,`<small class="eyebrow">NEW ENEMY · LEVEL ${d.level}</small><div class="enemy-reveal"><img src="${d.sprite}" alt=""></div><h2>${esc(d.name)}</h2><p class="muted">${esc(d.tip)}</p><div class="actions"><button class="btn primary big" data-ok autofocus>Let’s go!</button></div>`,'enemy-intro');el.onclick=e=>{if(e.target.closest('[data-ok]')){Sound.play('ui');closeOverlay(this.stage);this.nextCard()}}}
 shotIndex(){return this.level.shots-this.world.shots}
 rotateCard(){markRotateSeen();const el=overlay(this.stage,`<div class="rotate-art" aria-hidden="true">${ICON.rotate}</div><small class="eyebrow">BEST WITH A WIDE VIEW</small><h2>Turn your phone sideways</h2><p class="muted">Landscape shows your sling and the bandits' fort together, so you can see exactly what you are aiming at.</p><p class="muted small" id="rotate-note">In portrait, a <b>TARGET</b> window shows the fort while you aim.</p><div class="actions"><button class="btn ghost" data-act="keep">Keep portrait</button><button class="btn primary" data-act="rotate" autofocus>${ICON.rotate} Rotate</button></div>`,'rotate');
  el.onclick=async e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(a==='keep'){Sound.play('ui');closeOverlay(this.stage);this.nextCard()}else if(a==='rotate'){Sound.play('ui');if(await goLandscape()){closeOverlay(this.stage);this.nextCard()}else{const n=el.querySelector('#rotate-note');if(n)n.innerHTML='Your browser cannot rotate by itself. <b>Turn your phone sideways</b> (switch on auto-rotate), or tap Keep portrait.'}}}}
 bounds(){const xs=[],ys=[];for(const b of[...this.world.blocks,...this.world.enemies]){const e=b.r||Math.max(b.w,b.h)/2;xs.push(b.x-e,b.x+e);ys.push(b.y-e)}return{x0:Math.min(...xs),x1:Math.max(...xs,this.world.crystal+30),top:Math.min(...ys)}}
 // ── DOM ──
 build(){
  document.body.classList.add('in-level');window.scrollTo(0,0);const l=this.level,d=SPECIES[this.world.species];
  app.innerHTML=`<section class="stage" id="stage" aria-label="Monster Sling level ${l.number}">
  <canvas id="field" tabindex="0" role="application" aria-label="Battlefield. Drag your monster back and release to launch. Tap during flight or press Space for the skill."></canvas>
  <div class="hud">
   <div class="hud-top">
    <div class="hud-level"><span class="lvl-ava">${islandAvatar(l.island)}</span><div class="lvl-info navy"><b>Level ${l.number}</b><span>${esc(l.title)}</span><div class="lvl-bar"><i id="lvl-bar"></i></div><div class="lvl-stars" id="lvl-stars" aria-label="Stars you can still earn"><i>★</i><i>★</i><i>★</i></div></div></div>
    <div class="hud-score navy" aria-label="Score"><span class="pill"><span class="coin">★</span></span><b id="score">0</b><small>SCORE</small></div>
    <button class="hud-btn" id="pause" aria-label="Pause">${ICON.pause}</button>
   </div>
   <div class="hud-goal navy" id="bandits" aria-label="Defeat all enemies"><span class="g-ico"><img src="${ENEMY[Math.max(...this.world.enemies.map(e=>e.type))].sprite}" alt=""></span><span class="g-txt"><small>Defeat all<br>enemies</small><b id="goal">0/${this.world.initialCount}</b></span></div>
   ${this.world.wind?`<div class="hud-wind navy" aria-label="${this.world.wind<0?'Headwind':'Tailwind'}"><span class="arrow" style="transform:scaleX(${Math.sign(this.world.wind)})">➜</span><b>${this.world.wind<0?'Headwind':'Tailwind'}</b></div>`:''}
   <p class="hud-toast" id="toast" role="status"></p>
   <button class="hud-btn cam-reset" id="cam-reset" aria-label="Recenter camera" hidden>${ICON.target}</button>
   <div class="hud-bottom">
    <div class="next-box navy"><span class="tab">Next</span><div class="hud-shots" id="shots" aria-label="Monsters left"></div><div id="picks" style="display:flex;gap:6px;align-items:flex-end"></div><button class="hero-btn" id="hero-btn" aria-label="All heroes">${ICON.swap}</button></div>
    <div class="right-cards"><button class="card-btn next-btn" id="next" hidden aria-label="End this shot">${ICON.next}</button><button class="card-btn skill-btn" id="skill" aria-label="Use skill"><span class="skill-ring"></span><span class="skill-ico">${ICON.sparkle}</span><small id="skill-name">${esc(d.skill)}</small><span class="badge" id="skill-badge">1</span></button></div>
   </div>
  </div>
  <div class="hand" id="hand" aria-hidden="true"></div>
  <div class="tray" id="tray" aria-hidden="true"></div>
  </section>`;
  this.stage=$('#stage');this.canvas=$('#field');this.c=this.canvas.getContext('2d');
  const sig={signal:this.abort.signal},cv=this.canvas;
  cv.addEventListener('pointerdown',e=>this.down(e),sig);cv.addEventListener('pointermove',e=>this.move(e),sig);
  cv.addEventListener('pointerup',e=>this.up(e,false),sig);cv.addEventListener('pointercancel',e=>this.up(e,true),sig);
  cv.addEventListener('lostpointercapture',e=>{if(this.pointers.has(e.pointerId))this.up(e,true)},sig);
  cv.addEventListener('wheel',e=>{e.preventDefault();if(this.gesture?.type==='aim')return;this.zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*.0015))},{passive:false,...sig});
  cv.addEventListener('contextmenu',e=>e.preventDefault(),sig);
  addEventListener('keydown',e=>this.key(e),sig);
  addEventListener('blur',()=>this.cancelGestures(),sig);
  addEventListener('resize',()=>{this.cancelGestures();this.resize()},sig);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.cancelGestures();this.pause(true);Sound.suspend()}else{this.last=0}},sig);
  this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this.stage);
  $('#pause').onclick=()=>this.pause();
  $('#skill').onclick=()=>this.useSkill();
  $('#next').onclick=()=>{if(this.world.next())this.afterShot()};
  $('#hero-btn').onclick=()=>this.trayOpen?this.closeTray():this.openTray();
  $('#picks').onclick=e=>{const b=e.target.closest('[data-slot]');if(!b||b.disabled)return;const k=+b.dataset.slot,i=this.shotIndex();if(k===i)return this.openTray();[this.loadout[i],this.loadout[k]]=[this.loadout[k],this.loadout[i]];saveLoadout(this.level,this.loadout);this.pick(this.loadout[i],false)};
  $('#cam-reset').onclick=()=>{Sound.play('ui');this.cam.userZ=1;this.cam.mode=this.world.status==='flight'?'follow':this.result?'result':'aim';this.updateHud()};
 }
 destroy(){this.alive=false;cancelAnimationFrame(this.raf);clearTimeout(this.toastT);this.abort.abort();this.ro?.disconnect();this.pointers.clear();this.gesture=null;document.body.classList.remove('in-level')}
 resize(){if(!this.alive)return;const r=this.stage.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);
  // Cap the backing store: crisp on phones, but never more than ~2.4M pixels.
  let dpr=Math.min(2,devicePixelRatio||1)*this.quality;if(w*h*dpr*dpr>2.4e6)dpr=Math.sqrt(2.4e6/(w*h));
  const changed=w!==this.w||h!==this.h||dpr!==this.dpr;this.w=w;this.h=h;this.dpr=dpr;if(changed){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr)}
  const wasPortrait=this.portrait;this.portrait=h>w*1.05;if(!this.portrait&&this.stage.querySelector(':scope > .overlay.rotate.show')){closeOverlay(this.stage);this.nextCard()}if(wasPortrait!==undefined&&wasPortrait!==this.portrait&&this.cam.mode==='free'){this.cam.mode=this.world.status==='flight'?'follow':'aim';this.cam.userZ=1}this.base=this.portrait?clamp(w/420,.45,1.4):clamp(h/490,.45,1.6);this.groundFrac=this.portrait?.74:clamp(1-(Math.min(86,h*.2)+14)/h,.74,.84);
  this.hudBottom=(document.querySelector('.hud-goal')?.getBoundingClientRect().bottom||document.querySelector('.hud-top')?.getBoundingClientRect().bottom||56)-r.top;this.cam.minZ=clamp((w/this.base)/1650,.3,1);this.cam.maxZ=this.portrait?1.9:2.2;this.cam.z=clamp(this.cam.z,this.cam.minZ,this.cam.maxZ);this.cam.userZ=clamp(this.cam.userZ,this.cam.minZ,this.cam.maxZ);this.clampCam()}
 get S(){return this.base*this.cam.z}
 cy0(z=this.cam.z){const S=this.base*z;return GROUND-(this.h*this.groundFrac-this.h/2)/S}
 toScreen(x,y){return{x:this.w/2+(x-this.cam.cx)*this.S,y:this.h/2+(y-this.cam.cy)*this.S}}
 toWorld(sx,sy){const r=this.canvas.getBoundingClientRect();return{x:this.cam.cx+(sx-r.left-this.w/2)/this.S,y:this.cam.cy+(sy-r.top-this.h/2)/this.S}}
 clampCam(c=this.cam){const S=this.base*c.z,half=this.w/2/S;const lo=-180+half,hi=1520-half;c.cx=lo>hi?(lo+hi)/2:clamp(c.cx,lo,hi);c.cy=clamp(c.cy,this.cy0(c.z)-700,this.cy0(c.z))}
 // Camera targets
 aimTarget(z=this.cam.userZ){const S=this.base*z,frac=this.portrait?.3:.22;return{cx:SLING.x+(.5-frac)*this.w/S,cy:this.cy0(z),z}}
 fortTarget(){const f=this.fortBox,width=f.x1-f.x0+220,tall=GROUND-f.top+60,fitW=(this.w/this.base)/width,fitH=(this.h*this.groundFrac-84)/(tall*this.base),fit=clamp(Math.min(fitW,fitH),this.cam.minZ,1.05);return{cx:(f.x0+f.x1)/2,cy:this.cy0(fit),z:fit}}
 camToIntro(){const f=this.fortTarget();Object.assign(this.cam,{cx:f.cx,cy:f.cy,z:f.z,mode:'intro',t:0});this.clampCam()}
 updateCamera(dt){
  const c=this.cam,w=this.world;c.t+=dt;if(this.gesture?.type==='aim'||c.mode==='free'){this.clampCam();return}
  let T,k=4;
  switch(c.mode){
   case'intro':{if(overlayOpen(this.stage))c.t=0;const hold=reduced()?.5:1.2,pan=reduced()?.4:1.1;T=c.t<hold?this.fortTarget():this.aimTarget();k=c.t<hold?6:2.6;if(c.t>hold+pan){c.mode='aim';this.hopIn()}break}
   case'aim':T=this.aimTarget();k=3.4;if(!this.loaded&&w.status==='ready')this.hopIn();break;
   case'follow':{const p=w.projectile;if(!p){c.mode='impact';c.t=0;T=this.impactTarget();break}const z=c.userZ,S=this.base*z,ahead=clamp(p.vx*.22,-120,240);T={cx:p.x+ahead,cy:Math.min(this.cy0(z),p.y+(this.h/2-90)/S),z};
    // Keep the fort in frame on wide screens whenever it fits alongside the monster.
    const f=this.fortBox,half=this.w/2/S;if(f.x1-p.x<2*half-160&&p.x>SLING.x+60)T.cx=Math.max(T.cx,Math.min(f.x1+60-half,p.x+half-120));k=5.5;break}
   case'impact':T=this.impactTarget();k=3.2;if(w.status==='ready'&&((c.t>.9&&!w.busy(30))||c.t>2.8)){c.mode='aim';c.t=0}break;
   case'result':T=this.fortTarget();k=2.2;break;
   default:T={cx:c.cx,cy:c.cy,z:c.z};
  }
  const a=1-Math.exp(-dt*k);c.cx+=(T.cx-c.cx)*a;c.cy+=(T.cy-c.cy)*a;c.z+=(T.z-c.z)*a;this.clampCam();
 }
 impactTarget(){const f=this.world.focus,z=this.portrait?Math.min(this.cam.userZ,Math.max(this.cam.minZ,this.fortTarget().z*1.1)):this.cam.userZ,S=this.base*z;const x=f?f.x:(this.fortBox.x0+this.fortBox.x1)/2;return{cx:clamp(x,SLING.x+this.w/2/S*.4,1500),cy:this.cy0(z),z}}
 shake(px){if(reduced())return;this.cam.shake=Math.min(14,Math.max(this.cam.shake,px))}
 zoomAt(sx,sy,f){const c=this.cam,before=this.toWorld(sx,sy);c.z=clamp(c.z*f,c.minZ,c.maxZ);c.userZ=c.z;const after=this.toWorld(sx,sy);c.cx+=before.x-after.x;c.cy+=before.y-after.y;c.mode='free';this.clampCam();this.updateHud()}
 // ── Loaded monster ──
 async prepare(id){this.ready=false;try{await prepareMonster(id);if(this.alive&&this.world.species===id)this.ready=true}catch{if(this.alive)notify('Reconnect to download your monster artwork.')}}
 hopIn(){if(this.world.status!=='ready'||this.loaded||this.result)return;this.loaded=true;this.load={t:0};this.pull={x:0,y:0};this.pouch={x:0,y:0,vx:0,vy:0};Sound.play('hop');const v=this.visual('loaded');mood(v,'excited',900);this.syncSquad();this.updateHud()}
 visual(key,species=this.world.species){let v=this.vis.get(key);if(!v){v={id:key==='loaded'?2:key,level:species,r:29,x:SLING.x,y:SLING.y,vx:0,vy:0,contact:true};this.vis.set(key,v)}if(key==='loaded')v.level=species;return v}
 syncSquad(){const n=Math.max(0,this.world.shots-(this.loaded?1:0)),start=this.shotIndex()+(this.loaded?1:0);while(this.squad.length<n)this.squad.push({id:900+this.squad.length,level:0,r:19,x:0,y:0,vx:0,vy:0,contact:true});this.squad.length=n;this.squad.forEach((m,i)=>{m.level=this.loadout[start+i]??this.world.species;prepareMonster(m.level).catch(()=>{})})}
 monsterPos(){if(!this.loaded)return null;if(this.load.t<1){const t=ease(this.load.t),from={x:128,y:GROUND-21};return{x:lerp(from.x,SLING.x,t),y:lerp(from.y,SLING.y,t)-Math.sin(Math.min(1,this.load.t)*Math.PI)*70}}return{x:SLING.x+this.pull.x,y:SLING.y+this.pull.y}}
 // ── Input ──
 down(e){
  if(overlayOpen(this.stage)||this.paused)return;if(this.trayOpen){this.closeTray();return}e.preventDefault();this.canvas.focus({preventScroll:true});
  try{this.canvas.setPointerCapture(e.pointerId)}catch{}
  this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  // A second finger always means "look around": it cancels an aim without launching.
  if(this.pointers.size>=2){if(this.gesture?.type==='aim')this.cancelAim();const [a,b]=[...this.pointers.values()];this.gesture={type:'pinch',d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:this.cam.z,mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};this.cam.mode='free';this.updateHud();return}
  if(this.gesture?.type==='pinch-end')return;
  const w=this.world;
  if(this.result)return;
  if(w.status==='flight'){this.useSkill();this.gesture={type:'tap'};return}
  if(this.cam.mode==='intro'){this.cam.mode='aim';this.cam.t=0;this.hopIn();this.gesture={type:'tap'};return}
  const p=this.toWorld(e.clientX,e.clientY),m=this.monsterPos();
  if(w.status==='ready'&&this.ready&&this.loaded&&this.load.t>=1&&m){const d=Math.hypot(p.x-m.x,p.y-m.y)*this.S;if(d<=Math.max(GRAB_PX,44*this.S)){// grab relative to the resting pouch, so a still-wobbling band never adds hidden pull
   this.gesture={type:'aim',id:e.pointerId,ox:p.x-SLING.x,oy:p.y-SLING.y};this.pouch={x:0,y:0,vx:0,vy:0};this.pull={x:0,y:0};this.hideHand();Sound.play('grab');mood(this.visual('loaded'),'excited',1500);this.updateHud();return}}
  this.gesture={type:'pan',id:e.pointerId,x:e.clientX,y:e.clientY,moved:0};
 }
 move(e){const pt=this.pointers.get(e.pointerId);if(!pt)return;pt.x=e.clientX;pt.y=e.clientY;const g=this.gesture;if(!g)return;
  if(g.type==='aim'&&g.id===e.pointerId){const p=this.toWorld(e.clientX,e.clientY);let dx=p.x-g.ox-SLING.x,dy=p.y-g.oy-SLING.y;const n=Math.hypot(dx,dy);if(n>MAXPULL){dx*=MAXPULL/n;dy*=MAXPULL/n}dy=Math.min(dy,GROUND-30-SLING.y);const before=Math.hypot(this.pull.x,this.pull.y);this.pull={x:dx,y:dy};const after=Math.hypot(dx,dy);if(Math.abs(after-before)>4)Sound.play('stretch',after/MAXPULL)}
  else if(g.type==='pan'&&g.id===e.pointerId){const dx=e.clientX-g.x,dy=e.clientY-g.y;g.moved+=Math.abs(dx)+Math.abs(dy);g.x=e.clientX;g.y=e.clientY;if(g.moved>6){this.cam.mode='free';this.cam.cx-=dx/this.S;this.cam.cy-=dy/this.S;this.clampCam();this.updateHud()}}
  else if(g.type==='pinch'&&this.pointers.size>=2){const [a,b]=[...this.pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};const before=this.toWorld(g.mid.x,g.mid.y);this.cam.z=clamp(g.z*d/g.d,this.cam.minZ,this.cam.maxZ);this.cam.userZ=this.cam.z;const after=this.toWorld(mid.x,mid.y);this.cam.cx+=before.x-after.x;this.cam.cy+=before.y-after.y;g.mid=mid;g.z=this.cam.z;g.d=d;this.clampCam()}
 }
 up(e,cancelled){if(!this.pointers.has(e.pointerId))return;this.pointers.delete(e.pointerId);const g=this.gesture;
  if(g?.type==='aim'&&g.id===e.pointerId){if(cancelled)this.cancelAim();else this.release()}
  else if(g?.type==='pinch'){this.gesture=this.pointers.size?{type:'pinch-end'}:null}
  if(!this.pointers.size&&this.gesture?.type!=='aim')this.gesture=null;
 }
 cancelGestures(){if(this.gesture?.type==='aim')this.cancelAim();this.gesture=null;this.pointers.clear()}
 cancelAim(){this.springBack();this.gesture=null}
 springBack(){this.pouch={x:this.pull.x,y:this.pull.y,vx:0,vy:0}}
 release(){const w=this.world,dx=-this.pull.x,dy=-this.pull.y;this.gesture=null;
  if(Math.hypot(dx,dy)<8||!w.launch(dx,dy)){this.springBack();Sound.play('snap');return}
  this.pouch={x:this.pull.x,y:this.pull.y,vx:dx*12,vy:dy*12};this.pull={x:0,y:0};
  const p=w.projectile,v=this.visual('loaded');this.vis.delete('loaded');v.id=p.id;this.vis.set(p.id,v);v.x=p.x;v.y=p.y;this.loaded=false;mood(v,'surprise',700);
  if(this.trail)this.trails.push(this.trail);if(this.trails.length>1)this.trails.shift();this.trail={pts:[]};
  this.cam.mode='follow';this.cam.t=0;Sound.play('launch',.8+Math.hypot(dx,dy)/MAXPULL*.4);this.syncSquad();this.updateHud();
  if(this.firstFlightHint)this.toast('Tap anywhere to use '+SPECIES[w.species].skill+'!',2400);
 }
 useSkill(){const w=this.world,p=w.projectile;if(!w.skill())return;const v=p&&this.vis.get(p.id);if(v){react(v,'happy',900);v.skillT=performance.now()}
  art.skillBurst(this.fx,p.species,p.x,p.y,this.fxScale());Sound.play('skill',p.species);if([4,7,10].includes(p.species))this.shake(p.species===10?10:7);
  this.firstFlightHint=false;$('#toast')?.classList.remove('show');if(!state.tutorial){state.tutorial=1;persist()}this.updateHud()}
 fxScale(){return reduced()?.45:this.quality<1?.65:1}
 key(e){if(this.trayOpen&&e.key==='Escape'){this.closeTray();return}if(overlayOpen(this.stage)){if(e.key==='Escape'&&this.paused)this.resume();return}
  if(e.code==='Space'){e.preventDefault();this.useSkill()}else if(e.key==='Escape'||e.key==='p'){this.pause()}else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){this.cam.mode='free';this.cam.cx+=(e.key==='ArrowLeft'?-80:80)/this.cam.z;this.clampCam();this.updateHud()}else if(e.key==='0'){this.cam.userZ=1;this.cam.mode='aim'}}
 // ── Shot lifecycle ──
 afterShot(){if(this.world.status==='ready'){const id=this.loadout[this.shotIndex()];if(id!=null&&id!==this.world.species){this.world.species=id;this.prepare(id);this.syncSquad()}this.updateHud(true)}const c=this.cam;if(c.mode==='follow'||c.mode==='free'){c.mode='impact';c.t=0}this.updateHud()}
 handleEvents(){const w=this.world,scale=this.fxScale();
  for(const ev of w.events.splice(0)){
   switch(ev.t){
    case'break':art.breakBurst(this.fx,ev,scale);Sound.play(ev.kind+'Break');if(ev.kind==='stone')this.shake(3);this.fx.add({type:'text',x:ev.x,y:ev.y-10,vy:-36,drag:1.4,size:13,text:'+'+ev.points,color:'#fff4cf',life:1});break;
    case'pop':art.popBurst(this.fx,ev,scale);Sound.play(ev.boss?'boss':'pop');if(ev.boss)this.shake(9);break;
    case'hurt':if(ev.kind==='enemy')Sound.play('hurt');break;
    case'impact':art.impactDust(this.fx,ev.x,ev.y,ev.kind,ev.speed,scale);Sound.play(ev.ground?'ground':ev.kind==='enemy'?'thud':ev.kind,ev.speed/400);break;
    case'thud':{const p=w.projectile,v=p&&this.vis.get(p.id);if(v){kick(v,clamp(ev.speed/1400,.08,.42));if(ev.speed>380)mood(v,'hurt',500)}Sound.play('thud',ev.speed/500);break}
    case'shotEnd':this.afterShot();break;
    case'clang':art.impactDust(this.fx,ev.x,ev.y,'stone',300,scale);for(let i=0;i<6*scale;i++)this.fx.add({type:'spark',x:ev.x,y:ev.y,vx:(Math.random()-.5)*300,vy:-Math.random()*240,g:600,color:'#fff3b0',width:2,life:.3});Sound.play('stone',1);break;
    case'block':this.fx.add({type:'text',x:ev.x,y:ev.y-30,vy:-30,drag:1.4,size:13,text:ev.type===9?'Faded!':'Blocked!',color:'#cfe0ff',life:.9});break;
    case'ink':Sound.play('ink');for(let i=0;i<8*scale;i++)this.fx.add({type:'puff',x:ev.x-20,y:ev.y,vx:-80-Math.random()*120,vy:(Math.random()-.5)*80,drag:2,size:8,grow:30,color:'rgba(40,24,70,.6)',life:.7});break;
    case'inkClear':for(let i=0;i<10*scale;i++)this.fx.add({type:'puff',x:ev.x+(Math.random()-.5)*120,y:ev.y+(Math.random()-.5)*80,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*200,drag:2,size:10,grow:20,color:'rgba(40,24,70,.35)',life:.6});break;
    case'squawk':Sound.play('squawk');for(let i=0;i<6*scale;i++)this.fx.add({type:'feather',x:ev.x,y:ev.y,vx:(Math.random()-.5)*160,vy:-Math.random()*120,g:80,drag:1.5,va:4,size:5,color:'#ffffff',life:1.2});break;
    case'prick':Sound.play('prick');{const p=w.projectile,v=p&&this.vis.get(p.id);if(v)mood(v,'hurt',700)}this.fx.add({type:'text',x:ev.x,y:ev.y-24,vy:-40,drag:1.4,size:15,text:'Ouch!',color:'#ffd0d0',life:.9});break;
    case'splash':art.splash(this.fx,ev.x,ev.y,ev.big,scale);Sound.play('splash',ev.big?1:.5);break;
    case'burn':art.burn(this.fx,ev.x,ev.y,scale);Sound.play('burn');break;
    case'light':art.lightFlash(this.fx,ev.x,ev.y,ev.r,scale);Sound.play('light');break;
    case'short':for(let i=0;i<10*scale;i++)this.fx.add({type:'spark',x:ev.x,y:ev.y-10,vx:(Math.random()-.5)*360,vy:-Math.random()*300,g:500,color:'#8fe8ff',width:2,life:.4});Sound.play('short');this.fx.add({type:'text',x:ev.x,y:ev.y-40,vy:-30,drag:1.4,size:15,text:'Shorted!',color:'#bff3ff',life:1.1});break;
    case'steam':for(let i=0;i<12*scale;i++)this.fx.add({type:'puff',x:ev.x+(Math.random()-.5)*80,y:ev.y-20,vx:(Math.random()-.5)*80,vy:-60-Math.random()*80,drag:1.2,size:12,grow:40,color:'rgba(240,240,240,.6)',life:1.1});Sound.play('steam');this.fx.add({type:'text',x:ev.x,y:ev.y-70,vy:-30,drag:1.4,size:17,text:'Cooled!',color:'#e6f7ff',life:1.2});break;
    case'armor':art.breakBurst(this.fx,{kind:'stone',x:ev.x,y:ev.y,w:60,h:60,a:0,vx:0,vy:0},scale);this.fx.add({type:'text',x:ev.x,y:ev.y-50,vy:-30,drag:1.4,size:16,text:'Armour broken!',color:'#ffe9a6',life:1.2});Sound.play('stoneBreak');break;
    case'boss':this.toast(ev.phase===2?'The Magma Lord’s armour cracked! Hit the glowing core!':'Magma shield! Cool it with water or ice, or drop the boulder!',3200);Sound.play('boss');break;
    case'erupt':Sound.play('erupt');this.shake(6);break;
    case'win':this.finish(true);break;
    case'lose':this.finish(false);break;
   }}
 }
 // ── Tray (hero selection between shots) ──
 openTray(){if(this.world.status!=='ready'||this.gesture?.type==='aim'||overlayOpen(this.stage)||this.result)return;const heroes=unlocked(state,storage);Sound.play('ui');this.trayOpen=true;const t=$('#tray');t.setAttribute('aria-hidden','false');t.classList.add('open');
  t.innerHTML=`<div class="tray-head"><b>Launch ${this.shotIndex()+1} of ${this.level.shots}</b><span id="tray-skill">${esc(SPECIES[this.world.species].skill)} · ${esc(SPECIES[this.world.species].description)}</span><button class="icon-btn" data-close aria-label="Close hero tray">✕</button></div><div class="tray-row">${SPECIES.map(d=>heroCard(d,heroes.includes(d.id),d.id===this.world.species?'selected':'')).join('')}</div>`;
  t.onclick=e=>{if(e.target.closest('[data-close]'))return this.closeTray();const b=e.target.closest('[data-hero]');if(!b)return;const id=+b.dataset.hero;if(!heroes.includes(id)){b.classList.remove('nudge');void b.offsetWidth;b.classList.add('nudge');Sound.play('hurt');return}this.pick(id);this.closeTray()};
  const sel=t.querySelector('.selected');if(sel)sel.parentElement.scrollLeft=sel.offsetLeft-sel.parentElement.clientWidth/2+sel.offsetWidth/2;(sel||t.querySelector('[data-hero]'))?.focus({preventScroll:true});this.updateHud()}
 closeTray(){const t=$('#tray');this.trayOpen=false;if(!t)return;t.classList.remove('open');t.setAttribute('aria-hidden','true');this.canvas?.focus({preventScroll:true})}
 pick(id,setSlot=true){if(this.world.status!=='ready')return;if(setSlot){this.loadout[this.shotIndex()]=id;saveLoadout(this.level,this.loadout)}this.world.species=id;const v=this.visual('loaded');v.level=id;react(v,'happy',900);this.syncSquad();this.prepare(id);Sound.play('hop');this.updateHud(true)}
 // ── Pause / results ──
 pause(auto=false){if(!this.alive||this.result||overlayOpen(this.stage))return;this.cancelGestures();this.closeTray();this.paused=true;Sound.suspend();
  const rot=this.portrait&&screen.orientation?.lock?`<button class="toggle" data-act="landscape">${ICON.rotate}<span>Landscape</span></button>`:'';const fs=document.fullscreenEnabled?`<button class="toggle" data-act="full">${ICON.full}<span>${document.fullscreenElement?'Exit full screen':'Full screen'}</span></button>`:'';
  const el=overlay(this.stage,`<small class="eyebrow">${auto?'GAME PAUSED':'PAUSED'} · ${esc(ISLANDS[this.level.island][0])} ${this.level.number}</small><h2>${esc(this.level.title)}</h2><div class="pause-list"><button class="btn primary big" data-act="resume" autofocus>${ICON.play} Resume</button><button class="btn" data-act="retry">${ICON.retry} Restart level</button><button class="btn" data-act="map">${ICON.map} Island map</button><button class="btn ghost" data-act="help">${ICON.help} How to play</button></div><div class="toggles"><button class="toggle ${state.sound?'on':''}" data-act="sound" aria-pressed="${!!state.sound}">${state.sound?ICON.sound:ICON.mute}<span>Sound ${state.sound?'on':'off'}</span></button><button class="toggle ${state.effects!=='reduced'?'on':''}" data-act="fx" aria-pressed="${state.effects!=='reduced'}">${ICON.sparkle}<span>${state.effects==='reduced'?'Calm effects':'Full effects'}</span></button>${rot}${fs}</div>`,'pause');
  el.onclick=e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(!a)return;Sound.resume();Sound.play('ui');
   if(a==='resume')this.resume();else if(a==='retry')this.restart();else if(a==='map')go('#map');
   else if(a==='help'){closeOverlay(this.stage);const h=overlay(this.stage,helpHTML()+'<div class="actions"><button class="btn primary" data-back autofocus>Got it</button></div>','help');h.onclick=ev=>{if(ev.target.closest('[data-back]')){closeOverlay(this.stage);this.paused=false;this.pause(auto)}}}
   else if(a==='sound'){state.sound=!state.sound;persist();closeOverlay(this.stage);this.paused=false;this.pause(auto)}
   else if(a==='fx'){state.effects=state.effects==='reduced'?'full':'reduced';persist();this.fx.setBudget(this.budget());closeOverlay(this.stage);this.paused=false;this.pause(auto)}
   else if(a==='landscape'){goLandscape().then(ok=>{if(!ok)notify('Turn your phone sideways for landscape (auto-rotate on).')})}
   else if(a==='full'){const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen({navigationUI:'hide'});Promise.resolve(p).catch(()=>notify('Full screen is not available here.')).finally(()=>{if(this.alive){closeOverlay(this.stage);this.paused=false;this.pause(auto)}})}}}
 resume(){closeOverlay(this.stage);this.paused=false;this.last=0;Sound.resume();this.canvas.focus({preventScroll:true})}
 restart(){closeOverlay(this.stage);route()}
 budget(){return reduced()?70:this.quality<1?130:260}
 finish(won){if(this.result)return;this.result={won};this.cancelGestures();this.closeTray();this.cam.mode='result';this.cam.t=0;const w=this.world,l=this.level;
  if(won){const scale=this.fxScale();for(let i=0;i<40*scale;i++)this.fx.add({type:i%2?'star':'chip',x:w.crystal+(Math.random()-.5)*200,y:GROUND-260-Math.random()*120,vx:(Math.random()-.5)*160,vy:-60+Math.random()*80,g:220,drag:.8,va:(Math.random()-.5)*10,size:3+Math.random()*4,color:['#ffd45e','#7fe0ff','#ff8cc8','#9be36b'][i%4],life:2.4})}
  this.resultTimer=setTimeout(()=>{if(!this.alive)return;let html;
   if(won){const before=state.results[l.id];const stars=record(state,l.id,w.score,w.shots);persist();const best=!before||w.score>before.score;const after=unlocked(state,storage),fresh=after.filter(id=>!this.heroesBefore.includes(id));
    html=`<div class="burst" aria-hidden="true"></div><small class="eyebrow">${esc(ISLANDS[l.island][0])} · ${l.boss?'BOSS DEFEATED':'LEVEL '+l.number}</small><h2>Crystal rescued!</h2><div class="result-stars" aria-label="${stars} of 3 stars">${[1,2,3].map(s=>`<i class="${s<=stars?'on':''}" style="--d:${s*.32}s">★</i>`).join('')}</div><div class="result-score"><b id="count">0</b>${best?'<span class="best">New best!</span>':''}</div><p class="muted">${w.shots?`${w.shots} spare monster${w.shots>1?'s':''} · +${w.shots*350} bonus`:'Every monster used'}</p>`+
     (fresh.length?`<div class="unlock">${fresh.map(id=>`<div class="unlock-hero"><span class="hero-art" style="--hc:${SPECIES[id].color}"><img src="${SPECIES[id].asset}" alt=""></span><div><small>NEW HERO UNLOCKED — ${esc(SPECIES[id].name.toUpperCase())}!</small><b>${esc(SPECIES[id].name)}</b><span>${esc(SPECIES[id].skill)} · ${esc(SPECIES[id].description)}</span></div></div>`).join('')}</div>`:'')+
     `<div class="actions"><button class="btn ghost" data-act="map" aria-label="Island map">${ICON.map}</button><button class="btn" data-act="retry">${ICON.retry} Replay</button>${l.id<29?`<button class="btn primary" data-act="next" autofocus>Next ${ICON.play}</button>`:`<button class="btn primary" data-act="map" autofocus>All islands saved!</button>`}</div>`;
    if(l.id===29){const total=state.results.reduce((n,r)=>n+(r?.stars||0),0);html=`<div class="burst" aria-hidden="true"></div><small class="eyebrow">EMBERFALL ISLE · FINAL BOSS</small><h2>The Magma Lord is defeated!</h2><div class="result-stars" aria-label="${stars} of 3 stars">${[1,2,3].map(s=>`<i class="${s<=stars?'on':''}" style="--d:${s*.32}s">★</i>`).join('')}</div><div class="parade">${SPECIES.map((d,i)=>`<img src="${d.asset}" alt="" style="--i:${i}">`).join('')}</div><p class="muted">All five islands are safe and every crystal is home. You hold <b>${total}/90</b> stars — replay any level to collect the rest.</p><div class="result-score"><b id="count">0</b>${best?'<span class="best">New best!</span>':''}</div><div class="actions"><button class="btn" data-act="retry">${ICON.retry} Replay</button><button class="btn primary" data-act="map" autofocus>${ICON.map} Island map</button></div>`}
    const el=overlay(this.stage,html,'result win'+(l.id===29?' finale':'')+(reduced()?' calm':''));this.countUp(el.querySelector('#count'),w.score);[1,2,3].forEach(s=>s<=stars&&setTimeout(()=>this.alive&&Sound.play('star',s),320*s+150));if(fresh.length)setTimeout(()=>this.alive&&Sound.play('unlock'),1300);Sound.play('win');
    el.onclick=e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(a==='next')go('#level-'+(l.number+1));else if(a==='retry')this.restart();else if(a==='map')go('#map')};
   }else{const left=w.remaining;
    html=`<small class="eyebrow">${esc(ISLANDS[l.island][0])} · LEVEL ${l.number}</small><h2>So close!</h2><p class="lose-line">${left} enem${left>1?'ies':'y'} still guard${left>1?'':'s'} the crystal.</p><p class="tip">${this.tip()}</p><div class="actions"><button class="btn ghost" data-act="map" aria-label="Island map">${ICON.map}</button><button class="btn primary big" data-act="retry" autofocus>${ICON.retry} Try again</button></div>`;
    const el=overlay(this.stage,html,'result lose');Sound.play('lose');el.onclick=e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(a==='retry')this.restart();else if(a==='map')go('#map')}}
  },won?(reduced()?500:1300):900)}
 tip(){const left=this.world.enemies.filter(e=>!e.dead).sort((a,b)=>b.type-a.type)[0];if(left)return`Tip — ${esc(ENEMY[left.type].name)}: ${esc(ENEMY[left.type].tip)}`;return'Tip: hit the lowest supports and let the tower fall onto the enemies.'}
 countUp(el,to){const t0=performance.now(),d=reduced()?200:900;const step=t=>{if(!this.alive||!el?.isConnected)return;const k=ease((t-t0)/d);el.textContent=Math.round(to*k).toLocaleString();if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
 // ── HUD ──
 toast(text,ms=1800){const t=$('#toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(this.toastT);this.toastT=setTimeout(()=>t.classList.remove('show'),ms)}
 updateHud(full=false){if(!this.alive)return;const w=this.world,d=SPECIES[w.species],killed=w.initialCount-w.remaining;
  $('#goal').textContent=killed+'/'+w.initialCount;$('#bandits').classList.toggle('cleared',!w.remaining);$('#lvl-bar').style.width=(killed/w.initialCount*100)+'%';
  // stars still reachable: spare monsters you would keep if every bandit fell with the next shot
  const spareIfNext=Math.max(0,w.shots-(w.status==='flight'||w.status==='settling'?0:1)),pot=w.status==='won'?(w.shots>=2?3:w.shots>=1?2:1):spareIfNext>=2?3:spareIfNext>=1?2:1;[...$('#lvl-stars').children].forEach((s,i)=>s.className=i<pot?'on':'');
  const shots=$('#shots');const used=w.level.shots-w.shots;if(full||shots.childElementCount!==w.level.shots)shots.innerHTML=Array.from({length:w.level.shots},()=>'<i></i>').join('');[...shots.children].forEach((p,i)=>p.className=i<used?'used':'');
  const i0=Math.min(this.shotIndex(),this.level.shots-1),slots=[];for(let k=i0;k<this.level.shots&&slots.length<3;k++)slots.push(k);if(w.status!=='ready'&&slots.length)slots[0]=Math.min(i0,this.level.shots-1);const key=slots.map(k=>this.loadout[k]).join(',')+'|'+w.status+'|'+w.species+'|'+i0;
  if(full||this._picks!==key){this._picks=key;const off=w.status!=='ready'||!!this.result;$('#picks').innerHTML=slots.map((k,i)=>{const id=i===0&&w.status==='ready'?w.species:this.loadout[k];return`<button class="pick ${i?'small':'current'}" data-slot="${k}" ${off&&i?'disabled':''} ${off&&!i?'disabled':''} aria-label="${i?'Queued: '+esc(SPECIES[id].name)+'. Tap to move it up':'Current hero: '+esc(SPECIES[id].name)+'. Tap to change'}"><span class="hero-art" style="--hc:${SPECIES[id].color}"><img src="${SPECIES[id].asset}" alt=""></span></button>`}).join('')}
  const sk=$('#skill');sk.dataset.state=w.status==='flight'?(w.used?'used':'ready'):'idle';sk.style.setProperty('--hc',d.color);$('#skill-name').textContent=w.status==='flight'&&!w.used?'TAP!':d.skill;$('#skill-badge').textContent=w.status==='flight'&&w.used?'0':'1';sk.disabled=!(w.status==='flight'&&!w.used);
  const hb=$('#hero-btn');hb.disabled=w.status!=='ready'||!!this.result;hb.setAttribute('aria-expanded',String(this.trayOpen));
  $('#next').hidden=!(w.status==='flight'&&w.age>=1);
  $('#cam-reset').hidden=!(this.cam.mode==='free'||Math.abs(this.cam.userZ-1)>.05);
  this.stage.dataset.status=w.status;
 }
 showHand(){if(state.tutorial||this.level.id!==0||this.handShown)return;this.handShown=true;$('#hand')?.classList.add('show')}
 hideHand(){$('#hand')?.classList.remove('show')}
 // ── Main loop ──
 frame(t){if(!this.alive)return;this.raf=requestAnimationFrame(tt=>this.frame(tt));
  const dtReal=this.last?Math.min(.1,(t-this.last)/1000):0;this.last=t;if(document.hidden)return;
  // Adaptive quality: if frames are consistently slow, lower resolution and particle count.
  if(dtReal){this.frameTimes.push(dtReal);if(this.frameTimes.length>=120){const avg=this.frameTimes.reduce((a,b)=>a+b)/this.frameTimes.length;this.frameTimes.length=0;if(avg>.026&&this.quality>.7){this.quality=.7;this.resize();this.fx.setBudget(this.budget())}}}
  const paused=this.paused;
  if(!paused){this.acc+=Math.min(.05,dtReal);let n=0;while(this.acc>=1/60&&n++<4){if(this.result)step(this.world.bodies,1/60);else this.world.tick(1/60);this.acc-=1/60}this.handleEvents()}
  const dt=paused?0:dtReal;this.time+=dt;this.score=lerp(this.score,this.world.score,1-Math.exp(-dt*8));
  if(this.world.shakeReq){this.shake(this.world.shakeReq);this.world.shakeReq=0}
  if(!paused){this.updateCamera(dt);this.fx.update(dt);this.tickVisuals(dt,t)}
  this.draw(t);
  if(!paused&&(this._hudT=(this._hudT||0)+dt)>.1){this._hudT=0;$('#score').textContent=Math.round(this.score).toLocaleString();this.updateHud()}
 }
 tickVisuals(dt,now){const w=this.world;
  if(this.loaded&&this.load.t<1){this.load.t=Math.min(1,this.load.t+dt/.45);if(this.load.t>=1){kick(this.visual('loaded'),.25);this.showHand()}}
  // Pouch spring: recoil after a launch, snap back after a cancelled pull.
  if(this.gesture?.type!=='aim'){const p=this.pouch,k=320,damp=reduced()?18:9;p.vx+=(-k*p.x-damp*p.vx)*dt;p.vy+=(-k*p.y-damp*p.vy)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(Math.hypot(p.x,p.y)<.3&&Math.hypot(p.vx,p.vy)<3){p.x=p.y=p.vx=p.vy=0}
   if(this.loaded&&this.load.t>=1){this.pull.x=p.x;this.pull.y=p.y}}
  const p=w.projectile;if(p&&this.trail&&now-this.lastTrail>(reduced()?90:45)){this.lastTrail=now;this.trail.pts.push({x:p.x,y:p.y,s:this.trail.pts.length%3===0?5:3})}
  const amb=reduced()?0:this.quality<1?.5:1;if(p&&Math.random()<.5*amb)art.ambient(this.fx,p.species,p.x,p.y,true);
  if(this.loaded&&Math.random()<.03*amb){const m=this.monsterPos();if(m)art.ambient(this.fx,w.species,m.x,m.y,false)}
  for(const k of this.vis.keys())if(typeof k==='number'&&!w.bodies.some(b=>b.id===k))this.vis.delete(k);
 }
 // ── Rendering ──
 draw(now){const c=this.c,w=this.world,S=this.S,dpr=this.dpr,cam=this.cam;
  let sx=0,sy=0;if(cam.shake>.2){sx=(Math.random()-.5)*cam.shake;sy=(Math.random()-.5)*cam.shake;cam.shake*=.86}else cam.shake=0;
  const view={w:this.w,h:this.h,S,cx:cam.cx,cy:cam.cy,cy0:this.cy0(),horizon:this.h*this.groundFrac-150*this.base,groundScreen:cy=>this.h/2+(GROUND-cy)*S};
  c.setTransform(dpr,0,0,dpr,0,0);this.scenery.back(c,view,now);
  c.setTransform(dpr*S,0,0,dpr*S,dpr*(this.w/2-cam.cx*S+sx),dpr*(this.h/2-cam.cy*S+sy));
  this.scenery.ground(c,S,w.terrain,now);
  for(const d of w.decor)art.drawDecor(c,d,now,w.wind);
  art.drawCrystal(c,w.crystal,now,this.result?.won?Math.min(1,cam.t/1.2):0);
  for(const b of w.blocks)if(!b.dead){const half=Math.abs(Math.cos(b.a))*b.h/2+Math.abs(Math.sin(b.a))*b.w/2;art.drawShadow(c,b.x,b.y+half,b.w/2+4,.22)}
  for(const e of w.enemies)if(!e.dead&&!(e.type===5&&e.fly))art.drawShadow(c,e.x,e.y+(e.h?e.h/2:e.r),(e.w||e.r*2)/2,.28);
  for(const tr of[...this.trails,this.trail])if(tr){c.fillStyle=tr===this.trail?'rgba(255,255,255,.85)':'rgba(255,255,255,.4)';for(const q of tr.pts){c.beginPath();c.arc(q.x,q.y,q.s,0,Math.PI*2);c.fill()}}
  for(const b of w.blocks)if(!b.dead)art.drawBlock(c,b,w.time);
  const p=w.projectile,look=p?{x:p.x,y:p.y}:{x:SLING.x,y:SLING.y};
  const pylons=w.blocks.filter(b=>b.pylon&&!b.dead);for(const e of w.enemies)if(!e.dead){if(e.type===10)art.drawVent(c,e,now);art.drawEnemy(c,e,{now,time:w.time,look,pylons})}
  for(const k of w.inks)art.drawInk(c,k,now);
  this.drawSling(c,now);
  for(const b of w.bodies){if(b.dead)continue;if(b.kind==='seed')this.drawSeed(c,b);else if(b.kind==='monster')this.drawFlying(c,b,now)}
  this.fx.draw(c);
  for(const e of w.effects){const k=1-e.life/.65;c.save();c.globalAlpha=clamp(e.life/.65,0,1)*.6;c.strokeStyle=e.color;c.lineWidth=4;c.beginPath();c.arc(e.x,e.y,Math.max(2,e.r*ease(k)),0,Math.PI*2);c.stroke();c.restore()}
  if(this.gesture?.type==='aim')this.drawAim(c);
  c.setTransform(dpr,0,0,dpr,0,0);this.scenery.front(c,view,now);
  if(!this.drawTargetView(c,now))this.drawPointer(c,now);this.drawHand();
 }
 // Portrait "TARGET" window: while aiming, a live inset of the fort with the trajectory dots,
 // so players always see what they are shooting at even though the fort is off-screen.
 targetRect(){const top=this.hudBottom||64,w=Math.min(this.w*.56,250),h=Math.round(w*.7);return{x:this.w-w-10,y:top+8,w,h}}
 drawTargetView(c,now){const W=this.world;if(!this.portrait||this.result||W.status!=='ready'||!this.loaded||this.cam.mode==='intro'||this.cam.mode==='free'||this.trayOpen)return false;
  const alive=W.enemies.filter(e=>!e.dead);if(!alive.length)return false;const right=this.cam.cx+this.w/2/this.S;if(Math.min(...alive.map(e=>e.x-e.r))<right-20)return false;
  const r=this.targetRect(),f=this.fortBox,dpr=this.dpr,Sp=Math.min(r.w/(f.x1-f.x0+150),(r.h*.8)/(GROUND-f.top+70)),cx=(f.x0+f.x1)/2,gy=r.h*.86,cy=GROUND-(gy-r.h/2)/Sp;
  c.save();c.setTransform(dpr,0,0,dpr,0,0);c.shadowColor='rgba(10,25,55,.45)';c.shadowBlur=12;c.shadowOffsetY=4;c.fillStyle='#0f1f3d';c.beginPath();c.roundRect(r.x-3,r.y-3,r.w+6,r.h+6,16);c.fill();c.shadowColor='transparent';
  c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,13);c.clip();c.translate(r.x,r.y);
  this.scenery.back(c,{w:r.w,h:r.h,S:Sp,cx,cy,cy0:cy,horizon:gy-150*Sp,groundScreen:()=>gy},now);
  c.setTransform(dpr*Sp,0,0,dpr*Sp,dpr*(r.x+r.w/2-cx*Sp),dpr*(r.y+r.h/2-cy*Sp));
  this.scenery.ground(c,Sp,W.terrain,now);for(const d of W.decor)art.drawDecor(c,d,now,W.wind);art.drawCrystal(c,W.crystal,now,0);
  for(const b of W.blocks)if(!b.dead)art.drawBlock(c,b,W.time);
  for(const e of W.enemies)if(!e.dead)art.drawEnemy(c,e,{now,time:W.time,pylons:W.blocks.filter(b=>b.pylon&&!b.dead)});for(const k of W.inks)art.drawInk(c,k,now);
  if(this.gesture?.type==='aim')this.drawAim(c,1/Sp*.9);
  c.restore();c.save();c.setTransform(dpr,0,0,dpr,0,0);c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.roundRect(r.x,r.y,r.w,r.h,13);c.stroke();
  c.fillStyle='rgba(42,26,12,.62)';c.beginPath();c.roundRect(r.x+8,r.y+8,64,20,10);c.fill();c.fillStyle='#fff';c.font='700 12px Fredoka,ui-rounded,system-ui,sans-serif';c.textBaseline='middle';c.fillText('🎯 TARGET',r.x+14,r.y+18.5);c.restore();return true}
 drawSling(c,now){const F=art.FORK,m=this.monsterPos(),aiming=this.gesture?.type==='aim';
  art.drawSlingBack(c);
  // The rest of the squad waits behind the sling, one per remaining launch.
  if(this.ready)this.squad.forEach((s,i)=>{s.x=124-i*34;const hop=reduced()?0:Math.max(0,Math.sin(now/260+i*1.9))*6;s.y=GROUND-19-hop;s.vy=hop?-40:0;paintMonster(c,s,now,{x:900,y:480})});
  const pull=Math.hypot(this.pull.x,this.pull.y),tension=clamp(pull/MAXPULL,0,1);
  let pouch;if(this.loaded&&m&&this.load.t>=1){const dir=pull>2?{x:this.pull.x/pull,y:this.pull.y/pull}:{x:-1,y:.15};pouch={x:m.x+dir.x*22,y:m.y+dir.y*22+4,a:Math.atan2(dir.y,dir.x)}}else{pouch={x:SLING.x+this.pouch.x-16,y:SLING.y+this.pouch.y+4,a:Math.PI}}
  art.drawBand(c,F.back,pouch,tension);art.drawPouch(c,pouch.x,pouch.y,pouch.a,26);
  if(this.loaded&&m&&this.ready){const v=this.visual('loaded');v.x=m.x;v.y=m.y;
   if(aiming&&pull>1){v.vx=-this.pull.x*5;v.vy=0}else{v.vx=0;v.vy=this.load.t<1?-300:0}
   const look={x:(this.fortBox.x0+this.fortBox.x1)/2,y:GROUND-80};c.save();
   if(pull>2&&!reduced()){const a=Math.atan2(this.pull.y,this.pull.x),sq=tension*.16;c.translate(m.x,m.y);c.rotate(a);c.scale(1-sq,1+sq*.7);c.rotate(-a);c.translate(-m.x,-m.y)}
   paintMonster(c,v,now,look);c.restore();
   if(aiming&&pull>4){c.save();c.lineCap='round';c.lineWidth=3.2;c.strokeStyle='rgba(255,255,255,.35)';c.beginPath();c.arc(m.x,m.y,v.r+11,0,Math.PI*2);c.stroke();c.strokeStyle=tension<.5?'#9be36b':tension<.85?'#ffd25e':'#ff8a4a';c.beginPath();c.arc(m.x,m.y,v.r+11,-Math.PI/2,-Math.PI/2+tension*Math.PI*2);c.stroke();c.restore()}}
  art.drawBand(c,F.front,{x:pouch.x+Math.cos(pouch.a+Math.PI/2)*8,y:pouch.y+Math.sin(pouch.a+Math.PI/2)*8},tension);art.drawSlingFront(c)}
 drawFlying(c,b,now){const v=this.visual(b.id,b.species);v.level=b.species;v.x=b.x;v.y=b.y;v.vx=b.vx;v.vy=b.vy;v.contact=Math.hypot(b.vx,b.vy)<60;
  const sp=Math.hypot(b.vx,b.vy),st=reduced()?0:clamp(sp/3200,0,.2)*(b.phase>0?1.4:1);c.save();
  if(b.phase>0){c.globalAlpha=.55;for(let i=1;i<=3;i++){c.save();c.globalAlpha=.15;c.translate(-b.vx*.018*i,-b.vy*.018*i);paintMonster(c,v,now,null);c.restore()}}
  if(st>.01){const a=Math.atan2(b.vy,b.vx);c.translate(b.x,b.y);c.rotate(a);c.scale(1+st,1-st*.8);c.rotate(-a);c.translate(-b.x,-b.y)}
  if(v.skillT&&now-v.skillT<350){const k=(now-v.skillT)/350;c.save();c.globalAlpha=(1-k)*.8;c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.arc(b.x,b.y,v.r+8+k*30,0,Math.PI*2);c.stroke();c.restore()}
  paintMonster(c,v,now,{x:b.x+b.vx,y:b.y+b.vy});c.restore()}
 drawSeed(c,b){c.save();c.translate(b.x,b.y);c.rotate(b.a);c.fillStyle='#e6d55a';c.strokeStyle='#8a7a24';c.lineWidth=1.6;c.beginPath();c.ellipse(0,0,b.r,b.r*.8,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#6fc048';c.beginPath();c.ellipse(-b.r*.2,-b.r*.85,b.r*.55,b.r*.25,-.5,0,Math.PI*2);c.fill();c.restore()}
 // Trajectory preview: the same integrator as the simulation, from the same release point.
 drawAim(c,k=1){const n=Math.hypot(this.pull.x,this.pull.y);if(n<8)return;const dx=-this.pull.x,dy=-this.pull.y,o=launchOrigin(dx,dy),v=launchVelocity(dx,dy),pts=predict(o.x,o.y,v.vx,v.vy,150,3,this.world.env),solids=this.world.bodies.filter(b=>!b.dead&&b.kind!=='monster'&&b.kind!=='ground'&&!(b.kind==='enemy'&&b.ghost)),inks=this.world.inks;
  let end=pts.length;for(let i=0;i<pts.length;i++){const q=pts[i];if(solids.some(b=>Math.hypot(b.x-q.x,b.y-q.y)<(b.r||Math.hypot(b.w,b.h)/2*.8)+22)){end=i;break}}
  const path=[o,...pts.slice(0,end)],hit=end<pts.length?pts[end]:pts[pts.length-1];
  c.save();c.lineCap='round';
  // dashed white arc with a soft dark edge, fading with distance
  for(let pass=0;pass<2;pass++){c.strokeStyle=pass?'#ffffff':'rgba(15,31,61,.35)';c.lineWidth=(pass?5:8)*k;for(let i=2;i+1<path.length;i+=3){if(inks.some(q=>Math.hypot(path[i].x-q.x,path[i].y-q.y)<q.r*.75))continue;c.globalAlpha=clamp(1.15-i/path.length,.25,1);c.beginPath();c.moveTo(path[i].x,path[i].y);c.lineTo(path[i+1].x,path[i+1].y);c.stroke()}}
  if(hit){c.globalAlpha=1;const R=13*k;for(let pass=0;pass<2;pass++){c.strokeStyle=pass?(k>1?'#ff5a3c':'#ffffff'):'rgba(15,31,61,.4)';c.lineWidth=(pass?3.6:6.5)*k;c.beginPath();c.arc(hit.x,hit.y,R,0,Math.PI*2);c.stroke()}c.fillStyle=k>1?'#ff5a3c':'#fff';c.beginPath();c.arc(hit.x,hit.y,3.6*k,0,Math.PI*2);c.fill()}
  c.restore()}
 // When the fort is off-screen, a small marker on the edge shows where the bandits are and how far.
 drawPointer(c,now){const w=this.world;if(this.result||w.status==='flight'||this.cam.mode==='intro')return;const alive=w.enemies.filter(e=>!e.dead);if(!alive.length)return;const right=this.cam.cx+this.w/2/this.S;const nearest=Math.min(...alive.map(e=>e.x-e.r));if(nearest<right-10)return;
  const ty=alive.reduce((a,e)=>a+e.y,0)/alive.length,s=this.toScreen(0,ty),y=clamp(s.y,90,this.h*this.groundFrac-20),x=this.w-14-(this.portrait?0:0),bob=reduced()?0:Math.sin(now/300)*3,dist=Math.round((nearest-right)/10)*10;
  c.save();c.translate(x+bob,y);c.fillStyle='#24457c';c.strokeStyle='#0f1f3d';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(-16,-15);c.lineTo(-58,-15);c.quadraticCurveTo(-66,-15,-66,-7);c.lineTo(-66,7);c.quadraticCurveTo(-66,15,-58,15);c.lineTo(-16,15);c.closePath();c.fill();c.stroke();
  c.fillStyle='#6fa83f';c.beginPath();c.arc(-48,0,8,0,Math.PI*2);c.fill();c.fillStyle='#b8323f';c.fillRect(-56,-3,12,3.5);c.fillStyle='#fff';c.font='700 13px Fredoka,ui-rounded,system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillText('×'+alive.length,-37,1);c.restore()}
 drawHand(){const h=$('#hand');if(!h||!h.classList.contains('show'))return;const m=this.monsterPos();if(!m)return;const s=this.toScreen(m.x,m.y);h.style.setProperty('--hx',s.x+'px');h.style.setProperty('--hy',s.y+'px');h.style.setProperty('--dx',-Math.round(70*this.S)+'px');h.style.setProperty('--dy',Math.round(32*this.S)+'px')}
}

// Inspection hook for automated browser tests only (enabled by ?test in the URL).
if(new URLSearchParams(location.search).has('test'))window.__sling={get game(){return game},Sound,LEVELS};
route();
