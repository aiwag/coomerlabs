import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, Tv, Power, ImageOff } from 'lucide-react';
import type { Post } from '../types';
import { COOMER_SERVICES, isVideoFile } from '../constants';
import { OptimizedImage } from './OptimizedImage';

// --- MOVIE MODE ---
export const MovieMode = ({
  posts,
  onClose,
  infiniteMode,
  service
}: {
  posts: Post[];
  onClose: () => void;
  infiniteMode: boolean;
  service: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDisplayPosts = () => {
    const result = [];
    const startIndex = currentIndex * 4;
    for (let i = 0; i < 4; i++) {
      const index = (startIndex + i) % posts.length;
      result.push(posts[index]);
    }
    return result;
  };

  const displayPosts = getDisplayPosts();

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const maxIndex = Math.ceil(posts.length / 4) - 1;
          if (infiniteMode && prev >= maxIndex) return 0;
          return prev < maxIndex ? prev + 1 : prev;
        });
      }, 4000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, posts.length, infiniteMode]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const getPostMedia = (post: Post) => {
    const baseUrl = COOMER_SERVICES.includes(service) ? 'https://coomer.st' : 'https://kemono.cr';
    if (post.file) {
      return {
        url: `${baseUrl}${post.file.path}`,
        type: isVideoFile(post.file.name) ? 'video' : 'image'
      };
    }
    if (post.attachments && post.attachments.length > 0) {
      return {
        url: `${baseUrl}${post.attachments[0].path}`,
        type: isVideoFile(post.attachments[0].name) ? 'video' : 'image'
      };
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={onClose} onMouseMove={handleMouseMove}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-8 border-8 border-gray-700 rounded-3xl shadow-2xl">
          <div className="absolute inset-4 border-4 border-gray-600 rounded-2xl">
            <div className="absolute inset-2 bg-black rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                {displayPosts.map((post, index) => {
                  const media = getPostMedia(post);
                  return (
                    <div key={index} className="relative bg-gray-900 overflow-hidden">
                      {media ? (
                        media.type === 'video' ? (
                          <video src={media.url} className="w-full h-full object-cover" autoPlay muted loop />
                        ) : (
                          <OptimizedImage src={media.url} alt={`Movie mode post ${index + 1}`} className="w-full h-full" objectFit="cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff size={24} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-gray-600 text-2xl font-bold">
          CREATOR TV
        </div>

        <div className="absolute bottom-12 right-12 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
          <Power size={24} className="text-gray-500" />
        </div>
      </div>

      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <Tv size={24} />
              Movie Mode
            </h2>
            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <button onClick={(e) => { e.stopPropagation(); setIsPlaying(true); }} className="p-2 text-white rounded-full liquid-button bg-green-500/50 transition-colors">
                  <Play size={20} />
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }} className="p-2 text-white rounded-full liquid-button bg-red-500/50 transition-colors">
                  <Pause size={20} />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(Math.max(0, currentIndex - 1)); }} className="p-2 text-white rounded-full liquid-button hover:bg-gray-700 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => { const maxIndex = Math.ceil(posts.length / 4) - 1; return prev < maxIndex ? prev + 1 : prev; }); }} className="p-2 text-white rounded-full liquid-button hover:bg-gray-700 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white text-sm flex items-center gap-1">
                <input type="checkbox" checked={infiniteMode} onChange={() => { }} className="rounded" />
                Infinite Loop
              </label>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 text-white rounded-full liquid-button hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((currentIndex + 1) / Math.ceil(posts.length / 4)) * 100}%` }}
            />
          </div>
          <p className="text-white text-sm mt-2 text-center">
            Set {currentIndex + 1} / {Math.ceil(posts.length / 4)} • {posts.length} posts
          </p>
        </div>
      </div>
    </div>
  );
};
