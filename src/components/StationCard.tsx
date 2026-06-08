import React from 'react';
import { Heart } from 'lucide-react';
import type { Station } from '../types';
import './StationCard.css';

interface StationCardProps {
  station: Station;
  isActive: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const StationCard: React.FC<StationCardProps> = ({ station, isActive, isFavorite, onClick, onToggleFavorite }) => {
  const waveColor = isActive ? '#ffffff' : station.color;

  return (
    <div 
      className={`station-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        {isActive ? <span className="playing-label">Playing</span> : <span />}
        <button className="heart-btn" onClick={onToggleFavorite} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
          <Heart 
            size={16} 
            className="heart-icon" 
            fill={isFavorite ? (isActive ? '#fff' : '#ff2a5f') : 'transparent'} 
            color={isActive ? '#fff' : (isFavorite ? '#ff2a5f' : 'rgba(255,255,255,0.4)')} 
          />
        </button>
      </div>
      
      <div className="card-content">
        <h2 className="freq" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.3)' }}>{station.frequency}</h2>
        <p className="name">{station.name.split(' ')[0]}</p>
      </div>
      
      <div className="mini-waveform">
        <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path 
            d="M 5 10 Q 15 0 25 10 T 45 10 T 65 10 T 85 10 T 95 10" 
            fill="none" 
            stroke={waveColor} 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          <circle cx="5" cy="10" r="3" fill={waveColor} />
          <circle cx="95" cy="10" r="3" fill={waveColor} />
        </svg>
      </div>
    </div>
  );
};

export default StationCard;
