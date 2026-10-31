import {addDays,weekday} from './planning.ts';

export function postponeDates(today:string){
 const tomorrow=addDays(today,1),day=weekday(today);
 return {tomorrow,weekend:day===6?tomorrow:addDays(today,(6-day+7)%7||7),maximum:addDays(today,365)};
}

export function updateBlockReason({offline,busy,dialog,round,queued}:{offline:boolean;busy:boolean;dialog:boolean;round:boolean;queued:number}){
 if(offline)return 'Zum Aktualisieren brauchst du eine Verbindung.';
 if(busy)return 'Deine Änderung wird noch gespeichert.';
 if(dialog)return 'Schließe zuerst die geöffnete Ansicht und speichere deine Eingaben.';
 if(round)return 'Beende zuerst deine Putzrunde. Du kannst sie bis dahin in Ruhe fortsetzen.';
 if(queued)return 'Gleiche zuerst deine vorgemerkten Abschlüsse ab.';
 return '';
}
export function newerVersion(current:string,value:unknown):string|null{
 if(!value||typeof value!=='object')return null;
 const v=value as {app?:unknown;version?:unknown};
 if(v.app!=='putzonaut'||typeof v.version!=='string'||!/^\d{1,5}\.\d{1,5}\.\d{1,5}$/.test(v.version))return null;
 const before=current.split('.').map(Number),after=v.version.split('.').map(Number);
 for(let i=0;i<3;i++){if(after[i]>before[i])return v.version;if(after[i]<before[i])return null;}
 return null;
}
