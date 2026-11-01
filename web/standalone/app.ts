import {DatabaseSync} from 'node:sqlite';
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {createAuth} from './auth.ts';
import {openDatabase} from './database.ts';
import {mailQueue} from './mail.ts';
import type {MailTransport} from './mail.ts';
import {photoStore} from './photos.ts';

const routes=new Map([
 ['/sign-up/email','POST'],['/sign-in/email','POST'],['/sign-out','POST'],
 ['/get-session','GET'],['/verify-email','GET'],['/send-verification-email','POST'],
 ['/request-password-reset','POST'],['/reset-password','POST'],
]);
const json=(error:string,status:number)=>Response.json({error},{status});
export async function createStandaloneApp(options:{directory:string;origin:string;secret:string;sendMail:MailTransport}){
 mkdirSync(options.directory,{recursive:true,mode:0o700});
 const {sqlite,db}=openDatabase(join(options.directory,'crew.sqlite'));
 const authDb=new DatabaseSync(join(options.directory,'accounts.sqlite'));
 authDb.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 const mail=mailQueue(authDb,options.secret,options.sendMail);
 const auth=await createAuth(authDb,options.origin,options.secret,mail.enqueue);
 const repo=new Repository(db),bucket=photoStore(join(options.directory,'photos'));
 async function route(request:Request){
  const path=new URL(request.url).pathname;
  if(new URL(request.url).origin!==options.origin)return json('Diese Adresse gehört nicht zu Putzonaut.',403);
  if(!['GET','HEAD'].includes(request.method)&&(request.headers.get('origin')!==options.origin||request.headers.get('sec-fetch-site')==='cross-site'))return json('Bitte öffne Putzonaut erneut.',403);
  // Sites service access does not exist on the independent server. Never expose its updater.
  if(path==='/api/push/dispatch')return json('Nicht verfügbar.',404);
  if(path.startsWith('/api/account/')){
   const action=path.slice('/api/account'.length);
   if(routes.get(action)!==request.method&&!(/^\/reset-password\/[^/]+$/.test(action)&&request.method==='GET'))return json('Diese Kontoaktion gibt es nicht.',404);
   return auth.handler(request);
  }
  // Only a verified, server-validated session creates an identity. Incoming identity headers
  // (including all ChatGPT headers) and client-selected profile IDs have no authority here.
  const sessionResponse=await auth.api.getSession({headers:request.headers,asResponse:true});
  const session=await sessionResponse.json() as {user?:{id:string;name:string;emailVerified:boolean}}|null;
  const identity=session?.user?.emailVerified?{userId:session.user.id,fullName:session.user.name}:null;
  const result=await handleApi(request,identity,repo,{origin:options.origin,bucket});
  for(const cookie of sessionResponse.headers.getSetCookie())result.headers.append('Set-Cookie',cookie);
  return result;
 }
 return {auth,repo,sqlite,authDb,flushMail:mail.flush,
  async fetch(request:Request){
   let result:Response;
   try{result=await route(request);}catch{console.error('Putzonaut: Anfrage fehlgeschlagen.');result=json('Das hat gerade nicht geklappt. Bitte versuche es erneut.',500);}
   const headers=new Headers(result.headers);
   headers.set('Cache-Control','private, no-store');headers.set('Vary','Cookie');
   headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
   return new Response(result.body,{status:result.status,headers});
  },
  async close(){await mail.flush();sqlite.close();authDb.close();},
 };
}
