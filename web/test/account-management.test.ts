import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStandaloneApp} from '../standalone/app.ts';
import {startPushScheduler} from '../standalone/push.ts';
import type {Mail} from '../standalone/mail.ts';

const origin='https://app.example.test',password='Eine eigene lange Passphrase 2026!';
let directory:string,app:Awaited<ReturnType<typeof createStandaloneApp>>,mail:Mail[],counter=0;
const open=()=>createStandaloneApp({directory,origin,secret:'isolated-account-test-secret-'.repeat(3),sendMail:async m=>{mail.push(m);}});
beforeEach(async()=>{mail=[];directory=await mkdtemp(join(tmpdir(),'putzonaut-management-'));app=await open();});
afterEach(async()=>{await app.close();await rm(directory,{recursive:true,force:true});});
async function call(path:string,body?:unknown,cookie='',extra:Record<string,string>={}){
 const response=await app.fetch(new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{origin,'content-type':'application/json','x-putzonaut-client-ip':`192.0.2.${counter%250+1}`,cookie,...extra},...(body===undefined?{}:{body:JSON.stringify(body)})}));
 const data:any=await response.clone().json().catch(()=>null);
 return {response,status:response.status,data,cookie:response.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};
}
const linkOf=(message:Mail)=>{const url=new URL(message.text.match(/https:\/\/\S+/)![0]);return url.pathname+url.search;};
async function account(email=`person-${++counter}@example.test`){
 assert.equal((await call('/api/account/sign-up/email',{email,password,name:'Alex',callbackURL:origin+'/konto/bestaetigt'})).status,200);
 await app.flushMail();assert.equal((await call(linkOf(mail.findLast(m=>m.to===email)!))).status,302);
 const login=await call('/api/account/sign-in/email',{email,password});assert.equal(login.status,200);
 return {email,id:login.data.user.id,cookie:login.cookie};
}
async function crew(cookie:string){assert.equal((await call('/api/auth/setup',{name:'Alex',householdName:'Testcrew'},cookie)).status,201);return (await call('/api/state',undefined,cookie)).data;}
const change=(cookie:string,newEmail:string,extra:Record<string,unknown>={})=>call('/api/account/change-email',{newEmail,password,callbackURL:origin+'/konto/email-bestaetigt',...extra},cookie);
const remove=(cookie:string,extra:Record<string,unknown>={})=>call('/api/account/delete-user',{password,confirmation:'KONTO LÖSCHEN',...extra},cookie);
async function invalidLink(path:string){const result=await call(path);assert.equal(result.status,302);assert.equal(new URL(result.response.headers.get('location')!).searchParams.get('error'),'INVALID_TOKEN');}

test('email change verifies the current password, keeps the old login until confirmation, then preserves crew and revokes sessions and resets',async()=>{
 const user=await account(),state=await crew(user.cookie),next='new-login@example.test';
 const otherSession=await call('/api/account/sign-in/email',{email:user.email,password});
 assert.equal((await call('/api/tasks/'+state.tasks[0].id+'/complete',{occurrenceKey:state.tasks[0].occurrenceKey},user.cookie)).status,200);
 const before=(await call('/api/state',undefined,user.cookie)).data;
 assert.equal((await change(user.cookie,next,{password:'wrong'})).status,400);
 assert.equal((await change(user.cookie,next,{password:undefined})).status,400);
 assert.equal((await change(user.cookie,next)).status,200);
 assert.equal(app.authDb.prepare('SELECT email FROM user WHERE id=?').get(user.id)!.email,user.email);
 await call('/api/account/request-password-reset',{email:user.email,redirectTo:origin+'/konto/passwort-neu'});
 await app.flushMail();const reset=mail.findLast(m=>m.to===user.email&&m.subject.includes('Passwort'))!;
 const confirmation=linkOf(mail.findLast(m=>m.to===next)!);
 assert.equal((await call(confirmation,undefined,user.cookie)).status,302);
 assert.equal((await call('/api/state',undefined,user.cookie)).status,401);
 assert.equal((await call('/api/state',undefined,otherSession.cookie)).status,401);
 const resetRedirect=await call(linkOf(reset));
 assert.ok(new URL(resetRedirect.response.headers.get('location')!).searchParams.has('error'));
 assert.equal((await call('/api/account/sign-in/email',{email:user.email,password})).status,401);
 const login=await call('/api/account/sign-in/email',{email:next,password});assert.equal(login.status,200);
 const after=(await call('/api/state',undefined,login.cookie)).data;
 assert.equal(after.user.id,before.user.id);assert.equal(after.household.id,before.household.id);assert.equal(after.user.stars,before.user.stars);assert.equal(after.user.xp,before.user.xp);
 await app.flushMail();assert.ok(mail.some(m=>m.to===user.email&&m.subject.includes('wurde geändert')));
 await invalidLink(confirmation);
});

test('only the latest email change link works; foreign sessions, expired tokens and off-origin callbacks cannot change it',async()=>{
 const user=await account(),other=await account();
 assert.equal((await change(user.cookie,'first@example.test')).status,200);await app.flushMail();const first=linkOf(mail.findLast(m=>m.to==='first@example.test')!);
 assert.equal((await change(user.cookie,'second@example.test')).status,200);await app.flushMail();const second=linkOf(mail.findLast(m=>m.to==='second@example.test')!);
 await invalidLink(first);
 const foreign=await call(second,undefined,other.cookie);assert.ok(new URL(foreign.response.headers.get('location')!).searchParams.has('error'));
 assert.equal(app.authDb.prepare('SELECT email FROM user WHERE id=?').get(user.id)!.email,user.email);
 assert.equal((await change(user.cookie,'third@example.test',{callbackURL:'https://attacker.test/'})).status,403);
 app.authDb.prepare('UPDATE putzonaut_email_changes SET expires_at=0').run();await invalidLink(second);
 assert.equal((await call('/api/account/change-email',{newEmail:'fourth@example.test',password,callbackURL:origin+'/konto/email-bestaetigt'},user.cookie,{origin:'https://attacker.test'})).status,403);
});

test('requesting an occupied email cannot take over another account or disclose availability',async()=>{
 const user=await account(),other=await account();
 const occupied=await change(user.cookie,other.email),free=await change(user.cookie,'free@example.test');
 assert.equal(occupied.status,free.status);assert.deepEqual(occupied.data,free.data);
 await app.flushMail();assert.equal(mail.filter(m=>m.to===other.email&&m.subject.includes('neue')).length,0);
 assert.equal(app.authDb.prepare('SELECT email FROM user WHERE id=?').get(other.id)!.email,other.email);
});

test('password recovery invalidates a pending email change and malformed verification tokens are rejected',async()=>{
 const user=await account();await change(user.cookie,'pending-reset@example.test');await app.flushMail();
 const pending=linkOf(mail.findLast(m=>m.to==='pending-reset@example.test')!);
 await call('/api/account/request-password-reset',{email:user.email,redirectTo:origin+'/konto/passwort-neu'});await app.flushMail();
 const redirect=await call(linkOf(mail.findLast(m=>m.to===user.email&&m.subject.includes('Passwort'))!));
 const token=new URL(redirect.response.headers.get('location')!).searchParams.get('token');
 assert.equal((await call('/api/account/reset-password',{token,newPassword:'Meine andere lange Passphrase 2026!'})).status,200);
 await invalidLink(pending);
 const malformed=await call('/api/account/verify-email?token=a.bnVsbA.c');assert.equal(malformed.status,401);
});

test('sensitive account actions rate-limit incorrect passwords',async()=>{
 const user=await account();let result;
 for(let n=0;n<6;n++)result=await change(user.cookie,'rate@example.test',{password:'incorrect'});
 assert.equal(result!.status,429);
 assert.equal(app.authDb.prepare('SELECT email FROM user WHERE id=?').get(user.id)!.email,user.email);
});

test('account management is private and deletion is blocked until the crew membership is resolved',async()=>{
 assert.equal((await call('/api/account/manage')).status,401);
 const user=await account();await crew(user.cookie);
 assert.equal((await call('/api/account/manage',undefined,user.cookie)).data.canDelete,false);
 assert.equal((await remove(user.cookie)).status,409);
 assert.ok(app.authDb.prepare('SELECT id FROM user WHERE id=?').get(user.id));
 assert.equal((await call('/api/state',undefined,user.cookie)).status,200);
 assert.equal((await call('/api/account/delete-user/callback?token=anything',undefined,user.cookie)).status,404);
});

test('deletion requires password and exact confirmation, removes account credentials, sessions, pending email changes and reset links',async()=>{
 const user=await account();
 assert.equal((await remove(user.cookie,{confirmation:'ja'})).status,400);
 assert.equal((await remove(user.cookie,{password:undefined})).status,400);
 assert.equal((await remove(user.cookie,{password:'wrong'})).status,400);
 const otherSession=await call('/api/account/sign-in/email',{email:user.email,password});
 await change(user.cookie,'pending@example.test');await app.flushMail();const pending=linkOf(mail.findLast(m=>m.to==='pending@example.test')!);
 await call('/api/account/request-password-reset',{email:user.email,redirectTo:origin+'/konto/passwort-neu'});
 assert.ok(Number(app.authDb.prepare('SELECT count(*) AS n FROM putzonaut_mail').get()!.n)>0);
 assert.equal((await remove(user.cookie)).status,200);
 for(const table of ['user','session','account'])assert.equal(app.authDb.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n,0);
 assert.equal(app.authDb.prepare('SELECT count(*) AS n FROM verification WHERE value=?').get(user.id)!.n,0);
 assert.equal(app.authDb.prepare('SELECT count(*) AS n FROM putzonaut_email_changes').get()!.n,0);
 assert.equal(app.authDb.prepare('SELECT count(*) AS n FROM putzonaut_mail').get()!.n,0);
 assert.equal((await call('/api/account/manage',undefined,otherSession.cookie)).status,401);
 assert.equal((await call('/api/account/sign-in/email',{email:user.email,password})).status,401);
 const replacement=await account(user.email);assert.notEqual(replacement.id,user.id);
 await invalidLink(pending);assert.equal(app.authDb.prepare('SELECT email FROM user WHERE id=?').get(replacement.id)!.email,user.email);
});

test('leaving before deletion retains the remaining crew and cancels former push devices',async()=>{
 const captain=await account(),state=await crew(captain.cookie),user=await account();
 const invite=await call('/api/invitations',{},captain.cookie);
 assert.equal((await call('/api/auth/join',{name:'Sam',invite:invite.data.token},user.cookie)).status,201);
 assert.equal((await call('/api/push',{endpoint:'https://web.push.apple.com/removed-member',hour:18},user.cookie)).status,200);
 assert.equal((await remove(user.cookie)).status,409);
 assert.equal((await call('/api/household/leave',{},user.cookie)).status,200);
 assert.equal((await remove(user.cookie)).status,200);
 assert.equal(app.sqlite.prepare('SELECT count(*) AS n FROM push_devices').get()!.n,0);
 assert.equal((await call('/api/state',undefined,captain.cookie)).data.household.id,state.household.id);
});

test('concurrent crew creation and account deletion cannot leave an orphaned membership',async()=>{
 const user=await account();
 const results=await Promise.all([remove(user.cookie),call('/api/auth/setup',{name:'Alex',householdName:'Race crew'},user.cookie)]);
 assert.ok(results[0].status===200&&results[1].status===401||results[0].status===409&&results[1].status===201,JSON.stringify(results.map(r=>({status:r.status,data:r.data}))));
 const exists=!!app.authDb.prepare('SELECT id FROM user WHERE id=?').get(user.id),membership=!!await app.repo.forAccount(user.id);
 assert.ok(exists||!membership);
});

test('standalone push is configured automatically, uses the installation origin and persists keys and daily claims across restart',async()=>{
 const user=await account();await crew(user.cookie);
 const settings=(await call('/api/push',undefined,user.cookie)).data;
 assert.equal(settings.configured,true);assert.ok(settings.publicKey);assert.equal(settings.privateJwk,undefined);
 const now=new Date(),hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',hourCycle:'h23'}).format(now));
 assert.equal((await call('/api/push',{endpoint:'https://fcm.googleapis.com/standalone-test',hour},user.cookie)).status,200);
 let sent=0;
 const transport:typeof fetch=async(endpoint,init)=>{
  sent++;assert.equal(endpoint,'https://fcm.googleapis.com/standalone-test');assert.equal(init?.body,undefined);
  const token=new Headers(init?.headers).get('Authorization')!.match(/t=([^, ]+)/)![1];
  const payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());assert.equal(payload.sub,origin);
  return new Response(null,{status:201});
 };
 assert.equal((await (await app.dispatchReminders(now,transport)).json() as {accepted:number}).accepted,1);
 await app.close();app=await open();
 assert.equal((await call('/api/push',undefined,user.cookie)).data.publicKey,settings.publicKey);
 await app.dispatchReminders(now,transport);assert.equal(sent,1);
 assert.equal((await call('/api/push/dispatch',{},user.cookie)).status,404);
});

test('push scheduler starts without a browser, does not overlap and waits for its last send on shutdown',async t=>{
 t.mock.timers.enable({apis:['setInterval']});let calls=0,finish!:()=>void;
 const stop=startPushScheduler(()=>{calls++;return new Promise<void>(resolve=>{finish=resolve;});});
 await Promise.resolve();assert.equal(calls,1);
 t.mock.timers.tick(120_000);assert.equal(calls,1);
 let stopped=false;const closing=stop().then(()=>{stopped=true;});await Promise.resolve();assert.equal(stopped,false);
 finish();await closing;assert.equal(stopped,true);t.mock.timers.tick(120_000);assert.equal(calls,1);
});
