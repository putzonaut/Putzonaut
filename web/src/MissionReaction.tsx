'use client';
import {useEffect,useState} from 'react';
import {useMotionEnabled} from './Moments';
import type {MissionReactionKind} from '../shared/mission-reaction';

/** A decorative, one-shot accessory on the existing success mascot. */
export default function MissionReaction({kind,until,enabled,className=''}:{kind?:MissionReactionKind;until?:number;enabled:boolean;className?:string}){
 const moving=useMotionEnabled(enabled),[active,setActive]=useState(()=>!!until&&until>Date.now());
 useEffect(()=>{const timer=setTimeout(()=>setActive(false),Math.max(0,(until??0)-Date.now()));return()=>clearTimeout(timer);},[until]);
 useEffect(()=>{if(!moving)setActive(false);},[moving]);
 if(!kind||!active||!moving)return null;
 return <svg className={`mission-reaction reaction-${kind} ${className}`} data-reaction={kind} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  {kind==='watering'?<><g className="watering-can"><path d="M36 30c17-14 28 4 11 13" fill="none" stroke="#5bbeb0" strokeWidth="7"/><path d="m14 34-9-9-4 5 14 19Z" fill="#82dacf" stroke="#286c72" strokeWidth="2"/><path d="M17 27h24l4 23c-9 7-20 7-30 0Z" fill="#7ed8c7" stroke="#286c72" strokeWidth="2"/><path d="M20 29h18v5H20Z" fill="#c6fff1"/><path d="M21 22h15v5H21Z" fill="#ffe168"/></g><g className="watering-drops" fill="#76e4ff"><path d="M5 39c-6 7-3 9 0 9s5-3 0-9M10 47c-5 6-3 8 0 8s4-3 0-8"/></g></>:kind==='sock'?<g className="floating-sock"><path d="m31 6 22 7-10 27-17 16c-11 7-23-7-14-14l16-12Z" fill="#ffe17b" stroke="#c68548" strokeWidth="2.5" strokeLinejoin="round"/><path d="m31 6 22 7-3 9-22-7Z" fill="#86dfd0"/><path d="m14 40 13 13c-10 8-24-4-13-13Z" fill="#f7a18c"/><path d="m35 24 9 3m-12 4 9 3" stroke="#fff4ba" strokeWidth="4" strokeLinecap="round"/></g>:<g className="mission-shine" fill="#fff3a8"><path d="m34 7 5 16 16 5-16 5-5 16-5-16-16-5 16-5Z"/><path d="m12 39 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#9ff5e6"/></g>}
 </svg>;
}
