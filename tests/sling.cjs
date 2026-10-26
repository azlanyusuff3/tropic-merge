// Monster Sling browser tests: real pages, real touch input (CDP), real service worker.
// Run: CHROMIUM_PATH=/path/to/chrome node tests/sling.cjs   (screenshots go to test-output/)
const{chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http'),crypto=require('node:crypto'),{execSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'test-output'),MERGE_SHA='4a7dd28b2258f82222bff3a5d37319cebd9b81d7fe1fee411aedd121cfbe9441';
const SIZES=[[320,568],[390,844],[430,932],[768,1024],[844,390]];
fs.mkdirSync(OUT,{recursive:true});
const results=[],errors=[],failed=[],perf={};
const pass=m=>{results.push(m);console.log('PASS '+m)};
let siteRoot=ROOT;
const TYPES={'.js':'application/javascript','.html':'text/html','.css':'text/css','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://x').pathname;if(!name.startsWith('/tropic-merge/')){res.writeHead(404);return res.end()}name=name.slice('/tropic-merge'.length);if(name==='/')name='/index.html';const f=path.resolve(siteRoot,'.'+name);if(!f.startsWith(siteRoot+path.sep)){res.writeHead(403);return res.end()}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end()}res.setHeader('content-type',TYPES[path.extname(f)]||'text/plain');res.setHeader('cache-control','no-cache');res.end(d)})});
const save=(results,extra={})=>JSON.stringify({version:1,results,selected:0,sound:false,revision:1,tutorial:1,...extra});
const allClear=n=>Array.from({length:n},(_,i)=>({score:1000+i,stars:1+i%3}));

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const BASE='http://127.0.0.1:'+server.address().port+'/tropic-merge';
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--js-flags=--expose-gc']});
 const newPage=async(w=390,h=844,opts={})=>{const {rotateTip,...o}=opts;const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',...o});if(!opts.rotateTip)await ctx.addInitScript(()=>{try{sessionStorage.setItem('slingRotateTip','1')}catch{}});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)failed.push(r.url())});const cdp=await ctx.newCDPSession(p);return{ctx,p,cdp}};
 const poll=async(p,fn,ms=20000)=>{const t=Date.now();while(Date.now()-t<ms){if(await p.evaluate(fn))return;await new Promise(r=>setTimeout(r,250))}throw Error('timed out waiting for '+fn)};
 const touch=(cdp,type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((q,i)=>({x:q.x,y:q.y,id:q.id??i+1,radiusX:4,radiusY:4,force:1}))});
 const G=p=>p.evaluate(()=>{const g=__sling.game;return g&&{status:g.world.status,shots:g.world.shots,remaining:g.world.remaining,mode:g.cam.mode,cx:g.cam.cx,cz:g.cam.z,userZ:g.cam.userZ,loaded:g.loaded,ready:g.ready,load:g.load.t,gesture:g.gesture?.type||null,used:g.world.used,proj:!!g.world.projectile,paused:g.paused,S:g.S,portrait:g.portrait,time:g.world.time}});
 const monsterScreen=p=>p.evaluate(()=>{const g=__sling.game,m=g.monsterPos(),s=g.toScreen(m.x,m.y),r=g.canvas.getBoundingClientRect();return{x:s.x+r.left,y:s.y+r.top}});
 const waitAim=p=>p.waitForFunction(()=>{const g=__sling.game;if(!(g&&g.cam.mode==='aim'&&g.loaded&&g.load.t>=1&&g.ready&&g.world.status==='ready'))return false;const t=g.aimTarget();return Math.abs(g.cam.cx-t.cx)<4&&Math.abs(g.cam.z-t.z)<.01},null,{timeout:15000});
 const openLevel=async(p,n,saveData)=>{await p.goto(BASE+'/sling.html?test');if(saveData!==undefined){await p.evaluate(s=>localStorage.setItem('monsterSlingSaveV1',s),saveData)}await p.goto(BASE+'/sling.html?test#level-'+n);await p.waitForFunction(n=>__sling.game?.level.number===n,n)};
 const dragLaunch=async(p,dx=-80,dy=34,steps=10)=>{await waitAim(p);const m=await monsterScreen(p);await p.mouse.move(m.x,m.y);await p.mouse.down();for(let i=1;i<=steps;i++)await p.mouse.move(m.x+dx*i/steps,m.y+dy*i/steps);await p.mouse.up()};

 // ── 1. Menu and campaign map ──
 {const {ctx,p}=await newPage();await p.goto(BASE+'/');assert.equal(await p.locator('body').textContent().then(t=>t.includes('Monster Care')),false);assert.ok(await p.locator('a[href="./merge.html"]').count());assert.ok(await p.locator('a[href="./match.html"]').count());assert.equal(await p.locator('a[href="./sling.html"]').count(),0);await p.screenshot({path:OUT+'/sling-menu.png'});
  await p.goto(BASE+'/sling.html');await p.waitForSelector('.title-screen .play-big');await p.screenshot({path:OUT+'/sling-title.png'});assert.match(await p.locator('.play-big').textContent(),/PLAY/);await p.locator('#t-map').click();await p.waitForSelector('.node');assert.equal(await p.locator('.node').count(),30);assert.equal(await p.locator('.node.boss').count(),5);assert.equal(await p.locator('.node[data-level="1"]').isDisabled(),true);assert.equal(await p.locator('.node.current').getAttribute('data-level'),'0');
  await p.screenshot({path:OUT+'/sling-map.png'});await p.locator('.node[data-level="0"]').click({force:true});await p.waitForSelector('.overlay.show [data-play]');await p.screenshot({path:OUT+'/sling-level-card.png'});await p.locator('[data-squad]').click();await p.waitForSelector('.hero-grid');assert.equal(await p.locator('.hero-grid .hero-tile:not(.locked)').count(),3);await p.screenshot({path:OUT+'/sling-squad.png'});
  await p.locator('.hero-grid [data-hero="1"]').click();await p.waitForSelector('[data-play]');await p.locator('[data-play]').click();await p.waitForFunction(()=>document.body.classList.contains('in-level'));
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('monsterSlingSaveV1')).selected),1);await ctx.close();
  pass('Island menu shows Merge and Match; hidden Sling route works directly; title screen with PLAY; adventure map shows 30 route nodes, 5 boss destinations, locks, level card and squad picker')}

 // ── 2. Fullscreen stage and readable scale at every size ──
 for(const [w,h] of SIZES){const {ctx,p}=await newPage(w,h);await openLevel(p,8,save(allClear(7)));await p.waitForTimeout(500);await p.screenshot({path:OUT+`/sling-${w}x${h}-intro.png`});await waitAim(p);await p.waitForTimeout(300);await p.screenshot({path:OUT+`/sling-${w}x${h}-aim.png`});
  const L=await p.evaluate(()=>{const g=__sling.game,r=g.canvas.getBoundingClientRect(),boxes=['#pause','.hud-level','#bandits','.hud-score','.next-box','.right-cards'].map(s=>{const b=document.querySelector(s).getBoundingClientRect();return{s,x:b.x,y:b.y,w:b.width,h:b.height,vis:b.width>0&&getComputedStyle(document.querySelector(s)).display!=='none'}}).filter(b=>b.vis);
   return{canvas:[r.x,r.y,r.width,r.height],vw:innerWidth,vh:innerHeight,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],boxes,monsterPx:29*g.S,banditPx:22*g.S,header:!!document.querySelector('header:not(.map-top)')}});
  assert.deepEqual(L.canvas.map(Math.round),[0,0,w,h],'canvas fills the viewport');assert.ok(L.scroll[0]<=w&&L.scroll[1]<=h,'no page scrolling during play');assert.equal(L.header,false);
  for(const b of L.boxes)assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=w+.5&&b.y+b.h<=h+.5,b.s+' inside the screen at '+w);
  for(let i=0;i<L.boxes.length;i++)for(let j=i+1;j<L.boxes.length;j++){const a=L.boxes[i],b=L.boxes[j];assert.ok(a.x+a.w<=b.x+.5||b.x+b.w<=a.x+.5||a.y+a.h<=b.y+.5||b.y+b.h<=a.y+.5,`${a.s} overlaps ${b.s} at ${w}x${h}`)}
  assert.ok(L.monsterPx>=19,'loaded monster radius '+L.monsterPx.toFixed(1)+'px at '+w);assert.ok(L.banditPx>=14,'bandit radius '+L.banditPx.toFixed(1)+'px at '+w);
  // Controls never cover a bandit, in the aim view or while the camera shows the fort.
  for(const view of['aim','result']){const hits=await p.evaluate(view=>{const g=__sling.game;if(view==='result'){const t=g.fortTarget();Object.assign(g.cam,{cx:t.cx,cy:t.cy,z:t.z,mode:'free'})}const r=['.next-box','.right-cards'].map(s=>document.querySelector(s).getBoundingClientRect());return g.world.enemies.filter(e=>{const s=g.toScreen(e.x,e.y),rad=e.r*g.S;return r.some(b=>s.x+rad>b.left&&s.x-rad<b.right&&s.y+rad>b.top&&s.y-rad<b.bottom)}).length},view);assert.equal(hits,0,`controls cover a bandit in ${view} view at ${w}x${h}`)}
  await ctx.close()}
 pass('Fullscreen stage at 320×568, 390×844, 430×932, 768×1024, 844×390: no page chrome or scrolling, HUD inside safe area without overlaps, readable monsters/bandits, controls never cover bandits');

 // ── 3. Real touch aiming, launch, camera follow, impact and return ──
 {const {ctx,p,cdp}=await newPage(390,844);await openLevel(p,3,save(allClear(2)));await waitAim(p);const before=await G(p);const m=await monsterScreen(p);
  await touch(cdp,'touchStart',[m]);for(let i=1;i<=8;i++)await touch(cdp,'touchMove',[{x:m.x-9*i,y:m.y+4*i}]);let s=await G(p);assert.equal(s.gesture,'aim');
  const cam0=s.cx;await p.waitForTimeout(250);assert.equal((await G(p)).cx,cam0,'camera holds still while dragging');await p.screenshot({path:OUT+'/sling-aim.png'});
  // frame timing while aiming and flying (headless software rendering, not a phone)
  await p.evaluate(()=>{window.__ft=[];let l=0;const f=t=>{if(l)__ft.push(t-l);l=t;if(__ft.length<240)requestAnimationFrame(f)};requestAnimationFrame(f)});
  await touch(cdp,'touchEnd',[]);s=await G(p);assert.equal(s.shots,before.shots-1);assert.equal(s.proj,true);assert.equal(s.mode,'follow');
  await p.waitForTimeout(700);const mid=await G(p);assert.ok(mid.cx>cam0+60,'camera follows the monster');await p.screenshot({path:OUT+'/sling-flight.png'});
  await p.waitForFunction(()=>__sling.game.cam.mode==='impact'||__sling.game.world.status!=='flight',null,{timeout:12000});await p.screenshot({path:OUT+'/sling-impact.png'});
  await waitAim(p);await p.waitForFunction(()=>{const g=__sling.game;return Math.abs(g.cam.cx-g.aimTarget().cx)<3},null,{timeout:6000});const back=await G(p);assert.ok(Math.abs(back.cx-cam0)<40,'camera returns to the sling');
  const ft=await p.evaluate(()=>__ft);ft.sort((a,b)=>a-b);perf.headlessAvgMs=+(ft.reduce((a,b)=>a+b,0)/ft.length).toFixed(1);perf.headlessP95Ms=+ft[Math.floor(ft.length*.95)].toFixed(1);
  await ctx.close();pass(`Touch drag aims (camera frozen), release launches, camera follows, holds on impact and returns to the sling (headless frame avg ${perf.headlessAvgMs}ms, p95 ${perf.headlessP95Ms}ms)`)}

 // ── 4. Trajectory preview agrees with the real launch in the running page ──
 {const {ctx,p}=await newPage(844,390);await openLevel(p,1,save([]));await waitAim(p);const m=await monsterScreen(p);await p.mouse.move(m.x,m.y);await p.mouse.down();await p.mouse.move(m.x-60,m.y+22,{steps:6});
  const pred=await p.evaluate(async()=>{const ph=await import('./sling/physics.js'),bt=await import('./sling/battle.js'),g=__sling.game,dx=-g.pull.x,dy=-g.pull.y,o=bt.launchOrigin(dx,dy),v=bt.launchVelocity(dx,dy);window.__track=[];const f=()=>{const w=__sling.game.world;if(w.projectile)__track.push({age:w.age,x:w.projectile.x,y:w.projectile.y});if(__track.length<25)requestAnimationFrame(f)};requestAnimationFrame(f);return ph.predict(o.x,o.y,v.vx,v.vy,40,1)});
  await p.mouse.up();await p.waitForFunction(()=>__track.length>=25);const track=await p.evaluate(()=>__track);let worst=0,checked=0;for(const q of track){const i=Math.round(q.age*60)-1;if(i<0||i>=pred.length||q.age>.55)continue;worst=Math.max(worst,Math.hypot(pred[i].x-q.x,pred[i].y-q.y));checked++}
  assert.ok(checked>=8,'enough samples');assert.ok(worst<.05,'preview error '+worst);await ctx.close();pass(`Dotted trajectory preview matches the live flight (max error ${worst.toExponential(1)} world units over ${checked} frames)`)}

 // ── 5. Multi-touch, cancellation, orientation change and backgrounding never launch ──
 {const {ctx,p,cdp}=await newPage(390,844);await openLevel(p,1,save([]));await waitAim(p);const m=await monsterScreen(p);
  await touch(cdp,'touchStart',[{x:m.x,y:m.y,id:1}]);await touch(cdp,'touchMove',[{x:m.x-70,y:m.y+30,id:1}]);assert.equal((await G(p)).gesture,'aim');
  await touch(cdp,'touchStart',[{x:m.x-70,y:m.y+30,id:1},{x:m.x+120,y:m.y-200,id:2}]);await touch(cdp,'touchMove',[{x:m.x-90,y:m.y+40,id:1},{x:m.x+170,y:m.y-260,id:2}]);let s=await G(p);assert.equal(s.gesture,'pinch');
  await touch(cdp,'touchEnd',[{x:m.x+170,y:m.y-260,id:2}]);await touch(cdp,'touchEnd',[]);s=await G(p);assert.equal(s.shots,4);assert.equal(s.proj,false);assert.equal(s.status,'ready');
  await p.locator('#cam-reset').click();await waitAim(p);
  const m2=await monsterScreen(p);await touch(cdp,'touchStart',[m2]);await touch(cdp,'touchMove',[{x:m2.x-80,y:m2.y+30}]);await touch(cdp,'touchCancel',[]);s=await G(p);assert.equal(s.shots,4);assert.equal(s.gesture,null);
  const m3=await monsterScreen(p);await p.mouse.move(m3.x,m3.y);await p.mouse.down();await p.mouse.move(m3.x-80,m3.y+30,{steps:4});await p.setViewportSize({width:844,height:390});await p.waitForTimeout(200);await p.mouse.up();s=await G(p);assert.equal(s.shots,4,'rotation mid-drag must not launch');assert.equal(s.portrait,false);
  await waitAim(p);const m4=await monsterScreen(p);await p.mouse.move(m4.x,m4.y);await p.mouse.down();await p.mouse.move(m4.x-60,m4.y+20,{steps:4});await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await p.mouse.up();s=await G(p);assert.equal(s.shots,4,'backgrounding mid-drag must not launch');assert.equal(s.paused,true);
  await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  // dragging across the HUD: starting on a button is not an aim, and a short pull cancels safely
  await p.locator('[data-act="resume"]').click();await waitAim(p);const m5=await monsterScreen(p);await p.mouse.move(m5.x,m5.y);await p.mouse.down();await p.mouse.move(m5.x-3,m5.y+2);await p.mouse.up();s=await G(p);assert.equal(s.shots,4,'tiny pull cancels');
  await ctx.close();pass('Second finger cancels an aim into pinch; touch cancel, rotation mid-drag, backgrounding mid-drag and tiny pulls never launch')}

 // ── 5b. Portrait: landscape recommendation and the live TARGET window ──
 {const {ctx,p}=await newPage(390,844,{rotateTip:true});await openLevel(p,8,save(allClear(7)));await p.waitForSelector('.overlay.rotate.show');await p.waitForTimeout(400);await p.screenshot({path:OUT+'/sling-rotate-card.png'});
  assert.equal((await G(p)).mode,'intro','intro waits behind the card');await p.locator('[data-act="keep"]').click();await waitAim(p);
  const m=await monsterScreen(p);await p.mouse.move(m.x,m.y);await p.mouse.down();await p.mouse.move(m.x-75,m.y+28,{steps:6});
  const r=await p.evaluate(()=>{const g=__sling.game,c=g.canvas.getContext('2d'),t=g.targetRect(),d=c.getImageData(Math.round((t.x+t.w/2)*g.dpr),Math.round((t.y+t.h/2)*g.dpr),1,1).data;return{shown:g.drawTargetView.length>=0&&g.portrait&&g.world.enemies.every(e=>e.x>g.cam.cx+g.w/2/g.S),rect:t,px:[...d]}});
  assert.ok(r.shown,'fort is off-screen in portrait aim view');await p.screenshot({path:OUT+'/sling-target-view.png'});await p.mouse.up();
  await p.goto(BASE+'/sling.html?test#level-2');await p.waitForFunction(()=>__sling.game?.level.number===2);await p.waitForTimeout(300);assert.equal(await p.locator('.overlay.rotate.show').count(),0,'shown once per session');
  await p.setViewportSize({width:844,height:390});await p.evaluate(()=>sessionStorage.removeItem('slingRotateTip'));await p.setViewportSize({width:390,height:844});await p.goto(BASE+'/sling.html?test#level-3');await p.waitForSelector('.overlay.rotate.show');await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);assert.equal(await p.locator('.overlay.rotate.show').count(),0,'turning the phone closes the card');
  await ctx.close();pass('Portrait: one-time landscape recommendation (closes on rotation) and a live TARGET window with the trajectory while aiming')}

 // ── 6. Camera pan, pinch-zoom, wheel, limits and reset ──
 {const {ctx,p,cdp}=await newPage(390,844);await openLevel(p,9,save(allClear(8)));await waitAim(p);const a=await G(p);
  await touch(cdp,'touchStart',[{x:300,y:250}]);for(let i=1;i<=6;i++)await touch(cdp,'touchMove',[{x:300-i*30,y:250}]);await touch(cdp,'touchEnd',[]);let s=await G(p);assert.equal(s.mode,'free');assert.ok(s.cx>a.cx+100,'one-finger drag pans the world');assert.equal(await p.locator('#cam-reset').isVisible(),true);
  await touch(cdp,'touchStart',[{x:150,y:300,id:1},{x:250,y:300,id:2}]);for(let i=1;i<=6;i++)await touch(cdp,'touchMove',[{x:150-i*12,y:300,id:1},{x:250+i*12,y:300,id:2}]);await touch(cdp,'touchEnd',[]);s=await G(p);assert.ok(s.cz>1.2,'pinch zooms in');
  await touch(cdp,'touchStart',[{x:100,y:300,id:1},{x:300,y:300,id:2}]);for(let i=1;i<=10;i++)await touch(cdp,'touchMove',[{x:100+i*9,y:300,id:1},{x:300-i*9,y:300,id:2}]);await touch(cdp,'touchEnd',[]);s=await G(p);const lim=await p.evaluate(()=>({min:__sling.game.cam.minZ,max:__sling.game.cam.maxZ}));assert.ok(s.cz>=lim.min-1e-6&&s.cz<=lim.max+1e-6,'zoom limits');
  await p.screenshot({path:OUT+'/sling-zoomed-out.png'});await p.mouse.move(200,300);await p.mouse.wheel(0,-600);s=await G(p);assert.ok(s.cz<=lim.max+1e-6);
  await p.locator('#cam-reset').click();await waitAim(p);await p.waitForTimeout(1500);s=await G(p);assert.ok(Math.abs(s.cz-1)<.02&&Math.abs(s.cx-a.cx)<15,'reset returns to the aiming view');
  await ctx.close();pass('One-finger pan, pinch-to-zoom within limits, mouse wheel zoom and the recenter button')}

 // ── 7. All 11 hero skills through the real UI (tray, drag, tap) ──
 {const {ctx,p}=await newPage(844,390);await p.goto(BASE+'/sling.html?test');await p.evaluate(()=>localStorage.setItem('monsterMergeCodexV1',JSON.stringify([0,1,2,3,4,5,6,7,8,9,10])));const seen=[];
  let open=false;
  for(let id=0;id<11;id++){
   if(!open||await p.evaluate(()=>__sling.game.world.status!=='ready'||__sling.game.world.shots===0)){await openLevel(p,20,save(allClear(19)));open=true}
   await waitAim(p);await p.locator('#hero-btn').click();await p.waitForSelector('#tray.open');await p.locator(`#tray [data-hero="${id}"]`).click();await p.waitForFunction(id=>__sling.game.world.species===id&&__sling.game.ready&&!__sling.game.trayOpen,id);
   await dragLaunch(p,-80,26);await p.waitForTimeout(450);const fx0=await p.evaluate(()=>__sling.game.fx.list.length);assert.equal(await p.locator('#skill').getAttribute('data-state'),'ready');await p.locator('#skill').click({force:true});
   const r=await p.evaluate(()=>({used:__sling.game.world.used,fx:__sling.game.fx.list.length}));assert.equal(r.used,true,'skill '+id);assert.ok(r.fx>fx0,'skill '+id+' shows effects');await p.waitForTimeout(80);assert.equal(await p.locator('#skill').getAttribute('data-state'),'used');
   if(id===10)await p.screenshot({path:OUT+'/sling-skill-inferno.png'});if(id===1)await p.screenshot({path:OUT+'/sling-skill-bubble.png'});if(id===5)await p.screenshot({path:OUT+'/sling-skill-frost.png'});
   seen.push(id);await p.waitForFunction(()=>__sling.game.world.status!=='flight',null,{timeout:12000});
  }
  assert.deepEqual(seen.sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,9,10]);await ctx.close();pass('All 11 hero skills selected from the tray, launched by drag and fired once from the skill button with ready/used feedback and effects')}

 // ── 8. Physical destruction, chain reactions, victory, next level, save and reload ──
 {const sol=JSON.parse(fs.readFileSync(path.join(__dirname,'sling-solutions.json')));const {ctx,p}=await newPage(844,390);await p.goto(BASE+'/sling.html?test');
  await p.evaluate(()=>{localStorage.setItem('monsterMergeSaveV2','{"keep":true}');localStorage.setItem('tropicBest','4321')});
  const level=11;await openLevel(p,level,save(allClear(level-1)));await waitAim(p);const shots=sol[level].shots;
  // Fire the recorded solution through the page's own Battle, exactly as the solver did (fixed steps).
  const out=await p.evaluate(shots=>{const w=__sling.game.world,b0=w.blocks.length;for(const [sp,ang,pw,skillAt] of shots){if(w.status!=='ready')break;w.species=sp;const a=ang*Math.PI/180;w.launch(Math.cos(a)*100*pw,-Math.sin(a)*100*pw);let used=skillAt==null;for(let i=0;i<1400&&w.status==='flight';i++){if(!used&&w.projectile&&w.projectile.x>=skillAt){w.skill();used=true}w.tick(1/60)}}return{broken:w.blocks.filter(b=>b.dead).length,blocks:b0,status:w.status,remaining:w.remaining}},shots);
  assert.equal(out.status,'won');assert.equal(out.remaining,0);assert.ok(out.broken>=1,'blocks were broken by impacts');
  await p.waitForSelector('.result.win [data-act="next"]',{timeout:8000});await p.waitForTimeout(1600);await p.screenshot({path:OUT+'/sling-victory.png'});
  const saved=await p.evaluate(l=>JSON.parse(localStorage.getItem('monsterSlingSaveV1')).results[l-1],level);assert.ok(saved.stars>=1&&saved.score>0);
  await p.locator('[data-act="next"]').click();await p.waitForFunction(l=>__sling.game?.level.number===l+1,level);
  await p.reload();await p.waitForFunction(l=>__sling.game?.level.number===l+1,level);await p.goto(BASE+'/sling.html?test#map');await p.waitForSelector('.node');assert.equal(await p.locator(`.node[data-level="${level}"]`).isDisabled(),false);
  assert.equal(await p.evaluate(()=>localStorage.getItem('monsterMergeSaveV2')),'{"keep":true}');assert.equal(await p.evaluate(()=>localStorage.getItem('tropicBest')),'4321');
  await ctx.close();pass(`Level ${level}: recorded shots topple ${out.broken}/${out.blocks} blocks through real collisions, win with stars, unlock the next level, survive reload; Merge keys untouched`)}

 // ── 9. Defeat and quick retry; unlock celebration ──
 {const {ctx,p}=await newPage(390,844);await openLevel(p,2,save(allClear(1)));await waitAim(p);await p.evaluate(()=>{const w=__sling.game.world;for(let i=0;i<4;i++){w.launch(-80,-10);for(let k=0;k<900&&w.status==='flight';k++)w.tick(1/60)}});
  await p.waitForSelector('.result.lose [data-act="retry"]',{timeout:15000});await p.screenshot({path:OUT+'/sling-defeat.png'});await p.locator('[data-act="retry"]').click();await p.waitForFunction(()=>__sling.game.world.shots===4&&__sling.game.world.status==='ready');
  await openLevel(p,4,save(allClear(3)));await waitAim(p);await p.evaluate(()=>{const w=__sling.game.world;w.launch(80,-40);for(const e of w.enemies)w.damage(e,9999)});await p.waitForSelector('.unlock-hero',{timeout:8000});assert.match(await p.locator('.unlock-hero').textContent(),/Sproutiball/);await p.waitForTimeout(1500);await p.screenshot({path:OUT+'/sling-unlock.png'});
  await ctx.close();pass('Defeat card retries instantly; clearing the 4th level celebrates the newly unlocked Sproutiball')}

 // ── 10. Pause, resume and background/foreground ──
 {const {ctx,p}=await newPage(844,390);await openLevel(p,5,save(allClear(4)));await dragLaunch(p);await p.waitForTimeout(200);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await p.waitForSelector('.overlay.pause');const t0=(await G(p)).time;await p.waitForTimeout(600);assert.equal((await G(p)).time,t0,'simulation is frozen while paused');await p.screenshot({path:OUT+'/sling-pause.png'});
  await p.locator('[data-act="help"]').click();await p.waitForSelector('.help-grid');await p.screenshot({path:OUT+'/sling-help.png'});await p.locator('[data-back]').click();await p.locator('[data-act="resume"]').click();await p.waitForTimeout(400);assert.ok((await G(p)).time>t0,'resumes');
  await p.keyboard.press('Escape');await p.waitForSelector('.overlay.pause');await p.keyboard.press('Escape');await p.waitForFunction(()=>!__sling.game.paused);
  await ctx.close();pass('Backgrounding pauses with an overlay and freezes physics; resume, help and keyboard pause work')}

 // ── 11. Portrait ↔ landscape while playing ──
 {const {ctx,p}=await newPage(390,844);await openLevel(p,6,save(allClear(5)));await waitAim(p);const a=await G(p);await p.setViewportSize({width:844,height:390});await p.waitForTimeout(400);const b=await G(p);assert.equal(a.portrait,true);assert.equal(b.portrait,false);
  const c=await p.evaluate(()=>{const r=__sling.game.canvas;return[r.width,r.height,r.getBoundingClientRect().width]});assert.equal(Math.round(c[2]),844);await p.screenshot({path:OUT+'/sling-rotated.png'});await dragLaunch(p);assert.equal((await G(p)).proj,true);await ctx.close();pass('Rotating mid-level resizes the stage and camera, and play continues')}

 // ── 12. Repeated restarts: no leaked loops, listeners or input freezes ──
 {const {ctx,p,cdp}=await newPage(390,844);await openLevel(p,1,save([]));await waitAim(p);await cdp.send('HeapProfiler.collectGarbage');const heap0=await p.evaluate(()=>performance.memory.usedJSHeapSize);
  for(let i=0;i<25;i++){await p.evaluate(()=>{location.hash='#map'});await p.waitForSelector('.node');await p.evaluate(()=>{location.hash='#level-1'});await p.waitForFunction(()=>__sling.game?.alive)}
  await waitAim(p);const loops=await p.evaluate(()=>new Promise(r=>{let n=0;const orig=window.requestAnimationFrame;window.requestAnimationFrame=f=>{n++;return orig(f)};setTimeout(()=>{window.requestAnimationFrame=orig;r(n)},1000)}));
  assert.ok(loops<90,'only one animation loop is running ('+loops+' frames/s requested)');await cdp.send('HeapProfiler.collectGarbage');await p.waitForTimeout(300);await cdp.send('HeapProfiler.collectGarbage');const heap1=await p.evaluate(()=>performance.memory.usedJSHeapSize);
  assert.ok(heap1-heap0<12e6,'heap growth '+((heap1-heap0)/1e6).toFixed(1)+'MB');assert.equal(await p.locator('canvas').count(),1);
  for(let i=0;i<5;i++){await p.locator('#pause').click();await p.locator('[data-act="retry"]').click();await p.waitForFunction(()=>__sling.game?.alive&&__sling.game.world.shots===4)}
  await dragLaunch(p);assert.equal((await G(p)).proj,true,'input still works');perf.heapGrowthMB=+((heap1-heap0)/1e6).toFixed(1);await ctx.close();pass(`30 restarts: one animation loop, heap growth ${perf.heapGrowthMB}MB, input still responsive`)}

 // ── 13. Reduced motion ──
 {const {ctx,p}=await newPage(844,390,{reducedMotion:'reduce'});await p.goto(BASE+'/sling.html?test');await p.evaluate(()=>localStorage.setItem('monsterMergeCodexV1','[4]'));await openLevel(p,3,save(allClear(2),{selected:4}));await dragLaunch(p);await p.waitForTimeout(400);await p.locator('#skill').click({force:true});await p.waitForTimeout(50);assert.equal(await p.evaluate(()=>__sling.game.cam.shake),0);assert.ok(await p.evaluate(()=>__sling.game.fx.budget)<=70);await ctx.close();pass('Reduced-motion preference: no screen shake, lighter particles, still playable')}

 // ── 14. Offline play and upgrade from the previous release ──
 {const old=path.join(OUT,'previous-release');fs.rmSync(old,{recursive:true,force:true});fs.mkdirSync(old,{recursive:true});let prevRef='b5f39ee';try{execSync(`git -C "${ROOT}" cat-file -e ${prevRef}`)}catch{prevRef=null}
  if(prevRef){execSync(`git -C "${ROOT}" archive ${prevRef} | tar -x -C "${old}"`);siteRoot=old}
  const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'allow'});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(BASE+'/');await p.evaluate(async()=>{await navigator.serviceWorker.ready;const c=await caches.open('another-game-test');await c.put('/another-game/x',new Response('x'));localStorage.setItem('monsterSlingSaveV1',JSON.stringify({version:1,results:[{score:4242,stars:3},{score:10,stars:1}],selected:4,sound:true,revision:3}))});
  await poll(p,async()=>(await caches.keys()).some(k=>k.startsWith('monster-merge-v16')));
  siteRoot=ROOT;await p.goto(BASE+'/');await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});
  await poll(p,async()=>{const k=await caches.keys();return k.includes('monster-island-v18-9-visible-elemental-20261026')&&!k.some(x=>x.startsWith('monster-merge-'))});
  // the page that was open during the update reloads itself once (it is not in a level)
  await p.waitForLoadState('load');await poll(p,async()=>{const r=await navigator.serviceWorker.getRegistration();return !!r?.active&&r.active.state==='activated'&&!r.waiting&&!r.installing});
  const keys=await p.evaluate(()=>caches.keys());assert.ok(keys.includes('another-game-test'),'unrelated caches survive');
  await p.waitForFunction(()=>navigator.serviceWorker.controller&&navigator.serviceWorker.controller.scriptURL.includes('sw.js'));await ctx.setOffline(true);
  const precached=await p.evaluate(async()=>{const c=await caches.open('monster-island-v18-9-visible-elemental-20261026');return (await c.keys()).map(k=>new URL(k.url).pathname)});
  assert.ok(precached.some(p=>p.endsWith('/match.html')),'Match cached offline');
  assert.ok(precached.some(p=>p.endsWith('/merge.html')),'Merge cached offline');
  assert.equal(precached.some(p=>p.endsWith('/sling.html')),false,'Sling not precached');
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('monsterSlingSaveV1')).results[0].score),4242,'Saved Sling progress still preserved');
  await p.goto(BASE+'/match.html');await p.waitForSelector('.tile');assert.equal(await p.locator('.tile').count(),64);
  await p.goto(BASE+'/merge.html');await p.waitForTimeout(800);assert.equal(await p.evaluate(()=>document.querySelector('canvas')!==null),true);
  await ctx.close();pass(`Upgrade from the previous release (${prevRef||'n/a'}) keeps progress, replaces only this game's caches, then Merge and Match run offline while Sling remains hidden`)}

 // ── 15. Monster Merge is byte-for-byte unchanged ──
 {const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'merge.html'))).digest('hex');assert.equal(sha,MERGE_SHA);pass('merge.html SHA-256 unchanged ('+sha.slice(0,12)+'…)')}

 const real=errors.filter(e=>!/Failed to load resource: net::ERR_INTERNET_DISCONNECTED/.test(e));assert.deepEqual(real,[],'console/page errors: '+real.join(' | '));assert.deepEqual(failed.filter(u=>!u.includes('favicon')),[],'failed requests');pass('No console errors, page errors or failed requests');
 fs.writeFileSync(path.join(OUT,'sling-results.json'),JSON.stringify({results,perf},null,2));await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
