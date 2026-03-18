import React from 'react';
import { Plus, UserCircle, Users, Eye } from 'lucide-react';
import { Streamer } from '@/services/chaturbateApiService';
import { useGridStore } from '@/state/gridStore';
import { useProfileModalStore } from '@/state/profileModalStore';
import { formatNumber, getGenderColor } from '@/utils/formatters';

interface StreamerCardProps { streamer: Streamer; }

export const StreamerCardSkeleton = () => (
    <div className="animate-pulse">
        <div className="aspect-[3/4] bg-white/5 rounded-lg" />
    </div>
);

export const StreamerCard = React.memo(({ streamer }: StreamerCardProps) => {
    const addStream = useGridStore((state) => state.addStream);
    const openProfile = useProfileModalStore((state) => state.openProfile);

    const handleAddStream = (e: React.MouseEvent) => {
        e.stopPropagation();
        addStream(`https://www.chaturbate.com/fullvideo/?b=${streamer.username}`);
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openProfile(streamer.username);
    };

    return (
        <div
            className="group relative overflow-hidden rounded-lg cursor-pointer"
            onClick={handleAddStream}
        >
            {/* Thumbnail */}
            <div className="aspect-[3/4] bg-black/40 overflow-hidden">
                <img
                    src={streamer.img}
                    alt={streamer.username}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
            </div>

            {/* Gender badge — always visible */}
            <div className="absolute top-1 left-1">
                <span className={`px-1 py-0.5 rounded text-[7px] font-black text-white/90 ${getGenderColor(streamer.gender)}`}>
                    {streamer.gender.charAt(0).toUpperCase()}
                </span>
            </div>

            {/* Viewer count — always visible */}
            <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/60 backdrop-blur-sm">
                <Eye size={8} className="text-white/60" />
                <span className="text-[7px] font-bold text-white/80">{formatNumber(streamer.num_users)}</span>
            </div>

            {/* Bottom info bar — visible on hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1.5 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-[10px] font-bold text-white truncate leading-tight">{streamer.username}</p>
                {streamer.display_age && (
                    <p className="text-[8px] text-white/50 font-medium">{streamer.display_age}y</p>
                )}
            </div>

            {/* Action buttons — hover only */}
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    onClick={handleProfileClick}
                    className="p-1.5 rounded-full bg-purple-500/80 text-white hover:bg-purple-500 transition-colors shadow-lg backdrop-blur-sm"
                    title="Profile"
                >
                    <UserCircle size={14} />
                </button>
                <button
                    onClick={handleAddStream}
                    className="p-1.5 rounded-full bg-cyan-500/80 text-white hover:bg-cyan-500 transition-colors shadow-lg backdrop-blur-sm"
                    title="Add to Grid"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* New badge */}
            {streamer.is_new && (
                <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-emerald-500/80 text-[6px] font-black text-white uppercase">
                    new
                </div>
            )}
        </div>
    );
});