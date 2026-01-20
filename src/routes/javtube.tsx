import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Heart,
  Eye,
  Star,
  Activity,
  Sparkles,
  Users,
} from "lucide-react";
import { JavTubeView } from "../components/JavTubeView";

export const JavTube = () => {
  return (
    <div className="flex h-screen flex-col bg-[#050505] text-white">
      <div className="flex-none flex items-center justify-between border-b border-white/5 bg-black/40 px-8 py-4 backdrop-blur-3xl z-40">
        <div className="flex items-center gap-6">
          <Link to="/javtube" className="text-sm font-black uppercase tracking-widest text-white hover:text-purple-400 transition-colors">
            Home
          </Link>
          <div className="h-4 w-[1px] bg-white/10" />
          <Link to="/javtube/top-favorites" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/60 hover:text-red-400 transition-colors">
            <Heart size={14} />
            <span>Top Favorites</span>
          </Link>
          <Link to="/javtube/uncensored" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/60 hover:text-blue-400 transition-colors">
            <Sparkles size={14} />
            <span>Uncensored</span>
          </Link>
          <Link to="/javtube/most-viewed" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/60 hover:text-green-400 transition-colors">
            <Eye size={14} />
            <span>Most Viewed</span>
          </Link>
          <Link to="/javtube/top-rated" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/60 hover:text-purple-400 transition-colors">
            <Star size={14} />
            <span>Top Rated</span>
          </Link>
          <Link to="/javtube/being-watched" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/60 hover:text-pink-400 transition-colors">
            <Activity size={14} />
            <span>Being Watched</span>
          </Link>
        </div>

        <Link
          to="/actresses"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-red-500/30 transition-all"
        >
          <Users size={14} />
          <span className="text-xs font-black uppercase tracking-widest">Stars</span>
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/javtube")({
  component: JavTube,
});
