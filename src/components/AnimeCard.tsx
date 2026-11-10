import React, { useState } from 'react';
import { Play, Bookmark, Film } from 'lucide-react';
import { AnimeCardItem } from '../types/anime';

interface AnimeCardProps {
  item: AnimeCardItem;
  onSelect: (item: AnimeCardItem) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (item: AnimeCardItem) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  item,
  onSelect,
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex flex-col rounded-lg bg-slate-900/60 border border-slate-800/80 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl hover:shadow-black/40"
    >
      {/* Poster Media Box */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
        {!imgError && item.image ? (
          <img
            src={item.image}
            alt={item.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-500">
            <Film className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
            <span className="text-xs font-medium text-slate-400 line-clamp-2">{item.title}</span>
          </div>
        )}

        {/* Contrast Scrim on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/40 transform scale-75 group-hover:scale-100 transition-transform duration-200">
            <Play className="h-5 w-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Quick Bookmark Toggle button */}
        {onToggleBookmark && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(item);
            }}
            aria-label={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`absolute top-2 right-2 p-1.5 rounded-md backdrop-blur-md transition-colors ${
              isBookmarked
                ? 'bg-rose-600 text-white'
                : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/80'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col p-3">
        <h3
          className="text-sm font-semibold text-slate-100 line-clamp-1 group-hover:text-rose-400 transition-colors"
          title={item.title}
        >
          {item.title}
        </h3>

        {/* Unboxed Metadata with Typographic Separators */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
          {item.episode && (
            <>
              <span className="font-medium text-rose-400">{item.episode}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          {item.subType && (
            <>
              <span>{item.subType}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{item.type || 'TV'}</span>
          {item.rating && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-medium">★ {item.rating}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
