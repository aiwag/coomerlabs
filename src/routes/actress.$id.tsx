import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Video,
    Play,
    Loader2,
    ExternalLink,
    Users,
    Film,
    X,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { EnhancedVideoPlayer } from "../components/EnhancedVideoPlayer";

interface VideoData {
    id: string;
    code: string;
    title: string;
    thumbnail: string;
    duration: string;
    quality: string;
    videoUrl?: string;
}

interface ActressInfo {
    name: string;
    img: string;
    stats: string;
}

export const Route = createFileRoute("/actress/$id")({
    component: () => <ActressDetail />,
});

const ActressDetail = () => {
    const { id } = Route.useParams();
    const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadingVideoUrl, setLoadingVideoUrl] = useState<string | null>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
    } = useInfiniteQuery({
        queryKey: ["actress-videos", id],
        queryFn: async ({ pageParam = 1 }) => {
            const result = await window.javtube.getActressVideos(id, pageParam as number);
            if (!result.success) throw new Error(result.error || "Failed to fetch actress data");
            return result.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage && lastPage.videos.length > 0) {
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

    const allVideos = data?.pages.flatMap((page) => page.videos) as VideoData[] || [];
    const actressInfo = data?.pages[0]?.actress as ActressInfo || null;

    const handleVideoClick = async (video: VideoData, index: number) => {
        setCurrentIndex(index);
        setSelectedVideo(video);

        if (!video.videoUrl) {
            setLoadingVideoUrl(video.id);
            try {
                const result = await window.javtube.getVideoUrl(video.id);
                if (result.success && result.data.videoUrl) {
                    setSelectedVideo((prev) =>
                        prev && prev.id === video.id
                            ? { ...prev, videoUrl: result.data.videoUrl }
                            : prev
                    );
                }
            } catch (err) {
                console.error("URL fetch error:", err);
            } finally {
                setLoadingVideoUrl(null);
            }
        }
    };

    const handleClose = () => {
        setSelectedVideo(null);
        setLoadingVideoUrl(null);
    };

    const handleNext = () => {
        const nextIndex = (currentIndex + 1) % allVideos.length;
        handleVideoClick(allVideos[nextIndex], nextIndex);
    };

    const handlePrevious = () => {
        const prevIndex = (currentIndex - 1 + allVideos.length) % allVideos.length;
        handleVideoClick(allVideos[prevIndex], prevIndex);
    };

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0b] text-white">
                <Users size={48} className="text-red-500" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-white/60">The star database for this performer is currently unreachable.</p>
                <Link
                    to="/actresses"
                    className="flex items-center gap-2 rounded-full bg-white/5 px-6 py-2 font-bold hover:bg-white/10"
                >
                    Return to Index
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-[#050505] text-white overflow-hidden">
            {/* Dynamic Header / Banner */}
            <div className="flex-none relative h-[45vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#050505] z-10" />
                {actressInfo?.img && (
                    <motion.img
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1.1, opacity: 0.2 }}
                        src={actressInfo.img}
                        className="absolute inset-0 w-full h-full object-cover blur-3xl"
                    />
                )}

                <div className="absolute inset-0 flex flex-col justify-end px-12 pb-16 z-20">
                    <Link
                        to="/actresses"
                        className="absolute top-10 left-10 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-3xl text-white/60 hover:text-white hover:bg-white/10 transition-all group/back shadow-2xl"
                    >
                        <ArrowLeft size={18} className="group-hover/back:-translate-x-1 transition-transform text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Star Directory</span>
                    </Link>

                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-end gap-12"
                    >
                        <div className="relative group/avatar">
                            <div className="absolute -inset-4 rounded-[4rem] bg-gradient-to-tr from-red-600 to-orange-500 opacity-20 blur-2xl group-hover/avatar:opacity-40 transition-opacity" />
                            <div className="relative w-56 h-56 rounded-[3.5rem] overflow-hidden border-4 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black/40">
                                {actressInfo?.img ? (
                                    <img
                                        src={actressInfo.img}
                                        alt={actressInfo.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Users size={64} className="text-white/10" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 pb-2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3 mb-6"
                            >
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-red-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    Confirmed Archive Node
                                </span>
                                <div className="h-px w-12 bg-white/10" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 truncate max-w-[200px]">
                                    ID: {id}
                                </span>
                            </motion.div>

                            <h1 className="text-7xl font-black tracking-tighter mb-8 bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent">
                                {actressInfo?.name || id.replace(/-/g, ' ')}
                            </h1>

                            <div className="flex items-center gap-10">
                                <div className="flex items-center gap-4 group/stat">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/stat:border-red-500/30 group-hover/stat:bg-red-500/5 transition-all">
                                        <Film size={20} className="text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Media Objects</p>
                                        <p className="text-2xl font-black tracking-tight">{actressInfo?.stats || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="w-px h-10 bg-white/5" />

                                <div className="flex items-center gap-4 group/stat">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/stat:border-red-500/30 group-hover/stat:bg-red-500/5 transition-all">
                                        <Play size={20} className="text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">Stream Quality</p>
                                        <p className="text-2xl font-black tracking-tight">4K Ultra</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-12 py-10 custom-scrollbar relative z-30 bg-[#050505]">
                {isLoading && allVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 blur-xl animate-pulse rounded-full" />
                            <Loader2 className="h-14 w-14 animate-spin text-red-500 relative" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 animate-pulse mt-4">
                            Synchronizing Performer Archive...
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        <AnimatePresence mode="popLayout">
                            {allVideos.map((video, index) => (
                                <motion.div
                                    key={`${video.id}-${index}`}
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: (index % 15) * 0.04 }}
                                    onClick={() => handleVideoClick(video, index)}
                                    className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] hover:border-red-500/30 transition-all duration-500 shadow-2xl hover:-translate-y-1"
                                >
                                    <div className="relative aspect-video overflow-hidden">
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                                        <div className="absolute top-4 right-4 flex gap-2">
                                            {video.quality && (
                                                <span className="rounded-lg bg-red-600 px-2 py-1 text-[8px] font-black uppercase tracking-widest backdrop-blur-md">
                                                    {video.quality}
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                            <span className="rounded-xl bg-black/60 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md text-white/60">
                                                {video.code}
                                            </span>
                                            <span className="rounded-xl bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-white/5 backdrop-blur-md">
                                                {video.duration}
                                            </span>
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="h-16 w-16 rounded-full bg-red-600/90 border border-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                                                <Play className="h-8 w-8 text-white fill-current ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="line-clamp-2 text-sm font-bold leading-relaxed text-white/80 group-hover:text-white transition-colors">
                                            {video.title}
                                        </h3>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Infinite Scroll Trigger */}
                <div ref={scrollRef} className="flex flex-col items-center justify-center py-24 gap-4">
                    {hasNextPage ? (
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500/10 blur-xl animate-pulse rounded-full" />
                                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Requesting Next Archive Block</p>
                        </div>
                    ) : allVideos.length > 0 ? (
                        <div className="w-full flex flex-col items-center gap-8 py-10 opacity-30">
                            <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <p className="text-[9px] font-black uppercase tracking-[0.8em] text-white">End of Performer Stream</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl"
                    >
                        {loadingVideoUrl && (
                            <div className="flex flex-col items-center gap-8 z-[110]">
                                <div className="relative">
                                    <div className="w-24 h-24 border-[6px] border-red-500/10 border-t-red-600 rounded-full animate-spin" />
                                    <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-red-500 animate-pulse" />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-sm font-black uppercase tracking-[0.4em] bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent animate-pulse text-center">
                                        Initializing Star Stream
                                    </p>
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-red-500/50 animate-pulse">
                                        Channel {selectedVideo.code}
                                    </p>
                                </div>
                            </div>
                        )}

                        {selectedVideo.videoUrl && (
                            <EnhancedVideoPlayer
                                video={selectedVideo}
                                videoUrl={selectedVideo.videoUrl}
                                poster={selectedVideo.thumbnail}
                                onClose={handleClose}
                                onNext={handleNext}
                                onPrevious={handlePrevious}
                                hasNext={currentIndex < allVideos.length - 1 || hasNextPage}
                                hasPrevious={currentIndex > 0}
                            />
                        )}

                        <button
                            onClick={handleClose}
                            className="absolute top-10 right-10 z-[120] p-4 rounded-full bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/30 text-white transition-all hover:rotate-90 group"
                        >
                            <X size={24} className="group-hover:text-red-500" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
