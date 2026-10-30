'use client';
import {useState} from 'react';
import {ArrowRight,Clock3,RefreshCw,Sparkles,Star} from 'lucide-react';
import {quickMissions} from '../shared/quick-start';
import type {State,Task} from './types';

export default function QuickStart({state,busy,onOpen,onAll,onLibrary}:{state:State;busy:boolean;onOpen:(task:Task)=>void;onAll:()=>void;onLibrary:()=>void}) {
  const [minutes,setMinutes]=useState(10),[choice,setChoice]=useState(0);
  const suggestions=quickMissions(state.tasks,state.user,minutes);
  const task=suggestions[choice%suggestions.length];
  const saving=state.game.savingGoal;
  return <section className="quick-start" aria-labelledby="quick-title">
    <div className="game-label"><Clock3 size={17}/><span>KLEIN ANFANGEN. GUT FÜHLEN.</span></div>
    <h2 id="quick-title">Wie viel Zeit hast du?</h2>
    <div className="quick-times" aria-label="Zeit für eine Mission">{[5,10,20].map(n=><button key={n} aria-pressed={minutes===n} className={minutes===n?'selected':''} onClick={()=>{setMinutes(n);setChoice(0);}}>{n}<span>Minuten</span></button>)}</div>
    {task?<>
      <div className="quick-mission"><span className="eyebrow">DEIN NÄCHSTER KLEINER ERFOLG</span><h3>{task.title}</h3><p>{task.room} · ca. {task.minutes} Min.{task.effectiveAssignedTo===state.user.id?' · Deine Aufgabe':''}</p>
        <div className="reward-pills"><span className="xp-pill">+{task.xp} XP</span><span className="star-pill"><Star size={12}/>+{task.stars} Sterne</span></div>
      </div>
      {saving&&!saving.ready&&<p className="quick-wish">{task.stars>=saving.remaining?`Damit kommst du deinem Wunsch „${saving.title}“ bis ans Ziel.`:`Ein Stück näher an „${saving.title}“.`}{state.user.kind==='child'&&task.approvalForChildren?' Sterne zählen nach der Freigabe.':''}</p>}
      <button className="button primary" disabled={busy} onClick={()=>onOpen(task)}>Loslegen<ArrowRight size={18}/></button>
      {suggestions.length>1&&<button className="text-button centered" onClick={()=>setChoice(c=>c+1)}><RefreshCw size={14}/>Andere Mission · {(choice%suggestions.length)+1}/{suggestions.length}</button>}
    </>:<div className="quick-empty"><Sparkles size={27}/><h3>Gerade nichts Passendes offen.</h3><p>Wähle mehr Zeit oder schau in eure Missionen. Kleine Schritte reichen.</p><button className="button secondary" onClick={onAll}>Alle Missionen ansehen</button>{state.user.role==='admin'&&<button className="text-button centered" disabled={busy} onClick={onLibrary}>Eine kleine Aufgabe aus den Vorlagen wählen</button>}</div>}
  </section>;
}
