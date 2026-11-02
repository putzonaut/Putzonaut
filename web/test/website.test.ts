import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {request} from 'node:http';
import {createWebsiteServer,websiteOrigin} from '../standalone/website.mjs';

const raw=(port:number,path:string,method='GET',headers:Record<string,string>={})=>new Promise<{status:number,headers:any,body:string}>((resolve,reject)=>{
 const req=request({hostname:'127.0.0.1',port,path,method,headers},res=>{let body='';res.on('data',b=>body+=b);res.on('end',()=>resolve({status:res.statusCode!,headers:res.headers,body}));});req.on('error',reject);req.end();
});
test('public website renders configured origins while isolating account, storage and service-worker routes',async t=>{
 const root=await mkdtemp(join(tmpdir(),'putzonaut-website-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const publicDirectory=join(root,'public');await mkdir(join(publicDirectory,'website-assets'),{recursive:true});
 for(const file of ['index.html','impressum.html','datenschutz.html'])await writeFile(join(publicDirectory,file),'<a href="__APP_ORIGIN__">App</a><link href="__SITE_ORIGIN__">');
 await writeFile(join(root,'secret.png'),'private');
 await symlink(join(root,'secret.png'),join(publicDirectory,'website-assets','escape.png'));
 await writeFile(join(publicDirectory,'website-assets','site.css'),'body{color:red}');
 await mkdir(join(publicDirectory,'website-assets','screens'));
 await writeFile(join(publicDirectory,'website-assets','screens','home.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
 const server=await createWebsiteServer({publicDirectory,appOrigin:'https://crew.example.test',siteOrigin:'https://example.test'});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise<void>(r=>server.close(()=>r())));
 const port=(server.address() as any).port;
 const page=await raw(port,'/');assert.equal(page.status,200);assert.match(page.body,/https:\/\/crew.example.test/);assert.ok(!page.body.includes('__APP_ORIGIN__'));assert.ok(!page.headers['set-cookie']);
 assert.match(page.headers['content-security-policy'],/frame-ancestors 'none'/);
 assert.ok(!page.headers['content-security-policy'].includes('unsafe-inline'));
 assert.ok(!page.headers['content-security-policy'].includes('data:'));
 assert.equal((await raw(port,'/', 'HEAD')).body,'');
 for(const path of ['/api/state','/api/account/get-session','/sw.js','/.env','/website-assets/escape.png','/website-assets/%2e%2e/secret.png'])assert.equal((await raw(port,path)).status,404,path);
 assert.equal((await raw(port,'/api/account/sign-up/email','POST')).status,405);
 assert.equal((await raw(port,'//attacker.test')).status,400);
 assert.equal((await raw(port,'/website-assets/%E0%A4')).status,400);
 assert.equal((await raw(port,'/website-assets/site.css')).status,200);
 const illustration=await raw(port,'/website-assets/screens/home.svg');
 assert.equal(illustration.status,200);assert.equal(illustration.headers['content-type'],'image/svg+xml');
 assert.match(illustration.headers['content-security-policy'],/font-src data:/);
 assert.match(illustration.headers['content-security-policy'],/style-src 'unsafe-inline'/);
 assert.match(illustration.headers['content-security-policy'],/default-src 'none'/);
 assert.match(illustration.headers['content-security-policy'],/sandbox/);
 assert.ok(!(await raw(port,'/website-assets/site.css')).headers['content-security-policy'].includes('unsafe-inline'));
 assert.match((await raw(port,'/app-qr.svg')).body,/<svg/);
 assert.equal((await raw(port,'/datenschutz/')).status,200);
 const redirect=await raw(port,'/impressum?source=nav','GET',{host:'www.example.test','x-forwarded-host':'attacker.test'});
 assert.equal(redirect.status,308);assert.equal(redirect.headers.location,'https://example.test/impressum?source=nav');
 assert.equal((await raw(port,'/','GET',{'x-forwarded-host':'www.example.test'})).status,200);
 assert.ok((await raw(port,'/sitemap.xml')).body.includes('https://example.test/'));
});
test('approved production pages keep app links configurable and legal/support navigation reachable',async t=>{
 const server=await createWebsiteServer({publicDirectory:resolve('website'),appOrigin:'https://crew.example.test',siteOrigin:'https://example.test'});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise<void>(r=>server.close(()=>r())));
 const port=(server.address() as any).port;
 for(const path of ['/','/impressum','/datenschutz']){
  const page=await raw(port,path);assert.equal(page.status,200,path);
  assert.ok(!page.body.includes('__APP_ORIGIN__'));assert.ok(!page.body.includes('__SITE_ORIGIN__'));
  assert.ok(page.body.includes(`rel="canonical" href="https://example.test${path}"`));
  assert.ok(page.body.includes('href="mailto:sos@putzonaut.de"'));assert.ok(page.body.includes('https://github.com/putzonaut/putzonaut/issues'));
  for(const [,href] of page.body.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g))if(!href.startsWith('/website-assets/'))assert.equal((await raw(port,href)).status,200,href);
 }
 const home=(await raw(port,'/')).body;
 for(const [,asset] of home.matchAll(/(?:href|src)="(\/website-assets\/[^"?]+\.(?:css|js)\?v=[a-f0-9]{16})"/g)){
  const response=await raw(port,asset);assert.equal(response.status,200,asset);
  assert.equal(response.headers['cache-control'],'public, max-age=3600');
 }
 assert.equal([...home.matchAll(/\.(?:css|js)\?v=[a-f0-9]{16}/g)].length,5);
 assert.ok(home.includes('href="https://crew.example.test"'));assert.ok(!home.includes('href="https://app.putzonaut.de"'));
 assert.ok(!/name="robots"[^>]*noindex/.test(home));
 const illustration=await readFile(resolve('website/website-assets/screens/home.svg'),'utf8');
 assert.ok(!/<script\b|\bon\w+=|(?:href|src)=["']https?:/i.test(illustration));
});
test('website updates bypass cached CSS and JS without clearing browser data',async t=>{
 const publicDirectory=await mkdtemp(join(tmpdir(),'putzonaut-cache-update-'));
 t.after(()=>rm(publicDirectory,{recursive:true,force:true}));
 await mkdir(join(publicDirectory,'website-assets'));
 for(const page of ['index.html','impressum.html','datenschutz.html'])await writeFile(join(publicDirectory,page),'<link rel="stylesheet" href="/website-assets/site.css"><script src="/website-assets/site.js" defer></script>');
 const cssFile=join(publicDirectory,'website-assets/site.css');
 const jsFile=join(publicDirectory,'website-assets/site.js');
 await writeFile(cssFile,'body{color:#103e43}');await writeFile(jsFile,'/* old behavior */');
 const start=async()=>{
  const server=await createWebsiteServer({publicDirectory,appOrigin:'https://app.example.test'});
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  t.after(()=>new Promise<void>(r=>server.close(()=>r())));
  return (server.address() as any).port;
 };
 const assetUrls=(html:string)=>[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]);
 const before=await start();
 const oldAssets=assetUrls((await raw(before,'/')).body);
 const browserCache=new Map(await Promise.all(oldAssets.map(async path=>[path,(await raw(before,path)).body] as const)));
 // Simulate the browser cache left by 0.22.0/0.22.1 as well as a versioned release.
 browserCache.set('/website-assets/site.css','body{color:#103e43}');
 browserCache.set('/website-assets/site.js','/* old behavior */');
 await writeFile(cssFile,'body{color:#f3f4fa}');await writeFile(jsFile,'/* new behavior */');
 const after=await start();const page=await raw(after,'/');
 assert.equal(page.headers['cache-control'],'no-cache');
 const newAssets=assetUrls(page.body);assert.equal(newAssets.length,2);
 assert.deepEqual(assetUrls((await raw(after,'/impressum')).body),newAssets);
 assert.deepEqual(assetUrls((await raw(after,'/datenschutz')).body),newAssets);
 for(const [index,path] of newAssets.entries()){
  assert.match(path,/\?v=[a-f0-9]{16}$/);assert.notEqual(path,oldAssets[index]);
  assert.ok(!browserCache.has(path),'The new page must not address an old cached asset.');
  const response=await raw(after,path);assert.equal(response.status,200);
  assert.equal(response.headers['cache-control'],'public, max-age=3600');
  assert.equal((await raw(after,path,'HEAD')).body,'');
  assert.match(response.body,index===0?/#f3f4fa/:/new behavior/);
  assert.equal((await raw(after,oldAssets[index])).headers['cache-control'],'no-cache');
  assert.equal((await raw(after,path.split('?')[0])).headers['cache-control'],'no-cache');
 }
 const unchanged=await start();assert.deepEqual(assetUrls((await raw(unchanged,'/')).body),newAssets);
});
test('public origin configuration accepts HTTPS and local development, rejects paths and credentials',()=>{
 assert.equal(websiteOrigin('https://app.example.test'),'https://app.example.test');
 assert.equal(websiteOrigin('http://localhost:3080'),'http://localhost:3080');
 for(const value of ['https://app.example.test/','https://user:pw@app.example.test','http://public.example.test','javascript:alert(1)'])assert.throws(()=>websiteOrigin(value));
});
