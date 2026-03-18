import React from 'react';
import { useGridStore } from '@/state/gridStore';
import { HlsStreamCell } from './HlsStreamCell';
import { useResizeObserver } from '@/hooks/useResizeObserver';

export function RowLayout() {
  const { streamUrls } = useGridStore();
  const { ref, entry } = useResizeObserver<HTMLDivElement>();

  const containerHeight = entry?.contentRect.height || 0;
  const cellWidth = containerHeight * (16/9);

  return (
    <div ref={ref} className="h-full w-full bg-black overflow-x-auto overflow-y-hidden custom-scrollbar flex">
      {streamUrls.map((url, index) => (
        <div key={url} style={{ width: cellWidth, height: '100%' }} className="flex-shrink-0 relative">
          <HlsStreamCell
              id={url} url={url} index={index}
              totalStreams={streamUrls.length}
              isDraggable={false} isDragging={false}
              width={'100%'} height={'100%'}
              isFullViewMode={true} // Treat as always in view for playback
          />
        </div>
      ))}
    </div>
  );
}