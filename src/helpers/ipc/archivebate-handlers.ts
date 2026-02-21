import { ipcMain } from "electron";
import { JSDOM } from "jsdom";

export interface ArchiveVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  views?: string;
  date?: string;
  embedUrl: string;
  pageUrl: string;
}

export interface ArchiveProfileResponse {
  username: string;
  videos: ArchiveVideo[];
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Linux"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

// Store for cookies and CSRF token
interface SessionState {
  csrfToken: string;
  cookies: Map<string, string>;
  fingerprint: any;
  serverMemo: any;
  componentName: string;
}

const sessionStates = new Map<string, SessionState>();
const initializationQueue = new Map<string, Promise<any>>();

// Global fallback cookies for first hits
const globalCookies: Map<string, string> = new Map();

/**
 * Extract CSRF token from HTML meta tag
 */
function extractCsrfToken(html: string): string | null {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute('content') || null;
}

/**
 * Extract cookies from Set-Cookie headers
 */
function extractCookies(setCookieHeaders: string[]): Map<string, string> {
  const cookies = new Map<string, string>();

  setCookieHeaders.forEach((header) => {
    const match = header.match(/^([^=]+)=([^;]+)/);
    if (match) {
      cookies.set(match[1], match[2]);
    }
  });

  return cookies;
}

/**
 * Build Cookie header from a cookie map
 */
function buildCookieHeader(cookies: Map<string, string>): string {
  const cookieArr: string[] = [];
  cookies.forEach((value, key) => {
    cookieArr.push(`${key}=${value}`);
  });
  return cookieArr.join('; ');
}

/**
 * Generate Livewire fingerprint
 */
function generateFingerprint(componentName: string, path: string): string {
  return btoa(JSON.stringify({
    id: "",
    name: componentName,
    locale: "en",
    path: path,
    method: "GET",
    v: "acj"
  }));
}

/**
 * Initialize session by fetching profile page and extracting CSRF token & cookies
 * Also returns initial videos if available
 */
async function initializeSession(username: string): Promise<{ success: boolean; initialVideos?: ArchiveVideo[]; totalVideos?: number }> {
  // Use a queue to prevent simultaneous initializations for the same user
  if (initializationQueue.has(username)) {
    return initializationQueue.get(username);
  }

  const promise = (async () => {
    try {
      // Small delay between initializations to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500));

      console.log('[ArchiveBate] Initializing session for:', username);

      const url = `https://archivebate.com/profile/${username}`;
      const response = await fetch(url, {
        headers: BROWSER_HEADERS,
      });

      if (!response.ok) {
        console.error(`[ArchiveBate] Failed to load profile page for ${username}: ${response.status}`);
        return { success: false };
      }

      // Extract cookies
      const setCookieHeaders = Array.from(response.headers.getSetCookie?.() || []);
      const userCookies = extractCookies(setCookieHeaders);

      // Global cookies fallback
      globalCookies.forEach((v, k) => {
        if (!userCookies.has(k)) userCookies.set(k, v);
      });

      const html = await response.text();
      let csrfToken = extractCsrfToken(html);

      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Parse initial videos
      const initialVideos: ArchiveVideo[] = [];
      const videoCards = document.querySelectorAll('section.video_item, .video_item, article.video-card, .video-card');

      videoCards.forEach((card, index) => {
        try {
          const link = card.querySelector('a[href*="/watch/"]');
          const video = card.querySelector('video, img[src*="thumb"], img[src*="poster"]');
          if (!link) return;

          const href = link.getAttribute('href')!;
          const poster = video?.getAttribute('poster') || video?.getAttribute('src') || video?.getAttribute('data-src') || '';

          const durationEl = card.querySelector('.duration, .time, .video-duration');
          const infoP = card.querySelector('.info p, .meta, .video-info');

          const durationText = durationEl?.textContent?.trim() || '';
          const infoText = infoP?.textContent?.trim() || '';
          const dateMatch = infoText.match(/(\d+ \w+ ago)/);
          const viewsMatch = infoText.match(/(\d+) views/);

          initialVideos.push({
            id: `${username}-init-${index}-${Date.now()}`,
            title: `${username} archive video`,
            thumbnail: poster,
            duration: durationText.split('\n').pop()?.trim() || '',
            views: viewsMatch ? viewsMatch[1] : '',
            date: dateMatch ? dateMatch[1] : '',
            pageUrl: href.startsWith('http') ? href : `https://archivebate.com${href}`,
            embedUrl: '',
          });
        } catch (e) { }
      });

      // Find total videos count
      let totalVideos = 0;
      const paginationContainer = document.querySelector('.pagination, .pagination-info, .showing-info');
      const pagText = paginationContainer?.textContent || document.body.textContent || '';
      const totalMatch = pagText.match(/of\s+(\d+)/i) ||
        html.match(/of\s+<span[^>]*>(\d+)<\/span>/i) ||
        html.match(/"total":\s*(\d+)/) ||
        html.match(/video_count":\s*(\d+)/);

      if (totalMatch) totalVideos = parseInt(totalMatch[1], 10);

      // Extract Livewire component data efficiently
      const componentEl = document.querySelector('[wire\\:initial-data]');
      let foundComponent = false;

      if (componentEl) {
        try {
          const rawData = componentEl.getAttribute('wire:initial-data')
            ?.replace(/&quot;/g, '"')
            ?.replace(/&amp;/g, '&') || '';
          const data = JSON.parse(rawData);
          const name = data.fingerprint?.name || '';

          if (name.includes('videos') || name === 'profile.model-videos') {
            sessionStates.set(username, {
              csrfToken: csrfToken || '',
              cookies: userCookies,
              componentName: name,
              fingerprint: data.fingerprint,
              serverMemo: data.serverMemo
            });
            foundComponent = true;
          }
        } catch (e) {
          console.error('[ArchiveBate] JSON parse error for initial-data:', e);
        }
      }

      console.log(`[ArchiveBate] ${username} Init: Videos=${initialVideos.length}, Total=${totalVideos}, Livewire=${foundComponent}`);

      return {
        success: foundComponent || initialVideos.length > 0,
        initialVideos,
        totalVideos
      };
    } catch (error) {
      console.error('[ArchiveBate] Error in initializeSession:', error);
      return { success: false };
    } finally {
      initializationQueue.delete(username);
    }
  })();

  initializationQueue.set(username, promise);
  return promise;
}

/**
 * Fetch archive videos using Livewire API
 */
async function fetchArchiveProfile(
  username: string,
  page: number = 1,
  retryCount: number = 0
): Promise<ArchiveProfileResponse> {
  const currentState = sessionStates.get(username);

  // Page 1 optimization
  if (page === 1) {
    const init = await initializeSession(username);
    if (init.success && init.initialVideos && init.initialVideos.length > 0) {
      const totalPages = Math.ceil((init.totalVideos || 0) / 20);
      return {
        username,
        videos: init.initialVideos,
        currentPage: 1,
        totalPages: totalPages || 1,
        hasMore: 1 < totalPages,
      };
    }
  }

  // Load component state if missing
  if (!currentState) {
    const init = await initializeSession(username);
    if (!init.success) throw new Error(`Failed to initialize session for ${username}`);
  }

  const session = sessionStates.get(username)!;

  try {
    const csrfToken = session.csrfToken;
    const cookieHeader = buildCookieHeader(session.cookies);
    const componentName = session.componentName;
    const xsrfToken = session.cookies.get('XSRF-TOKEN');

    // IMPORTANT: Livewire uses a checksum to verify that the serverMemo matches.
    // If we modify serverMemo.data, we MUST update the checksum (which we can't).
    // However, some fields might be editable if the server doesn't check them.
    // For Page 1, we should stick to the EXACT captured serverMemo to ensure it works.

    const payload: any = {
      fingerprint: { ...session.fingerprint },
      serverMemo: { ...session.serverMemo },
      updates: [{
        type: "callMethod",
        payload: {
          id: Math.random().toString(36).substring(2, 6),
          method: "load_profile_videos",
          params: []
        }
      }]
    };

    // If we are on Page 1, don't modify the serverMemo at all - try to use exactly what came from the server.
    if (page > 1) {
      const pageStr = String(page);
      if (!payload.serverMemo.data) payload.serverMemo.data = {};
      payload.serverMemo.data.page = pageStr;
      payload.serverMemo.data.currentPage = pageStr;
      if (!payload.serverMemo.data.paginators) payload.serverMemo.data.paginators = {};
      payload.serverMemo.data.paginators.page = pageStr;

      // Note: Changing page might still trigger a checksum error if the server validates it.
      // If it fails with 419/500, we might need to simulate a click 'updates' instead.
    }

    console.log(`[ArchiveBate] Fetching ${username} Page ${page} (Retry: ${retryCount})...`);

    const headers: any = {
      'User-Agent': BROWSER_HEADERS['User-Agent'],
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      'X-Livewire': 'true',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cookieHeader,
      'Origin': 'https://archivebate.com',
      'Referer': `https://archivebate.com/profile/${username}`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };

    // Synchronize X-XSRF-TOKEN if cookie exists
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    }

    const response = await fetch(`https://archivebate.com/livewire/message/${componentName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ArchiveBate] ${username} Livewire ${response.status}:`, errorText.substring(0, 150));

      // Handle session expiry or rate limiting with retry
      if ((response.status === 419 || response.status === 401 || response.status === 500) && retryCount < 2) {
        console.log(`[ArchiveBate] Retrying ${username} in 1.5s...`);
        sessionStates.delete(username); // Force fresh init
        await new Promise(r => setTimeout(r, 1500));
        return fetchArchiveProfile(username, page, retryCount + 1);
      }
      throw new Error(`Failed to fetch archive page: ${response.status}`);
    }

    // Update session cookies
    const setCookieHeaders = Array.from(response.headers.getSetCookie?.() || []);
    const newCookies = extractCookies(setCookieHeaders);
    newCookies.forEach((value, key) => session.cookies.set(key, value));

    const jsonResponse = await response.json();
    const html = jsonResponse?.effects?.html || '';
    if (!html) throw new Error("No HTML in Livewire response");

    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Parse videos (lenient parsing)
    const videos: ArchiveVideo[] = [];
    const videoCards = document.querySelectorAll('section.video_item, .video_item, article.video-card');

    videoCards.forEach((card, index) => {
      try {
        const link = card.querySelector('a[href*="/watch/"]');
        const video = card.querySelector('video, img[src*="thumb"]');
        if (!link) return;

        const href = link.getAttribute('href')!;
        const poster = video?.getAttribute('poster') || video?.getAttribute('src') || '';

        const durationEl = card.querySelector('.duration, .time');
        const infoP = card.querySelector('.info p, .meta');

        videos.push({
          id: `${username}-livewire-${page}-${index}-${Date.now()}`,
          title: `${username} archive video`,
          thumbnail: poster,
          duration: durationEl?.textContent?.trim().split('\n').pop()?.trim() || '',
          views: (infoP?.textContent?.match(/(\d+) views/) || [])[1] || '',
          date: (infoP?.textContent?.match(/(\d+ \w+ ago)/) || [])[1] || '',
          pageUrl: href.startsWith('http') ? href : `https://archivebate.com${href}`,
          embedUrl: '',
        });
      } catch (err) { }
    });

    // Pagination
    let totalVideos = 0;
    const paginationText = document.body.textContent || '';
    const totalMatch = paginationText.match(/of\s+(\d+)/i) || html.match(/of\s+<span[^>]*>(\d+)<\/span>/i);
    if (totalMatch) totalVideos = parseInt(totalMatch[1], 10);

    const totalPages = Math.ceil(totalVideos / 20) || page;
    const hasMore = page < totalPages;

    return {
      username,
      videos,
      currentPage: page,
      totalPages,
      hasMore,
    };
  } catch (error) {
    console.error(`[ArchiveBate] fetchArchiveProfile error for ${username}:`, error);
    return {
      username,
      videos: [],
      currentPage: page,
      totalPages: 1,
      hasMore: false,
    };
  }
}

/**
 * Get embed URL from video page
 */
async function getVideoEmbedUrl(pageUrl: string): Promise<{ embedUrl: string; thumbUrl: string }> {
  try {
    const response = await fetch(pageUrl.startsWith('http') ? pageUrl : `https://archivebate.com${pageUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    const html = await response.text();

    // Use JSDOM for parsing
    const dom = new JSDOM(html);
    const document = dom.window.document;

    let embedUrl = '';
    let thumbUrl = '';

    // Look for iframe embed
    const iframe = document.querySelector('iframe[src*="embed"], iframe[src*="video"], iframe[src*="mixdrop"]');
    if (iframe) {
      embedUrl = iframe.getAttribute('src') || '';
    }

    // Look for video element with source (fallback)
    if (!embedUrl) {
      const video = document.querySelector('video');
      if (video) {
        const source = video.querySelector('source');
        if (source) {
          embedUrl = source.getAttribute('src') || '';
        }
        if (!embedUrl) {
          embedUrl = video.getAttribute('src') || '';
        }
      }
    }

    // Look for any embed code patterns
    if (!embedUrl) {
      const embedElements = document.querySelectorAll('[data-embed], [data-src], [data-url]');
      for (const el of embedElements) {
        const src = el.getAttribute('data-embed') || el.getAttribute('data-src') || el.getAttribute('data-url');
        if (src && src.includes('http')) {
          embedUrl = src;
          break;
        }
      }
    }

    // Extract Thumbnail
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      thumbUrl = ogImage.getAttribute('content') || '';
    }

    // Fallbacks for thumbnail
    if (!thumbUrl) {
      const thumbInput = document.querySelector('input[name="t"]');
      if (thumbInput) {
        thumbUrl = thumbInput.getAttribute('value') || '';
      }
    }

    // Mixdrop / M1xdrop unpacker
    if (embedUrl && (embedUrl.includes('mixdrop') || embedUrl.includes('m1xdrop'))) {
      try {
        const targetUrl = embedUrl.startsWith('//') ? `https:${embedUrl}` : embedUrl;
        const urlObj = new URL(targetUrl);
        const mdResponse = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Referer': `${urlObj.protocol}//${urlObj.host}/`
          }
        });
        const mdHtml = await mdResponse.text();

        const funcMatch = mdHtml.match(/(eval\(function\(p,a,c,k,e,d\).+?\}\('(.*?)',(\d+),(\d+),'([^']+)'\.split\('\|'\).*?\)\))/);
        if (funcMatch) {
          const p = funcMatch[2];
          const a = parseInt(funcMatch[3]);
          const cCount = parseInt(funcMatch[4]);
          const k = funcMatch[5].split('|');

          const e = (c: number): string => {
            return (c < a ? '' : e(Math.floor(c / a))) + ((c % a) > 35 ? String.fromCharCode((c % a) + 29) : (c % a).toString(36));
          };

          let unpacked = p;
          let cnt = cCount;
          while (cnt-- > 0) {
            if (k[cnt]) {
              unpacked = unpacked.replace(new RegExp('\\b' + e(cnt) + '\\b', 'g'), k[cnt]);
            }
          }

          // Prioritize wurl and vurl over other metadata fields like furl
          const wurlMatch = unpacked.match(/wurl\s*=\s*"([^"]+)"/) ||
            unpacked.match(/vurl\s*=\s*"([^"]+)"/) ||
            unpacked.match(/(?:furl|src|file)\s*=\s*"([^"]+)"/);

          if (wurlMatch && wurlMatch[1] && wurlMatch[1].trim()) {
            const parsedUrl = wurlMatch[1];
            embedUrl = parsedUrl.startsWith('//') ? `https:${parsedUrl}` : parsedUrl;
            console.log('[ArchiveBate] Mixdrop direct MP4 URL found:', embedUrl);
          }
        }
      } catch (err) {
        console.error('[ArchiveBate] Failed to extract from Mixdrop:', err);
      }
    }

    return { embedUrl, thumbUrl };
  } catch (error) {
    console.error('Error fetching embed URL:', error);
    return { embedUrl: '', thumbUrl: '' };
  }
}


export function registerArchivebateHandlers() {
  ipcMain.handle("archivebate:getProfile", async (_event, username: string, page: number = 1) => {
    console.log('[ArchiveBate IPC] getProfile called:', { username, page });
    try {
      const result = await fetchArchiveProfile(username, page);
      console.log('[ArchiveBate IPC] Result:', { username, videoCount: result.videos.length, hasMore: result.hasMore });
      return { success: true, data: result };
    } catch (error) {
      console.error('[ArchiveBate IPC] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  ipcMain.handle("archivebate:getEmbedUrl", async (_event, pageUrl: string) => {
    console.log('[ArchiveBate IPC] getEmbedUrl called:', pageUrl);
    try {
      const result = await getVideoEmbedUrl(pageUrl);
      return { success: true, data: result };
    } catch (error) {
      console.error('[ArchiveBate IPC] Embed URL error:', error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });
}
