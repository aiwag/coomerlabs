import React, { useState, useRef } from 'react';
import { ImageOff, PlayCircle } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

// --- MEDIA COMPONENT (Handles both images and videos) ---
export const MediaComponent = React.memo(({
  src,
  alt,
  className,
  type,
  onLoad,
  onError,
  style,
  objectFit = 'cover',
  priority = false
}: {
  src: string;
  alt: string;
  className?: string;
  type: 'image' | 'video';
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill';
  priority?: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (type === 'video') {
    return (
      <>
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`} style={style}>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          src={src}
          className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{ ...style, objectFit }}
          onLoadedData={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onError={() => {
            setIsError(true);
            setIsLoading(false);
            onError?.();
          }}
          muted
          loop
          playsInline
          onMouseEnter={(e) => {
            e.currentTarget.play().catch(() => { });
          }}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
          }}
        />
        {isError && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`} style={style}>
            <ImageOff size={24} className="text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
          <PlayCircle size={12} className="text-white" />
        </div>
      </>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={onError}
      style={style}
      objectFit={objectFit}
      priority={priority}
    />
  );
});

MediaComponent.displayName = 'MediaComponent';
