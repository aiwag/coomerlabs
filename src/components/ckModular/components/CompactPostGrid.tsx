import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ImageOff } from 'lucide-react';
import type { Post } from '../types';
import { COOMER_SERVICES, isVideoFile } from '../constants';
import { MediaComponent } from './MediaComponent';
import { OptimizedImage } from './OptimizedImage';

// --- HOVER PREVIEW COMPONENT ---
const HoverPreview = ({
  post,
  enabled,
  mousePosition,
  service
}: {
  post: Post;
  enabled: boolean;
  mousePosition: { x: number; y: number };
  service: string;
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const getMediaUrl = (path: string, svc: string) => {
    if (COOMER_SERVICES.includes(svc)) {
      return `https://coomer.st${path}`;
    } else {
      return `https://kemono.cr${path}`;
    }
  };

  const mediaUrl = post.file ? getMediaUrl(post.file.path, service) :
    post.attachments.length > 0 ? getMediaUrl(post.attachments[0].path, service) : null;

  useEffect(() => {
    if (!enabled || !mediaUrl) return;

    const updatePosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const previewWidth = Math.min(viewportWidth * 0.7, 900);
      const previewHeight = Math.min(viewportHeight * 0.8, 700);

      let left = mousePosition.x + 20;
      let top = mousePosition.y - previewHeight / 2;

      if (left + previewWidth > viewportWidth) {
        left = mousePosition.x - previewWidth - 20;
      }

      if (top < 10) {
        top = 10;
      } else if (top + previewHeight > viewportHeight - 10) {
        top = viewportHeight - previewHeight - 10;
      }

      setPosition({ top, left, width: previewWidth, height: previewHeight });
    };

    updatePosition();

    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, mousePosition, mediaUrl]);

  useEffect(() => {
    if (enabled && mediaUrl) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [enabled, mediaUrl]);

  if (!enabled || !isVisible || !mediaUrl) return null;

  const isVideo = isVideoFile(post.file?.name) || isVideoFile(post.attachments?.[0]?.name);

  return (
    <div
      className="fixed z-50 glass-card rounded-lg shadow-2xl overflow-hidden border border-gray-800"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
      }}
    >
      {isVideo ? (
        <video
          src={mediaUrl}
          className="w-full h-full"
          autoPlay
          muted
          loop
        />
      ) : (
        <OptimizedImage
          src={mediaUrl}
          alt={`Preview of ${post.id}`}
          className="w-full h-full"
          objectFit="cover"
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent glass-card p-2 text-white">
        <p className="text-sm font-semibold truncate">{post.title}</p>
      </div>
    </div>
  );
};

// --- COMPACT POST GRID ---
export const CompactPostGrid = React.memo(({
  posts,
  onPostClick,
  service,
  selectedPosts,
  showSelection,
  gridColumns = 4,
  onLoadMore,
  hasMore
}: {
  posts: Post[];
  onPostClick: (post: Post, index: number) => void;
  service: string;
  selectedPosts: Set<string>;
  showSelection: boolean;
  gridColumns?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) => {
  const [hoveredPost, setHoveredPost] = useState<Post | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoverPreviewEnabled] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll for posts
  useEffect(() => {
    if (!loadMoreRef.current || !onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [onLoadMore, hasMore]);

  // Track mouse position for hover preview (only when enabled)
  useEffect(() => {
    if (!hoverPreviewEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hoverPreviewEnabled]);

  const getPostMedia = useMemo(() => (post: Post) => {
    const baseUrl = COOMER_SERVICES.includes(service) ? 'https://coomer.st' : 'https://kemono.cr';

    if (post.file) {
      return {
        url: `${baseUrl}${post.file.path}`,
        type: isVideoFile(post.file.name) ? 'video' as const : 'image' as const,
        name: post.file.name
      };
    }

    if (post.attachments && post.attachments.length > 0) {
      return {
        url: `${baseUrl}${post.attachments[0].path}`,
        type: isVideoFile(post.attachments[0].name) ? 'video' as const : 'image' as const,
        name: post.attachments[0].name
      };
    }

    return null;
  }, [service]);

  return (
    <>
      <div
        className="grid gap-1 w-full"
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          contain: 'layout style paint'
        }}
      >
        {posts.map((post, index) => {
          const media = getPostMedia(post);
          const isSelected = selectedPosts.has(post.id);
          const hasMultiple = post.attachments && post.attachments.length > 0;

          return (
            <div
              key={post.id}
              className={`relative aspect-square overflow-hidden rounded-lg cursor-pointer group transition-transform duration-300 hover:scale-105 ${showSelection && isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
              onClick={() => onPostClick(post, index)}
              onMouseEnter={() => setHoveredPost(post)}
              onMouseLeave={() => setHoveredPost(null)}
            >
              {showSelection && (
                <div className="absolute top-2 left-2 z-10">
                  <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${isSelected ? 'bg-blue-500' : 'bg-black/50'
                    }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {hasMultiple && (
                <div className="absolute top-2 right-2 z-10 glass-card rounded-full px-1.5 py-0.5">
                  <span className="text-xs text-white">+{post.attachments.length}</span>
                </div>
              )}

              {media ? (
                <MediaComponent
                  src={media.url}
                  alt={post.title}
                  type={media.type}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <ImageOff size={24} className="text-gray-600" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs font-medium truncate">{post.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && onLoadMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Hover Preview */}
      {hoverPreviewEnabled && hoveredPost && (
        <HoverPreview
          post={hoveredPost}
          enabled={hoverPreviewEnabled}
          mousePosition={mousePosition}
          service={service}
        />
      )}
    </>
  );
});

CompactPostGrid.displayName = 'CompactPostGrid';
