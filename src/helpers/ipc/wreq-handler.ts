import { ipcMain } from 'electron';
import { createSession } from 'wreq-js';

let session: any = null;
let homepageVisited = false;

async function getSession() {
  if (!session) {
    session = await createSession({ impersonate: 'chrome_131' } as any);
  }
  return session;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** XOR cipher — replicates giraffe.annihilate(str, key) from nsfwalbum */
function annihilate(str: string, key: number): string {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(str.charCodeAt(i) ^ key);
  }
  return out;
}

async function ensureHomepage() {
  if (homepageVisited) return;
  const s = await getSession();
  await s.fetch('https://nsfwalbum.com/', {
    headers: { 'user-agent': UA, 'accept': 'text/html' },
  });
  homepageVisited = true;
}

export function registerWreqHandlers() {
  // General-purpose TLS-fingerprinted fetch
  ipcMain.handle('system:wreqFetch', async (_, url: string, options: any = {}) => {
    try {
      const s = await getSession();
      await ensureHomepage();
      const response = await s.fetch(url, {
        headers: {
          'user-agent': UA,
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.5',
          ...(options.headers || {}),
        },
      });
      const text = await response.text();
      return { success: true, status: response.status, data: text };
    } catch (error: any) {
      console.error('[wreq] Fetch error:', error?.message || error);
      return { success: false, error: error?.message || String(error) };
    }
  });

  // NSFWAlbum: homepage/search via backend.php AJAX
  ipcMain.handle('nsfwalbum:fetchPage', async (_, page: number, query: string) => {
    try {
      const s = await getSession();
      await ensureHomepage();

      const encoded = encodeURIComponent(query || '');
      const url = `https://nsfwalbum.com/backend.php?queryString=${encoded}&prev_items=4&p=${page}`;
      const response = await s.fetch(url, {
        headers: {
          'user-agent': UA,
          'accept': '*/*',
          'x-requested-with': 'XMLHttpRequest',
          'referer': 'https://nsfwalbum.com/',
        },
      });
      const text = await response.text();
      return { success: true, data: text };
    } catch (error: any) {
      console.error('[wreq/nsfwalbum] Fetch error:', error?.message || error);
      return { success: false, error: error?.message || String(error) };
    }
  });

  // NSFWAlbum: resolve HQ URL for a single photo
  // Flow: fetch /photo/{id} → extract spirit hex + key → call backend.php?spirit=...&photo=...
  ipcMain.handle('nsfwalbum:resolveHQ', async (_, photoId: string) => {
    try {
      const s = await getSession();
      await ensureHomepage();

      // Step 1: Fetch photo page
      const r = await s.fetch(`https://nsfwalbum.com/photo/${photoId}`, {
        headers: { 'user-agent': UA, 'referer': 'https://nsfwalbum.com/' },
      });
      const html = await r.text();

      // Step 2: Extract spirit hex string and XOR key
      // Pattern: giraffe.annihilate("31|6b|2b|99|...", 6)
      const spiritMatch = html.match(/giraffe\.annihilate\("([^"]+)",\s*(\d+)\)/);
      if (!spiritMatch) {
        console.warn('[wreq/nsfwalbum] No spirit token found for photo', photoId);
        return { success: false, error: 'No spirit token found' };
      }
      const hexStr = spiritMatch[1];
      const key = parseInt(spiritMatch[2], 10);
      const spirit = encodeURIComponent(annihilate(hexStr, key));

      // Step 3: Call backend.php with spirit + photo ID → get [url, width, height]
      const r2 = await s.fetch(
        `https://nsfwalbum.com/backend.php?spirit=${spirit}&photo=${photoId}`,
        {
          headers: {
            'user-agent': UA,
            'accept': 'application/json, */*',
            'x-requested-with': 'XMLHttpRequest',
            'referer': `https://nsfwalbum.com/photo/${photoId}`,
          },
        }
      );
      const json = await r2.text();
      const data = JSON.parse(json);
      // data = ["https://...full-url.jpg", width, height]
      return {
        success: true,
        url: data[0],
        width: data[1],
        height: data[2],
      };
    } catch (error: any) {
      console.error('[wreq/nsfwalbum] HQ resolve error:', error?.message || error);
      return { success: false, error: error?.message || String(error) };
    }
  });

  // ─── Bunkr: fetch pages using a hidden BrowserWindow to solve DDoS-Guard JS challenges ───
  ipcMain.handle('bunkr:fetch', async (_, url: string) => {
    const { BrowserWindow, session: electronSession } = require('electron');

    // Use a dedicated partition without proxy so DDoS-Guard can verify directly
    const bunkrSession = electronSession.fromPartition('persist:bunkr');
    await bunkrSession.setProxy({ mode: 'direct' });

    return new Promise((resolve) => {
      const win = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          session: bunkrSession,
        },
      });

      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          console.warn('[bunkr] Timed out loading:', url);
          try { win.destroy(); } catch {}
          resolve({ success: false, error: 'Timed out waiting for page' });
        }
      }, 25000);

      const extractContent = async () => {
        if (settled) return;
        try {
          // Check page title — DDoS-Guard challenge pages have title "DDoS-Guard"
          const title = await win.webContents.executeJavaScript('document.title');
          console.log('[bunkr] Page title:', title, '| URL:', win.webContents.getURL());

          if (title === 'DDoS-Guard' || title === '') {
            // Still on challenge page, wait and retry
            console.log('[bunkr] Still on DDoS-Guard challenge, waiting...');
            setTimeout(extractContent, 2000);
            return;
          }

          // Real page loaded — extract HTML
          const html = await win.webContents.executeJavaScript('document.documentElement.outerHTML');
          console.log('[bunkr] Got HTML, length:', html?.length);
          settled = true;
          clearTimeout(timeout);
          try { win.destroy(); } catch {}
          resolve({ success: true, status: 200, data: html });
        } catch (err: any) {
          console.error('[bunkr] Extract error:', err?.message);
          if (!settled) {
            // Might be during navigation, retry
            setTimeout(extractContent, 1500);
          }
        }
      };

      win.webContents.on('did-finish-load', () => {
        // Wait a moment for any redirects/scripts to run, then try extraction
        setTimeout(extractContent, 1500);
      });

      // Only fail on MAIN FRAME errors (ignore subresource/ad tracker SSL failures)
      win.webContents.on('did-fail-load', (_e: any, code: number, desc: string, failedUrl: string, isMainFrame: boolean) => {
        if (!isMainFrame) {
          console.log('[bunkr] Ignoring subresource error:', desc, failedUrl?.slice(0, 80));
          return;
        }
        if (!settled && code !== -3) {
          console.error('[bunkr] Main frame load failed:', code, desc);
          settled = true;
          clearTimeout(timeout);
          try { win.destroy(); } catch {}
          resolve({ success: false, error: `Load failed: ${desc} (${code})` });
        }
      });

      console.log('[bunkr] Loading URL:', url);
      win.loadURL(url, { userAgent: UA });
    });
  });

  // ─── Bunkr: resolve video streaming URL from /f/ page by letting the player scripts run ───
  ipcMain.handle('bunkr:resolveVideo', async (_, filePageUrl: string) => {
    const { BrowserWindow, session: electronSession } = require('electron');

    const bunkrSession = electronSession.fromPartition('persist:bunkr');

    return new Promise((resolve) => {
      const win = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          session: bunkrSession,
        },
      });

      let settled = false;
      let capturedMediaUrl: string | null = null;

      // Block popups
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

      // Intercept media/video requests to capture the streaming URL
      win.webContents.session.webRequest.onBeforeRequest(
        { urls: ['*://*.bunkrr.su/*', '*://*.bunkr.cr/v/*', '*://*.bunkr.cr/d/*'] },
        (details: any, callback: any) => {
          const u = details.url;
          // Capture video/media streaming URLs
          if ((u.includes('bunkrr.su/file/') || u.includes('/v/') || u.includes('/d/')) && !capturedMediaUrl) {
            capturedMediaUrl = u;
            console.log('[bunkr-video] Captured media URL from request:', u.slice(0, 100));
          }
          callback({ cancel: false });
        }
      );

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          console.warn('[bunkr-video] Timed out resolving video:', filePageUrl);
          try { win.destroy(); } catch {}
          resolve({ success: false, error: 'Timeout' });
        }
      }, 20000);

      // After page loads + player scripts run, extract the video source
      const extractVideoUrl = async () => {
        if (settled) return;
        try {
          const title = await win.webContents.executeJavaScript('document.title');
          if (title === 'DDoS-Guard' || title === '') {
            setTimeout(extractVideoUrl, 2000);
            return;
          }

          // Inject script to block ads/popups and extract video source
          const videoUrl = await win.webContents.executeJavaScript(`
            (function() {
              // Block window.open
              window.open = () => null;
              // Find the video element (Plyr creates one)
              const video = document.querySelector('video');
              if (video) {
                // Check src, currentSrc, source elements
                return video.src || video.currentSrc || 
                  (video.querySelector('source') ? video.querySelector('source').src : null);
              }
              return null;
            })()
          `);

          if (videoUrl && videoUrl.startsWith('http')) {
            console.log('[bunkr-video] Extracted video URL:', videoUrl.slice(0, 120));
            settled = true;
            clearTimeout(timeout);
            try { win.destroy(); } catch {}
            resolve({ success: true, url: videoUrl });
            return;
          }

          // If no video element yet, check the captured media URL
          if (capturedMediaUrl) {
            console.log('[bunkr-video] Using captured media URL:', capturedMediaUrl.slice(0, 120));
            settled = true;
            clearTimeout(timeout);
            try { win.destroy(); } catch {}
            resolve({ success: true, url: capturedMediaUrl });
            return;
          }

          // Retry — player might still be initializing
          setTimeout(extractVideoUrl, 1500);
        } catch (err: any) {
          if (!settled) setTimeout(extractVideoUrl, 1500);
        }
      };

      win.webContents.on('did-finish-load', () => {
        // Wait for player.js + player.enc.js to init the video element
        setTimeout(extractVideoUrl, 3000);
      });

      win.webContents.on('did-fail-load', (_e: any, code: number, desc: string, failedUrl: string, isMainFrame: boolean) => {
        if (!isMainFrame) return;
        if (!settled && code !== -3) {
          settled = true;
          clearTimeout(timeout);
          try { win.destroy(); } catch {}
          resolve({ success: false, error: `Load failed: ${desc} (${code})` });
        }
      });

      console.log('[bunkr-video] Loading /f/ page:', filePageUrl);
      win.loadURL(filePageUrl, { userAgent: UA });
    });
  });
}
