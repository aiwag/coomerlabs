// CoomerKemono - Glassmorphic CreatorCard Component
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, Check, Crown, Star, Zap } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { toast } from 'react-hot-toast';
import { Creator } from './types';
import { useFavorites } from './hooks';
import { getAvatarUrl } from './api';

interface CreatorCardProps {
  creator: Creator;
  index: number;
  onCreatorClick: (creator: Creator) => void;
}

export const CreatorCard = React.memo<CreatorCardProps>(({ creator, index, onCreatorClick }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '400px',
  });

  const { isFavorite, toggleFavorite } = useFavorites();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleFavorite(creator.id);
      toast(isFavorite(creator.id) ? 'Removed from favorites' : 'Added to favorites');
    },
    [creator.id, isFavorite, toggleFavorite]
  );

  const getServiceColor = (service: string) => {
    const colors: Record<string, string> = {
      onlyfans: 'from-blue-500 to-cyan-400',
      fansly: 'from-purple-500 to-pink-400',
      candfans: 'from-orange-500 to-yellow-400',
      patreon: 'from-orange-600 to-orange-400',
      fanbox: 'from-pink-500 to-rose-400',
      discord: 'from-indigo-500 to-blue-400',
      fantia: 'from-violet-500 to-purple-400',
    };
    return colors[service] || 'from-gray-500 to-gray-400';
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative liquid-card-dark overflow-hidden cursor-pointer"
      onClick={() => onCreatorClick(creator)}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="relative w-full h-48 bg-black/50">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 animate-pulse" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900/30 to-red-900/30">
            <Crown className="w-12 h-12 text-white/40" />
          </div>
        ) : (
          <img
            src={getAvatarUrl(creator.service, creator.name)}
            alt={creator.name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Service Badge */}
        <div className="absolute top-2 left-2">
          <div className={`px-2 py-1 rounded-full bg-gradient-to-br ${getServiceColor(creator.service)} backdrop-blur-sm`}>
            <span className="text-[9px] font-bold text-white uppercase">
              {creator.service}
            </span>
          </div>
        </div>

        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
        >
          <Heart
            size={14}
            className={isFavorite(creator.id) ? 'fill-red-500 text-red-500' : 'text-white/80'}
          />
        </motion.button>

        {/* Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye size={12} className="text-white/60" />
                <span className="text-sm font-medium">{creator.indexed || 0}</span>
              </div>
              {creator.favorited > 0 && (
                <div className="flex items-center gap-1">
                  <Heart size={12} className="text-red-400" />
                  <span className="text-sm font-medium">{creator.favorited}</span>
                </div>
              )}
            </div>
            {creator.updated && (
              <div className="text-xs text-white/40">
                {new Date(creator.updated * 1000).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 border-t border-white/5">
        <h3 className="text-sm font-bold text-white mb-1 truncate group-hover:text-cyan-400 transition-colors">
          {creator.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>Posts</span>
          <span>•</span>
          <span className="text-white/60">Click to view</span>
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
    </motion.div>
  );
});

CreatorCard.displayName = 'CreatorCard';
