// The eleven official Monster Sling enemies: physics shape, stats and deterministic behaviour.
// Every rule is time- or contact-based (no randomness) so levels are fair and solvable.
import{body,GROUND,wake}from'./physics.js';

export const ENEMY=[
 // id, name, first level, shape, mass, hp, points, how to beat it
 {name:'Shellkin',level:1,w:50,h:34,mass:1.2,hp:70,points:500,tip:'Armoured shell. Hit it hard or flip it over: an upside-down Shellkin is easy to defeat.'},
 {name:'Clawbite',level:3,w:46,h:34,mass:1.1,hp:90,points:600,tip:'Its claws block hits from the front. Hit it from above or drop something on it.'},
 {name:'Inkster',level:5,w:40,h:48,mass:.9,hp:60,points:600,tip:'Squirts an ink cloud when a monster comes close. Puffling’s gust blows ink away.'},
 {name:'Skybeak',level:7,r:22,mass:.7,hp:45,points:700,tip:'Patrols the sky on a fixed route. Time your shot; once hit it falls.'},
 {name:'Prickfin',level:10,r:24,mass:1,hp:80,points:700,tip:'Spikes hurt direct hits. Drop blocks on it, blast it, or smash it with Rockro.'},
 {name:'Razorfin',level:13,w:70,h:34,mass:1.6,hp:100,points:800,tip:'Swims in the water and leaps out every few seconds. Strike while it is in the air.'},
 {name:'Captain Inkbeard',level:16,w:60,h:58,mass:2,hp:170,points:1200,tip:'Throws up a thick ink wall that slows monsters. Lob over it, blow it away or collapse his ship.'},
 {name:'Stoneguard',level:19,w:56,h:66,mass:4,hp:120,armor:220,points:1200,tip:'Stone armour soaks normal hits. Hits from above and heavy heroes crack it faster.'},
 {name:'Ironclaw',level:22,w:64,h:44,mass:3,hp:150,points:1300,tip:'Steel claws block the front. Water shorts its machinery and leaves it wide open.'},
 {name:'Voidraith',level:25,w:44,h:56,mass:.8,hp:90,points:1300,tip:'Fades out of reach every few seconds (it flickers first). Light reveals and burns it.'},
 {name:'Magma Lord',level:30,w:112,h:96,mass:10,hp:600,points:5000,boss:true,tip:'Phase 1: smash the obsidian pylons. Phase 2: hit the core, dodge eruptions. Phase 3: cool the shield with water or ice, or drop the boulder.'}
].map((e,id)=>({id,sprite:`./assets/enemies/${String(id+1).padStart(2,'0')}-${['shellkin','clawbite','inkster','skybeak','prickfin','razorfin','inkbeard','stoneguard','ironclaw','voidraith','magmalord'][id]}.webp`,...e}));

// Create an enemy standing on `base` (the y of the surface below), or at (x,y) for flyers/swimmers.
export function makeEnemy(type,x,base,opts={}){
 const d=ENEMY[type],shape=d.r?{r:d.r}:{w:d.w,h:d.h};
 const y=opts.y??(base-(d.r||d.h/2));
 const e=body({x,y,...shape,mass:d.mass,hp:d.hp,kind:'enemy',type,friction:.75,restitution:.08,boss:!!d.boss,...opts});
 e.maxHp=e.hp;e.armor=d.armor||0;e.maxArmor=e.armor;e.mode='idle';e.modeT=0;e.home={x:e.x,y:e.y};
 if(type===3){e.fly=true;e.noSleep=true;e.patrol=opts.patrol||{dx:140,dy:30,period:5};e.sleep=false}
 if(type===5){e.fly=true;e.noSleep=true;e.swim=opts.swim;e.sleep=false;e.density=1}
 if(type===9){e.noSleep=true}
 if(type===10){e.stage=1;e.pylons=opts.pylons||0}
 return e;
}

const heavy=s=>s===4||s===7||s===10; // Rockro, Groveling, Infernodon
const WATERY=s=>s===1||s===8;          // Bubblo, Tidalon
const ICY=s=>s===5;                    // Frostbop

// Per-frame behaviour. Returns events for effects/audio through world.events.
export function updateEnemy(e,w,dt){
 e.modeT+=dt;const t=w.time;
 switch(e.type){
  case 2:{ // Inkster: squirts ink once per shot when a monster approaches.
   const p=w.projectile;if(p&&!p.dead&&e.inkShot!==w.launches&&Math.hypot(p.x-e.x,p.y-e.y)<230){e.inkShot=w.launches;w.addInk(e.x-40,e.y-10,95,3,false);e.mode='attack';e.modeT=0;w.events.push({t:'ink',x:e.x,y:e.y})}
   break}
  case 3:{ // Skybeak: fixed figure-eight patrol until something knocks it out of the sky.
   if(e.fly){const P=e.patrol,ph=t/P.period*Math.PI*2+(P.phase||0),tx=e.home.x+Math.sin(ph)*P.dx,ty=e.home.y+Math.sin(ph*2)*P.dy;e.vx=(tx-e.x)/dt;e.vy=(ty-e.y)/dt;e.omega=0;e.a=0;e.facing=Math.cos(ph)>=0?1:-1;
    if(e.hitT!=null&&t-e.hitT<.05||e.bumped){e.fly=false;e.noSleep=false;e.mode='stunned';e.modeT=0;w.events.push({t:'squawk',x:e.x,y:e.y})}}
   break}
  case 5:{ // Razorfin: swims across its pool, leaping out on a fixed rhythm.
   const S=e.swim;if(!S)break;if(e.fly){const ph=(t+(S.offset||0))%S.period,cycle=Math.floor((t+(S.offset||0))/S.period),dir=cycle%2?-1:1,leapStart=S.period-1.2,u=ph/S.period;
    let tx=S.x0+(S.x1-S.x0)*(dir>0?u:1-u),ty=S.y;e.airborne=false;
    if(ph>leapStart){const k=(ph-leapStart)/1.2;ty=S.y-Math.sin(k*Math.PI)*S.leap;e.airborne=k>.12&&k<.88}
    e.vx=(tx-e.x)/dt;e.vy=(ty-e.y)/dt;e.facing=dir;e.omega=0;e.a=Math.atan2(e.vy,Math.abs(e.vx)+1)*.4*dir;
    if(e.bumped&&e.airborne){e.fly=false;e.noSleep=false;e.mode='stunned';e.modeT=0}}
   break}
  case 6:{ // Captain Inkbeard: an ink wall rises in front of him when a monster heads his way.
   const p=w.projectile;if(p&&!p.dead&&e.inkShot!==w.launches&&p.vx>0&&e.x-p.x<330&&e.x-p.x>40){e.inkShot=w.launches;w.addInk(e.x-95,e.y-20,80,3.2,true);e.mode='attack';e.modeT=0;w.events.push({t:'ink',x:e.x,y:e.y,big:true})}
   break}
  case 8:{if(e.shorted>0){e.shorted=Math.max(0,e.shorted-dt)}break}
  case 9:{ // Voidraith: solid 2.6 s, intangible 1.6 s (flickers for 0.5 s first). Light keeps it solid.
   if(e.revealed>0){e.revealed=Math.max(0,e.revealed-dt);e.ghost=false;e.flicker=false;break}
   const ph=(t+(e.offset||0))%4.2;e.ghost=ph>2.6;e.flicker=ph>2.1&&ph<=2.6;e.phase=e.ghost?1:0;break}
  case 10:{ // Magma Lord
   if(e.stage===1&&!w.blocks.some(b=>!b.dead&&b.pylon)){e.stage=2;e.mode='stunned';e.modeT=0;w.events.push({t:'boss',phase:2,x:e.x,y:e.y});w.shake(10)}
   if(e.stage===2&&e.hp<=e.maxHp*.5){e.stage=3;e.shield=true;e.mode='attack';e.modeT=0;w.events.push({t:'boss',phase:3,x:e.x,y:e.y})}
   if(e.stun>0)e.stun=Math.max(0,e.stun-dt);
   // Eruptions: telegraphed 1.4 s, active 0.9 s, every 6 s, in phases 2 and 3.
   if(e.stage>=2){const cyc=(t%6),warn=cyc>3.7&&cyc<=5.1,live=cyc>5.1;const was=e.erupt;e.erupt=live?'live':warn?'warn':null;if(e.erupt==='live'&&was!=='live')w.events.push({t:'erupt',x:e.x,y:e.y})}
   break}
 }
 if(e.mode!=='idle'&&e.modeT>.9)e.mode='idle';
 e.bumped=false;
}

// Adjust incoming damage for armour, shields and weak points. ctx={cause,src,cx,cy,species}
export function filterDamage(e,amount,ctx,w){
 const s=ctx.species,cause=ctx.cause,fromProjectile=ctx.src&&(ctx.src.kind==='monster'||ctx.src.kind==='seed');
 const frontal=ctx.cx!=null&&ctx.cx<e.x-(e.w||e.r*2)*.22&&Math.abs(ctx.cy-e.y)<(e.h||e.r*2)*.42;
 const fromAbove=ctx.cy!=null&&ctx.cy<e.y-(e.h||e.r*2)*.3;
 const up=Math.abs(Math.atan2(Math.sin(e.a),Math.cos(e.a)));
 switch(e.type){
  case 0:if(up>2)return amount*2.2;return Math.max(0,amount-110)*.7; // armoured until flipped
  case 1:if(fromProjectile&&frontal&&cause==='impact'){w.events.push({t:'clang',x:ctx.cx,y:ctx.cy});return amount*.1}return amount;
  case 4:if(fromProjectile&&cause==='impact'&&!heavy(s)&&ctx.src.kind!=='seed'){w.prick(ctx.src,e);return amount*.1}return amount;
  case 5:if(e.fly&&!e.airborne&&cause!=='skill')return amount*.35;return amount*(e.fly?1:1.4);
  case 7:{if(e.armor>0){let a=amount*(heavy(s)?1.25:.45)*(fromAbove?1.8:1);if(cause==='crush')a=amount*.9;const used=Math.min(e.armor,a);e.armor-=used;if(e.armor<=0){w.events.push({t:'armor',x:e.x,y:e.y});w.shake(5)}return Math.max(0,a-used)*.5}return amount}
  case 8:{if(e.shorted>0)return amount*1.6;if(fromProjectile&&frontal&&cause==='impact'){w.events.push({t:'clang',x:ctx.cx,y:ctx.cy});return amount*.08}return amount*.6}
  case 9:if(e.ghost)return 0;return amount;
  case 10:{
   if(e.stage===1)return 0;
   if(e.stage===3&&e.shield&&!(e.stun>0)){w.events.push({t:'clang',x:ctx.cx??e.x,y:ctx.cy??e.y});return amount*.2}
   if(e.stun>0)return amount*1.8;return amount*(heavy(s)?1.2:1)}
 }
 return amount;
}

// Skills that interact with specific enemies (called by the battle after a skill fires).
export function skillOnEnemies(w,species,x,y){
 for(const e of w.enemies){if(e.dead)continue;const d=Math.hypot(e.x-x,e.y-y);
  if(e.type===8&&WATERY(species)&&d<300){e.shorted=6;e.mode='stunned';e.modeT=0;w.events.push({t:'short',x:e.x,y:e.y})}
  if(e.type===9&&species===9&&d<300){e.revealed=6;e.ghost=false;e.phase=0;w.damage(e,90*(1-d/400),{cause:'light',species})}
  if(e.type===10&&e.stage===3&&(WATERY(species)||ICY(species))&&d<340){e.stun=5;e.mode='stunned';e.modeT=0;w.events.push({t:'steam',x:e.x,y:e.y})}
  if((e.type===3||e.type===5)&&d<260){e.bumped=true;wake(e)}
 }
}
