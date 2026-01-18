import React from "react";
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Grid3X3,
  Grid,
  Columns,
  Layers,
} from "lucide-react";
import { useSettingsStore, LayoutMode } from "@/state/settingsStore";
import { useGridStore } from "@/state/gridStore";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export function GridControls() {
  const { layoutMode, setLayoutMode, sidebarVisible, toggleSidebar } =
    useSettingsStore();
  const { fullViewMode, setFullViewMode } = useGridStore();

  const layoutModes: {
    mode: LayoutMode;
    icon: React.ReactNode;
    label: string;
  }[] = [
    {
      mode: "magic",
      icon: <Sparkles size={16} />,
      label: "Magic Grid (Auto-fit)",
    },
    { mode: 2, icon: <Grid3X3 size={16} />, label: "2x2 Grid" },
    { mode: 3, icon: <Grid size={16} />, label: "3x3 Grid" },
    { mode: 4, icon: <Layers size={16} />, label: "4x4 Grid" },
    {
      mode: "hierarchical",
      icon: <Columns size={16} />,
      label: "Focus Layout",
    },
  ];

  return (
    <div className="border-b border-neutral-700 bg-neutral-800/50 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-white uppercase">
            Layout
          </h3>
          <div className="h-4 w-px bg-neutral-600" />
          <div className="flex gap-1">
            <TooltipProvider delayDuration={0}>
              {layoutModes.map(({ mode, icon, label }) => (
                <Tooltip key={String(mode)}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={layoutMode === mode ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setLayoutMode(mode)}
                    >
                      {icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={fullViewMode !== null ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    setFullViewMode(fullViewMode !== null ? null : 0)
                  }
                >
                  {fullViewMode !== null ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {fullViewMode !== null ? "Exit Focus Mode" : "Focus Mode"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
