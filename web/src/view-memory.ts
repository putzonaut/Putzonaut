import {useState} from 'react';
import type {SetStateAction} from 'react';
const PREFIX='putzonaut.view.v1:';
const memory=new Map<string,unknown>();
export const viewKey=(scope:string,slot:string)=>PREFIX+JSON.stringify([scope,slot]);
export function readView<T>(scope:string,slot:string,fallback:T,parse:(v:unknown)=>T):T{
 const key=viewKey(scope,slot);try{const raw=sessionStorage.getItem(key);if(raw&&raw.length<30000)return parse(JSON.parse(raw));}catch{/* Memory fallback works when browser storage is unavailable. */}
 return memory.has(key)?parse(memory.get(key)):fallback;
}
export function writeView(scope:string,slot:string,value:unknown){const key=viewKey(scope,slot);memory.set(key,value);try{sessionStorage.setItem(key,JSON.stringify(value));}catch{/* Retain this session's in-memory view. */}}
export function clearViewMemory(){memory.clear();try{for(const key of Object.keys(sessionStorage))if(key.startsWith(PREFIX))sessionStorage.removeItem(key);}catch{}}
export function useViewState<T>(scope:string,slot:string,fallback:T,parse:(v:unknown)=>T){
 const key=viewKey(scope,slot);const [saved,setSaved]=useState(()=>({key,value:readView(scope,slot,fallback,parse)}));
 const value=saved.key===key?saved.value:readView(scope,slot,fallback,parse);
 const setValue=(update:SetStateAction<T>)=>{const next=typeof update==='function'?(update as (old:T)=>T)(value):update;writeView(scope,slot,next);setSaved({key,value:next});};
 return [value,setValue] as const;
}
