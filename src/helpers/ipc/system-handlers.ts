import { ipcMain, session, BrowserWindow } from 'electron';
import {
  refreshProxyPool,
  getPoolStats,
  getPoolProxies,
  getCurrentProxy,
  rotateProxy,
  reportProxyFailure,
  reportProxySuccess,
  applyProxyToSession,
  startAutoRefresh,
  stopAutoRefresh,
  stopHealthMonitor,
  loadExistingPool,
  getProgress,
  verifyExternalIp,
  reportNetworkIssue,
  proxyEvents,
  type ValidatedProxy,
} from '../proxy-engine';
import { fetchServers, getCachedServers, getServerById, tunnelEvents, loadCachedServers, saveLastConnectedServer } from '../tunnel-engine';
import { connect as xrayConnect, disconnect as xrayDisconnect, getStatus as xrayGetStatus, isXrayInstalled, downloadXray } from '../xray-manager';
import { startTracking, getStats as getBandwidthStats, bandwidthEvents } from '../bandwidth-tracker';
import { registerWreqHandlers } from './wreq-handler';

export function registerSystemHandlers() {
  // Register the wreq TLS spoofing interceptors
  registerWreqHandlers();

  // ─── Manual Proxy (from UI input) ────────────────────────────────
  ipcMain.handle('system:setProxy', async (_, config) => {
    try {
      if (config.enabled && config.host && config.port) {
        const proxyRules = `${config.protocol}://${config.host}:${config.port}`;
        await session.defaultSession.setProxy({ proxyRules });
        return { success: true };
      } else {
        await session.defaultSession.setProxy({});
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('system:clearProxy', async () => {
    try {
      await session.defaultSession.setProxy({});
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ─── Proxy Pool Engine ───────────────────────────────────────────
  ipcMain.handle('proxy:refreshPool', async () => {
    try {
      const stats = await refreshProxyPool();
      return { success: true, stats };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('proxy:getStats', () => {
    try {
      return { success: true, stats: getPoolStats() };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('proxy:getPool', () => {
    try {
      return { success: true, proxies: getPoolProxies() };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('proxy:getCurrent', () => {
    return { success: true, proxy: getCurrentProxy() };
  });

  ipcMain.handle('proxy:rotate', async () => {
    const proxy = await rotateProxy();
    return { success: true, proxy };
  });

  ipcMain.handle('proxy:applyPoolProxy', async () => {
    try {
      const proxy = getCurrentProxy();
      await applyProxyToSession(proxy);
      return { success: true, proxy };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('proxy:reportFailure', async (_, proxyData: ValidatedProxy) => {
    try {
      await reportProxyFailure(proxyData);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('proxy:reportSuccess', (_, proxyData: ValidatedProxy) => {
    try {
      reportProxySuccess(proxyData);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('proxy:startAutoRefresh', () => {
    startAutoRefresh();
    return { success: true };
  });

  ipcMain.handle('proxy:stopAutoRefresh', () => {
    stopAutoRefresh();
    return { success: true };
  });

  ipcMain.handle('proxy:getProgress', () => {
    return { success: true, progress: getProgress() };
  });

  ipcMain.handle('proxy:verifyIp', async () => {
    try {
      const results = await verifyExternalIp();
      return { success: true, results };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ─── Push progress updates to all renderer windows ───────────────
  proxyEvents.on('progress', (progress) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('proxy:progress', progress);
      }
    }
  });

  // ─── Push smart suggestions to all renderer windows ──────────────
  proxyEvents.on('suggestion', (suggestion) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('proxy:suggestion', suggestion);
      }
    }
  });

  // ─── Report network issues from renderer ─────────────────────────
  ipcMain.handle('proxy:reportNetworkIssue', (_, issue) => {
    try {
      reportNetworkIssue(issue);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ─── Tunnel (Shadowsocks / V2Ray / Trojan / VLESS) ──────────────
  ipcMain.handle('tunnel:fetchServers', async () => {
    try {
      const servers = await fetchServers();
      return { success: true, servers };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('tunnel:getServers', () => {
    return { success: true, servers: getCachedServers() };
  });

  ipcMain.handle('tunnel:connect', async (_, serverId: string) => {
    try {
      // Stop pool health monitor + auto-refresh before tunnel connects
      stopHealthMonitor();
      stopAutoRefresh();
      const server = getServerById(serverId);
      if (!server) return { success: false, error: 'Server not found' };
      const status = await xrayConnect(server);
      if (status.running) saveLastConnectedServer(serverId);
      return { success: status.running, status, error: status.error };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('tunnel:disconnect', async () => {
    try {
      await xrayDisconnect();
      saveLastConnectedServer(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('tunnel:status', () => {
    return { success: true, status: xrayGetStatus() };
  });

  ipcMain.handle('tunnel:isXrayInstalled', () => {
    return { success: true, installed: isXrayInstalled() };
  });

  ipcMain.handle('tunnel:downloadXray', async () => {
    try {
      const ok = await downloadXray();
      return { success: ok };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Forward tunnel events to renderer
  tunnelEvents.on('progress', (progress: any) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('tunnel:progress', progress);
      }
    }
  });

  // ─── Bandwidth Tracking ──────────────────────────────────────────
  ipcMain.handle('bandwidth:getStats', () => {
    return { success: true, stats: getBandwidthStats() };
  });

  // Forward bandwidth stats to renderer every second
  bandwidthEvents.on('stats', (stats: any) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('bandwidth:stats', stats);
      }
    }
  });

  // Load existing proxy pool from DB on startup
  try {
    loadExistingPool();
  } catch {
    // first run
  }

  // Load cached tunnel servers from DB on startup
  try {
    loadCachedServers();
  } catch {
    // first run
  }

  // Start bandwidth tracking
  startTracking();
}
