import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {Miniflare} from 'miniflare';
import {openDatabase} from '../standalone/database.ts';
import {Repository} from '../server/repository.ts';
import {handleApi} from '../server/api.ts';

const origin='https://putzonaut-test.denny-subke.chatgpt.site',now=new Date('2026-11-03T18:00:00Z');
let mf:Miniflare,sqlite:DatabaseSync;
const repos={} as Record<string,Repository>;
before(async()=>{
 const opened=openDatabase(':memory:');sqlite=opened.sqlite;repos.sqlite=new Repository(opened.db);
 mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});
 repos.d1=new Repository(await mf.getD1Database('DB'));
 for(const file of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8')).split('--> statement-breakpoint'))if(sql.trim())await repos.d1.db.prepare(sql).run();
});
after(async()=>{sqlite.close();await mf.dispose();});

for(const backend of ['sqlite','d1']){
 const repo=()=>repos[backend];
 async function call(user:string|null,path:string,method='GET',body?:unknown,headers:Record<string,string>={},at=now,storage=repo()){
  const r=await handleApi(new Request(origin+'/api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),user?{userId:user}:null,storage,{now:()=>at});
  return {status:r.status,body:await r.json() as any,cache:r.headers.get('cache-control')};
 }
 async function setup(name='Alex'){const u=crypto.randomUUID();assert.equal((await call(u,'/auth/setup','POST',{name,householdName:'Nachrichtencrew',starterTasks:false})).status,201);return u;}
 async function state(u:string){return (await call(u,'/state')).body;}
 async function joinCrew(owner:string,name='Robin'){const invitation=(await call(owner,'/invitations','POST',{})).body.token,u=crypto.randomUUID();assert.equal((await call(u,'/auth/join','POST',{name,invite:invitation})).status,201);return u;}
 async function pair(){const a=await setup(),b=await joinCrew(a),aId=(await state(a)).user.id,bId=(await state(b)).user.id;return {a,b,aId,bId};}
 const send=(u:string,id:string,text='Hallo!',extra:Record<string,unknown>={},at=now)=>call(u,'/messages/'+id,'POST',{text,requestKey:crypto.randomUUID(),...extra},{},at);

 test(`${backend}: messages are private to their two account members, including against the captain`,async()=>{
  const {a,b,aId,bId}=await pair(),c=await joinCrew(a,'Charlie'),cId=(await state(c)).user.id,foreign=await setup('Andere Crew'),foreignId=(await state(foreign)).user.id;
  const child=(await call(a,'/children','POST',{name:'Kind'})).body.id;
  const secret='Vertraulicher Text <img src=x onerror=alert(1)> & Grüße 🚀';
  assert.equal((await send(b,cId,secret)).status,201);
  const conversation=await call(c,'/messages/'+bId);assert.equal(conversation.body.items[0].text,secret);assert.equal(conversation.cache,'private, no-store');
  assert.deepEqual((await call(a,'/messages/'+bId)).body.items,[]);
  assert.deepEqual((await call(a,'/messages/'+cId)).body.items,[]);
  const inbox=(await call(a,'/messages')).body;assert.deepEqual(new Set(inbox.contacts.map((x:any)=>x.id)),new Set([bId,cId]));assert.equal(inbox.unread,0);
  for(const u of [a,b,c])for(const path of ['/state','/history',...(u===a?['/export','/backups']:[])])assert.ok(!JSON.stringify((await call(u,path)).body).includes(secret),path);
  for(const id of [aId,child,foreignId,crypto.randomUUID()])assert.equal((await send(a,id)).status,404);
  assert.equal((await call(foreign,'/messages/'+bId)).status,404);
  for(const path of ['/messages','/messages/unread','/messages/'+bId])assert.equal((await call(a,path,'GET',undefined,{'X-Putzonaut-Profile':child})).status,403);
  assert.equal((await call(a,'/messages/'+bId,'POST',{text:'Test',requestKey:crypto.randomUUID()},{'X-Putzonaut-Profile':child})).status,403);
  assert.equal((await call(null,'/messages')).status,401);
  assert.equal((await call(a,'/messages/'+bId,'POST',{text:'Test',requestKey:crypto.randomUUID()},{Origin:'https://other.example'})).status,403);
 });

 test(`${backend}: sending is idempotent under concurrent retries and rejects forged content`,async()=>{
  const {a,b,bId}=await pair(),requestKey=crypto.randomUUID();
  const results=await Promise.all(Array.from({length:5},()=>send(a,bId,'  Küche ist fertig!  ',{requestKey})));
  assert.equal(results.filter(r=>r.status===201).length,1);assert.equal(results.filter(r=>r.status===200).length,4);
  assert.equal(new Set(results.map(r=>r.body.item.id)).size,1);
  assert.equal((await call(b,'/messages/unread')).body.unread,1);
  assert.equal((await send(a,bId,'Anderer Inhalt',{requestKey})).status,409);
  for(const text of ['', '  \n  ', 'x'.repeat(2001), 'bad\u0000text'])assert.equal((await send(a,bId,text)).status,400);
  assert.equal((await send(a,bId,'Text',{senderId:bId})).status,400);
  assert.equal((await send(a,bId,'Text',{requestKey:'bad'})).status,400);
  assert.equal((await call(b,'/messages/unread')).body.unread,1);
  assert.equal((await send(a,bId,'erste Zeile\nzweite Zeile')).body.item.text,'erste Zeile\nzweite Zeile');
 });

 test(`${backend}: unread acknowledgement stops at the actually displayed incoming message`,async()=>{
  const {a,b,aId,bId}=await pair(),c=await joinCrew(a),cId=(await state(c)).user.id;
  const first=(await send(a,bId,'Eins')).body.item;
  assert.equal((await call(b,'/messages/'+aId)).body.items.length,1);
  assert.equal((await call(b,'/messages/unread')).body.unread,1,'reading the endpoint alone must not acknowledge');
  const newer=(await send(a,bId,'Zwei')).body.item,other=(await send(c,bId,'Anderes Gespräch')).body.item;
  await call(b,'/messages/'+aId+'/read','POST',{through:other.id});
  assert.equal((await call(b,'/messages/unread')).body.unread,3,'foreign cursor must not clear anything');
  await call(b,'/messages/'+aId+'/read','POST',{through:first.id});
  assert.equal((await call(b,'/messages/unread')).body.unread,2);
  const inbox=(await call(b,'/messages')).body;assert.equal(inbox.contacts.find((x:any)=>x.id===aId).unread,1);assert.equal(inbox.contacts.find((x:any)=>x.id===cId).unread,1);
  await call(b,'/messages/'+aId+'/read','POST',{through:newer.id});
  assert.equal((await call(b,'/messages/unread')).body.unread,1);
  await call(b,'/messages/'+cId+'/read','POST',{through:other.id});
  assert.equal((await call(b,'/messages/unread')).body.unread,0);
 });

 test(`${backend}: older and newer pages remain ordered without gaps or unrelated messages`,async()=>{
  const {a,b,aId,bId}=await pair();const ids:number[]=[];
  for(let i=0;i<57;i++){const sent=await send(i%2?a:b,i%2?bId:aId,'Nachricht '+i,{},new Date(now.getTime()+i*4000));assert.equal(sent.status,201);ids.push(sent.body.item.id);}
  const recent=(await call(a,'/messages/'+bId)).body;assert.deepEqual(recent.items.map((m:any)=>m.id),ids.slice(7));assert.equal(recent.olderCursor,ids[7]);
  const older=(await call(a,`/messages/${bId}?before=${recent.olderCursor}`)).body;assert.deepEqual(older.items.map((m:any)=>m.id),ids.slice(0,7));assert.equal(older.olderCursor,null);
  const forward=(await call(a,`/messages/${bId}?after=${ids[0]}`)).body;assert.deepEqual(forward.items.map((m:any)=>m.id),ids.slice(1,51));assert.equal(forward.hasMore,true);
  const tail=(await call(a,`/messages/${bId}?after=${forward.items.at(-1).id}`)).body;assert.deepEqual(tail.items.map((m:any)=>m.id),ids.slice(51));assert.equal(tail.hasMore,false);
  for(const query of ['before=0','after=-1','before=one','before=1&after=2'])assert.equal((await call(a,`/messages/${bId}?${query}`)).status,400);
 });

 test(`${backend}: rate limiting is atomic and a confirmed retry still works at the limit`,async()=>{
  const {a,bId}=await pair(),key=crypto.randomUUID();assert.equal((await send(a,bId,'Erste',{requestKey:key})).status,201);
  const results=await Promise.all(Array.from({length:24},(_,i)=>send(a,bId,'Text '+i)));
  assert.equal(results.filter(r=>r.status===201).length,19);assert.equal(results.filter(r=>r.status===429).length,5);
  assert.equal((await send(a,bId,'Erste',{requestKey:key})).status,200);
  assert.equal((await send(a,bId,'Nach der Pause',{},new Date(now.getTime()+61000))).status,201);
 });

 test(`${backend}: membership removal deletes conversations and rejoining cannot recover them`,async()=>{
  const {a,b,aId,bId}=await pair();await send(a,bId,'A an B');await send(b,aId,'B an A');
  assert.equal((await call(a,'/members/'+bId,'DELETE',{})).status,200);
  assert.equal((await call(a,'/messages/unread')).body.unread,0);assert.equal((await call(a,'/messages/'+bId)).status,404);
  const remaining=await repo().db.prepare('SELECT count(*) AS n FROM messages WHERE sender_id=? OR recipient_id=?').bind(bId,bId).first<{n:number}>();assert.equal(remaining!.n,0);
  const invitation=(await call(a,'/invitations','POST',{})).body.token;assert.equal((await call(b,'/auth/join','POST',{name:'Zurück',invite:invitation})).status,201);
  const newId=(await state(b)).user.id;assert.notEqual(newId,bId);assert.deepEqual((await call(a,'/messages/'+newId)).body.items,[]);
  await send(a,newId,'Neu');assert.equal((await call(a,'/household/close','POST',{confirmation:'Nachrichtencrew'})).status,200);
  assert.equal((await repo().db.prepare('SELECT count(*) AS n FROM messages WHERE sender_id=? OR recipient_id=?').bind(aId,aId).first<{n:number}>())!.n,0);
 });

 test(`${backend}: removal during a request cannot insert or disclose a stale conversation`,async()=>{
  for(const method of ['GET','POST']){
   const {a,b,bId}=await pair();await send(a,bId,'Privat');let removed=false;
   const concurrent=new Repository({prepare:sql=>repo().db.prepare(sql),batch:async statements=>{
    if(!removed){removed=true;assert.equal((await call(b,'/household/leave','POST',{})).status,200);}
    return repo().db.batch(statements);
   }});
   const result=await call(a,'/messages/'+bId,method,method==='POST'?{text:'Zu spät',requestKey:crypto.randomUUID()}:undefined,{},now,concurrent);
   assert.equal(result.status,404);assert.ok(!JSON.stringify(result.body).includes('Privat'));
   assert.equal((await repo().db.prepare('SELECT count(*) AS n FROM messages WHERE recipient_id=?').bind(bId).first<{n:number}>())!.n,0);
  }
 });

 test(`${backend}: crew backups exclude messages and restoring does not rewind private conversations`,async()=>{
  const {a,bId}=await pair();await send(a,bId,'Vor Sicherung');const backup=(await call(a,'/backups')).body;
  await send(a,bId,'Nach Sicherung');assert.ok(!JSON.stringify(backup).includes('Vor Sicherung'));
  const preview=(await call(a,'/backups/preview','POST',{backup})).body;
  assert.equal((await call(a,'/backups/restore','POST',{backup,expectedRevision:preview.expectedRevision,confirmation:'Nachrichtencrew'})).status,200);
  assert.deepEqual((await call(a,'/messages/'+bId)).body.items.map((m:any)=>m.text),['Vor Sicherung','Nach Sicherung']);
  const current=await state(a);assert.equal((await call(a,'/messages/'+bId,'POST',{text:'Veraltet',requestKey:crypto.randomUUID()})).status,409);
  assert.equal((await call(a,'/messages/'+bId,'POST',{text:'Aktuell',requestKey:crypto.randomUUID()},{'X-Putzonaut-Epoch':current.restoreEpoch})).status,201);
 });
}

test('an existing 0.25 database upgrades without changing its crew and retains messages after reopening',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'putzonaut-messages-')),path=join(directory,'crew.sqlite');
 try{
  const old=new DatabaseSync(path);old.exec('PRAGMA foreign_keys=ON; CREATE TABLE putzonaut_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
  for(const name of (await readdir(new URL('../drizzle',import.meta.url))).filter(f=>/^000[012]_.*\.sql$/.test(f)).sort()){
   const sql=await readFile(new URL('../drizzle/'+name,import.meta.url),'utf8');old.exec(sql);old.prepare('INSERT INTO putzonaut_migrations VALUES(?,?)').run(name,createHash('sha256').update(sql).digest('hex'));
  }
  old.prepare('INSERT INTO households VALUES(?,?,?,?)').run('old-crew','{"untouched":true}',17,now.toISOString());old.close();
  let opened=openDatabase(path);assert.deepEqual({...opened.sqlite.prepare('SELECT * FROM households').get()},{id:'old-crew',document:'{"untouched":true}',revision:17,updated_at:now.toISOString()});
  opened.sqlite.prepare('INSERT INTO memberships VALUES(?,?,?)').run('one','old-crew','member-one');opened.sqlite.prepare('INSERT INTO memberships VALUES(?,?,?)').run('two','old-crew','member-two');
  opened.sqlite.prepare('INSERT INTO messages(household_id,sender_id,recipient_id,text,created_at,request_key) VALUES(?,?,?,?,?,?)').run('old-crew','member-one','member-two','Bleibt gespeichert',now.toISOString(),'key');opened.sqlite.close();
  opened=openDatabase(path);assert.equal(opened.sqlite.prepare('SELECT text FROM messages').get()!.text,'Bleibt gespeichert');opened.sqlite.close();
 }finally{await rm(directory,{recursive:true,force:true});}
});
