import React, { useState, useEffect, useRef } from 'react';
import { Heart, Star, User } from 'lucide-react';
import { toast } from 'sonner';
import type { Creator } from '../types';
import { getCreatorImageUrl, getServiceColor } from '../constants';
import { favoritesManager } from '../services/FavoritesManager';

// --- COMPACT CREATOR CARD ---
export const CompactCreatorCard = React.memo(({
  creator,
  onClick,
  index,
  onMeasure
}: {
  creator: Creator;
  onClick: () => void;
  index: number;
  onMeasure?: (index: number, height: number) => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likes, setLikes] = useState(creator.favorited);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsFavorited(favoritesManager.isFavorite(creator.id));
  }, [creator.id]);

  useEffect(() => {
    if (cardRef.current && onMeasure) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          onMeasure(index, entry.contentRect.height);
        }
      });

      resizeObserver.observe(cardRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [index, onMeasure]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorited) {
      favoritesManager.removeFavorite(creator.id);
      setIsFavorited(false);
      toast('Removed from favorites');
    } else {
      favoritesManager.addFavorite(creator.id);
      setIsFavorited(true);
      toast('Added to favorites');
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl cursor-pointer group transition-transform duration-300 hover:scale-105"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${getServiceColor(creator.service)} opacity-80`} />

      <div className="aspect-square relative">
        <div className="absolute inset-0 p-2">
          {!imageError ? (
            <img
              src={getCreatorImageUrl(creator.service, creator.id)}
              alt={creator.name}
              className="w-full h-full object-cover rounded-lg"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
              <User size={24} className="text-gray-600" />
            </div>
          )}
        </div>

        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex flex-col justify-between transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="flex justify-end gap-1">
            <button
              onClick={handleFavorite}
              className="p-1.5 rounded-full liquid-button text-white hover:bg-white/30 transition-colors"
            >
              <Star size={14} className={isFavorited ? 'fill-yellow-500 text-yellow-500' : ''} />
            </button>
            <button
              onClick={handleLike}
              className="p-1.5 rounded-full liquid-button text-white hover:bg-white/30 transition-colors"
            >
              <Heart size={14} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
            </button>
          </div>

          <div>
            <h3 className="text-white font-bold text-sm truncate">{creator.name}</h3>
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-xs">{creator.service}</span>
              <span className="text-white/80 text-xs flex items-center gap-1">
                <Heart size={10} />
                {likes}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CompactCreatorCard.displayName = 'CompactCreatorCard';
