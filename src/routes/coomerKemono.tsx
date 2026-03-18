// CoomerKemono Route - Modular Implementation (decomposed from 3115-line monolith)
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { createStorage } from 'unstorage';
import indexedDbDriver from "unstorage/drivers/indexedb";
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  Loader2, RefreshCw, Search, Star, Sun, Moon,
  Layers, Grid3X3, LayoutGrid, WifiOff, ChevronLeft, ChevronRight,
  Sparkles,
} from 'lucide-react';

// --- Modular imports ---
import type { Creator, Post, Profile, CreatorApiResponse } from '../components/ckModular/types';
import {
  COOMER_SERVICES, KEMONO_SERVICES, SERVICES,
  COOMER_API_BASE_URL, KEMONO_API_BASE_URL,
  COOMER_POSTS_API_BASE_URL, KEMONO_POSTS_API_BASE_URL,
  ITEMS_PER_PAGE, POSTS_PER_PAGE,
  CACHE_TIMESTAMP_KEY, CACHE_VERSION_KEY, CACHE_VERSION, CACHE_EXPIRY_MS,
  getCreatorImageUrl
} from '../components/ckModular/constants';
import { useNetworkStatus, useDebounce, useMasonryLayout } from '../components/ckModular/hooks';
import { favoritesManager, offlineSyncManager, DownloadService } from '../components/ckModular/services';
import { CompactCreatorCard, CompactPostGrid, GalleryViewer, MovieMode } from '../components/ckModular/components';

// --- ELECTRON APIS ---
declare global {
  interface Window {
    require: any;
  }
  interface ElectronAPI {
    showSaveDialog: (options: any) => Promise<any>;
    showOpenDialog: (options: any) => Promise<any>;
    openPath: (path: string) => Promise<void>;
    createDirectory: (path: string) => Promise<void>;
    downloadFile: (url: string, destination: string, onProgress?: (progress: number) => void) => Promise<void>;
    getAppPath: (name: string) => string;
    getPath: (name: string) => string;
  }
}

// --- STORAGE ---
const storage = createStorage({
  driver: indexedDbDriver({
    base: 'creators:',
    dbName: 'creators-db',
    storeName: 'creators-store'
  })
});

// --- COMPACT PROFILE VIEWER ---
const CompactProfileViewer = ({
  creator,
  isOpen,
  onClose
}: {
  creator: Creator | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostViewerOpen, setIsPostViewerOpen] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow'>('grid');
  const [gridColumns, setGridColumns] = useState(4);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostLiked'>('newest');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos'>('all');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);
  const [movieModeActive, setMovieModeActive] = useState(false);
  const [movieModeInfinite, setMovieModeInfinite] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSynced, setIsSynced] = useState(false);

  // Stable random values — computed once per creator, not on every render
  const stableFollowers = useRef(0);
  const stableLikes = useRef(0);
  const [followers, setFollowers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!creator) return;
    stableFollowers.current = Math.floor(Math.random() * 10000) + 1000;
    stableLikes.current = Math.floor(Math.random() * 1000) + 100;
    setFollowers(stableFollowers.current);
    setLikes(stableLikes.current);
  }, [creator?.id]);

  useEffect(() => {
    if (!creator) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const isCoomer = COOMER_SERVICES.includes(creator.service);
        const baseUrl = isCoomer ? COOMER_POSTS_API_BASE_URL : KEMONO_POSTS_API_BASE_URL;

        const profileResponse = await axios.get<Profile>(
          `${baseUrl}/${creator.service}/user/${creator.id}/profile`,
          { headers: { 'Accept': 'text/css' } }
        );
        setProfile(profileResponse.data);

        const syncedPosts = offlineSyncManager.getSyncedPosts(creator.id);
        if (syncedPosts.length > 0) {
          setPosts(syncedPosts);
          setIsSynced(true);
        } else {
          const postsResponse = await axios.get<Post[]>(
            `${baseUrl}/${creator.service}/user/${creator.id}/posts?o=0`,
            { headers: { 'Accept': 'text/css' } }
          );

          const transformedPosts: Post[] = postsResponse.data.map((post: any) => ({
            id: post.id,
            user: post.user || creator.id,
            service: creator.service,
            title: post.title || 'Untitled',
            content: post.content || '',
            published: post.published,
            file: post.file,
            attachments: post.attachments || []
          }));

          setPosts(transformedPosts);
          setHasMorePosts(transformedPosts.length === POSTS_PER_PAGE && profileResponse.data.post_count > POSTS_PER_PAGE);
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load creator data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [creator]);

  const loadMorePosts = useCallback(async () => {
    if (!creator || !hasMorePosts || loadingMore) return;
    setLoadingMore(true);
    try {
      const isCoomer = COOMER_SERVICES.includes(creator.service);
      const baseUrl = isCoomer ? COOMER_POSTS_API_BASE_URL : KEMONO_POSTS_API_BASE_URL;
      const offset = (currentPage + 1) * POSTS_PER_PAGE;

      const response = await axios.get<Post[]>(
        `${baseUrl}/${creator.service}/user/${creator.id}/posts?o=${offset}`,
        { headers: { 'Accept': 'text/css' } }
      );

      const transformedPosts: Post[] = response.data.map((post: any) => ({
        id: post.id,
        user: post.user || creator.id,
        service: creator.service,
        title: post.title || 'Untitled',
        content: post.content || '',
        published: post.published,
        file: post.file,
        attachments: post.attachments || []
      }));

      setPosts(prev => [...prev, ...transformedPosts]);
      setCurrentPage(prev => prev + 1);

      if (profile) {
        setHasMorePosts((currentPage + 2) * POSTS_PER_PAGE < profile.post_count);
      }
    } catch (error: any) {
      console.error('Failed to load more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  }, [creator, currentPage, hasMorePosts, loadingMore, profile]);

  const filteredPosts = useMemo(() => {
    let filtered = [...posts];
    const videoExts = ['.mp4', '.mov', '.avi', '.webm'];

    if (filterType === 'images') {
      filtered = filtered.filter(post =>
        !videoExts.some(ext => post.file?.name?.includes(ext)) &&
        !post.attachments?.some(att => videoExts.some(ext => att.name?.includes(ext)))
      );
    } else if (filterType === 'videos') {
      filtered = filtered.filter(post =>
        videoExts.some(ext => post.file?.name?.includes(ext)) ||
        post.attachments?.some(att => videoExts.some(ext => att.name?.includes(ext)))
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.published).getTime() - new Date(b.published).getTime());
        break;
      case 'mostLiked':
        // Use stable sort by published date as fallback — NOT Math.random()
        filtered.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
        break;
    }

    return filtered;
  }, [posts, filterType, sortBy]);

  const handlePostClick = useCallback((post: Post, index: number) => {
    if (showSelection) {
      const newSelectedPosts = new Set(selectedPosts);
      if (newSelectedPosts.has(post.id)) {
        newSelectedPosts.delete(post.id);
      } else {
        newSelectedPosts.add(post.id);
      }
      setSelectedPosts(newSelectedPosts);
    } else {
      setSelectedPost(post);
      setCurrentPostIndex(index);
      setIsPostViewerOpen(true);
    }
  }, [showSelection, selectedPosts]);

  const handleNextPost = useCallback(() => {
    if (currentPostIndex < filteredPosts.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
      setSelectedPost(filteredPosts[currentPostIndex + 1]);
    }
  }, [currentPostIndex, filteredPosts]);

  const handlePreviousPost = useCallback(() => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
      setSelectedPost(filteredPosts[currentPostIndex - 1]);
    }
  }, [currentPostIndex, filteredPosts]);

  const handleSelectAll = () => {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(post => post.id)));
    }
  };

  const handleDownloadSelected = async () => {
    const downloadService = DownloadService.getInstance();
    const selectedPostsList = filteredPosts.filter(post => selectedPosts.has(post.id));
    await downloadService.downloadPosts(selectedPostsList, creator?.service || '');
  };

  const handleSyncForOffline = async () => {
    if (!creator) return;
    setIsSyncing(true);
    setSyncProgress(0);
    try {
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) { clearInterval(interval); return 100; }
          return prev + 10;
        });
      }, 500);
      await offlineSyncManager.syncCreatorPosts(creator.id, posts);
      setIsSynced(true);
      toast('Posts synced for offline viewing');
    } catch (error) {
      console.error('Failed to sync posts:', error);
      toast.error('Failed to sync posts');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    setFollowers(prev => isFollowing ? prev - 1 : prev + 1);
    toast(isFollowing ? 'Unfollowed' : 'Following');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  if (!creator) return null;

  return (
    <>
      <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="absolute inset-0 bg-white dark:bg-gray-900 text-white overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <img
                    src={getCreatorImageUrl(creator.service, creator.id)}
                    alt={creator.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{creator.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {creator.service} • {profile?.post_count || 0} posts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleFollow} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isFollowing ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">{likes} likes • {followers} followers</span>
                <button onClick={() => setMovieModeActive(!movieModeActive)} className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors">
                  Movie Mode
                </button>
                <button onClick={onClose} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showSelection && (
                  <div className="flex items-center gap-2 mr-2">
                    <button onClick={handleSelectAll} className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedPosts.size === filteredPosts.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{selectedPosts.size} selected</span>
                    <button onClick={handleDownloadSelected} disabled={selectedPosts.size === 0} className="text-sm text-blue-600 dark:text-blue-400 disabled:text-gray-400">
                      Download
                    </button>
                  </div>
                )}

                <button onClick={() => setShowSelection(!showSelection)} className={`p-2 rounded ${showSelection ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  <Grid3X3 size={16} />
                </button>

                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                  <option value="all">All</option>
                  <option value="images">Images</option>
                  <option value="videos">Videos</option>
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="mostLiked">Most Liked</option>
                </select>

                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400 mr-1">Columns</span>
                  <input type="range" min="2" max="6" value={gridColumns} onChange={(e) => setGridColumns(parseInt(e.target.value))} className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">{gridColumns}</span>
                </div>

                <button onClick={handleSyncForOffline} disabled={isSyncing || isSynced}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors ${isSynced ? 'bg-green-600 text-white' : isSyncing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {isSyncing ? <>{syncProgress}%</> : isSynced ? 'Synced' : 'Sync Offline'}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No posts available</p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                {viewMode === 'grid' && (
                  <div className="p-4">
                    <CompactPostGrid
                      posts={filteredPosts}
                      onPostClick={handlePostClick}
                      service={creator.service}
                      selectedPosts={selectedPosts}
                      showSelection={showSelection}
                      gridColumns={gridColumns}
                      onLoadMore={hasMorePosts ? loadMorePosts : undefined}
                      hasMore={hasMorePosts}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isPostViewerOpen && selectedPost && (
        <GalleryViewer
          post={selectedPost}
          isOpen={isPostViewerOpen}
          onClose={() => setIsPostViewerOpen(false)}
          onNext={handleNextPost}
          onPrevious={handlePreviousPost}
          hasNext={currentPostIndex < filteredPosts.length - 1}
          hasPrevious={currentPostIndex > 0}
          currentIndex={currentPostIndex}
          totalCount={filteredPosts.length}
          service={creator.service}
        />
      )}

      {movieModeActive && (
        <MovieMode
          posts={filteredPosts}
          onClose={() => setMovieModeActive(false)}
          infiniteMode={movieModeInfinite}
          service={creator.service}
        />
      )}
    </>
  );
};

// --- MAIN ROUTE COMPONENT ---
function RouteComponent() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCreators, setTotalCreators] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isProfileViewerOpen, setIsProfileViewerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [gridColumns, setGridColumns] = useState(6);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchResults, setSearchResults] = useState<Creator[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [showPageInput, setShowPageInput] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'masonry'>('grid');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const isOnline = useNetworkStatus();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const creatorsRef = useRef(creators);
  creatorsRef.current = creators;

  const { containerRef, layout, measureItem } = useMasonryLayout(
    layoutMode === 'masonry' ? creators : [],
    gridColumns,
    8
  );

  const isCacheValid = useCallback(async () => {
    try {
      const cachedTimestamp = await storage.getItem(CACHE_TIMESTAMP_KEY) as string;
      const cacheVersion = await storage.getItem(CACHE_VERSION_KEY) as string;
      if (!cachedTimestamp || cacheVersion !== CACHE_VERSION) return false;
      const timestamp = new Date(cachedTimestamp);
      return Date.now() - timestamp.getTime() < CACHE_EXPIRY_MS;
    } catch { return false; }
  }, []);

  const fetchCreators = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      let allResults: Creator[] = [];
      let apiUrl = '';

      if (selectedService === 'all') {
        const [coomerRes, kemonoRes] = await Promise.all([
          axios.get<CreatorApiResponse>(`${COOMER_API_BASE_URL}?page=${page}&limit=${ITEMS_PER_PAGE}`, { headers: { 'Accept': 'text/css' } }),
          axios.get<CreatorApiResponse>(`${KEMONO_API_BASE_URL}?page=${page}&limit=${ITEMS_PER_PAGE}`, { headers: { 'Accept': 'text/css' } })
        ]);
        allResults = [...coomerRes.data.data, ...kemonoRes.data.data];
        const totalItems = (coomerRes.data.pagination?.totalItems || 0) + (kemonoRes.data.pagination?.totalItems || 0);
        setTotalPages(Math.ceil(totalItems / ITEMS_PER_PAGE));
        setTotalCreators(totalItems);
      } else if (selectedService === 'coomer' || selectedService === 'kemono') {
        apiUrl = selectedService === 'coomer' ? COOMER_API_BASE_URL : KEMONO_API_BASE_URL;
        const response = await axios.get<CreatorApiResponse>(
          `${apiUrl}?page=${page}&limit=${ITEMS_PER_PAGE}`,
          { headers: { 'Accept': 'text/css' } }
        );
        allResults = response.data.data;
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalCreators(response.data.pagination?.totalItems || 0);
      } else {
        const isCoomer = COOMER_SERVICES.includes(selectedService);
        apiUrl = isCoomer ? COOMER_API_BASE_URL : KEMONO_API_BASE_URL;
        const response = await axios.get<CreatorApiResponse>(
          `${apiUrl}/${selectedService}?page=${page}&limit=${ITEMS_PER_PAGE}`,
          { headers: { 'Accept': 'text/css' } }
        );
        allResults = response.data.data;
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalCreators(response.data.pagination?.totalItems || 0);
      }

      if (page === 1) {
        setCreators(allResults);
      } else {
        setCreators(prev => [...prev, ...allResults]);
      }
      setHasMore(allResults.length === ITEMS_PER_PAGE);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch creators:', error);
      toast.error('Failed to fetch creators');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedService]);

  const searchCreators = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }

    setSearchMode(true);
    setIsSearching(true);

    const abortController = new AbortController();

    try {
      let results: Creator[] = [];
      let apiUrl = '';

      if (!isOnline) {
        results = creatorsRef.current.filter(creator =>
          creator.name.toLowerCase().includes(term.toLowerCase())
        );
        setSearchResults(results);
        setIsSearching(false);
        return;
      }

      if (selectedService === 'all') {
        const [coomerRes, kemonoRes] = await Promise.all([
          axios.get<CreatorApiResponse>(`${COOMER_API_BASE_URL}?search=${encodeURIComponent(term)}`, { signal: abortController.signal, headers: { 'Accept': 'text/css' } }),
          axios.get<CreatorApiResponse>(`${KEMONO_API_BASE_URL}?search=${encodeURIComponent(term)}`, { signal: abortController.signal, headers: { 'Accept': 'text/css' } })
        ]);
        results = [...coomerRes.data.data, ...kemonoRes.data.data];
      } else if (selectedService === 'coomer' || selectedService === 'kemono') {
        apiUrl = selectedService === 'coomer' ? COOMER_API_BASE_URL : KEMONO_API_BASE_URL;
        const response = await axios.get<CreatorApiResponse>(`${apiUrl}?search=${encodeURIComponent(term)}`, { signal: abortController.signal, headers: { 'Accept': 'text/css' } });
        results = response.data.data;
      } else {
        const isCoomer = COOMER_SERVICES.includes(selectedService);
        apiUrl = isCoomer ? COOMER_API_BASE_URL : KEMONO_API_BASE_URL;
        const response = await axios.get<CreatorApiResponse>(`${apiUrl}/${selectedService}?search=${encodeURIComponent(term)}`, { signal: abortController.signal, headers: { 'Accept': 'text/css' } });
        results = response.data.data;
      }

      if (!abortController.signal.aborted) {
        setSearchResults(results);
      }
    } catch (error) {
      if (axios.isCancel(error) || (error as Error).name === 'AbortError') return;
      console.error('Search failed:', error);
      toast.error('Search failed. Showing cached results if available.');
      setSearchResults(creatorsRef.current.filter(creator =>
        creator.name.toLowerCase().includes(term.toLowerCase())
      ));
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [selectedService, isOnline]);

  const loadMoreCreators = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchCreators(nextPage);
  }, [currentPage, hasMore, loading, fetchCreators]);

  // Infinite scroll for creators
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreCreators(); },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => { if (loadMoreRef.current) observer.unobserve(loadMoreRef.current); };
  }, [hasMore, loadMoreCreators]);

  // Search when debounced search term changes
  useEffect(() => { searchCreators(debouncedSearchTerm); }, [debouncedSearchTerm, searchCreators]);

  useEffect(() => {
    setCurrentPage(1);
    setCreators([]);
    fetchCreators(1);
  }, [selectedService]);

  const filteredCreators = useMemo(() => {
    let filtered = searchMode ? searchResults : creators;
    if (showFavoritesOnly) {
      const favoriteIds = favoritesManager.getFavorites();
      filtered = filtered.filter(creator => favoriteIds.includes(creator.id));
    }
    return filtered;
  }, [creators, searchResults, searchMode, showFavoritesOnly]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    setCreators([]);
    fetchCreators(1);
  }, [fetchCreators]);

  const handleCreatorClick = useCallback((creator: Creator) => {
    setSelectedCreator(creator);
    setIsProfileViewerOpen(true);
  }, []);

  const handlePageJump = () => {
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setCreators([]);
      fetchCreators(page);
      setShowPageInput(false);
      setPageInput('');
    } else {
      toast.error('Invalid page number');
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col ${isDarkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">CreatorHub</h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {totalCreators > 0 && `${filteredCreators.length}/${totalCreators} creators`}
              {lastUpdated && <span className="ml-2">• Updated: {lastUpdated.toLocaleTimeString()}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {SERVICES.map((service) => (
                  <option key={service.value} value={service.value}>{service.label}</option>
                ))}
              </select>
              <button onClick={handleRefresh} disabled={refreshing || loading} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {refreshing || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </button>
              <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`p-1.5 rounded-lg transition-colors ${showFavoritesOnly ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                <Star className="h-4 w-4" />
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => {}} className="p-1.5 rounded-lg bg-blue-500 text-white">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
                <span className="text-xs text-gray-600 dark:text-gray-400 mr-1">Grid</span>
                <input type="range" min="3" max="8" value={gridColumns} onChange={(e) => setGridColumns(parseInt(e.target.value))} className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">{gridColumns}</span>
              </div>
              <button onClick={() => setLayoutMode(layoutMode === 'grid' ? 'masonry' : 'grid')} className={`p-1.5 rounded-lg ${layoutMode === 'masonry' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {layoutMode === 'masonry' ? <Layers className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {loading && creators.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading creators...</p>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || showFavoritesOnly || selectedService !== 'all' ? 'No creators found matching your search or filter.' : 'No creators available.'}
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              {layoutMode === 'grid' ? (
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                    contain: 'layout style paint'
                  }}
                >
                  {filteredCreators.map((creator, index) => (
                    <CompactCreatorCard
                      key={creator.id}
                      creator={creator}
                      onClick={() => handleCreatorClick(creator)}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div ref={containerRef} className="relative" style={{ height: `${layout.containerHeight}px` }}>
                  {filteredCreators.map((creator, index) => {
                    const position = layout.positions[index];
                    return (
                      <div
                        key={creator.id}
                        className="absolute"
                        style={{
                          top: `${position.top}px`,
                          left: `${position.left}px`,
                          width: `${position.width}px`,
                          height: `${position.height}px`,
                        }}
                      >
                        <CompactCreatorCard
                          creator={creator}
                          onClick={() => handleCreatorClick(creator)}
                          index={index}
                          onMeasure={measureItem}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex items-center gap-2">
          <button onClick={() => { if (currentPage > 1) { const p = currentPage - 1; setCurrentPage(p); setCreators([]); fetchCreators(p); } }} disabled={currentPage === 1} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setShowPageInput(true)} className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            {currentPage} / {totalPages}
          </button>
          <button onClick={() => { if (currentPage < totalPages) { const p = currentPage + 1; setCurrentPage(p); setCreators([]); fetchCreators(p); } }} disabled={currentPage === totalPages} className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Page Input Modal */}
      {showPageInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Go to Page</h3>
            <div className="flex gap-2">
              <input type="number" min="1" max={totalPages} value={pageInput} onChange={(e) => setPageInput(e.target.value)} className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={`1-${totalPages}`} autoFocus />
              <button onClick={handlePageJump} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Go</button>
              <button onClick={() => { setShowPageInput(false); setPageInput(''); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Status */}
      {!isOnline && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-40">
          <WifiOff size={16} />
          <span className="text-sm">You're offline. Showing cached content.</span>
        </div>
      )}

      <CompactProfileViewer
        creator={selectedCreator}
        isOpen={isProfileViewerOpen}
        onClose={() => setIsProfileViewerOpen(false)}
      />
    </div>
  );
}

export const Route = createFileRoute('/coomerKemono')({
  component: RouteComponent,
});