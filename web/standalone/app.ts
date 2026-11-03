import {DatabaseSync} from 'node:sqlite';
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {handleApi} from '../server/api.ts';
import {Repository} from '../server/repository.ts';
import {createAuth} from './auth.ts';
import {openDatabase} from './database.ts';
import {mailQueue} from './mail.ts';
import type {MailTransport} from './mail.ts';
import {photoStore} from './photos.ts';
import {APIError} from 'better-auth/api';
import {standalonePushConfig,startPushScheduler} from './push.ts';
import {sendPush} from '../server/push.ts';
import type {Household} from '../server/domain.ts';

const routes=new Map([
 ['/sign-up/email','POST'],['/sign-in/email','POST'],['/sign-out','POST'],
 ['/get-session','GET'],['/verify-email','GET'],['/send-verification-email','POST'],
 ['/request-password-reset','POST'],['/reset-password','POST'],
 ['/change-email','POST'],['/delete-user','POST'],
]);
const json=(error:string,status:number)=>Response.json({error},{status});
export async function createStandaloneApp(options:{directory:string;origin:string;secret:string;sendMail:MailTransport;scheduleReminders?:boolean}){
 mkdirSync(options.directory,{recursive:true,mode:0o700});
 const {sqlite,db}=openDatabase(join(options.directory,'crew.sqlite'));
 const authDb=new DatabaseSync(join(options.directory,'accounts.sqlite'));
 authDb.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 const mail=mailQueue(authDb,options.secret,options.sendMail);
 const repo=new Repository(db),bucket=photoStore(join(options.directory,'photos'));
 const push=standalonePushConfig(sqlite,options.origin);
 const auth=await createAuth(authDb,options.origin,options.secret,mail.enqueue,{
  async beforeDelete(user){
   if(await repo.forAccount(user.id))throw new APIError('CONFLICT',{code:'CREW_MEMBERSHIP_EXISTS',message:'Verlasse zuerst die Crew. Als Captain überträgst du vorher die Rolle oder schließt die Crew. Kinderprofile brauchen weiterhin eine Begleitung.'});
  },
  async afterDelete(user){
   mail.cancelAccount(user.id,user.email);
   sqlite.prepare('DELETE FROM push_devices WHERE NOT EXISTS (SELECT 1 FROM memberships m WHERE m.household_id=push_devices.household_id AND m.member_id=push_devices.member_id)').run();
  },
 });
 // Serialize each account's requests, then revalidate the session inside the lock.
 // A setup/join already in flight cannot recreate a membership during deletion.
 const accountLocks=new Map<string,Promise<void>>();
 async function serialized(request:Request){
  const session=await auth.api.getSession({headers:request.headers});
  const url=new URL(request.url);
  const pending=url.pathname==='/api/account/verify-email'&&url.searchParams.get('token')
   ?authDb.prepare('SELECT user_id FROM putzonaut_email_changes WHERE token_hash=?').get(createHash('sha256').update(url.searchParams.get('token')!).digest('hex')):undefined;
  const id=pending?String(pending.user_id):session?.user.id;
  if(!id)return route(request);
  const previous=accountLocks.get(id)??Promise.resolve();
  let release!:()=>void;const current=new Promise<void>(resolve=>{release=resolve;});
  accountLocks.set(id,current);await previous;
  try{return await route(request);}finally{release();if(accountLocks.get(id)===current)accountLocks.delete(id);}
 }
 async function route(request:Request){
  const path=new URL(request.url).pathname;
  if(new URL(request.url).origin!==options.origin)return json('Diese Adresse gehört nicht zu Putzonaut.',403);
  if(!['GET','HEAD'].includes(request.method)&&(request.headers.get('origin')!==options.origin||request.headers.get('sec-fetch-site')==='cross-site'))return json('Bitte öffne Putzonaut erneut.',403);
  // Sites service access does not exist on the independent server. Never expose its updater.
  if(path==='/api/push/dispatch')return json('Nicht verfügbar.',404);
  if(path.startsWith('/api/account/')){
   const action=path.slice('/api/account'.length);
   if(action==='/manage'&&request.method==='GET'){
    const session=await auth.api.getSession({headers:request.headers});
    if(!session?.user.emailVerified)return json('Bitte melde dich erneut an.',401);
    const row=await repo.forAccount(session.user.id),h=row?JSON.parse(row.document) as Household:null;
    return Response.json({email:session.user.email,canDelete:!row,crewName:h?.name??null});
   }
   if(routes.get(action)!==request.method&&!(/^\/reset-password\/[^/]+$/.test(action)&&request.method==='GET'))return json('Diese Kontoaktion gibt es nicht.',404);
   return auth.handler(request);
  }
  // Only a verified, server-validated session creates an identity. Incoming identity headers
  // (including all ChatGPT headers) and client-selected profile IDs have no authority here.
  const sessionResponse=await auth.api.getSession({headers:request.headers,asResponse:true});
  const session=await sessionResponse.json() as {user?:{id:string;name:string;emailVerified:boolean}}|null;
  const identity=session?.user?.emailVerified?{userId:session.user.id,fullName:session.user.name}:null;
  const result=await handleApi(request,identity,repo,{origin:options.origin,bucket,push});
  for(const cookie of sessionResponse.headers.getSetCookie())result.headers.append('Set-Cookie',cookie);
  return result;
 }
 const dispatchReminders=(now=new Date(),transport:typeof fetch=fetch)=>sendPush(repo,push,now,transport);
 // The factory is also used by embedding launchers (including the Store wrapper).
 const stopPush=options.scheduleReminders===false?async()=>{}:startPushScheduler(()=>dispatchReminders());
 return {auth,repo,sqlite,authDb,flushMail:mail.flush,dispatchReminders,
  async fetch(request:Request){
   let result:Response;
   try{result=await serialized(request);}catch{console.error('Putzonaut: Anfrage fehlgeschlagen.');result=json('Das hat gerade nicht geklappt. Bitte versuche es erneut.',500);}
   const headers=new Headers(result.headers);
   headers.set('Cache-Control','private, no-store');headers.set('Vary','Cookie');
   headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
   return new Response(result.body,{status:result.status,headers});
  },
  async close(){await stopPush();await mail.flush();sqlite.close();authDb.close();},
 };
}
