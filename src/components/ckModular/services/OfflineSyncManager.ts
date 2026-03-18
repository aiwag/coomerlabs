import type { Post } from '../types';

// --- OFFLINE SYNC SYSTEM ---
export class OfflineSyncManager {
  private storageKey = 'offline-sync-data';
  private syncData: Map<string, Post[]> = new Map();
  private isSyncing = false;
  private syncProgress = 0;

  async syncCreatorPosts(creatorId: string, posts: Post[]): Promise<void> {
    this.isSyncing = true;
    this.syncProgress = 0;

    try {
      for (let i = 0; i < posts.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.syncProgress = Math.round((i / posts.length) * 100);
      }

      this.syncData.set(creatorId, posts);
      this.saveSyncData();
    } finally {
      this.isSyncing = false;
      this.syncProgress = 0;
    }
  }

  getSyncedPosts(creatorId: string): Post[] {
    return this.syncData.get(creatorId) || [];
  }

  isCreatorSynced(creatorId: string): boolean {
    return this.syncData.has(creatorId);
  }

  getSyncProgress(): number {
    return this.syncProgress;
  }

  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  private saveSyncData() {
    try {
      const data = Array.from(this.syncData.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save sync data:', error);
    }
  }

  loadSyncData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.syncData = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load sync data:', error);
    }
  }

  clearSyncData() {
    this.syncData.clear();
    localStorage.removeItem(this.storageKey);
  }
}

export const offlineSyncManager = new OfflineSyncManager();
offlineSyncManager.loadSyncData();
