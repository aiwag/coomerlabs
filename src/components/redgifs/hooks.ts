// RedGifs v2 Hooks
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QualityOption, ViewMode, SortOption } from './types';

interface SettingsState {
  quality: 'sd' | 'hd';
  viewMode: ViewMode;
  sortBy: string;
  autoPlay: boolean;
  muteAll: boolean;
  showThumbnails: boolean;
  loopVideos: boolean;
  updateSetting: (key: string, value: any) => void;
  setQuality: (quality: 'sd' | 'hd') => void;
  setViewMode: (viewMode: ViewMode) => void;
  setSortBy: (sortBy: string) => void;
}

export const useRedgifsSettings = create<SettingsState>()(
  persist(
    (set) => ({
      quality: 'hd',
      viewMode: { id: 'comfortable', label: 'Comfortable', columns: 2 },
      sortBy: 'trending',
      autoPlay: true,
      muteAll: true,
      showThumbnails: true,
      loopVideos: true,
      updateSetting: (key, value) =>
        set((state) => ({ ...state, [key]: value })),
      setQuality: (quality) => set({ quality }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSortBy: (sortBy) => set({ sortBy }),
    }),
    {
      name: 'redgifs-settings',
    }
  )
);

// Player state
interface PlayerState {
  currentIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isFullscreen: boolean;
  playbackSpeed: number;

  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;

  togglePlay: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
}

export const useRedgifsPlayer = create<PlayerState>((set, get) => ({
  currentIndex: 0,
  isPlaying: true,
  isMuted: true,
  volume: 1,
  isFullscreen: false,
  playbackSpeed: 1,

  setCurrentIndex: (index) => set({ currentIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setVolume: (volume) => set({ volume }),
  setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
}));

// Search state
interface SearchState {
  query: string;
  searchType: 'gifs' | 'creators' | 'niches';
  setQuery: (query: string) => void;
  setSearchType: (type: 'gifs' | 'creators' | 'niches') => void;
}

export const useRedgifsSearch = create<SearchState>((set) => ({
  query: '',
  searchType: 'gifs',
  setQuery: (query) => set({ query }),
  setSearchType: (searchType) => set({ searchType }),
}));
