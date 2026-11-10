import React, { useState, useEffect } from 'react';
import { Bookmark, History, Trash2, Play, Film, Clock } from 'lucide-react';
import { BookmarkItem, WatchHistoryItem, AnimeCardItem } from '../types/anime';
import { storage } from '../services/api';

interface WatchlistViewProps {
  onSelectAnime: (item: AnimeCardItem) => void;
  onSelectEpisode: (episodeSlugOrUrl: string) => void;
  onUpdateBookmarks: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  onSelectAnime,
  onSelectEpisode,
  onUpdateBookmarks,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  const loadData = () => {
    setBookmarks(storage.getBookmarks());
    setHistory(storage.getHistory());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveBookmark = (slug: string) => {
    storage.toggleBookmark({ slug, title: '', poster: '' });
    loadData();
    onUpdateBookmarks();
  };

  const handleClearHistory = () => {
    storage.clearHistory();
    loadData();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header and Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Anime Library</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your bookmarked favorites and resume watching where you left off
          </p>
        </div>

        {/* Segmented Sub-Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setActiveSubTab('bookmarks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'bookmarks'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist ({bookmarks.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'history'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Continue Watching ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Bookmarks Section */}
      {activeSubTab === 'bookmarks' && (
        <div>
          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 p-6 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
              <Bookmark className="w-12 h-12 text-slate-600 mb-3" />
              <h2 className="text-base font-bold text-white mb-1">Your Watchlist is empty</h2>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Click the bookmark icon on any anime card or series page to save titles here for easy access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {bookmarks.map((item) => (
                <div
                  key={item.slug}
                  className="group relative flex flex-col rounded-lg bg-slate-900/60 border border-slate-800 overflow-hidden hover:border-slate-700 transition-all cursor-pointer"
                  onClick={() =>
                    onSelectAnime({
                      title: item.title,
                      slug: item.slug,
                      href: `https://gogoanime.or.at/anime/${item.slug}/`,
                      image: item.poster,
                      type: item.type,
                    })
                  }
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                    <img
                      src={item.poster}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark(item.slug);
                      }}
                      title="Remove from watchlist"
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span>{item.type || 'Anime'}</span>
                      {item.totalEpisodes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{item.totalEpisodes} Eps</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History / Continue Watching Section */}
      {activeSubTab === 'history' && (
        <div>
          {history.length > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Watch History</span>
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 p-6 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
              <History className="w-12 h-12 text-slate-600 mb-3" />
              <h2 className="text-base font-bold text-white mb-1">No watch history yet</h2>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Episodes you stream will appear here so you can easily continue watching later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {history.map((entry) => (
                <div
                  key={`${entry.episodeSlug}-${entry.watchedAt}`}
                  onClick={() => onSelectEpisode(entry.episodeSlug)}
                  className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                    {entry.poster ? (
                      <img
                        src={entry.poster}
                        alt={entry.animeTitle}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
                        <Film className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 fill-white text-white" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col min-w-0">
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                      {entry.animeTitle}
                    </h3>
                    <span className="text-[11px] text-rose-400 font-medium truncate mt-0.5">
                      {entry.episodeTitle || `Episode ${entry.episodeNumber}`}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.watchedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
