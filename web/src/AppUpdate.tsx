'use client';
import {useEffect,useRef,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {newerVersion} from '../shared/flexibility';
import {fetchRelease,prepareBrowserUpdate,applyAvailableUpdate,waitingRelease} from './app-update';
import {APP_VERSION} from './version';

export default function AppUpdate({blockedReason}:{blockedReason:string}){
 const [available,setAvailable]=useState<string|null>(null),[dismissed,setDismissed]=useState<string|null>(null),[updating,setUpdating]=useState(false),[error,setError]=useState('');
 const blocked=useRef(blockedReason),lock=useRef(false);blocked.current=blockedReason;
 useEffect(()=>{let active=true,checking=false;const check=async()=>{if(checking||!navigator.onLine||document.visibilityState!=='visible')return;checking=true;try{const release=await fetchRelease();let version=newerVersion(APP_VERSION,release);if(!version&&newerVersion('0.0.0',release)===APP_VERSION&&await waitingRelease()===APP_VERSION)version=APP_VERSION;if(active)setAvailable(version);}catch{/* An update check must not interrupt ordinary use. */}finally{checking=false;}};void check();const timer=setInterval(()=>void check(),60000);const changed=()=>void check();document.addEventListener('visibilitychange',changed);window.addEventListener('online',changed);return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',changed);window.removeEventListener('online',changed);};},[]);
 if(!available||available===dismissed)return null;
 const update=async()=>{if(lock.current)return;lock.current=true;setUpdating(true);setError('');try{await applyAvailableUpdate(available,{blocked:()=>blocked.current||(!navigator.onLine?'Zum Aktualisieren brauchst du eine Verbindung.':document.querySelector('dialog[open]')?'Schließe zuerst die geöffnete Ansicht und speichere deine Eingaben.':''),latest:fetchRelease,prepare:prepareBrowserUpdate,reload:()=>location.reload()});}catch(e){setError(e instanceof Error?e.message:'Das Update konnte gerade nicht geladen werden.');}finally{lock.current=false;setUpdating(false);}};
 return <section className="app-update" aria-label="App aktualisieren"><RefreshCw size={20}/><div><strong>Eine neue Version ist bereit</strong><p>{blockedReason||'Aktualisiere Putzonaut, wenn es gerade passt.'}</p><div className="update-actions"><button type="button" disabled={updating||!!blockedReason} onClick={()=>void update()}>{updating?'Wird vorbereitet …':'Jetzt aktualisieren'}</button><button type="button" disabled={updating} onClick={()=>setDismissed(available)}>Später</button></div>{error&&<p role="alert">{error}</p>}</div></section>;
}
