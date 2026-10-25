const CACHE = 'monster-merge-v13-20261025-1';
const CORE = [
  './', './index.html', './manifest.webmanifest', './assets/tropical.webp',
  './icons/apple-touch-icon.png', './icons/icon-192.png',
  './icons/icon-512.png', './icons/icon-maskable-512.png',
  ...['slimelet','bubblo','puffling','sproutiball','rockro','frostbop','shadebub','groveling','tidalon','lumiorb','infernodon']
    .map((name,i)=>`./assets/monsters/${String(i+1).padStart(2,'0')}-${name}.webp`)
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  // GitHub Pages shares an origin with the owner's other projects. Leave their caches alone.
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k =>
    k !== CACHE && /^(monster-merge-|ball-merge-|tropic-merge-)/.test(k)
  ).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  // One versioned offline bundle prevents old HTML being combined with new artwork.
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: true});
    if (hit) return hit;
    try { return await fetch(req); }
    catch (err) { if (req.mode === 'navigate') return cache.match('./index.html'); throw err; }
  }));
});
