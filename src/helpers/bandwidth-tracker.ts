// ─── Bandwidth Tracker ──────────────────────────────────────────────
// Accurate bandwidth monitoring using Chrome DevTools Protocol (CDP).
// Captures exact bytes for ALL traffic: streaming, WebSockets, XHR, etc.
// Works with both SOCKS5 pool proxies and tunnel (shadowsocks/xray).
// ────────────────────────────────────────────────────────────────────

import { app, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';

// ─── Types ───────────────────────────────────────────────────────────
export interface BandwidthStats {
  downloadSpeed: number;
  uploadSpeed: number;
  sessionDown: number;
  sessionUp: number;
  sessionStart: number;
  todayDown: number;
  todayUp: number;
  totalDown: number;
  totalUp: number;
}

// ─── Event Bus ───────────────────────────────────────────────────────
export const bandwidthEvents = new EventEmitter();

// ─── State ───────────────────────────────────────────────────────────
let sessionDown = 0;
let sessionUp = 0;
const sessionStart = Date.now();
let lastPersistedDown = 0;
let lastPersistedUp = 0;

// Per-second accumulators for speed
let secDown = 0;
let secUp = 0;
let downloadSpeed = 0;
let uploadSpeed = 0;

// Track which webContents we've attached to
const attachedContents = new Set<number>();

// ─── Database ────────────────────────────────────────────────────────
let db: any = null;

function getDb() {
  if (db) return db;
  try {
    const Database = require('better-sqlite3');
    const docsDir = path.join(app.getPath('documents'), 'clabs', 'proxy');
    fs.mkdirSync(docsDir, { recursive: true });
    const dbPath = path.join(docsDir, 'bandwidth.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS bandwidth_daily (
        date TEXT PRIMARY KEY,
        download INTEGER DEFAULT 0,
        upload INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS bandwidth_total (
        key TEXT PRIMARY KEY,
        value INTEGER DEFAULT 0
      );
    `);
    db.prepare('INSERT OR IGNORE INTO bandwidth_total (key, value) VALUES (?, ?)').run('download', 0);
    db.prepare('INSERT OR IGNORE INTO bandwidth_total (key, value) VALUES (?, ?)').run('upload', 0);
    return db;
  } catch (e) {
    console.error('[Bandwidth] DB init failed:', e);
    return null;
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function persistDelta(): void {
  const d = getDb();
  if (!d) return;
  const deltaDown = sessionDown - lastPersistedDown;
  const deltaUp = sessionUp - lastPersistedUp;
  if (deltaDown === 0 && deltaUp === 0) return;
  const today = todayKey();
  try {
    d.prepare(`
      INSERT INTO bandwidth_daily (date, download, upload) VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET download = download + ?, upload = upload + ?
    `).run(today, deltaDown, deltaUp, deltaDown, deltaUp);
    d.prepare('UPDATE bandwidth_total SET value = value + ? WHERE key = ?').run(deltaDown, 'download');
    d.prepare('UPDATE bandwidth_total SET value = value + ? WHERE key = ?').run(deltaUp, 'upload');
    lastPersistedDown = sessionDown;
    lastPersistedUp = sessionUp;
  } catch { /* ignore */ }
}

function loadStored(): { totalDown: number; totalUp: number; todayDown: number; todayUp: number } {
  const d = getDb();
  if (!d) return { totalDown: 0, totalUp: 0, todayDown: 0, todayUp: 0 };
  try {
    const totalDownRow = d.prepare("SELECT value FROM bandwidth_total WHERE key = 'download'").get();
    const totalUpRow = d.prepare("SELECT value FROM bandwidth_total WHERE key = 'upload'").get();
    const todayRow = d.prepare('SELECT download, upload FROM bandwidth_daily WHERE date = ?').get(todayKey());
    return {
      totalDown: totalDownRow?.value || 0,
      totalUp: totalUpRow?.value || 0,
      todayDown: todayRow?.download || 0,
      todayUp: todayRow?.upload || 0,
    };
  } catch {
    return { totalDown: 0, totalUp: 0, todayDown: 0, todayUp: 0 };
  }
}

// ─── CDP Attachment ─────────────────────────────────────────────────
function attachToWebContents(wc: Electron.WebContents): void {
  const id = wc.id;
  if (attachedContents.has(id)) return;
  attachedContents.add(id);

  try {
    wc.debugger.attach('1.3');
  } catch (e) {
    // Already attached or can't attach
    attachedContents.delete(id);
    return;
  }

  // Enable network monitoring
  try {
    wc.debugger.sendCommand('Network.enable', { maxTotalBufferSize: 0, maxResourceBufferSize: 0 });
  } catch {
    attachedContents.delete(id);
    return;
  }

  wc.debugger.on('message', (_event: any, method: string, params: any) => {
    switch (method) {
      case 'Network.dataReceived':
        // encodedDataLength = actual bytes on the wire (compressed)
        // dataLength = decompressed size
        // Use encodedDataLength for accurate bandwidth (what actually went through the network)
        const rxBytes = params.encodedDataLength || params.dataLength || 0;
        sessionDown += rxBytes;
        secDown += rxBytes;
        break;

      case 'Network.requestWillBeSent':
        // Track upload: headers + body
        const req = params.request;
        // URL + headers estimate
        let txBytes = (req?.url?.length || 0) + 200;
        // If there's a POST body, add its size
        if (req?.postData) {
          txBytes += req.postData.length;
        }
        if (req?.headers) {
          // Sum header sizes
          for (const [k, v] of Object.entries(req.headers)) {
            txBytes += (k as string).length + (v as string).length + 4;
          }
        }
        sessionUp += txBytes;
        secUp += txBytes;
        break;

      case 'Network.webSocketFrameReceived':
        const wsRxLen = params.response?.payloadData?.length || 0;
        sessionDown += wsRxLen;
        secDown += wsRxLen;
        break;

      case 'Network.webSocketFrameSent':
        const wsTxLen = params.response?.payloadData?.length || 0;
        sessionUp += wsTxLen;
        secUp += wsTxLen;
        break;
    }
  });

  wc.debugger.on('detach', () => {
    attachedContents.delete(id);
  });

  wc.on('destroyed', () => {
    attachedContents.delete(id);
  });
}

// ─── Main ────────────────────────────────────────────────────────────
let speedTimer: ReturnType<typeof setInterval> | null = null;
let persistTimer: ReturnType<typeof setInterval> | null = null;
let scanTimer: ReturnType<typeof setInterval> | null = null;

export function startTracking(): void {
  // Attach to all existing windows
  for (const win of BrowserWindow.getAllWindows()) {
    attachToWebContents(win.webContents);
  }

  // Auto-attach to new windows
  app.on('browser-window-created', (_event, win) => {
    attachToWebContents(win.webContents);
  });

  // Periodically scan for webview webContents that might have been created
  scanTimer = setInterval(() => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        // Attach to main webContents
        attachToWebContents(win.webContents);
      }
    }
  }, 5000);

  // Emit speed every second
  speedTimer = setInterval(() => {
    downloadSpeed = secDown;
    uploadSpeed = secUp;
    secDown = 0;
    secUp = 0;

    const stored = loadStored();
    const unpersistedDown = sessionDown - lastPersistedDown;
    const unpersistedUp = sessionUp - lastPersistedUp;

    bandwidthEvents.emit('stats', {
      downloadSpeed,
      uploadSpeed,
      sessionDown,
      sessionUp,
      sessionStart,
      todayDown: stored.todayDown + unpersistedDown,
      todayUp: stored.todayUp + unpersistedUp,
      totalDown: stored.totalDown + unpersistedDown,
      totalUp: stored.totalUp + unpersistedUp,
    } as BandwidthStats);
  }, 1000);

  // Persist every 30s
  persistTimer = setInterval(() => persistDelta(), 30000);

  console.log('[Bandwidth] CDP tracking started');
}

export function stopTracking(): void {
  if (speedTimer) { clearInterval(speedTimer); speedTimer = null; }
  if (persistTimer) { clearInterval(persistTimer); persistTimer = null; }
  if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
  persistDelta();
}

export function getStats(): BandwidthStats {
  const stored = loadStored();
  const unpersistedDown = sessionDown - lastPersistedDown;
  const unpersistedUp = sessionUp - lastPersistedUp;
  return {
    downloadSpeed,
    uploadSpeed,
    sessionDown,
    sessionUp,
    sessionStart,
    todayDown: stored.todayDown + unpersistedDown,
    todayUp: stored.todayUp + unpersistedUp,
    totalDown: stored.totalDown + unpersistedDown,
    totalUp: stored.totalUp + unpersistedUp,
  };
}
