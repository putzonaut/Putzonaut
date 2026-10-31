import {useEffect} from 'react';
import type {RefObject} from 'react';
import {sheetViewport} from '../shared/comfort-ux';

export function useSheetViewport(open:boolean,ref:RefObject<HTMLDialogElement|null>){
 useEffect(()=>{
  if(!open)return;const sheet=ref.current;if(!sheet)return;const viewport=window.visualViewport;let frame=0;
  const update=(reveal=false)=>{const field=document.activeElement;const editing=field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement;const box=sheetViewport(innerHeight,viewport?.height??innerHeight,viewport?.offsetTop??0,viewport?.scale??1,editing);sheet.style.setProperty('--sheet-inset',`${box.inset}px`);sheet.style.setProperty('--sheet-height',`${box.height}px`);if(!reveal)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!editing||!sheet.contains(field)||document.activeElement!==field)return;const r=field.getBoundingClientRect(),bounds=sheet.getBoundingClientRect();if(r.bottom>bounds.bottom-90||r.top<bounds.top+55)field.scrollIntoView({block:'center',behavior:'instant'});});};
  const reveal=()=>update(true),position=()=>update();update();viewport?.addEventListener('resize',reveal);viewport?.addEventListener('scroll',position);window.addEventListener('resize',reveal);sheet.addEventListener('focusin',reveal);
  return()=>{cancelAnimationFrame(frame);viewport?.removeEventListener('resize',reveal);viewport?.removeEventListener('scroll',position);window.removeEventListener('resize',reveal);sheet.removeEventListener('focusin',reveal);sheet.style.removeProperty('--sheet-inset');sheet.style.removeProperty('--sheet-height');};
 },[open,ref]);
}
