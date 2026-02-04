# Performance Monitoring Guide

## Overview

This guide shows how to use the performance monitoring tools created for the CamViewer optimization project.

---

## 🔧 Performance Hooks

Located in: `src/hooks/usePerformance.ts`

### 1. usePerformanceMonitor

Track component render frequency and performance.

#### Usage:
```typescript
import { usePerformanceMonitor } from '@/hooks/usePerformance';

function MyComponent() {
  // Enable in development only
  usePerformanceMonitor('MyComponent', process.env.NODE_ENV === 'development');
  
  return <div>...</div>;
}
```

#### What it does:
- Counts renders
- Warns if renders happen too frequently (< 16ms = > 60fps)
- Logs milestone renders (every 10th render)
- Auto-disabled in production

#### Example Output:
```
⚠️ [Performance] SortableWebview rendered 15 times. Last render: 8ms ago (< 16ms threshold)
📊 [Performance] StreamGrid has rendered 20 times
```

---

### 2. useThrottle

Throttle function calls for performance.

#### Usage:
```typescript
import { useThrottle } from '@/hooks/usePerformance';

function MyComponent() {
  const handleScroll = useThrottle((e) => {
    console.log('Scroll event:', e);
  }, 150); // Max once every 150ms
  
  return <div onScroll={handleScroll}>...</div>;
}
```

#### When to use:
- Scroll events
- Resize events
- Mouse move events
- Any high-frequency events

---

### 3. useDebounce

Debounce function calls (wait for user to stop).

#### Usage:
```typescript
import { useDebounce } from '@/hooks/usePerformance';

function SearchComponent() {
  const handleSearch = useDebounce((query: string) => {
    // API call
    fetch(`/api/search?q=${query}`);
  }, 300); // Wait 300ms after last keystroke
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

#### When to use:
- Search input
- Form validation
- Auto-save
- Any user input that triggers expensive operations

---

### 4. useMemoryMonitor

Monitor memory usage over time (development only).

#### Usage:
```typescript
import { useMemoryMonitor } from '@/hooks/usePerformance';

function App() {
  // Log memory every 5 seconds in development
  useMemoryMonitor(5000, process.env.NODE_ENV === 'development');
  
  return <div>...</div>;
}
```

#### Example Output:
```
💾 [Memory] Used: 245.32MB / Total: 312.45MB / Limit: 2048.00MB
💾 [Memory] Used: 267.89MB / Total: 312.45MB / Limit: 2048.00MB
```

#### What to watch for:
- Steadily increasing "Used" = potential memory leak
- Used approaching Total = GC about to happen
- Used approaching Limit = application may crash

---

## 📊 Monitoring CamViewer Performance

### Recommended Setup:

```typescript
// In StreamGrid.tsx
import { usePerformanceMonitor, useMemoryMonitor } from '@/hooks/usePerformance';

export function StreamGrid() {
  // Track renders
  const { renderCount } = usePerformanceMonitor(
    'StreamGrid',
    process.env.NODE_ENV === 'development'
  );
  
  // Monitor memory with multiple streams
  useMemoryMonitor(10000, streamUrls.length > 5);
  
  // ... rest of component
}
```

```typescript
// In SortableWebview.tsx
import { usePerformanceMonitor } from '@/hooks/usePerformance';

export const SortableWebviewComponent = ({ url, index, ... }) => {
  // Track individual stream performance
  usePerformanceMonitor(
    `Stream-${index}`,
    process.env.NODE_ENV === 'development'
  );
  
  // ... rest of component
}
```

---

## 🐛 Debugging Performance Issues

### 1. Finding Re-render Problems

If you see excessive re-renders:

```
⚠️ [Performance] SortableWebview rendered 50 times. Last render: 5ms ago
```

**Steps to fix:**
1. Check if component is wrapped with `React.memo`
2. Verify all callbacks use `useCallback`
3. Verify all computed values use `useMemo`
4. Check parent component for unnecessary state updates

### 2. Finding Memory Leaks

If you see memory steadily climbing:

```
💾 [Memory] Used: 500MB → 600MB → 700MB (increasing)
```

**Steps to fix:**
1. Check for event listeners not being cleaned up
2. Verify `useEffect` cleanup functions
3. Check for references held in closures
4. Look for large objects stored in state

### 3. Performance Profiling

Use React DevTools Profiler:
1. Open Chrome DevTools
2. Go to "Profiler" tab
3. Click "Record"
4. Interact with CamViewer
5. Click "Stop"
6. Analyze flame graph for slow components

---

## 🎯 Performance Best Practices

### DO ✅
- Wrap expensive components with `React.memo`
- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Throttle/debounce high-frequency events
- Clean up effects (return cleanup function)
- Use virtualization for long lists
- Lazy load components that aren't immediately visible

### DON'T ❌
- Create functions inside render
- Create objects/arrays inside render
- Use inline objects as props: `style={{ width: 100 }}`
- Put everything in one large component
- Forget to add dependencies to `useEffect`
- Use Context for frequently changing values
- Re-render entire lists when one item changes

---

## 📈 Performance Metrics to Track

### Critical Metrics:
1. **Render Count**: Should be low (< 10 renders on mount)
2. **Render Frequency**: Should be > 16ms apart (< 60fps)
3. **Memory Usage**: Should be stable, not constantly increasing
4. **CPU Usage**: Should drop when idle
5. **Layout Thrashing**: Avoid rapid style recalculations

### Monitoring Tools:
- **Chrome DevTools**: Performance tab
- **React DevTools**: Profiler tab
- **Electron**: Process Manager (`Ctrl+Shift+I` → Task Manager)
- **Custom Hooks**: `usePerformanceMonitor`, `useMemoryMonitor`

---

## 🚀 Quick Wins for Performance

### 1. Lazy Load Heavy Components
```typescript
const ProfileModal = lazy(() => import('./ProfileModal'));
```

### 2. Code Split Routes
```typescript
const StreamGrid = lazy(() => import('./components/camviewer/grid/StreamGrid'));
```

### 3. Virtualize Long Lists
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200,
});
```

### 4. Optimize Images
```typescript
// Use appropriate image sizes
<img 
  src={thumbUrl} 
  loading="lazy"
  decoding="async"
  width="200"
  height="150"
/>
```

---

## 📞 Support

If you encounter performance issues:
1. Check console for performance warnings
2. Use React DevTools Profiler
3. Monitor memory with `useMemoryMonitor`
4. Review the optimizations in `PERFORMANCE_IMPROVEMENTS.md`

---

**Remember:** Performance optimization is iterative. Measure first, optimize second! 🎯
