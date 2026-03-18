import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { fetchHomepage, searchContent, fetchAlbum, fetchModels, resolveHQ, type NsfwAlbumPost, type NsfwAlbumDetail, type NsfwModelCategory } from '@/components/nsfwalbum/api';
import { Search, Loader2, Image as ImageIcon, Camera, ArrowLeft, ChevronLeft, ChevronRight, Grid, Maximize2, ChevronDown, ChevronRight as ChevronR, Tag, Users, Film, Play, Pause, ZoomIn, Eye, EyeOff } from 'lucide-react';
import { analyzeFrames, type ZoomTarget, type Detection, DETECTION_COLORS } from '../lib/smartZoom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Keyboard, EffectFade, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';

export const Route = createFileRoute('/nsfwalbum')({
  component: NsfwAlbumPage,
});

/* ═══════════════════════════════════ Main Page ═══════════════════════════════════ */

function NsfwAlbumPage() {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow' | 'cinema'>('grid');
  const [imageFit, setImageFit] = useState<'cover' | 'contain' | 'width' | 'height' | 'original'>('cover');
  const [autoScroll, setAutoScroll] = useState(true);
  const [hqInfo, setHqInfo] = useState<{ resolving: boolean; resolved: number; total: number }>({ resolving: false, resolved: 0, total: 0 });

  // Infinite scroll index
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['nsfwalbum-index', query],
    queryFn: ({ pageParam = 1 }) =>
      query ? searchContent(query, pageParam) : fetchHomepage(pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length > 0 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    enabled: !selectedAlbum,
  });

  const allPosts = useMemo(() => {
    const flat = data?.pages.flat() || [];
    const seen = new Map<string, NsfwAlbumPost>();
    for (const p of flat) {
      if (!seen.has(p.id)) seen.set(p.id, p);
    }
    return [...seen.values()];
  }, [data]);

  // Album detail
  const { data: albumDetail, isLoading: albumLoading } = useQuery({
    queryKey: ['nsfwalbum-album', selectedAlbum],
    queryFn: () => fetchAlbum(selectedAlbum!),
    enabled: !!selectedAlbum,
    staleTime: 10 * 60 * 1000,
  });

  // Models/sites
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['nsfwalbum-models'],
    queryFn: () => fetchModels(),
    staleTime: 30 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setSelectedAlbum(null);
  };

  const handleModelClick = (searchQuery: string) => {
    setSearchInput(searchQuery);
    setQuery(searchQuery);
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Camera size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              {selectedAlbum ? (albumDetail?.title?.slice(0, 60) || 'Loading...') : 'NSFWAlbum'}
            </h1>
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">
              {selectedAlbum
                ? `${albumDetail?.images.length || '...'} images${albumDetail?.studio ? ` · ${albumDetail.studio}` : ''}`
                : query ? `Searching: ${query}` : `${allPosts.length} albums loaded`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedAlbum ? (
            /* ── Album controls (all in one row) ── */
            <>
              {/* HQ status */}
              <span className="text-[9px] text-white/30 flex items-center gap-1 shrink-0">
                {hqInfo.resolving ? (
                  <><Loader2 size={8} className="animate-spin text-fuchsia-400/60" /> HQ {hqInfo.resolved}/{hqInfo.total}</>
                ) : hqInfo.resolved > 0 ? (
                  <span className="text-emerald-400/60">✓ HQ</span>
                ) : null}
              </span>

              {/* Image fit (grid only) */}
              {viewMode === 'grid' && (
                <div className="flex items-center gap-px bg-white/[0.03] rounded border border-white/[0.06] overflow-hidden">
                  {([['cover', 'Cover'], ['contain', 'Fit'], ['width', 'W'], ['height', 'H'], ['original', '1:1']] as const).map(([mode, label]) => (
                    <button key={mode} onClick={() => setImageFit(mode)}
                      className={`px-1.5 py-0.5 text-[7px] font-bold transition-colors ${
                        imageFit === mode ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-white/20 hover:text-white/35'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Auto-scroll (grid only) */}
              {viewMode === 'grid' && (
                <button onClick={() => setAutoScroll(a => !a)}
                  className={`text-[7px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    autoScroll ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-white/20 hover:text-white/35 border border-white/[0.06]'}`}>
                  {autoScroll ? '⏸' : '▶'}
                </button>
              )}

              {/* View modes */}
              <div className="flex items-center gap-0.5 ml-1">
                <button onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-white/20 hover:text-white/35'}`}>
                  <Grid size={12} />
                </button>
                <button onClick={() => setViewMode('slideshow')}
                  className={`p-1 rounded transition-colors ${viewMode === 'slideshow' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-white/20 hover:text-white/35'}`}>
                  <Maximize2 size={12} />
                </button>
                <button onClick={() => setViewMode('cinema')}
                  className={`p-1 rounded transition-colors ${viewMode === 'cinema' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-white/20 hover:text-white/35'}`}>
                  <Film size={12} />
                </button>
              </div>
            </>
          ) : (
            /* ── Index controls ── */
            <>
              <form onSubmit={handleSearch} className="relative w-56">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  placeholder="Search albums..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/8 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-fuchsia-500/40 transition-colors"
                />
              </form>
              {query && (
                <button onClick={() => { setQuery(''); setSearchInput(''); }} className="text-[10px] text-white/30 hover:text-white/50 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors">
                  Clear
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors ${sidebarOpen ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-white/30 hover:text-white/50'}`}
            title="Toggle models sidebar"
          >
            <Users size={14} />
          </button>
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          {selectedAlbum ? (
            <AlbumDetailView
              detail={albumDetail}
              loading={albumLoading}
              viewMode={viewMode}
              setViewMode={setViewMode}
              imageFit={imageFit}
              autoScroll={autoScroll}
              setAutoScroll={setAutoScroll}
              onHqInfo={setHqInfo}
            />
          ) : (
            <VirtualAlbumGrid
              posts={allPosts}
              loading={isLoading}
              onOpenAlbum={setSelectedAlbum}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          )}
        </div>

        {/* Right sidebar: Models/Sites */}
        {sidebarOpen && !selectedAlbum && (
          <ModelsSidebar
            models={models || []}
            loading={modelsLoading}
            activeQuery={query}
            onSelect={handleModelClick}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════ Virtual Album Grid ═══════════════════════════════════ */

const COLS = 4; // will be dynamic based on container width
const ROW_HEIGHT = 220;

function VirtualAlbumGrid({
  posts, loading, onOpenAlbum, hasNextPage, isFetchingNextPage, fetchNextPage,
}: {
  posts: NsfwAlbumPost[];
  loading: boolean;
  onOpenAlbum: (id: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(COLS);

  // Responsive columns
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 1200) setCols(5);
      else if (w > 900) setCols(4);
      else if (w > 600) setCols(3);
      else setCols(2);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const rows = useMemo(() => {
    const r: NsfwAlbumPost[][] = [];
    for (let i = 0; i < posts.length; i += cols) {
      r.push(posts.slice(i, i + cols));
    }
    return r;
  }, [posts, cols]);

  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0), // +1 for sentinel
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  });

  // Infinite scroll: when virtualizer reaches the sentinel row, fetch next
  useEffect(() => {
    const items = virtualizer.getVirtualItems();
    const lastItem = items[items.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualizer.getVirtualItems(), rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
      </div>
    );
  }
  if (!loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/25">
        <ImageIcon size={48} className="mb-3 opacity-40" />
        <p className="text-sm">No albums found</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto scrollbar-hide">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          if (virtualRow.index >= rows.length) {
            // Sentinel / loading row
            return (
              <div
                key="sentinel"
                className="absolute top-0 left-0 w-full flex justify-center py-4"
                style={{ transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size }}
              >
                {isFetchingNextPage && <Loader2 className="w-5 h-5 animate-spin text-fuchsia-500/60" />}
              </div>
            );
          }
          const row = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              className="absolute top-0 left-0 w-full px-4 py-1.5"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                height: virtualRow.size,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: '0.75rem',
              }}
            >
              {row.map((post, ci) => (
                <button
                  key={`${virtualRow.index}-${ci}`}
                  onClick={() => onOpenAlbum(post.id)}
                  className="group relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] hover:border-fuchsia-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fuchsia-500/10 text-left cursor-pointer h-full"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    {post.thumbs.length >= 3 ? (
                      <div className="grid grid-cols-3 h-full gap-px bg-black/30">
                        {post.thumbs.slice(0, 3).map((t, i) => (
                          <img key={i} src={t} alt="" loading="lazy" referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110"
                            style={{ animation: `kenburns-drift ${8 + i * 2}s ease-in-out infinite alternate` }} />
                        ))}
                      </div>
                    ) : post.thumbs[0] ? (
                      <img src={post.thumbs[0]} alt="" loading="lazy" referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-105"
                        style={{ animation: 'kenburns-drift 10s ease-in-out infinite alternate' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <ImageIcon size={24} className="text-white/10" />
                      </div>
                    )}
                  </div>
                  {/* Always-visible subtle gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* Hover-only info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                    <h3 className="text-[11px] font-semibold text-white leading-tight line-clamp-2 drop-shadow-md">
                      {post.title}
                    </h3>
                    {post.thumbs.length > 0 && (
                      <span className="text-[9px] text-white/40 font-bold mt-0.5 inline-block">
                        {post.thumbs.length}+ photos
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════ Models Sidebar (Virtualized) ═══════════════════════════════════ */

/** Flatten categories for virtualization: each item is either a site header or a model entry */
type SidebarItem =
  | { type: 'site'; cat: NsfwModelCategory; expanded: boolean }
  | { type: 'model'; name: string; searchQuery: string; siteName: string };

function ModelsSidebar({
  models, loading, activeQuery, onSelect,
}: {
  models: NsfwModelCategory[];
  loading: boolean;
  activeQuery: string;
  onSelect: (query: string) => void;
}) {
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const toggle = (site: string) => {
    setExpandedSites(prev => {
      const next = new Set(prev);
      next.has(site) ? next.delete(site) : next.add(site);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!filterText) return models;
    const lf = filterText.toLowerCase();
    return models.filter(c =>
      c.site.toLowerCase().includes(lf) ||
      c.models.some(m => m.name.toLowerCase().includes(lf))
    );
  }, [models, filterText]);

  // Flatten for virtualizer
  const flatItems = useMemo<SidebarItem[]>(() => {
    const items: SidebarItem[] = [];
    for (const cat of filtered) {
      const expanded = expandedSites.has(cat.site);
      items.push({ type: 'site', cat, expanded });
      if (expanded) {
        // If filtering, only show matching models
        const modelsToShow = filterText
          ? cat.models.filter(m => m.name.toLowerCase().includes(filterText.toLowerCase()))
          : cat.models;
        for (const m of modelsToShow) {
          items.push({ type: 'model', name: m.name, searchQuery: m.searchQuery, siteName: cat.site });
        }
      }
    }
    return items;
  }, [filtered, expandedSites, filterText]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => flatItems[i].type === 'site' ? 32 : 26,
    overscan: 10,
  });

  return (
    <div className="w-56 shrink-0 border-l border-white/5 bg-white/[0.01] flex flex-col overflow-hidden">
      {/* Sidebar header */}
      <div className="px-3 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={12} className="text-fuchsia-400" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Sites / Models</span>
          {!loading && <span className="text-[8px] text-white/15 font-mono ml-auto">{models.length}</span>}
        </div>
        <input
          type="text"
          placeholder="Filter..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full bg-black/30 border border-white/5 rounded-md px-2 py-1 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-fuchsia-500/30"
        />
      </div>

      {/* Virtualized list */}
      <div ref={parentRef} className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={16} className="animate-spin text-fuchsia-500/40" />
          </div>
        ) : flatItems.length === 0 ? (
          <p className="text-[10px] text-white/20 text-center py-4">No sites found</p>
        ) : (
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((vItem) => {
              const item = flatItems[vItem.index];
              if (item.type === 'site') {
                const favicon = getFaviconUrl(item.cat.site);
                return (
                  <div
                    key={`site-${item.cat.site}`}
                    className={`absolute top-0 left-0 w-full flex items-center gap-1.5 px-3 hover:bg-white/5 transition-colors cursor-pointer group ${
                      activeQuery === item.cat.searchQuery ? 'bg-fuchsia-500/10' : ''
                    }`}
                    style={{ transform: `translateY(${vItem.start}px)`, height: vItem.size }}
                    onClick={() => toggle(item.cat.site)}
                  >
                    {item.expanded ? (
                      <ChevronDown size={9} className="text-white/20 shrink-0" />
                    ) : (
                      <ChevronR size={9} className="text-white/20 shrink-0" />
                    )}
                    {favicon && (
                      <img
                        src={favicon}
                        alt=""
                        className="w-3.5 h-3.5 rounded-sm shrink-0 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <span
                      className={`text-[10px] font-semibold truncate flex-1 ${
                        activeQuery === item.cat.searchQuery ? 'text-fuchsia-400' : 'text-white/70 group-hover:text-white/90'
                      }`}
                      onClick={(e) => { e.stopPropagation(); onSelect(item.cat.searchQuery); }}
                    >
                      {item.cat.site}
                    </span>
                    <span className="text-[8px] text-white/15 font-mono shrink-0">{item.cat.models.length}</span>
                  </div>
                );
              } else {
                return (
                  <div
                    key={`model-${item.siteName}-${item.searchQuery}`}
                    className={`absolute top-0 left-0 w-full flex items-center pl-7 pr-3 cursor-pointer hover:bg-white/5 transition-colors ${
                      activeQuery === item.searchQuery ? 'text-fuchsia-400 bg-fuchsia-500/10' : 'text-white/40 hover:text-white/60'
                    }`}
                    style={{ transform: `translateY(${vItem.start}px)`, height: vItem.size }}
                    onClick={() => onSelect(item.searchQuery)}
                  >
                    <span className="text-[9px] truncate">{item.name}</span>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Get a favicon URL for a site name — tries Google's favicon service */
function getFaviconUrl(site: string): string | null {
  // Strip trailing dots, clean up
  const clean = site.replace(/\.$/, '').toLowerCase();
  // If it looks like a domain (has a dot), use Google's favicon API
  if (clean.includes('.')) {
    return `https://www.google.com/s2/favicons?domain=${clean}&sz=32`;
  }
  return null;
}

/* ═══════════════════════════════════ Album Detail ═══════════════════════════════════ */

function AlbumDetailView({
  detail, loading, viewMode, setViewMode, imageFit, autoScroll, setAutoScroll, onHqInfo,
}: {
  detail: NsfwAlbumDetail | null | undefined;
  loading: boolean;
  viewMode: 'grid' | 'slideshow' | 'cinema';
  setViewMode: (m: 'grid' | 'slideshow' | 'cinema') => void;
  imageFit: 'cover' | 'contain' | 'width' | 'height' | 'original';
  autoScroll: boolean;
  setAutoScroll: (v: boolean | ((prev: boolean) => boolean)) => void;
  onHqInfo: (info: { resolving: boolean; resolved: number; total: number }) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hqMap, setHqMap] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState(false);
  const abortRef = useRef(false);

  // Build spiral order from a center index outward
  const buildSpiralOrder = useCallback((center: number, total: number) => {
    const order: number[] = [center];
    for (let d = 1; d < total; d++) {
      if (center + d < total) order.push(center + d);
      if (center - d >= 0) order.push(center - d);
    }
    return order;
  }, []);

  useEffect(() => {
    if (!detail || detail.images.length === 0) return;
    abortRef.current = false;
    setResolving(true);

    const spiralOrder = buildSpiralOrder(currentIdx, detail.images.length);

    (async () => {
      for (const idx of spiralOrder) {
        if (abortRef.current) break;
        const img = detail.images[idx];
        if (hqMap[img.id]) continue;
        try {
          const hqUrl = await resolveHQ(img.id);
          if (hqUrl && !abortRef.current) {
            setHqMap(prev => ({ ...prev, [img.id]: hqUrl }));
          }
        } catch { /* skip */ }
      }
      setResolving(false);
    })();

    return () => { abortRef.current = true; };
  }, [detail, currentIdx, buildSpiralOrder]);

  const getUrl = useCallback((img: { id: string; thumb: string; full: string }) => {
    return hqMap[img.id] || img.full || img.thumb;
  }, [hqMap]);

  // Report HQ info to parent for header display
  const resolvedCount = Object.keys(hqMap).length;
  useEffect(() => {
    onHqInfo({ resolving, resolved: resolvedCount, total: detail?.images.length || 0 });
  }, [resolving, resolvedCount, detail, onHqInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
      </div>
    );
  }
  if (!detail || detail.images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/25">
        <ImageIcon size={48} className="mb-3 opacity-40" />
        <p className="text-sm">Album not found</p>
      </div>
    );
  }

  const images = detail.images;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4">
      {viewMode === 'grid' ? (
        <AlbumGalleryGrid images={images} getUrl={getUrl} imageFit={imageFit} autoScroll={autoScroll} setAutoScroll={setAutoScroll} onClickImage={(i) => { setCurrentIdx(i); setViewMode('slideshow'); }} />
      ) : viewMode === 'cinema' ? (
        <NsfwCinemaViewer images={images} getUrl={getUrl} onClose={() => setViewMode('grid')} />
      ) : (
        <SlideshowViewer
          images={images}
          currentIdx={currentIdx}
          setCurrentIdx={setCurrentIdx}
          onClose={() => setViewMode('grid')}
          getUrl={getUrl}
        />
      )}
    </div>
  );
}
/* ═══════════════════════════════════ Gallery Grid (Gentle Loading) ═══════════════════════════════════ */

function AlbumGalleryGrid({ images, getUrl, imageFit, autoScroll, setAutoScroll, onClickImage }: {
  images: NsfwAlbumDetail['images'];
  getUrl: (img: { id: string; thumb: string; full: string }) => string;
  imageFit: 'cover' | 'contain' | 'width' | 'height' | 'original';
  autoScroll: boolean;
  setAutoScroll: (v: boolean | ((prev: boolean) => boolean)) => void;
  onClickImage: (i: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(autoScroll);

  // Find the scrollable parent container
  const getScrollParent = useCallback((): HTMLElement | null => {
    let el = scrollRef.current?.parentElement;
    while (el) {
      const style = getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') return el;
      el = el.parentElement;
    }
    return null;
  }, []);

  // Auto-scroll: gently scroll the parent container
  useEffect(() => {
    autoScrollRef.current = autoScroll;
    if (!autoScroll) return;
    const scrollContainer = getScrollParent();
    if (!scrollContainer) return;
    let raf: number;
    const scroll = () => {
      if (!autoScrollRef.current) return;
      scrollContainer.scrollTop += 0.5;
      if (scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight - 10) {
        setAutoScroll(false);
        return;
      }
      raf = requestAnimationFrame(scroll);
    };
    raf = requestAnimationFrame(scroll);
    const onWheel = () => { setAutoScroll(false); };
    scrollContainer.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      scrollContainer.removeEventListener('wheel', onWheel);
    };
  }, [autoScroll, getScrollParent, setAutoScroll]);

  // Map imageFit to CSS classes for images
  const fitClass = useMemo(() => {
    switch (imageFit) {
      case 'cover': return 'w-full object-cover';
      case 'contain': return 'w-full object-contain bg-black/20';
      case 'width': return 'w-full h-auto object-fill';
      case 'height': return 'h-[300px] w-auto mx-auto object-contain';
      case 'original': return 'max-w-full max-h-none mx-auto';
      default: return 'w-full object-cover';
    }
  }, [imageFit]);

  return (
    <div ref={scrollRef} className="relative">
      <div className="w-full" style={{ columns: 'auto 240px', columnGap: '0.5rem' }}>
        {images.map((img, i) => (
          <GentleImage
            key={img.id}
            src={getUrl(img)}
            index={i}
            fitClass={fitClass}
            onClick={() => onClickImage(i)}
          />
        ))}
      </div>

      {/* Keyframes for gentle loading animations */}
      <style>{`
        @keyframes gentle-appear {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes kenburns-drift {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.06) translate(-1%, -0.5%); }
        }
      `}</style>
    </div>
  );
}

/** Single image with IntersectionObserver reveal */
function GentleImage({ src, index, fitClass, onClick }: { src: string; index: number; fitClass: string; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.05, rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="mb-2 block w-full rounded-lg overflow-hidden break-inside-avoid cursor-pointer group"
      style={{
        opacity: visible ? 1 : 0,
        animation: visible ? `gentle-appear 0.8s ${Math.min(index * 0.06, 1.5)}s both ease-out` : 'none',
      }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`${fitClass} rounded-lg ring-1 ring-white/5 group-hover:ring-fuchsia-500/30 transition-all duration-300 group-hover:brightness-110`}
      />
    </button>
  );
}

/* ═══════════════════════════════════ Cinema Viewer ═══════════════════════════════════ */

function NsfwCinemaViewer({ images, getUrl, onClose }: {
  images: NsfwAlbumDetail['images'];
  getUrl: (img: { id: string; thumb: string; full: string }) => string;
  onClose: () => void;
}) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [fps, setFps] = useState(2);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartFrame, setDragStartFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const total = images.length;

  useEffect(() => {
    if (playing && !isDragging && !zoomed) {
      intervalRef.current = window.setInterval(() => {
        setFrameIdx(prev => {
          if (prev >= total - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1000 / fps);
    } else {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current !== null) window.clearInterval(intervalRef.current); };
  }, [playing, fps, total, isDragging, zoomed]);

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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const frameDelta = Math.round(dx / 8);
      setFrameIdx(Math.max(0, Math.min(total - 1, dragStartFrame + frameDelta)));
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

  const handleMouseUp = useCallback(() => { setIsDragging(false); }, []);
  const handleMouseLeave = () => { setIsDragging(false); };

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = (e.clientX - rect.left) / rect.width;
    setFrameIdx(Math.max(0, Math.min(total - 1, Math.round(pct * (total - 1)))));
  }, [total]);

  const progress = total > 1 ? frameIdx / (total - 1) : 0;
  const currentImg = images[frameIdx];

  // Ken Burns: random fallback per-frame
  const randomKenBurns = useMemo(() => {
    return images.map(() => ({
      tx: (Math.random() - 0.5) * 3,
      ty: (Math.random() - 0.5) * 2,
      scale: 1.0 + Math.random() * 0.08,
    }));
  }, [images]);

  // AI Smart Zoom: analyze frames in background
  const [aiTargets, setAiTargets] = useState<Map<string, ZoomTarget>>(new Map());
  const [aiDetections, setAiDetections] = useState<Map<string, Detection[]>>(new Map());
  const [aiProgress, setAiProgress] = useState<{ done: number; total: number } | null>(null);
  const [showDetections, setShowDetections] = useState(false);
  const aiAbortRef = useRef({ aborted: false });

  useEffect(() => {
    const abort = { aborted: false };
    aiAbortRef.current = abort;

    const urls = images.map(im => getUrl(im));
    analyzeFrames(urls, (progress) => {
      if (!abort.aborted) {
        setAiTargets(new Map(progress.targets));
        setAiDetections(new Map(progress.detections));
        setAiProgress({ done: progress.done, total: progress.total });
      }
    }, abort).catch(() => { /* model load fail — random fallback */ });

    return () => { abort.aborted = true; };
  }, [images, getUrl]);

  // Crossfade: alternate between two image layers
  const [showA, setShowA] = useState(true);
  const prevFrameRef = useRef(0);
  useEffect(() => {
    if (frameIdx !== prevFrameRef.current) {
      setShowA(prev => !prev);
      prevFrameRef.current = frameIdx;
    }
  }, [frameIdx]);

  const currentSrc = getUrl(currentImg);

  // Compute Ken Burns for current frame: AI target or random fallback
  const kb = useMemo(() => {
    if (zoomed) return null;
    const aiTarget = aiTargets.get(currentSrc);
    if (aiTarget) {
      // AI-detected: zoom toward the region of interest
      return { originX: aiTarget.x, originY: aiTarget.y, scale: aiTarget.scale, ai: true };
    }
    // Random fallback
    const rk = randomKenBurns[frameIdx];
    return rk ? { originX: 50 + rk.tx * 10, originY: 50 + rk.ty * 10, scale: rk.scale, ai: false } : null;
  }, [zoomed, aiTargets, currentSrc, randomKenBurns, frameIdx]);

  if (total === 0) return <div className="text-center text-white/30 py-12">No images to play</div>;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Controls */}
      <div className="flex items-center gap-3 w-full px-2">
        <button onClick={onClose} className="text-[10px] font-bold text-white/30 hover:text-white/50 flex items-center gap-1">
          <Grid size={12} /> Grid
        </button>
        <button onClick={() => setPlaying(p => !p)}
          className="p-2 rounded-full bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 transition-colors">
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/30 font-mono">Speed:</span>
          {[1, 2, 4, 8, 15].map(f => (
            <button key={f} onClick={() => setFps(f)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-colors ${
                fps === f ? 'bg-fuchsia-500/30 text-fuchsia-400' : 'text-white/20 hover:text-white/40'}`}>
              {f}fps
            </button>
          ))}
        </div>
        <button onClick={() => setZoomed(z => !z)}
          className={`p-1.5 rounded-lg transition-colors ${zoomed ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-white/30 hover:text-white/50'}`}>
          <ZoomIn size={14} />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono">{frameIdx + 1}/{total}</span>
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
        onMouseLeave={handleMouseLeave}
      >
        {/* Preload */}
        {images.slice(frameIdx + 1, frameIdx + 4).map(im => (
          <link key={im.id} rel="preload" as="image" href={getUrl(im)} />
        ))}

        {/* Dual crossfade layers */}
        <img
          src={showA ? currentSrc : getUrl(images[prevFrameRef.current] || currentImg)}
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
              transition: `opacity 0.6s ease-in-out, transform ${1000 / fps}ms ease-out, transform-origin ${1000 / fps}ms ease-out`,
            } : {}),
          }}
        />
        <img
          src={!showA ? currentSrc : getUrl(images[prevFrameRef.current] || currentImg)}
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
              transition: `opacity 0.6s ease-in-out, transform 3s cubic-bezier(0.25,0.1,0.25,1), transform-origin 3s cubic-bezier(0.25,0.1,0.25,1)`,
            } : {}),
          }}
        />

        {/* Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />

        {/* Film grain overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
            animation: 'grain 0.5s steps(1) infinite',
          }} />

        {/* Letterbox bars */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-black to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black to-transparent pointer-events-none" />

        {/* Ambient glow behind image */}
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

        {/* Detection overlay */}
        {showDetections && !zoomed && (() => {
          const dets = aiDetections.get(currentSrc) || [];
          return dets.map((det, i) => {
            const color = DETECTION_COLORS[det.class] || '#fff';
            // Convert normalized coords to percentage positions
            const left = (det.x - det.w / 2) * 100;
            const top = (det.y - det.h / 2) * 100;
            const width = det.w * 100;
            const height = det.h * 100;
            return (
              <div key={i} className="absolute pointer-events-none" style={{
                left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                border: `2px solid ${color}`,
                borderRadius: '4px',
                transition: 'all 0.3s ease',
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
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-[10px] text-fuchsia-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" /> Cinema · {fps}fps
              {kb?.ai && <span className="text-emerald-400 ml-1">🧠</span>}
            </span>
          )}
          {zoomed && (
            <span className="bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-[10px] text-emerald-400 font-bold">
              🔍 2.5×
            </span>
          )}
          {aiProgress && aiProgress.done < aiProgress.total && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-[10px] text-amber-400 font-bold">
              🧠 AI {aiProgress.done}/{aiProgress.total}
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

      {/* Film grain keyframe via style tag */}
      <style>{`@keyframes grain { 0%, 100% { transform: translate(0,0) } 10% { transform: translate(-1%,-1%) } 20% { transform: translate(1%,0) } 30% { transform: translate(0,1%) } 40% { transform: translate(-1%,1%) } 50% { transform: translate(1%,-1%) } 60% { transform: translate(-1%,0) } 70% { transform: translate(0,-1%) } 80% { transform: translate(1%,1%) } 90% { transform: translate(-1%,-1%) } }`}</style>

      {/* Timeline */}
      <div ref={timelineRef} className="w-full cursor-pointer group" onClick={handleTimelineClick}>
        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-2 group-hover:h-2 transition-all">
          <div className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full transition-[width] duration-75"
            style={{ width: `${progress * 100}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress * 100}% - 6px)` }} />
        </div>
        <div className="flex gap-px w-full h-12 rounded-lg overflow-hidden bg-black/30">
          {images.map((im, i) => (
            <div
              key={im.id}
              className={`flex-1 min-w-0 cursor-pointer transition-all duration-100 ${
                i === frameIdx ? 'ring-2 ring-fuchsia-500 ring-inset z-10 scale-y-110' :
                i < frameIdx ? 'opacity-60' : 'opacity-30 hover:opacity-50'
              }`}
              onClick={(e) => { e.stopPropagation(); setFrameIdx(i); }}
            >
              {total <= 60 && im.thumb && (
                <img src={im.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
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
  images, currentIdx, setCurrentIdx, onClose, getUrl,
}: {
  images: NsfwAlbumDetail['images'];
  currentIdx: number;
  setCurrentIdx: (i: number) => void;
  onClose: () => void;
  getUrl: (img: { id: string; thumb: string; full: string }) => string;
}) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const img = images[currentIdx];

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
        <span className="text-xs text-white/40 font-mono">{currentIdx + 1} / {images.length}</span>
      </div>

      {/* Main Swiper */}
      <div className="w-full rounded-xl overflow-hidden shadow-2xl shadow-black/40">
        <Swiper
          modules={[Navigation, Thumbs, Keyboard, EffectFade, Mousewheel]}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          navigation
          keyboard={{ enabled: true }}
          mousewheel={{ forceToAxis: true }}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          initialSlide={currentIdx}
          onSwiper={setMainSwiper}
          onSlideChange={(s) => setCurrentIdx(s.activeIndex)}
          className="nsfwalbum-main-swiper"
          style={{ '--swiper-navigation-color': '#d946ef', '--swiper-navigation-size': '28px' } as React.CSSProperties}
        >
          {images.map((im, i) => (
            <SwiperSlide key={`main-${im.id}`}>
              <div className="flex items-center justify-center bg-black" style={{ minHeight: '65vh' }}>
                <img
                  src={getUrl(im)}
                  alt=""
                  referrerPolicy="no-referrer"
                  loading={Math.abs(i - currentIdx) <= 2 ? 'eager' : 'lazy'}
                  className="max-h-[75vh] max-w-full object-contain select-none"
                  draggable={false}
                />
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
          className="nsfwalbum-thumbs-swiper"
        >
          {images.map((im, i) => (
            <SwiperSlide key={`thumb-${im.id}`} style={{ width: '64px', height: '64px' }}>
              <div className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer transition-all duration-200 ${
                i === currentIdx
                  ? 'ring-2 ring-fuchsia-500 ring-offset-1 ring-offset-black scale-105'
                  : 'opacity-50 hover:opacity-80'
              }`}>
                <img src={im.thumb} alt="" loading="lazy" referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" draggable={false} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

