// ─── Xray Manager ───────────────────────────────────────────────────
// Downloads, spawns, and manages the xray-core binary.
// Generates xray JSON config for any protocol (SS, VMess, Trojan, VLESS).
// ────────────────────────────────────────────────────────────────────

import { app, session } from 'electron';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import { spawn, type ChildProcess } from 'child_process';
import { type TunnelServer, tunnelEvents } from './tunnel-engine';

const LOCAL_SOCKS_PORT = 10808;
const LOCAL_HTTP_PORT = 10809;

// ─── Types ───────────────────────────────────────────────────────────
export interface XrayStatus {
  running: boolean;
  server: TunnelServer | null;
  localSocksPort: number;
  localHttpPort: number;
  startedAt: number | null;
  pid: number | null;
  error?: string;
}

// ─── State ───────────────────────────────────────────────────────────
let xrayProcess: ChildProcess | null = null;
let currentServer: TunnelServer | null = null;
let startedAt: number | null = null;

// ─── Platform Detection ──────────────────────────────────────────────
function getXrayBinaryName(): string {
  const arch = process.arch === 'arm64' ? 'arm64-v8a' : '64';
  switch (process.platform) {
    case 'win32': return `xray-windows-${arch}.exe`;
    case 'darwin': return `xray-macos-${arch}`;
    default: return `xray-linux-${arch}`;
  }
}

function getXrayDir(): string {
  return path.join(app.getPath('userData'), 'xray');
}

function getXrayPath(): string {
  return path.join(getXrayDir(), getXrayBinaryName());
}

function getConfigPath(): string {
  return path.join(getXrayDir(), 'config.json');
}

// ─── Binary Management ──────────────────────────────────────────────
export function isXrayInstalled(): boolean {
  try {
    return fs.existsSync(getXrayPath());
  } catch {
    return false;
  }
}

export async function downloadXray(): Promise<boolean> {
  const dir = getXrayDir();
  fs.mkdirSync(dir, { recursive: true });

  const binaryName = getXrayBinaryName();
  const destPath = getXrayPath();

  // Determine the release zip name
  const arch = process.arch === 'arm64' ? 'arm64-v8a' : '64';
  let zipName: string;
  switch (process.platform) {
    case 'win32': zipName = `Xray-windows-${arch}.zip`; break;
    case 'darwin': zipName = `Xray-macos-${arch}.zip`; break;
    default: zipName = `Xray-linux-${arch}.zip`; break;
  }

  const downloadUrl = `https://github.com/XTLS/Xray-core/releases/latest/download/${zipName}`;

  console.log(`[XrayManager] Downloading ${downloadUrl}...`);
  tunnelEvents.emit('progress', { phase: 'fetching', log: `Downloading xray-core...`, serverCount: 0 });

  try {
    const { net } = require('electron');
    const zipPath = path.join(dir, zipName);

    // Download zip file
    await new Promise<void>((resolve, reject) => {
      const request = net.request(downloadUrl);
      const chunks: Buffer[] = [];
      request.on('response', (response: any) => {
        // Follow redirects — net module handles them automatically
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          fs.writeFileSync(zipPath, Buffer.concat(chunks));
          resolve();
        });
        response.on('error', reject);
      });
      request.on('error', reject);
      request.end();
    });

    // Extract xray binary from zip
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // Find the xray binary in the zip
    const binaryEntry = entries.find((e: any) =>
      e.entryName === 'xray' || e.entryName === 'xray.exe'
    );

    if (!binaryEntry) {
      console.error('[XrayManager] xray binary not found in zip');
      return false;
    }

    zip.extractEntryTo(binaryEntry, dir, false, true);

    // Also extract geoip.dat and geosite.dat if present
    for (const geoFile of ['geoip.dat', 'geosite.dat']) {
      const geoEntry = entries.find((e: any) => e.entryName === geoFile);
      if (geoEntry) {
        zip.extractEntryTo(geoEntry, dir, false, true);
        console.log(`[XrayManager] Extracted ${geoFile}`);
      }
    }

    // Rename to platform-specific name
    const extractedPath = path.join(dir, binaryEntry.entryName);
    if (extractedPath !== destPath) {
      fs.renameSync(extractedPath, destPath);
    }

    // Make executable on Unix
    if (process.platform !== 'win32') {
      fs.chmodSync(destPath, 0o755);
    }

    // Clean up zip
    fs.unlinkSync(zipPath);

    console.log(`[XrayManager] Downloaded and installed xray-core to ${destPath}`);
    tunnelEvents.emit('progress', { phase: 'ready', log: 'xray-core installed', serverCount: 0 });
    return true;
  } catch (e) {
    console.error('[XrayManager] Download failed:', e);
    tunnelEvents.emit('progress', { phase: 'error', log: `Download failed: ${e}`, serverCount: 0 });
    return false;
  }
}

// ─── Config Generation ──────────────────────────────────────────────
function generateConfig(server: TunnelServer): object {
  const inbounds = [
    {
      tag: 'socks-in',
      port: LOCAL_SOCKS_PORT,
      listen: '127.0.0.1',
      protocol: 'socks',
      settings: { auth: 'noauth', udp: true },
    },
    {
      tag: 'http-in',
      port: LOCAL_HTTP_PORT,
      listen: '127.0.0.1',
      protocol: 'http',
    },
  ];

  let outbound: any;

  switch (server.protocol) {
    case 'shadowsocks':
      outbound = {
        tag: 'proxy',
        protocol: 'shadowsocks',
        settings: {
          servers: [{
            address: server.host,
            port: server.port,
            method: server.method,
            password: server.password,
          }],
        },
      };
      break;

    case 'vmess':
      outbound = {
        tag: 'proxy',
        protocol: 'vmess',
        settings: {
          vnext: [{
            address: server.host,
            port: server.port,
            users: [{
              id: server.uuid,
              alterId: server.alterId || 0,
              security: 'auto',
            }],
          }],
        },
        streamSettings: {
          network: server.network || 'tcp',
          ...(server.tls ? {
            security: 'tls',
            tlsSettings: { serverName: server.sni || server.host, allowInsecure: true },
          } : {}),
          ...(server.network === 'ws' ? {
            wsSettings: {
              path: server.wsPath || '/',
              headers: server.wsHost ? { Host: server.wsHost } : {},
            },
          } : {}),
        },
      };
      break;

    case 'trojan':
      outbound = {
        tag: 'proxy',
        protocol: 'trojan',
        settings: {
          servers: [{
            address: server.host,
            port: server.port,
            password: server.password,
          }],
        },
        streamSettings: {
          network: 'tcp',
          security: server.tls !== false ? 'tls' : 'none',
          tlsSettings: {
            serverName: server.sni || server.host,
            allowInsecure: true,
          },
        },
      };
      break;

    case 'vless':
      outbound = {
        tag: 'proxy',
        protocol: 'vless',
        settings: {
          vnext: [{
            address: server.host,
            port: server.port,
            users: [{
              id: server.uuid,
              encryption: 'none',
              flow: server.flow || '',
            }],
          }],
        },
        streamSettings: {
          network: server.network || 'tcp',
          security: server.tls ? 'tls' : 'none',
          ...(server.tls ? {
            tlsSettings: { serverName: server.sni || server.host, allowInsecure: true },
          } : {}),
        },
      };
      break;

    default:
      throw new Error(`Unsupported protocol: ${server.protocol}`);
  }

  // Check if geo files exist for advanced routing
  const geoipExists = fs.existsSync(path.join(getXrayDir(), 'geoip.dat'));
  const geositeExists = fs.existsSync(path.join(getXrayDir(), 'geosite.dat'));

  const rules: any[] = [];
  if (geoipExists) {
    rules.push({ type: 'field', ip: ['geoip:private'], outboundTag: 'direct' });
  } else {
    // Fallback: plain CIDR for private ranges
    rules.push({ type: 'field', ip: ['127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '::1/128', 'fc00::/7'], outboundTag: 'direct' });
  }
  if (geositeExists) {
    rules.push({ type: 'field', domain: ['geosite:category-ads'], outboundTag: 'block' });
  }

  return {
    log: { loglevel: 'warning' },
    inbounds,
    outbounds: [
      outbound,
      { tag: 'direct', protocol: 'freedom' },
      { tag: 'block', protocol: 'blackhole' },
    ],
    routing: {
      domainStrategy: 'AsIs',
      rules,
    },
  };
}

// ─── Process Management ─────────────────────────────────────────────
export async function connect(server: TunnelServer): Promise<XrayStatus> {
  // Ensure xray is installed
  if (!isXrayInstalled()) {
    const ok = await downloadXray();
    if (!ok) {
      return {
        running: false, server: null,
        localSocksPort: LOCAL_SOCKS_PORT, localHttpPort: LOCAL_HTTP_PORT,
        startedAt: null, pid: null,
        error: 'Failed to download xray-core',
      };
    }
  }

  // Stop existing connection
  await disconnect();

  // Generate config
  const config = generateConfig(server);
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Spawn xray
  const xrayPath = getXrayPath();

  console.log(`[XrayManager] Connecting to ${server.protocol}://${server.host}:${server.port}...`);
  tunnelEvents.emit('progress', {
    phase: 'connecting',
    log: `Connecting to ${server.name}...`,
    serverCount: 0,
  });

  return new Promise((resolve) => {
    try {
      xrayProcess = spawn(xrayPath, ['run', '-config', configPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        cwd: getXrayDir(), // so xray finds geoip.dat/geosite.dat
      });

      currentServer = server;
      startedAt = Date.now();
      let startupResolved = false;

      // Give xray 3s to start, then check if still running
      const startupTimer = setTimeout(() => {
        if (!startupResolved && xrayProcess && !xrayProcess.killed) {
          startupResolved = true;

          // Apply SOCKS5 proxy to Electron session
          session.defaultSession.setProxy({
            proxyRules: `socks5://127.0.0.1:${LOCAL_SOCKS_PORT},direct://`,
            proxyBypassRules: '<local>;localhost;127.0.0.1;*.localhost',
          }).then(() => {
            console.log(`[XrayManager] Connected! SOCKS5 on 127.0.0.1:${LOCAL_SOCKS_PORT}`);
            tunnelEvents.emit('progress', {
              phase: 'connected',
              log: `Connected to ${server.name} (${server.protocol})`,
              serverCount: 0,
            });
            resolve(getStatus());
          });
        }
      }, 3000);

      xrayProcess.stdout?.on('data', (data: Buffer) => {
        const line = data.toString().trim();
        if (line) console.log(`[xray] ${line}`);
      });

      xrayProcess.stderr?.on('data', (data: Buffer) => {
        const line = data.toString().trim();
        if (line) console.error(`[xray:err] ${line}`);
      });

      xrayProcess.on('exit', (code: number | null) => {
        console.log(`[XrayManager] xray exited with code ${code}`);
        if (!startupResolved) {
          startupResolved = true;
          clearTimeout(startupTimer);
          xrayProcess = null;
          currentServer = null;
          startedAt = null;
          resolve({
            running: false, server: null,
            localSocksPort: LOCAL_SOCKS_PORT, localHttpPort: LOCAL_HTTP_PORT,
            startedAt: null, pid: null,
            error: `xray exited with code ${code}`,
          });
        } else {
          // Unexpected exit — tunnel died
          xrayProcess = null;
          currentServer = null;
          startedAt = null;
          tunnelEvents.emit('progress', {
            phase: 'error',
            log: `Tunnel disconnected (exit code ${code})`,
            serverCount: 0,
          });
          // Clear proxy
          session.defaultSession.setProxy({}).catch(() => {});
        }
      });

      xrayProcess.on('error', (err: Error) => {
        if (!startupResolved) {
          startupResolved = true;
          clearTimeout(startupTimer);
          xrayProcess = null;
          currentServer = null;
          startedAt = null;
          resolve({
            running: false, server: null,
            localSocksPort: LOCAL_SOCKS_PORT, localHttpPort: LOCAL_HTTP_PORT,
            startedAt: null, pid: null,
            error: err.message,
          });
        }
      });
    } catch (e) {
      resolve({
        running: false, server: null,
        localSocksPort: LOCAL_SOCKS_PORT, localHttpPort: LOCAL_HTTP_PORT,
        startedAt: null, pid: null,
        error: String(e),
      });
    }
  });
}

export async function disconnect(): Promise<void> {
  if (xrayProcess) {
    try {
      xrayProcess.kill('SIGTERM');
      // Wait a bit for graceful shutdown
      await new Promise(r => setTimeout(r, 500));
      if (xrayProcess && !xrayProcess.killed) {
        xrayProcess.kill('SIGKILL');
      }
    } catch { /* already dead */ }
    xrayProcess = null;
  }
  currentServer = null;
  startedAt = null;

  // Clear proxy
  try {
    await session.defaultSession.setProxy({});
  } catch { /* ignore */ }

  console.log('[XrayManager] Disconnected');
  tunnelEvents.emit('progress', { phase: 'ready', log: 'Disconnected', serverCount: 0 });
}

export function getStatus(): XrayStatus {
  return {
    running: xrayProcess !== null && !xrayProcess.killed,
    server: currentServer,
    localSocksPort: LOCAL_SOCKS_PORT,
    localHttpPort: LOCAL_HTTP_PORT,
    startedAt,
    pid: xrayProcess?.pid || null,
  };
}

export function isConnected(): boolean {
  return xrayProcess !== null && !xrayProcess.killed;
}

export { LOCAL_SOCKS_PORT, LOCAL_HTTP_PORT };
