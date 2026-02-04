import { BrowserWindow } from "electron";
import { addThemeEventListeners } from "./theme/theme-listeners";
import { addWindowEventListeners } from "./window/window-listeners";
import { registerDatabaseHandlers } from "./database-handlers";
import { registerServerHandlers } from "./server-handlers";
import { registerArchivebateHandlers } from "./archivebate-handlers";

export default function registerListeners(mainWindow: BrowserWindow) {
  addWindowEventListeners(mainWindow);
  addThemeEventListeners();
  registerDatabaseHandlers();
  registerServerHandlers();
  registerArchivebateHandlers();
}
