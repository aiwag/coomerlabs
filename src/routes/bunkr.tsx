import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  fetchTrending,
  searchAlbums,
  fetchAlbumDetail,
  parseAlbumHtml,
  type BunkrAlbum,
  type BunkrAlbumDetail,
  type BunkrFile,
} from '@/components/bunkr/api';
import { analyzeSingleFrame, initModels, type ShotPlan, type Detection, DETECTION_COLORS } from '../lib/smartZoom';
import {
  Search,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
  Grid,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  FileVideo,
  FileImage,
  X,
  Filter,
  Play,
  Pause,
  ZoomIn,
  Film,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Keyboard, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';

export const Route = createFileRoute('/bunkr')({
  component: BunkrPage,
});

/* ═══════════════════════════════════ Main Page ═══════════════════════════════════ */

function BunkrPage() {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<{ slug: string; title: string } | null>(null);

  const {
    data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['bunkr-index', query],
    queryFn: ({ pageParam = 1 }) =>
      query ? searchAlbums(query, pageParam) : fetchTrending(pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length > 0 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    enabled: !selectedAlbum,
  });

  const allAlbums = useMemo(() => {
    const flat = data?.pages.flat() || [];
    const seen = new Map<string, BunkrAlbum>();
    for (const a of flat) { if (!seen.has(a.id)) seen.set(a.id, a); }
    return [...seen.values()];
  }, [data]);

  const { data: albumDetail, isLoading: albumLoading } = useQuery({
    queryKey: ['bunkr-album', selectedAlbum?.slug],
    queryFn: () => fetchAlbumDetail(selectedAlbum!.slug),
    enabled: !!selectedAlbum,
    staleTime: 10 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setSelectedAlbum(null);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--app-bg)] w-full text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 h-14 border-b border-white/5 flex items-center justify-between px-5 bg-white/[0.02] gap-4">
        <div className="flex items-center gap-3">
          {selectedAlbum && (
            <button onClick={() => setSelectedAlbum(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft size={16} className="text-white/60" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <HardDrive size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              {selectedAlbum ? (albumDetail?.title?.slice(0, 60) || selectedAlbum.title || 'Loading...') : 'Bunkr'}
            </h1>
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">
              {selectedAlbum
                ? `${albumDetail?.fileCount || '...'} files${albumDetail?.size ? ` · ${albumDetail.size}` : ''}`
                : query ? `Search: "${query}"` : `${allAlbums.length} albums · Trending`}
            </p>
          </div>
        </div>
        {!selectedAlbum && (
          <form onSubmit={handleSearch} className="relative w-64">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input type="text" placeholder="Search albums..." value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-black/40 border border-white/8 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-violet-500/40 transition-colors" />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setSearchInput(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"><X size={12} /></button>
            )}
          </form>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedAlbum ? (
          <AlbumDetailView detail={albumDetail} loading={albumLoading} />
        ) : (
          <VirtualAlbumGrid
            albums={allAlbums} loading={isLoading} onOpenAlbum={(a) => setSelectedAlbum(a)}
            hasNextPage={!!hasNextPage} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════ Virtual Album Grid ═══════════════════════════════════ */

function VirtualAlbumGrid({
  albums, loading, onOpenAlbum, hasNextPage, isFetchingNextPage, fetchNextPage,
}: {
  albums: BunkrAlbum[]; loading: boolean;
  onOpenAlbum: (album: { slug: string; title: string }) => void;
  hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setCols(w > 1400 ? 6 : w > 1100 ? 5 : w > 800 ? 4 : w > 500 ? 3 : 2);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const rows = useMemo(() => {
    const r: BunkrAlbum[][] = [];
    for (let i = 0; i < albums.length; i += cols) r.push(albums.slice(i, i + cols));
    return r;
  }, [albums, cols]);

  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240,
    overscan: 3,
  });

  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    const last = items[items.length - 1];
    if (last && last.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [virtualizer.getVirtualItems(), rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (loading && albums.length === 0) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;
  }
  if (!loading && albums.length === 0) {
    return <div className="flex flex-col items-center justify-center h-64 text-white/25"><HardDrive size={48} className="mb-3 opacity-40" /><p className="text-sm">No albums found</p></div>;
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto scrollbar-hide">
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((vRow) => {
          if (vRow.index >= rows.length) {
            return <div key="sentinel" className="absolute top-0 left-0 w-full flex justify-center py-4"
              style={{ transform: `translateY(${vRow.start}px)`, height: vRow.size }}>
              {isFetchingNextPage && <Loader2 className="w-5 h-5 animate-spin text-violet-500/60" />}
            </div>;
          }
          return (
            <div key={vRow.index} className="absolute top-0 left-0 w-full px-4 py-1.5"
              style={{ transform: `translateY(${vRow.start}px)`, height: vRow.size,
                display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem' }}>
              {rows[vRow.index].map((album, ci) => (
                <AnimatedAlbumCard key={`${vRow.index}-${ci}`} album={album} onOpen={onOpenAlbum} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════ Animated Album Card (hover preview) ═══════════════════ */

// Throttled thumbnail resolver — max 2 concurrent, 1 thumb per card
const thumbCache = new Map<string, string>();
const thumbQueue: { slug: string; resolve: (url: string) => void }[] = [];
let thumbActive = 0;
const THUMB_CONCURRENCY = 2;

function processThumbQueue() {
  while (thumbActive < THUMB_CONCURRENCY && thumbQueue.length > 0) {
    const item = thumbQueue.shift()!;
    if (thumbCache.has(item.slug)) { item.resolve(thumbCache.get(item.slug)!); continue; }
    thumbActive++;
    // @ts-ignore
    window.electronAPI?.bunkr?.fetch(`https://bunkr.cr/a/${item.slug}`)
      .then((result: any) => {
        if (result?.success && result?.data) {
          const detail = parseAlbumHtml(result.data);
          const first = detail.files.find((f: BunkrFile) => f.thumb && f.thumb.startsWith('http'));
          if (first) {
            thumbCache.set(item.slug, first.thumb);
            item.resolve(first.thumb);
          }
        }
      })
      .catch(() => {})
      .finally(() => { thumbActive--; setTimeout(processThumbQueue, 500); });
  }
}

function requestThumb(slug: string): Promise<string> {
  if (thumbCache.has(slug)) return Promise.resolve(thumbCache.get(slug)!);
  return new Promise(resolve => { thumbQueue.push({ slug, resolve }); processThumbQueue(); });
}

function AnimatedAlbumCard({ album, onOpen }: { album: BunkrAlbum; onOpen: (a: { slug: string; title: string }) => void }) {
  const [hovering, setHovering] = useState(false);
  const [thumbIdx, setThumbIdx] = useState(0);
  const [thumb, setThumb] = useState<string>(thumbCache.get(album.slug) || album.thumb || '');
  const intervalRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLButtonElement>(null);

  // Only resolve thumb when card is visible (IntersectionObserver)
  useEffect(() => {
    if (thumb || album.thumb) return;
    const el = cardRef.current;
    if (!el) return;

    let cancelled = false;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !cancelled) {
        obs.disconnect();
        requestThumb(album.slug).then(url => { if (!cancelled) setThumb(url); });
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => { cancelled = true; obs.disconnect(); };
  }, [album.slug, album.thumb, thumb]);

  const thumbs = thumb ? [thumb] : [];

  useEffect(() => {
    if (hovering && thumbs.length > 1) {
      intervalRef.current = window.setInterval(() => {
        setThumbIdx(prev => (prev + 1) % thumbs.length);
      }, 800);
    } else {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      setThumbIdx(0);
    }
    return () => { if (intervalRef.current !== null) window.clearInterval(intervalRef.current); };
  }, [hovering, thumbs.length]);

  const hasImages = album.imageCount > 0;
  const hasVideos = album.videoCount > 0;

  return (
    <button
      ref={cardRef}
      onClick={() => onOpen({ slug: album.slug, title: album.title })}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/10 text-left cursor-pointer h-full"
    >
      {/* Thumbnail — animated on hover */}
      <div className="absolute inset-0 overflow-hidden">
        {thumbs.length > 0 ? (
          <>
            {thumbs.map((t, i) => (
              <img key={i} src={t} alt="" loading="lazy" referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: i === thumbIdx ? 1 : 0 }} />
            ))}
            {/* Animated progress dots */}
            {hovering && thumbs.length > 1 && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {thumbs.map((_, i) => (
                  <div key={i} className={`h-0.5 rounded-full transition-all duration-300 ${
                    i === thumbIdx ? 'w-4 bg-white/90' : 'w-1.5 bg-white/30'
                  }`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <HardDrive size={28} className="text-white/10" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

      {/* Content type badge */}
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        {(hasVideos || album.fileCount > 0) && (
          <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider backdrop-blur-sm ${
            hasImages && hasVideos ? 'bg-gradient-to-r from-violet-500/80 to-pink-500/80 text-white' :
            hasVideos ? 'bg-violet-500/80 text-white' : 'bg-pink-500/80 text-white'
          }`}>
            {hasImages && hasVideos ? '📷+🎬' : hasVideos ? '🎬 Video' : '📷 Image'}
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <h3 className="text-[11px] font-semibold text-white leading-tight line-clamp-2 drop-shadow-md mb-1">{album.title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {album.fileCount > 0 && <span className="text-[9px] text-violet-300/70 font-bold flex items-center gap-0.5"><HardDrive size={8} /> {album.fileCount}</span>}
          {album.size && <span className="text-[8px] text-white/25 font-bold">{album.size}</span>}
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════ Album Detail ═══════════════════════════════════ */

type FileFilter = 'all' | 'image' | 'video';
type ViewMode = 'grid' | 'slideshow' | 'cinema';

function AlbumDetailView({ detail, loading }: { detail: BunkrAlbumDetail | null | undefined; loading: boolean }) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filter, setFilter] = useState<FileFilter>('all');

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;
  if (!detail || detail.files.length === 0) return <div className="flex flex-col items-center justify-center h-64 text-white/25"><HardDrive size={48} className="mb-3 opacity-40" /><p className="text-sm">Album empty or not found</p></div>;

  const allFiles = detail.files;
  const imageFiles = allFiles.filter(f => f.type === 'image');
  const videoFiles = allFiles.filter(f => f.type === 'video');
  const filteredFiles = filter === 'all' ? allFiles : filter === 'image' ? imageFiles : videoFiles;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="font-bold text-violet-400">{allFiles.length}</span> files
          {imageFiles.length > 0 && <span className="flex items-center gap-1 text-white/25"><FileImage size={12} /> {imageFiles.length}</span>}
          {videoFiles.length > 0 && <span className="flex items-center gap-1 text-white/25"><FileVideo size={12} /> {videoFiles.length}</span>}
          {detail.size && <span className="text-white/20">· {detail.size}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Filter pills */}
          <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 mr-2">
            {([
              { key: 'all' as FileFilter, label: 'All', count: allFiles.length, icon: Filter },
              { key: 'image' as FileFilter, label: 'Images', count: imageFiles.length, icon: FileImage },
              { key: 'video' as FileFilter, label: 'Videos', count: videoFiles.length, icon: FileVideo },
            ]).map(({ key, label, count, icon: Icon }) => count > 0 && (
              <button key={key} onClick={() => { setFilter(key); setCurrentIdx(0); }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                  filter === key ? 'bg-violet-500/20 text-violet-400' : 'text-white/30 hover:text-white/50 hover:bg-white/5'}`}>
                <Icon size={10} /> {label} <span className="text-[8px] opacity-60">({count})</span>
              </button>
            ))}
          </div>
          {/* View modes */}
          {([
            { mode: 'grid' as ViewMode, icon: Grid, label: 'Grid' },
            { mode: 'slideshow' as ViewMode, icon: Maximize2, label: 'Slideshow' },
            { mode: 'cinema' as ViewMode, icon: Film, label: 'Cinema' },
          ]).map(({ mode, icon: Icon }) => (
            <button key={mode} onClick={() => { setViewMode(mode); setCurrentIdx(0); }}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === mode ? 'bg-violet-500/20 text-violet-400' : 'text-white/30 hover:text-white/50'}`}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="w-full" style={{ columns: 'auto 220px', columnGap: '0.5rem' }}>
          {filteredFiles.map((file, i) => (
            <button key={`${file.name}-${i}`} onClick={() => { setCurrentIdx(i); setViewMode('slideshow'); }}
              className="mb-2 block w-full rounded-lg overflow-hidden break-inside-avoid cursor-pointer group relative">
              {file.thumb ? (
                <img src={file.thumb} alt={file.name} loading="lazy" referrerPolicy="no-referrer"
                  className="w-full object-cover rounded-lg ring-1 ring-white/5 group-hover:ring-violet-500/30 transition-all duration-300 group-hover:brightness-110" />
              ) : (
                <div className="w-full h-32 bg-white/5 rounded-lg flex items-center justify-center ring-1 ring-white/5">
                  {file.type === 'video' ? <FileVideo size={24} className="text-white/10" /> : <FileImage size={24} className="text-white/10" />}
                </div>
              )}
              <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase backdrop-blur-sm ${
                file.type === 'video' ? 'bg-violet-500/80 text-white' : 'bg-pink-500/80 text-white'}`}>
                {file.type === 'video' && <Play size={7} className="inline mr-0.5" />}{file.type}
              </span>
              {file.size && <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[8px] font-bold text-white/50 backdrop-blur-sm">{file.size}</span>}
            </button>
          ))}
        </div>
      ) : viewMode === 'cinema' ? (
        <CinemaViewer files={filteredFiles.filter(f => f.type === 'image')} onClose={() => setViewMode('grid')} />
      ) : (
        <SlideshowViewer files={filteredFiles} currentIdx={currentIdx} setCurrentIdx={setCurrentIdx} onClose={() => setViewMode('grid')} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════ Cinema Viewer ═══════════════════════════════════ */
/* Plays images like a video — auto-advance with mouse interactions */

function CinemaViewer({ files, onClose }: { files: BunkrFile[]; onClose: () => void }) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [fps, setFps] = useState(2); // frames per second
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartFrame, setDragStartFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const mouseInRef = useRef(false);

  const total = files.length;

  // AI Cinema Director: state declarations (needed before playback timer)
  const [shotPlans, setShotPlans] = useState<Map<string, ShotPlan>>(new Map());
  const [aiProgress, setAiProgress] = useState<{ done: number; total: number } | null>(null);
  const [aiReady, setAiReady] = useState(false);
  const [showDetections, setShowDetections] = useState(false);
  const aiAbortRef = useRef({ aborted: false });

  // Auto-play with per-frame duration from ShotPlan
  useEffect(() => {
    if (playing && !isDragging && !zoomed) {
      const currentUrl = files[frameIdx]?.thumb || '';
      const shot = shotPlans.get(currentUrl);
      const frameDuration = shot?.duration ?? (1000 / fps);

      intervalRef.current = window.setTimeout(() => {
        setFrameIdx(prev => {
          if (prev >= total - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, frameDuration);
    } else {
      if (intervalRef.current !== null) window.clearTimeout(intervalRef.current);
    }
    return () => { if (intervalRef.current !== null) window.clearTimeout(intervalRef.current); };
  }, [playing, fps, total, isDragging, zoomed, frameIdx, shotPlans, files]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFrameIdx(p => Math.min(p + 1, total - 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFrameIdx(p => Math.max(p - 1, 0)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setFps(p => Math.min(p + 1, 30)); }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFps(p => Math.max(p - 1, 1)); }
      if (e.key === 'Escape') onClose();
      if (e.key === 'z' || e.key === 'Z') setZoomed(z => !z);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [total, onClose]);

  // Mouse move on image → slow down/pause
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const frameDelta = Math.round(dx / 8); // 8px per frame
      const newFrame = Math.max(0, Math.min(total - 1, dragStartFrame + frameDelta));
      setFrameIdx(newFrame);
    } else if (zoomed) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setZoomPos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    }
  }, [isDragging, dragStartX, dragStartFrame, total, zoomed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartFrame(frameIdx);
    setPlaying(false);
  }, [frameIdx]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse enter/leave to auto-pause/resume
  const handleMouseEnter = () => { mouseInRef.current = true; };
  const handleMouseLeave = () => {
    mouseInRef.current = false;
    setIsDragging(false);
  };

  // Timeline scrub
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = (e.clientX - rect.left) / rect.width;
    setFrameIdx(Math.max(0, Math.min(total - 1, Math.round(pct * (total - 1)))));
  }, [total]);

  const progress = total > 1 ? frameIdx / (total - 1) : 0;
  const currentFile = files[frameIdx];

  // Ken Burns: random fallback per-frame
  const randomKenBurns = useMemo(() => {
    return files.map(() => ({
      tx: (Math.random() - 0.5) * 3,
      ty: (Math.random() - 0.5) * 2,
      scale: 1.0 + Math.random() * 0.08,
    }));
  }, [files]);

  // AI Cinema Director: init models once, analyze frames lazily
  useEffect(() => {
    initModels().then(() => setAiReady(true)).catch(() => {});
  }, []);

  // Analyze current frame on-demand (lazy, cached)
  useEffect(() => {
    if (!aiReady || !currentFile?.thumb) return;
    let cancelled = false;
    const url = currentFile.thumb;

    analyzeSingleFrame(url).then((shot) => {
      if (!cancelled) {
        setShotPlans(prev => {
          const next = new Map(prev);
          next.set(url, shot);
          return next;
        });
      }
    });

    // Pre-analyze next 2 frames ahead
    if (files.length > 1) {
      const nextIdx = (frameIdx + 1) % files.length;
      const nextIdx2 = (frameIdx + 2) % files.length;
      if (files[nextIdx]?.thumb) analyzeSingleFrame(files[nextIdx].thumb).catch(() => {});
      if (files[nextIdx2]?.thumb) analyzeSingleFrame(files[nextIdx2].thumb).catch(() => {});
    }

    return () => { cancelled = true; };
  }, [aiReady, frameIdx, currentFile, files]);

  // Crossfade: alternate between two image layers
  const [showA, setShowA] = useState(true);
  const prevFrameRef = useRef(0);
  useEffect(() => {
    if (frameIdx !== prevFrameRef.current) {
      setShowA(prev => !prev);
      prevFrameRef.current = frameIdx;
    }
  }, [frameIdx]);

  const currentSrc = currentFile?.thumb || '';
  const prevSrc = files[prevFrameRef.current]?.thumb || currentSrc;

  // Compute Ken Burns: AI ShotPlan or random fallback
  const currentShot = shotPlans.get(currentSrc);
  const kb = useMemo(() => {
    if (zoomed) return null;
    if (currentShot) {
      return {
        originX: currentShot.originX,
        originY: currentShot.originY,
        scale: currentShot.scale,
        easing: currentShot.easing,
        duration: currentShot.duration,
        ai: true,
        type: currentShot.type,
      };
    }
    const rk = randomKenBurns[frameIdx];
    return rk ? { originX: 50 + rk.tx * 10, originY: 50 + rk.ty * 10, scale: rk.scale, easing: 'cubic-bezier(0.25,0.1,0.25,1)', duration: 5000, ai: false, type: 'establishing' as const } : null;
  }, [zoomed, currentShot, randomKenBurns, frameIdx]);

  if (total === 0) {
    return <div className="text-center text-white/30 py-12">No images to play</div>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Control bar */}
      <div className="flex items-center gap-3 w-full px-2">
        <button onClick={onClose} className="text-[10px] font-bold text-white/30 hover:text-white/50 flex items-center gap-1">
          <Grid size={12} /> Grid
        </button>
        <button onClick={() => setPlaying(p => !p)}
          className="p-2 rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-colors">
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/30 font-mono">Speed:</span>
          {[1, 2, 4, 8, 15].map(f => (
            <button key={f} onClick={() => setFps(f)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-colors ${
                fps === f ? 'bg-violet-500/30 text-violet-400' : 'text-white/20 hover:text-white/40'}`}>
              {f}fps
            </button>
          ))}
        </div>
        <button onClick={() => setZoomed(z => !z)}
          className={`p-1.5 rounded-lg transition-colors ${zoomed ? 'bg-violet-500/20 text-violet-400' : 'text-white/30 hover:text-white/50'}`}>
          <ZoomIn size={14} />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono">{frameIdx + 1}/{total}</span>
          <span className="text-[9px] text-white/20 max-w-48 truncate">{currentFile?.name}</span>
        </div>
      </div>

      {/* ═══ Cinematic Theater ═══ */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-2xl overflow-hidden select-none border border-white/[0.03] ${
          isDragging ? 'cursor-grabbing' : zoomed ? 'cursor-crosshair' : 'cursor-grab'
        }`}
        style={{ height: 'calc(100vh - 200px)', background: '#000' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Preload */}
        {files.slice(frameIdx + 1, frameIdx + 4).map(f => (
          <link key={f.thumb} rel="preload" as="image" href={f.thumb} />
        ))}

        {/* Dual crossfade layers */}
        <img
          src={showA ? currentSrc : prevSrc}
          alt="" referrerPolicy="no-referrer" draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            opacity: showA ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
            ...(zoomed ? {
              transform: `scale(2.5)`,
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            } : kb ? {
              transform: `scale(${kb.scale})`,
              transformOrigin: `${kb.originX}% ${kb.originY}%`,
              transition: `opacity 0.6s ease-in-out, transform ${kb.duration}ms ${kb.easing}, transform-origin ${kb.duration}ms ${kb.easing}`,
            } : {}),
          }}
        />
        <img
          src={!showA ? currentSrc : prevSrc}
          alt="" referrerPolicy="no-referrer" draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            opacity: !showA ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
            ...(zoomed ? {
              transform: `scale(2.5)`,
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            } : kb ? {
              transform: `scale(${kb.scale})`,
              transformOrigin: `${kb.originX}% ${kb.originY}%`,
              transition: `opacity 0.6s ease-in-out, transform ${kb.duration}ms ${kb.easing}, transform-origin ${kb.duration}ms ${kb.easing}`,
            } : {}),
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />

        {/* Film grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
            animation: 'grain 0.5s steps(1) infinite',
          }} />

        {/* Letterbox bars */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-black to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black to-transparent pointer-events-none" />

        {/* Ambient inner shadow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,0.6)' }} />

        {/* Drag indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
              <ChevronLeft size={16} className="text-white/60" />
              <span className="text-sm font-bold text-white/80 font-mono">{frameIdx + 1}</span>
              <ChevronRight size={16} className="text-white/60" />
            </div>
          </div>
        )}

        {showDetections && !zoomed && (() => {
          const shot = shotPlans.get(currentSrc);
          const dets = shot?.detections || [];
          return dets.map((det, i) => {
            const color = DETECTION_COLORS[det.class] || '#fff';
            const left = (det.x - det.w / 2) * 100;
            const top = (det.y - det.h / 2) * 100;
            const width = det.w * 100;
            const height = det.h * 100;
            return (
              <div key={i} className="absolute pointer-events-none" style={{
                left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                border: `2px solid ${color}`, borderRadius: '4px', transition: 'all 0.3s ease',
              }}>
                <span className="absolute -top-4 left-0 text-[7px] font-bold px-1 rounded-sm" style={{
                  backgroundColor: color, color: '#000',
                }}>
                  {det.class.replace(/_/g, ' ')} {Math.round(det.confidence * 100)}%
                </span>
              </div>
            );
          });
        })()}

        {/* Status badges */}
        <div className="absolute top-5 left-5 flex items-center gap-2 pointer-events-none">
          {playing && (
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-[10px] text-violet-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" /> Cinema
              {kb?.ai && <span className="text-emerald-400 ml-1">🧠 {kb.type?.replace(/_/g, ' ')}</span>}
              {kb?.ai && <span className="text-white/40 ml-1">{(kb.duration / 1000).toFixed(1)}s</span>}
            </span>
          )}
          {zoomed && (
            <span className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-[10px] text-emerald-400 font-bold">
              🔍 2.5×
            </span>
          )}
          {aiProgress && aiProgress.done < aiProgress.total && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-[10px] text-amber-400 font-bold">
              🎬 Directing {aiProgress.done}/{aiProgress.total}
            </span>
          )}
        </div>

        {/* Detection toggle */}
        <button
          onClick={() => setShowDetections(d => !d)}
          className={`absolute top-5 right-5 p-2 rounded-full backdrop-blur-md transition-colors z-10 ${
            showDetections ? 'bg-emerald-500/20 text-emerald-400' : 'bg-black/40 text-white/30 hover:text-white/50'
          }`}
          title={showDetections ? 'Hide detections' : 'Show detections'}
        >
          {showDetections ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Film grain keyframe */}
      <style>{`@keyframes grain { 0%, 100% { transform: translate(0,0) } 10% { transform: translate(-1%,-1%) } 20% { transform: translate(1%,0) } 30% { transform: translate(0,1%) } 40% { transform: translate(-1%,1%) } 50% { transform: translate(1%,-1%) } 60% { transform: translate(-1%,0) } 70% { transform: translate(0,-1%) } 80% { transform: translate(1%,1%) } 90% { transform: translate(-1%,-1%) } }`}</style>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="w-full cursor-pointer group"
        onClick={handleTimelineClick}
      >
        {/* Progress bar */}
        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-2 group-hover:h-2 transition-all">
          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-[width] duration-75"
            style={{ width: `${progress * 100}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress * 100}% - 6px)` }} />
        </div>

        {/* Frame preview strip */}
        <div className="flex gap-px w-full h-12 rounded-lg overflow-hidden bg-black/30">
          {files.map((f, i) => (
            <div
              key={i}
              className={`flex-1 min-w-0 cursor-pointer transition-all duration-100 ${
                i === frameIdx ? 'ring-2 ring-violet-500 ring-inset z-10 scale-y-110' :
                i < frameIdx ? 'opacity-60' : 'opacity-30 hover:opacity-50'
              }`}
              onClick={(e) => { e.stopPropagation(); setFrameIdx(i); }}
              style={{ minWidth: total > 100 ? undefined : '4px' }}
            >
              {total <= 60 && f.thumb && (
                <img src={f.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" draggable={false} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════ Swiper Slideshow ═══════════════════════════════════ */

function SlideshowViewer({
  files, currentIdx, setCurrentIdx, onClose,
}: {
  files: BunkrFile[]; currentIdx: number;
  setCurrentIdx: (i: number) => void; onClose: () => void;
}) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const file = files[currentIdx];

  // Sync external currentIdx → swiper
  useEffect(() => {
    if (mainSwiper && !mainSwiper.destroyed && mainSwiper.activeIndex !== currentIdx) {
      mainSwiper.slideTo(currentIdx, 300);
    }
  }, [currentIdx, mainSwiper]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Info bar */}
      <div className="flex items-center gap-4 px-2">
        <button onClick={onClose} className="text-[10px] font-bold text-white/30 hover:text-white/50 flex items-center gap-1">
          <Grid size={12} /> Grid
        </button>
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
          file.type === 'video' ? 'bg-violet-500/20 text-violet-400' : 'bg-pink-500/20 text-pink-400'
        }`}>{file.type}</span>
        <span className="text-xs text-white/40 font-mono">{currentIdx + 1} / {files.length}</span>
        {file.name && <span className="text-[10px] text-white/20 max-w-sm truncate">{file.name}</span>}
        {file.size && <span className="text-[9px] text-white/15 font-mono ml-auto">{file.size}</span>}
      </div>

      {/* Main Swiper */}
      <div className="w-full rounded-xl overflow-hidden shadow-2xl shadow-black/40">
        <Swiper
          modules={[Navigation, Thumbs, Keyboard, EffectFade]}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          navigation
          keyboard={{ enabled: true }}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          initialSlide={currentIdx}
          onSwiper={setMainSwiper}
          onSlideChange={(s) => setCurrentIdx(s.activeIndex)}
          className="bunkr-main-swiper"
          style={{ '--swiper-navigation-color': '#a78bfa', '--swiper-navigation-size': '28px' } as React.CSSProperties}
        >
          {files.map((f, i) => (
            <SwiperSlide key={`main-${i}`}>
              <div className="flex items-center justify-center bg-black" style={{ minHeight: '65vh' }}>
                {f.type === 'video' ? (
                  <VideoSlide file={f} active={i === currentIdx} />
                ) : (
                  <img
                    src={f.url || f.thumb}
                    alt={f.name}
                    referrerPolicy="no-referrer"
                    loading={Math.abs(i - currentIdx) <= 2 ? 'eager' : 'lazy'}
                    className="max-h-[75vh] max-w-full object-contain select-none"
                    draggable={false}
                  />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Thumbs Swiper */}
      <div className="w-full px-2">
        <Swiper
          modules={[Thumbs]}
          onSwiper={setThumbsSwiper}
          slidesPerView="auto"
          spaceBetween={6}
          watchSlidesProgress
          className="bunkr-thumbs-swiper"
        >
          {files.map((f, i) => (
            <SwiperSlide key={`thumb-${i}`} style={{ width: '64px', height: '64px' }}>
              <div className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer transition-all duration-200 ${
                i === currentIdx
                  ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-black scale-105'
                  : 'opacity-50 hover:opacity-80'
              }`}>
                {f.thumb ? (
                  <img src={f.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    {f.type === 'video' ? <FileVideo size={12} className="text-white/20" /> : <FileImage size={12} className="text-white/20" />}
                  </div>
                )}
                {f.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play size={10} className="text-white/70 drop-shadow-lg" />
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════ Video Slide (Webview + Popup Blocking) ═══════════════════════════════════ */

function VideoSlide({ file, active }: { file: BunkrFile; active: boolean }) {
  const webviewRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const injectedRef = useRef(false);

  const filePageUrl = file.url || '';

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv || !active) return;
    injectedRef.current = false;

    const inject = () => {
      if (injectedRef.current) return;
      injectedRef.current = true;
      setLoaded(true);

      // Inject JS to block popups BEFORE any ad scripts run
      wv.executeJavaScript(`
        // Kill all popup mechanisms
        window.open = () => null;
        window.alert = () => {};
        window.confirm = () => false;
        window.prompt = () => null;

        // Block onclick handlers that open new windows  
        document.addEventListener('click', function(e) {
          const a = e.target.closest('a[target="_blank"], a[href*="coosync"], a[href*="wpadmngr"], a[href*="tinyns"]');
          if (a) { e.preventDefault(); e.stopPropagation(); }
        }, true);

        // Remove ad scripts and iframes
        document.querySelectorAll('script[src*="coosync"], script[src*="wpadmngr"], script[src*="tinyns"], script[src*="admpid"], iframe').forEach(el => el.remove());

        // Remove ad containers  
        document.querySelectorAll('[data-cl-spot], [data-admpid], [id*="spot_"], .live-indicator-container').forEach(el => el.remove());
      `).catch(() => {});

      // Inject CSS to hide everything except the video player
      wv.insertCSS(`
        header, footer, nav, .cont:not(:has(#player)),
        [data-cl-spot], [data-admpid], center > div,
        .ld-more, #load-more-btn, #related-files-grid,
        .files-album, div[style*="background: red"],
        .live-indicator-container, .breadcrumbs,
        #related-files, .file-details-container,
        div[class*="ad"], div[id*="spot"] { display: none !important; }
        body { background: #000 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
        main { padding: 0 !important; max-width: 100% !important; }
        .aspect-video { max-height: 100vh !important; min-height: 100vh !important; }
        .rounded-lg { border-radius: 0 !important; }
        #player, #video-container { width: 100vw !important; height: 100vh !important; }
        .mx-auto { max-width: 100% !important; padding: 0 !important; }
        .plyr { height: 100vh !important; }
        .plyr__video-wrapper { height: 100% !important; }
      `).catch(() => {});
    };

    // Block navigation to ad domains
    const handleNav = (_e: any) => {
      const url = wv.getURL?.() || '';
      // Only allow bunkr domains
      if (url && !url.includes('bunkr') && !url.includes('scdn.st')) {
        wv.stop?.();
      }
    };

    wv.addEventListener('did-finish-load', inject);
    wv.addEventListener('did-navigate', handleNav);

    // Also inject on dom-ready (earlier than did-finish-load)
    wv.addEventListener('dom-ready', () => {
      wv.executeJavaScript('window.open = () => null;').catch(() => {});
    });

    return () => {
      wv.removeEventListener('did-finish-load', inject);
      wv.removeEventListener('did-navigate', handleNav);
    };
  }, [active]);

  if (!filePageUrl || !filePageUrl.includes('/f/')) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-white/30" style={{ minHeight: '50vh' }}>
        <FileVideo size={32} />
        <span className="text-xs">Video unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: '75vh' }}>
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black z-10">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <span className="text-xs text-white/40">Loading player...</span>
          <span className="text-[10px] text-white/20 font-mono">{file.name}</span>
        </div>
      )}
      {active && (
        <webview
          ref={webviewRef}
          src={filePageUrl}
          partition="persist:bunkr"
          style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
        />
      )}
    </div>
  );
}
