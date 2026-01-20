// Fapello Route - Clean Modular Implementation
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Components
import { Header } from '../components/fapello/Header';
import { WaterfallGallery } from '../components/fapello/WaterfallGallery';
import { ProfileCard } from '../components/fapello/ProfileCard';
import { ImageCard } from '../components/fapello/ImageCard';
import { ProfileHeader } from '../components/fapello/ProfileHeader';
import { ImageModal } from '../components/fapello/ImageModal';
import { SettingsPanel } from '../components/fapello/SettingsPanel';

// Hooks & API
import { useSettings, useDebounce } from '../components/fapello/hooks';
import * as api from '../components/fapello/api';

// Types
import { Profile, Image, CreatorProfile } from '../components/fapello/types';

const FapelloRoute = () => {
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentFilter, setCurrentFilter] = useState('All');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings } = useSettings();
  const debouncedSearchValue = useDebounce(searchValue, 500);

  // Fetch profiles (trending or search)
  const {
    data: profilesData,
    fetchNextPage: fetchNextTrendingPage,
    hasNextPage: hasNextTrendingPage,
    isLoading: isLoadingTrending,
    error: trendingError
  } = useInfiniteQuery({
    queryKey: ['profiles', currentFilter, debouncedSearchValue],
    queryFn: ({ pageParam }) => {
      if (debouncedSearchValue) {
        return api.fetchSearchResults({ pageParam: pageParam as number, query: debouncedSearchValue });
      }
      return api.fetchTrendingProfiles({ pageParam: pageParam as number });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  // Fetch creator profile and images
  const {
    data: creatorProfile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery({
    queryKey: ['creatorProfile', creatorId],
    queryFn: () => api.fetchCreatorProfile(creatorId!),
    enabled: !!creatorId,
    retry: 2,
    retryDelay: 1000,
  });

  const {
    data: creatorData,
    fetchNextPage: fetchNextCreatorPage,
    hasNextPage: hasNextCreatorPage,
    isLoading: isLoadingImages,
    error: imagesError
  } = useInfiniteQuery({
    queryKey: ['creatorImages', creatorId],
    queryFn: ({ pageParam = 1 }) => api.fetchCreatorImages({ pageParam, creatorId: creatorId! }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!creatorId,
    retry: 2,
    retryDelay: 1000,
  });

  // Event handlers
  const handleProfileClick = useCallback((profile: Profile) => {
    if (profile.isAd) return;
    const id = api.extractCreatorId(profile);
    setCreatorId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToTrending = useCallback(() => {
    setCreatorId(null);
  }, []);

  const handleImageClick = useCallback((image: Image, index: number) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsImageModalOpen(false);
  }, []);

  const handleFilter = useCallback((filter: string) => {
    setCurrentFilter(filter);
  }, []);

  // Memoized profiles
  const displayedProfiles = useMemo(() => {
    let profiles = profilesData?.pages.flatMap(page => page.profiles) || [];

    if (searchValue && searchValue !== debouncedSearchValue) {
      profiles = profiles.filter(p => p.name.toLowerCase().includes(searchValue.toLowerCase()));
    } else if (debouncedSearchValue) {
      // Search results from server
    }

    if (currentFilter !== 'All') {
      switch (currentFilter) {
        case 'Verified': profiles = profiles.filter(p => p.verified); break;
        case 'Premium': profiles = profiles.filter(p => p.premium); break;
        case 'New': profiles = profiles.filter(p => p.postCount && p.postCount < 100); break;
        case 'Trending': profiles = profiles.filter(p => p.postCount && p.postCount > 200); break;
      }
    }
    return profiles;
  }, [profilesData, searchValue, debouncedSearchValue, currentFilter]);

  const creatorImages = creatorData?.pages.flatMap(page => page.images) || [];
  const creatorName = creatorProfile?.name || '';

  // Custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); border-radius: 4px; }
      ::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.7); }
      .dark ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
      .dark ::-webkit-scrollbar-thumb { background: rgba(75, 85, 99, 0.5); }
      .dark ::-webkit-scrollbar-thumb:hover { background: rgba(75, 85, 99, 0.7); }
      .glass-header { background: rgba(17, 24, 39, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
      .glass-card { background: rgba(31, 41, 55, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-transparent overflow-hidden">
      <Header
        title={creatorId ? creatorName : 'Trending Profiles'}
        showBackButton={!!creatorId}
        onBackClick={handleBackToTrending}
        showSearch={!creatorId}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClear={() => setSearchValue('')}
        showFilter={!creatorId}
        onFilter={handleFilter}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className={`w-full px-2 ${settings.compactView ? 'py-1' : 'py-2'}`}>
          {!creatorId ? (
            // Trending View
            isLoadingTrending ? (
              <div className='flex justify-center items-center h-64'>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : trendingError ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">Failed to load trending profiles</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Try Again
                </button>
              </div>
            ) : displayedProfiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No profiles found</p>
              </div>
            ) : (
              <WaterfallGallery
                items={displayedProfiles}
                renderItem={(profile, index) => (
                  <ProfileCard key={profile.id} profile={profile} index={index} onClick={() => handleProfileClick(profile)} />
                )}
                columnCount={settings.columnCount || 4}
                hasNextPage={!!hasNextTrendingPage}
                fetchNextPage={fetchNextTrendingPage}
              />
            )
          ) : (
            // Profile View
            isLoadingProfile ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : profileError ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">Failed to load profile</p>
                <button onClick={handleBackToTrending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Back to Trending
                </button>
              </div>
            ) : creatorProfile ? (
              <>
                <ProfileHeader profile={creatorProfile} onClose={handleBackToTrending} />

                {isLoadingImages ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : imagesError ? (
                  <div className="text-center py-12">
                    <p className="text-red-500 mb-4">Failed to load images</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Try Again
                    </button>
                  </div>
                ) : creatorImages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No images found for this creator</p>
                  </div>
                ) : (
                  <WaterfallGallery
                    items={creatorImages}
                    renderItem={(image, index) => (
                      <ImageCard key={image.id} image={image} index={index} onImageClick={handleImageClick} />
                    )}
                    columnCount={settings.columnCount || 4}
                    hasNextPage={!!hasNextCreatorPage}
                    fetchNextPage={fetchNextCreatorPage}
                  />
                )}
              </>
            ) : null
          )}
        </div>
      </div>

      <ImageModal
        images={creatorImages}
        currentIndex={selectedImageIndex}
        isOpen={isImageModalOpen}
        onClose={handleModalClose}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export const Route = createFileRoute('/fapello')({
  component: FapelloRoute,
});
