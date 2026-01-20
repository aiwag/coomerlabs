// Fapello ImageCard Component
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Bookmark,
  Eye,
  MessageCircle,
  Play,
  X,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { useSettings } from './hooks';
import { Image } from './types';

interface ImageCardProps {
  image: Image;
  index: number;
  onImageClick: (image: Image, index: number) => void;
}

export const ImageCard = ({ image, index, onImageClick }: ImageCardProps) => {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gray-800 w-full`}
      style={{ aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : '3/4' }}
      onClick={() => onImageClick(image, index)}
      whileHover={{ y: -3 }}
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
            src={settings.highQuality ? (image.fullImageUrl || image.imageUrl) : image.imageUrl}
            alt={`Image ${image.id}`}
            className={`w-full h-full absolute object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {image.isVideo && (
          <div className="absolute top-2 left-2 bg-black/50 rounded-full p-1.5">
            <Play className="h-3 w-3 text-white" />
          </div>
        )}

        {image.duration && (
          <div className="absolute bottom-2 left-2 bg-black/50 rounded px-1.5 py-0.5">
            <span className="text-white text-xs">
              {Math.floor(image.duration / 60)}:{(image.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-white/90 rounded-full p-2">
                <ZoomIn className="w-4 h-4 text-gray-800" />
              </div>
              <div className="flex items-center space-x-3 text-white text-xs">
                <div className="flex items-center space-x-0.5">
                  <Heart className="w-3 h-3" />
                  <span>{image.likes?.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-0.5">
                  <Eye className="w-3 h-3" />
                  <span>{image.views?.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-0.5">
                  <MessageCircle className="w-3 h-3" />
                  <span>{image.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleLike} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
            <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <button onClick={handleBookmark} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
            <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
