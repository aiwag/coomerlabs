// Browser-Style Tab Bar - Compact, Performant, Glassmorphic
import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from '@tanstack/react-router';
import {
  X,
  Plus,
  Maximize2,
  Minimize2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTabStore, Tab } from '../../state/tabStore';

const tabBarStyles = `
  .tab-scrollbar::-webkit-scrollbar {
    height: 0;
    width: 0;
  }
  .tab-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .liquid-tab {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.04) 100%
    );
    backdrop-filter: blur(30px) saturate(180%);
    -webkit-backdrop-filter: blur(30px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .liquid-tab:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.06) 100%
    );
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  .liquid-tab.active {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.08) 100%
    );
    border-color: rgba(255, 255, 255, 0.25);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
  }
`;

interface TabBarProps {
  compact?: boolean;
}

export const TabBar = React.memo<TabBarProps>(({ compact = false }) => {
  const { tabs, activeTabId, removeTab, setActiveTab, clearAllTabs } = useTabStore();
  const location = useLocation();

  // Inject styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = tabBarStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Track current location and update/create tabs
  React.useEffect(() => {
    const currentPath = location.pathname;
    const title = getTabTitle(currentPath);
    const existingTab = tabs.find(t => t.path === currentPath);

    if (!existingTab && currentPath !== '/') {
      // Create new tab for this route
      const tabId = `${currentPath}-${Date.now()}`;
      useTabStore.getState().addTab({
        id: tabId,
        title,
        path: currentPath,
        isActive: true,
      });
    } else if (existingTab && existingTab.id !== activeTabId) {
      // Activate existing tab
      setActiveTab(existingTab.id);
    }
  }, [location.pathname]);

  const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    e.preventDefault();
    removeTab(tabId);
  }, [removeTab]);

  const handleTabClick = useCallback((tabId: string, path: string) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Memoize tab rendering for performance
  const renderedTabs = useMemo(() => {
    return tabs.map((tab, index) => {
      const isActive = tab.id === activeTabId;

      return (
        <motion.div
          key={tab.id}
          layout
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.15 }}
          className={`relative group liquid-tab rounded-xl flex items-center gap-2 cursor-pointer select-none ${
            isActive ? 'active px-3 py-2' : 'px-3 py-2'
          }`}
          onClick={() => handleTabClick(tab.id, tab.path)}
          style={{ minWidth: isActive ? '180px' : '160px', maxWidth: '240px' }}
        >
          {/* Tab Content */}
          <Link
            to={tab.path}
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick(tab.id, tab.path);
            }}
          >
            {/* Favicon / Icon */}
            <div className={`w-4 h-4 rounded-md flex-shrink-0 ${
              isActive
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                : 'bg-white/20 group-hover:bg-white/30'
            } transition-all duration-200`}
            style={{
              backgroundSize: '12px 12px',
              backgroundImage: isActive
                ? 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
            }}
            />

            {/* Title */}
            <span className={`text-[11px] font-medium truncate flex-1 ${
              isActive
                ? 'text-white'
                : 'text-white/60 group-hover:text-white/80'
            } transition-colors duration-200`}>
              {tab.title}
            </span>
          </Link>

          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleTabClose(e, tab.id)}
            className={`flex-shrink-0 p-0.5 rounded-md transition-all duration-200 ${
              isActive
                ? 'hover:bg-white/20 text-white/70 hover:text-white'
                : 'opacity-0 group-hover:opacity-100 hover:bg-white/10 text-white/50 hover:text-white/70'
            }`}
          >
            <X size={12} strokeWidth={2.5} />
          </motion.button>

          {/* Active Indicator */}
          {isActive && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.div>
      );
    });
  }, [tabs, activeTabId, handleTabClick, handleTabClose]);

  return (
    <div className={`relative z-50 ${
      compact ? 'h-10' : 'h-12'
    }`}>
      {/* Tab Bar Container */}
      <div className="liquid-glass-dark border-b border-white/10">
        <div className="flex items-center gap-2 px-3 h-full">
          {/* New Tab Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className={`liquid-button flex-shrink-0 flex items-center justify-center ${
              compact ? 'w-7 h-7 rounded-lg' : 'w-8 h-8 rounded-xl'
            }`}
          >
            <Plus size={compact ? 14 : 16} strokeWidth={2.5} className="text-white/60" />
          </motion.button>

          {/* Tabs Container */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto tab-scrollbar">
            <AnimatePresence mode="popLayout">
              {renderedTabs}
            </AnimatePresence>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Minimize"
            >
              <Minus size={14} strokeWidth={2.5} className="text-white/40" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Maximize"
            >
              <Copy size={12} strokeWidth={2.5} className="text-white/40" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
              whileTap={{ scale: 0.9 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"
              title="Close"
            >
              <X size={14} strokeWidth={2.5} className="text-white/40 hover:text-red-400" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
});

TabBar.displayName = 'TabBar';

// Helper function to get tab title from path
function getTabTitle(path: string): string {
  const titleMap: Record<string, string> = {
    '/camviewer': 'CamViewer',
    '/redgifs': 'RedGifs',
    '/fapello': 'Fapello',
    '/wallheaven': 'Wallheaven',
    '/coomerKemono': 'Creator Archive',
    '/javtube': 'JavTube',
    '/actresses': 'Star Database',
    '/dashboard': 'Dashboard',
  };

  // Handle dynamic routes
  if (path.startsWith('/actress/')) return 'Star Profile';
  if (path.startsWith('/javtube/')) return 'JavTube';
  if (path.startsWith('/fapello/')) return 'Fapello';

  return titleMap[path] || 'New Tab';
}

const Minus = ({ size, strokeWidth }: { size: number; strokeWidth: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default TabBar;
