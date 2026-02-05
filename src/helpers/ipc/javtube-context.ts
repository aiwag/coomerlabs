import { contextBridge, ipcRenderer } from "electron";

export function exposeJavtubeContext() {
    contextBridge.exposeInMainWorld("javtube", {
        getVideos: (page: number, sortType: string, searchQuery: string) =>
            ipcRenderer.invoke("javtube:getVideos", page, sortType, searchQuery),
        getActresses: (page: number) =>
            ipcRenderer.invoke("javtube:getActresses", page),
        getActressVideos: (id: string, page: number) =>
            ipcRenderer.invoke("javtube:getActressVideos", id, page),
        getVideoUrl: (videoId: string) =>
            ipcRenderer.invoke("javtube:getVideoUrl", videoId),
    });
}
