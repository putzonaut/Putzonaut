import {resolve} from 'node:path';
import {createStandaloneApp} from './app.ts';
import {createHttpServer} from './http.ts';
import {smtpTransport} from './mail.ts';

process.umask(0o077);
const origin=process.env.APP_ORIGIN,secret=process.env.BETTER_AUTH_SECRET;
if(!origin||!secret)throw new Error('APP_ORIGIN and BETTER_AUTH_SECRET are required. See standalone/README.md.');
const app=await createStandaloneApp({directory:resolve(process.env.DATA_DIR??'data'),origin,secret,sendMail:smtpTransport(process.env)});
const server=createHttpServer(app,{origin,publicDirectory:resolve('dist/standalone'),trustedProxies:(process.env.TRUSTED_PROXY_IPS??'').split(',').map(s=>s.trim()).filter(Boolean)});
const port=Number(process.env.PORT??3080);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
server.listen(port,process.env.HOST??'127.0.0.1',()=>console.log(`Putzonaut läuft auf Port ${port}.`));
const mailTimer=setInterval(()=>{void app.flushMail();},5000);mailTimer.unref();
void app.flushMail();
let stopping=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
 if(stopping)return;stopping=true;clearInterval(mailTimer);
 server.close(()=>{void app.close().then(()=>process.exit(0));});
});
