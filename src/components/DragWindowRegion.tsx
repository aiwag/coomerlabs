import {
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "@/helpers/window_helpers";
import { isMacOS } from "@/utils/platform";
import React, { type ReactNode, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Camera,
  Video,
  Image as ImageIcon,
  Users,
  Play,
  Star,
  Home,
  Clock,
  Film,
  Search,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShieldCheck, ShieldAlert, ShieldOff, Network } from "lucide-react";
import { toast } from "sonner";
import { useProxyStore } from "@/state/proxyStore";

interface DragWindowRegionProps {
  title?: ReactNode;
}

const apps = [
  { to: "/", title: "Home", icon: <Home size={14} /> },
  { to: "/camviewer", title: "CamViewer", icon: <Camera size={14} /> },
  { to: "/camarchive", title: "Cam Archive", icon: <Clock size={14} /> },
  { to: "/recordings", title: "Recordings", icon: <Film size={14} /> },
  { to: "/redgifs", title: "RedGifs Explorer", icon: <Video size={14} /> },
  { to: "/fapello", title: "Fapello Collections", icon: <ImageIcon size={14} /> },
  { to: "/wallheaven", title: "Wallheaven Labs", icon: <ImageIcon size={14} /> },
  { to: "/creators", title: "Coomer Creators", icon: <Users size={14} /> },
  { to: "/coomerKemono", title: "Creator Archive", icon: <Users size={14} /> },
  { to: "/javtube", title: "JavTube v2", icon: <Play size={14} /> },
  { to: "/actresses", title: "Star Database", icon: <Star size={14} /> },
  { to: "/nsfwalbum", title: "NSFWAlbum", icon: <ImageIcon size={14} /> },
];

export default function DragWindowRegion({ title }: DragWindowRegionProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (to: string) => {
    if (to === "/") return currentPath === "/";
    return currentPath.startsWith(to);
  };

  return (
    <div className="flex w-screen items-stretch justify-between bg-black/40 backdrop-blur-md border-b border-white/5 h-8">
      <div className="draglayer w-full flex items-center px-2">
        {!isMacOS() && (
          <div className="flex items-center gap-0.5 no-drag">
            <TooltipProvider delayDuration={0}>
              {apps.map((app) => {
                const active = isActive(app.to);
                return (
                  <Tooltip key={app.to}>
                    <TooltipTrigger asChild>
                      <Link
                        to={app.to}
                        className={`p-1.5 rounded transition-all duration-200 ${
                          active
                            ? "text-cyan-400 bg-cyan-400/10"
                            : "text-white/40 hover:text-cyan-400 hover:bg-white/5"
                        }`}
                      >
                        {app.icon}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs bg-black/90 text-white border-white/10">
                      <p>{app.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
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
      
      {/* Search trigger - moved to right side */}
      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
        className="no-drag flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/25 hover:text-white/40 hover:bg-white/8 transition-colors mr-3 cursor-pointer"
      >
        <Search size={10} />
        <span>Search</span>
        <kbd className="text-[9px] px-1 py-px rounded bg-white/5 border border-white/10 font-bold">⌘K</kbd>
      </button>

      {!isMacOS() && (
        <div className="flex items-center no-drag">
          <AdBlockButton />
          <BandwidthIndicator />
          <ProxyMenu />
          <WindowButtons />
        </div>
      )}
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

function BandwidthIndicator() {
  const [bw, setBw] = React.useState<any>(null);

  const fmt = (b: number) => {
    if (!b || b < 0) return '0';
    if (b < 1024) return `${b}B`;
    if (b < 1048576) return `${(b / 1024).toFixed(0)}K`;
    if (b < 1073741824) return `${(b / 1048576).toFixed(1)}M`;
    return `${(b / 1073741824).toFixed(1)}G`;
  };

  React.useEffect(() => {
    try {
      // @ts-ignore
      const unsub = window.electronAPI?.bandwidth?.onStats((stats: any) => setBw(stats));
      return () => { if (typeof unsub === 'function') unsub(); };
    } catch { return () => {}; }
  }, []);

  if (!bw) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 mr-1 text-[9px] font-mono select-none" title={`Session: ↓${fmt(bw.sessionDown)} ↑${fmt(bw.sessionUp)}`}>
      <span className="text-emerald-400">↓{fmt(bw.downloadSpeed)}/s</span>
      <span className="text-cyan-400">↑{fmt(bw.uploadSpeed)}/s</span>
    </div>
  );
}

function ProxyMenu() {
  const store = useProxyStore();
  const { mode, config, poolStats, currentPoolProxy, isRefreshing, autoRefreshEnabled, progress } = store;
  const isActive = mode !== 'off';

  // Bandwidth stats
  const [bw, setBw] = React.useState<any>(null);

  // Format bytes helper
  const fmtB = (b: number) => {
    if (!b || b < 0) return '0 B';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`;
    return `${(b / 1073741824).toFixed(2)} GB`;
  };

  // Country code → flag emoji
  const flag = (cc?: string) => {
    if (!cc || cc.length !== 2) return '';
    return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  };

  // Subscribe to progress events from main process
  React.useEffect(() => {
    const unsub = store.subscribeToProgress();
    // Fetch stats on mount
    if (mode === 'pool') {
      store.fetchPoolStats();
      store.fetchPoolProxies();
    }
    return unsub;
  }, []);

  // Subscribe to tunnel progress
  React.useEffect(() => {
    const unsub = store.subscribeTunnelProgress();
    return unsub;
  }, []);

  // Subscribe to bandwidth stats
  React.useEffect(() => {
    try {
      // @ts-ignore
      const unsub = window.electronAPI?.bandwidth?.onStats((stats: any) => setBw(stats));
      return () => { if (typeof unsub === 'function') unsub(); };
    } catch { return () => {}; }
  }, []);

  // Subscribe to smart proxy suggestions → show action toasts
  React.useEffect(() => {
    try {
      // @ts-ignore
      const unsub = window.electronAPI?.proxyPool?.onSuggestion?.((suggestion: any) => {
        const iconMap: Record<string, string> = {
          rate_limited: '⚡',
          slow: '🐌',
          region_blocked: '🌍',
          proxy_dead: '💀',
          pool_low: '📉',
        };
        toast(suggestion.message, {
          icon: iconMap[suggestion.type] || '💡',
          duration: 8000,
          position: 'top-right',
          action: {
            label: suggestion.action,
            onClick: () => {
              if (suggestion.actionId === 'proxy:rotate') {
                store.rotatePoolProxy();
              } else if (suggestion.actionId === 'proxy:refreshPool') {
                store.refreshPool();
              }
            },
          },
        });
      });
      return unsub || (() => {});
    } catch {
      return () => {};
    }
  }, []);

  // Auto-apply pool proxy when switching to pool mode
  React.useEffect(() => {
    if (mode === 'pool' && !currentPoolProxy) {
      store.applyPoolProxy();
    }
  }, [mode]);

  const progressPct = progress.total > 0 ? Math.round((progress.tested / progress.total) * 100) : 0;
  const [showList, setShowList] = useState(false);
  const [ipVerifying, setIpVerifying] = useState(false);
  const [ipResults, setIpResults] = useState<any[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { poolProxies } = store;
  const virtualizer = useVirtualizer({
    count: poolProxies.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  return (
    <Popover>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className="h-full flex items-center gap-1.5 p-2 px-3 hover:bg-white/10 transition-colors border-l border-white/5 group no-drag">
                {isActive ? (
                  <ShieldCheck size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <ShieldAlert size={13} className="text-white/40 group-hover:text-white transition-colors" />
                )}
                {/* Inline active proxy badge — matches proxy manager header */}
                {isActive && currentPoolProxy && mode === 'pool' && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {currentPoolProxy.country && <span className="text-[10px]">{flag(currentPoolProxy.country)}</span>}
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{currentPoolProxy.latencyMs}ms</span>
                    <span className={`text-[9px] font-bold uppercase ${
                      currentPoolProxy.protocol === 'socks5' ? 'text-purple-400' :
                      currentPoolProxy.protocol === 'socks4' ? 'text-blue-400' : 'text-cyan-400'
                    }`}>{currentPoolProxy.protocol}</span>
                    {(() => {
                      const ms = currentPoolProxy.latencyMs;
                      const s = currentPoolProxy.score;
                      const fit = ms < 300 && s > 70 ? { l: '★', c: 'text-emerald-400' } :
                                  ms < 800 && s > 45 ? { l: '●', c: 'text-cyan-400' } :
                                  ms < 1500 ? { l: '◐', c: 'text-yellow-400' } :
                                  { l: '○', c: 'text-red-400' };
                      return <span className={`text-[9px] font-bold ${fit.c}`}>{fit.l}</span>;
                    })()}
                  </div>
                )}
                {isRefreshing && (
                  <span className="text-[10px] text-cyan-400 animate-pulse font-bold">⟳</span>
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs bg-black/90 text-white border-white/10" sideOffset={8}>
            {isActive && currentPoolProxy ? (
              <div className="space-y-0.5">
                <p className="font-bold">{flag(currentPoolProxy.country)} {currentPoolProxy.protocol.toUpperCase()} {currentPoolProxy.host}:{currentPoolProxy.port}</p>
                <p className="text-white/50">{currentPoolProxy.latencyMs}ms • Score {currentPoolProxy.score}{currentPoolProxy.country ? ` • ${currentPoolProxy.country}` : ''}</p>
              </div>
            ) : (
              <p>{isActive ? `Proxy: ${mode}` : 'Proxy: Off'}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent side="bottom" align="end" className="w-[380px] bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 p-0 shadow-2xl rounded-xl z-[9999]" sideOffset={8}>
        {/* Header with inline active proxy */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
              <Network size={16} className={isActive ? 'text-emerald-400' : 'text-cyan-400'} />
              Proxy Manager
            </div>
            <div className="flex items-center gap-2">
              {/* Active proxy mini badge in header */}
              {isActive && currentPoolProxy && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentPoolProxy.country && <span className="text-[10px]">{flag(currentPoolProxy.country)}</span>}
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{currentPoolProxy.latencyMs}ms</span>
                  <span className={`text-[9px] font-bold uppercase ${
                    currentPoolProxy.protocol === 'socks5' ? 'text-purple-400' :
                    currentPoolProxy.protocol === 'socks4' ? 'text-blue-400' : 'text-cyan-400'
                  }`}>{currentPoolProxy.protocol}</span>
                </div>
              )}
              {/* Quick on/off toggle */}
              <button onClick={() => store.setMode(isActive ? 'off' : 'pool')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 shadow-inner ${
                  isActive ? 'bg-emerald-500' : 'bg-gray-700/80'
                }`}>
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                  isActive ? 'translate-x-[18px]' : 'translate-x-[2px]'
                }`} />
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-black/40 rounded-lg p-0.5 gap-0.5">
            {(['off', 'manual', 'pool', 'tunnel'] as const).map((m) => (
              <button
                key={m}
                onClick={() => store.setMode(m)}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all duration-200 ${
                  mode === m ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {m === 'off' ? 'Off' : m === 'manual' ? 'Manual' : m === 'pool' ? 'Pool' : '🔒 Tunnel'}
              </button>
            ))}
          </div>

          {/* Bandwidth Stats Bar */}
          {bw && (
            <div className="mt-2 flex items-center gap-2 text-[9px] font-mono text-white/50">
              <span className="text-emerald-400">↓ {fmtB(bw.downloadSpeed)}/s</span>
              <span className="text-cyan-400">↑ {fmtB(bw.uploadSpeed)}/s</span>
              <span className="text-white/20">│</span>
              <span title="This session">📊 {fmtB(bw.sessionDown)}</span>
              <span className="text-white/20">│</span>
              <span title="Today">📅 {fmtB(bw.todayDown)}</span>
              <span className="text-white/20">│</span>
              <span title="All time">Σ {fmtB(bw.totalDown)}</span>
            </div>
          )}
        </div>

        {/* Manual Mode */}
        {mode === 'manual' && (
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Protocol</label>
              <select
                value={config.protocol}
                onChange={(e) => store.updateConfig({ protocol: e.target.value as any })}
                className="w-full bg-black/40 border border-white/10 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-cyan-500/50 appearance-none"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-[2] space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Host / IP</label>
                <input type="text" placeholder="127.0.0.1" value={config.host}
                  onChange={(e) => store.updateConfig({ host: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-cyan-500/50 placeholder:text-white/20" />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Port</label>
                <input type="text" placeholder="1080" value={config.port}
                  onChange={(e) => store.updateConfig({ port: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-cyan-500/50 placeholder:text-white/20" />
              </div>
            </div>
            <button onClick={() => store.applyManualProxy()}
              className="w-full py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition-colors">
              Apply Proxy
            </button>
          </div>
        )}

        {/* Pool Mode */}
        {mode === 'pool' && (
          <div className="p-4 space-y-3">
            {/* Progress / Log Console */}
            {(isRefreshing || progress.phase !== 'idle') && progress.phase !== 'done' && (
              <div className="rounded-lg bg-black/40 border border-white/5 overflow-hidden">
                {/* Progress bar */}
                {progress.phase === 'validating' && progress.total > 0 && (
                  <div className="h-1 bg-white/5">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300" 
                      style={{ width: `${progressPct}%` }} />
                  </div>
                )}
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-white/50 font-mono truncate flex-1">{progress.log}</span>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    {progress.phase === 'validating' && (
                      <span className="text-[10px] text-cyan-400 font-bold">{progressPct}%</span>
                    )}
                    <span className="text-[10px] text-emerald-400 font-bold">{progress.alive} alive</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pool Stats */}
            {poolStats && (
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Pool', value: poolStats.poolSize, color: 'text-cyan-400' },
                  { label: 'Valid', value: poolStats.totalValid, color: 'text-emerald-400' },
                  { label: 'Total', value: poolStats.totalFetched, color: 'text-white' },
                  { label: 'Avg ms', value: poolStats.avgLatency, color: 'text-yellow-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                    <p className="text-[9px] text-white/40 font-bold">{label}</p>
                    <p className={`text-xs font-black ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Current Proxy — Rich Card */}
            {currentPoolProxy && (
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 overflow-hidden">
                <div className="px-3 py-2 border-b border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">Active</span>
                    {currentPoolProxy.country && (
                      <span className="text-[10px]">{flag(currentPoolProxy.country)} <span className="text-white/40 text-[9px] font-bold">{currentPoolProxy.country}</span></span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Streaming fitness badge */}
                    {(() => {
                      const ms = currentPoolProxy.latencyMs;
                      const s = currentPoolProxy.score;
                      const fit = ms < 300 && s > 70 ? { label: 'Excellent', color: 'text-emerald-400 bg-emerald-500/15' } :
                                  ms < 800 && s > 45 ? { label: 'Good', color: 'text-cyan-400 bg-cyan-500/15' } :
                                  ms < 1500 ? { label: 'Fair', color: 'text-yellow-400 bg-yellow-500/15' } :
                                  { label: 'Poor', color: 'text-red-400 bg-red-500/15' };
                      return <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${fit.color}`}>{fit.label}</span>;
                    })()}
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      currentPoolProxy.protocol === 'socks5' ? 'bg-purple-500/20 text-purple-400' :
                      currentPoolProxy.protocol === 'socks4' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-cyan-500/20 text-cyan-400'
                    }`}>{currentPoolProxy.protocol}</span>
                  </div>
                </div>
                <div className="px-3 py-2 space-y-2">
                  <p className="text-[12px] text-emerald-400 font-mono font-bold">{currentPoolProxy.host}:{currentPoolProxy.port}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <p className="text-[8px] text-white/30 font-bold uppercase">Latency</p>
                      <p className={`text-[11px] font-bold ${
                        currentPoolProxy.latencyMs < 500 ? 'text-emerald-400' :
                        currentPoolProxy.latencyMs < 2000 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{currentPoolProxy.latencyMs}ms</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-white/30 font-bold uppercase">Score</p>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${currentPoolProxy.score}%` }} />
                        </div>
                        <span className="text-[9px] text-white/60 font-bold">{currentPoolProxy.score}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] text-white/30 font-bold uppercase">Hits</p>
                      <p className="text-[10px] font-bold text-white/70">
                        {currentPoolProxy.successCount}/{currentPoolProxy.successCount + currentPoolProxy.failCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-white/30 font-bold uppercase">Stream</p>
                      <p className={`text-[10px] font-bold ${
                        currentPoolProxy.latencyMs < 500 ? 'text-emerald-400' : currentPoolProxy.latencyMs < 1500 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{currentPoolProxy.latencyMs < 500 ? '✓ Ready' : currentPoolProxy.latencyMs < 1500 ? '~ OK' : '✗ Slow'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Collapsible Proxy List */}
            {poolProxies.length > 0 && (
              <div>
                <button onClick={() => { setShowList(!showList); if (!showList) store.fetchPoolProxies(); }}
                  className="w-full text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white/60 py-1 transition-colors flex items-center justify-center gap-1">
                  {showList ? '▾ Hide' : '▸ Show'} Pool ({poolProxies.length} proxies)
                </button>
                {showList && (
                  <div ref={listRef} className="h-[200px] overflow-auto rounded-lg bg-black/30 border border-white/5">
                    <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                      {virtualizer.getVirtualItems().map((vItem) => {
                        const p = poolProxies[vItem.index];
                        if (!p) return null;
                        return (
                          <div key={vItem.key}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${vItem.size}px`, transform: `translateY(${vItem.start}px)` }}
                            className="flex items-center px-2.5 gap-2 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                            <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded shrink-0 ${
                              p.protocol === 'socks5' ? 'bg-purple-500/20 text-purple-400' :
                              p.protocol === 'socks4' ? 'bg-blue-500/20 text-blue-400' : 'bg-cyan-500/20 text-cyan-400'
                            }`}>{p.protocol}</span>
                            {p.country && <span className="text-[9px] shrink-0">{flag(p.country)}</span>}
                            <span className="text-[10px] font-mono text-white/70 flex-1 truncate">{p.host}:{p.port}</span>
                            <span className={`text-[9px] font-bold shrink-0 ${
                              p.latencyMs < 500 ? 'text-emerald-400' : p.latencyMs < 2000 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{p.latencyMs}ms</span>
                            <div className="w-8 h-1 rounded-full bg-white/10 overflow-hidden shrink-0">
                              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${p.score}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => store.refreshPool()} disabled={isRefreshing}
                className="flex-1 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold hover:bg-cyan-500/30 transition-colors disabled:opacity-50">
                {isRefreshing ? `Scanning ${progressPct}%` : 'Refresh Pool'}
              </button>
              <button onClick={() => store.rotatePoolProxy()}
                className="flex-1 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[11px] font-bold hover:bg-purple-500/30 transition-colors">
                Rotate
              </button>
            </div>

            {/* IP Verification */}
            <div className="space-y-1.5">
              <button onClick={async () => {
                setIpResults(null); setIpVerifying(true);
                try {
                  // @ts-ignore
                  const res = await window.electronAPI?.proxyPool?.verifyIp();
                  if (res?.success) setIpResults(res.results);
                } catch {} finally { setIpVerifying(false); }
              }}
                className="w-full py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[10px] font-bold hover:bg-amber-500/25 transition-colors"
                disabled={ipVerifying}>
                {ipVerifying ? '⏳ Checking 3 services...' : '🔍 Verify IP (3 sources)'}
              </button>
              {ipResults && (
                <div className="rounded-lg bg-black/30 border border-white/5 divide-y divide-white/[0.03]">
                  {ipResults.map((r: any) => (
                    <div key={r.service} className="flex items-center justify-between px-2.5 py-1.5">
                      <span className="text-[9px] font-bold uppercase text-white/40 w-14">{r.service}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex-1 text-center">{r.ip || '—'}</span>
                      <span className="text-[9px] text-white/30 font-bold">{r.latency}ms</span>
                    </div>
                  ))}
                  {ipResults.every((r: any) => r.ip && r.ip === ipResults[0]?.ip) && ipResults[0]?.ip && (
                    <div className="px-2.5 py-1.5 text-center">
                      <span className="text-[9px] font-bold text-emerald-400">✓ All 3 services confirm: proxy active globally</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-center text-[9px] text-white/25 font-bold uppercase tracking-widest">
              {poolStats?.sources || 11} sources • ~/Documents/clabs/proxy/
            </p>
          </div>
        )}

        {/* Tunnel Mode */}
        {mode === 'tunnel' && (
          <div className="p-4 space-y-3">
            {/* Connected Status */}
            {store.tunnelConnected && store.tunnelServer && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">🔒 Tunnel Active</span>
                  <button onClick={() => store.disconnectTunnel()}
                    className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded hover:bg-red-500/20">
                    Disconnect
                  </button>
                </div>
                <div className="text-[11px] font-mono text-white/70">
                  <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded mr-1.5 ${
                    store.tunnelServer.protocol === 'shadowsocks' ? 'bg-orange-500/20 text-orange-400' :
                    store.tunnelServer.protocol === 'vmess' ? 'bg-purple-500/20 text-purple-400' :
                    store.tunnelServer.protocol === 'trojan' ? 'bg-red-500/20 text-red-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>{store.tunnelServer.protocol}</span>
                  {store.tunnelServer.host}:{store.tunnelServer.port}
                </div>
                {store.tunnelServer.country && (
                  <span className="text-[10px] text-white/40 mt-1 block">
                    {flag(store.tunnelServer.country)} {store.tunnelServer.country} • {store.tunnelServer.name}
                  </span>
                )}
              </div>
            )}

            {/* Server List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Servers ({store.tunnelServers.length})
                </p>
                <button onClick={() => store.fetchTunnelServers()}
                  disabled={store.tunnelFetching}
                  className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50">
                  {store.tunnelFetching ? '⏳ Fetching...' : '↻ Refresh'}
                </button>
              </div>

              {store.tunnelServers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-white/30 mb-2">No servers loaded</p>
                  <button onClick={() => store.fetchTunnelServers()}
                    disabled={store.tunnelFetching}
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold hover:bg-cyan-500/30 disabled:opacity-50">
                    {store.tunnelFetching ? 'Fetching...' : 'Fetch Free Servers'}
                  </button>
                </div>
              ) : (
                <div className="h-[220px] overflow-auto rounded-lg bg-black/30 border border-white/5 divide-y divide-white/[0.03]">
                  {store.tunnelServers.slice(0, 100).map((s: any) => (
                    <button key={s.id}
                      onClick={() => store.connectTunnel(s.id)}
                      disabled={store.tunnelConnected && store.tunnelServer?.id === s.id}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-white/[0.04] transition-colors ${
                        store.tunnelConnected && store.tunnelServer?.id === s.id ? 'bg-emerald-500/10' : ''
                      }`}>
                      <span className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded shrink-0 ${
                        s.protocol === 'shadowsocks' ? 'bg-orange-500/20 text-orange-400' :
                        s.protocol === 'vmess' ? 'bg-purple-500/20 text-purple-400' :
                        s.protocol === 'trojan' ? 'bg-red-500/20 text-red-400' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>{s.protocol === 'shadowsocks' ? 'SS' : s.protocol.toUpperCase()}</span>
                      {s.country && <span className="text-[10px] shrink-0">{flag(s.country)}</span>}
                      <span className="text-[10px] font-mono text-white/60 flex-1 truncate">{s.name || `${s.host}:${s.port}`}</span>
                      {store.tunnelConnected && store.tunnelServer?.id === s.id && (
                        <span className="text-[8px] font-bold text-emerald-400">● LIVE</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Log */}
            <p className="text-center text-[9px] text-white/25 font-bold">{store.tunnelLog}</p>
          </div>
        )}

        {/* Off Mode */}
        {mode === 'off' && (
          <div className="p-6 text-center">
            <ShieldAlert size={24} className="text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40 font-medium">Direct connection — no proxy active</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ═══ Ad Blocker Management Panel ═══ */
function AdBlockButton() {
  const [status, setStatus] = React.useState<any>({ enabled: true, totalBlocked: 0, topDomains: [], recentBlocked: [], filterLists: [], sessions: [], blockedPerMinute: '0' });
  const [updating, setUpdating] = React.useState(false);

  const refresh = () => {
    // @ts-ignore
    window.electronAPI?.adblock?.status().then((s: any) => s && setStatus(s)).catch(() => {});
  };

  React.useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => clearInterval(timer);
  }, []);

  const toggle = async () => {
    try {
      // @ts-ignore
      const newEnabled = await window.electronAPI?.adblock?.toggle();
      setStatus((prev: any) => ({ ...prev, enabled: newEnabled }));
    } catch {}
  };

  const updateLists = async () => {
    setUpdating(true);
    try {
      // @ts-ignore
      await window.electronAPI?.adblock?.updateLists();
      refresh();
    } catch {}
    setUpdating(false);
  };

  const fmtCount = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(0)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
  const maxDomainCount = Math.max(1, ...(status.topDomains || []).map((d: any) => d.count));

  const typeColors: Record<string, string> = {
    ads: 'text-red-400 bg-red-500/15',
    tracking: 'text-amber-400 bg-amber-500/15',
    malware: 'text-rose-400 bg-rose-500/15',
  };

  return (
    <Popover>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className="h-full flex items-center gap-1 px-2 hover:bg-white/10 transition-colors group no-drag border-l border-white/5">
                {status.enabled ? (
                  <ShieldCheck size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <ShieldOff size={12} className="text-red-400/60 group-hover:text-red-400 transition-colors" />
                )}
                {status.totalBlocked > 0 && (
                  <span className={`text-[9px] font-bold tabular-nums ${status.enabled ? 'text-emerald-400/70' : 'text-white/30'}`}>
                    {fmtCount(status.totalBlocked)}
                  </span>
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs bg-black/90 text-white border-white/10" sideOffset={8}>
            <p>{status.enabled ? `Ad Blocker: ON — ${status.totalBlocked} blocked` : 'Ad Blocker: OFF'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent side="bottom" align="end" className="w-[360px] bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 p-0 shadow-2xl rounded-xl z-[9999]" sideOffset={8}>
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
              <ShieldCheck size={16} className={status.enabled ? 'text-emerald-400' : 'text-red-400/50'} />
              Ad Blocker
            </div>
            <button onClick={toggle}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 shadow-inner ${
                status.enabled ? 'bg-emerald-500' : 'bg-gray-700/80'
              }`}>
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                status.enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
              }`} />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
              <p className="text-[9px] text-white/40 font-bold">Blocked</p>
              <p className="text-xs font-black text-emerald-400">{fmtCount(status.totalBlocked)}</p>
            </div>
            <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
              <p className="text-[9px] text-white/40 font-bold">Rate</p>
              <p className="text-xs font-black text-cyan-400">{status.blockedPerMinute}/min</p>
            </div>
            <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
              <p className="text-[9px] text-white/40 font-bold">Sessions</p>
              <p className="text-xs font-black text-white">{status.sessions?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Top Blocked Domains */}
        {status.topDomains?.length > 0 && (
          <div className="p-3 border-b border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Top Blocked Domains</p>
            <div className="space-y-1">
              {status.topDomains.slice(0, 8).map((d: any) => (
                <div key={d.domain} className="flex items-center gap-2">
                  <span className="text-[9px] text-white/50 font-mono truncate flex-1">{d.domain}</span>
                  <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden shrink-0">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                      style={{ width: `${(d.count / maxDomainCount) * 100}%` }} />
                  </div>
                  <span className="text-[8px] font-bold text-red-400/70 w-6 text-right shrink-0">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Lists */}
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Filter Lists</p>
            <button onClick={updateLists} disabled={updating}
              className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50">
              {updating ? '⏳ Updating...' : '↻ Update'}
            </button>
          </div>
          <div className="space-y-0.5">
            {(status.filterLists || []).map((fl: any) => (
              <div key={fl.name} className="flex items-center gap-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[10px] text-white/60 flex-1 truncate">{fl.name}</span>
                <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded ${typeColors[fl.type] || 'text-white/40 bg-white/5'}`}>
                  {fl.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Blocked */}
        {status.recentBlocked?.length > 0 && (
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Recent Blocked</p>
            <div className="max-h-24 overflow-auto space-y-0.5">
              {status.recentBlocked.map((r: any, i: number) => (
                <p key={i} className="text-[9px] text-white/30 font-mono truncate" title={r.url}>
                  {r.url}
                </p>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

