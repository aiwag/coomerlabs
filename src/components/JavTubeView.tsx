import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Film, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { EnhancedVideoPlayer } from "./EnhancedVideoPlayer";
import { SearchBar } from "./SearchBar";
import { useAdvancedSearch, VideoData } from "../hooks/useAdvancedSearch";

type SortType = "main" | "top_favorites" | "uncensored" | "most_viewed" | "top_rated" | "being_watched" | "search";

interface JavTubeViewProps {
  sortType: SortType;
  title: string;
  subtitle?: string;
  initialQuery?: string;
  showSearch?: boolean;
  showHeader?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

export const JavTubeView: React.FC<JavTubeViewProps> = ({
  sortType,
  title,
  subtitle,
  initialQuery = "",
  showSearch = true,
  showHeader = true,
  gradientFrom = "purple",
  gradientTo = "pink",
}) => {
  const {
    filteredVideos,
    loading,
    error,
    setSearchQuery,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdvancedSearch({ sortType, initialQuery });

  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingVideoUrl, setLoadingVideoUrl] = useState<string | null>(null);

  const { ref: scrollRef, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleVideoClick = async (video: VideoData, index: number) => {
    setCurrentIndex(index);
    setSelectedVideo(video);

    if (!video.videoUrl) {
      setLoadingVideoUrl(video.id);
      try {
        const response = await fetch("http://127.0.0.1:8080/api/video-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: video.id }),
        });
        const data = await response.json();
        if (data.videoUrl) {
          setSelectedVideo((prev) =>
            prev && prev.id === video.id
              ? { ...prev, videoUrl: data.videoUrl }
              : prev
          );
        }
      } catch (err) {
        console.error("URL fetch error:", err);
      } finally {
        setLoadingVideoUrl(null);
      }
    }
  };

  const handleClose = () => {
    setSelectedVideo(null);
    setLoadingVideoUrl(null);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % filteredVideos.length;
    handleVideoClick(filteredVideos[nextIndex], nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex =
      (currentIndex - 1 + filteredVideos.length) % filteredVideos.length;
    handleVideoClick(filteredVideos[prevIndex], prevIndex);
  };

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <div className="glass-card p-12 rounded-[2.5rem]">
          <AlertCircle size={48} className="text-red-500" />
          <h2 className="text-2xl font-bold mt-4">Network Error</h2>
          <p className="text-white/60 mb-6">Failed to connect to JavTube server.</p>
          <button
            onClick={() => window.location.reload()}
            className="liquid-button flex items-center gap-2 px-6 py-3 font-bold"
          >
            <RefreshCw size={18} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const gradientClasses = {
    purple: "from-purple-500 to-pink-500 shadow-purple-500/20",
    red: "from-red-500 to-orange-500 shadow-red-500/20",
    blue: "from-blue-500 to-cyan-500 shadow-blue-500/20",
    green: "from-green-500 to-emerald-500 shadow-green-500/20",
  };

  return (
    <div className="flex h-full flex-col bg-black/10 text-white overflow-hidden">
      {showHeader && (
        <div className="flex-none flex items-center justify-between px-8 py-6 glass-header z-40">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientClasses[gradientFrom as keyof typeof gradientClasses]} shadow-lg`}>
              <Film className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{title}</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                {subtitle || "High-Speed Media Extraction"}
              </p>
            </div>
          </div>

          {showSearch && (
            <div className="flex items-center gap-6">
              <SearchBar onSearch={setSearchQuery} />
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative z-10">
        {loading && filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm animate-pulse">
              Initializing Secure Stream...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video, index) => (
              <motion.div
                key={`${video.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 20) * 0.05 }}
                onClick={() => handleVideoClick(video, index)}
                className="group relative cursor-pointer overflow-hidden glass-card hover:border-purple-500/30 transition-all duration-500"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="rounded-xl bg-black/60 px-3 py-1 text-[10px] font-black uppercase backdrop-blur-md border border-white/5">
                      {video.code}
                    </span>
                    <span className="rounded-xl bg-purple-500/80 px-3 py-1 text-[10px] font-black uppercase backdrop-blur-md">
                      {video.duration}
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                      <Play className="h-8 w-8 text-white fill-current ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-2 text-sm font-bold leading-relaxed text-white/90 group-hover:text-white transition-colors">
                    {video.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div ref={scrollRef} className="flex flex-col items-center justify-center py-20 gap-4">
          {hasNextPage ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Loading More Content</p>
            </>
          ) : filteredVideos.length > 0 ? (
            <p className="text-[10px] font-black uppercase tracking-widest text-white/10">End of Content</p>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            }}
          >
            {loadingVideoUrl && (
              <div className="flex flex-col items-center gap-6 z-10">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                  <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-400 animate-pulse" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse text-center">
                  Extracting Master Stream
                </p>
              </div>
            )}

            {selectedVideo.videoUrl && (
              <EnhancedVideoPlayer
                video={selectedVideo}
                videoUrl={selectedVideo.videoUrl}
                poster={selectedVideo.thumbnail}
                onClose={handleClose}
                onNext={handleNext}
                onPrevious={handlePrevious}
                hasNext={currentIndex < filteredVideos.length - 1 || hasNextPage}
                hasPrevious={currentIndex > 0}
              />
            )}

            <button
              onClick={handleClose}
              className="absolute top-8 right-8 z-[110] p-4 rounded-full text-white transition-all hover:rotate-90 liquid-button"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
