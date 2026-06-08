import { useState, useEffect, useRef } from 'react';

interface NowPlayingMeta {
  title: string | null;
  artist: string | null;
  loading: boolean;
}

/**
 * Tenta buscar o título da música atual do stream de rádio.
 *
 * Estratégia:
 * 1. Radio Browser API  — retorna metadados de estações conhecidas pelo URL/nome
 * 2. Laut.fm API        — para rádios do laut.fm
 * 3. SomaFM API         — para rádios SomaFM
 */
export function useNowPlaying(stationUrl: string | null, stationName: string): NowPlayingMeta {
  const [meta, setMeta] = useState<NowPlayingMeta>({ title: null, artist: null, loading: false });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parseTrack = (raw: string): { title: string; artist: string | null } => {
    const parts = raw.split(' - ');
    if (parts.length >= 2) {
      return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
    }
    return { title: raw.trim(), artist: null };
  };

  const fetchMeta = async () => {
    if (!stationUrl) return;

    try {
      // --- SomaFM ---
      if (stationUrl.includes('somafm.com')) {
        const channel = stationUrl.match(/somafm\.com\/([^-]+)/)?.[1] ?? '';
        const res = await fetch(`https://api.somafm.com/channels.json`);
        if (res.ok) {
          const data = await res.json();
          const ch = data.channels?.find((c: { id: string }) => c.id === channel);
          if (ch?.lastPlaying) {
            const parsed = parseTrack(ch.lastPlaying);
            setMeta({ ...parsed, loading: false });
            return;
          }
        }
      }

      // --- Laut.fm ---
      if (stationUrl.includes('laut.fm')) {
        const station = stationUrl.match(/stream\.laut\.fm\/([^/]+)/)?.[1] ?? '';
        if (station) {
          const res = await fetch(`https://api.laut.fm/station/${station}/current_song`);
          if (res.ok) {
            const data = await res.json();
            if (data?.title) {
              setMeta({ title: data.title, artist: data.artist?.name ?? null, loading: false });
              return;
            }
          }
        }
      }

      // --- Radio Browser API (pesquisa por nome) ---
      const encoded = encodeURIComponent(stationName);
      const rbRes = await fetch(
        `https://de1.api.radio-browser.info/json/stations/byname/${encoded}?limit=5`,
        { headers: { 'User-Agent': 'SoRetro/1.0' } }
      );
      if (rbRes.ok) {
        const stations = await rbRes.json();
        const match = stations?.[0];
        if (match?.lastcheckok === 1 && match?.uuid) {
          // Buscar o "now playing" via click endpoint
          const npRes = await fetch(
            `https://de1.api.radio-browser.info/json/url/${match.uuid}`,
            { headers: { 'User-Agent': 'SoRetro/1.0' } }
          );
          if (npRes.ok) {
            const npData = await npRes.json();
            if (npData?.name) {
              // Radio Browser não traz a música diretamente, mas podemos usar outros campos
            }
          }
        }
      }

      // --- Nossa API Vercel (Proxy ICY Metadata) ---
      // Acessa a edge function /api/meta que extrai corretamente os metadados
      const proxyUrl = `/api/meta?url=${encodeURIComponent(stationUrl)}`;
      const metaRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        const raw = metaData?.title ?? null;
        if (raw && raw.trim().length > 0) {
          const parsed = parseTrack(raw);
          setMeta({ ...parsed, loading: false });
          return;
        }
      }
    } catch {
      // Silently ignore — não queremos erros visíveis ao usuário
    }

    // Nenhuma fonte funcionou — mantém null sem mostrar loading
    setMeta(prev => ({ ...prev, loading: false }));
  };

  useEffect(() => {
    if (!stationUrl) {
      setMeta({ title: null, artist: null, loading: false });
      return;
    }

    setMeta({ title: null, artist: null, loading: true });
    fetchMeta();

    // Atualiza a cada 30 segundos
    intervalRef.current = setInterval(fetchMeta, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stationUrl, stationName]);

  return meta;
}
