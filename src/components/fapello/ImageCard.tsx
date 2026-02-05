// Fapello ImageCard Component - Optimized
import React, { useState, useCallback, memo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Bookmark,
  Eye,
  MessageCircle,
  Play,
  X,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { useSettings } from './hooks';
import type { Image } from './types';

interface ImageCardProps {
  image: Image;
  index: number;
  onImageClick: (image: Image, index: number) => void;
}

// Loading skeleton component
const ImageCardSkeleton = ({ aspectRatio = '3/4' }: { aspectRatio?: string }) => (
  <div className="relative overflow-hidden rounded-xl bg-gray-800" style={{ aspectRatio }}>
    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
    </div>
  </div>
);

export const ImageCard = memo(({ image, index, onImageClick }: ImageCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingHQ, setLoadingHQ] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.01,
    rootMargin: '200px',
  });

  const { settings } = useSettings();

  const aspectRatio = image.width && image.height
    ? `${image.width}/${image.height}`
    : '3/4';

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

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setLoadingHQ(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
    setLoadingHQ(false);
  }, []);

  // Extract file type from URL
  const getFileType = useCallback((url: string) => {
    if (!url) return 'IMG';
    const ext = url.split('.').pop()?.toUpperCase().split('?')[0];
    if (ext === 'JPEG' || ext === 'JPG' || ext === 'PNG' || ext === 'WEBP' || ext === 'GIF') {
      return ext;
    }
    if (ext === 'MP4' || ext === 'WEBM' || ext === 'MOV') {
      return ext;
    }
    return image.isVideo ? 'MP4' : 'IMG';
  }, [image.isVideo]);

  const fileType = getFileType(image.imageUrl);

  const handleClick = useCallback(() => {
    // Load HQ image on click if not already loaded and not using alwaysHD
    if (image.fullImageUrl && image.fullImageUrl !== image.imageUrl && !loadingHQ && !settings.alwaysHD) {
      setLoadingHQ(true);
      if (imgRef.current) {
        imgRef.current.src = image.fullImageUrl;
      }
    }
    onImageClick(image, index);
  }, [image, index, onImageClick, loadingHQ, settings.alwaysHD]);

  // Use HD if alwaysHD is enabled, otherwise use thumbnail
  const displayUrl = settings.alwaysHD
    ? (image.fullImageUrl || image.imageUrl)
    : image.imageUrl;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.2) }}
      className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gray-800/50"
      style={{ aspectRatio }}
      onClick={inView ? handleClick : undefined}
      whileHover={inView ? { y: -4, scale: 1.02 } : undefined}
      whileTap={inView ? { scale: 0.98 } : undefined}
    >
      <div className="relative w-full h-full">
        {/* Loading skeleton - show as background overlay when loading */}
        {(!imageLoaded && !imageError) && (
          <div className="absolute inset-0 z-10">
            <ImageCardSkeleton aspectRatio={aspectRatio} />
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-800/50 backdrop-blur-sm">
            <X className="h-8 w-8 text-gray-500 mb-2" />
            <p className="text-xs text-gray-400">Failed to load</p>
          </div>
        )}

        {/* Image - always render but hidden until loaded */}
        <img
          ref={imgRef}
          src={inView ? displayUrl : undefined}
          alt={`Image ${image.id}`}
          loading="lazy"
          decoding="async"
          className={`w-full h-full absolute object-cover transition-all duration-700 ease-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} group-hover:scale-110`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* HQ indicator badge - only show when not using alwaysHD */}
        {!settings.alwaysHD && image.fullImageUrl && image.fullImageUrl !== image.imageUrl && !loadingHQ && (
          <div className="absolute top-2 left-2 bg-blue-500/80 backdrop-blur-sm rounded px-2 py-0.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-white text-[10px] font-bold">HQ</span>
          </div>
        )}

        {/* HQ loading indicator */}
        {loadingHQ && (
          <div className="absolute top-2 left-2 bg-green-500/80 backdrop-blur-sm rounded px-2 py-0.5 shadow-lg flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-[10px] font-bold">Loading HQ</span>
          </div>
        )}

        {/* Video indicator */}
        {image.isVideo && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-12 bg-black/60 backdrop-blur-sm rounded-full p-1.5 shadow-lg"
          >
            <Play className="h-3 w-3 text-white fill-white" />
          </motion.div>
        )}

        {/* File type badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-0.5 shadow-lg">
          <span className="text-white text-[10px] font-bold tracking-wider">
            {fileType}
          </span>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Center zoom indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-xl"
          >
            <ZoomIn className="w-5 h-5 text-gray-800" />
          </motion.div>
        </div>

        {/* Stats overlay */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-2 right-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="flex items-center gap-3 text-white text-xs">
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
              <Heart className="w-3 h-3" />
              <span className="font-medium">{image.likes?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
              <Eye className="w-3 h-3" />
              <span className="font-medium">{image.views?.toLocaleString()}</span>
            </div>
            {image.comments && (
              <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                <MessageCircle className="w-3 h-3" />
                <span className="font-medium">{image.comments}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <button
            onClick={handleLike}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
            aria-label="Like"
          >
            <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <button
            onClick={handleBookmark}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
            aria-label="Bookmark"
          >
            <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
          </button>
        </motion.div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
});

ImageCard.displayName = 'ImageCard';
