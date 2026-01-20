// Wallheaven API Layer
import axios from 'axios';
import { Wallpaper, WallpaperFilters } from './types';

const API_BASE = 'https://wallhaven.cc/api/v1';

export const fetchWallpapers = async ({
  pageParam = 1,
  filters,
}: {
  pageParam?: number;
  filters: WallpaperFilters;
}) => {
  try {
    const params = new URLSearchParams({
      page: pageParam.toString(),
    });

    if (filters.query) {
      params.append('q', filters.query);
    }

    // Categories: general, anime, people
    if (filters.categories.length > 0) {
      params.append('categories', filters.categories.join(''));
    } else {
      params.append('categories', '111'); // All enabled
    }

    // Purity: sfw, sketchy, nsfw
    if (filters.purity.length > 0) {
      params.append('purity', filters.purity.join(''));
    } else {
      params.append('purity', '100'); // SFW only by default
    }

    // Sorting
    if (filters.sorting) {
      params.append('sorting', filters.sorting);
    }

    // Top range for toplist sorting
    if (filters.sorting === 'toplist' && filters.topRange) {
      params.append('topRange', filters.topRange);
    }

    const response = await axios.get(`${API_BASE}/search?${params.toString()}`);

    return {
      wallpapers: response.data.data || [],
      nextPage: response.data.meta?.current_page < response.data.meta?.last_page
        ? pageParam + 1
        : null,
    };
  } catch (error) {
    console.error('Error fetching wallpapers:', error);
    return { wallpapers: [], nextPage: null };
  }
};

export const getWallpaperUrl = (wallpaper: Wallpaper, size: 'full' | 'thumb' = 'full'): string => {
  if (size === 'full') {
    return wallpaper.path;
  }
  return wallpaper.thumbs.large;
};

export const downloadWallpaper = async (wallpaper: Wallpaper): Promise<void> => {
  try {
    const response = await fetch(wallpaper.path);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wallpaper-${wallpaper.id}.${wallpaper.file_type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading wallpaper:', error);
    throw error;
  }
};
