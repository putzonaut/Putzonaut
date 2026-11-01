import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createStandaloneApp} from '../standalone/app.ts';
import {createHttpServer} from '../standalone/http.ts';
import {photoStore} from '../standalone/photos.ts';
import {safeAccountReturn} from '../src/account.ts';
import type {Mail} from '../standalone/mail.ts';
import {mailQueue} from '../standalone/mail.ts';
import {DatabaseSync} from 'node:sqlite';
import {relinkAccounts} from '../standalone/relink.ts';
import {newHousehold} from '../server/domain.ts';

const origin='https://app.putzonaut.de',password='Eine lange sichere Passphrase 2026!';
let directory:string,app:Awaited<ReturnType<typeof createStandaloneApp>>;
const mail:Mail[]=[];let counter=0;
before(async()=>{directory=await mkdtemp(join(tmpdir(),'putzonaut-accounts-'));app=await createStandaloneApp({directory,origin,secret:'local-test-secret-'.repeat(4),sendMail:async message=>{mail.push(message);}});});
after(async()=>{await app?.close();await rm(directory,{recursive:true,force:true});});
async function call(path:string,body?:unknown,cookie='',headers:Record<string,string>={},method=body===undefined?'GET':'POST'){
 const response=await app.fetch(new Request(origin+path,{method,headers:{origin,'content-type':'application/json','x-putzonaut-client-ip':`192.0.2.${counter%250+1}`,cookie,...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}));
 const text=await response.text();let data:any;try{data=JSON.parse(text);}catch{data=text;}
 return {response,data,status:response.status,cookie:response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};
}
async function register(){
 counter++;const email=`crew${counter}@example.test`;
 const result=await call('/api/account/sign-up/email',{email,password,name:'Alex',callbackURL:origin+'/konto/bestaetigt'});
 assert.equal(result.status,200,JSON.stringify(result.data));
 await app.flushMail();const message=mail.findLast(m=>m.to===email&&m.subject.startsWith('Bestätige'))!;
 assert.ok(message);return {email,link:message.text.match(/https:\/\/\S+/)![0]};
}
async function account(){
 const user=await register();const u=new URL(user.link);const verified=await call(u.pathname+u.search);
 assert.ok([200,302].includes(verified.status),JSON.stringify(verified.data));
 const login=await call('/api/account/sign-in/email',{email:user.email,password,rememberMe:true});
 assert.equal(login.status,200,JSON.stringify(login.data));return {...user,cookie:login.cookie,id:login.data.user.id};
}
async function crew(cookie:string){
 const result=await call('/api/auth/setup',{name:'Alex',householdName:'Sternencrew'},cookie);assert.equal(result.status,201,JSON.stringify(result.data));
 const state=await call('/api/state',undefined,cookie);assert.equal(state.status,200);return state.data;
}

test('registration requires a real verified mailbox, stores a password hash, and issues no initial session',async()=>{
 const user=await register();
 assert.equal((await call('/api/account/sign-in/email',{email:user.email,password})).status,403);
 assert.equal((await call('/api/auth/setup',{name:'Alex',householdName:'Crew'})).status,401);
 const stored=app.authDb.prepare('SELECT password FROM account JOIN user ON user.id=account.userId WHERE user.email=?').get(user.email)!;
 assert.notEqual(stored.password,password);assert.ok(String(stored.password).length>64);
 const invalid=await call('/api/account/verify-email?token=not-a-valid-token');assert.notEqual(invalid.status,200);
 const link=new URL(user.link);await call(link.pathname+link.search);
 const login=await call('/api/account/sign-in/email',{email:user.email,password});assert.equal(login.status,200);
});

test('own cookie session supports crew creation, persistent sign-in, and ignores forged identity headers',async()=>{
 const user=await account(),state=await crew(user.cookie);
 assert.equal(state.user.name,'Alex');assert.equal(state.user.xp,0);
 const auth=await call('/api/account/get-session',undefined,user.cookie);assert.equal(auth.data.user.id,user.id);
 assert.equal((await call('/api/state',undefined,'',{'oai-authenticated-user-id':user.id,'oai-authenticated-user-email':user.email,'x-putzonaut-profile':state.user.id})).status,401);
 assert.equal((await call('/api/state',undefined,'putzonaut.session_token=forged')).status,401);
 const login=await call('/api/account/sign-in/email',{email:user.email,password,rememberMe:true});
 const sessionCookie=login.response.headers.getSetCookie().find(s=>s.includes('session_token='))!;
 assert.match(sessionCookie,/HttpOnly/i);assert.match(sessionCookie,/Secure/i);assert.match(sessionCookie,/SameSite=Lax/i);assert.match(sessionCookie,/Max-Age=2592000/);
 assert.ok(!(sessionCookie.includes('Domain=')));
 const temporary=await call('/api/account/sign-in/email',{email:user.email,password,rememberMe:false});
 assert.doesNotMatch(temporary.response.headers.getSetCookie().find(s=>s.includes('session_token='))!,/Max-Age=/);
});

test('independent accounts can consume an invitation once and cannot access another crew or child',async()=>{
 const owner=await account(),state=await crew(owner.cookie),other=await account();
 const invite=await call('/api/invitations',{},owner.cookie);assert.equal(invite.status,201);
 assert.equal((await call('/api/auth/join',{name:'Robin',invite:invite.data.token},other.cookie)).status,201);
 const joined=await call('/api/state',undefined,other.cookie);assert.equal(joined.data.household.id,state.household.id);assert.equal(joined.data.user.role,'member');
 const outsider=await account();await crew(outsider.cookie);
 assert.equal((await call('/api/tasks/'+state.tasks[0].id+'/complete',{occurrenceKey:state.tasks[0].occurrenceKey},outsider.cookie)).status,404);
 const child=await call('/api/children',{name:'Mini'},owner.cookie);assert.equal(child.status,200);
 assert.equal((await call('/api/state',undefined,other.cookie,{'X-Putzonaut-Profile':child.data.id})).status,403);
 assert.equal((await call('/api/state',undefined,owner.cookie,{'X-Putzonaut-Profile':child.data.id})).status,200);
 const late=await account();assert.equal((await call('/api/auth/join',{name:'Late',invite:invite.data.token},late.cookie)).status,410);
});

test('password reset is single use, revokes old sessions and preserves crew history and points',async()=>{
 const user=await account(),state=await crew(user.cookie),task=state.tasks[0];
 assert.equal((await call('/api/tasks/'+task.id+'/complete',{occurrenceKey:task.occurrenceKey},user.cookie)).status,200);
 const before=await call('/api/state',undefined,user.cookie);
 const requested=await call('/api/account/request-password-reset',{email:user.email,redirectTo:origin+'/konto/passwort-neu'});assert.equal(requested.status,200);
 await app.flushMail();const text=mail.findLast(m=>m.to===user.email&&m.subject.includes('Passwort'))!.text;
 const link=new URL(text.match(/https:\/\/\S+/)![0]);
 const redirect=await call(link.pathname+link.search);assert.equal(redirect.status,302);
 const destination=new URL(redirect.response.headers.get('location')!);assert.equal(destination.pathname,'/konto/passwort-neu');
 const token=destination.searchParams.get('token')!;
 const nextPassword='Eine neue lange Passphrase 2026!';
 assert.equal((await call('/api/account/reset-password',{token,newPassword:nextPassword})).status,200);
 assert.notEqual((await call('/api/account/reset-password',{token,newPassword:password})).status,200);
 assert.equal((await call('/api/state',undefined,user.cookie)).status,401);
 assert.equal((await call('/api/account/sign-in/email',{email:user.email,password})).status,401);
 const login=await call('/api/account/sign-in/email',{email:user.email,password:nextPassword});assert.equal(login.status,200);
 const after=await call('/api/state',undefined,login.cookie);assert.equal(after.data.household.id,before.data.household.id);assert.equal(after.data.user.xp,before.data.user.xp);assert.equal(after.data.user.stars,before.data.user.stars);
 assert.equal((await call('/api/history',undefined,login.cookie)).data.items.length,1);
});

test('recovery and duplicate registration do not disclose registered addresses',async()=>{
 const user=await account();
 const existing=await call('/api/account/request-password-reset',{email:user.email,redirectTo:origin+'/konto/passwort-neu'});
 const unknown=await call('/api/account/request-password-reset',{email:'unknown@example.test',redirectTo:origin+'/konto/passwort-neu'});
 assert.equal(existing.status,unknown.status);assert.deepEqual(existing.data,unknown.data);
 const duplicate=await call('/api/account/sign-up/email',{email:user.email,password,name:'Someone'});
 assert.equal(duplicate.status,200);assert.equal(duplicate.data.token,null);assert.notEqual(duplicate.data.user.id,user.id);
});

test('cross-origin and absent-origin writes, external callbacks, and the Sites push updater are blocked',async()=>{
 const user=await account();await crew(user.cookie);
 for(const originValue of ['https://attacker.example','null','']){
  assert.equal((await call('/api/profile',{name:'Changed'},user.cookie,{origin:originValue},'PATCH')).status,403);
  assert.equal((await call('/api/account/sign-in/email',{email:user.email,password},'',{origin:originValue})).status,403);
 }
 assert.equal((await call('/api/account/send-verification-email',{email:user.email,callbackURL:'https://attacker.example'})).status,403);
 assert.equal((await call('/api/account/request-password-reset',{email:user.email,redirectTo:'https://attacker.example'})).status,403);
 assert.equal((await call('/api/push/dispatch',{},user.cookie)).status,404);
 assert.equal((await call('/api/account/link-social',{provider:'github'},user.cookie)).status,404);
 assert.equal((await call('/api/account/update-user',{emailVerified:true},user.cookie)).status,404);
});

test('logout invalidates the server session; expired sessions are rejected',async()=>{
 const user=await account();await crew(user.cookie);
 assert.equal((await call('/api/account/sign-out',{},user.cookie)).status,200);
 assert.equal((await call('/api/state',undefined,user.cookie)).status,401);
 const login=await call('/api/account/sign-in/email',{email:user.email,password});assert.equal(login.status,200);
 app.authDb.prepare('UPDATE session SET expiresAt=? WHERE userId=?').run(new Date(0).toISOString(),user.id);
 assert.equal((await call('/api/state',undefined,login.cookie)).status,401);
});

test('SQLite adapter rolls back all effects of a failed crew batch and persists across reopen',async()=>{
 const user=await account();const state=await crew(user.cookie);
 const before=await app.repo.forAccount(user.id);
 await assert.rejects(app.repo.db.batch([
  app.repo.db.prepare('UPDATE households SET revision=revision+1 WHERE id=?').bind(state.household.id),
  app.repo.db.prepare('INSERT INTO memberships(account_id,household_id,member_id) VALUES(?,?,?)').bind(user.id,state.household.id,state.user.id),
 ]));
 assert.equal((await app.repo.forAccount(user.id))!.revision,before!.revision);
 await app.close();app=await createStandaloneApp({directory,origin,secret:'local-test-secret-'.repeat(4),sendMail:async message=>{mail.push(message);}});
 assert.equal((await call('/api/state',undefined,user.cookie)).data.household.id,state.household.id);
});

test('encrypted mail queue survives a restart without plaintext links in its storage',async()=>{
 const path=join(directory,'outbox-test.sqlite'),secret='outbox-test-secret';
 const db=new DatabaseSync(path),queue=mailQueue(db,secret,async()=>{throw new Error('not yet');});
 queue.enqueue({to:'outbox@example.test',subject:'Putzonaut',text:'https://example.test/verify?token=private'});
 const pending=db.prepare('SELECT payload FROM putzonaut_mail').all();assert.equal(pending.length,1);
 assert.ok(pending.every(r=>!String(r.payload).includes('outbox@example.test')&&!String(r.payload).includes('private')));
 db.close();
 const reopened=new DatabaseSync(path),delivered:Mail[]=[];
 await mailQueue(reopened,secret,async m=>{delivered.push(m);}).flush();
 assert.equal(delivered[0].to,'outbox@example.test');assert.equal(reopened.prepare('SELECT count(*) AS n FROM putzonaut_mail').get()!.n,0);reopened.close();
});

test('photos use private persistent storage, safe keys and the existing API membership checks',async()=>{
 const bucket=photoStore(join(directory,'photo-test'));
 const prefix='knowledge/'+crypto.randomUUID()+'/',key=prefix+crypto.randomUUID();
 await bucket.put(key,new Uint8Array([1,2,3]),{httpMetadata:{contentType:'image/png'}});
 assert.equal((await bucket.get(key))!.size,3);assert.equal((await bucket.list({prefix,limit:1})).objects.length,1);
 await assert.rejects(bucket.get('../../accounts.sqlite'));
 await bucket.delete(key);assert.equal(await bucket.get(key),null);
});

test('return destinations preserve invitations but reject external hosts and account/token routes',()=>{
 assert.equal(safeAccountReturn('/?invite=abc#crew'),'/?invite=abc#crew');
 for(const value of ['//evil.test','/\\evil.test','https://evil.test','/konto/passwort-neu?token=secret','/%2f%2fevil.test'])assert.equal(safeAccountReturn(value),'/');
});

test('HTTP boundary sanitizes identity/IP headers, limits bodies, and serves account routes with private responses',async()=>{
 const publicDirectory=join(directory,'public');await mkdir(publicDirectory);await writeFile(join(publicDirectory,'index.html'),'Putzonaut');
 const seen:Request[]=[];
 const server=createHttpServer({async fetch(request){seen.push(request);return Response.json({ok:true});}},{origin,publicDirectory});
 server.listen(0,'127.0.0.1');await once(server,'listening');const port=(server.address() as {port:number}).port;
 try{
  const root=`http://127.0.0.1:${port}`;
  const page=await fetch(root+'/konto/anmelden');assert.equal(page.status,200);assert.equal(await page.text(),'Putzonaut');assert.match(page.headers.get('content-security-policy')!,/frame-ancestors 'none'/);assert.equal(page.headers.get('referrer-policy'),'no-referrer');
  await fetch(root+'/api/bootstrap',{headers:{'oai-authenticated-user-id':'forged','x-putzonaut-client-ip':'192.0.2.250','x-forwarded-for':'192.0.2.250','x-real-ip':'192.0.2.250'}});
  assert.equal(seen[0].headers.has('oai-authenticated-user-id'),false);assert.equal(seen[0].headers.has('x-forwarded-for'),false);assert.equal(seen[0].headers.get('x-putzonaut-client-ip'),'127.0.0.1');
  assert.equal((await fetch(root+'/api/account/sign-in/email',{method:'POST',body:'x'.repeat(17000)})).status,413);
  assert.equal((await fetch(root+'/.env')).status,404);
 }finally{server.close();await once(server,'close');}
});

test('sign-in attempts are rate limited on the server',async()=>{
 counter++;let last=0;
 for(let i=0;i<11;i++)last=(await call('/api/account/sign-in/email',{email:'absent@example.test',password})).status;
 assert.equal(last,429);
});

test('legacy account mapping is explicit, previewable, verified, atomic and preserves crew identity and points',async()=>{
 const target=await account(),oldId='legacy-'+crypto.randomUUID();
 const house=newHousehold(oldId,'Captain','Bestehende Crew',true,new Date());house.members[0].xp=987;house.members[0].stars=234;
 await app.repo.create(house);
 const mapping=[{oldAccountId:oldId,newEmail:target.email}];
 const before=await app.repo.forAccount(oldId);
 const preview=relinkAccounts(app.sqlite,app.authDb,mapping);assert.equal(preview[0].memberId,house.members[0].id);
 assert.equal(await app.repo.forAccount(target.id),null);assert.equal((await app.repo.forAccount(oldId))!.document,before!.document);
 assert.throws(()=>relinkAccounts(app.sqlite,app.authDb,[...mapping,{oldAccountId:'absent',newEmail:'absent@example.test'}],true));
 assert.equal((await app.repo.forAccount(oldId))!.document,before!.document);
 relinkAccounts(app.sqlite,app.authDb,mapping,true);
 assert.equal(await app.repo.forAccount(oldId),null);
 const migrated=await call('/api/state',undefined,target.cookie);assert.equal(migrated.status,200);assert.equal(migrated.data.household.id,house.id);assert.equal(migrated.data.user.id,house.members[0].id);assert.equal(migrated.data.user.xp,987);assert.equal(migrated.data.user.stars,234);
 assert.throws(()=>relinkAccounts(app.sqlite,app.authDb,mapping,true));
});

test('legacy mapping rejects unverified target accounts and targets that already own another crew',async()=>{
 const unverified=await register(),occupied=await account();await crew(occupied.cookie);
 const oldId='legacy-'+crypto.randomUUID();await app.repo.create(newHousehold(oldId,'Captain','Alte Crew',true,new Date()));
 for(const email of [unverified.email,occupied.email])assert.throws(()=>relinkAccounts(app.sqlite,app.authDb,[{oldAccountId:oldId,newEmail:email}],true));
 assert.ok(await app.repo.forAccount(oldId));
});

test('concurrent SQLite completions award points exactly once',async()=>{
 const user=await account(),state=await crew(user.cookie),task=state.tasks[0];
 const results=await Promise.all(Array.from({length:8},()=>call('/api/tasks/'+task.id+'/complete',{occurrenceKey:task.occurrenceKey},user.cookie)));
 assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===409).length,7);
 const after=await call('/api/state',undefined,user.cookie);assert.equal(after.data.user.xp,task.xp);assert.equal(after.data.user.stars,task.stars);
});
