import React, { useState, useRef } from 'react';
import {
  ChevronLeft, MoreVertical, Heart, Plus, Shuffle,
  SkipBack, SkipForward, Pause, Play, Repeat, List, Search, Radio,
  Volume2, Volume1
} from 'lucide-react';
import type { Station } from '../types';
import './UnifiedPlayerView.css';

interface UnifiedPlayerViewProps {
  stations: Station[];
  currentStation: Station;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectStation: (station: Station) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

function useWaveHeights(count: number) {
  const ref = useRef<number[]>([]);
  if (ref.current.length === 0) {
    ref.current = Array.from({ length: count }, () => 18 + Math.random() * 82);
  }
  return ref.current;
}

/** Generate 2-letter initials from station name */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** CSS-only animated artwork — no external images, no CORS */
function StationArtwork({ station, isPlaying, size = 'large' }: {
  station: Station;
  isPlaying: boolean;
  size?: 'large' | 'small';
}) {
  const color = station.color || '#FF4500';
  const initials = getInitials(station.name);
  const barCount = size === 'large' ? 5 : 3;

  return (
    <div
      className={`sta-artwork sta-artwork--${size}`}
      style={{
        background: `linear-gradient(145deg, ${color} 0%, ${color}cc 50%, ${color}88 100%)`
      }}
      aria-label={station.name}
    >
      {/* Subtle animated rings */}
      <div className={`sta-ring sta-ring-1 ${isPlaying ? 'pulsing' : ''}`}
        style={{ borderColor: `${color}44` }} />
      <div className={`sta-ring sta-ring-2 ${isPlaying ? 'pulsing' : ''}`}
        style={{ borderColor: `${color}22` }} />

      {/* Initials */}
      <span className="sta-initials">{initials}</span>

      {/* Equalizer bars overlay (bottom) */}
      <div className={`sta-eq ${isPlaying ? 'playing' : ''}`} aria-hidden="true">
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className="sta-eq-bar"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function UnifiedPlayerView({
  stations,
  currentStation,
  isPlaying,
  onTogglePlay,
  onSelectStation,
  volume,
  onVolumeChange,
}: UnifiedPlayerViewProps) {
  const [view, setView] = useState<'player' | 'list'>('player');
  const [liked, setLiked] = useState(false);
  const waveHeights = useWaveHeights(36);

  if (!currentStation) return null;

  const handlePrev = () => {
    const idx = stations.findIndex(s => s.id === currentStation.id);
    if (idx === -1) return;
    onSelectStation(stations[idx === 0 ? stations.length - 1 : idx - 1]);
  };

  const handleNext = () => {
    const idx = stations.findIndex(s => s.id === currentStation.id);
    if (idx === -1) return;
    onSelectStation(stations[idx === stations.length - 1 ? 0 : idx + 1]);
  };

  const PlayerScreen = (
    <div className="mp-player-screen">
      <div className="mp-header">
        <button className="mp-icon-btn" aria-label="Estações" onClick={() => setView('list')}>
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <span className="mp-header-title">Now Playing</span>
        <button className="mp-icon-btn" aria-label="Opções" onClick={() => setView('list')}>
          <MoreVertical size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mp-player-body">
        {/* Artwork column */}
        <div className="mp-artwork-col">
          <div className="mp-artwork-wrap">
            <StationArtwork station={currentStation} isPlaying={isPlaying} size="large" />
          </div>
        </div>

        {/* Controls column */}
        <div className="mp-controls-col">
          <div className="mp-info-row">
            <div className="mp-info-text">
              <h2 className="mp-station-name">{currentStation.name}</h2>
              <p className="mp-station-freq">{currentStation.frequency || 'Live Radio'}</p>
            </div>
            <div className="mp-info-actions">
              <button
                className={`mp-icon-btn ${liked ? 'liked' : ''}`}
                onClick={() => setLiked(l => !l)}
                aria-label="Curtir"
              >
                <Heart size={20} strokeWidth={2}
                  fill={liked ? '#FF4500' : 'none'}
                  color={liked ? '#FF4500' : '#999'} />
              </button>
              <button className="mp-icon-btn" aria-label="Adicionar">
                <Plus size={20} strokeWidth={2.5} color="#999" />
              </button>
            </div>
          </div>

          {/* Waveform */}
          <div className="mp-waveform" aria-hidden="true">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                className={`mp-wave-bar ${isPlaying ? 'playing' : ''}`}
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i * 0.07) % 1.3}s`,
                  background: i < waveHeights.length * 0.45 ? '#FF4500' : 'rgba(0,0,0,0.10)',
                }}
              />
            ))}
          </div>

          {/* Volume */}
          <div className="mp-volume-row">
            <Volume1 size={16} color="#AAAAAA" strokeWidth={2} />
            <input
              type="range" min={0} max={100} value={volume}
              onChange={e => onVolumeChange(Number(e.target.value))}
              className="mp-volume-slider"
              style={{ '--vol': `${volume}%` } as React.CSSProperties}
              aria-label="Volume"
            />
            <Volume2 size={16} color="#AAAAAA" strokeWidth={2} />
          </div>

          {/* Transport */}
          <div className="mp-transport">
            <button className="mp-ctrl-btn secondary" aria-label="Embaralhar">
              <Shuffle size={19} strokeWidth={2} color="#AAAAAA" />
            </button>
            <button className="mp-ctrl-btn prev-next" onClick={handlePrev} aria-label="Anterior">
              <SkipBack size={22} strokeWidth={2} color="#1A1A1A" />
            </button>
            <button className="mp-play-btn" onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pausar' : 'Tocar'}>
              {isPlaying
                ? <Pause size={26} fill="#fff" color="#fff" />
                : <Play size={26} fill="#fff" color="#fff" className="play-nudge" />}
            </button>
            <button className="mp-ctrl-btn prev-next" onClick={handleNext} aria-label="Próxima">
              <SkipForward size={22} strokeWidth={2} color="#1A1A1A" />
            </button>
            <button className="mp-ctrl-btn secondary" aria-label="Repetir">
              <Repeat size={19} strokeWidth={2} color="#AAAAAA" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ListScreen = (
    <div className="mp-list-screen">
      <div className="mp-header">
        <button className="mp-icon-btn" onClick={() => setView('player')} aria-label="Voltar">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <span className="mp-header-title">Estações</span>
        <button className="mp-icon-btn" aria-label="Pesquisar">
          <Search size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Featured Banner */}
      <div
        className="mp-featured-banner"
        style={{ background: `linear-gradient(135deg, ${currentStation.color || '#FF4500'} 0%, ${currentStation.color || '#FF4500'}bb 100%)` }}
        onClick={() => setView('player')}
      >
        <div className="mp-featured-info">
          <span className="mp-featured-label">● AO VIVO</span>
          <h3 className="mp-featured-name">{currentStation.name}</h3>
          <button
            className="mp-featured-play"
            onClick={e => { e.stopPropagation(); setView('player'); if (!isPlaying) onTogglePlay(); }}
          >
            <Play size={14} fill="#FF4500" color="#FF4500" />
            <span>Ouvir Agora</span>
          </button>
        </div>
        {/* Artwork mini inside banner */}
        <StationArtwork station={currentStation} isPlaying={isPlaying} size="small" />
      </div>

      <div className="mp-list-section-title">Hot Stations</div>

      <div className="mp-station-list">
        {stations.map(station => (
          <div
            key={station.id}
            className={`mp-station-item ${currentStation.id === station.id ? 'active' : ''}`}
            onClick={() => { onSelectStation(station); setView('player'); }}
          >
            <StationArtwork
              station={station}
              isPlaying={currentStation.id === station.id && isPlaying}
              size="small"
            />
            <div className="mp-station-item-info">
              <h4 className="mp-station-item-name">{station.name}</h4>
              <p className="mp-station-item-freq">{station.frequency || 'Live Radio'}</p>
            </div>
            <button
              className={`mp-item-play-btn ${currentStation.id === station.id && isPlaying ? 'playing' : ''}`}
              onClick={e => { e.stopPropagation(); onSelectStation(station); setView('player'); }}
              aria-label="Tocar"
            >
              {currentStation.id === station.id && isPlaying
                ? <Pause size={14} fill="#fff" color="#fff" />
                : <Play size={14} fill="#fff" color="#fff" className="play-nudge" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mp-root">
      {/* Mobile / Tablet Portrait */}
      <div className="mp-mobile-shell">
        <div className={`mp-screen ${view === 'player' ? 'visible' : 'hidden'}`}>
          {PlayerScreen}
        </div>
        <div className={`mp-screen ${view === 'list' ? 'visible' : 'hidden'}`}>
          {ListScreen}
        </div>
        <nav className="mp-bottom-nav" aria-label="Navegação principal">
          <button className={`mp-nav-btn ${view === 'player' ? 'active' : ''}`}
            onClick={() => setView('player')} aria-label="Player">
            <Radio size={21} strokeWidth={2} />
            <span>Player</span>
          </button>
          <button className={`mp-nav-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')} aria-label="Estações">
            <List size={21} strokeWidth={2} />
            <span>Estações</span>
          </button>
        </nav>
      </div>

      {/* Desktop / Tablet Landscape */}
      <div className="mp-desktop-shell">
        <div className="mp-desktop-list">{ListScreen}</div>
        <div className="mp-desktop-player">{PlayerScreen}</div>
      </div>
    </div>
  );
}
