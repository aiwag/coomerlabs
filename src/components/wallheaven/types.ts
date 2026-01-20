// Wallheaven Types
export interface Wallpaper {
  id: string;
  url: string;
  path: string;
  short_url: string;
  full_url: string;
  resolution: string;
  width: number;
  height: number;
  ratio: string;
  file_size: number;
  file_type: string;
  category: string;
  purity: string;
  views: number;
  favorites: number;
  source: string;
  uploader: {
    username: string;
    group: string;
    avatar: {
      p60: string;
      p120: string;
    };
  };
  tags: Tag[];
  thumbs: {
    large: string;
    original: string;
    small: string;
  };
}

export interface Tag {
  id: number;
  name: string;
  alias: string | null;
  category: string;
}

export interface WallpaperFilters {
  categories: string[];
  purity: string[];
  sorting: string;
  topRange?: string;
  query?: string;
}

export interface ViewMode {
  id: string;
  label: string;
  columns: number;
}

export const viewModes: ViewMode[] = [
  { id: 'comfortable', label: 'Comfortable', columns: 2 },
  { id: 'compact', label: 'Compact', columns: 3 },
  { id: 'minimal', label: 'Minimal', columns: 4 },
];

export const sortOptions = [
  { id: 'toplist', label: 'Top List' },
  { id: 'hot', label: 'Hot' },
  { id: 'latest', label: 'Latest' },
  { id: 'random', label: 'Random' },
];
