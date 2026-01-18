import React, { useMemo } from "react";
import { Users, Plus, Trash2, Star, Maximize2 } from "lucide-react";
import { useGridStore } from "@/state/gridStore";
import { getUsernameFromUrl, generateThumbUrl } from "@/utils/formatters";
import { Button } from "@/components/ui/button";

export function StreamListSidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const {
    addStream,
    streamUrls,
    favorites,
    playingStreams,
    removeStream,
    toggleFavorite,
    setFullViewMode,
  } = useGridStore();
  const [newStreamUrl, setNewStreamUrl] = React.useState("");
  const [showAddInput, setShowAddInput] = React.useState(false);

  const handleAddStream = () => {
    if (newStreamUrl.trim()) {
      addStream(newStreamUrl.trim());
      setNewStreamUrl("");
      setShowAddInput(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const urlPattern = /^https?:\/\/.+/i;
        if (urlPattern.test(text.trim())) {
          addStream(text.trim());
          setNewStreamUrl("");
        }
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const streamData = useMemo(
    () =>
      streamUrls.map((url, index) => {
        const username = getUsernameFromUrl(url);
        return {
          url,
          username: username ?? `stream-${index}`,
          thumb: generateThumbUrl(username),
          isFavorite: favorites.has(index),
          isPlaying: playingStreams.has(index),
        };
      }),
    [streamUrls, favorites, playingStreams],
  );

  if (collapsed) {
    return (
      <div className="flex h-full w-14 flex-col items-center border-r border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="flex flex-1 flex-col items-center gap-2 py-3">
          <span className="text-xs font-medium text-neutral-500">
            {streamUrls.length}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-48 flex-col border-r border-white/10 bg-black/40 backdrop-blur-sm">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
          Streams
        </h3>
      </header>

      {/* Add Input */}
      {showAddInput && (
        <div className="border-b border-white/5 bg-black/20 p-2">
          <input
            type="text"
            placeholder="Paste URL..."
            value={newStreamUrl}
            onChange={(e) => setNewStreamUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStream()}
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 focus:outline-none"
            autoFocus
          />
        </div>
      )}

      {/* Stream List - More compact */}
      <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto p-1.5">
        {streamData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-600">
            <Plus size={20} className="mb-2 opacity-50" />
            <p className="text-xs">No streams</p>
          </div>
        ) : (
          streamData.map((stream, index) => (
            <div
              key={index}
              className="group relative flex cursor-pointer items-center gap-2 rounded bg-white/5 px-2 py-1 transition-all hover:bg-white/10"
              onClick={() => setFullViewMode(index)}
            >
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-black">
                <img
                  src={stream.thumb}
                  alt={stream.username}
                  className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                />
                <div
                  className={`absolute right-0.5 bottom-0.5 h-1 w-1 rounded-full border border-black ${
                    stream.isPlaying ? "bg-green-500" : "bg-neutral-600"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-neutral-300 transition-colors group-hover:text-white">
                  {stream.username}
                </p>
              </div>

              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(index);
                  }}
                  className="p-0.5 text-neutral-500 transition-colors hover:text-yellow-400"
                >
                  <Star
                    size={10}
                    className={
                      stream.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                    }
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullViewMode(index);
                  }}
                  className="p-0.5 text-neutral-500 transition-colors hover:text-cyan-400"
                >
                  <Maximize2 size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStream(index);
                  }}
                  className="p-0.5 text-neutral-500 transition-colors hover:text-red-400"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions - More compact */}
      <div className="flex gap-1 border-t border-white/5 bg-black/20 p-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddInput(!showAddInput)}
          className="h-7 flex-1 p-0 text-xs"
          title="Add URL"
        >
          <Plus size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePaste}
          className="h-7 flex-1 p-0 text-xs"
          title="Paste URL"
        >
          <Users size={14} />
        </Button>
      </div>
    </div>
  );
}
