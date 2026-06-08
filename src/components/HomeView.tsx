import React, { useState } from 'react';
import { PlayCircle, User, SkipBack, SkipForward } from 'lucide-react';
import type { Station } from '../types';
import StationCard from './StationCard';
import './HomeView.css';

interface HomeViewProps {
  stations: Station[];
  currentStation: Station | null;
  onPlayStation: (station: Station) => void;
  onNavigateNowPlaying: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  stations, 
  currentStation, 
  onPlayStation, 
  onNavigateNowPlaying,
  isPlaying,
  onTogglePlay,
  onPrevious,
  onNext,
  favorites,
  onToggleFavorite
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'saved'>('all');

  const displayedStations = activeTab === 'favorites' 
    ? stations.filter(s => favorites.includes(s.id))
    : stations;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return 'Boa madrugada!';
    if (hour >= 6 && hour < 12) return 'Bom dia!';
    if (hour >= 12 && hour < 18) return 'Boa tarde!';
    return 'Boa noite!';
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <div 
          className={`sidebar-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >Salvas</div>
        <div 
          className={`sidebar-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >Favoritas</div>
        <div 
          className={`sidebar-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >Todas as rádios</div>
      </div>
      
      <div className="home-main">
        <header className="home-header">
          <div className="app-branding">
            <img src="/logo.png" alt="Só Retrô" className="app-logo-img" />
            <span className="app-name">Só Retrô</span>
          </div>
          <div className="user-greeting">
            <h2>{getGreeting()}</h2>
            <div className="avatar">
              <User size={20} color="#fff" />
            </div>
          </div>
        </header>
        
        <div className="category-section">
          <h3 className="category-title">
            {activeTab === 'all' ? 'Populares' : activeTab === 'favorites' ? 'Rádios Favoritas' : 'Rádios Salvas'}
          </h3>
          
          <div className="stations-grid">
            {displayedStations.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', gridColumn: 'span 2', textAlign: 'center', marginTop: '20px' }}>
                Nenhuma rádio por aqui ainda.
              </p>
            ) : (
              displayedStations.map(station => (
                <StationCard 
                  key={station.id} 
                  station={station} 
                  isActive={currentStation?.id === station.id}
                  isFavorite={favorites.includes(station.id)}
                  onClick={() => onPlayStation(station)}
                  onToggleFavorite={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(station.id);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {currentStation && (
        <div className="home-bottom-controls">
          <div className="np-controls" style={{ marginBottom: '20px' }}>
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
            <span className="volume-icon"></span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={65} 
              readOnly
              className="volume-slider"
            />
            <span className="volume-text">65%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
