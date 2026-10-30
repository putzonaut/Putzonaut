import { Sparkles, Star } from 'lucide-react';
import { Patch } from './Game';

type Props = {
  stars: number;
  avatarSrc: string;
  patch?: string | null;
  onHome: () => void;
  onRewards: () => void;
  onProfile: () => void;
};

export default function AppHeader({ stars, avatarSrc, patch, onHome, onRewards, onProfile }: Props) {
  return (
    <header className="app-header">
      <button className="brand" onClick={onHome} aria-label="Putzonaut Startseite">
        <Sparkles fill="currentColor" size={25} aria-hidden="true" />
        <span>Putzonaut</span>
      </button>
      <div className="header-right">
        <button className="balance" onClick={onRewards} aria-label={`${stars} Sterne, zu deinen Belohnungen`}>
          <Star size={18} fill="currentColor" aria-hidden="true" />
          <span>{stars.toLocaleString('de-DE')}</span>
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
