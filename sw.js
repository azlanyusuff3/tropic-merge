const CACHE='monster-merge-v19-0-sling-20261025-1';
const CORE=[
 './','./index.html','./merge.html','./sling.html','./manifest.webmanifest',
 './sling/style.css','./assets/fonts/fredoka-600.woff2','./assets/fonts/fredoka-700.woff2','./sling/menu.css','./sling/data.js','./sling/levels.js','./sling/physics.js','./sling/battle.js','./sling/enemies.js','./sling/art.js','./sling/renderer.js','./sling/app.js','./sling/pwa.js',
 './assets/tropical.webp','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png',
 ...['shellkin','clawbite','inkster','skybeak','prickfin','razorfin','inkbeard','stoneguard','ironclaw','voidraith','magmalord'].map((n,i)=>`./assets/enemies/${String(i+1).padStart(2,'0')}-${n}.webp`),
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
 // Installed older menus may still have this retired link open during an update.
 if(req.mode==='navigate'&&url.pathname===new URL('./care.html',self.registration.scope).pathname){event.respondWith(Response.redirect(new URL('./sling.html',self.registration.scope).href,302));return;}
 event.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req,{ignoreSearch:true});if(hit)return hit;try{return await fetch(req)}catch(err){if(req.mode==='navigate')return c.match('./index.html');throw err}}));
});
