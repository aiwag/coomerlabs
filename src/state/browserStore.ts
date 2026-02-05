import { create } from 'zustand';
import { getMostViewedRooms, searchRooms, getTopRatedRooms, getTrendingRooms, Streamer, CarouselGender } from '@/services/chaturbateApiService';

export type BrowseMode = 'mostViewed' | 'topRated' | 'trending' | 'search' | 'active';
export type SortByType = 'num_users' | 'num_followers' | 'display_age' | 'start_dt_utc';

interface Filters { minViewers: number; region: string; showNew: boolean; showVerified: boolean; gender: CarouselGender; }

interface BrowserState {
  streamers: Streamer[];
  filteredStreamers: Streamer[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  browseMode: BrowseMode;
  searchTerm: string;
  activeSearchQuery: string;
  abortController: AbortController | null;
  filterPanelOpen: boolean;
  filters: Filters;
  sortBy: SortByType;

  fetchStreamers: (isLoadMore?: boolean) => Promise<void>;
  setBrowseMode: (mode: BrowseMode) => void;
  setSearchTerm: (term: string) => void;
  executeSearch: (term: string) => void;
  cleanup: () => void;
  toggleFilterPanel: () => void;
  setFilters: (newFilters: Partial<Filters>) => void;
  setSortBy: (sort: SortByType) => void;
  clearFilters: () => void;
}

const initialFilters: Filters = { minViewers: 0, region: '', showNew: false, showVerified: false, gender: '' };

const applyFiltersAndSort = (streamers: Streamer[], filters: Filters, sortBy: SortByType): Streamer[] => {
  const filtered = streamers.filter(s =>
    s.num_users >= filters.minViewers &&
    (!filters.region || s.country.toLowerCase() === filters.region.toLowerCase()) &&
    (!filters.showNew || s.is_new) &&
    (!filters.showVerified || s.is_age_verified) &&
    (!filters.gender || s.gender === filters.gender)
  );
  return filtered.sort((a, b) => {
    if (sortBy === 'display_age') return (a.display_age ?? 99) - (b.display_age ?? 99);
    if (sortBy === 'start_dt_utc') return new Date(b.start_dt_utc).getTime() - new Date(a.start_dt_utc).getTime();
    return (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
  });
};

export const useBrowserStore = create<BrowserState>((set, get) => ({
  streamers: [],
  filteredStreamers: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  hasMore: true,
  browseMode: 'mostViewed',
  searchTerm: '',
  activeSearchQuery: '',
  abortController: null,
  filterPanelOpen: false,
  filters: initialFilters,
  sortBy: 'num_users',

  fetchStreamers: async (isLoadMore = false) => {
    const state = get();
    if (state.isLoading) return;

    state.abortController?.abort();
    const newAbortController = new AbortController();
    set({ isLoading: true, error: null, abortController: newAbortController });

    const pageToFetch = isLoadMore ? state.currentPage + 1 : 1;
    const limit = 40;

    try {
      let response;
      const signal = newAbortController.signal;

      const isCarousel = state.browseMode === 'topRated' || state.browseMode === 'trending';
      if (isCarousel && isLoadMore) { set({ isLoading: false, hasMore: false }); return; }

      switch (state.browseMode) {
        case 'search':
          if (!state.activeSearchQuery) { set({ isLoading: false, streamers: [], hasMore: false }); return; }
          response = await searchRooms(state.activeSearchQuery, pageToFetch, limit, signal, state.filters.gender);
          break;
        case 'topRated': response = await getTopRatedRooms(signal, state.filters.gender); break;
        case 'trending': response = await getTrendingRooms(signal, state.filters.gender); break;
        default: response = await getMostViewedRooms(pageToFetch, limit, signal, state.filters.gender); break;
      }

      const newStreamers = isLoadMore ? [...state.streamers, ...response.rooms] : response.rooms;

      set(s => ({
        streamers: newStreamers,
        filteredStreamers: applyFiltersAndSort(newStreamers, s.filters, s.sortBy),
        currentPage: pageToFetch,
        hasMore: isCarousel ? false : response.rooms.length === limit,
      }));
    } catch (err: any) {
      if (err.name !== 'AbortError') set({ error: err.message });
    } finally {
      if (get().abortController === newAbortController) set({ isLoading: false });
    }
  },

  setBrowseMode: (mode) => { set({ browseMode: mode, streamers: [], currentPage: 1, hasMore: true, error: null }); get().fetchStreamers(); },
  setSearchTerm: (term) => set({ searchTerm: term }),
  executeSearch: (term) => { if (!term) { if (get().browseMode === 'search') get().setBrowseMode('mostViewed'); return; } set({ browseMode: 'search', activeSearchQuery: term, streamers: [], currentPage: 1, hasMore: true, error: null }); get().fetchStreamers(); },

  cleanup: () => { get().abortController?.abort(); set({ streamers: [], filteredStreamers: [], currentPage: 1, error: null }); },

  toggleFilterPanel: () => set(state => ({ filterPanelOpen: !state.filterPanelOpen })),
  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set(s => ({ filters, filteredStreamers: applyFiltersAndSort(s.streamers, filters, s.sortBy) }));
    if (newFilters.gender !== undefined) get().fetchStreamers();
  },
  setSortBy: (sort) => { set(s => ({ sortBy: sort, filteredStreamers: applyFiltersAndSort(s.streamers, s.filters, sort) })) },
  clearFilters: () => { set(s => ({ filters: initialFilters, filteredStreamers: applyFiltersAndSort(s.streamers, initialFilters, s.sortBy) })) },
}));