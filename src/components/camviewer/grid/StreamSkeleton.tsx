import React from "react";
import { motion } from "framer-motion";

export function StreamSkeleton() {
    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-3xl">
            {/* Pulse Animation for the main body */}
            <motion.div
                className="h-full w-full bg-white/5"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Centered Logo/Icon Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <motion.div
                    className="h-16 w-16 rounded-2xl bg-white/5"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="h-4 w-32 rounded bg-white/5" />
            </div>

            {/* Loading Progress Bar at the bottom */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5 overflow-hidden">
                <motion.div
                    className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 10, ease: "linear" }}
                />
            </div>
        </div>
    );
}
