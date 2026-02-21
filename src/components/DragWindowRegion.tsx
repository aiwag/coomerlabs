import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/helpers/window_helpers";
import { isMacOS } from "@/utils/platform";
import React, { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Camera,
  Video,
  Image as ImageIcon,
  Users,
  Play,
  Star,
  Home,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DragWindowRegionProps {
  title?: ReactNode;
}

const apps = [
  { to: "/", title: "Home", icon: <Home size={14} /> },
  { to: "/camviewer", title: "CamViewer", icon: <Camera size={14} /> },
  { to: "/redgifs", title: "RedGifs Explorer", icon: <Video size={14} /> },
  { to: "/fapello", title: "Fapello Collections", icon: <ImageIcon size={14} /> },
  { to: "/wallheaven", title: "Wallheaven Labs", icon: <ImageIcon size={14} /> },
  { to: "/creators", title: "Coomer Creators", icon: <Users size={14} /> },
  { to: "/coomerKemono", title: "Creator Archive", icon: <Users size={14} /> },
  { to: "/javtube", title: "JavTube v2", icon: <Play size={14} /> },
  { to: "/actresses", title: "Star Database", icon: <Users size={14} /> },
];

export default function DragWindowRegion({ title }: DragWindowRegionProps) {
  return (
    <div className="flex w-screen items-stretch justify-between bg-black/40 backdrop-blur-md border-b border-white/5 h-8">
      <div className="draglayer w-full flex items-center px-2">
        {!isMacOS() && (
          <div className="flex items-center gap-1 no-drag">
            <TooltipProvider delayDuration={0}>
              {apps.map((app) => (
                <Tooltip key={app.to}>
                  <TooltipTrigger asChild>
                    <Link
                      to={app.to}
                      className="p-1.5 text-white/40 hover:text-cyan-400 hover:bg-white/5 rounded transition-colors"
                    >
                      {app.icon}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs bg-black/90 text-white border-white/10">
                    <p>{app.title}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>

            {title && (
              <>
                <div className="h-3 w-px bg-white/10 mx-2" />
                <span className="text-xs text-white/30 font-medium select-none">{title}</span>
              </>
            )}
          </div>
        )}
        {isMacOS() && (
          <div className="flex flex-1 p-2">
            {/* Maintain the same height but do not display content */}
          </div>
        )}
      </div>
      {!isMacOS() && <WindowButtons />}
    </div>
  );
}

function WindowButtons() {
  return (
    <div className="flex">
      <button
        title="Minimize"
        type="button"
        className="p-2 hover:bg-slate-300"
        onClick={minimizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect fill="currentColor" width="10" height="1" x="1" y="6"></rect>
        </svg>
      </button>
      <button
        title="Maximize"
        type="button"
        className="p-2 hover:bg-slate-300"
        onClick={maximizeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <rect
            width="9"
            height="9"
            x="1.5"
            y="1.5"
            fill="none"
            stroke="currentColor"
          ></rect>
        </svg>
      </button>
      <button
        type="button"
        title="Close"
        className="p-2 hover:bg-red-300"
        onClick={closeWindow}
      >
        <svg
          aria-hidden="true"
          role="img"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <polygon
            fill="currentColor"
            fillRule="evenodd"
            points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
          ></polygon>
        </svg>
      </button>
    </div>
  );
}
