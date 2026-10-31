'use client';
import {useEffect,useState} from 'react';
import App from './App';
import LaunchScreen from './LaunchScreen';

export type StartupState={ready:boolean;animations?:boolean;failed:boolean};
const MOTION_KEY='putzonaut-start-motion';

export default function AppLaunch(){
 const [mounted,setMounted]=useState(false),[visible,setVisible]=useState(true);
 const [animated,setAnimated]=useState(false),[introDone,setIntroDone]=useState(false),[leaving,setLeaving]=useState(false);
 const [startup,setStartup]=useState<StartupState>({ready:false,failed:false});
 useEffect(()=>{
  setMounted(true);
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let preference=true;
  try{preference=localStorage.getItem(MOTION_KEY)!=='off';}catch{/* Storage is optional. */}
  const move=preference&&!media.matches&&document.visibilityState==='visible';
  setAnimated(move);
  const timer=window.setTimeout(()=>setIntroDone(true),move?2700:0);
  const stop=()=>{if(media.matches||document.visibilityState!=='visible'){setAnimated(false);setIntroDone(true);}};
  media.addEventListener('change',stop);document.addEventListener('visibilitychange',stop);
  return()=>{clearTimeout(timer);media.removeEventListener('change',stop);document.removeEventListener('visibilitychange',stop);};
 },[]);
 useEffect(()=>{
  if(startup.animations===undefined)return;
  try{localStorage.setItem(MOTION_KEY,startup.animations?'on':'off');}catch{/* Storage is optional. */}
  if(!startup.animations){setAnimated(false);setIntroDone(true);}
 },[startup.animations]);
 useEffect(()=>{
  if(!visible||!mounted)return;
  if(startup.failed){setVisible(false);return;}
  if(!introDone)return;
  // The one-shot intro ends even on a slow connection; the same static artwork
  // then belongs to App's normal loader, including its error/retry controls.
  setLeaving(startup.ready&&animated);
  const timer=window.setTimeout(()=>setVisible(false),startup.ready&&animated?300:0);
  return()=>clearTimeout(timer);
 },[introDone,startup.ready,startup.failed,animated,mounted,visible]);
 return <>
  <div className="launch-content" inert={visible} aria-hidden={visible||undefined}>{mounted&&<App onStartupState={setStartup}/>}</div>
  {visible&&<LaunchScreen overlay animated={animated} leaving={leaving}/>}
 </>;
}
