import { AnimeCardItem, AnimeDetails, EpisodeDetails, DirectoryFilters, WatchHistoryItem, BookmarkItem } from '../types/anime';

const API_BASE = '/api/anime';

// Helper for safe image loading with proxy fallback
export function getSafeImageUrl(url: string): string {
  if (!url) return '';
  // If it's already a relative URL or data URL
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  return url;
}

export const api = {
  // 1. Recent episode updates
  async getRecentEpisodes(page = 1): Promise<{ items: AnimeCardItem[]; page: number; hasNext: boolean }> {
    const res = await fetch(`${API_BASE}/recent?page=${page}`);
    if (!res.ok) throw new Error('Failed to load recent episodes');
    return res.json();
  },

  // 2. Popular anime
  async getPopularAnime(page = 1): Promise<{ items: AnimeCardItem[]; page: number; hasNext: boolean }> {
    const res = await fetch(`${API_BASE}/popular?page=${page}`);
    if (!res.ok) throw new Error('Failed to load popular anime');
    return res.json();
  },

  // 3. Directory with filters
  async getDirectory(filters: Partial<DirectoryFilters>): Promise<{
    items: AnimeCardItem[];
    page: number;
    hasNext: boolean;
  }> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.order) params.append('order', filters.order);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.sub) params.append('sub', filters.sub);
    if (filters.genre) params.append('genre', filters.genre);

    const res = await fetch(`${API_BASE}/directory?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load anime directory');
    return res.json();
  },

  // 4. Search anime
  async searchAnime(query: string, page = 1): Promise<{ items: AnimeCardItem[]; page: number; hasNext: boolean }> {
    if (!query.trim()) return { items: [], page: 1, hasNext: false };
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&page=${page}`);
    if (!res.ok) throw new Error('Failed to search anime');
    return res.json();
  },

  // 5. Anime details
  async getAnimeDetails(slugOrUrl: string): Promise<AnimeDetails> {
    const isUrl = slugOrUrl.startsWith('http');
    const param = isUrl ? `url=${encodeURIComponent(slugOrUrl)}` : `slug=${encodeURIComponent(slugOrUrl)}`;
    const res = await fetch(`${API_BASE}/details?${param}`);
    if (!res.ok) throw new Error('Failed to load anime details');
    return res.json();
  },

  // 6. Episode player details & servers
  async getEpisodeDetails(slugOrUrl: string): Promise<EpisodeDetails> {
    const isUrl = slugOrUrl.startsWith('http');
    const param = isUrl ? `url=${encodeURIComponent(slugOrUrl)}` : `slug=${encodeURIComponent(slugOrUrl)}`;
    const res = await fetch(`${API_BASE}/episode?${param}`);
    if (!res.ok) throw new Error('Failed to load episode stream');
    return res.json();
  },

  // 7. Genres list
  async getGenres(): Promise<{ slug: string; name: string }[]> {
    const res = await fetch(`${API_BASE}/genres`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.genres || [];
  },
};

// Local storage management for Watchlist & Watch History
const STORAGE_KEYS = {
  BOOKMARKS: 'kuroanime_bookmarks_v1',
  HISTORY: 'kuroanime_history_v1',
};

export const storage = {
  getBookmarks(): BookmarkItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  isBookmarked(slug: string): boolean {
    const list = this.getBookmarks();
    return list.some(b => b.slug === slug);
  },

  toggleBookmark(item: { slug: string; title: string; poster?: string; image?: string; subType?: string; type?: string }): boolean {
    const list = this.getBookmarks();
    const idx = list.findIndex(b => b.slug === item.slug);
    if (idx >= 0) {
      list.splice(idx, 1);
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(list));
      return false; // Removed
    } else {
      list.unshift({
        slug: item.slug,
        title: item.title,
        poster: item.poster || item.image || '',
        type: item.type,
        subType: item.subType,
        addedAt: Date.now(),
      });
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(list));
      return true; // Added
    }
  },

  getHistory(): WatchHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addToHistory(entry: {
    animeSlug: string;
    animeTitle: string;
    poster: string;
    episodeNumber: string;
    episodeSlug: string;
    episodeTitle: string;
  }) {
    const list = this.getHistory();
    // Remove if already in history for this episode
    const filtered = list.filter(h => h.episodeSlug !== entry.episodeSlug);
    filtered.unshift({
      ...entry,
      watchedAt: Date.now(),
    });
    // Cap at 60 items
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered.slice(0, 60)));
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  },
};
