const CACHE='monster-merge-v15-0-care-20261025-2';
const CORE=[
 './','./index.html','./merge.html','./care.html','./manifest.webmanifest',
 './care/style.css','./care/model.js','./care/art.js','./care/renderer.js','./care/minigames.js','./care/app.js','./care/pwa.js','./care/room.svg',
 './assets/tropical.webp','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png',
 ...['slimelet','bubblo','puffling','sproutiball','rockro','frostbop','shadebub','groveling','tidalon','lumiorb','infernodon'].map((n,i)=>`./assets/monsters/${String(i+1).padStart(2,'0')}-${n}.webp`)
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Cache names alone are insufficient on a shared Pages origin. Check every URL's scope, too.
 for(const name of await caches.keys())if(name!==CACHE&&/^(monster-merge-|ball-merge-|tropic-merge-)/.test(name)){
  const c=await caches.open(name),keys=await c.keys();
  if(keys.length&&keys.every(r=>r.url.startsWith(self.registration.scope)))await caches.delete(name);
 }
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req,{ignoreSearch:true});if(hit)return hit;try{return await fetch(req)}catch(err){if(req.mode==='navigate')return c.match('./index.html');throw err}}));
});
