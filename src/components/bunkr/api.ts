// Bunkr API — trending, search, and album detail parsing
// Index/search: bunkr-albums.io (requires wreq-js fingerprinting)
// Albums: bunkr.cr/a/{slug}

export interface BunkrAlbum {
  id: string;
  slug: string;
  title: string;
  fileCount: number;
  imageCount: number;
  videoCount: number;
  size: string;
  thumb: string;
  thumbs: string[];  // up to 4 thumbnails for preview
  url: string;
}

export interface BunkrFile {
  name: string;
  thumb: string;
  url: string;      // actual content URL (image/video source)
  size: string;
  type: 'image' | 'video' | 'audio' | 'file';
  date: string;
}

export interface BunkrAlbumDetail {
  title: string;
  fileCount: number;
  size: string;
  files: BunkrFile[];
  pages: number;
}

// ─── Parsers (run in renderer) ───

/** Parse bunkr-albums.io trending/search HTML */
export function parseIndexHtml(html: string): BunkrAlbum[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const albums: BunkrAlbum[] = [];
  const seen = new Set<string>();

  // The <a href="/a/SLUG"> on bunkr-albums.io is a small chevron icon INSIDE
  // the card container — the actual title/thumb/meta are in the parent element.
  doc.querySelectorAll('a[href*="/a/"]').forEach((linkEl) => {
    const href = linkEl.getAttribute('href') || '';
    const slugMatch = href.match(/\/a\/([A-Za-z0-9_-]+)/);
    if (!slugMatch) return;
    const slug = slugMatch[1];
    if (seen.has(slug)) return; // deduplicate
    seen.add(slug);

    // Navigate up to the full card container — the <a> is deeply nested inside the card.
    // Walk up until we find a container that has <img> children (the thumbnails).
    let card: Element | null = linkEl.parentElement;
    for (let i = 0; i < 5 && card; i++) {
      if (card.querySelector('img')) break;
      card = card.parentElement;
    }
    if (!card) return;

    // Collect all images for multi-thumb preview from the card container
    const thumbs: string[] = [];
    card.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      if (src && !src.includes('logo') && !src.includes('favicon') && !src.includes('icon') && !src.endsWith('.svg') && !src.includes('bunkr')) {
        if (src.startsWith('http')) {
          thumbs.push(src);
        } else {
          thumbs.push(`https://bunkr-albums.io${src.startsWith('/') ? '' : '/'}${src}`);
        }
      }
    });
    const thumb = thumbs[0] || '';

    // Extract title from the card — try multiple selectors
    const allText = card.textContent?.trim() || '';
    const title = card.querySelector('h2, h3, p.font-semibold, p.font-bold, p.truncate')?.textContent?.trim()
      || card.querySelector('p, span')?.textContent?.trim()
      || allText.split('\n').filter(l => l.trim())[0]?.trim()
      || slug;

    // Extract metadata (file count, size, type counts)
    const metaEl = card.querySelector('small, .text-xs, .text-sm');
    const metaText = metaEl?.textContent?.trim() || allText;
    const countMatch = metaText.match(/(\d+)\s*files?/i);
    const sizeMatch = metaText.match(/([\d.]+\s*(?:GB|MB|KB|TB))/i);
    const imgCountMatch = metaText.match(/(\d+)\s*image/i);
    const vidCountMatch = metaText.match(/(\d+)\s*video/i);

    const fileCount = countMatch ? parseInt(countMatch[1], 10) : 0;

    albums.push({
      id: slug,
      slug,
      title,
      fileCount,
      imageCount: imgCountMatch ? parseInt(imgCountMatch[1], 10) : 0,
      videoCount: vidCountMatch ? parseInt(vidCountMatch[1], 10) : 0,
      size: sizeMatch ? sizeMatch[1] : '',
      thumb,
      thumbs: thumbs.slice(0, 4),
      url: `https://bunkr.cr/a/${slug}`,
    });
  });

  return albums;
}

/** Parse a bunkr.cr/a/{slug} album detail page */
export function parseAlbumHtml(html: string): BunkrAlbumDetail {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Title: <h1 class="truncate"> or first h1
  const titleEl = doc.querySelector('h1');
  const title = titleEl?.textContent?.trim() || 'Untitled Album';

  // Total size from page header
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const fileCountMatch = metaDesc.match(/(\d+)\s*files?/i);
  const fileCount = fileCountMatch ? parseInt(fileCountMatch[1], 10) : 0;

  // Size from the visitor stats area
  const sizeEl = doc.querySelector('.visitors, .text-xs');
  const sizeText = sizeEl?.textContent || '';
  const sizeMatch = sizeText.match(/([\d.]+\s*(?:GB|MB|KB|TB))/i);
  const size = sizeMatch ? sizeMatch[1] : '';

  // Parse individual files
  const files: BunkrFile[] = [];
  doc.querySelectorAll('.theItem').forEach((item) => {
    const titleAttr = item.getAttribute('title') || '';
    const name = titleAttr || item.querySelector('p')?.textContent?.trim() || '';

    const img = item.querySelector('img.grid-images_box-img');
    const thumb = img?.getAttribute('src') || '';

    // Get the /f/ link directly from inside this .theItem
    const fileLink = item.querySelector('a[href^="/f/"]');
    const filePage = fileLink ? `https://bunkr.cr${fileLink.getAttribute('href')}` : '';

    // Detect type from type badge class
    let type: BunkrFile['type'] = 'file';
    const badge = item.querySelector('.type-Image, .type-Video, .type-Audio, .type-File');
    if (badge) {
      if (badge.classList.contains('type-Image')) type = 'image';
      else if (badge.classList.contains('type-Video')) type = 'video';
      else if (badge.classList.contains('type-Audio')) type = 'audio';
    }

    // Fallback type detection from file extension
    if (type === 'file' && name) {
      const ext = name.split('.').pop()?.toLowerCase() || '';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp'].includes(ext)) type = 'image';
      else if (['mp4', 'webm', 'mkv', 'avi', 'mov', 'm4v'].includes(ext)) type = 'video';
      else if (['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'].includes(ext)) type = 'audio';
    }

    // Extract size and date from grid-images_box-txt spans
    const spans = item.querySelectorAll('.grid-images_box-txt span, .grid-images_box-txt p');
    let fileSize = '';
    let date = '';
    spans.forEach((s) => {
      const txt = s.textContent?.trim() || '';
      if (txt.match(/^\d+[\d.]*\s*(KB|MB|GB|TB)/i)) fileSize = txt;
      else if (txt.match(/\d{2}:\d{2}:\d{2}/) || txt.match(/\d{2}\/\d{2}\/\d{4}/)) date = txt;
    });

    if (name || thumb) {
      // Images: use thumbnail directly (already displayable CDN URL)
      // Videos/Audio: use /f/ page URL (will be resolved to get.bunkrr.su streaming URL lazily)
      const url = (type === 'video' || type === 'audio') ? filePage : (thumb || filePage);

      files.push({ name, thumb, url, size: fileSize, type, date });
    }
  });

  // Detect pagination
  const pageLinks = doc.querySelectorAll('.pagination a');
  let pages = 1;
  pageLinks.forEach((a) => {
    const pageNum = parseInt(a.textContent?.trim() || '0', 10);
    if (pageNum > pages) pages = pageNum;
  });

  return { title, fileCount: fileCount || files.length, size, files, pages };
}


// ─── IPC-backed fetchers ───

/** Fetch trending albums from bunkr-albums.io */
export async function fetchTrending(page = 1): Promise<BunkrAlbum[]> {
  try {
    const url = page > 1 ? `https://bunkr-albums.io/?page=${page}` : 'https://bunkr-albums.io';
    const result = await window.electronAPI.bunkr.fetch(url);
    if (!result.success || !result.data) {
      console.warn('[bunkr] Trending fetch failed:', result.error);
      return [];
    }
    return parseIndexHtml(result.data);
  } catch (e) {
    console.error('[bunkr] Trending error:', e);
    return [];
  }
}

/** Search albums on bunkr-albums.io */
export async function searchAlbums(query: string, page = 1): Promise<BunkrAlbum[]> {
  try {
    const url = `https://bunkr-albums.io/?search=${encodeURIComponent(query)}${page > 1 ? `&page=${page}` : ''}`;
    const result = await window.electronAPI.bunkr.fetch(url);
    if (!result.success || !result.data) return [];
    return parseIndexHtml(result.data);
  } catch (e) {
    console.error('[bunkr] Search error:', e);
    return [];
  }
}

/** Fetch album detail from bunkr.cr */
export async function fetchAlbumDetail(slug: string, page = 1): Promise<BunkrAlbumDetail | null> {
  try {
    const url = `https://bunkr.cr/a/${slug}${page > 1 ? `?page=${page}` : ''}`;
    const result = await window.electronAPI.bunkr.fetch(url);
    if (!result.success || !result.data) return null;
    return parseAlbumHtml(result.data);
  } catch (e) {
    console.error('[bunkr] Album detail error:', e);
    return null;
  }
}

/** Resolve actual media URL from a bunkr /f/ page */
export async function resolveFileUrl(filePageUrl: string): Promise<string | null> {
  try {
    const result = await window.electronAPI.bunkr.fetch(filePageUrl);
    if (!result.success || !result.data) return null;
    const html = result.data;

    // 1. Look for get.bunkrr.su/file/ links in the raw HTML (fastest)
    const bunkrrMatch = html.match(/https?:\/\/get\.bunkrr\.su\/file\/\d+/);
    if (bunkrrMatch) return bunkrrMatch[0];

    // 2. Parse DOM for video/source/img elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Video source: <source src="..."> or <video src="...">
    const videoSrc = doc.querySelector('video source')?.getAttribute('src')
      || doc.querySelector('video')?.getAttribute('src');
    if (videoSrc) return videoSrc;

    // Any link to media CDN
    const cdnLink = doc.querySelector('a[href*="scdn.st"], a[href*="bunkrr.su"], a[href*="media-files"]');
    if (cdnLink) return cdnLink.getAttribute('href');

    // Image source
    const imgSrc = doc.querySelector('img.max-h-full, img.object-cover, img[alt="image"]')?.getAttribute('src');
    if (imgSrc) return imgSrc;

    // Download link as fallback
    const dlLink = doc.querySelector('a[download], a[href*="/d/"]')?.getAttribute('href');
    if (dlLink) return dlLink;

    return null;
  } catch {
    return null;
  }
}
