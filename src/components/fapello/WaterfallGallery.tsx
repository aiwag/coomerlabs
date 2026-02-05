// Fapello WaterfallGallery Component - Optimized
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Memoized item wrapper to prevent unnecessary re-renders
const MemoizedItem = memo((
{ item, index, renderItem }: { item: any; index: number; renderItem: (item: any, index: number) => React.ReactNode }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1]
      }}
      key={item.id || index}
    >
      {renderItem(item, index)}
    </motion.div>
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

  // Memoize column distribution to prevent recalculation
  const columns = useMemo(() => {
    const newColumns: any[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
      const columnIndex = index % columnCount;
      newColumns[columnIndex].push(item);
    });
    return newColumns;
  }, [items, columnCount]);

  // Throttled fetch with intersection observer
  const { ref, inView } = useInView({
    rootMargin: '600px',
    threshold: 0,
    triggerOnce: false
  });

  // Memoized fetch callback
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  useEffect(() => {
    if (inView && hasNextPage && settings.infiniteScroll) {
      // Small delay to prevent rapid-fire calls
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
          willChange: 'contents'
        }}
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-2">
            <AnimatePresence mode='popLayout' initial={false}>
              {column.map((item, itemIndex) => {
                const originalIndex = items.indexOf(item);
                return (
                  <MemoizedItem
                    key={item.id || originalIndex}
                    item={item}
                    index={originalIndex}
                    renderItem={renderItem}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {hasNextPage && settings.infiniteScroll && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-6"
        >
          <div className="flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-400">Loading more...</span>
          </div>
        </motion.div>
      )}

      {/* Load more button */}
      {hasNextPage && !settings.infiniteScroll && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center py-6"
        >
          <motion.button
            onClick={handleFetchNextPage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Load More
          </motion.button>
        </motion.div>
      )}

      {/* End of content message */}
      {!hasNextPage && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-8"
        >
          <div className="text-gray-500 text-sm flex items-center gap-2">
            <div className="w-8 h-px bg-gray-700" />
            <span>You've reached the end</span>
            <div className="w-8 h-px bg-gray-700" />
          </div>
        </motion.div>
      )}
    </>
  );
});

WaterfallGallery.displayName = 'WaterfallGallery';
