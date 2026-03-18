import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Camera,
  Video,
  Image as ImageIcon,
  Users,
  Play,
  Clock,
  ArrowRight,
  Film,
  Shield,
  ShieldOff,
  Layers,
  Zap,
  Globe,
  Wifi,
} from "lucide-react";
import { useProxyStore } from "@/state/proxyStore";

const labs = [
  {
    id: "camviewer",
    to: "/camviewer",
    title: "CamViewer",
    desc: "Multi-stream 4K grid engine",
    icon: Camera,
    gradient: "from-blue-600 to-cyan-500",
    glow: "group-hover:shadow-cyan-500/20",
  },
  {
    id: "camarchive",
    to: "/camarchive",
    title: "Archive",
    desc: "Time-aware stream history",
    icon: Clock,
    gradient: "from-violet-600 to-purple-500",
    glow: "group-hover:shadow-purple-500/20",
  },
  {
    id: "recordings",
    to: "/recordings",
    title: "Recordings",
    desc: "Recorded stream clips",
    icon: Film,
    gradient: "from-red-600 to-pink-500",
    glow: "group-hover:shadow-red-500/20",
  },
  {
    id: "redgifs",
    to: "/redgifs",
    title: "Discovery",
    desc: "Premium GIF explorer",
    icon: Video,
    gradient: "from-pink-600 to-rose-500",
    glow: "group-hover:shadow-rose-500/20",
  },
  {
    id: "fapello",
    to: "/fapello",
    title: "Galleries",
    desc: "Infinite masonry collection",
    icon: ImageIcon,
    gradient: "from-indigo-600 to-blue-500",
    glow: "group-hover:shadow-blue-500/20",
  },
  {
    id: "wallheaven",
    to: "/wallheaven",
    title: "Wallheaven",
    desc: "Ultra-HD wallpaper explorer",
    icon: ImageIcon,
    gradient: "from-teal-600 to-emerald-500",
    glow: "group-hover:shadow-emerald-500/20",
  },
  {
    id: "coomer-kemono",
    to: "/coomerKemono",
    title: "Creator Labs",
    desc: "Global content aggregation",
    icon: Users,
    gradient: "from-orange-600 to-yellow-500",
    glow: "group-hover:shadow-orange-500/20",
  },
  {
    id: "javtube",
    to: "/javtube",
    title: "JavTube",
    desc: "Dynamic extraction engine",
    icon: Play,
    gradient: "from-red-600 to-orange-500",
    glow: "group-hover:shadow-red-500/20",
  },
  {
    id: "nsfwalbum",
    to: "/nsfwalbum",
    title: "NSFWAlbum",
    desc: "Premium galleries",
    icon: ImageIcon,
    gradient: "from-fuchsia-600 to-rose-500",
    glow: "group-hover:shadow-fuchsia-500/20",
  },
  {
    id: "bunkr",
    to: "/bunkr",
    title: "Bunkr",
    desc: "Album file explorer",
    icon: Layers,
    gradient: "from-violet-600 to-purple-500",
    glow: "group-hover:shadow-violet-500/20",
  },
];

const MODE_CONFIG: Record<string, { label: string; color: string; icon: any; accent: string }> = {
  off:    { label: 'Direct',  color: 'text-white/50',   icon: Globe,    accent: 'bg-white/5 border-white/10' },
  manual: { label: 'Manual',  color: 'text-blue-400',   icon: Shield,   accent: 'bg-blue-500/5 border-blue-500/20' },
  pool:   { label: 'Pool',    color: 'text-cyan-400',   icon: Layers,   accent: 'bg-cyan-500/5 border-cyan-500/20' },
  tunnel: { label: 'Tunnel',  color: 'text-purple-400', icon: Zap,      accent: 'bg-purple-500/5 border-purple-500/20' },
};

function flag(cc?: string) {
  if (!cc || cc.length !== 2) return '';
  return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1A5 + c.charCodeAt(0)));
}

export function IndexPage() {
  const [ipData, setIpData] = useState<any[] | null>(null);
  const [bw, setBw] = useState<any>(null);
  const { mode, config, currentPoolProxy, poolStats, tunnelConnected, tunnelServer } = useProxyStore();
  const mc = MODE_CONFIG[mode] || MODE_CONFIG.off;
  const ModeIcon = mc.icon;

  useEffect(() => {
    (async () => {
      try {
        // @ts-ignore
        const res = await window.electronAPI?.proxyPool?.verifyIp();
        if (res?.success) setIpData(res.results);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    try {
      // @ts-ignore
      const unsub = window.electronAPI?.bandwidth?.onStats((s: any) => setBw(s));
      return () => { if (typeof unsub === 'function') unsub(); };
    } catch { return () => {}; }
  }, []);

  const fmtB = (b: number) => {
    if (!b || b < 0) return '0';
    if (b < 1024) return `${b}B`;
    if (b < 1048576) return `${(b / 1024).toFixed(0)}K`;
    if (b < 1073741824) return `${(b / 1048576).toFixed(1)}M`;
    return `${(b / 1073741824).toFixed(1)}G`;
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-white overflow-y-auto">
      <div className="w-full px-8 md:px-12 lg:px-16 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-start justify-between gap-6 flex-wrap"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
              CoomerLabs{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                v3
              </span>
            </h1>
            <p className="text-sm text-white/30 font-medium tracking-tight">
              The ultra-fast unified media aggregation layer.
            </p>
          </div>

          {/* ─── Network Status Card ─── */}
          <div className={`shrink-0 rounded-xl border ${mc.accent} p-3 max-w-md`}>
            {/* Mode badge + IP */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${mc.accent} ${mc.color}`}>
                <ModeIcon size={11} />
                <span className="text-[9px] font-black uppercase tracking-wider">{mc.label}</span>
              </div>

              {/* Mode-specific info */}
              {mode === 'manual' && config.host && (
                <span className="text-[10px] font-mono text-blue-400/80">
                  {config.protocol}://{config.host}:{config.port}
                </span>
              )}
              {mode === 'pool' && currentPoolProxy && (
                <span className="text-[10px] font-mono text-cyan-400/80">
                  {flag(currentPoolProxy.country)} {currentPoolProxy.host}:{currentPoolProxy.port}
                  <span className="text-white/20 ml-1">{currentPoolProxy.latencyMs}ms</span>
                </span>
              )}
              {mode === 'pool' && poolStats && (
                <span className="text-[9px] text-white/20">{poolStats.poolSize} proxies</span>
              )}
              {mode === 'tunnel' && tunnelConnected && tunnelServer && (
                <span className="text-[10px] font-mono text-purple-400/80">
                  {flag(tunnelServer.country)} {tunnelServer.protocol}
                  <span className="text-white/20 ml-1">{tunnelServer.address?.split(':')[0]}</span>
                </span>
              )}
              {mode === 'tunnel' && !tunnelConnected && (
                <span className="text-[9px] text-white/25">Disconnected</span>
              )}
              {mode === 'off' && (
                <span className="text-[9px] text-white/25">No proxy</span>
              )}
            </div>

            {/* IP verification row */}
            {ipData && (
              <div className="flex items-center gap-2.5 flex-wrap">
                {ipData.map((r: any) => (
                  <div key={r.service} className="flex items-center gap-1">
                    <span className="text-[8px] font-bold uppercase text-white/20">{r.service}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{r.ip || '—'}</span>
                    <span className="text-[8px] text-white/15">{r.latency}ms</span>
                  </div>
                ))}
                {ipData.every((r: any) => r.ip && r.ip === ipData[0]?.ip) && ipData[0]?.ip && (
                  <span className="text-[8px] font-bold text-emerald-400/60">✓ Consistent</span>
                )}
              </div>
            )}

            {/* Bandwidth row */}
            {bw && (
              <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-white/40">
                <Wifi size={9} className="text-white/20" />
                <span className="text-emerald-400">↓{fmtB(bw.downloadSpeed)}/s</span>
                <span className="text-cyan-400">↑{fmtB(bw.uploadSpeed)}/s</span>
                <span className="text-white/15">│</span>
                <span title="Session total">📊 {fmtB(bw.sessionDown)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* App grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {labs.map((lab, i) => {
            const Icon = lab.icon;
            return (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
              >
                <Link
                  to={lab.to}
                  className={`group block relative h-full rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-2xl ${lab.glow} hover:-translate-y-0.5`}
                >
                  <div
                    className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${lab.gradient} shadow-lg mb-5`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold tracking-tight mb-1 text-white/90 group-hover:text-white transition-colors">
                    {lab.title}
                  </h3>
                  <p className="text-xs text-white/30 leading-relaxed">
                    {lab.desc}
                  </p>
                  <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center text-white/20 group-hover:bg-white/10 group-hover:text-white/60 transition-all duration-300">
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")(
  { component: IndexPage },
);
