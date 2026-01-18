import { ipcMain } from "electron";

// Store server port for reference (assuming server runs on 8080)
const serverPort = 8080;

interface VideoData {
  id: string;
  code: string;
  title: string;
  thumbnail: string;
  duration: string;
  quality: string;
  videoUrl?: string;
}

/**
 * Register all server-related IPC handlers
 */
export function registerServerHandlers() {
  // Get server status
  ipcMain.handle("server:getStatus", async () => {
    return {
      isRunning: true,
      port: serverPort,
      baseUrl: `http://localhost:${serverPort}`,
    };
  });

  // Get videos from server
  ipcMain.handle("server:getVideos", async () => {
    try {
      const response = await fetch(`http://localhost:${serverPort}/api/videos`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const videos: VideoData[] = await response.json();
      return { success: true, data: videos };
    } catch (error) {
      console.error("Error fetching videos:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Get video URL from server
  ipcMain.handle("server:getVideoUrl", async (_, videoId: string) => {
    try {
      if (!videoId) {
        throw new Error("Video ID is required");
      }

      const response = await fetch(
        `http://localhost:${serverPort}/api/video-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error("Error fetching video URL:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Set server port (no-op since port is fixed)
  ipcMain.handle("server:setPort", async (_, port: number) => {
    return { success: true };
  });
}

// Export server port getter for other modules
export function getServerPort(): number | null {
  return serverPort;
}
