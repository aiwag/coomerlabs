import type { Post } from '../types';
import { COOMER_SERVICES } from '../constants';
import { toast } from 'sonner';

// --- DOWNLOAD SERVICE ---
export class DownloadService {
  private static instance: DownloadService;
  private downloads: Map<string, {
    id: string;
    post: Post;
    status: 'pending' | 'downloading' | 'completed' | 'error';
    progress: number;
    filePath?: string;
    error?: string;
  }> = new Map();

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  async selectDownloadDirectory(): Promise<string | null> {
    try {
      if ((window as any).electronAPI) {
        const result = await (window as any).electronAPI.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Select Download Directory'
        });

        if (!result.canceled && result.filePaths.length > 0) {
          return result.filePaths[0];
        }
      } else {
        const dir = prompt('Enter download directory path:');
        return dir || null;
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      toast.error('Failed to select directory');
      return null;
    }
    return null;
  }

  async downloadFile(
    url: string,
    destination: string,
    onProgress?: (progress: number) => void,
    downloadId?: string
  ): Promise<string> {
    try {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.downloadFile(url, destination, onProgress);
        return destination;
      } else {
        const response = await fetch(url);
        const blob = await response.blob();

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = destination.split('/').pop() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        return destination;
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  async downloadPosts(posts: Post[], service: string): Promise<void> {
    const dir = await this.selectDownloadDirectory();
    if (!dir) return;

    posts.forEach(async (post) => {
      const downloadId = `download-${post.id}-${Date.now()}`;

      this.downloads.set(downloadId, {
        id: downloadId,
        post,
        status: 'pending',
        progress: 0
      });

      try {
        this.downloads.get(downloadId)!.status = 'downloading';

        const url = COOMER_SERVICES.includes(service)
          ? `https://coomer.st${post.file?.path || ''}`
          : `https://kemono.cr${post.file?.path || ''}`;

        const fileName = `${post.id}.${post.file?.name?.split('.').pop() || 'jpg'}`;
        const filePath = `${dir}/${fileName}`;

        await this.downloadFile(
          url,
          filePath,
          (progress) => {
            this.downloads.get(downloadId)!.progress = progress;
          },
          downloadId
        );

        this.downloads.get(downloadId)!.status = 'completed';
        this.downloads.get(downloadId)!.filePath = filePath;

        toast.success(`Downloaded: ${fileName}`);
      } catch (error) {
        console.error('Download failed:', error);
        this.downloads.get(downloadId)!.status = 'error';
        this.downloads.get(downloadId)!.error = error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to download: ${post.title}`);
      }
    });
  }

  getDownloads() {
    return Array.from(this.downloads.values());
  }

  openFileLocation(filePath: string): Promise<void> {
    try {
      if ((window as any).electronAPI) {
        return (window as any).electronAPI.openPath(filePath);
      } else {
        window.open(`file://${filePath}`, '_blank');
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error opening file location:', error);
      toast.error('Failed to open file location');
      return Promise.reject(error);
    }
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.createDirectory(dirPath);
      }
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  }
}
