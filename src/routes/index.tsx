import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Video,
  Image as ImageIcon,
  Users,
  Play,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const labs = [
  {
    id: "camviewer",
    to: "/camviewer",
    title: "CamViewer",
    description: "Multi-stream 4K grid engine.",
    icon: <Camera className="w-5 h-5" />,
    color: "from-blue-600/20 to-cyan-500/20",
    accent: "bg-cyan-500",
    stats: "2.4k Real-time",
  },
  {
    id: "camarchive",
    to: "/camarchive",
    title: "Archive",
    description: "Time-aware stream history.",
    icon: <Clock className="w-5 h-5" />,
    color: "from-violet-600/20 to-purple-500/20",
    accent: "bg-purple-500",
    stats: "Auto-Scraped",
  },
  {
    id: "redgifs",
    to: "/redgifs",
    title: "Discovery",
    description: "Premium GIF explorer interface.",
    icon: <Video className="w-5 h-5" />,
    color: "from-pink-600/20 to-rose-500/20",
    accent: "bg-rose-500",
    stats: "4K Rendering",
  },
  {
    id: "fapello",
    to: "/fapello",
    title: "Galleries",
    description: "Infinite masonry collection.",
    icon: <ImageIcon className="w-5 h-5" />,
    color: "from-indigo-600/20 to-blue-500/20",
    accent: "bg-blue-500",
    stats: "15k Profiles",
  },
  {
    id: "coomer-kemono",
    to: "/coomerKemono",
    title: "Creator Labs",
    description: "Global content aggregation layer.",
    icon: <Users className="w-5 h-5" />,
    color: "from-orange-600/20 to-yellow-500/20",
    accent: "bg-orange-500",
    stats: "Deep Metadata",
  },
  {
    id: "javtube",
    to: "/javtube",
    title: "JavTube X",
    description: "Dynamic extraction node.",
    icon: <Play className="w-5 h-5" />,
    color: "from-red-600/20 to-orange-500/20",
    accent: "bg-red-500",
    stats: "API v2 Ready",
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 120, damping: 14 } as const
  }
};

export function IndexPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
      </div>

      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050508]"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-cyan-500"
            >
              <Sparkles className="w-12 h-12" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-32">
        {/* Minimal Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-4 leading-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            CoomerLabs <span className="text-white">v3</span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto font-medium tracking-tight">
            The ultra-fast media aggregation layer for efficiency-driven users.
          </p>
        </motion.div>

        {/* Compact Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {labs.map((lab) => (
            <motion.div
              key={lab.id}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative group"
            >
              <Link to={lab.to} className="block group">
                <div className="relative h-full overflow-hidden rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-5 transition-all duration-500 group-hover:bg-white/[0.08] group-hover:border-white/20">
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="flex items-start justify-between relative z-10">
                    <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${lab.color} border border-white/5 text-white/90 shadow-2xl`}>
                      {lab.icon}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Status</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${lab.accent} shadow-[0_0_8px_${lab.accent}] animate-pulse`} />
                        <span className="text-[10px] font-semibold text-white/60">{lab.stats}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 relative z-10">
                    <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors duration-300">
                      {lab.title}
                    </h3>
                    <p className="text-[12px] text-white/40 mt-1.5 leading-relaxed font-medium">
                      {lab.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/20 group-hover:text-white/40 transition-colors">Access Lab</span>
                    <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/40 group-hover:bg-cyan-500 group-hover:text-[#050508] transition-all duration-300 transform group-hover:translate-x-1">
                      <ArrowRight size={14} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <footer className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/10">
          Advanced Agentic Coding &bull; CoomerLabs v3.2.0
        </p>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
