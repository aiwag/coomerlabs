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

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >


            <motion.h1
              className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent leading-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              COOMER<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">LABS</span>
            </motion.h1>


          </motion.div>
        </div>
      </section>



      {/* Labs Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Available Labs</h2>
              <p className="text-white/40 text-sm">Click to explore our optimized platform modules</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/60 font-medium">All Systems Operational</span>
            </div>
          </motion.div>

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
                  <div className={`absolute inset-0 bg-gradient-to-br ${lab.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-all duration-500 blur-xl`} />

                  <div className={`relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full hover:border-white/20 transition-all duration-500 overflow-hidden ${lab.glow && 'group-hover:' + lab.glow}`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22/%3E%3C/g%3E%3C/svg%3E')]" />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <div className={`px-2 py-1 rounded-full text-xs font-black uppercase tracking-wider ${lab.status === 'Live' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        lab.status === 'Updated' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          lab.status === 'Stable' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            lab.status === 'Premium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              lab.status === 'Online' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                                'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {lab.status === 'Live' && <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 inline-block animate-pulse" />}
                        {lab.status}
                      </div>
                    </div>

                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${lab.color} flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6`}>
                          {lab.icon}
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-white/60">{lab.stats}</div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-6">
                        <h3 className="text-xl font-black mb-2 text-white group-hover:text-cyan-400 transition-colors">
                          {lab.title}
                        </h3>
                        <p className="text-white/40 text-sm font-medium leading-relaxed">
                          {lab.description}
                        </p>
                      </div>

                      {/* Performance Badge */}
                      {lab.performance && (
                        <div className="mb-4">
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                            <BarChart3 className="w-3 h-3 text-green-400" />
                            <span className="text-xs font-bold text-green-400">{lab.performance}</span>
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {lab.features.map(f => (
                          <span key={f} className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors text-white/60">
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                        <span className="text-white/40 group-hover:text-cyan-400 transition-colors">Launch Module</span>
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-500 group-hover:border-transparent transition-all">
                          <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative border-t border-white/10 py-12 px-6 bg-gradient-to-t from-slate-950/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8"
          >
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                  CL
                </div>
                <div>
                  <div className="font-black text-xl text-white">CoomerLabs</div>
                  <div className="text-xs text-white/40 uppercase tracking-widest">Performance-First Media Platform</div>
                </div>
              </div>
              <p className="text-sm text-white/40 leading-relaxed max-w-md">
                Next-generation media management ecosystem built with cutting-edge performance optimizations and modern web technologies.
              </p>
            </div>

            <div>
              <h4 className="font-black text-white text-sm uppercase tracking-wider mb-4">Platform</h4>
              <div className="space-y-2">
                {['Dashboard', 'Analytics', 'Performance', 'Security'].map(item => (
                  <a key={item} href="#" className="block text-xs text-white/40 hover:text-cyan-400 transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-black text-white text-sm uppercase tracking-wider mb-4">Resources</h4>
              <div className="space-y-2">
                {['Documentation', 'API Reference', 'GitHub', 'Support'].map(item => (
                  <a key={item} href="#" className="block text-xs text-white/40 hover:text-cyan-400 transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="text-xs text-white/40">
                © 2025 CoomerLabs. Built with ❤️ and performance obsession.
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/60 font-medium">All Systems Operational</span>
              </div>
              <div className="flex gap-4">
                <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
                  <Terminal className="w-4 h-4" />
                </a>
                <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
                <a href="#" className="text-white/40 hover:text-cyan-400 transition-colors">
                  <Shield className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
