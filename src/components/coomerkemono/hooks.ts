// CoomerKemono Hooks
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ViewMode } from './types';

interface SettingsState {
  viewMode: ViewMode;
  showFavoritedOnly: boolean;
  autoLoadImages: boolean;
  updateSetting: (key: string, value: any) => void;
  setViewMode: (viewMode: ViewMode) => void;
}

export const useCoomerKemonoSettings = create<SettingsState>()(
  persist(
    (set) => ({
      viewMode: { id: 'comfortable', label: 'Comfortable', columns: 2 },
      showFavoritedOnly: false,
      autoLoadImages: true,
      updateSetting: (key, value) =>
        set((state) => ({ ...state, [key]: value })),
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: 'coomerkemono-settings',
    }
  )
);

// Search/filter state
interface FilterState {
  query: string;
  service: string;
  setQuery: (query: string) => void;
  setService: (service: string) => void;
}

export const useCoomerKemonoFilter = create<FilterState>((set) => ({
  query: '',
  service: 'all',
  setQuery: (query) => set({ query }),
  setService: (service) => set({ service }),
}));

// Favorites state
interface FavoritesState {
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  favorites: new Set<string>(),
  toggleFavorite: (id) => {
    const { favorites } = get();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    set({ favorites: newFavorites });
    // Persist to localStorage
    localStorage.setItem('coomerkemono-favorites', JSON.stringify(Array.from(newFavorites)));
  },
  isFavorite: (id) => {
    const { favorites } = get();
    return favorites.has(id);
  },
}));

// Load favorites on mount
try {
  const stored = localStorage.getItem('coomerkemono-favorites');
  if (stored) {
    const favorites = new Set(JSON.parse(stored));
    useFavorites.setState({ favorites });
  }
} catch (error) {
  console.error('Failed to load favorites:', error);
}
