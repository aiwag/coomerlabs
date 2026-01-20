// RedGifs v2 - Main Route - Glassmorphic Liquid Glass Edition
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

// Components
import { Header } from '../components/redgifs/Header';
import { GifCard } from '../components/redgifs/GifCard';
import { VideoPlayerModal } from '../components/redgifs/VideoPlayerModal';

// Hooks & API
import { useRedgifsSettings, useRedgifsSearch } from '../components/redgifs/hooks';
import * as api from '../components/redgifs/api';
import { GifItem } from '../components/redgifs/types';

const RedgifsRoute = () => {
  const { viewMode, sortBy } = useRedgifsSettings();
  const { query, gender } = useRedgifsSearch();
  const [selectedGifIndex, setSelectedGifIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch GIFs
  const {
    data: gifsData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['redgifs-gifs', sortBy, query, gender],
    queryFn: ({ pageParam = 1 }) => {
      if (query) {
        return api.searchGifs({ query, pageParam, gender });
      }
      return api.fetchTrendingGifs({ pageParam, gender });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const gifs = gifsData?.pages.flatMap((page) => page.gifs) || [];

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

  const handleGifClick = useCallback((gif: GifItem, index: number) => {
    setSelectedGifIndex(index);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSortChange = useCallback(() => {
    refetch();
  }, [refetch]);

  // Inject global styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .liquid-glass {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.1) 0%,
          rgba(255, 255, 255, 0.05) 50%,
          rgba(255, 255, 255, 0.1) 100%
        );
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.18);
      }
      .liquid-glass-dark {
        background: linear-gradient(
          135deg,
          rgba(0, 0, 0, 0.3) 0%,
          rgba(20, 20, 20, 0.2) 50%,
          rgba(0, 0, 0, 0.3) 100%
        );
        backdrop-filter: blur(40px) saturate(200%);
        -webkit-backdrop-filter: blur(40px) saturate(200%);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .liquid-card-dark {
        background: linear-gradient(
          135deg,
          rgba(40, 40, 50, 0.6) 0%,
          rgba(30, 30, 40, 0.4) 50%,
          rgba(20, 20, 30, 0.5) 100%
        );
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
      .liquid-modal {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.25) 0%,
          rgba(255, 255, 255, 0.15) 50%,
          rgba(255, 255, 255, 0.1) 100%
        );
        backdrop-filter: blur(50px) saturate(200%);
        -webkit-backdrop-filter: blur(50px) saturate(200%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 32px;
      }
      .liquid-button {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.2) 0%,
          rgba(255, 255, 255, 0.1) 100%
        );
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .liquid-input {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.15) 0%,
          rgba(255, 255, 255, 0.08) 100%
        );
        backdrop-filter: blur(30px) saturate(180%);
        -webkit-backdrop-filter: blur(30px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .liquid-input:focus {
        border-color: rgba(236, 72, 153, 0.5);
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.2);
        outline: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <Header onSortChange={handleSortChange} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {/* Loading State */}
          {isLoading && gifs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
              <p className="text-white/60 text-sm font-medium">Loading trending GIFs...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-40">
              <p className="text-red-400 mb-4">Failed to load GIFs</p>
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

          {/* GIF Grid */}
          {!error && (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${viewMode.columns}, minmax(0, 1fr))`,
              }}
            >
              <AnimatePresence mode="popLayout">
                {gifs.map((gif, index) => (
                  <GifCard
                    key={gif.id}
                    gif={gif}
                    index={index}
                    onGifClick={handleGifClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-8">
            {hasNextPage && (
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            )}
          </div>

          {/* End of Content */}
          {!hasNextPage && gifs.length > 0 && (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">You've reached the end</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        gifs={gifs}
        currentIndex={selectedGifIndex}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export const Route = createFileRoute('/redgifs')({
  component: RedgifsRoute,
});
