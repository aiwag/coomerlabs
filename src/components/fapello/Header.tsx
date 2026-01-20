// Fapello Header Components
import React, { useState } from 'react';
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

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fapello-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    document.documentElement.classList.toggle('dark', newValue);
    localStorage.setItem('fapello-theme', newValue ? 'dark' : 'light');
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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
    </motion.button>
  );
};

export const SearchBar = ({ value, onChange, onClear }: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) => (
  <div className="relative max-w-md">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search creators..."
      className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
);

export const LayoutSwitcher = () => {
  const { settings, updateSetting } = useSettings();
  const columns = settings.columnCount || 4;

  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
      {[2, 3, 4, 5, 6].map((cols) => (
        <button
          key={cols}
          onClick={() => updateSetting('columnCount', cols)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${columns === cols
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
        >
          {cols}
        </button>
      ))}
    </div>
  );
};

export const FilterDropdown = ({ onFilter }: { onFilter: (filter: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filters = ['All', 'Trending', 'New', 'Verified', 'Premium'];
  const [selected, setSelected] = useState('All');

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="h-4 w-4" />
        <span>{selected}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
          >
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setSelected(filter);
                  onFilter(filter);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {filter}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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

export const Header = ({
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
    <div className="flex-none z-40 glass-header px-6 py-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBackButton && onBackClick && (
              <motion.button
                onClick={onBackClick}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
            )}

            <h1 className={`${settings.compactView ? 'text-lg' : 'text-xl'} font-bold text-white flex items-center gap-2`}>
              {title === 'Trending Profiles' && <TrendingUp className="h-4 w-4 text-blue-500" />}
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {showSearch && <SearchBar value={searchValue} onChange={onSearchChange} onClear={onSearchClear} />}
            {showFilter && <FilterDropdown onFilter={onFilter} />}
            <div className="h-6 w-px bg-gray-700 mx-2" />
            <LayoutSwitcher />
            <div className="h-6 w-px bg-gray-700 mx-2" />
            {onSettingsClick && (
              <motion.button
                onClick={onSettingsClick}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="h-4 w-4" />
              </motion.button>
            )}
            {showThemeToggle && <ThemeToggle />}
          </div>
        </div>
      </div>
    </div>
  );
};
