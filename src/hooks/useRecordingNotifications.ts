import { useEffect } from 'react';
import { toast } from 'sonner';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Hook that listens for recording lifecycle events from the main process
 * and displays sonner toast notifications.
 */
export function useRecordingNotifications() {
  useEffect(() => {
    const api = window.electronAPI?.recording;
    if (!api?.onEvent) return;

    const cleanup = api.onEvent((event) => {
      switch (event.type) {
        case 'started':
          toast.success(`Recording started`, {
            description: `Now recording ${event.username}`,
            duration: 3000,
          });
          break;

        case 'completed': {
          const parts: string[] = [];
          if (event.duration) parts.push(formatDuration(event.duration));
          if (event.fileSize) parts.push(formatFileSize(event.fileSize));

          toast.success(`Recording saved`, {
            description: `${event.username} — ${parts.join(' • ') || 'Complete'}`,
            duration: 5000,
          });
          break;
        }

        case 'failed':
          toast.error(`Recording failed`, {
            description: event.error
              ? `${event.username}: ${event.error}`
              : `Failed to record ${event.username}`,
            duration: 5000,
          });
          break;
      }
    });

    return cleanup;
  }, []);
}
