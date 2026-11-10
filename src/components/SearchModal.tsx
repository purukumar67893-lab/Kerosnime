import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Flame } from 'lucide-react';
import { AnimeCardItem } from '../types/anime';
import { api } from '../services/api';
import { AnimeCard } from './AnimeCard';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnime: (item: AnimeCardItem) => void;
  isBookmarked: (slug: string) => boolean;
  onToggleBookmark: (item: AnimeCardItem) => void;
}

const POPULAR_QUERIES = [
  'One Piece',
  'Naruto',
  'Bleach',
  'Attack on Titan',
  'Jujutsu Kaisen',
  'Demon Slayer',
  'Solo Leveling',
  'Dragon Ball',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAnime,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Lock body scroll when search is active
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      api
        .searchAnime(query.trim())
        .then((data) => {
          setResults(data.items);
        })
        .catch((err) => {
          setError(err.message || 'Search failed');
        })
        .finally(() => {
          setLoading(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 pt-12 sm:pt-20 overflow-y-auto">
      <div className="relative w-full max-w-3xl flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4">
          <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search thousands of anime titles on GogoAnime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-white mr-2"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
          >
            Esc
          </button>
        </div>

        {/* Quick query pills if no search yet */}
        {!query && (
          <div className="p-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Trending Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Area */}
        {query && (
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                <span className="text-xs text-slate-400">Searching GogoAnime database...</span>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-xs text-rose-400">{error}</div>
            ) : results.length > 0 ? (
              <div>
                <span className="block text-xs font-semibold text-slate-400 mb-4">
                  Found {results.length} results for "{query}"
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {results.map((item, idx) => (
                    <AnimeCard
                      key={`${item.slug}-${idx}`}
                      item={item}
                      onSelect={(chosen) => {
                        onClose();
                        onSelectAnime(chosen);
                      }}
                      isBookmarked={isBookmarked(item.slug)}
                      onToggleBookmark={onToggleBookmark}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No anime found matching "{query}". Try a different spelling or keyword.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
