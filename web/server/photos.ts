import {z} from 'zod';
import {AppError,admin,profile} from './domain.ts';
import type {Household} from './domain.ts';
import type {Repository} from './repository.ts';
export type PhotoBucket={
 get(key:string):Promise<{size:number;httpMetadata?:{contentType?:string};arrayBuffer():Promise<ArrayBuffer>}|null>;
 head(key:string):Promise<unknown>;
 put(key:string,value:Uint8Array,options:{httpMetadata:{contentType:string}}):Promise<unknown>;
 list(options:{prefix:string;limit:number}):Promise<{objects:unknown[];truncated:boolean}>;
 delete(key:string):Promise<void>;
};
const MAX=256*1024;
export function photoBytes(value:unknown){
 const v=z.object({data:z.string().max(350000),mime:z.enum(['image/jpeg','image/png','image/webp']),version:z.number().int().min(0)}).strict().parse(value);
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(v.data))throw new AppError(400,'Das Foto konnte nicht gelesen werden.');
 const raw=atob(v.data);if(raw.length>MAX||raw.length<12)throw new AppError(413,'Bitte wähle ein kleineres Foto.');
 const b=Uint8Array.from(raw,c=>c.charCodeAt(0));
 const valid=v.mime==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:v.mime==='image/png'?b.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
 if(!valid)throw new AppError(400,'Bitte wähle ein JPEG-, PNG- oder WebP-Foto.');
 return {...v,bytes:b};
}
export async function photoRoute(route:string,method:string,body:unknown,h:Household,accountId:string,profileId:string|null,repo:Repository,bucket:PhotoBucket|undefined,now:Date){
 const read=route.match(/^\/knowledge-photos\/([0-9a-f-]{36})$/),write=route.match(/^\/tasks\/([^/]+)\/photo$/);
 if(!read&&!write)return null;
 if(!bucket)throw new AppError(503,'Fotos sind gerade nicht erreichbar. Deine Notiz kannst du weiterhin speichern.');
 const key=(id:string)=>`knowledge/${h.id}/${id}`;
 if(read&&method==='GET'){
  // Every image requires membership in this exact crew; no public object URLs.
  if(!h.tasks.some(t=>t.knowledgePhoto===read[1]))throw new AppError(404,'Dieses Foto ist nicht mehr an einer Mission hinterlegt.');
  const obj=await bucket.get(key(read[1]));if(!obj)throw new AppError(404,'Dieses Foto ist nicht mehr verfügbar.');
  if(obj.size>MAX)throw new AppError(413,'Dieses Foto ist zu groß.');
  return new Response(await obj.arrayBuffer(),{headers:{'Content-Type':obj.httpMetadata?.contentType??'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }
 if(!write||!['POST','DELETE'].includes(method))throw new AppError(405,'Diese Fotoaktion gibt es nicht.');
 admin(profile(h,accountId,profileId));const task=h.tasks.find(t=>t.id===write[1]);if(!task)throw new AppError(404,'Diese Mission gibt es nicht mehr.');
 const upload=method==='POST'?photoBytes(body):null;
 const value=upload??z.object({version:z.number().int().min(0)}).strict().parse(body);
 let id:string|undefined;
 if(upload){
  const files=await bucket.list({prefix:`knowledge/${h.id}/`,limit:600});
  if(files.objects.length>=600||files.truncated)throw new AppError(409,'Das Fotolimit dieser Crew ist erreicht. Notizen bleiben verfügbar.');
  id=crypto.randomUUID();await bucket.put(key(id),upload.bytes,{httpMetadata:{contentType:upload.mime}});
 }
 try{await repo.mutate(accountId,now,house=>{admin(profile(house,accountId,profileId));const t=house.tasks.find(t=>t.id===task.id);if(!t||value.version!==(t.revision??0))throw new AppError(409,'Die Mission wurde verändert. Bitte öffne sie erneut.');if(id)t.knowledgePhoto=id;else delete t.knowledgePhoto;t.revision=(t.revision??0)+1;return {result:null};},{householdId:h.id,memberId:h.members.find(m=>m.accountId===accountId)!.id,restoreEpoch:h.restoreEpoch});}
 catch(error){if(id)await bucket.delete(key(id));throw error;}
 // Immutable previous photos remain available to this crew's backup restore.
 return Response.json({ok:true},{headers:{'Cache-Control':'private, no-store'}});
}
