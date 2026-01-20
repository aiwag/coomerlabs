// RedGifs v2 - Glassmorphic GifCard Component
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, Eye, Volume2, VolumeX, Loader2, ExternalLink } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { GifItem } from './types';
import { useRedgifsSettings, useRedgifsPlayer } from './hooks';
import { getGifUrl, getPosterUrl } from './api';

interface GifCardProps {
  gif: GifItem;
  index: number;
  onGifClick: (gif: GifItem, index: number) => void;
}

export const GifCard = React.memo<GifCardProps>(({ gif, index, onGifClick }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '400px',
  });

  const { quality } = useRedgifsSettings();
  const { isMuted } = useRedgifsPlayer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (videoRef.current && inView && isLoaded) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [inView, isLoaded]);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    onGifClick(gif, index);
  }, [gif, index, onGifClick]);

  useEffect(() => {
    if (inView && !isLoaded && !error) {
      // Preload video
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  }, [inView, isLoaded, error]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative liquid-card-dark rounded-2xl overflow-hidden cursor-pointer"
      style={{ aspectRatio: '4/5' }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Container */}
      <div className="absolute inset-0 bg-black/50">
        {/* Poster/Thumbnail */}
        {!isLoaded && (
          <img
            src={getPosterUrl(gif)}
            alt={gif.description || gif.id}
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: isLoaded ? 0 : 1 }}
          />
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          src={getGifUrl(gif, quality)}
          poster={getPosterUrl(gif)}
          muted={isMuted}
          loop
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setError(true)}
          onMouseEnter={(e) => {
            const video = e.currentTarget;
            video.play().catch(() => {});
          }}
        />

        {/* Audio Indicator */}
        {gif.hasAudio && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm">
            {isMuted ? (
              <VolumeX size={12} className="text-white/80" />
            ) : (
              <Volume2 size={12} className="text-white/80" />
            )}
          </div>
        )}

        {/* Verified Badge */}
        {gif.verified && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 backdrop-blur-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[8px] font-bold text-white uppercase">Verified</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {!isLoaded && inView && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-white/80" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-white/60 text-sm">Failed to load</p>
            </div>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        </div>

        {/* Info Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye size={12} className="text-white/60" />
                <span className="text-xs font-medium">{formatNumber(gif.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={12} className="text-white/60" />
                <span className="text-xs font-medium">{formatNumber(gif.likes)}</span>
              </div>
              {gif.duration && (
                <div className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-medium">
                  {formatDuration(gif.duration)}
                </div>
              )}
            </div>
            <a
              href={`https://redgifs.com/watch/${gif.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} className="text-white/80" />
            </a>
          </div>
        </div>
      </div>

      {/* Shine Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
    </motion.div>
  );
});

GifCard.displayName = 'GifCard';

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
