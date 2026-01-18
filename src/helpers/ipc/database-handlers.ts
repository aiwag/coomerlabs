import { ipcMain } from 'electron';
import { dbService, Creator, Post } from '../../services/sqliteService';

/**
 * Register all database-related IPC handlers
 */
export function registerDatabaseHandlers() {
    // Creators
    ipcMain.handle('db:searchCreators', async (_, query: string, service?: string) => {
        return dbService.searchCreators(query, service);
    });

    ipcMain.handle('db:getCreatorsByService', async (_, service: string, page: number, pageSize: number) => {
        return dbService.getCreatorsByService(service, page, pageSize);
    });

    ipcMain.handle('db:upsertCreators', async (_, creators: Creator[]) => {
        dbService.upsertCreators(creators);
        return { success: true };
    });

    // Favorites
    ipcMain.handle('db:toggleFavorite', async (_, creatorId: string) => {
        return dbService.toggleFavorite(creatorId);
    });

    ipcMain.handle('db:getFavorites', async () => {
        return dbService.getFavorites();
    });

    // Posts
    ipcMain.handle('db:getPostsByCreator', async (_, creatorId: string, limit?: number) => {
        return dbService.getPostsByCreator(creatorId, limit);
    });

    ipcMain.handle('db:upsertPosts', async (_, posts: Post[]) => {
        dbService.upsertPosts(posts);
        return { success: true };
    });

    // Cache
    ipcMain.handle('db:setCache', async (_, key: string, value: any, ttl?: number) => {
        dbService.setCache(key, value, ttl);
        return { success: true };
    });

    ipcMain.handle('db:getCache', async (_, key: string) => {
        return dbService.getCache(key);
    });

    ipcMain.handle('db:clearExpiredCache', async () => {
        const deleted = dbService.clearExpiredCache();
        return { deleted };
    });

    // Stats
    ipcMain.handle('db:getStats', async () => {
        return dbService.getStats();
    });

    ipcMain.handle('db:vacuum', async () => {
        dbService.vacuum();
        return { success: true };
    });
}
