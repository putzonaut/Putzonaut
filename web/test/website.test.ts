import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
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
 const server=await createWebsiteServer({publicDirectory,appOrigin:'https://crew.example.test',siteOrigin:'https://example.test'});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise<void>(r=>server.close(()=>r())));
 const port=(server.address() as any).port;
 const page=await raw(port,'/');assert.equal(page.status,200);assert.match(page.body,/https:\/\/crew.example.test/);assert.ok(!page.body.includes('__APP_ORIGIN__'));assert.ok(!page.headers['set-cookie']);
 assert.match(page.headers['content-security-policy'],/frame-ancestors 'none'/);
 assert.equal((await raw(port,'/', 'HEAD')).body,'');
 for(const path of ['/api/state','/api/account/get-session','/sw.js','/.env','/website-assets/escape.png','/website-assets/%2e%2e/secret.png'])assert.equal((await raw(port,path)).status,404,path);
 assert.equal((await raw(port,'/api/account/sign-up/email','POST')).status,405);
 assert.equal((await raw(port,'//attacker.test')).status,400);
 assert.equal((await raw(port,'/website-assets/%E0%A4')).status,400);
 assert.equal((await raw(port,'/website-assets/site.css')).status,200);
 assert.match((await raw(port,'/app-qr.svg')).body,/<svg/);
 assert.equal((await raw(port,'/datenschutz/')).status,200);
 const redirect=await raw(port,'/impressum?source=nav','GET',{host:'www.example.test','x-forwarded-host':'attacker.test'});
 assert.equal(redirect.status,308);assert.equal(redirect.headers.location,'https://example.test/impressum?source=nav');
 assert.equal((await raw(port,'/','GET',{'x-forwarded-host':'www.example.test'})).status,200);
 assert.ok((await raw(port,'/sitemap.xml')).body.includes('https://example.test/'));
});
test('public origin configuration accepts HTTPS and local development, rejects paths and credentials',()=>{
 assert.equal(websiteOrigin('https://app.example.test'),'https://app.example.test');
 assert.equal(websiteOrigin('http://localhost:3080'),'http://localhost:3080');
 for(const value of ['https://app.example.test/','https://user:pw@app.example.test','http://public.example.test','javascript:alert(1)'])assert.throws(()=>websiteOrigin(value));
});
