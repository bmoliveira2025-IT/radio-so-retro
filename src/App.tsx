import { useState, useEffect, useRef } from 'react';
import UnifiedPlayerView from './components/UnifiedPlayerView';
import { InstallPrompt } from './components/InstallPrompt';
import type { Station } from './types';

// Fallback initial stations
const fallbackStations: Station[] = [
  { id: 'heart-80s', name: 'Heart 80s', frequency: '80S HITS', url: 'https://media-ssl.musicradio.com/Heart80sMP3', color: '#ff1493', logo: '/heart-logo.png' },
  { id: 'heart-90s', name: 'Heart 90s', frequency: '90S HITS', url: 'https://media-ssl.musicradio.com/Heart90sMP3', color: '#4facfe', logo: '/heart-logo.png' },
  { id: '1', name: 'Eurodance 90s', frequency: 'CLASSIC', url: 'https://0nlineradio.radioho.st/technolovers-eurodance', color: '#ff2a5f' },
  { id: '3', name: 'Classic Rock BR', frequency: 'ROCK', url: 'https://ice6.somafm.com/seventies-128-mp3', color: '#ffb300' }
];

// Vibrant palette to override dark hashes
const vibrantColors = ['#ff2a5f', '#00f2fe', '#ffb300', '#ff1493', '#4facfe', '#f83600', '#00c6ff', '#43e97b', '#a18cd1', '#ff0844', '#ffd700'];

const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info'
];

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
  const [stations, setStations] = useState<Station[]>(fallbackStations);
  const [currentStation, setCurrentStation] = useState<Station>(fallbackStations[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch dynamic stations on load
  useEffect(() => {
    const fetchStations = async () => {
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
              name.includes('pop hits brasil')
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
            
            const isHeart = cleanName.toLowerCase().includes('heart');
            
            return {
              id: st.stationuuid,
              name: cleanName,
              frequency: st.tags.split(',')[0]?.toUpperCase() || 'BRAZIL',
              url: st.url_resolved,
              color: vibrantColors[index % vibrantColors.length],
              logo: isHeart ? '/heart-logo.png' : undefined
            };
          });

          
          // Prepend some of our custom requested genres as guaranteed fallbacks
          const finalStations = [
            ...fallbackStations,
            ...apiStations.filter((s: Station) => !fallbackStations.find(f => f.url === s.url)) // remove dupes
          ];
          
          setStations(finalStations);
          setCurrentStation(finalStations[0]);
        }
      } catch (error) {
        console.error("Failed to fetch stations:", error);
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
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (error: any) {
        // Ignore AbortError caused by rapid play/pause
        if (error.name !== 'AbortError') {
          console.error("Playback error, skipping broken station:", error);
          
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

    audio.addEventListener('error', handleAudioError);
    playAudio();

    return () => {
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
  }, [volume]);

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
      />
      <InstallPrompt />
    </>
  );
}

export default App;
