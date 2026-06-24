const CACHE_VER='scholr-v2',ASSET_CACHE=`${CACHE_VER}-assets`,PRECACHE=['/icon-192.png','/icon-512.png','/manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(ASSET_CACHE).then(c=>c.addAll(PRECACHE).catch(()=>{})));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==ASSET_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const{request}=event,url=new URL(request.url);
  if(request.method!=='GET')return;
  if(url.pathname.startsWith('/api/'))return;
  // NEVER cache HTML — this is what causes nav to break
  if(request.headers.get('accept')?.includes('text/html')){
    event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match('/offline')||new Response('Offline',{status:503})));return;
  }
  if(url.pathname.startsWith('/_next/static/')||url.pathname.match(/\.(png|jpg|ico|woff2?)$/)){
    event.respondWith(caches.match(request).then(c=>c||fetch(request).then(r=>{if(r.ok){const cl=r.clone();caches.open(ASSET_CACHE).then(ch=>ch.put(request,cl));}return r;})));return;
  }
});
self.addEventListener('push',e=>{if(!e.data)return;const d=e.data.json();e.waitUntil(self.registration.showNotification(d.title||'Scholr',{body:d.body,icon:'/icon-192.png',badge:'/icon-72.png',data:d}));});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data?.url||'/dashboard'));});
