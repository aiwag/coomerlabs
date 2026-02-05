import { contextBridge, ipcRenderer } from "electron";

export function exposeArchivebateContext() {
    contextBridge.exposeInMainWorld("archivebate", {
        getProfile: (username: string, page?: number) =>
            ipcRenderer.invoke("archivebate:getProfile", username, page),
        getEmbedUrl: (pageUrl: string) =>
            ipcRenderer.invoke("archivebate:getEmbedUrl", pageUrl),
    });
}
