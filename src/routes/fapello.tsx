// Fapello Route - Clean Modular Implementation - Optimized
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
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
import type { Profile, Image, CreatorProfile } from '../components/fapello/types';

// Loading spinner component
const LoadingSpinner = memo(({ message = 'Loading...' }: { message?: string }) => (
  <div className='flex flex-col justify-center items-center h-64 gap-4'>
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500"></div>
      <div className="absolute inset-0 animate-pulse rounded-full h-12 w-12 border-4 border-transparent border-t-blue-400/30"></div>
    </div>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Error state component
const ErrorState = memo(({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="text-center py-12">
    <div className="inline-flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
));
ErrorState.displayName = 'ErrorState';

// Empty state component
const EmptyState = memo(({ message }: { message: string }) => (
  <div className="text-center py-16">
    <div className="inline-flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-gray-500">{message}</p>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    staleTime: 10 * 60 * 1000, // 10 minutes
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
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchValue('');
  }, []);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // Memoized profiles with filtering
  const displayedProfiles = useMemo(() => {
    let profiles = profilesData?.pages.flatMap(page => page.profiles) || [];

    if (searchValue && searchValue !== debouncedSearchValue) {
      profiles = profiles.filter(p => p.name.toLowerCase().includes(searchValue.toLowerCase()));
    }

    if (currentFilter !== 'All') {
      switch (currentFilter) {
        case 'Verified': profiles = profiles.filter(p => p.verified); break;
        case 'Premium': profiles = profiles.filter(p => p.premium); break;
        case 'New': profiles = profiles.filter(p => p.postCount && p.postCount < 100); break;
        case 'Trending': profiles = profiles.filter(p => p.postCount && p.postCount > 200); break;
        case 'Followed':
          profiles = profiles.filter(p => settings.followedProfiles && settings.followedProfiles.includes(p.id));
          break;
      }
    }
    return profiles;
  }, [profilesData, searchValue, debouncedSearchValue, currentFilter, settings.followedProfiles]);

  // Memoized creator images
  const creatorImages = useMemo(() => {
    return creatorData?.pages.flatMap(page => page.images) || [];
  }, [creatorData]);

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

  // Memoized render item functions
  const renderProfileCard = useCallback((profile: Profile, index: number) => (
    <ProfileCard key={profile.id} profile={profile} index={index} onClick={() => handleProfileClick(profile)} />
  ), [handleProfileClick]);

  const renderImageCard = useCallback((image: Image, index: number) => (
    <ImageCard key={image.id} image={image} index={index} onImageClick={handleImageClick} />
  ), [handleImageClick]);

  return (
    <div className="h-screen flex flex-col bg-transparent overflow-hidden">
      <Header
        title={creatorId ? creatorName : 'Trending Profiles'}
        showBackButton={!!creatorId}
        onBackClick={handleBackToTrending}
        showSearch={!creatorId}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        showFilter={!creatorId}
        onFilter={handleFilter}
        onSettingsClick={handleSettingsClick}
      />

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className={`w-full px-2 ${settings.compactView ? 'py-1' : 'py-2'}`}>
          {!creatorId ? (
            // Trending View
            isLoadingTrending ? (
              <LoadingSpinner message="Loading trending profiles..." />
            ) : trendingError ? (
              <ErrorState
                message="Failed to load trending profiles"
                onRetry={() => window.location.reload()}
              />
            ) : displayedProfiles.length === 0 ? (
              <EmptyState message="No profiles found" />
            ) : (
              <WaterfallGallery
                items={displayedProfiles}
                renderItem={renderProfileCard}
                columnCount={settings.columnCount || 4}
                hasNextPage={!!hasNextTrendingPage}
                fetchNextPage={fetchNextTrendingPage}
              />
            )
          ) : (
            // Profile View
            isLoadingProfile ? (
              <LoadingSpinner message="Loading profile..." />
            ) : profileError ? (
              <ErrorState
                message="Failed to load profile"
                onRetry={handleBackToTrending}
              />
            ) : creatorProfile ? (
              <>
                <ProfileHeader profile={creatorProfile} onClose={handleBackToTrending} />

                {isLoadingImages ? (
                  <LoadingSpinner message="Loading images..." />
                ) : imagesError ? (
                  <ErrorState
                    message="Failed to load images"
                    onRetry={() => window.location.reload()}
                  />
                ) : creatorImages.length === 0 ? (
                  <EmptyState message="No images found for this creator" />
                ) : (
                  <WaterfallGallery
                    items={creatorImages}
                    renderItem={renderImageCard}
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
        onClose={handleSettingsClose}
      />
    </div>
  );
};

export const Route = createFileRoute('/fapello')({
  component: FapelloRoute,
});
