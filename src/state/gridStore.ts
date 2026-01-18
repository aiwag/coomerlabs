import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { dbService } from '@/services/databaseService';

interface GridState {
  streamUrls: string[];
  favorites: Set<number>;
  mutedStreams: Set<number>;
  playingStreams: Set<number>;
  fullViewMode: number | null;
  fullscreenStream: { url: string; username: string } | null;
  isGlobalMute: boolean;

  initializeStreams: () => Promise<void>;
  addStream: (url: string) => Promise<void>;
  removeStream: (index: number) => Promise<void>;
  handleDragEnd: (event: any) => Promise<void>;
  toggleFavorite: (index: number) => void;
  toggleMute: (index: number) => void;
  setGlobalMute: (mute: boolean) => void;
  setPlaying: (index: number, isPlaying: boolean) => void;
  setFullViewMode: (index: number | null) => void;
  setFullscreenStream: (stream: { url: string; username: string } | null) => void;
}

const STREAM_ORDER_KEY = 'streamOrder';

export const useGridStore = create<GridState>((set, get) => ({
  streamUrls: [],
  favorites: new Set(),
  mutedStreams: new Set(),
  playingStreams: new Set(),
  fullViewMode: null,
  fullscreenStream: null,
  isGlobalMute: false,

  initializeStreams: async () => {
    await dbService.init();

    // This is now doubly safe. `getViewArrangement` returns [], and `|| []` provides a final fallback.
    let finalUrls: string[] = (await dbService.getViewArrangement(STREAM_ORDER_KEY)) || [];

    if (finalUrls.length === 0) {
      finalUrls = await fetch("/streams.json").then((res) => res.json()).catch(() => []);
      await dbService.setViewArrangement(STREAM_ORDER_KEY, finalUrls);
    }

    set({ streamUrls: finalUrls });
  },

  addStream: async (url) => {
    const currentUrls = get().streamUrls;
    if (currentUrls.includes(url)) return;
    const newUrls = [...currentUrls, url];
    set({ streamUrls: newUrls });
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
      const newUrls = arrayMove(get().streamUrls, oldIndex, newIndex);
      set({ streamUrls: newUrls });
      await dbService.setViewArrangement(STREAM_ORDER_KEY, newUrls);
    }
  },

  toggleFavorite: (index) => { const newFavorites = new Set(get().favorites); if (newFavorites.has(index)) newFavorites.delete(index); else newFavorites.add(index); set({ favorites: newFavorites }); },
  toggleMute: (index) => { const newMuted = new Set(get().mutedStreams); if (newMuted.has(index)) newMuted.delete(index); else newMuted.add(index); set({ mutedStreams: newMuted }); },
  setPlaying: (index, isPlaying) => { const newPlaying = new Set(get().playingStreams); if (isPlaying) newPlaying.add(index); else newPlaying.delete(index); set({ playingStreams: newPlaying }); },
  setGlobalMute: (mute) => set({ isGlobalMute: mute }),
  setFullViewMode: (index) => set({ fullViewMode: index }),
  setFullscreenStream: (stream) => set({ fullscreenStream: stream }),
}));