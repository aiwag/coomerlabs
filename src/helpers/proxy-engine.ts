/**
 * CoomerLabs Proxy Engine
 * -----------------------
 * Fetches free proxies from multiple GitHub sources, validates them,
 * scores them by latency, and provides an intelligent rotation pool.
 *
 * Runs entirely in the Electron MAIN process.
 */

import { session, net } from 'electron';
import { app } from 'electron';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import netModule from 'node:net';

// ─── Types ───────────────────────────────────────────────────────────
export interface RawProxy {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
}

export interface ValidatedProxy extends RawProxy {
  latencyMs: number;
  exitIp?: string;
  country?: string;
  lastChecked: number;
  failCount: number;
  successCount: number;
  score: number;
}

export interface ProxyPoolStats {
  totalFetched: number;
  totalValid: number;
  poolSize: number;
  avgLatency: number;
  lastRefresh: number;
  sources: number;
}

export interface ProxyProgress {
  phase: 'fetching' | 'validating' | 'building' | 'done' | 'idle';
  fetched: number;
  tested: number;
  total: number;
  alive: number;
  log: string;
  stats?: ProxyPoolStats;
  activeProxy?: ValidatedProxy | null;
}

/** Smart suggestion for the UI — shows as action toast */
export interface ProxySuggestion {
  type: 'rate_limited' | 'slow' | 'region_blocked' | 'proxy_dead' | 'pool_low';
  message: string;
  action: string;           // label for the action button
  actionId: string;         // IPC action to trigger
}

// ─── Event Bus (for IPC progress reports) ────────────────────────────
export const proxyEvents = new EventEmitter();

// ─── Source URLs ─────────────────────────────────────────────────────
const PROXY_SOURCES: { url: string; parser: 'plain' | 'protocol_prefix' }[] = [
  { url: 'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/http/data.txt', parser: 'protocol_prefix' },
  { url: 'https://raw.githubusercontent.com/proxifly/free-proxy-list/main/proxies/protocols/socks5/data.txt', parser: 'protocol_prefix' },
  { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt', parser: 'plain' },
  { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks4.txt', parser: 'plain' },
  { url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt', parser: 'plain' },
  { url: 'https://raw.githubusercontent.com/Anonym0usWork1221/Free-Proxies/main/proxy_files/http_proxies.txt', parser: 'plain' },
  { url: 'https://raw.githubusercontent.com/Anonym0usWork1221/Free-Proxies/main/proxy_files/socks5_proxies.txt', parser: 'plain' },
  { url: 'https://raw.githubusercontent.com/zloi-user/hideip.me/main/http.txt', parser: 'plain' },
  { url: 'https://raw.githubusercontent.com/zloi-user/hideip.me/main/socks5.txt', parser: 'plain' },
  { url: 'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/http.txt', parser: 'plain' },
  { url: 'https://raw.githubusercontent.com/Zaeem20/FREE_PROXIES_LIST/master/socks5.txt', parser: 'plain' },
];

// ─── Configuration ──────────────────────────────────────────────────
const CONFIG = {
  CONCURRENCY: 200,
  TEST_TIMEOUT: 6000,
  MAX_LATENCY: 5000,
  POOL_SIZE: 80,
  REFRESH_INTERVAL: 30 * 60 * 1000,
  MAX_FAIL_COUNT: 2,              // aggressive: 2 fails = remove from pool (already validated)
  MIN_SCORE: 15,
  HEALTH_CHECK_INTERVAL: 60_000,  // check active proxy every 60s
  HEALTH_MAX_FAILS: 2,            // rotate after 2 consecutive health fails
  POOL_LOW_THRESHOLD: 5,          // auto-refresh when pool drops below this
};

// ─── Multi-target round-robin for validation ─────────────────────────
interface TestTarget {
  host: string;
  ip: string; // resolved IP for SOCKS4 (can't do DNS)
  path: string;
  ipRegex: RegExp;
}
const TEST_TARGETS: TestTarget[] = [
  { host: 'ip-api.com', ip: '208.95.112.1', path: '/json/?fields=query', ipRegex: /"query"\s*:\s*"(\d+\.\d+\.\d+\.\d+)"/ },
  { host: 'api.ipify.org', ip: '64.185.227.155', path: '/?format=json', ipRegex: /"ip"\s*:\s*"(\d+\.\d+\.\d+\.\d+)"/ },
];
let targetIndex = 0;
function nextTarget(): TestTarget {
  const t = TEST_TARGETS[targetIndex % TEST_TARGETS.length];
  targetIndex++;
  return t;
}

// ─── Database ────────────────────────────────────────────────────────
let db: any;

function getDb() {
  if (db) return db;
  try {
    const Database = require('better-sqlite3');
    const fs = require('node:fs');
    const docsDir = path.join(app.getPath('documents'), 'clabs', 'proxy');
    fs.mkdirSync(docsDir, { recursive: true });
    const dbPath = path.join(docsDir, 'proxy-pool.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS proxies (
        id TEXT PRIMARY KEY,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        protocol TEXT NOT NULL,
        latency_ms INTEGER DEFAULT 9999,
        exit_ip TEXT,
        country TEXT,
        last_checked INTEGER DEFAULT 0,
        fail_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        in_pool INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
      );
      CREATE INDEX IF NOT EXISTS idx_proxy_score ON proxies(score DESC);
      CREATE INDEX IF NOT EXISTS idx_proxy_pool ON proxies(in_pool);
    `);
    console.log('[ProxyEngine] Database initialized');
    return db;
  } catch (e) {
    console.error('[ProxyEngine] Database init failed:', e);
    return null;
  }
}

function proxyId(p: RawProxy): string {
  return `${p.protocol}://${p.host}:${p.port}`;
}

// ─── Progress state ──────────────────────────────────────────────────
let progressState: ProxyProgress = {
  phase: 'idle', fetched: 0, tested: 0, total: 0, alive: 0, log: 'Ready',
};

function emitProgress(updates: Partial<ProxyProgress>) {
  progressState = { ...progressState, ...updates };
  proxyEvents.emit('progress', progressState);
}

export function getProgress(): ProxyProgress {
  return { ...progressState };
}

// ─── Fetching ────────────────────────────────────────────────────────
async function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const request = net.request(url);
      let body = '';
      request.on('response', (response) => {
        response.on('data', (chunk) => { body += chunk.toString(); });
        response.on('end', () => resolve(body));
        response.on('error', () => resolve(''));
      });
      request.on('error', () => resolve(''));
      request.end();
    } catch {
      resolve('');
    }
  });
}

function inferProtocolFromUrl(url: string): RawProxy['protocol'] {
  if (url.includes('socks5')) return 'socks5';
  if (url.includes('socks4')) return 'socks4';
  if (url.includes('https_proxies') || url.includes('protocols/https')) return 'https';
  return 'http';
}

function parsePlain(text: string, url: string): RawProxy[] {
  const protocol = inferProtocolFromUrl(url);
  const proxies: RawProxy[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
    if (match) {
      proxies.push({ host: match[1], port: parseInt(match[2], 10), protocol });
    }
  }
  return proxies;
}

function parseProtocolPrefix(text: string): RawProxy[] {
  const proxies: RawProxy[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(https?|socks[45]):\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
    if (match) {
      proxies.push({
        protocol: match[1] as RawProxy['protocol'],
        host: match[2],
        port: parseInt(match[3], 10),
      });
    }
  }
  return proxies;
}

export async function fetchAllProxies(): Promise<RawProxy[]> {
  const allProxies: RawProxy[] = [];
  const seen = new Set<string>();

  emitProgress({ phase: 'fetching', fetched: 0, log: `Fetching from ${PROXY_SOURCES.length} sources...` });

  const results = await Promise.allSettled(
    PROXY_SOURCES.map(async (source, i) => {
      try {
        const text = await fetchText(source.url);
        const parsed = source.parser === 'protocol_prefix'
          ? parseProtocolPrefix(text)
          : parsePlain(text, source.url);
        emitProgress({ fetched: i + 1, log: `Source ${i + 1}/${PROXY_SOURCES.length}: +${parsed.length} proxies` });
        return parsed;
      } catch {
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const proxy of result.value) {
        const id = proxyId(proxy);
        if (!seen.has(id)) {
          seen.add(id);
          allProxies.push(proxy);
        }
      }
    }
  }

  const s5 = allProxies.filter(p => p.protocol === 'socks5').length;
  const s4 = allProxies.filter(p => p.protocol === 'socks4').length;
  const http = allProxies.filter(p => p.protocol === 'http' || p.protocol === 'https').length;
  emitProgress({ fetched: PROXY_SOURCES.length, total: allProxies.length, log: `${allProxies.length} proxies (${s5} socks5, ${s4} socks4, ${http} http)` });
  console.log(`[ProxyEngine] Fetched ${allProxies.length} unique proxies (${s5} socks5, ${s4} socks4, ${http} http)`);
  return allProxies;
}

// ─── Validation (full round-trip: handshake + CONNECT + HTTP GET) ────
function testProxy(proxy: RawProxy): Promise<{ latency: number; exitIp: string } | null> {
  const target = nextTarget();
  return new Promise((resolve) => {
    const start = Date.now();
    let resolved = false;
    const done = (result: { latency: number; exitIp: string } | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try { socket.destroy(); } catch {}
      resolve(result);
    };
    const timer = setTimeout(() => done(null), CONFIG.TEST_TIMEOUT);

    let socket: ReturnType<typeof netModule.createConnection>;
    try {
      socket = netModule.createConnection({
        host: proxy.host,
        port: proxy.port,
        timeout: CONFIG.TEST_TIMEOUT,
      });
    } catch {
      done(null);
      return;
    }

    socket.on('error', () => done(null));
    socket.on('timeout', () => done(null));

    let phase = 0;
    let httpData = '';

    const extractIp = (data: string): { latency: number; exitIp: string } | null => {
      const m = data.match(target.ipRegex) || data.match(/(\d+\.\d+\.\d+\.\d+)/);
      return m ? { latency: Date.now() - start, exitIp: m[1] } : null;
    };

    socket.on('connect', () => {
      if (proxy.protocol === 'socks5') {
        socket.write(Buffer.from([0x05, 0x01, 0x00]));
      } else if (proxy.protocol === 'socks4') {
        const parts = target.ip.split('.').map(Number);
        socket.write(Buffer.from([0x04, 0x01, 0x00, 0x50, parts[0], parts[1], parts[2], parts[3], 0x00]));
        phase = 1;
      } else {
        socket.write(`GET http://${target.host}${target.path} HTTP/1.1\r\nHost: ${target.host}\r\nConnection: close\r\n\r\n`);
        phase = 2;
      }
    });

    socket.on('data', (data) => {
      if (proxy.protocol === 'socks5') {
        if (phase === 0) {
          if (data.length < 2 || data[0] !== 0x05 || data[1] !== 0x00) { done(null); return; }
          phase = 1;
          const hostBuf = Buffer.from(target.host);
          const req = Buffer.alloc(7 + hostBuf.length);
          req[0] = 0x05; req[1] = 0x01; req[2] = 0x00; req[3] = 0x03;
          req[4] = hostBuf.length;
          hostBuf.copy(req, 5);
          req.writeUInt16BE(80, 5 + hostBuf.length);
          socket.write(req);
        } else if (phase === 1) {
          if (data.length < 2 || data[1] !== 0x00) { done(null); return; }
          phase = 2;
          socket.write(`GET ${target.path} HTTP/1.1\r\nHost: ${target.host}\r\nConnection: close\r\n\r\n`);
        } else {
          httpData += data.toString();
          if (httpData.includes('}') || httpData.match(/\d+\.\d+\.\d+\.\d+/)) done(extractIp(httpData));
        }
      } else if (proxy.protocol === 'socks4') {
        if (phase === 1) {
          if (data.length < 2 || data[1] !== 0x5a) { done(null); return; }
          phase = 2;
          socket.write(`GET ${target.path} HTTP/1.1\r\nHost: ${target.host}\r\nConnection: close\r\n\r\n`);
        } else {
          httpData += data.toString();
          if (httpData.includes('}') || httpData.match(/\d+\.\d+\.\d+\.\d+/)) done(extractIp(httpData));
        }
      } else {
        httpData += data.toString();
        if (httpData.includes('}') || httpData.match(/\d+\.\d+\.\d+\.\d+/)) done(extractIp(httpData));
      }
    });
  });
}

async function validateBatch(proxies: RawProxy[], concurrency: number): Promise<ValidatedProxy[]> {
  const validated: ValidatedProxy[] = [];
  let index = 0;
  let lastPersistCount = 0;
  const scanStart = Date.now();

  emitProgress({ phase: 'validating', tested: 0, alive: 0, total: proxies.length, log: `Testing ${proxies.length} proxies (${concurrency}x parallel)...` });

  async function worker() {
    while (index < proxies.length) {
      const i = index++;
      const proxy = proxies[i];
      const result = await testProxy(proxy);

      if (result !== null && result.latency <= CONFIG.MAX_LATENCY) {
        validated.push({
          ...proxy,
          latencyMs: result.latency,
          exitIp: result.exitIp,
          lastChecked: Date.now(),
          failCount: 0,
          successCount: 1,
          score: calculateScore(result.latency, 0, 1),
        });
      }

      // Emit progress every 30 tests for smooth UI
      if (i % 30 === 0) {
        const elapsed = (Date.now() - scanStart) / 1000;
        const speed = elapsed > 0 ? Math.round(i / elapsed) : 0;
        emitProgress({ tested: i, alive: validated.length, log: `${i}/${proxies.length} tested • ${validated.length} alive • ${speed}/s` });
      }

      // Incremental persist + pool build every 100 new valid proxies
      if (validated.length - lastPersistCount >= 100) {
        const batch = validated.slice(lastPersistCount);
        lastPersistCount = validated.length;
        try {
          persistProxies(batch);
          currentPool = buildPool();
          currentIndex = 0;
          const best = getCurrentProxy();
          if (best) {
            await applyProxyToSession(best);
          }
          const liveStats = getPoolStats();
          emitProgress({
            tested: i, alive: validated.length,
            log: best ? `✓ Active: ${best.host}:${best.port} (${best.latencyMs}ms) — scanning...` : `Pool: ${currentPool.length} — scanning...`,
            stats: liveStats,
            activeProxy: best,
          });
        } catch { /* continue scanning */ }
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  // Persist any remaining
  if (validated.length > lastPersistCount) {
    persistProxies(validated.slice(lastPersistCount));
  }

  emitProgress({ tested: proxies.length, alive: validated.length, log: `Done: ${validated.length}/${proxies.length} alive` });
  return validated;
}

function calculateScore(latencyMs: number, failCount: number, successCount: number): number {
  const latencyScore = Math.max(0, 50 - (latencyMs / CONFIG.MAX_LATENCY) * 50);
  const total = failCount + successCount;
  const reliabilityScore = total > 0 ? (successCount / total) * 50 : 25;
  const failPenalty = Math.min(failCount * 10, 30);
  return Math.max(0, Math.round(latencyScore + reliabilityScore - failPenalty));
}

// ─── Pool Management ─────────────────────────────────────────────────
function persistProxies(proxies: ValidatedProxy[]): void {
  const d = getDb();
  if (!d) return;
  const upsert = d.prepare(`
    INSERT INTO proxies (id, host, port, protocol, latency_ms, exit_ip, country, last_checked, fail_count, success_count, score, in_pool)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      latency_ms = excluded.latency_ms,
      exit_ip = COALESCE(excluded.exit_ip, proxies.exit_ip),
      last_checked = excluded.last_checked,
      fail_count = CASE WHEN excluded.fail_count = 0 THEN 0 ELSE proxies.fail_count + 1 END,
      success_count = CASE WHEN excluded.success_count > 0 THEN proxies.success_count + 1 ELSE proxies.success_count END,
      score = excluded.score
  `);

  const insertMany = d.transaction((items: ValidatedProxy[]) => {
    for (const p of items) {
      upsert.run(proxyId(p), p.host, p.port, p.protocol, p.latencyMs, p.exitIp || null, p.country || null, p.lastChecked, p.failCount, p.successCount, p.score);
    }
  });

  insertMany(proxies);
}

function buildPool(): ValidatedProxy[] {
  const d = getDb();
  if (!d) return [];
  d.prepare('UPDATE proxies SET in_pool = 0').run();

  // SOCKS5/SOCKS4 support HTTPS natively — HTTP proxies cause ERR_TUNNEL_CONNECTION_FAILED
  // Priority: socks5 > socks4 > http (only as last resort)
  let rows = d.prepare(`
    SELECT * FROM proxies
    WHERE fail_count < ? AND score >= ? AND latency_ms <= ?
      AND protocol IN ('socks5', 'socks4')
    ORDER BY
      CASE protocol WHEN 'socks5' THEN 0 WHEN 'socks4' THEN 1 ELSE 2 END,
      latency_ms ASC, score DESC
    LIMIT ?
  `).all(CONFIG.MAX_FAIL_COUNT, CONFIG.MIN_SCORE, CONFIG.MAX_LATENCY, CONFIG.POOL_SIZE) as any[];

  // Fallback: include HTTP proxies only if zero SOCKS proxies available
  if (rows.length === 0) {
    console.log('[ProxyEngine] No SOCKS proxies — falling back to HTTP (HTTPS sites will fail)');
    rows = d.prepare(`
      SELECT * FROM proxies
      WHERE fail_count < ? AND score >= ? AND latency_ms <= ?
      ORDER BY score DESC, latency_ms ASC
      LIMIT ?
    `).all(CONFIG.MAX_FAIL_COUNT, CONFIG.MIN_SCORE, CONFIG.MAX_LATENCY, CONFIG.POOL_SIZE) as any[];
  }

  const markPool = d.prepare('UPDATE proxies SET in_pool = 1 WHERE id = ?');
  const markMany = d.transaction((ids: string[]) => {
    for (const id of ids) markPool.run(id);
  });

  const pool: ValidatedProxy[] = rows.map((r: any) => ({
    host: r.host,
    port: r.port,
    protocol: r.protocol,
    latencyMs: r.latency_ms,
    exitIp: r.exit_ip || undefined,
    country: r.country,
    lastChecked: r.last_checked,
    failCount: r.fail_count,
    successCount: r.success_count,
    score: r.score,
  }));

  markMany(rows.map((r: any) => r.id));
  console.log(`[ProxyEngine] Pool built: ${pool.length} proxies (${pool.filter(p => p.protocol === 'socks5').length} socks5, ${pool.filter(p => p.protocol === 'socks4').length} socks4, ${pool.filter(p => p.protocol === 'http').length} http)`);
  return pool;
}

// ─── Geo Lookup (ip-api.com, free, no key) ───────────────────────────
async function lookupGeoForPool(pool: ValidatedProxy[]): Promise<void> {
  const needsGeo = pool.filter(p => !p.country);
  if (needsGeo.length === 0) return;

  const d = getDb();
  const updateCountry = d?.prepare('UPDATE proxies SET country = ? WHERE host = ?');

  // Process 15 at a time to stay under ip-api rate limit (45/min)
  const concurrency = 15;
  let index = 0;

  async function worker() {
    while (index < needsGeo.length) {
      const p = needsGeo[index++];
      try {
        const resp = await fetchText(`http://ip-api.com/json/${p.host}?fields=countryCode`);
        const data = JSON.parse(resp);
        if (data.countryCode) {
          p.country = data.countryCode;
          if (updateCountry) updateCountry.run(data.countryCode, p.host);
        }
      } catch { /* skip */ }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, needsGeo.length) }, () => worker()));
  console.log(`[ProxyEngine] Geo resolved ${needsGeo.filter(p => p.country).length}/${needsGeo.length} proxies`);
}

// ─── Rotation Engine ─────────────────────────────────────────────────
let currentPool: ValidatedProxy[] = [];
let currentIndex = 0;
let refreshTimer: NodeJS.Timeout | null = null;
let healthTimer: NodeJS.Timeout | null = null;
let healthFailCount = 0;
let isRefreshing = false;

export function getCurrentProxy(): ValidatedProxy | null {
  if (currentPool.length === 0) return null;
  return currentPool[currentIndex % currentPool.length];
}

/** Smart rotation: skip dead proxies, re-test before applying */
export async function rotateProxy(): Promise<ValidatedProxy | null> {
  if (currentPool.length === 0) return null;
  if (currentPool.length === 1) return getCurrentProxy();

  const startIdx = currentIndex;
  let attempts = 0;
  const maxAttempts = Math.min(currentPool.length, 5);

  while (attempts < maxAttempts) {
    currentIndex = (currentIndex + 1) % currentPool.length;
    if (currentIndex === startIdx) break; // wrapped around
    const candidate = currentPool[currentIndex];

    // Skip proxies with too many failures
    if (candidate.failCount >= CONFIG.MAX_FAIL_COUNT) {
      attempts++;
      continue;
    }

    // Quick re-test before committing
    const result = await testProxy(candidate);
    if (result !== null) {
      candidate.latencyMs = result.latency; // update with fresh latency
      candidate.exitIp = result.exitIp;
      await applyProxyToSession(candidate);
      healthFailCount = 0; // reset health counter on successful rotate
      console.log(`[ProxyEngine] Rotated → ${candidate.protocol}://${candidate.host}:${candidate.port} (${candidate.latencyMs}ms, ip: ${candidate.exitIp})`);
      return candidate;
    }

    // Re-test failed — mark it and skip
    candidate.failCount++;
    candidate.score = Math.max(0, candidate.score - 20);
    attempts++;
  }

  // All attempts failed — emit suggestion
  emitSuggestion({
    type: 'proxy_dead',
    message: 'All proxies in rotation failed. Consider refreshing the pool.',
    action: 'Refresh Pool',
    actionId: 'proxy:refreshPool',
  });
  return getCurrentProxy();
}

export async function reportProxyFailure(proxy: ValidatedProxy): Promise<void> {
  const d = getDb();
  if (!d) return;
  const id = proxyId(proxy);
  d.prepare(`UPDATE proxies SET fail_count = fail_count + 1, score = MAX(0, score - 20) WHERE id = ?`).run(id);
  proxy.failCount++;
  proxy.score = Math.max(0, proxy.score - 20);

  // Aggressive: remove from pool after MAX_FAIL_COUNT (already validated, so fails are real)
  if (proxy.failCount >= CONFIG.MAX_FAIL_COUNT) {
    currentPool = currentPool.filter((p) => proxyId(p) !== id);
    d.prepare('UPDATE proxies SET in_pool = 0 WHERE id = ?').run(id);
    console.log(`[ProxyEngine] Removed dead proxy: ${proxy.host}:${proxy.port} (${proxy.failCount} fails)`);
  }

  // Auto-shrink protection
  if (currentPool.length > 0 && currentPool.length < CONFIG.POOL_LOW_THRESHOLD && !isRefreshing) {
    emitSuggestion({
      type: 'pool_low',
      message: `Only ${currentPool.length} proxies left in pool.`,
      action: 'Refresh Pool',
      actionId: 'proxy:refreshPool',
    });
    // Auto-trigger background refresh
    refreshProxyPool().catch(() => {});
  }

  await rotateProxy();
}

export function reportProxySuccess(proxy: ValidatedProxy): void {
  const d = getDb();
  if (!d) return;
  const id = proxyId(proxy);
  d.prepare(`UPDATE proxies SET success_count = success_count + 1, fail_count = MAX(0, fail_count - 1), score = MIN(100, score + 5) WHERE id = ?`).run(id);
  proxy.successCount++;
  proxy.score = Math.min(100, proxy.score + 5);
}

// ─── Health Monitor ──────────────────────────────────────────────────
function startHealthMonitor(): void {
  stopHealthMonitor();
  healthFailCount = 0;
  healthTimer = setInterval(async () => {
    const proxy = getCurrentProxy();
    if (!proxy) return;

    // Quick test: can the proxy still reach the internet?
    const result = await testProxy(proxy);
    if (result !== null) {
      healthFailCount = 0;
      // Update latency with fresh measurement
      proxy.latencyMs = result.latency;
      return;
    }

    healthFailCount++;
    console.log(`[ProxyEngine] Health check FAILED for ${proxy.host}:${proxy.port} (${healthFailCount}/${CONFIG.HEALTH_MAX_FAILS})`);

    if (healthFailCount >= CONFIG.HEALTH_MAX_FAILS) {
      console.log('[ProxyEngine] Active proxy dead — auto-rotating...');
      await reportProxyFailure(proxy);
      healthFailCount = 0;

      const newProxy = getCurrentProxy();
      if (newProxy) {
        emitProgress({
          phase: 'idle', fetched: 0, tested: 0, total: 0,
          alive: currentPool.length,
          log: `Auto-rotated to ${newProxy.host}:${newProxy.port}`,
          activeProxy: newProxy,
        });
      }
    }
  }, CONFIG.HEALTH_CHECK_INTERVAL);
}

export function stopHealthMonitor(): void {
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
}

// ─── Smart Suggestions ──────────────────────────────────────────────
function emitSuggestion(suggestion: ProxySuggestion): void {
  proxyEvents.emit('suggestion', suggestion);
  console.log(`[ProxyEngine] 💡 Suggestion: ${suggestion.message} → ${suggestion.action}`);
}

/** Call from renderer/miniapps to report network issues */
export function reportNetworkIssue(issue: { type: 'rate_limited' | 'slow' | 'region_blocked'; url: string; statusCode?: number }): void {
  const proxy = getCurrentProxy();
  if (!proxy) return;

  switch (issue.type) {
    case 'rate_limited':
      emitSuggestion({
        type: 'rate_limited',
        message: `Rate limited on ${new URL(issue.url).hostname}. Switching proxy may help.`,
        action: 'Rotate Proxy',
        actionId: 'proxy:rotate',
      });
      break;
    case 'slow':
      emitSuggestion({
        type: 'slow',
        message: `Slow response from ${new URL(issue.url).hostname} (proxy ${proxy.latencyMs}ms).`,
        action: 'Switch to Faster',
        actionId: 'proxy:rotate',
      });
      break;
    case 'region_blocked':
      emitSuggestion({
        type: 'region_blocked',
        message: `${new URL(issue.url).hostname} may be blocking this proxy region${proxy.country ? ` (${proxy.country})` : ''}.`,
        action: 'Try Different Region',
        actionId: 'proxy:rotate',
      });
      break;
  }
}

// ─── Apply to Electron Session ───────────────────────────────────────
export async function applyProxyToSession(proxy: ValidatedProxy | null): Promise<void> {
  if (!proxy) {
    await session.defaultSession.setProxy({});
    console.log('[ProxyEngine] Proxy cleared — direct connection');
    return;
  }
  // Add DIRECT fallback so app doesn't break when proxy dies
  const proxyRules = `${proxy.protocol}://${proxy.host}:${proxy.port},direct://`;
  const proxyBypassRules = '<local>;localhost;127.0.0.1;*.localhost';
  await session.defaultSession.setProxy({ proxyRules, proxyBypassRules });
  console.log(`[ProxyEngine] Session proxy → ${proxy.protocol}://${proxy.host}:${proxy.port} (${proxy.latencyMs}ms) [fallback: direct]`);
}

// ─── IP Verification (route HTTP through proxy socket directly) ──────
export interface IpVerifyResult {
  service: string;
  ip: string | null;
  latency: number;
  error?: string;
}

/** Send an HTTP GET through SOCKS5 proxy at the raw socket level */
function httpViaSocks5(
  proxyHost: string, proxyPort: number,
  targetHost: string, targetPath: string, timeout: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { try { sock.destroy(); } catch {} reject('timeout'); }, timeout);
    const sock = netModule.createConnection({ host: proxyHost, port: proxyPort, timeout });
    sock.on('error', (e) => { clearTimeout(timer); reject(e.message); });
    sock.on('timeout', () => { sock.destroy(); clearTimeout(timer); reject('timeout'); });

    sock.on('connect', () => {
      // Step 1: SOCKS5 auth handshake
      sock.write(Buffer.from([0x05, 0x01, 0x00]));
    });

    let phase = 0; // 0=auth, 1=connect, 2=http
    let httpData = '';

    sock.on('data', (data) => {
      if (phase === 0) {
        // Auth response: [0x05, 0x00]
        if (data[0] !== 0x05 || data[1] !== 0x00) { sock.destroy(); clearTimeout(timer); reject('auth_fail'); return; }
        phase = 1;
        // Step 2: CONNECT to target host:80
        const hostBuf = Buffer.from(targetHost);
        const req = Buffer.alloc(7 + hostBuf.length);
        req[0] = 0x05; req[1] = 0x01; req[2] = 0x00; req[3] = 0x03; // domain
        req[4] = hostBuf.length;
        hostBuf.copy(req, 5);
        req.writeUInt16BE(80, 5 + hostBuf.length);
        sock.write(req);
      } else if (phase === 1) {
        // Connect response: [0x05, 0x00, ...]
        if (data[1] !== 0x00) { sock.destroy(); clearTimeout(timer); reject('connect_fail'); return; }
        phase = 2;
        // Step 3: Send HTTP GET
        sock.write(`GET ${targetPath} HTTP/1.1\r\nHost: ${targetHost}\r\nAccept: application/json\r\nConnection: close\r\n\r\n`);
      } else {
        httpData += data.toString();
        // Check if we have complete response
        if (httpData.includes('\r\n\r\n') && httpData.includes('}')) {
          sock.destroy();
          clearTimeout(timer);
          // Extract JSON body
          const bodyStart = httpData.indexOf('\r\n\r\n') + 4;
          resolve(httpData.slice(bodyStart));
        }
      }
    });
  });
}

export async function verifyExternalIp(): Promise<IpVerifyResult[]> {
  const proxy = getCurrentProxy();

  const services = [
    { name: 'ipify', host: 'api.ipify.org', path: '/?format=json', field: 'ip' },
    { name: 'ip-api', host: 'ip-api.com', path: '/json/?fields=status,query', field: 'query' },
    { name: 'httpbin', host: 'httpbin.org', path: '/ip', field: 'origin' },
  ];

  const results = await Promise.allSettled(
    services.map(async (svc) => {
      const start = Date.now();
      try {
        let text: string;
        if (proxy && (proxy.protocol === 'socks5' || proxy.protocol === 'socks4')) {
          // Route directly through SOCKS5 proxy socket
          text = await httpViaSocks5(proxy.host, proxy.port, svc.host, svc.path, 8000);
        } else {
          // Fallback to net.request
          text = await fetchText(`http://${svc.host}${svc.path}`);
        }
        const latency = Date.now() - start;
        if (!text || text.length === 0) return { service: svc.name, ip: null, latency, error: 'empty' };
        if (text.trimStart().startsWith('<')) return { service: svc.name, ip: null, latency, error: 'blocked' };
        // Find JSON in response (may have chunked encoding artifacts)
        const jsonMatch = text.match(/\{[^}]+\}/);
        if (!jsonMatch) return { service: svc.name, ip: null, latency, error: 'no json' };
        const data = JSON.parse(jsonMatch[0]);
        return { service: svc.name, ip: data[svc.field] || null, latency };
      } catch (e) {
        return { service: svc.name, ip: null, latency: Date.now() - start, error: String(e).slice(0, 60) };
      }
    })
  );

  return results.map(r => r.status === 'fulfilled' ? r.value : { service: 'unknown', ip: null, latency: 0, error: 'failed' });
}

// ─── Main lifecycle ──────────────────────────────────────────────────
export async function refreshProxyPool(): Promise<ProxyPoolStats> {
  if (isRefreshing) return getPoolStats();
  isRefreshing = true;

  try {
    const rawProxies = await fetchAllProxies();
    const validated = await validateBatch(rawProxies, CONFIG.CONCURRENCY);

    emitProgress({ phase: 'building', log: `Persisting ${validated.length} valid proxies...` });
    persistProxies(validated);
    currentPool = buildPool();
    currentIndex = 0;

    // Geo lookup for pool proxies (background, non-blocking for UI)
    emitProgress({ phase: 'building', log: `Resolving geo for ${currentPool.length} pool proxies...` });
    await lookupGeoForPool(currentPool).catch(() => {});

    // Prune dead proxies 
    const d = getDb();
    if (d) d.prepare(`DELETE FROM proxies WHERE score = 0 AND last_checked < ?`).run(Date.now() - 86400000);

    // Apply best proxy + start health monitoring
    const best = getCurrentProxy();
    if (best) await applyProxyToSession(best);
    startHealthMonitor();

    emitProgress({
      phase: 'done', alive: validated.length,
      log: `Pool ready: ${currentPool.length} proxies`,
      stats: getPoolStats(),
      activeProxy: best,
    });
    return getPoolStats();
  } finally {
    isRefreshing = false;
  }
}

export function getPoolStats(): ProxyPoolStats {
  const d = getDb();
  if (!d) return { totalFetched: 0, totalValid: 0, poolSize: 0, avgLatency: 0, lastRefresh: Date.now(), sources: PROXY_SOURCES.length };

  const stats = d.prepare(`
    SELECT
      COUNT(*) as totalFetched,
      SUM(CASE WHEN score > 0 THEN 1 ELSE 0 END) as totalValid,
      SUM(CASE WHEN in_pool = 1 THEN 1 ELSE 0 END) as poolSize,
      AVG(CASE WHEN in_pool = 1 THEN latency_ms ELSE NULL END) as avgLatency
    FROM proxies
  `).get() as any;

  return {
    totalFetched: stats?.totalFetched || 0,
    totalValid: stats?.totalValid || 0,
    poolSize: stats?.poolSize || 0,
    avgLatency: Math.round(stats?.avgLatency || 0),
    lastRefresh: Date.now(),
    sources: PROXY_SOURCES.length,
  };
}

export function getPoolProxies(): ValidatedProxy[] {
  return [...currentPool];
}

export function startAutoRefresh(): void {
  if (refreshTimer) return;
  refreshProxyPool().catch(console.error);
  refreshTimer = setInterval(() => {
    refreshProxyPool().catch(console.error);
  }, CONFIG.REFRESH_INTERVAL);
}

export function stopAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  stopHealthMonitor();
}

export function loadExistingPool(): void {
  try {
    currentPool = buildPool();
    currentIndex = 0;
    if (currentPool.length > 0) {
      console.log(`[ProxyEngine] Loaded ${currentPool.length} proxies from cache`);
      startHealthMonitor();
      // Resolve geo for any cached proxies missing country (background, non-blocking)
      const needsGeo = currentPool.filter(p => !p.country);
      if (needsGeo.length > 0) {
        lookupGeoForPool(currentPool).then(() => {
          // Push updated proxy with country to UI
          const current = getCurrentProxy();
          if (current) {
            emitProgress({
              phase: 'idle', fetched: 0, tested: 0, total: 0,
              alive: currentPool.length,
              log: `Geo resolved for ${currentPool.filter(p => p.country).length} proxies`,
              activeProxy: current,
            });
          }
        }).catch(() => {});
      }
    }
  } catch {
    // first run, no DB yet
  }
}
