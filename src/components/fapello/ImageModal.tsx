// Fapello ImageModal Component - Optimized
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Heart,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shuffle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettings } from './hooks';
import type { Image, ImageModalProps } from './types';

// VisuallyHidden component for accessibility
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  }}>
    {children}
  </span>
);

export const ImageModal = memo(({
  images,
  currentIndex,
  isOpen,
  onClose
}: ImageModalProps) => {
  const [index, setIndex] = useState(currentIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { settings } = useSettings();
  const currentImage = images[index];

  // Preload nearby images for smooth navigation
  useEffect(() => {
    if (!isOpen) return;

    const preloadRange = 2; // Preload 2 images before and after
    const newPreloaded = new Set(preloadedImages);

    for (let i = Math.max(0, index - preloadRange); i <= Math.min(images.length - 1, index + preloadRange); i++) {
      if (!newPreloaded.has(i)) {
        const img = new Image();
        img.src = images[i]?.fullImageUrl || images[i]?.imageUrl;
        newPreloaded.add(i);
      }
    }

    setPreloadedImages(newPreloaded);
  }, [isOpen, index, images]);

  const handlePrevious = useCallback(() => {
    setIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const handleRandom = useCallback(() => {
    setIndex(Math.floor(Math.random() * images.length));
  }, []);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (offset.x > swipeThreshold || (offset.x > 0 && velocity.x > velocityThreshold)) {
      handlePrevious();
    } else if (offset.x < -swipeThreshold || (offset.x < 0 && velocity.x < -velocityThreshold)) {
      handleNext();
    }
  }, [handlePrevious, handleNext]);

  const handleDownload = useCallback(() => {
    const url = currentImage?.fullImageUrl || currentImage?.imageUrl;
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      const extension = currentImage?.isVideo ? 'mp4' : 'jpg';
      link.download = `media-${currentImage?.id}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Download started');
    }
  }, [currentImage]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: 'Check out this image', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Link copied to clipboard');
    }
  }, []);

  const handleLike = useCallback(() => {
    setIsLiked(v => !v);
    toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
  }, [isLiked]);

  const handleMouseMove = useCallback(() => {
    if (settings.showControls) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [settings.showControls]);

  const handleFullscreen = useCallback(() => {
    !document.fullscreenElement
      ? document.documentElement.requestFullscreen()
      : document.exitFullscreen();
  }, []);

  const toggleSlideshow = useCallback(() => {
    setIsSlideshow(v => {
      const newValue = !v;
      if (newValue) {
        handleNext();
        slideshowTimeoutRef.current = setInterval(() => handleNext(), settings.slideshowSpeed);
        toast('Slideshow started');
      } else {
        if (slideshowTimeoutRef.current) clearInterval(slideshowTimeoutRef.current);
        toast('Slideshow stopped');
      }
      return newValue;
    });
  }, [handleNext, settings.slideshowSpeed]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowLeft': handlePrevious(); break;
        case 'ArrowRight': handleNext(); break;
        case 'Escape': onClose(); break;
        case ' ':
          e.preventDefault();
          currentImage?.isVideo ? setIsPlaying(v => !v) : toggleSlideshow();
          break;
        case 'r': handleRandom(); break;
        case 'f': handleFullscreen(); break;
        case 'd': handleDownload(); break;
        case 's': handleShare(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentImage, handlePrevious, handleNext, handleRandom, handleFullscreen, handleDownload, handleShare, toggleSlideshow, onClose]);

  // Video playback control
  useEffect(() => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.play() : videoRef.current.pause();
    }
  }, [isPlaying, index]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (slideshowTimeoutRef.current) clearInterval(slideshowTimeoutRef.current);
    };
  }, []);

  // Reset slideshow on index change
  useEffect(() => {
    if (isSlideshow && slideshowTimeoutRef.current) {
      clearInterval(slideshowTimeoutRef.current);
      slideshowTimeoutRef.current = setInterval(() => handleNext(), settings.slideshowSpeed);
    }
  }, [index, isSlideshow, settings.slideshowSpeed, handleNext]);

  // Sync index with currentIndex prop
  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  if (!currentImage) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none">
              <VisuallyHidden>
                <Dialog.Title>Image Viewer</Dialog.Title>
                <Dialog.Description>
                  Viewing image {index + 1} of {images.length}
                </Dialog.Description>
              </VisuallyHidden>
              <div
                className="relative w-full h-full flex items-center justify-center"
                onMouseMove={handleMouseMove}
                onClick={(e) => {
                  if (e.target === e.currentTarget) onClose();
                }}
              >
                <Dialog.Close asChild>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute top-6 right-6 text-white/80 hover:text-white p-2 z-20 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-all ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </Dialog.Close>

                <motion.button
                  onClick={handlePrevious}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`absolute left-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'} ${images.length <= 1 ? 'hidden' : ''}`}
                  disabled={images.length <= 1}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>

                <motion.button
                  onClick={handleNext}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`absolute right-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'} ${images.length <= 1 ? 'hidden' : ''}`}
                  disabled={images.length <= 1}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>

                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="relative max-w-6xl max-h-[85vh]"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                >
                  {currentImage.isVideo ? (
                    <div className="relative rounded-xl overflow-hidden shadow-2xl">
                      <video
                        ref={videoRef}
                        src={currentImage.fullImageUrl || currentImage.imageUrl}
                        className="max-w-full max-h-[85vh]"
                        controls={false}
                        muted={isMuted}
                        loop
                        autoPlay={settings.autoPlay}
                        onClick={() => setIsPlaying(v => !v)}
                      />
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: settings.showControls && showControls ? 1 : 0 }}
                        className={`absolute bottom-4 left-4 right-4 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent pt-12 pb-4`}
                      >
                        <motion.button
                          onClick={() => setIsPlaying(v => !v)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                        </motion.button>
                        <motion.button
                          onClick={() => setIsMuted(v => !v)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                        </motion.button>
                      </motion.div>
                    </div>
                  ) : (
                    <img
                      src={currentImage.fullImageUrl || currentImage.imageUrl}
                      alt={`Image ${currentImage.id}`}
                      loading="eager"
                      className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                    />
                  )}
                </motion.div>

                {/* Thumbnails */}
                {settings.showThumbnails && images.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: settings.showControls && showControls ? 1 : 0, y: 0 }}
                    className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-2xl overflow-x-auto py-3 px-4 bg-black/40 backdrop-blur-md rounded-2xl"
                  >
                    {images.map((img, i) => (
                      <motion.button
                        key={i}
                        onClick={() => setIndex(i)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          i === index
                            ? 'border-white shadow-lg scale-110'
                            : 'border-transparent opacity-50 hover:opacity-75'
                        }`}
                      >
                        <img
                          src={img.thumbnailUrl || img.imageUrl}
                          alt={`Thumbnail ${i}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Controls bar */}
                <AnimatePresence>
                  {settings.showControls && showControls && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 shadow-2xl z-20 min-w-[320px]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-white/90">
                          <div className="flex items-center gap-4">
                            <motion.button
                              onClick={handleLike}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
                            >
                              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                              <span className="text-sm font-medium">{currentImage.likes?.toLocaleString()}</span>
                            </motion.button>
                            <div className="flex items-center gap-1.5 text-white/70">
                              <Eye className="w-5 h-5" />
                              <span className="text-sm">{currentImage.views?.toLocaleString()}</span>
                            </div>
                          </div>
                          <span className="text-xs text-white/50 font-mono">
                            {index + 1} / {images.length}
                          </span>
                        </div>

                        <div className="h-px bg-white/10 w-full" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {currentImage.isVideo && (
                              <motion.button
                                onClick={() => setIsPlaying(v => !v)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                              >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                              </motion.button>
                            )}
                            <motion.button
                              onClick={toggleSlideshow}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isSlideshow ? 'text-blue-400' : ''}`}
                            >
                              {isSlideshow ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </motion.button>
                          </div>

                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={handleDownload}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-full hover:bg-white/10 transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              onClick={handleFullscreen}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-full hover:bg-white/10 transition-colors"
                              title="Fullscreen"
                            >
                              <Maximize2 className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Random button */}
                {images.length > 2 && (
                  <motion.button
                    onClick={handleRandom}
                    className="absolute top-6 left-6 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white transition-all"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    title="Random"
                  >
                    <Shuffle className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
});

ImageModal.displayName = 'ImageModal';
