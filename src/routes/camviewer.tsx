import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useGridStore } from "@/state/gridStore";
import { useSettingsStore } from "@/state/settingsStore";
import { useProfileModalStore } from "@/state/profileModalStore";
import { StreamListSidebar } from "@/components/camviewer/StreamListSidebar";
import { StreamGrid } from "@/components/camviewer/grid/StreamGrid";
import { FullViewLayout } from "@/components/camviewer/FullViewLayout";
import { FullscreenModal } from "@/components/camviewer/FullscreenModal";
import { StatusHUD } from "@/components/camviewer/StatusHUD";
import { EmptyState } from "@/components/camviewer/EmptyState";
import { ProfileModal } from "@/components/camviewer/ProfileModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/helpers/window_helpers";
import { isMacOS } from "@/utils/platform";

export function CamViewerPage() {
  const initializeStreams = useGridStore((state) => state.initializeStreams);
  const fullViewMode = useGridStore((state) => state.fullViewMode);
  const streamUrls = useGridStore((state) => state.streamUrls);
  const {
    sidebarVisible,
    toggleSidebar,
    layoutMode,
    setLayoutMode,
  } = useSettingsStore();
  const { isOpen: isProfileOpen, username: profileUsername, closeProfile } = useProfileModalStore();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"rooms" | "browse">("browse");

  const handleTabChange = (tab: "rooms" | "browse") => {
    setActiveTab(tab);
    if (tab === 'browse' && !sidebarExpanded) {
      setSidebarExpanded(true);
    }
  };

  useEffect(() => {
    initializeStreams();
  }, [initializeStreams]);

  const hasStreams = streamUrls.length > 0;

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white select-none">
      {/* Window Controls Bar - Top Layer */}
      <div
        className="relative flex shrink-0 glass-header"
        style={{ zIndex: 9999, pointerEvents: "auto" }}
      >
        <div className="flex w-full items-center justify-between px-4 py-2">
          {/* Drag Region - Left side (only this area is draggable) */}
          <div className="draglayer flex flex-1 items-center gap-3">
            <Link
              to="/"
              className="no-drag flex items-center gap-2 rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white pointer-events-auto"
            >
              <LayoutGrid size={14} />
              <span>Back to Apps</span>
            </Link>
            <span className="h-4 w-px bg-white/10" />
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
        {/* Stream List Sidebar - Minimal - Very compact */}
        <AnimatePresence>
          {sidebarVisible && (
            <motion.aside
              initial={{ x: sidebarExpanded ? -192 : -56 }}
              animate={{ x: 0 }}
              exit={{ x: sidebarExpanded ? -192 : -56 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative z-20 flex flex-col glass-sidebar"
              style={{ width: sidebarExpanded ? (activeTab === 'browse' ? "32rem" : "12rem") : "3.5rem" }}
            >
              <StreamListSidebar
                collapsed={!sidebarExpanded}
                onToggleCollapse={() => setSidebarExpanded(!sidebarExpanded)}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Stream Content - Takes all remaining space */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-black/10">
          {hasStreams ? (
            <>
              <StreamGrid />
              {fullViewMode !== null && <FullViewLayout />}
            </>
          ) : (
            <EmptyState
              type="no-streams"
              onAction={() => handleTabChange('browse')}
            />
          )}
        </main>
      </div>

      <StatusHUD />
      <FullscreenModal />

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && profileUsername && (
          <ProfileModal username={profileUsername} onClose={closeProfile} />
        )}
      </AnimatePresence>
    </div>
  );
}

export const Route = createFileRoute("/camviewer")({
  component: CamViewerPage,
});
