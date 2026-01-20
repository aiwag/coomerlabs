// Fapello ProfileHeader Component
import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  User,
  Star,
  Check,
  Bookmark,
  Calendar,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettings } from './hooks';
import { CreatorProfile } from './types';

interface ProfileHeaderProps {
  profile: CreatorProfile;
  onClose: () => void;
}

export const ProfileHeader = ({ profile, onClose }: ProfileHeaderProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const { settings } = useSettings();

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast(isFollowing ? 'Unfollowed' : 'Following');
  };

  return (
    <div className="relative glass-card rounded-2xl overflow-hidden mb-6 border-white/5 shadow-2xl">
      <div className={`${settings.compactView ? 'h-24' : 'h-32 md:h-40'} bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 relative`}>
        {profile.coverUrl && (
          <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <button onClick={onClose} className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="absolute top-2 right-2 flex gap-1">
          <button className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
            <Share2 className="w-4 h-4 text-white" />
          </button>
          <button className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-4">
          <div className="relative">
            <div className={`${settings.compactView ? 'w-16 h-16' : 'w-20 h-20 md:w-24 md:h-24'} rounded-full border-4 border-gray-900 bg-gray-800 overflow-hidden`}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-600" />
                </div>
              )}
            </div>
            {profile.verified && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {profile.premium && (
              <div className="absolute top-0 right-0 bg-yellow-500 rounded-full p-1">
                <Star className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className={`${settings.compactView ? 'text-lg' : 'text-xl md:text-2xl'} font-bold text-white mb-1 flex items-center justify-center md:justify-start gap-2`}>
              {profile.name}
              {profile.verified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {profile.premium && (
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </h2>
            {!settings.compactView && (
              <p className="text-gray-300 mb-2 text-sm">{profile.bio}</p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs text-gray-400 mb-2">
              <div>
                <span className="font-semibold text-white">{profile.postCount}</span>
                <span className="ml-1">posts</span>
              </div>
              {profile.followers && (
                <div>
                  <span className="font-semibold text-white">{profile.followers.toLocaleString()}</span>
                  <span className="ml-1">followers</span>
                </div>
              )}
              {profile.following && (
                <div>
                  <span className="font-semibold text-white">{profile.following}</span>
                  <span className="ml-1">following</span>
                </div>
              )}
              <div className="flex items-center gap-0.5">
                <Calendar className="w-3 h-3" />
                <span>Joined {profile.joinDate}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span>Active {profile.lastActive}</span>
              </div>
              {profile.rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{profile.rating}</span>
                </div>
              )}
            </div>

            {!settings.compactView && profile.categories && profile.categories.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-1 mb-4">
                {profile.categories.map((cat) => (
                  <span key={cat} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-gray-300 border border-white/5">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={handleFollow}
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${isFollowing ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">
              <Bookmark className="w-4 h-4" />
            </button>
            <button className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!settings.compactView && profile.stats && (
          <div className="grid grid-cols-3 gap-2 mb-4 p-3 glass-card rounded-2xl border-white/5">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{(profile.stats?.totalLikes || 0).toLocaleString()}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Likes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{(profile.stats?.totalViews || 0).toLocaleString()}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{profile.stats?.avgRating || 0}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Avg Rating</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
