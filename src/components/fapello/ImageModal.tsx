// Fapello ImageModal Component
import React, { useState, useRef, useEffect } from 'react';
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
import { Image, ImageModalProps } from './types';

export const ImageModal = ({
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { settings } = useSettings();
  const currentImage = images[index];

  const handlePrevious = () => setIndex((prev) => (prev - 1 + images.length) % images.length);
  const handleNext = () => setIndex((prev) => (prev + 1) % images.length);
  const handleRandom = () => setIndex(Math.floor(Math.random() * images.length));

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > 400 || (offset.x > 0 && velocity.x > 500)) {
      handlePrevious();
    } else if (offset.x < -400 || (offset.x < 0 && velocity.x < -500)) {
      handleNext();
    }
  };

  const handleDownload = () => {
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
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Check out this image', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Link copied to clipboard');
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleMouseMove = () => {
    if (settings.showControls) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleFullscreen = () => {
    !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen();
  };

  const toggleSlideshow = () => {
    setIsSlideshow(!isSlideshow);
    if (!isSlideshow) {
      handleNext();
      slideshowTimeoutRef.current = setInterval(() => handleNext(), settings.slideshowSpeed);
      toast('Slideshow started');
    } else {
      if (slideshowTimeoutRef.current) clearInterval(slideshowTimeoutRef.current);
      toast('Slideshow stopped');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowLeft': handlePrevious(); break;
        case 'ArrowRight': handleNext(); break;
        case 'Escape': onClose(); break;
        case ' ': e.preventDefault();
          currentImage?.isVideo ? setIsPlaying(!isPlaying) : toggleSlideshow();
          break;
        case 'r': handleRandom(); break;
        case 'f': handleFullscreen(); break;
        case 'd': handleDownload(); break;
        case 's': handleShare(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, isSlideshow, currentImage]);

  useEffect(() => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.play() : videoRef.current.pause();
    }
  }, [isPlaying, index]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (slideshowTimeoutRef.current) clearInterval(slideshowTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isSlideshow && slideshowTimeoutRef.current) {
      clearInterval(slideshowTimeoutRef.current);
      slideshowTimeoutRef.current = setInterval(() => handleNext(), settings.slideshowSpeed);
    }
  }, [index, isSlideshow, settings.slideshowSpeed]);

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none">
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
                    className={`absolute top-6 right-6 text-white/80 hover:text-white p-2 z-20 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-all ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </Dialog.Close>

                <button
                  onClick={handlePrevious}
                  className={`absolute left-4 text-white hover:text-gray-300 p-2 z-10 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                  disabled={images.length <= 1}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                  onClick={handleNext}
                  className={`absolute right-4 text-white hover:text-gray-300 p-2 z-10 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                  disabled={images.length <= 1}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <motion.div
                  key={index}
                  className="relative max-w-5xl max-h-[80vh]"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                >
                  {currentImage.isVideo ? (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        src={currentImage.fullImageUrl || currentImage.imageUrl}
                        className="max-w-full max-h-[80vh] rounded-lg"
                        controls={false}
                        muted={isMuted}
                        loop
                        autoPlay={settings.autoPlay}
                        onClick={() => setIsPlaying(!isPlaying)}
                      />
                      <div className={`absolute bottom-4 left-4 right-4 flex items-center justify-between ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-full bg-black/50 hover:bg-black/70">
                          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                        </button>
                        <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full bg-black/50 hover:bg-black/70">
                          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={settings.highQuality ? (currentImage.fullImageUrl || currentImage.imageUrl) : currentImage.imageUrl}
                      alt={`Image ${currentImage.id}`}
                      className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />
                  )}
                </motion.div>

                {settings.showThumbnails && (
                  <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-2xl overflow-x-auto py-2 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}>
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === index ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-75'}`}
                      >
                        <img src={img.thumbnailUrl || img.imageUrl} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {settings.showControls && showControls && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 shadow-2xl z-20 min-w-[300px]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-white/90">
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer" onClick={handleLike}>
                              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                              <span className="text-sm font-medium">{currentImage.likes?.toLocaleString()}</span>
                            </button>
                            <div className="flex items-center gap-1.5 text-white/70">
                              <Eye className="w-5 h-5" />
                              <span className="text-sm">{currentImage.views?.toLocaleString()}</span>
                            </div>
                          </div>
                          <span className="text-xs text-white/50 font-mono">{index + 1} / {images.length}</span>
                        </div>

                        <div className="h-px bg-white/10 w-full" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {currentImage.isVideo && (
                              <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                              </button>
                            )}
                            <button onClick={toggleSlideshow} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isSlideshow ? 'text-blue-400' : ''}`}>
                              {isSlideshow ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={handleDownload} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Download">
                              <Download className="w-5 h-5" />
                            </button>
                            <button onClick={handleFullscreen} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Fullscreen">
                              <Maximize2 className="w-5 h-5" />
                            </button>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors lg:hidden">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={handleRandom} className="p-1 rounded-full hover:bg-white/20">
                  <Shuffle className="w-4 h-4 text-white" />
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
};
