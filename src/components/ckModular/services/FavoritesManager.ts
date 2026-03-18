// --- FAVORITES SYSTEM ---
export class FavoritesManager {
  private storageKey = 'creator-favorites';
  private favorites: Set<string> = new Set();

  constructor() {
    this.loadFavorites();
  }

  loadFavorites() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.favorites = new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  saveFavorites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.favorites)));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }

  addFavorite(creatorId: string) {
    this.favorites.add(creatorId);
    this.saveFavorites();
  }

  removeFavorite(creatorId: string) {
    this.favorites.delete(creatorId);
    this.saveFavorites();
  }

  isFavorite(creatorId: string): boolean {
    return this.favorites.has(creatorId);
  }

  getFavorites(): string[] {
    return Array.from(this.favorites);
  }
}

export const favoritesManager = new FavoritesManager();
