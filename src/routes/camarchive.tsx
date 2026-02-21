import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Video as VideoIcon, User, Search, X, ExternalLink, Loader2, Play } from 'lucide-react';
import * as api from '../components/camarchive/api';
import type { Video } from '../components/camarchive/types';

const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className='flex flex-col justify-center items-center h-64 gap-4'>
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500"></div>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

function useInView(options?: IntersectionObserverInit) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options);
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return { ref: setRef, inView };
}

const VideoPlayerModal = ({ video, onClose }: { video: Video; onClose: () => void }) => {
  const [embedData, setEmbedData] = useState<{ embedUrl: string | null; thumbUrl: string | null }>({
    embedUrl: null,
    thumbUrl: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmbed = async () => {
      try {
        setIsLoading(true);
        const result = await window.archivebate.getEmbedUrl(video.watchUrl);
        if (result.success && result.data?.embedUrl) {
          setEmbedData({
            embedUrl: result.data.embedUrl,
            thumbUrl: result.data.thumbUrl || null
          });
        } else {
          setError(result.error || 'Failed to extract video player');
        }
      } catch (err) {
        setError('Network error extracting video');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmbed();
  }, [video.watchUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 lg:p-12"
    >
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10 transition-opacity hover:opacity-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <VideoIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm leading-none">{video.username}'s Archive</h3>
              <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mt-1">Chaturbate • {video.uploaded}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(video.watchUrl, '_blank')}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
              title="Open External"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-red-500 text-white transition-all shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Content */}
        <div className="w-full h-full relative flex items-center justify-center bg-[#070707]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 z-20">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Initializing Stream Engine...</p>
            </div>
          ) : error ? (
            <div className="text-center px-4 z-20">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-white font-bold mb-2">{error}</p>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">Archivebate is protecting this video. You may need to view it on the source website.</p>
              <button
                onClick={() => window.open(video.watchUrl, '_blank')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-full transition-all"
              >
                Open Original Website
              </button>
            </div>
          ) : embedData.embedUrl ? (
            <>
              {embedData.thumbUrl && (
                <img
                  loading="lazy"
                  crossOrigin="anonymous"
                  alt=""
                  src={embedData.thumbUrl}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
                />
              )}
              {embedData.embedUrl ? (
                <video
                  src={embedData.embedUrl}
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                  controls
                  autoPlay
                />
              ) : null}
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

const VideoCard = React.memo(({ video, onPlay }: { video: Video; onPlay: (video: Video) => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -4 }}
    className="group relative overflow-hidden rounded-xl bg-gray-800/40 border border-white/5 cursor-pointer hover:border-blue-500/50 transition-all shadow-xl"
    onClick={() => onPlay(video)}
  >
    <div className="relative aspect-video">
      <img
        src={video.thumbnailUrl}
        alt={video.username}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md rounded px-2 py-0.5 border border-white/10">
        <span className="text-white text-[10px] font-bold tracking-tight">{video.duration}</span>
      </div>
      <div className="absolute top-2 left-2 bg-blue-600/90 backdrop-blur-md rounded px-2 py-0.5 border border-white/10 shadow-lg">
        <span className="text-white text-[9px] font-black uppercase">{video.platform}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-blue-500/80 backdrop-blur-sm flex items-center justify-center shadow-2xl">
          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
    <div className="p-3">
      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-gray-500">
        <span>{video.uploaded}</span>
        <span>{video.views.toLocaleString()} views</span>
      </div>
    </div>
  </motion.div>
));

const ProfileCard = React.memo(({ profile, onClick }: { profile: any; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.1 });

  // Fetch thumbnails efficiently - only when visible
  const { data: videosData, isLoading } = useQuery({
    queryKey: ['profile-thumbs', profile.username],
    queryFn: () => api.fetchProfileVideos(profile.username),
    staleTime: 30 * 60 * 1000, // Long cache for profile previews
    enabled: inView,
  });

  const videos = videosData?.videos || [];
  const thumbs = useMemo(() => videos.slice(0, 3).map(v => v.thumbnailUrl), [videos]);

  // Auto-slide effect when hovered
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && thumbs.length > 1) {
      interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % thumbs.length);
      }, 2500); // Slower, more cinematic slide
    } else {
      const resetDelay = setTimeout(() => {
        if (!isHovered) setCurrentSlide(0);
      }, 300);
      return () => clearTimeout(resetDelay);
    }
    return () => clearInterval(interval);
  }, [isHovered, thumbs.length]);

  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.04 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-[2rem] bg-[#0c0c0c] border border-white/5 cursor-pointer hover:border-blue-500/40 transition-all duration-500 shadow-2xl aspect-square"
    >
      {/* Thumbnail Layers */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {thumbs.length > 0 ? (
            <motion.div
              key={`${profile.username}-slide-${currentSlide}`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <img
                src={thumbs[currentSlide]}
                className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-700"
                alt=""
              />
            </motion.div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-indigo-900/20 animate-pulse" />
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Glass Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-700 z-10 ${isHovered ? 'opacity-40' : 'opacity-80'} bg-gradient-to-t from-black via-black/20 to-transparent`} />

      {/* Floating Center Icon (Visible on hover) */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div
          animate={{
            scale: isHovered ? 1 : 0.8,
            opacity: isHovered ? 1 : 0
          }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-20 h-20 rounded-full bg-blue-500/10 backdrop-blur-2xl border border-white/10 flex items-center justify-center shadow-2xl"
        >
          <Play className="w-8 h-8 text-white fill-white ml-1" />
        </motion.div>
      </div>

      {/* Content Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform group-hover:translate-y-[-4px] transition-transform duration-500">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Archived</span>
        </div>

        <h3 className="text-white font-black text-xl truncate tracking-tight group-hover:text-blue-400 transition-colors drop-shadow-lg">
          {profile.username}
        </h3>

        <div className="flex items-center justify-between mt-2">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            {profile.lastViewed ? new Date(profile.lastViewed).toLocaleDateString() : 'Active'}
          </p>
          {videos.length > 0 && (
            <span className="text-[10px] bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full text-white/60 font-black">
              {videos.length}+ VIDEOS
            </span>
          )}
        </div>

        {/* Cinematic Progress Bar */}
        <div className="flex gap-1.5 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/10"
            >
              <motion.div
                initial={false}
                animate={{
                  width: i === currentSlide ? '100%' : (i < currentSlide ? '100%' : '0%'),
                  opacity: i === currentSlide ? 1 : 0.3
                }}
                className="h-full bg-blue-500"
                transition={{ duration: i === currentSlide ? 2.5 : 0.3, ease: 'linear' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Loading Spin for extra content */}
      {isHovered && isLoading && (
        <div className="absolute top-6 right-6 z-30">
          <Loader2 className="w-5 h-5 text-blue-500/50 animate-spin" />
        </div>
      )}
    </motion.div>
  );
});

function CamarchiveRoute() {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);

  // Fetch viewed profiles list
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['camarchive-profiles'],
    queryFn: api.getViewedProfilesList,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch archive videos with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingVideos,
    error: videosError,
  } = useInfiniteQuery({
    queryKey: ["camarchive-videos", selectedProfile],
    queryFn: ({ pageParam = 1 }) => api.fetchArchiveProfile(selectedProfile!, pageParam as number),
    initialPageParam: 1,
    enabled: !!selectedProfile,
    getNextPageParam: (lastPage: any) =>
      lastPage.hasMore ? lastPage.currentPage + 1 : null,
  });

  const videos = data?.pages.flatMap((page: any) => page.videos) || [];

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

  const handleProfileClick = useCallback((username: string) => {
    setSelectedProfile(username);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedProfile(null);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleProfileClick(searchQuery.trim());
      setSearchQuery('');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden font-sans text-gray-100">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-none z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {selectedProfile && (
              <motion.button
                onClick={handleBack}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all shadow-inner"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-5 w-5 text-gray-300" />
              </motion.button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">
                  {selectedProfile ? selectedProfile : 'Cam Archive'}
                </h1>
                {!selectedProfile && (
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    {profiles?.length || 0} Saved Profiles
                  </p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search profile username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white/10 transition-all placeholder:text-gray-600"
            />
          </form>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {!selectedProfile ? (
            // Profile List View
            isLoadingProfiles ? (
              <LoadingSpinner message="Searching history..." />
            ) : !profiles || profiles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10"
              >
                <VideoIcon className="h-20 w-20 mx-auto text-gray-800 mb-6" />
                <h2 className="text-2xl font-bold text-gray-300">No Archive History</h2>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto">Use the search bar above to look up any profile or view cams to build your history.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <AnimatePresence>
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onClick={() => handleProfileClick(profile.username)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : (
            // Videos View
            isLoadingVideos ? (
              <LoadingSpinner message={`Fetching ${selectedProfile}'s archive...`} />
            ) : videosError ? (
              <div className="text-center py-20 bg-red-500/5 rounded-3xl border border-red-500/10">
                <p className="text-red-400 font-bold">Failed to load archive for {selectedProfile}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 px-8 py-3 bg-red-600/20 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all font-bold"
                >
                  Retry Connection
                </button>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10">
                <VideoIcon className="h-20 w-20 mx-auto text-gray-800 mb-6" />
                <h2 className="text-2xl font-bold text-gray-300">No Videos Found</h2>
                <p className="text-gray-500 mt-2">Could not find any recorded streams for this user.</p>
                <button
                  onClick={handleBack}
                  className="mt-8 text-blue-500 font-bold hover:underline"
                >
                  Return to Archive
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {videos.map((video: Video, index: number) => (
                    <VideoCard key={`${video.id}-${index}`} video={video} onPlay={setPlayingVideo} />
                  ))}
                </AnimatePresence>

                {/* Infinite Scroll Trigger */}
                <div ref={loadMoreRef} className="col-span-full h-10 flex items-center justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-blue-500 font-bold">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  )}
                  {!hasNextPage && videos.length > 0 && (
                    <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">End of Archives</p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <VideoPlayerModal
            video={playingVideo}
            onClose={() => setPlayingVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute('/camarchive')({
  component: CamarchiveRoute,
});
