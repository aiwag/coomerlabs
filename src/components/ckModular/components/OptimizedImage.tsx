import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

// --- PERFORMANCE-OPTIMIZED IMAGE COMPONENT ---
export const OptimizedImage = React.memo(({
  src,
  alt,
  className,
  onLoad,
  onError,
  style,
  objectFit = 'cover',
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill';
  priority?: boolean;
}) => {
  const [isError, setIsError] = useState(false);

  if (isError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-800 ${className}`} style={style}>
        <ImageOff size={24} className="text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ ...style, objectFit }}
      loading="lazy"
      decoding="async"
      onLoad={onLoad}
      onError={() => {
        setIsError(true);
        onError?.();
      }}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';
