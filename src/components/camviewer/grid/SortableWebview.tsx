import React, { useRef, useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useInView } from "react-intersection-observer";
import {
  GripVertical,
  VideoOff,
  RefreshCw,
  WifiOff,
  Maximize2,
  Minimize2,
  Trash2,
  ExternalLink,
  User,
} from "lucide-react";
import { useGridStore } from "@/state/gridStore";
import { useSettingsStore } from "@/state/settingsStore";
import { StreamControls } from "./StreamControls";
import { StreamInfoOverlay } from "./StreamInfoOverlay";
import { LoadingIndicator } from "./LoadingIndicator";
import { getUsernameFromUrl, generateThumbUrl } from "@/utils/formatters";
import { StreamSkeleton } from "./StreamSkeleton";
import { webviewInjectionScript } from "@/lib/webview-injection";

interface SortableWebviewProps {
  id: string;
  url: string;
  index: number;
  isFullViewMode?: boolean;
  isDragging: boolean;
  isDraggable: boolean;
  isPlaying?: boolean;
  width?: string | number;
  height?: string | number;
  top?: number;
  left?: number;
  viewMode?: "grid" | "waterfall" | "clean-fit" | "full-expand";
  isZenMode?: boolean;
  isSmartAudio?: boolean;
  isGlobalMute?: boolean;
  colSpan?: number;
}

const executeWebviewScript = (
  webview: Electron.WebviewTag | null,
  script: string,
) => {
  if (webview) {
    try {
      webview.executeJavaScript(script).catch(() => { });
    } catch (e) {
      console.error("Script execution error:", e);
    }
  }
};

type LoadingStage = "connecting" | "loading" | "ready" | "error";

export function SortableWebview({
  id,
  url,
  index,
  isFullViewMode = false,
  isDragging,
  isDraggable,
  isPlaying: externalIsPlaying,
  width,
  height,
  top,
  left,
  viewMode = "grid",
  isZenMode = false,
  isSmartAudio = false,
  isGlobalMute = false,
  colSpan = 1,
}: SortableWebviewProps) {
  const { setFullViewMode } = useGridStore();
  const { attributes, listeners, setNodeRef, transform, transition, isOver } =
    useSortable({ id, disabled: !isDraggable });
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const { removeStream, setPlaying, mutedStreams, toggleMute } = useGridStore();
  const isMuted = mutedStreams.has(url);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const { toggleFullscreenView } = useSettingsStore();

  const [loadingStage, setLoadingStage] = useState<LoadingStage>("connecting");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domReady, setDomReady] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const { ref: viewRef, inView } = useInView({ rootMargin: "200px 0px" });

  // Refs for stable access in listeners without re-triggering effects
  const indexRef = useRef(index);
  const smartAudioRef = useRef(isSmartAudio);
  const globalMuteRef = useRef(isGlobalMute);

  useEffect(() => {
    indexRef.current = index;
    smartAudioRef.current = isSmartAudio;
    globalMuteRef.current = isGlobalMute;
  }, [index, isSmartAudio, isGlobalMute]);

  useEffect(() => {
    setLoadingStage("connecting");
    setLoadingProgress(0);
    setError(null);
    setDomReady(false);

    const progressInterval = setInterval(() => {
      // ... (keep same)
      setLoadingProgress((prev) => {
        if (prev < 80) return prev + Math.random() * 15;
        return prev;
      });
    }, 500);

    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = () => {
      console.log("[Webview] DOM Ready for:", url);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setDomReady(true);
      executeWebviewScript(webview, webviewInjectionScript);
      setTimeout(() => {
        setLoadingStage("ready");
      }, 500);
    };

    const handleError = (event: any) => {
      console.error("[Webview] Load error:", event);
      clearInterval(progressInterval);
      setLoadingStage("error");
      setError("Connection failed");
    };

    const handleDidStartLoading = () => {
      console.log("[Webview] Started loading:", url);
    };

    const handleDidStopLoading = () => {
      console.log("[Webview] Stopped loading:", url);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      if (!domReady) {
        setDomReady(true);
        executeWebviewScript(webview, webviewInjectionScript);
        setTimeout(() => {
          setLoadingStage("ready");
        }, 500);
      }
    };

    // Smart Audio Listener
    const handleIpcMessage = (event: Electron.IpcMessageEvent) => {
      if (!smartAudioRef.current || globalMuteRef.current) return;

      if (event.channel === 'mouseenter') {
        executeWebviewScript(webview, "const v=document.querySelector('video');if(v){v.muted=false;}");
        setPlaying(indexRef.current, true);
      } else if (event.channel === 'mouseleave') {
        executeWebviewScript(webview, "const v=document.querySelector('video');if(v){v.muted=true;}");
        setPlaying(indexRef.current, false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!domReady) {
        setDomReady(true);
        executeWebviewScript(webview, webviewInjectionScript);
        setLoadingStage("ready");
      }
    }, 10000);

    webview.addEventListener("dom-ready", handleDomReady);
    webview.addEventListener("did-fail-load", handleError);
    webview.addEventListener("did-start-loading", handleDidStartLoading);
    webview.addEventListener("did-stop-loading", handleDidStopLoading);
    webview.addEventListener("ipc-message", handleIpcMessage);

    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-fail-load", handleError);
      webview.removeEventListener("did-start-loading", handleDidStartLoading);
      webview.removeEventListener("did-stop-loading", handleDidStopLoading);
      webview.removeEventListener("ipc-message", handleIpcMessage);
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    };
  }, [url]); // Fixed dependencies

  // Enforce Global Mute or Local Mute
  useEffect(() => {
    if (domReady) {
      const mute = isGlobalMute || isMuted;
      executeWebviewScript(webviewRef.current, `const v=document.querySelector('video');if(v){v.muted=${mute};}`);
    }
  }, [isGlobalMute, isMuted, domReady]);

  useEffect(() => {
    if (!domReady) return;

    const shouldPlay = inView || isFullViewMode || viewMode === "full-expand";
    setIsPaused(!shouldPlay);
    const script = shouldPlay
      ? `const v=document.querySelector('video');if(v){v.muted=${isGlobalMute || isMuted};v.play();}`
      : "document.querySelector('video')?.pause();";
    executeWebviewScript(webviewRef.current, script);
    setPlaying(index, shouldPlay);
  }, [inView, isFullViewMode, domReady, index, setPlaying, viewMode]);

  const handleReload = () => {
    console.log("[Webview] Reloading:", url);
    setLoadingStage("connecting");
    setLoadingProgress(0);
    setError(null);
    setDomReady(false);
    webviewRef.current?.reload();
  };

  const username = getUsernameFromUrl(url);
  const isFullExpand = viewMode === "full-expand";
  const thumbUrl = generateThumbUrl(username);

  const style = {
    transform: isZoomed ? 'scale(1.8)' : CSS.Transform.toString(transform),
    transition: isZoomed ? 'transform 0.1s ease-out' : transition,
    zIndex: isFullViewMode ? 100 : (isDragging ? 101 : (isZoomed ? 9999 : 10)),
    gridColumn: `span ${colSpan}`,
    ...(isFullViewMode ? {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      transform: 'none',
      borderRadius: 0,
    } : {
      ...(width !== undefined && { width }),
      ...(height !== undefined && { height }),
      ...(top !== undefined && { top }),
      ...(left !== undefined && { left }),
    }),
    ...(isZoomed && {
      boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
      outline: '2px solid cyan',
      borderRadius: '0.5rem'
    })
  };

  // ...

  const containerClasses = [
    "relative bg-black transition-all duration-300 ease-in-out group",
    isFullViewMode ? "rounded-none" : "rounded-lg",
    isZoomed ? "overflow-visible" : "overflow-hidden",
    isDragging ? "opacity-0" : "opacity-100",
    "hover:shadow-xl hover:shadow-cyan-500/10",
  ].join(" ");

  const dropIndicatorClasses = [
    "absolute inset-0 z-50 pointer-events-none transition-all rounded-lg",
    isDraggable && isOver
      ? "bg-cyan-500/20 ring-2 ring-cyan-500 ring-inset"
      : "",
  ].join(" ");

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        viewRef(node);
      }}
      style={style}
      className={containerClasses}
      onMouseMove={(e) => {
        if (!isDragging) setIsZoomed(e.shiftKey);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      onDoubleClick={() => {
        if (isFullViewMode) {
          setFullViewMode(null);
        } else {
          setFullViewMode(index);
        }
      }}
      onMouseEnter={() => {
        setShowStreamInfo(true);
        // Fallback or wrapper-level Smart Audio (if IPC fails or for faster response)
        if (isSmartAudio && domReady && !isGlobalMute) {
          executeWebviewScript(webviewRef.current, "const v=document.querySelector('video');if(v){v.muted=false;}");
        }
      }}
      onMouseLeave={() => {
        setShowStreamInfo(false);
        setIsZoomed(false);
        if (isSmartAudio && domReady) {
          executeWebviewScript(webviewRef.current, "const v=document.querySelector('video');if(v){v.muted=true;}");
        }
      }}
    >
      <div className={dropIndicatorClasses} />

      {/* Hide Controls in Zen Mode */}
      {isDraggable && !isZenMode && (
        <div
          {...attributes}
          {...listeners}
          className={`absolute top-2 right-2 z-40 flex cursor-grab items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur-sm transition-all select-none ${isFullExpand ? "top-2" : ""
            } group-hover:opacity-100 active:cursor-grabbing`}
        >
          <GripVertical size={12} />
          <span className="max-w-24 truncate">{username}</span>
        </div>
      )}

      {/* Trash Button - Always visible top left unless Zen Mode */}
      {!isZenMode && (
        <>
          <button
            onClick={() => removeStream(index)}
            className="absolute top-2 left-2 z-40 rounded-full bg-red-600/80 p-1.5 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-red-600"
            title="Remove Stream"
          >
            <Trash2 size={12} />
          </button>

          <button
            onClick={() => window.open(url, '_blank', 'width=800,height=600')}
            className="absolute top-2 left-9 z-40 rounded-full bg-blue-600/80 p-1.5 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-blue-600"
            title="Pop-out Window"
          >
            <ExternalLink size={12} />
          </button>

          {username && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Navigating to profile:', username);
                window.location.href = `/camviewer/room/${username}`;
              }}
              className="absolute top-2 left-16 z-40 rounded-full bg-purple-600/80 p-1.5 text-white opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-purple-600"
              title="View Profile & Archives"
              type="button"
            >
              <User size={12} />
            </button>
          )}
        </>
      )}

      {!domReady && !error && (
        <StreamSkeleton />
      )}

      <webview
        ref={webviewRef}
        src={url}
        className="h-full w-full bg-black"
        preload="./preload.js"
        webpreferences="backgroundThrottling=true"
      />

      {domReady && !inView && !isFullViewMode && !isFullExpand && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm">
          <VideoOff size={32} className="mb-1 text-gray-500" />
          <span className="text-sm font-medium text-gray-400">Paused</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
          <WifiOff size={40} className="mb-2 text-red-400" />
          <span className="text-sm font-medium text-white">{error}</span>
          <button
            onClick={handleReload}
            className="mt-3 flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      <StreamInfoOverlay
        username={username || "Unknown"}
        isPlaying={externalIsPlaying ?? !isPaused}
        show={showStreamInfo && domReady}
      />

      <StreamControls
        index={index}
        onReload={handleReload}
        isPaused={isPaused}
        onTogglePause={() => {
          setIsPaused(!isPaused);
          const script = isPaused
            ? "const v=document.querySelector('video');if(v){v.muted=false;v.play();}"
            : "document.querySelector('video')?.pause();";
          executeWebviewScript(webviewRef.current, script);
          setPlaying(index, isPaused);
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
            onClick={() => {
              navigator.clipboard.writeText(url);
              setContextMenu(null);
            }}
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
}
