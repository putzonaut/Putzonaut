import {api} from './api.ts';

// Replaced at build time. The existing private Sites preview keeps its own login.
export const ownAccounts=import.meta.env?.VITE_PUTZONAUT_STANDALONE==='true';
export function safeAccountReturn(value:string|null){
 if(!value||value.length>3000||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/';
 try{const url=new URL(value,'https://putzonaut.invalid');return url.origin==='https://putzonaut.invalid'&&url.pathname==='/'?url.pathname+url.search+url.hash:'/';}catch{return '/';}
}
export function accountReturn(){
 return safeAccountReturn(location.pathname==='/'?location.pathname+location.search+location.hash:new URLSearchParams(location.search).get('weiter'));
}
export function accountPath(page:string){return `/konto/${page}?weiter=${encodeURIComponent(accountReturn())}`;}
export async function signOut(){
 if(ownAccounts){await api('/account/sign-out',{method:'POST',body:'{}'});location.assign('/');}
 else location.assign('/signout-with-chatgpt?return_to=/');
}
