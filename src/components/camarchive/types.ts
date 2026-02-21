// Camarchive Types

export interface CamProfile {
  id: string;
  username: string;
  profileUrl: string;
  thumbnailUrl?: string;
  platform: string;
  lastViewed?: string;
  videoCount?: number;
}

export interface Video {
  id: string;
  watchUrl: string;
  thumbnailUrl: string;
  previewVideoUrl: string;
  duration: string;
  uploaded: string;
  platform: string;
  views: number;
  username: string;
  profileUrl: string;
  embedUrl?: string;
}

export interface CamarchiveSettings {
  viewedProfiles: string[];
}
