import React, { useState, useCallback } from "react";
import { X, Video, Film, Loader2, AlertCircle, ExternalLink, Play } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchArchiveProfile } from "@/services/archivebateService";
import { ArchiveVideoCard } from "@/components/camviewer/ArchiveVideoCard";
import { SortableWebview } from "@/components/camviewer/grid/SortableWebview";

interface ProfileModalProps {
  username: string;
  onClose: () => void;
}

export function ProfileModal({ username, onClose }: ProfileModalProps) {
  const [selectedVideo, setSelectedVideo] = useState<ArchiveVideo | null>(null);

  // Fetch archive videos with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["archive-profile", username],
    queryFn: ({ pageParam = 1 }) => fetchArchiveProfile(username, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.currentPage + 1 : null,
  });

  const allVideos = data?.pages.flatMap((page) => page.videos) || [];

  // Intersection Observer for infinite scroll
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && hasNextPage && !isFetchingNextPage) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              fetchNextPage();
            }
          },
          { threshold: 0.1 }
        );
        observer.observe(node);
        return () => observer.disconnect();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const liveCamUrl = `https://www.chaturbate.com/fullvideo/?b=${username}`;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-7xl h-full max-h-[90vh] glass-card rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex-shrink-0 glass-header border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-lg liquid-button hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{username}</h1>
                <p className="text-sm text-neutral-400">Room Profile & Archives</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg">
                <Film size={16} className="text-purple-400" />
                <span className="text-sm font-medium">{allVideos.length} videos</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col h-full">
            {/* Live Cam Section - Takes available height, but limited */}
            <section className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 px-6 pt-6">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Video size={18} className="text-red-400" />
                  Live Cam
                </h2>
              </div>
              <div className="px-6">
                <div className="aspect-video glass-card rounded-xl overflow-hidden max-h-[50vh]">
                  <SortableWebview
                    id={`live-${username}`}
                    url={liveCamUrl}
                    removable={false}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>
            </section>

            {/* Archive Videos Section - Scrollable */}
            <section className="flex-1 px-6 py-6 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Film size={18} className="text-purple-400" />
                  Archive Videos
                </h2>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
                  <p className="text-sm text-neutral-400">Loading archive videos...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-sm text-neutral-300 mb-1">Failed to load archive videos</p>
                  <p className="text-xs text-neutral-500">
                    The profile may not exist or have no archives
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && allVideos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl">
                  <Film className="w-12 h-12 text-neutral-500 mb-3" />
                  <p className="text-sm text-neutral-300 mb-1">No archive videos found</p>
                  <p className="text-xs text-neutral-500">
                    This room may not have archived content yet
                  </p>
                </div>
              )}

              {/* Videos Grid */}
              {!isLoading && !error && allVideos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allVideos.map((video) => (
                    <ArchiveVideoCard
                      key={video.id}
                      video={video}
                      onPlay={(v) => setSelectedVideo(v)}
                    />
                  ))}

                  {/* Loading More Indicator */}
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                    </div>
                  )}

                  {/* Load More Trigger */}
                  <div ref={loadMoreRef} className="h-1" />
                </div>
              )}

              {/* End of Results */}
              {!hasNextPage && !isLoading && allVideos.length > 0 && (
                <div className="text-center py-8 text-sm text-neutral-500 pb-6">
                  You've reached the end of the archives
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[10000] bg-black/98 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-5xl glass-card rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Video Embed */}
            <div className="aspect-video bg-black">
              {selectedVideo.embedUrl ? (
                <iframe
                  src={selectedVideo.embedUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <a
                    href={selectedVideo.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    <span>Watch on ArchiveBate</span>
                  </a>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4 glass-header">
              <h3 className="text-lg font-semibold text-white mb-2">
                {selectedVideo.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-neutral-400">
                {selectedVideo.views && <span>Views: {selectedVideo.views}</span>}
                {selectedVideo.date && <span>Date: {selectedVideo.date}</span>}
                {selectedVideo.duration && <span>Duration: {selectedVideo.duration}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
