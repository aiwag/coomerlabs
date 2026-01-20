// CoomerKemono API Layer
import axios from 'axios';
import { Creator, Profile } from './types';

const API_BASE = 'https://coomer.su/api';
const KEMONO_API_BASE = 'https://kemono.su/api';

// Fetch creators list
export const fetchCreators = async ({
  service,
  page,
  query,
}: {
  service?: string;
  page: number;
  query?: string;
}) => {
  try {
    const isKemono = service?.startsWith('patreon') || service?.startsWith('fanbox') || service?.startsWith('discord');
    const baseUrl = isKemono ? KEMONO_API_BASE : API_BASE;
    const endpoint = isKemono ? '/creators' : '/creators';

    const params = new URLSearchParams();
    if (service && service !== 'all' && service !== 'all-kemono') {
      params.append('service', service);
    }
    params.append('page', page.toString());
    if (query) {
      params.append('q', query);
    }

    const response = await axios.get(`${baseUrl}${endpoint}?${params.toString()}`);

    return {
      creators: response.data.data || [],
      nextPage: response.data.pagination?.isNextPage ? page + 1 : null,
    };
  } catch (error) {
    console.error('Error fetching creators:', error);
    return { creators: [], nextPage: null };
  }
};

// Fetch user profile
export const fetchProfile = async (service: string, user: string): Promise<Profile | null> => {
  try {
    const isKemono = ['patreon', 'fanbox', 'discord', 'fantia', 'afdian', 'boosty', 'gumroad', 'subscribestar'].includes(service);
    const baseUrl = isKemono ? KEMONO_API_BASE : API_BASE;

    const response = await axios.get(`${baseUrl}/user/${service}/user/${user}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

// Fetch user posts
export const fetchPosts = async ({
  service,
  userId,
  page,
}: {
  service: string;
  userId: string;
  page: number;
}) => {
  try {
    const isKemono = ['patreon', 'fanbox', 'discord', 'fantia', 'afdian', 'boosty', 'gumroad', 'subscribestar'].includes(service);
    const baseUrl = isKemono ? KEMONO_API_BASE : API_BASE;

    const response = await axios.get(`${baseUrl}/user/${service}/user/${userId}?page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return null;
  }
};

// Get avatar URL
export const getAvatarUrl = (service: string, user: string): string => {
  const baseUrl = service === 'patreon' || service === 'fanbox' ? 'https://kemono.su' : 'https://coomer.su';
  return `${baseUrl}/icons/${service}/${user}`;
};

// Get post file URL
export const getPostUrl = (service: string, postId: string, filename: string): string => {
  const baseUrl = ['patreon', 'fanbox'].includes(service) ? 'https://kemono.su' : 'https://coomer.su';
  const hash = postId.slice(0, 2);
  return `${baseUrl}/data/${service}/user/${postId}/${hash}/${filename}`;
};
