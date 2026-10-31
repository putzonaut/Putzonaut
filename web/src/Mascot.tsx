'use client';
import {useEffect,useRef,useState} from 'react';
import {outfitArt} from './Career';
import {useMotionEnabled} from './Moments';

type Props={outfit:string;pose?:'ready'|'wave'|'rest';className?:string;label?:string;interactive?:boolean;animations?:boolean};

export default function Mascot({outfit,pose='ready',className='',label='',interactive=false,animations=false}:Props){
 const moving=useMotionEnabled(animations);
 const [cleaning,setCleaning]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 // A profile/pose change or reduced-motion change cancels the current reaction.
 useEffect(()=>{
  setCleaning(false);
  if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}
  return()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}};
 },[outfit,pose,interactive,moving]);
 const art=outfit==='starter'?<span className={`putzo-sprite pose-${pose} ${className}`} role={!interactive&&label?'img':undefined} aria-label={!interactive&&label?label:undefined} aria-hidden={interactive||!label||undefined}/>:<img className={`putzo-portrait pose-${pose} ${className}`} src={outfitArt(outfit)} alt={interactive?'':label}/>;
 if(!interactive)return art;
 const clean=()=>{
  // Ignore repeated taps during the one-shot reaction; never queue animations.
  if(timer.current!==null)return;
  setCleaning(true);
  timer.current=setTimeout(()=>{timer.current=null;setCleaning(false);},1200);
 };
 return <button type="button" className={`mascot-touch ${className} ${outfit==='starter'?'mascot-sprite':'mascot-portrait'} visor-${pose} ${cleaning?(moving?'visor-wiping':'visor-clean'):''}`} aria-label="Putzonaut: Visier putzen" title="Visier putzen" onClick={clean}>
  {art}
  <span className="visor-window" aria-hidden="true">
   {cleaning&&<>
    {moving&&<svg className="visor-cloth" viewBox="0 0 40 40" focusable="false">
     <path d="M7 8 28 4 36 27 14 35 4 17Z" fill="#9ee6d8" stroke="#367e81" strokeWidth="1.4" strokeLinejoin="round"/>
     <path d="m7 8 20 1 7 18-20 3Z" fill="#d7fff0"/>
     <path d="m14 30 14-8 6 5-20 8Z" fill="#72c5bd"/>
     <path d="M28 23c2-2 5-1 6 1l2 5c1 4-2 7-5 6l-7-3c-2-1-2-4 0-5l4 1" fill="#f57e60" stroke="#c35243" strokeWidth="1"/>
     <path d="m10 13 15-2M12 18l15-3M15 24l13-4" fill="none" stroke="#96d9ca" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>}
    <svg className="visor-spark" viewBox="0 0 32 32" focusable="false"><path d="m16 2 3.6 10.4L30 16l-10.4 3.6L16 30l-3.6-10.4L2 16l10.4-3.6Z" fill="#fff5b7"/><path d="m16 7 2.3 6.7L25 16l-6.7 2.3L16 25l-2.3-6.7L7 16l6.7-2.3Z" fill="#fff"/></svg>
   </>}
  </span>
  <span className="mascot-status" role="status">{cleaning?'Visier blitzblank!':''}</span>
 </button>;
}
