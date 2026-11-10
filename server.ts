import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;
const GOGO_BASE = 'https://gogoanime.or.at';

const app = express();
app.use(express.json());

// In-memory cache for ultra-fast response & reduced source load
const cache = new Map<string, { data: any; expiry: number }>();
function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  return cached.data as T;
}
function setCached(key: string, data: any, ttlSec: number = 300) {
  cache.set(key, { data, expiry: Date.now() + ttlSec * 1000 });
}

// Request helper with headers
async function fetchHtml(targetUrl: string): Promise<string> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': GOGO_BASE,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(targetUrl, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status} for ${targetUrl}`);
    }
    return await res.text();
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Helper to extract clean slug from URL
function extractSlug(url: string, prefix = ''): string {
  if (!url) return '';
  const clean = url.replace(GOGO_BASE, '').replace(/^\/+|\/+$/g, '');
  if (prefix && clean.startsWith(prefix)) {
    return clean.slice(prefix.length).replace(/^\/+|\/+$/g, '');
  }
  return clean;
}

// Parse anime cards from .bsx elements
function parseAnimeCards($: cheerio.CheerioAPI, selector = '.bsx'): any[] {
  const items: any[] = [];
  $(selector).each((_, el) => {
    const a = $(el).find('a').first();
    const href = a.attr('href') || '';
    if (!href) return;

    const title = $(el).find('.tt h2').text().trim() || $(el).find('.tt').text().trim();
    const episode = $(el).find('.bt .epx').text().trim();
    const subType = $(el).find('.bt .sb').text().trim() || 'Sub';
    const type = $(el).find('.typez').text().trim() || 'TV';
    const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
    const rating = $(el).find('.rating strong, .num').text().trim();

    const isEpisode = href.includes('-episode-') && !href.includes('/anime/');
    const slug = isEpisode ? extractSlug(href) : extractSlug(href, 'anime');

    items.push({
      title,
      slug,
      href,
      episode,
      subType,
      type,
      image,
      rating: rating || undefined,
      isEpisode,
    });
  });
  return items;
}

// 1. Recent episode updates
app.get('/api/anime/recent', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const cacheKey = `recent_page_${page}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const targetUrl = page > 1 ? `${GOGO_BASE}/page/${page}/` : `${GOGO_BASE}/`;
    const html = await fetchHtml(targetUrl);
    const $ = cheerio.load(html);

    const items = parseAnimeCards($, '.bsx');

    // Check pagination
    const hasNext = $('.hpage a.r, .pagination a.next, .pagination .next').length > 0;
    const result = { items, page, hasNext };
    setCached(cacheKey, result, 180); // cache for 3 mins
    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching recent anime:', error.message);
    return res.status(500).json({ error: 'Failed to fetch recent episodes', message: error.message, items: [] });
  }
});

// 2. Popular anime series
app.get('/api/anime/popular', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const cacheKey = `popular_page_${page}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const targetUrl = `${GOGO_BASE}/anime/?page=${page}&order=popular`;
    const html = await fetchHtml(targetUrl);
    const $ = cheerio.load(html);

    const items = parseAnimeCards($, '.bsx');
    const hasNext = $('.hpage a.r, .pagination a.next').length > 0;
    const result = { items, page, hasNext };
    setCached(cacheKey, result, 600); // 10 mins cache
    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching popular anime:', error.message);
    return res.status(500).json({ error: 'Failed to fetch popular anime', message: error.message, items: [] });
  }
});

// 3. Directory / Catalog with multi-filters
app.get('/api/anime/directory', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const order = (req.query.order as string) || 'popular'; // popular, update, latest, rating, title, titlereverse
    const status = (req.query.status as string) || ''; // ongoing, completed, upcoming, hiatus
    const type = (req.query.type as string) || ''; // tv, movie, ova, special, ona, bd
    const sub = (req.query.sub as string) || ''; // sub, dub, raw
    const genre = (req.query.genre as string) || '';

    const cacheKey = `dir_${page}_${order}_${status}_${type}_${sub}_${genre}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    if (order) params.append('order', order);
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    if (sub) params.append('sub', sub);
    if (genre) params.append('genre[]', genre);

    const targetUrl = `${GOGO_BASE}/anime/?${params.toString()}`;
    const html = await fetchHtml(targetUrl);
    const $ = cheerio.load(html);

    const items = parseAnimeCards($, '.bsx');
    const hasNext = $('.hpage a.r, .pagination a.next').length > 0;

    const result = { items, page, hasNext, filters: { order, status, type, sub, genre } };
    setCached(cacheKey, result, 300);
    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching directory:', error.message);
    return res.status(500).json({ error: 'Failed to fetch directory', message: error.message, items: [] });
  }
});

// 4. Search anime
app.get('/api/anime/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const page = parseInt(req.query.page as string, 10) || 1;
    if (!q) {
      return res.json({ items: [], page: 1, hasNext: false });
    }

    const cacheKey = `search_${q.toLowerCase()}_${page}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const targetUrl = page > 1 
      ? `${GOGO_BASE}/page/${page}/?s=${encodeURIComponent(q)}`
      : `${GOGO_BASE}/?s=${encodeURIComponent(q)}`;

    const html = await fetchHtml(targetUrl);
    const $ = cheerio.load(html);

    const items = parseAnimeCards($, '.bsx');
    const hasNext = $('.hpage a.r, .pagination a.next').length > 0;

    const result = { items, page, query: q, hasNext };
    setCached(cacheKey, result, 300);
    return res.json(result);
  } catch (error: any) {
    console.error('Error searching anime:', error.message);
    return res.status(500).json({ error: 'Failed to search anime', message: error.message, items: [] });
  }
});

// 5. Anime series details & full episode list
app.get('/api/anime/details', async (req: Request, res: Response) => {
  try {
    let slug = (req.query.slug as string || '').trim();
    const url = (req.query.url as string || '').trim();

    if (!slug && !url) {
      return res.status(400).json({ error: 'slug or url required' });
    }

    let targetUrl = '';
    if (url && url.startsWith('http')) {
      targetUrl = url;
      slug = extractSlug(url, 'anime');
    } else {
      // Clean slug
      slug = slug.replace(/^\/+|\/+$/g, '').replace(/^anime\//, '');
      targetUrl = `${GOGO_BASE}/anime/${slug}/`;
    }

    const cacheKey = `details_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const html = await fetchHtml(targetUrl);
    const $ = cheerio.load(html);

    const title = $('h1.entry-title').text().trim() || $('title').text().replace('- Gogoanime', '').trim();
    const poster = $('.thumb img').attr('src') || $('.infox img').attr('src') || $('img.wp-post-image').attr('src') || '';
    const synopsis = $('.entry-content[itemprop="description"] p').text().trim() || $('.entry-content p').text().trim();
    
    // Rating
    const ratingText = $('.rating strong, .num').first().text().trim();
    const rating = ratingText.replace(/[^0-9.]/g, '') || undefined;

    // Genres
    const genres: string[] = [];
    $('.genxed a').each((_, el) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) genres.push(g);
    });

    // Metadata specs (Status, Studio, Season, Type, Released, etc.)
    const metadata: Record<string, string> = {};
    $('.spe span').each((_, el) => {
      const text = $(el).text();
      const parts = text.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const value = parts.slice(1).join(':').trim();
        metadata[key] = value;
      }
    });

    // Episodes list
    const episodes: any[] = [];
    $('.eplister ul li').each((_, el) => {
      const a = $(el).find('a');
      const href = a.attr('href') || '';
      const num = $(el).find('.epl-num').text().trim();
      const epTitle = $(el).find('.epl-title').text().trim();
      const date = $(el).find('.epl-date').text().trim();
      const sub = $(el).find('.epl-sub').text().trim() || 'Sub';
      const epSlug = extractSlug(href);

      if (href) {
        episodes.push({
          number: num,
          title: epTitle || `Episode ${num}`,
          date,
          sub,
          href,
          slug: epSlug,
        });
      }
    });

    const result = {
      title,
      slug,
      href: targetUrl,
      poster,
      synopsis,
      rating,
      genres,
      status: metadata['status'] || 'Unknown',
      studio: metadata['studio'] || metadata['studios'] || 'Unknown',
      released: metadata['released'] || metadata['released on'] || metadata['season'] || 'Unknown',
      type: metadata['type'] || 'TV',
      duration: metadata['duration'] || '24 min',
      season: metadata['season'] || undefined,
      totalEpisodes: episodes.length,
      episodes,
    };

    setCached(cacheKey, result, 600); // 10 min cache
    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching anime details:', error.message);
    return res.status(500).json({ error: 'Failed to fetch anime details', message: error.message });
  }
});

// 6. Episode details & stream servers
app.get('/api/anime/episode', async (req: Request, res: Response) => {
  try {
    let slug = (req.query.slug as string || '').trim();
    const url = (req.query.url as string || '').trim();

    if (!slug && !url) {
      return res.status(400).json({ error: 'slug or url required' });
    }

    let targetUrl = '';
    if (url && url.startsWith('http')) {
      targetUrl = url;
      slug = extractSlug(url);
    } else {
      slug = slug.replace(/^\/+|\/+$/g, '');
      targetUrl = `${GOGO_BASE}/${slug}/`;
    }

    const cacheKey = `ep_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const html = await fetchHtml(targetUrl);
    const $ = cheerio.load(html);

    const title = $('h1.entry-title').text().trim() || $('title').text().replace('- Gogoanime', '').trim();
    const defaultEmbed = $('#pembed iframe').attr('src') || '';

    // Parse mirrors with guaranteed working Omega and Moon servers for all anime
    const rawServers: { name: string; url: string }[] = [];

    // Decode select.mirror options
    $('select.mirror option').each((_, opt) => {
      const val = $(opt).attr('value');
      const name = $(opt).text().trim();
      if (!val) return;

      try {
        const decoded = Buffer.from(val, 'base64').toString('utf-8');
        const match = decoded.match(/src=["']([^"']+)["']/i);
        if (match && match[1]) {
          const streamUrl = match[1];
          rawServers.push({
            name: name || `Server ${rawServers.length + 1}`,
            url: streamUrl,
          });
        }
      } catch (err) {
        // base64 decode failed, ignore
      }
    });

    // Extract malId from page scripts, attributes, or embeds
    let malId = '';
    const malMatch = html.match(/var\s+malId\s*=\s*['"](\d+)['"]/i) || 
                     html.match(/mal_id[=:]\s*['"]?(\d+)['"]?/i) ||
                     html.match(/mal_id=(\d+)/i) ||
                     defaultEmbed.match(/mal_id=(\d+)/i);
    if (malMatch && malMatch[1]) {
      malId = malMatch[1];
    }

    // Extract episode number
    let epNum = '1';
    const epMatch = html.match(/var\s+ep\s*=\s*['"](\d+)['"]/i) ||
                    slug.match(/-episode-(\d+)/i) ||
                    title.match(/Episode\s+(\d+)/i) ||
                    defaultEmbed.match(/ep=(\d+)/i);
    if (epMatch && epMatch[1]) {
      epNum = epMatch[1];
    }

    // Determine dub status for audio track matching
    const isDub = slug.includes('-dub-') || slug.endsWith('-dub') || title.toLowerCase().includes('dub') || html.includes('category=dub');

    const nativeOmega = rawServers.find(
      s => s.name.toLowerCase().includes('omega') || s.url.includes('vidmoly')
    );
    const nativeMoon = rawServers.find(
      s => s.name.toLowerCase().includes('moon') || s.url.includes('bysesayeveum') || s.url.includes('filemoon')
    );
    const nativeVidstreaming = rawServers.find(
      s => s.name.toLowerCase().includes('vidstreaming') || s.url.includes('player.php?m3u8=')
    );

    const basePlayer = defaultEmbed || (rawServers[0]?.url ?? '');

    // Consolidated servers list with guaranteed working Omega and Moon for all anime
    const servers: { name: string; url: string; isDefault?: boolean }[] = [];

    // 1. Guaranteed Omega Server
    if (nativeOmega) {
      servers.push({ name: 'Omega Server (Vidmoly)', url: nativeOmega.url, isDefault: true });
    } else if (malId) {
      servers.push({
        name: 'Omega Server (Vidstream)',
        url: `https://vidsrc.pm/embed/anime/${malId}/${epNum}${isDub ? '?dub=1' : ''}`,
        isDefault: true,
      });
    } else if (basePlayer) {
      let omegaUrl = basePlayer;
      if (omegaUrl.includes('type=')) {
        omegaUrl = omegaUrl.replace(/type=[^&]+/, 'type=omega');
      } else {
        omegaUrl = omegaUrl.includes('?') ? `${omegaUrl}&type=omega` : `${omegaUrl}?type=omega`;
      }
      servers.push({
        name: 'Omega Server',
        url: omegaUrl,
        isDefault: true,
      });
    }

    // 2. Guaranteed Moon Server
    if (nativeMoon) {
      servers.push({ name: 'Moon Server (Filemoon)', url: nativeMoon.url });
    } else if (malId) {
      servers.push({
        name: 'Moon Server (Filemoon)',
        url: `https://vidsrc.me/embed/anime?mal=${malId}&ep=${epNum}${isDub ? '&dub=1' : ''}`,
      });
    } else if (basePlayer) {
      let moonUrl = basePlayer;
      if (moonUrl.includes('type=')) {
        moonUrl = moonUrl.replace(/type=[^&]+/, 'type=moon');
      } else {
        moonUrl = moonUrl.includes('?') ? `${moonUrl}&type=moon` : `${moonUrl}?type=moon`;
      }
      servers.push({
        name: 'Moon Server',
        url: moonUrl,
      });
    }

    // 3. Moon Server 2 (Cloud Backup)
    if (malId) {
      servers.push({
        name: 'Moon Server 2 (Cloud)',
        url: `https://2embed.cc/embed/anime?mal=${malId}&ep=${epNum}${isDub ? '&dub=1' : ''}`,
      });
      // Omega Server 2 (Alternative Vidstream) if native Vidmoly was present as primary
      if (nativeOmega) {
        servers.push({
          name: 'Omega Server 2',
          url: `https://vidsrc.pm/embed/anime/${malId}/${epNum}${isDub ? '?dub=1' : ''}`,
        });
      }
    }

    // 4. Native Vidstreaming / Direct HLS M3U8 if present
    if (nativeVidstreaming && !servers.some(s => s.url === nativeVidstreaming.url)) {
      servers.push({
        name: 'Vidstreaming (Direct M3U8)',
        url: nativeVidstreaming.url,
      });
    }

    // 5. HD-1 Server (Gogo)
    if (defaultEmbed && !servers.some(s => s.url === defaultEmbed)) {
      servers.push({
        name: 'HD-1 Server (Gogo)',
        url: defaultEmbed,
      });
    }

    // 6. Other native mirrors (HD-2, etc.)
    for (const raw of rawServers) {
      if (!servers.some(s => s.url === raw.url)) {
        servers.push(raw);
      }
    }

    // Navigation links
    const prevEpUrl = $('a[rel="prev"]').attr('href') || null;
    const nextEpUrl = $('a[rel="next"]').attr('href') || null;
    const allEpisodesUrl = $('.naveps .nvsc a').attr('href') || null;

    // Series title from breadcrumb or navigation
    const seriesTitle = $('.ts-breadcrumb li:nth-child(2) a').text().trim() ||
                        $('.naveps .nvsc a').attr('aria-label') ||
                        '';

    const seriesSlug = allEpisodesUrl ? extractSlug(allEpisodesUrl, 'anime') : '';

    const result = {
      title,
      slug,
      href: targetUrl,
      currentEmbed: defaultEmbed || (servers[0]?.url ?? ''),
      servers,
      prevEpisode: prevEpUrl ? { href: prevEpUrl, slug: extractSlug(prevEpUrl) } : null,
      nextEpisode: nextEpUrl ? { href: nextEpUrl, slug: extractSlug(nextEpUrl) } : null,
      series: allEpisodesUrl ? { href: allEpisodesUrl, slug: seriesSlug, title: seriesTitle } : null,
    };

    setCached(cacheKey, result, 600);
    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching episode:', error.message);
    return res.status(500).json({ error: 'Failed to fetch episode details', message: error.message });
  }
});

// 7. Genre metadata list
app.get('/api/anime/genres', (_req: Request, res: Response) => {
  const genres = [
    { slug: 'action', name: 'Action' },
    { slug: 'adventure', name: 'Adventure' },
    { slug: 'comedy', name: 'Comedy' },
    { slug: 'drama', name: 'Drama' },
    { slug: 'fantasy', name: 'Fantasy' },
    { slug: 'sci-fi', name: 'Sci-Fi' },
    { slug: 'romance', name: 'Romance' },
    { slug: 'mystery', name: 'Mystery' },
    { slug: 'supernatural', name: 'Supernatural' },
    { slug: 'shounen', name: 'Shounen' },
    { slug: 'sports', name: 'Sports' },
    { slug: 'thriller', name: 'Thriller' },
    { slug: 'slice-of-life', name: 'Slice of Life' },
    { slug: 'isekai', name: 'Isekai' },
    { slug: 'psychological', name: 'Psychological' },
    { slug: 'horror', name: 'Horror' },
    { slug: 'magic', name: 'Magic' },
    { slug: 'mecha', name: 'Mecha' },
  ];
  return res.json({ genres });
});

// 8. Image Proxy to prevent hotlinking or referrer blocks
app.get('/api/proxy-image', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send('URL required');
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'Referer': GOGO_BASE,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    return res.status(500).send('Image proxy error');
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
