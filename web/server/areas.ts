import {z} from 'zod';
import {admin,AppError} from './domain.ts';
import type {Household,Member} from './domain.ts';
import {AREA_ICONS,ensureAreas} from '../shared/workspace.ts';
const areaSchema=z.object({name:z.string().trim().min(1).max(40),icon:z.enum(AREA_ICONS)});
const comparable=(name:string)=>name.normalize('NFKC').toLocaleLowerCase('de-DE');
export function areaChange(route:string,method:string,body:unknown,h:Household,user:Member){
 if(!/^\/areas(?:\/[^/]+)?$/.test(route))return null;
 admin(user);const areas=ensureAreas(h),id=route.split('/')[2];
 const existing=()=>{const a=areas.find(a=>a.id===id);if(!a)throw new AppError(404,'Diesen Bereich gibt es in eurer Crew nicht.');if(a.builtIn)throw new AppError(409,'Die vier Standardbereiche bleiben erhalten. Eigene Bereiche kannst du frei bearbeiten.');return a;};
 const values=()=>{const v=areaSchema.parse(body);if(areas.some(a=>a.id!==id&&comparable(a.name)===comparable(v.name)))throw new AppError(409,'Ein Bereich mit diesem Namen ist bereits vorhanden.');return v;};
 if(route==='/areas'&&method==='POST'){if(areas.length>=24)throw new AppError(409,'Ihr könnt bis zu 24 Bereiche verwenden.');const a={...values(),id:crypto.randomUUID()};areas.push(a);return {result:{id:a.id}};}
 if(id&&method==='PATCH'){const a=existing();Object.assign(a,values());for(const t of h.tasks)if(t.areaId===a.id)t.room=a.name;return {result:{ok:true}};}
 if(id&&method==='DELETE'){existing();if(h.tasks.some(t=>t.areaId===id))throw new AppError(409,'Verschiebe oder archiviere zuerst die Missionen in diesem Bereich.');h.areas=areas.filter(a=>a.id!==id);return {result:{ok:true}};}
 throw new AppError(404,'Diese Bereichsaktion gibt es nicht.');
}
