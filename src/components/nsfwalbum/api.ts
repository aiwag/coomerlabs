// NSFWAlbum.com API — proper title parsing, multi-thumb, album detail, HQ URLs, models/sites

export interface NsfwAlbumPost {
  id: string;
  url: string;
  title: string;
  thumbs: string[];        // up to 4 thumbnails per post
}

export interface NsfwAlbumImage {
  id: string;
  thumb: string;
  full: string;
  photoUrl: string;  // /photo/{id} link for fetching HQ on demand
}

export interface NsfwAlbumDetail {
  id: string;
  title: string;
  studio?: string;
  images: NsfwAlbumImage[];
}

export interface NsfwModelCategory {
  site: string;        // e.g. "metart.com"
  searchQuery: string; // e.g. "metart.com" (raw search term)
  models: { name: string; searchQuery: string }[];
}

/**
 * Parse backend.php AJAX response for album post cards.
 * 
 * Structure per post:
 * <figure class="video_figure">
 *   <div class="flex-images flexP{n}">
 *     <div class="item"><a href="/album/{id}"><img class="thumbPhoto" src="..."></a></div>
 *     ...
 *   </div>
 *   <figcaption>
 *     <div class="video_name"><a href="/album/{id}">TITLE TEXT</a></div>
 *   </figcaption>
 * </figure>
 */
export const parseHomepageHtml = (html: string): NsfwAlbumPost[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const posts: NsfwAlbumPost[] = [];

  doc.querySelectorAll('figure.video_figure, figure').forEach((figure) => {
    // Get title from figcaption .video_name a
    const titleEl = figure.querySelector('.video_name a, figcaption a');
    const title = titleEl?.textContent?.trim() || '';

    // Get album URL from the title link or from thumb links
    const albumHref = titleEl?.getAttribute('href') || '';
    const albumMatch = albumHref.match(/\/album\/(\d+)/);
    if (!albumMatch) return;
    const albumId = albumMatch[1];

    // Get all thumbs
    const thumbs: string[] = [];
    figure.querySelectorAll('img.thumbPhoto, img.img').forEach((img) => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      if (src && !src.includes('p.png') && !src.includes('logo')) {
        thumbs.push(src.startsWith('http') ? src : `https:${src}`);
      }
    });

    posts.push({
      id: albumId,
      url: `https://nsfwalbum.com/album/${albumId}`,
      title: title || `Album ${albumId}`,
      thumbs,
    });
  });

  return posts;
};

/**
 * Parse an album detail page for all images with HQ URLs.
 * 
 * Structure:
 * <div class="gallery_name"><h6>TITLE</h6></div>
 * <div class="models">Studio: <a>NAME</a></div>
 * <div class="item"><a href="/photo/{id}"><img class="albumPhoto" data-src="THUMB_URL"></a></div>
 */
export const parseAlbumHtml = (html: string): NsfwAlbumDetail => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const titleEl = doc.querySelector('.gallery_name h6');
  const title = titleEl?.textContent?.trim() || 'Untitled Album';

  const modelsEl = doc.querySelector('.models');
  const studio = modelsEl?.textContent?.replace('Studio:', '').trim() || undefined;

  const images: NsfwAlbumImage[] = [];
  doc.querySelectorAll('.item').forEach((item) => {
    const a = item.querySelector('a');
    const img = item.querySelector('img.albumPhoto, img');
    if (!a || !img) return;

    const thumb = img.getAttribute('data-src') || img.getAttribute('src') || '';
    if (!thumb || thumb.includes('p.png')) return;

    const photoHref = a.getAttribute('href') || '';
    const imgId = img.getAttribute('data-img-id') || photoHref.replace('/photo/', '') || '';
    
    const thumbUrl = thumb.startsWith('http') ? thumb : `https:${thumb}`;
    const fullUrl = toHqUrl(thumbUrl);

    images.push({
      id: imgId,
      thumb: thumbUrl,
      full: fullUrl,
      photoUrl: photoHref.startsWith('http') ? photoHref : `https://nsfwalbum.com${photoHref}`,
    });
  });

  return { id: '', title, studio, images };
};

/**
 * Convert a thumbnail URL to a higher-quality version where possible.
 * Currently disabled for turboimg (cert issues) and pixhost (path doesn't always exist).
 * Returns original URL to avoid broken images.
 */
function toHqUrl(thumb: string): string {
  // Just return original — the CDN HQ paths have SSL/cert issues
  return thumb;
}

// ─── IPC-backed fetchers ───

/** Fetch homepage posts via backend.php AJAX */
export const fetchHomepage = async (page = 1): Promise<NsfwAlbumPost[]> => {
  try {
    const result = await window.electronAPI.nsfwalbum.fetchPage(page, '');
    if (!result.success || !result.data) {
      console.warn('[nsfwalbum] Fetch failed:', result.error);
      return [];
    }
    return parseHomepageHtml(result.data);
  } catch (e) {
    console.error('[nsfwalbum] Homepage error:', e);
    return [];
  }
};

/** Search albums via backend.php with query */
export const searchContent = async (query: string, page = 1): Promise<NsfwAlbumPost[]> => {
  try {
    // The original site sends queryString=search%3Dterm (encoded from "search=term")
    const result = await window.electronAPI.nsfwalbum.fetchPage(page, `search=${query}`);
    if (!result.success || !result.data) return [];
    return parseHomepageHtml(result.data);
  } catch (e) {
    console.error('[nsfwalbum] Search error:', e);
    return [];
  }
};

/** Fetch a single album detail page */
export const fetchAlbum = async (albumId: string): Promise<NsfwAlbumDetail | null> => {
  try {
    const result = await window.electronAPI.system.wreqFetch(`https://nsfwalbum.com/album/${albumId}`);
    if (!result.success || !result.data) return null;
    const detail = parseAlbumHtml(result.data);
    detail.id = albumId;
    return detail;
  } catch (e) {
    console.error('[nsfwalbum] Album detail error:', e);
    return null;
  }
};

/** Resolve the HQ image URL for a specific photo via spirit token + backend.php */
export const resolveHQ = async (photoId: string): Promise<string | null> => {
  try {
    const result = await window.electronAPI.nsfwalbum.resolveHQ(photoId);
    if (result.success && result.url) return result.url;
    return null;
  } catch {
    return null;
  }
};

/**
 * Parse models/sites list from backend.php?queryString=models%3D1
 * 
 * Structure:
 * <div class="category">
 *   <h3 class="category-heading"><a class="doc-link" href="/search/metart.com">metart.com</a></h3>
 *   <ul><li class="item-element"><a href="/search/Model" class="item-link">Model</a></li>...</ul>
 * </div>
 */
export const parseModelsHtml = (html: string): NsfwModelCategory[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const categories: NsfwModelCategory[] = [];

  doc.querySelectorAll('.category').forEach((cat) => {
    const headingEl = cat.querySelector('.category-heading a, h3 a');
    const site = headingEl?.textContent?.trim() || '';
    const href = headingEl?.getAttribute('href') || '';
    const searchQuery = decodeURIComponent(href.replace('/search/', '').replace(/\+/g, ' '));

    const models: { name: string; searchQuery: string }[] = [];
    cat.querySelectorAll('.item-element a.item-link, li a').forEach((a) => {
      const name = a.textContent?.trim() || '';
      const mHref = a.getAttribute('href') || '';
      const mQuery = decodeURIComponent(mHref.replace('/search/', '').replace(/\+/g, ' '));
      if (name) models.push({ name, searchQuery: mQuery });
    });

    if (site) categories.push({ site, searchQuery, models });
  });

  return categories;
};

/** Fetch models/sites list via backend.php?queryString=models%3D1 (loads all pages) */
export const fetchModels = async (): Promise<NsfwModelCategory[]> => {
  const all: NsfwModelCategory[] = [];
  let page = 1;
  const maxPages = 5; // safety cap
  
  while (page <= maxPages) {
    try {
      const result = await window.electronAPI.nsfwalbum.fetchPage(page, 'models=1');
      if (!result.success || !result.data || result.data.trim().length < 10) break;
      const cats = parseModelsHtml(result.data);
      if (cats.length === 0) break;
      all.push(...cats);
      page++;
    } catch { break; }
  }
  
  return all;
};

