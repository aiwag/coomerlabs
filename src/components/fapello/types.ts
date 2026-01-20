// Fapello Types

export interface Image {
  id: string;
  imageUrl: string;
  fullImageUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  likes?: number;
  views?: number;
  comments?: number;
  uploadDate?: string;
  duration?: number;
  isVideo?: boolean;
}

export interface CreatorProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  postCount: number;
  followers?: number;
  following?: number;
  verified?: boolean;
  premium?: boolean;
  joinDate?: string;
  lastActive?: string;
  rating?: number;
  categories?: string[];
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    onlyfans?: string;
    fansly?: string;
    website?: string;
  };
  stats?: {
    totalLikes: number;
    totalViews: number;
    avgRating: number;
  };
}

export interface Profile {
  id: string;
  name: string;
  imageUrl: string;
  profileUrl: string;
  avatarUrl?: string;
  height?: string;
  marginTop?: string;
  isAd?: boolean;
  postCount?: number;
  lastActive?: string;
  verified?: boolean;
  premium?: boolean;
  rating?: number;
  categories?: string[];
}

export interface Settings {
  autoPlay: boolean;
  showThumbnails: boolean;
  highQuality: boolean;
  compactView: boolean;
  infiniteScroll: boolean;
  slideshowSpeed: number;
  showControls: boolean;
  columnCount: number;
}

export interface ImageModalProps {
  images: Image[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}
