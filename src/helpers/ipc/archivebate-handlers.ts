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

// Store for cookies and CSRF token
let storedCsrfToken: string | null = null;
let storedCookies: Map<string, string> = new Map();
let storedHtmlHash: string | null = null;
let storedChecksum: string | null = null;
let storedWireId: string | null = null;

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
 * Build Cookie header from stored cookies
 */
function buildCookieHeader(): string {
  const cookies: string[] = [];

  if (storedCookies.has('XSRF-TOKEN')) {
    cookies.push(`XSRF-TOKEN=${encodeURIComponent(storedCookies.get('XSRF-TOKEN')!)}`);
  }
  if (storedCookies.has('archivebate_session')) {
    cookies.push(`archivebate_session=${storedCookies.get('archivebate_session')}`);
  }

  return cookies.join('; ');
}

/**
 * Generate Livewire fingerprint
 */
function generateFingerprint(): string {
  return btoa(JSON.stringify({
    id: "",
    name: "profile.model-videos",
    locale: "en",
    path: "profile",
    method: "GET",
    v: "acj"
  }));
}

/**
 * Initialize session by fetching profile page and extracting CSRF token & cookies
 */
async function initializeSession(username: string): Promise<boolean> {
  try {
    console.log('[ArchiveBate] Initializing session for:', username);
    const url = `https://archivebate.com/profile/${username}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    console.log('[ArchiveBate] Profile page response status:', response.status);

    if (!response.ok) return false;

    // Extract cookies from response
    const setCookieHeaders = Array.from(response.headers.getSetCookie?.() || []);
    console.log('[ArchiveBate] Cookies received:', setCookieHeaders.length);
    storedCookies = extractCookies(setCookieHeaders);

    // Extract CSRF token from HTML
    const html = await response.text();
    storedCsrfToken = extractCsrfToken(html);

    console.log('[ArchiveBate] CSRF token found:', !!storedCsrfToken);

    // Extract Livewire component data from the HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Find elements with wire:initial-data attribute
    const livewireElements = document.querySelectorAll('[wire\\:initial-data]');
    console.log('[ArchiveBate] Found Livewire elements:', livewireElements.length);

    livewireElements.forEach((element, index) => {
      try {
        const initialData = element.getAttribute('wire:initial-data');
        if (!initialData) return;

        // Decode HTML entities
        const decoded = initialData
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, "/")
          .replace(/&#x3D;/g, "=")
          .replace(/&#x5B;/g, "[")
          .replace(/&#x5D;/g, "]")
          .replace(/&#x7B;/g, "{")
          .replace(/&#x7D;/g, "}");

        const data = JSON.parse(decoded);

        // Check if this is the profile.model-videos component
        if (data.fingerprint?.name === 'profile.model-videos' || initialData.includes('profile.model-videos')) {
          console.log('[ArchiveBate] Found profile.model-videos component!');

          if (data.fingerprint?.id) {
            storedWireId = data.fingerprint.id;
            console.log('[ArchiveBate] wire:id:', storedWireId);
          }

          if (data.serverMemo?.htmlHash) {
            storedHtmlHash = data.serverMemo.htmlHash;
            console.log('[ArchiveBate] htmlHash:', storedHtmlHash);
          }

          if (data.serverMemo?.checksum) {
            storedChecksum = data.serverMemo.checksum;
            console.log('[ArchiveBate] checksum:', storedChecksum);
          }
        }
      } catch (e) {
        console.error('[ArchiveBate] Error parsing Livewire data:', e);
      }
    });

    // Also try wire:id as fallback
    if (!storedWireId) {
      const wireIdElement = document.querySelector('section[wire:id]');
      if (wireIdElement) {
        storedWireId = wireIdElement.getAttribute('wire:id') || null;
        console.log('[ArchiveBate] Fallback wire:id:', storedWireId);
      }
    }

    console.log('[ArchiveBate] Final extracted values:', {
      htmlHash: storedHtmlHash,
      checksum: storedChecksum,
      wireId: storedWireId
    });

    return !!storedCsrfToken;
  } catch (error) {
    console.error('[ArchiveBate] Error initializing session:', error);
    return false;
  }
}

/**
 * Fetch archive videos using Livewire API
 */
async function fetchArchiveProfile(
  username: string,
  page: number = 1
): Promise<ArchiveProfileResponse> {
  console.log('[ArchiveBate] fetchArchiveProfile:', { username, page });

  // Initialize session on first page or if we don't have a token
  if (page === 1 && !storedCsrfToken) {
    console.log('[ArchiveBate] No CSRF token, initializing session...');
    const initialized = await initializeSession(username);
    if (!initialized) {
      console.error('[ArchiveBate] Failed to initialize session');
      return {
        username,
        videos: [],
        currentPage: page,
        totalPages: 1,
        hasMore: false,
      };
    }
  }

  try {
    const csrfToken = storedCsrfToken || '';
    const cookieHeader = buildCookieHeader();

    console.log('[ArchiveBate] Making Livewire API request...');
    console.log('[ArchiveBate] CSRF token length:', csrfToken.length);
    console.log('[ArchiveBate] Cookie header length:', cookieHeader.length);
    console.log('[ArchiveBate] htmlHash:', storedHtmlHash);
    console.log('[ArchiveBate] checksum:', storedChecksum);
    console.log('[ArchiveBate] wire:id:', storedWireId);

    // Build Livewire request payload matching the actual API
    const payload = {
      fingerprint: {
        id: storedWireId || "",
        name: "profile.model-videos",
        locale: "en",
        path: `profile/${username}`,
        method: "GET",
        v: "acj"
      },
      serverMemo: {
        children: [],
        errors: [],
        htmlHash: storedHtmlHash || "",
        data: {
          currentPage: page,
          username: username,
          popular: false,
          page: page,
          paginators: { page: page }
        },
        dataMeta: [],
        checksum: storedChecksum || ""
      },
      updates: [
        {
          type: "callMethod",
          payload: {
            id: "fd94g",
            method: "load_profile_videos",
            params: []
          }
        }
      ]
    };

    console.log('[ArchiveBate] Request payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://archivebate.com/livewire/message/profile.model-videos', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
        'Accept': 'text/html, application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Livewire': 'true',
        'Cookie': cookieHeader,
        'Origin': 'https://archivebate.com',
        'Referer': `https://archivebate.com/profile/${username}`,
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Priority': 'u=0',
      },
      body: JSON.stringify(payload),
    });

    console.log('[ArchiveBate] Livewire response status:', response.status);

    if (!response.ok) {
      // Log the response body for debugging
      const errorText = await response.text();
      console.error('[ArchiveBate] Error response:', errorText.substring(0, 500));

      // If we get a 419, session might have expired - try reinitializing
      if (response.status === 419 && page === 1) {
        console.log('[ArchiveBate] Got 419, reinitializing session...');
        const reinitialized = await initializeSession(username);
        if (reinitialized) {
          // Retry once with new session
          return fetchArchiveProfile(username, page);
        }
      }
      throw new Error(`Failed to fetch archive page: ${response.status}`);
    }

    // Update cookies from response
    const setCookieHeaders = Array.from(response.headers.getSetCookie?.() || []);
    const newCookies = extractCookies(setCookieHeaders);
    newCookies.forEach((value, key) => storedCookies.set(key, value));

    const jsonResponse = await response.json();
    console.log('[ArchiveBate] Response keys:', Object.keys(jsonResponse));
    console.log('[ArchiveBate] Full response:', JSON.stringify(jsonResponse, null, 2));

    // Extract HTML from effects.html
    const html = jsonResponse?.effects?.html || '';
    console.log('[ArchiveBate] HTML length:', html.length);
    console.log('[ArchiveBate] HTML preview (first 500 chars):', html.substring(0, 500));

    const videos: ArchiveVideo[] = [];

    if (!html) {
      console.error('[ArchiveBate] No HTML in response effects');
      return {
        username,
        videos: [],
        currentPage: page,
        totalPages: 1,
        hasMore: false,
      };
    }

    // Parse HTML with JSDOM
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Look for video_item sections
    const videoCards = document.querySelectorAll('section.video_item');

    console.log('[ArchiveBate] Found video cards:', videoCards.length);

    videoCards.forEach((card, index) => {
      try {
        console.log(`[ArchiveBate] Processing video card ${index}:`, card.outerHTML.substring(0, 200));

        // Find the link to the video
        const link = card.querySelector('a[href*="/watch/"]');
        const video = card.querySelector('video');
        const durationEl = card.querySelector('.duration');
        const infoP = card.querySelector('.info p');

        console.log(`[ArchiveBate] Card ${index} - link:`, !!link, 'video:', !!video, 'duration:', !!durationEl, 'info:', !!infoP);

        if (!link || !video) {
          console.log(`[ArchiveBate] Skipping card ${index} - missing link or video`);
          return;
        }

        const href = link.getAttribute('href');
        const poster = video.getAttribute('poster');

        console.log(`[ArchiveBate] Card ${index} - href:`, href?.substring(0, 50), 'poster:', poster?.substring(0, 50));

        if (!href || !poster) {
          console.log(`[ArchiveBate] Skipping card ${index} - missing href or poster`);
          return;
        }

        // Extract duration text (remove SVG content)
        const durationText = durationEl?.textContent?.trim() || '';
        const duration = durationText.split('\n').pop()?.trim() || '';

        // Extract date and views from info paragraph
        const infoText = infoP?.textContent?.trim() || '';
        const dateMatch = infoText.match(/(\d+ \w+ ago)/);
        const viewsMatch = infoText.match(/(\d+) views/);
        const date = dateMatch ? dateMatch[1] : '';
        const views = viewsMatch ? viewsMatch[1] : '';

        console.log(`[ArchiveBate] Parsed video ${index}:`, { duration, views, date });

        videos.push({
          id: `${username}-livewire-${page}-${index}-${Date.now()}`,
          title: `${username} archive video`, // ArchiveBate doesn't have titles
          thumbnail: poster,
          duration,
          views,
          date,
          pageUrl: href.startsWith('http') ? href : `https://archivebate.com${href}`,
          embedUrl: '', // Will be extracted when clicking
        });
      } catch (err) {
        console.error('[ArchiveBate] Error parsing video card:', err);
      }
    });

    console.log('[ArchiveBate] Parsed videos:', videos.length);

    // For pagination, check if there are more videos by looking at the serverMemo
    const hasMore = videos.length > 0 && videos.length === 20; // Assuming 20 per page

    return {
      username,
      videos,
      currentPage: page,
      totalPages: hasMore ? page + 1 : page,
      hasMore,
    };
  } catch (error) {
    console.error('[ArchiveBate] Error fetching archivebate profile:', error);
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
async function getVideoEmbedUrl(pageUrl: string): Promise<string> {
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

    // Look for iframe embed
    const iframe = document.querySelector('iframe[src*="embed"], iframe[src*="video"]');
    if (iframe) {
      const src = iframe.getAttribute('src');
      if (src) return src;
    }

    // Look for video element with source
    const video = document.querySelector('video');
    if (video) {
      const source = video.querySelector('source');
      if (source) {
        const src = source.getAttribute('src');
        if (src) return src;
      }
      const src = video.getAttribute('src');
      if (src) return src;
    }

    // Look for any embed code patterns
    const embedElements = document.querySelectorAll('[data-embed], [data-src], [data-url]');
    for (const el of embedElements) {
      const src = el.getAttribute('data-embed') || el.getAttribute('data-src') || el.getAttribute('data-url');
      if (src && src.includes('http')) {
        return src;
      }
    }

    return '';
  } catch (error) {
    console.error('Error fetching embed URL:', error);
    return '';
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
      const embedUrl = await getVideoEmbedUrl(pageUrl);
      return { success: true, data: { embedUrl } };
    } catch (error) {
      console.error('[ArchiveBate IPC] Embed URL error:', error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });
}
