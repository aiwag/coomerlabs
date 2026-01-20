import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import InitialIcons from "@/components/template/InitialIcons";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Home, Camera, Video, Image, Users, Menu, X, ChevronUp, ChevronDown,
  Settings, Minimize2, Maximize2
} from "lucide-react";
import { GlobalSearch } from "@/components/template/GlobalSearch";
import { NotificationPanel } from "@/components/template/NotificationPanel";
import { AccountDropdown } from "@/components/template/AccountDropdown";

const menuItems = [
  { to: "/", label: "home", icon: <Home size={18} /> },
  { to: "/camviewer", label: "camviewer", icon: <Camera size={18} /> },
  { to: "/redgifs", label: "redgifs", icon: <Video size={18} /> },
  { to: "/fapello", label: "fapello", icon: <Image size={18} /> },
  { to: "/wallheaven", label: "wallheaven", icon: <Image size={18} /> },
  { to: "/coomerKemono", label: "coomerKemono", icon: <Users size={18} /> },
  { to: "/javtube", label: "javtube", icon: <Video color="red" size={18} /> },
];

type FloatingButtonPosition = { x: number; y: number };

export default function NavigationMenu() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [floatingButtonPosition, setFloatingButtonPosition] = useState<FloatingButtonPosition>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 - 20 : 0,
    y: 20
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  const getCurrentRouteName = () => {
    const currentItem = menuItems.find((item) => item.to === location.pathname);
    return currentItem ? t(currentItem.label) : "Home";
  };

  const isMenuItemActive = (path: string) => location.pathname === path;

  // Store menu settings in localStorage
  useEffect(() => {
    const savedMenuState = localStorage.getItem("menuVisible");
    const savedMiniMode = localStorage.getItem("miniMode");
    const savedButtonPosition = localStorage.getItem("floatingButtonPosition");

    if (savedMenuState !== null) {
      setIsMenuVisible(savedMenuState === "true");
    }
    if (savedMiniMode !== null) {
      setIsMiniMode(savedMiniMode === "true");
    }
    if (savedButtonPosition) {
      try {
        const position = JSON.parse(savedButtonPosition);
        setFloatingButtonPosition(position);
        setHasBeenDragged(true); // Mark as dragged if position was saved
      } catch (e) {
        console.error("Failed to parse floating button position", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("menuVisible", isMenuVisible.toString());
  }, [isMenuVisible]);

  useEffect(() => {
    localStorage.setItem("miniMode", isMiniMode.toString());
  }, [isMiniMode]);

  useEffect(() => {
    localStorage.setItem("floatingButtonPosition", JSON.stringify(floatingButtonPosition));
  }, [floatingButtonPosition]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + M to toggle menu visibility
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        setIsMenuVisible(!isMenuVisible);
      }

      // Ctrl/Cmd + Shift + M to toggle mini mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        setIsMiniMode(!isMiniMode);
      }

      // Escape to close mobile menu
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuVisible, isMiniMode, isMobileMenuOpen]);

  // Handle click outside for mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle drag end for floating button
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info;

    // Calculate new position
    let newX = floatingButtonPosition.x + offset.x;
    let newY = floatingButtonPosition.y + offset.y;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Constrain position to viewport
    newX = Math.max(0, Math.min(newX, viewportWidth - 40)); // 40 is button width
    newY = Math.max(0, Math.min(newY, viewportHeight - 40)); // 40 is button height

    setFloatingButtonPosition({ x: newX, y: newY });
    setIsDragging(false);
    setHasBeenDragged(true); // Mark as dragged after first drag
  }, [floatingButtonPosition]);

  // Toggle menu visibility
  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  return (
    <>
      {/* Drag constraints for the floating button */}
      <div ref={dragConstraintsRef} className="fixed inset-0 pointer-events-none z-40" />

      {/* Floating Toggle Button - Centered by default */}
      <AnimatePresence>
        {!isMenuVisible && !isMiniMode && (
          <motion.button
            drag
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={dragConstraintsRef}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMenu}
            className={`fixed z-50 w-10 h-10 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white rounded-full shadow-2xl transition-all ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              left: hasBeenDragged ? `${floatingButtonPosition.x}px` : '50%',
              transform: hasBeenDragged ? 'none' : 'translateX(-50%)',
              top: `${floatingButtonPosition.y}px`,
            }}
            title="Show Menu (Ctrl/Cmd + M)"
          >
            {/* Icon */}
            <div className="flex items-center justify-center h-full">
              <ChevronDown size={16} className="text-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Navigation Menu */}
      <AnimatePresence>
        {(isMenuVisible || isMiniMode) && (
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative z-50"
          >
            <div className={`glass-header bg-transparent transition-all duration-500 ${isMiniMode ? 'h-10' : 'h-16'}`}>
              <div className="mx-auto max-w-full px-6">
                <div className={`flex items-center justify-between ${isMiniMode ? 'h-10' : 'h-16'}`}>
                  {/* Logo Section */}
                  <div className="flex items-center">
                    <Link to="/" className="flex items-center space-x-3 group transition-transform active:scale-95">
                      <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
                        <InitialIcons />
                      </div>
                      {!isMiniMode && (
                        <div className="hidden sm:block">
                          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                            <span>Coomer</span>
                            <span className="text-white/40 font-light">Labs</span>
                            <div className="h-4 w-[1px] bg-white/10 mx-1" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black">{getCurrentRouteName()}</span>
                          </h1>
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Navigation Icons - Desktop Segment Control */}
                  <div className="hidden items-center p-1 bg-black/20 rounded-xl lg:flex border border-white/5">
                    {menuItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`group relative flex items-center justify-center rounded-lg px-4 ${isMiniMode ? 'py-1' : 'py-2'} transition-all duration-300 ${isMenuItemActive(item.to) ? "bg-white/10 text-white shadow-lg backdrop-blur-md border border-white/5" : "text-neutral-500 hover:text-neutral-300"}`}
                        title={t(item.label)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`${isMenuItemActive(item.to) ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                            {item.icon}
                          </div>
                          {!isMiniMode && <span className="text-[10px] font-black uppercase tracking-widest">{t(item.label)}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Center Section - Global Search Component (hidden in mini mode) */}
                  {!isMiniMode && <div className="max-w-xs w-full px-4"><GlobalSearch /></div>}

                  {/* Right Section */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                      {!isMiniMode && <NotificationPanel />}
                      {!isMiniMode && <AccountDropdown />}

                      <div className="w-[1px] h-4 bg-white/10 mx-1" />

                      {/* Mini Mode Toggle */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMiniMode(!isMiniMode)}
                        className="p-2 text-neutral-500 hover:text-white transition-colors"
                        title={isMiniMode ? "Expand Menu" : "Mini Mode"}
                      >
                        {isMiniMode ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                      </motion.button>

                      {/* Hide Menu Button */}
                      {!isMiniMode && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleMenu}
                          className="p-2 text-neutral-500 hover:text-white transition-colors"
                          title="Hide Menu"
                        >
                          <ChevronUp size={16} />
                        </motion.button>
                      )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="lg:hidden">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-400 bg-white/5 rounded-xl border border-white/5">
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && !isMiniMode && (
                <motion.div
                  ref={mobileMenuRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-white/10 bg-black/90 backdrop-blur-xl lg:hidden"
                >
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {menuItems.map((item) => (
                        <Link key={item.to} to={item.to} onClick={() => setIsMobileMenuOpen(false)} className={`group flex flex-col items-center justify-center space-y-1 rounded-lg p-3 text-sm transition-all ${isMenuItemActive(item.to) ? "bg-purple-600/20 text-purple-400" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 transition-all group-hover:bg-white/10">{item.icon}</div>
                          <span className="text-xs font-medium capitalize">{t(item.label)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}