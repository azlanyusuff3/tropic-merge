const CACHE='monster-island-v18-10-merge-back-nav-20261026';
const CORE=[
 './','./index.html','./merge.html','./match.html','./manifest.webmanifest',
 './match/style.css','./match/effects.css','./match/app.js','./match/engine.mjs','./match/effects.mjs','./match/life.mjs','./match/life.css','./match/faces.mjs','./match/face-rig.mjs','./match/assets/tidalon-match.webp','./match/assets/frostbop-match.webp',
 './assets/fonts/fredoka-600.woff2','./assets/fonts/fredoka-700.woff2',
 './sling/menu.css','./sling/pwa.js',
 './assets/tropical.webp','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png',
 ...['slimelet','bubblo','puffling','sproutiball','rockro','frostbop','shadebub','groveling','tidalon','lumiorb','infernodon'].map((n,i)=>`./assets/monsters/${String(i+1).padStart(2,'0')}-${n}.webp`),
 // Monster Match living faces: bare sprite + eye/mouth patches per monster.
 ...['slimelet','tidalon','puffling','sproutiball','rockro','frostbop','bubblo','shadebub','groveling','lumiorb','infernodon'].flatMap(n=>['','-e0','-e1','-m'].map(s=>`./match/faces/${n}${s}.webp`))
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Cache names alone are insufficient on a shared Pages origin. Check every URL's scope, too.
 for(const name of await caches.keys())if(name!==CACHE&&/^(monster-island-|monster-merge-|ball-merge-|tropic-merge-)/.test(name)){
  const c=await caches.open(name),keys=await c.keys();
  if(keys.length&&keys.every(r=>r.url.startsWith(self.registration.scope)))await caches.delete(name);
 }
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 // Installed older menus may still have this retired link open during an update.
 if(req.mode==='navigate'&&url.pathname===new URL('./care.html',self.registration.scope).pathname){event.respondWith(Response.redirect(new URL('./index.html',self.registration.scope).href,302));return;}
 event.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req,{ignoreSearch:true});if(hit)return hit;try{return await fetch(req)}catch(err){if(req.mode==='navigate')return c.match('./index.html');throw err}}));
});
