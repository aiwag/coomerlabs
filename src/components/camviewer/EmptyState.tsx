import React from "react";
import { Plus, Search, WifiOff, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-streams" | "offline" | "error";
  onAction?: () => void;
  actionLabel?: string;
}

export function EmptyState({ type, onAction, actionLabel }: EmptyStateProps) {
  const config = {
    "no-streams": {
      icon: <Video size={48} className="text-cyan-400" />,
      title: "No streams added yet",
      description:
        "Add your first stream to start watching. You can browse available streams or paste a URL directly.",
      actionIcon: <Plus size={16} />,
      defaultActionLabel: "Browse Streams",
    },
    offline: {
      icon: <WifiOff size={48} className="text-yellow-400" />,
      title: "All streams are offline",
      description:
        "The streams in your list are currently offline. Check back later or browse for new streams.",
      actionIcon: <Search size={16} />,
      defaultActionLabel: "Browse Online Streams",
    },
    error: {
      icon: <Sparkles size={48} className="text-red-400" />,
      title: "Something went wrong",
      description: "There was an issue loading the streams. Please try again.",
      actionIcon: <Sparkles size={16} />,
      defaultActionLabel: "Try Again",
    },
  };

  const current = config[type];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-900 p-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-neutral-800 p-4">
          {current.icon}
        </div>

        <h2 className="mb-2 text-2xl font-bold text-white">{current.title}</h2>

        <p className="mb-6 text-sm text-neutral-400">{current.description}</p>

        {onAction && (
          <Button
            onClick={onAction}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500"
          >
            {current.actionIcon}
            <span>{actionLabel || current.defaultActionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
