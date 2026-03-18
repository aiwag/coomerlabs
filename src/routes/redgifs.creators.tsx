// RedGifs - Creators Tab — Gapless Picture Cards
import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Users, Eye, Film, CheckCircle } from 'lucide-react';
import * as api from '../components/redgifs/api';
import { Creator } from '../components/redgifs/types';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const CreatorCard = React.memo(({ creator }: { creator: Creator }) => {
  const initial = (creator.username?.[0] ?? '?').toUpperCase();

  return (
    <Link
      to="/redgifs/users/$username"
      params={{ username: creator.username }}
      className="group relative overflow-hidden cursor-pointer block no-underline text-inherit h-full"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      {/* Profile image / avatar fills the card */}
      {creator.profileImageUrl ? (
        <img
          src={creator.profileImageUrl}
          alt={creator.username}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-rose-500/10">
          <span className="text-4xl font-black text-white/20">{initial}</span>
        </div>
      )}

      {/* Verified badge */}
      {creator.verified && (
        <div className="absolute top-1.5 left-1.5">
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-[7px] font-bold text-white uppercase">
            <CheckCircle size={8} /> Verified
          </div>
        </div>
      )}

      {/* Bottom overlay — name + stats */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <p className="text-xs font-bold text-white truncate leading-tight">@{creator.username}</p>
        {creator.name && creator.name !== creator.username && (
          <p className="text-[8px] text-white/40 truncate">{creator.name}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-white/50">
          <span className="flex items-center gap-0.5"><Users size={8} />{formatNumber(creator.followers)}</span>
          <span className="flex items-center gap-0.5"><Eye size={8} />{formatNumber(creator.views)}</span>
          <span className="flex items-center gap-0.5 ml-auto"><Film size={8} />{formatNumber(creator.gifs)}</span>
        </div>
      </div>

      {/* Hover ring */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-pink-500/50 transition-all duration-200 pointer-events-none" />
    </Link>
  );
});

CreatorCard.displayName = 'CreatorCard';

const RedgifsCreators = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['redgifs-creators'],
    queryFn: ({ pageParam = 1 }) => api.fetchCreators({ pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });

  const creators = data?.pages.flatMap((page) => page.creators) || [];

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {isLoading && creators.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
          <p className="text-white/60 text-sm font-medium">Loading creators...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-400 mb-4">Failed to load creators</p>
          <button
            onClick={() => refetch()}
            className="liquid-button px-6 py-3 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
          >
            <RefreshCw size={16} />
            <span className="text-sm font-bold">Retry</span>
          </button>
        </div>
      )}

      {!error && creators.length > 0 && (
        <>
          {/* Gapless grid — 1px gaps like GifCard grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1px',
            }}
          >
            {creators.map((creator: Creator) => (
              <div key={creator.username} style={{ aspectRatio: '3/4' }}>
                <CreatorCard creator={creator} />
              </div>
            ))}
          </div>

          <div ref={sentinelRef} className="py-8 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            )}
            {!hasNextPage && creators.length > 0 && (
              <p className="text-white/40 text-sm">You've reached the end</p>
            )}
          </div>
        </>
      )}

      {!isLoading && !error && creators.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40">
          <Users size={48} className="text-white/10 mb-4" />
          <p className="text-white/40 text-sm">No creators found</p>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute('/redgifs/creators')({
  component: RedgifsCreators,
});
