// src/routes/__root.tsx
import React, { useRef } from "react";
import { useLocation } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BaseLayout from "@/layouts/BaseLayout";
import {
  Outlet,
  createRootRoute,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRecordingNotifications } from "@/hooks/useRecordingNotifications";
import { GlobalSearch } from "@/components/GlobalSearch";
import { CamViewerPage } from "./camviewer";

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always',
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      structuralSharing: true,
    },
  },
});

function Root() {
  const location = useLocation();
  const pathname = location.pathname;
  const isCamViewer = pathname === "/camviewer" || pathname.startsWith("/camviewer/");

  // Once CamViewer is visited, keep it mounted forever
  const camViewerVisited = useRef(false);
  if (isCamViewer) camViewerVisited.current = true;

  useRecordingNotifications();

  React.useEffect(() => {
    import("@/state/proxyStore").then(({ useProxyStore }) => {
      const { mode, applyManualProxy, applyPoolProxy, fetchPoolStats } = useProxyStore.getState();
      if (mode === 'manual') applyManualProxy();
      else if (mode === 'pool') {
        applyPoolProxy();
        fetchPoolStats();
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* 
        CamViewer: persisted across navigation.
        Once visited, stays mounted but hidden when inactive.
        This preserves webviews, state, sidebar data, etc.
      */}
      {camViewerVisited.current && (
        <div
          style={{
            display: isCamViewer ? 'contents' : 'none',
          }}
        >
          <CamViewerPage />
          {isCamViewer && <Toaster position="top-right" />}
          {isCamViewer && <GlobalSearch />}
        </div>
      )}

      {/* Normal routed content — all other pages */}
      {!isCamViewer && (
        <BaseLayout>
          <Outlet />
          <Toaster position="top-right" />
          <GlobalSearch />
        </BaseLayout>
      )}
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: Root,
  errorComponent: ({ error }) => (
    <div className="flex h-screen items-center justify-center">
      <div className="bg-background max-w-md rounded-lg p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h1 className="text-xl font-bold">Something went wrong</h1>
        </div>
        <p className="text-muted-foreground mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reload
        </Button>
      </div>
    </div>
  ),
});
