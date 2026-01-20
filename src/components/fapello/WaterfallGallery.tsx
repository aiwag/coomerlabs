// Fapello WaterfallGallery Component
import React, { useState, useEffect } from 'react';
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

export const WaterfallGallery = ({
  items,
  renderItem,
  columnCount = 3,
  hasNextPage,
  fetchNextPage,
  className = ""
}: WaterfallGalleryProps) => {
  const [columns, setColumns] = useState<Array<any[]>>([]);
  const { ref, inView } = useInView({ rootMargin: '400px', threshold: 0, triggerOnce: false });
  const { settings } = useSettings();

  useEffect(() => {
    const newColumns: any[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
      const columnIndex = index % columnCount;
      newColumns[columnIndex].push(item);
    });
    setColumns(newColumns);
  }, [items, columnCount]);

  useEffect(() => {
    if (inView && hasNextPage && fetchNextPage && settings.infiniteScroll) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, settings.infiniteScroll]);

  return (
    <>
      <div
        className={`grid gap-2 ${className}`}
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-2">
            <AnimatePresence mode='popLayout'>
              {column.map((item, itemIndex) => {
                const originalIndex = items.indexOf(item);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={item.id || originalIndex}
                  >
                    {renderItem(item, originalIndex)}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {hasNextPage && settings.infiniteScroll && (
        <div ref={ref} className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      {hasNextPage && !settings.infiniteScroll && (
        <div className="flex justify-center py-4">
          <button onClick={fetchNextPage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Load More
          </button>
        </div>
      )}
    </>
  );
};
