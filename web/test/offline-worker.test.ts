import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const origin='https://putzonaut-test.denny-subke.chatgpt.site';
async function harness(){
 const handlers:Record<string,(event:any)=>void>={},stored=new Map<string,Response>();let network:(r:any)=>Promise<Response>=async()=>new Response('network');
 const cache={match:async(r:any)=>stored.get(typeof r==='string'?r:new URL(r.url).pathname)?.clone(),put:async(r:any,v:Response)=>{stored.set(typeof r==='string'?r:new URL(r.url).pathname,v.clone());},keys:async()=>[...stored.keys()],addAll:async(files:string[])=>{for(const f of files)stored.set(f,new Response('static '+f));}};
 const names=['putzonaut-static-0.12.0','other-app-cache'],previous=new Map<string,Response>();const deleted:string[]=[];let claimed=false,skipped=false;let clients:{url:string}[]=[];
 const context={URL,Response,fetch:(r:any)=>network(r),caches:{open:async(name:string)=>name==='putzonaut-static-0.12.0'?{match:async(r:any)=>previous.get(typeof r==='string'?r:new URL(r.url).pathname)?.clone()}:cache,keys:async()=>names,delete:async(n:string)=>{deleted.push(n);return true;}},self:{location:{origin},addEventListener:(name:string,fn:any)=>handlers[name]=fn,skipWaiting:async()=>{skipped=true;},registration:{showNotification:async(title:string,options:unknown)=>{stored.set('notification',Response.json({title,options}));}},clients:{claim:async()=>{claimed=true;},matchAll:async()=>clients,openWindow:async()=>{}}}};
 vm.runInNewContext(await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),context);
 return {stored,previous,deleted,get skipped(){return skipped;},setClients:(items:{url:string}[])=>clients=items,
  async message(data:unknown,url=origin){let work:Promise<unknown>|undefined;let reply:unknown;handlers.message({data,source:{url},ports:[{postMessage:(data:unknown)=>reply=data}],waitUntil:(p:Promise<unknown>)=>work=p});await work;return reply;},get claimed(){return claimed;},network:(fn:typeof network)=>network=fn,
  async lifecycle(name:string){let work:Promise<unknown>|undefined;handlers[name]({waitUntil:(p:Promise<unknown>)=>work=p});await work;},
  async request(path:string,mode='cors',method='GET'){let response:Promise<Response>|undefined;handlers.fetch({request:{url:origin+path,mode,method},respondWith:(p:Promise<Response>)=>response=p});return response?await response:null;}};
}
test('offline shell fallback is limited to failed root navigation, never authenticated API or sign-in pages',async()=>{
 const h=await harness();h.stored.set('/offline/index.html',new Response('generic shell'));h.network(async()=>{throw new TypeError('offline');});
 assert.equal(await (await h.request('/','navigate'))?.text(),'generic shell');assert.equal(await h.request('/api/state'),null);assert.equal(await h.request('/api/tasks/1/complete','cors','POST'),null);assert.equal(await h.request('/signout-with-chatgpt','navigate'),null);
 h.network(async()=>new Response('sign in',{status:401}));assert.equal((await h.request('/','navigate'))?.status,401);
 h.network(async()=>new Response('unavailable',{status:503}));assert.equal((await h.request('/','navigate'))?.status,503);
});
test('static cache accepts only assets and never stores redirected sign-in responses',async()=>{
 const h=await harness();h.network(async()=>new Response('image',{headers:{'Content-Type':'image/webp'}}));assert.equal(await (await h.request('/art/hero-home.webp'))?.text(),'image');assert.ok(h.stored.has('/art/hero-home.webp'));
 h.network(async()=>new Response('login',{headers:{'Content-Type':'text/html'}}));await h.request('/assets/unknown.js');assert.equal(h.stored.has('/assets/unknown.js'),false);
 const redirected=new Response('redirect',{headers:{'Content-Type':'text/javascript'}});Object.defineProperty(redirected,'redirected',{value:true});h.network(async()=>redirected);await h.request('/assets/login.js');assert.equal(h.stored.has('/assets/login.js'),false);
});
test('worker install rejects a mismatched release and activation removes only Putzonaut caches',async()=>{
 const h=await harness();h.network(async()=>Response.json({version:'old',files:['/offline/index.html']}));await assert.rejects(h.lifecycle('install'));
 h.network(async path=>path==='/offline-assets.json'?Response.json({version:'__APP_VERSION__',files:['/offline/index.html','/assets/offline-main-123.js','/api/state','https://example.com/private']}):new Response('static',{headers:{'content-type':path==='/offline/index.html'?'text/html':'text/javascript'}}));await h.lifecycle('install');assert.equal(h.skipped,false);assert.ok(h.stored.has('/offline/index.html'));assert.equal(h.stored.has('/api/state'),false);
 const blocked=await harness();blocked.network(async path=>path==='/offline-assets.json'?Response.json({version:'__APP_VERSION__',files:['/offline/index.html','/assets/offline-main-123.js']}):new Response('sign in',{headers:{'content-type':'text/html'}}));await assert.rejects(blocked.lifecycle('install'));assert.equal(blocked.stored.size,0);
 await h.lifecycle('activate');assert.deepEqual(h.deleted,['putzonaut-static-0.12.0']);assert.equal(h.claimed,true);
});

test('payloadless push immediately displays a generic notification without fetching private data',async()=>{const h=await harness();h.network(async()=>{throw new Error('must not fetch');});await h.lifecycle('push');const notice=await h.stored.get('notification')!.json() as {title:string;options:{tag:string;data:{url:string}}};assert.equal(notice.title,'Putzonaut');assert.equal(notice.options.tag,'putzonaut-daily');assert.equal(notice.options.data.url,'/');});

test('worker updates activate only after an explicit same-origin request for that release',async()=>{
 const h=await harness();assert.equal(h.skipped,false);assert.deepEqual(JSON.parse(JSON.stringify(await h.message({type:'PUTZONAUT_VERSION'}))),{version:'__APP_VERSION__'});
 await h.message({type:'PUTZONAUT_ACTIVATE',version:'wrong'});assert.equal(h.skipped,false);
 await h.message({type:'PUTZONAUT_ACTIVATE',version:'__APP_VERSION__'},'https://other.example/');assert.equal(h.skipped,false);
 await h.message({type:'PUTZONAUT_ACTIVATE',version:'__APP_VERSION__'});assert.equal(h.skipped,true);
});
test('accepting an update preserves caches while any tab remains open',async()=>{
 const h=await harness();h.setClients([{url:origin+'/'},{url:origin+'/'}]);await h.lifecycle('activate');assert.deepEqual(h.deleted,[]);assert.equal(h.claimed,true);
});
test('an older tab can still load its cached hashed chunks after another tab accepts an update',async()=>{
 const h=await harness();h.previous.set('/assets/old-hash.js',new Response('old chunk'));h.network(async()=>{throw new Error('old asset no longer deployed');});
 assert.equal(await (await h.request('/assets/old-hash.js'))?.text(),'old chunk');assert.equal(h.stored.has('/assets/old-hash.js'),false);
 assert.equal(await h.request('/version.json'),null);
});
