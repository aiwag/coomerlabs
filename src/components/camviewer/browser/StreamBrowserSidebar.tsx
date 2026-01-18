import React, { useRef, useEffect, useState } from "react";
import {
  Search,
  X,
  AlertCircle,
  ArrowUp,
  SlidersHorizontal,
  Filter,
  Sparkles,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useBrowserStore } from "@/state/browserStore";
import { useSettingsStore } from "@/state/settingsStore";
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
  } = useBrowserStore();
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
    executeSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, executeSearch]);

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
    if (browserVisible) {
      if (filteredStreamers.length === 0) {
        fetchStreamers();
      }
    } else {
      cleanup();
    }
    return () => {
      cleanup();
    };
  }, [browserVisible, fetchStreamers, cleanup]);

  if (!browserVisible) return null;

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== "" && v !== false && v !== 0,
  );
  const scrollToTop = () => {
    rowVirtualizer.scrollToIndex(0);
    parentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const browseModes = [
    { mode: "mostViewed", label: "Most Viewed", icon: <Sparkles size={14} /> },
    { mode: "topRated", label: "Top Rated", icon: <Star size={14} /> },
    { mode: "trending", label: "Trending", icon: <TrendingUp size={14} /> },
  ] as const;

  return (
    <aside className="flex h-full w-96 flex-col border-r border-neutral-700 bg-neutral-900/95 shadow-2xl backdrop-blur-sm">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-neutral-700 bg-neutral-900 p-3">
        <div className="flex items-center gap-1.5">
          {browseModes.map(({ mode, label, icon }) => (
            <Button
              key={mode}
              variant={browseMode === mode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setBrowseMode(mode as any)}
              className="h-8 text-xs font-medium transition-all"
            >
              {icon}
              <span className="ml-1">{label}</span>
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setBrowserVisible(false)}
          className="hover:bg-neutral-800"
        >
          <X size={16} />
        </Button>
      </header>

      <div className="flex flex-shrink-0 gap-2 border-b border-neutral-700 bg-neutral-900/50 p-3">
        <div className="relative flex-grow">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search streamers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 py-2 pr-3 pl-9 text-sm text-white transition-all focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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

      {hasActiveFilters && (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-neutral-700 bg-neutral-900/30 px-3 py-2">
          <Badge variant="outline" className="text-xs">
            {filteredStreamers.length} results
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-xs text-neutral-400 hover:text-white"
          >
            Clear filters
          </Button>
        </div>
      )}

      <FilterPanel />

      {error && (
        <div className="flex items-center justify-center gap-2 border-b border-red-900/50 bg-red-900/30 p-3 text-center text-xs text-red-200">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div ref={parentRef} className="custom-scrollbar flex-1 overflow-y-auto">
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

          {!hasMore && !isLoading && filteredStreamers.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
                  <Search size={24} className="text-neutral-500" />
                </div>
              </div>
              <p className="text-sm text-neutral-400">No streams found</p>
              <p className="mt-1 text-xs text-neutral-500">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}

          {!hasMore && !isLoading && filteredStreamers.length > 0 && (
            <div className="py-4 text-center text-xs text-neutral-500">
              End of results
            </div>
          )}
        </div>
      </div>

      {showScrollTop && (
        <Button
          size="sm"
          className="absolute right-4 bottom-4 rounded-full bg-cyan-600 shadow-lg hover:bg-cyan-500"
          onClick={scrollToTop}
        >
          <ArrowUp size={16} className="mr-1" />
          Top
        </Button>
      )}
    </aside>
  );
}

const Star = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
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
