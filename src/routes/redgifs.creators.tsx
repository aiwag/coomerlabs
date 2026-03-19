// RedGifs - Creators Tab — Gapless Picture Cards + Search & Filters
import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Users, Eye, Film, CheckCircle, Search, X, ChevronDown, TrendingUp, Clock, Star, Flame } from 'lucide-react';
import * as api from '../components/redgifs/api';
import { Creator } from '../components/redgifs/types';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const sortOptions = [
  { value: 'top28', label: 'Top 28 Days', icon: TrendingUp },
  { value: 'top7', label: 'Top 7 Days', icon: TrendingUp },
  { value: 'trending', label: 'Trending', icon: Flame },
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'followers', label: 'Followers', icon: Users },
  { value: 'views', label: 'Views', icon: Eye },
  { value: 'likes', label: 'Likes', icon: Star },
] as const;

const CreatorCard = React.memo(({ creator }: { creator: Creator }) => {
  const initial = (creator.username?.[0] ?? '?').toUpperCase();

  return (
    <Link
      to="/redgifs/users/$username"
      params={{ username: creator.username }}
      className="group relative overflow-hidden cursor-pointer block no-underline text-inherit h-full"
      style={{ backgroundColor: '#1a1a2e' }}
    >
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

      {creator.verified && (
        <div className="absolute top-1.5 left-1.5">
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-[7px] font-bold text-white uppercase">
            <CheckCircle size={8} /> Verified
          </div>
        </div>
      )}

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

      <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-pink-500/50 transition-all duration-200 pointer-events-none" />
    </Link>
  );
});

CreatorCard.displayName = 'CreatorCard';

const RedgifsCreators = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [order, setOrder] = useState('top28');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['redgifs-creators', order, debouncedQuery],
    queryFn: ({ pageParam = 1 }) => api.fetchCreators({
      pageParam,
      order,
      query: debouncedQuery || undefined,
    }),
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

  const currentSort = sortOptions.find(o => o.value === order) || sortOptions[0];

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto flex flex-col">
      {/* Search + Sort bar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-[var(--app-bg)]">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators..."
            className="liquid-input w-full pl-8 pr-7 py-1.5 text-xs text-white placeholder-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors"
          >
            {React.createElement(currentSort.icon, { size: 12, className: 'text-white/60' })}
            <span className="text-white/70 hidden sm:inline">{currentSort.label}</span>
            <ChevronDown size={10} className={`text-white/40 transition-transform duration-150 ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          <div className={`absolute top-full right-0 mt-1 w-36 bg-[#1a1a2e] rounded-lg border border-white/10 shadow-2xl z-50 overflow-hidden transition-all duration-150 origin-top-right ${
            showSortMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}>
            <div className="p-1">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => { setOrder(option.value); setShowSortMenu(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-all ${
                      order === option.value ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={12} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
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
            <p className="text-white/40 text-sm">
              {debouncedQuery ? `No creators found for "${debouncedQuery}"` : 'No creators found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute('/redgifs/creators')({
  component: RedgifsCreators,
});
