import React, { useState, useEffect } from 'react';
import { Play, Info, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeCardItem } from '../types/anime';

interface HeroSpotlightProps {
  items: AnimeCardItem[];
  onPlay: (item: AnimeCardItem) => void;
  onOpenDetails: (item: AnimeCardItem) => void;
  isBookmarked: (slug: string) => boolean;
  onToggleBookmark: (item: AnimeCardItem) => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  items,
  onPlay,
  onOpenDetails,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto advance spotlight every 7 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];
  const bookmarked = isBookmarked(current.slug);

  return (
    <section className="relative w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-2xl">
      {/* Background Poster / Backdrop with Heavy Gradient Scrim */}
      <div className="absolute inset-0">
        <img
          src={current.image}
          alt={current.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center filter blur-md opacity-25 scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 sm:p-8 lg:p-10">
        {/* Left Column: Visual Poster Card */}
        <div className="relative aspect-[3/4] w-48 sm:w-56 shrink-0 overflow-hidden rounded-xl border border-slate-700/80 shadow-2xl">
          <img
            src={current.image}
            alt={current.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {current.episode && (
            <div className="absolute bottom-2 left-2 text-xs font-semibold text-white bg-rose-600/90 px-2 py-0.5 rounded">
              {current.episode}
            </div>
          )}
        </div>

        {/* Right Column: Title, Metadata, Description & Working CTAs */}
        <div className="flex flex-1 flex-col items-start text-left">
          {/* Unboxed Metadata Header */}
          <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
            <span>SPOTLIGHT FEATURE</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">{current.type || 'TV Series'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">GogoAnime Stream</span>
          </div>

          {/* Headline */}
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white line-clamp-2 max-w-2xl">
            {current.title}
          </h1>

          {/* Subtitle metadata */}
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span>{current.subType || 'Sub'} Available</span>
            <span aria-hidden="true">·</span>
            <span>Unlimited HD Streaming</span>
            {current.rating && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-semibold">★ {current.rating}</span>
              </>
            )}
          </div>

          <p className="mt-3 text-sm text-slate-300 line-clamp-3 max-w-2xl leading-relaxed">
            Experience high-definition anime streaming sourced directly from GogoAnime servers. Watch latest episodes, explore complete story arcs, and switch effortlessly between fast video mirrors.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onPlay(current)}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-all active:scale-95 whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => onOpenDetails(current)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-all whitespace-nowrap"
            >
              <Info className="h-4 w-4 text-slate-400" />
              <span>View Episodes</span>
            </button>

            <button
              onClick={() => onToggleBookmark(current)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                bookmarked
                  ? 'border-rose-600 bg-rose-600/10 text-rose-400'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{bookmarked ? 'Bookmarked' : 'Add to Watchlist'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel navigation buttons */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
            aria-label="Previous spotlight"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {currentIndex + 1} / {items.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
            aria-label="Next spotlight"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
};
