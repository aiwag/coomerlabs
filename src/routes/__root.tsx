// src/routes/__root.tsx
import React from "react";
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

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - reduce unnecessary refetches
      gcTime: 1000 * 60 * 30, // 30 minutes - keep data in memory longer
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always',
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      structuralSharing: true, // Efficient re-render avoidance
    },
  },
});

function Root() {
  const location = useLocation();
  const isCamViewer = location.pathname === "/camviewer";

  return (
    <QueryClientProvider client={queryClient}>
      {isCamViewer ? (
        <>
          <Outlet />
          <Toaster position="top-right" />
        </>
      ) : (
        <BaseLayout>
          <Outlet />
          <Toaster position="top-right" />
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
