import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Star,
  Camera,
  PictureInPicture,
  Maximize2,
  Minimize2,
  Monitor,
  RefreshCw,
  Pause,
  Play,
  Settings,
  Copy,
  Trash2,
  ExternalLink,
  User,
  GripVertical
} from "lucide-react";
import { useGridStore } from "@/state/gridStore";
import { useShallow } from "zustand/react/shallow";
import { useProfileModalStore } from "@/state/profileModalStore";
import { getUsernameFromUrl } from "@/utils/formatters";

export const StreamControls = React.memo(({
  index,
  onReload,
  isPaused,
  onTogglePause,
}: {
  index: number;
  onReload?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
}) => {
  const openProfile = useProfileModalStore((state) => state.openProfile);
  const {
    isMuted,
    isFavorite,
    isInFullView,
    isFullscreen,
    url,
    toggleMute,
    toggleFavorite,
    setFullViewMode,
    setFullscreenStream,
    removeStream,
    streamUrls,
  } = useGridStore(useShallow((state) => {
    const streamUrl = state.streamUrls[index];
    return {
      isMuted: state.mutedStreams.has(streamUrl),
      isFavorite: state.favorites.has(streamUrl),
      isInFullView: state.fullViewMode === index,
      isFullscreen: state.fullscreenStream?.url === streamUrl,
      url: streamUrl,
      streamUrls: state.streamUrls,
      toggleMute: state.toggleMute,
      toggleFavorite: state.toggleFavorite,
      setFullViewMode: state.setFullViewMode,
      setFullscreenStream: state.setFullscreenStream,
      removeStream: state.removeStream,
    };
  }));

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(100);

  const username = getUsernameFromUrl(url) || "Stream";

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      toggleMute(url);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handlePopout = () => {
    window.open(url, '_blank', 'width=800,height=600');
  };

  const handleFullscreen = () => {
    if (isFullscreen) {
      setFullscreenStream(null);
    } else {
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
    onMouseEnter,
    onMouseLeave,
  }: any) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`rounded-full p-1.5 text-white transition-all hover:scale-110 active:scale-95 ${active
        ? "bg-cyan-500/80 hover:bg-cyan-500 shadow-lg shadow-cyan-500/50"
        : danger
          ? "bg-red-600/70 hover:bg-red-600 shadow-lg shadow-red-600/50"
          : "bg-black/40 hover:bg-black/60 border border-white/5"
        } ${className}`}
      title={title}
    >
      <Icon size={12} />
    </button>
  );

  return (
    <div className={`absolute inset-x-0 top-0 z-50 flex items-center justify-between px-2 py-1.5 transition-opacity duration-300 ${isInFullView ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      style={{
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}>

      {/* Left Area: Name + Drag + Fav */}
      <div className="flex items-center gap-1.5 overflow-hidden">
        <div className="flex h-6 items-center gap-1 rounded bg-white/10 px-1.5 text-[10px] font-bold uppercase tracking-wider text-white/90">
          <GripVertical size={10} className="text-white/40" />
          <span className="max-w-[80px] truncate">{username}</span>
        </div>

        <ControlButton
          icon={Star}
          active={isFavorite}
          title="Favorite"
          onClick={() => toggleFavorite(url)}
          className={isFavorite ? "text-yellow-400" : ""}
        />

        <ControlButton
          icon={User}
          title="View Profile"
          onClick={() => openProfile(username)}
          className="bg-purple-600/50 hover:bg-purple-600"
        />
      </div>

      {/* Right Area: Controls */}
      <div className="flex items-center gap-1">
        <div className="relative flex items-center">
          <ControlButton
            icon={isMuted ? VolumeX : Volume2}
            title={isMuted ? "Unmute" : "Mute"}
            onClick={() => toggleMute(url)}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          />
          {showVolumeSlider && (
            <div
              className="absolute right-full top-1/2 mr-2 w-20 -translate-y-1/2 rounded-full bg-black/80 px-2 py-1 backdrop-blur-md"
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

        {onReload && (
          <ControlButton
            icon={RefreshCw}
            title="Reload Stream"
            onClick={onReload}
          />
        )}

        <ControlButton icon={Copy} title="Copy URL" onClick={handleCopyUrl} />
        <ControlButton icon={ExternalLink} title="Pop-out" onClick={handlePopout} className="bg-blue-600/50 hover:bg-blue-600" />

        <div className="mx-0.5 h-4 w-px bg-white/10" />

        <ControlButton
          icon={isInFullView ? Minimize2 : Maximize2}
          active={isInFullView}
          title={isInFullView ? "Exit Focus" : "Focus View"}
          onClick={() => setFullViewMode(isInFullView ? null : index)}
        />

        <ControlButton
          icon={Monitor}
          active={isFullscreen}
          title="True Fullscreen"
          onClick={handleFullscreen}
        />

        <ControlButton
          icon={Trash2}
          danger
          title="Remove"
          onClick={() => removeStream(index)}
        />
      </div>
    </div>
  );
});
