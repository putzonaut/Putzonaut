import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const origin='https://putzonaut-test.denny-subke.chatgpt.site';
async function harness(){
 const handlers:Record<string,(event:any)=>void>={},stored=new Map<string,Response>();let network:(r:any)=>Promise<Response>=async()=>new Response('network');
 const cache={match:async(r:any)=>stored.get(typeof r==='string'?r:new URL(r.url).pathname)?.clone(),put:async(r:any,v:Response)=>{stored.set(typeof r==='string'?r:new URL(r.url).pathname,v.clone());},keys:async()=>[...stored.keys()],addAll:async(files:string[])=>{for(const f of files)stored.set(f,new Response('static '+f));}};
 const names=['putzonaut-static-0.12.0','other-app-cache'];const deleted:string[]=[];let claimed=false;
 const context={URL,Response,fetch:(r:any)=>network(r),caches:{open:async()=>cache,keys:async()=>names,delete:async(n:string)=>{deleted.push(n);return true;}},self:{location:{origin},addEventListener:(name:string,fn:any)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{claimed=true;}}}};
 vm.runInNewContext(await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),context);
 return {stored,deleted,get claimed(){return claimed;},network:(fn:typeof network)=>network=fn,
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
 h.network(async path=>path==='/offline-assets.json'?Response.json({version:'0.13.0',files:['/offline/index.html','/assets/offline-main-123.js','/api/state','https://example.com/private']}):new Response('static',{headers:{'content-type':path==='/offline/index.html'?'text/html':'text/javascript'}}));await h.lifecycle('install');assert.ok(h.stored.has('/offline/index.html'));assert.equal(h.stored.has('/api/state'),false);
 const blocked=await harness();blocked.network(async path=>path==='/offline-assets.json'?Response.json({version:'0.13.0',files:['/offline/index.html','/assets/offline-main-123.js']}):new Response('sign in',{headers:{'content-type':'text/html'}}));await assert.rejects(blocked.lifecycle('install'));assert.equal(blocked.stored.size,0);
 await h.lifecycle('activate');assert.deepEqual(h.deleted,['putzonaut-static-0.12.0']);assert.equal(h.claimed,true);
});
