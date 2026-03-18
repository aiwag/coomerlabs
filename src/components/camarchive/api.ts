// Camarchive API Service
import type { CamProfile, Video } from './types';

const STORAGE_KEY = 'camarchive-viewed-profiles';

// Add profile to saved list
export const addSavedProfile = (username: string) => {
  const profiles = getSavedProfiles();
  if (!profiles.includes(username)) {
    profiles.unshift(username); // Add to beginning (most recent first)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }
};

// Remove profile from saved list
export const removeSavedProfile = (username: string) => {
  const profiles = getSavedProfiles();
  const filtered = profiles.filter(p => p !== username);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Check if profile is saved
export const isProfileSaved = (username: string): boolean => {
  return getSavedProfiles().includes(username);
};

// Get saved profiles from local storage
export const getSavedProfiles = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Legacy alias
export const getViewedProfiles = getSavedProfiles;
export const addViewedProfile = addSavedProfile;

// Fetch profile videos from archivebate using Electron IPC (to bypass CORS/headers restrictions)
export const fetchProfileVideos = async (username: string, page: number = 1): Promise<{ videos: Video[] }> => {
  const result = await fetchArchiveProfile(username, page);
  return { videos: result.videos };
};

export const fetchArchiveProfile = async (username: string, page: number = 1): Promise<{ videos: Video[], hasMore: boolean, currentPage: number }> => {
  try {
    console.log('[CamArchive API] Using IPC to fetch videos for:', username, 'page:', page);
    const api = (window as any).electronAPI?.archivebate || (window as any).archivebate;
    const result = await api.getProfile(username, page);

    if (!result.success || !result.data) {
      console.error('[CamArchive API] IPC fetch failed:', result.error);
      return { videos: [], hasMore: false, currentPage: page };
    }

    // Map ArchiveVideo from IPC to CamArchive Video type
    const videos: Video[] = result.data.videos.map((av: any) => ({
      id: av.id,
      watchUrl: av.pageUrl,
      thumbnailUrl: av.thumbnail,
      previewVideoUrl: '',
      duration: av.duration || '',
      uploaded: av.date || '',
      platform: 'Chaturbate',
      views: parseInt(av.views?.replace(/\D/g, '') || '0') || 0,
      username: username,
      profileUrl: `https://archivebate.com/profile/${username}`
    }));

    return {
      videos,
      hasMore: result.data.hasMore,
      currentPage: result.data.currentPage
    };
  } catch (error) {
    console.error(`Error fetching videos for ${username} via IPC:`, error);
    return { videos: [], hasMore: false, currentPage: page };
  }
};

// Get profile list from saved profiles
export const getViewedProfilesList = async (): Promise<CamProfile[]> => {
  const usernames = getSavedProfiles();

  const profiles: CamProfile[] = usernames.map(username => ({
    id: username,
    username,
    profileUrl: `https://archivebate.com/profile/${username}`,
    thumbnailUrl: '',
    platform: 'Chaturbate',
    lastViewed: new Date().toISOString()
  }));

  return profiles;
};
