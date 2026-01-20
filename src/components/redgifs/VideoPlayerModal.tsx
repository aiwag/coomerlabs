// RedGifs v2 - Glassmorphic Video Player Modal
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Heart,
  Bookmark,
  ExternalLink,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GifItem } from './types';
import { useRedgifsSettings, useRedgifsPlayer } from './hooks';
import { getGifUrl } from './api';

interface VideoPlayerModalProps {
  gifs: GifItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayerModal = React.memo<VideoPlayerModalProps>((props) => {
  const { gifs, currentIndex, isOpen, onClose } = props;
  const { quality } = useRedgifsSettings();
  const {
    isPlaying,
    isMuted,
    volume,
    playbackSpeed,
    setIsPlaying,
    setIsMuted,
    setVolume,
    togglePlay,
    toggleMute,
    setCurrentIndex,
  } = useRedgifsPlayer();

  const [localIndex, setLocalIndex] = useState(currentIndex);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentGif = gifs[localIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, isMuted]);

  // Auto-play video when GIF changes
  useEffect(() => {
    if (videoRef.current && isOpen) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [localIndex, isOpen]);

  // Sync video playback state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleNext = useCallback(() => {
    const nextIndex = (localIndex + 1) % gifs.length;
    setLocalIndex(nextIndex);
    setCurrentIndex(nextIndex);
  }, [localIndex, gifs.length, setCurrentIndex]);

  const handlePrevious = useCallback(() => {
    const prevIndex = (localIndex - 1 + gifs.length) % gifs.length;
    setLocalIndex(prevIndex);
    setCurrentIndex(prevIndex);
  }, [localIndex, gifs.length, setCurrentIndex]);

  const handleDownload = useCallback(() => {
    const url = getGifUrl(currentGif, quality);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentGif.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Download started');
  }, [currentGif, quality]);

  const handleShare = useCallback(async () => {
    const url = `https://redgifs.com/watch/${currentGif.id}`;
    if (navigator.share) {
      await navigator.share({ title: currentGif.description || 'RedGifs', url });
    } else {
      navigator.clipboard.writeText(url);
      toast('Link copied to clipboard');
    }
  }, [currentGif]);

  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    toast(isLiked ? 'Removed from likes' : 'Added to likes');
  }, [isLiked]);

  const handleBookmark = useCallback(() => {
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
  }, [isBookmarked]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  if (!currentGif) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none">
              <div
                className="relative w-full h-full flex items-center justify-center"
                onMouseMove={handleMouseMove}
              >
                {/* Close Button */}
                <Dialog.Close asChild>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-xl transition-all ${showControls ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <X size={24} />
                  </motion.button>
                </Dialog.Close>

                {/* Navigation Buttons */}
                <button
                  onClick={handlePrevious}
                  disabled={gifs.length <= 1}
                  className={`absolute left-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xl transition-all ${gifs.length <= 1 ? 'opacity-0 pointer-events-none' : ''} ${showControls ? 'opacity-100' : 'opacity-0'}`}
                >
                  <ChevronLeft size={28} />
                </button>

                <button
                  onClick={handleNext}
                  disabled={gifs.length <= 1}
                  className={`absolute right-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xl transition-all ${gifs.length <= 1 ? 'opacity-0 pointer-events-none' : ''} ${showControls ? 'opacity-100' : 'opacity-0'}`}
                >
                  <ChevronRight size={28} />
                </button>

                {/* Video Container */}
                <div className="relative max-w-6xl max-h-[90vh]">
                  <video
                    ref={videoRef}
                    src={getGifUrl(currentGif, quality)}
                    className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
                    autoPlay={isPlaying}
                    muted={isMuted}
                    loop
                    onClick={togglePlay}
                  />
                </div>

                {/* Controls */}
                <AnimatePresence>
                  {showControls && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 liquid-modal px-6 py-4 min-w-[400px]"
                    >
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                          <span>{localIndex + 1}</span>
                          <span>/</span>
                          <span>{gifs.length}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            layout
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                            style={{ width: `${((localIndex + 1) / gifs.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Play/Pause */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={togglePlay}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                          >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                          </motion.button>

                          {/* Volume */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleMute}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                          >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </motion.button>

                          {/* Like */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleLike}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                          >
                            <Heart
                              size={20}
                              className={isLiked ? 'fill-red-500 text-red-500' : ''}
                            />
                          </motion.button>

                          {/* Bookmark */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleBookmark}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                          >
                            <Bookmark
                              size={20}
                              className={isBookmarked ? 'fill-blue-500 text-blue-500' : ''}
                            />
                          </motion.button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Download */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleDownload}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            title="Download"
                          >
                            <Download size={20} />
                          </motion.button>

                          {/* Share */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleShare}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            title="Share"
                          >
                            <Share2 size={20} />
                          </motion.button>

                          {/* Fullscreen */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleFullscreen}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            title="Fullscreen"
                          >
                            <Maximize2 size={20} />
                          </motion.button>

                          {/* External Link */}
                          <a
                            href={`https://redgifs.com/watch/${currentGif.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            title="Open on RedGifs"
                          >
                            <ExternalLink size={20} />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
});

VideoPlayerModal.displayName = 'VideoPlayerModal';
