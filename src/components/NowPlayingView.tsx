import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, User, Heart, SkipBack, SkipForward, Volume2, Play, Pause, Music2, Loader2 } from 'lucide-react';
import type { Station } from '../types';
import { useNowPlaying } from '../hooks/useNowPlaying';
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
  // Stable wave heights (generated once per station)
  const waveHeightsRef = useRef<number[]>([]);
  useEffect(() => {
    waveHeightsRef.current = Array.from({ length: 60 }, (_, i) => {
      const base = Math.sin(i * 0.2) * 50 + 60;
      const noise = Math.random() * 20;
      return base + noise;
    });
  }, [station.id]);

  // Re-render trigger for waveHeights initialization
  const [, forceUpdate] = useState(0);
  useEffect(() => { forceUpdate(n => n + 1); }, [station.id]);

  const { title, artist, loading } = useNowPlaying(isPlaying ? station.url : null, station.name);

  const isFavorite = favorites.includes(station.id);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return 'Boa madrugada!';
    if (hour >= 6 && hour < 12) return 'Bom dia!';
    if (hour >= 12 && hour < 18) return 'Boa tarde!';
    return 'Boa noite!';
  };

  const waveHeights = waveHeightsRef.current.length > 0
    ? waveHeightsRef.current
    : Array.from({ length: 60 }, (_, i) => Math.sin(i * 0.2) * 50 + 60);

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
              animationDuration: `${(i % 7) * 0.15 + 0.5}s`,
              animationDelay: `${i * 0.04}s`
            }}
          />
        ))}
      </div>

      {/* Now playing track info */}
      <div className="np-track-card">
        <div className="np-track-icon">
          {loading ? (
            <Loader2 size={18} className="np-track-spinner" />
          ) : (
            <Music2 size={18} />
          )}
        </div>
        <div className="np-track-text">
          {loading ? (
            <span className="np-track-title muted">Buscando música...</span>
          ) : title ? (
            <>
              <span className="np-track-title marquee">{title}</span>
              {artist && <span className="np-track-artist">{artist}</span>}
            </>
          ) : (
            <span className="np-track-title muted">Ao vivo · {station.name}</span>
          )}
        </div>
      </div>

      <div className="np-controls">
        <button className="np-btn np-btn-secondary" onClick={onPrevious} title="Anterior">
          <SkipBack size={22} />
        </button>

        <button className="np-btn np-btn-play" onClick={onTogglePlay} title={isPlaying ? 'Pausar' : 'Tocar'}>
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <button className="np-btn np-btn-secondary" onClick={onNext} title="Próxima">
          <SkipForward size={22} />
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
