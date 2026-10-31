import {z} from 'zod';
import {AppError,digest,normalize} from './domain.ts';
import type {Household,Member} from './domain.ts';
import type {Repository} from './repository.ts';
import {localDay} from '../shared/planning.ts';
import {awayOn} from '../shared/life.ts';
import {taskOwner,taskPlan} from './life.ts';

export type PushConfig={publicKey?:string;privateJwk?:string};
type Device={id:string;household_id:string;member_id:string;endpoint:string;hour:number;last_day:string|null;last_status:string|null;updated_at:string};
const SITE='https://putzonaut-test.denny-subke.chatgpt.site';
const base64url=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const encoded=(value:unknown)=>base64url(new TextEncoder().encode(JSON.stringify(value)));
export function validPushEndpoint(value:string){
 try{const u=new URL(value);return value.length<=2048&&u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&(!u.port||u.port==='443')&&u.pathname.length>1&&(u.hostname==='fcm.googleapis.com'||u.hostname==='push.services.mozilla.com'||u.hostname.endsWith('.push.services.mozilla.com')||u.hostname.endsWith('.push.apple.com'));}catch{return false;}
}
export function pushDue(h:Household,id:string,hour:number,now:Date){
 const day=localDay(now),m=h.members.find(m=>m.id===id&&!m.removedAt&&m.accountId&&m.kind!=='child');
 const current=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',hourCycle:'h23'}).format(now));
 if(!m||h.closedAt||current!==hour||awayOn(m.away,day)||awayOn(h.away,day))return false;
 normalize(h,now);const managed=new Set([id,...h.members.filter(c=>c.kind==='child'&&c.guardianId===id&&!c.removedAt&&!awayOn(c.away,day)).map(c=>c.id)]);
 return h.tasks.some(t=>{const p=taskPlan(h,t,day);if(!['today','overdue'].includes(p.status))return false;const owner=taskOwner(h,t,day);return t.team?t.team.shares.some(s=>managed.has(s.userId)&&!s.confirmed):!owner||managed.has(owner);});
}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function pushRoute(route:string,method:string,body:unknown,h:Household,viewer:Member,repo:Repository,config:PushConfig,now:Date){
 if(route!=='/push')return null;
 if(!viewer.accountId||viewer.kind==='child')throw new AppError(403,'Benachrichtigungen gehören zum angemeldeten Eltern- oder Erwachsenenprofil.');
 if(method==='GET'){
  const rows=await repo.db.prepare('SELECT id,hour,last_status,updated_at FROM push_devices WHERE household_id=? AND member_id=?').bind(h.id,viewer.id).all();
  const heartbeat=await repo.db.prepare("SELECT value FROM push_state WHERE key='heartbeat'").first<{value:string}>();
  return reply({publicKey:config.publicKey??null,configured:!!config.publicKey&&!!config.privateJwk,checkedAt:heartbeat?JSON.parse(heartbeat.value).checkedAt:null,devices:rows.results});
 }
 const v=z.object({endpoint:z.string().max(2048),hour:z.number().int().min(0).max(23).optional()}).strict().parse(body);
 if(!validPushEndpoint(v.endpoint))throw new AppError(400,'Dieser Benachrichtigungsdienst wird hier nicht unterstützt.');const id=await digest(v.endpoint);
 if(method==='DELETE'){await repo.db.prepare('DELETE FROM push_devices WHERE id=? AND household_id=? AND member_id=?').bind(id,h.id,viewer.id).run();return reply({ok:true});}
 if(method!=='POST'||v.hour===undefined)throw new AppError(400,'Wähle ein tägliches Zeitfenster.');
 if(!config.publicKey||!config.privateJwk)throw new AppError(503,'Benachrichtigungen werden gerade eingerichtet.');
 // Guard enrollment with live membership, crew/epoch and a three-device cap in one statement.
 const r=await repo.db.prepare("INSERT INTO push_devices(id,household_id,member_id,endpoint,hour,updated_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM memberships m JOIN households h ON h.id=m.household_id WHERE m.account_id=? AND m.member_id=? AND h.id=? AND coalesce(json_extract(h.document,'$.restoreEpoch'),'')=? AND json_extract(h.document,'$.closedAt') IS NULL) AND ((SELECT count(*) FROM push_devices WHERE member_id=?)<3 OR EXISTS (SELECT 1 FROM push_devices WHERE id=? AND member_id=?)) ON CONFLICT(id) DO UPDATE SET hour=excluded.hour,updated_at=excluded.updated_at WHERE push_devices.household_id=excluded.household_id AND push_devices.member_id=excluded.member_id").bind(id,h.id,viewer.id,v.endpoint,v.hour,now.toISOString(),viewer.accountId,viewer.id,h.id,h.restoreEpoch??'',viewer.id,id,viewer.id).run();
 if(r.meta.changes!==1)throw new AppError(409,'Die Anmeldung hat sich geändert, das Gerät gehört noch zu einem anderen Profil oder drei Geräte sind bereits verbunden.');
 return reply({ok:true,id});
}
async function authorization(repo:Repository,endpoint:string,config:PushConfig,now:Date){
 const aud=new URL(endpoint).origin,key='vapid:'+aud;
 const cached=await repo.db.prepare('SELECT value FROM push_state WHERE key=?').bind(key).first<{value:string}>();
 if(cached){const token=JSON.parse(cached.value);if(token.exp>Math.floor(now.getTime()/1000)+3600&&token.publicKey===config.publicKey)return token.authorization as string;}
 const exp=Math.floor(now.getTime()/1000)+12*3600;
 const input=encoded({typ:'JWT',alg:'ES256'})+'.'+encoded({aud,exp,sub:SITE});
 const jwk=JSON.parse(config.privateJwk!);const cryptoKey=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},cryptoKey,new TextEncoder().encode(input));
 const value=`vapid t=${input}.${base64url(new Uint8Array(signature))}, k=${config.publicKey}`;
 await repo.db.prepare('INSERT INTO push_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify({authorization:value,publicKey:config.publicKey,exp})).run();return value;
}
/** Shared owner-private updater. Platform service access is consumed by Sites dispatch.
 * No caller-selected crew/member IDs, credentials or task contents are accepted/returned.
 * Changing the Site audience requires replacing this boundary before publication.
 */
export async function dispatchPush(request:Request,repo:Repository,config:PushConfig,now=new Date(),transport:typeof fetch=fetch){
 if(request.headers.get('sec-fetch-site')==='cross-site'||request.headers.has('origin')&&request.headers.get('origin')!==SITE)return reply({error:'Nicht erlaubt.'},403);
 if(!config.publicKey||!config.privateJwk)return reply({error:'Push ist noch nicht eingerichtet.'},503);
 if(request.method==='GET'){
  const heartbeat=await repo.db.prepare("SELECT value FROM push_state WHERE key='heartbeat'").first<{value:string}>();
  return reply({ok:true,configured:true,lastRun:heartbeat?JSON.parse(heartbeat.value):null});
 }
 if(request.method!=='POST')return reply({error:'POST oder GET erforderlich.'},405);
 let dryRun=false;try{const reader=request.body?.getReader();let text='';if(reader){const decoder=new TextDecoder();let size=0;while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>80){await reader.cancel();return reply({error:'Ungültiger Auftrag.'},400);}text+=decoder.decode(chunk.value,{stream:true});}}dryRun=z.object({dryRun:z.boolean().optional()}).strict().parse(text?JSON.parse(text):{}).dryRun??false;}catch{return reply({error:'Ungültiger Auftrag.'},400);}
 // Short lease avoids overlapping dispatchers and duplicate JWT refreshes. Claims on
 // each device are permanent for the day, including ambiguous network failures.
 const lease=crypto.randomUUID(),at=now.getTime();
 const lock=await repo.db.prepare("INSERT INTO push_state(key,value) VALUES('lease',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value WHERE CAST(json_extract(push_state.value,'$.until') AS INTEGER)<?").bind(JSON.stringify({id:lease,until:at+10*60000}),at).run();
 if(!lock.meta.changes)return reply({ok:true,busy:true});
 try{
  if(!dryRun)await repo.db.prepare('DELETE FROM push_devices WHERE NOT EXISTS (SELECT 1 FROM memberships m WHERE m.household_id=push_devices.household_id AND m.member_id=push_devices.member_id)').run();
  const day=localDay(now),hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',hourCycle:'h23'}).format(now));
  const rows=await repo.db.prepare('SELECT p.* FROM push_devices p WHERE p.hour=? AND (p.last_day IS NULL OR p.last_day<>?) ORDER BY p.id LIMIT 30').bind(hour,day).all<Device>();
  let eligible=0,accepted=0,removed=0,failed=0;
  const tokens=new Map<string,string>();
  if(!dryRun)for(const d of rows.results)if(validPushEndpoint(d.endpoint)&&!tokens.has(new URL(d.endpoint).origin))tokens.set(new URL(d.endpoint).origin,await authorization(repo,d.endpoint,config,now));
  const processDevice=async(d:Device)=>{
   if(!validPushEndpoint(d.endpoint)){if(!dryRun)await repo.db.prepare('DELETE FROM push_devices WHERE id=?').bind(d.id).run();return;}
   const row=await repo.byId(d.household_id);if(!row||!pushDue(JSON.parse(row.document),d.member_id,d.hour,now)){if(!dryRun)await repo.db.prepare("UPDATE push_devices SET last_day=?,last_status='skipped' WHERE id=? AND updated_at=?").bind(day,d.id,d.updated_at).run();return;}eligible++;
   if(dryRun)return;
   const token=tokens.get(new URL(d.endpoint).origin)!;
   const claim=await repo.db.prepare("UPDATE push_devices SET last_day=?,last_status='attempted' WHERE id=? AND updated_at=? AND hour=? AND (last_day IS NULL OR last_day<>?) AND EXISTS (SELECT 1 FROM households h JOIN memberships m ON m.household_id=h.id WHERE h.id=? AND h.revision=? AND m.member_id=?)").bind(day,d.id,d.updated_at,hour,day,d.household_id,row.revision,d.member_id).run();
   if(!claim.meta.changes)return;
   try{
    const response=await transport(d.endpoint,{method:'POST',headers:{Authorization:token,TTL:'3600',Topic:'putzonaut-daily',Urgency:'normal'},redirect:'error',signal:AbortSignal.timeout(8000)});
    await response.body?.cancel();
    if(response.status===404||response.status===410){await repo.db.prepare('DELETE FROM push_devices WHERE id=? AND updated_at=?').bind(d.id,d.updated_at).run();removed++;}
    else {const success=response.status===201;if(success)accepted++;else failed++;await repo.db.prepare('UPDATE push_devices SET last_status=? WHERE id=? AND last_day=?').bind(success?'accepted':'rejected',d.id,day).run();}
   }catch{failed++;await repo.db.prepare("UPDATE push_devices SET last_status='unknown' WHERE id=? AND last_day=?").bind(d.id,day).run();}
  };
  for(let i=0;i<rows.results.length;i+=5)await Promise.all(rows.results.slice(i,i+5).map(processDevice));
  const result={ok:true,dryRun,more:!dryRun&&rows.results.length===30,checkedAt:now.toISOString(),checked:rows.results.length,eligible,accepted,removed,failed};
  await repo.db.prepare("INSERT INTO push_state(key,value) VALUES('heartbeat',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(result)).run();return reply(result);
 }finally{await repo.db.prepare("DELETE FROM push_state WHERE key='lease' AND json_extract(value,'$.id')=?").bind(lease).run();}
}
