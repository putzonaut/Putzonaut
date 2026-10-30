'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,CalendarDays,ChartNoAxesCombined,Check,LoaderCircle,RefreshCw,Rocket,Star,Target,Zap} from 'lucide-react';
import {STATISTIC_COLORS,STATISTIC_RANGES} from '../shared/statistics';
import type {Statistics,StatisticCategory,StatisticRange} from '../shared/statistics';
import {TEMPLATE_CATEGORIES} from '../shared/setup';
import {dayDate,localDay} from '../shared/planning';
import type {State} from './types';

const number=(n:number)=>n.toLocaleString('de-DE');
const date=(day:string,options:Intl.DateTimeFormatOptions={day:'numeric',month:'short'})=>dayDate(day).toLocaleDateString('de-DE',{...options,timeZone:'UTC'});
const span=(from:string,to:string)=>from===to?date(from):`${date(from)} – ${date(to)}`;
const categoryName=(id:StatisticCategory)=>TEMPLATE_CATEGORIES.find(c=>c.id===id)?.label??'Ohne Kategorie';

function ActivityChart({data}:{data:Statistics}){
 const {points,unit}=data.activity;
 const [selected,setSelected]=useState(points.length-1);
 const point=points[Math.min(selected,points.length-1)],step=Math.max(1,Math.ceil(Math.max(...points.map(p=>p.count))/4)),ceiling=step*4;
 return <section className="statistics-card" aria-labelledby="activity-title">
  <div className="statistics-card-heading"><div><span className="eyebrow">JEDER EINSATZ ZÄHLT</span><h2 id="activity-title">Deine Missionen</h2></div><span className="chart-unit">{unit==='day'?'Pro Tag':unit==='week'?'Pro Woche':'Pro Monat'}</span></div>
  <p className="statistics-note">{data.totals.activeDays?`An ${data.totals.activeDays} von ${data.period.days} Tagen hast du etwas geschafft.`:'Hier wächst mit deinem nächsten Einsatz ein neuer Balken.'}</p>
  <div className="activity-chart">
   <div className="activity-axis" aria-hidden="true">{[4,3,2,1,0].map(n=><span key={n}>{number(n*step)}</span>)}</div>
   <div className="activity-columns" style={{gridTemplateColumns:`repeat(${points.length}, minmax(0,1fr))`}}>
    {points.map((p,i)=><button key={p.from} className={`activity-column ${i===selected?'selected':''}`} aria-pressed={i===selected} aria-label={`${span(p.from,p.to)}: ${p.count} Missionen, ${p.xp} XP, ${p.stars} Missionssterne`} onClick={()=>setSelected(i)}>
     <span className="activity-track" aria-hidden="true"><span className={`activity-bar ${p.count?'':'zero'}`} style={{height:`${p.count/ceiling*100}%`}}><span>{p.count>0?number(p.count):''}</span></span></span>
     <span className="activity-date">{unit==='day'?date(p.from,{weekday:'short'}):unit==='month'?date(p.from,{month:'short'}):date(p.from,{day:'numeric',month:'numeric'})}</span>
    </button>)}
   </div>
  </div>
  <div className="chart-detail" aria-live="polite"><div><strong>{span(point.from,point.to)}</strong><span>{number(point.count)} {point.count===1?'Mission':'Missionen'}</span></div><span>{number(point.xp)} XP · {number(point.stars)} Sterne</span></div>
  <p className="statistics-hint">Balken antippen, um die Zahlen anzusehen. Randwochen und Monate zeigen nur Tage im gewählten Zeitraum.</p>
  <details className="statistics-values"><summary>Alle Diagrammwerte</summary><div className="statistics-table"><table><caption>Bestätigte Missionen von {span(data.period.from,data.period.to)}</caption><thead><tr><th scope="col">Zeitraum</th><th scope="col">Missionen</th><th scope="col">XP</th><th scope="col">Sterne</th></tr></thead><tbody>{points.map(p=><tr key={p.from}><th scope="row">{span(p.from,p.to)}</th><td>{number(p.count)}</td><td>{number(p.xp)}</td><td>{number(p.stars)}</td></tr>)}</tbody></table></div></details>
 </section>;
}

function CategoryChart({data}:{data:Statistics}){
 const [selected,setSelected]=useState<StatisticCategory|null>(null),category=data.categories.find(c=>c.id===selected),active=category?.id??null,total=data.totals.count,circumference=2*Math.PI*69;
 let offset=0;
 return <section className="statistics-card" aria-labelledby="categories-title">
  <div className="statistics-card-heading"><div><span className="eyebrow">VIELFALT IM ALLTAG</span><h2 id="categories-title">Hier packst du an</h2></div><ChartNoAxesCombined size={25}/></div>
  {total>0?<><div className="category-donut"><svg viewBox="0 0 180 180" role="img" aria-label={`Verteilung von ${total} bestätigten Missionen nach Kategorie. Einzelne Werte stehen darunter.`}><circle cx="90" cy="90" r="69" fill="none" stroke="#243859" strokeWidth="22"/>{data.categories.map(c=>{const start=offset,length=c.count/total*circumference;offset+=length;return <circle key={c.id} cx="90" cy="90" r="69" fill="none" stroke={STATISTIC_COLORS[c.id]} strokeWidth={active===c.id?26:22} strokeOpacity={!active||active===c.id?1:.26} strokeDasharray={`${length} ${circumference-length}`} strokeDashoffset={-start} transform="rotate(-90 90 90)"/>;})}</svg><div className="donut-center" aria-live="polite"><strong>{number(category?.count??total)}</strong><span>{category?categoryName(category.id):'Missionen'}</span></div></div>
   <div className="category-legend">{data.categories.map(c=><button key={c.id} aria-pressed={active===c.id} onClick={()=>setSelected(active===c.id?null:c.id)}><i style={{background:STATISTIC_COLORS[c.id]}} aria-hidden="true"/><span>{categoryName(c.id)}<small>{Math.round(c.count/total*100)} % deiner Missionen</small></span><strong>{number(c.count)}</strong></button>)}</div>
   {data.categories.some(c=>c.id==='unknown')&&<p className="statistics-hint">Für manche älteren Abschlüsse ist keine eindeutige Kategorie gespeichert.</p>}
  </>:<div className="statistics-empty-chart"><span className="empty-donut" aria-hidden="true"/><p>Deine erste bestätigte Mission bringt Farbe in diesen Kreis.</p></div>}
 </section>;
}

function GoalChart({data}:{data:Statistics}){
 const completed=data.goals.filter(w=>w.goal!==null&&w.count>=w.goal).length;
 return <section className="statistics-card goals-card" aria-labelledby="goals-title">
  <div className="statistics-card-heading"><div><span className="eyebrow">IN DEINEM TEMPO</span><h2 id="goals-title">Dein Wochenrhythmus</h2></div><Target size={26}/></div>
  <p className="statistics-note">Die letzten sechs Kalenderwochen · {completed} {completed===1?'Ziel erreicht':'Ziele erreicht'}</p>
  <div className="goal-chart">{data.goals.map(w=><div key={w.from} className={`goal-chart-row ${w.goal!==null&&w.count>=w.goal?'reached':''}`}><div><span>{w.current?'Diese Woche':span(w.from,w.to)}</span><strong>{w.goal===null?`${number(w.count)} Missionen`:`${number(w.count)} / ${w.goal}`}{w.goal!==null&&w.count>=w.goal&&<Check size={15} aria-label="Ziel erreicht"/>}</strong></div>{w.goal===null?<p className="goal-unknown">Kein Wochenziel gespeichert</p>:<div className="goal-track" role="progressbar" aria-label={`Wochenziel ${span(w.from,w.to)}`} aria-valuemin={0} aria-valuemax={w.goal} aria-valuenow={Math.min(w.count,w.goal)} aria-valuetext={`${w.count} von ${w.goal} Missionen`}><span style={{width:`${Math.min(100,w.count/w.goal*100)}%`}}/></div>}</div>)}</div>
  <p className="statistics-hint">Jede Woche hat ihr eigenes Ziel. Pausen sind erlaubt. Dieser Vergleich zeigt immer sechs Wochen; fehlende frühere Ziele werden nicht geschätzt.</p>
 </section>;
}

export default function StatisticsPage({state,load,onBack,onStart}:{state:State;load:(path:string,options?:RequestInit)=>Promise<Statistics>;onBack:()=>void;onStart:()=>void}){
 const [days,setDays]=useState<StatisticRange>(30),[retry,setRetry]=useState(0),[result,setResult]=useState<{key:string;data:Statistics}|null>(null),[problem,setProblem]=useState<{key:string;message:string}|null>(null);
 const day=localDay(new Date(state.syncedAt)),key=[state.household.id,state.user.id,state.restoreEpoch,state.revision,day,days,retry].join(':'),data=result?.key===key?result.data:null,error=problem?.key===key?problem.message:null;
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  load(`/statistics?days=${days}`,{signal:controller.signal}).then(data=>{
   if(!active)return;if(data.profileId!==state.user.id||data.householdId!==state.household.id||data.restoreEpoch!==state.restoreEpoch)throw new Error('Dein Profil wurde aktualisiert. Bitte öffne die Statistik erneut.');
   setResult({key,data});setProblem(null);
  }).catch(e=>{if(active)setProblem({key,message:(e as Error).message});});
  return()=>{active=false;controller.abort();};
 },[key,load]);
 return <><section className="page-heading statistics-heading"><button className="text-button" onClick={onBack}><ArrowLeft size={16}/>Zum Profil</button><span className="eyebrow gold">{state.user.name} · DEIN EINSATZ WIRKT</span><h1>Deine Statistik</h1><p>Viele kleine Schritte. Sichtbar viel geschafft.</p></section><div className="content statistics-content">
  <div className="statistics-ranges" role="group" aria-label="Statistikzeitraum">{STATISTIC_RANGES.map(n=><button key={n} aria-pressed={days===n} onClick={()=>setDays(n)}>{n} Tage</button>)}</div>
  {error?<div className="statistics-status" role="alert"><p>{error}</p><button className="button secondary" onClick={()=>setRetry(n=>n+1)}><RefreshCw size={18}/>Erneut laden</button></div>:!data?<div className="statistics-status" role="status"><LoaderCircle className="spin" size={26}/><p>Wir zählen deine Einsätze zusammen …</p></div>:<>
   <p className="statistics-period">{span(data.period.from,data.period.to)} · einschließlich heute</p>
   <div className="statistics-kpis"><div className="kpi-missions"><Rocket size={20}/><strong>{number(data.totals.count)}</strong><span>Missionen erledigt</span></div><div className="kpi-stars"><Star size={20}/><strong>{number(data.totals.stars)}</strong><span>Missionssterne verdient</span></div><div className="kpi-xp"><Zap size={20}/><strong>{number(data.totals.xp)}</strong><span>XP gesammelt</span></div><div className="kpi-days"><CalendarDays size={20}/><strong>{number(data.totals.activeDays)}<small> / {days}</small></strong><span>Tage mit einem Einsatz</span></div></div>
   {!data.totals.count&&<div className="statistics-start"><SparkleMark/><h2>Dein nächster Einsatz zählt.</h2><p>Für diesen Zeitraum gibt es noch keine bestätigte Mission. Eine kleine Aufgabe genügt für den Anfang.</p><button className="button primary" onClick={onStart}>Eine kleine Runde starten<ArrowRight size={17}/></button></div>}
   <ActivityChart key={`${days}:${data.period.from}`} data={data}/><CategoryChart key={`categories:${days}`} data={data}/><GoalChart data={data}/>
   <details className="statistics-method"><summary>Was hier gezählt wird</summary><p>Missionen, Kategorien, XP und Missionssterne stammen aus deinen bestätigten Abschlüssen im Logbuch. Zurückgenommene Abschlüsse zählen nicht mit. Kinderleistungen zählen ab ihrer Freigabe, archivierte Aufgaben bleiben berücksichtigt.</p><p>Missionssterne zeigen verdiente Aufgabenpunkte im Zeitraum. Dein aktuelles Guthaben, Questboni, Wunschbeiträge und Ausgaben sind darin nicht enthalten. Die Wochenziele zeigen den gespeicherten persönlichen Wochenfortschritt. Alle Tage richten sich nach Europe/Berlin.</p></details>
   <button className="text-button centered statistics-refresh" onClick={()=>setRetry(n=>n+1)}><RefreshCw size={15}/>Statistik aktualisieren</button>
  </>}
 </div></>;
}
function SparkleMark(){return <span className="statistics-start-mark"><Rocket size={28}/><Star size={13}/></span>;}
