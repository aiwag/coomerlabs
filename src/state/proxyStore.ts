import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProxyConfig {
  enabled: boolean;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: string;
}

export interface PoolStats {
  totalFetched: number;
  totalValid: number;
  poolSize: number;
  avgLatency: number;
  lastRefresh: number;
  sources: number;
}

export interface PoolProxy {
  host: string;
  port: number;
  protocol: string;
  latencyMs: number;
  score: number;
  failCount: number;
  successCount: number;
  country?: string;
}

export interface ProxyProgress {
  phase: 'fetching' | 'validating' | 'building' | 'done' | 'idle';
  fetched: number;
  tested: number;
  total: number;
  alive: number;
  log: string;
}

type ProxyMode = 'off' | 'manual' | 'pool' | 'tunnel';

interface ProxyState {
  mode: ProxyMode;
  config: ProxyConfig;
  poolStats: PoolStats | null;
  poolProxies: PoolProxy[];
  currentPoolProxy: PoolProxy | null;
  isRefreshing: boolean;
  autoRefreshEnabled: boolean;
  progress: ProxyProgress;

  // Tunnel state
  tunnelServers: any[];
  tunnelConnected: boolean;
  tunnelServer: any | null;
  tunnelFetching: boolean;
  tunnelLog: string;

  setMode: (mode: ProxyMode) => void;
  updateConfig: (updates: Partial<ProxyConfig>) => void;
  applyManualProxy: () => Promise<void>;
  refreshPool: () => Promise<void>;
  fetchPoolStats: () => Promise<void>;
  fetchPoolProxies: () => Promise<void>;
  applyPoolProxy: () => Promise<void>;
  rotatePoolProxy: () => Promise<void>;
  toggleAutoRefresh: () => Promise<void>;
  clearProxy: () => Promise<void>;
  subscribeToProgress: () => (() => void);

  // Tunnel actions
  fetchTunnelServers: () => Promise<void>;
  connectTunnel: (serverId: string) => Promise<void>;
  disconnectTunnel: () => Promise<void>;
  subscribeTunnelProgress: () => (() => void);
}

export const useProxyStore = create<ProxyState>()(
  persist(
    (set, get) => ({
      mode: 'off',
      config: {
        enabled: false,
        protocol: 'http',
        host: '',
        port: '',
      },
      poolStats: null,
      poolProxies: [],
      currentPoolProxy: null,
      isRefreshing: false,
      autoRefreshEnabled: false,
      progress: { phase: 'idle', fetched: 0, tested: 0, total: 0, alive: 0, log: 'Ready' },

      // Tunnel defaults
      tunnelServers: [],
      tunnelConnected: false,
      tunnelServer: null,
      tunnelFetching: false,
      tunnelLog: 'Ready',

      subscribeToProgress: () => {
        try {
          // @ts-ignore
          const unsub = window.electronAPI?.proxyPool?.onProgress?.((progress: ProxyProgress) => {
            const updates: any = { progress, isRefreshing: progress.phase !== 'done' && progress.phase !== 'idle' };
            // Consume live stats + activeProxy from incremental builds
            if ((progress as any).stats) updates.poolStats = (progress as any).stats;
            if ((progress as any).activeProxy) updates.currentPoolProxy = (progress as any).activeProxy;
            set(updates);
            // Final update when done
            if (progress.phase === 'done') {
              get().fetchPoolStats();
              get().fetchPoolProxies();
              get().applyPoolProxy();
            }
          });
          return unsub || (() => {});
        } catch {
          return () => {};
        }
      },

      setMode: async (mode) => {
        set({ mode });
        if (mode === 'off') {
          get().clearProxy();
          // Also disconnect tunnel if it was active
          if (get().tunnelConnected) get().disconnectTunnel();
        } else if (mode === 'manual') {
          if (get().tunnelConnected) get().disconnectTunnel();
          get().applyManualProxy();
        } else if (mode === 'pool') {
          if (get().tunnelConnected) get().disconnectTunnel();
          get().applyPoolProxy();
        } else if (mode === 'tunnel') {
          // Load from cache first (instant), fetch from network only if empty
          if (get().tunnelServers.length === 0) {
            try {
              // @ts-ignore
              const cached = await window.electronAPI?.tunnel?.getServers();
              if (cached?.success && cached.servers?.length > 0) {
                set({ tunnelServers: cached.servers, tunnelLog: `Loaded ${cached.servers.length} cached servers` });
              } else {
                get().fetchTunnelServers();
              }
            } catch {
              get().fetchTunnelServers();
            }
          }
        }
      },

      updateConfig: (updates) => {
        set((s) => ({ config: { ...s.config, ...updates } }));
      },

      applyManualProxy: async () => {
        try {
          const { config } = get();
          // @ts-ignore
          if (window.electronAPI?.system?.setProxy) {
            // @ts-ignore
            await window.electronAPI.system.setProxy({
              enabled: true,
              protocol: config.protocol,
              host: config.host,
              port: config.port,
            });
          }
        } catch (e) { console.error('Manual proxy apply failed', e); }
      },

      refreshPool: async () => {
        set({ isRefreshing: true });
        try {
          // @ts-ignore
          const res = await window.electronAPI?.proxyPool?.refreshPool();
          if (res?.success) {
            set({ poolStats: res.stats });
            get().fetchPoolProxies();
          }
        } catch (e) { console.error(e); }
        finally { set({ isRefreshing: false }); }
      },

      fetchPoolStats: async () => {
        try {
          // @ts-ignore
          const res = await window.electronAPI?.proxyPool?.getStats();
          if (res?.success) set({ poolStats: res.stats });
        } catch { /* ignore */ }
      },

      fetchPoolProxies: async () => {
        try {
          // @ts-ignore
          const res = await window.electronAPI?.proxyPool?.getPool();
          if (res?.success) set({ poolProxies: res.proxies || [] });
        } catch { /* ignore */ }
      },

      applyPoolProxy: async () => {
        try {
          // @ts-ignore
          const res = await window.electronAPI?.proxyPool?.applyPoolProxy();
          if (res?.success && res.proxy) {
            set({ currentPoolProxy: res.proxy });
          }
        } catch { /* ignore */ }
      },

      rotatePoolProxy: async () => {
        try {
          // @ts-ignore — rotateProxy now applies to session internally, no need for double-apply
          const res = await window.electronAPI?.proxyPool?.rotate();
          if (res?.success && res.proxy) {
            set({ currentPoolProxy: res.proxy });
          }
        } catch { /* ignore */ }
      },

      toggleAutoRefresh: async () => {
        const newVal = !get().autoRefreshEnabled;
        set({ autoRefreshEnabled: newVal });
        try {
          if (newVal) {
            // @ts-ignore
            await window.electronAPI?.proxyPool?.startAutoRefresh();
          } else {
            // @ts-ignore
            await window.electronAPI?.proxyPool?.stopAutoRefresh();
          }
        } catch { /* ignore */ }
      },

      clearProxy: async () => {
        try {
          // @ts-ignore
          await window.electronAPI?.system?.clearProxy();
          set({ currentPoolProxy: null });
        } catch { /* ignore */ }
      },

      // ─── Tunnel Actions ──────────────────────────────────────────
      fetchTunnelServers: async () => {
        set({ tunnelFetching: true, tunnelLog: 'Fetching servers...' });
        try {
          console.log('[TunnelStore] fetchTunnelServers called, invoking IPC...');
          // @ts-ignore
          const res = await window.electronAPI?.tunnel?.fetchServers();
          console.log('[TunnelStore] IPC result:', res);
          if (res?.success) {
            set({ tunnelServers: res.servers || [], tunnelLog: `Found ${res.servers?.length || 0} servers` });
          } else {
            set({ tunnelLog: res?.error || 'Failed to fetch servers' });
          }
        } catch (e) { console.error('[TunnelStore] Error:', e); set({ tunnelLog: String(e) }); }
        finally { set({ tunnelFetching: false }); }
      },

      connectTunnel: async (serverId: string) => {
        set({ tunnelLog: 'Connecting...' });
        try {
          // @ts-ignore
          const res = await window.electronAPI?.tunnel?.connect(serverId);
          if (res?.success) {
            set({ tunnelConnected: true, tunnelServer: res.status?.server, tunnelLog: 'Connected ✓' });
          } else {
            set({ tunnelConnected: false, tunnelServer: null, tunnelLog: `✗ ${res?.error || 'Connection failed'}` });
          }
        } catch (e) {
          set({ tunnelConnected: false, tunnelServer: null, tunnelLog: `✗ ${String(e)}` });
        }
      },

      disconnectTunnel: async () => {
        try {
          // @ts-ignore
          await window.electronAPI?.tunnel?.disconnect();
          set({ tunnelConnected: false, tunnelServer: null, tunnelLog: 'Disconnected' });
        } catch { /* ignore */ }
      },

      subscribeTunnelProgress: () => {
        try {
          // @ts-ignore
          const unsub = window.electronAPI?.tunnel?.onProgress?.((progress: any) => {
            set({ tunnelLog: progress.log || '' });
            if (progress.phase === 'connected') {
              set({ tunnelConnected: true });
            } else if (progress.phase === 'error' || progress.phase === 'ready') {
              if (progress.phase === 'error') set({ tunnelConnected: false, tunnelServer: null });
            }
          });
          return unsub || (() => {});
        } catch {
          return () => {};
        }
      },
    }),
    {
      name: 'coomerlabs-proxy-storage',
      partialize: (state) => ({
        mode: state.mode,
        config: state.config,
        autoRefreshEnabled: state.autoRefreshEnabled,
      }),
    }
  )
);
