import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Star, TrendingUp, Calendar, ArrowLeft,
  MessageSquare, Share2, Download, Info, Grid, List as ListIcon,
  Image as ImageIcon, Film, LayoutGrid, LayoutList,
  ExternalLink, Heart, Bookmark, Eye, Clock, Maximize2, X,
  RotateCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  name: string;
  service: string;
  indexed: string;
  updated: string;
  public_id: string;
  relation_id: string | null;
  post_count: number;
  dm_count: number;
  share_count: number;
  chat_count: number;
}

interface Post {
  id: string;
  user: string;
  service: string;
  title: string;
  content: string;
  published: string;
  file?: {
    name: string;
    path: string;
  };
  attachments: Array<{
    name: string;
    path: string;
  }>;
}

export const Route = createFileRoute('/creators/$service/$id')({
  component: CreatorDetailRoute,
});

function CreatorDetailRoute() {
  const { service, id } = Route.useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');
  const [selectedPost, setSelectedPost] = useState<{ post: Post, index: number } | null>(null);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const postsPerPage = 50;

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const resp = await fetch(`https://coomer.st/api/v1/${service}/user/${id}/profile`, {
        headers: { 'User-Agent': 'yaak', Accept: 'text/css' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setProfile(data);
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      // Profile fail is non-fatal for posts but worth noting
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchPosts = useCallback(async (currentOffset: number) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(`https://coomer.st/api/v1/${service}/user/${id}/posts?o=${currentOffset}`, {
        headers: { 'User-Agent': 'yaak', Accept: 'text/css' },
      });

      if (resp.status === 404) {
        setHasMore(false); // Likely end of data or invalid ID
        throw new Error('Creator content not found (404)');
      }

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: Post[] = await resp.json();

      if (data.length < postsPerPage) {
        setHasMore(false);
      }

      setPosts(prev => currentOffset === 0 ? data : [...prev, ...data]);
      setOffset(currentOffset + data.length);
    } catch (err: any) {
      console.error('Failed to fetch posts:', err);
      setError(err.message);
      toast.error(err.message === 'Creator content not found (404)' ? 'No posts found for this creator' : 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [service, id, isLoading]);

  useEffect(() => {
    fetchProfile();
    fetchPosts(0);
  }, [service, id]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore || isLoading || error) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchPosts(offset);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchPosts, offset, hasMore, isLoading, error]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoadingProfile && !profile) {
    return (
      <div className="flex h-full items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-white">
      {/* ── Header ── */}
      <div className="relative h-64 shrink-0 overflow-hidden">
        {/* Banner/Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/40 via-[#09090b] to-[#09090b]" />

        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="max-w-6xl mx-auto w-full flex items-end gap-6">
            {/* Avatar Placeholder */}
            <div className="w-32 h-32 rounded-2xl bg-white/10 border-4 border-[#09090b] flex items-center justify-center text-4xl font-bold shadow-2xl relative group overflow-hidden">
              {profile?.name?.[0]?.toUpperCase() || '?'}
              <img
                src={`https://coomer.st/icons/${service}/${id}`}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                alt=""
              />
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black tracking-tight">{profile?.name || id}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {service}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-medium">{profile?.post_count || 0}</span> Posts
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-white font-medium">{profile?.dm_count || 0}</span> DMs
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Updated: {profile ? formatDate(profile.updated) : 'Never'}</span>
                </div>
              </div>
            </div>

            <div className="pb-2 flex gap-2">
              <Link
                to="/creators"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/60 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <button className="px-6 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Favorite
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        <div className="max-w-6xl mx-auto">
          {/* Post Grid */}
          {!error && posts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {posts.map((post, idx) => (
                <div
                  key={post.id}
                  className="group relative aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all"
                  onClick={() => setSelectedPost({ post, index: idx })}
                >
                  {/* Media Preview */}
                  <PostMediaPreview post={post} service={service} id={id} />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-[11px] font-medium line-clamp-2 leading-tight mb-1">{post.title || 'Untitled Post'}</p>
                    <div className="flex items-center gap-2 text-[10px] text-white/60">
                      <Clock className="w-3 h-3" />
                      {formatDate(post.published)}
                    </div>
                  </div>

                  {/* Multiple indicator */}
                  {post.attachments.length > 0 && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold">
                      +{post.attachments.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <Info className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Failed to load posts</h3>
                <p className="text-white/40 text-sm max-w-xs mx-auto mt-1">{error}</p>
              </div>
              <button
                onClick={() => fetchPosts(offset)}
                className="mt-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Retry Loading
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && posts.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center text-white/20">
              <ImageIcon className="w-16 h-16 opacity-10" />
              <p className="text-sm">No posts found for this creator</p>
            </div>
          )}

          {/* Infinity Loader */}
          <div ref={loaderRef} className="py-12 flex justify-center">
            {isLoading && !error ? (
              <div className="flex items-center gap-3 text-white/30 text-sm">
                <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                Loading more posts...
              </div>
            ) : (!hasMore && posts.length > 0 ? (
              <p className="text-white/20 text-sm italic">You've reached the end of the timeline</p>
            ) : null)}
          </div>
        </div>
      </div>

      {/* ── Simple Lightbox ── */}
      {selectedPost && (
        <PostLightbox
          data={selectedPost}
          onClose={() => setSelectedPost(null)}
          service={service}
        />
      )}
    </div>
  );
}

function PostMediaPreview({ post, service, id }: { post: Post, service: string, id: string }) {
  const mediaPath = post.file?.path || post.attachments?.[0]?.path;
  if (!mediaPath) return <div className="w-full h-full flex items-center justify-center text-white/10"><ImageIcon className="w-8 h-8" /></div>;

  const url = `https://coomer.st${mediaPath}`;
  const isVid = post.file?.name?.toLowerCase().includes('.mp4') || post.attachments?.[0]?.name?.toLowerCase().includes('.mp4');

  return (
    <div className="w-full h-full relative">
      <img
        src={url}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-white/5');
        }}
      />
      {isVid && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Film className="w-8 h-8 text-white/50 drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}

function PostLightbox({ data, onClose, service }: { data: { post: Post, index: number }, onClose: () => void, service: string }) {
  const { post } = data;
  const [currentAttachment, setCurrentAttachment] = useState(0);

  const attachments = [
    ...(post.file ? [post.file] : []),
    ...post.attachments
  ];

  const currentMedia = attachments[currentAttachment];
  const url = `https://coomer.st${currentMedia?.path}`;
  const isVid = currentMedia?.name?.toLowerCase().includes('.mp4');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full h-full flex flex-col md:flex-row overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Media Side */}
        <div className="flex-1 relative flex items-center justify-center p-4 bg-black">
          {isVid ? (
            <video src={url} controls autoPlay className="max-w-full max-h-full rounded-lg" />
          ) : (
            <img src={url} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="" />
          )}

          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {attachments.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 border border-white/10 flex items-center gap-4">
              <button
                disabled={currentAttachment === 0}
                onClick={() => setCurrentAttachment(prev => prev - 1)}
                className="text-white/40 hover:text-white disabled:opacity-20"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-mono">{currentAttachment + 1} / {attachments.length}</span>
              <button
                disabled={currentAttachment === attachments.length - 1}
                onClick={() => setCurrentAttachment(prev => prev + 1)}
                className="text-white/40 hover:text-white disabled:opacity-20 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
          )}
        </div>

        {/* Info Side */}
        <div className="w-full md:w-96 h-full bg-[#121214] border-l border-white/10 flex flex-col p-8 overflow-y-auto custom-scrollbar">
          <h2 className="text-xl font-bold mb-4 leading-tight">{post.title || 'Untitled Post'}</h2>

          <div className="flex items-center gap-2 text-white/50 text-xs mb-8">
            <Calendar className="w-4 h-4" />
            {new Date(post.published).toLocaleString()}
          </div>

          {post.content && (
            <div
              className="text-sm text-white/70 leading-relaxed mb-8 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          <div className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-3">
            <button className="h-12 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center justify-center gap-2 transition-all">
              <Download className="w-4 h-4" />
              Download Original
            </button>
            <button className="h-12 w-full rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-2 transition-all" onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success('Link copied');
            }}>
              <Share2 className="w-4 h-4" />
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
