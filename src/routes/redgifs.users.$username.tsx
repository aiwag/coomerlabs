// RedGifs - Creator Profile Page (users/$username)
import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, RefreshCw, ArrowLeft, ExternalLink, Heart, AlertTriangle } from 'lucide-react';

import { GifCard } from '../components/redgifs/GifCard';
import { VideoPlayerModal } from '../components/redgifs/VideoPlayerModal';

import { useRedgifsSettings, useRedgifsFavorites } from '../components/redgifs/hooks';
import * as api from '../components/redgifs/api';
import { GifItem } from '../components/redgifs/types';

const FollowButton = ({ username }: { username: string }) => {
  const { isFollowed, toggleFollow } = useRedgifsFavorites();
  const followed = isFollowed(username);

  return (
    <button
      onClick={() => toggleFollow(username)}
      className={`p-1.5 rounded-lg transition-all ${
        followed
          ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-pink-400'
      }`}
      title={followed ? 'Unfollow' : 'Follow'}
    >
      <Heart size={14} className={followed ? 'fill-current' : ''} />
    </button>
  );
};

const RedgifsUserProfile = () => {
  const { username } = Route.useParams();
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
    queryKey: ['redgifs-user-gifs', username],
    queryFn: ({ pageParam = 1 }) => api.fetchUserGifs({ username, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Retry on 429 rate limits up to 3 times
      if (error?.response?.status === 429 && failureCount < 3) return true;
      return false;
    },
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 15000),
  });

  const gifs = gifsData?.pages.flatMap((page) => page.gifs) || [];
  const columns = viewMode.columns;

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
      {/* Profile header */}
      <div className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link
          to="/redgifs/creators"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={16} className="text-white/60" />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/40 to-rose-500/40 flex items-center justify-center text-sm font-bold text-white/80 shrink-0">
            {(username?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">@{username}</h2>
            <p className="text-[10px] text-white/40">
              {gifs.length > 0 ? `${gifs.length}+ GIFs loaded` : 'Loading...'}
            </p>
          </div>
        </div>

        <FollowButton username={username} />

        <a
          href={`https://www.redgifs.com/users/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
          title="Open on RedGifs"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Gif grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isLoading && gifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
            <p className="text-white/60 text-sm font-medium">Loading @{username}'s GIFs...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-40">
            <AlertTriangle size={32} className="text-amber-400/60 mb-3" />
            <p className="text-red-400 mb-1 text-sm font-bold">
              {(error as any)?.response?.status === 429
                ? 'Rate limited by RedGifs'
                : 'Failed to load GIFs'}
            </p>
            <p className="text-white/30 text-xs mb-4">
              {(error as any)?.response?.status === 429
                ? 'Too many requests — wait a moment and retry'
                : 'Check your connection and try again'}
            </p>
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
            <p className="text-white/40 text-sm">No GIFs found for @{username}</p>
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

export const Route = createFileRoute('/redgifs/users/$username')({
  component: RedgifsUserProfile,
});
