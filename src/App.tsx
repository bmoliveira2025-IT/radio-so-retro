import { useState, useEffect, useRef } from 'react';
import UnifiedPlayerView from './components/UnifiedPlayerView';
import { InstallPrompt } from './components/InstallPrompt';
import type { PlayerStatus, Station } from './types';

// Fallback initial stations
const fallbackStations: Station[] = [
  { id: 'heart-80s', name: 'Heart 80s', frequency: '80S HITS', url: 'https://media-ssl.musicradio.com/Heart80sMP3', color: '#ff1493', logo: '/heart-logo.png' },
  { id: 'heart-90s', name: 'Heart 90s', frequency: '90S HITS', url: 'https://media-ssl.musicradio.com/Heart90sMP3', color: '#4facfe', logo: '/heart-logo.png' },
  { id: 'heart-00s', name: 'Heart 00s', frequency: '00S HITS', url: 'https://media-ssl.musicradio.com/Heart00sMP3', color: '#ff5f8f', logo: '/heart00s-logo.svg' },
  { id: '1', name: 'Eurodance 90s', frequency: 'CLASSIC', url: 'https://0nlineradio.radioho.st/technolovers-eurodance', color: '#ff2a5f', logo: '/eurodance-logo.png' },
  { id: '3', name: 'Classic Rock BR', frequency: 'ROCK', url: 'https://ice6.somafm.com/seventies-128-mp3', color: '#ffb300', logo: '/classic-rock-logo.jpg' }
];

// Vibrant palette to override dark hashes
const vibrantColors = ['#ff2a5f', '#00f2fe', '#ffb300', '#ff1493', '#4facfe', '#f83600', '#00c6ff', '#43e97b', '#a18cd1', '#ff0844', '#ffd700'];

const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info'
];

const STATIONS_CACHE_KEY = 'so-retro-stations-cache-v1';
const STATIONS_CACHE_TTL = 24 * 60 * 60 * 1000;
const LAST_STATION_KEY = 'so-retro-last-station-id';
const VOLUME_KEY = 'so-retro-volume';

function mergeStations(baseStations: Station[], extraStations: Station[]): Station[] {
  return [
    ...baseStations,
    ...extraStations.filter(station => !baseStations.some(base => base.url === station.url || base.id === station.id))
  ];
}

function loadCachedStations(): Station[] {
  try {
    const raw = localStorage.getItem(STATIONS_CACHE_KEY);
    if (!raw) return [];

    const cached = JSON.parse(raw) as { savedAt: number; stations: Station[] };
    const isFresh = Date.now() - cached.savedAt < STATIONS_CACHE_TTL;
    if (!isFresh || !Array.isArray(cached.stations)) return [];

    return cached.stations;
  } catch {
    return [];
  }
}

function saveCachedStations(stations: Station[]) {
  try {
    localStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      stations
    }));
  } catch {
    // Storage can fail in private mode or when quota is full.
  }
}

function loadSavedVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    const value = raw ? Number(raw) : 100;
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
  } catch {
    return 100;
  }
}

async function fetchFromAPI(path: string): Promise<any[]> {
  for (const mirror of MIRRORS) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${mirror}${path}`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn(`Mirror ${mirror} failed for path ${path}:`, e);
    }
  }
  return [];
}

function App() {
  const [stations, setStations] = useState<Station[]>(() => mergeStations(fallbackStations, loadCachedStations()));
  const [currentStation, setCurrentStation] = useState<Station>(() => {
    const savedId = localStorage.getItem(LAST_STATION_KEY);
    return stations.find(station => station.id === savedId) ?? stations[0] ?? fallbackStations[0];
  });
  const [isRefreshingStations, setIsRefreshingStations] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(loadSavedVolume);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch dynamic stations on load
  useEffect(() => {
    const fetchStations = async () => {
      setIsRefreshingStations(true);
      try {
        // Fetch top 30 Brazilian + Top 30 International (90s, dance, pop, rock) + Custom Requests
        const [dataBR, dataInt, dataA1, dataJP, dataRC] = await Promise.all([
          fetchFromAPI('/json/stations/search?country=Brazil&limit=30&hidebroken=true&is_https=true&order=votes&reverse=true'),
          fetchFromAPI('/json/stations/search?tagList=90s,dance,pop,rock&limit=40&hidebroken=true&is_https=true&order=votes&reverse=true'),
          fetchFromAPI('/json/stations/search?name=Antena%201&country=Brazil&limit=1&is_https=true'),
          fetchFromAPI('/json/stations/search?name=Jovem%20Pan&country=Brazil&limit=1&is_https=true'),
          fetchFromAPI('/json/stations/search?name=Cidade&country=Brazil&limit=1&is_https=true')
        ]);
        
        // Remove duplicates and put custom requests at the very top
        const combinedData = [...dataA1, ...dataJP, ...dataRC, ...dataBR, ...dataInt];
        const data = Array.from(new Map(combinedData.map((item: any) => [item.stationuuid, item])).values());
        
        if (data && data.length > 0) {
          // Block known bad domains that block HTML5 browser playback (CORS/Formats)
          const badDomains = ['streamtheworld.com', 'matutos.com.br', 'newradio.it'];
          
          // Filter strictly for https and exclude bad domains/formats
          const validData = data.filter((st: any) => {
            if (!st.url_resolved || !st.url_resolved.startsWith('https://')) return false;
            if (st.url_resolved.includes('.m3u8')) return false; // Native audio doesn't support HLS
            const name = st.name.toLowerCase();
            if (
              name.includes('gaúcha') || name.includes('gaucha') || 
              name.includes('saudade') || name.includes('bandeirantes') || 
              name.includes('orquestrada') || name.includes('motel') || 
              name.includes('drumon') || name.includes('dumont') || 
              name.includes('instrumental') || name.includes('istrumental') ||
              name.includes('top 40') || name.includes('top 100') ||
              name.includes('top40') || name.includes('top100') ||
              name.includes('- 0 n -') || name.includes('- 1 a -') ||
              name.includes('0 n -') || name.includes('1 a -') ||
              name.includes('- 0n -') || name.includes('- 1a -') ||
              name.includes('__main__') || name.includes('rautemusik') ||
              name.includes('wantuki') || name.includes('alexfm') ||
              name.includes('pop hits brasil') || name.includes('bossa jazz') ||
              name.includes('smooth jazz') || name.includes('grenal') ||
              name.includes('mgt sertanejo') || name.includes('metropolitana') ||
              name.includes('itatiaia') || name.includes('ole land') ||
              name.includes('oleland') || name.includes('america latina') ||
              name.includes('américa latina') ||
              (name.includes('conecta fm') && (name.includes('marília') || name.includes('marilia')))
            ) {
              return false;
            }
            return !badDomains.some(domain => st.url_resolved.includes(domain));
          });
          
          const apiStations: Station[] = validData.map((st: any, index: number) => {
            // No external logos — all artwork is generated locally (avoids CORS errors)
            let cleanName = st.name.trim();
            if (cleanName.length > 45) {
              cleanName = cleanName.substring(0, 45) + '...';
            }
            const cleanLower = cleanName.toLowerCase();
            const isHeart = cleanLower.includes('heart');
            const isEurodance = cleanLower.includes('eurodance');
            const isClassicRock = cleanLower.includes('classic rock') || cleanLower.includes('rock classic');
            const isAntena1 = cleanLower.includes('antena 1') || cleanLower.includes('antena um') || cleanLower.includes('antena de roma');
            const isJovemPan = cleanLower.includes('jovem pan') || cleanLower.includes('jovempan');
            const isCiudadClasicos = cleanLower.includes('ciudad') || cleanLower.includes('clasicos') || cleanLower.includes('clásicos');
            const isCidade = cleanLower.includes('cidade');
            const isBonsTempos = cleanLower.includes('bons tempos') || cleanLower.includes('bons tempo');
            const isTupi = cleanLower.includes('tupi');
            const isClube = cleanLower.includes('clube');
            const isCassete = cleanLower.includes('fita cassete') || cleanLower.includes('cassete');
            const isAmericaLatina = cleanLower.includes('america latina') || cleanLower.includes('américa latina');
            const isRdmix = cleanLower.includes('rdmix') || cleanLower.includes('rd mix');
            const isVintage = cleanLower.includes('riw') || cleanLower.includes('vintage');
            const isEnergy = cleanLower.includes('energy') || cleanLower.includes('cugir') || cleanLower.includes('nrj');
            const isFlashback = cleanLower.includes('flashback') || cleanLower.includes('flash back');
            const is90sHeaven = cleanLower.includes('heaven');
            const isPrince = cleanLower.includes('prince');
            const isFreedom = cleanLower.includes('freedom');
            const isForever90 = cleanLower.includes('forever 90') || cleanLower.includes('forever90');
            const isOldHit = cleanLower.includes('oldhit') || cleanLower.includes('old hit') || cleanLower.includes('old time') || cleanLower.includes('oldtime');
            const isVeraCruz = cleanLower.includes('veracruz') || cleanLower.includes('vera cruz');
            const isWyml = cleanLower.includes('wyml');
            const isGxRadio = cleanLower.includes('gx radio') || cleanLower.includes('gxradio');
            const is1z1 = cleanLower.includes('1z1');
            const isHotmix90 = cleanLower.includes('hotmix') || cleanLower.includes('hot mix');
            
            return {
              id: st.stationuuid,
              name: cleanName,
              frequency: st.tags.split(',')[0]?.toUpperCase() || 'BRAZIL',
              url: st.url_resolved,
              color: vibrantColors[index % vibrantColors.length],
              logo: isHeart ? '/heart-logo.png' : 
                    isEurodance ? '/eurodance-logo.png' : 
                    isClassicRock ? '/classic-rock-logo.jpg' : 
                    isAntena1 ? '/antena1-logo.png' : 
                    isJovemPan ? '/jovem-pan-logo.png' : 
                    isCiudadClasicos ? '/ciudad-clasicos-logo.png' :
                    isCidade ? '/cidade-logo.png' : 
                    isBonsTempos ? '/bons-tempos-logo.png' : 
                    isTupi ? '/tupi-logo.png' : 
                    isClube ? '/clube-logo.png' : 
                    isCassete ? '/cassete-logo.png' : 
                    isAmericaLatina ? '/america-latina-logo.png' : 
                    isRdmix ? '/rdmix-logo.png' : 
                    isVintage ? '/vintage-logo.png' : 
                    isEnergy ? '/energy-logo.png' : 
                    isFlashback ? '/flashback-logo.png' : 
                    is90sHeaven ? '/90s-heaven-logo.png' : 
                    isPrince ? '/prince-logo.png' : 
                    isFreedom ? '/freedom-logo.png' : 
                    isForever90 ? '/forever90-logo.png' :
                    isOldHit ? '/oldhit-logo.png' :
                    isVeraCruz ? '/veracruz-logo.png' :
                    isWyml ? '/wyml-logo.png' :
                    isGxRadio ? '/gxradio-logo.png' :
                    is1z1 ? '/1z1-logo.png' :
                    isHotmix90 ? '/hotmix90-logo.png' : undefined
            };
          });

          
          // Prepend some of our custom requested genres as guaranteed fallbacks
          const finalStations = mergeStations(fallbackStations, apiStations);
          
          setStations(finalStations);
          setCurrentStation(prev => finalStations.find(station => station.id === prev.id) ?? finalStations[0]);
          saveCachedStations(finalStations);
        }
      } catch (error) {
        console.error("Failed to fetch stations:", error);
      } finally {
        setIsRefreshingStations(false);
      }
    };
    
    fetchStations();
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;
    
    const playAudio = async () => {
      if (!currentStation) return;
      try {
        if (audio.src !== currentStation.url) {
          audio.src = currentStation.url;
          audio.load();
        }
        
        if (isPlaying) {
          setPlayerStatus('connecting');
          await audio.play();
        } else {
          audio.pause();
          setPlayerStatus('idle');
        }
      } catch (error: any) {
        // Ignore AbortError caused by rapid play/pause
        if (error.name !== 'AbortError') {
          console.error("Playback error, skipping broken station:", error);
          setPlayerStatus('skipping');
          
          // Auto-remove broken station and skip to next
          setStations(prev => {
            if (!currentStation) return prev;
            const filtered = prev.filter(s => s.id !== currentStation.id);
            if (filtered.length > 0) {
              const oldIndex = prev.findIndex(s => s.id === currentStation.id);
              const safeIndex = oldIndex >= 0 ? oldIndex : 0;
              const nextStation = filtered[safeIndex % filtered.length];
              if (nextStation) setCurrentStation(nextStation);
            }
            return filtered;
          });
        }
      }
    };

    // Also handle native audio error events (e.g. 404, connection refused)
    const handleAudioError = () => {
      console.error("Audio network/decoding error, skipping:", audio.error);
      setPlayerStatus('skipping');
      setStations(prev => {
        if (!currentStation) return prev;
        const filtered = prev.filter(s => s.id !== currentStation.id);
        if (filtered.length > 0) {
          const oldIndex = prev.findIndex(s => s.id === currentStation.id);
          const safeIndex = oldIndex >= 0 ? oldIndex : 0;
          const nextStation = filtered[safeIndex % filtered.length];
          if (nextStation) setCurrentStation(nextStation);
        }
        return filtered;
      });
    };

    const handleConnecting = () => {
      if (isPlaying) setPlayerStatus('connecting');
    };
    const handleLive = () => setPlayerStatus('live');
    const handlePause = () => {
      if (!isPlaying) setPlayerStatus('idle');
    };

    audio.addEventListener('loadstart', handleConnecting);
    audio.addEventListener('waiting', handleConnecting);
    audio.addEventListener('stalled', handleConnecting);
    audio.addEventListener('canplay', handleLive);
    audio.addEventListener('playing', handleLive);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleAudioError);
    playAudio();

    return () => {
      audio.removeEventListener('loadstart', handleConnecting);
      audio.removeEventListener('waiting', handleConnecting);
      audio.removeEventListener('stalled', handleConnecting);
      audio.removeEventListener('canplay', handleLive);
      audio.removeEventListener('playing', handleLive);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleAudioError);
      if (audio) {
        audio.pause();
      }
    };
  }, [currentStation, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    if (currentStation) {
      localStorage.setItem(LAST_STATION_KEY, currentStation.id);
    }
  }, [currentStation]);

  // Handle media session controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: currentStation.frequency,
        album: 'Só Retrô Player',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const currentIndex = stations.findIndex(s => s.id === currentStation.id);
        const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
        setCurrentStation(stations[prevIndex]);
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const currentIndex = stations.findIndex(s => s.id === currentStation.id);
        const nextIndex = (currentIndex + 1) % stations.length;
        setCurrentStation(stations[nextIndex]);
        setIsPlaying(true);
      });
    }
  }, [currentStation, stations]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <>
      <UnifiedPlayerView
        stations={stations}
        currentStation={currentStation}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSelectStation={(station) => {
          setCurrentStation(station);
          setIsPlaying(true);
        }}
        volume={volume}
        onVolumeChange={setVolume}
        isRefreshingStations={isRefreshingStations}
        playerStatus={playerStatus}
      />
      <InstallPrompt />
    </>
  );
}

export default App;
