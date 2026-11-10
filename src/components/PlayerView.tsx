import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  SkipBack,
  SkipForward,
  List,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { EpisodeDetails, VideoServer, AnimeDetails, AnimeEpisode } from '../types/anime';
import { api, storage } from '../services/api';

interface PlayerViewProps {
  episodeSlugOrUrl: string;
  onBack: () => void;
  onSelectEpisode: (slugOrUrl: string) => void;
  onOpenSeries: (seriesSlugOrUrl: string) => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  episodeSlugOrUrl,
  onBack,
  onSelectEpisode,
  onOpenSeries,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [episodeData, setEpisodeData] = useState<EpisodeDetails | null>(null);
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [theaterMode, setTheaterMode] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [seriesDetails, setSeriesDetails] = useState<AnimeDetails | null>(null);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [episodeSlugOrUrl]);

  // Fetch episode details
  useEffect(() => {
    let isMounted = true;
    async function loadEpisode() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getEpisodeDetails(episodeSlugOrUrl);
        if (!isMounted) return;
        setEpisodeData(data);
        setCurrentServerIndex(0);

        // Record in watch history
        const episodeNum = data.title.match(/Episode\s+(\d+(\.\d+)?)/i)?.[1] || '';
        storage.addToHistory({
          animeSlug: data.series?.slug || '',
          animeTitle: data.series?.title || data.title.split('Episode')[0].trim(),
          poster: '',
          episodeNumber: episodeNum,
          episodeSlug: data.slug,
          episodeTitle: data.title,
        });

        // Load series episodes list in background for instant episode hopping
        if (data.series?.slug || data.series?.href) {
          setLoadingSeries(true);
          api
            .getAnimeDetails(data.series.slug || data.series.href)
            .then((s) => {
              if (isMounted) {
                setSeriesDetails(s);
                // Update history with poster if available
                if (s.poster) {
                  storage.addToHistory({
                    animeSlug: s.slug,
                    animeTitle: s.title,
                    poster: s.poster,
                    episodeNumber: episodeNum,
                    episodeSlug: data.slug,
                    episodeTitle: data.title,
                  });
                }
              }
            })
            .catch(() => {})
            .finally(() => {
              if (isMounted) setLoadingSeries(false);
            });
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load video episode');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEpisode();
    return () => {
      isMounted = false;
    };
  }, [episodeSlugOrUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        <span className="text-sm font-medium text-slate-400">Connecting to GogoAnime video server...</span>
      </div>
    );
  }

  if (error || !episodeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Failed to load video stream</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || 'Server stream unavailable'}</p>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Go Back
          </button>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-500"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const currentServer: VideoServer | undefined = episodeData.servers[currentServerIndex] || {
    name: 'Default Server',
    url: episodeData.currentEmbed,
  };

  return (
    <div ref={topRef} className={`flex flex-col gap-6 ${theaterMode ? 'max-w-full' : 'max-w-7xl'} mx-auto w-full transition-all duration-300`}>
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>

        <div className="flex items-center gap-2">
          {episodeData.series && (
            <button
              onClick={() => onOpenSeries(episodeData.series?.slug || episodeData.series?.href || '')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            >
              <List className="w-3.5 h-3.5 text-rose-400" />
              <span>Series Episodes</span>
            </button>
          )}

          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            title={theaterMode ? 'Default View' : 'Theater View'}
          >
            {theaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{theaterMode ? 'Standard' : 'Theater'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Frame & Sidebar Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player & Controls */}
        <div className={theaterMode ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-9'}>
          {/* 16:9 Responsive Video Viewport */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-slate-800 shadow-2xl">
            {currentServer?.url ? (
              <iframe
                key={`${currentServer.url}-${reloadKey}`}
                src={currentServer.url}
                title={episodeData.title}
                allowFullScreen
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-slate-400">
                <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
                <p>No video player embed found for this server.</p>
              </div>
            )}
          </div>

          {/* Quick Server Bar directly below video for instant Omega / Moon switching */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Fast Server:</span>
              {episodeData.servers.map((s, idx) => {
                const isOmega = s.name.toLowerCase().includes('omega');
                const isMoon = s.name.toLowerCase().includes('moon');
                if (!isOmega && !isMoon) return null;
                const isCurrent = idx === currentServerIndex;

                return (
                  <button
                    key={`${s.name}-${idx}`}
                    onClick={() => {
                      setCurrentServerIndex(idx);
                      setReloadKey((k) => k + 1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isCurrent
                        ? isOmega
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                          : 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    <span>{isOmega ? '⚡' : '🌙'}</span>
                    <span>{s.name}</span>
                    {isCurrent && <span className="text-[10px] ml-1 bg-black/20 px-1 py-0.5 rounded font-bold">Active</span>}
                  </button>
                );
              })}

              {episodeData.servers.length > 1 && (
                <button
                  onClick={() => {
                    setCurrentServerIndex((prev) => (prev + 1) % episodeData.servers.length);
                    setReloadKey((k) => k + 1);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  title="Switch to next mirror server if current has buffering"
                >
                  <RefreshCw className="w-3 h-3 text-rose-400" />
                  <span>Next Server</span>
                </button>
              )}
            </div>

            {currentServer?.url && (
              <a
                href={currentServer.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Pop-out Player</span>
              </a>
            )}
          </div>

          {/* Episode Title & Playback Controls Bar */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {episodeData.title}
              </h1>
              {episodeData.series?.title && (
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-rose-400 font-medium">{episodeData.series.title}</span>
                  <span aria-hidden="true">·</span>
                  <span>Active Server: {currentServer?.name}</span>
                </div>
              )}
            </div>

            {/* Navigation buttons: Prev / Next */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={!episodeData.prevEpisode}
                onClick={() =>
                  episodeData.prevEpisode &&
                  onSelectEpisode(episodeData.prevEpisode.slug || episodeData.prevEpisode.href)
                }
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  episodeData.prevEpisode
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                    : 'border-slate-800/40 bg-slate-900/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>Prev Episode</span>
              </button>

              <button
                disabled={!episodeData.nextEpisode}
                onClick={() =>
                  episodeData.nextEpisode &&
                  onSelectEpisode(episodeData.nextEpisode.slug || episodeData.nextEpisode.href)
                }
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  episodeData.nextEpisode
                    ? 'border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-600/30 hover:bg-rose-500'
                    : 'border-slate-800/40 bg-slate-900/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>Next Episode</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Video Servers Switcher */}
          <div className="mt-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Server className="w-4 h-4 text-rose-500" />
                <span>All Available Streaming Servers</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
                  title="Reload stream"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reload Server</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {episodeData.servers.length > 0 ? (
                episodeData.servers.map((server, idx) => {
                  const isActive = idx === currentServerIndex;
                  const isOmega = server.name.toLowerCase().includes('omega');
                  const isMoon = server.name.toLowerCase().includes('moon');

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentServerIndex(idx);
                        setReloadKey((k) => k + 1);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                          : isOmega
                          ? 'bg-amber-950/40 text-amber-300 border border-amber-700/60 hover:bg-amber-900/60'
                          : isMoon
                          ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-900/60'
                          : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold">{server.name}</span>
                      {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-slate-500">Default GogoAnime player loaded</span>
              )}
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-normal">
              Omega and Moon servers are now active on all anime. If one server experiences buffering or copyright notice, switch to Omega or Moon for smooth uninterrupted streaming.
            </p>
          </div>
        </div>

        {/* Right Column: Series Episodes List & Quick Hopping */}
        <div className={theaterMode ? 'lg:col-span-12' : 'lg:col-span-4 xl:col-span-3'}>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold text-white">Episodes List</h2>
              </div>
              {seriesDetails && (
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {seriesDetails.episodes.length} Total
                </span>
              )}
            </div>

            {loadingSeries ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border border-rose-500 border-t-transparent" />
                <span className="text-xs text-slate-500">Loading series list...</span>
              </div>
            ) : seriesDetails && seriesDetails.episodes.length > 0 ? (
              <div className="mt-3 max-h-[500px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                {seriesDetails.episodes.map((ep: AnimeEpisode) => {
                  const isCurrent =
                    ep.slug === episodeData.slug ||
                    ep.href === episodeData.href ||
                    episodeSlugOrUrl.includes(ep.slug);

                  return (
                    <button
                      key={ep.slug || ep.number}
                      onClick={() => onSelectEpisode(ep.slug || ep.href)}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all ${
                        isCurrent
                          ? 'bg-rose-600/15 border border-rose-500/50 text-rose-300 font-semibold'
                          : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex-shrink-0 w-8 font-mono tabular-nums text-slate-400">
                          #{ep.number}
                        </span>
                        <span className="truncate">{ep.title}</span>
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider shrink-0 ml-2">
                          Playing
                        </span>
                      ) : (
                        ep.sub && (
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                            {ep.sub}
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                <span>Navigate using Prev/Next buttons above</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
