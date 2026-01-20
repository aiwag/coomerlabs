import { ipcMain } from "electron";
import { javtubeService } from "../../services/javtubeService";

type SortType = "main" | "top_favorites" | "uncensored" | "most_viewed" | "top_rated" | "being_watched" | "search";

export function registerJavtubeHandlers() {
  ipcMain.handle("javtube:getVideos", async (_, page: number, sortType: SortType = "main", searchQuery: string = "") => {
    try {
      const videos = await javtubeService.extractVideoData(page, sortType, searchQuery);
      return { success: true, data: videos };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  ipcMain.handle("javtube:getActresses", async (_, page: number = 1) => {
    try {
      const actresses = await javtubeService.extractActresses(page);
      return { success: true, data: actresses };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  ipcMain.handle("javtube:getActressVideos", async (_, id: string, page: number = 1) => {
    try {
      const result = await javtubeService.extractActressVideos(id, page);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

  ipcMain.handle("javtube:getVideoUrl", async (_, videoId: string) => {
    try {
      const videoUrl = await javtubeService.getVideoUrl(videoId);
      if (videoUrl) {
        return { success: true, data: { videoUrl } };
      }
      return { success: false, error: "Could not find video URL" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });
}
