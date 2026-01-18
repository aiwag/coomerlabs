import React from "react";
import { Eye, Users, Clock, Activity } from "lucide-react";

interface StreamInfoOverlayProps {
  username: string;
  isPlaying: boolean;
  viewerCount?: number;
  duration?: number;
  show?: boolean;
}

export function StreamInfoOverlay({
  username,
  isPlaying,
  viewerCount,
  duration,
  show = false,
}: StreamInfoOverlayProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViewers = (count?: number) => {
    if (!count) return "";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div
      className={`absolute inset-0 z-15 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/60 p-2 transition-opacity ${show ? "opacity-100" : "opacity-0"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <Activity
            size={12}
            className={isPlaying ? "text-green-400" : "text-gray-400"}
          />
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white/90">
            {username}
          </span>
        </div>
        {viewerCount !== undefined && (
          <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white/80">
            <Users size={10} />
            <span>{formatViewers(viewerCount)}</span>
          </div>
        )}
      </div>

      {duration !== undefined && duration > 0 && (
        <div className="flex items-center gap-1 self-end rounded-full bg-black/50 px-2 py-0.5 text-xs text-white/80">
          <Clock size={10} />
          <span>{formatDuration(duration)}</span>
        </div>
      )}
    </div>
  );
}
