import React from 'react';
import { Plus, User, Users, UserCircle } from 'lucide-react';
import { Streamer } from '@/services/chaturbateApiService';
import { useGridStore } from '@/state/gridStore';
import { formatNumber, getGenderColor } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

interface StreamerCardProps { streamer: Streamer; }

export const StreamerCardSkeleton = () => (
    <div className="p-1 animate-pulse">
        <div className="bg-white/5 rounded-xl border border-white/5 flex h-[96px]">
            <div className="w-24 bg-white/5" />
            <div className="p-3 flex flex-col justify-between flex-grow">
                <div>
                    <div className="h-4 w-3/4 bg-white/10 rounded" />
                    <div className="flex gap-2 mt-2">
                        <div className="h-3 w-10 bg-white/10 rounded" />
                        <div className="h-3 w-10 bg-white/10 rounded" />
                    </div>
                </div>
                <div className="h-8 w-8 bg-white/10 rounded-lg self-end" />
            </div>
        </div>
    </div>
);

export const StreamerCard = React.memo(({ streamer }: StreamerCardProps) => {
    const addStream = useGridStore((state) => state.addStream);
    const navigate = useNavigate();

    const handleAddStream = (e: React.MouseEvent) => {
        e.stopPropagation();
        addStream(`https://www.chaturbate.com/fullvideo/?b=${streamer.username}`);
    };

    const handleProfileClick = () => {
        navigate({ to: `/camviewer/room/${streamer.username}` });
    };

    return (
        <div className="p-1">
            <div className="glass-card rounded-xl overflow-hidden hover:border-cyan-500/50 hover:bg-white/5 transition-all duration-300 group flex h-[96px]">
                <div className="w-24 relative flex-shrink-0 overflow-hidden">
                    <img
                        src={streamer.img}
                        alt={streamer.username}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div className="absolute top-1 left-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black text-white ${getGenderColor(streamer.gender)}`}>
                            {streamer.gender.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="p-3 flex flex-col justify-between flex-grow min-w-0">
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-tight truncate">{streamer.username}</h3>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1">
                            <div className="flex items-center gap-1" title="Viewers"><Users size={12} /><span>{formatNumber(streamer.num_users)}</span></div>
                            <div className="flex items-center gap-1" title="Age"><User size={12} /><span>{streamer.display_age}</span></div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleProfileClick}
                            className="h-8 px-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all active:scale-95"
                            title="View Profile & Archives"
                        >
                            <UserCircle size={16} />
                        </button>
                        <button
                            onClick={handleAddStream}
                            className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-all active:scale-95"
                            title="Add to Grid"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});