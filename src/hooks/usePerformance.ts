import { useEffect, useRef } from 'react';

/**
 * Performance monitoring hook for development
 * Logs component render times and counts
 * Only active in development mode
 */
export function usePerformanceMonitor(componentName: string, enabled = true) {
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        if (!enabled || process.env.NODE_ENV !== 'development') return;

        renderCount.current += 1;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        // Only log if renders are happening too frequently (< 16ms = > 60fps)
        if (renderCount.current > 1 && timeSinceLastRender < 16) {
            console.warn(
                `⚠️ [Performance] ${componentName} rendered ${renderCount.current} times. ` +
                `Last render: ${timeSinceLastRender}ms ago (< 16ms threshold)`
            );
        }

        // Log milestone renders
        if (renderCount.current % 10 === 0) {
            console.info(
                `📊 [Performance] ${componentName} has rendered ${renderCount.current} times`
            );
        }
    });

    return {
        renderCount: renderCount.current,
        resetCount: () => {
            renderCount.current = 0;
            lastRenderTime.current = Date.now();
        }
    };
}

/**
 * Throttle helper for performance optimization
 * Returns a throttled version of the callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const lastRun = useRef(Date.now());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return ((...args: Parameters<T>) => {
        const now = Date.now();
        const timeSinceLastRun = now - lastRun.current;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (timeSinceLastRun >= delay) {
            lastRun.current = now;
            callback(...args);
        } else {
            timeoutRef.current = setTimeout(() => {
                lastRun.current = Date.now();
                callback(...args);
            }, delay - timeSinceLastRun);
        }
    }) as T;
}

/**
 * Debounce helper for performance optimization
 * Returns a debounced version of the callback
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return ((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }) as T;
}

/**
 * Memory usage monitor for development
 * Logs memory usage periodically
 */
export function useMemoryMonitor(interval = 5000, enabled = true) {
    useEffect(() => {
        if (!enabled || process.env.NODE_ENV !== 'development') return;
        if (typeof performance === 'undefined' || !(performance as any).memory) return;

        const logMemory = () => {
            const memory = (performance as any).memory;
            const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
            const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
            const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);

            console.info(
                `💾 [Memory] Used: ${usedMB}MB / Total: ${totalMB}MB / Limit: ${limitMB}MB`
            );
        };

        logMemory(); // Log immediately
        const intervalId = setInterval(logMemory, interval);

        return () => clearInterval(intervalId);
    }, [interval, enabled]);
}
