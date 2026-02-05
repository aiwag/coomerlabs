// Fapello Header Components - Enhanced
import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  X,
  Filter,
  Settings,
  TrendingUp,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useSettings } from './hooks';

// Memoized Theme Toggle
export const ThemeToggle = memo(() => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fapello-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = useCallback(() => {
    const newValue = !isDark;
    setIsDark(newValue);
    document.documentElement.classList.toggle('dark', newValue);
    localStorage.setItem('fapello-theme', newValue ? 'dark' : 'light');
  }, [isDark]);

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10 transition-all duration-200"
      whileHover={{ scale: 1.05, rotate: isDark ? 180 : 0 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
});
ThemeToggle.displayName = 'ThemeToggle';

// Compact Search Bar with Enhanced Features
export const SearchBar = memo(({ value, onChange, onClear }: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative transition-all duration-300 ${isFocused ? 'flex-1 max-w-md' : 'w-48'}`}>
      <motion.div
        className="absolute left-2.5 top-1/2 transform -translate-y-1/2 z-10"
        animate={{ scale: value ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <Search className="h-3.5 w-3.5 text-gray-400" />
      </motion.div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search..."
        className={`w-full pl-8 pr-7 py-1.5 bg-gray-800/50 backdrop-blur-sm border rounded-lg focus:outline-none text-white placeholder-gray-400 transition-all text-sm ${
          isFocused
            ? 'border-blue-500/50 ring-2 ring-blue-500/20'
            : 'border-white/10 hover:border-white/20'
        }`}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            onClick={onClear}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});
SearchBar.displayName = 'SearchBar';

// Compact Layout Switcher
export const LayoutSwitcher = memo(() => {
  const { settings, updateSetting } = useSettings();
  const columns = settings.columnCount || 4;

  return (
    <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-lg p-0.5 border border-white/10">
      {[2, 3, 4, 5, 6].map((cols) => (
        <motion.button
          key={cols}
          onClick={() => updateSetting('columnCount', cols)}
          className={`px-2 py-1 text-xs font-medium rounded transition-all relative overflow-hidden ${
            columns === cols
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {cols}
        </motion.button>
      ))}
    </div>
  );
});
LayoutSwitcher.displayName = 'LayoutSwitcher';

// Compact HD Toggle
export const HDToggle = memo(() => {
  const { settings, updateSetting } = useSettings();

  return (
    <motion.button
      onClick={() => updateSetting('alwaysHD', !settings.alwaysHD)}
      className={`p-1.5 rounded-lg backdrop-blur-sm border transition-all ${
        settings.alwaysHD
          ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-purple-400/30 shadow-lg shadow-purple-500/20'
          : 'bg-gray-800/50 hover:bg-gray-700/50 border-white/10'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle HD images"
      title={settings.alwaysHD ? 'HD On' : 'HD Off'}
    >
      <motion.div
        animate={{ rotate: settings.alwaysHD ? 360 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <Sparkles className={`h-3.5 w-3.5 ${settings.alwaysHD ? 'text-white' : 'text-gray-400'}`} />
      </motion.div>
    </motion.button>
  );
});
HDToggle.displayName = 'HDToggle';

// Compact Filter Dropdown
export const FilterDropdown = memo(({ onFilter }: { onFilter: (filter: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filters = ['All', 'Trending', 'New', 'Verified', 'Premium', 'Followed'];
  const [selected, setSelected] = useState('All');

  const handleFilterSelect = useCallback((filter: string) => {
    setSelected(filter);
    onFilter(filter);
    setIsOpen(false);
  }, [onFilter]);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 backdrop-blur-sm border rounded-lg hover:bg-gray-700/50 transition-all text-sm ${
          isOpen ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-white/10'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Filter"
      >
        <Filter className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{selected}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-3 w-3" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 right-0 w-40 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden"
            >
              {filters.map((filter, index) => (
                <motion.button
                  key={filter}
                  onClick={() => handleFilterSelect(filter)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-700/50 transition-all flex items-center justify-between text-sm ${
                    selected === filter ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'
                  }`}
                >
                  <span>{filter}</span>
                  {selected === filter && (
                    <motion.div
                      layoutId="activeFilter"
                      className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
FilterDropdown.displayName = 'FilterDropdown';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showThemeToggle?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
  showFilter?: boolean;
  onFilter?: (filter: string) => void;
  onSettingsClick?: () => void;
}

export const Header = memo(({
  title,
  showBackButton,
  onBackClick,
  showThemeToggle = true,
  showSearch = false,
  searchValue = '',
  onSearchChange = () => { },
  onSearchClear = () => { },
  showFilter = false,
  onFilter = () => { },
  onSettingsClick
}: HeaderProps) => {
  const { settings } = useSettings();

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex-none z-40 glass-header px-3 md:px-4 py-2 border-b border-white/5"
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Left: Back button and title */}
          <div className="flex items-center gap-2 min-w-0">
            {showBackButton && onBackClick && (
              <motion.button
                onClick={onBackClick}
                className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10 transition-all"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Go back"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </motion.button>
            )}

            <motion.h1
              className="text-base md:text-lg font-bold text-white flex items-center gap-1.5 truncate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title === 'Trending Profiles' && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="hidden sm:block"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                </motion.div>
              )}
              <span className="truncate">{title}</span>
            </motion.h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <SearchBar value={searchValue} onChange={onSearchChange} onClear={onSearchClear} />
              </motion.div>
            )}
            {showFilter && <FilterDropdown onFilter={onFilter} />}

            <div className="hidden md:flex items-center gap-1.5">
              <div className="w-px h-4 bg-white/10" />
              <LayoutSwitcher />
              <div className="w-px h-4 bg-white/10" />
              <HDToggle />
              {onSettingsClick && (
                <>
                  <div className="w-px h-4 bg-white/10" />
                  <motion.button
                    onClick={onSettingsClick}
                    className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10 transition-all"
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </motion.button>
                </>
              )}
              <div className="w-px h-4 bg-white/10" />
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-1">
              <HDToggle />
              {onSettingsClick && (
                <motion.button
                  onClick={onSettingsClick}
                  className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </motion.button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

Header.displayName = 'Header';
