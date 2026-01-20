// CoomerKemono - Main Route - Glassmorphic Liquid Glass Edition
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Grid, Heart } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

// Components
import { Header } from '../components/coomerkemono/Header';
import { CreatorCard } from '../components/coomerkemono/CreatorCard';

// Hooks & API
import { useCoomerKemonoSettings, useCoomerKemonoFilter, useFavorites } from '../components/coomerkemono/hooks';
import * as api from '../components/coomerkemono/api';
import { Creator } from '../components/coomerkemono/types';

const CoomerKemonoRoute = () => {
  const { viewMode } = useCoomerKemonoSettings();
  const { query, service } = useCoomerKemonoFilter();
  const { favorites } = useFavorites();
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  // Filter by favorites
  const showFavoritesOnly = favorites.size > 0;

  // Fetch creators
  const {
    data: creatorsData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['coomerkemono-creators', service, query],
    queryFn: ({ pageParam = 1 }) =>
      api.fetchCreators({ service, page: pageParam, query }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  let creators = creatorsData?.pages.flatMap((page) => page.creators) || [];

  // Filter by favorites if any are selected
  if (showFavoritesOnly) {
    creators = creators.filter((c) => favorites.has(c.id));
  }

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

  const handleCreatorClick = useCallback((creator: Creator) => {
    setSelectedCreator(creator);
    // TODO: Open creator detail view
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
        border-color: rgba(249, 115, 22, 0.5);
        box-shadow: 0 4px 20px rgba(249, 115, 22, 0.2);
        outline: none;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
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
          {isLoading && creators.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
              <p className="text-white/60 text-sm font-medium">Loading creators...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-40">
              <p className="text-red-400 mb-4">Failed to load creators</p>
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

          {/* Creators Grid */}
          {!error && (
            <>
              {creators.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <Grid className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/40 text-sm">No creators found</p>
                </div>
              ) : (
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${viewMode.columns}, minmax(0, 1fr))`,
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    {creators.map((creator, index) => (
                      <CreatorCard
                        key={creator.id}
                        creator={creator}
                        index={index}
                        onCreatorClick={handleCreatorClick}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* Favorites Badge */}
          {favorites.size > 0 && (
            <div className="fixed bottom-4 right-4 liquid-button px-4 py-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span className="text-sm font-medium">{favorites.size} favorites</span>
            </div>
          )}

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-8">
            {hasNextPage && (
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            )}
          </div>

          {/* End of Content */}
          {!hasNextPage && creators.length > 0 && (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">You've reached the end</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/coomerKemono')({
  component: CoomerKemonoRoute,
});
