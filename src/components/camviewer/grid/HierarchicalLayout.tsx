import React, { useState } from 'react';
import { useGridStore } from '@/state/gridStore';
import { HlsStreamCell } from './HlsStreamCell';
import { getUsernameFromUrl, generateThumbUrl } from '@/utils/formatters';

export function HierarchicalLayout() {
  const { streamUrls } = useGridStore();
  const [focusIndex, setFocusIndex] = useState(0);

  if (streamUrls.length === 0) return null;

  const focusStream = streamUrls[focusIndex];
  const secondaryStreams = streamUrls.filter((_, index) => index !== focusIndex);

  return (
    <div className="h-full w-full bg-black flex">
      {/* Main Focus View */}
      <div className="flex-1 h-full relative">
        <HlsStreamCell
            id={focusStream} url={focusStream} index={focusIndex}
            totalStreams={streamUrls.length}
            isDraggable={false} isDragging={false}
            width={'100%'} height={'100%'}
            isFullViewMode={true} // Ensures it's always playing
        />
      </div>
      {/* Secondary Streams Column */}
      {secondaryStreams.length > 0 && (
        <div className="w-48 h-full bg-neutral-900 border-l border-neutral-700 flex-shrink-0 overflow-y-auto custom-scrollbar">
            {secondaryStreams.map(url => {
                const originalIndex = streamUrls.indexOf(url);
                const username = getUsernameFromUrl(url);
                const thumb = generateThumbUrl(username);
                return (
                    <div key={url} className="aspect-video relative cursor-pointer group" onClick={() => setFocusIndex(originalIndex)}>
                        <img src={thumb} className="w-full h-full object-cover" alt={username ?? ''}/>
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-cyan-900/50 transition-colors" />
                        <p className="absolute bottom-1 left-2 text-white text-xs font-bold truncate">{username}</p>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
}