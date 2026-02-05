import { createFileRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useInView } from 'react-intersection-observer';
import { Toaster, toast } from 'react-hot-toast';
import Masonry from 'react-masonry-css';
import {
  Search,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  Minimize,
  Filter,
  ChevronDown,
  ArrowUp,
  Grid,
  Monitor,
  Settings2,
  Expand,
  ZoomIn,
  Heart,
  Bookmark,
} from 'lucide-react';

// ... (Types/API omitted for brevity in replace block, but need to be careful not to overwrite them if not included in start/end lines)
// Since I am replacing the TOP import specifically, I should just target line 3 for the import fix first to be safe,
// but the instruction says "Compact layout". I'll try to do it in one go if I can span it, but the file is large.
// Actually, I will target specific blocks.

// BLOCK 1: Fix imports
// BLOCK 2: Skeleton
// BLOCK 3: RouteComponent

// Let's do imports first.



// --- TYPES ---
interface Wallpaper {
  id: string;
  path: string;
  url: string;
  dimension_x: number;
  dimension_y: number;
  resolution: string;
  file_size: number;
  file_type?: string | null;
  category?: string | null;
  purity: string;
  ratio: string;
  source: string | null;
  views: number;
  favorites: number;
  created_at: string;
  thumbs: {
    small: string;
    original: string;
  };
  uploader?: {
    username?: string | null;
  } | null;
  tags?: Tag[] | null;
}

interface Tag {
  id: number;
  name: string;
  alias?: string | null;
  category?: string | null;
}

interface ApiResponse {
  data: Wallpaper[];
  meta: {
    current_page: number;
    last_page: number;
  };
}

interface FilterOptions {
  categories: {
    general: boolean;
    anime: boolean;
    people: boolean;
  };
  purity: {
    sfw: boolean;
    sketchy: boolean;
    nsfw: boolean;
  };
  sorting: 'toplist' | 'date_added' | 'relevance' | 'random' | 'views' | 'favorites';
  topRange: '1d' | '3d' | '1w' | '1M' | '3M' | '6M' | '1y';
  searchQuery: string;
}

// --- API Service ---
const API_KEY = 'EFkCFHGlTBVugFhK9SOI4F5GoQJTOW0W';
const BASE_URL = 'https://wallhaven.cc/api/v1/search';

type FetchParams = {
  pageParam?: number;
  signal?: AbortSignal;
  filters: FilterOptions;
};

const fetchWallpapers = async ({ pageParam = 1, signal, filters }: FetchParams): Promise<ApiResponse> => {
  const categoriesString =
    (filters.categories.general ? '1' : '0') +
    (filters.categories.anime ? '1' : '0') +
    (filters.categories.people ? '1' : '0');

  const purityString =
    (filters.purity.sfw ? '1' : '0') +
    (filters.purity.sketchy ? '1' : '0') +
    (filters.purity.nsfw ? '1' : '0');

  const params = new URLSearchParams({
    apikey: API_KEY,
    sorting: filters.sorting,
    categories: categoriesString,
    purity: purityString,
    topRange: filters.topRange,
    page: pageParam.toString(),
  });

  // Add search query if provided
  if (filters.searchQuery && filters.searchQuery.trim()) {
    params.append('q', filters.searchQuery.trim());
  }

  const response = await fetch(`${BASE_URL}?${params.toString()}`, { signal });

  if (response.status === 429) {
    toast.error('Rate limit exceeded. Please wait a moment.');
    throw new Error('Rate limit exceeded');
  }

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data: ApiResponse = await response.json();
  return data;
};

// --- COMPONENTS ---

// Scroll to Top Button
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollElement = document.getElementById('scroll-container');
      if (scrollElement && scrollElement.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const scrollElement = document.getElementById('scroll-container');
    scrollElement?.addEventListener('scroll', toggleVisibility);

    return () => scrollElement?.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const scrollElement = document.getElementById('scroll-container');
    scrollElement?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-40 p-3 rounded-full shadow-lg transition-all duration-300 liquid-button ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-16 pointer-events-none'
        }`}
    >
      <ArrowUp size={24} />
    </button>
  );
};

// Filter Panel Component with Glassmorphic Design
const FilterPanel = ({
  filters,
  setFilters,
  isOpen,
  setIsOpen
}: {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const handleCategoryToggle = (category: keyof FilterOptions['categories']) => {
    setFilters({
      ...filters,
      categories: {
        ...filters.categories,
        [category]: !filters.categories[category],
      },
    });
  };

  const handlePurityToggle = (purity: keyof FilterOptions['purity']) => {
    setFilters({
      ...filters,
      purity: {
        ...filters.purity,
        [purity]: !filters.purity[purity],
      },
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('.filter-panel')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative filter-panel">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors liquid-button"
      >
        <Filter size={18} />
        <span className="text-sm font-bold">Filters</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 glass-card p-4 z-50 shadow-2xl">
          {/* Categories */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white/80 mb-2 uppercase tracking-wider">Categories</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.categories.general}
                  onChange={() => handleCategoryToggle('general')}
                  className="w-4 h-4 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-white/70">General</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.categories.anime}
                  onChange={() => handleCategoryToggle('anime')}
                  className="w-4 h-4 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-white/70">Anime</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.categories.people}
                  onChange={() => handleCategoryToggle('people')}
                  className="w-4 h-4 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-white/70">People</span>
              </label>
            </div>
          </div>

          {/* Purity */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white/80 mb-2 uppercase tracking-wider">Content</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.purity.sfw}
                  onChange={() => handlePurityToggle('sfw')}
                  className="w-4 h-4 rounded focus:ring-green-500"
                />
                <span className="text-sm text-white/70">SFW</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Safe</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.purity.sketchy}
                  onChange={() => handlePurityToggle('sketchy')}
                  className="w-4 h-4 rounded focus:ring-yellow-500"
                />
                <span className="text-sm text-white/70">Sketchy</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Questionable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={filters.purity.nsfw}
                  onChange={() => handlePurityToggle('nsfw')}
                  className="w-4 h-4 rounded focus:ring-red-500"
                />
                <span className="text-sm text-white/70">NSFW</span>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Adult</span>
              </label>
            </div>
          </div>

          {/* Sorting */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white/80 mb-2 uppercase tracking-wider">Sort By</h3>
            <select
              value={filters.sorting}
              onChange={(e) => setFilters({ ...filters, sorting: e.target.value as FilterOptions['sorting'] })}
              className="w-full px-3 py-2 text-sm rounded-lg liquid-input text-white"
            >
              <option value="toplist">Top List</option>
              <option value="date_added">Date Added</option>
              <option value="relevance">Relevance</option>
              <option value="random">Random</option>
              <option value="views">Views</option>
              <option value="favorites">Favorites</option>
            </select>
          </div>

          {/* Time Range (only for toplist) */}
          {filters.sorting === 'toplist' && (
            <div>
              <h3 className="text-sm font-bold text-white/80 mb-2 uppercase tracking-wider">Time Range</h3>
              <select
                value={filters.topRange}
                onChange={(e) => setFilters({ ...filters, topRange: e.target.value as FilterOptions['topRange'] })}
                className="w-full px-3 py-2 text-sm rounded-lg liquid-input text-white"
              >
                <option value="1d">Last Day</option>
                <option value="3d">Last 3 Days</option>
                <option value="1w">Last Week</option>
                <option value="1M">Last Month</option>
                <option value="3M">Last 3 Months</option>
                <option value="6M">Last 6 Months</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Minimal Skeleton Loader
const ImageGridSkeleton = () => (
  <Masonry
    breakpointCols={{
      default: 8,
      1920: 8,
      1536: 6,
      1280: 4,
      1024: 3,
      768: 2,
    }}
    className="flex gap-2"
    columnClassName="flex flex-col gap-2"
  >
    {Array.from({ length: 24 }).map((_, index) => (
      <div key={index} className="group">
        <div className="aspect-[2/3] glass-card animate-pulse" />
        <div className="mt-2 space-y-2">
          <div className="h-4 bg-white/10 rounded animate-pulse" />
          <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
        </div>
      </div>
    ))}
  </Masonry>
);

// Light, fast Image Card with minimal effects
const ImageCard = React.memo(({
  wallpaper,
  onClick,
  onHover,
}: {
  wallpaper: Wallpaper;
  onClick: () => void;
  onHover: (wallpaper: Wallpaper | null) => void;
}) => {
  const uploaderName = wallpaper.uploader?.username ?? 'Anonymous';
  const thumbSrc = wallpaper.thumbs?.small ?? wallpaper.thumbs?.original ?? wallpaper.path;
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Calculate aspect ratio for masonry
  const aspectRatio = wallpaper.dimension_x && wallpaper.dimension_y
    ? wallpaper.dimension_y / wallpaper.dimension_x
    : 1.5;

  return (
    <div
      className="group relative block w-full bg-gray-900/50 overflow-hidden cursor-pointer hover:z-10"
      style={{
        paddingBottom: `${aspectRatio * 100}%`,
        contentVisibility: 'auto',
        containIntrinsicSize: `100% ${aspectRatio * 300}px`
      }}
      onClick={onClick}
      onMouseEnter={() => {
        onHover(wallpaper);
        setShowPreview(true);
      }}
      onMouseLeave={() => {
        onHover(null);
        setShowPreview(false);
      }}
    >
      {/* Hover Preview - Fixed Position */}
      {showPreview && (
        <div className="fixed bottom-4 right-4 z-50 w-64 bg-black/90 border border-white/10 p-2 shadow-2xl rounded-lg pointer-events-none">
          <img
            src={wallpaper.path}
            alt={`Preview ${wallpaper.id}`}
            className="w-full rounded"
          />
          <div className="mt-2 px-1">
            <p className="text-xs font-bold text-white">{wallpaper.resolution}</p>
            <div className="flex justify-between text-[10px] text-white/50 mt-1">
              <span>{uploaderName}</span>
              <span>{wallpaper.file_size ? (wallpaper.file_size / 1024 / 1024).toFixed(2) + ' MB' : ''}</span>
            </div>
          </div>
        </div>
      )}

      {!imageError ? (
        <img
          src={thumbSrc}
          alt={`Wallpaper by ${uploaderName}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-80"
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <span className="text-[10px] text-white/30">Error</span>
        </div>
      )}

      {/* Simplified Info Overlay - Only on Hover */}
      <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 translate-y-full group-hover:translate-y-0 transition-transform duration-150">
        <div className="flex justify-between items-center text-[10px] text-white font-mono">
          <span>{wallpaper.resolution}</span>
          <span>{Number(wallpaper.file_size / 1024).toFixed(0)}KB</span>
        </div>
      </div>

      {/* Purity Dot */}
      <div className={`absolute top-1 left-1 w-1.5 h-1.5 rounded-full ${wallpaper.purity === 'sfw' ? 'bg-green-500' :
        wallpaper.purity === 'sketchy' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
    </div>
  );
}, (prev, next) => prev.wallpaper.id === next.wallpaper.id);

// Enhanced Image Modal Component with glassmorphic design
const ImageModal = ({
  wallpaper,
  onClose,
  onPrev,
  onNext,
  onStartSlideshow,
  hasPrev,
  hasNext,
}: {
  wallpaper: Wallpaper;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onStartSlideshow: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const uploaderName = wallpaper.uploader?.username ?? 'Anonymous';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
      if (e.key === ' ') {
        e.preventDefault();
        onStartSlideshow();
      }
      if (e.key === 'f') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext, isFullscreen, onStartSlideshow]);

  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  useEffect(() => {
    setImageLoaded(false);
  }, [wallpaper.id]);

  return (
    <div
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-all duration-300 ${isFullscreen ? 'p-0' : 'bg-opacity-95 backdrop-blur-xl'
        }`}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`relative glass-card flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${isFullscreen ? 'w-full h-full rounded-none max-w-none max-h-none' : 'max-w-7xl max-h-[95vh] shadow-2xl'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <button
            onClick={onStartSlideshow}
            className="p-2 text-white rounded-full transition-colors bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
            title="Start Slideshow (Space)"
          >
            <Play size={20} />
          </button>
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-2 text-white rounded-full transition-colors bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white rounded-full transition-colors bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white rounded-full hover:scale-110 transition-all bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white rounded-full hover:scale-110 transition-all bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* Main Image Area */}
        <div className="flex-grow flex items-center justify-center bg-black relative overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={wallpaper.path}
            alt={`Wallpaper ${wallpaper.id}`}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            onLoad={handleImageLoad}
          />
        </div>

        {/* Info Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 p-6 overflow-y-auto flex-shrink-0 transition-all duration-300 custom-scrollbar ${isFullscreen ? 'hidden' : 'block'
            }`}
        >
          <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-3">
            Image Details
          </h2>

          <div className="space-y-4 text-sm text-white/70">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-white/50">Uploader</p>
                <p className="text-lg font-medium text-white">{uploaderName}</p>
              </div>
              <div>
                <p className="font-semibold text-white/50">Resolution</p>
                <p className="text-lg font-medium text-white">{wallpaper.resolution}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-white/50">Ratio</p>
                <p className="text-white">{wallpaper.ratio}</p>
              </div>
              <div>
                <p className="font-semibold text-white/50">Category</p>
                <p className="text-white">{wallpaper.category ?? '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-white/50">Favorites</p>
                <p className="text-white">{wallpaper.favorites.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-semibold text-white/50">Views</p>
                <p className="text-white">{wallpaper.views.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-white/50">File Type</p>
                <p className="text-white">{wallpaper.file_type ?? 'Unknown'}</p>
              </div>
              <div>
                <p className="font-semibold text-white/50">Purity</p>
                <p className="text-white capitalize">{wallpaper.purity}</p>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-8 mb-4 text-white">Tags</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {(wallpaper.tags ?? []).map((tag) => (
              <span
                key={tag.id}
                className="bg-cyan-500/20 text-cyan-400 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer hover:bg-cyan-500/30 transition-colors border border-cyan-500/30"
              >
                {tag.name}
              </span>
            ))}
            {(wallpaper.tags ?? []).length === 0 && (
              <span className="text-sm text-white/40">No tags</span>
            )}
          </div>

          <div className="space-y-3">
            <a
              href={wallpaper.path}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center px-4 py-3 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 liquid-button"
            >
              <Download size={18} className="mr-2" />
              Download Original
            </a>

            <button
              onClick={onStartSlideshow}
              className="w-full inline-flex items-center justify-center px-4 py-3 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 liquid-button"
            >
              <Play size={18} className="mr-2" />
              Start Slideshow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slideshow Component with glassmorphic design
const SlideshowModal = ({
  wallpapers,
  initialIndex,
  onClose,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  currentIndex,
}: {
  wallpapers: Wallpaper[];
  initialIndex: number;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        onTogglePlay();
      }
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onTogglePlay, onNext, onPrev]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  useEffect(() => {
    setImageLoaded(false);
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={onClose}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 text-white">
        <span className="text-sm bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
          {currentIndex + 1} / {wallpapers.length}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="p-3 text-white rounded-full transition-colors bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-3 text-white rounded-full transition-colors bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-4 text-white rounded-full hover:scale-110 transition-all bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-4 text-white rounded-full hover:scale-110 transition-all bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
      >
        <ChevronRight size={32} />
      </button>

      {/* Image */}
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={wallpapers[currentIndex].path}
          alt={`Slideshow image ${currentIndex + 1}`}
          className={`max-w-full max-h-screen object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          onLoad={handleImageLoad}
        />
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-50">
        <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
          <div
            className="bg-cyan-500 h-2 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${((currentIndex + 1) / wallpapers.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Main Component
function RouteComponent() {
  const { ref, inView } = useInView();
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(true);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const slideshowIntervalRef = useRef<number | null>(null);

  // New: Grid & View Controls
  const [gridColumns, setGridColumns] = useState(8); // Default to 8 for density
  const [cinemaMode, setCinemaMode] = useState(false); // Cinema mode
  const [hoveredWallpaper, setHoveredWallpaper] = useState<Wallpaper | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    categories: {
      general: false,
      anime: true,
      people: true,
    },
    purity: {
      sfw: true,
      sketchy: true,
      nsfw: true,
    },
    sorting: 'toplist',
    topRange: '1M',
    searchQuery: '',
  });

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch } = useInfiniteQuery({
    queryKey: ['wallpapers', filters],
    queryFn: ({ pageParam, signal }) => fetchWallpapers({ pageParam, signal, filters }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page ? lastPage.meta.current_page + 1 : undefined,
    initialPageParam: 1,
    retry: (failureCount, err: any) => (err?.name === 'AbortError' ? false : failureCount < 2),
    refetchOnWindowFocus: false,
  });

  // Reset active image when filters change
  useEffect(() => {
    setActiveImageIndex(null);
    setIsSlideshowActive(false);
  }, [filters]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const allWallpapers = data?.pages.flatMap((page) => page.data) ?? [];

  // Navigation handlers
  const handleNextImage = useCallback(() => {
    if (activeImageIndex !== null && activeImageIndex < allWallpapers.length - 1) {
      setActiveImageIndex(activeImageIndex + 1);
    }
  }, [activeImageIndex, allWallpapers.length]);

  const handlePrevImage = useCallback(() => {
    if (activeImageIndex !== null && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  }, [activeImageIndex]);

  // Slideshow handlers
  const startSlideshow = useCallback(() => {
    if (activeImageIndex === null) return;
    setIsSlideshowActive(true);
    setIsSlideshowPlaying(true);
  }, [activeImageIndex]);

  const stopSlideshow = useCallback(() => {
    setIsSlideshowActive(false);
    setIsSlideshowPlaying(false);
    if (slideshowIntervalRef.current) {
      clearInterval(slideshowIntervalRef.current);
      slideshowIntervalRef.current = null;
    }
  }, []);

  const toggleSlideshowPlay = useCallback(() => {
    setIsSlideshowPlaying((prev) => !prev);
  }, []);

  // Slideshow auto-advance
  useEffect(() => {
    if (isSlideshowActive && isSlideshowPlaying) {
      slideshowIntervalRef.current = window.setInterval(() => {
        setActiveImageIndex((prev) => {
          if (prev === null) return 0;
          return prev < allWallpapers.length - 1 ? prev + 1 : 0;
        });
      }, 3000);
    } else {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
        slideshowIntervalRef.current = null;
      }
    }

    return () => {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
        slideshowIntervalRef.current = null;
      }
    };
  }, [isSlideshowActive, isSlideshowPlaying, allWallpapers.length]);

  const handleSlideshowNext = useCallback(() => {
    setActiveImageIndex((prev) => {
      if (prev === null) return 0;
      return prev < allWallpapers.length - 1 ? prev + 1 : 0;
    });
  }, [allWallpapers.length]);

  const handleSlideshowPrev = useCallback(() => {
    setActiveImageIndex((prev) => {
      if (prev === null) return 0;
      return prev > 0 ? prev - 1 : allWallpapers.length - 1;
    });
  }, [allWallpapers.length]);

  // Keyboard shortcuts for cinema mode and grid size
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cinema mode toggle (C key)
      if (e.key === 'c' || e.key === 'C') {
        setCinemaMode((prev) => !prev);
      }
      // Grid size controls (+/- keys)
      if (e.key === '=' || e.key === '+') {
        setGridColumns((prev) => Math.min(12, prev + 1));
      }
      if (e.key === '-' || e.key === '_') {
        setGridColumns((prev) => Math.max(2, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden">
      {/* Super Compact Header */}
      <header className={`flex-shrink-0 sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${cinemaMode ? 'opacity-0 hover:opacity-100 -mt-12 scale-y-0 hover:mt-0 hover:scale-y-100' : ''}`}>
        <div className="w-full px-2 py-2 flex items-center justify-between gap-4">
          {/* Title & Cinema */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <h1 className="text-lg font-bold tracking-tight text-white hidden md:block">Wallhaven</h1>
            <button
              onClick={() => setCinemaMode(!cinemaMode)}
              className="p-1.5 text-white/70 hover:text-white transition-colors"
              title="Toggle Cinema Mode (C)"
            >
              <Monitor size={16} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-grow justify-end">
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }}
                placeholder="Search..."
                className="bg-white/5 border border-white/10 rounded-md pl-8 pr-8 py-1.5 w-full text-xs text-white focus:outline-none focus:border-cyan-500/50"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters({ ...filters, searchQuery: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Grid Size */}
            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/10">
              <Grid size={12} className="text-white/40" />
              <input
                type="range"
                min="2"
                max="12"
                value={gridColumns}
                onChange={(e) => setGridColumns(parseInt(e.target.value))}
                className="w-16 accent-cyan-500 h-1"
              />
            </div>

            {/* Slideshow */}
            {activeImageIndex !== null && (
              <button onClick={startSlideshow} className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white transition-colors" title="Slideshow">
                <Play size={14} />
              </button>
            )}

            {/* Filter Panel Toggle */}
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              isOpen={filterPanelOpen}
              setIsOpen={setFilterPanelOpen}
            />
          </div>
        </div>
      </header>

      <main id="scroll-container" className="flex-1 overflow-y-auto custom-scrollbar relative bg-black">
        <div className="w-full px-2 py-2">
          {/* Removed duplicate filter chips for compactness */}

          {status === 'pending' ? (
            <ImageGridSkeleton />
          ) : status === 'error' ? (
            <div className="text-center text-red-400 py-8">Error: {(error as any)?.message ?? 'Unknown error'}</div>
          ) : (
            <>
              <InfiniteScroll
                dataLength={allWallpapers.length}
                next={fetchNextPage}
                hasMore={!!hasNextPage}
                loader={<div className="h-20" />}
                scrollableTarget="scroll-container"
              >
                <Masonry
                  breakpointCols={{
                    default: gridColumns,
                    1920: gridColumns,
                    1536: Math.max(4, gridColumns - 1),
                    1280: Math.max(3, gridColumns - 2),
                    1024: Math.max(2, gridColumns - 3),
                    768: 2,
                  }}
                  className="flex gap-2"
                  columnClassName="flex flex-col gap-2"
                >
                  {allWallpapers.map((wallpaper, index) => (
                    <ImageCard
                      key={`${wallpaper.id}-${index}`}
                      wallpaper={wallpaper}
                      onClick={() => setActiveImageIndex(index)}
                      onHover={setHoveredWallpaper}
                    />
                  ))}
                </Masonry>
              </InfiniteScroll>

              {/* Fallback trigger */}
              <div ref={ref} className="h-10 w-full" />
            </>
          )}
        </div>
      </main>

      <ScrollToTopButton />

      {/* Modals */}
      {activeImageIndex !== null && !isSlideshowActive && (
        <ImageModal
          wallpaper={allWallpapers[activeImageIndex]}
          onClose={() => setActiveImageIndex(null)}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          onStartSlideshow={startSlideshow}
          hasPrev={activeImageIndex > 0}
          hasNext={activeImageIndex < allWallpapers.length - 1}
        />
      )}

      {isSlideshowActive && activeImageIndex !== null && (
        <SlideshowModal
          wallpapers={allWallpapers}
          initialIndex={activeImageIndex}
          onClose={stopSlideshow}
          isPlaying={isSlideshowPlaying}
          onTogglePlay={toggleSlideshowPlay}
          onNext={handleSlideshowNext}
          onPrev={handleSlideshowPrev}
          currentIndex={activeImageIndex}
        />
      )}
    </div>
  );
}

// --- TanStack Router and Query Client Setup ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

export const Route = createFileRoute('/wallheaven')({
  errorComponent: ({ error }) => (
    <div className="p-6 text-red-500">
      Oops! {(error as any)?.message ? String((error as any).message) : String(error)}
    </div>
  ),
  component: () => (
    <QueryClientProvider client={queryClient}>
      <RouteComponent />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </QueryClientProvider>
  ),
});
