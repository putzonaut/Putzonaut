'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRequestId} from './id';
import {readView,writeView} from './view-memory';

export type Page='home'|'tasks'|'crew'|'rewards'|'profile'|'success'|'history'|'station'|'round'|'statistics';
const mainPages=['home','tasks','crew','rewards'];
const pages=[...mainPages,'profile','history','station','round','statistics'];
const safePage=(v:unknown):Page=>pages.includes(String(v))?v as Page:'home';
type Mark={session:string;scope:string;page:Page;overlay:boolean};
/** Browser history contains navigation only, never task/form contents. */
export function useNavigation<D>(scope:string|null){
 const [ui,setUi]=useState<{page:Page;dialog:D|null}>({page:'home',dialog:null});
 const [backCount,setBackCount]=useState(0);
 const current=useRef(ui),activeScope=useRef<string|null>(null),session=useRef(createRequestId());
 const positions=useRef<Record<string,number>>({});const draining=useRef(false);
 const update=(next:typeof ui)=>{current.current=next;setUi(next);};
 const mark=():Mark=>({session:session.current,scope:activeScope.current??'',page:uiPage(current.current.page),overlay:!!current.current.dialog});
 const put=(replace=false)=>{if(!activeScope.current)return;const value={...history.state,putzonautView:mark()};if(replace)history.replaceState(value,'');else history.pushState(value,'');};
 const matches=(m:Mark|undefined)=>!!m&&m.session===session.current&&m.scope===activeScope.current;
 const remember=()=>{const s=activeScope.current;if(!s)return;positions.current[current.current.page]=window.scrollY;writeView(s,'scroll',positions.current);};
 function uiPage(page:Page):Page{return page==='success'?'tasks':page;}
 function setPage(page:Page){
  if(page===current.current.page)return;remember();const hadDialog=!!current.current.dialog;update({page,dialog:null});
  if(activeScope.current&&mainPages.includes(page))writeView(activeScope.current,'last-tab',page);
  if(draining.current)return;
  if(hadDialog&&matches(history.state?.putzonautView)&&history.state.putzonautView.overlay){draining.current=true;history.back();}else put();
 }
 function setDialog(dialog:D|null){
  const wasOpen=!!current.current.dialog;if(!wasOpen&&!dialog)return;
  update({...current.current,dialog});if(draining.current)return;
  if(!wasOpen&&dialog)put();
  else if(wasOpen&&!dialog&&matches(history.state?.putzonautView)&&history.state.putzonautView.overlay){draining.current=true;history.back();}
  else put(true);
 }
 useLayoutEffect(()=>{
  if(activeScope.current===scope)return;
  remember();
  activeScope.current=scope;session.current=createRequestId();draining.current=false;
  positions.current=scope?readView(scope,'scroll',{},v=>{const out:Record<string,number>={};if(v&&typeof v==='object')for(const [k,n] of Object.entries(v))if(pages.includes(k)&&typeof n==='number'&&Number.isFinite(n)&&n>=0)out[k]=Math.min(n,100000);return out;}):{};
  const page=scope?readView<Page>(scope,'last-tab','home',v=>mainPages.includes(String(v))?v as Page:'home'):'home';update({page,dialog:null});put(true);
 },[scope]);
 useEffect(()=>{
  const restoration=history.scrollRestoration;history.scrollRestoration='manual';
  const onPop=()=>{
   const m=history.state?.putzonautView as Mark|undefined;
   if(!matches(m)){draining.current=false;update({page:'home',dialog:null});put(true);return;}
   if(draining.current){draining.current=false;if(current.current.page!==m!.page||current.current.dialog)put();else put(true);return;}
   remember();setBackCount(n=>n+1);const page=safePage(m!.page);update({page,dialog:null});if(activeScope.current&&mainPages.includes(page))writeView(activeScope.current,'last-tab',page);if(m!.overlay)put(true);
  };
  const onScroll=()=>{if(activeScope.current)positions.current[current.current.page]=window.scrollY;};
  const onHide=()=>remember();window.addEventListener('popstate',onPop);window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('pagehide',onHide);
  return()=>{history.scrollRestoration=restoration;window.removeEventListener('popstate',onPop);window.removeEventListener('scroll',onScroll);window.removeEventListener('pagehide',onHide);};
 },[]);
 useLayoutEffect(()=>{const top=positions.current[ui.page]??0;window.scrollTo({top,behavior:'instant'});},[ui.page,scope]);
 return {...ui,setPage,setDialog,backCount};
}
