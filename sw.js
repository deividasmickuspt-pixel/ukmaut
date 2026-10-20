// Ukmergės autobusai – veikimas be interneto.
// Puslapis: pirmiausia iš interneto (kad visada būtų naujausi tvarkaraščiai), be ryšio – išsaugota kopija.
// Ikonos ir žemėlapio biblioteka: iš išsaugotų kopijų. Žemėlapio plytelės nesaugomos (be ryšio rodomas įmontuotas gatvių pagrindas).
const CACHE='ukmaut-v1';
const LEAFLET=['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js','https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'];
const CORE=['/','/favicon.svg','/manifest.webmanifest','/icons/icon-192.png','/icons/apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all([...CORE,...LEAFLET].map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{ if(res.ok){const cp=res.clone(); caches.open(CACHE).then(c=>c.put('/',cp));} return res; })
      .catch(()=>caches.match('/').then(r=>r||Response.error())));
    return;
  }
  const own=url.origin===location.origin&&!url.pathname.startsWith('/_vercel/');
  if(own||LEAFLET.includes(req.url)){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(res=>{ if(res.ok){const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp));} return res; });
      return hit||net;
    }));
  }
});
