// RedGifs - Favorites Tab — Followed Creator Profiles
import { createFileRoute, Link } from "@tanstack/react-router";
import React from 'react';
import { Heart, Users, X, ExternalLink } from 'lucide-react';
import { useRedgifsFavorites } from '../components/redgifs/hooks';

const FavoriteCreatorCard = React.memo(({ username, onRemove }: { username: string; onRemove: () => void }) => {
  const initial = (username?.[0] ?? '?').toUpperCase();

  return (
    <div className="group relative overflow-hidden h-full" style={{ backgroundColor: '#1a1a2e' }}>
      <Link
        to="/redgifs/users/$username"
        params={{ username }}
        className="block h-full no-underline text-inherit"
      >
        {/* Avatar background */}
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-rose-500/10">
          <span className="text-5xl font-black text-white/15 group-hover:text-white/25 transition-colors">
            {initial}
          </span>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <p className="text-xs font-bold text-white truncate leading-tight">@{username}</p>
        </div>

        {/* Hover ring */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-pink-500/50 transition-all duration-200 pointer-events-none" />
      </Link>

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-red-500/80 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Unfollow"
      >
        <X size={10} />
      </button>
    </div>
  );
});

FavoriteCreatorCard.displayName = 'FavoriteCreatorCard';

const RedgifsFavorites = () => {
  const { followed, removeFollow } = useRedgifsFavorites();

  return (
    <div className="h-full overflow-y-auto">
      {followed.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1px',
          }}
        >
          {followed.map((username) => (
            <div key={username} style={{ aspectRatio: '3/4' }}>
              <FavoriteCreatorCard
                username={username}
                onRemove={() => removeFollow(username)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 gap-3">
          <Heart size={48} className="text-white/10" />
          <p className="text-white/40 text-sm font-medium">No followed creators yet</p>
          <p className="text-white/20 text-xs">Follow creators from their profile pages</p>
          <Link
            to="/redgifs/creators"
            className="mt-2 px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold hover:bg-pink-500/20 transition-all no-underline"
          >
            Browse Creators
          </Link>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute('/redgifs/favorites')({
  component: RedgifsFavorites,
});
