import { ipcMain } from 'electron';
import https from 'https';

/**
 * Direct HTTPS request to chaturbate.com API.
 * Bypasses Electron's session proxy entirely.
 * No cookies needed — curl confirms API works without them.
 */
function chaturbateFetch(urlPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'chaturbate.com',
      path: urlPath,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }, (res) => {
      // Handle redirects
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        try {
          const loc = new URL(res.headers.location, `https://chaturbate.com`);
          chaturbateFetch(loc.pathname + loc.search).then(resolve).catch(reject);
          return;
        } catch { /* fall through */ }
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        console.log(`[Chaturbate] ${urlPath} → HTTP ${res.statusCode}, body ${body.length} bytes`);

        if (!body || body.length === 0) {
          reject(new Error(`Empty response from ${urlPath} (HTTP ${res.statusCode})`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch {
          if (body.includes('Just a moment')) {
            reject(new Error('Cloudflare challenge page'));
          } else {
            reject(new Error(`Invalid JSON: ${body.substring(0, 200)}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Chaturbate] Request error:', err.message);
      reject(new Error(`Network error: ${err.message}`));
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

export function registerChaturbateHandlers() {
  ipcMain.handle('chaturbate:fetch', async (_event, urlPath: string) => {
    try {
      const data = await chaturbateFetch(urlPath);
      return { success: true, data };
    } catch (error: any) {
      console.error('[Chaturbate] Fetch error:', error.message);
      return { success: false, error: error.message };
    }
  });

  // Get HLS m3u8 URL for a room (bypasses proxy)
  ipcMain.handle('chaturbate:getHlsUrl', async (_event, username: string) => {
    try {
      const url = await getHlsUrl(username);
      return { success: true, url };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

/** Fetch HLS m3u8 URL for a chaturbate room */
function getHlsUrl(username: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = `room_slug=${encodeURIComponent(username)}`;
    const req = https.request({
      hostname: 'chaturbate.com',
      path: '/get_edge_hls_url_ajax/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        try {
          const data = JSON.parse(body);
          if (!data.success || !data.url) {
            reject(new Error(data.room_status === 'offline' ? 'offline' : `no_stream:${data.room_status || 'unknown'}`));
          } else {
            resolve(data.url);
          }
        } catch {
          reject(new Error(`parse_error`));
        }
      });
    });
    req.on('error', (err) => reject(new Error(`network:${err.message}`)));
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(postData);
    req.end();
  });
}
