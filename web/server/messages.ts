import {z} from 'zod';
import {AppError,member} from './domain.ts';
import type {Household,Member} from './domain.ts';
import type {Repository,Row} from './repository.ts';
import {MESSAGE_MAX_LENGTH} from '../shared/messages.ts';
import type {Message,MessageInbox,MessagePage,MessageScope} from '../shared/messages.ts';

const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const messageColumns='id,sender_id AS senderId,text,created_at AS createdAt';
const pageSize=50;

/** Every SQL statement checks current membership, including during concurrent removal. */
export async function messageRoute(url:URL,method:string,body:unknown,repo:Repository,accountId:string,house:Household,viewer:Member,actor:Member,now:Date):Promise<Response|null>{
 const route=url.pathname.replace(/^\/api/,'');
 if(route!=='/messages'&&!route.startsWith('/messages/'))return null;
 if(actor.id!==viewer.id||viewer.kind==='child'||!viewer.accountId)throw new AppError(403,'Nachrichten stehen nur im eigenen Konto zur Verfügung.');
 const scope:MessageScope={householdId:house.id,viewerId:viewer.id,restoreEpoch:house.restoreEpoch??''};
 const scopeValues=[accountId,house.id,viewer.id,scope.restoreEpoch];
 const scopeSql="SELECT 1 FROM memberships me JOIN households h ON h.id=me.household_id WHERE me.account_id=? AND me.household_id=? AND me.member_id=? AND coalesce(json_extract(h.document,'$.restoreEpoch'),'')=?";
 const guard=`EXISTS (${scopeSql})`;
 const snapshot=()=>repo.db.prepare('SELECT h.id,h.document,h.revision FROM households h JOIN memberships m ON m.household_id=h.id WHERE m.account_id=?').bind(accountId);
 function validate(row:Row|undefined){
  if(!row||row.id!==house.id)throw new AppError(409,'Deine Crew-Mitgliedschaft hat sich geändert. Bitte lade die Seite neu.');
  const live=JSON.parse(row.document) as Household;
  if(member(live,accountId).id!==viewer.id||(live.restoreEpoch??'')!==scope.restoreEpoch)throw new AppError(409,'Dein Crewstand hat sich geändert. Bitte lade die Seite neu.');
  return live;
 }
 if((route==='/messages'||route==='/messages/unread')&&method==='GET'){
  const results=await repo.db.batch([
   snapshot(),
   repo.db.prepare(`SELECT sender_id AS id,count(*) AS unread FROM messages WHERE household_id=? AND recipient_id=? AND read_at IS NULL AND ${guard} GROUP BY sender_id`).bind(house.id,viewer.id,...scopeValues),
   repo.db.prepare(`SELECT member_id AS id FROM memberships WHERE household_id=? AND ${guard}`).bind(house.id,...scopeValues),
  ]);
  const live=validate(results[0].results[0] as Row|undefined),counts=new Map((results[1].results as {id:string;unread:number}[]).map(x=>[x.id,Number(x.unread)]));
  const active=new Set((results[2].results as {id:string}[]).map(x=>x.id));
  const contacts=live.members.filter(m=>m.id!==viewer.id&&!m.removedAt&&m.kind!=='child'&&!!m.accountId&&active.has(m.id)).map(m=>({id:m.id,name:m.name,outfit:m.outfit,unread:counts.get(m.id)??0}));
  const unread=contacts.reduce((n,c)=>n+c.unread,0);
  return json(route==='/messages/unread'?{...scope,unread}:{...scope,contacts,unread} satisfies MessageInbox);
 }
 const match=route.match(/^\/messages\/([^/]+)(\/read)?$/);
 if(!match)throw new AppError(404,'Dieses Gespräch ist nicht verfügbar.');
 const contactId=z.string().uuid().parse(match[1]);
 if(contactId===viewer.id||!house.members.some(m=>m.id===contactId&&!m.removedAt&&m.kind!=='child'&&!!m.accountId))throw new AppError(404,'Dieses Crewmitglied ist nicht für Nachrichten verfügbar.');
 const peerSql='SELECT 1 FROM memberships WHERE household_id=? AND member_id=?';
 const both=`${guard} AND EXISTS (${peerSql})`,bothValues=[...scopeValues,house.id,contactId];
 const pair='household_id=? AND ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?))';
 const pairValues=[house.id,viewer.id,contactId,contactId,viewer.id];
 const liveStatements=()=>[snapshot(),repo.db.prepare(peerSql).bind(house.id,contactId)];
 function validateBoth(results:{results:unknown[]}[],start:number){validate(results[start].results[0] as Row|undefined);if(!results[start+1].results.length)throw new AppError(404,'Dieses Crewmitglied ist nicht mehr dabei.');}
 if(!match[2]&&method==='GET'){
  const before=url.searchParams.get('before'),after=url.searchParams.get('after');
  if(before!==null&&after!==null)throw new AppError(400,'Bitte lade das Gespräch erneut.');
  const cursor=before??after;
  const id=cursor===null?null:z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(cursor);
  const results=await repo.db.batch([
   repo.db.prepare(`SELECT ${messageColumns} FROM messages WHERE ${pair} AND ${both}${id!==null?` AND id${after!==null?'>':'<'}?`:''} ORDER BY id ${after!==null?'ASC':'DESC'} LIMIT ?`).bind(...pairValues,...bothValues,...(id!==null?[id]:[]),pageSize+1),
   ...liveStatements(),
  ]);
  validateBoth(results,1);
  const rows=results[0].results as Message[],more=rows.length>pageSize,items=rows.slice(0,pageSize);
  if(after===null)items.reverse();
  return json({...scope,items,olderCursor:after===null&&more?items[0].id:null,hasMore:after!==null&&more} satisfies MessagePage);
 }
 if(!match[2]&&method==='POST'){
  const v=z.object({text:z.string().trim().min(1).max(MESSAGE_MAX_LENGTH).refine(s=>!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s)),requestKey:z.string().uuid()}).strict().parse(body);
  const results=await repo.db.batch([
   repo.db.prepare(`INSERT INTO messages(household_id,sender_id,recipient_id,text,created_at,request_key) SELECT ?,?,?,?,?,? WHERE ${both} AND (SELECT count(*) FROM messages WHERE sender_id=? AND created_at>=?)<20 ON CONFLICT(sender_id,request_key) DO NOTHING`).bind(house.id,viewer.id,contactId,v.text,now.toISOString(),v.requestKey,...bothValues,viewer.id,new Date(now.getTime()-60000).toISOString()),
   repo.db.prepare(`SELECT ${messageColumns},recipient_id AS recipientId FROM messages WHERE sender_id=? AND request_key=? AND ${both}`).bind(viewer.id,v.requestKey,...bothValues),
   ...liveStatements(),
  ]);
  validateBoth(results,2);
  const saved=results[1].results[0] as (Message&{recipientId:string})|undefined;
  if(!saved)throw new AppError(429,'Du hast gerade viele Nachrichten gesendet. Warte kurz und versuche es erneut.');
  if(saved.recipientId!==contactId||saved.text!==v.text)throw new AppError(409,'Diese Nachricht wurde bereits mit anderem Inhalt gesendet. Bitte öffne das Gespräch erneut.');
  const {recipientId:_,...item}=saved;
  return json({...scope,item},results[0].meta.changes===1?201:200);
 }
 if(match[2]&&method==='POST'){
  const {through}=z.object({through:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)}).strict().parse(body);
  const results=await repo.db.batch([
   repo.db.prepare(`UPDATE messages SET read_at=? WHERE household_id=? AND sender_id=? AND recipient_id=? AND id<=? AND read_at IS NULL AND ${both} AND EXISTS (SELECT 1 FROM messages seen WHERE seen.id=? AND seen.household_id=? AND seen.sender_id=? AND seen.recipient_id=?)`).bind(now.toISOString(),house.id,contactId,viewer.id,through,...bothValues,through,house.id,contactId,viewer.id),
   ...liveStatements(),
  ]);
  validateBoth(results,1);
  return json({...scope,ok:true});
 }
 throw new AppError(404,'Diese Nachrichtenfunktion wurde nicht gefunden.');
}
