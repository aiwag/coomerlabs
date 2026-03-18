import { create } from "zustand";

export interface FollowedActress {
  id: string;
  name: string;
  thumbnail: string;
  followedAt: number;
}

interface FollowState {
  followed: FollowedActress[];
  isFollowing: (id: string) => boolean;
  follow: (actress: Omit<FollowedActress, "followedAt">) => void;
  unfollow: (id: string) => void;
  toggle: (actress: Omit<FollowedActress, "followedAt">) => void;
  getFollowedIds: () => string[];
}

const STORAGE_KEY = "javtube-followed-actresses";

const loadFromStorage = (): FollowedActress[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (followed: FollowedActress[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(followed));
  } catch {
    // Storage full or unavailable
  }
};

export const useFollowStore = create<FollowState>((set, get) => ({
  followed: loadFromStorage(),

  isFollowing: (id: string) => get().followed.some((a) => a.id === id),

  follow: (actress) => {
    const current = get().followed;
    if (current.some((a) => a.id === actress.id)) return;
    const updated = [{ ...actress, followedAt: Date.now() }, ...current];
    saveToStorage(updated);
    set({ followed: updated });
  },

  unfollow: (id: string) => {
    const updated = get().followed.filter((a) => a.id !== id);
    saveToStorage(updated);
    set({ followed: updated });
  },

  toggle: (actress) => {
    if (get().isFollowing(actress.id)) {
      get().unfollow(actress.id);
    } else {
      get().follow(actress);
    }
  },

  getFollowedIds: () => get().followed.map((a) => a.id),
}));
