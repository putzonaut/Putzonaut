'use client';
import {useState} from 'react';
import {Bath,Bed,Box,Car,Check,ChevronRight,House,Leaf,Monitor,PawPrint,Pencil,Plus,Search,Sofa,Sun,Utensils,Wrench} from 'lucide-react';
import type {Area,AreaIcon as AreaIconName} from '../shared/workspace';
import {AREA_ICONS} from '../shared/workspace';
import {TASK_TEMPLATES,TEMPLATE_CATEGORIES} from '../shared/setup';
import {matchesMission} from '../shared/workspace';
import {scheduleLabel} from '../shared/planning';
import {templateDraft} from './drafts';
import type {State,TaskDraft} from './types';
const icons={home:House,kitchen:Utensils,sofa:Sofa,bath:Bath,bed:Bed,leaf:Leaf,sun:Sun,paw:PawPrint,car:Car,tools:Wrench,desk:Monitor,box:Box};
const iconNames={home:'Zuhause',kitchen:'Küche',sofa:'Wohnen',bath:'Bad',bed:'Schlafen',leaf:'Pflanzen',sun:'Draußen',paw:'Haustiere',car:'Fahrzeug',tools:'Werkstatt',desk:'Büro',box:'Stauraum'};
export function AreaIcon({name='home',size=18}:{name?:AreaIconName;size?:number}){const Icon=icons[name]??House;return <Icon size={size} aria-hidden="true"/>;}
export function AreaPanel({state,busy,onCreate,onEdit}:{state:State;busy:boolean;onCreate:()=>void;onEdit:(a:Area)=>void}){
 return <><div className="sheet-illustration"><House size={45}/></div><h2>Euer Zuhause, eure Bereiche</h2><p>Vom Kinderzimmer bis zum Garten: Jeder Bereich bekommt einen Namen und ein passendes Symbol.</p><div className="area-list">{state.areas.map(a=><div key={a.id}><span className="area-symbol"><AreaIcon name={a.icon} size={23}/></span><div><strong>{a.name}</strong><small>{state.tasks.filter(t=>t.areaId===a.id).length} {state.tasks.filter(t=>t.areaId===a.id).length===1?'Mission':'Missionen'}{a.builtIn?' · Standardbereich':''}</small></div>{!a.builtIn&&<button className="icon-button" disabled={busy} aria-label={`${a.name} bearbeiten`} onClick={()=>onEdit(a)}><Pencil size={17}/></button>}</div>)}</div><button className="button primary" disabled={busy||state.areas.length>=24} onClick={onCreate}><Plus size={18}/>Eigenen Bereich hinzufügen</button><p className="game-note">Bis zu 24 Bereiche. Standardbereiche bleiben erhalten; eigene Bereiche kannst du umbenennen und entfernen, sobald sie keine Missionen mehr enthalten.</p></>;
}
export function AreaForm({area,busy,onSubmit,onArchive}:{area?:Area;busy:boolean;onSubmit:(v:{name:string;icon:AreaIconName})=>void;onArchive?:()=>void}){
 const [icon,setIcon]=useState<AreaIconName>(area?.icon??'home');
 return <><div className="sheet-illustration"><AreaIcon name={icon} size={45}/></div><h2>{area?'Bereich bearbeiten':'Ein neuer Bereich'}</h2><form onSubmit={e=>{e.preventDefault();onSubmit({name:String(new FormData(e.currentTarget).get('name')),icon});}}><label>Name des Bereichs<input name="name" required minLength={1} maxLength={40} defaultValue={area?.name} placeholder="Zum Beispiel: Balkon"/></label><fieldset className="planning-fieldset"><legend>Passendes Symbol</legend><div className="area-icon-picker">{AREA_ICONS.map(value=><button type="button" key={value} aria-label={iconNames[value]} title={iconNames[value]} aria-pressed={icon===value} className={icon===value?'selected':''} onClick={()=>setIcon(value)}><AreaIcon name={value} size={24}/></button>)}</div><p>{iconNames[icon]}</p></fieldset><button className="button primary" disabled={busy}>Bereich speichern</button>{onArchive&&<button className="text-button danger-text centered" type="button" disabled={busy} onClick={onArchive}>Bereich entfernen</button>}</form></>;
}
export function TaskLibrary({state,busy,onChoose}:{state:State;busy:boolean;onChoose:(t:TaskDraft)=>void}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[limit,setLimit]=useState(8);
 const templates=TASK_TEMPLATES.filter(t=>(!category||t.category===category)&&matchesMission({...t,steps:(t.steps??[]).map(title=>({title}))},query));
 return <><div className="sheet-illustration"><Box size={45}/></div><h2>Was passt zu eurem Zuhause?</h2><p>Eine kleine Aufgabe genügt. Wähle eine Vorlage und passe sie an euren Alltag an.</p>
 <div className="template-filters"><div className="mission-search"><Search size={18}/><input type="search" aria-label="Vorlagen durchsuchen" maxLength={100} value={query} placeholder="Zum Beispiel: Wäsche oder Spiegel" onChange={e=>{setQuery(e.target.value);setLimit(8);}}/></div><label>Bereich der Vorlagen<select value={category} onChange={e=>{setCategory(e.target.value);setLimit(8);}}><option value="">Alle Tätigkeiten</option>{TEMPLATE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label></div>
 <p className="search-count" role="status">{templates.length} passende {templates.length===1?'Vorlage':'Vorlagen'} · Es wird nur angelegt, was du auswählst.</p>
 <div className="template-list">{templates.slice(0,limit).map(t=>{const exists=state.tasks.some(x=>x.title.toLocaleLowerCase('de-DE')===t.title.toLocaleLowerCase('de-DE'));const a=state.areas.find(a=>a.name===t.room);return <button key={t.key} disabled={busy} onClick={()=>onChoose(templateDraft(t.key))}><span className="area-symbol"><AreaIcon name={a?.icon} size={25}/></span><span><strong>{t.title}</strong><small>{t.minutes} Min. · {scheduleLabel(t)} · {t.stars} Sterne</small>{exists&&<em><Check size={12}/>Schon vorhanden · weitere Kopie möglich</em>}</span><ChevronRight size={17}/></button>;})}</div>
 {templates.length>limit&&<button className="button secondary" onClick={()=>setLimit(n=>n+8)}>Weitere Vorlagen ansehen</button>}
 {!templates.length&&<div className="empty"><Search size={27}/><h3>Noch keine passende Vorlage?</h3><p>Ändere den Suchbegriff oder wähle einen anderen Bereich. Eigene Missionen kannst du jederzeit erstellen.</p></div>}
 </>;
}
