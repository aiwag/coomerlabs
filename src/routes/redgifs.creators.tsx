// RedGifs - Creators Tab
import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Users, Eye, Heart, Film, CheckCircle } from 'lucide-react';
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
      className="block group relative overflow-hidden rounded-xl border border-white/5 hover:border-pink-500/30 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 cursor-pointer p-4 no-underline text-inherit"
    >
      {/* Profile */}
      <div className="flex items-center gap-3 mb-3">
        {creator.profileImageUrl ? (
          <img
            src={creator.profileImageUrl}
            alt={creator.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-pink-500/40 transition-colors"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center text-lg font-bold text-white/80 border-2 border-white/10 group-hover:border-pink-500/40 transition-colors">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white truncate">{creator.username}</p>
            {creator.verified && (
              <CheckCircle size={12} className="text-cyan-400 shrink-0" />
            )}
          </div>
          {creator.name && creator.name !== creator.username && (
            <p className="text-[10px] text-white/40 truncate">{creator.name}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="py-1.5 rounded-lg bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/40 mb-0.5">
            <Users size={9} />
          </div>
          <p className="text-[10px] font-bold text-white/70">{formatNumber(creator.followers)}</p>
        </div>
        <div className="py-1.5 rounded-lg bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/40 mb-0.5">
            <Eye size={9} />
          </div>
          <p className="text-[10px] font-bold text-white/70">{formatNumber(creator.views)}</p>
        </div>
        <div className="py-1.5 rounded-lg bg-white/5">
          <div className="flex items-center justify-center gap-1 text-white/40 mb-0.5">
            <Film size={9} />
          </div>
          <p className="text-[10px] font-bold text-white/70">{formatNumber(creator.gifs)}</p>
        </div>
      </div>
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

  // Infinite scroll via IntersectionObserver
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
    <div ref={scrollRef} className="h-full overflow-y-auto custom-scrollbar">
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
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {creators.map((creator) => (
              <CreatorCard key={creator.username} creator={creator} />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="py-8 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            )}
            {!hasNextPage && creators.length > 0 && (
              <p className="text-white/40 text-sm">You've reached the end</p>
            )}
          </div>
        </div>
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
