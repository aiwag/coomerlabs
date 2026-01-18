import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import Plyr from 'plyr';
import 'plyr-react/plyr.css';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  Grid,
  Heart,
  Loader2,
  Menu,
  Pause,
  Play,
  Search,
  Settings,
  Share,
  Star,
  TrendingUp,
  User,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  Eye,
  Users,
  Hash,
  Camera,
  Film,
  Image,
  RefreshCw,
  Bookmark,
  MoreVertical,
  Info,
  Home,
  ChevronDown,
  UserCheck,
  Zap,
  Sparkles,
  Crown,
  SkipBack,
  SkipForward,
  Sliders,
  PlayCircle,
  PauseCircle,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// API Endpoints
const API_BASE = 'https://api.redgifs.com/v2';
const AUTH_API = `${API_BASE}/auth/temporary`;
const TRENDS_API = `${API_BASE}/gifs/search?order=trending&count=50&type=g&verified=y`;
const CREATORS_API = `${API_BASE}/creators/search/previews?order=trending&page=1&count=30&verified=y`;
const NICHES_API = `${API_BASE}/niches/search/previews?order=subscribers&page=1&count=30`;

// Types
interface MediaItem {
  id: string;
  userName: string;
  urls: {
    thumbnail: string;
    sd: string;
    hd: string;
    poster: string;
    html: string;
    silent?: string;
  };
  type: number; // 1 for video, 2 for image
  duration?: number;
  hasAudio: boolean;
  likes: number;
  views: number;
  tags: string[];
  niches: string[] | Record<string, string>;
  avgColor: string;
  height: number;
  width: number;
  verified: boolean;
  description?: string;
  createDate?: number;
}

interface Creator {
  username: string;
  name: string;
  description: string | null;
  followers: number;
  gifs: number;
  profileImageUrl: string | null;
  profileUrl: string | null;
  url: string;
  verified: boolean;
  views: number;
  likes?: number;
  creationtime: number;
  status: string;
  subscription: number;
  studio: boolean;
  ageVerified: boolean;
  blockedTags: string[] | null;
  publishedGifs?: number;
}

interface Niche {
  id: string;
  name: string;
  description: string;
  cover: string | null;
  thumbnail: string;
  subscribers: number;
  gifs: number;
}

interface UserProfile {
  creationtime: number;
  description: string | null;
  followers: number;
  following: number;
  gifs: number;
  name: string;
  profileImageUrl: string | null;
  profileUrl: string | null;
  publishedCollections: number;
  publishedGifs: number;
  socialUrl1?: string;
  socialUrl2?: string;
  socialUrl3?: string;
  socialUrl4?: string;
  socialUrl5?: string;
  socialUrl6?: string;
  socialUrl7?: string;
  socialUrl8?: string;
  socialUrl9?: string;
  socialUrl10?: string;
  socialUrl11?: string;
  socialUrl12?: string;
  socialUrl13?: string;
  socialUrl14?: string;
  socialUrl15?: string;
  socialUrl16?: string;
  socialUrl17?: string;
  studio: boolean;
  subscription: number;
  url: string;
  username: string;
  verified: boolean;
  views: number;
}

interface ApiResponse {
  gifs?: MediaItem[];
  users?: Creator[];
  niches?: Niche[];
  tags?: string[];
  page: number;
  pages: number;
  total: number;
  items?: Creator[];
  cursor?: string;
}

interface AuthResponse {
  token: string;
  addr: string;
  agent: string;
  session: string;
  rtfm: string;
}

// Sort options
type SortOption = 'trending' | 'latest' | 'top7' | 'top28' | 'top365' | 'random';
type ContentType = 'all' | 'gifs' | 'images' | 'videos';
type SlideshowSpeed = 'slow' | 'medium' | 'fast';

// Auth context
interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = React.createContext<AuthContextType>({
  token: null,
  isAuthenticated: false,
  getAuthToken: async () => null,
});

// Auth provider component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const getAuthToken = useCallback(async () => {
    try {
      const response = await fetch(AUTH_API);
      if (!response.ok) throw new Error('Failed to get auth token');
      const data: AuthResponse = await response.json();
      setToken(data.token);
      setIsAuthenticated(true);
      return data.token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      setToken(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);
  
  useEffect(() => {
    getAuthToken();
  }, [getAuthToken]);
  
  return (
    <AuthContext.Provider value={{ token, isAuthenticated, getAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth
const useAuth = () => React.useContext(AuthContext);

// API fetch function with auth
const fetchWithAuth = async (url: string, token: string | null) => {
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'origin': 'https://www.redgifs.com',
      'referer': 'https://www.redgifs.com/',
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed');
    }
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  return response.json();
};

// Custom hooks for API calls with infinite scrolling
const useInfiniteContent = (
  endpoint: string, 
  aiFilter: boolean, 
  sortOption: SortOption = 'trending',
  contentType: ContentType = 'all'
) => {
  const { token, getAuthToken } = useAuth();
  
  return useInfiniteQuery<ApiResponse>({
    queryKey: [endpoint, aiFilter, sortOption, contentType],
    queryFn: async ({ pageParam = 1 }) => {
      let authToken = token;
      if (!authToken) {
        authToken = await getAuthToken();
      }
      
      let url = endpoint;
      if (endpoint.includes('?')) {
        url = `${endpoint}&page=${pageParam}`;
      } else {
        url = `${endpoint}?page=${pageParam}`;
      }
      
      // Add sort option if not already in URL
      if (!endpoint.includes('order=')) {
        url = url.includes('?') 
          ? `${url}&order=${sortOption}` 
          : `${url}?order=${sortOption}`;
      }
      
      // Add content type filter
      if (contentType !== 'all') {
        const typeMap = {
          'gifs': 'g',
          'images': 'i',
          'videos': 'v'
        };
        url = `${url}&type=${typeMap[contentType]}`;
      }
      
      return fetchWithAuth(url, authToken);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!token,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === 'Authentication failed' && failureCount < 1) {
        return true;
      }
      return false;
    },
    retryDelay: 1000,
  });
};

const useUserProfile = (username: string) => {
  const { token, getAuthToken } = useAuth();
  
  return useQuery<UserProfile>({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      let authToken = token;
      if (!authToken) {
        authToken = await getAuthToken();
      }
      
      // First get the user content to extract profile info
      const contentData = await fetchWithAuth(`${API_BASE}/users/${username}/search?order=new&count=1`, authToken);
      
      if (contentData.users && contentData.users.length > 0) {
        return contentData.users[0] as UserProfile;
      }
      
      throw new Error('User not found');
    },
    enabled: !!token && !!username,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === 'Authentication failed' && failureCount < 1) {
        return true;
      }
      return false;
    },
    retryDelay: 1000,
  });
};

const useSearch = (query: string, type: 'all' | 'creators' | 'gifs' | 'user' = 'all', aiFilter: boolean) => {
  const { token, getAuthToken } = useAuth();
  
  return useInfiniteQuery<ApiResponse>({
    queryKey: ['search', query, type, aiFilter],
    queryFn: async ({ pageParam = 1 }) => {
      let authToken = token;
      if (!authToken) {
        authToken = await getAuthToken();
      }
      
      let url = '';
      if (type === 'user') {
        // Direct user profile lookup
        url = `${API_BASE}/users/${query}/search?order=new&count=1`;
      } else if (type === 'creators') {
        url = `${API_BASE}/creators/search?search_text=${encodeURIComponent(query)}&page=${pageParam}&count=30`;
      } else if (type === 'gifs') {
        url = `${API_BASE}/gifs/search?search_text=${encodeURIComponent(query)}&page=${pageParam}&count=30`;
      } else {
        url = `${API_BASE}/gifs/search?search_text=${encodeURIComponent(query)}&page=${pageParam}&count=30`;
      }
      
      return fetchWithAuth(url, authToken);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!token && !!query,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === 'Authentication failed' && failureCount < 1) {
        return true;
      }
      return false;
    },
    retryDelay: 1000,
  });
};

// Compact Media Item Component
const MediaItem: React.FC<{
  item: MediaItem;
  quality: 'hd' | 'sd';
  onClick: () => void;
  onUserClick: (username: string) => void;
  isActive?: boolean;
  style?: React.CSSProperties;
  gridColumns: number;
  index: number;
  focusedIndex: number;
}> = ({ item, quality, onClick, onUserClick, isActive = false, style, gridColumns, index, focusedIndex }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  
  const mediaUrl = quality === 'hd' ? item.urls.hd : item.urls.sd;
  const isVideo = item.type === 1;
  
  // Calculate aspect ratio
  const aspectRatio = item.width && item.height ? item.width / item.height : 1;
  const itemHeight = gridColumns === 1 ? 400 : gridColumns === 2 ? 300 : 240;
  const itemWidth = itemHeight * aspectRatio;
  
  useEffect(() => {
    if (isVideo && videoRef.current && !isActive) {
      if (isHovered && !isPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true));
      } else if (!isHovered && isPlaying) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isHovered, isPlaying, isVideo, isActive]);
  
  useEffect(() => {
    if (isActive && isVideo && videoRef.current && !playerRef.current) {
      playerRef.current = new Plyr(videoRef.current, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        autoplay: true,
        muted: false,
        clickToPlay: true,
        hideControls: true,
        resetOnEnd: false,
        tooltips: { controls: true, seek: true },
        captions: { active: false, update: false, language: 'auto' },
        fullscreen: { enabled: true, fallback: true, iosNative: true },
        storage: { enabled: false },
      });
      
      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      };
    }
  }, [isActive, isVideo]);
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };
  
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };
  
  return (
    <div
      className={`relative overflow-hidden rounded cursor-pointer bg-gray-900 group transition-all duration-200 ${isActive ? 'ring-2 ring-blue-500 shadow-2xl' : 'hover:ring-1 hover:ring-gray-600'} ${focusedIndex === index ? 'ring-2 ring-purple-500' : ''}`}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          poster={item.urls.poster}
          className="w-full h-full object-cover"
          muted={!isActive}
          loop={!isActive}
          playsInline
        />
      ) : (
        <img
          src={mediaUrl}
          alt={item.id}
          className="w-full h-full object-cover"
        />
      )}
      
      {isHovered && !isActive && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-2 transition-opacity duration-200">
          <div className="flex items-center justify-between mb-1">
            <div className="text-white text-xs font-medium truncate flex items-center">
              {item.userName}
              {item.verified && <UserCheck className="h-3 w-3 ml-1 text-blue-400" />}
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-1.5 py-0.5 rounded transition-colors flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick(item.userName);
              }}
            >
              <User className="h-3 w-3 mr-1" />
              Profile
            </button>
          </div>
          <div className="flex justify-between text-white text-xs">
            <span className="flex items-center">
              <Heart className={`h-3 w-3 mr-1 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {item.likes}
            </span>
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {item.views}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <button
              className="text-white p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              onClick={handleLike}
            >
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              className="text-white p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              onClick={handleBookmark}
            >
              <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : ''}`} />
            </button>
            <button
              className="text-white p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // Implement share functionality
              }}
            >
              <Share className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
      
      {item.verified && (
        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5 z-10">
          <UserCheck className="h-3 w-3 text-white" />
        </div>
      )}
      
      {isVideo && (
        <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5 text-xs text-white flex items-center">
          {item.hasAudio ? <Volume2 className="h-3 w-3 mr-1" /> : <VolumeX className="h-3 w-3 mr-1" />}
          {item.duration && `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`}
        </div>
      )}
    </div>
  );
};

// Compact Creator Card Component
const CreatorCard: React.FC<{
  creator: Creator;
  onClick: () => void;
}> = ({ creator, onClick }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  
  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
  };
  
  return (
    <div 
      className="bg-gray-800 rounded overflow-hidden cursor-pointer hover:bg-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/50 group"
      onClick={onClick}
    >
      <div className="relative h-24">
        <img 
          src={creator.profileImageUrl || 'https://via.placeholder.com/300x200'} 
          alt={creator.username} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-1 left-1 right-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-white text-sm font-medium truncate">{creator.name}</h3>
              {creator.verified && <UserCheck className="h-3 w-3 text-blue-400 ml-1 flex-shrink-0" />}
            </div>
            <button
              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                isFollowing 
                  ? 'bg-gray-600 text-white hover:bg-gray-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
          <p className="text-gray-300 text-xs">@{creator.username}</p>
        </div>
      </div>
      <div className="p-2">
        <p className="text-gray-400 text-xs line-clamp-2 mb-1">{creator.description || 'No description'}</p>
        <div className="flex justify-between text-xs text-gray-400">
          <span className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {creator.followers.toLocaleString()}
          </span>
          <span className="flex items-center">
            <Camera className="h-3 w-3 mr-1" />
            {creator.gifs}
          </span>
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {creator.views.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Compact Niche Card Component
const NicheCard: React.FC<{
  niche: Niche;
  onClick: () => void;
}> = ({ niche, onClick }) => {
  return (
    <div 
      className="bg-gray-800 rounded overflow-hidden cursor-pointer hover:bg-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/50 group"
      onClick={onClick}
    >
      <div className="relative h-24">
        <img 
          src={niche.cover || 'https://via.placeholder.com/300x200'} 
          alt={niche.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-1 left-1">
          <h3 className="text-white text-sm font-medium flex items-center">
            <Hash className="h-3 w-3 mr-1" />
            {niche.name}
          </h3>
          <p className="text-gray-300 text-xs">{niche.subscribers.toLocaleString()} subscribers</p>
        </div>
      </div>
      <div className="p-2">
        <p className="text-gray-400 text-xs line-clamp-2">{niche.description}</p>
        <div className="mt-1 text-xs text-gray-500 flex items-center">
          <Film className="h-3 w-3 mr-1" />
          {niche.gifs.toLocaleString()} gifs
        </div>
      </div>
    </div>
  );
};

// Compact User Profile Component
const UserProfileComponent: React.FC<{
  username: string;
  onClose: () => void;
  onContentClick: (item: MediaItem, index: number) => void;
  aiFilter: boolean;
  gridColumns: number;
  quality: 'hd' | 'sd';
}> = ({ username, onClose, onContentClick, aiFilter, gridColumns, quality }) => {
  const userProfileQuery = useUserProfile(username);
  const userContentQuery = useInfiniteContent(
    `${API_BASE}/users/${username}/search?order=new&count=40`,
    aiFilter
  );
  
  const [sortOption, setSortOption] = useState<SortOption>('trending');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Refetch content when sort option or content type changes
  useEffect(() => {
    if (username) {
      userContentQuery.refetch();
    }
  }, [sortOption, contentType, username]);
  
  const userContentData = useMemo(() => {
    const allItems = userContentQuery.data?.pages.flatMap(page => page.gifs || []) || [];
    if (aiFilter) {
      return allItems.filter(item => 
        !item.tags.some(tag => tag.toLowerCase().includes('ai')) &&
        !item.description?.toLowerCase().includes('ai')
      );
    }
    return allItems;
  }, [userContentQuery.data, aiFilter]);
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };
  
  if (userProfileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  if (!userProfileQuery.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white">User not found</p>
      </div>
    );
  }
  
  const user = userProfileQuery.data;
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Compact User Profile Header */}
      <div className="bg-gray-800 p-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <button 
            className="bg-gray-700 rounded-full p-1.5 text-white hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <img 
            src={user.profileImageUrl || 'https://via.placeholder.com/100'} 
            alt={user.username} 
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-700"
          />
          
          <div className="flex-1">
            <div className="flex items-center">
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              {user.verified && (
                <UserCheck className="h-4 w-4 text-blue-500 ml-1" />
              )}
              {user.subscription > 0 && (
                <Crown className="h-4 w-4 text-yellow-500 ml-1" />
              )}
            </div>
            <p className="text-gray-400 text-xs">@{user.username}</p>
            <p className="text-gray-300 text-xs mt-1 line-clamp-1">{user.description}</p>
            
            <div className="flex space-x-4 mt-2 text-xs">
              <div>
                <span className="text-white font-medium">{user.followers.toLocaleString()}</span>
                <span className="text-gray-400 ml-1">followers</span>
              </div>
              <div>
                <span className="text-white font-medium">{user.publishedGifs || user.gifs}</span>
                <span className="text-gray-400 ml-1">gifs</span>
              </div>
              <div>
                <span className="text-white font-medium">{user.views.toLocaleString()}</span>
                <span className="text-gray-400 ml-1">views</span>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-2">
              <button
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  isFollowing 
                    ? 'bg-gray-600 text-white hover:bg-gray-500' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={handleFollow}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              
              {/* Social Links */}
              {user.socialUrl6 && (
                <a 
                  href={user.socialUrl6} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  OnlyFans
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Compact Sort and Filter Options */}
        <div className="flex space-x-3 mt-2">
          <div className="flex items-center space-x-1">
            <label className="text-gray-300 text-xs">Sort:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="new">Latest</option>
              <option value="trending">Trending</option>
              <option value="top7">This Week</option>
              <option value="top28">This Month</option>
              <option value="top365">This Year</option>
              <option value="random">Random</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-1">
            <label className="text-gray-300 text-xs">Type:</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="gifs">Gifs</option>
              <option value="videos">Videos</option>
              <option value="images">Images</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* User Content Grid */}
      <div className="flex-1 overflow-hidden">
        <MasonryGrid
          items={userContentData}
          quality={quality}
          onItemClick={onContentClick}
          onUserClick={() => {}}
          gridColumns={gridColumns}
          fetchNextPage={userContentQuery.fetchNextPage}
          hasNextPage={userContentQuery.hasNextPage}
          isFetchingNextPage={userContentQuery.isFetchingNextPage}
        />
      </div>
    </div>
  );
};

// Enhanced Media Modal with Slideshow
const MediaModal: React.FC<{
  item: MediaItem | null;
  quality: 'hd' | 'sd';
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onUserClick?: (username: string) => void;
  items?: MediaItem[];
  currentIndex?: number;
}> = ({ item, quality, onClose, onNext, onPrevious, onUserClick, items = [], currentIndex = 0 }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState<SlideshowSpeed>('medium');
  const [zoomLevel, setZoomLevel] = useState(1);
  const playerRef = useRef<Plyr | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const slideshowIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Slideshow effect
  useEffect(() => {
    if (isSlideshow && items.length > 0) {
      const speedMap = {
        'slow': 5000,
        'medium': 3000,
        'fast': 1500
      };
      
      slideshowIntervalRef.current = setInterval(() => {
        if (currentIndex < items.length - 1 && onNext) {
          onNext();
        } else if (currentIndex === items.length - 1) {
          // Stop slideshow at the end
          setIsSlideshow(false);
        }
      }, speedMap[slideshowSpeed]);
      
      return () => {
        if (slideshowIntervalRef.current) {
          clearInterval(slideshowIntervalRef.current);
        }
      };
    } else {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
      }
    }
  }, [isSlideshow, currentIndex, items.length, onNext, slideshowSpeed]);
  
  useEffect(() => {
    if (item && videoRef.current) {
      playerRef.current = new Plyr(videoRef.current, {
        controls: [
          'play-large', 
          'play', 
          'progress', 
          'current-time', 
          'mute', 
          'volume', 
          'captions', 
          'settings', 
          'pip', 
          'airplay', 
          'fullscreen'
        ],
        autoplay: true,
        muted: false,
        clickToPlay: true,
        hideControls: false,
        resetOnEnd: false,
        tooltips: { controls: true, seek: true },
        captions: { active: false, update: false, language: 'auto' },
        fullscreen: { enabled: true, fallback: true, iosNative: true },
        storage: { enabled: true },
        quality: { default: quality === 'hd' ? 720 : 480, options: [2160, 1440, 1080, 720, 480, 360] },
      });
      
      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      };
    }
  }, [item, quality]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious();
      } else if (e.key === 'f') {
        setIsFullscreen(!isFullscreen);
      } else if (e.key === 'i') {
        setShowInfo(!showInfo);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsSlideshow(!isSlideshow);
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel(prev => Math.min(prev + 0.25, 3));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
      } else if (e.key === '0') {
        setZoomLevel(1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious, isFullscreen, showInfo, isSlideshow]);
  
  const handleLike = () => {
    setIsLiked(!isLiked);
  };
  
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };
  
  const handleShare = () => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: `RedGifs - ${item?.userName}`,
        text: item?.description || 'Check out this content!',
        url: window.location.href
      });
    }
  };
  
  const handleDownload = () => {
    // Implement download functionality
    if (item) {
      const mediaUrl = quality === 'hd' ? item.urls.hd : item.urls.sd;
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = `${item.id}.${item.type === 1 ? 'mp4' : 'jpg'}`;
      link.click();
    }
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  
  if (!item) return null;
  
  const mediaUrl = quality === 'hd' ? item.urls.hd : item.urls.sd;
  const isVideo = item.type === 1;
  
  return (
    <div 
      ref={modalRef}
      className={`fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-2 ${isFullscreen ? 'p-0' : ''}`}
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full w-full h-full" onClick={(e) => e.stopPropagation()}>
        {/* Compact Top Controls */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-2 z-10 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button 
              className="bg-black/50 rounded-full p-1.5 text-white hover:bg-black/70 transition-all"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
              <Heart 
                className={`h-3 w-3 cursor-pointer ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                onClick={handleLike}
              />
              <Bookmark 
                className={`h-3 w-3 cursor-pointer ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} 
                onClick={handleBookmark}
              />
              <Share className="h-3 w-3 cursor-pointer text-white" onClick={handleShare} />
              <Download className="h-3 w-3 cursor-pointer text-white" onClick={handleDownload} />
            </div>
            
            {/* Slideshow Controls */}
            <div className="flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
              <button
                className={`text-white p-0.5 rounded-full ${isSlideshow ? 'bg-red-600' : ''}`}
                onClick={() => setIsSlideshow(!isSlideshow)}
              >
                {isSlideshow ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
              </button>
              
              {isSlideshow && (
                <select
                  value={slideshowSpeed}
                  onChange={(e) => setSlideshowSpeed(e.target.value as SlideshowSpeed)}
                  className="bg-transparent text-white text-xs outline-none"
                >
                  <option value="slow">Slow</option>
                  <option value="medium">Medium</option>
                  <option value="fast">Fast</option>
                </select>
              )}
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-black/50 rounded-full px-2 py-1">
              <button
                className="text-white p-0.5 rounded-full"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-3 w-3" />
              </button>
              <span className="text-white text-xs">{Math.round(zoomLevel * 100)}%</span>
              <button
                className="text-white p-0.5 rounded-full"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="h-3 w-3" />
              </button>
              <button
                className="text-white p-0.5 rounded-full"
                onClick={handleResetZoom}
                disabled={zoomLevel === 1}
              >
                <RotateCw className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="bg-black/50 rounded-full p-1.5 text-white hover:bg-black/70 transition-all"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="h-4 w-4" />
            </button>
            
            <button 
              className="bg-black/50 rounded-full p-1.5 text-white hover:bg-black/70 transition-all"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        {onPrevious && (
          <button 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 text-white z-10 hover:bg-black/70 transition-all"
            onClick={onPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        
        {onNext && (
          <button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 text-white z-10 hover:bg-black/70 transition-all"
            onClick={onNext}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        
        {/* Media Content with Zoom */}
        <div className="flex items-center justify-center h-full overflow-hidden">
          <div 
            className="relative transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {isVideo ? (
              <video
                ref={videoRef}
                src={mediaUrl}
                poster={item.urls.poster}
                className="max-w-full max-h-full object-contain"
                playsInline
              />
            ) : (
              <img
                src={mediaUrl}
                alt={item.id}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
        
        {/* Progress Indicator */}
        {items.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 z-10">
            <div className="flex items-center justify-center space-x-1">
              {items.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-200 ${
                    index === currentIndex ? 'bg-blue-500 w-8' : 'bg-gray-500 w-1'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Bottom Info Panel */}
        {showInfo && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-lg text-white flex items-center">
                  {item.userName}
                  {item.verified && <UserCheck className="h-4 w-4 text-blue-500 ml-1" />}
                </h3>
                {onUserClick && (
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-2 py-1 rounded transition-colors flex items-center"
                    onClick={() => onUserClick(item.userName)}
                  >
                    <User className="h-3 w-3 mr-1" />
                    View Profile
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  {item.likes}
                </span>
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {item.views}
                </span>
                {isVideo && (
                  <span className="flex items-center">
                    {item.hasAudio ? <Volume2 className="h-4 w-4 mr-1" /> : <VolumeX className="h-4 w-4 mr-1" />}
                    {item.duration && `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`}
                  </span>
                )}
              </div>
            </div>
            
            {item.description && (
              <p className="text-sm text-gray-300 mb-2">{item.description}</p>
            )}
            
            <div className="flex flex-wrap gap-1">
              {item.tags.map(tag => (
                <span key={tag} className="bg-gray-700 text-xs px-2 py-1 rounded text-gray-300">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Masonry Grid Component with Virtual Scrolling
const MasonryGrid: React.FC<{
  items: MediaItem[];
  quality: 'hd' | 'sd';
  onItemClick: (item: MediaItem, index: number) => void;
  onUserClick: (username: string) => void;
  activeIndex?: number;
  gridColumns: number;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}> = ({ 
  items, 
  quality, 
  onItemClick, 
  onUserClick,
  activeIndex, 
  gridColumns,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [columns, setColumns] = useState<MediaItem[][]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(items.length / gridColumns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250, // Estimated row height
    overscan: 5,
  });
  
  // Initialize columns
  useEffect(() => {
    const newColumns: MediaItem[][] = Array.from({ length: gridColumns }, () => []);
    const columnHeights = Array(gridColumns).fill(0);
    
    items.forEach(item => {
      const aspectRatio = item.width && item.height ? item.width / item.height : 1;
      const baseHeight = gridColumns === 1 ? 400 : gridColumns === 2 ? 300 : 240;
      const itemHeight = baseHeight / aspectRatio;
      
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      newColumns[shortestColumnIndex].push(item);
      columnHeights[shortestColumnIndex] += itemHeight + 4; // 4px gap
    });
    
    setColumns(newColumns);
  }, [items, gridColumns]);
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!fetchNextPage || !hasNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }
    
    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - gridColumns));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(items.length - 1, prev + gridColumns));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(items.length - 1, prev + 1));
      } else if (e.key === 'Enter' && items[focusedIndex]) {
        onItemClick(items[focusedIndex], focusedIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, items, gridColumns, onItemClick]);
  
  return (
    <div 
      ref={parentRef}
      className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 p-2"
      style={{ height: '100%' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * gridColumns;
          const endIndex = Math.min(startIndex + gridColumns, items.length);
          const rowItems = items.slice(startIndex, endIndex);
          
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex gap-1 h-full">
                {rowItems.map((item, index) => {
                  const globalIndex = startIndex + index;
                  const aspectRatio = item.width && item.height ? item.width / item.height : 1;
                  const baseHeight = gridColumns === 1 ? 400 : gridColumns === 2 ? 300 : 240;
                  const itemHeight = baseHeight / aspectRatio;
                  
                  return (
                    <div key={item.id} className="flex-1">
                      <MediaItem
                        item={item}
                        quality={quality}
                        onClick={() => onItemClick(item, globalIndex)}
                        onUserClick={onUserClick}
                        isActive={activeIndex === globalIndex}
                        style={{ height: `${itemHeight}px` }}
                        gridColumns={gridColumns}
                        index={globalIndex}
                        focusedIndex={focusedIndex}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {hasNextPage && (
        <div id="scroll-sentinel" className="flex justify-center py-2">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          )}
        </div>
      )}
    </div>
  );
};

// Compact Grid Settings Menu Component
const GridSettingsMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  gridColumns: number;
  setGridColumns: (columns: number) => void;
  aiFilter: boolean;
  setAiFilter: (filter: boolean) => void;
}> = ({ isOpen, onClose, gridColumns, setGridColumns, aiFilter, setAiFilter }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-full right-0 mt-1 w-56 bg-gray-800 rounded shadow-lg p-3 z-30">
      <h3 className="text-white font-medium mb-3 flex items-center text-sm">
        <Settings className="h-3 w-3 mr-2" />
        Grid Settings
      </h3>
      
      <div className="mb-3">
        <label className="text-gray-300 text-xs block mb-1">Columns</label>
        <input
          type="range"
          min="1"
          max="6"
          value={gridColumns}
          onChange={(e) => setGridColumns(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-gray-400 text-xs mt-1">
          <span>1</span>
          <span>{gridColumns}</span>
          <span>6</span>
        </div>
      </div>
      
      <div className="mb-3">
        <label className="flex items-center text-gray-300 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={aiFilter}
            onChange={(e) => setAiFilter(e.target.checked)}
            className="mr-2"
          />
          <Filter className="h-3 w-3 mr-1" />
          Filter AI Content
        </label>
      </div>
      
      <button
        onClick={onClose}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm transition-colors"
      >
        Close
      </button>
    </div>
  );
};

// Compact Search Component
const SearchComponent: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  aiFilter: boolean;
  onUserClick: (username: string) => void;
}> = ({ isOpen, onClose, aiFilter, onUserClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'creators' | 'gifs' | 'user'>('all');
  const searchQueryResult = useSearch(searchQuery, searchType, aiFilter);
  
  if (!isOpen) return null;
  
  const handleItemClick = (item: any) => {
    if (searchType === 'user' || item.username) {
      // Handle user profile click
      onUserClick(item.username);
    } else if (searchType === 'creators' || item.username) {
      // Handle creator click
      onUserClick(item.username);
    } else {
      // Handle media item click
      console.log('Media clicked:', item);
    }
    onClose();
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // If the search query looks like a username (contains underscore), search for user directly
      if (searchQuery.includes('_')) {
        setSearchType('user');
      }
    }
  };
  
  return (
    <div className="absolute top-full right-0 mt-1 w-80 bg-gray-800 rounded shadow-lg p-3 z-30">
      <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users, creators, or content..."
            className="w-full bg-gray-700 text-white pl-7 pr-2 py-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as any)}
          className="bg-gray-700 text-white px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="user">User Profile</option>
          <option value="creators">Creators</option>
          <option value="gifs">Gifs</option>
        </select>
      </form>
      
      {searchQuery && (
        <div className="max-h-80 overflow-y-auto">
          {searchQueryResult.data?.pages.flatMap(page => {
            if (searchType === 'user') {
              return page.users || [];
            } else if (searchType === 'creators') {
              return page.items || [];
            }
            return page.gifs || [];
          }).map((item: any) => (
            <div
              key={item.id || item.username}
              className="p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center space-x-2"
              onClick={() => handleItemClick(item)}
            >
              {item.profileImageUrl ? (
                <img
                  src={item.profileImageUrl}
                  alt={item.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <img
                  src={item.urls?.thumbnail}
                  alt={item.id}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <div className="text-white text-sm truncate flex items-center">
                  {item.name || item.userName}
                  {item.verified && <UserCheck className="h-3 w-3 text-blue-500 ml-1" />}
                </div>
                <div className="text-gray-400 text-xs">
                  {item.username ? `@${item.username}` : `${item.likes} likes`}
                </div>
              </div>
            </div>
          ))}
          
          {searchQueryResult.hasNextPage && (
            <button
              onClick={() => searchQueryResult.fetchNextPage()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded mt-2 text-sm transition-colors flex items-center justify-center"
            >
              {searchQueryResult.isFetchingNextPage ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Main App Component
const RedGifsApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trends' | 'creators' | 'niches' | 'search'>('trends');
  const [quality, setQuality] = useState<'hd' | 'sd'>('hd');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(-1);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(0);
  const [gridColumns, setGridColumns] = useState(4);
  const [aiFilter, setAiFilter] = useState(false);
  const [isGridSettingsOpen, setIsGridSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('trending');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  // API queries with infinite scrolling
  const trendsQuery = useInfiniteContent(TRENDS_API, aiFilter, sortOption, contentType);
  const creatorsQuery = useInfiniteContent(CREATORS_API, aiFilter, sortOption, contentType);
  const nichesQuery = useInfiniteContent(NICHES_API, aiFilter, sortOption, contentType);
  const userContentQuery = useInfiniteContent(
    `${API_BASE}/users/${selectedCreator}/search?order=new&count=40`,
    aiFilter,
    sortOption,
    contentType
  );
  const nicheContentQuery = useInfiniteContent(
    `${API_BASE}/niches/${selectedNiche}/gifs`,
    aiFilter,
    sortOption,
    contentType
  );
  
  // Flatten infinite query data and filter AI content
  const trendsData = useMemo(() => {
    const allItems = trendsQuery.data?.pages.flatMap(page => page.gifs || []) || [];
    if (aiFilter) {
      return allItems.filter(item => 
        !item.tags.some(tag => tag.toLowerCase().includes('ai')) &&
        !item.description?.toLowerCase().includes('ai')
      );
    }
    return allItems;
  }, [trendsQuery.data, aiFilter]);
  
  const creatorsData = useMemo(() => {
    const allItems = creatorsQuery.data?.pages.flatMap(page => page.gifs || []) || [];
    if (aiFilter) {
      return allItems.filter(item => 
        !item.tags.some(tag => tag.toLowerCase().includes('ai')) &&
        !item.description?.toLowerCase().includes('ai')
      );
    }
    return allItems;
  }, [creatorsQuery.data, aiFilter]);
  
  const nichesData = useMemo(() => {
    const allItems = nichesQuery.data?.pages.flatMap(page => page.gifs || []) || [];
    if (aiFilter) {
      return allItems.filter(item => 
        !item.tags.some(tag => tag.toLowerCase().includes('ai')) &&
        !item.description?.toLowerCase().includes('ai')
      );
    }
    return allItems;
  }, [nichesQuery.data, aiFilter]);
  
  const userContentData = useMemo(() => {
    const allItems = userContentQuery.data?.pages.flatMap(page => page.gifs || []) || [];
    if (aiFilter) {
      return allItems.filter(item => 
        !item.tags.some(tag => tag.toLowerCase().includes('ai')) &&
        !item.description?.toLowerCase().includes('ai')
      );
    }
    return allItems;
  }, [userContentQuery.data, aiFilter]);
  
  const nicheContentData = useMemo(() => {
    const allItems = nicheContentQuery.data?.pages.flatMap(page => page.gifs || []) || [];
    if (aiFilter) {
      return allItems.filter(item => 
        !item.tags.some(tag => tag.toLowerCase().includes('ai')) &&
        !item.description?.toLowerCase().includes('ai')
      );
    }
    return allItems;
  }, [nicheContentQuery.data, aiFilter]);
  
  // Determine which data to display
  let displayData: MediaItem[] = [];
  let isLoading = false;
  let hasNextPage = false;
  let fetchNextPage: (() => void) | undefined;
  let isFetchingNextPage = false;
  
  if (selectedCreator) {
    displayData = userContentData;
    isLoading = userContentQuery.isLoading;
    hasNextPage = userContentQuery.hasNextPage || false;
    fetchNextPage = userContentQuery.fetchNextPage;
    isFetchingNextPage = userContentQuery.isFetchingNextPage;
  } else if (selectedNiche) {
    displayData = nicheContentData;
    isLoading = nicheContentQuery.isLoading;
    hasNextPage = nicheContentQuery.hasNextPage || false;
    fetchNextPage = nicheContentQuery.fetchNextPage;
    isFetchingNextPage = nicheContentQuery.isFetchingNextPage;
  } else if (activeTab === 'trends') {
    displayData = trendsData;
    isLoading = trendsQuery.isLoading;
    hasNextPage = trendsQuery.hasNextPage || false;
    fetchNextPage = trendsQuery.fetchNextPage;
    isFetchingNextPage = trendsQuery.isFetchingNextPage;
  } else if (activeTab === 'creators') {
    displayData = creatorsData;
    isLoading = creatorsQuery.isLoading;
    hasNextPage = creatorsQuery.hasNextPage || false;
    fetchNextPage = creatorsQuery.fetchNextPage;
    isFetchingNextPage = creatorsQuery.isFetchingNextPage;
  } else if (activeTab === 'niches') {
    displayData = nichesData;
    isLoading = nichesQuery.isLoading;
    hasNextPage = nichesQuery.hasNextPage || false;
    fetchNextPage = nichesQuery.fetchNextPage;
    isFetchingNextPage = nichesQuery.isFetchingNextPage;
  }
  
  // Refetch data when sort option or content type changes
  useEffect(() => {
    if (activeTab === 'trends') {
      trendsQuery.refetch();
    } else if (activeTab === 'creators') {
      creatorsQuery.refetch();
    } else if (activeTab === 'niches') {
      nichesQuery.refetch();
    }
  }, [sortOption, contentType, activeTab]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedMedia) {
          setSelectedMedia(null);
        } else if (selectedCreator || selectedNiche) {
          setSelectedCreator(null);
          setSelectedNiche(null);
        } else if (isGridSettingsOpen) {
          setIsGridSettingsOpen(false);
        } else if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isSidebarOpen) {
          setIsSidebarOpen(false);
        }
      } else if (e.key === 'ArrowUp' && !selectedMedia) {
        e.preventDefault();
        setFocusedItemIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' && !selectedMedia) {
        e.preventDefault();
        setFocusedItemIndex(prev => Math.min(displayData.length - 1, prev + 1));
      } else if (e.key === 'Enter' && !selectedMedia && displayData[focusedItemIndex]) {
        handleMediaClick(displayData[focusedItemIndex], focusedItemIndex);
      } else if (e.key === '/' && !selectedMedia) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'm' && !selectedMedia) {
        setIsSidebarOpen(!isSidebarOpen);
      } else if (e.key === 'c' && !selectedMedia) {
        setCompactMode(!compactMode);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, selectedCreator, selectedNiche, displayData, focusedItemIndex, isGridSettingsOpen, isSearchOpen, isSidebarOpen, compactMode]);
  
  // Handle media item click
  const handleMediaClick = useCallback((item: MediaItem, index: number) => {
    setSelectedMedia(item);
    setCurrentMediaIndex(index);
    setFocusedItemIndex(index);
  }, []);
  
  // Handle creator click
  const handleCreatorClick = useCallback((creator: Creator) => {
    setSelectedCreator(creator.username);
    setSelectedNiche(null);
    setSelectedMedia(null); // Close any open media
    setFocusedItemIndex(0);
  }, []);
  
  // Handle niche click
  const handleNicheClick = useCallback((niche: Niche) => {
    setSelectedNiche(niche.id);
    setSelectedCreator(null);
    setSelectedMedia(null); // Close any open media
    setFocusedItemIndex(0);
  }, []);
  
  // Handle user profile click
  const handleUserProfileClick = useCallback((username: string) => {
    setSelectedCreator(username);
    setSelectedNiche(null);
    setSelectedMedia(null); // Close any open media
    setFocusedItemIndex(0);
  }, []);
  
  // Handle back navigation
  const handleBack = useCallback(() => {
    setSelectedCreator(null);
    setSelectedNiche(null);
    setSelectedMedia(null); // Close any open media
    setFocusedItemIndex(0);
  }, []);
  
  // Handle next/previous in modal
  const handleNextMedia = useCallback(() => {
    if (currentMediaIndex < displayData.length - 1) {
      const nextIndex = currentMediaIndex + 1;
      setSelectedMedia(displayData[nextIndex]);
      setCurrentMediaIndex(nextIndex);
      setFocusedItemIndex(nextIndex);
    }
  }, [currentMediaIndex, displayData]);
  
  const handlePreviousMedia = useCallback(() => {
    if (currentMediaIndex > 0) {
      const prevIndex = currentMediaIndex - 1;
      setSelectedMedia(displayData[prevIndex]);
      setCurrentMediaIndex(prevIndex);
      setFocusedItemIndex(prevIndex);
    }
  }, [currentMediaIndex, displayData]);
  
  // Render content based on view mode
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-white">Authenticating with RedGifs...</p>
          </div>
        </div>
      );
    }
    
    if (isLoading && displayData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      );
    }
    
    if (selectedCreator) {
      return (
        <UserProfileComponent
          username={selectedCreator}
          onClose={handleBack}
          onContentClick={handleMediaClick}
          aiFilter={aiFilter}
          gridColumns={gridColumns}
          quality={quality}
        />
      );
    }
    
    if (selectedNiche && nicheContentQuery.data) {
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="bg-gray-800 p-2 flex items-center shadow-lg">
            <button 
              className="mr-3 bg-gray-700 rounded-full p-1.5 text-white hover:bg-gray-600 transition-colors"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold text-white flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              {nicheContentQuery.data.pages[0]?.niches?.find(n => n.id === selectedNiche)?.name || selectedNiche}
            </h2>
          </div>
          
          <MasonryGrid
            items={displayData}
            quality={quality}
            onItemClick={handleMediaClick}
            onUserClick={handleUserProfileClick}
            activeIndex={currentMediaIndex}
            gridColumns={gridColumns}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      );
    }
    
    if (activeTab === 'trends') {
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="bg-gray-800 p-2 flex items-center justify-between shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </h2>
            
            {/* Compact Sort and Filter Options */}
            <div className="flex space-x-3">
              <div className="flex items-center space-x-1">
                <label className="text-gray-300 text-xs">Sort:</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="trending">Trending</option>
                  <option value="new">Latest</option>
                  <option value="top7">This Week</option>
                  <option value="top28">This Month</option>
                  <option value="top365">This Year</option>
                  <option value="random">Random</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-1">
                <label className="text-gray-300 text-xs">Type:</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="gifs">Gifs</option>
                  <option value="videos">Videos</option>
                  <option value="images">Images</option>
                </select>
              </div>
            </div>
          </div>
          
          <MasonryGrid
            items={displayData}
            quality={quality}
            onItemClick={handleMediaClick}
            onUserClick={handleUserProfileClick}
            activeIndex={currentMediaIndex}
            gridColumns={gridColumns}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      );
    }
    
    if (activeTab === 'creators') {
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="bg-gray-800 p-2 flex items-center justify-between shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Creators
            </h2>
            
            {/* Compact Sort Options */}
            <div className="flex space-x-3">
              <div className="flex items-center space-x-1">
                <label className="text-gray-300 text-xs">Sort:</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="trending">Trending</option>
                  <option value="new">Latest</option>
                  <option value="top7">This Week</option>
                  <option value="top28">This Month</option>
                  <option value="top365">This Year</option>
                  <option value="random">Random</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {creatorsQuery.data?.pages.flatMap(page => page.users || []).map(creator => (
                <CreatorCard
                  key={creator.username}
                  creator={creator}
                  onClick={() => handleCreatorClick(creator)}
                />
              ))}
            </div>
            
            {hasNextPage && (
              <div className="flex justify-center mt-3">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-sm transition-colors flex items-center"
                  onClick={() => fetchNextPage && fetchNextPage()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (activeTab === 'niches') {
      return (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="bg-gray-800 p-2 shadow-lg">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Niches
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 p-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {nichesQuery.data?.pages.flatMap(page => page.niches || []).map(niche => (
                <NicheCard
                  key={niche.id}
                  niche={niche}
                  onClick={() => handleNicheClick(niche)}
                />
              ))}
            </div>
            
            {hasNextPage && (
              <div className="flex justify-center mt-3">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-sm transition-colors flex items-center"
                  onClick={() => fetchNextPage && fetchNextPage()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-white overflow-hidden ${compactMode ? '' : ''}`}>
      {/* Compact Header */}
      <header className={`bg-gray-800 ${compactMode ? 'p-2' : 'p-4'} flex items-center justify-between shadow-lg z-20`}>
        <div className="flex items-center">
          <button 
            className="bg-gray-700 rounded-full p-1.5 text-white hover:bg-gray-600 transition-colors mr-3 md:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </button>
          
          <h1 className={`${compactMode ? 'text-lg' : 'text-2xl'} font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center`}>
            <Sparkles className={`${compactMode ? 'h-4 w-4' : 'h-6 w-6'} mr-2`} />
            RedGifs Viewer
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <button 
              className="bg-gray-700 rounded-full p-1.5 text-white hover:bg-gray-600 transition-colors"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-4 w-4" />
            </button>
            
            <SearchComponent
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              aiFilter={aiFilter}
              onUserClick={handleUserProfileClick}
            />
          </div>
          
          {/* Grid Settings */}
          <div className="relative">
            <button 
              className="bg-gray-700 rounded-full p-1.5 text-white hover:bg-gray-600 transition-colors"
              onClick={() => setIsGridSettingsOpen(!isGridSettingsOpen)}
            >
              <Grid className="h-4 w-4" />
            </button>
            
            <GridSettingsMenu
              isOpen={isGridSettingsOpen}
              onClose={() => setIsGridSettingsOpen(false)}
              gridColumns={gridColumns}
              setGridColumns={setGridColumns}
              aiFilter={aiFilter}
              setAiFilter={setAiFilter}
            />
          </div>
          
          {/* Quality Toggle */}
          <button 
            className="bg-gray-700 rounded-full px-2 py-1 text-white text-xs hover:bg-gray-600 transition-colors flex items-center"
            onClick={() => setQuality(quality === 'hd' ? 'sd' : 'hd')}
          >
            {quality === 'hd' ? (
              <>
                <Zap className="h-3 w-3 mr-1" />
                HD
              </>
            ) : (
              'SD'
            )}
          </button>
          
          {/* Compact Mode Toggle */}
          <button 
            className="bg-gray-700 rounded-full p-1.5 text-white hover:bg-gray-600 transition-colors"
            onClick={() => setCompactMode(!compactMode)}
            title={compactMode ? 'Expand Mode' : 'Compact Mode'}
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
      
      {/* Compact Navigation Bar */}
      <nav className={`bg-gray-800 ${compactMode ? 'p-1' : 'p-2'} flex items-center justify-around shadow-lg`}>
        <button 
          className={`p-1.5 rounded transition-colors flex items-center justify-center ${activeTab === 'trends' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => setActiveTab('trends')}
          title="Trending"
        >
          <TrendingUp className="h-4 w-4" />
        </button>
        
        <button 
          className={`p-1.5 rounded transition-colors flex items-center justify-center ${activeTab === 'creators' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => setActiveTab('creators')}
          title="Creators"
        >
          <Users className="h-4 w-4" />
        </button>
        
        <button 
          className={`p-1.5 rounded transition-colors flex items-center justify-center ${activeTab === 'niches' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => setActiveTab('niches')}
          title="Niches"
        >
          <Hash className="h-4 w-4" />
        </button>
      </nav>
      
      {/* Enhanced Media Modal with Slideshow */}
      <MediaModal
        item={selectedMedia}
        quality={quality}
        onClose={() => setSelectedMedia(null)}
        onNext={handleNextMedia}
        onPrevious={handlePreviousMedia}
        onUserClick={handleUserProfileClick}
        items={displayData}
        currentIndex={currentMediaIndex}
      />
    </div>
  );
};

// Route Component
function RouteComponent() {
  return (
    <AuthProvider>
      <RedGifsApp />
    </AuthProvider>
  );
}

export const Route = createFileRoute('/redgifs')({
  component: RouteComponent,
});

