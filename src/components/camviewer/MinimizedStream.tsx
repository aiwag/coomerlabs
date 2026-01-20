import React, { useState, useEffect } from "react";
import { useGridStore } from "@/state/gridStore";
import { useSettingsStore } from "@/state/settingsStore";
import { Activity, Play, Pause, Star, Trash2, Layers } from "lucide-react";
import { getUsernameFromUrl, generateThumbUrl } from "@/utils/formatters";

interface MinimizedStreamProps {
  url: string;
  index: number;
}

export function MinimizedStream({ url, index }: MinimizedStreamProps) {
  const {
    setFullViewMode,
    playingStreams,
    favorites,
    toggleFavorite,
    removeStream,
  } = useGridStore();
  const { toggleFullscreenView } = useSettingsStore();
  const isPlaying = playingStreams.has(index);
  const isFavorite = favorites.has(url);
  const username = getUsernameFromUrl(url) ?? "unknown";

  const [thumbKey, setThumbKey] = useState(Date.now());
  const baseThumb = generateThumbUrl(username);
  const separator = baseThumb.includes('?') ? '&' : '?';
  const thumbUrl = `${baseThumb}${separator}t=${thumbKey}`;

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setThumbKey(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshThumb = () => {
    setThumbKey(Date.now());
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(url);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeStream(index);
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullViewMode(index);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFullscreenView();
  };

  return (
    <div
      className="group relative h-full w-32 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-800 transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20"
      onMouseEnter={handleRefreshThumb}
    >
      <button
        className="relative h-full w-full"
        onClick={() => setFullViewMode(index)}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={thumbUrl}
          alt={username}
          className="h-full w-full object-cover transition-transform group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Playing Status Indicator - Top Right */}
        <div className="absolute top-2 right-2">
          <div
            className={`flex items-center justify-center rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm ${isPlaying ? "text-green-400" : "text-red-400"
              }`}
          >
            <Activity size={12} className={isPlaying ? "animate-pulse" : ""} />
          </div>
        </div>

        {/* Username - Bottom Center */}
        <div className="absolute right-0 bottom-0 left-0 p-2">
          <div className="truncate text-center text-xs font-medium text-white drop-shadow-md">
            {username}
          </div>
        </div>

        {/* Play/Pause Overlay - Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handlePlayPause}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white shadow-xl backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
          >
            {isPlaying ? (
              <Pause size={20} />
            ) : (
              <Play size={20} className="ml-0.5" />
            )}
          </button>
        </div>

        {/* Action Buttons - Top Left */}
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleToggleFavorite}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-yellow-600"
            title={isFavorite ? "Remove favorite" : "Add to favorites"}
          >
            <Star
              size={12}
              className={isFavorite ? "fill-yellow-400 text-yellow-400" : ""}
            />
          </button>
          <button
            onClick={handleRemove}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-red-500"
            title="Remove stream"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Expand to Full View - Bottom Right */}
        <div className="absolute right-2 bottom-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullViewMode(index);
            }}
            onDoubleClick={handleDoubleClick}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600/90 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-cyan-500"
            title="Expand to full view"
          >
            <Layers size={12} />
          </button>
        </div>
      </button>
    </div>
  );
}
