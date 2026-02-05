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
    </div>
  );
}
