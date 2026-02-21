import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * SQLite Database Service for Electron
 * Provides a robust, type-safe interface for all database operations
 */

export interface Creator {
    id: string;
    name: string;
    service: string;
    favorited: number;
    indexed: number;
    updated: number;
    is_favorite?: boolean;
}

export interface Post {
    id: string;
    user: string;
    service: string;
    title: string;
    content: string;
    published: string;
    file_name?: string;
    file_path?: string;
    attachments?: string; // JSON string
}

export interface CacheEntry {
    key: string;
    value: string;
    expires_at: number;
}

class DatabaseService {
    private db: Database.Database | null = null;
    private dbPath: string;

    constructor() {
        // Store DB in userData directory
        const userDataPath = app.getPath('userData');
        this.dbPath = path.join(userDataPath, 'coomerlabs.db');
    }

    /**
     * Initialize the database connection and create tables
     */
    public init(): void {
        try {
            // Ensure directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Open database with better-sqlite3
            this.db = new Database(this.dbPath, {
                verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
            });

            // Enable WAL mode for better performance
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = -64000'); // 64MB cache

            // Create tables
            this.createTables();

            console.log('✅ Database initialized at:', this.dbPath);
        } catch (error) {
            console.error('❌ Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Create database schema
     */
    private createTables(): void {
        if (!this.db) throw new Error('Database not initialized');

        // Creators table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS creators (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        service TEXT NOT NULL,
        favorited INTEGER DEFAULT 0,
        indexed INTEGER DEFAULT 0,
        updated INTEGER DEFAULT 0,
        is_favorite BOOLEAN DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(id, service)
      );
      CREATE INDEX IF NOT EXISTS idx_creators_service ON creators(service);
      CREATE INDEX IF NOT EXISTS idx_creators_name ON creators(name);
      CREATE INDEX IF NOT EXISTS idx_creators_favorite ON creators(is_favorite);
    `);

        // Posts table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user TEXT NOT NULL,
        service TEXT NOT NULL,
        title TEXT,
        content TEXT,
        published TEXT,
        file_name TEXT,
        file_path TEXT,
        attachments TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user) REFERENCES creators(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user);
      CREATE INDEX IF NOT EXISTS idx_posts_service ON posts(service);
      CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
    `);

        // Cache table for API responses
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
    `);

        // Favorites table (alternative approach)
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        creator_id TEXT PRIMARY KEY,
        added_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
      );
    `);
    }

    /**
     * Insert or update creators (batch operation)
     */
    public upsertCreators(creators: Creator[]): void {
        if (!this.db) throw new Error('Database not initialized');

        const stmt = this.db.prepare(`
      INSERT INTO creators (id, name, service, favorited, indexed, updated)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id, service) DO UPDATE SET
        name = excluded.name,
        favorited = excluded.favorited,
        indexed = excluded.indexed,
        updated = excluded.updated
    `);

        const insertMany = this.db.transaction((creators: Creator[]) => {
            for (const creator of creators) {
                stmt.run(
                    creator.id,
                    creator.name,
                    creator.service,
                    creator.favorited,
                    creator.indexed,
                    creator.updated
                );
            }
        });

        insertMany(creators);
    }

    /**
     * Search creators by name
     */
    public searchCreators(query: string, service?: string, limit = 50): Creator[] {
        if (!this.db) throw new Error('Database not initialized');

        let sql = `
      SELECT * FROM creators 
      WHERE name LIKE ? 
      ${service ? 'AND service = ?' : ''}
      ORDER BY favorited DESC, name ASC
      LIMIT ?
    `;

        const params = service
            ? [`%${query}%`, service, limit]
            : [`%${query}%`, limit];

        const stmt = this.db.prepare(sql);
        return stmt.all(...params) as Creator[];
    }

    /**
     * Get creators by service with pagination
     */
    public getCreatorsByService(
        service: string,
        page = 1,
        pageSize = 30
    ): { data: Creator[]; total: number } {
        if (!this.db) throw new Error('Database not initialized');

        const offset = (page - 1) * pageSize;

        const dataStmt = this.db.prepare(`
      SELECT * FROM creators 
      WHERE service = ? 
      ORDER BY favorited DESC, updated DESC
      LIMIT ? OFFSET ?
    `);

        const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM creators WHERE service = ?
    `);

        const data = dataStmt.all(service, pageSize, offset) as Creator[];
        const { count } = countStmt.get(service) as { count: number };

        return { data, total: count };
    }

    /**
     * Get all creators with pagination
     */
    public getAllCreators(
        page = 1,
        pageSize = 30
    ): { data: Creator[]; total: number } {
        if (!this.db) throw new Error('Database not initialized');

        const offset = (page - 1) * pageSize;

        const dataStmt = this.db.prepare(`
      SELECT * FROM creators 
      ORDER BY favorited DESC, updated DESC
      LIMIT ? OFFSET ?
    `);

        const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM creators
    `);

        const data = dataStmt.all(pageSize, offset) as Creator[];
        const { count } = countStmt.get() as { count: number };

        return { data, total: count };
    }

    /**
     * Toggle favorite status
     */
    public toggleFavorite(creatorId: string): boolean {
        if (!this.db) throw new Error('Database not initialized');

        const checkStmt = this.db.prepare(
            'SELECT 1 FROM favorites WHERE creator_id = ?'
        );
        const exists = checkStmt.get(creatorId);

        if (exists) {
            const deleteStmt = this.db.prepare('DELETE FROM favorites WHERE creator_id = ?');
            deleteStmt.run(creatorId);

            const updateStmt = this.db.prepare('UPDATE creators SET is_favorite = 0 WHERE id = ?');
            updateStmt.run(creatorId);

            return false;
        } else {
            const insertStmt = this.db.prepare('INSERT INTO favorites (creator_id) VALUES (?)');
            insertStmt.run(creatorId);

            const updateStmt = this.db.prepare('UPDATE creators SET is_favorite = 1 WHERE id = ?');
            updateStmt.run(creatorId);

            return true;
        }
    }

    /**
     * Get all favorites
     */
    public getFavorites(): Creator[] {
        if (!this.db) throw new Error('Database not initialized');

        const stmt = this.db.prepare(`
      SELECT c.* FROM creators c
      INNER JOIN favorites f ON c.id = f.creator_id
      ORDER BY f.added_at DESC
    `);

        return stmt.all() as Creator[];
    }

    /**
     * Cache API responses
     */
    public setCache(key: string, value: any, ttlSeconds = 3600): void {
        if (!this.db) throw new Error('Database not initialized');

        const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
        const valueStr = JSON.stringify(value);

        const stmt = this.db.prepare(`
      INSERT INTO cache (key, value, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        expires_at = excluded.expires_at
    `);

        stmt.run(key, valueStr, expiresAt);
    }

    /**
     * Get cached value
     */
    public getCache<T>(key: string): T | null {
        if (!this.db) throw new Error('Database not initialized');

        const stmt = this.db.prepare(`
      SELECT value FROM cache 
      WHERE key = ? AND expires_at > strftime('%s', 'now')
    `);

        const row = stmt.get(key) as { value: string } | undefined;

        if (row) {
            try {
                return JSON.parse(row.value) as T;
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Clear expired cache entries
     */
    public clearExpiredCache(): number {
        if (!this.db) throw new Error('Database not initialized');

        const stmt = this.db.prepare(`
      DELETE FROM cache WHERE expires_at <= strftime('%s', 'now')
    `);

        const result = stmt.run();
        return result.changes;
    }

    /**
     * Insert posts for a creator
     */
    public upsertPosts(posts: Post[]): void {
        if (!this.db) throw new Error('Database not initialized');

        const stmt = this.db.prepare(`
      INSERT INTO posts (id, user, service, title, content, published, file_name, file_path, attachments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        published = excluded.published,
        file_name = excluded.file_name,
        file_path = excluded.file_path,
        attachments = excluded.attachments
    `);

        const insertMany = this.db.transaction((posts: Post[]) => {
            for (const post of posts) {
                stmt.run(
                    post.id,
                    post.user,
                    post.service,
                    post.title,
                    post.content,
                    post.published,
                    post.file_name,
                    post.file_path,
                    post.attachments
                );
            }
        });

        insertMany(posts);
    }

    /**
     * Get posts for a creator
     */
    public getPostsByCreator(creatorId: string, limit = 50): Post[] {
        if (!this.db) throw new Error('Database not initialized');

        const stmt = this.db.prepare(`
      SELECT * FROM posts 
      WHERE user = ? 
      ORDER BY published DESC 
      LIMIT ?
    `);

        return stmt.all(creatorId, limit) as Post[];
    }

    /**
     * Get database statistics
     */
    public getStats(): {
        totalCreators: number;
        totalPosts: number;
        totalFavorites: number;
        cacheSize: number;
        dbSizeMB: number;
    } {
        if (!this.db) throw new Error('Database not initialized');

        const stats = this.db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM creators) as totalCreators,
        (SELECT COUNT(*) FROM posts) as totalPosts,
        (SELECT COUNT(*) FROM favorites) as totalFavorites,
        (SELECT COUNT(*) FROM cache) as cacheSize
    `).get() as any;

        // Get file size
        const dbStats = fs.statSync(this.dbPath);
        const dbSizeMB = Math.round((dbStats.size / (1024 * 1024)) * 100) / 100;

        return {
            ...stats,
            dbSizeMB
        };
    }

    /**
     * Vacuum database to reclaim space
     */
    public vacuum(): void {
        if (!this.db) throw new Error('Database not initialized');
        this.db.exec('VACUUM');
    }

    /**
     * Close database connection
     */
    public close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Export singleton instance
export const dbService = new DatabaseService();
