import { create } from 'zustand';

interface RouteState {
  scrollTop: number;
  searchText: string;
  filter: string;
  [key: string]: any;
}

interface RouteStateStore {
  states: Record<string, RouteState>;
  getState: (routeKey: string) => RouteState;
  setState: (routeKey: string, patch: Partial<RouteState>) => void;
  saveScroll: (routeKey: string, scrollTop: number) => void;
}

const DEFAULT: RouteState = {
  scrollTop: 0,
  searchText: '',
  filter: 'all',
};

/**
 * Per-route UI state that persists across navigation.
 * Use this to preserve scroll positions, filters, and search text
 * when switching between mini-apps.
 *
 * Usage:
 * ```tsx
 * const routeState = useRouteState(s => s.getState('/recordings'));
 * const setRouteState = useRouteState(s => s.setState);
 *
 * // On mount, restore scroll
 * useEffect(() => {
 *   scrollRef.current?.scrollTo(0, routeState.scrollTop);
 * }, []);
 *
 * // On unmount, save scroll
 * useEffect(() => () => {
 *   setRouteState('/recordings', { scrollTop: scrollRef.current?.scrollTop ?? 0 });
 * }, []);
 * ```
 */
export const useRouteState = create<RouteStateStore>((set, get) => ({
  states: {},

  getState: (routeKey: string) => {
    return get().states[routeKey] ?? { ...DEFAULT };
  },

  setState: (routeKey: string, patch: Partial<RouteState>) => {
    set((prev) => ({
      states: {
        ...prev.states,
        [routeKey]: {
          ...(prev.states[routeKey] ?? { ...DEFAULT }),
          ...patch,
        },
      },
    }));
  },

  saveScroll: (routeKey: string, scrollTop: number) => {
    set((prev) => ({
      states: {
        ...prev.states,
        [routeKey]: {
          ...(prev.states[routeKey] ?? { ...DEFAULT }),
          scrollTop,
        },
      },
    }));
  },
}));
