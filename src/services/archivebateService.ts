// ArchiveBate Service - Parse archivebate profile pages
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

/**
 * Parse archivebate profile page HTML and extract video embeds
 */
export async function fetchArchiveProfile(
  username: string,
  page: number = 1
): Promise<ArchiveProfileResponse> {
  const url = `https://archivebate.com/profile/${username}?page=${page}`;

  try {
    // Use CORS proxy or fetch directly
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch archive page: ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML to extract video information
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract video items
    const videoElements = doc.querySelectorAll('.video-item, .video-card, [class*="video"]');
    const videos: ArchiveVideo[] = [];

    videoElements.forEach((element, index) => {
      // Try to find various selectors that might contain video info
      const titleEl =
        element.querySelector('.title') ||
        element.querySelector('.video-title') ||
        element.querySelector('h3') ||
        element.querySelector('h4');
      const title = titleEl?.textContent?.trim() || `Video ${index + 1}`;

      // Thumbnail
      const thumbEl =
        element.querySelector('img') ||
        element.querySelector('[data-thumbnail]');
      const thumbnail = thumbEl?.getAttribute('src') || thumbEl?.getAttribute('data-thumbnail') || '';

      // Duration
      const durationEl =
        element.querySelector('.duration') ||
        element.querySelector('[data-duration]');
      const duration = durationEl?.textContent?.trim();

      // Views
      const viewsEl =
        element.querySelector('.views') ||
        element.querySelector('[data-views]');
      const views = viewsEl?.textContent?.trim();

      // Date
      const dateEl =
        element.querySelector('.date') ||
        element.querySelector('[data-date]');
      const date = dateEl?.textContent?.trim();

      // Links
      const linkEl = element.querySelector('a');
      const pageUrl = linkEl?.getAttribute('href') || '';
      const fullPageUrl = pageUrl.startsWith('http')
        ? pageUrl
        : `https://archivebate.com${pageUrl}`;

      // Try to extract embed URL from various attributes
      const embedUrl =
        element.getAttribute('data-embed') ||
        linkEl?.getAttribute('data-embed') ||
        element.getAttribute('data-src') ||
        '';

      videos.push({
        id: `${username}-${index}-${Date.now()}`,
        title,
        thumbnail,
        duration,
        views,
        date,
        embedUrl,
        pageUrl: fullPageUrl,
      });
    });

    // Try to find pagination info
    const paginationEl = doc.querySelector('.pagination');
    let totalPages = 1;
    let currentPage = page;

    if (paginationEl) {
      const lastPageEl = paginationEl.querySelector('[data-page]:last-of-type');
      const lastPageNum = lastPageEl?.getAttribute('data-page');
      if (lastPageNum) {
        totalPages = parseInt(lastPageNum, 10);
      }

      // Also try to find current page indicator
      const activePageEl = paginationEl.querySelector('.active, [class*="active"]');
      if (activePageEl) {
        const pageNum = activePageEl?.textContent;
        if (pageNum) {
          currentPage = parseInt(pageNum, 10);
        }
      }
    }

    return {
      username,
      videos,
      currentPage,
      totalPages,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error('Error fetching archivebate profile:', error);
    // Return empty result on error
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
 * Alternative: Use regex-based parsing if DOM parsing fails
 */
export async function fetchArchiveProfileRegex(
  username: string,
  page: number = 1
): Promise<ArchiveProfileResponse> {
  const url = `https://archivebate.com/profile/${username}?page=${page}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch archive page: ${response.status}`);
    }

    const html = await response.text();

    const videos: ArchiveVideo[] = [];

    // Try to extract video cards using regex patterns
    // This is a fallback method if DOM parsing doesn't work well

    // Look for iframe/video embed patterns
    const iframePattern = /<iframe[^>]*src=["']([^"']*)["'][^>]*>/gi;
    const iframeMatches = [...html.matchAll(iframePattern)];

    iframeMatches.forEach((match, index) => {
      const embedUrl = match[1];
      videos.push({
        id: `${username}-iframe-${index}-${Date.now()}`,
        title: `Archive Video ${index + 1}`,
        thumbnail: '',
        embedUrl,
        pageUrl: url,
      });
    });

    // Look for video link patterns
    const linkPattern = /<a[^>]*href=["']([^"']*\/video\/[^"']*)["'][^>]*>(.*?)<\/a>/gi;
    const linkMatches = [...html.matchAll(linkPattern)];

    linkMatches.forEach((match, index) => {
      const pageUrl = match[1];
      const title = match[2]?.replace(/<[^>]*>/g, '').trim() || `Video ${index + 1}`;

      videos.push({
        id: `${username}-link-${index}-${Date.now()}`,
        title,
        thumbnail: '',
        pageUrl: pageUrl.startsWith('http') ? pageUrl : `https://archivebate.com${pageUrl}`,
        embedUrl: '',
      });
    });

    return {
      username,
      videos,
      currentPage: page,
      totalPages: 1,
      hasMore: false,
    };
  } catch (error) {
    console.error('Error fetching archivebate profile (regex):', error);
    return {
      username,
      videos: [],
      currentPage: page,
      totalPages: 1,
      hasMore: false,
    };
  }
}
