import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

const labs = [
  {
    id: "camviewer",
    to: "/camviewer",
    title: "CamViewer",
    description: "Multi-stream monitoring dashboard with real-time HUD and advanced layout controls.",
    icon: <Camera className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-400",
    stats: "2.4k Active",
    status: "Live",
    features: ["Multi-grid", "PIP Mode", "Auto-Refresh"]
  },
  {
    id: "redgifs",
    to: "/redgifs",
    title: "RedGifs Explorer",
    description: "High-speed GIF and short-form video discovery with premium player integration.",
    icon: <Video className="w-6 h-6" />,
    color: "from-pink-500 to-rose-400",
    stats: "HD Only",
    status: "Updated",
    features: ["4K Support", "Instant Looping", "Smart Search"]
  },
  {
    id: "fapello",
    to: "/fapello",
    title: "Fapello Collections",
    description: "Curated content galleries with infinite scroll and advanced creator metadata.",
    icon: <ImageIcon className="w-6 h-6" />,
    color: "from-purple-500 to-indigo-400",
    stats: "15k+ Profiles",
    status: "Premium",
    features: ["Bulk Load", "History", "HQ Images"]
  },
  {
    id: "wallheaven",
    to: "/wallheaven",
    title: "Wallheaven Labs",
    description: "Ultra-high resolution wallpaper explorer powered by masonry layout engine.",
    icon: <ImageIcon className="w-6 h-6" />,
    color: "from-green-500 to-emerald-400",
    stats: "8K Ready",
    status: "Stable",
    features: ["Tag Filter", "Quick Preview", "Direct Save"]
  },
  {
    id: "coomer-kemono",
    to: "/coomerKemono",
    title: "Creator Archive",
    description: "Unified access to creator archives with simplified navigation and search.",
    icon: <Users className="w-6 h-6" />,
    color: "from-orange-500 to-yellow-400",
    stats: "2M+ Items",
    status: "Online",
    features: ["Cross-Platform", "Meta Data", "Quick Links"]
  },
  {
    id: "javtube",
    to: "/javtube",
    title: "JavTube v2",
    description: "The ultimate specialized streaming experience with dynamic URL extraction.",
    icon: <Play className="w-6 h-6" />,
    color: "from-red-600 to-orange-600",
    stats: "New API",
    status: "Alpha",
    features: ["Auto-Extract", "Premium Player", "Waterfall"]
  },
  {
    id: "actresses",
    to: "/actresses",
    title: "Star Database",
    description: "Comprehensive performer directory with deep metadata and content mapping.",
    icon: <Users className="w-6 h-6" />,
    color: "from-amber-600 to-orange-500",
    stats: "Data Node",
    status: "Alpha",
    features: ["Deep Bio", "Scan Sync", "Relations"]
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
  return (
    <div className="bg-transparent text-white pb-12">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
              <span className="text-[10px] uppercase tracking-widest font-black text-cyan-400">Next-Gen Interface Experience</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-none">
              COOMER<span className="text-cyan-400">LABS</span>
            </h1>

            <p className="text-base md:text-lg text-white/50 max-w-2xl font-medium leading-relaxed mb-6">
              A premium, high-performance ecosystem for specialized content discovery and monitoring.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button className="px-6 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5">
                Explore Dashboard
              </button>
              <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md">
                View Changelog
              </button>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-cyan-500/10 blur-[120px] rounded-full -z-10 pointer-events-none opacity-50" />
      </section>

      {/* Stats Quick View */}
      <section className="px-6 mb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Active Nodes",
              value: "128",
              icon: <Shield className="w-4 h-4" />,
            },
            {
              label: "Daily Queries",
              value: "1.2M",
              icon: <TrendingUp className="w-4 h-4" />,
            },
            {
              label: "Uptime",
              value: "99.9%",
              icon: <Clock className="w-4 h-4" />,
            },
            {
              label: "Pro Users",
              value: "15k+",
              icon: <Star className="w-4 h-4" />,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              className="glass-card p-4 rounded-2xl border border-white/5 text-center group transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                {stat.icon}
              </div>
              <div className="text-2xl font-black mb-1">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Apps Grid */}
      <section className="px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black tracking-tight">Available Labs</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent mx-8" />
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {labs.map((lab) => (
              <motion.div key={lab.id} variants={itemVariants}>
                <Link
                  to={lab.to}
                  className="group block relative h-full glass-card rounded-[24px] border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-500 shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 -z-10" />

                  <div className="p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${lab.color} flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500`}>
                        {lab.icon}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{lab.status}</span>
                        <span className="text-[10px] font-medium text-white/40">{lab.stats}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-black mb-2 group-hover:translate-x-1 transition-transform">{lab.title}</h3>
                      <p className="text-white/50 text-xs font-medium leading-relaxed mb-4">
                        {lab.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {lab.features.map(f => (
                        <span key={f} className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className="text-white/40 group-hover:text-white transition-colors">Launch Module</span>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="mt-12 border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-black">CL</div>
            <div>
              <div className="font-black tracking-tight text-white uppercase text-sm">CoomerLabs Ecosystem</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Build v2.4.0 • Enterprise Edition</div>
            </div>
          </div>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-white/40">
            <a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terminal</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Support</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
