import {useCallback,useEffect,useRef,useState} from 'react';
import {appendIntent,cacheSnapshot,completionBody,draftKey,intentFor,replayProblem,sameDeviceScope} from '../shared/offline';
import type {CompletionIntent,DeviceData} from '../shared/offline';
import type {State,Task} from './types';
import {clearDevice,deviceUpdate,offlineEnabled,offlineUnlocked,lockOffline,unlockOffline,readDevice,setOfflineEnabled} from './offline-store';
import {api,ApiError} from './api';
import {createRequestId} from './id';

export function useOffline(){
 const [data,setData]=useState<DeviceData>();const [enabled,setEnabled]=useState(offlineEnabled);const [ready,setReady]=useState(false);const [problem,setProblem]=useState('');const syncing=useRef(false);
 const read=useCallback(async()=>{try{const d=await readDevice();setData(d);return d;}catch(e){setProblem((e as Error).message);}},[]);
 useEffect(()=>{void read();const refresh=()=>{if(document.visibilityState==='visible')void read();};window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[read]);
 const save=useCallback(async(s:State)=>{if(!offlineEnabled())return;try{const d=await deviceUpdate(old=>{const data=cacheSnapshot(old,s);return {data,result:data};});setData(d);unlockOffline();setProblem('');}catch(e){setProblem((e as Error).message);}},[]);
 const forget=useCallback(async()=>{await clearDevice();setData(undefined);},[]);
 const clear=useCallback(async()=>{setOfflineEnabled(false);setEnabled(false);await clearDevice();setData(undefined);setReady(false);},[]);
 const enable=async(s:State)=>{setOfflineEnabled(true);setEnabled(true);await save(s);};
 useEffect(()=>{
  if(!enabled||!data)return;if(!('serviceWorker' in navigator)){setProblem('Dieser Browser unterstützt den Offline-Start hier nicht. Vormerkungen in der geöffneten App bleiben möglich.');return;}
  let active=true;void navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(async()=>{await navigator.serviceWorker.ready;const response=await caches.match('/offline/index.html');if(active)setReady(!!response);}).catch(()=>{if(active)setProblem('Der Offline-Start konnte noch nicht vorbereitet werden. Öffne die App einmal mit Internet.');});
  return()=>{active=false;};
 },[enabled,!!data]);
 const queue=async(s:State,t:Task,checked:string[])=>{
  if(!offlineEnabled())throw new Error('Aktiviere zuerst „Offline auf diesem Gerät“ im Profil.');
  const intent=intentFor(s,t,checked,createRequestId());
  const result=await deviceUpdate(old=>{if(!old)throw new Error('Öffne die App zuerst einmal mit Internet, damit sie den Crewstand speichern kann.');const q=appendIntent(old,intent);return {data:old,result:{q,data:old}};});setData(result.data);return result.q;
 };
 const remove=async(key:string)=>{await deviceUpdate(d=>{if(d)d.queue=d.queue.filter(q=>q.requestKey!==key);return {data:d,result:undefined};});await read();};
 const mark=async(q:CompletionIntent,error:string)=>{await deviceUpdate(d=>{const item=d?.queue.find(i=>i.requestKey===q.requestKey);if(item){item.status='conflict';item.error=error;}return {data:d,result:undefined};});await read();};
 const checked=(s:State,t:Task)=>data&&sameDeviceScope(data.snapshot,s)&&data.snapshot.restoreEpoch===s.restoreEpoch?data.drafts[draftKey(s,t)]??t.checklist?.doneIds??[]:t.checklist?.doneIds??[];
 const step=async(s:State,t:Task,id:string,done:boolean)=>{if(!offlineEnabled())throw new Error('Aktiviere zuerst „Offline auf diesem Gerät“ im Profil.');await deviceUpdate(d=>{if(!d||!sameDeviceScope(d.snapshot,s)||d.snapshot.restoreEpoch!==s.restoreEpoch)throw new Error('Der Offline-Stand ist nicht mehr aktuell. Bitte öffne die App mit Internet.');const key=draftKey(s,t),ids=new Set(d.drafts[key]??t.checklist?.doneIds??[]);if(done)ids.add(id);else ids.delete(id);d.drafts[key]=[...ids];return {data:d,result:undefined};});await read();};
 const send=async(q:CompletionIntent,s:State)=>{
  const issue=replayProblem(q,s);if(issue)throw new ApiError(409,issue);
  return api<any>(`/tasks/${q.taskId}/complete`,{method:'POST',headers:{'X-Putzonaut-Viewer':q.viewerId,'X-Putzonaut-Household':q.householdId,'X-Putzonaut-Epoch':q.restoreEpoch,'X-Putzonaut-Profile':q.profileId},body:JSON.stringify(completionBody(q))});
 };
 const submit=async(q:CompletionIntent,s:State)=>{try{const result=await send(q,s);await remove(q.requestKey);return result;}catch(e){if(e instanceof ApiError&&e.status>0&&e.status<500)await mark(q,e.message);throw e;}};
 const flush=async(s:State)=>{
  if(syncing.current||!navigator.onLine||document.visibilityState!=='visible')return 0;syncing.current=true;let count=0;
  try{const d=await readDevice();for(const q of d?.queue??[]){if(q.status!=='pending')continue;const issue=replayProblem(q,s);if(issue){await mark(q,issue);continue;}try{await submit(q,s);count++;}catch(e){if(!(e instanceof ApiError)||e.status===0||e.status>=500)break;}}return count;}
  finally{syncing.current=false;}
 };
 return {data,enabled,ready,problem,unlocked:offlineUnlocked,lock:lockOffline,read,save,clear,forget,enable,queue,remove,checked,step,submit,flush};
}
