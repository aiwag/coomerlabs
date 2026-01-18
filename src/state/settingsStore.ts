import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LayoutMode =
  | "magic"
  | "hierarchical"
  | 2
  | 3
  | 4
  | "waterfall"
  | "clean-fit"
  | "full-expand"
  | "smart-fit";

interface SettingsState {
  sidebarVisible: boolean;
  sidebarCollapsed: boolean;
  layoutMode: LayoutMode;
  previousLayoutMode: LayoutMode;
  browserVisible: boolean;

  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleFullscreenView: () => void;
  setBrowserVisible: (visible: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sidebarVisible: true,
      sidebarCollapsed: false,
      layoutMode: "magic",
      previousLayoutMode: "magic",
      browserVisible: true,

      toggleSidebar: () =>
        set((state) => ({ sidebarVisible: !state.sidebarVisible })),
      toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setLayoutMode: (mode) =>
        set((state) => ({
          layoutMode: mode,
          previousLayoutMode: state.layoutMode,
        })),
      toggleFullscreenView: () =>
        set((state) => {
          const newMode =
            state.layoutMode === "full-expand"
              ? state.previousLayoutMode
              : "full-expand";
          return {
            layoutMode: newMode,
            previousLayoutMode: state.layoutMode,
          };
        }),
      setBrowserVisible: (visible) => set({ browserVisible: visible }),
    }),
    {
      name: "camviewer-settings-storage-v8",
    },
  ),
);
