import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Play,
  Film,
  X,
  Loader2,
  UserMinus,
  Users,
  AlertCircle,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { EnhancedVideoPlayer } from "../components/EnhancedVideoPlayer";
import { useFollowStore, FollowedActress } from "../state/followStore";

interface VideoData {
  id: string;
  code: string;
  title: string;
  thumbnail: string;
  duration: string;
  quality: string;
  videoUrl?: string;
}

interface VideoWithActress extends VideoData {
  actressId: string;
  actressName: string;
}

const FollowingFeed = () => {
  const { followed, unfollow } = useFollowStore();
  const [selectedVideo, setSelectedVideo] = useState<VideoWithActress | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingVideoUrl, setLoadingVideoUrl] = useState<string | null>(null);

  // Fetch page 1 of videos for each followed actress
  const actressQueries = useQueries({
    queries: followed.map((actress) => ({
      queryKey: ["following-actress-videos", actress.id],
      queryFn: async () => {
        const result = await window.javtube.getActressVideos(actress.id, 1);
        if (!result.success) throw new Error(result.error || "Failed to fetch");
        return {
          actress,
          videos: (result.data.videos || []) as VideoData[],
        };
      },
      staleTime: 5 * 60 * 1000,
      enabled: followed.length > 0,
    })),
  });

  const isLoading = actressQueries.some((q) => q.isLoading);
  const hasErrors = actressQueries.some((q) => q.isError);

  // Merge and interleave videos from all followed actresses
  const allVideos: VideoWithActress[] = useMemo(() => {
    const videosByActress = actressQueries
      .filter((q) => q.data)
      .map((q) => {
        const data = q.data!;
        return data.videos.map((v) => ({
          ...v,
          actressId: data.actress.id,
          actressName: data.actress.name,
        }));
      });

    if (videosByActress.length === 0) return [];

    // Interleave: round-robin from each actress to create a mixed feed
    const result: VideoWithActress[] = [];
    const maxLen = Math.max(...videosByActress.map((v) => v.length));
    for (let i = 0; i < maxLen; i++) {
      for (const actressVideos of videosByActress) {
        if (i < actressVideos.length) {
          result.push(actressVideos[i]);
        }
      }
    }
    return result;
  }, [actressQueries]);

  const handleVideoClick = async (video: VideoWithActress, index: number) => {
    setCurrentIndex(index);
    setSelectedVideo(video);

    if (!video.videoUrl) {
      setLoadingVideoUrl(video.id);
      try {
        const result = await window.javtube.getVideoUrl(video.id);
        if (result.success && result.data.videoUrl) {
          setSelectedVideo((prev) =>
            prev && prev.id === video.id
              ? { ...prev, videoUrl: result.data.videoUrl }
              : prev
          );
        } else {
          alert("Failed to extract video playback URL.");
          handleClose();
        }
      } catch (err: any) {
        console.error("URL fetch error:", err);
        alert(`Connection failed: ${err.message}`);
        handleClose();
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
    const nextIndex = (currentIndex + 1) % allVideos.length;
    handleVideoClick(allVideos[nextIndex], nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + allVideos.length) % allVideos.length;
    handleVideoClick(allVideos[prevIndex], prevIndex);
  };

  // Empty state
  if (followed.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center">
            <Heart size={40} className="text-white/10" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black tracking-tight mb-2">
            No Followed Stars
          </h2>
          <p className="text-sm text-white/30 max-w-sm">
            Follow actresses from the{" "}
            <span className="text-indigo-400 font-bold">Stars</span> directory
            to see their latest content here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col text-white overflow-hidden">
      {/* Following chips bar */}
      <div className="flex-none px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1">
          <span className="flex-none text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mr-2">
            Following ({followed.length})
          </span>
          {followed.map((actress) => (
            <div
              key={actress.id}
              className="flex-none flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all group/chip"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10">
                <img
                  src={actress.thumbnail}
                  alt={actress.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-bold text-white/70 group-hover/chip:text-white transition-colors whitespace-nowrap">
                {actress.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  unfollow(actress.id);
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all"
                title={`Unfollow ${actress.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative z-10">
        {isLoading && allVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/20 blur-xl animate-pulse rounded-full" />
              <Loader2 className="h-12 w-12 animate-spin text-pink-500 relative" />
            </div>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm animate-pulse">
              Loading Following Feed...
            </p>
          </div>
        ) : allVideos.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <AlertCircle size={48} className="text-white/10" />
            <p className="text-sm text-white/30">
              No videos found from followed stars.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allVideos.map((video, index) => (
              <motion.div
                key={`${video.actressId}-${video.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min((index % 20) * 0.03, 0.3) }}
                onClick={() => handleVideoClick(video, index)}
                className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-pink-500/30 transition-all duration-500 shadow-xl hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                  {/* Actress badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                    <span className="text-[9px] font-black uppercase tracking-wider text-pink-400">
                      {video.actressName}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="rounded-xl bg-black/60 px-3 py-1 text-[10px] font-black uppercase backdrop-blur-md border border-white/5">
                      {video.code}
                    </span>
                    <span className="rounded-xl bg-pink-500/80 px-3 py-1 text-[10px] font-black uppercase backdrop-blur-md">
                      {video.duration}
                    </span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                      <Play className="h-8 w-8 text-white fill-current ml-1" />
                    </div>
                  </div>

                  {video.quality && (
                    <div className="absolute top-3 right-3">
                      <span className="rounded-lg bg-pink-600 px-2 py-1 text-[8px] font-black uppercase tracking-widest backdrop-blur-md">
                        {video.quality}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-2 text-sm font-bold leading-relaxed text-white/80 group-hover:text-white transition-colors">
                    {video.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
              background: "rgba(0, 0, 0, 0.95)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
            }}
          >
            {loadingVideoUrl && (
              <div className="flex flex-col items-center gap-6 z-10">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
                  <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-pink-400 animate-pulse" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent animate-pulse text-center">
                  Extracting Star Stream
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
                hasNext={currentIndex < allVideos.length - 1}
                hasPrevious={currentIndex > 0}
              />
            )}

            <button
              onClick={handleClose}
              className="absolute top-8 right-8 z-[110] p-4 rounded-full text-white transition-all hover:rotate-90 bg-white/5 hover:bg-pink-600/20 border border-white/10 hover:border-pink-500/30"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Route = createFileRoute("/javtube/following")({
  component: FollowingFeed,
});
