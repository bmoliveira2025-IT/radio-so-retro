import { useState, useRef, useEffect } from 'react';
import HomeView from './components/HomeView';
import NowPlayingView from './components/NowPlayingView';
import SignUpView from './components/SignUpView';
import { InstallPrompt } from './components/InstallPrompt';

export type Screen = 'signup' | 'home' | 'now_playing';

import type { Station } from './types';

const MOCK_STATIONS: Station[] = [
  { id: '1', name: 'Radio 90s Eurodance', frequency: '90.0', url: 'https://listen1.myradio24.com/5967', color: '#ff2a5f' },
  { id: '2', name: 'Heart 90s Dance', frequency: '92.4', url: 'https://media-ssl.musicradio.com/Heart90sMP3', color: '#00e5ff' },
  { id: '3', name: 'Rádio Disco Funk BR', frequency: '96.5', url: 'http://streaming12.hstbr.net:8084/live', color: '#9d00ff' },
  { id: '4', name: 'Retro Rádió', frequency: '103.3', url: 'https://icast.connectmedia.hu/5001/live.mp3', color: '#ffcf00' },
  { id: '5', name: 'SomaFM Under 80s', frequency: '88.1', url: 'https://ice6.somafm.com/u80s-128-mp3', color: '#ff2a5f' },
  { id: '6', name: 'Heart 80s', frequency: '97.9', url: 'https://media-ssl.musicradio.com/Heart80sMP3', color: '#00e5ff' },
  { id: '7', name: '80s Exitos', frequency: '80.5', url: 'https://80sexitos.stream.laut.fm/80sexitos', color: '#ffcf00' },
  { id: '8', name: '105 Dance 90', frequency: '105.0', url: 'http://icy.unitedradio.it/105Dance90.mp3', color: '#9d00ff' },
  { id: '9', name: 'Play 90s Eurodance', frequency: '90.9', url: 'http://live.playradio.org:9090/90HD', color: '#ff2a5f' },
  { id: '10', name: '90s90s Dance HQ', frequency: '90.1', url: 'http://streams.90s90s.de/eurodance/mp3-192/radiode/', color: '#00e5ff' },
  { id: '11', name: '0N Classic 80s', frequency: '88.0', url: 'https://0n-classicrock.radionetz.de/0n-classicrock.mp3', color: '#9d00ff' },
  { id: '12', name: 'Big R Radio 80s', frequency: '100.1', url: 'http://bigrradio.cdnstream1.com/5186_128', color: '#ffcf00' },
];

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(65);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('so_retro_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('so_retro_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage:', e);
    }
  }, [favorites]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentStation) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Audio playback error:", e);
            }
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentStation?.url]);

  const handleLogin = () => {
    setCurrentScreen('home');
  };

  const handlePlayStation = (station: Station) => {
    setCurrentStation(station);
    setIsPlaying(true);
    setCurrentScreen('now_playing');
  };

  const handlePrevious = () => {
    if (!currentStation) return;
    const currentIndex = MOCK_STATIONS.findIndex(s => s.id === currentStation.id);
    const newIndex = currentIndex <= 0 ? MOCK_STATIONS.length - 1 : currentIndex - 1;
    setCurrentStation(MOCK_STATIONS[newIndex]);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (!currentStation) return;
    const currentIndex = MOCK_STATIONS.findIndex(s => s.id === currentStation.id);
    const newIndex = currentIndex === MOCK_STATIONS.length - 1 ? 0 : currentIndex + 1;
    setCurrentStation(MOCK_STATIONS[newIndex]);
    setIsPlaying(true);
  };

  const handleToggleFavorite = (stationId: string) => {
    setFavorites(prev => 
      prev.includes(stationId) 
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  return (
    <div className="app-container">
      <InstallPrompt />
      <div className="content-wrapper">
        <audio ref={audioRef} src={currentStation?.url} />
        
        {currentScreen === 'signup' && <SignUpView onLogin={handleLogin} />}
        
        {currentScreen === 'home' && (
          <HomeView 
            stations={MOCK_STATIONS} 
            currentStation={currentStation}
            onPlayStation={handlePlayStation}
            onNavigateNowPlaying={() => setCurrentScreen('now_playing')}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onPrevious={handlePrevious}
            onNext={handleNext}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            volume={volume}
            onVolumeChange={setVolume}
          />
        )}
        
        {currentScreen === 'now_playing' && currentStation && (
          <NowPlayingView 
            station={currentStation}
            onBack={() => setCurrentScreen('home')}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onPrevious={handlePrevious}
            onNext={handleNext}
            volume={volume}
            onVolumeChange={setVolume}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>
    </div>
  );
}

export default App;
