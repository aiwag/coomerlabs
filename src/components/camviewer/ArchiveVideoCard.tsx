import React, { useState, useRef } from 'react';
import { Play, Clock, Eye, Calendar, ExternalLink } from 'lucide-react';
import { ArchiveVideo } from '@/services/archivebateService';

interface ArchiveVideoCardProps {
  video: ArchiveVideo;
  onPlay?: (video: ArchiveVideo) => void;
}

export const ArchiveVideoCard = React.memo(({ video, onPlay }: ArchiveVideoCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (onPlay) {
      onPlay(video);
    } else if (video.embedUrl) {
      // Default behavior: open embed URL
      window.open(video.embedUrl, '_blank');
    } else if (video.pageUrl) {
      window.open(video.pageUrl, '_blank');
    }
  };

  return (
    <div
      ref={videoRef}
      className="glass-card rounded-xl overflow-hidden cursor-pointer group hover:border-cyan-500/50 transition-all duration-300"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black/50">
        {!imageError && video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
            <Play size={32} className="text-cyan-400" />
          </div>
        )}

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-sm text-xs font-medium text-white">
            {video.duration}
          </div>
        )}

        {/* Play Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-cyan-500/80 flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
            <Play size={24} className="text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-white line-clamp-2 mb-2 group-hover:text-cyan-400 transition-colors">
          {video.title}
        </h4>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          {video.views && (
            <div className="flex items-center gap-1" title="Views">
              <Eye size={12} />
              <span>{video.views}</span>
            </div>
          )}
          {video.date && (
            <div className="flex items-center gap-1" title="Date">
              <Calendar size={12} />
              <span>{video.date}</span>
            </div>
          )}
        </div>

        {/* External Link */}
        {video.pageUrl && (
          <button
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              window.open(video.pageUrl, '_blank');
            }}
          >
            <ExternalLink size={12} />
            <span>Open on ArchiveBate</span>
          </button>
        )}
      </div>
    </div>
  );
});

ArchiveVideoCard.displayName = 'ArchiveVideoCard';
