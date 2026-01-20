import React from "react";
import { useHUDStore } from "@/state/hudStore";
import { motion, AnimatePresence } from "framer-motion";
import {
    Volume2, VolumeX, ShieldAlert, Monitor,
    LayoutGrid, Zap, Search, Minimize2, Maximize2
} from "lucide-react";

export function StatusHUD() {
    const { isVisible, message, type, icon } = useHUDStore();

    const getIcon = () => {
        switch (icon) {
            case "mute": return <VolumeX size={32} />;
            case "unmute": return <Volume2 size={32} />;
            case "panic": return <ShieldAlert size={32} className="text-red-500" />;
            case "layout": return <LayoutGrid size={32} />;
            case "smart": return <Zap size={32} className="text-cyan-400" />;
            case "browse": return <Search size={32} />;
            case "exit": return <Minimize2 size={32} />;
            case "enter": return <Maximize2 size={32} />;
            default: return <Monitor size={32} />;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="fixed left-1/2 top-1/2 z-[99999] -translate-x-1/2 -translate-y-1/2"
                >
                    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/20 px-8 py-6 text-white shadow-2xl"
                         style={{
                             background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(20, 20, 20, 0.4) 50%, rgba(0, 0, 0, 0.5) 100%)',
                             backdropFilter: 'blur(40px) saturate(200%)',
                             WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                         }}>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 shadow-lg">
                            {getIcon()}
                        </div>
                        <span className="text-xl font-bold tracking-tight uppercase">{message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
