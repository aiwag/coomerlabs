import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowLeft, Video, Film, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  fetchArchiveProfile,
  ArchiveVideo,
} from "@/services/archivebateService";
import { ArchiveVideoCard } from "@/components/camviewer/ArchiveVideoCard";
import { SortableWebview } from "@/components/camviewer/grid/SortableWebview";

export function RoomProfilePage() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
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

  const handleBack = () => {
    navigate({ to: "/camviewer" });
  };

  const liveCamUrl = `https://www.chaturbate.com/fullvideo/?b=${username}`;

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      {/* Header */}
      <header className="flex-shrink-0 glass-header border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg liquid-button hover:bg-white/10 transition-colors"
              title="Back to Grid"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{username}</h1>
              <p className="text-xs text-neutral-400">
                Room Profile & Archives
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg">
              <Film size={16} className="text-cyan-400" />
              <span className="text-sm font-medium">
                {allVideos.length} videos
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* Live Cam Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video size={18} className="text-red-400" />
                Live Cam
              </h2>
            </div>
            <div className="aspect-video glass-card rounded-xl overflow-hidden">
              <SortableWebview
                id={`live-${username}`}
                url={liveCamUrl}
                removable={false}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </section>

          {/* Archive Videos Section */}
          <section>
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
                <p className="text-sm text-neutral-400">
                  Loading archive videos...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-sm text-neutral-300 mb-1">
                  Failed to load archive videos
                </p>
                <p className="text-xs text-neutral-500">
                  The profile may not exist or have no archives
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && allVideos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 glass-card rounded-xl">
                <Film className="w-12 h-12 text-neutral-500 mb-3" />
                <p className="text-sm text-neutral-300 mb-1">
                  No archive videos found
                </p>
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
              <div className="text-center py-8 text-sm text-neutral-500">
                You've reached the end of the archives
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
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
              <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
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
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-medium transition-colors"
                  >
                    Watch on ArchiveBate
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
                {selectedVideo.views && (
                  <span>Views: {selectedVideo.views}</span>
                )}
                {selectedVideo.date && <span>Date: {selectedVideo.date}</span>}
                {selectedVideo.duration && (
                  <span>Duration: {selectedVideo.duration}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/camviewer/room/$username")({
  component: RoomProfilePage,
});
