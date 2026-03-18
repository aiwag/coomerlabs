import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search, X, Camera, Clock, Film, Video, Star,
  Image, Users, Sparkles, Loader2, Radio, Monitor, History, TrendingUp, Trash2, Layers,
} from 'lucide-react';
import { getSavedProfiles } from './camarchive/api';
import { searchRooms, getMostViewedRooms } from '@/services/chaturbateApiService';
import { redGifsApiWithFallback } from '@/services/redgifs';
import axios from 'axios';

const HISTORY_KEY = 'globalsearch:history';
const MAX_HISTORY = 8;

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveToHistory(term: string) {
  const h = getHistory().filter(t => t.toLowerCase() !== term.toLowerCase());
  h.unshift(term);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: React.ReactNode;
  route: string;
  params?: Record<string, string>;
  meta?: string;
  thumbnailUrl?: string;
}

type Cat = {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
};

const CATS: Cat[] = [
  { key: 'camviewer',    label: 'Live Cams',       icon: <Camera size={11} />,   color: 'text-cyan-400',   bgColor: 'bg-cyan-500/10',   borderColor: 'border-cyan-500/20' },
  { key: 'camarchive',   label: 'Archive',          icon: <Clock size={11} />,    color: 'text-blue-400',   bgColor: 'bg-blue-500/10',   borderColor: 'border-blue-500/20' },
  { key: 'recordings',   label: 'Recordings',       icon: <Film size={11} />,     color: 'text-red-400',    bgColor: 'bg-red-500/10',    borderColor: 'border-red-500/20' },
  { key: 'redgifs',      label: 'RedGifs',          icon: <Video size={11} />,    color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  { key: 'fapello',      label: 'Galleries',        icon: <Image size={11} />,    color: 'text-pink-400',   bgColor: 'bg-pink-500/10',   borderColor: 'border-pink-500/20' },
  { key: 'wallhaven',    label: 'Wallpapers',       icon: <Monitor size={11} />,  color: 'text-emerald-400',bgColor: 'bg-emerald-500/10',borderColor: 'border-emerald-500/20' },
  { key: 'creators',     label: 'Coomer Creators',  icon: <Users size={11} />,    color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  { key: 'coomerKemono', label: 'Creator Archive',   icon: <Layers size={11} />,   color: 'text-amber-400',  bgColor: 'bg-amber-500/10',  borderColor: 'border-amber-500/20' },
  { key: 'javtube',      label: 'JavTube',          icon: <Sparkles size={11} />, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
  { key: 'actresses',    label: 'Star Database',    icon: <Star size={11} />,     color: 'text-rose-400',   bgColor: 'bg-rose-500/10',   borderColor: 'border-rose-500/20' },
  { key: 'nsfwalbum',    label: 'NSFWAlbum',        icon: <Image size={11} />,    color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/10', borderColor: 'border-fuchsia-500/20' },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(p => !p);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery(''); setResults([]); setSelectedId(null);
      setHistory(getHistory());
      setTimeout(() => inputRef.current?.focus(), 50);
      // Load trending on open
      loadTrending();
    }
  }, [isOpen]);

  const loadTrending = useCallback(async () => {
    if (trending.length > 0) return;
    setTrendingLoading(true);
    try {
      const ctrl = new AbortController();
      const sig = ctrl.signal;
      const T: Promise<SearchResult[]>[] = [];

      // Live cams — top 6
      T.push((async () => {
        try {
          const d = await getMostViewedRooms(1, 6, sig);
          return (d.rooms || []).slice(0, 6).map(r => ({
            id: `trend-cam-${r.username}`, title: r.username,
            subtitle: r.subject?.replace(/<[^>]+>/g, '').slice(0, 35) || 'Live',
            category: 'camviewer', icon: <Radio size={12} className="text-red-400" />,
            route: '/camviewer', meta: `${(r.num_users || 0).toLocaleString()}`,
            thumbnailUrl: r.img,
          }));
        } catch { return []; }
      })());

      // Fapello trending — top 5
      T.push((async () => {
        try {
          const { fetchTrendingProfiles } = await import('./fapello/api');
          const r = await fetchTrendingProfiles({ pageParam: 1 });
          return (r.profiles || []).filter((p: any) => !p.isAd).slice(0, 5).map((p: any) => ({
            id: `trend-fap-${p.id}`, title: p.name || p.id, subtitle: 'Trending',
            category: 'fapello', icon: <Image size={12} />,
            route: '/fapello', thumbnailUrl: p.imageUrl,
          }));
        } catch { return []; }
      })());

      // RedGifs trending — top 5
      T.push((async () => {
        try {
          const r = await redGifsApiWithFallback.getCreators(1, 6);
          const gifs = r.gifs || [];
          return gifs.slice(0, 5).map((g: any) => ({
            id: `trend-rg-${g.userName || g.id}`, title: g.userName || g.id,
            subtitle: 'Trending', category: 'redgifs', icon: <Video size={12} />,
            route: '/redgifs', thumbnailUrl: g.urls?.thumbnail,
            meta: g.likes ? `♥ ${abbrev(g.likes)}` : undefined,
          }));
        } catch { return []; }
      })());

      // Wallhaven top — top 5
      T.push((async () => {
        try {
          const API_KEY = 'EFkCFHGlTBVugFhK9SOI4F5GoQJTOW0W';
          const res = await fetch(`https://wallhaven.cc/api/v1/search?apikey=${API_KEY}&sorting=toplist&topRange=1w&categories=111&purity=110&page=1`, { signal: sig });
          if (!res.ok) return [];
          const json = await res.json();
          return (json.data || []).slice(0, 5).map((w: any) => ({
            id: `trend-wh-${w.id}`, title: w.resolution,
            subtitle: w.category || 'Wallpaper', category: 'wallhaven', icon: <Monitor size={12} />,
            route: '/wallheaven', thumbnailUrl: w.thumbs?.small,
            meta: w.favorites ? `♥ ${w.favorites}` : undefined,
          }));
        } catch { return []; }
      })());

      // JavTube popular — top 5
      T.push((async () => {
        try {
          if (!window.javtube?.getVideos) return [];
          const r = await window.javtube.getVideos(1, 'main', '');
          if (!r.success || !r.data) return [];
          return r.data.slice(0, 5).map((v: any) => ({
            id: `trend-jav-${v.id || v.title}`, title: v.title || v.id || 'Untitled',
            subtitle: v.actress || v.duration || '', category: 'javtube', icon: <Sparkles size={12} />,
            route: '/javtube', thumbnailUrl: v.thumbnail || v.thumbnailUrl || v.img,
          }));
        } catch { return []; }
      })());

      // Recordings — recent 4
      T.push((async () => {
        try {
          const recs: Recording[] = await window.electronAPI?.recording?.list?.() || [];
          return recs.filter(r => r.status !== 'failed').slice(0, 4).map(r => ({
            id: `trend-rec-${r.id}`, title: r.username,
            subtitle: r.status === 'recording' ? '🔴 Live' : fmtDuration(r.duration),
            category: 'recordings', icon: <Film size={12} />,
            route: '/recordings', meta: r.fileSize ? fmtSize(r.fileSize) : undefined,
          }));
        } catch { return []; }
      })());

      // Coomer Creators — top favorited from DB
      T.push((async () => {
        try {
          const db = (window as any).electronAPI?.db;
          if (!db?.getAllCreators) return [];
          const r = await db.getAllCreators(1, 5);
          return (r?.data || []).slice(0, 5).map((c: any) => ({
            id: `trend-creator-${c.id}-${c.service}`, title: c.name || c.id,
            subtitle: c.service, category: 'creators', icon: <Users size={12} />,
            route: `/creators/${c.service}/${c.id}`,
            meta: c.favorited ? `♥ ${c.favorited.toLocaleString()}` : undefined,
          }));
        } catch { return []; }
      })());

      // Actresses — first page
      T.push((async () => {
        try {
          if (!window.javtube?.getActresses) return [];
          const r = await window.javtube.getActresses(1);
          if (!r.success || !r.data) return [];
          const arr = Array.isArray(r.data) ? r.data : [];
          return arr.slice(0, 5).map((a: any) => ({
            id: `trend-actress-${a.id}`, title: a.name,
            subtitle: a.videoCount ? `${a.videoCount} videos` : '',
            category: 'actresses', icon: <Star size={12} />,
            route: `/actress/${a.id}`, thumbnailUrl: a.thumbnail,
          }));
        } catch { return []; }
      })());

      // NSFWAlbum trending
      T.push((async () => {
        try {
          const { fetchHomepage } = await import('./nsfwalbum/api');
          const imgs = await fetchHomepage();
          return imgs.slice(0, 5).map(i => ({
            id: `trend-nsfw-${i.id}`, title: i.title || i.id,
            subtitle: i.views ? `${i.views} views` : 'Album',
            category: 'nsfwalbum', icon: <Image size={12} />,
            route: '/nsfwalbum', thumbnailUrl: i.thumbs?.[0],
          }));
        } catch { return []; }
      })());

      const settled = await Promise.allSettled(T);
      const all: SearchResult[] = [];
      for (const r of settled) if (r.status === 'fulfilled') all.push(...r.value);
      setTrending(all);
    } catch {}
    setTrendingLoading(false);
  }, [trending.length]);

  // ─── Parallel search across ALL apps ───
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); setLoading(false); return; }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;
    const term = q.trim();
    const tl = term.toLowerCase();
    setLoading(true);

    const T: Promise<SearchResult[]>[] = [];

    // 1 — Chaturbate live rooms → click opens that room
    T.push((async () => {
      try {
        const d = await searchRooms(term, 1, 8, signal);
        if (signal.aborted) return [];
        return (d.rooms || []).slice(0, 6).map(r => ({
          id: `cam-${r.username}`, title: r.username,
          subtitle: r.subject?.replace(/<[^>]+>/g, '').slice(0, 40) || 'Live',
          category: 'camviewer', icon: <Radio size={12} className="text-red-400" />,
          route: '/camviewer', // CamViewer uses internal state, best we can do
          meta: `${(r.num_users || 0).toLocaleString()}`,
          thumbnailUrl: r.img,
        }));
      } catch { return []; }
    })());

    // 2 — Saved cam archive profiles → opens cam archive (profile selected internally)
    T.push((async () => {
      try {
        return getSavedProfiles().filter(u => u.toLowerCase().includes(tl)).slice(0, 5).map(u => ({
          id: `archive-${u}`, title: u, subtitle: 'Saved',
          category: 'camarchive', icon: <Clock size={12} />,
          route: '/camarchive',
        }));
      } catch { return []; }
    })());

    // 3 — Recordings
    T.push((async () => {
      try {
        const recs: Recording[] = await window.electronAPI?.recording?.list?.() || [];
        if (signal.aborted) return [];
        return recs.filter(r => r.username.toLowerCase().includes(tl) && r.status !== 'failed').slice(0, 5).map(r => ({
          id: `rec-${r.id}`, title: r.username,
          subtitle: r.status === 'recording' ? '🔴 Live' : fmtDuration(r.duration),
          category: 'recordings', icon: r.status === 'recording' ? <Radio size={12} className="text-red-500 animate-pulse" /> : <Film size={12} />,
          route: '/recordings',
          meta: r.fileSize ? fmtSize(r.fileSize) : undefined,
        }));
      } catch { return []; }
    })());

    // 4 — CoomerKemono creators → click opens /creators/$service/$id
    T.push((async () => {
      try {
        const db: any[] = await window.electronAPI?.db?.searchCreators?.(term) || [];
        if (signal.aborted) return [];
        const hits: SearchResult[] = db.slice(0, 8).map((c: any) => ({
          id: `creator-${c.id}-${c.service}`, title: c.name || c.id, subtitle: c.service,
          category: 'creators', icon: <Users size={12} />,
          route: `/creators/${c.service}/${c.id}`,
          meta: c.post_count ? `${c.post_count}` : undefined,
        }));
        return hits;
      } catch { return []; }
    })());

    // 5 — Fapello
    T.push((async () => {
      try {
        const { fetchSearchResults } = await import('./fapello/api');
        const r = await fetchSearchResults({ query: term });
        if (signal.aborted) return [];
        return (r.profiles || []).filter((p: any) => !p.isAd).slice(0, 5).map((p: any) => ({
          id: `fapello-${p.id}`, title: p.name || p.id, subtitle: 'Profile',
          category: 'fapello', icon: <Image size={12} />,
          route: '/fapello', thumbnailUrl: p.imageUrl,
        }));
      } catch { return []; }
    })());

    // 6 — JavTube video search → click opens /javtube/search/$query
    T.push((async () => {
      try {
        if (!window.javtube?.getVideos) return [];
        const r = await window.javtube.getVideos(1, 'search', term);
        if (signal.aborted || !r.success || !r.data) return [];
        return r.data.slice(0, 6).map((v: any) => ({
          id: `jav-${v.id || v.videoId || v.title}`,
          title: v.title || v.id || 'Untitled',
          subtitle: v.actress || v.duration || '',
          category: 'javtube', icon: <Sparkles size={12} />,
          route: `/javtube/search/${encodeURIComponent(term)}`,
          thumbnailUrl: v.thumbnail || v.thumbnailUrl || v.img,
        }));
      } catch { return []; }
    })());

    // 7 — Actresses → click opens /actress/$id
    T.push((async () => {
      try {
        if (!window.javtube?.getActresses) return [];
        const r = await window.javtube.getActresses(1);
        if (signal.aborted || !r.success || !r.data) return [];
        const arr = Array.isArray(r.data) ? r.data : [];
        return arr.filter((a: any) => a.name?.toLowerCase().includes(tl)).slice(0, 5).map((a: any) => ({
          id: `actress-${a.id}`, title: a.name,
          subtitle: a.videoCount ? `${a.videoCount} videos` : '',
          category: 'actresses', icon: <Users size={12} />,
          route: `/actress/${a.id}`,
          thumbnailUrl: a.thumbnail,
        }));
      } catch { return []; }
    })());

    // 8 — RedGifs creator search
    T.push((async () => {
      try {
        const r = await redGifsApiWithFallback.searchCreators(term, 1, 6);
        if (signal.aborted) return [];
        const users = r.users || r.gifs || [];
        return users.slice(0, 5).map((u: any) => ({
          id: `rg-${u.username || u.userName || u.id}`,
          title: u.username || u.userName || u.name || 'Unknown',
          subtitle: u.gifs ? `${u.gifs} gifs` : '',
          category: 'redgifs', icon: <Video size={12} />,
          route: '/redgifs', thumbnailUrl: u.profileImageUrl || u.urls?.thumbnail,
          meta: u.views ? abbrev(u.views) : undefined,
        }));
      } catch { return []; }
    })());

    // 9 — Wallhaven wallpaper search
    T.push((async () => {
      try {
        const API_KEY = 'EFkCFHGlTBVugFhK9SOI4F5GoQJTOW0W';
        const url = `https://wallhaven.cc/api/v1/search?apikey=${API_KEY}&q=${encodeURIComponent(term)}&categories=111&purity=110&sorting=relevance&page=1`;
        const res = await fetch(url, { signal });
        if (signal.aborted || !res.ok) return [];
        const json = await res.json();
        return (json.data || []).slice(0, 5).map((w: any) => ({
          id: `wh-${w.id}`, title: `${w.resolution}`,
          subtitle: w.category || 'Wallpaper',
          category: 'wallhaven', icon: <Monitor size={12} />,
          route: '/wallheaven',
          thumbnailUrl: w.thumbs?.small || w.thumbs?.original,
          meta: w.favorites ? `♥ ${w.favorites}` : undefined,
        }));
      } catch { return []; }
    })());

    // 10 — Creator Archive (coomer.su/kemono.su remote API)
    T.push((async () => {
      try {
        const [coomerRes, kemonoRes] = await Promise.all([
          axios.get(`https://coomer.su/api/v1/creators.txt?q=${encodeURIComponent(term)}`, { signal, timeout: 4000 }).catch(() => null),
          axios.get(`https://kemono.su/api/v1/creators.txt?q=${encodeURIComponent(term)}`, { signal, timeout: 4000 }).catch(() => null),
        ]);
        if (signal.aborted) return [];
        const parse = (res: any) => {
          if (!res?.data) return [];
          return Array.isArray(res.data) ? res.data : res.data?.data || [];
        };
        const all = [...parse(coomerRes), ...parse(kemonoRes)];
        return all.slice(0, 6).map((c: any) => ({
          id: `ck-${c.id}-${c.service}`, title: c.name || c.id,
          subtitle: c.service, category: 'coomerKemono', icon: <Layers size={12} />,
          route: '/coomerKemono',
          meta: c.favorited ? `♥ ${c.favorited}` : undefined,
        }));
      } catch { return []; }
    })());

    // 11 — NSFWAlbum search
    T.push((async () => {
      try {
        const { searchContent } = await import('./nsfwalbum/api');
        const imgs = await searchContent(term);
        if (signal.aborted) return [];
        return imgs.slice(0, 6).map(i => ({
          id: `nsfws-${i.id}`, title: i.title || i.id,
          subtitle: i.views ? `${i.views} views` : 'Album',
          category: 'nsfwalbum', icon: <Image size={12} />,
          route: '/nsfwalbum', thumbnailUrl: i.thumbs?.[0],
        }));
      } catch { return []; }
    })());

    const settled = await Promise.allSettled(T);
    if (signal.aborted) return;
    const all: SearchResult[] = [];
    for (const r of settled) if (r.status === 'fulfilled') all.push(...r.value);
    setResults(all);
    setSelectedId(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, performSearch]);

  const handleSelect = useCallback((result: SearchResult) => {
    // Save the current query to history if there is one
    if (query.trim().length >= 2) saveToHistory(query.trim());
    setIsOpen(false);
    navigate({ to: result.route as any, params: result.params as any });
  }, [navigate, query]);

  const grouped = CATS.map(c => ({ ...c, items: results.filter(r => r.category === c.key) })).filter(g => g.items.length > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[3vh]" onClick={() => setIsOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div
        className="relative w-[97vw] max-w-[1400px] bg-[#08080a] border border-white/8 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalIn 0.12s cubic-bezier(0.16, 1, 0.3, 1)', maxHeight: '90vh' }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 shrink-0">
          {loading
            ? <Loader2 size={15} className="text-cyan-400 animate-spin shrink-0" />
            : <Search size={15} className="text-white/25 shrink-0" />
          }
          <input
            ref={inputRef} type="text"
            placeholder="Search all apps…"
            value={query} onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20"
            autoFocus
          />
          {query && <button onClick={() => setQuery('')} className="text-white/20 hover:text-white/40"><X size={14} /></button>}
          <div className="flex items-center gap-2 text-[9px] text-white/15 font-medium">
            {loading && <span className="text-cyan-400/60">{CATS.length} apps</span>}
            {!loading && results.length > 0 && <span>{results.length} results</span>}
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 font-bold text-white/20">ESC</kbd>
          </div>
        </div>

        {/* Waterfall results — gapless edge-to-edge */}
        {grouped.length > 0 ? (
          <div className="flex-1 overflow-y-auto" style={{ columns: grouped.length <= 2 ? 2 : grouped.length <= 4 ? 3 : 4, columnGap: 0 }}>
            {grouped.map(g => (
              <div key={g.key} className="break-inside-avoid">
                {/* Category divider — thin full-width */}
                <div className={`flex items-center gap-1.5 px-3 py-[3px] ${g.bgColor} border-b border-t ${g.borderColor}`}>
                  <span className={g.color}>{g.icon}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{g.label}</span>
                  <span className="text-[8px] text-white/15 ml-auto tabular-nums">{g.items.length}</span>
                </div>

                {/* Results — dense stacking */}
                {g.items.map(r => (
                  <button
                    key={r.id} onClick={() => handleSelect(r)}
                    onMouseEnter={() => setSelectedId(r.id)}
                    className={`w-full text-left transition-colors duration-50 border-b border-white/[0.02] ${
                      selectedId === r.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Thumbnail row — show large thumb if available */}
                    {r.thumbnailUrl && (
                      <div className="w-full aspect-video bg-white/[0.02] overflow-hidden">
                        <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    {/* Info row */}
                    <div className="flex items-center gap-1.5 px-2 py-[4px]">
                      {!r.thumbnailUrl && (
                        <span className={`${g.color} opacity-50 shrink-0`}>{r.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-white/80 truncate leading-tight">{r.title}</div>
                        {r.subtitle && <div className="text-[8px] text-white/20 truncate leading-tight">{r.subtitle}</div>}
                      </div>
                      {r.meta && (
                        <span className="text-[7px] px-1 py-px rounded bg-white/5 text-white/25 font-bold shrink-0 tabular-nums">{r.meta}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : query && query.length >= 2 && !loading ? (
          <div className="px-5 py-12 text-center text-white/25 text-sm">No results for "<span className="text-white/40">{query}</span>"</div>
        ) : query && query.length < 2 && query.length > 0 ? (
          <div className="px-5 py-6 text-center text-white/20 text-xs">Type at least 2 characters</div>
        ) : (
          /* ─── Empty state: recent searches + trending ─── */
          <div className="flex-1 overflow-y-auto">
            {/* Recent Searches */}
            {history.length > 0 && (
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <History size={10} className="text-white/20" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/25">Recent</span>
                  </div>
                  <button onClick={() => { clearHistory(); setHistory([]); }} className="text-[8px] text-white/15 hover:text-white/30 flex items-center gap-1">
                    <Trash2 size={8} /> Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {history.map(h => (
                    <button key={h} onClick={() => setQuery(h)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/50 hover:text-white/80 hover:bg-white/[0.08] transition-all">
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div className="px-4 pt-2 pb-1">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={10} className="text-cyan-400/50" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/25">Trending Now</span>
                {trendingLoading && <Loader2 size={9} className="text-cyan-400/40 animate-spin" />}
              </div>
            </div>

            {trending.length > 0 ? (
              <div style={{ columns: 4, columnGap: 0 }}>
                {/* Group trending by category */}
                {CATS.map(cat => {
                  const catItems = trending.filter(r => r.category === cat.key);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat.key} className="break-inside-avoid">
                      <div className={`flex items-center gap-1.5 px-3 py-[3px] ${cat.bgColor} border-b border-t ${cat.borderColor}`}>
                        <span className={cat.color}>{cat.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{cat.label}</span>
                      </div>
                      {catItems.map(r => (
                        <button
                          key={r.id} onClick={() => handleSelect(r)}
                          onMouseEnter={() => setSelectedId(r.id)}
                          onMouseLeave={() => setSelectedId(null)}
                          className={`group/item w-full text-left transition-colors duration-50 border-b border-white/[0.02] ${
                            selectedId === r.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          {/* Thumbnail — hidden by default, shown on hover */}
                          {r.thumbnailUrl && (
                            <div className="w-full aspect-video bg-white/[0.02] overflow-hidden hidden group-hover/item:block">
                              <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 px-2 py-[4px]">
                            <span className={`${cat.color} opacity-50 shrink-0`}>{r.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] text-white/80 truncate leading-tight">{r.title}</div>
                              {r.subtitle && <div className="text-[8px] text-white/20 truncate leading-tight">{r.subtitle}</div>}
                            </div>
                            {r.meta && <span className="text-[7px] px-1 py-px rounded bg-white/5 text-white/25 font-bold shrink-0 tabular-nums">{r.meta}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : !trendingLoading ? (
              <div className="px-5 py-4 text-center">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {CATS.map(c => (
                    <span key={c.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${c.bgColor} ${c.color} text-[8px] font-bold opacity-40`}>
                      {c.icon} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtDuration(s: number | null): string {
  if (!s) return '0s';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtSize(b: number | null): string {
  if (!b) return '';
  if (b < 1e6) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1e9) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e9).toFixed(2)} GB`;
}
function abbrev(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}
