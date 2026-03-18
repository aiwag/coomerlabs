// Fapello WaterfallGallery Component - CSS Animations (no Framer Motion)
import React, { useMemo, memo, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useSettings } from './hooks';

interface WaterfallGalleryProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  columnCount?: number;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  className?: string;
}

// No-overhead item wrapper — pure div, no animation library
const MemoizedItem = memo(
({ item, index, renderItem }: { item: any; index: number; renderItem: (item: any, index: number) => React.ReactNode }) => {
  return (
    <div
      className="anim-scale anim-stagger-capped"
      style={{ '--i': index % 20 } as React.CSSProperties}
      key={item.id || index}
    >
      {renderItem(item, index)}
    </div>
  );
});
MemoizedItem.displayName = 'MemoizedItem';

export const WaterfallGallery = memo(({
  items,
  renderItem,
  columnCount = 3,
  hasNextPage,
  fetchNextPage,
  className = ""
}: WaterfallGalleryProps) => {
  const { settings } = useSettings();

  const columns = useMemo(() => {
    const newColumns: Array<{ item: any; originalIndex: number }[]> = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
      const columnIndex = index % columnCount;
      newColumns[columnIndex].push({ item, originalIndex: index });
    });
    return newColumns;
  }, [items, columnCount]);

  const { ref, inView } = useInView({
    rootMargin: '600px',
    threshold: 0,
    triggerOnce: false
  });

  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && fetchNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  useEffect(() => {
    if (inView && hasNextPage && settings.infiniteScroll) {
      const timeoutId = setTimeout(handleFetchNextPage, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [inView, hasNextPage, settings.infiniteScroll, handleFetchNextPage]);

  return (
    <>
      <div
        className={`grid gap-2 ${className}`}
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          contain: 'layout style paint',
        }}
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-2">
            {column.map(({ item, originalIndex }) => (
              <MemoizedItem
                key={item.id || originalIndex}
                item={item}
                index={originalIndex}
                renderItem={renderItem}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {hasNextPage && settings.infiniteScroll && (
        <div ref={ref} className="flex justify-center py-6 anim-fade">
          <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-400">Loading more...</span>
          </div>
        </div>
      )}

      {/* Load more button */}
      {hasNextPage && !settings.infiniteScroll && (
        <div className="flex justify-center py-6 anim-slide-up">
          <button
            onClick={handleFetchNextPage}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Load More
          </button>
        </div>
      )}

      {/* End of content */}
      {!hasNextPage && items.length > 0 && (
        <div className="flex justify-center py-8 anim-fade">
          <div className="text-gray-500 text-sm flex items-center gap-2">
            <div className="w-8 h-px bg-gray-700" />
            <span>You've reached the end</span>
            <div className="w-8 h-px bg-gray-700" />
          </div>
        </div>
      )}
    </>
  );
});

WaterfallGallery.displayName = 'WaterfallGallery';
