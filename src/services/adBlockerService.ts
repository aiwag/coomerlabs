/**
 * Ad Blocker Service — uses @ghostery/adblocker-electron
 * with uBlock Origin + EasyList filter lists.
 * Blocks ads/trackers in all Electron sessions including webviews.
 */

import { ElectronBlocker } from '@ghostery/adblocker-electron';
import { session } from 'electron';
import fetch from 'cross-fetch';

let blocker: ElectronBlocker | null = null;
let enabled = true;
const trackedSessions = new Set<string>();

// Stats
let totalBlocked = 0;
let sessionStart = Date.now();
const recentBlocked: { url: string; ts: number }[] = [];
const domainCounts = new Map<string, number>();

/** Initialize the ad blocker with prebuilt filter lists */
export async function initAdBlocker(): Promise<void> {
  try {
    // Use prebuilt ads + tracking + annoyances lists
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);

    // Count blocked requests and track domains
    blocker.on('request-blocked', (request: any) => {
      totalBlocked++;

      // Track the blocked domain
      try {
        const url = typeof request === 'string' ? request : request?.url || '';
        const hostname = new URL(url).hostname;
        domainCounts.set(hostname, (domainCounts.get(hostname) || 0) + 1);

        // Keep last 50 blocked requests
        recentBlocked.push({ url: url.slice(0, 200), ts: Date.now() });
        if (recentBlocked.length > 50) recentBlocked.shift();
      } catch {}
    });

    // Enable on all relevant sessions
    enableOnSession('default');
    enableOnSession('persist:bunkr');

    console.log('[AdBlocker] Initialized with prebuilt filter lists');
  } catch (error) {
    console.error('[AdBlocker] Failed to initialize:', error);
  }
}

/** Enable blocking on a specific session partition */
function enableOnSession(partition: string): void {
  if (!blocker || !enabled) return;
  try {
    const sess = partition === 'default'
      ? session.defaultSession
      : session.fromPartition(partition);
    blocker.enableBlockingInSession(sess);
    trackedSessions.add(partition);
  } catch (error) {
    console.error(`[AdBlocker] Failed to enable on session ${partition}:`, error);
  }
}

/** Disable blocking on a specific session */
function disableOnSession(partition: string): void {
  if (!blocker) return;
  try {
    const sess = partition === 'default'
      ? session.defaultSession
      : session.fromPartition(partition);
    blocker.disableBlockingInSession(sess);
    trackedSessions.delete(partition);
  } catch (error) {
    console.error(`[AdBlocker] Failed to disable on session ${partition}:`, error);
  }
}

/** Toggle ad blocker on/off globally */
export function toggleAdBlocker(): boolean {
  enabled = !enabled;
  if (blocker) {
    for (const partition of [...trackedSessions]) {
      if (enabled) {
        enableOnSession(partition);
      } else {
        disableOnSession(partition);
      }
    }
    // Re-add tracked sessions when re-enabling
    if (enabled) {
      enableOnSession('default');
      enableOnSession('persist:bunkr');
    }
  }
  console.log(`[AdBlocker] ${enabled ? 'Enabled' : 'Disabled'}`);
  return enabled;
}

/** Update filter lists (re-download and re-init) */
export async function updateFilterLists(): Promise<boolean> {
  try {
    const oldBlocker = blocker;

    // Re-download fresh filter lists
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);

    // Re-attach event listener
    blocker.on('request-blocked', (request: any) => {
      totalBlocked++;
      try {
        const url = typeof request === 'string' ? request : request?.url || '';
        const hostname = new URL(url).hostname;
        domainCounts.set(hostname, (domainCounts.get(hostname) || 0) + 1);
        recentBlocked.push({ url: url.slice(0, 200), ts: Date.now() });
        if (recentBlocked.length > 50) recentBlocked.shift();
      } catch {}
    });

    // Disable old blocker on all sessions
    if (oldBlocker) {
      for (const partition of trackedSessions) {
        try {
          const sess = partition === 'default'
            ? session.defaultSession
            : session.fromPartition(partition);
          oldBlocker.disableBlockingInSession(sess);
        } catch {}
      }
    }

    // Re-enable on all sessions
    if (enabled) {
      for (const partition of ['default', 'persist:bunkr']) {
        enableOnSession(partition);
      }
    }

    console.log('[AdBlocker] Filter lists updated');
    return true;
  } catch (error) {
    console.error('[AdBlocker] Failed to update filter lists:', error);
    return false;
  }
}

/** Get current status with detailed metrics */
export function getAdBlockerStatus() {
  // Get top blocked domains
  const topDomains = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([domain, count]) => ({ domain, count }));

  const uptimeMs = Date.now() - sessionStart;
  const blockedPerMinute = uptimeMs > 0 ? (totalBlocked / (uptimeMs / 60000)).toFixed(1) : '0';

  return {
    enabled,
    totalBlocked,
    blockedPerMinute,
    topDomains,
    recentBlocked: recentBlocked.slice(-10).reverse(),
    sessions: [...trackedSessions],
    filterLists: [
      { name: 'EasyList', type: 'ads', enabled: true },
      { name: 'EasyPrivacy', type: 'tracking', enabled: true },
      { name: 'uBlock Origin Filters', type: 'ads', enabled: true },
      { name: 'uBlock Origin Badware', type: 'malware', enabled: true },
      { name: 'uBlock Origin Privacy', type: 'tracking', enabled: true },
      { name: 'Peter Lowe\'s Ad Server List', type: 'ads', enabled: true },
    ],
  };
}
