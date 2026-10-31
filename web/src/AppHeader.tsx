import { Sparkles, Star } from 'lucide-react';
import {AnimatedBalance} from './Moments';
import type {RewardMoment} from './Moments';
import { Patch } from './Game';

type Props = {
  stars: number;
  moment: RewardMoment|null;
  avatarSrc: string;
  patch?: string | null;
  onHome: () => void;
  onRewards: () => void;
  onProfile: () => void;
};

export default function AppHeader({ stars, moment, avatarSrc, patch, onHome, onRewards, onProfile }: Props) {
  return (
    <header className="app-header">
      <button className="brand" onClick={onHome} aria-label="Putzonaut Startseite">
        <Sparkles fill="currentColor" size={25} aria-hidden="true" />
        <span>Putzonaut</span>
      </button>
      <div className="header-right">
        <button className="balance" data-star-balance onClick={onRewards} aria-label={`${stars} Sterne, zu deinen Belohnungen`}>
          <Star size={18} fill="currentColor" aria-hidden="true" />
          <AnimatedBalance stars={stars} moment={moment}/>
        </button>
        <button className="avatar-button" onClick={onProfile} aria-label="Dein Putzonaut">
          <span className="avatar-image" aria-hidden="true">
            <img src={avatarSrc} alt="" />
          </span>
          <Patch name={patch} size={11} />
        </button>
      </div>
    </header>
  );
}
