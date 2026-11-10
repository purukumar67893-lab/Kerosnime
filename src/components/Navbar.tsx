import React from 'react';
import { Search, Bookmark, Compass, Flame, Clock } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch: () => void;
  bookmarkCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  bookmarkCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab('home')}
          className="group flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-lg shadow-lg shadow-rose-600/20 group-hover:bg-rose-500 transition-colors">
            K
          </div>
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Kuro<span className="text-rose-500">Anime</span>
          </span>
        </button>

        {/* Zone 2: Concise Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectTab('home')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'home'
                ? 'text-rose-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectTab('directory')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'directory'
                ? 'text-rose-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Browse</span>
          </button>

          <button
            onClick={() => onSelectTab('popular')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'popular'
                ? 'text-rose-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <span>Top Anime</span>
          </button>

          <button
            onClick={() => onSelectTab('recent')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'recent'
                ? 'text-rose-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Latest Episodes</span>
          </button>

          <button
            onClick={() => onSelectTab('watchlist')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'watchlist'
                ? 'text-rose-400 font-semibold'
                : 'hover:text-white text-slate-400'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Watchlist</span>
            {bookmarkCount > 0 && (
              <span className="text-xs text-rose-400 font-semibold">({bookmarkCount})</span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Search launcher) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-800/80 transition-all whitespace-nowrap shrink-0"
            aria-label="Search anime"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="hidden sm:inline">Search anime...</span>
            <kbd className="hidden sm:inline-block rounded border border-slate-700 bg-slate-800/70 px-1.5 py-0.5 text-[10px] text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="flex md:hidden border-t border-slate-800/60 bg-slate-950 px-4 py-2 gap-4 overflow-x-auto text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('home')}
          className={`whitespace-nowrap ${currentTab === 'home' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Home
        </button>
        <button
          onClick={() => onSelectTab('directory')}
          className={`whitespace-nowrap ${currentTab === 'directory' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Browse
        </button>
        <button
          onClick={() => onSelectTab('popular')}
          className={`whitespace-nowrap ${currentTab === 'popular' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Top Anime
        </button>
        <button
          onClick={() => onSelectTab('recent')}
          className={`whitespace-nowrap ${currentTab === 'recent' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Latest
        </button>
        <button
          onClick={() => onSelectTab('watchlist')}
          className={`whitespace-nowrap ${currentTab === 'watchlist' ? 'text-rose-400 font-semibold' : ''}`}
        >
          Watchlist {bookmarkCount > 0 && `(${bookmarkCount})`}
        </button>
      </div>
    </header>
  );
};
