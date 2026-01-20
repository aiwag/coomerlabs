// ArchiveBate Service - Direct HTML parsing (no API key needed)
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
 * Fetch archive videos by parsing profile page HTML directly
 * This bypasses the Livewire API and CSRF requirements
 */
export async function fetchArchiveProfile(
  username: string,
  page: number = 1
): Promise<ArchiveProfileResponse> {
  const url = `https://archivebate.com/profile/${username}${page > 1 ? `?page=${page}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch archive page: ${response.status}`);
    }

    const html = await response.text();
    const videos: ArchiveVideo[] = [];

    // Parse HTML to extract video information
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Look for video links with various patterns
    const videoLinks = doc.querySelectorAll('a[href*="/video/"], a[href*="/v/"]');

    videoLinks.forEach((link, index) => {
      const href = link.getAttribute('href');
      const img = link.querySelector('img');

      if (href && img) {
        const src = img.getAttribute('src') ||
                    img.getAttribute('data-src') ||
                    img.getAttribute('data-thumbnail');

        // Get title from alt text, title attribute, or nearby text
        const title = img.getAttribute('alt') ||
                     img.getAttribute('title') ||
                     link.textContent?.trim() ||
                     `Archive Video ${index + 1}`;

        // Get thumbnail
        const thumbnail = src || '';

        videos.push({
          id: `${username}-${page}-${index}-${Date.now()}`,
          title: title.replace(/\s+/g, ' ').trim(),
          thumbnail: thumbnail.startsWith('http') ? thumbnail : `https://archivebate.com${thumbnail}`,
          pageUrl: href.startsWith('http') ? href : `https://archivebate.com${href}`,
          embedUrl: '', // Will be extracted when clicking
        });
      }
    });

    // Also look for direct video/image elements in card containers
    const cards = doc.querySelectorAll('.video-card, .card, [class*="video"]');
    cards.forEach((card, index) => {
      if (index >= 20) return; // Limit processing

      const link = card.querySelector('a');
      const img = card.querySelector('img');

      if (link && img && !videos.some(v => v.pageUrl === link.getAttribute('href'))) {
        const href = link.getAttribute('href');
        const src = img.getAttribute('src') ||
                    img.getAttribute('data-src') ||
                    img.getAttribute('srcset')?.split(' ')[0];

        const title = img.getAttribute('alt') ||
                     card.querySelector('.title, .video-title')?.textContent?.trim() ||
                     `Archive Video ${videos.length + 1}`;

        if (href && src) {
          videos.push({
            id: `${username}-card-${page}-${index}-${Date.now()}`,
            title: title.replace(/\s+/g, ' ').trim(),
            thumbnail: src.startsWith('http') ? src : `https://archivebate.com${src}`,
            pageUrl: href.startsWith('http') ? href : `https://archivebate.com${href}`,
            embedUrl: '',
          });
        }
      }
    });

    // Try to find pagination info
    const paginationLinks = doc.querySelectorAll('a[href*="page="], .pagination a, [class*="pagination"] a');
    let maxPage = page;
    let hasMorePages = false;

    paginationLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const pageMatch = href.match(/page[=]?(\d+)/);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1], 10);
          if (pageNum > maxPage) {
            maxPage = pageNum;
            hasMorePages = true;
          }
        }
      }
    });

    // Also look for "Next" button or similar
    const nextButton = doc.querySelector('a[rel="next"], .next:not(.disabled)');
    if (nextButton && !nextButton.classList.contains('disabled')) {
      hasMorePages = true;
      maxPage = Math.max(maxPage, page + 1);
    }

    return {
      username,
      videos,
      currentPage: page,
      totalPages: maxPage,
      hasMore: hasMorePages || page < maxPage,
    };
  } catch (error) {
    console.error('Error fetching archivebate profile:', error);
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
    const response = await fetch(pageUrl.startsWith('http') ? pageUrl : `https://archivebate.com${pageUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
      },
    });
    const html = await response.text();

    // Look for iframe embed
    const iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/);
    if (iframeMatch) {
      return iframeMatch[1];
    }

    // Look for video element
    const videoMatch = html.match(/<video[^>]*>\s*<source[^>]*src="([^"]+)"/);
    if (videoMatch) {
      return videoMatch[1];
    }

    // Look for any embed code
    const embedMatch = html.match(/embed.*?src="([^"]+)"/);
    if (embedMatch) {
      return embedMatch[1];
    }

    return '';
  } catch (error) {
    console.error('Error fetching embed URL:', error);
    return '';
  }
}
