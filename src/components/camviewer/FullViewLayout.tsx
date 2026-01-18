import React, { useMemo } from "react";
import { useGridStore } from "@/state/gridStore";
import { SortableWebview } from "./grid/SortableWebview";
import { MinimizedStream } from "./MinimizedStream";

export function FullViewLayout() {
  const { fullViewMode, streamUrls } = useGridStore();

  if (fullViewMode === null) return null;

  const focusedStream = streamUrls[fullViewMode];
  const minimizedStreams = useMemo(
    () =>
      streamUrls
        .map((url, index) => ({ url, index }))
        .filter((item) => item.index !== fullViewMode),
    [streamUrls, fullViewMode],
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden bg-black">
        {focusedStream && (
          <SortableWebview
            id={focusedStream}
            url={focusedStream}
            index={fullViewMode}
            isFullViewMode={true}
            isDraggable={false}
            isDragging={false}
            isPlaying={true}
          />
        )}
      </div>
      {minimizedStreams.length > 0 && (
        <div className="flex h-14 flex-shrink-0 gap-1 overflow-x-auto border-t border-white/5 bg-black/40 px-3 py-2 backdrop-blur-sm">
          {minimizedStreams.map(({ url, index }) => (
            <MinimizedStream key={url} url={url} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
