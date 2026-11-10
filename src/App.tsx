/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  Compass,
  Play,
  Bookmark,
  ChevronRight,
  TrendingUp,
  History,
} from 'lucide-react';
import { AnimeCardItem, WatchHistoryItem } from './types/anime';
import { api, storage } from './services/api';
import { Navbar } from './components/Navbar';
import { HeroSpotlight } from './components/HeroSpotlight';
import { AnimeCard } from './components/AnimeCard';
import { PlayerView } from './components/PlayerView';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { DirectoryView } from './components/DirectoryView';
import { SearchModal } from './components/SearchModal';
import { WatchlistView } from './components/WatchlistView';
import { Footer } from './components/Footer';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'directory' | 'popular' | 'recent' | 'watchlist'>('home');
  const [activeView, setActiveView] = useState<'browse' | 'player'>('browse');
  const [playerEpisodeSlug, setPlayerEpisodeSlug] = useState<string | null>(null);

  // Selected anime for series detail modal
  const [selectedAnimeSlug, setSelectedAnimeSlug] = useState<string | null>(null);

  // Search modal state
  const [searchOpen, setSearchOpen] = useState(false);

  // Bookmarks count reactive state
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // Home data
  const [recentEpisodes, setRecentEpisodes] = useState<AnimeCardItem[]>([]);
  const [popularAnime, setPopularAnime] = useState<AnimeCardItem[]>([]);
  const [spotlightItems, setSpotlightItems] = useState<AnimeCardItem[]>([]);
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [errorHome, setErrorHome] = useState<string | null>(null);

  // Directory filter preset state (when user clicks genre chip)
  const [directoryGenre, setDirectoryGenre] = useState<string>('');

  const syncBookmarks = () => {
    setBookmarkCount(storage.getBookmarks().length);
  };

  const loadHistory = () => {
    setHistoryItems(storage.getHistory());
  };

  // Keyboard shortcut for Cmd/Ctrl+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial load
  useEffect(() => {
    syncBookmarks();
    loadHistory();

    async function loadInitialData() {
      setLoadingHome(true);
      setErrorHome(null);
      try {
        const [recentRes, popRes] = await Promise.all([
          api.getRecentEpisodes(1),
          api.getPopularAnime(1),
        ]);

        setRecentEpisodes(recentRes.items);
        setPopularAnime(popRes.items);

        // Spotlight: mix of top popular and latest
        const spotlights = popRes.items.slice(0, 5);
        setSpotlightItems(spotlights.length > 0 ? spotlights : recentRes.items.slice(0, 5));
      } catch (err: any) {
        console.error('Failed to load anime feed:', err);
        setErrorHome(err.message || 'Unable to connect to GogoAnime feed');
      } finally {
        setLoadingHome(false);
      }
    }

    loadInitialData();
  }, []);

  // Handlers
  const handleSelectAnime = (item: AnimeCardItem) => {
    if (item.isEpisode) {
      // Direct episode click -> launch player
      setPlayerEpisodeSlug(item.slug || item.href);
      setActiveView('player');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Series click -> open details modal with episode list
      setSelectedAnimeSlug(item.slug || item.href);
    }
  };

  const handleLaunchEpisode = (slugOrUrl: string) => {
    setPlayerEpisodeSlug(slugOrUrl);
    setActiveView('player');
    setSelectedAnimeSlug(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadHistory();
  };

  const handleToggleBookmark = (item: { slug: string; title: string; poster?: string; image?: string; type?: string; subType?: string }) => {
    storage.toggleBookmark(item);
    syncBookmarks();
  };

  const isBookmarked = (slug: string) => {
    return storage.isBookmarked(slug);
  };

  const handleGenreClick = (genreSlug: string) => {
    setDirectoryGenre(genreSlug);
    setCurrentTab('directory');
    setActiveView('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-rose-500/30">
      {/* Universal Top Bar */}
      <Navbar
        currentTab={activeView === 'player' ? '' : currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab as any);
          setActiveView('browse');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => setSearchOpen(true)}
        bookmarkCount={bookmarkCount}
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
        {/* Player View */}
        {activeView === 'player' && playerEpisodeSlug ? (
          <PlayerView
            episodeSlugOrUrl={playerEpisodeSlug}
            onBack={() => {
              setActiveView('browse');
              loadHistory();
            }}
            onSelectEpisode={(epSlug) => handleLaunchEpisode(epSlug)}
            onOpenSeries={(seriesSlug) => {
              setSelectedAnimeSlug(seriesSlug);
            }}
          />
        ) : currentTab === 'directory' ? (
          /* Directory Catalog with filters */
          <DirectoryView
            initialFilters={{ genre: directoryGenre }}
            onSelectAnime={handleSelectAnime}
            isBookmarked={isBookmarked}
            onToggleBookmark={handleToggleBookmark}
          />
        ) : currentTab === 'popular' ? (
          /* Dedicated Top Anime View */
          <div className="flex flex-col gap-6">
            <div className="pb-4 border-b border-slate-800">
              <h1 className="text-2xl font-bold text-white tracking-tight">Most Popular Anime</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Highest rated and most watched series in GogoAnime catalog
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {popularAnime.map((item, idx) => (
                <AnimeCard
                  key={`${item.slug}-${idx}`}
                  item={item}
                  onSelect={handleSelectAnime}
                  isBookmarked={isBookmarked(item.slug)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          </div>
        ) : currentTab === 'recent' ? (
          /* Dedicated Latest Episodes View */
          <div className="flex flex-col gap-6">
            <div className="pb-4 border-b border-slate-800">
              <h1 className="text-2xl font-bold text-white tracking-tight">Latest Released Episodes</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Freshly uploaded subbed and dubbed anime episodes
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {recentEpisodes.map((item, idx) => (
                <AnimeCard
                  key={`${item.slug}-${idx}`}
                  item={item}
                  onSelect={handleSelectAnime}
                  isBookmarked={isBookmarked(item.slug)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          </div>
        ) : currentTab === 'watchlist' ? (
          /* Personal Library / Watchlist */
          <WatchlistView
            onSelectAnime={handleSelectAnime}
            onSelectEpisode={handleLaunchEpisode}
            onUpdateBookmarks={syncBookmarks}
          />
        ) : (
          /* Home View */
          <div className="flex flex-col gap-10">
            {/* Cinematic Hero Spotlight Carousel */}
            {spotlightItems.length > 0 && (
              <HeroSpotlight
                items={spotlightItems}
                onPlay={handleSelectAnime}
                onOpenDetails={(item) => setSelectedAnimeSlug(item.slug || item.href)}
                isBookmarked={isBookmarked}
                onToggleBookmark={handleToggleBookmark}
              />
            )}

            {/* Continue Watching Strip (if user has history) */}
            {historyItems.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-rose-500" />
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Continue Watching
                    </h2>
                  </div>
                  <button
                    onClick={() => setCurrentTab('watchlist')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {historyItems.slice(0, 6).map((entry) => (
                    <div
                      key={entry.episodeSlug}
                      onClick={() => handleLaunchEpisode(entry.episodeSlug)}
                      className="group flex items-center gap-3 w-64 shrink-0 p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 transition-all cursor-pointer"
                    >
                      <div className="relative h-12 w-12 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                        {entry.poster ? (
                          <img
                            src={entry.poster}
                            alt={entry.animeTitle}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900">
                            <Play className="w-4 h-4 text-rose-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate group-hover:text-rose-400 transition-colors">
                          {entry.animeTitle}
                        </span>
                        <span className="text-[11px] text-rose-400 font-medium truncate">
                          {entry.episodeTitle || `Episode ${entry.episodeNumber}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quick Genres Bar */}
            <section className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-500 font-semibold shrink-0 mr-1">Genres:</span>
              {[
                { name: 'Action', slug: 'action' },
                { name: 'Adventure', slug: 'adventure' },
                { name: 'Fantasy', slug: 'fantasy' },
                { name: 'Comedy', slug: 'comedy' },
                { name: 'Shounen', slug: 'shounen' },
                { name: 'Sci-Fi', slug: 'sci-fi' },
                { name: 'Romance', slug: 'romance' },
                { name: 'Isekai', slug: 'isekai' },
                { name: 'Supernatural', slug: 'supernatural' },
              ].map((g) => (
                <button
                  key={g.slug}
                  onClick={() => handleGenreClick(g.slug)}
                  className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-slate-300 hover:border-rose-500/50 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {g.name}
                </button>
              ))}
            </section>

            {/* Section 1: Latest Episode Releases */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Latest Episode Releases
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentTab('recent')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <span>View More</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loadingHome ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                  <span className="text-xs text-slate-400">Loading latest anime updates...</span>
                </div>
              ) : errorHome ? (
                <div className="p-6 text-center text-xs text-rose-400 bg-slate-900/40 rounded-xl border border-slate-800">
                  {errorHome}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {recentEpisodes.slice(0, 12).map((item, idx) => (
                    <AnimeCard
                      key={`${item.slug}-${idx}`}
                      item={item}
                      onSelect={handleSelectAnime}
                      isBookmarked={isBookmarked(item.slug)}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Section 2: Most Popular Series */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Trending Popular Anime
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentTab('popular')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {loadingHome ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                  <span className="text-xs text-slate-400">Loading popular series...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {popularAnime.slice(0, 12).map((item, idx) => (
                    <AnimeCard
                      key={`${item.slug}-${idx}`}
                      item={item}
                      onSelect={handleSelectAnime}
                      isBookmarked={isBookmarked(item.slug)}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Series Detail Modal */}
      {selectedAnimeSlug && (
        <AnimeDetailModal
          slugOrUrl={selectedAnimeSlug}
          onClose={() => setSelectedAnimeSlug(null)}
          onSelectEpisode={handleLaunchEpisode}
          onToggleBookmark={handleToggleBookmark}
          isBookmarked={isBookmarked(selectedAnimeSlug)}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectAnime={handleSelectAnime}
        isBookmarked={isBookmarked}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* Universal Clean Footer */}
      <Footer />
    </div>
  );
}
