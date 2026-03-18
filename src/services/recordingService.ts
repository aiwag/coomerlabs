import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { spawn, ChildProcess, execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get ffmpeg binary path — prefer system ffmpeg, fall back to ffmpeg-static
function getFfmpegPath(): string {
  // 1. Prefer system ffmpeg (newer, better codec support, no sandboxing issues)
  try {
    const systemPath = execSync('which ffmpeg 2>/dev/null').toString().trim();
    if (systemPath && fs.existsSync(systemPath)) {
      console.log('[Recording] Using system ffmpeg:', systemPath);
      return systemPath;
    }
  } catch { /* no system ffmpeg */ }

  // 2. Fall back to ffmpeg-static
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic) {
      const packed = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
      if (fs.existsSync(packed)) return packed;
      if (fs.existsSync(ffmpegStatic)) return ffmpegStatic;
    }
  } catch { /* not installed */ }

  // 3. Last resort
  return 'ffmpeg';
}

const FFMPEG_PATH = getFfmpegPath();

export interface StorageInfo {
  totalDiskSpace: number;
  freeDiskSpace: number;
  recordingsSize: number;
  recordingsPath: string;
}

export interface Recording {
  id: string;
  username: string;
  filePath: string;
  thumbnailPath: string | null;
  startedAt: number;
  stoppedAt: number | null;
  duration: number | null;
  fileSize: number | null;
  status: 'recording' | 'completed' | 'failed';
  gender: string;
  tags: string[];
}

interface ActiveRecording {
  id: string;
  username: string;
  process: ChildProcess;
  pid: number;
  filePath: string;
  startedAt: number;
}

// In-memory registry of active ffmpeg processes
const activeRecordings = new Map<string, ActiveRecording>();

/** Send an event to all renderer windows */
function sendToRenderer(channel: string, data: any) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, data);
  }
}

function getRecordingsDir(): string {
  const dir = path.join(app.getPath('userData'), 'recordings');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getMetadataPath(): string {
  return path.join(getRecordingsDir(), 'recordings.json');
}

function loadMetadata(): Recording[] {
  const metaPath = getMetadataPath();
  try {
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
  } catch { /* corrupt file, start fresh */ }
  return [];
}

function saveMetadata(recordings: Recording[]): void {
  fs.writeFileSync(getMetadataPath(), JSON.stringify(recordings, null, 2));
}

function updateRecording(id: string, updates: Partial<Recording>): Recording | null {
  const recordings = loadMetadata();
  const idx = recordings.findIndex(r => r.id === id);
  if (idx === -1) return null;
  recordings[idx] = { ...recordings[idx], ...updates };
  saveMetadata(recordings);
  return recordings[idx];
}

/**
 * Fetch the HLS m3u8 URL for a chaturbate room.
 * Uses raw Node.js https to BYPASS Electron's session proxy.
 */
async function getHlsUrl(username: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = `room_slug=${encodeURIComponent(username)}`;
    const req = https.request({
      hostname: 'chaturbate.com',
      path: '/get_edge_hls_url_ajax/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('[Recording] HLS API response:', { success: data.success, room_status: data.room_status, hasUrl: !!data.url });
          if (!data.success || !data.url) {
            reject(new Error(data.room_status === 'offline' ? 'Room is offline' : `Could not get stream URL (status: ${data.room_status})`));
          } else {
            resolve(data.url);
          }
        } catch (e) {
          reject(new Error(`Failed to parse HLS response: ${body.substring(0, 200)}`));
        }
      });
    });
    req.on('error', (err) => {
      console.error('[Recording] HTTPS request failed:', err.message);
      reject(new Error(`Network error fetching HLS URL: ${err.message}`));
    });
    req.write(postData);
    req.end();
  });
}

/**
 * Start recording a stream
 */
export async function startRecording(
  username: string,
  streamerInfo?: { gender?: string; tags?: string[] }
): Promise<{ success: boolean; recording?: Recording; error?: string }> {
  // Check if already recording this user
  if (activeRecordings.has(username)) {
    return { success: false, error: `Already recording ${username}` };
  }

  try {
    console.log(`[Recording] Getting HLS URL for ${username}...`);
    const hlsUrl = await getHlsUrl(username);
    console.log(`[Recording] Got HLS URL, starting ffmpeg for ${username}`);
    
    const id = `${username}_${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${username}_${timestamp}.mp4`;
    const filePath = path.join(getRecordingsDir(), fileName);
    const startedAt = Date.now();

    // Spawn ffmpeg with -c copy (no re-encoding)
    const ffmpegArgs = [
      '-y',                              // overwrite
      '-loglevel', 'info',               // verbose enough to debug
      '-i', hlsUrl,                      // input HLS URL
      '-c', 'copy',                      // copy codec (no re-encode)
      '-bsf:a', 'aac_adtstoasc',        // fix AAC for MP4 container
      '-movflags', 'frag_keyframe+empty_moov+default_base_moof', // Fragmented MP4 for live playback
      '-f', 'mp4',                       // output format
      filePath,
    ];

    console.log(`[Recording] ffmpeg path: ${FFMPEG_PATH}`);

    // Spawn as DETACHED process so it survives Electron's HMR rebuilds
    const proc = spawn(FFMPEG_PATH, ffmpegArgs, {
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Unref so the child process doesn't prevent Node from exiting,
    // but we still track it in activeRecordings for explicit cleanup
    proc.unref();

    // Log ffmpeg stderr for debugging
    let stderrBuffer = '';
    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      stderrBuffer += text;
      // Only log important lines, not the frame-by-frame progress
      if (text.includes('Error') || text.includes('error') || text.includes('Opening') || text.includes('Output')) {
        console.log(`[Recording FFmpeg] ${text.trim()}`);
      }
    });

    const recording: Recording = {
      id,
      username,
      filePath,
      thumbnailPath: null,
      startedAt,
      stoppedAt: null,
      duration: null,
      fileSize: null,
      status: 'recording',
      gender: streamerInfo?.gender || '',
      tags: streamerInfo?.tags || [],
    };

    // Store in metadata
    const recordings = loadMetadata();
    recordings.unshift(recording);
    saveMetadata(recordings);

    // Track the active process
    activeRecordings.set(username, { id, username, process: proc, pid: proc.pid!, filePath, startedAt });

    console.log(`[Recording] FFmpeg started for ${username} (PID: ${proc.pid})`);

    sendToRenderer('recording:event', {
      type: 'started',
      username,
      id,
    });

    // Handle process exit
    proc.on('close', (code, signal) => {
      console.log(`[Recording] FFmpeg exited for ${username} (PID: ${proc.pid}) code=${code} signal=${signal}`);
      if (code !== 0 && code !== 255 && code !== null) {
        console.error(`[Recording] FFmpeg stderr (last 500 chars): ${stderrBuffer.slice(-500)}`);
      }
      activeRecordings.delete(username);
      const stoppedAt = Date.now();
      const duration = Math.floor((stoppedAt - startedAt) / 1000);

      let fileSize: number | null = null;
      try {
        if (fs.existsSync(filePath)) {
          fileSize = fs.statSync(filePath).size;
        }
      } catch { /* ignore */ }

      // null code with SIGTERM signal = normal stop; also accept 0 and 255
      const isNormalStop = code === 0 || code === 255 || (code === null && signal === 'SIGTERM');
      const finalStatus = isNormalStop || (fileSize && fileSize > 0) ? 'completed' : 'failed';
      updateRecording(id, {
        status: finalStatus,
        stoppedAt,
        duration,
        fileSize,
      });

      sendToRenderer('recording:event', {
        type: finalStatus,
        username,
        id,
        duration,
        fileSize,
      });

      // Generate thumbnail from the recorded video
      if (fileSize && fileSize > 0) {
        generateThumbnail(id, filePath).catch(() => { /* best effort */ });
      }
    });

    proc.on('error', (err) => {
      console.error(`[Recording] FFmpeg process error for ${username}:`, err);
      activeRecordings.delete(username);
      updateRecording(id, { status: 'failed', stoppedAt: Date.now() });
      sendToRenderer('recording:event', {
        type: 'failed',
        username,
        id,
        error: err.message,
      });
    });

    return { success: true, recording };
  } catch (error: any) {
    console.error(`[Recording] Failed to start recording ${username}:`, error.message);
    sendToRenderer('recording:event', {
      type: 'failed',
      username,
      error: error.message,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Stop a recording
 */
export function stopRecording(username: string): { success: boolean; error?: string } {
  const active = activeRecordings.get(username);
  if (!active) {
    return { success: false, error: `No active recording for ${username}` };
  }

  console.log(`[Recording] Stopping ${username} (PID: ${active.pid})`);

  // Send 'q' to ffmpeg stdin for graceful stop
  try {
    active.process.stdin?.write('q');
  } catch { /* stdin may be closed */ }

  // Fallback: kill the process group after 3s
  setTimeout(() => {
    try {
      // Kill the entire detached process group
      process.kill(-active.pid, 'SIGTERM');
    } catch {
      try { active.process.kill('SIGTERM'); } catch { /* already dead */ }
    }
  }, 3000);

  return { success: true };
}

/**
 * Generate a thumbnail from a video file
 */
async function generateThumbnail(recordingId: string, videoPath: string): Promise<void> {
  const thumbPath = videoPath.replace('.mp4', '_thumb.jpg');

  return new Promise<void>((resolve) => {
    const proc = spawn(FFMPEG_PATH, [
      '-y',
      '-i', videoPath,
      '-ss', '00:00:05',         // 5 seconds in
      '-vframes', '1',           // single frame
      '-vf', 'scale=480:-1',    // 480px wide
      '-q:v', '4',               // JPEG quality
      thumbPath,
    ], { stdio: 'ignore' });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(thumbPath)) {
        updateRecording(recordingId, { thumbnailPath: thumbPath });
      }
      resolve();
    });

    proc.on('error', () => resolve());
  });
}

/**
 * Get all recordings
 */
export function getRecordings(): Recording[] {
  const recordings = loadMetadata();

  // Update status for any that are still "recording" but have no active process
  let changed = false;
  for (const r of recordings) {
    if (r.status === 'recording' && !activeRecordings.has(r.username)) {
      r.status = 'completed';
      r.stoppedAt = r.stoppedAt || Date.now();
      try {
        if (fs.existsSync(r.filePath)) {
          r.fileSize = fs.statSync(r.filePath).size;
          r.duration = r.stoppedAt ? Math.floor((r.stoppedAt - r.startedAt) / 1000) : null;
        }
      } catch { /* ignore */ }
      changed = true;
    }
  }
  if (changed) saveMetadata(recordings);

  return recordings;
}

/**
 * Get currently active recordings
 */
export function getActiveRecordings(): { username: string; id: string; startedAt: number; duration: number }[] {
  const now = Date.now();
  return Array.from(activeRecordings.values()).map(r => ({
    username: r.username,
    id: r.id,
    startedAt: r.startedAt,
    duration: Math.floor((now - r.startedAt) / 1000),
  }));
}

/**
 * Delete a recording (file + metadata)
 */
export function deleteRecording(id: string): { success: boolean; error?: string } {
  const recordings = loadMetadata();
  const recording = recordings.find(r => r.id === id);
  if (!recording) return { success: false, error: 'Recording not found' };

  // Can't delete active recordings
  if (recording.status === 'recording' && activeRecordings.has(recording.username)) {
    return { success: false, error: 'Stop recording first' };
  }

  // Delete files
  try {
    if (fs.existsSync(recording.filePath)) fs.unlinkSync(recording.filePath);
    if (recording.thumbnailPath && fs.existsSync(recording.thumbnailPath)) fs.unlinkSync(recording.thumbnailPath);
  } catch { /* best effort */ }

  // Remove from metadata
  const filtered = recordings.filter(r => r.id !== id);
  saveMetadata(filtered);

  return { success: true };
}

/**
 * Get recording file path (for serving to renderer)
 */
export function getRecordingPath(id: string): string | null {
  const recordings = loadMetadata();
  const recording = recordings.find(r => r.id === id);
  return recording?.filePath || null;
}

/**
 * Check if a user is currently being recorded
 */
export function isRecording(username: string): boolean {
  return activeRecordings.has(username);
}

/**
 * Stop all active recordings (for cleanup on app quit)
 */
export function stopAllRecordings(): void {
  for (const [username] of activeRecordings) {
    stopRecording(username);
  }
}

/** Get total disk space, free space, and the size of the recordings folder (in bytes) */
export async function getStorageInfo(): Promise<StorageInfo> {
  const dir = getRecordingsDir();
  let totalDiskSpace = 0;
  let freeDiskSpace = 0;
  let recordingsSize = 0;

  try {
    if (process.platform === 'win32') {
      // Windows
      const drive = path.parse(dir).root.replace('\\', '');
      const { stdout: dfOut } = await execAsync(`wmic logicaldisk where name="${drive}" get size,freespace`);
      const lines = dfOut.trim().split(/\r?\n/);
      if (lines.length > 1) {
        const parts = lines[1].trim().split(/\s+/);
        freeDiskSpace = parseInt(parts[0], 10) || 0;
        totalDiskSpace = parseInt(parts[1], 10) || 0;
      }
      
      // Calculate directory size recursively in node (faster cross-platform fallback for Windows)
      const calculateSize = (dirPath: string): number => {
        let size = 0;
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const file of files) {
          if (file.isDirectory()) size += calculateSize(path.join(dirPath, file.name));
          else size += fs.statSync(path.join(dirPath, file.name)).size;
        }
        return size;
      };
      recordingsSize = calculateSize(dir);
    } else {
      // Linux / macOS
      const { stdout: dfOut } = await execAsync(`df -B1 "${dir}" 2>/dev/null || df -k "${dir}"`);
      const lines = dfOut.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].trim().split(/\s+/);
        // df -B1: Filesystem 1B-blocks Used Available Use% Mounted on
        const base = dfOut.includes('1B-blocks') ? 1 : 1024;
        totalDiskSpace = (parseInt(parts[1], 10) || 0) * base;
        freeDiskSpace = (parseInt(parts[3], 10) || 0) * base;
      }
      
      // Try du -sb (bytes) first, fall back to du -sk (kilobytes)
      let duBytes = true;
      let duOut = '';
      try {
        const res = await execAsync(`du -sb "${dir}"`);
        duOut = res.stdout;
      } catch {
        duBytes = false;
        const res = await execAsync(`du -sk "${dir}"`);
        duOut = res.stdout;
      }
      const duParts = duOut.trim().split(/\s+/);
      recordingsSize = (parseInt(duParts[0], 10) || 0) * (duBytes ? 1 : 1024);
    }
  } catch (e) {
    console.error('[Recording] Failed to get storage info:', e);
  }

  return {
    totalDiskSpace,
    freeDiskSpace,
    recordingsSize,
    recordingsPath: dir,
  };
}
