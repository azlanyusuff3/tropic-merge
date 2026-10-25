// Monster Match: real browser interaction and regression coverage.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const ROOT = path.resolve(__dirname, '..');
const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (requested === '/') requested = '/index.html';
  const file = path.resolve(ROOT, '.' + requested);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (error, content) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.setHeader('content-type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(content);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  try {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [768, 1024]]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.goto(base + '/');
      assert.equal(await page.locator('a[href="./merge.html"]').count(), 1);
      assert.equal(await page.locator('a[href="./sling.html"]').count(), 0);
      assert.equal(await page.locator('a[href="./match.html"]').count(), 1);
      assert.equal(await page.locator('.mode-card').count(), 2, 'Home screen has exactly two games');
      assert.equal(await page.locator('.match-preview img[src="./match/assets/tidalon-match.webp"]').count(), 1);
      assert.equal(await page.locator('.match-preview img[src="./match/assets/frostbop-match.webp"]').count(), 1);
      await page.locator('a[href="./match.html"]').click();
      await page.waitForSelector('.tile');
      assert.equal(await page.locator('.tile').count(), 64);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const board = await page.locator('#board').boundingBox();
      assert.ok(board.width >= 200);
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('.tile img')].every(img => img.complete && img.naturalWidth > 0)), true);
      const images = await page.evaluate(async () => {
        const urls = ['./match/assets/tidalon-match.webp', './match/assets/frostbop-match.webp'];
        return Promise.all(urls.map(src => new Promise(resolve => {
          const image = new Image(); image.onload = () => resolve(image.naturalWidth > 100 && image.naturalHeight > 100);
          image.onerror = () => resolve(false); image.src = src;
        })));
      });
      assert.deepEqual(images, [true, true], 'both Match-only water and ice artworks must load');

      await page.locator('#hint-btn').click();
      const hints = await page.locator('.tile.hinted').all();
      assert.equal(hints.length, 2);
      for (const tile of hints) {
        const box = await tile.boundingBox();
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }
      await page.waitForFunction(() => window.__monsterMatch.state().moves === 1 && !window.__monsterMatch.state().busy, null, { timeout: 10000 });
      const previous = await page.evaluate(() => window.__monsterMatch.state());
      assert.ok(previous.score > 0 && previous.matches >= 3);
      await page.reload();
      assert.equal(await page.evaluate(() => window.__monsterMatch.state().score), previous.score);
      await page.locator('#new-btn').click();
      await page.locator('#confirm-reset').click();
      const next = await page.evaluate(() => window.__monsterMatch.state());
      assert.equal(next.score, 0);
      assert.equal(next.best, previous.score);
      assert.equal(errors.length, 0, errors.join('; '));
      await context.close();
      console.log(`PASS Monster Match ${width}x${height}: menu, sprites, touch, save, restart`);
    }

    // End-to-end Match 5 evolution, power use, persistence, and the 5x5 mega blast.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/match.html');
      await page.evaluate(async () => {
        const {createBoard,findRuns} = await import('./match/engine.mjs');
        let board;
        for(let i=0;i<3000&&!board;i++){
          const b=createBoard();
          for(const c of [1,2,4,5]) b[3][c].kind=4;
          b[3][3].kind=0;b[4][3].kind=4;
          if(!findRuns(b).length)board=b;
        }
        if(!board)throw Error('No Rockro evolution test board');
        localStorage.setItem('monsterMatchSaveV1',JSON.stringify({version:1,board,score:123,best:123,matches:0,moves:0}));
      });
      await page.reload();
      await page.locator('.tile[data-r="4"][data-c="3"]').tap();
      await page.locator('.tile[data-r="3"][data-c="3"]').tap();
      await page.waitForFunction(() => window.__monsterMatch.state().moves===1&&!window.__monsterMatch.state().busy);
      assert.ok(await page.locator('.tile.is-evolved').count()>=1);
      const names=await page.locator('.tile.is-evolved').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')));
      assert.ok(names.some(name=>name.startsWith('Infernodon')),'Rockro evolves to Infernodon');
      const score=await page.evaluate(()=>window.__monsterMatch.state().score);
      await page.reload();
      assert.equal(await page.evaluate(()=>window.__monsterMatch.state().score),score);
      const pos=await page.locator('.tile.is-evolved').first.evaluate(n=>({r:+n.dataset.r,c:+n.dataset.c}));
      const neighbour=pos.c<7?pos.c+1:pos.c-1;
      await page.locator('.tile[data-r="'+pos.r+'"][data-c="'+pos.c+'"]').tap();
      await page.locator('.tile[data-r="'+pos.r+'"][data-c="'+neighbour+'"]').tap();
      await page.waitForFunction(() => window.__monsterMatch.state().moves===2&&!window.__monsterMatch.state().busy);
      assert.ok(await page.evaluate(()=>window.__monsterMatch.state().score)>score,'3x3 blast scores points');
      await page.evaluate(async () => {
        const {createBoard}=await import('./match/engine.mjs');
        const board=createBoard();
        board[3][3]={...board[3][3],kind:2,special:'evolved',evolution:'shadebub'};
        board[3][4]={...board[3][4],kind:4,special:'evolved',evolution:'infernodon'};
        localStorage.setItem('monsterMatchSaveV1',JSON.stringify({version:1,board,score:0,best:10000,matches:0,moves:0}));
      });
      await page.reload();
      assert.equal(await page.locator('.tile.is-evolved').count(),2);
      await page.locator('.tile[data-r="3"][data-c="3"]').tap();
      await page.locator('.tile[data-r="3"][data-c="4"]').tap();
      await page.waitForFunction(() => window.__monsterMatch.state().moves===1&&!window.__monsterMatch.state().busy);
      assert.match(await page.locator('#game-message').textContent(),/MEGA BLAST/);
      assert.equal(await page.locator('.tile').count(),64);
      assert.deepEqual(errors,[]);
      await context.close();
      console.log('PASS Monster Evolution browser: Match5, Infernodon, save, 3x3, 5x5');
    }

    // Elemental powers: tap previews exact ability and touch activates the move.
    for (const [name, kind, label] of [
      ['bubblo',1,'Tidal Wave'],['shadebub',2,'Shadow Explosion'],
      ['groveling',3,'Vine Strike'],['lumiorb',5,'Star Magic'],
      ['infernodon',4,'Inferno Blast']
    ]) {
      const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/match.html');
      await page.evaluate(async({name,kind})=>{
        const {createBoard}=await import('./match/engine.mjs');
        const board=createBoard();
        board[3][3]={...board[3][3],kind,special:'evolved',evolution:name};
        board[3][4]={...board[3][4],kind:2,special:null};
        localStorage.setItem('monsterMatchSaveV1',JSON.stringify({
          version:1,board,score:0,best:100,matches:0,moves:0
        }));
      },{name,kind});
      await page.reload();
      assert.equal(await page.locator('.tile.is-evolved').count(),1);
      await page.locator('.tile[data-r="3"][data-c="3"]').tap();
      assert.ok(await page.locator('.tile.power-preview').count()>0,name+' must preview affected cells');
      assert.ok((await page.locator('#game-message').textContent()).includes(label),name+' should identify its unique power');
      await page.locator('.tile[data-r="3"][data-c="4"]').tap();
      await page.waitForFunction(()=>window.__monsterMatch.state().moves===1&&!window.__monsterMatch.state().busy);
      assert.ok(await page.evaluate(()=>window.__monsterMatch.state().score)>0,name+' should score points');
      assert.equal(await page.locator('.tile').count(),64,name+' keeps full playable board');
      assert.deepEqual(errors,[],name+' must not throw');
      await context.close();
      console.log('PASS '+name+': preview and activate '+label);
    }
  } finally { await browser.close(); }
})().then(() => server.close()).catch(error => { console.error(error); server.close(); process.exitCode = 1; });
