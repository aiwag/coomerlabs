// Camarchive Route - Profile History & Videos
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Video as VideoIcon, User, Search } from 'lucide-react';
import * as api from '../components/camarchive/api';
import type { Video } from '../components/camarchive/types';

const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className='flex flex-col justify-center items-center h-64 gap-4'>
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500"></div>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

const VideoCard = React.memo(({ video }: { video: Video }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -4 }}
    className="group relative overflow-hidden rounded-xl bg-gray-800/40 border border-white/5 cursor-pointer hover:border-blue-500/50 transition-all shadow-xl"
    onClick={() => window.open(video.watchUrl, '_blank')}
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

const ProfileCard = React.memo(({ profile, onClick }: { profile: any; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.02 }}
    onClick={onClick}
    className="group relative overflow-hidden rounded-2xl bg-gray-800/30 border border-white/5 cursor-pointer hover:bg-gray-800/60 hover:border-blue-500/30 transition-all shadow-lg"
  >
    <div className="aspect-square relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-blue-500/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <User className="w-10 h-10 text-white/40" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-white font-bold text-lg truncate group-hover:text-blue-400 transition-colors">{profile.username}</h3>
        <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1">
          {profile.lastViewed ? new Date(profile.lastViewed).toLocaleDateString() : 'Active Profile'}
        </p>
      </div>
    </div>
  </motion.div>
));

function CamarchiveRoute() {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch viewed profiles list
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['camarchive-profiles'],
    queryFn: api.getViewedProfilesList,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch profile videos
  const {
    data: videosData,
    isLoading: isLoadingVideos,
    error: videosError
  } = useQuery({
    queryKey: ['camarchive-videos', selectedProfile],
    queryFn: () => api.fetchProfileVideos(selectedProfile!),
    enabled: !!selectedProfile,
    staleTime: 2 * 60 * 1000,
  });

  const videos = videosData?.videos || [];

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
                  {videos.map((video, index) => (
                    <VideoCard key={`${video.id}-${index}`} video={video} />
                  ))}
                </AnimatePresence>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/camarchive')({
  component: CamarchiveRoute,
});
