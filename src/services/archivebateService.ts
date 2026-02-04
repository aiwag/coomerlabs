/**
 * Fetch archive videos using Livewire API via IPC
 * This delegates to the main process where JSDOM can run safely
 */
export async function fetchArchiveProfile(
  username: string,
  page: number = 1
): Promise<ArchiveProfileResponse> {
  console.log('[ArchiveBate] fetchArchiveProfile called:', { username, page });
  console.log('[ArchiveBate] window.electronAPI available:', !!window.electronAPI);
  console.log('[ArchiveBate] archivebate API available:', !!window.electronAPI?.archivebate);

  try {
    if (!window.electronAPI?.archivebate?.getProfile) {
      console.error('ArchiveBate API not available');
      return {
        username,
        videos: [],
        currentPage: page,
        totalPages: 1,
        hasMore: false,
      };
    }

    console.log('[ArchiveBate] Calling IPC getProfile...');
    const response = await window.electronAPI.archivebate.getProfile(username, page);
    console.log('[ArchiveBate] IPC response:', response);

    if (response.success && response.data) {
      return response.data;
    } else {
      console.error('Failed to fetch archive profile:', response.error);
      return {
        username,
        videos: [],
        currentPage: page,
        totalPages: 1,
        hasMore: false,
      };
    }
  } catch (error) {
    console.error('Error fetching archivebate profile:', error);
    return {
      username,
      videos: [],
      currentPage: page,
      totalPages: 1,
      hasMore: false,
    };
  }
}

/**
 * Get embed URL from video page via IPC
 */
export async function getVideoEmbedUrl(pageUrl: string): Promise<string> {
  try {
    if (!window.electronAPI?.archivebate?.getEmbedUrl) {
      console.error('ArchiveBate API not available');
      return '';
    }

    const response = await window.electronAPI.archivebate.getEmbedUrl(pageUrl);

    if (response.success && response.data) {
      return response.data.embedUrl;
    } else {
      console.error('Failed to fetch embed URL:', response.error);
      return '';
    }
  } catch (error) {
    console.error('Error fetching embed URL:', error);
    return '';
  }
}
