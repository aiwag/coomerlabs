// Fapello ProfileCard Component - Optimized
import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Bookmark,
  Eye,
  Star,
  Check,
  X,
  Image as ImageIcon,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { useSettings } from './hooks';
import type { Profile } from './types';

interface ProfileCardProps {
  profile: Profile;
  index: number;
  onClick: () => void;
}

// Loading skeleton component
const ProfileCardSkeleton = ({ compact = false }: { compact?: boolean }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gray-800 ${compact ? 'h-32' : 'h-48'}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer" />
    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
      <div className="flex items-center gap-1.5">
        <div className={`rounded-full bg-gray-700 ${compact ? 'w-6 h-6' : 'w-8 h-8'}`} />
        <div className="flex-1">
          <div className="h-3 bg-gray-700 rounded w-20 mb-1" />
          <div className="h-2 bg-gray-700 rounded w-12" />
        </div>
      </div>
    </div>
  </div>
);

export const ProfileCard = memo(({ profile, index, onClick }: ProfileCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingHQ, setLoadingHQ] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.01,
    rootMargin: '200px',
  });

  const { settings, toggleFollowProfile, isProfileFollowed } = useSettings();

  // Sync follow state with settings
  useEffect(() => {
    setIsFollowed(isProfileFollowed(profile.id));
  }, [profile.id, isProfileFollowed]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(v => !v);
    toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
  }, [isLiked]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(v => !v);
    toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
  }, [isBookmarked]);

  const handleFollow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFollowProfile(profile.id);
    setIsFollowed(v => !v);
    toast(isFollowed ? 'Unfollowed' : 'Followed');
  }, [profile.id, toggleFollowProfile, isFollowed]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setLoadingHQ(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
    setLoadingHQ(false);
  }, []);

  // Handle click - load HQ if available
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="group relative overflow-hidden rounded-2xl glass-card transition-all duration-300 cursor-pointer"
      style={{ height: settings.compactView ? '128px' : '192px' }}
      onClick={inView ? onClick : undefined}
      whileHover={inView ? { y: -4, scale: 1.02 } : undefined}
      whileTap={inView ? { scale: 0.98 } : undefined}
    >
      <div className="relative w-full h-full">
        {/* Loading skeleton - show as overlay when loading */}
        {(!imageLoaded && !imageError) && (
          <div className="absolute inset-0 z-10">
            <ProfileCardSkeleton compact={settings.compactView} />
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm">
            <div className="text-center p-2">
              <X className="h-6 w-6 mx-auto text-gray-500 mb-1" />
              <p className="text-xs text-gray-400">Failed to load</p>
            </div>
          </div>
        )}

        {/* Profile image - always render */}
        <img
          ref={imgRef}
          src={inView ? profile.imageUrl : undefined}
          alt={profile.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full absolute object-cover transition-all duration-700 ease-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} group-hover:scale-110`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Gradient overlay with shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <button
            onClick={handleFollow}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-all hover:scale-110 ${
              isFollowed
                ? 'bg-blue-500/80 hover:bg-blue-600/80'
                : 'bg-black/60 hover:bg-black/80'
            }`}
            aria-label={isFollowed ? 'Unfollow' : 'Follow'}
          >
            {isFollowed ? (
              <UserMinus className="h-3 w-3 text-white" />
            ) : (
              <UserPlus className="h-3 w-3 text-white" />
            )}
          </button>
          <button
            onClick={handleLike}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all hover:scale-110"
            aria-label="Like"
          >
            <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <button
            onClick={handleBookmark}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all hover:scale-110"
            aria-label="Bookmark"
          >
            <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
          </button>
        </motion.div>

        {/* Stats overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute bottom-8 left-0 right-0 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                <ImageIcon className="h-3 w-3" />
                {profile.postCount}
              </span>
              <span className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                <Eye className="h-3 w-3" />
                {profile.lastActive}
              </span>
            </div>
            {profile.rating && (
              <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{profile.rating}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent backdrop-blur-[2px]">
          <div className="flex items-center gap-1.5">
            {profile.avatarUrl && (
              <div className="relative shrink-0">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  loading="lazy"
                  className={`rounded-full border-2 border-white/20 object-cover transition-transform group-hover:scale-110 ${settings.compactView ? 'w-6 h-6' : 'w-8 h-8'}`}
                />
                {profile.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 shadow-lg">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
                {profile.premium && (
                  <div className="absolute -top-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 shadow-lg">
                    <Star className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`${settings.compactView ? 'text-xs' : 'text-sm'} font-semibold text-white truncate drop-shadow-lg`}>
                {profile.name}
              </h3>
              <div className="flex items-center gap-1">
                {profile.verified && <span className="text-xs text-blue-400">✓</span>}
                {profile.premium && <span className="text-xs text-yellow-400">★</span>}
                {profile.isAd && <span className="text-[10px] bg-red-500 text-white px-1 py-0 rounded">AD</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
});

ProfileCard.displayName = 'ProfileCard';
