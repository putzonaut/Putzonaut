'use client';
import MissionReaction from './MissionReaction';
import type {MissionReactionKind} from '../shared/mission-reaction';
import {RotateCcw,Sparkles,Star,X} from 'lucide-react';
import Mascot from './Mascot';
import {wishProgressText} from '../shared/comfort-ux';
import type {WishProgress} from '../shared/comfort-ux';
import {DurationFeedback} from './Comfort';
import type {CompletionReceipt} from '../shared/experience';
import type {State} from './types';

export default function CompletionNotice({receipt,state,busy,offline,progressReady,wish,reaction,reactionUntil,onUndo,onDismiss,onVote}:{reaction?:MissionReactionKind;reactionUntil?:number;wish:WishProgress|null;receipt:CompletionReceipt;state:State;busy:boolean;offline:boolean;progressReady:boolean;onUndo:()=>void;onDismiss:()=>void;onVote:(rating:-1|0|1)=>Promise<void>}){
 return <aside className="completion-notice" aria-label="Letzte erledigte Mission">
  <button className="notice-close icon-button" aria-label="Erfolgsmeldung schließen" onClick={onDismiss}><X size={18}/></button>
  <div className="completion-heading"><span className="completion-actor"><Mascot className="completion-mascot" outfit={state.user.outfit} pose="wave"/><MissionReaction kind={reaction} until={reactionUntil} enabled={state.user.animations&&!receipt.pending&&!receipt.replayed}/></span><div role="status"><strong>Sauber gelandet!</strong><p>{receipt.title}</p><div className="completion-points"><span><Star size={15}/>+{receipt.stars} Sterne</span><span><Sparkles size={15}/>+{receipt.xp} XP</span></div></div></div>
  {progressReady?<div className="completion-progress"><span>Level {state.user.level}<small>{state.user.levelXp} / 500 XP</small></span><div className="progress" role="progressbar" aria-label="Fortschritt zum nächsten Level" aria-valuenow={state.user.levelXp} aria-valuemin={0} aria-valuemax={500}><span style={{width:`${Math.min(100,state.user.levelXp/5)}%`}}/></div></div>:<p className="game-note">Abschluss gespeichert. Dein Gesamtstand wird abgeglichen.</p>}
  <WishProgressLine wish={wish}/>
  {receipt.canUndo&&<button className="text-button notice-undo" disabled={busy||offline} onClick={onUndo}><RotateCcw size={16}/>Rückgängig</button>}
  {receipt.durationFeedback&&<DurationFeedback minutes={receipt.durationFeedback.minutes} busy={busy||offline} onVote={onVote}/>}
 </aside>;
}

export function WishProgressLine({wish}:{wish:WishProgress|null}){return wish?<p className="wish-progress"><Star size={16} aria-hidden="true"/><span>{wishProgressText(wish)}</span></p>:null;}
