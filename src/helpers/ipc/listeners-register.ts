import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { registerDatabaseHandlers } from "./database-handlers";
import { registerArchivebateHandlers } from "./archivebate-handlers";
import { registerJavtubeHandlers } from "./javtube-handlers";
import { registerSystemHandlers } from "./system-handlers";
import { registerRecordingHandlers } from "./recording-handlers";
import { registerChaturbateHandlers } from "./chaturbate-handlers";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  registerDatabaseHandlers();
  registerArchivebateHandlers();
  registerJavtubeHandlers();
  registerSystemHandlers();
  registerRecordingHandlers();
  registerChaturbateHandlers();
}

