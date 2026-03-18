// --- CONFIGURATION & CONSTANTS ---

export const COOMER_SERVICES = ['onlyfans', 'fansly', 'candfans'];
export const KEMONO_SERVICES = ['patreon', 'fanbox', 'discord', 'fantia', 'afdian', 'boosty', 'dlsite', 'gumroad', 'subscribestar'];

export const SERVICES = [
  { value: 'all', label: 'All Services' },
  { value: 'coomer', label: 'Coomer (All)' },
  ...COOMER_SERVICES.map(service => ({ value: service, label: service.charAt(0).toUpperCase() + service.slice(1) })),
  { value: 'kemono', label: 'Kemono (All)' },
  ...KEMONO_SERVICES.map(service => ({ value: service, label: service.charAt(0).toUpperCase() + service.slice(1) }))
];

// --- API SETTINGS ---
export const COOMER_API_BASE_URL = 'https://kemono-api.mbaharip.com/coomer';
export const KEMONO_API_BASE_URL = 'https://kemono-api.mbaharip.com/kemono';
export const COOMER_POSTS_API_BASE_URL = 'https://coomer.st/api/v1';
export const KEMONO_POSTS_API_BASE_URL = 'https://kemono.cr/api/v1';
export const ITEMS_PER_PAGE = 30;
export const POSTS_PER_PAGE = 50;

// --- STORAGE & CACHE ---
export const CACHE_TIMESTAMP_KEY = 'creators:timestamp';
export const CACHE_VERSION_KEY = 'creators:version';
export const CACHE_VERSION = '2.0';
export const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// --- VIDEO EXTENSIONS ---
export const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm'];

export function isVideoFile(filename?: string): boolean {
  if (!filename) return false;
  return VIDEO_EXTENSIONS.some(ext => filename.includes(ext));
}

export function getBaseUrl(service: string): string {
  return COOMER_SERVICES.includes(service) ? 'https://coomer.st' : 'https://kemono.cr';
}

export function getCreatorImageUrl(service: string, id: string): string {
  if (COOMER_SERVICES.includes(service)) {
    return `https://coomer.st/icons/${service}/${id}`;
  }
  return `https://kemono.cr/icons/${service}/${id}`;
}

export function getServiceColor(service: string): string {
  if (COOMER_SERVICES.includes(service)) {
    return 'from-purple-500 to-pink-500';
  }
  return 'from-blue-500 to-cyan-500';
}
