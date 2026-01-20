// Wallheaven - Main Route - Glassmorphic Liquid Glass Edition
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

// Components
import { Header } from '../components/wallheaven/Header';
import { WallpaperCard } from '../components/wallheaven/WallpaperCard';

// Hooks & API
import { useWallheavenSettings, useWallheavenSearch } from '../components/wallheaven/hooks';
import * as api from '../components/wallheaven/api';
import { Wallpaper } from '../components/wallheaven/types';

const WallheavenRoute = () => {
  const { viewMode, purity } = useWallheavenSettings();
  const { query, sorting, categories } = useWallheavenSearch();
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);

  // Build filters object
  const filters = {
    query,
    sorting,
    categories,
    purity,
  };

  // Fetch wallpapers
  const {
    data: wallpapersData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['wallheaven-wallpapers', filters],
    queryFn: ({ pageParam = 1 }) => api.fetchWallpapers({ pageParam, filters }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const wallpapers = wallpapersData?.pages.flatMap((page) => page.wallpapers) || [];

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const handleWallpaperClick = useCallback((wallpaper: Wallpaper) => {
    setSelectedWallpaper(wallpaper);
    window.open(wallpaper.path, '_blank');
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Inject global styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .liquid-glass {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.1) 100%);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.18);
      }
      .liquid-glass-dark {
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(20, 20, 20, 0.2) 50%, rgba(0, 0, 0, 0.3) 100%);
        backdrop-filter: blur(40px) saturate(200%);
        -webkit-backdrop-filter: blur(40px) saturate(200%);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .liquid-card-dark {
        background: linear-gradient(135deg, rgba(40, 40, 50, 0.6) 0%, rgba(30, 30, 40, 0.4) 50%, rgba(20, 20, 30, 0.5) 100%);
        backdrop-filter: blur(50px) saturate(200%);
        -webkit-backdrop-filter: blur(50px) saturate(200%);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .liquid-card-dark:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        border-color: rgba(255, 255, 255, 0.2);
      }
      .liquid-button {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .liquid-input {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
        backdrop-filter: blur(30px) saturate(180%);
        -webkit-backdrop-filter: blur(30px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .liquid-input:focus {
        border-color: rgba(34, 197, 94, 0.5);
        box-shadow: 0 4px 20px rgba(34, 197, 94, 0.2);
        outline: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <Header onRefresh={handleRefresh} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {/* Loading State */}
          {isLoading && wallpapers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-4" />
              <p className="text-white/60 text-sm font-medium">Loading wallpapers...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-40">
              <p className="text-red-400 mb-4">Failed to load wallpapers</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => refetch()}
                className="liquid-button px-6 py-3 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                <span className="text-sm font-bold">Retry</span>
              </motion.button>
            </div>
          )}

          {/* Wallpaper Grid */}
          {!error && (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${viewMode.columns}, minmax(0, 1fr))`,
              }}
            >
              <AnimatePresence mode="popLayout">
                {wallpapers.map((wallpaper, index) => (
                  <WallpaperCard
                    key={wallpaper.id}
                    wallpaper={wallpaper}
                    index={index}
                    onWallpaperClick={handleWallpaperClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-8">
            {hasNextPage && (
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              </div>
            )}
          </div>

          {/* End of Content */}
          {!hasNextPage && wallpapers.length > 0 && (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">You've reached the end</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/wallheaven')({
  component: WallheavenRoute,
});
