// RedGifs v2 API Layer
import axios from 'axios';
import { GifItem, Creator, Niche } from './types';

const API_BASE = 'https://api.redgifs.com/v2';
const AUTH_API = `${API_BASE}/auth/temporary`;

// Token management
let authToken: string | null = null;

export const getAuthToken = async (): Promise<string> => {
  if (authToken) return authToken;

  try {
    const response = await fetch(AUTH_API);
    const data = await response.json();
    authToken = data.token;
    return authToken;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    throw error;
  }
};

// Fetch GIFs with configurable order (trending, latest, top28, top7, top, random, etc.)
export const fetchGifs = async ({
  pageParam = 1,
  gender,
  order = 'trending',
}: {
  pageParam?: number;
  gender?: string;
  order?: string;
}) => {
  const token = await getAuthToken();

  try {
    let url = `${API_BASE}/gifs/search?order=${encodeURIComponent(order)}&count=50&type=g&verified=y&page=${pageParam}`;

    if (gender && gender !== 'all') {
      url += `&tags=${encodeURIComponent(gender)}`;
    }

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return {
      gifs: response.data.gifs || [],
      nextPage: response.data.gifs?.length > 0 ? pageParam + 1 : null,
    };
  } catch (error) {
    console.error('Error fetching GIFs:', error);
    return { gifs: [], nextPage: null };
  }
};

// Backward-compat wrappers
export const fetchTrendingGifs = (args: { pageParam?: number; gender?: string }) =>
  fetchGifs({ ...args, order: 'trending' });

export const fetchLatestGifs = (args: { pageParam?: number; gender?: string }) =>
  fetchGifs({ ...args, order: 'latest' });

// Search GIFs with gender filter
export const searchGifs = async ({
  query,
  pageParam = 1,
  gender
}: {
  query: string;
  pageParam?: number;
  gender?: string;
}) => {
  const token = await getAuthToken();

  try {
    let url = `${API_BASE}/gifs/search?search_text=${encodeURIComponent(query)}&count=50&type=g&verified=y&page=${pageParam}`;

    // Add gender filter if specified
    if (gender && gender !== 'all') {
      url += `&tags=${encodeURIComponent(gender)}`;
    }

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return {
      gifs: response.data.gifs || [],
      nextPage: response.data.gifs?.length > 0 ? pageParam + 1 : null,
    };
  } catch (error) {
    console.error('Error searching GIFs:', error);
    return { gifs: [], nextPage: null };
  }
};

// Fetch creators
export const fetchCreators = async ({
  pageParam = 1,
  order = 'trending',
  query,
}: {
  pageParam?: number;
  order?: string;
  query?: string;
}) => {
  const token = await getAuthToken();

  try {
    let url: string;

    if (query) {
      // Search uses a different endpoint with `query` param
      url = `${API_BASE}/creators/search?order=best_match&page=${pageParam}&query=${encodeURIComponent(query)}`;
    } else {
      url = `${API_BASE}/creators/search/previews?order=${order}&page=${pageParam}&count=30&verified=y`;
    }

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const items = response.data.users || response.data.items || [];
    return {
      creators: items,
      nextPage: items.length > 0 ? pageParam + 1 : null,
    };
  } catch (error) {
    console.error('Error fetching creators:', error);
    return { creators: [], nextPage: null };
  }
};

// Fetch niches
export const fetchNiches = async ({
  order = 'posts',
  pageParam = 1,
}: {
  order?: string;
  pageParam?: number;
} = {}) => {
  const token = await getAuthToken();

  try {
    const response = await axios.get(
      `${API_BASE}/niches/search/previews?order=${order}&page=${pageParam}&count=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const niches = response.data.niches || [];
    return {
      niches,
      nextPage: niches.length > 0 ? pageParam + 1 : null,
    };
  } catch (error) {
    console.error('Error fetching niches:', error);
    return { niches: [], nextPage: null };
  }
};

// Fetch user GIFs
export const fetchUserGifs = async ({ username, pageParam = 1 }: { username: string; pageParam?: number }) => {
  const token = await getAuthToken();

  try {
    const response = await axios.get(
      `${API_BASE}/users/${username}/search?count=50&order=new&page=${pageParam}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return {
      gifs: response.data.gifs || [],
      nextPage: response.data.gifs?.length > 0 ? pageParam + 1 : null,
    };
  } catch (error: any) {
    // Re-throw 429 so React Query can retry with backoff
    if (error?.response?.status === 429) throw error;
    console.error('Error fetching user GIFs:', error);
    return { gifs: [], nextPage: null };
  }
};

// Fetch niche GIFs — uses tags param to filter by niche
export const fetchNicheGifs = async ({ nicheId, pageParam = 1 }: { nicheId: string; pageParam?: number }) => {
  const token = await getAuthToken();

  try {
    const response = await axios.get(
      `${API_BASE}/gifs/search?tags=${encodeURIComponent(nicheId)}&count=50&order=trending&type=g&page=${pageParam}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return {
      gifs: response.data.gifs || [],
      nextPage: response.data.gifs?.length > 0 ? pageParam + 1 : null,
    };
  } catch (error) {
    console.error('Error fetching niche GIFs:', error);
    return { gifs: [], nextPage: null };
  }
};

// Get GIF URL (extract from HTML embed)
export const getGifUrl = (gif: GifItem, quality: 'sd' | 'hd' = 'hd'): string => {
  return gif.urls[quality] || gif.urls.sd || gif.urls.hd || '';
};

// Get poster URL
export const getPosterUrl = (gif: GifItem): string => {
  return gif.urls.poster || gif.urls.thumbnail || '';
};
