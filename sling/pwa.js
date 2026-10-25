// Offline support for the island menu and Monster Sling. When an update activates, pages that are
// not in the middle of a level reload once so players get the new version without clearing data.
if('serviceWorker'in navigator){
 const hadController=!!navigator.serviceWorker.controller;let reloaded=false,pending=false;
 const safeReload=()=>{if(reloaded)return;if(document.body.classList.contains('in-level')){pending=true;return}reloaded=true;location.reload()};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)safeReload()});
 addEventListener('hashchange',()=>{if(pending)setTimeout(safeReload,50)});
 addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(async r=>{await navigator.serviceWorker.ready;const el=document.querySelector('#offline-status');if(el)el.textContent='Ready for offline adventures · Progress saves on this device';document.addEventListener('visibilitychange',()=>{if(!document.hidden)r.update().catch(()=>{})})}).catch(()=>{const el=document.querySelector('#offline-status');if(el)el.textContent='Offline download pending. Reopen while connected.'}));
}
