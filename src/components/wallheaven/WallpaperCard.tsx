// Wallheaven - Glassmorphic WallpaperCard Component
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, Download, ExternalLink, Monitor, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { toast } from 'react-hot-toast';
import { Wallpaper } from './types';
import { getWallpaperUrl, downloadWallpaper } from './api';
import { useWallheavenSettings } from './hooks';

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  index: number;
  onWallpaperClick: (wallpaper: Wallpaper) => void;
}

export const WallpaperCard = React.memo<WallpaperCardProps>(({ wallpaper, index, onWallpaperClick }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '400px',
  });

  const { showInfo } = useWallheavenSettings();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await downloadWallpaper(wallpaper);
      toast('Download started');
    } catch (error) {
      toast('Failed to download');
    } finally {
      setIsDownloading(false);
    }
  }, [wallpaper]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
  }, [isLiked]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative liquid-card-dark overflow-hidden cursor-pointer"
      style={{ aspectRatio: `${wallpaper.width}/${wallpaper.height}` }}
      onClick={() => onWallpaperClick(wallpaper)}
    >
      {/* Image */}
      <div className="absolute inset-0 bg-black/50">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        )}

        <img
          src={getWallpaperUrl(wallpaper, 'thumb')}
          alt={wallpaper.id}
          className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Purity Badge */}
        <div className="absolute top-2 left-2">
          {wallpaper.purity === 'sfw' && (
            <div className="px-2 py-1 rounded-full bg-green-500/80 backdrop-blur-sm">
              <span className="text-[9px] font-bold text-white uppercase">SFW</span>
            </div>
          )}
          {wallpaper.purity === 'sketchy' && (
            <div className="px-2 py-1 rounded-full bg-yellow-500/80 backdrop-blur-sm">
              <span className="text-[9px] font-bold text-white uppercase">Sketchy</span>
            </div>
          )}
          {wallpaper.purity === 'nsfw' && (
            <div className="px-2 py-1 rounded-full bg-red-500/80 backdrop-blur-sm">
              <span className="text-[9px] font-bold text-white uppercase">NSFW</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Overlay - Bottom */}
      {showInfo && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Monitor size={12} className="text-white/60" />
                <span className="font-medium">{wallpaper.resolution}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye size={12} className="text-white/60" />
                <span className="font-medium">{formatNumber(wallpaper.views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={12} className="text-white/60" />
                <span className="font-medium">{formatNumber(wallpaper.favorites)}</span>
              </div>
            </div>
            <a
              href={`https://wallhaven.cc/w/${wallpaper.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} className="text-white/80" />
            </a>
          </div>
        </div>
      )}

      {/* Action Buttons - Top Right */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          disabled={isDownloading}
          className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
        >
          <Heart size={14} className={isLiked ? 'fill-red-500 text-red-500' : 'text-white/80'} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDownload}
          disabled={isDownloading}
          className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
        >
          {isDownloading ? (
            <Loader2 size={14} className="text-white/80 animate-spin" />
          ) : (
            <Download size={14} className="text-white/80" />
          )}
        </motion.button>
      </div>

      {/* Zoom Indicator on Hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="transform scale-90 group-hover:scale-100 transition-transform duration-300">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl">
            <Monitor className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

WallpaperCard.displayName = 'WallpaperCard';

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
