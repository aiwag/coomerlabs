import React, { useRef, useEffect, useCallback } from "react";
import { X, Minimize2 } from "lucide-react";
import { useGridStore } from "@/state/gridStore";
import { webviewInjectionScript } from "@/lib/webview-injection";

export function FullscreenModal() {
  const { fullscreenStream, setFullscreenStream } = useGridStore();
  const webviewRef = useRef<HTMLWebViewElement>(null);

  const handleClose = useCallback(() => setFullscreenStream(null), [setFullscreenStream]);

  const injectScript = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview || !("executeJavaScript" in webview)) return;

    setTimeout(() => {
      (webview as any).executeJavaScript(webviewInjectionScript).catch(() => {});
    }, 300);
  }, []);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!fullscreenStream) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreenStream, handleClose]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (fullscreenStream && webview) {
      webview.addEventListener("dom-ready", injectScript);
      return () => webview.removeEventListener("dom-ready", injectScript);
    }
  }, [fullscreenStream, injectScript]);

  if (!fullscreenStream) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Glassmorphic Header */}
      <header
        className="draglayer flex items-center justify-between px-4 py-2 glass-header border-b border-white/10 text-white select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-sm font-bold tracking-wide">{fullscreenStream.username}</h2>
        </div>
        <button
          onClick={handleClose}
          className="no-drag flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Minimize2 size={14} />
          <span>Exit</span>
        </button>
      </header>
      <div className="flex-1">
        <webview
          ref={webviewRef}
          src={fullscreenStream.url}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
