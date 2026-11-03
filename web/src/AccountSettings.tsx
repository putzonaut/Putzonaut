'use client';
import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import {ArrowLeft,Mail,ShieldCheck,Trash2} from 'lucide-react';
import {clearDevice,lockOffline,readDevice,setOfflineEnabled} from './offline-store';
import {clearTaskDrafts} from './task-draft-store';
import {clearViewMemory} from './view-memory';

type Account={email:string;canDelete:boolean;crewName:string|null};
const messages:Record<string,string>={INVALID_PASSWORD:'Das aktuelle Passwort stimmt nicht.',INVALID_ACCOUNT_CONFIRMATION:'Prüfe Passwort und Bestätigung.',INVALID_EMAIL:'Bitte gib eine gültige E-Mail-Adresse ein.',UNAUTHORIZED:'Bitte melde dich erneut an.',SESSION_EXPIRED:'Bitte melde dich erneut an.'};
async function request<T>(path:string,body?:unknown):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/account/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});}
 catch{throw new Error('Keine Verbindung. Versuche es erneut, sobald du online bist.');}
 const data=await response.json() as {code?:string;error?:string;message?:string};
 if(!response.ok)throw new Error(response.status===429?'Zu viele Versuche. Warte bitte einige Minuten.':messages[data.code??'']??data.error??(data.code==='CREW_MEMBERSHIP_EXISTS'?data.message:'Das hat gerade nicht geklappt. Bitte versuche es erneut.'));
 return data as T;
}
export async function clearAccountDevice(){
 lockOffline();setOfflineEnabled(false);await clearDevice();clearTaskDrafts();clearViewMemory();
 if('serviceWorker' in navigator){const registration=await navigator.serviceWorker.getRegistration('/');const sub=await registration?.pushManager.getSubscription();await sub?.unsubscribe().catch(()=>false);}
 // Other tabs on this device must stop displaying the former account's crew.
 try{localStorage.setItem('putzonaut-account-closed',String(Date.now()));}catch{}
}
export default function AccountSettings(){
 const [account,setAccount]=useState<Account>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[deletionPassword,setDeletionPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[acknowledged,setAcknowledged]=useState(false);
 const [queued,setQueued]=useState(0),[deleted,setDeleted]=useState(false);
 useEffect(()=>{let alive=true;void request<Account>('manage').then(value=>{if(alive)setAccount(value);}).catch(e=>{if(alive)setError(e.message);});void readDevice().then(value=>{if(alive)setQueued(value?.queue.length??0);}).catch(()=>{});return()=>{alive=false;};},[]);
 async function changeEmail(event:FormEvent){
  event.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
  try{
   if(email.trim().toLowerCase()===account?.email.toLowerCase())throw new Error('Trage eine andere E-Mail-Adresse ein.');
   await request('change-email',{newEmail:email.trim(),password,callbackURL:location.origin+'/konto/email-bestaetigt'});
   setPassword('');setMessage('Wenn die neue Adresse verfügbar ist, erhält sie einen Bestätigungslink. Bis zur Bestätigung bleibt die bisherige Adresse gültig. Danach meldest du dich auf deinen Geräten mit der neuen Adresse an.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function finishDeletion(){
  try{await clearAccountDevice();location.replace('/konto/geloescht');}
  catch{setError('Dein Konto ist gelöscht. Die lokalen Daten konnten noch nicht vollständig entfernt werden. Versuche die Bereinigung erneut.');}
 }
 async function deleteAccount(event:FormEvent){
  event.preventDefault();if(busy||!acknowledged)return;setBusy(true);setError('');setMessage('');
  try{await request('delete-user',{password:deletionPassword,confirmation});setDeletionPassword('');setDeleted(true);await finishDeletion();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="account-settings" aria-labelledby="manage-heading">
  <a className="text-button" href="/"><ArrowLeft size={17}/>Zur App</a><h1 id="manage-heading">Dein Konto</h1><p>Anmeldung und Sicherheit an einem Ort.</p>
  {error&&<p className="form-error" role="alert">{error}</p>}
  {deleted?<button className="button primary" onClick={()=>void finishDeletion()}>Lokale Daten entfernen</button>:!account?<p role="status">{error?<a href="/konto/anmelden">Zur Anmeldung</a>:'Konto wird geladen …'}</p>:<>
   <div className="account-current"><ShieldCheck size={23}/><div><small>Angemeldet mit</small><strong>{account.email}</strong></div></div>
   <details className="account-setting"><summary><Mail size={20}/>Login-E-Mail ändern</summary>
    <p>Deine Crew, Sterne und Erfolge bleiben erhalten. Die neue Adresse gilt erst nach Bestätigung per E-Mail.</p>
    <form onSubmit={changeEmail}><fieldset disabled={busy}>
     <label>Neue E-Mail-Adresse<input type="email" name="new-email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
     <label>Aktuelles Passwort<input type="password" name="current-password" autoComplete="current-password" required maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <button className="button primary" type="submit">{busy?'Einen Moment …':'Bestätigungslink senden'}</button>
    </fieldset></form>{message&&<p className="account-message" role="status">{message}</p>}
   </details>
   <details className="account-setting account-danger"><summary><Trash2 size={20}/>Konto löschen</summary>
    <p>Dein Zugang, Passwort und alle Anmeldungen werden dauerhaft gelöscht. Gemeinsame Crew-Inhalte und bisherige Logbucheinträge bleiben bestehen.</p>
    {!account.canDelete?<><p>Du gehörst noch zu „{account.crewName}“. Verlasse zuerst die Crew. Als Captain überträgst du vorher die Rolle oder schließt die Crew. Übertrage auch die Begleitung deiner Kinderprofile.</p><a className="button secondary" href="/?konto=crew">Zur Crew-Verwaltung</a></>:<form onSubmit={deleteAccount}><fieldset disabled={busy}>
     <label>Aktuelles Passwort<input type="password" name="delete-password" autoComplete="current-password" required maxLength={128} value={deletionPassword} onChange={e=>setDeletionPassword(e.target.value)}/></label>
     <label>Zur Bestätigung: KONTO LÖSCHEN<input name="confirmation" autoComplete="off" required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
     <label className="checkbox-label"><input type="checkbox" required checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/><span>Ich möchte mein Konto dauerhaft löschen und die lokalen Daten auf diesem Gerät entfernen.{queued>0&&<small>Dabei werden auch {queued} noch nicht abgeglichene Abschlüsse verworfen.</small>}</span></label>
     <button className="button danger" type="submit" disabled={confirmation!=='KONTO LÖSCHEN'||!acknowledged}>{busy?'Wird gelöscht …':'Konto endgültig löschen'}</button>
    </fieldset></form>}
   </details>
  </>}
 </section>;
}
