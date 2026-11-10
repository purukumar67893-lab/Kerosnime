import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Bookmark,
  Calendar,
  Layers,
  Star,
  Search,
  ArrowUpDown,
  Tv,
  Clock,
  Film,
  Building2,
} from 'lucide-react';
import { AnimeDetails, AnimeEpisode } from '../types/anime';
import { api, storage } from '../services/api';

interface AnimeDetailModalProps {
  slugOrUrl: string;
  onClose: () => void;
  onSelectEpisode: (epSlugOrUrl: string) => void;
  onToggleBookmark: (item: any) => void;
  isBookmarked: boolean;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  slugOrUrl,
  onClose,
  onSelectEpisode,
  onToggleBookmark,
  isBookmarked,
}) => {
  const [details, setDetails] = useState<AnimeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEp, setSearchEp] = useState('');
  const [isReversed, setIsReversed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getAnimeDetails(slugOrUrl)
      .then((data) => {
        if (!isMounted) return;
        setDetails(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load anime details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slugOrUrl]);

  // Lock background body scroll while modal is active
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          <span className="text-sm font-medium text-slate-300">Fetching anime catalog details...</span>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h3 className="text-base font-bold text-white mb-2">Unable to load details</h3>
          <p className="text-xs text-slate-400 mb-6">{error || 'Network error fetching data'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Filter episodes
  const filteredEpisodes = details.episodes.filter(
    (ep) =>
      ep.number.includes(searchEp) ||
      ep.title.toLowerCase().includes(searchEp.toLowerCase())
  );

  const displayEpisodes = isReversed
    ? [...filteredEpisodes].reverse()
    : filteredEpisodes;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start min-h-screen">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl my-auto flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl max-h-[92vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Hero Area */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-b from-slate-900/80 to-slate-950 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster */}
            <div className="relative aspect-[3/4] w-36 sm:w-44 shrink-0 overflow-hidden rounded-xl border border-slate-800 shadow-xl bg-slate-900">
              <img
                src={details.poster}
                alt={details.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2 text-xs text-rose-400 font-semibold uppercase tracking-wider">
                <span>{details.type}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-300">{details.status}</span>
                {details.rating && (
                  <>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {details.rating}
                    </span>
                  </>
                )}
              </div>

              <h2 className="mt-1.5 text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {details.title}
              </h2>

              {/* Unboxed Metadata Line */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {details.studio !== 'Unknown' && (
                  <>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {details.studio}
                    </span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                {details.released !== 'Unknown' && (
                  <>
                    <span>{details.released}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span>{details.totalEpisodes} Episodes</span>
              </div>

              {/* Genres list - clean unboxed typography */}
              {details.genres.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-slate-500 font-medium">Genres:</span>
                  {details.genres.map((g, idx) => (
                    <React.Fragment key={g}>
                      <span className="text-slate-300 hover:text-rose-400 cursor-default transition-colors">
                        {g}
                      </span>
                      {idx < details.genres.length - 1 && (
                        <span aria-hidden="true" className="text-slate-600">
                          /
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {details.synopsis && (
                <p className="mt-3 text-xs sm:text-sm text-slate-300 line-clamp-3 sm:line-clamp-4 leading-relaxed">
                  {details.synopsis}
                </p>
              )}

              {/* Quick Actions */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {details.episodes.length > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectEpisode(
                        details.episodes[details.episodes.length - 1]?.slug ||
                          details.episodes[0]?.slug
                      );
                    }}
                    className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-all whitespace-nowrap"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Watch First Episode</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    onToggleBookmark({
                      slug: details.slug,
                      title: details.title,
                      poster: details.poster,
                      type: details.type,
                      totalEpisodes: details.totalEpisodes,
                    })
                  }
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                    isBookmarked
                      ? 'border-rose-600 bg-rose-600/10 text-rose-400'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isBookmarked ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Directory Section */}
        <div className="flex flex-1 flex-col p-6 overflow-hidden">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Episodes Catalog</h3>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                ({displayEpisodes.length} available)
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search filter input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter episode..."
                  value={searchEp}
                  onChange={(e) => setSearchEp(e.target.value)}
                  className="w-36 sm:w-44 pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Sort order toggle */}
              <button
                onClick={() => setIsReversed(!isReversed)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap"
                title="Reverse order"
              >
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <span className="text-[11px]">{isReversed ? 'Oldest first' : 'Newest first'}</span>
              </button>
            </div>
          </div>

          {/* Episodes List Grid */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            {displayEpisodes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {displayEpisodes.map((ep: AnimeEpisode) => (
                  <button
                    key={ep.slug || ep.number}
                    onClick={() => {
                      onClose();
                      onSelectEpisode(ep.slug || ep.href);
                    }}
                    className="flex flex-col p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800 hover:border-rose-500/50 hover:shadow-md text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors font-mono tabular-nums">
                        Episode {ep.number}
                      </span>
                      {ep.sub && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {ep.sub}
                        </span>
                      )}
                    </div>
                    {ep.date && (
                      <span className="mt-1 text-[10px] text-slate-500 truncate">
                        {ep.date}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No episodes found matching "{searchEp}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
