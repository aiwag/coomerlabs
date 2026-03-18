import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useInView } from "react-intersection-observer";
import Hls from "hls.js";
import {
  RefreshCw,
  WifiOff,
  VideoOff,
  Maximize2,
  Volume2,
  VolumeX,
  Circle,
} from "lucide-react";
import { useGridStore } from "@/state/gridStore";
import { useShallow } from "zustand/react/shallow";
import { useProfileModalStore } from "@/state/profileModalStore";
import { StreamControls } from "./StreamControls";
import { StreamInfoOverlay } from "./StreamInfoOverlay";
import { StreamSkeleton } from "./StreamSkeleton";
import { getUsernameFromUrl, generateThumbUrl } from "@/utils/formatters";

interface HlsStreamCellProps {
  id: string;
  url: string;
  index: number;
  totalStreams: number;
  isFullViewMode?: boolean;
  isDragging: boolean;
  isDraggable: boolean;
  width?: string | number;
  height?: string | number;
  viewMode?: "grid" | "waterfall" | "clean-fit" | "full-expand";
  isZenMode?: boolean;
  isSmartAudio?: boolean;
  isGlobalMute?: boolean;
  colSpan?: number;
}

type StreamStatus = "resolving" | "connecting" | "playing" | "offline" | "error";

type StreamTier = "high" | "med" | "low";

function getStreamTier(total: number): StreamTier {
  if (total <= 4) return "high";
  if (total <= 12) return "med";
  return "low";
}

/** Get hls.js config optimized for stream count */
function getHlsConfig(tier: StreamTier) {
  const baseConfig = {
    enableWorker: true,
    backBufferLength: 0, // Don't keep past segments in memory
    autoStartLoad: false, // Wait for IntersectionObserver before pulling chunks
  };

  if (tier === "high") {
    return {
      ...baseConfig,
      capLevelToPlayerSize: false,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      maxBufferSize: 60 * 1000 * 1000, // 60MB
      startLevel: -1, // auto
      lowLatencyMode: true,
    };
  }
  if (tier === "med") {
    return {
      ...baseConfig,
      capLevelToPlayerSize: true,
      maxBufferLength: 10,
      maxMaxBufferLength: 20,
      maxBufferSize: 20 * 1000 * 1000, // 20MB
      startLevel: -1,
      lowLatencyMode: true,
    };
  }
  // 13-30+ streams: aggressive optimization
  return {
    ...baseConfig,
    capLevelToPlayerSize: true,
    maxBufferLength: 3,         // Keep buffer extremely small
    maxMaxBufferLength: 6,
    maxBufferSize: 5 * 1000 * 1000, // 5MB per stream maximum
    startLevel: 0,              // Start on lowest quality
    lowLatencyMode: false,      // Save CPU by ignoring quick-syncing
    liveSyncDurationCount: 3,   // Keep stable
  };
}

const HlsStreamCellComponent = ({
  id,
  url,
  index,
  totalStreams,
  isFullViewMode = false,
  isDragging,
  isDraggable,
  width,
  height,
  viewMode = "grid",
  isZenMode = false,
  isSmartAudio = false,
  isGlobalMute = false,
  colSpan = 1,
}: HlsStreamCellProps) => {
  const {
    setFullViewMode,
    removeStream,
    setPlaying,
    toggleMute,
    isMuted,
    setFullscreenStream,
    isFullscreen,
    isRecording,
  } = useGridStore(useShallow((state) => ({
    setFullViewMode: state.setFullViewMode,
    removeStream: state.removeStream,
    setPlaying: state.setPlaying,
    toggleMute: state.toggleMute,
    isMuted: state.mutedStreams.has(url),
    setFullscreenStream: state.setFullscreenStream,
    isFullscreen: state.fullscreenStream?.url === url,
    isRecording: false, // TODO: wire up recording store
  })));

  const openProfile = useProfileModalStore((state) => state.openProfile);
  const { attributes, listeners, setNodeRef, transform, transition, isOver } =
    useSortable({ id, disabled: !isDraggable });

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<StreamStatus>("resolving");
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { ref: viewRef, inView } = useInView({
    rootMargin: "200px 0px",
    threshold: 0.1,
    triggerOnce: false,
  });

  const username = useMemo(() => getUsernameFromUrl(url), [url]);
  const thumbUrl = useMemo(() => generateThumbUrl(username), [username]);
  const streamTier = useMemo(() => getStreamTier(totalStreams), [totalStreams]);

  // ─── Resolve HLS URL ────────────────────────────────────────────
  const resolveHlsUrl = useCallback(async () => {
    if (!username) return;
    setStatus("resolving");
    setError(null);

    try {
      const result = await window.electronAPI.chaturbate.getHlsUrl(username);
      if (result.success && result.url) {
        setHlsUrl(result.url);
        setStatus("connecting");
        retryCountRef.current = 0;
      } else {
        const errMsg = result.error || "unknown";
        if (errMsg === "offline") {
          setStatus("offline");
          setError("Offline");
        } else {
          setStatus("error");
          setError(errMsg);
        }
      }
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Failed to resolve");
    }
  }, [username]);

  // Initial resolve
  useEffect(() => {
    resolveHlsUrl();
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [url]); // Only re-resolve on URL change

  // Auto-refresh HLS URL every 4 minutes (edge URLs rotate)
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === "playing") {
        resolveHlsUrl();
      }
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [status, resolveHlsUrl]);

  // ─── HLS.js Lifecycle ───────────────────────────────────────────
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;
    if (!Hls.isSupported()) {
      // Fallback for Safari native HLS
      videoRef.current.src = hlsUrl;
      setStatus("playing");
      return;
    }

    const config = getHlsConfig(streamTier);
    const hls = new Hls(config);

    hls.loadSource(hlsUrl);
    hls.attachMedia(videoRef.current);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setStatus("playing");
      if (videoRef.current) {
        videoRef.current.muted = isGlobalMute || isMuted;
        videoRef.current.play().catch(() => {});
      }
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            // Try to recover
            if (retryCountRef.current < 3) {
              retryCountRef.current++;
              hls.startLoad();
            } else {
              setStatus("error");
              setError("Network error");
              // Auto-retry after delay
              retryTimerRef.current = setTimeout(() => {
                retryCountRef.current = 0;
                resolveHlsUrl();
              }, 10000);
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            setStatus("error");
            setError("Stream error");
            break;
        }
      }
    });

    hlsRef.current = hls;

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [hlsUrl, streamTier]); // Recreate HLS when URL or tier changes

  // ─── Mute Control ──────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isGlobalMute || isMuted;
    }
  }, [isGlobalMute, isMuted]);

  // ─── Visibility-Based Throttling ───────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || status !== "playing") return;

    const shouldPlay = inView || isFullViewMode || viewMode === "full-expand";
    setIsPaused(!shouldPlay);

    if (shouldPlay) {
      video.play().catch(() => {});
      hlsRef.current?.startLoad();
    } else {
      video.pause();
      hlsRef.current?.stopLoad();
    }

    setPlaying(index, shouldPlay);
  }, [inView, isFullViewMode, status, index, setPlaying, viewMode]);

  // ─── Smart Audio (hover unmute) ────────────────────────────────
  const handleMouseEnter = useCallback(() => {
    setShowStreamInfo(true);
    if (isSmartAudio && videoRef.current && !isGlobalMute) {
      videoRef.current.muted = false;
    }
  }, [isSmartAudio, isGlobalMute]);

  const handleMouseLeave = useCallback(() => {
    setShowStreamInfo(false);
    if (isSmartAudio && videoRef.current) {
      videoRef.current.muted = true;
    }
  }, [isSmartAudio]);

  const handleReload = useCallback(() => {
    retryCountRef.current = 0;
    resolveHlsUrl();
  }, [resolveHlsUrl]);

  const handleClick = useCallback(() => {
    const isAnyFullView = useGridStore.getState().fullViewMode !== null;
    if (isAnyFullView && !isFullViewMode) {
      setFullViewMode(index);
    }
  }, [isFullViewMode, index, setFullViewMode]);

  const handleDoubleClick = useCallback(() => {
    if (isFullscreen) {
      setFullscreenStream(null);
    } else {
      setFullscreenStream({ url, username: username || "Stream" });
    }
  }, [isFullscreen, url, username, setFullscreenStream]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // ─── Refresh-all-streams ───────────────────────────────────────
  useEffect(() => {
    const handler = () => handleReload();
    window.addEventListener("refresh-all-streams", handler);
    return () => window.removeEventListener("refresh-all-streams", handler);
  }, [handleReload]);

  // ─── Styles ────────────────────────────────────────────────────
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isFullViewMode ? 100 : (isDragging ? 101 : 10),
    gridColumn: `span ${colSpan}`,
    ...(isFullViewMode ? {
      position: 'absolute' as const,
      top: 0, left: 0, width: '100%', height: '100%',
      transform: 'none', borderRadius: 0,
    } : {
      ...(width !== undefined && { width }),
      ...(height !== undefined && { height }),
    }),
  }), [transform, transition, isFullViewMode, isDragging, colSpan, width, height]);

  const isFullExpand = viewMode === "full-expand";

  return (
    <div
      ref={(node) => { setNodeRef(node); viewRef(node); }}
      style={{ ...style, touchAction: isDraggable ? "none" : "auto" }}
      className={`relative bg-black transition-all duration-300 ease-in-out group ${isFullViewMode ? 'rounded-none' : 'rounded-lg'} overflow-hidden ${isDragging ? 'opacity-0' : 'opacity-100'} hover:shadow-xl hover:shadow-cyan-500/10`}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
    >
      {/* Drop indicator */}
      {isDraggable && isOver && (
        <div className="absolute inset-0 z-50 pointer-events-none bg-cyan-500/20 ring-2 ring-cyan-500 ring-inset rounded-lg" />
      )}

      {/* Thumbnail background (visible during loading/offline) */}
      {status !== "playing" && (
        <img src={thumbUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain bg-black ${status === "playing" ? "opacity-100" : "opacity-0"}`}
        playsInline
        muted={isGlobalMute || isMuted}
        autoPlay
      />



      {/* Status overlays */}
      {status === "resolving" && <StreamSkeleton />}

      {status === "connecting" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-cyan-500 mb-2" />
          <span className="text-[10px] font-bold text-white/50">Connecting...</span>
        </div>
      )}

      {status === "offline" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
          <VideoOff size={28} className="mb-2 text-neutral-600" />
          <span className="text-xs font-bold text-neutral-500">Offline</span>
          <button
            onClick={handleReload}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-white/40 hover:bg-white/10 hover:text-white/60"
          >
            <RefreshCw size={10} /> Retry
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
          <WifiOff size={28} className="mb-2 text-red-500/60" />
          <span className="text-[10px] font-bold text-red-400/80">{error}</span>
          <button
            onClick={handleReload}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/80 text-[10px] text-white hover:bg-cyan-500"
          >
            <RefreshCw size={10} /> Retry
          </button>
        </div>
      )}

      {/* Paused overlay (off-screen) */}
      {status === "playing" && !inView && !isFullViewMode && !isFullExpand && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
          <VideoOff size={32} className="mb-1 text-gray-500" />
          <span className="text-sm font-medium text-gray-400">Paused</span>
        </div>
      )}

      {/* Stream info overlay */}
      <StreamInfoOverlay
        username={username || ""}
        isPlaying={status === "playing" && !isPaused}
        show={showStreamInfo}
      />

      {/* Stream controls */}
      <StreamControls
        index={index}
        onReload={handleReload}
        isPaused={isPaused}
        onTogglePause={() => {
          const video = videoRef.current;
          if (!video) return;
          if (isPaused) {
            video.play().catch(() => {});
            hlsRef.current?.startLoad();
            setIsPaused(false);
            setPlaying(index, true);
          } else {
            video.pause();
            hlsRef.current?.stopLoad();
            setIsPaused(true);
            setPlaying(index, false);
          }
        }}
      />


      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[99999] w-48 rounded-lg glass-card p-1 shadow-2xl"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { handleReload(); setContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            Reload Stream
          </button>
          <button
            onClick={() => { toggleMute(url); setContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            {isMuted ? "Unmute Stream" : "Mute Stream"}
          </button>
          <button
            onClick={() => { openProfile(username || ""); setContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            View Profile
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(url); setContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            Copy Stream URL
          </button>
          <div className="my-1 border-t border-white/5" />
          <button
            onClick={() => { removeStream(index); setContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            Remove from Grid
          </button>
        </div>
      )}
    </div>
  );
};

export const HlsStreamCell = React.memo(HlsStreamCellComponent, (prev, next) => (
  prev.url === next.url &&
  prev.index === next.index &&
  prev.totalStreams === next.totalStreams &&
  prev.isFullViewMode === next.isFullViewMode &&
  prev.isDragging === next.isDragging &&
  prev.isDraggable === next.isDraggable &&
  prev.isZenMode === next.isZenMode &&
  prev.isSmartAudio === next.isSmartAudio &&
  prev.isGlobalMute === next.isGlobalMute &&
  prev.viewMode === next.viewMode &&
  prev.width === next.width &&
  prev.height === next.height
));

HlsStreamCell.displayName = "HlsStreamCell";
