// Wallheaven - Glassmorphic Header Component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, Sliders, X, ChevronDown, TrendingUp, Clock, Shuffle } from 'lucide-react';
import { useWallheavenSettings, useWallheavenSearch } from './hooks';
import { sortOptions, viewModes } from './types';

interface HeaderProps {
  onRefresh: () => void;
}

export const Header = React.memo<HeaderProps>(({ onRefresh }) => {
  const { viewMode, setViewMode } = useWallheavenSettings();
  const { query, sorting, setQuery, setSorting } = useWallheavenSearch();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="liquid-glass-dark border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Grid className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-white">Wallheaven</h1>
            <p className="text-[9px] uppercase tracking-widest text-white/40">8K Wallpapers</p>
          </div>
        </motion.div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search wallpapers..."
              className="liquid-input w-full pl-10 pr-10 py-2 text-sm text-white placeholder-white/40"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center gap-1 liquid-button px-2 py-1 rounded-xl">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  viewMode.id === mode.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {mode.label[0]}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 liquid-button px-3 py-2 text-sm"
            >
              <Sliders size={14} />
              <span className="hidden sm:inline text-white/80">
                {sortOptions.find((o) => o.id === sorting)?.label || 'Sort'}
              </span>
              <ChevronDown size={12} className="text-white/60" />
            </motion.button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-48 liquid-glass-dark rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSorting(option.id);
                          setShowFilters(false);
                          onRefresh();
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          sorting === option.id
                            ? 'bg-white/20 text-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {option.id === 'toplist' && <TrendingUp size={14} />}
                        {option.id === 'hot' && <Flame size={14} />}
                        {option.id === 'latest' && <Clock size={14} />}
                        {option.id === 'random' && <Shuffle size={14} />}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

Header.displayName = 'Header';

const Flame = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
