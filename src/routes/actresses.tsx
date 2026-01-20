import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Search,
    Loader2,
    Video,
    ExternalLink,
    Play,
    ArrowLeft,
} from "lucide-react";
import { useInView } from "react-intersection-observer";

interface Actress {
    id: string;
    name: string;
    thumbnail: string;
    videoCount: string;
    url: string;
}

export const Actresses = () => {
    const [searchQuery, setSearchQuery] = useState("");

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
    } = useInfiniteQuery({
        queryKey: ["javtube-actresses"],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await fetch(`http://127.0.0.1:8080/api/actresses?page=${pageParam}`);
            if (!response.ok) throw new Error("Failed to fetch actresses");
            return response.json();
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage && lastPage.length > 0) {
                return allPages.length + 1;
            }
            return undefined;
        },
    });

    const { ref: scrollRef, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const actresses = data?.pages.flat() as Actress[] || [];
    const filteredActresses = actresses.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0b] text-white">
                <Users size={48} className="text-red-500" />
                <h2 className="text-2xl font-bold">Connection Terminated</h2>
                <p className="text-white/60">Performer database is currently unreachable.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 rounded-full bg-white/5 px-6 py-2 font-bold hover:bg-white/10"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-[#050505] text-white overflow-hidden">
            {/* Header */}
            <div className="flex-none flex items-center justify-between border-b border-white/5 bg-black/40 px-8 py-6 backdrop-blur-3xl z-40">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 shadow-lg shadow-red-500/20">
                        <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Actresses</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                            Star Database • Alpha Node
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Link
                        to="/javtube"
                        className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-purple-500/30 transition-all group/back"
                    >
                        <ArrowLeft size={18} className="group-hover/back:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Videos</span>
                    </Link>

                    <div className="relative w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-red-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter performers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all backdrop-blur-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative z-10">
                {isLoading && actresses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-red-500" />
                        <p className="text-white/40 font-bold uppercase tracking-widest text-sm animate-pulse">
                            Syncing Star Database...
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredActresses.map((actress, index) => (
                                <Link
                                    key={`${actress.id}-${index}`}
                                    to="/actress/$id"
                                    params={{ id: actress.id }}
                                    className="group relative flex flex-col items-center p-6 rounded-[3rem] bg-white/5 border border-white/5 hover:border-red-500/30 transition-all duration-500 shadow-xl overflow-hidden cursor-pointer"
                                >
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: (index % 18) * 0.02 }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="relative mb-4 flex flex-col items-center">
                                            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-red-600 to-orange-500 opacity-0 group-hover:opacity-40 blur-xl transition duration-500" />
                                            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-red-500/50 transition-all duration-500 shadow-2xl">
                                                <img
                                                    src={actress.thumbnail}
                                                    alt={actress.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            </div>
                                        </div>

                                        <h3 className="relative text-sm font-black text-center text-white/90 group-hover:text-white transition-colors line-clamp-1 mb-2 tracking-tight">
                                            {actress.name}
                                        </h3>

                                        <div className="relative flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase text-white/40 group-hover:text-red-400 group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-all">
                                            <Video className="w-3 h-3" />
                                            {actress.videoCount} Masterpieces
                                        </div>

                                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div
                                                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:border-red-500/50 transition-all hover:scale-110 active:scale-95"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                    </motion.div>
                                </Link>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Infinite Scroll Trigger */}
                <div ref={scrollRef} className="flex flex-col items-center justify-center py-20 gap-4">
                    {hasNextPage ? (
                        <>
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500/20 blur-xl animate-pulse rounded-full" />
                                <Loader2 className="h-10 w-10 animate-spin text-red-500 relative" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse">Decrypting More Profiles</p>
                        </>
                    ) : actresses.length > 0 ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">Database End Reached</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export const Route = createFileRoute("/actresses")({
    component: Actresses,
});
