import React, { useState, useRef, useCallback } from 'react';
import {
  ChevronLeft, MoreVertical, Heart, Shuffle,
  SkipBack, SkipForward, Pause, Play, Repeat, List, Search, Radio,
  Volume2, Volume1, Star, X
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

// ─── Favorites persistence ───────────────────────────────────────────────────
const FAV_KEY = 'so-retro-favorites';

function loadFavorites(): Station[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: Station[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useWaveHeights(count: number) {
  const ref = useRef<number[]>([]);
  if (ref.current.length === 0) {
    ref.current = Array.from({ length: count }, () => 18 + Math.random() * 82);
  }
  return ref.current;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={`mp-toast ${visible ? 'mp-toast--visible' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}

// ─── Station Artwork ──────────────────────────────────────────────────────────
function StationArtwork({ station, isPlaying, size = 'large' }: {
  station: Station;
  isPlaying: boolean;
  size?: 'large' | 'small';
}) {
  const color = station.color || '#FF4500';
  const initials = getInitials(station.name);


  return (
    <div
      className={`sta-artwork sta-artwork--${size}`}
      style={{ background: `linear-gradient(145deg, ${color} 0%, ${color}cc 50%, ${color}88 100%)` }}
      aria-label={station.name}
    >
      <div className={`sta-ring sta-ring-1 ${isPlaying ? 'pulsing' : ''}`} style={{ borderColor: `${color}44` }} />
      <div className={`sta-ring sta-ring-2 ${isPlaying ? 'pulsing' : ''}`} style={{ borderColor: `${color}22` }} />
      {/* Retro Vinyl Record */}
      <div className={`sta-vinyl ${isPlaying ? 'spinning' : ''}`}>
        <div className="sta-vinyl-grooves" />
        <div className="sta-vinyl-label" style={{ background: station.logo ? '#ffffff' : color }}>
          {station.logo ? (
            <img src={station.logo} className="sta-vinyl-logo" alt={station.name} />
          ) : (
            <span className="sta-vinyl-initials">{initials}</span>
          )}
        </div>
        <div className="sta-vinyl-shine" />
      </div>

      {/* Tonearm (Agulha) */}
      <div className={`sta-vinyl-arm ${isPlaying ? 'playing' : ''}`}>
        <div className="sta-vinyl-arm-base" />
        <div className="sta-vinyl-arm-rod" />
        <div className="sta-vinyl-arm-head" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UnifiedPlayerView({
  stations,
  currentStation,
  isPlaying,
  onTogglePlay,
  onSelectStation,
  volume,
  onVolumeChange,
}: UnifiedPlayerViewProps) {
  const [view, setView] = useState<'player' | 'list' | 'favorites'>('list');
  const [favorites, setFavorites] = useState<Station[]>(loadFavorites);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const waveHeights = useWaveHeights(36);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!currentStation) return null;

  const isFavorited = favorites.some(f => f.id === currentStation.id);

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (station.frequency && station.frequency.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show a brief toast message
  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }, []);

  // Toggle favorite for ANY station
  const toggleFavorite = useCallback((station: Station, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const exists = prev.some(f => f.id === station.id);
      const next = exists
        ? prev.filter(f => f.id !== station.id)
        : [station, ...prev];
      saveFavorites(next);
      showToast(exists ? `Removido dos favoritos` : `${station.name} adicionado!`);
      return next;
    });
  }, [showToast]);

  const handlePrev = () => {
    const list = view === 'favorites' ? favorites : stations;
    const idx = list.findIndex(s => s.id === currentStation.id);
    if (idx === -1) return;
    onSelectStation(list[idx === 0 ? list.length - 1 : idx - 1]);
  };

  const handleNext = () => {
    const list = view === 'favorites' ? favorites : stations;
    const idx = list.findIndex(s => s.id === currentStation.id);
    if (idx === -1) return;
    onSelectStation(list[idx === list.length - 1 ? 0 : idx + 1]);
  };

  // ── Station list item ──────────────────────────────────────────────────────
  const StationItem = ({ station }: { station: Station }) => {
    const isFav = favorites.some(f => f.id === station.id);
    return (
      <div
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
          className={`mp-item-fav-btn ${isFav ? 'saved' : ''}`}
          onClick={e => toggleFavorite(station, e)}
          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          title={isFav ? 'Remover favorito' : 'Salvar favorito'}
        >
          <Heart size={14} strokeWidth={2.5}
            fill={isFav ? '#FF4500' : 'none'}
            color={isFav ? '#FF4500' : '#ccc'} />
        </button>
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
    );
  };

  // ── Player screen ──────────────────────────────────────────────────────────
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
        <div className="mp-artwork-col">
          <div className="mp-artwork-wrap">
            <StationArtwork station={currentStation} isPlaying={isPlaying} size="large" />
          </div>
        </div>

        <div className="mp-controls-col">
          <div className="mp-info-row">
            <div className="mp-info-text">
              <h2 className="mp-station-name">{currentStation.name}</h2>
              <p className="mp-station-freq">{currentStation.frequency || 'Live Radio'}</p>
            </div>
            <div className="mp-info-actions">
              {/* Heart = save to Favorites (persistent) */}
              <button
                className={`mp-icon-btn ${isFavorited ? 'favorited' : ''}`}
                onClick={() => toggleFavorite(currentStation)}
                aria-label={isFavorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart size={20} strokeWidth={2}
                  fill={isFavorited ? '#FF4500' : 'none'}
                  color={isFavorited ? '#FF4500' : '#999'} />
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

  // ── List screen (All stations) ─────────────────────────────────────────────
  const ListScreen = (
    <div className="mp-list-screen">
      <div className="mp-header">
        {isSearching ? (
          <div className="mp-search-wrapper">
            <div className="mp-search-container">
              <Search size={18} className="mp-search-icon-inline" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar rádio..."
                className="mp-search-input"
                autoFocus
              />
              {searchQuery && (
                <button className="mp-search-clear-btn" onClick={() => setSearchQuery('')} aria-label="Limpar pesquisa">
                  <X size={16} />
                </button>
              )}
            </div>
            <button className="mp-search-cancel-btn" onClick={() => { setIsSearching(false); setSearchQuery(''); }} aria-label="Cancelar busca">
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <button className="mp-icon-btn" onClick={() => setView('player')} aria-label="Voltar">
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <span className="mp-header-title">Estações</span>
            <button className="mp-icon-btn" onClick={() => setIsSearching(true)} aria-label="Pesquisar">
              <Search size={20} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {/* Featured Banner - hide when searching */}
      {!isSearching && (
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
          <StationArtwork station={currentStation} isPlaying={isPlaying} size="small" />
        </div>
      )}

      <div className="mp-list-section-title">
        {searchQuery ? `Resultados (${filteredStations.length})` : 'Hot Stations'}
      </div>
      <div className="mp-station-list">
        {filteredStations.length > 0 ? (
          filteredStations.map(station => <StationItem key={station.id} station={station} />)
        ) : (
          <div className="mp-empty-search">
            <Search size={40} color="#CCCCCC" strokeWidth={1.5} />
            <p className="mp-empty-search-text">Nenhuma rádio encontrada para "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Favorites screen ───────────────────────────────────────────────────────
  const FavoritesScreen = (
    <div className="mp-list-screen">
      <div className="mp-header">
        <button className="mp-icon-btn" onClick={() => setView('player')} aria-label="Voltar">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <span className="mp-header-title">Favoritos</span>
        <div style={{ width: 38 }} />
      </div>

      {favorites.length === 0 ? (
        <div className="mp-empty-favs">
          <Star size={48} color="#E0E0E0" strokeWidth={1.5} />
          <p className="mp-empty-favs-title">Nenhum favorito ainda</p>
          <p className="mp-empty-favs-sub">
            Toque em <strong>+</strong> em qualquer estação para salvar aqui
          </p>
          <button className="mp-empty-favs-btn" onClick={() => setView('list')}>
            Ver todas as estações
          </button>
        </div>
      ) : (
        <>
          <div className="mp-list-section-title">Minhas Estações</div>
          <div className="mp-station-list">
            {favorites.map(station => <StationItem key={station.id} station={station} />)}
          </div>
        </>
      )}
    </div>
  );

  // ── Root ───────────────────────────────────────────────────────────────────
  return (
    <div className="mp-root">
      <Toast message={toast.message} visible={toast.visible} />

      {/* Mobile / Tablet Portrait */}
      <div className="mp-mobile-shell">
        <div className={`mp-screen ${view === 'player' ? 'visible' : 'hidden'}`}>{PlayerScreen}</div>
        <div className={`mp-screen ${view === 'list' ? 'visible' : 'hidden'}`}>{ListScreen}</div>
        <div className={`mp-screen ${view === 'favorites' ? 'visible' : 'hidden'}`}>{FavoritesScreen}</div>

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
          <button className={`mp-nav-btn ${view === 'favorites' ? 'active' : ''}`}
            onClick={() => setView('favorites')} aria-label="Favoritos">
            <div className="mp-nav-fav-wrap">
              <Star size={21} strokeWidth={2} />
              {favorites.length > 0 && (
                <span className="mp-fav-badge">{favorites.length > 9 ? '9+' : favorites.length}</span>
              )}
            </div>
            <span>Favoritos</span>
          </button>
        </nav>
      </div>

      {/* Desktop / Tablet Landscape */}
      <div className="mp-desktop-shell">
        <div className="mp-desktop-list">
          {/* Tab bar inside list panel */}
          <div className="mp-desktop-tabs">
            <button className={`mp-desktop-tab ${view !== 'favorites' ? 'active' : ''}`}
              onClick={() => setView('list')}>
              <List size={16} strokeWidth={2} /> Todas
            </button>
            <button className={`mp-desktop-tab ${view === 'favorites' ? 'active' : ''}`}
              onClick={() => setView('favorites')}>
              <Star size={16} strokeWidth={2} />
              Favoritos
              {favorites.length > 0 && <span className="mp-fav-badge">{favorites.length > 9 ? '9+' : favorites.length}</span>}
            </button>
          </div>
          {view === 'favorites' ? FavoritesScreen : ListScreen}
        </div>
        <div className="mp-desktop-player">{PlayerScreen}</div>
      </div>
    </div>
  );
}
