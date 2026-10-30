import {z} from 'zod';
import {admin,AppError,member,profile} from './domain.ts';
import type {Household,HistoryEvent} from './domain.ts';
import type {Repository,Row} from './repository.ts';
import {BACKUP_MAX_EVENTS,makeBackup,parseBackup,checkBackupCrew} from './backup-schema.ts';
import type {CrewBackup} from './backup-schema.ts';

type Capture={house:Household;history:HistoryEvent[];revision:number;at?:string};
const privateHeaders={'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:privateHeaders});
const download=(backup:CrewBackup)=>new Response(JSON.stringify(backup),{headers:{...privateHeaders,'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="putzonaut-sicherung-${backup.createdAt.slice(0,10)}.json"`}});

async function capture(repo:Repository,accountId:string,householdId:string,recovery=false):Promise<Capture>{
 // Both reads are in one D1 transaction. A completion can never land in just
 // one half of a backup (points vs. history).
 const a=recovery
  ? repo.db.prepare('SELECT b.household_id AS id,b.document,b.source_revision AS revision,b.created_at AS at,h.document AS live_document FROM crew_recovery b JOIN households h ON h.id=b.household_id JOIN memberships m ON m.household_id=b.household_id WHERE m.account_id=? AND b.household_id=?').bind(accountId,householdId)
  : repo.db.prepare('SELECT h.id,h.document,h.revision FROM households h JOIN memberships m ON m.household_id=h.id WHERE m.account_id=? AND h.id=?').bind(accountId,householdId);
 const b=recovery
  ? repo.db.prepare('SELECT payload FROM crew_recovery_events WHERE household_id=? ORDER BY event_id LIMIT ?').bind(householdId,BACKUP_MAX_EVENTS+1)
  : repo.db.prepare('SELECT payload FROM events WHERE household_id=? ORDER BY created_at,id LIMIT ?').bind(householdId,BACKUP_MAX_EVENTS+1);
 const result=await repo.db.batch<{id?:string;document?:string;revision?:number;at?:string;live_document?:string;payload?:string}>([a,b]);
 const row=result[0].results[0];
 if(row?.live_document)admin(member(JSON.parse(row.live_document) as Household,accountId));
 if(!row?.document)throw new AppError(404,recovery?'Es gibt noch keinen Stand vor einer Wiederherstellung.':'Diese Crew ist nicht mehr verfügbar.');
 if(result[1].results.length>BACKUP_MAX_EVENTS)throw new AppError(413,'Das Logbuch hat mehr als 10.000 Einträge. Bitte nutze eine Sicherung durch den Betreiber.');
 return {house:JSON.parse(row.document) as Household,history:result[1].results.map(r=>JSON.parse(r.payload!) as HistoryEvent),revision:row.revision!,at:row.at};
}
function summary(backup:CrewBackup,current:Row){
 return {createdAt:backup.createdAt,crewName:backup.payload.crew.name,memberCount:backup.payload.crew.members.filter(m=>!m.removedAt).length,taskCount:backup.payload.crew.tasks.length,rewardCount:backup.payload.crew.rewards.length,historyCount:backup.payload.history.length,expectedRevision:current.revision};
}
export async function backupRoute(route:string,method:string,body:unknown,repo:Repository,accountId:string,profileId:string|null,original:Row,now:Date):Promise<Response|null>{
 if(!route.startsWith('/backups'))return null;
 const live=await repo.forAccount(accountId);if(!live||live.id!==original.id)throw new AppError(409,'Deine Crew hat sich geändert. Bitte lade die App neu.');
 const current=JSON.parse(live.document) as Household;admin(profile(current,accountId,profileId));
 if(route==='/backups/status'&&method==='GET'){
  const saved=await repo.db.prepare('SELECT created_at FROM crew_recovery WHERE household_id=?').bind(current.id).first<{created_at:string}>();
  return json({recoveryAt:saved?.created_at??null});
 }
 if((route==='/backups'||route==='/backups/recovery')&&method==='GET'){
  const data=await capture(repo,accountId,current.id,route.endsWith('/recovery')); 
  // The current captain must still be authorised at the captured revision.
  if(!route.endsWith('/recovery'))admin(profile(data.house,accountId,profileId));
  const backup=await makeBackup(data.house,data.history,data.revision,data.at?new Date(data.at):now);
  return download(backup);
 }
 if((route==='/backups/preview'||route==='/backups/restore')&&method==='POST'){
  const request=z.object({backup:z.unknown(),expectedRevision:z.number().int().min(1).optional(),confirmation:z.string().optional()}).strict().parse(body);
  const backup=await parseBackup(request.backup);checkBackupCrew(backup,current);
  if(route.endsWith('/preview'))return json(summary(backup,live));
  if(request.confirmation!==current.name)throw new AppError(400,'Gib zur Bestätigung den aktuellen Namen eurer Crew ein.');
  if(request.expectedRevision!==live.revision)throw new AppError(409,'Seit der Vorschau hat sich eure Crew verändert. Bitte prüfe die Sicherung erneut.');
  // Never replace a current state whose automatic rollback file would exceed
  // the supported size or fail validation. CAS below also covers this read.
  const rollback=await capture(repo,accountId,current.id);
  if(rollback.revision!==live.revision)throw new AppError(409,'Seit der Vorschau hat sich eure Crew verändert. Bitte prüfe die Sicherung erneut.');
  await makeBackup(rollback.house,rollback.history,rollback.revision,now);
  await restore(repo,current,live,backup,accountId,now);
  return json({ok:true});
 }
 throw new AppError(404,'Diese Sicherungsaktion wurde nicht gefunden.');
}

async function restore(repo:Repository,current:Household,row:Row,backup:CrewBackup,accountId:string,now:Date){
 const mutation=crypto.randomUUID();
 const actor=member(current,accountId);admin(actor);
 const restored:Household={...backup.payload.crew,
  members:backup.payload.crew.members.map(m=>({...m,accountId:current.members.find(c=>c.id===m.id)!.accountId})),
  invites:[],closedAt:null,lastMutation:mutation,restoreEpoch:crypto.randomUUID(),
 };
 // Make all pre-restore completion/checklist requests stale as a second guard.
 for(const t of restored.tasks)t.checklistVersion=Math.max(t.checklistVersion??0,current.tasks.find(c=>c.id===t.id)?.checklistVersion??0)+1;
 const document=JSON.stringify(restored);if(new TextEncoder().encode(document).length>900_000)throw new AppError(413,'Diese Sicherung enthält zu viele Crew-Daten.');
 const e:HistoryEvent={id:crypto.randomUUID(),kind:'restore',userId:actor.id,name:actor.name,title:`Crewstand vom ${backup.createdAt.slice(0,10)} wiederhergestellt`,createdAt:now.toISOString()};
 const guard="EXISTS (SELECT 1 FROM households WHERE id=? AND revision=? AND json_extract(document,'$.lastMutation')=?)";
 const guarded=(sql:string,values:(string|number)[]=[])=>repo.db.prepare(sql).bind(...values,current.id,row.revision+1,mutation);
 const statements=[
  repo.db.prepare('UPDATE households SET document=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(document,now.toISOString(),current.id,row.revision),
  guarded(`INSERT INTO crew_recovery(household_id,document,source_revision,created_at) SELECT ?,?,?,? WHERE ${guard} ON CONFLICT(household_id) DO UPDATE SET document=excluded.document,source_revision=excluded.source_revision,created_at=excluded.created_at`,[current.id,row.document,row.revision,now.toISOString()]),
  guarded(`DELETE FROM crew_recovery_events WHERE household_id=? AND ${guard}`,[current.id]),
  guarded(`INSERT INTO crew_recovery_events(household_id,event_id,payload) SELECT household_id,id,payload FROM events WHERE household_id=? AND ${guard}`,[current.id]),
  guarded(`DELETE FROM events WHERE household_id=? AND ${guard}`,[current.id]),
 ];
 // Bounded JSON chunks keep every bound value well below D1's per-value limit;
 // one batch transaction makes the safety snapshot and restoration atomic.
 const events=[...backup.payload.history,e];let chunk:HistoryEvent[]=[];let bytes=0;
 const flush=()=>{if(!chunk.length)return;statements.push(guarded(`INSERT INTO events(id,household_id,member_id,kind,created_at,request_key,payload) SELECT json_extract(value,'$.id'),?,json_extract(value,'$.userId'),json_extract(value,'$.kind'),json_extract(value,'$.createdAt'),json_extract(value,'$.requestKey'),value FROM json_each(?) WHERE ${guard}`,[current.id,JSON.stringify(chunk)]));chunk=[];bytes=0;};
 for(const item of events){const size=new TextEncoder().encode(JSON.stringify(item)).length;if(chunk.length>=200||bytes+size>180_000)flush();chunk.push(item);bytes+=size;}flush();
 const result=await repo.db.batch(statements);
 if(result[0].meta.changes!==1)throw new AppError(409,'Während der Wiederherstellung wurde eure Crew geändert. Nichts wurde ersetzt; bitte prüfe die Sicherung erneut.');
}
