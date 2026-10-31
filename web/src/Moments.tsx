'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {Star} from 'lucide-react';
import type {Task} from './types';

export function useMotionEnabled(setting:boolean){
 const [allowed,setAllowed]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.visibilityState==='visible');
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setAllowed(!media.matches&&document.visibilityState==='visible');media.addEventListener('change',update);document.addEventListener('visibilitychange',update);update();return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};},[]);
 return setting&&allowed;
}
type Rect={left:number;top:number;width:number;height:number};
type Capture={row:Rect|null;origin:{x:number;y:number}|null;rows:Record<string,Rect>;scrollY:number;scrollX:number};
export type RewardMoment={id:string;scope:string;from:number;to:number;title:string;capture:Capture|null};
const rect=(el:Element):Rect=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};};
const visible=(r:Rect)=>r.top>=0&&r.top+r.height<=innerHeight&&r.left>=0&&r.left+r.width<=innerWidth;
export function captureMission(task:Task):Capture{
 const rows:Record<string,Rect>={};let row:Rect|null=null;let origin:Capture['origin']=null;
 for(const el of document.querySelectorAll<HTMLElement>('[data-mission-key]')){
  const box=rect(el);if(!visible(box))continue;rows[el.dataset.missionKey!]=box;
  if(el.dataset.missionKey===`${task.id}:${task.occurrenceKey}`){row=box;const b=rect(el.querySelector('.task-finish')??el);origin={x:b.left+b.width/2,y:b.top+b.height/2};}
 }
 // The sheet closes after confirmation; never leave an echo of its contents.
 if(document.querySelector('dialog[open]')){row=null;const button=document.querySelector('dialog[open] .button.primary');if(button){const b=rect(button);if(visible(b))origin={x:b.left+b.width/2,y:b.top+b.height/2};}}
 return {row,origin,rows,scrollY,scrollX};
}
export function AnimatedBalance({stars,moment}:{stars:number;moment:RewardMoment|null}){
 const [display,setDisplay]=useState<{id:string;value:number}|null>(null);
 useLayoutEffect(()=>{
  if(!moment||moment.to!==stars||moment.from===stars){setDisplay(null);return;}
  const start=performance.now();setDisplay({id:moment.id,value:moment.from});
  const timer=setInterval(()=>{const p=Math.min(1,Math.max(0,(performance.now()-start-250)/550));setDisplay({id:moment.id,value:Math.round(moment.from+(stars-moment.from)*(1-(1-p)**3))});if(p===1)clearInterval(timer);},32);return()=>clearInterval(timer);
 },[moment?.id,stars]);
 return <span aria-hidden="true">{(moment&&moment.to===stars&&display?.id===moment.id?display.value:stars).toLocaleString('de-DE')}</span>;
}
export function CompletionMotion({moment,onEnd}:{moment:RewardMoment;onEnd:()=>void}){
 const root=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const animations:Animation[]=[];const capture=moment.capture;
  const samePosition=!capture||(scrollY===capture.scrollY&&scrollX===capture.scrollX);
  if(capture&&samePosition){for(const el of document.querySelectorAll<HTMLElement>('[data-mission-key]')){const old=capture.rows[el.dataset.missionKey!];if(!old)continue;const current=rect(el);const dy=old.top-current.top;if(Math.abs(dy)>1&&Math.abs(dy)<innerHeight)animations.push(el.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:340,delay:120,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));}}
  const target=document.querySelector('[data-star-balance]');const box=target&&rect(target);
  if(box&&visible(box)&&samePosition&&moment.to>moment.from){
   const origin=capture?.origin??{x:box.left-30,y:box.top+150};
   root.current?.querySelectorAll<HTMLElement>('.flying-star').forEach((el,i)=>{el.style.left=`${origin.x}px`;el.style.top=`${origin.y}px`;animations.push(el.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.4)'},{opacity:1,offset:.15,transform:`translate(${(box.left+box.width/2-origin.x)*.2-10+i*10}px,${-50-i*12}px) scale(1)`},{opacity:1,offset:.85},{opacity:0,transform:`translate(${box.left+box.width/2-origin.x}px,${box.top+box.height/2-origin.y}px) scale(.35)`}],{duration:650,delay:120+i*75,easing:'cubic-bezier(.25,.55,.5,1)',fill:'both'}));});
  }
  // Scrolling invalidates geometry, not the already confirmed counter update.
  const hide=()=>{if(root.current)root.current.style.visibility='hidden';animations.forEach(a=>a.cancel());};
  if(!samePosition)hide();
  const timer=setTimeout(onEnd,1100);window.addEventListener('scroll',hide,{passive:true});window.addEventListener('resize',hide);
  return()=>{clearTimeout(timer);animations.forEach(a=>a.cancel());window.removeEventListener('scroll',hide);window.removeEventListener('resize',hide);};
 },[moment.id,onEnd]);
 const row=moment.capture?.row;
 return <div className="completion-motion" ref={root} aria-hidden="true">
  {row&&<div className="mission-echo" style={{left:row.left,top:row.top,width:row.width,height:row.height} as CSSProperties}><span>{moment.title}</span><svg viewBox="0 0 32 32"><path d="m7 16 6 6L26 9"/></svg></div>}
  {[0,1,2].map(i=><Star key={i} className="flying-star" size={22} fill="currentColor"/>)}
 </div>;
}
