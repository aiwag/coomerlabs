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

  const isMuted = mutedStreams.has(index);
  const isFavorite = favorites.has(index);
  const isInFullView = fullViewMode === index;
  const isFullscreen = fullscreenStream?.url === streamUrls[index];
  const isPlaying = playingStreams.has(index);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      toggleMute(index);
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
      className={`rounded-full p-1.5 text-white transition-all hover:scale-110 active:scale-95 ${
        active
          ? "bg-cyan-500/80 hover:bg-cyan-500"
          : danger
            ? "bg-red-600/70 hover:bg-red-600"
            : "bg-black/50 hover:bg-black/70"
      } ${className}`}
      title={title}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
      <div className="flex items-center gap-1">
        <div className="relative">
          <ControlButton
            icon={isMuted ? VolumeX : Volume2}
            title={isMuted ? "Unmute" : "Mute"}
            onClick={() => {
              toggleMute(index);
              if (isMuted) setVolume(100);
            }}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          />
          {showVolumeSlider && (
            <div
              className="absolute bottom-full left-1/2 mb-2 w-24 -translate-x-1/2 rounded-lg bg-black/90 p-2 backdrop-blur"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
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
          onClick={() => toggleFavorite(index)}
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
