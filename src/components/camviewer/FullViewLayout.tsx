import React, { useMemo } from "react";
import { useGridStore } from "@/state/gridStore";
import { SortableWebview } from "./grid/SortableWebview";
import { MinimizedStream } from "./MinimizedStream";
import { Minimize2, Volume2, VolumeX, ExternalLink, Star, Trash2 } from "lucide-react";
import { getUsernameFromUrl } from "@/utils/formatters";

export function FullViewLayout() {
  const { fullViewMode, streamUrls, setFullViewMode, favorites, toggleFavorite, removeStream } = useGridStore();
  const [isMuted, setIsMuted] = React.useState(false);

  if (fullViewMode === null) return null;

  const focusedStream = streamUrls[fullViewMode];
  const username = getUsernameFromUrl(focusedStream) ?? "Stream";
  const isFavorite = favorites.has(focusedStream);

  const minimizedStreams = useMemo(
    () =>
      streamUrls
        .map((url, index) => ({ url, index }))
        .filter((item) => item.index !== fullViewMode),
    [streamUrls, fullViewMode],
  );

  const handlePopout = () => {
    window.open(focusedStream, "_blank", "width=800,height=600");
  };

  return (
    <div className="absolute inset-0 z-[110] flex flex-col pointer-events-none">
      <div className="flex-1" />

      {/* Control Bar */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between glass-header px-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{username}</span>
          <button
            onClick={() => toggleFavorite(focusedStream)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={16} className={isFavorite ? "fill-yellow-400 text-yellow-400" : "text-neutral-400"} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={handlePopout}
            className="p-2 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Pop out"
          >
            <ExternalLink size={18} />
          </button>
          <button
            onClick={() => { removeStream(fullViewMode); setFullViewMode(null); }}
            className="p-2 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
            title="Remove stream"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => setFullViewMode(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-colors"
            title="Exit full view"
          >
            <Minimize2 size={14} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {minimizedStreams.length > 0 && (
        <div className="flex h-14 flex-shrink-0 gap-1 overflow-x-auto glass-header px-3 py-2 pointer-events-auto">
          {minimizedStreams.map(({ url, index }) => (
            <MinimizedStream key={url} url={url} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
