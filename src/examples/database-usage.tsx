/**
 * Example Usage of SQLite Database in React Components
 * 
 * This file demonstrates how to use the SQLite database
 * through the electronAPI interface in your React components.
 */

import { useEffect, useState } from 'react';

// Type definitions for the database API
declare global {
    interface Window {
        electronAPI: {
            db: {
                searchCreators: (query: string, service?: string) => Promise<Creator[]>;
                getCreatorsByService: (service: string, page: number, pageSize: number) => Promise<{ data: Creator[]; total: number }>;
                upsertCreators: (creators: Creator[]) => Promise<{ success: boolean }>;
                toggleFavorite: (creatorId: string) => Promise<boolean>;
                getFavorites: () => Promise<Creator[]>;
                getPostsByCreator: (creatorId: string, limit?: number) => Promise<Post[]>;
                upsertPosts: (posts: Post[]) => Promise<{ success: boolean }>;
                setCache: (key: string, value: any, ttl?: number) => Promise<{ success: boolean }>;
                getCache: (key: string) => Promise<any | null>;
                clearExpiredCache: () => Promise<{ deleted: number }>;
                getStats: () => Promise<DatabaseStats>;
                vacuum: () => Promise<{ success: boolean }>;
            };
        };
    }
}

interface Creator {
    id: string;
    name: string;
    service: string;
    favorited: number;
    indexed: number;
    updated: number;
    is_favorite?: boolean;
}

interface Post {
    id: string;
    user: string;
    service: string;
    title: string;
    content: string;
    published: string;
    file_name?: string;
    file_path?: string;
}

interface DatabaseStats {
    totalCreators: number;
    totalPosts: number;
    totalFavorites: number;
    cacheSize: number;
    dbSizeMB: number;
}

// ===== EXAMPLE 1: Search Creators =====
function SearchCreatorsExample() {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Creator[]>([]);

    const handleSearch = async () => {
        if (!window.electronAPI?.db) return;

        const creators = await window.electronAPI.db.searchCreators(searchQuery, 'onlyfans');
        setResults(creators);
    };

    return (
        <div>
            <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
            <div>
                {results.map(creator => (
                    <div key={creator.id}>{creator.name}</div>
                ))}
            </div>
        </div>
    );
}

// ===== EXAMPLE 2: Load Creators with Pagination =====
function CreatorListExample() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadCreators();
    }, [page]);

    const loadCreators = async () => {
        if (!window.electronAPI?.db) return;

        const result = await window.electronAPI.db.getCreatorsByService('patreon', page, 30);
        setCreators(result.data);
        setTotal(result.total);
    };

    return (
        <div>
            <div>Total: {total}</div>
            {creators.map(creator => (
                <div key={creator.id}>{creator.name}</div>
            ))}
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</button>
            <button onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
    );
}

// ===== EXAMPLE 3: Toggle Favorites =====
function FavoriteButtonExample({ creatorId }: { creatorId: string }) {
    const [isFavorite, setIsFavorite] = useState(false);

    const handleToggle = async () => {
        if (!window.electronAPI?.db) return;

        const newState = await window.electronAPI.db.toggleFavorite(creatorId);
        setIsFavorite(newState);
    };

    return (
        <button onClick={handleToggle}>
            {isFavorite ? '★' : '☆'}
        </button>
    );
}

// ===== EXAMPLE 4: Cache API Responses =====
async function cacheApiResponse() {
    if (!window.electronAPI?.db) return;

    const cacheKey = 'creators:onlyfans:page1';

    // Check cache first
    let data = await window.electronAPI.db.getCache(cacheKey);

    if (!data) {
        // Fetch from API
        const response = await fetch('https://api.example.com/creators');
        data = await response.json();

        // Cache for 1 hour (3600 seconds)
        await window.electronAPI.db.setCache(cacheKey, data, 3600);
    }

    return data;
}

// ===== EXAMPLE 5: Save Creators to Database =====
async function saveCreatorsFromApi(apiData: any[]) {
    if (!window.electronAPI?.db) return;

    const creators: Creator[] = apiData.map(item => ({
        id: item.id,
        name: item.name,
        service: item.service,
        favorited: item.favorited || 0,
        indexed: item.indexed || Date.now(),
        updated: item.updated || Date.now()
    }));

    await window.electronAPI.db.upsertCreators(creators);
    console.log(`Saved ${creators.length} creators to database`);
}

// ===== EXAMPLE 6: Display Database Stats =====
function DatabaseStatsComponent() {
    const [stats, setStats] = useState<DatabaseStats | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        if (!window.electronAPI?.db) return;

        const dbStats = await window.electronAPI.db.getStats();
        setStats(dbStats);
    };

    const handleVacuum = async () => {
        if (!window.electronAPI?.db) return;

        await window.electronAPI.db.vacuum();
        await loadStats(); // Reload stats
    };

    if (!stats) return <div>Loading...</div>;

    return (
        <div>
            <h3>Database Statistics</h3>
            <p>Total Creators: {stats.totalCreators}</p>
            <p>Total Posts: {stats.totalPosts}</p>
            <p>Favorites: {stats.totalFavorites}</p>
            <p>Cache Entries: {stats.cacheSize}</p>
            <p>Database Size: {stats.dbSizeMB} MB</p>
            <button onClick={handleVacuum}>Optimize Database</button>
        </div>
    );
}

// ===== EXAMPLE 7: Integration with coomerKemono.tsx =====
// Replace IndexedDB usage with SQLite

async function fetchAndCacheCreators(service: string): Promise<Creator[]> {
    if (!window.electronAPI?.db) {
        throw new Error('Database not available');
    }

    const cacheKey = `creators:${service}:v1`;

    // Try cache first
    const cached = await window.electronAPI.db.getCache<Creator[]>(cacheKey);
    if (cached) {
        console.log('📦 Loaded from cache');
        return cached;
    }

    // Fetch from API
    const response = await fetch(`https://api.example.com/${service}`);
    const data = await response.json();

    // Save to database and cache
    await window.electronAPI.db.upsertCreators(data);
    await window.electronAPI.db.setCache(cacheKey, data, 86400); // 24 hours

    return data;
}

export {
    SearchCreatorsExample,
    CreatorListExample,
    FavoriteButtonExample,
    DatabaseStatsComponent,
    cacheApiResponse,
    saveCreatorsFromApi,
    fetchAndCacheCreators
};
