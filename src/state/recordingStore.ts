import { create } from "zustand";
import { useSettingsStore } from "./settingsStore";
import { useHUDStore } from "./hudStore";

interface RecordingState {
  /** Set of usernames currently being recorded */
  activeRecordings: Set<string>;
  /** Check if a username is currently being recorded */
  isRecording: (username: string) => boolean;
  /** Start recording a stream */
  startRecording: (username: string, streamerInfo?: { gender?: string; tags?: string[] }) => Promise<{ success: boolean; error?: string }>;
  /** Stop recording a stream */
  stopRecording: (username: string) => Promise<{ success: boolean; error?: string }>;
  /** Toggle recording on/off */
  toggleRecording: (username: string, streamerInfo?: { gender?: string; tags?: string[] }) => Promise<void>;
  /** Sync active recordings from the main process */
  syncActive: () => Promise<void>;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
  activeRecordings: new Set<string>(),

  isRecording: (username: string) => get().activeRecordings.has(username),

  startRecording: async (username, streamerInfo) => {
    // 1. Check storage allocation limits before starting
    const limitGb = useSettingsStore.getState().recordingAllocationLimit;
    if (limitGb > 0) {
      try {
        const storage = await window.electronAPI.recording.getStorageInfo();
        const allocatedBytes = limitGb * 1024 * 1024 * 1024;
        // If recordings folder is larger than max limit OR disk has less than 1GB free
        if (storage.recordingsSize >= allocatedBytes) {
          useHUDStore.getState().showHUD(`Storage limit reached (${limitGb}GB). Increase allocation in Recordings tab!`, "warning", "alert");
          return { success: false, error: "Storage allocation limit reached." };
        }
        if (storage.freeDiskSpace < 1024 * 1024 * 1024) {
          useHUDStore.getState().showHUD(`Disk is almost full (< 1GB free). Cannot record.`, "warning", "alert");
          return { success: false, error: "Disk full." };
        }
      } catch (e) {
        console.error("Failed to check storage limits", e);
      }
    }

    const result = await window.electronAPI.recording.start(username, streamerInfo);
    if (result.success) {
      set((state) => {
        const next = new Set(state.activeRecordings);
        next.add(username);
        return { activeRecordings: next };
      });
      useHUDStore.getState().showHUD(`Started recording ${username}`, "success", "recording");
    } else {
      useHUDStore.getState().showHUD(`Failed to record ${username}: ${result.error}`, "warning", "alert");
    }
    return result;
  },

  stopRecording: async (username) => {
    const result = await window.electronAPI.recording.stop(username);
    if (result.success) {
      set((state) => {
        const next = new Set(state.activeRecordings);
        next.delete(username);
        return { activeRecordings: next };
      });
    }
    return result;
  },

  toggleRecording: async (username, streamerInfo) => {
    if (get().isRecording(username)) {
      await get().stopRecording(username);
    } else {
      await get().startRecording(username, streamerInfo);
    }
  },

  syncActive: async () => {
    try {
      const active = await window.electronAPI.recording.active();
      set({ activeRecordings: new Set(active.map((a) => a.username)) });
    } catch {
      // main process not ready yet
    }
  },
}));
