// Wallheaven Hooks
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ViewMode } from './types';

interface SettingsState {
  viewMode: ViewMode;
  showInfo: boolean;
  autoPreview: boolean;
  purity: string[];
  updateSetting: (key: string, value: any) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setPurity: (purity: string[]) => void;
}

export const useWallheavenSettings = create<SettingsState>()(
  persist(
    (set) => ({
      viewMode: { id: 'comfortable', label: 'Comfortable', columns: 2 },
      showInfo: true,
      autoPreview: true,
      purity: ['100'], // SFW only by default
      updateSetting: (key, value) =>
        set((state) => ({ ...state, [key]: value })),
      setViewMode: (viewMode) => set({ viewMode }),
      setPurity: (purity) => set({ purity }),
    }),
    {
      name: 'wallheaven-settings',
    }
  )
);

// Search state
interface SearchState {
  query: string;
  sorting: string;
  categories: string[];
  setQuery: (query: string) => void;
  setSorting: (sorting: string) => void;
  setCategories: (categories: string[]) => void;
}

export const useWallheavenSearch = create<SearchState>((set) => ({
  query: '',
  sorting: 'toplist',
  categories: ['general', 'anime', 'people'],
  setQuery: (query) => set({ query }),
  setSorting: (sorting) => set({ sorting }),
  setCategories: (categories) => set({ categories }),
}));
