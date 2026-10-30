import type {DeviceData} from '../shared/offline';
const DB='putzonaut-device',STORE='local';
export function offlineEnabled(){try{return localStorage.getItem('putzonaut-offline')!=='off';}catch{return false;}}
export function offlineUnlocked(){try{return localStorage.getItem('putzonaut-offline-locked')!=='yes';}catch{return false;}}
export function lockOffline(){try{localStorage.setItem('putzonaut-offline-locked','yes');}catch{}}
export function unlockOffline(){try{localStorage.removeItem('putzonaut-offline-locked');}catch{}}
export function setOfflineEnabled(enabled:boolean){localStorage.setItem('putzonaut-offline',enabled?'on':'off');}
function open(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Auf diesem Gerät konnten keine Offline-Daten gespeichert werden.'));});}
// All updates are atomic across tabs. Never read outside the write transaction.
export async function deviceUpdate<T>(fn:(data:DeviceData|undefined)=>{data:DeviceData|undefined;result:T}):Promise<T>{
 const db=await open();return new Promise<T>((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),r=store.get('device');let result:T,error:unknown;
  r.onsuccess=()=>{try{const change=fn(r.result?.version===1?r.result:undefined);result=change.result;if(change.data)store.put(change.data,'device');else store.delete('device');}catch(e){error=e;tx.abort();}};
  tx.oncomplete=()=>{db.close();resolve(result);};tx.onabort=tx.onerror=()=>{db.close();reject(error??new Error('Die Vormerkung konnte auf diesem Gerät nicht gespeichert werden.'));};
 });
}
export async function readDevice(){const db=await open();return new Promise<DeviceData|undefined>((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get('device');r.onsuccess=()=>resolve(r.result?.version===1?r.result:undefined);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
export const clearDevice=()=>deviceUpdate(()=>({data:undefined,result:undefined}));
