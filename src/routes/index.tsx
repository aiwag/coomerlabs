import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Video,
  Image as ImageIcon,
  Users,
  Play,
  Zap,
  Shield,
  Star,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Activity,
  Cpu,
  Gauge,
  Sparkles,
  Rocket,
  Terminal,
  Code,
  Layers,
  Grid3X3,
  Eye,
  Heart,
  Download,
  BarChart3,
  Settings,
  Globe,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const labs = [
  {
    id: "camviewer",
    to: "/camviewer",
    title: "CamViewer",
    description: "Multi-stream monitoring with real-time HUD and advanced layout controls.",
    icon: <Camera className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-400",
    stats: "2.4k Active",
    status: "Live",
    features: ["Multi-grid", "PIP Mode", "Auto-Refresh"],
    performance: "70% CPU Reduced",
    glow: "glow-cyan"
  },
  {
    id: "camarchive",
    to: "/camarchive",
    title: "Cam Archive",
    description: "Viewed cam history with video archives from Chaturbate and more.",
    icon: <Clock className="w-6 h-6" />,
    color: "from-violet-500 to-purple-400",
    stats: "Auto-Saved",
    status: "History",
    features: ["Auto-Track", "Video Previews", "Quick Access"],
    performance: "Instant",
    glow: "glow-violet"
  },
  {
    id: "redgifs",
    to: "/redgifs",
    title: "RedGifs Explorer",
    description: "High-speed GIF discovery with premium player and 4K support.",
    icon: <Video className="w-6 h-6" />,
    color: "from-pink-500 to-rose-400",
    stats: "HD Only",
    status: "Updated",
    features: ["4K Support", "Instant Looping", "Smart Search"],
    performance: "60% Faster",
    glow: "glow-pink"
  },
  {
    id: "fapello",
    to: "/fapello",
    title: "Fapello Collections",
    description: "Curated galleries with infinite scroll and advanced metadata.",
    icon: <ImageIcon className="w-6 h-6" />,
    color: "from-purple-500 to-indigo-400",
    stats: "15k+ Profiles",
    status: "Premium",
    features: ["Bulk Load", "History", "HQ Images"],
    performance: "Optimized",
    glow: "glow-purple"
  },
  {
    id: "wallheaven",
    to: "/wallheaven",
    title: "Wallheaven Labs",
    description: "Ultra-high resolution explorer powered by masonry layout engine.",
    icon: <ImageIcon className="w-6 h-6" />,
    color: "from-green-500 to-emerald-400",
    stats: "8K Ready",
    status: "Stable",
    features: ["Tag Filter", "Quick Preview", "Direct Save"],
    performance: "Lightning Fast",
    glow: ""
  },
  {
    id: "coomer-kemono",
    to: "/coomerKemono",
    title: "Creator Archive",
    description: "Unified access to creator archives with simplified navigation.",
    icon: <Users className="w-6 h-6" />,
    color: "from-orange-500 to-yellow-400",
    stats: "2M+ Items",
    status: "Online",
    features: ["Cross-Platform", "Meta Data", "Quick Links"],
    performance: "Efficient",
    glow: ""
  },
  {
    id: "javtube",
    to: "/javtube",
    title: "JavTube v2",
    description: "Ultimate streaming experience with dynamic URL extraction.",
    icon: <Play className="w-6 h-6" />,
    color: "from-red-600 to-orange-600",
    stats: "New API",
    status: "Alpha",
    features: ["Auto-Extract", "Premium Player", "Waterfall"],
    performance: "Next-Gen",
    glow: ""
  },
  {
    id: "actresses",
    to: "/actresses",
    title: "Star Database",
    description: "Comprehensive performer directory with deep metadata mapping.",
    icon: <Users className="w-6 h-6" />,
    color: "from-amber-600 to-orange-500",
    stats: "Data Node",
    status: "Alpha",
    features: ["Deep Bio", "Scan Sync", "Relations"],
    performance: "Advanced",
    glow: ""
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    } as const
  }
};

export function IndexPage() {
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%25ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

      <AnimatePresence>
        {isLoading ? (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Labs Grid */}
      <section className="px-6 pb-16 pt-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {labs.map((lab, index) => (
              <motion.div
                key={lab.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                onHoverStart={() => setSelectedLab(lab.id)}
                onHoverEnd={() => setSelectedLab(null)}
                className="relative group"
              >
                <Link
                  to={lab.to}
                  className="block h-full"
                >
                  <div className="relative h-full flex flex-col p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-2xl shadow-black/50 group">

                    {/* Top Row: Icon & Status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${lab.color} text-white shadow-lg`}>
                        {lab.icon}
                      </div>
                      {lab.status === 'Live' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Live</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Text */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-cyan-400 transition-colors">
                        {lab.title}
                      </h3>
                      <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
                        {lab.description}
                      </p>
                    </div>

                    {/* Bottom: Stats & Action */}
                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">Status</span>
                        <span className="text-xs font-medium text-white/70">{lab.stats}</span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                        <ArrowRight size={14} />
                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
