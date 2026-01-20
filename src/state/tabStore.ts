// Tab State Store - Browser-style tab management with state persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
  id: string;
  title: string;
  path: string;
  icon?: string;
  isActive: boolean;
  state?: any; // Store component-specific state
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  tabStates: Map<string, any>; // Store full state for each tab

  addTab: (tab: Omit<Tab, 'isActive'>) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabState: (tabId: string, state: any) => void;
  getTabState: (tabId: string) => any;
  clearAllTabs: () => void;
}

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      tabStates: new Map(),

      addTab: (tab) => {
        const { tabs, tabStates } = get();
        const existingTab = tabs.find(t => t.path === tab.path);

        if (existingTab) {
          // Tab already exists, just activate it
          set({
            tabs: tabs.map(t => t.id === tab.id ? { ...t, isActive: true } : { ...t, isActive: false }),
            activeTabId: tab.id,
          });
        } else {
          // Create new tab
          const newTab: Tab = { ...tab, isActive: true };
          set({
            tabs: [...tabs.map(t => ({ ...t, isActive: false })), newTab],
            activeTabId: tab.id,
            tabStates: new Map(tabStates).set(tab.id, tab.state || {}),
          });
        }
      },

      removeTab: (tabId) => {
        const { tabs, activeTabId, tabStates } = get();
        const newTabs = tabs.filter(t => t.id !== tabId);
        const newTabStates = new Map(tabStates);
        newTabStates.delete(tabId);

        // If removing active tab, activate another
        let newActiveTabId = activeTabId;
        if (activeTabId === tabId) {
          const activeIndex = tabs.findIndex(t => t.id === tabId);
          newActiveTabId = newTabs.length > 0
            ? newTabs[Math.min(activeIndex, newTabs.length - 1)].id
            : null;
        }

        set({
          tabs: newTabs.map(t => ({
            ...t,
            isActive: t.id === newActiveTabId,
          })),
          activeTabId: newActiveTabId,
          tabStates: newTabStates,
        });
      },

      setActiveTab: (tabId) => {
        const { tabs } = get();
        set({
          tabs: tabs.map(t => ({ ...t, isActive: t.id === tabId })),
          activeTabId: tabId,
        });
      },

      updateTabState: (tabId, state) => {
        const { tabStates } = get();
        const newTabStates = new Map(tabStates);
        const existingState = newTabStates.get(tabId) || {};
        newTabStates.set(tabId, { ...existingState, ...state });
        set({ tabStates: newTabStates });
      },

      getTabState: (tabId) => {
        const { tabStates } = get();
        return tabStates.get(tabId);
      },

      clearAllTabs: () => {
        set({
          tabs: [],
          activeTabId: null,
          tabStates: new Map(),
        });
      },
    }),
    {
      name: 'tab-storage',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        // Don't persist tabStates to keep it clean
      }),
    }
  )
);
