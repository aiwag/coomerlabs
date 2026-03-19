// RedGifs - Niche Detail Page (niches/$nicheId)
import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, RefreshCw, ArrowLeft, Hash } from 'lucide-react';

import { GifCard } from '../components/redgifs/GifCard';
import { VideoPlayerModal } from '../components/redgifs/VideoPlayerModal';

import { useRedgifsSettings } from '../components/redgifs/hooks';
import * as api from '../components/redgifs/api';
import { GifItem } from '../components/redgifs/types';

const RedgifsNicheDetail = () => {
  const { nicheId } = Route.useParams();
  const { viewMode } = useRedgifsSettings();
  const [selectedGifIndex, setSelectedGifIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Shared hover video state
  const hoverVideoRef = useRef<HTMLVideoElement>(null);
  const [hoverGif, setHoverGif] = useState<GifItem | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleHover = useCallback((gif: GifItem, rect: DOMRect) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoverGif(gif);
      setHoverRect(rect);
    }, 300);
  }, []);

  const handleLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverGif(null);
    setHoverRect(null);
  }, []);

  useEffect(() => {
    if (hoverGif && hoverVideoRef.current) {
      hoverVideoRef.current.src = api.getGifUrl(hoverGif, 'sd');
      hoverVideoRef.current.play().catch(() => {});
    }
  }, [hoverGif]);

  const {
    data: gifsData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['redgifs-niche-gifs', nicheId],
    queryFn: ({ pageParam = 1 }) => api.fetchNicheGifs({ nicheId, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });

  const gifs = gifsData?.pages.flatMap((page) => page.gifs) || [];
  const columns = viewMode.columns;

  // Nice display name from slug
  const displayName = nicheId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const rows = useMemo(() => {
    const result: GifItem[][] = [];
    for (let i = 0; i < gifs.length; i += columns) {
      result.push(gifs.slice(i, i + columns));
    }
    return result;
  }, [gifs, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 280,
    overscan: 3,
  });

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Niche header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link
          to="/redgifs/niches"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} className="text-white/60" />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/30 to-violet-500/30 flex items-center justify-center shrink-0">
            <Hash size={14} className="text-white/70" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{displayName}</h2>
            <p className="text-[10px] text-white/40">
              {gifs.length > 0 ? `${gifs.length}+ GIFs loaded` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Gif grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isLoading && gifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
            <p className="text-white/60 text-sm font-medium">Loading {displayName} GIFs...</p>
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
                    gap: '1px',
                  }}
                >
                  {row.map((gif, colIndex) => {
                    const globalIndex = virtualRow.index * columns + colIndex;
                    return (
                      <div key={gif.id} style={{ aspectRatio: '4/5' }}>
                        <GifCard
                          gif={gif}
                          index={globalIndex}
                          onGifClick={handleGifClick}
                          onHover={handleHover}
                          onLeave={handleLeave}
                        />
                      </div>
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

        {!isLoading && !error && gifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40">
            <p className="text-white/40 text-sm">No GIFs found for {displayName}</p>
          </div>
        )}
      </div>

      {/* Shared hover video */}
      {hoverGif && hoverRect && scrollRef.current && (
        <video
          ref={hoverVideoRef}
          muted
          loop
          playsInline
          className="fixed pointer-events-none z-40 object-cover"
          style={{
            left: hoverRect.left,
            top: hoverRect.top,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        />
      )}

      <VideoPlayerModal
        gifs={gifs}
        currentIndex={selectedGifIndex}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export const Route = createFileRoute('/redgifs/niches_/$nicheId')({
  component: RedgifsNicheDetail,
});
