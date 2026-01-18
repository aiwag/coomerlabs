import React from "react";
import { useGridStore } from "@/state/gridStore";
import { useSettingsStore } from "@/state/settingsStore";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useOptimalLayout } from "@/hooks/useOptimalLayout";
import { SortableWebview } from "./SortableWebview";

interface OptimalGridLayoutProps {
  activeId: string | null;
}

export function OptimalGridLayout({ activeId }: OptimalGridLayoutProps) {
  const { streamUrls } = useGridStore();
  const { layoutMode } = useSettingsStore();
  const { ref, entry } = useResizeObserver<HTMLDivElement>();

  const { columns, cellWidth, cellHeight } = useOptimalLayout({
    containerWidth: entry?.contentRect.width || 0,
    containerHeight: entry?.contentRect.height || 0,
    streamCount: streamUrls.length,
  });

  const manualColumns =
    typeof layoutMode === "number"
      ? layoutMode
      : Math.ceil(Math.sqrt(streamUrls.length)) || 1;
  const isMagic = layoutMode === "magic";

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-black">
      {streamUrls.map((url, index) => {
        const cols = isMagic ? columns : manualColumns;
        const containerWidth = entry?.contentRect.width || 0;
        const w = isMagic ? cellWidth : containerWidth / cols;
        const h = isMagic ? cellHeight : w / (16 / 9);
        const col = index % cols;
        const row = Math.floor(index / cols);
        const top = row * h;
        const left = col * w;

        if (w === 0 || h === 0) return null;

        return (
          <SortableWebview
            key={url}
            id={url}
            url={url}
            index={index}
            isDragging={activeId === url}
            isDraggable={true} // Dragging is enabled for this layout
            width={w}
            height={h}
            top={top}
            left={left}
          />
        );
      })}
    </div>
  );
}
