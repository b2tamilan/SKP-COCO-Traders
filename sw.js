// SKP COCO Traders - offline cache. Keep next to index.html (same folder).
// Bump V on every release so old caches are removed.
const V='skp-coco-v5',FONTS='skp-coco-fonts-v1',CORE=['./','./index.html'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==FONTS).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  // Google Fonts (Tamil fonts offline): stale-while-revalidate
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(c=>c.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>m);
      return m||net})));
    return}
  if(u.origin!==location.origin||u.pathname.endsWith('/sw.js'))return; // never cache sw.js, Firebase or other origins
  const store=res=>{if(res&&res.ok&&res.type==='basic'){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res};
  if(r.mode==='navigate'){ // page: network first (always latest), cache fallback offline
    e.respondWith(fetch(r).then(store).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html')||caches.match('./'))));
    return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>{const net=fetch(r).then(store).catch(()=>m);return m||net}));
});
