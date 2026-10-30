'use client';
import {useState} from 'react';
import {Award,Check,ChevronRight,LockKeyhole,Sparkles,Star} from 'lucide-react';
import {ACHIEVEMENTS,achievementHint,nextAchievements,specialBadgeArt} from '../shared/game';
import type {Outfit,State} from './types';

export const outfitArt=(id:string)=>`/art/hero-avatar${id==='starter'?'':`-${id}`}.webp`;

export function NextMilestone({state,onOpen,onProfile}:{state:State;onOpen:(outfit:Outfit)=>void;onProfile:()=>void}){
 const next=nextAchievements(state.game.achievements,state.game.focusAchievementId)[0];
 const outfit=state.outfits.find(o=>o.id===next?.outfit),badge=next&&specialBadgeArt(next.id);
 return <div className="home-progress-link next-milestone"><button onClick={()=>outfit?onOpen(outfit):onProfile()}>
  {outfit?<img src={outfitArt(outfit.id)} alt="" loading="lazy"/>:badge?<img src={badge} alt="" loading="lazy"/>:<Award size={25}/>}
  <span><small>{next?'DEIN NÄCHSTES ZIEL':`LEVEL ${state.user.level}`}</small><strong>{next?achievementHint(next):'Alle passenden Meilensteine geschafft!'}</strong>
   {next?<span className="milestone-meter" role="progressbar" aria-label={next.name} aria-valuenow={Math.min(next.value,next.target)} aria-valuemin={0} aria-valuemax={next.target}><i style={{width:`${Math.min(100,next.value/next.target*100)}%`}}/></span>:<small>{state.user.levelXp} / 500 XP zum nächsten Level</small>}
  </span><ChevronRight size={17}/>
 </button></div>;
}

export function OutfitLocker({state,onOpen}:{state:State;onOpen:(outfit:Outfit)=>void}){
 const [tab,setTab]=useState<'mine'|'discover'>('mine');
 const owned=state.outfits.filter(o=>o.unlocked),discover=state.outfits.filter(o=>!o.unlocked),visible=tab==='mine'?owned:discover;
 return <section className="outfit-locker" aria-label="Dein Spind">
  <div className="locker-tabs" role="group" aria-label="Anzüge anzeigen"><button aria-pressed={tab==='mine'} onClick={()=>setTab('mine')}>Meine Anzüge <span>{owned.length}</span></button><button aria-pressed={tab==='discover'} onClick={()=>setTab('discover')}>Entdecken <span>{discover.length}</span></button></div>
  {visible.length?<div className="outfit-grid">{visible.map(o=><button className={`outfit-card ${state.user.outfit===o.id?'selected':''}`} key={o.id} onClick={()=>onOpen(o)}>
   <img src={outfitArt(o.id)} alt="" loading="lazy"/><strong>{o.title}</strong><span>{state.user.outfit===o.id?<><Check size={13}/>Angezogen</>:o.unlocked?'Anprobieren':o.achievement?<><LockKeyhole size={12}/>Meilenstein</>:o.level>state.user.level?<><LockKeyhole size={12}/>Level {o.level}</>:<><Star size={12}/>{o.cost} Sterne</>}</span>
  </button>)}</div>:<p className="locker-complete"><Sparkles size={20}/>Dein Spind ist komplett. Viel Freude mit deinen Anzügen!</p>}
 </section>;
}

export function MilestoneReveal({ids,state,busy,onEquip,onWear}:{ids:string[];state:State;busy:boolean;onEquip:(outfit:Outfit)=>void;onWear:(id:string)=>void}){
 const achievements=ACHIEVEMENTS.filter(a=>ids.includes(a.id));if(!achievements.length)return null;
 const outfits=state.outfits.filter(o=>o.achievement&&ids.includes(o.achievement)&&o.unlocked),badges=achievements.filter(a=>specialBadgeArt(a.id));
 return <section className="milestone-reveal" aria-label="Neue Meilensteine"><span className="eyebrow gold">NEU FREIGESCHALTET</span><h2>{achievements.map(a=>a.name).join(' · ')}</h2>
  {outfits.length?outfits.map(o=><div className="unlock-outfit" key={o.id}><img src={outfitArt(o.id)} alt={`Dein neuer Anzug ${o.title}`}/><div><strong>{o.title}</strong><p>Dieser Anzug gehört jetzt dauerhaft dir.</p><button className="button primary small" disabled={busy||state.user.outfit===o.id} onClick={()=>onEquip(o)}>{state.user.outfit===o.id?<><Check size={16}/>Angezogen</>:'Gleich anziehen'}</button></div></div>):!badges.length?<p><Award size={19}/>Dein neuer Erfolg wartet im Profil.</p>:null}
  {badges.map(a=><div className="unlock-badge" key={a.id}><img src={specialBadgeArt(a.id)!} alt={a.name}/><div><strong>{a.name}</strong><p>Dein neues Abzeichen gehört dauerhaft dir.</p><button className="button primary small" disabled={busy||state.user.patchId===a.id} onClick={()=>onWear(a.id)}>{state.user.patchId===a.id?<><Check size={16}/>Wird getragen</>:'Gleich tragen'}</button></div></div>)}
 </section>;
}

export function OutfitFocus({outfit,state,busy,onFocus}:{outfit:Outfit;state:State;busy:boolean;onFocus:(id:string|null)=>void}){
 const a=state.game.achievements.find(a=>a.id===outfit.achievement);if(!a||a.unlocked)return null;
 const focused=a.id===state.game.focusAchievementId;
 return <div className="outfit-focus"><p>{achievementHint(a)}</p><button className="button secondary" disabled={busy} aria-pressed={focused} onClick={()=>onFocus(focused?null:a.id)}>{focused?<><Check size={16}/>Ziel auf der Basis entfernen</>:'Als nächstes Ziel wählen'}</button></div>;
}
