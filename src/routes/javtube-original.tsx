import { createFileRoute } from '@tanstack/react-router'
// src/routes/javlab.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Film, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Plyr from 'plyr-react'; // Import the Plyr component
import 'plyr-react/plyr.css'; // Import the CSS

// Types for our video data
interface VideoData {
  id: string;
  code: string;
  title: string;
  thumbnail: string;
  duration: string;
  quality: string;
  videoUrl?: string;
}

interface PlayerProps {
  video: VideoData;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// Video Player Component using plyr-react
const VideoPlayer: React.FC<PlayerProps> = ({ 
  video, 
  onClose, 
  onNext, 
  onPrevious, 
  hasNext = false, 
  hasPrevious = false 
}) => {
  // Define Plyr options
  const plyrOptions = {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'],
    settings: ['quality', 'speed'],
    tooltips: { controls: true, seek: true },
    hideControls: true, // Show controls on hover
    clickToPlay: true,
  };

  // Define the video source for plyr-react
  const videoSource = {
    type: 'video' as const,
    sources: [
      {
        src: video.videoUrl,
        type: 'video/mp4',
      },
    ],
    // Use the thumbnail as the poster
    poster: video.thumbnail,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {hasPrevious && (
            <button
              onClick={onPrevious}
              className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={onNext}
              className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
            >
              <ChevronRight size={24} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="bg-black rounded-lg overflow-hidden">
          <div className="aspect-video">
            {video.videoUrl ? (
              <Plyr
                source={videoSource}
                options={plyrOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white">Loading video...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-900">
            <h3 className="text-xl font-semibold text-white mb-2">{video.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Film size={16} />
                {video.quality}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {video.duration}
              </span>
              <span>{video.code}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main JavLab Component (no changes needed here)
export const JavTube = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingVideoUrl, setLoadingVideoUrl] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/videos');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch videos: ${response.status}`);
        }
        
        const data = await response.json();
        setVideos(data);
      } catch (error) {
        console.error('Error fetching videos:', error);
        setError('Failed to load videos. Please make sure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoSelect = async (video: VideoData, index: number) => {
    try {
      setLoadingVideoUrl(true);
      setCurrentIndex(index);
      
      const response = await fetch('http://localhost:8080/api/video-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: video.id }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get video URL: ${response.status}`);
      }
      
      const data = await response.json();
      
      const updatedVideo = { ...video, videoUrl: data.videoUrl };
      setSelectedVideo(updatedVideo);
    } catch (error) {
      console.error('Error getting video URL:', error);
      setError('Failed to load video. Please try again.');
    } finally {
      setLoadingVideoUrl(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      handleVideoSelect(videos[currentIndex + 1], currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      handleVideoSelect(videos[currentIndex - 1], currentIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-scroll">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-start">JavTube</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-500" />
              <p className="text-gray-400">Loading videos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                onClick={() => handleVideoSelect(video, index)}
              >
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 transition-all flex items-center justify-center">
                    <Play size={48} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                    <div className="flex justify-between items-end">
                      <span className="text-xs bg-purple-600 px-2 py-1 rounded">{video.quality}</span>
                      <span className="text-xs bg-black bg-opacity-60 px-2 py-1 rounded flex items-center gap-1">
                        <Clock size={12} />
                        {video.duration}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-gray-400">{video.code}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={currentIndex < videos.length - 1}
          hasPrevious={currentIndex > 0}
        />
      )}
      
      {loadingVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-purple-500" />
            <p className="text-white">Loading video stream...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute('/javtube-original')({
  component: () => (
    <JavTube />
  ),
})

export default JavTube;