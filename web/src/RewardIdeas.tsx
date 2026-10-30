'use client';
import {useState} from 'react';
import {Gift,IceCreamBowl,Plus,Popcorn,Search,Utensils} from 'lucide-react';
import {REWARD_BUDGETS,rewardIdeas} from '../shared/rewards';
import type {RewardBudget} from '../shared/rewards';
import type {Reward,State} from './types';

const ideaIcons={gift:Gift,ice:IceCreamBowl,film:Popcorn,meal:Utensils};
export default function RewardIdeas({state,onChoose}:{state:State;onChoose:(r:Reward)=>void}){
 const [expanded,setExpanded]=useState(false),[query,setQuery]=useState(''),[budget,setBudget]=useState<RewardBudget>('all');
 const available=rewardIdeas(state.household.kind,state.rewards);
 const matches=expanded?rewardIdeas(state.household.kind,state.rewards,query,budget):available;
 const visible=expanded?matches:matches.slice(0,3);
 return <section className="reward-ideas" aria-label="Wunschideen">
  <div className="section-heading"><h2>Ein bisschen Vorfreude</h2></div>
  <p>{state.household.kind==='solo'?'Ideen für deine Wunschliste.':'Ideen für eure Wunschliste.'} Namen und Sterne kannst du vor dem Hinzufügen anpassen.</p>
  {expanded&&<div className="reward-idea-filters">
   <label className="reward-search"><Search size={17} aria-hidden="true"/><input type="search" aria-label="Wunschideen durchsuchen" placeholder="Wunsch suchen …" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <label>Sterneziel<select value={budget} onChange={e=>setBudget(e.target.value as RewardBudget)}>{REWARD_BUDGETS.map(b=><option value={b.id} key={b.id}>{b.label}</option>)}</select></label>
   <p className="search-count" role="status">{matches.length} {matches.length===1?'passende Idee':'passende Ideen'}</p>
  </div>}
  <div className="reward-idea-list">{visible.map(r=>{const Icon=ideaIcons[r.icon];return <button key={r.title} onClick={()=>onChoose({id:'',...r})} aria-label={`${r.title}, ${r.cost} Sterne, Wunsch vorbereiten`}><Icon size={23}/><span><strong>{r.title}</strong><small>{r.cost} Sterne · anpassbar</small></span><Plus size={17}/></button>;})}</div>
  {!visible.length&&<p className="reward-ideas-empty">{available.length?'Hier passt gerade keine Idee. Probiere ein anderes Wort oder Sterneziel.':'Alle Vorschläge stehen schon auf eurer Wunschliste. Eigene Wünsche kannst du weiterhin hinzufügen.'}</p>}
  {(expanded||available.length>3)&&<button className="button secondary reward-ideas-toggle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Weniger Ideen zeigen':`Alle ${available.length} Wunschideen entdecken`}</button>}
 </section>;
}
