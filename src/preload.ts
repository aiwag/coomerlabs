import exposeContexts from "./helpers/ipc/context-exposer";
import { contextBridge, shell, ipcRenderer } from "electron";

exposeContexts();

contextBridge.exposeInMainWorld("electronAPI", {
  openExternal: (url: string) => shell.openExternal(url),

  // Database API
  db: {
    searchCreators: (query: string, service?: string) =>
      ipcRenderer.invoke('db:searchCreators', query, service),
    getCreatorsByService: (service: string, page: number, pageSize: number) =>
      ipcRenderer.invoke('db:getCreatorsByService', service, page, pageSize),
    getAllCreators: (page: number, pageSize: number) =>
      ipcRenderer.invoke('db:getAllCreators', page, pageSize),
    upsertCreators: (creators: any[]) =>
      ipcRenderer.invoke('db:upsertCreators', creators),

    toggleFavorite: (creatorId: string) =>
      ipcRenderer.invoke('db:toggleFavorite', creatorId),
    getFavorites: () =>
      ipcRenderer.invoke('db:getFavorites'),

    getPostsByCreator: (creatorId: string, limit?: number) =>
      ipcRenderer.invoke('db:getPostsByCreator', creatorId, limit),
    upsertPosts: (posts: any[]) =>
      ipcRenderer.invoke('db:upsertPosts', posts),

    setCache: (key: string, value: any, ttl?: number) =>
      ipcRenderer.invoke('db:setCache', key, value, ttl),
    getCache: (key: string) =>
      ipcRenderer.invoke('db:getCache', key),
    clearExpiredCache: () =>
      ipcRenderer.invoke('db:clearExpiredCache'),

    getStats: () =>
      ipcRenderer.invoke('db:getStats'),
    vacuum: () =>
      ipcRenderer.invoke('db:vacuum'),
  },

  // ArchiveBate API
  archivebate: {
    getProfile: (username: string, page?: number) =>
      ipcRenderer.invoke('archivebate:getProfile', username, page),
    getEmbedUrl: (pageUrl: string) =>
      ipcRenderer.invoke('archivebate:getEmbedUrl', pageUrl),
  },

  // System API
  system: {
    setProxy: (config: any) => ipcRenderer.invoke('system:setProxy', config),
    clearProxy: () => ipcRenderer.invoke('system:clearProxy'),
    wreqFetch: (url: string, options?: any) => ipcRenderer.invoke('system:wreqFetch', url, options),
  },

  // NSFWAlbum API
  nsfwalbum: {
    fetchPage: (page: number, query: string) => ipcRenderer.invoke('nsfwalbum:fetchPage', page, query),
    resolveHQ: (photoId: string) => ipcRenderer.invoke('nsfwalbum:resolveHQ', photoId),
  },

  // Bunkr API
  bunkr: {
    fetch: (url: string) => ipcRenderer.invoke('bunkr:fetch', url),
    resolveVideo: (filePageUrl: string) => ipcRenderer.invoke('bunkr:resolveVideo', filePageUrl),
  },

  // Ad Blocker API
  adblock: {
    toggle: () => ipcRenderer.invoke('adblock:toggle'),
    status: () => ipcRenderer.invoke('adblock:status'),
    updateLists: () => ipcRenderer.invoke('adblock:updateLists'),
  },

  // DNS API
  dns: {
    getProviders: () => ipcRenderer.invoke('dns:getProviders'),
    set: (providerId: string) => ipcRenderer.invoke('dns:set', providerId),
  },


  // Proxy Pool Engine API
  proxyPool: {
    refreshPool: () => ipcRenderer.invoke('proxy:refreshPool'),
    getStats: () => ipcRenderer.invoke('proxy:getStats'),
    getPool: () => ipcRenderer.invoke('proxy:getPool'),
    getCurrent: () => ipcRenderer.invoke('proxy:getCurrent'),
    rotate: () => ipcRenderer.invoke('proxy:rotate'),
    applyPoolProxy: () => ipcRenderer.invoke('proxy:applyPoolProxy'),
    reportFailure: (proxy: any) => ipcRenderer.invoke('proxy:reportFailure', proxy),
    reportSuccess: (proxy: any) => ipcRenderer.invoke('proxy:reportSuccess', proxy),
    startAutoRefresh: () => ipcRenderer.invoke('proxy:startAutoRefresh'),
    stopAutoRefresh: () => ipcRenderer.invoke('proxy:stopAutoRefresh'),
    getProgress: () => ipcRenderer.invoke('proxy:getProgress'),
    onProgress: (callback: (progress: any) => void) => {
      const handler = (_event: any, progress: any) => callback(progress);
      ipcRenderer.on('proxy:progress', handler);
      return () => ipcRenderer.removeListener('proxy:progress', handler);
    },
    onSuggestion: (callback: (suggestion: any) => void) => {
      const handler = (_event: any, suggestion: any) => callback(suggestion);
      ipcRenderer.on('proxy:suggestion', handler);
      return () => ipcRenderer.removeListener('proxy:suggestion', handler);
    },
    reportNetworkIssue: (issue: any) => ipcRenderer.invoke('proxy:reportNetworkIssue', issue),
    verifyIp: () => ipcRenderer.invoke('proxy:verifyIp'),
  },

  // Tunnel API (Shadowsocks / V2Ray / Trojan / VLESS)
  tunnel: {
    fetchServers: () => ipcRenderer.invoke('tunnel:fetchServers'),
    getServers: () => ipcRenderer.invoke('tunnel:getServers'),
    connect: (serverId: string) => ipcRenderer.invoke('tunnel:connect', serverId),
    disconnect: () => ipcRenderer.invoke('tunnel:disconnect'),
    status: () => ipcRenderer.invoke('tunnel:status'),
    isXrayInstalled: () => ipcRenderer.invoke('tunnel:isXrayInstalled'),
    downloadXray: () => ipcRenderer.invoke('tunnel:downloadXray'),
    onProgress: (callback: (progress: any) => void) => {
      const handler = (_event: any, progress: any) => callback(progress);
      ipcRenderer.on('tunnel:progress', handler);
      return () => ipcRenderer.removeListener('tunnel:progress', handler);
    },
  },

  // Bandwidth API
  bandwidth: {
    getStats: () => ipcRenderer.invoke('bandwidth:getStats'),
    onStats: (callback: (stats: any) => void) => {
      const handler = (_event: any, stats: any) => callback(stats);
      ipcRenderer.on('bandwidth:stats', handler);
      return () => ipcRenderer.removeListener('bandwidth:stats', handler);
    },
  },

  // Recording API
  recording: {
    start: (username: string, streamerInfo?: { gender?: string; tags?: string[] }) =>
      ipcRenderer.invoke('recording:start', username, streamerInfo),
    stop: (username: string) =>
      ipcRenderer.invoke('recording:stop', username),
    list: () =>
      ipcRenderer.invoke('recording:list'),
    active: () =>
      ipcRenderer.invoke('recording:active'),
    delete: (id: string) =>
      ipcRenderer.invoke('recording:delete', id),
    isRecording: (username: string) =>
      ipcRenderer.invoke('recording:isRecording', username),
    getFilePath: (id: string) =>
      ipcRenderer.invoke('recording:getFilePath', id),
    openFolder: (id: string) =>
      ipcRenderer.invoke('recording:openFolder', id),
    getStorageInfo: () =>
      ipcRenderer.invoke('recording:getStorageInfo'),
    onEvent: (callback: (event: any) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('recording:event', handler);
      return () => ipcRenderer.removeListener('recording:event', handler);
    },
  },

  // Chaturbate API (bypass proxy)
  chaturbate: {
    fetch: (urlPath: string) =>
      ipcRenderer.invoke('chaturbate:fetch', urlPath),
    getHlsUrl: (username: string) =>
      ipcRenderer.invoke('chaturbate:getHlsUrl', username),
  },
});

// Expose a secure API to the renderer process and webviews.
// This is the modern, secure way to handle IPC in Electron.
contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    // A one-way channel from renderer to main.
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    // A channel to send messages from the webview to its host renderer process.
    sendToHost: (channel: string, ...args: any[]) => {
      ipcRenderer.sendToHost(channel, ...args);
    },
    // A two-way channel from renderer to main.
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    // A channel from main to renderer.
    on: (channel: string, func: (...args: any[]) => void) => {
      const subscription = (
        _event: Electron.IpcRendererEvent,
        ...args: any[]
      ) => func(...args);
      ipcRenderer.on(channel, subscription);
      // Return a cleanup function
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    // A one-time channel from main to renderer.
    once: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
});
