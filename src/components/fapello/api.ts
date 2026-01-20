// Fapello API Services
import axios from 'axios';
import { Profile, Image, CreatorProfile } from './types';

// Extract creator ID from profile
export const extractCreatorId = (profile: Profile): string => {
  if (profile.profileUrl) {
    try {
      const urlObj = new URL(profile.profileUrl);
      const path = urlObj.pathname.replace(/^\/+|\/+$/g, '');
      const parts = path.split('/').filter(Boolean);

      if (parts.length > 0) {
        return parts[0];
      }
    } catch (e) {
      const path = profile.profileUrl.replace(/^\/+|\/+$/g, '');
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) {
        return parts[0];
      }
    }
  }

  if (profile.imageUrl) {
    const match = profile.imageUrl.match(/\/content\/[^\/]+\/[^\/]+\/([^\/]+)\//);
    if (match && match[1]) {
      return match[1];
    }
  }

  if (profile.id && !profile.id.includes('profile-')) {
    return profile.id;
  }

  return profile.name.toLowerCase().replace(/\s+/g, '-');
};

// Fetch trending profiles
export const fetchTrendingProfiles = async ({ pageParam = 1 }: { pageParam?: number }) => {
  try {
    const { data } = await axios.get(`https://fapello.com/ajax/trending/page-${pageParam}/`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');

    const profileContainers = doc.querySelectorAll('.mt-6 > div, .my-3 > div');
    const profiles: Profile[] = [];

    profileContainers.forEach(container => {
      const cardElement = container.querySelector('.bg-yellow-400, .bg-red-400');
      if (!cardElement) return;

      const linkElement = cardElement.querySelector('a');
      const imgElement = cardElement.querySelector('img');

      if (!linkElement || !imgElement) return;

      const overlayElement = cardElement.querySelector('.custom-overly1');
      const nameElement = overlayElement?.querySelector('div:last-child');
      const avatarElement = overlayElement?.querySelector('img');

      const profileUrl = linkElement.getAttribute('href') || '';
      const imageUrl = imgElement.getAttribute('src') || '';
      const name = nameElement?.textContent?.trim() || '';
      const avatarUrl = avatarElement?.getAttribute('src') || undefined;

      const isAd = name === 'GoLove' || profileUrl.includes('golove.ai');

      const creatorId = extractCreatorId({
        id: '',
        name,
        imageUrl,
        profileUrl,
        avatarUrl,
        isAd
      });

      profiles.push({
        id: creatorId,
        name,
        imageUrl,
        profileUrl,
        avatarUrl,
        isAd,
        postCount: Math.floor(Math.random() * 500) + 50,
        lastActive: `${Math.floor(Math.random() * 24)}h ago`,
        verified: Math.random() > 0.7,
        premium: Math.random() > 0.8,
        rating: Number((Math.random() * 2 + 3).toFixed(1)),
        categories: ['Trending', 'Hot', 'New'].slice(0, Math.floor(Math.random() * 3) + 1)
      });
    });

    return { profiles, nextPage: profiles.length > 0 ? pageParam + 1 : null };
  } catch (error) {
    console.error('Error fetching trending profiles:', error);
    return { profiles: [], nextPage: null };
  }
};

// Fetch search results
export const fetchSearchResults = async ({ pageParam = 1, query }: { pageParam?: number, query: string }) => {
  try {
    const formattedQuery = query.trim().toLowerCase().replace(/\s+/g, '-');
    const { data } = await axios.get(`https://fapello.com/search/${formattedQuery}/`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');

    const profileContainers = doc.querySelectorAll('.mt-6 > div, .my-3 > div');
    const profiles: Profile[] = [];

    profileContainers.forEach(container => {
      const cardElement = container.querySelector('.bg-yellow-400, .bg-red-400');
      if (!cardElement) return;

      const linkElement = cardElement.querySelector('a');
      const imgElement = cardElement.querySelector('img');

      if (!linkElement || !imgElement) return;

      const overlayElement = cardElement.querySelector('.custom-overly1');
      const nameElement = overlayElement?.querySelector('div:last-child');
      const avatarElement = overlayElement?.querySelector('img');

      const profileUrl = linkElement.getAttribute('href') || '';
      const imageUrl = imgElement.getAttribute('src') || '';
      const name = nameElement?.textContent?.trim() || '';
      const avatarUrl = avatarElement?.getAttribute('src') || undefined;

      const isAd = name === 'GoLove' || profileUrl.includes('golove.ai');

      const creatorId = extractCreatorId({
        id: '',
        name,
        imageUrl,
        profileUrl,
        avatarUrl,
        isAd
      });

      profiles.push({
        id: creatorId,
        name,
        imageUrl,
        profileUrl,
        avatarUrl,
        isAd,
        postCount: Math.floor(Math.random() * 500) + 50,
        lastActive: `${Math.floor(Math.random() * 24)}h ago`,
        verified: Math.random() > 0.7,
        premium: Math.random() > 0.8,
        rating: Number((Math.random() * 2 + 3).toFixed(1)),
        categories: ['Trending', 'Hot', 'New'].slice(0, Math.floor(Math.random() * 3) + 1)
      });
    });

    return { profiles, nextPage: profiles.length > 0 ? pageParam + 1 : null };
  } catch (error) {
    console.error('Error fetching search results:', error);
    return { profiles: [], nextPage: null };
  }
};

// Fetch creator profile
export const fetchCreatorProfile = async (creatorId: string): Promise<CreatorProfile | null> => {
  try {
    if (!creatorId) return null;

    const { data } = await axios.get(`https://fapello.com/ajax/model/${creatorId}/page-1/`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');

    const firstImage = doc.querySelector('img');
    const imageUrl = firstImage?.getAttribute('src') || '';

    let creatorName = creatorId;
    const match = imageUrl.match(/\/content\/[^\/]+\/[^\/]+\/([^\/]+)\//);
    if (match && match[1]) {
      creatorName = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    const postCount = Math.floor(Math.random() * 500) + 100;

    return {
      id: creatorId,
      name: creatorName,
      avatarUrl: imageUrl,
      coverUrl: imageUrl,
      bio: `✨ Exclusive content creator | Daily updates | Custom requests welcome | 18+ only`,
      postCount,
      followers: Math.floor(Math.random() * 100000) + 10000,
      following: Math.floor(Math.random() * 1000) + 100,
      verified: Math.random() > 0.5,
      premium: Math.random() > 0.6,
      joinDate: `${Math.floor(Math.random() * 365) + 30} days ago`,
      lastActive: `${Math.floor(Math.random() * 24)}h ago`,
      rating: Number((Math.random() * 2 + 3).toFixed(1)),
      categories: ['Photos', 'Videos', 'Custom'].slice(0, Math.floor(Math.random() * 3) + 1),
      socialLinks: {
        twitter: Math.random() > 0.5 ? `@${creatorId}` : undefined,
        instagram: Math.random() > 0.5 ? creatorId : undefined,
        onlyfans: Math.random() > 0.3 ? creatorId : undefined,
        fansly: Math.random() > 0.4 ? creatorId : undefined,
        website: Math.random() > 0.7 ? `https://${creatorId}.com` : undefined,
      },
      stats: {
        totalLikes: postCount * (Math.floor(Math.random() * 1000) + 500),
        totalViews: postCount * (Math.floor(Math.random() * 5000) + 2000),
        avgRating: Number((Math.random() * 2 + 3).toFixed(1))
      }
    };
  } catch (error) {
    console.error(`Error fetching creator profile for ${creatorId}:`, error);
    return null;
  }
};

// Fetch creator images
export const fetchCreatorImages = async ({ pageParam = 1, creatorId }: { pageParam?: number, creatorId: string }) => {
  try {
    if (!creatorId) return { images: [], nextPage: null };

    const { data } = await axios.get(`https://fapello.com/ajax/model/${creatorId}/page-${pageParam}/`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');

    const links = doc.querySelectorAll('a');
    const images: Image[] = [];

    links.forEach(linkElement => {
      const imgElement = linkElement.querySelector('img');
      if (!imgElement) return;

      const imageUrl = imgElement.getAttribute('src') || '';
      const href = linkElement.getAttribute('href') || '';

      if (!imageUrl) return;

      const id = href.split('/').filter(Boolean).pop() || `image-${images.length}`;
      const fullImageUrl = imageUrl.replace('_300px.jpg', '.jpg');

      images.push({
        id,
        imageUrl,
        fullImageUrl,
        thumbnailUrl: imageUrl,
        width: 300,
        height: Math.floor(Math.random() * 200) + 300,
        likes: Math.floor(Math.random() * 10000),
        views: Math.floor(Math.random() * 50000),
        comments: Math.floor(Math.random() * 1000),
        uploadDate: `${Math.floor(Math.random() * 30) + 1} days ago`,
        isVideo: Math.random() > 0.8,
        duration: Math.floor(Math.random() * 300) + 30
      });
    });

    return { images, nextPage: images.length > 0 ? pageParam + 1 : null };
  } catch (error) {
    console.error(`Error fetching creator images for ${creatorId}:`, error);
    return { images: [], nextPage: null };
  }
};
