// RedGifs v2 Types
export interface GifItem {
  id: string;
  userName: string;
  urls: {
    thumbnail: string;
    sd: string;
    hd: string;
    poster: string;
    vthumbnail?: string;
    silent?: string;
  };
  type: number; // 1 for video, 2 for image
  duration?: number;
  hasAudio: boolean;
  likes: number;
  views: number;
  tags: string[];
  niches: string[] | Record<string, string>;
  avgColor: string;
  height: number;
  width: number;
  verified: boolean;
  description?: string;
  createDate?: number;
}

export interface Creator {
  username: string;
  name: string;
  description: string | null;
  followers: number;
  gifs: number;
  profileImageUrl: string | null;
  profileUrl: string | null;
  url: string;
  verified: boolean;
  views: number;
  likes?: number;
  subscription: number;
}

export interface Niche {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  subscribers: number;
  gifs: number;
}

export interface SortOption {
  id: string;
  label: string;
  value: string;
}

export interface QualityOption {
  id: string;
  label: string;
  value: 'sd' | 'hd';
}

export interface ViewMode {
  id: string;
  label: string;
  columns: number;
}

export const sortOptions: SortOption[] = [
  { id: 'trending', label: 'Trending', value: 'trending' },
  { id: 'latest', label: 'Latest', value: 'latest' },
  { id: 'top', label: 'Top', value: 'top' },
  { id: 'random', label: 'Random', value: 'random' },
];

export const qualityOptions: QualityOption[] = [
  { id: 'sd', label: 'SD', value: 'sd' },
  { id: 'hd', label: 'HD', value: 'hd' },
];

export const viewModes: ViewMode[] = [
  { id: 'comfortable', label: 'Comfortable', columns: 2 },
  { id: 'compact', label: 'Compact', columns: 3 },
  { id: 'minimal', label: 'Minimal', columns: 4 },
];
