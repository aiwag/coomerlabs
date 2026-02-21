// Camarchive API Service
import type { CamProfile, Video } from './types';

// Add profile to viewed history
export const addViewedProfile = (username: string) => {
  const viewed = getViewedProfiles();
  if (!viewed.includes(username)) {
    viewed.push(username);
    localStorage.setItem('camarchive-viewed-profiles', JSON.stringify(viewed));
  }
};

// Get viewed profiles from local storage
export const getViewedProfiles = (): string[] => {
  try {
    const stored = localStorage.getItem('camarchive-viewed-profiles');
    const profiles: string[] = stored ? JSON.parse(stored) : [];

    // Add defaults if they don't exist
    const defaults = ['laura_mutti', 'vasillisa'];
    let hasChanged = false;

    defaults.forEach(user => {
      if (!profiles.includes(user)) {
        profiles.push(user);
        hasChanged = true;
      }
    });

    if (hasChanged) {
      localStorage.setItem('camarchive-viewed-profiles', JSON.stringify(profiles));
    }

    return profiles;
  } catch {
    return ['laura_mutti', 'vasillisa'];
  }
};

// Fetch profile videos from archivebate using Electron IPC (to bypass CORS/headers restrictions)
export const fetchProfileVideos = async (username: string, page: number = 1): Promise<{ videos: Video[] }> => {
  const result = await fetchArchiveProfile(username, page);
  return { videos: result.videos };
};

export const fetchArchiveProfile = async (username: string, page: number = 1): Promise<{ videos: Video[], hasMore: boolean, currentPage: number }> => {
  try {
    console.log('[CamArchive API] Using IPC to fetch videos for:', username, 'page:', page);
    // Note: window.electronAPI.archivebate is the standardized way other parts of the app use IPC
    // but camarchive.tsx seems to use window.archivebate. Check which one is correct.
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

// Get profile list from history
export const getViewedProfilesList = async (): Promise<CamProfile[]> => {
  const usernames = getViewedProfiles();

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
