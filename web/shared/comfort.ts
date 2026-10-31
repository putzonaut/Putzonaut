import {addDays,localDay} from './planning.ts';
import {suggestedPoints,SPECIAL_BADGES} from './game.ts';
import type {TaskDraft} from '../src/types.ts';
import type {Area} from './workspace.ts';

export type DurationSample={eventId:string;roundId:string;userId:string;minutes:number;rating:-1|0|1;at:string};
export type Trophy={memberId:string;achievementId:string};
export function durationSuggestion(t:{minutes:number;durationSamples?:DurationSample[];durationDismissed?:string}){
 const samples=(t.durationSamples??[]).filter(s=>s.minutes===t.minutes);
 const rounds=new Map<string,number[]>();for(const s of samples)rounds.set(s.roundId,[...(rounds.get(s.roundId)??[]),s.rating]);
 if(rounds.size<3)return null;
 const ratings=[...rounds.values()].map(a=>a.reduce((n,x)=>n+x,0)/a.length).sort((a,b)=>a-b);
 const direction=Math.sign(ratings[Math.floor(ratings.length/2)]);
 const minutes=Math.max(1,Math.min(180,t.minutes+direction*Math.max(1,Math.round(t.minutes*.25))));
 const key=samples.map(s=>s.eventId).sort().join(':');
 return direction&&minutes!==t.minutes&&t.durationDismissed!==key?{minutes,key,rounds:rounds.size}:null;
}
export function trophyView(h:{trophies?:Trophy[];members:{id:string;name:string;removedAt?:string|null;achievements?:string[]}[]}){
 const choices=h.members.filter(m=>!m.removedAt).flatMap(m=>SPECIAL_BADGES.filter(b=>m.achievements?.includes(b.id)).map(b=>({memberId:m.id,memberName:m.name,achievementId:b.id,name:b.name})));
 return {choices,selected:(h.trophies??[]).flatMap(t=>{const found=choices.find(c=>c.memberId===t.memberId&&c.achievementId===t.achievementId);return found?[found]:[];})};
}
/** Small explicit grammar; unsupported wording stays visible for human review. */
export function sentenceDraft(input:string,areas:Area[],today=localDay(new Date())):{draft:TaskDraft;notes:string[]}{
 let title=input.trim();const notes:string[]=[];let minutes=10;let cadence='once';let dueDate:string|null=null;let schedule:TaskDraft['schedule']={startDate:today};
 const strip=(match:RegExpMatchArray|null)=>{if(match)title=title.replace(match[0],' ');};
 const duration=title.match(/\b(\d{1,4})\s*(?:Minuten|Minute|Min\.?)(?=$|[\s,;])/i);
 if(duration){const n=Number(duration[1]);if(n>=1&&n<=180){minutes=n;strip(duration);}else notes.push('Die Dauer muss zwischen 1 und 180 Minuten liegen.');}
 const after=title.match(/\b(\d{1,3})\s*Tage?\s*nach\s*(?:der\s+)?(?:Erledigung|Abschluss)\b/i);
 if(after&&Number(after[1])>=1&&Number(after[1])<=365){cadence='after';schedule.intervalDays=Number(after[1]);strip(after);}
 else {
  const weekly=title.match(/\balle\s+(\d{1,2})\s*Wochen\b/i),monthly=title.match(/\bmonatlich\s+am\s+(\d{1,2})\.?/i);
  const weekdays=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
  const day=title.match(/\b(?:jeden|immer)\s+((?:(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)(?:\s*(?:und|&)\s*)?)+)/i);
  if(day){cadence='weekdays';schedule.weekdays=weekdays.flatMap((name,i)=>new RegExp(name,'i').test(day[1])?[i+1]:[]);strip(day);}
  else if(weekly&&Number(weekly[1])>=1&&Number(weekly[1])<=12){cadence='interval';schedule.intervalWeeks=Number(weekly[1]);strip(weekly);}
  else if(monthly&&Number(monthly[1])>=1&&Number(monthly[1])<=31){cadence='monthly';schedule.monthDay=Number(monthly[1]);strip(monthly);}
  else {const daily=title.match(/\b(?:täglich|jeden Tag)\b/i),week=title.match(/\b(?:wöchentlich|jede Woche)\b/i);if(daily){cadence='daily';strip(daily);}else if(week){cadence='weekly';strip(week);}}
 }
 const date=title.match(/\b(?:heute|morgen|übermorgen)\b/i);if(date){const d=addDays(today,date[0].toLocaleLowerCase('de')==='heute'?0:date[0].toLocaleLowerCase('de')==='morgen'?1:2);schedule.startDate=d;if(cadence==='once')dueDate=d;strip(date);}
 title=title.replace(/^[\s,;–-]+|[\s,;–-]+$/g,'').replace(/\s*[,;]\s*[,;]\s*/g,', ').replace(/\s{2,}/g,' ');
 if(!duration)notes.push('10 Minuten sind vorgeschlagen. Du kannst die Dauer ändern.');
 if(cadence==='once')notes.push('Als einmalige Mission vorbereitet. Prüfe bei Bedarf den Rhythmus.');
 let icon='sparkles',category:TaskDraft['category']='tidy';
 if(/saug|staub/i.test(title))icon='vacuum';
 else if(/wäsche|bettwäsche|bügel/i.test(title)){icon='laundry';category='laundry';}
 else if(/geschirr|spül|küche/i.test(title)){icon='dishes';category='kitchen';}
 else if(/pflanz|gieß/i.test(title)){icon='plant';category='plants';}
 else if(/toilette|waschbecken|bad\b/i.test(title)){icon='bath';category='bath';}
 else if(/müll|abfall/i.test(title)){icon='trash';category='household';}
 const area=areas.find(a=>title.toLocaleLowerCase('de').includes(a.name.toLocaleLowerCase('de')))||areas.find(a=>a.id==='household')||areas[0];
 return {draft:{title,minutes,cadence,schedule,dueDate,areaId:area?.id,room:area?.name??'Haushalt',icon,category,difficulty:'normal',...suggestedPoints(minutes,'normal')},notes};
}
