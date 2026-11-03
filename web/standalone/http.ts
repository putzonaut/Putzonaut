import {createServer} from 'node:http';
import type {IncomingMessage} from 'node:http';
import {isIP} from 'node:net';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {BACKUP_MAX_BYTES} from '../shared/backup.ts';

export function clientAddress(request:IncomingMessage,trustedProxies:string[]){
 const peer=request.socket.remoteAddress??'127.0.0.1';
 const forwarded=request.headers['x-real-ip'];
 return trustedProxies.includes(peer)&&typeof forwarded==='string'&&isIP(forwarded)?forwarded:peer;
}
const mime:Record<string,string>={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png',webp:'image/webp',woff:'font/woff',woff2:'font/woff2'};
const pages=new Set(['/','/konto/anmelden','/konto/registrieren','/konto/passwort-vergessen','/konto/passwort-neu','/konto/bestaetigt','/konto/verwalten','/konto/email-bestaetigt','/konto/geloescht']);
export function createHttpServer(app:{fetch(request:Request):Promise<Response>},options:{origin:string;publicDirectory:string;trustedProxies?:string[];websiteOrigin?:string}){
 const root=resolve(options.publicDirectory);
 return createServer({requestTimeout:30_000,headersTimeout:15_000,maxHeaderSize:16_384},async(req,res)=>{
  try{
   const target=req.url??'/';
   if(!target.startsWith('/')||target.startsWith('//')||target.includes('\\')){res.writeHead(400);res.end();return;}
   const url=new URL(target,options.origin);
   let response:Response;
   if(url.pathname.startsWith('/api/')){
    const limit=url.pathname.startsWith('/api/account/')?16_384:BACKUP_MAX_BYTES+4096;
    const chunks:Buffer[]=[];let length=0;
    for await(const chunk of req){length+=chunk.length;if(length>limit){res.writeHead(413,{'Cache-Control':'no-store'});res.end();return;}chunks.push(chunk);}
    const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
    // Never trust caller-supplied identity, host, protocol or proxy headers.
    for(const key of [...headers.keys()])if(key.startsWith('oai-')||key.startsWith('x-forwarded-')||['forwarded','x-real-ip','x-putzonaut-client-ip','host'].includes(key))headers.delete(key);
    headers.set('x-putzonaut-client-ip',clientAddress(req,options.trustedProxies??[]));
    const method=req.method??'GET';
    response=await app.fetch(new Request(url,{method,headers,...(!['GET','HEAD'].includes(method)&&length?{body:Buffer.concat(chunks)}:{})}));
   }else if(!['GET','HEAD'].includes(req.method??''))response=new Response(null,{status:405});
   else if(['/impressum','/datenschutz'].includes(url.pathname))response=new Response(null,{status:302,headers:{Location:new URL(url.pathname,options.websiteOrigin??'https://putzonaut.de').href}});
   else{
    const path=decodeURIComponent(url.pathname),relative=pages.has(path)?'index.html':path.slice(1);
    const file=resolve(root,relative);
    if(!file.startsWith(root+sep)||relative.split('/').some(p=>p.startsWith('.')))response=new Response(null,{status:404});
    else{
     try{
      const data=await readFile(file);const extension=file.split('.').pop()!;
      response=new Response(data,{headers:{'Content-Type':mime[extension]??'application/octet-stream','Cache-Control':relative.startsWith('assets/')?'public, max-age=31536000, immutable':'no-cache'}});
     }catch(error){if(!['ENOENT','EISDIR'].includes((error as NodeJS.ErrnoException).code??''))throw error;response=new Response(null,{status:404});}
    }
   }
   const headers=new Headers(response.headers);
   headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
   headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
   headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
   if(options.origin.startsWith('https:'))headers.set('Strict-Transport-Security','max-age=31536000');
   for(const [key,value] of headers)if(key!=='set-cookie')res.setHeader(key,value);
   if(headers.getSetCookie().length)res.setHeader('Set-Cookie',headers.getSetCookie());
   res.statusCode=response.status;res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
  }catch{if(!res.headersSent)res.writeHead(500,{'Cache-Control':'no-store'});res.end('Putzonaut ist gerade nicht erreichbar.');}
 });
}
