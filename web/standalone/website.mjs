import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import QRCode from 'qrcode';

const mime={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function websiteOrigin(value) {
  const url=new URL(value);
  const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.origin!==value||url.username||url.password||!(url.protocol==='https:'||(loopback&&url.protocol==='http:')))throw new Error('A canonical HTTPS origin is required.');
  return url.origin;
}

/** A separate, read-only HTTP surface: no account routes, cookies or app storage. */
export async function createWebsiteServer({publicDirectory,appOrigin,siteOrigin='https://putzonaut.de'}) {
  appOrigin=websiteOrigin(appOrigin);siteOrigin=websiteOrigin(siteOrigin);
  const root=await realpath(resolve(publicDirectory));
  const qr=await QRCode.toString(appOrigin,{type:'svg',errorCorrectionLevel:'M',margin:4,width:208,color:{dark:'#103e43ff',light:'#ffffffff'}});
  const pages=new Map([['/','index.html'],['/impressum','impressum.html'],['/datenschutz','datenschutz.html']]);
  const documents=new Map(await Promise.all([...pages].map(async([path,file])=>[path,(await readFile(resolve(root,file),'utf8')).replaceAll('__APP_ORIGIN__',escape(appOrigin)).replaceAll('__SITE_ORIGIN__',escape(siteOrigin))])));
  return createServer({requestTimeout:15000,headersTimeout:10000,maxHeaderSize:16384},async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    res.setHeader('Cache-Control','no-cache');
    if(siteOrigin.startsWith('https:'))res.setHeader('Strict-Transport-Security','max-age=31536000');
    const send=(status,type,body)=>{res.writeHead(status,{'Content-Type':type});res.end(req.method==='HEAD'?undefined:body);};
    try {
      if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');send(405,'text/plain; charset=utf-8','Nur Lesen ist erlaubt.');return;}
      const target=req.url??'/';
      if(!target.startsWith('/')||target.startsWith('//')||target.includes('\\')){send(400,'text/plain','Bad request');return;}
      const url=new URL(target,siteOrigin),path=decodeURIComponent(url.pathname);
      if(path.includes('\0')||path.includes('\\')){send(400,'text/plain','Bad request');return;}
      const canonical=new URL(siteOrigin);
      if(!canonical.hostname.startsWith('www.')&&req.headers.host?.toLowerCase()==='www.'+canonical.host){
        res.writeHead(308,{Location:new URL(url.pathname+url.search,siteOrigin).href});res.end();return;
      }
      if(path==='/healthz'){send(200,'application/json','{"status":"ok","surface":"website"}');return;}
      if(path==='/app-qr.svg'){res.setHeader('Cache-Control','public, max-age=300');send(200,'image/svg+xml',qr);return;}
      if(path==='/robots.txt'){send(200,'text/plain; charset=utf-8',`User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`);return;}
      if(path==='/sitemap.xml'){send(200,'application/xml; charset=utf-8',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(siteOrigin)}/</loc></url></urlset>`);return;}
      const normalized=path.length>1?path.replace(/\/$/,''):path;
      if(documents.has(normalized)){send(200,'text/html; charset=utf-8',documents.get(normalized));return;}
      if(!path.startsWith('/website-assets/')||path.split('/').some(part=>part.startsWith('.'))){send(404,'text/plain; charset=utf-8','Diese Seite gibt es nicht.');return;}
      const file=await realpath(resolve(root,path.slice(1)));
      const extension=file.slice(file.lastIndexOf('.'));
      if(!file.startsWith(root+sep)||!mime[extension]){send(404,'text/plain','Not found');return;}
      // The self-contained app illustration embeds its fonts and artwork.
      // This image-only policy never applies to HTML pages or JavaScript.
      if(path==='/website-assets/screens/home.svg')res.setHeader('Content-Security-Policy',"default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; sandbox");
      const bytes=await readFile(file);res.setHeader('Cache-Control','public, max-age=3600');send(200,mime[extension],bytes);
    }catch(error){send(error instanceof URIError?400:404,'text/plain; charset=utf-8','Diese Seite gibt es nicht.');}
  });
}
