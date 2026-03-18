// ─── Tunnel Engine ──────────────────────────────────────────────────
// Fetches free SS/VMess/Trojan/VLESS servers from GitHub aggregators,
// parses URIs, persists to SQLite, and manages connection through xray-core.
// ────────────────────────────────────────────────────────────────────

import { EventEmitter } from 'events';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// ─── Types ───────────────────────────────────────────────────────────
export type TunnelProtocol = 'shadowsocks' | 'vmess' | 'trojan' | 'vless' | 'ssr';

export interface TunnelServer {
  id: string;
  protocol: TunnelProtocol;
  name: string;
  host: string;
  port: number;
  country?: string;
  method?: string;
  password?: string;
  uuid?: string;
  alterId?: number;
  network?: string;
  wsPath?: string;
  wsHost?: string;
  tls?: boolean;
  sni?: string;
  flow?: string;
  rawUri: string;
}

export interface TunnelStatus {
  connected: boolean;
  server: TunnelServer | null;
  localPort: number;
  uptime: number;
  error?: string;
}

export interface TunnelProgress {
  phase: 'fetching' | 'parsing' | 'ready' | 'connecting' | 'connected' | 'error';
  serverCount: number;
  log: string;
}

// ─── Event Bus ───────────────────────────────────────────────────────
export const tunnelEvents = new EventEmitter();

function emitProgress(partial: Partial<TunnelProgress>) {
  const progress: TunnelProgress = {
    phase: 'ready',
    serverCount: cachedServers.length,
    log: '',
    ...partial,
  };
  tunnelEvents.emit('progress', progress);
}

// ─── Server Sources ──────────────────────────────────────────────────
const SERVER_SOURCES = [
  { url: 'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/Eternity.txt', format: 'mixed' as const },
  { url: 'https://raw.githubusercontent.com/Pawdroid/Free-servers/main/sub', format: 'base64' as const },
];

// ─── State ───────────────────────────────────────────────────────────
let cachedServers: TunnelServer[] = [];

// ─── Database ────────────────────────────────────────────────────────
let db: any = null;

function getDb() {
  if (db) return db;
  try {
    const Database = require('better-sqlite3');
    const docsDir = path.join(app.getPath('documents'), 'clabs', 'proxy');
    fs.mkdirSync(docsDir, { recursive: true });
    const dbPath = path.join(docsDir, 'tunnel-servers.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS tunnel_servers (
        id TEXT PRIMARY KEY,
        protocol TEXT NOT NULL,
        name TEXT,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        country TEXT,
        raw_uri TEXT NOT NULL,
        fetched_at INTEGER DEFAULT (strftime('%s','now') * 1000)
      );
      CREATE TABLE IF NOT EXISTS tunnel_state (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    console.log('[TunnelEngine] Database initialized');
    return db;
  } catch (e) {
    console.error('[TunnelEngine] DB init failed:', e);
    return null;
  }
}

function persistServers(servers: TunnelServer[]): void {
  const d = getDb();
  if (!d) return;
  const upsert = d.prepare(`
    INSERT OR REPLACE INTO tunnel_servers (id, protocol, name, host, port, country, raw_uri)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = d.transaction((items: TunnelServer[]) => {
    d.prepare('DELETE FROM tunnel_servers').run();
    for (const s of items) {
      upsert.run(s.id, s.protocol, s.name, s.host, s.port, s.country || null, s.rawUri);
    }
  });
  insertMany(servers);
  d.prepare('INSERT OR REPLACE INTO tunnel_state (key, value) VALUES (?, ?)').run(
    'last_fetch', String(Date.now())
  );
  console.log(`[TunnelEngine] Persisted ${servers.length} servers to DB`);
}

export function loadCachedServers(): TunnelServer[] {
  const d = getDb();
  if (!d) return [];
  try {
    const rows = d.prepare('SELECT * FROM tunnel_servers ORDER BY protocol, name').all();
    if (rows.length === 0) return [];
    const servers: TunnelServer[] = [];
    for (const row of rows) {
      const server = parseUri(row.raw_uri);
      if (server) servers.push(server);
    }
    cachedServers = servers;
    const lastFetch = d.prepare("SELECT value FROM tunnel_state WHERE key = 'last_fetch'").get();
    const ago = lastFetch ? Math.round((Date.now() - parseInt(lastFetch.value)) / 60000) : '?';
    console.log(`[TunnelEngine] Loaded ${servers.length} servers from cache (fetched ${ago}m ago)`);
    return servers;
  } catch (e) {
    console.error('[TunnelEngine] loadCachedServers failed:', e);
    return [];
  }
}

export function getLastConnectedServerId(): string | null {
  const d = getDb();
  if (!d) return null;
  try {
    const row = d.prepare("SELECT value FROM tunnel_state WHERE key = 'last_connected'").get();
    return row?.value || null;
  } catch { return null; }
}

export function saveLastConnectedServer(serverId: string | null): void {
  const d = getDb();
  if (!d) return;
  try {
    if (serverId) {
      d.prepare('INSERT OR REPLACE INTO tunnel_state (key, value) VALUES (?, ?)').run('last_connected', serverId);
    } else {
      d.prepare("DELETE FROM tunnel_state WHERE key = 'last_connected'").run();
    }
  } catch { /* ignore */ }
}

// ─── URI Parsers ─────────────────────────────────────────────────────
function parseShadowsocksUri(uri: string): TunnelServer | null {
  try {
    const withoutScheme = uri.replace('ss://', '');
    const [main, fragment] = withoutScheme.split('#');
    const name = fragment ? decodeURIComponent(fragment) : '';
    let method: string, password: string, host: string, port: number;
    if (main.includes('@')) {
      const [encoded, hostPort] = main.split('@');
      const decoded = Buffer.from(encoded, 'base64').toString();
      const colonIdx = decoded.indexOf(':');
      method = decoded.slice(0, colonIdx);
      password = decoded.slice(colonIdx + 1);
      const lastColon = hostPort.lastIndexOf(':');
      host = hostPort.slice(0, lastColon);
      port = parseInt(hostPort.slice(lastColon + 1), 10);
    } else {
      const decoded = Buffer.from(main, 'base64').toString();
      const atIdx = decoded.lastIndexOf('@');
      const methodPass = decoded.slice(0, atIdx);
      const hostPort = decoded.slice(atIdx + 1);
      const colonIdx = methodPass.indexOf(':');
      method = methodPass.slice(0, colonIdx);
      password = methodPass.slice(colonIdx + 1);
      const lastColon = hostPort.lastIndexOf(':');
      host = hostPort.slice(0, lastColon);
      port = parseInt(hostPort.slice(lastColon + 1), 10);
    }
    if (!host || !port || !method || !password) return null;
    // Filter unsupported ciphers — xray only supports modern AEAD ciphers
    const SUPPORTED_CIPHERS = [
      'aes-128-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305',
      'xchacha20-ietf-poly1305', '2022-blake3-aes-128-gcm',
      '2022-blake3-aes-256-gcm', '2022-blake3-chacha20-poly1305',
    ];
    if (!SUPPORTED_CIPHERS.includes(method.toLowerCase())) return null;
    return {
      id: `ss-${host}-${port}`, protocol: 'shadowsocks',
      name: name || `SS ${host}:${port}`,
      host, port, method, password, rawUri: uri,
      country: extractCountryFromName(name),
    };
  } catch { return null; }
}

function parseVmessUri(uri: string): TunnelServer | null {
  try {
    const json = Buffer.from(uri.replace('vmess://', ''), 'base64').toString();
    const cfg = JSON.parse(json);
    return {
      id: `vmess-${cfg.add}-${cfg.port}`, protocol: 'vmess',
      name: cfg.ps || `VMess ${cfg.add}:${cfg.port}`,
      host: cfg.add, port: parseInt(cfg.port, 10),
      uuid: cfg.id, alterId: parseInt(cfg.aid || '0', 10),
      network: cfg.net || 'tcp', wsPath: cfg.path || '/',
      wsHost: cfg.host || '', tls: cfg.tls === 'tls',
      sni: cfg.sni || cfg.host || '', rawUri: uri,
      country: extractCountryFromName(cfg.ps || ''),
    };
  } catch { return null; }
}

function parseTrojanUri(uri: string): TunnelServer | null {
  try {
    const withoutScheme = uri.replace('trojan://', '');
    const [main, fragment] = withoutScheme.split('#');
    const name = fragment ? decodeURIComponent(fragment) : '';
    const [passAndHost, queryStr] = main.split('?');
    const atIdx = passAndHost.indexOf('@');
    const password = passAndHost.slice(0, atIdx);
    const hostPort = passAndHost.slice(atIdx + 1);
    const lastColon = hostPort.lastIndexOf(':');
    const host = hostPort.slice(0, lastColon);
    const port = parseInt(hostPort.slice(lastColon + 1), 10);
    const params = new URLSearchParams(queryStr || '');
    return {
      id: `trojan-${host}-${port}`, protocol: 'trojan',
      name: name || `Trojan ${host}:${port}`,
      host, port, password, tls: params.get('security') !== 'none',
      sni: params.get('sni') || host, rawUri: uri,
      country: extractCountryFromName(name),
    };
  } catch { return null; }
}

function parseVlessUri(uri: string): TunnelServer | null {
  try {
    const withoutScheme = uri.replace('vless://', '');
    const [main, fragment] = withoutScheme.split('#');
    const name = fragment ? decodeURIComponent(fragment) : '';
    const [uuidAndHost, queryStr] = main.split('?');
    const atIdx = uuidAndHost.indexOf('@');
    const uuid = uuidAndHost.slice(0, atIdx);
    const hostPort = uuidAndHost.slice(atIdx + 1);
    const lastColon = hostPort.lastIndexOf(':');
    const host = hostPort.slice(0, lastColon);
    const port = parseInt(hostPort.slice(lastColon + 1), 10);
    const params = new URLSearchParams(queryStr || '');
    return {
      id: `vless-${host}-${port}`, protocol: 'vless',
      name: name || `VLESS ${host}:${port}`,
      host, port, uuid, network: params.get('type') || 'tcp',
      tls: params.get('security') === 'tls' || params.get('security') === 'reality',
      sni: params.get('sni') || host, flow: params.get('flow') || undefined,
      rawUri: uri, country: extractCountryFromName(name),
    };
  } catch { return null; }
}

function extractCountryFromName(name: string): string | undefined {
  const match = name.match(/(?:^|\s)([A-Z]{2})(?:[-\s]|$)/);
  return match ? match[1] : undefined;
}

function parseUri(uri: string): TunnelServer | null {
  const trimmed = uri.trim();
  if (trimmed.startsWith('ss://')) return parseShadowsocksUri(trimmed);
  if (trimmed.startsWith('vmess://')) return parseVmessUri(trimmed);
  if (trimmed.startsWith('trojan://')) return parseTrojanUri(trimmed);
  if (trimmed.startsWith('vless://')) return parseVlessUri(trimmed);
  return null;
}

// ─── Fetch & Parse ───────────────────────────────────────────────────
async function fetchText(url: string): Promise<string> {
  const https = require('https');
  const http = require('http');
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https') ? https.get : http.get;
    const doRequest = (requestUrl: string, redirects = 0): void => {
      if (redirects > 5) { reject(new Error('Too many redirects')); return; }
      get(requestUrl, (res: any) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doRequest(res.headers.location, redirects + 1);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${requestUrl}`));
          return;
        }
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', () => resolve(body));
        res.on('error', reject);
      }).on('error', reject);
    };
    doRequest(url);
  });
}

export async function fetchServers(): Promise<TunnelServer[]> {
  emitProgress({ phase: 'fetching', log: 'Fetching server lists...' });
  const allServers: TunnelServer[] = [];
  const seen = new Set<string>();

  for (const source of SERVER_SOURCES) {
    try {
      let text = await fetchText(source.url);
      if (source.format === 'base64') {
        try {
          text = Buffer.from(text.trim(), 'base64').toString();
        } catch { /* not base64, treat as plaintext */ }
      }
      emitProgress({ phase: 'parsing', log: `Parsing servers from ${new URL(source.url).hostname}...` });
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      for (const line of lines) {
        const server = parseUri(line);
        if (server && !seen.has(server.id)) {
          seen.add(server.id);
          allServers.push(server);
        }
      }
    } catch (e) {
      console.error(`[TunnelEngine] Failed to fetch ${source.url}:`, e);
    }
  }

  cachedServers = allServers;

  // Persist to DB
  persistServers(allServers);

  const counts: Record<string, number> = {};
  for (const s of allServers) {
    counts[s.protocol] = (counts[s.protocol] || 0) + 1;
  }
  const summary = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ');

  emitProgress({
    phase: 'ready',
    serverCount: allServers.length,
    log: `Found ${allServers.length} servers: ${summary}`,
  });
  console.log(`[TunnelEngine] Found ${allServers.length} servers: ${summary}`);

  return allServers;
}

export function getCachedServers(): TunnelServer[] {
  return [...cachedServers];
}

export function getServerById(id: string): TunnelServer | undefined {
  return cachedServers.find(s => s.id === id);
}
