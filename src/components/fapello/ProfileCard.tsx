// Fapello ProfileCard Component
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Bookmark,
  Eye,
  Star,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { useSettings } from './hooks';
import { Profile } from './types';

interface ProfileCardProps {
  profile: Profile;
  index: number;
  onClick: () => void;
}

export const ProfileCard = ({ profile, index, onClick }: ProfileCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { settings } = useSettings();

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
  }, [isLiked]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
  }, [isBookmarked]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: inView ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-2xl glass-card transition-all duration-300 cursor-pointer ${settings.compactView ? 'h-32' : 'h-48'}`}
      onClick={onClick}
      whileHover={{ y: -4, zIndex: 10, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative w-full h-full">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center p-2">
              <X className="h-6 w-6 mx-auto text-gray-500 mb-1" />
              <p className="text-xs text-gray-400">Failed to load</p>
            </div>
          </div>
        ) : (
          <img
            src={profile.imageUrl}
            alt={profile.name}
            className={`w-full h-full absolute object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={handleLike} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <button onClick={handleBookmark} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
              <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="flex items-center justify-between text-white text-xs mb-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <ImageIcon className="h-3 w-3" />
                  {profile.postCount}
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {profile.lastActive}
                </span>
              </div>
              {profile.rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{profile.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-1.5">
            {profile.avatarUrl && (
              <div className="relative">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className={`${settings.compactView ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border border-white/50 object-cover`}
                />
                {profile.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
                {profile.premium && (
                  <div className="absolute -top-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5">
                    <Star className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`${settings.compactView ? 'text-xs' : 'text-sm'} font-semibold text-white truncate`}>
                {profile.name}
              </h3>
              <div className="flex items-center gap-1">
                {profile.verified && <span className="text-xs text-blue-400">✓</span>}
                {profile.premium && <span className="text-xs text-yellow-400">★</span>}
                {profile.isAd && <span className="text-xs bg-red-500 text-white px-1 py-0 rounded">AD</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
