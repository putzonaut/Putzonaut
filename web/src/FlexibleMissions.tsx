'use client';
import {useState} from 'react';
import {CalendarDays,Check,Clock3,Star} from 'lucide-react';
import {DIFFICULTIES,suggestedPoints} from '../shared/game';
import type {Difficulty} from '../shared/game';
import {localDay} from '../shared/planning';
import {postponeDates} from '../shared/flexibility';
import type {State,Task} from './types';

export type RecordValues={title:string;minutes:number;difficulty:Difficulty;areaId:string};
export function RecordMissionForm({state,busy,onSubmit,onExisting}:{state:State;busy:boolean;onSubmit:(values:RecordValues)=>void;onExisting:(task:Task)=>void}){
 const [title,setTitle]=useState(''),[minutes,setMinutes]=useState('10'),[difficulty,setDifficulty]=useState<Difficulty>('normal'),[areaId,setArea]=useState(state.areas.find(a=>a.id==='household')?.id??state.areas[0]?.id??'');
 const points=suggestedPoints(Number(minutes),difficulty),child=state.user.kind==='child';
 const same=state.tasks.find(t=>t.title.trim().toLocaleLowerCase('de')===title.trim().toLocaleLowerCase('de')&&['today','overdue'].includes(t.status)&&(!t.effectiveAssignedTo||t.effectiveAssignedTo===state.user.id));
 return <><div className="sheet-illustration"><Check size={46}/></div><span className="eyebrow gold">AUCH SPONTAN ZÄHLT</span><h2>Schon erledigt!</h2><p>{child?`Was hat ${state.user.name} zusätzlich geschafft?`:'Was hast du zusätzlich geschafft?'} Eine einmalige Mission für heute.</p>
 <form className="record-mission" onSubmit={e=>{e.preventDefault();onSubmit({title:title.trim(),minutes:Number(minutes),difficulty,areaId});}}>
  <label>Was wurde erledigt?<input autoComplete="off" required minLength={2} maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Zum Beispiel: Kühlschrank auswischen" disabled={busy}/></label>
  {same&&<div className="existing-mission"><p>Diese Mission ist schon geplant.</p><button type="button" className="text-button" disabled={busy} onClick={()=>onExisting(same)}>Vorhandene Mission öffnen</button></div>}
  <div className="form-grid"><label>Dauer in Minuten<input type="number" inputMode="numeric" required min={1} max={180} step={1} value={minutes} onChange={e=>setMinutes(e.target.value)} disabled={busy}/></label><label>Bereich<select value={areaId} onChange={e=>setArea(e.target.value)} disabled={busy}>{state.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></div>
  <fieldset className="effort-choice"><legend>Wie aufwendig war es?</legend><div>{DIFFICULTIES.map(d=><button key={d.id} type="button" aria-pressed={difficulty===d.id} disabled={busy} onClick={()=>setDifficulty(d.id)}>{d.label}</button>)}</div></fieldset>
  <div className="record-points"><span>+{points.xp} XP</span><span><Star size={16}/>+{points.stars} Sterne</span></div>
  <p className="tiny-note">{child?'Die Punkte kommen nach der Bestätigung durch die Begleitperson oder den Captain.':'Die Punkte entsprechen euren üblichen Empfehlungen für Dauer und Aufwand.'}</p>
  <div className="sheet-primary-action"><button type="submit" className="button primary" disabled={busy||!!same}>{busy?'Wird gespeichert …':child?'Zur Bestätigung melden':'Als erledigt speichern'}<Check size={19}/></button></div>
 </form></>;
}

export function PostponeMissionForm({task,busy,today=localDay(new Date()),onSubmit}:{task:Task;busy:boolean;today?:string;onSubmit:(until:string)=>void}){
 const dates=postponeDates(today),[choice,setChoice]=useState<'tomorrow'|'weekend'|'date'>('tomorrow'),[custom,setCustom]=useState(dates.tomorrow);
 const selected=choice==='date'?custom:dates[choice];
 const dateLabel=(day:string)=>new Date(day+'T12:00:00Z').toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'});
 return <><div className="sheet-illustration"><CalendarDays size={46}/></div><span className="eyebrow gold">PLATZ FÜR DEINEN ALLTAG</span><h2>Heute passt nicht</h2><p>Wann möchtest du „{task.title}“ erledigen?</p><form onSubmit={e=>{e.preventDefault();onSubmit(selected);}}>
 <div className="postpone-options">{(['tomorrow','weekend','date'] as const).map(key=><button key={key} type="button" aria-pressed={choice===key} disabled={busy} onClick={()=>setChoice(key)}><span>{key==='tomorrow'?'Morgen':key==='weekend'?'Am Wochenende':'Datum wählen'}</span><small>{key==='date'?'Dein passender Tag':dateLabel(dates[key])}</small></button>)}</div>
 {choice==='date'&&<label>Neuer Termin<input type="date" required min={dates.tomorrow} max={dates.maximum} value={custom} onChange={e=>setCustom(e.target.value)} disabled={busy}/></label>}
 <p className="postpone-explanation"><Clock3 size={17}/><span>Nur diese Runde wird verschoben. {task.cadence==='once'?'Es entstehen keine zusätzlichen Punkte.':task.cadence==='after'?'Der nächste Abstand beginnt wie gewohnt nach der Erledigung.':'Wiederholungen bis zum gewählten Tag werden mit dieser Runde zusammengefasst. Danach gilt wieder der normale Rhythmus.'}</span></p>
 <div className="sheet-primary-action"><button type="submit" className="button primary" disabled={busy}>{busy?'Wird gespeichert …':`Auf ${dateLabel(selected)} verschieben`}</button></div>
 </form></>;
}
