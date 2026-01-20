// Wallheaven - Glassmorphic Header Component
import React from 'react';
import { motion } from 'framer-motion';
import { Grid } from 'lucide-react';
import { useWallheavenSettings } from './hooks';
import { viewModes } from './types';
import { FilterPanel } from './FilterPanel';

interface HeaderProps {
  onRefresh: () => void;
}

export const Header = React.memo<HeaderProps>(({ onRefresh }) => {
  const { viewMode, setViewMode } = useWallheavenSettings();

  return (
    <div className="glass-header border-b border-white/10 px-4 py-3">
      <div className="flex flex-col gap-3">
        {/* Top Row - Logo + View Mode */}
        <div className="flex items-center justify-between">
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
        </div>

        {/* Bottom Row - Filter Panel */}
        <FilterPanel onRefresh={onRefresh} />
      </div>
    </div>
  );
});

Header.displayName = 'Header';
