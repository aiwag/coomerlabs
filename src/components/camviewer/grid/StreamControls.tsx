import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Star,
  Camera,
  PictureInPicture,
  Maximize2,
  Monitor,
  RefreshCw,
  Pause,
  Play,
  Settings,
  Copy,
  Trash2,
} from "lucide-react";
import { useGridStore } from "@/state/gridStore";

export function StreamControls({
  index,
  onReload,
  isPaused,
  onTogglePause,
}: {
  index: number;
  onReload?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}) {
  const {
    mutedStreams,
    favorites,
    playingStreams,
    toggleMute,
    toggleFavorite,
    setFullViewMode,
    setFullscreenStream,
    streamUrls,
    fullViewMode,
    fullscreenStream,
    removeStream,
  } = useGridStore();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(100);

  const url = streamUrls[index];
  const isMuted = mutedStreams.has(url);
  const isFavorite = favorites.has(url);
  const isInFullView = fullViewMode === index;
  const isFullscreen = fullscreenStream?.url === url;
  const isPlaying = playingStreams.has(index);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      toggleMute(url);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(streamUrls[index]);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleFullscreen = () => {
    if (isFullscreen) {
      setFullscreenStream(null);
    } else {
      const url = streamUrls[index];
      const username = url.match(/chaturbate\.com\/([^/]+)/)?.[1] ?? "unknown";
      setFullscreenStream({ url, username });
    }
  };

  const ControlButton = ({
    icon: Icon,
    active = false,
    danger = false,
    title,
    onClick,
    className = "",
  }: any) => (
    <button
      onClick={onClick}
      className={`rounded-full p-1.5 text-white transition-all hover:scale-110 active:scale-95 ${active
          ? "bg-cyan-500/80 hover:bg-cyan-500 shadow-lg shadow-cyan-500/50"
          : danger
            ? "bg-red-600/70 hover:bg-red-600 shadow-lg shadow-red-600/50"
            : "bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10"
        } ${className}`}
      title={title}
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-2 opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
         style={{
             background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 100%)',
             backdropFilter: 'blur(20px) saturate(180%)',
             WebkitBackdropFilter: 'blur(20px) saturate(180%)',
             borderTop: '1px solid rgba(255, 255, 255, 0.1)',
         }}>
      <div className="flex items-center gap-1">
        <div className="relative">
          <ControlButton
            icon={isMuted ? VolumeX : Volume2}
            title={isMuted ? "Unmute" : "Mute"}
            onClick={() => {
              toggleMute(url);
              if (isMuted) setVolume(100);
            }}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          />
          {showVolumeSlider && (
            <div
              className="absolute bottom-full left-1/2 mb-2 w-24 -translate-x-1/2 rounded-lg p-2 shadow-2xl"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.7) 100%)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-cyan-500"
              />
              <div className="mt-1 text-center text-xs text-white/60">
                {volume}%
              </div>
            </div>
          )}
        </div>

        {onTogglePause && (
          <ControlButton
            icon={isPaused ? Play : Pause}
            title={isPaused ? "Play" : "Pause"}
            onClick={onTogglePause}
          />
        )}

        <ControlButton
          icon={Star}
          active={isFavorite}
          title="Favorite"
          onClick={() => toggleFavorite(url)}
          className={isFavorite ? "text-yellow-400" : ""}
        />
      </div>

      <div className="flex items-center gap-1">
        {onReload && (
          <ControlButton
            icon={RefreshCw}
            title="Reload Stream"
            onClick={onReload}
          />
        )}

        <ControlButton icon={Copy} title="Copy URL" onClick={handleCopyUrl} />

        <ControlButton icon={Camera} title="Snapshot" />

        <ControlButton icon={PictureInPicture} title="Picture-in-Picture" />

        <ControlButton
          icon={Maximize2}
          active={isInFullView}
          title="Focus View"
          onClick={() => setFullViewMode(index)}
        />

        <ControlButton
          icon={Monitor}
          active={isFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          onClick={handleFullscreen}
        />

        <ControlButton icon={Settings} title="Stream Settings" />

        <ControlButton
          icon={Trash2}
          danger
          title="Remove Stream"
          onClick={() => removeStream(index)}
        />
      </div>
    </div>
  );
}
