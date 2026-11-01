'use client';
import {useState} from 'react';
import type {FormEvent} from 'react';
import {ArrowRight,LoaderCircle,Mail,ShieldCheck,Sparkles} from 'lucide-react';
import {accountPath,accountReturn} from './account';

type Mode='anmelden'|'registrieren'|'passwort-vergessen'|'passwort-neu'|'bestaetigt';
const labels:Record<Mode,string>={anmelden:'Willkommen zurück.',registrieren:'Dein Putzonaut-Konto', 'passwort-vergessen':'Passwort vergessen?','passwort-neu':'Ein neues Passwort','bestaetigt':'E-Mail bestätigt.'};
const errors:Record<string,string>={
 INVALID_EMAIL_OR_PASSWORD:'E-Mail oder Passwort stimmt nicht.',
 EMAIL_NOT_VERIFIED:'Bitte bestätige zuerst deine E-Mail-Adresse. Unten kannst du den Link erneut anfordern.',
 PASSWORD_TOO_SHORT:'Dein Passwort braucht mindestens 12 Zeichen.',
 PASSWORD_TOO_LONG:'Dein Passwort darf höchstens 128 Zeichen lang sein.',
 INVALID_TOKEN:'Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.',
 TOKEN_EXPIRED:'Der Link ist abgelaufen. Fordere einen neuen an.',
 INVALID_EMAIL:'Bitte gib eine gültige E-Mail-Adresse ein.',
};
export function AccountForm({mode='anmelden',heading='h2'}:{mode?:Mode;heading?:'h1'|'h2'}){
 const Heading=heading;
 const [email,setEmail]=useState(''),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [remember,setRemember]=useState(false),[adult,setAdult]=useState(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const query=new URLSearchParams(location.search),token=query.get('token');
 const tokenError=!!query.get('error')||(mode==='passwort-neu'&&!token);
 async function request(path:string,body:Record<string,unknown>){
  let response:Response;try{response=await fetch('/api/account'+path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}catch{throw new Error('Keine Verbindung. Bitte versuche es erneut.');}
  const data=await response.json().catch(()=>null) as {code?:string}|null;
  if(!response.ok)throw new Error(response.status===429?'Zu viele Versuche. Bitte warte einige Minuten und versuche es erneut.':errors[data?.code??'']??'Das hat gerade nicht geklappt. Bitte versuche es erneut.');
 }
 async function submit(event:FormEvent){
  event.preventDefault();if(busy)return;setError('');setMessage('');
  if(['registrieren','passwort-neu'].includes(mode)&&password!==confirm){setError('Die beiden Passwörter stimmen noch nicht überein.');return;}
  setBusy(true);
  try{
   const callbackURL=location.origin+accountPath('bestaetigt');
   if(mode==='registrieren'){
    if(!adult)throw new Error('Das Konto wird von einem Erwachsenen angelegt.');
    await request('/sign-up/email',{name:name.trim(),email:email.trim(),password,callbackURL});
    setMessage('Prüfe deinen Posteingang und bestätige deine E-Mail-Adresse. Falls du bereits ein Konto hast, kannst du dich anmelden oder dein Passwort zurücksetzen.');setPassword('');setConfirm('');
   }else if(mode==='passwort-vergessen'){
    await request('/request-password-reset',{email:email.trim(),redirectTo:location.origin+accountPath('passwort-neu')});
    setMessage('Wenn zu dieser Adresse ein Konto gehört, bekommst du einen Link für ein neues Passwort. Schau auch im Spamordner nach.');
   }else if(mode==='passwort-neu'){
    if(!token)throw new Error('Bitte fordere einen neuen Link an.');
    await request('/reset-password',{token,newPassword:password});
    location.replace(accountPath('anmelden')+'&passwort=geaendert');return;
   }else{
    await request('/sign-in/email',{email:email.trim(),password,rememberMe:remember});
    location.assign(accountReturn());return;
   }
  }catch(error){setError((error as Error).message);}finally{setBusy(false);}
 }
 async function resend(){
  if(busy)return;if(!email.trim()){setError('Trage zuerst deine E-Mail-Adresse ein.');return;}
  setBusy(true);setError('');setMessage('');
  try{await request('/send-verification-email',{email:email.trim(),callbackURL:location.origin+accountPath('bestaetigt')});setMessage('Wenn eine Bestätigung aussteht, bekommst du einen neuen Link. Schau auch im Spamordner nach.');}
  catch(error){setError((error as Error).message);}finally{setBusy(false);}
 }
 const done=mode==='bestaetigt'&&!tokenError;
 return <section className="account-form" aria-labelledby="account-heading">
  <Heading id="account-heading">{tokenError?'Der Link ist nicht mehr gültig.':labels[mode]}</Heading>
  {done?<><p>Deine Adresse ist bestätigt. Jetzt kannst du dich anmelden und mit deiner Crew starten.</p><a className="button primary" href={accountPath('anmelden')}>Zur Anmeldung<ArrowRight size={18}/></a></>:
   tokenError?<><p>Fordere einen neuen Link an und öffne die neueste E-Mail von Putzonaut.</p><a className="button primary" href={accountPath(mode==='passwort-neu'?'passwort-vergessen':'anmelden')}>Weiter</a></>:
   <>
    {mode==='passwort-vergessen'&&<p>Wir schicken dir einen Link, mit dem du dein Passwort neu festlegen kannst.</p>}
    {mode==='anmelden'&&query.get('passwort')==='geaendert'&&<p role="status">Dein Passwort wurde geändert. Melde dich jetzt mit deinem neuen Passwort an.</p>}
    {message&&<div className="account-message" role="status"><Mail size={24}/><p>{message}</p></div>}
    {(!message||mode==='anmelden')&&
     <form onSubmit={submit}>
      <fieldset disabled={busy}>
       {mode==='registrieren'&&<label>Dein Name<input name="name" autoComplete="given-name" required minLength={1} maxLength={40} value={name} onChange={e=>setName(e.target.value)}/></label>}
       {mode!=='passwort-neu'&&<label>E-Mail-Adresse<input name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)}/></label>}
       {mode!=='passwort-vergessen'&&<label>{mode==='passwort-neu'?'Neues Passwort':'Passwort'}<input name="password" type="password" autoComplete={mode==='anmelden'?'current-password':'new-password'} minLength={mode==='anmelden'?1:12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/>{mode!=='anmelden'&&<small>Mindestens 12 Zeichen. Ein langer, eigener Satz ist gut merkbar.</small>}</label>}
       {['registrieren','passwort-neu'].includes(mode)&&<label>Passwort wiederholen<input name="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}
       {mode==='anmelden'&&<label className="checkbox-label"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Auf diesem Gerät angemeldet bleiben<small>Nur auf deinem eigenen Gerät.</small></span></label>}
       {mode==='registrieren'&&<label className="checkbox-label"><input type="checkbox" required checked={adult} onChange={e=>setAdult(e.target.checked)}/><span>Ich bin erwachsen und lege mein eigenes Konto an.<small>Kinderprofile verwaltest du später in deiner Crew.</small></span></label>}
       <button className="button primary" disabled={busy} type="submit">{busy?<><LoaderCircle className="spin" size={20}/>Einen Moment …</>:<>{mode==='registrieren'?'Konto anlegen':mode==='passwort-vergessen'?'Link anfordern':mode==='passwort-neu'?'Passwort speichern':'Anmelden'}<ArrowRight size={18}/></>}</button>
      </fieldset>
     </form>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    <nav className="account-links" aria-label="Konto">
     {mode==='anmelden'?<><a href={accountPath('passwort-vergessen')}>Passwort vergessen?</a><a href={accountPath('registrieren')}>Neu hier? Konto anlegen</a><button className="text-button" disabled={busy} onClick={resend}>Bestätigung erneut senden</button></>:
      <a href={accountPath('anmelden')}>Zur Anmeldung</a>}
    </nav>
   </>}
 </section>;
}
export default function AccountPage(){
 const page=location.pathname.split('/').pop() as Mode;
 return <main className="auth-page"><div className="auth-art"><img src="/art/hero-home.webp" alt="Ein Putzonaut kümmert sich um sein Zuhause"/><a className="brand" href="/"><Sparkles fill="currentColor"/><span>Putzonaut</span></a></div><div className="auth-content"><span className="eyebrow gold">DEIN ZUHAUSE. EURE MISSION.</span><AccountForm mode={page in labels?page:'anmelden'} heading="h1"/><div className="auth-note"><ShieldCheck size={17}/>Euer Haushalt bleibt eure Sache.</div></div></main>;
}
