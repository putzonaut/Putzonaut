'use client';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Gift, LoaderCircle, Rocket, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { post } from './api';
import { HOUSEHOLD_TYPES, STARTER_TEMPLATES } from '../shared/setup';
import type { HouseholdKind } from '../shared/setup';

type Invitation={name:string;kind:HouseholdKind;memberCount:number;expiresAt:string;full:boolean};
export function invitationCode(input:string){
 const value=input.trim();try{const url=new URL(value);return url.searchParams.get('invite')||new URLSearchParams(url.hash.slice(1)).get('invite')||value;}catch{return value;}
}
export default function Onboarding({signedIn,suggestedName,onSuccess}:{signedIn:boolean;suggestedName:string;onSuccess:()=>void}){
 const initialInvite=new URLSearchParams(location.search).get('invite')||new URLSearchParams(location.hash.slice(1)).get('invite')||'';
 const [mode,setMode]=useState(initialInvite?'join':'setup');const [step,setStep]=useState(1);
 const [name,setName]=useState(suggestedName);const [crew,setCrew]=useState('');const [kind,setKind]=useState<HouseholdKind>('family');
 const [selected,setSelected]=useState<string[]>(STARTER_TEMPLATES.map(t=>t.key));
 const [invite,setInvite]=useState(initialInvite);const [preview,setPreview]=useState<Invitation|null>(null);
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const stepHeading=useRef<HTMLHeadingElement>(null);const mounted=useRef(false);
 useEffect(()=>{if(mounted.current){stepHeading.current?.focus();stepHeading.current?.scrollIntoView({block:'start'});}mounted.current=true;},[step,mode]);
 const type=HOUSEHOLD_TYPES.find(t=>t.id===kind)!;
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');
  if(mode==='setup'&&step<3){setStep(step+1);return;}
  setBusy(true);
  try{
   if(mode==='join'&&!preview){setPreview(await post<Invitation>('/auth/invitation',{invite:invitationCode(invite)}));return;}
   await post(`/auth/${mode}`,mode==='setup'?{name,householdName:crew,kind,taskTemplates:selected}:{name,invite:invitationCode(invite)});
   history.replaceState(null,'','/');onSuccess();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <main className="auth-page"><div className="auth-art"><img src="/art/hero-home.webp" alt="Ein Putzonaut kümmert sich um sein Zuhause"/><div className="brand"><Sparkles fill="currentColor"/><span>Putzonaut</span></div></div>
 <div className="auth-content"><span className="eyebrow gold">FÜR FAMILIEN, PAARE, WGS UND DICH</span><h1>{signedIn?'Dein Zuhause hebt ab.':'Hausarbeit. Mit Abenteuer.'}</h1><p>Zusammen Missionen erledigen, Sterne sammeln und mehr Zeit für die schönen Dinge haben.</p>
 {!signedIn?<><div className="welcome-benefits"><div><Rocket/><span><strong>Kleine Missionen</strong>Aufgaben, die zu eurem Alltag passen.</span></div><div><Users/><span><strong>Eine eigene Crew</strong>Euer Haushalt und euer privater Fortschritt.</span></div><div><Gift/><span><strong>Echte Vorfreude</strong>Belohnungen, die ihr selbst festlegt.</span></div></div><a className="button primary" href={`/signin-with-chatgpt?return_to=${encodeURIComponent(location.pathname+location.search+location.hash)}`} target="_top">Loslegen mit ChatGPT<ArrowRight size={18}/></a><p className="tiny-note">In dieser Vorabversion meldest du dich mit ChatGPT an. Kinder machen als begleitete Profile ohne eigenes Konto mit.</p></>:
 <><div className="segmented"><button disabled={busy} className={mode==='setup'?'active':''} onClick={()=>{setMode('setup');setError('');}}>Crew gründen</button><button disabled={busy} className={mode==='join'?'active':''} onClick={()=>{setMode('join');setError('');}}>Einladung nutzen</button></div>
 {mode==='setup'&&<ol className="setup-steps" aria-label="Einrichtung">{['Eure Crew','Missionen','Abflug'].map((label,i)=><li key={label} aria-current={step===i+1?'step':undefined} className={step>=i+1?'reached':''}><span>{step>i+1?<Check size={13}/>:i+1}</span>{label}</li>)}</ol>}
 <form onSubmit={submit}>
 {mode==='setup'&&step===1&&<><h2 ref={stepHeading} tabIndex={-1}>Wer startet mit?</h2><fieldset className="household-types"><legend>Dein Haushalt</legend>{HOUSEHOLD_TYPES.map(t=><label key={t.id} className={kind===t.id?'selected':''}><input type="radio" name="kind" checked={kind===t.id} onChange={()=>setKind(t.id)}/><strong>{t.label}</strong><span>{t.description}</span></label>)}</fieldset><label>Dein Name<input value={name} onChange={e=>setName(e.target.value)} required minLength={1} maxLength={40} autoComplete="given-name" placeholder="Wie dürfen wir dich nennen?"/></label><label>Name eurer Crew<input value={crew} onChange={e=>setCrew(e.target.value)} required minLength={2} maxLength={60} placeholder={type.placeholder}/></label><p className="tiny-note">Du wirst Captain. Mitglieder kannst du nach dem Start einladen; die Verantwortung kannst du später weitergeben.</p></>}
 {mode==='setup'&&step===2&&<><h2 ref={stepHeading} tabIndex={-1}>Eure ersten Missionen</h2><p className="setup-help">Wähle aus, was zu euch passt. Weitere Tätigkeiten findest du nach dem Start unter Missionen → Vorlagen. Alles lässt sich später ändern. Du kannst auch ohne Vorlagen starten.</p><div className="template-options">{STARTER_TEMPLATES.map(t=><label className="checkbox-label" key={t.key}><input type="checkbox" checked={selected.includes(t.key)} onChange={e=>setSelected(v=>e.target.checked?[...v,t.key]:v.filter(id=>id!==t.key))}/><span><strong>{t.title}</strong><small>{t.minutes} Min. · {t.cadence==='daily'?'Täglich':'Wöchentlich'} · +{t.stars} Sterne</small></span></label>)}</div><span className="selection-count">{selected.length} von {STARTER_TEMPLATES.length} ausgewählt</span></>}
 {mode==='setup'&&step===3&&<><div className="launch-icon"><Rocket size={32}/></div><h2 ref={stepHeading} tabIndex={-1}>Bereit für den Abflug?</h2><dl className="setup-summary"><div><dt>Eure Crew</dt><dd>{crew}</dd></div><div><dt>Haushalt</dt><dd>{type.label}</dd></div><div><dt>Captain</dt><dd>{name}</dd></div><div><dt>Missionen zum Start</dt><dd>{selected.length}</dd></div><div><dt>Erstes Wochenziel</dt><dd>{type.goal} Missionen</dd></div></dl><p className="setup-help">Ihr beginnt mit 0 XP und 0 Sternen. Euer Wochenziel und eure Belohnungen bestimmt ihr selbst.</p></>}
 {mode==='join'&&<><h2 ref={stepHeading} tabIndex={-1}>Deine Crew wartet.</h2><label>Einladungslink oder Code<input value={invite} onChange={e=>{setInvite(e.target.value);setPreview(null);setError('');}} required autoCapitalize="none" autoCorrect="off" placeholder="Einladung hier einfügen" maxLength={2048}/></label>{preview&&<div className="invitation-preview"><Users size={26}/><div><strong>{preview.name}</strong><p>{HOUSEHOLD_TYPES.find(t=>t.id===preview.kind)?.label} · {preview.memberCount} Mitglieder</p><small>Gültig bis {new Date(preview.expiresAt).toLocaleDateString('de-DE')}</small></div></div>}{preview?.full?<p className="form-error">Diese Crew ist voll. Bitte sprich mit ihrem Captain.</p>:preview&&<label>Dein Name<input value={name} onChange={e=>setName(e.target.value)} required minLength={1} maxLength={40} autoComplete="given-name"/></label>}<p className="tiny-note">Der Link gilt einmalig. Für diese private Vorabversion brauchst du zusätzlich die Freigabe der Website.</p></>}
 {error&&<p className="form-error" role="alert">{error}</p>}
 <button className="button primary" type="submit" disabled={busy||!!(mode==='join'&&preview?.full)}>{busy?<LoaderCircle className="spin" size={20}/>:<>{mode==='setup'?(step===3?'Crew starten':'Weiter'):(preview?'Dieser Crew beitreten':'Einladung prüfen')}<ArrowRight size={18}/></>}</button>
 {mode==='setup'&&step>1&&<button className="text-button centered" type="button" disabled={busy} onClick={()=>{setStep(step-1);setError('');}}><ArrowLeft size={16}/>Zurück</button>}
 </form><a className="text-button centered" href="/signout-with-chatgpt?return_to=/" target="_top">Mit einem anderen Konto anmelden</a></>}
 <div className="auth-note"><ShieldCheck size={17}/>Euer Haushalt bleibt eure Sache.</div></div></main>;
}
