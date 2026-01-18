import React from "react";
import { Loader2, Wifi, WifiOff, AlertCircle } from "lucide-react";

interface LoadingIndicatorProps {
  progress?: number;
  stage?: "connecting" | "loading" | "ready" | "error";
  message?: string;
}

export function LoadingIndicator({
  progress,
  stage = "loading",
  message,
}: LoadingIndicatorProps) {
  const getStageConfig = () => {
    switch (stage) {
      case "connecting":
        return {
          icon: <Wifi size={32} className="animate-pulse text-cyan-400" />,
          color: "text-cyan-400",
          defaultMessage: "Connecting...",
        };
      case "loading":
        return {
          icon: <Loader2 size={32} className="animate-spin text-cyan-400" />,
          color: "text-cyan-400",
          defaultMessage: "Loading stream...",
        };
      case "ready":
        return {
          icon: <Loader2 size={32} className="text-green-400" />,
          color: "text-green-400",
          defaultMessage: "Ready",
        };
      case "error":
        return {
          icon: <AlertCircle size={32} className="text-red-400" />,
          color: "text-red-400",
          defaultMessage: "Connection failed",
        };
      default:
        return {
          icon: <Loader2 size={32} className="text-gray-400" />,
          color: "text-gray-400",
          defaultMessage: "Loading...",
        };
    }
  };

  const config = getStageConfig();
  const displayMessage = message || config.defaultMessage;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative flex flex-col items-center">
        {config.icon}

        {progress !== undefined && stage !== "error" && (
          <div className="mt-4 w-32">
            <div className="mb-1 flex justify-between text-xs text-white/60">
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <p className={`mt-2 text-sm font-medium ${config.color}`}>
          {displayMessage}
        </p>
      </div>
    </div>
  );
}
