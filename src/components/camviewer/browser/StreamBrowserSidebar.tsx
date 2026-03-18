import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  Search,
  X,
  AlertCircle,
  ArrowUp,
  SlidersHorizontal,
  Sparkles,
  Users,
  TrendingUp,
  Star,
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const COLS = 3;

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

  // Grid virtualizer — each row has COLS items
  const rowCount = Math.ceil(
    (hasMore ? filteredStreamers.length + COLS : filteredStreamers.length) / COLS
  );

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160, // ~160px per row for 3:4 aspect with small gaps
    overscan: 3,
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
    const lastItemIndex = (last.index + 1) * COLS - 1;
    if (lastItemIndex >= filteredStreamers.length - 1 && hasMore && !isLoading) {
      fetchStreamers(true);
    }
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
    return () => { cleanup(); };
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
    { mode: "mostViewed", icon: <Sparkles size={14} />, label: "Most Viewed" },
    { mode: "topRated", icon: <Star size={14} />, label: "Top Rated" },
    { mode: "trending", icon: <TrendingUp size={14} />, label: "Trending" },
    { mode: "active", icon: <Users size={14} />, label: "Playing" },
  ] as const;

  const genders = [
    { value: '', label: 'All' },
    { value: 'f', label: 'F' },
    { value: 'm', label: 'M' },
    { value: 'c', label: 'C' },
    { value: 't', label: 'T' },
  ];

  return (
    <div className="flex h-full w-full flex-col glass-sidebar bg-transparent relative">
      <header className="flex flex-shrink-0 flex-col glass-header p-1.5 gap-1.5">
        {/* Icon-only mode tabs */}
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5">
            {browseModes.map(({ mode, icon, label }) => (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setBrowseMode(mode as any)}
                    className={`h-7 flex-1 flex items-center justify-center rounded-md transition-all duration-300 ${browseMode === mode ? 'bg-white/15 text-white shadow-lg backdrop-blur-md' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    {icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {/* Compact gender pills */}
        <div className="flex items-center gap-0.5 bg-black/10 rounded-lg p-0.5">
          {genders.map((g) => (
            <button
              key={g.value}
              onClick={() => setFilters({ gender: g.value as any })}
              className={`h-5 flex-1 text-[9px] font-black rounded transition-all ${filters.gender === g.value ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-neutral-600 hover:text-neutral-400'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </header>

      {/* Compact search bar */}
      <div className="flex flex-shrink-0 gap-1.5 glass-header bg-black/10 px-1.5 py-1.5">
        <div className="relative flex-grow group">
          <Search
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-neutral-500 group-focus-within:text-cyan-400 transition-colors"
            size={12}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/5 bg-white/5 py-1.5 pr-2 pl-7 text-[11px] text-white transition-all placeholder:text-neutral-600 focus:bg-white/10 focus:ring-1 focus:ring-white/20 focus:outline-none"
          />
        </div>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="icon"
          onClick={toggleFilterPanel}
          className={`h-7 w-7 ${hasActiveFilters ? "bg-cyan-600 hover:bg-cyan-500" : ""}`}
        >
          <SlidersHorizontal size={12} />
        </Button>
      </div>

      <FilterPanel />

      {hasActiveFilters && (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-white/5 bg-black/20 px-2 py-1">
          <Badge variant="outline" className="text-[9px] h-4 bg-white/5 border-white/10">
            {filteredStreamers.length}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-4 text-[9px] text-neutral-500 hover:text-white px-1"
          >
            CLEAR
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center gap-2 border-b border-red-900/50 bg-red-900/30 p-2 text-center text-[10px] text-red-200">
          <AlertCircle size={12} />
          <span className="truncate">{error}</span>
        </div>
      )}

      <div ref={parentRef} className="custom-scrollbar flex-1 overflow-y-auto">
        {browseMode === 'active' ? (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {filteredActive.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-20 text-neutral-600">
                <Users size={36} className="mb-3 opacity-20" />
                <p className="text-xs font-medium">No active streams</p>
              </div>
            ) : (
              filteredActive.map((stream) => (
                <div
                  key={stream.index}
                  className="group relative aspect-[3/4] overflow-hidden rounded-lg cursor-pointer bg-black/40"
                  onClick={() => setFullViewMode(stream.index)}
                >
                  <img
                    src={stream.thumb}
                    alt={stream.username}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[9px] font-bold text-white truncate">{stream.username}</p>
                  </div>
                  <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(stream.url); }}
                      className="p-1 rounded bg-black/50 text-white/70 hover:text-yellow-400"
                    >
                      <Star size={10} className={stream.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeStream(stream.index); }}
                      className="p-1 rounded bg-black/50 text-white/70 hover:text-red-400"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))
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
              filteredStreamers.length === 0 && (
                <div className="grid grid-cols-3 gap-0.5 p-0.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <StreamerCardSkeleton key={i} />
                  ))}
                </div>
              )}

            {rowVirtualizer.getVirtualItems().map((row) => {
              const startIdx = row.index * COLS;
              const streamersInRow = [];
              for (let c = 0; c < COLS; c++) {
                const idx = startIdx + c;
                if (idx < filteredStreamers.length) {
                  streamersInRow.push(filteredStreamers[idx]);
                }
              }

              // Loader row
              if (streamersInRow.length === 0 && hasMore) {
                return (
                  <div
                    key="loader"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${row.start}px)`,
                    }}
                    className="flex h-[160px] items-center justify-center"
                  >
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-cyan-500" />
                  </div>
                );
              }

              return (
                <div
                  key={`row-${row.index}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${row.start}px)`,
                  }}
                  className="grid grid-cols-3 gap-0.5 px-0.5"
                >
                  {streamersInRow.map((streamer) => (
                    <StreamerCard
                      key={`${browseMode}-${streamer.username}`}
                      streamer={streamer}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {!hasMore && !isLoading && filteredStreamers.length > 0 && browseMode !== 'active' && (
          <div className="py-6 text-center text-[9px] text-neutral-600 uppercase font-black tracking-widest">
            End of results
          </div>
        )}
      </div>

      {showScrollTop && (
        <Button
          size="sm"
          className="absolute right-3 bottom-3 rounded-full bg-cyan-600 shadow-lg hover:bg-cyan-500 h-8 w-8 p-0"
          onClick={scrollToTop}
        >
          <ArrowUp size={16} />
        </Button>
      )}
    </div>
  );
}
