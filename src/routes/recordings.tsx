import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouteState } from "@/state/useRouteState";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Trash2,
  Play,
  Clock,
  HardDrive,
  User,
  FolderOpen,
  ArrowLeft,
  Loader2,
  Circle,
  X,
  Archive,
  Tag,
  Edit2,
} from "lucide-react";

import Hls from "hls.js";
import { generateThumbUrl } from "@/utils/formatters";

import { useSettingsStore } from "@/state/settingsStore";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "--";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LiveDuration({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span>{formatDuration(elapsed)}</span>;
}

function LiveHlsPreview({ username, isHovered }: { username: string; isHovered: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isHovered) return;
    let mounted = true;
    // @ts-ignore
    window.electronAPI.chaturbate.getHlsUrl(username).then((res) => {
      if (mounted && res.success && res.url) setHlsUrl(res.url);
    });
    return () => { mounted = false; };
  }, [username, isHovered]);

  useEffect(() => {
    if (!isHovered || !hlsUrl || !videoRef.current) return;
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      startLevel: 0,
      autoStartLoad: true,
      capLevelToPlayerSize: true,
      maxBufferLength: 3,
      maxMaxBufferLength: 6,
    });
    hls.loadSource(hlsUrl);
    hls.attachMedia(videoRef.current);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (videoRef.current) videoRef.current.play().catch(() => {});
    });

    return () => {
      hls.destroy();
    };
  }, [hlsUrl, isHovered]);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 delay-150 ${isHovered && hlsUrl ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

/**
 * Animated video preview on hover for completed recording cards.
 * Shows a muted, looping preview of the actual recording file.
 */
function RecordingPreview({ recording, isActive, onPlay }: {
  recording: Recording;
  isActive: boolean;
  onPlay: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canPreviewFinished = !isActive && recording.status === 'completed' && recording.fileSize;
  const canPreviewLive = isActive && recording.status === 'recording';
  const hasPreview = canPreviewFinished || canPreviewLive;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered && canPreviewFinished) {
      // Small delay before starting preview to avoid flicker on quick mouse moves
      hoverTimerRef.current = setTimeout(() => {
        video.currentTime = (recording.duration || 30) * 0.15; // Seek to 15%
        video.play().catch(() => { /* autoplay blocked or file not ready */ });
      }, 300);
    } else {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      video.pause();
    }

    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, [isHovered, canPreviewFinished, recording.duration]);

  const liveThumb = canPreviewLive ? generateThumbUrl(recording.username) : null;
  const showThumb = recording.thumbnailPath ? `file://${recording.thumbnailPath}` : liveThumb;

  return (
    <div
      className={`relative aspect-video bg-black/60 overflow-hidden ${hasPreview ? 'cursor-pointer' : ''}`}
      onClick={onPlay}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Static thumbnail */}
      {showThumb ? (
        <img
          src={showThumb}
          alt={recording.username}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isHovered && hasPreview ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <div className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-500 ${
          isHovered && hasPreview ? 'opacity-0' : 'opacity-100'
        }`}>
          <Film size={24} className="text-white/10" />
        </div>
      )}

      {/* Animated video preview (lazy loaded on hover) for finished recordings */}
      {canPreviewFinished && (
        <video
          ref={videoRef}
          src={`file://${recording.filePath}`}
          muted
          loop
          playsInline
          preload="none"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Live HLS preview (lazy loaded on hover) for active recordings */}
      {canPreviewLive && <LiveHlsPreview username={recording.username} isHovered={isHovered} />}

      {/* Subtle animated gradient border on preview */}
      {isHovered && hasPreview && (
        <div className="absolute inset-0 rounded-none border-2 border-white/10 pointer-events-none animate-pulse" style={{ animationDuration: '2s' }} />
      )}

      {/* Duration badge */}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white/80 z-10">
        {isActive ? (
          <LiveDuration startedAt={recording.startedAt} />
        ) : (
          formatDuration(recording.duration)
        )}
      </div>

      {/* Live indicator */}
      {isActive && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/90 backdrop-blur-sm z-10">
          <Circle size={6} className="text-white fill-current animate-pulse" />
          <span className="text-[9px] font-black uppercase text-white">REC</span>
        </div>
      )}

      <div className={`absolute inset-0 flex items-center justify-center transition-opacity z-10 pointer-events-none ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xl">
          <Play size={16} className="text-white fill-current ml-0.5" />
        </div>
      </div>

      {/* PREVIEW label */}
      {isHovered && hasPreview && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest text-white/50 z-10">
          Preview
        </div>
      )}

      {/* Status badge */}
      {recording.status === "failed" && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-900/80 text-[9px] font-bold text-red-300 z-10">
          Failed
        </div>
      )}
    </div>
  );
}

function StorageWidget() {
  const { data: storage } = useQuery({
    queryKey: ["recordings-storage"],
    queryFn: () => window.electronAPI.recording.getStorageInfo(),
    refetchInterval: 10000,
  });
  const { recordingAllocationLimit, setRecordingAllocationLimit } = useSettingsStore();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  if (!storage) return null;

  const allocatedBytes = recordingAllocationLimit * 1024 * 1024 * 1024;
  const recordingsSize = storage.recordingsSize || 0;
  
  const percentage = allocatedBytes > 0 
    ? Math.min(100, (recordingsSize / allocatedBytes) * 100) 
    : 0;

  const isNearingLimit = allocatedBytes > 0 && percentage > 90;
  const isOverLimit = allocatedBytes > 0 && percentage >= 100;

  const handleEditAllocation = () => {
    setEditValue(recordingAllocationLimit.toString());
    setEditing(true);
  };

  const handleSave = () => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setRecordingAllocationLimit(parsed);
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-sm bg-black/20 px-4 py-2 rounded-xl border border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white/50">
          <HardDrive size={12} />
          <span>Storage Allocation</span>
        </div>
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              className="w-14 bg-black/60 border border-cyan-500/40 rounded px-1.5 py-0.5 text-[10px] text-white outline-none text-center"
            />
            <span className="text-[9px] text-white/30">GB</span>
            <button onClick={handleSave} className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300">✓</button>
            <button onClick={() => setEditing(false)} className="text-[9px] font-bold text-white/30 hover:text-white/50">✕</button>
          </div>
        ) : (
          <button 
            onClick={handleEditAllocation}
            className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 hover:text-cyan-400 flex items-center gap-1"
          >
            {recordingAllocationLimit > 0 ? `${recordingAllocationLimit} GB Limit` : 'Unlimited'}
            <Edit2 size={10} />
          </button>
        )}
      </div>

      {recordingAllocationLimit > 0 && (
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isOverLimit ? 'bg-red-500' : isNearingLimit ? 'bg-amber-500' : 'bg-cyan-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      <div className="flex justify-between items-center text-[10px] font-semibold text-white/40">
        <span>{formatFileSize(recordingsSize)} used</span>
        <span>{formatFileSize(storage.freeDiskSpace)} disk free</span>
      </div>
    </div>
  );
}

const RecordingsPage = () => {
  const queryClient = useQueryClient();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingPath, setPlayingPath] = useState<string | null>(null);
  const savedState = useRouteState(s => s.getState('/recordings'));
  const setRouteState = useRouteState(s => s.setState);
  const [filter, setFilter] = useState<"all" | "recording" | "completed">(
    (savedState.filter as any) || "all"
  );

  // Persist filter to route state on change
  useEffect(() => {
    setRouteState('/recordings', { filter });
  }, [filter, setRouteState]);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ["recordings"],
    queryFn: () => window.electronAPI.recording.list(),
    refetchInterval: 3000,
  });

  const filtered = recordings.filter((r) => {
    // Hide failed recordings with no file
    if (r.status === "failed" && !r.fileSize) return false;
    if (filter === "all") return true;
    return r.status === filter;
  });

  // Group recordings by username for the "by streamer" view
  const streamerGroups = filtered.reduce<Record<string, Recording[]>>((acc, r) => {
    if (!acc[r.username]) acc[r.username] = [];
    acc[r.username].push(r);
    return acc;
  }, {});

  const activeCount = recordings.filter((r) => r.status === "recording").length;

  const handlePlay = useCallback(async (id: string, filePath: string) => {
    setPlayingId(id);
    // Use file:// protocol to load local video files
    setPlayingPath(`file://${filePath}`);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this recording permanently?")) return;
    await window.electronAPI.recording.delete(id);
    queryClient.invalidateQueries({ queryKey: ["recordings"] });
    if (playingId === id) {
      setPlayingId(null);
      setPlayingPath(null);
    }
  }, [playingId, queryClient]);

  const handleStop = useCallback(async (username: string) => {
    await window.electronAPI.recording.stop(username);
    queryClient.invalidateQueries({ queryKey: ["recordings"] });
  }, [queryClient]);

  const handleOpenFolder = useCallback(async (id: string) => {
    await window.electronAPI.recording.openFolder(id);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[var(--app-bg)] text-white overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between border-b border-white/5 bg-black/40 px-8 py-5 backdrop-blur-3xl z-40">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-pink-600 shadow-lg shadow-red-500/20">
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Recordings</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
              {filtered.length} clips • {activeCount > 0 && (
                <span className="text-red-400">{activeCount} recording live</span>
              )}
              {activeCount === 0 && "Stream Archive"}
            </p>
          </div>
        </div>

        {/* Middle: Storage Widget */}
        <div className="flex-1 flex justify-center px-8">
          <StorageWidget />
        </div>

        <div className="flex items-center gap-4">
          {/* Filter pills */}
          <div className="flex bg-black/40 rounded-xl p-0.5 gap-0.5 border border-white/5">
            {(["all", "recording", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all ${
                  filter === f
                    ? "bg-white/10 text-white"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {f === "recording" ? "Live" : f}
              </button>
            ))}
          </div>

          <Link
            to="/camviewer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
          >
            <ArrowLeft size={14} />
            CamViewer
          </Link>

          <Link
            to="/camarchive"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-xs font-bold"
          >
            <Archive size={14} />
            Cam Archive
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video player panel (when playing) */}
        <AnimatePresence>
          {playingId && playingPath && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "55%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative flex-none border-r border-white/5 bg-black flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/60">
                <div className="flex items-center gap-2">
                  <Play size={14} className="text-red-400" />
                  <span className="text-xs font-bold text-white/60">
                    {recordings.find(r => r.id === playingId)?.username || "Playback"}
                  </span>
                </div>
                <button
                  onClick={() => { setPlayingId(null); setPlayingPath(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center bg-black">
                <video
                  src={playingPath}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  style={{ maxHeight: "calc(100vh - 120px)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recordings grid */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-red-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                Loading recordings...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Film size={48} className="text-white/10" />
              <p className="text-sm text-white/30 font-medium">
                {filter !== "all" ? "No recordings match this filter" : "No recordings yet"}
              </p>
              <p className="text-xs text-white/20">
                Start recording from the CamViewer to see clips here
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(streamerGroups).map(([username, clips]) => (
                <div key={username}>
                  {/* Streamer header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <User size={12} className="text-white/40" />
                      <Link
                        to="/camarchive"
                        className="text-xs font-bold text-white/70 hover:text-white transition-colors"
                      >
                        {username}
                      </Link>
                    </div>
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[9px] font-bold uppercase text-white/20 tracking-widest">
                      {clips.length} clip{clips.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Clips grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {clips.map((recording, idx) => {
                      const isActive = recording.status === "recording";
                      const isPlaying = playingId === recording.id;

                      return (
                        <motion.div
                          key={recording.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`group relative rounded-xl border transition-all duration-300 overflow-hidden ${
                            isPlaying
                              ? "border-red-500/50 bg-red-500/5"
                              : isActive
                                ? "border-red-500/30 bg-red-500/[0.03]"
                                : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                          }`}
                        >
                          {/* Thumbnail / Animated Preview */}
                          <RecordingPreview
                            recording={recording}
                            isActive={isActive}
                            onPlay={() => handlePlay(recording.id, recording.filePath)}
                          />

                          {/* Info */}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] text-white/30 font-medium">
                                {formatDate(recording.startedAt)}
                              </span>
                              <span className="text-[10px] text-white/20 flex items-center gap-1">
                                <HardDrive size={9} />
                                {formatFileSize(recording.fileSize)}
                              </span>
                            </div>

                            {/* Tags */}
                            {recording.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {recording.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] font-bold uppercase tracking-wider text-white/30"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-1.5">
                              {isActive ? (
                                <button
                                  onClick={() => handleStop(recording.username)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold hover:bg-red-500/30 transition-colors"
                                >
                                  <Circle size={8} className="fill-current" />
                                  Stop
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handlePlay(recording.id, recording.filePath)}
                                    className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold hover:bg-white/10 hover:text-white transition-colors"
                                  >
                                    Play
                                  </button>
                                  <button
                                    onClick={() => handleOpenFolder(recording.id)}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-white/60 transition-colors"
                                    title="Open in folder"
                                  >
                                    <FolderOpen size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(recording.id)}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors"
                                    title="Delete recording"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/recordings")({
  component: RecordingsPage,
});
