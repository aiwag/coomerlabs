// RedGifs v2 - Glassmorphic Header Component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Grid,
  Users,
  Hash,
  Sliders,
  X,
  ChevronDown,
  TrendingUp,
  Clock,
  Star,
} from 'lucide-react';
import { useRedgifsSettings, useRedgifsSearch } from './hooks';
import { sortOptions, viewModes } from './types';

interface HeaderProps {
  onSortChange: (sort: string) => void;
}

export const Header = React.memo<HeaderProps>(({ onSortChange }) => {
  const { viewMode, setViewMode, sortBy, setSortBy } = useRedgifsSettings();
  const { query, setQuery } = useRedgifsSearch();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="liquid-glass-dark border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Grid className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-white">RedGifs</h1>
            <p className="text-[9px] uppercase tracking-widest text-white/40">v2.0</p>
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
              placeholder="Search GIFs, creators, or niches..."
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
                {sortOptions.find((o) => o.value === sortBy)?.label || 'Sort'}
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
                          setSortBy(option.value);
                          onSortChange(option.value);
                          setShowFilters(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          sortBy === option.value
                            ? 'bg-white/20 text-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {option.id === 'trending' && <TrendingUp size={14} />}
                        {option.id === 'latest' && <Clock size={14} />}
                        {option.id === 'top' && <Star size={14} />}
                        {option.id === 'random' && <Hash size={14} />}
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
