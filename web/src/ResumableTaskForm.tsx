'use client';
import {useState} from 'react';
import type {ComponentProps} from 'react';
import {TaskForm} from './Missions';
import {readTaskDraft,saveTaskDraft,clearTaskDraft} from './task-draft-store';
export default function ResumableTaskForm({scope,...props}:ComponentProps<typeof TaskForm>&{scope:string}){
 const [revision]=useState(props.task?.revision??(props.task?0:null));
 const [cached]=useState(()=>readTaskDraft(scope,props.task?.id));
 const [choice,setChoice]=useState<'choose'|'resume'|'new'>(cached?'choose':'new');
 const stale=!!cached&&cached.revision!==revision;
 if(choice==='choose')return <><span className="eyebrow gold">DEINE EINGABEN SIND NOCH DA</span><h2>Entwurf fortsetzen?</h2><p>{stale?'Diese Mission wurde inzwischen geändert. Öffne den aktuellen Stand, damit du keine Änderungen überschreibst.':`Für ${props.task?'diese Mission':'eine neue Mission'} gibt es noch ungespeicherte Eingaben auf diesem Gerät.`}</p>{(cached?.snapshot.fields.title||cached?.snapshot.fields.sentence)&&<p className="draft-title">{cached.snapshot.fields.title||cached.snapshot.fields.sentence}</p>}{!stale&&<button className="button primary" onClick={()=>setChoice('resume')}>Entwurf fortsetzen</button>}<button className={`button ${stale?'primary':'secondary'}`} onClick={()=>{clearTaskDraft(scope,props.task?.id);setChoice('new');}}>{stale?'Aktuellen Stand öffnen':'Entwurf verwerfen & neu beginnen'}</button></>;
 return <TaskForm {...props} initialSnapshot={choice==='resume'?cached?.snapshot:undefined} onSnapshot={snapshot=>saveTaskDraft(scope,props.task?.id,revision,snapshot)}/>;
}
