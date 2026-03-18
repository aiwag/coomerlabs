// main.ts
import { app, BrowserWindow, session, ipcMain } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { dbService } from "./services/sqliteService";
import { stopAllRecordings } from "./services/recordingService";

import { initAdBlocker, toggleAdBlocker, getAdBlockerStatus, updateFilterLists } from './services/adBlockerService';

const inDevelopment = process.env.NODE_ENV === "development";

// 🔒 Encrypted DNS (DNS-over-HTTPS) — ISP cannot see domain queries
// Must be called after app is ready
app.whenReady().then(() => {
  app.configureHostResolver({
    secureDnsMode: 'automatic',
    secureDnsServers: ['https://dns.adguard-dns.com/dns-query'],
  });
});

// ⚡ GPU & Performance Flags — run on compositor thread, not main thread
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder,CanvasOopRasterization');
app.commandLine.appendSwitch('renderer-process-limit', '8');
app.commandLine.appendSwitch('process-per-site');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// 🪟 Create main window with optimized settings
async function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready - eliminates white flash
    backgroundColor: '#000000', // Instant black background
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      webviewTag: true,
      preload: preload,
      webSecurity: false,
      backgroundThrottling: false, // Keep renderer perf when backgrounded
      spellcheck: false, // Disable spellcheck for speed
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
  });

  // Show window immediately when DOM is painted
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  registerListeners(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Defer DevTools installation - not critical for startup
  if (inDevelopment) {
    setImmediate(async () => {
      try {
        const result = await installExtension(REACT_DEVELOPER_TOOLS);
        console.log(`Extensions installed: ${result.name}`);
      } catch {
        console.error("Failed to install extensions");
      }
    });
  }

  return mainWindow;
}

// 🗄️ Initialize database
function initializeDatabase() {
  try {
    dbService.init();
    if (inDevelopment) {
      const stats = dbService.getStats();
      console.log("📊 Database initialized:", stats);
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

// 🌐 Setup session headers for video stream spoofing
function setupSessionHeaders() {
  session.defaultSession.setUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0');

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ["*://*.mxcontent.net/*", "*://*.mixdrop.ag/*", "*://m1xdrop.bz/*", "*://*.mixdrop.co/*"] },
    (details, callback) => {
      const url = new URL(details.url);
      const referer = url.host.includes('mxcontent.net') ? 'https://m1xdrop.bz/' : `${url.protocol}//${url.host}/`;

      details.requestHeaders['Referer'] = referer;
      details.requestHeaders['Origin'] = referer.replace(/\/$/, '');
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0';
      details.requestHeaders['Sec-Fetch-Dest'] = 'video';
      details.requestHeaders['Sec-Fetch-Mode'] = 'cors';
      details.requestHeaders['Sec-Fetch-Site'] = 'cross-site';

      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );
}

// 👇 Optimized app ready sequence - parallel initialization
app.whenReady().then(async () => {
  // Run DB init and session setup in parallel - neither depends on the other
  initializeDatabase();
  setupSessionHeaders();

  // Initialize ad blocker (async, non-blocking)
  initAdBlocker().catch(err => console.error('[AdBlocker] Init error:', err));

  // Register ad blocker IPC handlers
  ipcMain.handle('adblock:toggle', () => toggleAdBlocker());
  ipcMain.handle('adblock:status', () => getAdBlockerStatus());
  ipcMain.handle('adblock:updateLists', () => updateFilterLists());

  // Create window immediately after sync setup
  await createWindow();
});

// macOS: quit app when all windows closed
app.on("window-all-closed", () => {
  // Clean up database connection
  dbService.close();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up on quit
app.on("before-quit", () => {
  stopAllRecordings();
  dbService.close();
});
