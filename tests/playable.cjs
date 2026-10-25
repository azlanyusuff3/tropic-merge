// Run: npm install && npm test (requires Playwright Chromium or CHROMIUM_PATH).
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');let base=process.env.TEST_URL;
const hook=`
window.__game={balls,ballKinds,monsterImages,box,spawn,merge,physics,bombAt,shakeBox,reset,draw,getBallSprite,monsterPose,jellyKick,endGame,nextIconR,faceAssets,faceState,faceEvent,
 state:()=>({score,best,gameOver,combo,soundOn,bombMode,running,currentLevel,nextLevel,dragging,pointerId}),
 pause:()=>{running=false},resume:()=>{running=true},
 seed:(level,x,y)=>{spawn(level,x);let b=balls[balls.length-1];Object.assign(b,{y,vx:0,vy:0,born:performance.now()-2000,mergeLock:0,entered:true,sleeping:false});return b},
 setDrop:(level)=>{currentLevel=level;lastDrop=0},
 world:(x,y)=>{const r=canvas.getBoundingClientRect();return {x:r.left+offsetX+x*scale,y:r.top+offsetY+y*scale}},
 gallery:()=>{reset();running=false;balls.length=0;ballKinds.forEach((k,i)=>balls.push({level:i,r:Math.min(k.r,44),x:75+(i%3)*135,y:270+Math.floor(i/3)*105,rot:0,danger:0,sleeping:true}));draw()},
};
`;
(async()=>{
 let server;
 if(!base){server=require('node:http').createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'})[path.extname(file)]||'text/plain');res.end(data)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const results=[],errors=[];
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.addInitScript(()=>localStorage.setItem('tropicBest','4321'));
 await context.route('**/index.html',async route=>{let html=fs.readFileSync(path.join(root,'index.html'),'utf8');html=html.replace('reset();\n})();',hook+'reset();\n})();');await route.fulfill({contentType:'text/html',body:html})});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/index.html');await page.waitForFunction(()=>!document.getElementById('play').disabled);
 assert.equal(await page.locator('#best').textContent(),'4321');
 await page.locator('#play').tap();await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>__game.monsterImages.filter(i=>i.complete&&i.naturalWidth).length),11);results.push('11 decoded sprites and legacy best-score preservation');
 const pos=await page.evaluate(()=>__game.world(150,350));await page.touchscreen.tap(pos.x,pos.y);
 await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>__game.balls.length),1);results.push('Real touch drop and gravity');
 const mergeResults=await page.evaluate(()=>{const g=__game;g.pause();return g.ballKinds.slice(0,-1).map((k,i)=>{g.reset();g.pause();g.seed(i,180-k.r,500);g.seed(i,180+k.r,500);g.physics(1/60);const b=g.balls[0];return {i,count:g.balls.length,level:b.level,score:g.state().score,expected:g.ballKinds[i+1].value}})});
 for(const r of mergeResults){assert.equal(r.count,1);assert.equal(r.level,r.i+1);assert.equal(r.score,r.expected)}results.push('All 10 merge transitions, radius progression and scoring');
 const overlap=await page.evaluate(()=>{const g=__game;g.reset();g.pause();g.seed(0,200,450);g.seed(1,200,450);g.physics(1/60);return Math.hypot(g.balls[0].x-g.balls[1].x,g.balls[0].y-g.balls[1].y)});assert.ok(overlap>30);results.push('Coincident unequal objects separate without NaN');
 const cap=await page.evaluate(()=>{const g=__game;g.reset();g.pause();return g.merge(g.seed(10,100,500),g.seed(10,300,500))});assert.equal(cap,false);results.push('Legendary level cap stays at 11');
 const combo=await page.evaluate(()=>{const g=__game;g.reset();g.pause();let a=g.seed(0,100,500),b=g.seed(0,125,500);g.merge(a,b);a=g.seed(0,220,500);b=g.seed(0,245,500);g.merge(a,b);return g.state()});assert.equal(combo.score,12);assert.equal(combo.combo,2);results.push('Consecutive merge multiplier: 4 + 8 = 12');
 await page.evaluate(()=>{__game.reset();__game.pause();__game.seed(4,200,560);__game.resume()});await page.waitForTimeout(400);await page.locator('#bomb').tap();const target=await page.evaluate(()=>__game.world(__game.balls[0].x,__game.balls[0].y));await page.touchscreen.tap(target.x,target.y);assert.equal(await page.evaluate(()=>__game.balls.length),0);results.push('Bomb button, touch selection and one-monster removal');
 const shake=await page.evaluate(()=>{const g=__game;g.reset();g.seed(2,160,620);g.seed(3,270,610);g.resume();g.shakeBox();return {count:g.balls.length,moving:g.balls.every(b=>!b.sleeping&&b.vy<0)}});assert.equal(shake.count,2);assert.ok(shake.moving);results.push('Shake applies impulses without merging unlike monsters');
 const stable=await page.evaluate(()=>{const g=__game;g.reset();g.pause();[0,1,2,3,4,5].forEach((l,i)=>g.seed(l,65+i*55,350-i*20));for(let i=0;i<600;i++)g.physics(1/60);return g.balls.every(b=>[b.x,b.y,b.vx,b.vy,b.rot].every(Number.isFinite)&&b.x-b.r*.985>=g.box.l-.01&&b.x+b.r*.985<=g.box.r+.01&&b.y+b.r*.985<=g.box.b+.01)});assert.ok(stable);results.push('10-second mixed pile simulation: finite positions, wall/floor containment');
 await page.evaluate(()=>{const g=__game;g.reset();g.pause();const b=g.seed(0,100,190);b.sleeping=true;for(let i=0;i<90;i++)g.physics(1/60)});assert.equal(await page.evaluate(()=>__game.state().gameOver),true);assert.equal(await page.locator('#modal').isVisible(),true);await page.locator('#again').tap();assert.equal(await page.evaluate(()=>__game.state().gameOver),false);results.push('Original danger timing, Game Over modal and Play Again');
 await page.locator('#sound').tap();assert.equal(await page.evaluate(()=>__game.state().soundOn),false);await page.locator('#sound').tap();assert.equal(await page.evaluate(()=>__game.state().soundOn),true);results.push('Sound toggle state');
 page.on('dialog',d=>d.accept());await page.locator('#new').tap();assert.equal(await page.evaluate(()=>__game.state().score),0);assert.equal(await page.evaluate(()=>__game.balls.length),0);results.push('Restart confirmation clears board');
 const alive=await page.evaluate(()=>{const g=__game;g.reset();g.pause();const out={finite:true,moves:0};
  for(let l=0;l<g.ballKinds.length;l++){const b=g.seed(l,200,500);b.sleeping=true;b.vx=0;b.vy=0;
   const a=g.monsterPose(b,1000),c=g.monsterPose(b,1400);
   for(const p of [a,c])for(const k of ['sx','sy','tilt'])if(!Number.isFinite(p[k]))out.finite=false;
   if(Math.abs(a.sy-c.sy)>1e-4||Math.abs(a.tilt-c.tilt)>1e-4)out.moves++}
  const j=g.seed(0,200,400);j.sleeping=true;g.jellyKick(j,.25);const hit=g.monsterPose(j,performance.now()+10).sy,calm=g.monsterPose(j,performance.now()+4000).sy;
  const m=g.seed(3,100,400);m.sleeping=true;m.popT=1000;const small=g.monsterPose(m,1000).sx;
  const before=g.balls.map(b=>[b.x,b.y,b.r]);g.draw();g.draw();const same=g.balls.every((b,i)=>b.x===before[i][0]&&b.y===before[i][1]&&b.r===before[i][2]);
  return {...out,hit,calm,small,same}});
 assert.ok(alive.finite);assert.equal(alive.moves,11);assert.ok(alive.hit<alive.calm-.05);assert.ok(alive.small<.8);assert.ok(alive.same);results.push('Monster animation: all 11 move, impact squash settles, merge pop-in, physics untouched');
 const faces=await page.evaluate(()=>{const g=__game;g.reset();g.pause();const ok=g.faceAssets.map(a=>!!a&&a.feats.length===3&&a.bare.width===512);
  const b=g.seed(0,200,500);b.sleeping=true;b.contact=true;const t=performance.now();const st0=g.faceState(b,t);
  g.faceEvent(b,'hurt',400);const hurt=g.faceState(b,t+16).mood;g.faceEvent(b,'surprise',300);const keep=g.faceState(b,t+32).mood;
  const p=g.seed(2,300,500);p.sleeping=true;p.contact=true;g.faceEvent(p,'surprise',500);let o=0;for(let i=1;i<=20;i++)o=g.faceState(p,t+i*16).open;
  let blinked=false;for(let i=0;i<400&&!blinked;i++)if(g.faceState(b,t+1000+i*16).lid>.5)blinked=true;
  const fin=[st0.lx,st0.ly,st0.lid,st0.msx,st0.msy].every(Number.isFinite);g.draw();return{ok,hurt,keep,o,blinked,fin}});
 assert.ok(faces.ok.every(Boolean),'face rig for all 11');assert.equal(faces.hurt,'hurt');assert.equal(faces.keep,'hurt','lower-priority mood must not override');
 assert.ok(faces.o>.9,'closed-eye monster pops its eyes open when startled');assert.ok(faces.blinked,'monsters blink');assert.ok(faces.fin);
 results.push('Living faces: rigs for all 11, blinking, reactions with priority, closed eyes pop open');
 fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
 await page.evaluate(()=>__game.gallery());await page.screenshot({path:path.join(root,'test-output/monsters.png')});
 for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[1440,900]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);const layout=await page.evaluate(()=>{const ids=['top','bottomBar','scoreCard','bestCard','bomb','shakeBtn','new','sound'];const boxes=ids.map(id=>({id,...JSON.parse(JSON.stringify(document.getElementById(id).getBoundingClientRect()))}));return {boxes,overflow:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth}});assert.equal(layout.overflow,false);for(const b of layout.boxes){assert.ok(b.left>=0&&b.right<=width+.5&&b.top>=0&&b.bottom<=height+.5,`${width} ${b.id} bounds`)}const tools=layout.boxes.slice(4);for(let i=1;i<tools.length;i++)assert.ok(tools[i].left>=tools[i-1].right);await page.screenshot({path:path.join(root,`test-output/viewport-${width}.png`)});}results.push('No page overflow or overlapping controls at 5 phone/tablet/desktop sizes');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{__game.reset();__game.resume();__game.setDrop(0)});
 const dragStart=await page.evaluate(()=>__game.world(100,350)),dragEnd=await page.evaluate(()=>__game.world(300,350));await page.mouse.move(dragStart.x,dragStart.y);await page.mouse.down();await page.mouse.move(dragEnd.x,dragEnd.y,{steps:8});await page.mouse.up();assert.ok(await page.evaluate(()=>__game.balls[0].x>290));results.push('Drag-and-release world coordinate mapping');
 for(let i=0;i<18;i++){await page.evaluate(i=>__game.setDrop(i%5),i);const p=await page.evaluate(i=>__game.world(70+(i*79)%280,350),i);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(280)}await page.waitForTimeout(1000);await page.screenshot({path:path.join(root,'test-output/gameplay.png')});results.push('Actual running board after 19 interactive drops');
 // Regression: the NEXT box used to draw every monster at about the same size, so a tiny Slimelet looked 2x too big.
 const nextRatios=await page.evaluate(()=>[0,1,2,3,4].map(l=>__game.nextIconR(l)/__game.ballKinds[l].r));
 for(const r of nextRatios)assert.ok(Math.abs(r-nextRatios[0])<1e-9,'NEXT size ratio must be identical for every level');
 const nextFits=await page.evaluate(()=>[0,1,2,3,4].map(l=>__game.nextIconR(l)*__game.ballKinds[l].artScale));assert.ok(Math.max(...nextFits)<=94.01);
 results.push('NEXT box shows monsters at the same relative size as on the board');
 // Regression: a second finger pressing Shake or Bomb while the first finger is aiming used to block every later drop.
 const cdp=await context.newCDPSession(page);const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:0}]});
 for(const press of ['shake','bomb']){
  await page.evaluate(()=>{__game.reset();__game.resume();__game.seed(2,200,600)});await page.waitForTimeout(1400);
  let q=await page.evaluate(()=>__game.world(100,350));await touch('touchStart',q.x,q.y);await page.waitForTimeout(40);
  await page.evaluate(p=>{if(p==='shake')__game.shakeBox();else{document.getElementById('bomb').click();document.getElementById('bomb').click()}},press);
  await touch('touchEnd');await page.waitForTimeout(350);const n=await page.evaluate(()=>__game.balls.length);
  q=await page.evaluate(()=>__game.world(300,350));await page.touchscreen.tap(q.x,q.y);await page.waitForTimeout(350);
  assert.equal(await page.evaluate(()=>__game.balls.length),n+1,press+' left input stuck')}
 results.push('Drops keep working after Shake/Bomb pressed mid-aim');
 await page.evaluate(()=>{__game.reset();__game.resume();__game.endGame()});await page.locator('#closeModal').tap();
 let q=await page.evaluate(()=>__game.world(200,350));await page.touchscreen.tap(q.x,q.y);await page.waitForTimeout(100);
 assert.equal(await page.locator('#modal').isVisible(),true);assert.notEqual(await page.locator('#finalBest').textContent(),'New personal best ✨');
 await page.locator('#again').tap();results.push('View Board: tapping the board brings Game Over back; zero score is not a personal best');
 assert.deepEqual(errors,[]);results.push('No browser JavaScript errors');await context.close();
 // Real unmodified page, real service worker, real offline network failure.
 const offline=await browser.newContext({viewport:{width:390,height:844}}),op=await offline.newPage();op.on('pageerror',e=>errors.push(e.message));
 await op.goto(base+'/index.html');await op.waitForFunction(()=>!document.getElementById('play').disabled);await op.evaluate(()=>navigator.serviceWorker.ready);await op.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await op.evaluate(()=>caches.open('another-game-test').then(c=>c.put('/unrelated',new Response('keep'))));
 await offline.setOffline(true);await op.reload();await op.waitForFunction(()=>!document.getElementById('play').disabled);await op.locator('#play').click();const cached=await op.evaluate(async()=>{const names=await caches.keys(),name=names.find(x=>x.startsWith('monster-merge-'));return {count:(await (await caches.open(name)).keys()).length,other:names.includes('another-game-test')}});assert.ok(cached.count>=19);assert.ok(cached.other);assert.deepEqual(errors,[]);results.push(`Real offline reload, play and ${cached.count} cached resources`);
 await browser.close();if(server)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(root,'test-output/results.json'),JSON.stringify({passed:results},null,2));console.log(results.map(x=>'PASS '+x).join('\n'));
})().catch(e=>{console.error(e);process.exit(1)});
