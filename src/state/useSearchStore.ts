import { create } from 'zustand';

interface SearchResult {
  type: 'page' | 'streamer' | 'action';
  title: string;
  description?: string;
  to?: string; // URL for linking
  action?: () => void; // Function to execute
}

interface SearchState {
  query: string;
  results: SearchResult[];
  isOpen: boolean;
  setQuery: (query: string) => void;
  setIsOpen: (isOpen: boolean) => void;
}

// --- Sample Data & Search Logic ---
const allMenuItems: SearchResult[] = [
  { type: 'page', title: 'Home', to: '/' },
  { type: 'page', title: 'Cam Viewer', to: '/camviewer' },
  { type: 'page', title: 'Recordings', to: '/recordings' },
  { type: 'page', title: 'Archive', to: '/camarchive' },
  { type: 'page', title: 'Discovery (RedGifs)', to: '/redgifs' },
  { type: 'page', title: 'Galleries (Fapello)', to: '/fapello' },
  { type: 'page', title: 'Wallheaven', to: '/wallheaven' },
  { type: 'page', title: 'JavTube', to: '/javtube' },
  { type: 'page', title: 'NSFWAlbum', to: '/nsfwalbum' },
  { type: 'page', title: 'Bunkr', to: '/bunkr' },
];

const performSearch = (query: string): SearchResult[] => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    
    const pageResults = allMenuItems.filter(item => item.title.toLowerCase().includes(lowerQuery));
    
    // In a real app, you would get this from useBrowserStore.getState().streamers
    const streamerResults: SearchResult[] = [
        { type: 'streamer', title: 'cutegirl', description: 'Now online!', to: '/camviewer' },
        { type: 'streamer', title: 'another_model', description: 'Offline', to: '/camviewer' },
    ].filter(s => s.title.toLowerCase().includes(lowerQuery));

    return [...pageResults, ...streamerResults];
};

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  isOpen: false,
  
  setQuery: (query) => {
    set({ query, results: performSearch(query), isOpen: !!query });
  },

  setIsOpen: (isOpen) => set({ isOpen }),
}));