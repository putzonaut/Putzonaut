'use client';
import './messages.css';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ChevronRight,LoaderCircle,MessageCircle,Send} from 'lucide-react';
import {ApiError} from './api';
import {createRequestId} from './id';
import {outfitArt} from './Career';
import {MESSAGE_MAX_LENGTH} from '../shared/messages';
import type {Message,MessageContact,MessageInbox,MessagePage,MessageScope} from '../shared/messages';
import type {State} from './types';

type RequestApi=<T>(url:string,options?:RequestInit)=>Promise<T>;
const scopeOf=(state:State):MessageScope=>({householdId:state.household.id,viewerId:state.viewer.id,restoreEpoch:state.restoreEpoch});
const scopeKey=(scope:MessageScope)=>[scope.householdId,scope.viewerId,scope.restoreEpoch].join(':');
const sameScope=(a:MessageScope,b:MessageScope)=>scopeKey(a)===scopeKey(b);
const countLabel=(count:number)=>`${count} ungelesene ${count===1?'Nachricht':'Nachrichten'}`;

/** Only a count lives outside the open conversation; no messages enter offline storage. */
export function useUnreadMessages(state:State|null,offline:boolean,request:RequestApi){
 const own=!!state&&state.user.id===state.viewer.id&&state.user.kind!=='child';
 const scope=state?scopeOf(state):null,key=scope?scopeKey(scope):'';
 const [result,setResult]=useState({key:'',count:0});
 const [revision,setRevision]=useState(0);
 const refresh=useCallback(()=>setRevision(n=>n+1),[]);
 useEffect(()=>{
  if(!own||offline||!scope||document.visibilityState!=='visible')return;
  let active=true;const controller=new AbortController();
  void request<MessageScope&{unread:number}>('/messages/unread',{signal:controller.signal}).then(data=>{
   if(active)setResult({key,count:sameScope(scope,data)?data.unread:0});
  }).catch(()=>{if(active)setResult({key,count:0});});
  return()=>{active=false;controller.abort();};
 },[key,own,offline,state?.syncedAt,revision,request]);
 return {count:own&&!offline&&result.key===key?result.count:0,refresh};
}

export function MessagesLink({count,onOpen}:{count:number;onOpen:()=>void}){
 return <button className="messages-link" onClick={onOpen}><MessageCircle size={24}/><span><strong>Nachrichten</strong><small>{count?countLabel(count):'Persönlich mit der Crew schreiben'}</small></span>{count>0&&<b className="message-badge" aria-hidden="true">{count>99?'99+':count}</b>}<ChevronRight size={19}/></button>;
}

export default function MessagesPanel({state,offline,request,onRead}:{state:State;offline:boolean;request:RequestApi;onRead:()=>void}){
 const [contacts,setContacts]=useState<MessageContact[]|null>(null),[selected,setSelected]=useState<MessageContact|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const scope=scopeOf(state),key=scopeKey(scope);
 useEffect(()=>{
  if(offline)return;
  let active=true,inFlight=false;const controller=new AbortController();
  async function load(){
   if(inFlight||document.visibilityState!=='visible')return;inFlight=true;
   try{const data=await request<MessageInbox>('/messages',{signal:controller.signal});if(!active)return;
    if(!sameScope(scope,data))throw new ApiError(409,'Dein Konto hat sich geändert. Öffne die Nachrichten erneut.');
    setContacts(data.contacts.sort((a,b)=>Number(b.unread>0)-Number(a.unread>0)||a.name.localeCompare(b.name,'de')));setError('');
   }catch(e){if(active){if(e instanceof ApiError&&[401,403,404,409].includes(e.status)){setContacts(null);setSelected(null);}setError((e as Error).message);}}finally{inFlight=false;}
  }
  void load();const timer=setInterval(()=>void load(),5000);document.addEventListener('visibilitychange',load);
  return()=>{active=false;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',load);};
 },[key,offline,retry,request]);
 const current=selected&&contacts?.find(c=>c.id===selected.id);
 if(selected&&contacts&&!current)return <><h2>Gespräch nicht verfügbar</h2><p>Dieses Mitglied ist nicht mehr in der Crew.</p><button className="button secondary" onClick={()=>setSelected(null)}>Zur Nachrichtenübersicht</button></>;
 return <div className="messages-panel">{offline&&<p role="status">Keine Verbindung. Dein Text bleibt hier erhalten; senden kannst du wieder mit Internet.</p>}{selected?<>
  <button className="text-button message-back" onClick={()=>{setSelected(null);setRetry(n=>n+1);}}><ArrowLeft size={17}/>Alle Nachrichten</button>
  <div className="message-person"><img src={outfitArt((current??selected).outfit)} alt=""/><div><span className="eyebrow">PERSÖNLICH</span><h2>{(current??selected).name}</h2></div></div>
  <MessageThread key={key+':'+selected.id} contact={current??selected} scope={scope} offline={offline} request={request} onRead={()=>{onRead();setRetry(n=>n+1);}}/>
 </>:<><span className="eyebrow gold">DEINE CREW</span><h2>Nachrichten</h2><p>Wähle ein Mitglied für ein persönliches Gespräch.</p>
  {!contacts&&!error&&!offline&&<p role="status"><LoaderCircle size={18} className="spin"/> Nachrichten werden geladen …</p>}
  {contacts?.length===0&&<div className="empty"><MessageCircle size={34}/><h3>Noch niemand zum Anschreiben</h3><p>Sobald ein weiteres Mitglied mit eigenem Konto zur Crew gehört, erscheint es hier.</p></div>}
  <div className="message-contacts">{contacts?.map(contact=><button key={contact.id} onClick={()=>setSelected(contact)} aria-label={`Nachricht an ${contact.name}${contact.unread?', '+countLabel(contact.unread):''}`}><img src={outfitArt(contact.outfit)} alt=""/><span><strong>{contact.name}</strong><small>{contact.unread?countLabel(contact.unread):'Nachricht schreiben'}</small></span>{contact.unread>0&&<b className="message-badge" aria-hidden="true">{contact.unread>99?'99+':contact.unread}</b>}<ChevronRight size={18}/></button>)}</div>
  <p className="tiny-note">Gespräche sind in der App nur für die beiden Beteiligten sichtbar. Verlässt jemand die Crew, wird der gemeinsame Verlauf gelöscht.</p>
 </>}{error&&<div role="alert" className="form-error">{error}<button className="text-button" onClick={()=>setRetry(n=>n+1)}>Erneut versuchen</button></div>}</div>;
}

function MessageThread({contact,scope,offline,request,onRead}:{contact:MessageContact;scope:MessageScope;offline:boolean;request:RequestApi;onRead:()=>void}){
 const [items,setItems]=useState<Message[]|null>(null),[older,setOlder]=useState<number|null>(null),[text,setText]=useState(''),[sending,setSending]=useState(false),[loadingOlder,setLoadingOlder]=useState(false),[error,setError]=useState(''),[sendError,setSendError]=useState(''),[blocked,setBlocked]=useState(false),[retry,setRetry]=useState(0);
 const scroll=useRef<HTMLDivElement>(null),all=useRef<Message[]>([]),latest=useRef(0),readThrough=useRef(0),nearBottom=useRef(true),alive=useRef(true),sendLock=useRef(false),key=useRef<{text:string;id:string}|null>(null),onReadRef=useRef(onRead);
 onReadRef.current=onRead;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 function verify(data:MessageScope){if(!sameScope(scope,data))throw new ApiError(409,'Dein Konto hat sich geändert. Öffne das Gespräch erneut.');}
 function fail(e:unknown){if(!alive.current)return;if(e instanceof ApiError&&[401,403,404,409].includes(e.status)){setBlocked(true);setItems(null);all.current=[];}setError((e as Error).message);}
 function append(next:Message[]){
  const previous=all.current;const merged=[...new Map([...previous,...next].map(m=>[m.id,m])).values()].sort((a,b)=>a.id-b.id);
  all.current=merged;setItems(merged);
  if(nearBottom.current)requestAnimationFrame(()=>{if(alive.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;});
 }
 async function markRead(messages:Message[]){
  if(offline||document.visibilityState!=='visible'||!nearBottom.current)return;
  const through=messages.filter(m=>m.senderId===contact.id).at(-1)?.id??0;
  if(through<=readThrough.current)return;
  const data=await request<MessageScope>(`/messages/${contact.id}/read`,{method:'POST',body:JSON.stringify({through})});
  if(!alive.current)return;verify(data);readThrough.current=through;onReadRef.current();
 }
 useEffect(()=>{
  if(offline)return;
  let active=true,inFlight=false;const controller=new AbortController();
  async function load(){
   if(inFlight||document.visibilityState!=='visible'||blocked)return;inFlight=true;
   try{
    const initial=latest.current===0;
    const data=await request<MessagePage>(`/messages/${contact.id}${initial?'':'?after='+latest.current}`,{signal:controller.signal});
    if(!active)return;verify(data);if(initial)setOlder(data.olderCursor);latest.current=data.items.at(-1)?.id??latest.current;append(data.items);setError('');
    // Wait for the visible messages to render before acknowledging them.
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    if(active)await markRead(all.current);
   }catch(e){if(active)fail(e);}finally{inFlight=false;}
  }
  void load();const timer=setInterval(()=>void load(),3000);document.addEventListener('visibilitychange',load);
  return()=>{active=false;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',load);};
 },[contact.id,request,retry,blocked,offline]);
 async function loadOlder(){
  if(older===null||loadingOlder||offline)return;setLoadingOlder(true);
  const height=scroll.current?.scrollHeight??0,top=scroll.current?.scrollTop??0;
  try{const data=await request<MessagePage>(`/messages/${contact.id}?before=${older}`);if(!alive.current)return;verify(data);nearBottom.current=false;append(data.items);setOlder(data.olderCursor);requestAnimationFrame(()=>{if(alive.current&&scroll.current)scroll.current.scrollTop=top+scroll.current.scrollHeight-height;});setError('');}catch(e){fail(e);}finally{if(alive.current)setLoadingOlder(false);}
 }
 async function send(){
  const value=text.trim();if(!value||sendLock.current||blocked||offline)return;sendLock.current=true;setSending(true);setError('');setSendError('');
  if(key.current?.text!==value)key.current={text:value,id:createRequestId()};
  try{const data=await request<MessageScope&{item:Message}>(`/messages/${contact.id}`,{method:'POST',body:JSON.stringify({text:value,requestKey:key.current.id})});
   if(!alive.current)return;verify(data);nearBottom.current=true;append([data.item]);setText('');key.current=null;
  }catch(e){if(e instanceof ApiError&&[401,403,404,409].includes(e.status))fail(e);if(alive.current)setSendError('Nicht bestätigt: '+(e as Error).message+' Dein Text bleibt zum erneuten Senden erhalten.');}finally{sendLock.current=false;if(alive.current)setSending(false);}
 }
 return <><div className="message-log" role="region" aria-label={`Gespräch mit ${contact.name}`} tabIndex={0} ref={scroll} onScroll={()=>{const el=scroll.current;if(!el)return;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<48;if(nearBottom.current)void markRead(all.current).catch(fail);}}>
  {older!==null&&<button className="text-button centered" disabled={loadingOlder||offline} onClick={()=>void loadOlder()}>{loadingOlder?'Wird geladen …':'Ältere Nachrichten laden'}</button>}
  {!items&&!blocked&&<p role="status">Gespräch wird geladen …</p>}
  {items?.length===0&&<p className="message-empty">Noch ganz still hier. Schreib die erste Nachricht an {contact.name}.</p>}
  <ol>{items?.map(item=><li key={item.id} className={item.senderId===scope.viewerId?'message-own':'message-other'}><span className="sr-only">{item.senderId===scope.viewerId?'Du':contact.name}: </span><p>{item.text}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time></li>)}</ol>
 </div>{error&&<p className="form-error" role="alert">{error}{!blocked&&<button className="text-button" onClick={()=>setRetry(n=>n+1)}>Gespräch aktualisieren</button>}</p>}
 {sendError&&<p className="form-error" role="alert">{sendError}</p>}<form className="message-compose" onSubmit={e=>{e.preventDefault();void send();}}><label htmlFor="message-text">Deine Nachricht</label><textarea id="message-text" value={text} onChange={e=>setText(e.target.value)} rows={2} maxLength={MESSAGE_MAX_LENGTH} disabled={sending||blocked} placeholder={`Nachricht an ${contact.name}`} autoComplete="off"/><div><small>{text.length} / {MESSAGE_MAX_LENGTH}</small><button type="submit" className="button primary small" disabled={!text.trim()||sending||blocked||offline}>{sending?<LoaderCircle size={17} className="spin"/>:<Send size={17}/>} {sending?'Wird gesendet …':'Senden'}</button></div></form></>;
}
