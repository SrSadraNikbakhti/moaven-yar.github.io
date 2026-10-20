const V='moaven-v22';
const FILES=['./','index.html','sabt.mp3','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','logo.png','logo-white.png','icon-maskable-192.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  const isPage=r.mode==='navigate'||/(^|\/)(index\.html)?$/.test(new URL(r.url).pathname);
  if(isPage){
    /* صفحه اصلی: اول از اینترنت (همیشه نسخه جدید)، اگر نبود از کش */
    e.respondWith(fetch(r).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}
      return res;
    }).catch(async()=>(await caches.match(r,{ignoreSearch:true}))||(await caches.match('index.html'))||Response.error()));
    return;
  }
  e.respondWith((async()=>{
    const hit=await caches.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}
      return res;
    }).catch(()=>null);
    e.waitUntil(net);
    if(hit)return hit;
    const res=await net;
    return res||(await caches.match('index.html'))||Response.error();
  })());
});
