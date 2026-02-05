import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Eye,
  Star,
  Activity,
  Sparkles,
  Users,
  Home,
  Search,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

const NavItem = ({ to, icon: Icon, label, color }: { to: string; icon: any; label: string; color: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="relative group">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${isActive
          ? `bg-${color}-500/20 border-border-${color}-500/50 shadow-lg shadow-${color}-500/10`
          : "bg-white/5 border-white/5 hover:bg-white/10"
          } border`}
      >
        <Icon
          size={18}
          className={`transition-colors duration-300 ${isActive ? `text-${color}-400` : "text-white/40 group-hover:text-white"
            }`}
        />

        {/* Tooltip */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>

        {isActive && (
          <motion.div
            layoutId="activeTab"
            className={`absolute -bottom-1 left-2 right-2 h-0.5 bg-${color}-500 rounded-full shadow-[0_0_10px_rgba(var(--${color}-500),0.5)]`}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
};

export const JavTube = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({
        to: "/javtube/search/$query",
        params: { query: searchQuery.trim() }
      });
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#050505] text-white">
      <div className="flex-none flex items-center justify-between px-6 py-4 z-50">
        <div className="flex items-center gap-3">
          <Link to="/javtube" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-xl shadow-purple-500/10 hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black tracking-tighter uppercase italic leading-none">JavTube</h1>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Engine v2</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.nav
                key="nav"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/5 shadow-2xl"
              >
                <NavItem to="/javtube" icon={Home} label="Home" color="purple" />
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <NavItem to="/javtube/top-favorites" icon={Heart} label="Favorites" color="red" />
                <NavItem to="/javtube/uncensored" icon={Sparkles} label="Uncensored" color="blue" />
                <NavItem to="/javtube/most-viewed" icon={Eye} label="Most Viewed" color="green" />
                <NavItem to="/javtube/top-rated" icon={Star} label="Top Rated" color="yellow" />
                <NavItem to="/javtube/being-watched" icon={Activity} label="Live" color="pink" />
                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                <NavItem to="/actresses" icon={Users} label="Stars" color="indigo" />
              </motion.nav>
            ) : (
              <motion.form
                key="search"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onSubmit={handleSearch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/40 backdrop-blur-3xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 min-w-[400px]"
              >
                <Search size={16} className="text-purple-400 ml-1" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search ultra-high speed media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-[10px] font-black uppercase text-white/20 hover:text-white px-2 py-1"
                >
                  ESC
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2.5 rounded-xl border transition-all ${isSearchOpen ? "bg-purple-500/20 border-purple-500/50 text-purple-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
              }`}
          >
            <Search size={18} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/javtube")({
  component: JavTube,
});
