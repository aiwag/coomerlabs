// main.ts
import { app, BrowserWindow, session } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { dbService } from "./services/sqliteService";

// import { ElectronBlocker } from "@ghostery/adblocker-electron";
// import "@ghostery/adblocker-electron-preload";
// import fetch from "cross-fetch";
// import { promises as fs } from "fs";

const inDevelopment = process.env.NODE_ENV === "development";

// 👇 Wrap window creation in an async function to await blocker
async function createWindow() {
  // 🛡️ Initialize ad blocker
  // const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
  //   path: "engine.bin",
  //   read: fs.readFile,
  //   write: fs.writeFile,
  // });
  // blocker.enableBlockingInSession(session.defaultSession);
  // blocker.on("request-blocked", (request) => {
  //   console.log("🚫 Blocked request to:", request.url);
  // });
  // console.log("✅ Ad blocker enabled.");

  // 🪟 Create main window
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      webviewTag: true,
      preload: preload,
      webSecurity: false,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 5, y: 5 } : undefined,
  });


  registerListeners(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}


// 🧩 DevTools install remains the same
async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

// 🗄️ Initialize database
async function initializeDatabase() {
  try {
    dbService.init();
    console.log("📊 Database initialized successfully");

    // Log stats in development
    if (inDevelopment) {
      const stats = dbService.getStats();
      console.log("Database stats:", stats);
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}

// 🌐 Initialize server (disabled for now due to build issues)
async function initializeServer() {
  console.log("⚠️ Server integration temporarily disabled due to build issues");
  return null;
}

// 👇 Modified app ready sequence
app
  .whenReady()
  .then(initializeDatabase)
  .then(initializeServer)
  .then(() => {
    // Force global session user agent to match our spoofing
    session.defaultSession.setUserAgent('Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0');

    // Inject required headers for video streams globally
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ["*://*.mxcontent.net/*", "*://*.mixdrop.ag/*", "*://m1xdrop.bz/*", "*://*.mixdrop.co/*"] },
      (details, callback) => {
        const url = new URL(details.url);
        // Map common mixdrop domains to the referral domain used in the working curl
        const referer = url.host.includes('mxcontent.net') ? 'https://m1xdrop.bz/' : `${url.protocol}//${url.host}/`;

        details.requestHeaders['Referer'] = referer;
        details.requestHeaders['Origin'] = referer.replace(/\/$/, '');
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0';
        details.requestHeaders['Sec-Fetch-Dest'] = 'video';
        details.requestHeaders['Sec-Fetch-Mode'] = 'cors';
        details.requestHeaders['Sec-Fetch-Site'] = 'cross-site';

        if (inDevelopment) {
          console.log(`[Stream Interceptor] Spoofed headers for: ${url.host}`);
        }

        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );
  })
  .then(createWindow)
  .then(installExtensions);

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
  dbService.close();
});
