// RedGifs v3 - Lightweight Poster-Only Card (no video per card)
import React, { useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Play, Heart, Eye, Volume2 } from 'lucide-react';
import { GifItem } from './types';
import { getPosterUrl } from './api';

interface GifCardProps {
  gif: GifItem;
  index: number;
  onGifClick: (gif: GifItem, index: number) => void;
  onHover?: (gif: GifItem, rect: DOMRect) => void;
  onLeave?: () => void;
}

export const GifCard = React.memo<GifCardProps>(({ gif, index, onGifClick, onHover, onLeave }) => {
  const handleClick = useCallback(() => onGifClick(gif, index), [gif, index, onGifClick]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (onHover) onHover(gif, e.currentTarget.getBoundingClientRect());
  }, [gif, onHover]);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      className="group relative overflow-hidden cursor-pointer h-full hover:z-10 hover:ring-1 hover:ring-pink-500/50 transition-all duration-200"
      style={{ backgroundColor: gif.avgColor || '#111' }}
    >
      {/* Poster image only — no <video> in grid */}
      <img
        src={getPosterUrl(gif)}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110"
      />

      {/* Audio badge */}
      {gif.hasAudio && (
        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60">
          <Volume2 size={10} className="text-white/80" />
        </div>
      )}

      {/* Verified badge */}
      {gif.verified && (
        <div className="absolute top-1.5 left-1.5">
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-[7px] font-bold text-white uppercase">
            ✓ Verified
          </div>
        </div>
      )}

      {/* Play overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
          <Play className="w-6 h-6 text-white fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <div className="flex items-center gap-1">
            <Eye size={9} className="text-white/50" />
            <span className="text-[9px] font-medium">{formatNumber(gif.views)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={9} className="text-white/50" />
            <span className="text-[9px] font-medium">{formatNumber(gif.likes)}</span>
          </div>
          {gif.duration && (
            <span className="text-[8px] px-1 py-px rounded bg-black/50 font-medium ml-auto">
              {formatDuration(gif.duration)}
            </span>
          )}
        </div>
        {gif.userName && (
          <Link
            to="/redgifs/users/$username"
            params={{ username: gif.userName }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="block text-[8px] text-white/40 hover:text-pink-400 font-bold mt-0.5 truncate transition-colors no-underline"
          >@{gif.userName}</Link>
        )}
      </div>
    </div>
  );
});

GifCard.displayName = 'GifCard';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
