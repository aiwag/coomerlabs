import React, { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, rectSwappingStrategy } from "@dnd-kit/sortable";
import { useGridStore } from "@/state/gridStore";
import { useSettingsStore } from "@/state/settingsStore";
import { SortableWebview } from "./SortableWebview";
import { WaterfallLayout } from "./WaterfallLayout";
import {
  Maximize2, Minimize2, Ear, Volume2, SlidersHorizontal, VolumeX,
  Grid3X3, LayoutGrid, Monitor, Activity, ShieldAlert, Zap, Repeat
} from "lucide-react";
import { getUsernameFromUrl, generateThumbUrl } from "@/utils/formatters";

function DraggingItem({ url }: { url: string }) {
  const username = getUsernameFromUrl(url);
  const thumbUrl = generateThumbUrl(username);
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border-2 border-cyan-500 bg-neutral-800 shadow-2xl">
      <img
        src={thumbUrl}
        className="h-full w-full object-cover opacity-30"
        alt=""
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-lg font-semibold text-white">{username}</p>
      </div>
    </div>
  );
}

export function StreamGrid() {
  const { streamUrls, handleDragEnd, isGlobalMute, setGlobalMute, rotateStreams } = useGridStore();
  const { layoutMode, setLayoutMode } = useSettingsStore(); // Allow changing layout mode
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const lastDeviceCount = React.useRef(0);

  // Global Mute & Headphone Safety
  useEffect(() => {
    // 1. Keyboard Shortcut (M)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' && document.activeElement?.tagName !== 'INPUT') {
        setGlobalMute(!isGlobalMute);
      }
      // Force Mute Shortcut (Shift+M)
      if (e.key.toLowerCase() === 'm' && e.shiftKey) {
        setGlobalMute(true);
      }
    };
    window.addEventListener('keydown', handleKey);

    // 2. Headphone/Device Safety
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOuts = devices.filter(d => d.kind === 'audiooutput');

        // If devices decreased, assume unplugged -> MUTE
        if (lastDeviceCount.current > 0 && audioOuts.length < lastDeviceCount.current) {
          console.log("Audio Device Unplugged - Safety Mute Engaged");
          setGlobalMute(true);
        }
        lastDeviceCount.current = audioOuts.length;
      } catch (e) { }
    };
    checkDevices();
    navigator.mediaDevices.addEventListener('devicechange', checkDevices);

    return () => {
      window.removeEventListener('keydown', handleKey);
      navigator.mediaDevices.removeEventListener('devicechange', checkDevices);
    };
  }, [isGlobalMute, setGlobalMute]);

  // Container Resize for Smart Layout
  const [containerSize, setContainerSize] = useState({ w: 1920, h: 1080 });

  useEffect(() => {
    if (!gridRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ w: width, h: height });
        }
      }
    });
    ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, []);

  const getSmartDimensions = (index: number, count: number) => {
    if (layoutMode !== 'smart-fit') return null;

    let pattern: number[] = [];
    // Sophisticated Auto-Balancing Algorithm

    // 1. Calculate ideal grid dimensions based on ACTUAL CONTAINER size
    const containerRatio = containerSize.w / containerSize.h;

    const targetCellRatio = 1.77;
    const factor = targetCellRatio / containerRatio;

    // Estimate ideal Rows based on maintaining aspect ratio (using containerSize)
    const idealRows = Math.round(Math.sqrt(count * factor));
    const numRows = Math.max(1, Math.min(count, idealRows));

    // 2. Distribute items into rows (Balanced Partition)
    // We want rows to be as even as possible, but top-heavy if remainder?
    // Actually User prefered specific layouts for small N.
    // 3 -> [2, 1]. 5 -> [3, 2].
    // This matches "Ceiling" distribution.
    let left = count;
    for (let i = 0; i < numRows; i++) {
      const rowsLeft = numRows - i;
      const take = Math.ceil(left / rowsLeft);
      pattern.push(take);
      left -= take;
    }

    // Override for specific aesthetic cases if the math drifts?
    // The Ceiling math naturally produces [2, 1] for 3, [3, 2] for 5, [2, 2] for 4.
    // It is robust.

    // 3. Locate Item in Grid
    let rowIdx = 0;
    let acc = 0;
    for (let i = 0; i < pattern.length; i++) {
      if (index < acc + pattern[i]) {
        rowIdx = i;
        break;
      }
      acc += pattern[i];
    }

    const itemsInRow = pattern[rowIdx];

    // 4. Equal Area Logic
    // Row Height is proportional to the number of items it contains relative to total.
    // This ensures every single cell has (roughly) Equal Area.
    const rowHeight = (itemsInRow / count) * 100;
    const itemWidth = 100 / itemsInRow;

    return { width: `${itemWidth}%`, height: `${rowHeight}%` };
  };


  // Luxury Features Stat
  const [zenMode, setZenMode] = useState(false);
  const [smartAudio, setSmartAudio] = useState(false);
  const [panicMode, setPanicMode] = useState(false); // NEW: Panic Shield
  const [manualCols, setManualCols] = useState(0); // 0 = auto
  const [gridGap, setGridGap] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [patrolMode, setPatrolMode] = useState(false); // PATROL MODE

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (patrolMode) {
      interval = setInterval(() => {
        rotateStreams();
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [patrolMode, rotateStreams]);

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.altKey) {
        switch (e.key) {
          case '1': setLayoutMode('clean-fit'); break;
          case '2': setLayoutMode('smart-fit'); break;
          case '3': setLayoutMode('waterfall'); break;
          case '4': setLayoutMode('magic'); break;
          case '0': setZenMode(prev => !prev); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLayoutMode, setZenMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  );

  // --- LAYOUT ROUTER ---
  if (layoutMode === "waterfall") {
    return <WaterfallLayout />;
  }

  // GRID LAYOUT MODES
  const isDraggable = ["magic", "clean-fit", 2, 3, 4].includes(layoutMode);

  const { gridStyle, currentCols } = useMemo(() => {
    const count = streamUrls.length;
    if (count === 0) return { gridStyle: { gridTemplateColumns: "1fr" }, currentCols: 1 };

    let cols: number;
    let rows: number;
    const gap = zenMode ? "0px" : `${gridGap}px`;

    // Manual Override
    if (manualCols > 0) {
      cols = manualCols;
      rows = Math.ceil(count / cols);
    } else {
      // Smart Fit handled separately via props, but we need dummy grid stats?
      if (layoutMode === 'smart-fit') {
        return {
          gridStyle: {
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'stretch',
            gap: 0 // FORCE ZERO GAP for "Full Utilization"
          },
          currentCols: 0
        };
      }

      switch (layoutMode) {
        case "clean-fit":
          cols = Math.ceil(Math.sqrt(count));
          rows = Math.ceil(count / cols);
          break;
        case "full-expand":
          cols = 1;
          rows = count;
          break;
        case 2:
          cols = 2;
          rows = Math.ceil(count / 2);
          break;
        case 3:
          cols = 3;
          rows = Math.ceil(count / 3);
          break;
        case 4:
          cols = 4;
          rows = Math.ceil(count / 4);
          break;
        case "smart-fit": // Smart Fit handled above as Flex, but fallbacks?
        case "magic":
        default:
          const aspect = containerSize.w / containerSize.h;
          if (aspect > 1) {
            cols = Math.ceil(Math.sqrt(count * aspect));
            rows = Math.ceil(count / cols);
          } else {
            rows = Math.ceil(Math.sqrt(count * (1 / aspect)));
            cols = Math.ceil(count / rows);
          }
      }
    }

    return {
      gridStyle: {
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap,
      },
      currentCols: cols
    };
  }, [streamUrls.length, layoutMode, manualCols, gridGap, zenMode, containerSize]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={(e) => {
        handleDragEnd(e);
        setActiveId(null);
      }}
    >
      <div
        className="relative h-full w-full bg-black overflow-hidden"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className={`h-full w-full transition-all duration-300 ${panicMode ? 'blur-3xl brightness-0 scale-105 pointer-events-none' : ''}`}>
          <SortableContext items={streamUrls} strategy={rectSwappingStrategy}>
            <div
              ref={gridRef}
              className={`h-full w-full transition-all duration-500 ${layoutMode === 'smart-fit' ? 'flex content-start' : 'grid'} ${zenMode ? "" : "p-2"}`}
              style={gridStyle}
            >
              {streamUrls.map((url, index) => {
                const smartDims = getSmartDimensions(index, streamUrls.length);
                return (
                  <SortableWebview
                    key={url}
                    id={url}
                    url={url}
                    index={index}
                    isDragging={activeId === url}
                    isDraggable={isDraggable}
                    isZenMode={zenMode}
                    isSmartAudio={smartAudio && !panicMode}
                    isGlobalMute={isGlobalMute || panicMode}
                    width={smartDims?.width}
                    height={smartDims?.height}
                    colSpan={1}
                    viewMode={
                      layoutMode === "clean-fit"
                        ? "clean-fit"
                        : layoutMode === "full-expand"
                          ? "full-expand"
                          : "grid"
                    }
                  />
                )
              })}
            </div>
          </SortableContext>
        </div> {/* End Blur Wrapper */}

        {/* --- LUXURY CONTROL BAR --- */}
        <div
          className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-500 z-50 ${showControls || activeId ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}`}
        >
          {/* Panic Shield - Priority Left */}
          <button
            onClick={() => setPanicMode(!panicMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${panicMode ? 'bg-red-600 text-white animate-pulse' : 'text-gray-400 hover:text-red-500'}`}
            title="PANIC SHIELD (Blur Everything)"
          >
            <ShieldAlert size={18} />
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* Global Mute Toggle */}
          <button
            onClick={() => setGlobalMute(!isGlobalMute)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${isGlobalMute ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500/50' : 'text-gray-400 hover:text-white'}`}
            title="GLOBAL MUTE (Safety)"
          >
            {isGlobalMute ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* Smart Fit Toggle */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'smart-fit' ? 'magic' : 'smart-fit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${layoutMode === 'smart-fit' ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/50' : 'text-gray-400 hover:text-white'}`}
            title="Smart Fit Layout"
          >
            <Zap size={18} />
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* Patrol Mode Toggle */}
          <button
            onClick={() => setPatrolMode(!patrolMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${patrolMode ? 'bg-green-500/20 text-green-500 ring-1 ring-green-500/50' : 'text-gray-400 hover:text-white'}`}
            title="Patrol Mode (Auto-Cycle Streams)"
          >
            <Repeat size={18} className={patrolMode ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* Smart Audio Toggle */}
          <button
            onClick={() => setSmartAudio(!smartAudio)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${smartAudio ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
            title="Smart Audio Focus (Hover to Listen)"
          >
            {smartAudio ? <Ear size={18} /> : <Volume2 size={18} />}
            <span className="text-xs font-semibold">Focus</span>
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* Zen Mode Toggle */}
          <button
            onClick={() => setZenMode(!zenMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${zenMode ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
            title="Cinematic Zen Mode"
          >
            {zenMode ? <Maximize2 size={18} /> : <Monitor size={18} />}
            <span className="text-xs font-semibold">Zen</span>
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* Layout Controls */}
          <div className="flex items-center gap-3">
            <button onClick={() => setLayoutMode('magic')} className={`p-1.5 rounded-md ${layoutMode === 'magic' && manualCols === 0 ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}><LayoutGrid size={16} /></button>

            {/* Manual Columns Slider */}
            <div className="flex flex-col items-center w-24">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Columns: {manualCols || 'Auto'}</span>
              <input
                type="range" min="0" max="8" step="1"
                value={manualCols}
                onChange={(e) => setManualCols(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Gap Slider */}
            <div className="flex flex-col items-center w-24">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Gap: {gridGap}px</span>
              <input
                type="range" min="0" max="24" step="1"
                value={gridGap}
                onChange={(e) => setGridGap(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? <DraggingItem url={activeId} /> : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
