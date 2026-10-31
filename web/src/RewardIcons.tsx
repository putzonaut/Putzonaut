'use client';
import {useId,useRef,useState} from 'react';
import {Bike,BookOpen,CakeSlice,Check,ChevronDown,Coffee,Cookie,Dices,Flower2,Gamepad2,Gift,Heart,IceCreamBowl,Map,MicVocal,Music2,Palette,Pizza,Popcorn,Puzzle,ShoppingBag,Tent,Trees,Ticket,Utensils,Waves} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {REWARD_ICON_IDS,REWARD_ICON_LABELS} from '../shared/reward-icons';
import type {RewardIconId} from '../shared/reward-icons';

const icons:Record<RewardIconId,LucideIcon>={gift:Gift,film:Popcorn,ice:IceCreamBowl,meal:Utensils,pizza:Pizza,cake:CakeSlice,coffee:Coffee,cookie:Cookie,gamepad:Gamepad2,boardgame:Dices,book:BookOpen,music:Music2,mic:MicVocal,palette:Palette,puzzle:Puzzle,ticket:Ticket,swim:Waves,bike:Bike,trees:Trees,tent:Tent,trip:Map,wellness:Flower2,heart:Heart,shopping:ShoppingBag};
export function RewardIcon({name,size=24}:{name:string;size?:number}){
 const Icon=icons[name as RewardIconId]??Gift;
 return <Icon size={size} aria-hidden="true"/>;
}
export function RewardIconPicker({defaultValue='gift',disabled=false}:{defaultValue?:RewardIconId;disabled?:boolean}){
 const [selected,setSelected]=useState(defaultValue),[expanded,setExpanded]=useState(false);
 const gridId=useId(),trigger=useRef<HTMLButtonElement>(null);
 return <fieldset className="reward-icon-picker"><legend>Symbol</legend><input type="hidden" name="icon" value={selected}/>
  <button ref={trigger} type="button" className="reward-icon-trigger" disabled={disabled} aria-label={`Symbol auswählen: ${REWARD_ICON_LABELS[selected]}`} aria-expanded={expanded} aria-controls={gridId} onClick={()=>setExpanded(!expanded)}>
   <span className="reward-icon-preview"><RewardIcon name={selected} size={29}/></span><span><strong>{REWARD_ICON_LABELS[selected]}</strong><small>{REWARD_ICON_IDS.length} Symbole zur Auswahl</small></span><ChevronDown size={19}/>
  </button>
  <div id={gridId} className="reward-icon-options" hidden={!expanded}>
   {REWARD_ICON_IDS.map(id=><button type="button" key={id} disabled={disabled} className={selected===id?'selected':''} aria-pressed={selected===id} onClick={()=>{setSelected(id);setExpanded(false);trigger.current?.focus();}}><RewardIcon name={id} size={27}/><span>{REWARD_ICON_LABELS[id]}</span>{selected===id&&<Check className="reward-icon-check" size={13}/>}</button>)}
  </div>
 </fieldset>;
}
