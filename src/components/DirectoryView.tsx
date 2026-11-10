import React, { useState, useEffect } from 'react';
import { Filter, ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { AnimeCardItem, DirectoryFilters } from '../types/anime';
import { api } from '../services/api';
import { AnimeCard } from './AnimeCard';

interface DirectoryViewProps {
  onSelectAnime: (item: AnimeCardItem) => void;
  isBookmarked: (slug: string) => boolean;
  onToggleBookmark: (item: AnimeCardItem) => void;
  initialFilters?: Partial<DirectoryFilters>;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  onSelectAnime,
  isBookmarked,
  onToggleBookmark,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<DirectoryFilters>({
    page: 1,
    order: 'popular',
    status: '',
    type: '',
    sub: '',
    genre: '',
    ...initialFilters,
  });

  const [items, setItems] = useState<AnimeCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [genres, setGenres] = useState<{ slug: string; name: string }[]>([]);

  // Load genres
  useEffect(() => {
    api.getGenres().then(setGenres).catch(() => {});
  }, []);

  // Fetch catalog items
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getDirectory(filters)
      .then((data) => {
        if (!isMounted) return;
        setItems(data.items);
        setHasNext(data.hasNext);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch directory items');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const updateFilter = (key: keyof DirectoryFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // reset page on filter change
    }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Title & Filter Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Anime Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore unlimited anime database from GogoAnime with filterable genres and status
          </p>
        </div>

        {/* Quick Order by Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto text-xs">
          <button
            onClick={() => updateFilter('order', 'popular')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              filters.order === 'popular'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => updateFilter('order', 'update')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              filters.order === 'update'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Latest Update
          </button>
          <button
            onClick={() => updateFilter('order', 'rating')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              filters.order === 'rating'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Top Rated
          </button>
          <button
            onClick={() => updateFilter('order', 'title')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              filters.order === 'title'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Filter Row: Type, Status, Sub/Dub, Genre */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        {/* Genre */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Genre</label>
          <select
            value={filters.genre}
            onChange={(e) => updateFilter('genre', e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Format</label>
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          >
            <option value="">All Formats</option>
            <option value="tv">TV Series</option>
            <option value="movie">Movie</option>
            <option value="ova">OVA</option>
            <option value="special">Special</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>

        {/* Audio (Sub/Dub) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Audio</label>
          <select
            value={filters.sub}
            onChange={(e) => updateFilter('sub', e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
          >
            <option value="">All Audio</option>
            <option value="sub">Subtitled (Sub)</option>
            <option value="dub">English Dubbed</option>
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          <span className="text-xs text-slate-400 font-medium">Loading catalog results...</span>
        </div>
      ) : error ? (
        <div className="py-16 text-center rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-sm text-rose-400 mb-3">{error}</p>
          <button
            onClick={() => setFilters({ ...filters })}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          No anime series found matching these filter criteria. Try clearing some filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item, idx) => (
              <AnimeCard
                key={`${item.slug}-${idx}`}
                item={item}
                onSelect={onSelectAnime}
                isBookmarked={isBookmarked(item.slug)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-4 py-8 border-t border-slate-800">
            <button
              disabled={filters.page <= 1}
              onClick={() => {
                setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                filters.page > 1
                  ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-800/40 text-slate-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <span className="text-xs font-mono text-slate-400 tabular-nums">
              Page {filters.page}
            </span>

            <button
              disabled={!hasNext}
              onClick={() => {
                setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                hasNext
                  ? 'border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-600/25 hover:bg-rose-500'
                  : 'border-slate-800/40 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
