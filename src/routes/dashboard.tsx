import { createFileRoute, Link } from '@tanstack/react-router';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Video,
  Image as ImageIcon,
  Users,
  Play,
  Zap,
  Activity,
  TrendingUp,
  Clock,
  Star,
  ArrowUpRight,
  Eye,
  Heart,
  Film,
  Shield,
  Cpu,
  HardDrive,
  Wifi,
} from 'lucide-react';

interface SystemStats {
  cpu: number;
  memory: number;
  network: 'online' | 'offline';
  uptime: string;
}

interface QuickStats {
  totalStreams: number;
  activeViewers: number;
  favorites: number;
  recentAdds: number;
}

const apps = [
  {
    id: 'camviewer',
    to: '/camviewer',
    title: 'CamViewer',
    description: 'Multi-stream monitoring dashboard',
    icon: <Camera className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-400',
    stats: { label: 'Active', value: '2.4k' },
  },
  {
    id: 'redgifs',
    to: '/redgifs',
    title: 'RedGifs',
    description: 'Premium GIF and video explorer',
    icon: <Video className="w-6 h-6" />,
    color: 'from-pink-500 to-rose-400',
    stats: { label: 'Quality', value: '4K' },
  },
  {
    id: 'fapello',
    to: '/fapello',
    title: 'Fapello',
    description: 'Curated content galleries',
    icon: <ImageIcon className="w-6 h-6" />,
    color: 'from-purple-500 to-indigo-400',
    stats: { label: 'Profiles', value: '15k+' },
  },
  {
    id: 'wallheaven',
    to: '/wallheaven',
    title: 'Wallheaven',
    description: 'Ultra-HD wallpaper explorer',
    icon: <ImageIcon className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-400',
    stats: { label: 'Resolution', value: '8K' },
  },
  {
    id: 'coomerKemono',
    to: '/coomerKemono',
    title: 'Creator Archive',
    description: 'Unified creator content archive',
    icon: <Users className="w-6 h-6" />,
    color: 'from-orange-500 to-yellow-400',
    stats: { label: 'Items', value: '2M+' },
  },
  {
    id: 'javtube',
    to: '/javtube',
    title: 'JavTube',
    description: 'Specialized streaming experience',
    icon: <Play className="w-6 h-6" />,
    color: 'from-red-600 to-orange-600',
    stats: { label: 'Videos', value: '50k+' },
  },
];

function RouteComponent() {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpu: 12,
    memory: 45,
    network: 'online',
    uptime: '99.9%',
  });

  const [quickStats] = useState<QuickStats>({
    totalStreams: 128,
    activeViewers: 12450,
    favorites: 867,
    recentAdds: 23,
  });

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats((prev) => ({
        ...prev,
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 5)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <div className="min-h-screen bg-black/10 text-white overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="glass-header border-b border-white/5 px-8 py-6 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Command Center</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                System Dashboard • Build v2.4.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className={`w-2 h-2 rounded-full ${systemStats.network === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-bold">{systemStats.network.toUpperCase()}</span>
            </div>
            <Link to="/" className="liquid-button px-4 py-2 flex items-center gap-2 text-sm font-bold">
              <ArrowUpRight size={16} />
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Quick Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            {
              label: 'Total Streams',
              value: quickStats.totalStreams,
              icon: <Camera className="w-4 h-4" />,
              color: 'text-cyan-400',
            },
            {
              label: 'Active Viewers',
              value: quickStats.activeViewers.toLocaleString(),
              icon: <Eye className="w-4 h-4" />,
              color: 'text-purple-400',
            },
            {
              label: 'Favorites',
              value: quickStats.favorites,
              icon: <Heart className="w-4 h-4" />,
              color: 'text-red-400',
            },
            {
              label: 'Recent Adds',
              value: `+${quickStats.recentAdds}`,
              icon: <TrendingUp className="w-4 h-4" />,
              color: 'text-green-400',
            },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest text-white/40`}>
                  {stat.label}
                </div>
              </div>
              <div className="text-3xl font-black">{stat.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* System Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            {
              label: 'CPU Usage',
              value: `${systemStats.cpu.toFixed(0)}%`,
              icon: <Cpu className="w-4 h-4" />,
              progress: systemStats.cpu,
            },
            {
              label: 'Memory',
              value: `${systemStats.memory.toFixed(0)}%`,
              icon: <HardDrive className="w-4 h-4" />,
              progress: systemStats.memory,
            },
            {
              label: 'Network',
              value: systemStats.network === 'online' ? 'Connected' : 'Offline',
              icon: <Wifi className="w-4 h-4" />,
              status: systemStats.network,
            },
            {
              label: 'Uptime',
              value: systemStats.uptime,
              icon: <Clock className="w-4 h-4" />,
            },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {stat.icon}
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/30">
                  {stat.label}
                </div>
              </div>
              <div className="text-xl font-black mb-2">{stat.value}</div>
              {'progress' in stat && (
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              )}
              {'status' in stat && (
                <div className={`text-[9px] font-bold uppercase ${stat.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.status === 'online' ? 'All Systems Operational' : 'Connection Lost'}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Apps Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black tracking-tight">Active Modules</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Live</span>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {apps.map((app) => (
              <motion.div key={app.id} variants={itemVariants}>
                <Link
                  to={app.to}
                  className="group block relative h-full glass-card overflow-hidden hover:border-white/20 transition-all duration-500"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        {app.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                          {app.stats.label}
                        </div>
                        <div className="text-lg font-black">{app.stats.value}</div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-black mb-2 group-hover:translate-x-1 transition-transform">
                      {app.title}
                    </h3>
                    <p className="text-white/50 text-sm font-medium leading-relaxed">
                      {app.description}
                    </p>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                      <span className="text-white/40 group-hover:text-white transition-colors">Launch</span>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                        <ArrowUpRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Activity Feed */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black tracking-tight">Recent Activity</h2>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="space-y-3">
            {[
              { action: 'Added 3 streams to CamViewer', time: '2m ago', icon: <Camera size={14} /> },
              { action: 'Saved 5 wallpapers from Wallheaven', time: '5m ago', icon: <ImageIcon size={14} /> },
              { action: 'Favorited creator in CoomerKemono', time: '8m ago', icon: <Users size={14} /> },
              { action: 'Watched video on JavTube', time: '12m ago', icon: <Play size={14} /> },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-white/80">{activity.action}</div>
                </div>
                <div className="text-[10px] font-bold text-white/30">{activity.time}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
});
