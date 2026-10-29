import type { D1Database } from '@cloudflare/workers-types';
import { AppError, member, normalize } from './domain.ts';
import type { Household, HistoryEvent } from './domain.ts';
export type Database=Pick<D1Database,'prepare'|'batch'>;
export type Row={id:string;document:string;revision:number};
export class Repository{
 readonly db:Database;
 constructor(db:Database){this.db=db;}
 async forAccount(accountId:string){return this.db.prepare('SELECT h.id,h.document,h.revision FROM households h JOIN memberships m ON m.household_id=h.id WHERE m.account_id=?').bind(accountId).first<Row>();}
 async byId(id:string){return this.db.prepare('SELECT id,document,revision FROM households WHERE id=?').bind(id).first<Row>();}
 async history(householdId:string,offset=0,limit=50){const r=await this.db.prepare("SELECT e.payload, r.id AS reversal FROM events e LEFT JOIN events r ON r.member_id=e.member_id AND r.request_key='undo:'||e.id WHERE e.household_id=? ORDER BY e.created_at DESC,e.id DESC LIMIT ? OFFSET ?").bind(householdId,limit,offset).all<{payload:string;reversal:string|null}>();return r.results.map(r=>({...JSON.parse(r.payload),reversed:!!r.reversal}) as HistoryEvent);}
 async eventById(householdId:string,id:string){const row=await this.db.prepare('SELECT payload FROM events WHERE household_id=? AND id=?').bind(householdId,id).first<{payload:string}>();return row?JSON.parse(row.payload) as HistoryEvent:null;}
 async existingRequest(memberId:string,key:string){const row=await this.db.prepare('SELECT payload FROM events WHERE member_id=? AND request_key=?').bind(memberId,key).first<{payload:string}>();return row?JSON.parse(row.payload) as HistoryEvent:null;}
 async create(h:Household){const m=h.members[0];const accountId=m.accountId;if(!accountId)throw new AppError(400,'Eine Crew braucht ein Mitglied mit eigenem Konto.');try{await this.db.batch([this.db.prepare('INSERT INTO households(id,document,revision,updated_at) VALUES(?,?,1,?)').bind(h.id,JSON.stringify(h),h.createdAt),this.db.prepare('INSERT INTO memberships(account_id,household_id,member_id) VALUES(?,?,?)').bind(m.accountId,h.id,m.id)]);}catch(e){if(await this.forAccount(accountId))throw new AppError(409,'Du hast bereits eine Crew. Bitte lade die Seite neu.');throw e;}}
 async mutate<T>(accountId:string,now:Date,fn:(h:Household)=>{result:T;event?:HistoryEvent;removeAccounts?:string[]}|Promise<{result:T;event?:HistoryEvent;removeAccounts?:string[]}>, expected?:{householdId:string;memberId:string}){
  const mutationId=crypto.randomUUID();
  for(let attempt=0;attempt<8;attempt++){
   const row=await this.forAccount(accountId);if(!row)throw new AppError(404,'Richte zuerst deine Crew ein.');
   const h=JSON.parse(row.document) as Household;const actor=member(h,accountId);
   expected??={householdId:h.id,memberId:actor.id};
   if(h.id!==expected.householdId||actor.id!==expected.memberId)throw new AppError(409,'Deine Crew-Mitgliedschaft hat sich geändert. Bitte lade die Seite neu.');
   normalize(h,now);const change=await fn(h);h.lastMutation=mutationId;
   const document=JSON.stringify(h);if(new TextEncoder().encode(document).length>900_000)throw new AppError(409,'Die Crew enthält sehr viele Einträge. Bitte archiviere ältere Aufgaben.');
   const update=this.db.prepare('UPDATE households SET document=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(document,now.toISOString(),row.id,row.revision);
   const statements=[update];
   if(change.event){const e=change.event;statements.push(this.db.prepare("INSERT INTO events(id,household_id,member_id,kind,created_at,request_key,payload) SELECT ?,?,?,?,?,?,? FROM households WHERE id=? AND revision=? AND json_extract(document,'$.lastMutation')=?").bind(e.id,h.id,e.userId,e.kind,e.createdAt,e.requestKey??null,JSON.stringify(e),h.id,row.revision+1,mutationId));}
   for(const removed of change.removeAccounts??[]){statements.push(this.db.prepare("DELETE FROM memberships WHERE account_id=? AND household_id=? AND EXISTS (SELECT 1 FROM households WHERE id=? AND revision=? AND json_extract(document,'$.lastMutation')=?)").bind(removed,h.id,h.id,row.revision+1,mutationId));}
   const results=await this.db.batch(statements);if(results[0].meta.changes===1)return change.result;
  }
  throw new AppError(409,'Deine Crew war gleichzeitig aktiv. Bitte versuche es noch einmal.');
 }
 async join(householdId:string,accountId:string,now:Date,fn:(h:Household)=>string){
  if(await this.forAccount(accountId))throw new AppError(409,'Du gehörst bereits zu einer Crew.');
  const mutationId=crypto.randomUUID();
  for(let attempt=0;attempt<8;attempt++){
   const row=await this.byId(householdId);if(!row)throw new AppError(410,'Diese Einladung ist ungültig oder abgelaufen.');
   const h=JSON.parse(row.document) as Household;if(h.closedAt)throw new AppError(410,'Diese Crew ist geschlossen.');normalize(h,now);const memberId=fn(h);h.lastMutation=mutationId;
   try{const r=await this.db.batch([
    this.db.prepare('UPDATE households SET document=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(h),now.toISOString(),h.id,row.revision),
    this.db.prepare("INSERT INTO memberships(account_id,household_id,member_id) SELECT ?,?,? FROM households WHERE id=? AND revision=? AND json_extract(document,'$.lastMutation')=?").bind(accountId,h.id,memberId,h.id,row.revision+1,mutationId),
   ]);if(r[0].meta.changes===1&&r[1].meta.changes===1)return {ok:true};}catch(e){if(await this.forAccount(accountId))throw new AppError(409,'Du gehörst bereits zu einer Crew.');throw e;}
  }
  throw new AppError(409,'Bitte versuche den Beitritt noch einmal.');
 }
}
