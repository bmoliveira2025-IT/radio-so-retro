import React from 'react';
import { ArrowLeft, User, Heart, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import type { Station } from '../types';
import './NowPlayingView.css';

interface NowPlayingViewProps {
  station: Station;
  onBack: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const NowPlayingView: React.FC<NowPlayingViewProps> = ({ 
  station, 
  onBack,
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  volume,
  onVolumeChange,
  favorites,
  onToggleFavorite
}) => {
  // Generate a cool sine wave pattern for the heights
  const waveHeights = Array.from({ length: 60 }, (_, i) => {
    const base = Math.sin(i * 0.2) * 50 + 60;
    const noise = Math.random() * 20;
    return base + noise;
  });

  const isFavorite = favorites.includes(station.id);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return 'Boa madrugada!';
    if (hour >= 6 && hour < 12) return 'Bom dia!';
    if (hour >= 12 && hour < 18) return 'Boa tarde!';
    return 'Boa noite!';
  };

  return (
    <div className="now-playing-container">
      <header className="np-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={24} color="#fff" />
        </button>
        <div className="user-greeting">
          <h2>{getGreeting()}</h2>
          <div className="avatar">
            <User size={20} color="#fff" />
          </div>
        </div>
      </header>

      <div className="np-status">
        <span>Tocando agora</span>
        <button 
          onClick={() => onToggleFavorite(station.id)} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
        >
          <Heart size={20} fill={isFavorite ? "#ff2a5f" : "transparent"} color={isFavorite ? "#ff2a5f" : "rgba(255,255,255,0.5)"} />
        </button>
      </div>

      <div className="np-station-info">
        <h1 className="np-freq">{station.frequency}</h1>
        <p className="np-name">{station.name}</p>
      </div>

      <div className="np-visualizer">
        {waveHeights.map((height, i) => (
          <div 
            key={i} 
            className="wave-bar" 
            style={{ 
              height: isPlaying ? `${height}px` : '10px',
              animationDuration: `${Math.random() * 1 + 0.5}s`,
              animationDelay: `${i * 0.05}s`
            }} 
          />
        ))}
      </div>

      <div className="np-chart-info">
        <h3>Top 20</h3>
        <p>Melhor Música</p>
      </div>

      <div className="np-controls">
        <button className="control-btn secondary" onClick={(e) => { e.stopPropagation(); onPrevious(); }}>
          <SkipBack size={20} fill="#fff" />
        </button>
        
        <div className="hexagon-wrapper" onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}>
          {isPlaying && <div className="hexagon-outline"></div>}
          <div className="hexagon">
            {isPlaying ? (
              <div className="pause-icon" />
            ) : (
              <div className="play-triangle" />
            )}
          </div>
        </div>

        <button className="control-btn secondary" onClick={(e) => { e.stopPropagation(); onNext(); }}>
          <SkipForward size={20} fill="#fff" />
        </button>
      </div>

      <div className="np-volume">
        <Volume2 size={18} color="rgba(255,255,255,0.5)" />
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={volume} 
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="volume-slider"
        />
        <span className="volume-text">{volume}%</span>
      </div>
    </div>
  );
};

export default NowPlayingView;
