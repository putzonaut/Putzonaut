'use client';
import {useEffect,useState} from 'react';
import type {ReactNode} from 'react';
import {ArrowRight,Check,Sparkles,Star} from 'lucide-react';
import type {State} from './types';
import type {Statistics} from '../shared/statistics';
import {dailyFinish,dayIsClear,momentScope} from '../shared/moments';
import {localDay} from '../shared/planning';
import Mascot from './Mascot';

export default function DailyFinish({state,online,queued,requestApi,onStatistics,onRound,children}:{state:State;online:boolean;queued:number;requestApi:<T>(url:string,options?:RequestInit)=>Promise<T>;onStatistics:()=>void;onRound:()=>void;children:ReactNode}){
 const [stats,setStats]=useState<Statistics|null>(null);const eligible=dayIsClear(state,online,queued);const day=localDay(new Date(state.syncedAt));const scope=momentScope(state);
 useEffect(()=>{if(!eligible)return;const controller=new AbortController();void requestApi<Statistics>('/statistics?days=7',{signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setStats(data);}).catch(()=>{/* Optional summary: keep the usual start card if unavailable. */});return()=>controller.abort();},[scope,state.revision,day,eligible,requestApi]);
 const today=dailyFinish(state,stats,online,queued);if(!today)return children;
 return <section className="daily-finish"><div className="daily-finish-heading"><div><span className="eyebrow gold">DEIN HEUTIGER EINSATZ</span><h2>Für heute geschafft!</h2></div><Mascot interactive animations={state.user.animations} outfit={state.user.outfit} pose="rest" className="daily-mascot"/></div><p>Deine fälligen Missionen sind erledigt. Zeit zum Durchatmen.</p><div className="daily-totals"><span><Check size={17}/><strong>{today.count}</strong> {today.count===1?'Mission':'Missionen'}</span><span><Sparkles size={16}/><strong>{today.xp}</strong> XP</span><span><Star size={16}/><strong>{today.stars}</strong> Sterne</span></div>{state.round?<button className="text-button" onClick={onRound}>{state.round.finishedAt?'Letzte Runde ansehen':'Deine Runde ansehen'}<ArrowRight size={16}/></button>:<button className="text-button" onClick={onStatistics}>Heute ansehen<ArrowRight size={16}/></button>}</section>;
}
