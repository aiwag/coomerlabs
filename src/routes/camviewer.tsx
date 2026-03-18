import { createFileRoute, Link } from "@tanstack/react-router";
import { Circle, Film } from "lucide-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useGridStore } from "@/state/gridStore";
import { useSettingsStore } from "@/state/settingsStore";
import { useProfileModalStore } from "@/state/profileModalStore";
import { useRecordingStore } from "@/state/recordingStore";
import { StreamListSidebar } from "@/components/camviewer/StreamListSidebar";
import { StreamGrid } from "@/components/camviewer/grid/StreamGrid";
import { FullViewLayout } from "@/components/camviewer/FullViewLayout";
import { FullscreenModal } from "@/components/camviewer/FullscreenModal";
import { StatusHUD } from "@/components/camviewer/StatusHUD";
import { EmptyState } from "@/components/camviewer/EmptyState";
import { ProfileModal } from "@/components/camviewer/ProfileModal";
import { motion, AnimatePresence } from "framer-motion";
import DragWindowRegion from "@/components/DragWindowRegion";

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
  const activeRecordings = useRecordingStore((s) => s.activeRecordings);
  const syncActive = useRecordingStore((s) => s.syncActive);
  const recordingCount = activeRecordings.size;

  // Poll active recordings every 3s
  useEffect(() => {
    syncActive();
    const interval = setInterval(syncActive, 3000);
    return () => clearInterval(interval);
  }, [syncActive]);

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white select-none">
      {/* Shared Title Bar with app switcher + proxy menu */}
      <DragWindowRegion
        title={
          <span className="flex items-center gap-2">
            <span>{streamUrls.length} stream{streamUrls.length !== 1 ? "s" : ""}</span>
            {recordingCount > 0 && (
              <>
                <span className="h-3 w-px bg-white/10" />
                <Link
                  to="/recordings"
                  className="no-drag flex items-center gap-1.5 rounded-md bg-red-600/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400 transition-all hover:bg-red-600/30 pointer-events-auto animate-pulse"
                >
                  <Circle size={5} className="fill-current" />
                  <span>REC</span>
                  <span className="text-white/50">•</span>
                  <span className="text-red-300">{recordingCount}</span>
                  <Film size={9} className="text-red-400/60 ml-0.5" />
                </Link>
              </>
            )}
          </span>
        }
      />

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
