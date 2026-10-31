'use client';
import {useEffect,useState} from 'react';
import {Bell,Check} from 'lucide-react';
type Requester=<T=any>(path:string,options?:RequestInit)=>Promise<T>;
type Setting={publicKey:string|null;configured:boolean;checkedAt:string|null;devices:{id:string;hour:number;last_status:string|null}[]};
async function endpointId(endpoint:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(endpoint)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
const keyBytes=(key:string)=>Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(key.length/4)*4,'=')),c=>c.charCodeAt(0));
export async function stopDevicePush(request:Requester){
 if(!('serviceWorker' in navigator))return;
 const r=await navigator.serviceWorker.getRegistration('/'),sub=await r?.pushManager.getSubscription();if(!sub)return;
 // Server removal is confirmed before normal sign-out. Offline, revoke locally;
 // the invalid endpoint is discarded by the sender on its next attempt.
 if(navigator.onLine)await request('/push',{method:'DELETE',body:JSON.stringify({endpoint:sub.endpoint})});
 const removed=await sub.unsubscribe();if(!removed)throw new Error('Die Gerätebenachrichtigung konnte noch nicht ausgeschaltet werden. Bitte versuche es erneut.');
}
export default function PushReminder({request,parentName,offline}:{request:Requester;parentName:string;offline:boolean}){
 const [settings,setSettings]=useState<Setting>(),[registration,setRegistration]=useState<ServiceWorkerRegistration>(),[subscription,setSubscription]=useState<PushSubscription|null>(null),[hour,setHour]=useState(18),[active,setActive]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 const supported=typeof window!=='undefined'&&'Notification' in window&&'PushManager' in window&&'serviceWorker' in navigator&&window.isSecureContext;
 const ios=typeof navigator!=='undefined'&&(/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),installed=typeof matchMedia!=='undefined'&&matchMedia('(display-mode: standalone)').matches;
 useEffect(()=>{if(!supported||offline||ios&&!installed)return;let alive=true;
  void (async()=>{const config=await request<Setting>('/push');if(!alive)return;setSettings(config);if(!config.configured)return;await navigator.serviceWorker.register('/sw.js',{scope:'/'});const r=await navigator.serviceWorker.ready,s=await r.pushManager.getSubscription();if(!alive)return;setRegistration(r);setSubscription(s);const id=s?await endpointId(s.endpoint):null;const own=config.devices.find(d=>d.id===id);setActive(!!own);if(own)setHour(own.hour);})().catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};
 },[request,supported,offline,ios,installed]);
 async function save(){if(!registration||!settings?.publicKey)return;setBusy(true);setError('');setSaved(false);let created:PushSubscription|null=null;
  try{
   // subscribe is invoked from the explicit tap, before any network await.
   const sub=subscription??await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(settings.publicKey)});if(!subscription)created=sub;
   await request('/push',{method:'POST',body:JSON.stringify({endpoint:sub.endpoint,hour})});setSubscription(sub);setActive(true);setSaved(true);
  }catch(e){if(created)await created.unsubscribe().catch(()=>false);setError(Notification.permission==='denied'?'Benachrichtigungen sind im Browser gesperrt. Du kannst sie in dessen Website-Einstellungen erlauben.':(e as Error).message||'Die Benachrichtigung konnte nicht aktiviert werden.');}finally{setBusy(false);}
 }
 return <section className="push-reminder"><h3><Bell size={20}/>Auch wenn die App geschlossen ist</h3><p>Für {parentName} auf diesem Gerät. Eigene, freie und zu betreuende Kinderaufgaben werden in einem Tageshinweis zusammengefasst.</p>{ios&&!installed?<p className="game-note">Öffne Putzonaut über „Teilen → Zum Home-Bildschirm“ als App. Auf einem unterstützten iPhone kannst du die Erinnerung dort aktivieren.</p>:!supported?<p className="game-note">Dieser Browser unterstützt Gerätebenachrichtigungen hier nicht. Die Erinnerung in der geöffneten App bleibt verfügbar.</p>:<><label>Tägliches Zeitfenster<select aria-label="Zeitfenster für Gerätebenachrichtigung" value={hour} disabled={busy||offline} onChange={e=>{setHour(Number(e.target.value));setSaved(false);}}>{Array.from({length:24},(_,h)=><option value={h} key={h}>{String(h).padStart(2,'0')}:00–{String((h+1)%24).padStart(2,'0')}:00 Uhr</option>)}</select></label><p className="game-note">Berliner Zeit. Höchstens ein Hinweis pro Tag auf diesem Gerät, nur bei offenen Aufgaben. Auszeiten werden berücksichtigt. Die genaue Zustellung hängt vom Gerät und der Verbindung ab.</p>{settings&&!settings.configured?<p>Der Versand wird gerade eingerichtet.</p>:<button type="button" className="button primary" disabled={busy||offline||!registration||!settings?.configured} onClick={()=>void save()}>{busy?'Wird gespeichert …':active?'Zeitfenster speichern':'Auf diesem Gerät aktivieren'}</button>}{active&&<button type="button" className="text-button centered" disabled={busy||offline} onClick={async()=>{setBusy(true);setError('');try{await stopDevicePush(request);setSubscription(null);setActive(false);setSaved(false);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Auf diesem Gerät ausschalten</button>}{saved&&<p role="status"><Check size={17}/>Die Geräteerinnerung ist eingeschaltet.</p>}</>}{error&&<p role="alert">{error}</p>}</section>;
}
