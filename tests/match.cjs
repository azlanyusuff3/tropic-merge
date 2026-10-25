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
      assert.equal(await page.locator('a[href="./sling.html"]').count(), 1);
      assert.equal(await page.locator('a[href="./match.html"]').count(), 1);
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
  } finally { await browser.close(); }
})().then(() => server.close()).catch(error => { console.error(error); server.close(); process.exitCode = 1; });
