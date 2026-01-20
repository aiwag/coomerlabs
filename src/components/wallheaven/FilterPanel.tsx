// Wallheaven - Glassmorphic FilterPanel Component
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, ChevronDown, X } from 'lucide-react';
import { useWallheavenSearch, useWallheavenSettings } from './hooks';
import { sortOptions } from './types';

interface FilterPanelProps {
  onRefresh: () => void;
}

export const FilterPanel = React.memo<FilterPanelProps>(({ onRefresh }) => {
  const { query, sorting, categories, setQuery, setSorting, setCategories } = useWallheavenSearch();
  const { purity, setPurity } = useWallheavenSettings();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const togglePurity = (p: string) => {
    // Purity is stored as a string array like ['100'], ['010'], ['110'] (sfw, sketchy, nsfw)
    const purityMap: Record<string, number> = { sfw: 0, sketchy: 1, nsfw: 2 };
    const index = purityMap[p];

    if (index !== undefined) {
      const currentPurity = purity[0] || '100';
      const currentArray = currentPurity.split('');
      currentArray[index] = currentArray[index] === '1' ? '0' : '1';
      setPurity([currentArray.join('')]);
    }
  };

  const isPurityActive = (p: string): boolean => {
    const purityMap: Record<string, number> = { sfw: 0, sketchy: 1, nsfw: 2 };
    const index = purityMap[p];
    const currentPurity = purity[0] || '100';
    return currentPurity[index] === '1';
  };

  return (
    <div className="flex items-center gap-3" ref={panelRef}>
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wallpapers..."
          className="w-full px-4 py-2 pl-10 text-sm text-white placeholder:text-white/40 liquid-input"
        />
        <button
          onClick={() => setQuery('')}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors ${
            query ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <X size={14} />
        </button>
      </div>

      {/* Filter Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="liquid-button px-4 py-2 flex items-center gap-2 text-sm font-bold"
      >
        <Sliders size={14} />
        <span className="hidden sm:inline">Filters</span>
        <ChevronDown size={12} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Filter Panel Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 glass-card p-4 z-50 shadow-2xl"
          >
            <div className="space-y-4">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Categories</h3>
                <div className="flex gap-2">
                  {['general', 'anime', 'people'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                        categories.includes(cat)
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purity */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Content</h3>
                <div className="flex gap-2">
                  {[
                    { key: 'sfw', label: 'SFW', color: 'green' },
                    { key: 'sketchy', label: 'Sketchy', color: 'yellow' },
                    { key: 'nsfw', label: 'NSFW', color: 'red' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => togglePurity(p.key)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                        isPurityActive(p.key)
                          ? `bg-${p.color}-500/20 text-${p.color}-400 border border-${p.color}-500/30`
                          : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Sort By</h3>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSorting(option.id)}
                      className={`px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all text-left ${
                        sorting === option.id
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply & Close */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    onRefresh();
                    setIsOpen(false);
                  }}
                  className="flex-1 liquid-button py-2 text-xs font-black uppercase tracking-widest"
                >
                  Apply
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white bg-white/5 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FilterPanel.displayName = 'FilterPanel';
