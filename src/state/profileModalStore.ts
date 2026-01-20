import { create } from 'zustand';

interface ProfileModalState {
  isOpen: boolean;
  username: string | null;
  openProfile: (username: string) => void;
  closeProfile: () => void;
}

export const useProfileModalStore = create<ProfileModalState>((set) => ({
  isOpen: false,
  username: null,
  openProfile: (username) => set({ isOpen: true, username }),
  closeProfile: () => set({ isOpen: false, username: null }),
}));
