import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RotateCw, Users, Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Creator {
    id: string;
    name: string;
    service: string;
    favorited: number;
    indexed: number;
    updated: number;
    is_favorite?: boolean | number;
}

export const Route = createFileRoute('/creators/')({
    component: CreatorsRoute,
});

const SERVICE_COLORS: Record<string, string> = {
    onlyfans: 'from-[#00aeef]/20 to-[#00aeef]/5 border-[#00aeef]/30 text-[#00aeef]',
    fansly: 'from-[#a855f7]/20 to-[#a855f7]/5 border-[#a855f7]/30 text-[#a855f7]',
    patreon: 'from-[#f96854]/20 to-[#f96854]/5 border-[#f96854]/30 text-[#f96854]',
    fancentro: 'from-[#e91e63]/20 to-[#e91e63]/5 border-[#e91e63]/30 text-[#e91e63]',
    coomer: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
};

function serviceColor(service: string) {
    return (
        SERVICE_COLORS[service?.toLowerCase()] ??
        'from-white/10 to-white/5 border-white/15 text-white/60'
    );
}

const PAGE_SIZE = 48;

function CreatorsRoute() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const loaderRef = useRef<HTMLDivElement | null>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dbApi = () => (window as any).electronAPI?.db;

    const fetchPage = useCallback(
        async (reset: boolean, query: string, service: string, nextPage: number) => {
            const api = dbApi();
            if (!api) return;
            setIsLoading(true);
            try {
                let newCreators: Creator[] = [];
                let count = 0;

                if (query) {
                    const result = await api.searchCreators(query, service || undefined);
                    newCreators = Array.isArray(result) ? result : [];
                    count = newCreators.length;
                } else if (service) {
                    const result = await api.getCreatorsByService(service, nextPage, PAGE_SIZE);
                    newCreators = result?.data ?? [];
                    count = result?.total ?? 0;
                } else {
                    const result = await api.getAllCreators(nextPage, PAGE_SIZE);
                    newCreators = result?.data ?? [];
                    count = result?.total ?? 0;
                }

                setTotal(count);
                setCreators(prev => (reset ? newCreators : [...prev, ...newCreators]));
                if (!query) setPage(nextPage + 1);
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // initial load
    useEffect(() => {
        fetchPage(true, '', '', 1);
    }, []);

    // search debounce
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setPage(1);
            fetchPage(true, searchQuery, serviceFilter, 1);
        }, 300);
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [searchQuery, serviceFilter]);

    // infinite scroll sentinel
    useEffect(() => {
        if (!loaderRef.current) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isLoading && !searchQuery && creators.length < total) {
                    fetchPage(false, '', serviceFilter, page);
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [isLoading, searchQuery, creators.length, total, page, serviceFilter]);

    const syncCreators = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        const id = toast.loading('Syncing creators from coomer.st…');
        try {
            const resp = await fetch('https://coomer.st/api/v1/creators', {
                headers: { 'User-Agent': 'yaak', Accept: 'text/css' },
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const raw: any[] = await resp.json();

            const batch = raw.map(c => ({
                id: String(c.id),
                name: c.name || 'Unknown',
                service: c.service || 'unknown',
                favorited: Number(c.favorited) || 0,
                indexed: Number(c.indexed) || 0,
                updated: Number(c.updated) || 0,
            }));

            await dbApi().upsertCreators(batch);
            toast.success(`Saved ${batch.length.toLocaleString()} creators`, { id });
            fetchPage(true, searchQuery, serviceFilter, 1);
        } catch (err: any) {
            toast.error('Sync failed: ' + err.message, { id });
        } finally {
            setIsSyncing(false);
        }
    };

    const hasMore = !searchQuery && creators.length < total;

    return (
        <div className="flex flex-col h-full bg-[#09090b] text-white">
            {/* ── Toolbar ── */}
            <div
                className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/8 shrink-0 backdrop-blur supports-[backdrop-filter]:bg-black/20"
                style={{ WebkitAppRegion: 'no-drag' } as any}
            >
                {/* brand */}
                <div className="flex items-center gap-2 mr-auto">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-bold text-white">Coomer Creators</p>
                        <p className="text-[10px] text-white/40">
                            {total > 0 ? `${total.toLocaleString()} creators` : 'No data yet'}
                        </p>
                    </div>
                </div>

                {/* search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                    <input
                        className="pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all w-56"
                        placeholder="Search creators…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* service filter */}
                <select
                    className="py-1.5 px-3 text-xs bg-white/5 border border-white/10 rounded-full text-white/60 focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
                    value={serviceFilter}
                    onChange={e => setServiceFilter(e.target.value)}
                >
                    <option value="">All services</option>
                    <option value="onlyfans">OnlyFans</option>
                    <option value="fansly">Fansly</option>
                    <option value="patreon">Patreon</option>
                    <option value="fancentro">FanCentro</option>
                    <option value="coomer">Coomer</option>
                </select>

                {/* sync */}
                <button
                    onClick={syncCreators}
                    disabled={isSyncing}
                    title="Sync from coomer.st"
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-cyan-500/15 hover:border-cyan-500/40 text-white/60 hover:text-cyan-400 flex items-center justify-center transition-all disabled:opacity-50"
                >
                    <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ── Grid ── */}
            <div id="creators-scroll" className="flex-1 overflow-auto p-4 custom-scrollbar">
                {creators.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/20">
                        <Users className="w-16 h-16 opacity-20" />
                        <p className="text-base font-medium">No creators found</p>
                        {!searchQuery && (
                            <button
                                onClick={syncCreators}
                                className="text-xs px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                            >
                                Sync from coomer.st now
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* masonry waterfall via CSS columns */}
                        <div
                            className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3"
                        >
                            {creators.map(c => (
                                <CreatorCard key={`${c.id}-${c.service}`} creator={c} />
                            ))}
                        </div>

                        {/* sentinel */}
                        <div ref={loaderRef} className="py-6 flex justify-center">
                            {isLoading && (
                                <div className="flex items-center gap-2 text-xs text-white/30">
                                    <RotateCw className="w-3 h-3 animate-spin" />
                                    Loading…
                                </div>
                            )}
                            {!hasMore && !isLoading && creators.length > 0 && (
                                <p className="text-xs text-white/20">All {total.toLocaleString()} creators loaded</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function CreatorCard({ creator }: { creator: Creator }) {
    const sc = serviceColor(creator.service);
    const initial = (creator.name?.[0] ?? '?').toUpperCase();

    return (
        <Link
            to="/creators/$service/$id"
            params={{ service: creator.service, id: creator.id }}
            className={`block break-inside-avoid mb-3 rounded-xl border bg-gradient-to-b ${sc} p-3 hover:scale-[1.02] transition-transform duration-150 cursor-pointer group no-underline text-inherit`}
        >
            {/* Avatar + name */}
            <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold shrink-0 select-none group-hover:bg-white/15 transition-colors">
                    {initial}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{creator.name}</p>
                    <span
                        className={`inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-0.5 bg-black/30`}
                    >
                        {creator.service}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2 text-[10px] text-white/50">
                <div className="flex items-center gap-1">
                    <Star className="w-2.5 h-2.5" />
                    <span>{(creator.favorited ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>{(creator.indexed ?? 0).toLocaleString()}</span>
                </div>
            </div>
        </Link>
    );
}
