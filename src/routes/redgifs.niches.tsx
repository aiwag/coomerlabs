// RedGifs - Niches Tab
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Hash, Users, Film } from 'lucide-react';
import * as api from '../components/redgifs/api';
import { Niche } from '../components/redgifs/types';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const NicheCard = ({ niche }: { niche: Niche }) => (
  <div className="group relative overflow-hidden rounded-xl cursor-pointer border border-white/5 hover:border-pink-500/30 transition-all duration-300 hover:scale-[1.02]">
    {/* Thumbnail */}
    <div className="aspect-video relative overflow-hidden bg-white/5">
      {niche.thumbnail ? (
        <img
          src={niche.thumbnail}
          alt={niche.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Hash size={32} className="text-white/10" />
        </div>
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    </div>

    {/* Info */}
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <h3 className="text-sm font-bold text-white truncate mb-1">{niche.name}</h3>
      <div className="flex items-center gap-3 text-[10px] text-white/50">
        <div className="flex items-center gap-1">
          <Users size={10} />
          <span>{formatNumber(niche.subscribers)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Film size={10} />
          <span>{formatNumber(niche.gifs)}</span>
        </div>
      </div>
    </div>
  </div>
);

const RedgifsNiches = () => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['redgifs-niches'],
    queryFn: () => api.fetchNiches(),
    staleTime: 10 * 60 * 1000,
  });

  const niches = data?.niches || [];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
          <p className="text-white/60 text-sm font-medium">Loading niches...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-40">
          <p className="text-red-400 mb-4">Failed to load niches</p>
          <button
            onClick={() => refetch()}
            className="liquid-button px-6 py-3 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
          >
            <RefreshCw size={16} />
            <span className="text-sm font-bold">Retry</span>
          </button>
        </div>
      )}

      {!error && niches.length > 0 && (
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {niches.map((niche: Niche) => (
              <NicheCard key={niche.id} niche={niche} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && niches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40">
          <Hash size={48} className="text-white/10 mb-4" />
          <p className="text-white/40 text-sm">No niches found</p>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute('/redgifs/niches')({
  component: RedgifsNiches,
});
