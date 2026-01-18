import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useGridStore } from "@/state/gridStore";
import { useSettingsStore } from "@/state/settingsStore";
import { StreamListSidebar } from "@/components/camviewer/StreamListSidebar";
import { StreamBrowserSidebar } from "@/components/camviewer/browser/StreamBrowserSidebar";
import { StreamGrid } from "@/components/camviewer/grid/StreamGrid";
import { FullViewLayout } from "@/components/camviewer/FullViewLayout";
import { FullscreenModal } from "@/components/camviewer/FullscreenModal";
import { EmptyState } from "@/components/camviewer/EmptyState";
import {
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Grid3X3,
  Columns,
  Rows,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/helpers/window_helpers";
import { isMacOS } from "@/utils/platform";

function CamViewerPage() {
  const initializeStreams = useGridStore((state) => state.initializeStreams);
  const fullViewMode = useGridStore((state) => state.fullViewMode);
  const streamUrls = useGridStore((state) => state.streamUrls);
  const {
    browserVisible,
    setBrowserVisible,
    sidebarVisible,
    toggleSidebar,
    layoutMode,
    setLayoutMode,
  } = useSettingsStore();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    initializeStreams();
  }, [initializeStreams]);

  const hasStreams = streamUrls.length > 0;

  const handleSetLayoutMode = (mode: any) => {
    console.log("Setting layout mode to:", mode);
    setLayoutMode(mode);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white select-none">
      {/* Window Controls Bar - Top Layer */}
      <div
        className="relative flex shrink-0 border-b border-white/5 bg-black/90 backdrop-blur-sm"
        style={{ zIndex: 9999, pointerEvents: "auto" }}
      >
        <div className="flex w-full items-center justify-between px-4 py-2">
          {/* Drag Region - Left side (only this area is draggable) */}
          <div className="draglayer flex flex-1 items-center gap-3">
            <span className="text-xs font-medium text-neutral-400">
              {streamUrls.length} stream{streamUrls.length !== 1 ? "s" : ""}
            </span>
          </div>



          {/* Window Controls - Right side - Only show on non-mac */}
          {!isMacOS() && (
            <div className="pointer-events-auto ml-2 flex gap-1">
              <button
                onClick={minimizeWindow}
                className="cursor-pointer rounded p-1 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                title="Minimize"
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <rect fill="currentColor" width="10" height="1" x="1" y="6" />
                </svg>
              </button>
              <button
                onClick={maximizeWindow}
                className="cursor-pointer rounded p-1 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                title="Maximize"
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <rect
                    width="9"
                    height="9"
                    x="1.5"
                    y="1.5"
                    fill="none"
                    stroke="currentColor"
                  />
                </svg>
              </button>
              <button
                onClick={closeWindow}
                className="cursor-pointer rounded p-1 text-neutral-500 transition-colors hover:bg-red-400/10 hover:text-red-400"
                title="Close"
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <polygon
                    fill="currentColor"
                    fillRule="evenodd"
                    points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Area - Full viewport */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Stream Browser Sidebar - Slide from right */}
        <AnimatePresence>
          {browserVisible && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-30"
            >
              <StreamBrowserSidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stream List Sidebar - Minimal - Very compact */}
        <AnimatePresence>
          {sidebarVisible && (
            <motion.aside
              initial={{ x: sidebarExpanded ? -192 : -56 }}
              animate={{ x: 0 }}
              exit={{ x: sidebarExpanded ? -192 : -56 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-20 flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-sm"
              style={{ width: sidebarExpanded ? "12rem" : "3.5rem" }}
            >
              <StreamListSidebar collapsed={!sidebarExpanded} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Stream Content - Takes all remaining space */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-black">
          {hasStreams ? (
            <>{fullViewMode !== null ? <FullViewLayout /> : <StreamGrid />}</>
          ) : (
            <EmptyState
              type="no-streams"
              onAction={() => setBrowserVisible(true)}
            />
          )}
        </main>
      </div>

      {/* Floating Action Bar - Bottom Right */}
      <div className="absolute right-4 bottom-4 z-40 flex gap-2">
        <AnimatePresence>
          {!browserVisible && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setBrowserVisible(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-white shadow-xl backdrop-blur-md transition-all hover:bg-black/90"
            >
              <Search size={18} />
              <span className="text-sm font-medium">Browse</span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!hasStreams && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setBrowserVisible(true)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-white shadow-lg transition-all hover:bg-cyan-500"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Add Stream</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <FullscreenModal />
    </div>
  );
}

export const Route = createFileRoute("/camviewer")({
  component: CamViewerPage,
});
