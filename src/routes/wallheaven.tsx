import { createFileRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useInView } from 'react-intersection-observer';
import { Toaster, toast } from 'react-hot-toast';
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
} from 'lucide-react';

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
      className={`fixed bottom-8 right-8 z-40 p-3 rounded-full shadow-lg transition-all duration-300 liquid-button ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-16 pointer-events-none'
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

// Enhanced Skeleton Loader with glassmorphic design
const ImageGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
    {Array.from({ length: 24 }).map((_, index) => (
      <div key={index} className="group">
        <div className="aspect-[2/3] glass-card animate-pulse" />
        <div className="mt-2 space-y-2">
          <div className="h-4 bg-white/10 rounded animate-pulse" />
          <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// Enhanced Image Card Component with glassmorphic design
const ImageCard = ({
  wallpaper,
  onClick,
}: {
  wallpaper: Wallpaper;
  onClick: () => void;
}) => {
  const uploaderName = wallpaper.uploader?.username ?? 'Anonymous';
  const thumbSrc = wallpaper.thumbs?.small ?? wallpaper.thumbs?.original ?? wallpaper.path;
  const [imageError, setImageError] = useState(false);

  const purityColors = {
    sfw: 'bg-green-500',
    sketchy: 'bg-yellow-500',
    nsfw: 'bg-red-500',
  };

  return (
    <div
      className="group relative block w-full aspect-[2/3] glass-card overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:z-10"
      onClick={onClick}
    >
      {/* Purity Indicator */}
      <div className={`absolute top-2 left-2 w-2 h-2 rounded-full z-10 ${purityColors[wallpaper.purity as keyof typeof purityColors]} shadow-sm`} />

      {!imageError ? (
        <img
          src={thumbSrc}
          alt={`Wallpaper by ${uploaderName}`}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/40">
          <span className="text-white/40">Failed to load</span>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <div className="text-white">
          <p className="text-sm font-semibold truncate">{wallpaper.resolution}</p>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="flex items-center">❤️ {wallpaper.favorites.toLocaleString()}</span>
            <span className="flex items-center">👁️ {wallpaper.views.toLocaleString()}</span>
          </div>
          <p className="text-xs mt-1 truncate">by {uploaderName}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          className="p-1.5 rounded-full text-white transition-colors bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
          onClick={(e) => {
            e.stopPropagation();
            window.open(wallpaper.path, '_blank');
          }}
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

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
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isFullscreen ? 'p-0' : 'bg-opacity-95 backdrop-blur-xl'
      }`}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`relative glass-card flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none max-w-none max-h-none' : 'max-w-7xl max-h-[95vh] shadow-2xl'
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
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
          />
        </div>

        {/* Info Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 p-6 overflow-y-auto flex-shrink-0 transition-all duration-300 custom-scrollbar ${
            isFullscreen ? 'hidden' : 'block'
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
          className={`max-w-full max-h-screen object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
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

  return (
    <div className="h-screen w-screen flex flex-col bg-black">
      <header className="flex-shrink-0 sticky top-0 z-40 glass-header">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Wallhaven Explorer</h1>
          <div className="flex items-center gap-4">
            {activeImageIndex !== null && (
              <button
                onClick={startSlideshow}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors liquid-button"
              >
                <Play size={18} />
                <span className="font-bold">Slideshow</span>
              </button>
            )}
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              isOpen={filterPanelOpen}
              setIsOpen={setFilterPanelOpen}
            />
          </div>
        </div>
      </header>

      <main id="scroll-container" className="flex-1 overflow-y-auto custom-scrollbar" style={{ height: 'calc(100vh - 73px)' }}>
        <div className="container mx-auto px-4 py-4">
          {/* Active filters display */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(filters.categories).filter(([_, v]) => v).map(([key]) => (
              <span key={key} className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full capitalize border border-cyan-500/30">
                {key}
              </span>
            ))}
            {Object.entries(filters.purity).filter(([_, v]) => v).map(([key]) => (
              <span key={key} className={`px-3 py-1 text-sm rounded-full capitalize border ${
                key === 'sfw' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                key === 'sketchy' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border-red-500/30'
              }`}>
                {key}
              </span>
            ))}
          </div>

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
                loader={<ImageGridSkeleton />}
                scrollableTarget="scroll-container "
                endMessage={
                  <p className="text-center text-white/40 my-8 py-4">
                    🎉 You've seen all the amazing wallpapers!
                  </p>
                }
              >
                <div className="grid grid-cols-2 overflow-hidden sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                  {allWallpapers.map((wallpaper, index) => (
                    <ImageCard
                      key={`${wallpaper.id}-${index}`}
                      wallpaper={wallpaper}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              </InfiniteScroll>

              {/* Infinite scroll trigger for fallback */}
              <div ref={ref} className="h-1" />
            </>
          )}
        </div>
      </main>

      {/* Scroll to Top Button */}
      <ScrollToTopButton />

      {/* Image Modal */}
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

      {/* Slideshow Modal */}
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
