'use client';
import {momentScope} from '../shared/moments';
import {useViewState} from './view-memory';
import {Plus,Search} from 'lucide-react';
import {RewardIcon} from './RewardIcons';
import {REWARD_BUDGETS,rewardIdeas} from '../shared/rewards';
import type {RewardBudget} from '../shared/rewards';
import type {Reward,State} from './types';

export default function RewardIdeas({state,onChoose}:{state:State;onChoose:(r:Reward)=>void}){
 const [expanded,setExpanded]=useViewState(momentScope(state),'ideas-expanded',false,v=>v===true),[query,setQuery]=useViewState(momentScope(state),'ideas-query','',v=>typeof v==='string'?v.slice(0,100):''),[budget,setBudget]=useViewState<RewardBudget>(momentScope(state),'ideas-budget','all',v=>REWARD_BUDGETS.some(b=>b.id===v)?v as RewardBudget:'all');
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
  <div className="reward-idea-list">{visible.map(r=><button key={r.title} onClick={()=>onChoose({id:'',...r})} aria-label={`${r.title}, ${r.cost} Sterne, Wunsch vorbereiten`}><RewardIcon name={r.icon} size={23}/><span><strong>{r.title}</strong><small>{r.cost} Sterne · anpassbar</small></span><Plus size={17}/></button>)}</div>
  {!visible.length&&<p className="reward-ideas-empty">{available.length?'Hier passt gerade keine Idee. Probiere ein anderes Wort oder Sterneziel.':'Alle Vorschläge stehen schon auf eurer Wunschliste. Eigene Wünsche kannst du weiterhin hinzufügen.'}</p>}
  {(expanded||available.length>3)&&<button className="button secondary reward-ideas-toggle" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Weniger Ideen zeigen':`Alle ${available.length} Wunschideen entdecken`}</button>}
 </section>;
}
