// RedGifs v2 - Main Route - Virtual Scrolling + CSS Animations
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, RefreshCw } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

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
      if (query) return api.searchGifs({ query, pageParam, gender });
      return api.fetchTrendingGifs({ pageParam, gender });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const gifs = gifsData?.pages.flatMap((page) => page.gifs) || [];
  const columns = viewMode.columns;

  // Group gifs into rows for the virtualizer
  const rows = useMemo(() => {
    const result: GifItem[][] = [];
    for (let i = 0; i < gifs.length; i += columns) {
      result.push(gifs.slice(i, i + columns));
    }
    return result;
  }, [gifs, columns]);

  // Virtual scrolling — only renders ~10-15 rows in DOM regardless of total count
  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0), // +1 for load-more sentinel
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 320, // Approximate row height (4/5 aspect ratio)
    overscan: 3,
  });

  // Fetch more when scrolling near bottom
  useEffect(() => {
    const lastItem = virtualizer.getVirtualItems().at(-1);
    if (!lastItem) return;
    if (lastItem.index >= rows.length - 1 && hasNextPage) {
      fetchNextPage();
    }
  }, [virtualizer.getVirtualItems(), hasNextPage, fetchNextPage, rows.length]);

  const handleGifClick = useCallback((gif: GifItem, index: number) => {
    setSelectedGifIndex(index);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => setIsModalOpen(false), []);
  const handleSortChange = useCallback(() => refetch(), [refetch]);

  return (
    <div className="h-screen flex flex-col bg-[var(--app-bg)] text-white overflow-hidden">
      <Header onSortChange={handleSortChange} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {isLoading && gifs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
              <p className="text-white/60 text-sm font-medium">Loading trending GIFs...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-40">
              <p className="text-red-400 mb-4">Failed to load GIFs</p>
              <button
                onClick={() => refetch()}
                className="liquid-button px-6 py-3 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
              >
                <RefreshCw size={16} />
                <span className="text-sm font-bold">Retry</span>
              </button>
            </div>
          )}

          {!error && gifs.length > 0 && (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
                contain: 'layout style paint',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                // Sentinel row for loading more
                if (virtualRow.index >= rows.length) {
                  return (
                    <div
                      key="load-more"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="flex justify-center items-center"
                    >
                      {hasNextPage && <Loader2 className="w-8 h-8 animate-spin text-pink-500" />}
                    </div>
                  );
                }

                const row = rows[virtualRow.index];
                return (
                  <div
                    key={virtualRow.index}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute' as const,
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                      gap: '1rem',
                      paddingBottom: '1rem',
                    }}
                  >
                    {row.map((gif, colIndex) => {
                      const globalIndex = virtualRow.index * columns + colIndex;
                      return (
                        <GifCard
                          key={gif.id}
                          gif={gif}
                          index={globalIndex}
                          onGifClick={handleGifClick}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {!hasNextPage && gifs.length > 0 && (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">You've reached the end</p>
            </div>
          )}
        </div>
      </div>

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
