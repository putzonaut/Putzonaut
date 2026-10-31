import type {CSSProperties,ReactNode} from 'react';
import {Sparkles} from 'lucide-react';

export default function LaunchScreen({animated=false,leaving=false,overlay=false,children}:{animated?:boolean;leaving?:boolean;overlay?:boolean;children?:ReactNode}){
 return <div className={`launch-screen ${overlay?'launch-overlay':''} ${animated?'launch-animated':''} ${leaving?'launch-leaving':''}`} role={overlay?'status':undefined} aria-label={overlay?'Putzonaut wird gestartet':undefined}>
  <div className="launch-center">
   <div className="launch-stage" aria-hidden="true">
    <span className="launch-aura"/>
    <span className="launch-orbit"/>
    {[0,1,2,3,4,5].map(i=><svg key={i} className={`launch-star star-${i}`} viewBox="0 0 16 16" focusable="false"><path d="m8 0 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="currentColor"/></svg>)}
    <span className="launch-pad"/>
    <span className="launch-shadow"/>
    <span className="launch-pressure"/>
    <span className="launch-flight">
     <span className="launch-jet jet-left"/><span className="launch-jet jet-right"/>
     <span className="putzo-sprite launch-astronaut"><svg className="launch-helmet-glint" viewBox="0 0 32 32" focusable="false"><path d="m16 2 3.6 10.4L30 16l-10.4 3.6L16 30l-3.6-10.4L2 16l10.4-3.6Z" fill="#fff7c4"/></svg></span>
    </span>
    <span className="launch-dust dust-left"/><span className="launch-dust dust-right"/>
    {[0,1,2,3].map(i=><span key={i} className={`launch-mote mote-${i}`}/>)}
   </div>
   <div className="launch-brand"><Sparkles className="launch-brand-icon" size={29} fill="currentColor" aria-hidden="true"/><span className="launch-word" role="img" aria-label="Putzonaut">{[...'Putzonaut'].map((letter,i)=><span key={i} aria-hidden="true" style={{'--letter':i} as CSSProperties}>{letter}</span>)}</span></div>
   <p className="launch-tagline">Dein Haushalt. Eure Mission.</p>
   <div className="launch-message">{children??<p role={overlay?undefined:'status'}>Deine Basis wird vorbereitet …</p>}</div>
  </div>
 </div>;
}
