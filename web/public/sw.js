/* Cache only the generic shell and static assets; never API or identity responses. */
const CACHE='putzonaut-static-0.13.0';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/offline-assets.json',{cache:'no-store'});if(!response.ok||response.redirected)throw new Error('Offline manifest unavailable');
 const manifest=await response.json();if(manifest.version!=='0.13.0'||!Array.isArray(manifest.files))throw new Error('Offline version mismatch');
 const files=manifest.files.filter(p=>p==='/offline/index.html'||/^\/assets\/offline-[\w./-]+$/.test(p));
 if(!files.includes('/offline/index.html'))throw new Error('Offline shell missing');
 const responses=await Promise.all(files.map(async path=>{const asset=await fetch(path,{cache:'reload'});if(!asset.ok||asset.redirected||path!=='/offline/index.html'&&(asset.headers.get('content-type')??'').includes('text/html'))throw new Error('Offline asset unavailable');return asset;}));
 const cache=await caches.open(CACHE);await Promise.all(files.map((path,i)=>cache.put(path,responses[i])));await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('putzonaut-static-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&url.pathname==='/'){
  event.respondWith(fetch(request).catch(async()=>{const cached=await (await caches.open(CACHE)).match('/offline/index.html');return cached??Response.error();}));return;
 }
 if(!/^\/(assets|art|icons)\//.test(url.pathname)&&url.pathname!=='/offline/index.html')return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok&&!response.redirected&&/^(image\/|font\/|text\/css|text\/javascript|application\/javascript)/i.test(response.headers.get('content-type')??'')){if((await cache.keys()).length<180)await cache.put(request,response.clone());}return response;})());
});
