// ArchiveBate Service - Using Livewire API for proper pagination
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

// Cache for CSRF tokens
let csrfToken: string | null = null;
let sessionCookie: string | null = null;

/**
 * Fetch initial page to get CSRF token and session
 */
async function fetchAuthTokens(): Promise<void> {
  if (csrfToken && sessionCookie) return;

  try {
    const response = await fetch('https://archivebate.com');
    const html = await response.text();

    // Extract CSRF token from meta tag
    const csrfMatch = html.match(/<meta name="csrf-token" content="([^"]+)"/);
    if (csrfMatch) {
      csrfToken = csrfMatch[1];
    }

    // Extract XSRF-TOKEN from cookie
    const xsrfMatch = html.match(/XSRF-TOKEN=([^;]+)/);
    if (xsrfMatch) {
      sessionCookie = `XSRF-TOKEN=${xsrfMatch[1]}`;
    }
  } catch (error) {
    console.error('Error fetching auth tokens:', error);
  }
}

/**
 * Generate random fingerprint ID
 */
function generateFingerprint(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Fetch archive videos using Livewire API
 */
export async function fetchArchiveProfile(
  username: string,
  page: number = 1
): Promise<ArchiveProfileResponse> {
  // Ensure we have auth tokens
  await fetchAuthTokens();

  const fingerprint = generateFingerprint();
  const url = `https://archivebate.com/profile/${username}`;

  try {
    // First, fetch the profile page to get initial data
    const pageResponse = await fetch(url);
    const pageHtml = await pageResponse.text();

    // Extract HTML hash and other data from the page
    const htmlHashMatch = pageHtml.match(/"htmlHash":"([^"]+)"/);
    const htmlHash = htmlHashMatch ? htmlHashMatch[1] : 'unknown';

    // Build Livewire request
    const livewireData = {
      fingerprint: {
        id: fingerprint,
        name: 'profile.model-videos',
        locale: 'en',
        path: `profile/${username}`,
        method: 'GET',
        v: 'acj'
      },
      serverMemo: {
        children: [],
        errors: [],
        htmlHash: htmlHash,
        data: {
          currentPage: page.toString(),
          username: username,
          popular: false,
          page: page.toString(),
          paginators: {
            page: page.toString()
          }
        },
        dataMeta: [],
        checksum: '6f17534fc5c94d6ac66374f890ac73fcb9c61a1ff299ca42bf4d44091017a11a'
      },
      updates: [
        {
          type: 'callMethod',
          payload: {
            id: '3a77',
            method: 'load_profile_videos',
            params: []
          }
        }
      ]
    };

    const response = await fetch('https://archivebate.com/livewire/message/profile.model-videos', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
        'Accept': 'text/html, application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Content-Type': 'application/json',
        'X-Livewire': 'true',
        'X-CSRF-TOKEN': csrfToken || '',
        'Origin': 'https://archivebate.com',
        'Referer': url,
        'Connection': 'keep-alive',
        ...(sessionCookie && { 'Cookie': sessionCookie })
      },
      body: JSON.stringify(livewireData)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch archive page: ${response.status}`);
    }

    const responseText = await response.text();

    // Parse the response - it's typically HTML with embedded JSON
    const videos = parseVideosFromResponse(responseText, username);

    // Try to determine pagination info
    const hasMore = videos.length > 0; // Simplified - can be improved
    const totalPages = page + (hasMore ? 1 : 0); // Simplified

    return {
      username,
      videos,
      currentPage: page,
      totalPages,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching archivebate profile:', error);

    // Fallback: try parsing the profile page HTML directly
    return await fetchArchiveProfileFallback(username, page);
  }
}

/**
 * Parse videos from Livewire response
 */
function parseVideosFromResponse(responseText: string, username: string): ArchiveVideo[] {
  const videos: ArchiveVideo[] = [];

  // Try to extract video cards from HTML response
  // Look for typical video card patterns
  const videoCardPattern = /<a[^>]*href="([^"]*\/video\/[^"]*)"[^>]*>.*?<img[^>]*src="([^"]+)".*?<\/a>/gs;
  const matches = [...responseText.matchAll(videoCardPattern)];

  matches.forEach((match, index) => {
    const pageUrl = match[1];
    const thumbnail = match[2];

    // Extract title from alt text or nearby text
    const titleMatch = match[0].match(/alt="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : `Archive Video ${index + 1}`;

    videos.push({
      id: `${username}-livewire-${index}-${Date.now()}`,
      title,
      thumbnail: thumbnail.startsWith('http') ? thumbnail : `https://archivebate.com${thumbnail}`,
      pageUrl: pageUrl.startsWith('http') ? pageUrl : `https://archivebate.com${pageUrl}`,
      embedUrl: '', // Will be extracted when clicking
    });
  });

  // Also try looking for lazy-loaded images
  const lazyPattern = /<img[^>]*data-src="([^"]+)"/g;
  const lazyMatches = [...responseText.matchAll(lazyPattern)];

  lazyMatches.forEach((match, index) => {
    if (index >= videos.length) return; // Don't duplicate
    const thumbnail = match[1];

    if (thumbnail && !videos.some(v => v.thumbnail === thumbnail)) {
      videos.push({
        id: `${username}-lazy-${index}-${Date.now()}`,
        title: `Archive Video ${index + 1}`,
        thumbnail: thumbnail.startsWith('http') ? thumbnail : `https://archivebate.com${thumbnail}`,
        pageUrl: `https://archivebate.com/profile/${username}`,
        embedUrl: '',
      });
    }
  });

  return videos;
}

/**
 * Fallback method: Parse profile page HTML directly
 */
async function fetchArchiveProfileFallback(
  username: string,
  page: number = 1
): Promise<ArchiveProfileResponse> {
  const url = `https://archivebate.com/profile/${username}${page > 1 ? `?page=${page}` : ''}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch archive page: ${response.status}`);
    }

    const html = await response.text();
    const videos: ArchiveVideo[] = [];

    // Parse HTML to extract video information
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Look for video links
    const links = doc.querySelectorAll('a[href*="/video/"]');

    links.forEach((link, index) => {
      const href = link.getAttribute('href');
      const img = link.querySelector('img');

      if (href && img) {
        const src = img.getAttribute('src') || img.getAttribute('data-src');

        videos.push({
          id: `${username}-fallback-${index}-${Date.now()}`,
          title: img.getAttribute('alt') || `Archive Video ${index + 1}`,
          thumbnail: src || '',
          pageUrl: href.startsWith('http') ? href : `https://archivebate.com${href}`,
          embedUrl: '',
        });
      }
    });

    // Try to find pagination info
    const paginationLinks = doc.querySelectorAll('a[href*="page="]');
    let maxPage = page;
    paginationLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const pageMatch = href.match(/page=(\d+)/);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1], 10);
          if (pageNum > maxPage) maxPage = pageNum;
        }
      }
    });

    return {
      username,
      videos,
      currentPage: page,
      totalPages: maxPage,
      hasMore: page < maxPage,
    };
  } catch (error) {
    console.error('Error in fallback fetch:', error);
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
export async function getVideoEmbedUrl(pageUrl: string): Promise<string> {
  try {
    const response = await fetch(pageUrl.startsWith('http') ? pageUrl : `https://archivebate.com${pageUrl}`);
    const html = await response.text();

    // Look for iframe embed
    const iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/);
    if (iframeMatch) {
      return iframeMatch[1];
    }

    // Look for video source
    const videoMatch = html.match(/<video[^>]*>\s*<source[^>]*src="([^"]+)"/);
    if (videoMatch) {
      return videoMatch[1];
    }

    return '';
  } catch (error) {
    console.error('Error fetching embed URL:', error);
    return '';
  }
}
