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
      className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10 transition-all duration-200"
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
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
});
ThemeToggle.displayName = 'ThemeToggle';

// Memoized Search Bar
export const SearchBar = memo(({ value, onChange, onClear }: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) => (
  <div className="relative max-w-md">
    <motion.div
      className="absolute left-3 top-1/2 transform -translate-y-1/2"
      animate={{ scale: value ? 0.8 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <Search className="h-5 w-5 text-gray-400" />
    </motion.div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search creators..."
      className="w-full pl-10 pr-10 py-2.5 bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 transition-all"
    />
    <AnimatePresence>
      {value && (
        <motion.button
          onClick={onClear}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  </div>
));
SearchBar.displayName = 'SearchBar';

// Memoized Layout Switcher
export const LayoutSwitcher = memo(() => {
  const { settings, updateSetting } = useSettings();
  const columns = settings.columnCount || 4;

  return (
    <div className="flex items-center bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-white/10">
      {[2, 3, 4, 5, 6].map((cols) => (
        <motion.button
          key={cols}
          onClick={() => updateSetting('columnCount', cols)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all relative overflow-hidden ${columns === cols
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {cols}
          {columns === cols && (
            <motion.div
              layoutId="activeLayout"
              className="absolute inset-0 bg-blue-600"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{cols}</span>
        </motion.button>
      ))}
    </div>
  );
});
LayoutSwitcher.displayName = 'LayoutSwitcher';

// Memoized Filter Dropdown
export const FilterDropdown = memo(({ onFilter }: { onFilter: (filter: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filters = ['All', 'Trending', 'New', 'Verified', 'Premium'];
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
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-gray-700/50 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Filter"
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm">{selected}</span>
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
              className="absolute top-full mt-2 right-0 w-48 bg-gray-800/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {filters.map((filter, index) => (
                <motion.button
                  key={filter}
                  onClick={() => handleFilterSelect(filter)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-700/50 transition-all flex items-center justify-between group ${
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
      className="flex-none z-40 glass-header px-4 md:px-6 py-4 border-b border-white/5"
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {showBackButton && onBackClick && (
              <motion.button
                onClick={onBackClick}
                className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10 transition-all"
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
            )}

            <motion.h1
              className={`${settings.compactView ? 'text-lg' : 'text-xl'} font-bold text-white flex items-center gap-2 truncate`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title === 'Trending Profiles' && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </motion.div>
              )}
              <span className="truncate">{title}</span>
            </motion.h1>
          </div>

          <div className="flex items-center gap-2">
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <SearchBar value={searchValue} onChange={onSearchChange} onClear={onSearchClear} />
              </motion.div>
            )}
            {showFilter && <FilterDropdown onFilter={onFilter} />}
            <div className="hidden md:block h-6 w-px bg-white/10 mx-1" />
            <LayoutSwitcher />
            <div className="hidden md:block h-6 w-px bg-white/10 mx-1" />
            {onSettingsClick && (
              <motion.button
                onClick={onSettingsClick}
                className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm border border-white/10 transition-all"
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </motion.button>
            )}
            {showThemeToggle && <ThemeToggle />}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

Header.displayName = 'Header';
