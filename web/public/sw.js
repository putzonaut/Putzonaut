/* Cache only the generic shell and static assets; never API or identity responses. */
const VERSION='__APP_VERSION__';
const CACHE='putzonaut-static-'+VERSION+'-__BUILD_ID__';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/offline-assets.json',{cache:'no-store'});if(!response.ok||response.redirected)throw new Error('Offline manifest unavailable');
 const manifest=await response.json();if(manifest.version!=='__APP_VERSION__'||!Array.isArray(manifest.files))throw new Error('Offline version mismatch');
 const files=manifest.files.filter(p=>p==='/offline/index.html'||/^\/assets\/(?:offline-|putzonaut-)[\w./-]+$/.test(p));
 if(!files.includes('/offline/index.html'))throw new Error('Offline shell missing');
 const responses=await Promise.all(files.map(async path=>{const asset=await fetch(path,{cache:'reload'});if(!asset.ok||asset.redirected||path!=='/offline/index.html'&&(asset.headers.get('content-type')??'').includes('text/html'))throw new Error('Offline asset unavailable');return asset;}));
 const cache=await caches.open(CACHE);await Promise.all(files.map((path,i)=>cache.put(path,responses[i])));
})()));
// Preserve cached chunks for other open tabs; only the tab accepting the update reloads.
self.addEventListener('activate',event=>event.waitUntil((async()=>{const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});if(!tabs.length)for(const name of await caches.keys())if(name.startsWith('putzonaut-static-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('message',event=>{
 if(!event.source?.url||new URL(event.source.url).origin!==self.location.origin)return;
 if(event.data?.type==='PUTZONAUT_VERSION')event.ports?.[0]?.postMessage({version:VERSION});
 if(event.data?.type==='PUTZONAUT_ACTIVATE'&&event.data.version===VERSION)event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&url.pathname==='/'){
  event.respondWith(fetch(request).catch(async()=>{const cached=await (await caches.open(CACHE)).match('/offline/index.html');return cached??Response.error();}));return;
 }
 if(!/^\/(assets|art|icons)\//.test(url.pathname)&&url.pathname!=='/offline/index.html')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(request);if(cached)return cached;if(url.pathname.startsWith('/assets/'))for(const name of await caches.keys()){if(name.startsWith('putzonaut-static-')&&name!==CACHE){const old=await (await caches.open(name)).match(request);if(old)return old;}}const response=await fetch(request);if(response.ok&&!response.redirected&&/^(image\/|font\/|text\/css|text\/javascript|application\/javascript)/i.test(response.headers.get('content-type')??'')){if((await cache.keys()).length<180)await cache.put(request,response.clone());}return response;})());
});

// A push carries no personal content. Browsers require a visible notification.
self.addEventListener('push',event=>event.waitUntil(self.registration.showNotification('Putzonaut',{body:'Zeit für einen kleinen Einsatz? In eurer Crew ist noch etwas offen.',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:'putzonaut-daily',data:{url:'/'}})));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});const existing=tabs.find(c=>new URL(c.url).origin===self.location.origin);if(existing)return existing.focus();return self.clients.openWindow('/');})());});
