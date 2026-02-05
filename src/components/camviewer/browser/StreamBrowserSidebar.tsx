import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  Search,
  X,
  AlertCircle,
  ArrowUp,
  SlidersHorizontal,
  Filter,
  Sparkles,
  Users,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useBrowserStore } from "@/state/browserStore";
import { useSettingsStore } from "@/state/settingsStore";
import { useGridStore } from "@/state/gridStore";
import { getUsernameFromUrl, generateThumbUrl } from "@/utils/formatters";
import { useDebounce } from "@/hooks/useDebounce";
import { StreamerCard, StreamerCardSkeleton } from "./StreamerCard";
import { FilterPanel } from "./FilterPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function StreamBrowserSidebar() {
  const { browserVisible, setBrowserVisible } = useSettingsStore();
  const {
    filteredStreamers,
    isLoading,
    error,
    fetchStreamers,
    setSearchTerm,
    searchTerm,
    executeSearch,
    setBrowseMode,
    browseMode,
    hasMore,
    cleanup,
    toggleFilterPanel,
    filters,
    sortBy,
    clearFilters,
    setFilters,
  } = useBrowserStore();

  const {
    streamUrls,
    favorites,
    playingStreams,
    removeStream,
    toggleFavorite,
    setFullViewMode,
  } = useGridStore();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const parentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const rowVirtualizer = useVirtualizer({
    count: hasMore ? filteredStreamers.length + 1 : filteredStreamers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 112,
    overscan: 5,
  });

  const handleScroll = () => {
    const element = parentRef.current;
    if (element) {
      setShowScrollTop(element.scrollTop > 300);
    }
  };

  useEffect(() => {
    if (browseMode !== 'active') {
      executeSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, executeSearch, browseMode]);

  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    if (!items.length) return;
    const last = items[items.length - 1];
    if (
      last &&
      last.index >= filteredStreamers.length - 1 &&
      hasMore &&
      !isLoading
    )
      fetchStreamers(true);
  }, [
    rowVirtualizer.getVirtualItems(),
    filteredStreamers.length,
    hasMore,
    isLoading,
    fetchStreamers,
  ]);

  useEffect(() => {
    const element = parentRef.current;
    element?.addEventListener("scroll", handleScroll);
    return () => element?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (filteredStreamers.length === 0) {
      fetchStreamers();
    }
    return () => {
      cleanup();
    };
  }, []);

  const hasActiveFilters =
    filters.minViewers > 0 ||
    filters.region !== "" ||
    filters.showNew ||
    filters.showVerified ||
    filters.gender !== "";

  const filteredActive = useMemo(() => {
    return streamUrls.map((url, index) => {
      const username = getUsernameFromUrl(url) || `stream-${index}`;
      return {
        url,
        username,
        thumb: generateThumbUrl(username),
        isFavorite: favorites.has(url),
        isPlaying: playingStreams.has(index),
        index
      };
    }).filter(s => s.username.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [streamUrls, favorites, playingStreams, searchTerm]);

  const scrollToTop = () => {
    rowVirtualizer.scrollToIndex(0);
    parentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const browseModes = [
    { mode: "mostViewed", label: "Most Viewed", icon: <Sparkles size={14} /> },
    { mode: "topRated", label: "Top Rated", icon: <Star size={14} /> },
    { mode: "trending", label: "Trending", icon: <TrendingUp size={14} /> },
    { mode: "active", label: "Playing", icon: <Users size={14} /> },
  ] as const;

  const genders = [
    { value: '', label: 'ALL' },
    { value: 'f', label: 'FEMALE' },
    { value: 'm', label: 'MALE' },
    { value: 'c', label: 'COUPLE' },
    { value: 't', label: 'TRANS' },
  ];

  return (
    <div className="flex h-full w-full flex-col glass-sidebar bg-transparent relative">
      <header className="flex flex-shrink-0 flex-col glass-header p-2 gap-2">
        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1">
          {browseModes.map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => setBrowseMode(mode as any)}
              className={`h-7 flex-1 text-[10px] font-bold rounded-md transition-all duration-300 ${browseMode === mode ? 'bg-white/15 text-white shadow-lg backdrop-blur-md' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {icon}
                <span>{label.toUpperCase()}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-black/10 rounded-lg p-0.5">
          {genders.map((g) => (
            <button
              key={g.value}
              onClick={() => setFilters({ gender: g.value as any })}
              className={`h-6 flex-1 text-[9px] font-black rounded transition-all ${filters.gender === g.value ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-neutral-600 hover:text-neutral-400'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-shrink-0 gap-2 glass-header bg-black/10 p-2.5">
        <div className="relative flex-grow group">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 group-focus-within:text-cyan-400 transition-colors"
            size={14}
          />
          <input
            type="text"
            placeholder="Search streamers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-white/5 py-2 pr-3 pl-9 text-xs text-white transition-all placeholder:text-neutral-600 focus:bg-white/10 focus:ring-1 focus:ring-white/20 focus:outline-none"
          />
        </div>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="icon"
          onClick={toggleFilterPanel}
          className={hasActiveFilters ? "bg-cyan-600 hover:bg-cyan-500" : ""}
        >
          <SlidersHorizontal size={16} />
        </Button>
      </div>

      <FilterPanel />

      {hasActiveFilters && (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-white/5 bg-black/20 px-3 py-2">
          <Badge variant="outline" className="text-[10px] h-5 bg-white/5 border-white/10">
            {filteredStreamers.length} RESULTS
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-5 text-[10px] text-neutral-500 hover:text-white"
          >
            CLEAR FILTERS
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center gap-2 border-b border-red-900/50 bg-red-900/30 p-3 text-center text-xs text-red-200">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div ref={parentRef} className="custom-scrollbar flex-1 overflow-y-auto">
        {browseMode === 'active' ? (
          <div className="p-2 space-y-2">
            {filteredActive.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
                <Users size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">No active streams found</p>
                {searchTerm && <p className="text-xs mt-1">Try a different search term</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredActive.map((stream) => (
                  <div
                    key={stream.index}
                    className="group relative flex cursor-pointer items-center gap-3 rounded-xl glass-card p-3 transition-all hover:bg-white/10 border-white/5 hover:border-white/20 active:scale-[0.98]"
                    onClick={() => setFullViewMode(stream.index)}
                  >
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-black/40 shadow-inner">
                      <img
                        src={stream.thumb}
                        alt={stream.username}
                        className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
                      />
                      <div
                        className={`absolute right-1 bottom-1 h-2.5 w-2.5 rounded-full border border-black/50 shadow-lg ${stream.isPlaying ? "bg-green-500" : "bg-neutral-600"}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-neutral-300 tracking-tight group-hover:text-white transition-colors">
                        {stream.username}
                      </p>
                      <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mt-0.5">Active</p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(stream.url); }}
                        className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-yellow-400 hover:bg-white/10"
                      >
                        <Star size={14} className={stream.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStream(stream.index); }}
                        className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-red-400 hover:bg-white/10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {isLoading &&
              filteredStreamers.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => (
                <StreamerCardSkeleton key={i} />
              ))}

            {rowVirtualizer.getVirtualItems().map((item) => {
              const isLoader = item.index > filteredStreamers.length - 1;
              const streamer = filteredStreamers[item.index];
              if (isLoader)
                return (
                  <div
                    key="loader"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${item.start}px)`,
                    }}
                    className="flex h-[112px] items-center justify-center"
                  >
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-cyan-500" />
                  </div>
                );
              if (!streamer) return null;
              return (
                <div
                  key={`${browseMode}-${streamer.username}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${item.start}px)`,
                  }}
                >
                  <StreamerCard streamer={streamer} />
                </div>
              );
            })}
          </div>
        )}

        {!hasMore && !isLoading && filteredStreamers.length > 0 && browseMode !== 'active' && (
          <div className="py-8 text-center text-[10px] text-neutral-600 uppercase font-black tracking-widest">
            End of results
          </div>
        )}
      </div>

      {showScrollTop && (
        <Button
          size="sm"
          className="absolute right-4 bottom-4 rounded-full bg-cyan-600 shadow-lg hover:bg-cyan-500 h-9 w-9 p-0"
          onClick={scrollToTop}
        >
          <ArrowUp size={18} />
        </Button>
      )}
    </div>
  );
}

const Star = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const TrendingUp = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
