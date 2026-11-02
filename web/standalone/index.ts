import {resolve} from 'node:path';
import {createStandaloneApp} from './app.ts';
import {createHttpServer} from './http.ts';
import {smtpTransport} from './mail.ts';
import {createWebsiteServer} from './website.mjs';

process.umask(0o077);
const origin=process.env.APP_ORIGIN,secret=process.env.BETTER_AUTH_SECRET;
if(!origin||!secret)throw new Error('APP_ORIGIN and BETTER_AUTH_SECRET are required. See standalone/README.md.');
const app=await createStandaloneApp({directory:resolve(process.env.DATA_DIR??'data'),origin,secret,sendMail:smtpTransport(process.env)});
const server=createHttpServer(app,{origin,publicDirectory:resolve('dist/standalone'),websiteOrigin:process.env.WEBSITE_ORIGIN,trustedProxies:(process.env.TRUSTED_PROXY_IPS??'').split(',').map(s=>s.trim()).filter(Boolean)});
const port=Number(process.env.PORT??3080),websitePort=Number(process.env.WEBSITE_PORT??3081);
if(![port,websitePort].every(p=>Number.isInteger(p)&&p>0&&p<=65535)||port===websitePort)throw new Error('Invalid PORT or WEBSITE_PORT');
const website=await createWebsiteServer({publicDirectory:resolve('dist/website'),appOrigin:origin,siteOrigin:process.env.WEBSITE_ORIGIN??'https://putzonaut.de'});
for(const [listener,listenerPort] of [[server,port],[website,websitePort]] as const){
 await new Promise<void>((resolve,reject)=>{listener.once('error',reject);listener.listen(listenerPort,process.env.HOST??'127.0.0.1',resolve);});
}
console.log(`Putzonaut App: ${port}; Website: ${websitePort}.`);
const mailTimer=setInterval(()=>{void app.flushMail();},5000);mailTimer.unref();
void app.flushMail();
let stopping=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
 if(stopping)return;stopping=true;clearInterval(mailTimer);
 void Promise.all([server,website].map(listener=>new Promise<void>((resolve,reject)=>listener.close(error=>error?reject(error):resolve())))).then(()=>app.close()).then(()=>process.exit(0));
});
