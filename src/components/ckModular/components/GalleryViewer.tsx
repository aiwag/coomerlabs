import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Heart, Bookmark, Download,
  X, Play, Pause, Info, Check, Copy,
  ZoomIn, ZoomOut, RotateCw, Minimize2, Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Post } from '../types';
import { COOMER_SERVICES, isVideoFile } from '../constants';
import { DownloadService } from '../services/DownloadService';
import { OptimizedImage } from './OptimizedImage';

// --- GALLERY VIEWER ---
export const GalleryViewer = ({
  post,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  currentIndex,
  totalCount,
  service
}: {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  currentIndex: number;
  totalCount: number;
  service: string;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable likes count - computed once per post, not on every render
  const stableLikes = useRef(0);
  useEffect(() => {
    stableLikes.current = Math.floor(Math.random() * 1000) + 100;
    setLikes(stableLikes.current);
  }, [post?.id]);

  const getMediaUrl = (path: string, svc: string) => {
    return COOMER_SERVICES.includes(svc) ? `https://coomer.st${path}` : `https://kemono.cr${path}`;
  };

  const mediaItems = useMemo(() => {
    if (!post) return [];
    const items: Array<{ type: string; url: string; name: string }> = [];

    if (post.file) {
      items.push({
        type: isVideoFile(post.file.name) ? 'video' : 'image',
        url: getMediaUrl(post.file.path, service),
        name: post.file.name
      });
    }

    if (post.attachments && post.attachments.length > 0) {
      post.attachments.forEach(att => {
        items.push({
          type: isVideoFile(att.name) ? 'video' : 'image',
          url: getMediaUrl(att.path, service),
          name: att.name
        });
      });
    }

    return items;
  }, [post, service]);

  const currentMedia = mediaItems[currentImageIndex];

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleShare = async () => {
    if (currentMedia) {
      try {
        await navigator.clipboard.writeText(currentMedia.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast('Link copied to clipboard');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleDownload = async () => {
    if (!currentMedia) return;
    const downloadService = DownloadService.getInstance();
    const dir = await downloadService.selectDownloadDirectory();
    if (!dir) return;

    const fileName = currentMedia.name || `${post?.id || 'download'}.${currentMedia.type === 'video' ? 'mp4' : 'jpg'}`;
    const filePath = `${dir}/${fileName}`;

    try {
      await downloadService.downloadFile(currentMedia.url, filePath);
      toast.success(`Downloaded: ${fileName}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleNextImage = () => {
    if (currentImageIndex < mediaItems.length - 1) setCurrentImageIndex(currentImageIndex + 1);
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1);
  };

  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    } else if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [showControls]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) handleFullscreen();
          else onClose();
          break;
        case 'ArrowLeft':
          if (mediaItems.length > 1) handlePreviousImage();
          else if (hasPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (mediaItems.length > 1) handleNextImage();
          else if (hasNext) onNext();
          break;
        case ' ':
          e.preventDefault();
          if (currentMedia?.type === 'video') setIsPlaying(!isPlaying);
          break;
        case 'f': handleFullscreen(); break;
        case '+': case '=': handleZoomIn(); break;
        case '-': case '_': handleZoomOut(); break;
        case 'r': handleRotate(); break;
        case '0': handleReset(); break;
        case 'l': handleLike(); break;
        case 'b': handleBookmark(); break;
        case 'd': handleDownload(); break;
        case 'c': handleShare(); break;
        case 'i': setShowInfo(!showInfo); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext, hasPrevious, hasNext, isFullscreen, isPlaying, showInfo, isLiked, currentMedia, mediaItems]);

  if (!post || !currentMedia) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div
        ref={containerRef}
        className={`relative w-full h-full flex flex-col ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setShowControls(!showControls)}
      >
        <div className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 text-white">
              <span className="text-sm bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                {currentIndex + 1} / {totalCount}
              </span>
              {mediaItems.length > 1 && (
                <span className="text-sm bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                  {currentImageIndex + 1} / {mediaItems.length}
                </span>
              )}
              <span className="text-sm">{post.service}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleLike} className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}>
                <Heart size={18} fill={isLiked ? 'white' : 'none'} />
              </button>
              <button onClick={handleBookmark} className={`p-2 rounded-full transition-colors ${isBookmarked ? 'bg-blue-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}>
                <Bookmark size={18} fill={isBookmarked ? 'white' : 'none'} />
              </button>
              <button onClick={handleShare} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <button onClick={handleDownload} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                <Download size={18} />
              </button>
              <button onClick={() => setShowInfo(!showInfo)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                <Info size={18} />
              </button>
              <button onClick={handleFullscreen} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {mediaItems.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <button onClick={handlePreviousImage} className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white bg-black/50 rounded-full hover:bg-black/70 transition-all backdrop-blur-sm hover:scale-110">
                <ChevronLeft size={28} />
              </button>
            )}
            {currentImageIndex < mediaItems.length - 1 && (
              <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white bg-black/50 rounded-full hover:bg-black/70 transition-all backdrop-blur-sm hover:scale-110">
                <ChevronRight size={28} />
              </button>
            )}
          </>
        )}

        <div className="flex-grow flex items-center justify-center bg-black relative overflow-hidden">
          <div
            className="relative w-full h-full flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}
          >
            {currentMedia.type === 'video' ? (
              <video src={currentMedia.url} className="max-w-full max-h-full object-contain" controls={false} autoPlay={isPlaying} loop muted onClick={(e) => e.stopPropagation()} />
            ) : (
              <OptimizedImage src={currentMedia.url} alt={post.title} className="max-w-full max-h-full object-contain" priority={true} />
            )}
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasPrevious && (
                <button onClick={onPrevious} className="p-2 text-white hover:bg-white/20 rounded-full">
                  <ChevronLeft size={20} />
                </button>
              )}
              {currentMedia.type === 'video' && (
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 text-white hover:bg-white/20 rounded-full">
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
              )}
              {hasNext && (
                <button onClick={onNext} className="p-2 text-white hover:bg-white/20 rounded-full">
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/20 rounded-full"><ZoomOut size={20} /></button>
              <span className="text-white text-sm w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/20 rounded-full"><ZoomIn size={20} /></button>
              <button onClick={handleRotate} className="p-2 text-white hover:bg-white/20 rounded-full"><RotateCw size={20} /></button>
              <button onClick={handleReset} className="p-2 text-white hover:bg-white/20 rounded-full"><span className="text-xs">1:1</span></button>
            </div>
          </div>

          {totalCount > 1 && (
            <div className="flex items-center justify-center mt-2 gap-1">
              {Array.from({ length: totalCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => { }}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>

        {showInfo && (
          <div className="absolute bottom-20 left-4 right-4 bg-black/80 backdrop-blur-md rounded-lg p-4 text-white max-w-md">
            <h3 className="font-semibold mb-3">{post.title}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Service:</span>
                <span>{post.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Published:</span>
                <span>{new Date(post.published).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Likes:</span>
                <span>{likes}</span>
              </div>
              {post.content && (
                <div>
                  <span className="text-gray-400">Content:</span>
                  <p className="mt-1 line-clamp-3">{post.content}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
