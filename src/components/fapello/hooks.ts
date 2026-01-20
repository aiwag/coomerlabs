// Fapello Hooks
import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from './types';

interface SettingsState {
  settings: Settings;
  updateSetting: (key: string, value: any) => void;
}

// Settings store using Zustand
const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        autoPlay: false,
        showThumbnails: true,
        highQuality: true,
        compactView: false,
        infiniteScroll: true,
        slideshowSpeed: 3000,
        showControls: true,
        columnCount: 4,
      },
      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
    }),
    {
      name: 'fapello-settings',
    }
  )
);

// Settings hook
export const useSettings = () => {
  const { settings, updateSetting } = useSettingsStore();
  return { settings, updateSetting };
};

// Theme hook
export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fapello-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('fapello-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark(!isDark) };
};

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
