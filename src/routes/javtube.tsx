import { createFileRoute } from "@tanstack/react-router";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { motion } from "framer-motion";
import {
  Play,
  Clock,
  Film,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { EnhancedVideoPlayer } from "../components/EnhancedVideoPlayer";
import { SearchBar } from "../components/SearchBar";
import { useAdvancedSearch } from "../hooks/useAdvancedSearch";

// Types
interface VideoData {
  id: string;
  code: string;
  title: string;
  thumbnail: string;
  duration: string;
  quality: string;
  videoUrl?: string;
}

export const JavTube = () => {
  const {
    filteredVideos,
    allVideos,
    isSearching,
    searchQuery,
    debouncedQuery,
    loading,
    error,
    handleFilterChange,
    clearFilters,
    performSearch,
  } = useAdvancedSearch();

  // Local state for component-specific functionality
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingVideoUrl, setLoadingVideoUrl] = useState<string | null>(null);

  // Masonry layout hook
  const useMasonryLayout = (
    items: any[],
    columnCount: number,
    gap: number = 8,
  ) => {
    const [layout, setLayout] = useState<{
      positions: { top: number; left: number; width: number; height: number }[];
      containerHeight: number;
    }>({ positions: [], containerHeight: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const itemHeights = useRef<number[]>([]);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const updateLayout = useCallback(() => {
      console.log(
        "updateLayout called with",
        items.length,
        "items, container:",
        !!containerRef.current,
      );
      if (!containerRef.current || items.length === 0) {
        console.log("updateLayout: no container or no items");
        return;
      }

      const containerWidth = containerRef.current.offsetWidth;
      console.log("Container width:", containerWidth);
      const columnWidth =
        (containerWidth - gap * (columnCount - 1)) / columnCount;
      const columns = Array(columnCount).fill(0);

      const positions = items.map((_, index) => {
        const height = itemHeights.current[index] || 200;
        const shortestColumnIndex = columns.indexOf(Math.min(...columns));
        const top = columns[shortestColumnIndex];
        const left = shortestColumnIndex * (columnWidth + gap);

        columns[shortestColumnIndex] += height + gap;

        return {
          top,
          left,
          width: columnWidth,
          height,
        };
      });

      const containerHeight = Math.max(...columns) - gap;

      console.log(
        "Setting layout with",
        positions.length,
        "positions, height:",
        containerHeight,
      );
      setLayout({ positions, containerHeight });
    }, [items, columnCount, gap]);

    const measureItem = useCallback(
      (index: number, height: number) => {
        if (itemHeights.current[index] !== height) {
          itemHeights.current[index] = height;
          updateLayout();
        }
      },
      [updateLayout],
    );

    // Reset item heights when items change
    useEffect(() => {
      itemHeights.current = new Array(items.length).fill(200); // Default height
    }, [items.length]);

    // Set up ResizeObserver and initial layout calculation
    useLayoutEffect(() => {
      const updateLayoutIfReady = () => {
        if (containerRef.current && items.length > 0) {
          console.log(
            "useMasonryLayout: updating layout for",
            items.length,
            "items",
          );
          updateLayout();
        }
      };

      // Set up ResizeObserver
      if (containerRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          updateLayoutIfReady();
        });
        resizeObserverRef.current.observe(containerRef.current);
      }

      // Initial layout calculation
      updateLayoutIfReady();

      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }
      };
    }, [items, updateLayout]);

    return { containerRef, layout, measureItem };
  };

  // Video navigation handlers
  const handleNext = () => {
    if (currentIndex < filteredVideos.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedVideo(filteredVideos[nextIndex]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedVideo(filteredVideos[prevIndex]);
    }
  };

  const handlePlayerError = (error: any) => {
    console.error("Player error:", error);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width >= 1536) return 5;
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  };

  const { containerRef, layout, measureItem } = useMasonryLayout(
    filteredVideos,
    getColumnCount(),
    8,
  );

  // Debug layout and videos
  useEffect(() => {
    console.log("Videos loaded:", filteredVideos.length);
    console.log("Layout positions:", layout.positions.length);
    console.log("Container height:", layout.containerHeight);
    console.log("Loading:", loading);
    if (filteredVideos.length > 0) {
      console.log("Sample video:", filteredVideos[0]);
    }
  }, [filteredVideos, layout, loading]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Search Bar */}
      <div className="mb-4 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <h1 className="mb-2 text-start text-3xl font-bold">
            JavTube <span className="text-purple-400">v2</span>
          </h1>
          <SearchBar />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {filteredVideos.length} videos loaded (loading:{" "}
            {loading ? "true" : "false"})
          </span>
          <span className="text-sm text-gray-500">
            Enhanced with professional player • Advanced search • Waterfall
            layout
          </span>
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-auto max-w-2xl rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="mb-2 text-red-400">{error}</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={handleRetry}
                className="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <button
                className="cursor-not-allowed rounded-md bg-gray-600 px-4 py-2 text-white opacity-50 transition-colors hover:bg-gray-700"
                disabled
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div
          ref={containerRef}
          className="relative w-full"
          style={{
            height:
              layout.positions.length > 0
                ? `${layout.containerHeight}px`
                : "400px",
          }}
        >
          {layout.positions.length > 0 ? (
            filteredVideos.map((video, index) => {
              const position = layout.positions[index];
              if (!position) return null;

              return (
                <motion.div
                  key={`${video.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  style={{
                    position: "absolute",
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: `${position.width}px`,
                    height: `${position.height}px`,
                  }}
                  className="group cursor-pointer"
                  onClick={() => {
                    console.log("Video card clicked:", video.id, video.title);
                    setSelectedVideo(video);
                  }}
                >
                  <div className="overflow-hidden rounded-lg bg-gray-800 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
                    {/* Image Container */}
                    <div className="relative aspect-video">
                      <div className="relative flex aspect-video items-center justify-center bg-gray-800">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-full w-full object-cover"
                            loading="eager"
                            onError={() =>
                              console.warn(
                                `Failed to load image for video ${video.id}`,
                              )
                            }
                          />
                        ) : (
                          <div className="flex items-center justify-center text-white">
                            <Film size={48} className="text-gray-400" />
                            <span className="ml-2 text-sm">No thumbnail</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="bg-opacity-0 hover:bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black transition-all">
                      <Play
                        size={48}
                        className="text-white opacity-0 transition-opacity hover:opacity-100"
                      />
                    </div>

                    {/* Video info overlay */}
                    <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-2">
                      <div className="flex items-end justify-between text-white">
                        <span className="rounded bg-purple-600 px-2 py-1 text-xs">
                          {video.quality}
                        </span>
                        <span className="bg-opacity-60 rounded bg-black px-2 py-1 text-xs">
                          <Clock size={12} />
                          {video.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-8 text-center text-white">
              <p>Calculating layout for {filteredVideos.length} videos...</p>
              <p>Loading: {loading ? "true" : "false"}</p>
            </div>
          )}
        </div>
        {filteredVideos.length > 0 && layout.positions.length === 0 && (
          <div className="p-8 text-center text-white">
            <p>Has {filteredVideos.length} videos but no layout positions</p>
            <p>Loading: {loading ? "true" : "false"}</p>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && selectedVideo.videoUrl && (
        <EnhancedVideoPlayer
          video={selectedVideo}
          videoUrl={selectedVideo.videoUrl}
          poster={selectedVideo.thumbnail}
          onClose={() => setSelectedVideo(null)}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onTimeUpdate={() => {}}
          hasNext={currentIndex < filteredVideos.length - 1}
        />
      )}
    </div>
  );
};

export const Route = createFileRoute("/javtube")({
  component: () => <JavTube />,
});
