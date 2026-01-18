import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Maximize2, Volume2, Settings } from "lucide-react";

interface EnhancedVideoPlayerProps {
  video: any;
  videoUrl: string;
  poster: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onTimeUpdate?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  video,
  videoUrl,
  poster,
  onClose,
  onNext,
  onPrevious,
  onTimeUpdate,
  hasNext = false,
  hasPrevious = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("720p");
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const qualities = [
    { label: "360p", value: "360p" },
    { label: "480p", value: "480p" },
    { label: "720p", value: "720p" },
    { label: "1080p", value: "1080p" },
  ];

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.duration) {
      setDuration(video.duration);
    }
    setCurrentTime(video.currentTime);
  }, [setDuration, setCurrentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", () => {
      if (video.duration) {
        setDuration(video.duration);
      }
    });

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", () => {
        if (video.duration) {
          setDuration(video.duration);
        }
      });
    };
  }, [videoRef]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
      setPlaybackSpeed(newSpeed);
    }
  };

  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    // In a real implementation, you'd fetch the new quality URL
    console.log(`Quality changed to: ${newQuality}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        handlePlayPause();
        break;
      case "ArrowLeft":
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 5));
        break;
      case "ArrowRight":
        e.preventDefault();
        handleSeek(Math.min(duration, currentTime + 5));
        break;
      case "ArrowUp":
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.1));
        break;
      case "ArrowDown":
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.1));
        break;
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "m":
        e.preventDefault();
        setShowControls(!showControls);
        break;
      case ">":
        e.preventDefault();
        handleSpeedChange(Math.min(2, playbackSpeed + 0.25));
        break;
      case "<":
        e.preventDefault();
        handleSpeedChange(Math.max(0.25, playbackSpeed - 0.25));
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-opacity-95 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative w-full max-w-7xl">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {hasPrevious && (
            <button
              onClick={onPrevious}
              className="bg-opacity-50 hover:bg-opacity-70 rounded-full bg-black p-2 text-white transition-all"
            >
              <X size={24} className="rotate-180" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={onNext}
              className="bg-opacity-50 hover:bg-opacity-70 rounded-full bg-black p-2 text-white transition-all"
            >
              <X size={24} />
            </button>
          )}
          <button
            onClick={() => setShowControls(!showControls)}
            className="bg-opacity-50 hover:bg-opacity-70 rounded-full bg-black p-2 text-white transition-all"
          >
            <Settings size={24} />
          </button>
          <button
            onClick={onClose}
            className="bg-opacity-50 hover:bg-opacity-70 rounded-full bg-black p-2 text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video */}
        <div className="overflow-hidden rounded-lg bg-black">
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              key={video.id}
              className="h-full w-full"
              autoPlay
              playsInline
              poster={poster}
              src={videoUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedData={handleTimeUpdate}
              preload="metadata"
            />
          </div>

          {/* Overlay Controls */}
          {showControls && (
            <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  className="bg-opacity-20 hover:bg-opacity-30 rounded-full bg-white p-3 transition-all"
                >
                  {isPlaying ? (
                    <div className="h-6 w-6 border-2 border-white" />
                  ) : (
                    <div className="h-6 w-6" />
                  )}
                </button>

                {/* Time Display */}
                <div className="font-mono text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleVolumeChange(Math.max(0, volume - 0.1))
                    }
                    className="hover:bg-opacity-20 p-1 hover:bg-white"
                  >
                    <Volume2 size={16} />
                  </button>
                  <div className="h-1 w-16 rounded-full bg-gray-600">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleVolumeChange(Math.min(1, volume + 0.1))
                    }
                    className="hover:bg-opacity-20 p-1 hover:bg-white"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      handleSpeedChange(Math.max(0.25, playbackSpeed - 0.25))
                    }
                    className="hover:bg-opacity-20 p-1 hover:bg-white"
                  >
                    <span className="text-xs">0.5x</span>
                  </button>
                  <div className="text-xs font-bold text-green-400">
                    {playbackSpeed}x
                  </div>
                  <button
                    onClick={() =>
                      handleSpeedChange(Math.min(2, playbackSpeed + 0.25))
                    }
                    className="hover:bg-opacity-20 p-1 hover:bg-white"
                  >
                    <span className="text-xs">2x</span>
                  </button>
                </div>

                {/* Quality Selector */}
                <select
                  value={quality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                  className="rounded bg-gray-700 px-2 py-1 text-sm text-white"
                >
                  {qualities.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="hover:bg-opacity-20 p-1 hover:bg-white"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Video Info */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-black to-transparent p-4 text-white">
            <div className="text-right">
              <h3 className="text-lg font-bold">{video.title}</h3>
              <div className="text-sm opacity-75">
                <div>Quality: {quality}</div>
                <div>Duration: {video.duration}</div>
                <div>{video.code}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
