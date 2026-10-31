import {newerVersion} from '../shared/flexibility.ts';

export async function fetchRelease(){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetch('/version.json',{cache:'no-store',signal:controller.signal});if(!response.ok||response.redirected)throw new Error();return await response.json() as unknown;}catch{throw new Error('Die neue Version ist gerade nicht erreichbar. Bitte versuche es später.');}finally{clearTimeout(timer);}
}
export async function applyAvailableUpdate(target:string,ports:{blocked:()=>string;latest:()=>Promise<unknown>;prepare:(version:string)=>Promise<void>;reload:()=>void}){
 const check=()=>{const reason=ports.blocked();if(reason)throw new Error(reason);};
 check();const latest=await ports.latest();check();
 if(newerVersion('0.0.0',latest)!==target)throw new Error('Der verfügbare Stand hat sich geändert. Bitte prüfe das Update erneut.');
 await ports.prepare(target);check();ports.reload();
}
function workerVersion(worker:ServiceWorker):Promise<string>{
 return new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();reject(new Error('Das Update ist noch nicht bereit. Bitte versuche es gleich noch einmal.'));},4000);
 channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data?.version??'');};worker.postMessage({type:'PUTZONAUT_VERSION'},[channel.port2]);});
}
function workerSettled(worker:ServiceWorker,ready:ServiceWorkerState[]){
 return new Promise<void>((resolve,reject)=>{const done=()=>{clearTimeout(timer);worker.removeEventListener('statechange',changed);};const changed=()=>{if(ready.includes(worker.state)){done();resolve();}else if(worker.state==='redundant'){done();reject(new Error('Das Update konnte nicht geladen werden. Bitte versuche es erneut.'));}};const timer=setTimeout(()=>{done();reject(new Error('Das Update braucht noch einen Moment. Bitte versuche es erneut.'));},15000);worker.addEventListener('statechange',changed);changed();});
}
export async function waitingRelease(){
 if(!('serviceWorker' in navigator))return null;
 const waiting=(await navigator.serviceWorker.getRegistration('/'))?.waiting;
 return waiting&&new URL(waiting.scriptURL).pathname==='/sw.js'?await workerVersion(waiting):null;
}
export async function prepareBrowserUpdate(version:string){
 if(!('serviceWorker' in navigator))return;
 const registration=await navigator.serviceWorker.getRegistration('/');if(!registration)return;
 const script=registration.active?.scriptURL??registration.waiting?.scriptURL??registration.installing?.scriptURL;
 if(!script||new URL(script).pathname!=='/sw.js')return;
 try{await registration.update();}catch{throw new Error('Das Update konnte gerade nicht geladen werden. Bitte versuche es später.');}
 if(registration.installing)await workerSettled(registration.installing,['installed','activated']);
 const waiting=registration.waiting;
 if(waiting){
  if(await workerVersion(waiting)!==version)throw new Error('Das Update wird noch vorbereitet. Bitte versuche es gleich erneut.');
  await new Promise<void>((resolve,reject)=>{const changed=()=>{clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',changed);resolve();};const timer=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',changed);reject(new Error('Das Update ist noch nicht bereit. Bitte versuche es erneut.'));},15000);navigator.serviceWorker.addEventListener('controllerchange',changed);waiting.postMessage({type:'PUTZONAUT_ACTIVATE',version});});
 }
 const active=registration.active;if(active&&active.state!=='activated')await workerSettled(active,['activated']);
 if(active&&await workerVersion(active)!==version)throw new Error('Das Update ist noch nicht vollständig bereit. Bitte versuche es erneut.');
}
