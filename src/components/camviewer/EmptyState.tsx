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
    <div className="flex h-full w-full flex-col items-center justify-center bg-transparent p-8">
      <div className="flex max-w-md flex-col items-center text-center glass-card p-12 rounded-[2.5rem]">
        <div className="mb-8 rounded-[2rem] bg-white/5 p-6 shadow-xl">
          {current.icon}
        </div>

        <h2 className="mb-4 text-3xl font-black text-white tracking-tight leading-tight">{current.title}</h2>

        <p className="mb-10 text-base text-neutral-400 leading-relaxed font-medium">{current.description}</p>

        {onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl liquid-button text-white"
          >
            {current.actionIcon}
            <span>{(actionLabel || current.defaultActionLabel).toUpperCase()}</span>
          </button>
        )}
      </div>
    </div>
  );
}
