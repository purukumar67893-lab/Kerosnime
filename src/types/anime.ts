export interface AnimeCardItem {
  title: string;
  slug: string;
  href: string;
  episode?: string;
  subType?: 'Sub' | 'Dub' | string;
  type?: string;
  image: string;
  rating?: string;
  isEpisode?: boolean;
}

export interface AnimeEpisode {
  number: string;
  title: string;
  date?: string;
  sub?: string;
  href: string;
  slug: string;
}

export interface AnimeDetails {
  title: string;
  slug: string;
  href: string;
  poster: string;
  synopsis: string;
  rating?: string;
  genres: string[];
  status: string;
  studio: string;
  released: string;
  type: string;
  duration?: string;
  season?: string;
  totalEpisodes: number;
  episodes: AnimeEpisode[];
}

export interface VideoServer {
  name: string;
  url: string;
  isDefault?: boolean;
}

export interface EpisodeDetails {
  title: string;
  slug: string;
  href: string;
  currentEmbed: string;
  servers: VideoServer[];
  prevEpisode: { href: string; slug: string } | null;
  nextEpisode: { href: string; slug: string } | null;
  series: { href: string; slug: string; title: string } | null;
}

export interface WatchHistoryItem {
  animeSlug: string;
  animeTitle: string;
  poster: string;
  episodeNumber: string;
  episodeSlug: string;
  episodeTitle: string;
  watchedAt: number; // timestamp
  progressPercent?: number;
}

export interface BookmarkItem {
  slug: string;
  title: string;
  poster: string;
  subType?: string;
  type?: string;
  totalEpisodes?: number;
  addedAt: number;
}

export interface DirectoryFilters {
  page: number;
  order: 'popular' | 'update' | 'latest' | 'rating' | 'title' | 'titlereverse';
  status: '' | 'ongoing' | 'completed' | 'upcoming';
  type: '' | 'tv' | 'movie' | 'ova' | 'special';
  sub: '' | 'sub' | 'dub';
  genre: string;
}
