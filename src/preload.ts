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
  }
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
