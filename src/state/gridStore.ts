import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { dbService } from '@/services/databaseService';
import { addViewedProfile } from '@/components/camarchive/api';
import { getUsernameFromUrl } from '@/utils/formatters';

interface GridState {
  streamUrls: string[];
  favorites: Set<string>;
  mutedStreams: Set<string>;
  playingStreams: Set<number>;
  fullViewMode: number | null;
  fullscreenStream: { url: string; username: string } | null;
  isGlobalMute: boolean;

  initializeStreams: () => Promise<void>;
  addStream: (url: string) => Promise<void>;
  removeStream: (index: number) => Promise<void>;
  handleDragEnd: (event: any) => Promise<void>;
  toggleFavorite: (url: string) => void;
  toggleMute: (url: string) => void;
  setGlobalMute: (mute: boolean) => void;
  setPlaying: (index: number, isPlaying: boolean) => void;
  setFullViewMode: (index: number | null) => void;
  setFullscreenStream: (stream: { url: string; username: string } | null) => void;
  rotateStreams: () => void;

  presets: Array<{ name: string; urls: string[] }>;
  savePreset: (name: string) => Promise<void>;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => Promise<void>;
}

const STREAM_ORDER_KEY = 'streamOrder';
const PRESETS_KEY = 'savedPresets';
const FAVORITES_KEY = 'favorites';
const MUTED_KEY = 'mutedStreams';

export const useGridStore = create<GridState>((set, get) => ({
  streamUrls: [],
  favorites: new Set(),
  mutedStreams: new Set(),
  playingStreams: new Set(),
  fullViewMode: null,
  fullscreenStream: null,
  isGlobalMute: false,
  presets: [],

  initializeStreams: async () => {
    await dbService.init();

    // Load Streams
    let finalUrls: string[] = (await dbService.getViewArrangement(STREAM_ORDER_KEY)) || [];
    if (finalUrls.length === 0) {
      finalUrls = await fetch("/streams.json").then((res) => res.json()).catch(() => []);
      await dbService.setViewArrangement(STREAM_ORDER_KEY, finalUrls);
    }

    // Load Presets
    const savedPresets = ((await dbService.getViewArrangement(PRESETS_KEY)) as unknown as { name: string; urls: string[] }[]) || [];

    // Load Favorites
    const savedFavs = (await dbService.getViewArrangement(FAVORITES_KEY)) || [];

    // Load Mutes
    const savedMutes = (await dbService.getViewArrangement(MUTED_KEY)) || [];

    set({
      streamUrls: finalUrls,
      presets: savedPresets,
      favorites: new Set(savedFavs as string[]),
      mutedStreams: new Set(savedMutes as string[])
    });

    // Add all initial streams to archive history
    finalUrls.forEach(url => {
      const username = getUsernameFromUrl(url);
      if (username) addViewedProfile(username);
    });
  },

  addStream: async (url) => {
    const currentUrls = get().streamUrls;
    if (currentUrls.includes(url)) return;
    const newUrls = [...currentUrls, url];
    set({ streamUrls: newUrls });

    // Track in archive history
    const username = getUsernameFromUrl(url);
    if (username) addViewedProfile(username);

    await dbService.setViewArrangement(STREAM_ORDER_KEY, newUrls);
  },

  removeStream: async (index) => {
    const currentUrls = get().streamUrls;
    const newUrls = currentUrls.filter((_, i) => i !== index);
    set({ streamUrls: newUrls });
    await dbService.setViewArrangement(STREAM_ORDER_KEY, newUrls);
  },

  handleDragEnd: async (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = get().streamUrls.findIndex(url => url === active.id);
      const newIndex = get().streamUrls.findIndex(url => url === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // SWAP Logic (Replace)
      const newUrls = [...get().streamUrls];
      [newUrls[oldIndex], newUrls[newIndex]] = [newUrls[newIndex], newUrls[oldIndex]];

      set({ streamUrls: newUrls });
      await dbService.setViewArrangement(STREAM_ORDER_KEY, newUrls);
    }
  },

  toggleFavorite: (url) => {
    const newFavorites = new Set(get().favorites);
    if (newFavorites.has(url)) newFavorites.delete(url);
    else newFavorites.add(url);
    set({ favorites: newFavorites });
    dbService.setViewArrangement(FAVORITES_KEY, Array.from(newFavorites));
  },
  toggleMute: (url) => {
    const newMuted = new Set(get().mutedStreams);
    if (newMuted.has(url)) newMuted.delete(url);
    else newMuted.add(url);
    set({ mutedStreams: newMuted });
    dbService.setViewArrangement(MUTED_KEY, Array.from(newMuted));
  },
  setPlaying: (index, isPlaying) => { const newPlaying = new Set(get().playingStreams); if (isPlaying) newPlaying.add(index); else newPlaying.delete(index); set({ playingStreams: newPlaying }); },
  setGlobalMute: (mute) => set({ isGlobalMute: mute }),
  setFullViewMode: (index) => set({ fullViewMode: index }),
  setFullscreenStream: (stream) => set({ fullscreenStream: stream }),
  rotateStreams: () => {
    const urls = [...get().streamUrls];
    if (urls.length < 2) return;
    const first = urls.shift();
    if (first) urls.push(first);
    set({ streamUrls: urls });
  },

  savePreset: async (name) => {
    const newPreset = { name, urls: [...get().streamUrls] };
    const currentPresets = get().presets.filter(p => p.name !== name); // Replace if exists
    const newPresets = [...currentPresets, newPreset];
    set({ presets: newPresets });
    await dbService.setViewArrangement(PRESETS_KEY, newPresets as unknown as string[]);
  },

  loadPreset: (name) => {
    const preset = get().presets.find(p => p.name === name);
    if (preset) {
      set({ streamUrls: [...preset.urls] });
      // Also save current active layout as this preset? No, just load.
      dbService.setViewArrangement(STREAM_ORDER_KEY, preset.urls);
    }
  },

  deletePreset: async (name) => {
    const newPresets = get().presets.filter(p => p.name !== name);
    set({ presets: newPresets });
    await dbService.setViewArrangement(PRESETS_KEY, newPresets as unknown as string[]);
  },
}));