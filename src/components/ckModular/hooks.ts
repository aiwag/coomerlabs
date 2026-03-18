import { useState, useEffect, useCallback, useRef } from 'react';

// --- NETWORK STATUS HOOK ---
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// --- DEBOUNCE HOOK ---
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// --- MASONRY LAYOUT HOOK ---
export const useMasonryLayout = (
  items: any[],
  columnCount: number,
  gap: number = 8
) => {
  const [layout, setLayout] = useState<{
    positions: { top: number; left: number; width: number; height: number }[];
    containerHeight: number;
  }>({ positions: [], containerHeight: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeights = useRef<number[]>([]);

  const updateLayout = useCallback(() => {
    if (!containerRef.current || items.length === 0) return;

    const containerWidth = containerRef.current.offsetWidth;
    const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
    const columns = Array(columnCount).fill(0);

    const positions = items.map((_, index) => {
      const height = itemHeights.current[index] || 200;
      const shortestColumnIndex = columns.indexOf(Math.min(...columns));
      const top = columns[shortestColumnIndex];
      const left = shortestColumnIndex * (columnWidth + gap);

      columns[shortestColumnIndex] += height + gap;

      return { top, left, width: columnWidth, height };
    });

    const containerHeight = Math.max(...columns) - gap;
    setLayout({ positions, containerHeight });
  }, [items, columnCount, gap]);

  useEffect(() => {
    updateLayout();
  }, [updateLayout]);

  const measureItem = useCallback((index: number, height: number) => {
    if (itemHeights.current[index] !== height) {
      itemHeights.current[index] = height;
      updateLayout();
    }
  }, [updateLayout]);

  return { containerRef, layout, measureItem };
};
