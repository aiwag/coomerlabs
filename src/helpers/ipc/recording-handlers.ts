import { ipcMain, shell, protocol } from 'electron';
import {
  startRecording,
  stopRecording,
  getRecordings,
  getActiveRecordings,
  deleteRecording,
  getRecordingPath,
  isRecording,
  getStorageInfo,
} from '../../services/recordingService';
import path from 'path';
import fs from 'fs';

export function registerRecordingHandlers() {
  ipcMain.handle('recording:start', async (_, username: string, streamerInfo?: { gender?: string; tags?: string[] }) => {
    return startRecording(username, streamerInfo);
  });

  ipcMain.handle('recording:stop', async (_, username: string) => {
    return stopRecording(username);
  });

  ipcMain.handle('recording:list', async () => {
    return getRecordings();
  });

  ipcMain.handle('recording:active', async () => {
    return getActiveRecordings();
  });

  ipcMain.handle('recording:delete', async (_, id: string) => {
    return deleteRecording(id);
  });

  ipcMain.handle('recording:isRecording', async (_, username: string) => {
    return isRecording(username);
  });

  ipcMain.handle('recording:getFilePath', async (_, id: string) => {
    return getRecordingPath(id);
  });

  ipcMain.handle('recording:openFolder', async (_, id: string) => {
    const filePath = getRecordingPath(id);
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  });

  ipcMain.handle('recording:getStorageInfo', async () => {
    return getStorageInfo();
  });

  // Register a custom protocol to serve recording files to the renderer
  // This allows <video src="recording://filename.mp4"> to work
  try {
    protocol.registerFileProtocol('recording', (request, callback) => {
      const id = decodeURIComponent(request.url.replace('recording://', ''));
      const filePath = getRecordingPath(id);
      if (filePath && fs.existsSync(filePath)) {
        callback({ path: filePath });
      } else {
        callback({ statusCode: 404 });
      }
    });
  } catch {
    // Protocol may already be registered
  }
}
