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

// Fetch trending GIFs
export const fetchTrendingGifs = async ({ pageParam = 1 }: { pageParam?: number }) => {
  const token = await getAuthToken();

  try {
    const response = await axios.get(
      `${API_BASE}/gifs/search?order=trending&count=50&type=g&verified=y&page=${pageParam}`,
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
    console.error('Error fetching trending GIFs:', error);
    return { gifs: [], nextPage: null };
  }
};

// Search GIFs
export const searchGifs = async ({ query, pageParam = 1 }: { query: string; pageParam?: number }) => {
  const token = await getAuthToken();

  try {
    const response = await axios.get(
      `${API_BASE}/gifs/search?search_text=${encodeURIComponent(query)}&count=50&type=g&verified=y&page=${pageParam}`,
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
    console.error('Error searching GIFs:', error);
    return { gifs: [], nextPage: null };
  }
};

// Fetch creators
export const fetchCreators = async ({ pageParam = 1 }: { pageParam?: number }) => {
  const token = await getAuthToken();

  try {
    const response = await axios.get(
      `${API_BASE}/creators/search/previews?order=trending&page=${pageParam}&count=30&verified=y`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return {
      creators: response.data.users || response.data.items || [],
      nextPage: response.data.users?.length > 0 ? pageParam + 1 : null,
    };
  } catch (error) {
    console.error('Error fetching creators:', error);
    return { creators: [], nextPage: null };
  }
};

// Fetch niches
export const fetchNiches = async () => {
  const token = await getAuthToken();

  try {
    const response = await axios.get(
      `${API_BASE}/niches/search/previews?order=subscribers&page=1&count=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return {
      niches: response.data.niches || [],
    };
  } catch (error) {
    console.error('Error fetching niches:', error);
    return { niches: [] };
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
  } catch (error) {
    console.error('Error fetching user GIFs:', error);
    return { gifs: [], nextPage: null };
  }
};

// Fetch niche GIFs
export const fetchNicheGifs = async ({ nicheId, pageParam = 1 }: { nicheId: string; pageParam?: number }) => {
  const token = await getAuthToken();

  try {
    const response = await axios.get(
      `${API_BASE}/niche/${nicheId}/search?count=50&order=trending&page=${pageParam}`,
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
