// Actual browser regression for the six elemental Match 3/4/5 visual attacks.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.html': 'text/html',
  '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const target = path.resolve(ROOT, '.' + (rel === '/' ? '/index.html' : rel));
  if (!target.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(target, (err, content) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.setHeader('content-type', MIME[path.extname(target)] || 'application/octet-stream');
    res.end(content);
  });
});
const fixtures = [
  ['slime', 0, 3], ['water', 1, 3], ['puff', 2, 3],
  ['leaf', 3, 3], ['rock', 4, 3], ['ice', 5, 3],
  ['rock', 4, 4], ['ice', 5, 5]
];
const seedAndTap = async (page, kind, tier) => {
  await page.evaluate(async ({ kind, tier }) => {
    const { createBoard, findRuns, makeMove } = await import('./match/engine.mjs');
    const row = tier === 3 ? [1, 2] : tier === 4 ? [1, 2, 4] : [1, 2, 4, 5];
    let board = null;
    for (let i = 0; i < 2000 && !board; i++) {
      const b = createBoard();
      for (const c of row) b[3][c].kind = kind;
      b[3][3].kind = (kind + 1) % 6;
      b[4][3].kind = kind;
      b[3][0].kind = (kind + 2) % 6;
      b[3][6].kind = (kind + 3) % 6;
      if (tier === 3) b[3][4].kind = (kind + 2) % 6;
      if (tier === 4) b[3][5].kind = (kind + 3) % 6;
      if (findRuns(b).length) continue;
      const move = makeMove(b, [4, 3], [3, 3]);
      if (move.valid && move.stages[0].matches.some(m => m.kind === kind && m.tier === tier)) board = b;
    }
    if (!board) throw Error('Unable to construct elemental FX test board');
    localStorage.setItem('monsterMatchSaveV1', JSON.stringify({ version: 1, board,
      score: 0, best: 0, matches: 0, moves: 0 }));
  }, { kind, tier });
  await page.reload();
  await page.locator('.tile[data-r="4"][data-c="3"]').tap();
  await page.locator('.tile[data-r="3"][data-c="3"]').tap();
};
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 },
      isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(base + '/match.html');
    for (const [key, kind, tier] of fixtures) {
      await seedAndTap(page, kind, tier);
      const selector = `.elemental-cast[data-element="${key}"][data-tier="${tier}"]`;
      await page.waitForFunction(s => !!document.querySelector(s), selector, { timeout: 3000 });
      assert.ok(await page.locator(selector + ' .elemental-particle').count() >= 5);
      assert.equal(await page.locator(selector).evaluate(node => getComputedStyle(node).animationName), 'element-cast-life');
      await page.waitForFunction(() => !window.__monsterMatch.state().busy, null, { timeout: 11000 });
      assert.ok((await page.evaluate(() => window.__monsterMatch.state().score)) > 0);
      assert.equal(await page.locator('.tile').count(), 64);
      assert.equal(await page.locator('.tile.element-charged').count(), 0);
    }
    assert.deepEqual(errors, []);
    await context.close();
    const calm = await browser.newContext({ viewport: { width: 390, height: 844 },
      isMobile: true, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const calmPage = await calm.newPage();
    await calmPage.goto(base + '/match.html');
    await seedAndTap(calmPage, 0, 3);
    await calmPage.waitForFunction(() => !!document.querySelector('.elemental-cast[data-element="slime"]'), null, { timeout: 2500 });
    assert.equal(await calmPage.locator('.elemental-cast .elemental-particle').count(), 0);
    await calmPage.waitForFunction(() => !window.__monsterMatch.state().busy, null, { timeout: 11000 });
    assert.equal(await calmPage.locator('.tile').count(), 64);
    await calm.close();
    console.log('PASS Match elemental FX browser: 6 kinds, Match 4/5, reduced motion, score, no JS errors');
  } finally { await browser.close(); }
})().then(() => server.close()).catch(err => { console.error(err); server.close(); process.exitCode = 1; });
