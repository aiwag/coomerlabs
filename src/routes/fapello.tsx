// // src/routes/fapello.tsx
// import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
// import { useNavigate, createFileRoute } from '@tanstack/react-router';
// import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
// import * as Dialog from '@radix-ui/react-dialog';
// import {
//   Loader2,
//   X,
//   Grid3X3,
//   ArrowLeft,
//   Download,
//   Heart,
//   Share2,
//   Eye,
//   User,
//   Calendar,
//   Image as ImageIcon,
//   Bookmark,
//   MoreVertical,
//   Play,
//   Pause,
//   Volume2,
//   VolumeX,
//   Maximize2,
//   Star,
//   Check,
//   ExternalLink,
//   Clock,
//   Search,
//   Filter,
//   TrendingUp,
//   Home,
//   User as UserIcon,
//   MessageCircle,
//   ThumbsUp,
//   ZoomIn,
//   ChevronLeft,
//   ChevronRight,
//   Shuffle,
//   RotateCw,
//   Wifi,
//   WifiOff,
//   Settings,
//   SlidersHorizontal
// } from 'lucide-react';
// import axios from 'axios';
// import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
// import { useInView } from 'react-intersection-observer';
// import { toast } from 'react-hot-toast';

// // Types
// interface Image {
//   id: string;
//   imageUrl: string;
//   fullImageUrl?: string;
//   thumbnailUrl?: string;
//   width?: number;
//   height?: number;
//   likes?: number;
//   views?: number;
//   comments?: number;
//   uploadDate?: string;
//   duration?: number;
//   isVideo?: boolean;
// }

// interface CreatorProfile {
//   id: string;
//   name: string;
//   avatarUrl?: string;
//   coverUrl?: string;
//   bio?: string;
//   postCount: number;
//   followers?: number;
//   following?: number;
//   verified?: boolean;
//   premium?: boolean;
//   joinDate?: string;
//   lastActive?: string;
//   rating?: number;
//   categories?: string[];
//   socialLinks?: {
//     twitter?: string;
//     instagram?: string;
//     onlyfans?: string;
//     fansly?: string;
//     website?: string;
//   };
//   stats?: {
//     totalLikes: number;
//     totalViews: number;
//     avgRating: number;
//   };
// }

// interface Profile {
//   id: string;
//   name: string;
//   imageUrl: string;
//   profileUrl: string;
//   avatarUrl?: string;
//   height?: string;
//   marginTop?: string;
//   isAd?: boolean;
//   postCount?: number;
//   lastActive?: string;
//   verified?: boolean;
//   premium?: boolean;
//   rating?: number;
//   categories?: string[];
// }

// // Theme
// const useTheme = () => {
//   const [isDark, setIsDark] = useState(() => {
//     const saved = localStorage.getItem('fapello-theme');
//     return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
//   });

//   React.useEffect(() => {
//     document.documentElement.classList.toggle('dark', isDark);
//     localStorage.setItem('fapello-theme', isDark ? 'dark' : 'light');
//   }, [isDark]);

//   return { isDark, toggleTheme: () => setIsDark(!isDark) };
// };

// // Settings
// const useSettings = () => {
//   const [settings, setSettings] = useState(() => {
//     const saved = localStorage.getItem('fapello-settings');
//     return saved ? JSON.parse(saved) : {
//       autoPlay: false,
//       showThumbnails: true,
//       highQuality: true,
//       compactView: false,
//       infiniteScroll: true,
//       slideshowSpeed: 3000,
//       showControls: true
//     };
//   });

//   const updateSetting = (key: string, value: any) => {
//     const newSettings = { ...settings, [key]: value };
//     setSettings(newSettings);
//     localStorage.setItem('fapello-settings', JSON.stringify(newSettings));
//   };

//   return { settings, updateSetting };
// };

// // API Functions
// const fetchTrendingProfiles = async ({ pageParam = 1 }: { pageParam?: number }) => {
//   try {
//     const response = await axios.get(`https://fapello.com/ajax/trending/page-${pageParam}/`);
//     const html = response.data;

//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const profileContainers = doc.querySelectorAll('.mt-6 > div, .my-3 > div');
//     const profiles: Profile[] = [];

//     profileContainers.forEach(container => {
//       const cardElement = container.querySelector('.bg-yellow-400, .bg-red-400');
//       if (!cardElement) return;

//       const cardClasses = cardElement.className;
//       let height = 'h-48';
//       if (cardClasses.includes('lg:h-60')) height = 'lg:h-60';
//       if (cardClasses.includes('lg:h-72')) height = 'lg:h-72';
//       if (cardClasses.includes('lg:h-56')) height = 'lg:h-56';
//       if (cardClasses.includes('lg:h-64')) height = 'lg:h-64';

//       let marginTop = '';
//       if (cardClasses.includes('lg:-mt-12')) marginTop = 'lg:-mt-12';

//       const linkElement = cardElement.querySelector('a');
//       const imgElement = cardElement.querySelector('img');

//       if (!linkElement || !imgElement) return;

//       const overlayElement = cardElement.querySelector('.custom-overly1');
//       const nameElement = overlayElement?.querySelector('div:last-child');
//       const avatarElement = overlayElement?.querySelector('img');

//       const profileUrl = linkElement.getAttribute('href') || '';
//       const imageUrl = imgElement.getAttribute('src') || '';
//       const name = nameElement?.textContent?.trim() || '';
//       const avatarUrl = avatarElement?.getAttribute('src') || undefined;

//       const isAd = name === 'GoLove' || profileUrl.includes('golove.ai');

//       // Extract the creator ID from the profile URL
//       // URL format: https://fapello.com/creator-name/ or /creator-name/
//       let creatorId = '';
//       if (profileUrl) {
//         // Remove leading/trailing slashes and split
//         const urlParts = profileUrl.replace(/^\/+|\/+$/g, '').split('/');
//         // Get the last part that should be the creator ID
//         creatorId = urlParts.length > 0 ? urlParts[urlParts.length - 1] : '';
//       }

//       // If we couldn't extract from URL, try to extract from image URL
//       if (!creatorId && imageUrl) {
//         const match = imageUrl.match(/\/content\/([^\/]+)\/([^\/]+)\//);
//         if (match && match[2]) {
//           creatorId = match[2];
//         }
//       }

//       // Fallback to a generated ID if still empty
//       if (!creatorId) {
//         creatorId = name.toLowerCase().replace(/\s+/g, '-');
//       }

//       profiles.push({
//         id: creatorId,
//         name,
//         imageUrl,
//         profileUrl,
//         avatarUrl,
//         height,
//         marginTop,
//         isAd,
//         postCount: Math.floor(Math.random() * 500) + 50,
//         lastActive: `${Math.floor(Math.random() * 24)}h ago`,
//         verified: Math.random() > 0.7,
//         premium: Math.random() > 0.8,
//         rating: Number((Math.random() * 2 + 3).toFixed(1)),
//         categories: ['Trending', 'Hot', 'New'].slice(0, Math.floor(Math.random() * 3) + 1)
//       });
//     });

//     return { profiles, nextPage: profiles.length > 0 ? pageParam + 1 : null };
//   } catch (error) {
//     console.error('Error fetching trending profiles:', error);
//     return { profiles: [], nextPage: null };
//   }
// };

// const fetchCreatorProfile = async (creatorId: string): Promise<CreatorProfile | null> => {
//   try {
//     // Ensure we have a valid creator ID
//     if (!creatorId) {
//       console.error('No creator ID provided');
//       return null;
//     }

//     console.log(`Fetching creator profile for: ${creatorId}`);
//     const response = await axios.get(`https://fapello.com/ajax/model/${creatorId}/page-1/`);
//     const html = response.data;

//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const firstImage = doc.querySelector('img');
//     const imageUrl = firstImage?.getAttribute('src') || '';

//     let creatorName = creatorId;
//     const match = imageUrl.match(/\/content\/[^\/]+\/([^\/]+)\//);
//     if (match && match[1]) {
//       creatorName = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
//     }

//     const postCount = Math.floor(Math.random() * 500) + 100;

//     return {
//       id: creatorId,
//       name: creatorName,
//       avatarUrl: imageUrl,
//       coverUrl: imageUrl,
//       bio: `\u2728 Exclusive content creator | Daily updates | Custom requests welcome | 18+ only`,
//       postCount,
//       followers: Math.floor(Math.random() * 100000) + 10000,
//       following: Math.floor(Math.random() * 1000) + 100,
//       verified: Math.random() > 0.5,
//       premium: Math.random() > 0.6,
//       joinDate: `${Math.floor(Math.random() * 365) + 30} days ago`,
//       lastActive: `${Math.floor(Math.random() * 24)}h ago`,
//       rating: Number((Math.random() * 2 + 3).toFixed(1)),
//       categories: ['Photos', 'Videos', 'Custom'].slice(0, Math.floor(Math.random() * 3) + 1),
//       socialLinks: {
//         twitter: Math.random() > 0.5 ? `@${creatorId}` : undefined,
//         instagram: Math.random() > 0.5 ? creatorId : undefined,
//         onlyfans: Math.random() > 0.3 ? creatorId : undefined,
//         fansly: Math.random() > 0.4 ? creatorId : undefined,
//         website: Math.random() > 0.7 ? `https://${creatorId}.com` : undefined,
//       },
//       stats: {
//         totalLikes: postCount * (Math.floor(Math.random() * 1000) + 500),
//         totalViews: postCount * (Math.floor(Math.random() * 5000) + 2000),
//         avgRating: Number((Math.random() * 2 + 3).toFixed(1))
//       }
//     };
//   } catch (error) {
//     console.error(`Error fetching creator profile for ${creatorId}:`, error);
//     return null;
//   }
// };

// const fetchCreatorImages = async ({ pageParam = 1, creatorId }: { pageParam?: number, creatorId: string }) => {
//   try {
//     // Ensure we have a valid creator ID
//     if (!creatorId) {
//       console.error('No creator ID provided');
//       return { images: [], nextPage: null };
//     }

//     console.log(`Fetching creator images for: ${creatorId}, page: ${pageParam}`);
//     const response = await axios.get(`https://fapello.com/ajax/model/${creatorId}/page-${pageParam}/`);
//     const html = response.data;

//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');

//     const imageContainers = doc.querySelectorAll('div');
//     const images: Image[] = [];
//     let creatorName: string | undefined;

//     imageContainers.forEach(container => {
//       const linkElement = container.querySelector('a');
//       if (!linkElement) return;

//       const imgElement = linkElement.querySelector('img');
//       if (!imgElement) return;

//       const imageUrl = imgElement.getAttribute('src') || '';
//       const href = linkElement.getAttribute('href') || '';

//       if (!imageUrl) return;

//       const id = href.split('/').filter(Boolean).pop() || `image-${images.length}`;
//       const fullImageUrl = imageUrl.replace('_300px.jpg', '.jpg');

//       if (!creatorName) {
//         const match = imageUrl.match(/\/content\/[^\/]+\/([^\/]+)\//);
//         if (match && match[1]) {
//           creatorName = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
//         }
//       }

//       images.push({
//         id,
//         imageUrl,
//         fullImageUrl,
//         thumbnailUrl: imageUrl,
//         width: 300,
//         height: Math.floor(Math.random() * 200) + 300,
//         likes: Math.floor(Math.random() * 10000),
//         views: Math.floor(Math.random() * 50000),
//         comments: Math.floor(Math.random() * 1000),
//         uploadDate: `${Math.floor(Math.random() * 30) + 1} days ago`,
//         isVideo: Math.random() > 0.8,
//         duration: Math.floor(Math.random() * 300) + 30
//       });
//     });

//     return { images, nextPage: images.length > 0 ? pageParam + 1 : null, creatorName };
//   } catch (error) {
//     console.error(`Error fetching creator images for ${creatorId}:`, error);
//     return { images: [], nextPage: null };
//   }
// };

// // Components
// const ThemeToggle = () => {
//   const { isDark, toggleTheme } = useTheme();

//   return (
//     <motion.button
//       onClick={toggleTheme}
//       className="p-2 rounded-lg bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200"
//       whileHover={{ scale: 1.05 }}
//       whileTap={{ scale: 0.95 }}
//     >
//       {isDark ? (
//         <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
//           <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
//         </svg>
//       ) : (
//         <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
//           <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
//         </svg>
//       )}
//     </motion.button>
//   );
// };

// const SearchBar = ({ value, onChange, onClear }: {
//   value: string;
//   onChange: (value: string) => void;
//   onClear: () => void;
// }) => {
//   return (
//     <div className="relative max-w-md">
//       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//       <input
//         type="text"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder="Search creators..."
//         className="w-full pl-10 pr-10 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
//       />
//       {value && (
//         <button
//           onClick={onClear}
//           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
//         >
//           <X className="h-5 w-5" />
//         </button>
//       )}
//     </div>
//   );
// };

// const FilterDropdown = ({ onFilter }: { onFilter: (filter: string) => void }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const filters = ['All', 'Trending', 'New', 'Verified', 'Premium'];
//   const [selected, setSelected] = useState('All');

//   return (
//     <div className="relative">
//       <motion.button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
//         whileHover={{ scale: 1.02 }}
//         whileTap={{ scale: 0.98 }}
//       >
//         <Filter className="h-4 w-4" />
//         <span>{selected}</span>
//       </motion.button>

//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             className="absolute top-full mt-2 w-48 bg-gray-800 dark:bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
//           >
//             {filters.map((filter) => (
//               <button
//                 key={filter}
//                 onClick={() => {
//                   setSelected(filter);
//                   onFilter(filter);
//                   setIsOpen(false);
//                 }}
//                 className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
//               >
//                 {filter}
//               </button>
//             ))}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// const SettingsPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
//   const { settings, updateSetting } = useSettings();

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
//           onClick={onClose}
//         >
//           <motion.div
//             initial={{ scale: 0.9, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             exit={{ scale: 0.9, opacity: 0 }}
//             className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-white">Viewer Settings</h2>
//               <button
//                 onClick={onClose}
//                 className="p-1 rounded-full hover:bg-gray-700 transition-colors"
//               >
//                 <X className="h-5 w-5 text-gray-400" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <span className="text-gray-300">Auto-play videos</span>
//                 <button
//                   onClick={() => updateSetting('autoPlay', !settings.autoPlay)}
//                   className={`w-12 h-6 rounded-full transition-colors ${
//                     settings.autoPlay ? 'bg-blue-600' : 'bg-gray-600'
//                   }`}
//                 >
//                   <div
//                     className={`w-5 h-5 bg-white rounded-full transition-transform ${
//                       settings.autoPlay ? 'translate-x-6' : 'translate-x-0.5'
//                     }`}
//                   />
//                 </button>
//               </div>

//               <div className="flex items-center justify-between">
//                 <span className="text-gray-300">Show thumbnails</span>
//                 <button
//                   onClick={() => updateSetting('showThumbnails', !settings.showThumbnails)}
//                   className={`w-12 h-6 rounded-full transition-colors ${
//                     settings.showThumbnails ? 'bg-blue-600' : 'bg-gray-600'
//                   }`}
//                 >
//                   <div
//                     className={`w-5 h-5 bg-white rounded-full transition-transform ${
//                       settings.showThumbnails ? 'translate-x-6' : 'translate-x-0.5'
//                     }`}
//                   />
//                 </button>
//               </div>

//               <div className="flex items-center justify-between">
//                 <span className="text-gray-300">High quality images</span>
//                 <button
//                   onClick={() => updateSetting('highQuality', !settings.highQuality)}
//                   className={`w-12 h-6 rounded-full transition-colors ${
//                     settings.highQuality ? 'bg-blue-600' : 'bg-gray-600'
//                   }`}
//                 >
//                   <div
//                     className={`w-5 h-5 bg-white rounded-full transition-transform ${
//                       settings.highQuality ? 'translate-x-6' : 'translate-x-0.5'
//                     }`}
//                   />
//                 </button>
//               </div>

//               <div className="flex items-center justify-between">
//                 <span className="text-gray-300">Compact view</span>
//                 <button
//                   onClick={() => updateSetting('compactView', !settings.compactView)}
//                   className={`w-12 h-6 rounded-full transition-colors ${
//                     settings.compactView ? 'bg-blue-600' : 'bg-gray-600'
//                   }`}
//                 >
//                   <div
//                     className={`w-5 h-5 bg-white rounded-full transition-transform ${
//                       settings.compactView ? 'translate-x-6' : 'translate-x-0.5'
//                     }`}
//                   />
//                 </button>
//               </div>

//               <div className="flex items-center justify-between">
//                 <span className="text-gray-300">Infinite scroll</span>
//                 <button
//                   onClick={() => updateSetting('infiniteScroll', !settings.infiniteScroll)}
//                   className={`w-12 h-6 rounded-full transition-colors ${
//                     settings.infiniteScroll ? 'bg-blue-600' : 'bg-gray-600'
//                   }`}
//                 >
//                   <div
//                     className={`w-5 h-5 bg-white rounded-full transition-transform ${
//                       settings.infiniteScroll ? 'translate-x-6' : 'translate-x-0.5'
//                     }`}
//                   />
//                 </button>
//               </div>

//               <div className="flex items-center justify-between">
//                 <span className="text-gray-300">Show controls</span>
//                 <button
//                   onClick={() => updateSetting('showControls', !settings.showControls)}
//                   className={`w-12 h-6 rounded-full transition-colors ${
//                     settings.showControls ? 'bg-blue-600' : 'bg-gray-600'
//                   }`}
//                 >
//                   <div
//                     className={`w-5 h-5 bg-white rounded-full transition-transform ${
//                       settings.showControls ? 'translate-x-6' : 'translate-x-0.5'
//                     }`}
//                   />
//                 </button>
//               </div>

//               <div className="pt-4">
//                 <label className="block text-gray-300 mb-2">
//                   Slideshow speed: {settings.slideshowSpeed / 1000}s
//                 </label>
//                 <input
//                   type="range"
//                   min="1000"
//                   max="10000"
//                   step="1000"
//                   value={settings.slideshowSpeed}
//                   onChange={(e) => updateSetting('slideshowSpeed', parseInt(e.target.value))}
//                   className="w-full"
//                 />
//               </div>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// };

// const ProfileCard = ({ profile, index, onClick }: { profile: Profile; index: number; onClick: () => void }) => {
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [imageError, setImageError] = useState(false);
//   const [isLiked, setIsLiked] = useState(false);
//   const [isBookmarked, setIsBookmarked] = useState(false);
//   const { ref, inView } = useInView({
//     triggerOnce: true,
//     threshold: 0.1,
//   });
//   const { settings } = useSettings();

//   const handleLike = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setIsLiked(!isLiked);
//     toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
//   };

//   const handleBookmark = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setIsBookmarked(!isBookmarked);
//     toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
//   };

//   return (
//     <motion.div
//       ref={ref}
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
//       transition={{ duration: 0.3, delay: index * 0.05 }}
//       className={`group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
//         settings.compactView ? 'h-32' : (profile.height || 'h-48')
//       } ${profile.marginTop || ''}`}
//       onClick={onClick}
//       whileHover={{ y: -3 }}
//     >
//       <div className="relative w-full h-full">
//         {!imageLoaded && !imageError && (
//           <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
//             <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
//           </div>
//         )}

//         {imageError ? (
//           <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
//             <div className="text-center p-2">
//               <X className="h-6 w-6 mx-auto text-gray-500 mb-1" />
//               <p className="text-xs text-gray-400">Failed to load</p>
//             </div>
//           </div>
//         ) : (
//           <img
//             src={profile.imageUrl}
//             alt={profile.name}
//             className={`w-full h-full absolute object-cover transition-all duration-500 ${
//               imageLoaded ? 'opacity-100' : 'opacity-0'
//             } group-hover:scale-105`}
//             onLoad={() => setImageLoaded(true)}
//             onError={() => setImageError(true)}
//           />
//         )}

//         {/* Overlay */}
//         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//           <div className="absolute top-2 right-2 flex gap-1">
//             <button
//               onClick={handleLike}
//               className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
//             >
//               <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
//             </button>
//             <button
//               onClick={handleBookmark}
//               className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
//             >
//               <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
//             </button>
//           </div>

//           <div className="absolute bottom-0 left-0 right-0 p-2">
//             <div className="flex items-center justify-between text-white text-xs mb-1">
//               <div className="flex items-center gap-2">
//                 <span className="flex items-center gap-0.5">
//                   <ImageIcon className="h-3 w-3" />
//                   {profile.postCount}
//                 </span>
//                 <span className="flex items-center gap-0.5">
//                   <Eye className="h-3 w-3" />
//                   {profile.lastActive}
//                 </span>
//               </div>
//               {profile.rating && (
//                 <div className="flex items-center gap-0.5">
//                   <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//                   <span>{profile.rating}</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Bottom Info */}
//         <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
//           <div className="flex items-center gap-1.5">
//             {profile.avatarUrl && (
//               <div className="relative">
//                 <img
//                   src={profile.avatarUrl}
//                   alt={profile.name}
//                   className={`${
//                     settings.compactView ? 'w-6 h-6' : 'w-8 h-8'
//                   } rounded-full border border-white/50 object-cover`}
//                 />
//                 {profile.verified && (
//                   <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
//                     <Check className="w-2 h-2 text-white" />
//                   </div>
//                 )}
//                 {profile.premium && (
//                   <div className="absolute -top-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5">
//                     <Star className="w-2 h-2 text-white" />
//                   </div>
//                 )}
//               </div>
//             )}
//             <div className="flex-1 min-w-0">
//               <h3 className={`${
//                 settings.compactView ? 'text-xs' : 'text-sm'
//               } font-semibold text-white truncate`}>{profile.name}</h3>
//               <div className="flex items-center gap-1">
//                 {profile.verified && (
//                   <span className="text-xs text-blue-400">\u2713</span>
//                 )}
//                 {profile.premium && (
//                   <span className="text-xs text-yellow-400">\u2605</span>
//                 )}
//                 {profile.isAd && (
//                   <span className="text-xs bg-red-500 text-white px-1 py-0 rounded">AD</span>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// const ImageCard = ({ image, index, onImageClick }: { image: Image; index: number; onImageClick: (image: Image, index: number) => void }) => {
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [imageError, setImageError] = useState(false);
//   const [isLiked, setIsLiked] = useState(false);
//   const [isBookmarked, setIsBookmarked] = useState(false);
//   const { ref, inView } = useInView({
//     triggerOnce: true,
//     threshold: 0.1,
//   });
//   const { settings } = useSettings();

//   const handleLike = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setIsLiked(!isLiked);
//     toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
//   };

//   const handleBookmark = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setIsBookmarked(!isBookmarked);
//     toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
//   };

//   return (
//     <motion.div
//       ref={ref}
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
//       transition={{ duration: 0.3, delay: index * 0.05 }}
//       className={`group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gray-800 ${
//         settings.compactView ? 'h-40' : ''
//       }`}
//       onClick={() => onImageClick(image, index)}
//       whileHover={{ y: -3 }}
//     >
//       <div className="relative w-full h-full">
//         {!imageLoaded && !imageError && (
//           <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
//             <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
//           </div>
//         )}

//         {imageError ? (
//           <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
//             <div className="text-center p-2">
//               <X className="h-6 w-6 mx-auto text-gray-500 mb-1" />
//               <p className="text-xs text-gray-400">Failed to load</p>
//             </div>
//           </div>
//         ) : (
//           <img
//             src={settings.highQuality ? (image.fullImageUrl || image.imageUrl) : image.imageUrl}
//             alt={`Image ${image.id}`}
//             className={`w-full h-full absolute object-cover transition-all duration-500 ${
//               imageLoaded ? 'opacity-100' : 'opacity-0'
//             } group-hover:scale-105`}
//             onLoad={() => setImageLoaded(true)}
//             onError={() => setImageError(true)}
//           />
//         )}

//         {/* Video indicator */}
//         {image.isVideo && (
//           <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
//             <Play className="h-3 w-3 text-white" />
//           </div>
//         )}

//         {/* Duration */}
//         {image.duration && (
//           <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
//             <span className="text-white text-xs">
//               {Math.floor(image.duration / 60)}:{(image.duration % 60).toString().padStart(2, '0')}
//             </span>
//           </div>
//         )}

//         {/* Hover Overlay */}
//         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
//           <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
//             <div className="flex flex-col items-center space-y-2">
//               <div className="bg-white/90 rounded-full p-2">
//                 <ZoomIn className="w-4 h-4 text-gray-800" />
//               </div>
//               <div className="flex items-center space-x-3 text-white text-xs">
//                 <div className="flex items-center space-x-0.5">
//                   <Heart className="w-3 h-3" />
//                   <span>{image.likes?.toLocaleString()}</span>
//                 </div>
//                 <div className="flex items-center space-x-0.5">
//                   <Eye className="w-3 h-3" />
//                   <span>{image.views?.toLocaleString()}</span>
//                 </div>
//                 <div className="flex items-center space-x-0.5">
//                   <MessageCircle className="w-3 h-3" />
//                   <span>{image.comments}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//           <button
//             onClick={handleLike}
//             className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
//           >
//             <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
//           </button>
//           <button
//             onClick={handleBookmark}
//             className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
//           >
//             <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
//           </button>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// const ProfileHeader = ({ profile, onClose }: { profile: CreatorProfile; onClose: () => void }) => {
//   const [isFollowing, setIsFollowing] = useState(false);
//   const { settings } = useSettings();

//   const handleFollow = () => {
//     setIsFollowing(!isFollowing);
//     toast(isFollowing ? 'Unfollowed' : 'Following');
//   };

//   return (
//     <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4">
//       {/* Cover Image */}
//       <div className={`${
//         settings.compactView ? 'h-24' : 'h-32 md:h-40'
//       } bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 relative`}>
//         {profile.coverUrl && (
//           <img
//             src={profile.coverUrl}
//             alt="Cover"
//             className="w-full h-full object-cover"
//           />
//         )}
//         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

//         {/* Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors text-white"
//         >
//           <ArrowLeft className="h-4 w-4" />
//         </button>

//         {/* Cover Actions */}
//         <div className="absolute top-2 right-2 flex gap-1">
//           <button className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors">
//             <Share2 className="w-4 h-4 text-white" />
//           </button>
//           <button className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors">
//             <MoreVertical className="w-4 h-4 text-white" />
//           </button>
//         </div>
//       </div>

//       {/* Profile Info */}
//       <div className="container mx-auto px-4 -mt-8 relative z-10">
//         <div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-4">
//           {/* Avatar */}
//           <div className="relative">
//             <div className={`${
//               settings.compactView ? 'w-16 h-16' : 'w-20 h-20 md:w-24 md:h-24'
//             } rounded-full border-4 border-gray-900 bg-gray-800 overflow-hidden`}>
//               {profile.avatarUrl ? (
//                 <img
//                   src={profile.avatarUrl}
//                   alt={profile.name}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-full flex items-center justify-center">
//                   <User className="w-8 h-8 text-gray-600" />
//                 </div>
//               )}
//             </div>
//             {profile.verified && (
//               <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
//                 <Check className="w-3 h-3 text-white" />
//               </div>
//             )}
//             {profile.premium && (
//               <div className="absolute top-0 right-0 bg-yellow-500 rounded-full p-1">
//                 <Star className="w-3 h-3 text-white" />
//               </div>
//             )}
//           </div>

//           {/* Name and Bio */}
//           <div className="flex-1 text-center md:text-left">
//             <h2 className={`${
//               settings.compactView ? 'text-lg' : 'text-xl md:text-2xl'
//             } font-bold text-white mb-1 flex items-center justify-center md:justify-start gap-2`}>
//               {profile.name}
//               {profile.verified && (
//                 <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                 </svg>
//               )}
//               {profile.premium && (
//                 <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
//                   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                 </svg>
//               )}
//             </h2>
//             {!settings.compactView && (
//               <p className="text-gray-300 mb-2 text-sm">{profile.bio}</p>
//             )}

//             {/* Stats */}
//             <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs text-gray-400 mb-2">
//               <div>
//                 <span className="font-semibold text-white">{profile.postCount}</span>
//                 <span className="ml-1">posts</span>
//               </div>
//               {profile.followers && (
//                 <div>
//                   <span className="font-semibold text-white">{profile.followers.toLocaleString()}</span>
//                   <span className="ml-1">followers</span>
//                 </div>
//               )}
//               {profile.following && (
//                 <div>
//                   <span className="font-semibold text-white">{profile.following}</span>
//                   <span className="ml-1">following</span>
//                 </div>
//               )}
//               <div className="flex items-center gap-0.5">
//                 <Calendar className="w-3 h-3" />
//                 <span>Joined {profile.joinDate}</span>
//               </div>
//               <div className="flex items-center gap-0.5">
//                 <Clock className="w-3 h-3" />
//                 <span>Active {profile.lastActive}</span>
//               </div>
//               {profile.rating && (
//                 <div className="flex items-center gap-0.5">
//                   <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
//                   <span>{profile.rating}</span>
//                 </div>
//               )}
//             </div>

//             {/* Categories */}
//             {!settings.compactView && profile.categories && (
//               <div className="flex flex-wrap justify-center md:justify-start gap-1 mb-2">
//                 {profile.categories.map((cat) => (
//                   <span key={cat} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
//                     {cat}
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-1">
//             <button
//               onClick={handleFollow}
//               className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
//                 isFollowing
//                   ? 'bg-gray-700 hover:bg-gray-600 text-white'
//                   : 'bg-blue-600 hover:bg-blue-700 text-white'
//               }`}
//             >
//               {isFollowing ? 'Following' : 'Follow'}
//             </button>
//             <button className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
//               <Bookmark className="w-4 h-4" />
//             </button>
//             <button className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
//               <Share2 className="w-4 h-4" />
//             </button>
//           </div>
//         </div>

//         {/* Stats Bar */}
//         {!settings.compactView && profile.stats && (
//           <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-800/50 rounded-lg">
//             <div className="text-center">
//               <div className="text-lg font-bold text-white">
//                 {profile.stats.totalLikes.toLocaleString()}
//               </div>
//               <div className="text-xs text-gray-400">Total Likes</div>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-white">
//                 {profile.stats.totalViews.toLocaleString()}
//               </div>
//               <div className="text-xs text-gray-400">Total Views</div>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-white">
//                 {profile.stats.avgRating}
//               </div>
//               <div className="text-xs text-gray-400">Avg Rating</div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const ImageModal = ({
//   images,
//   currentIndex,
//   isOpen,
//   onClose
// }: {
//   images: Image[];
//   currentIndex: number;
//   isOpen: boolean;
//   onClose: () => void;
// }) => {
//   const [index, setIndex] = useState(currentIndex);
//   const [isMuted, setIsMuted] = useState(true);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLiked, setIsLiked] = useState(false);
//   const [isBookmarked, setIsBookmarked] = useState(false);
//   const [showControls, setShowControls] = useState(true);
//   const [isSlideshow, setIsSlideshow] = useState(false);
//   const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const slideshowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const { settings } = useSettings();
//   const currentImage = images[index];

//   const handlePrevious = () => {
//     setIndex((prev) => (prev - 1 + images.length) % images.length);
//   };

//   const handleNext = () => {
//     setIndex((prev) => (prev + 1) % images.length);
//   };

//   const handleRandom = () => {
//     const newIndex = Math.floor(Math.random() * images.length);
//     setIndex(newIndex);
//   };

//   const handleDragEnd = (event: any, info: PanInfo) => {
//     const { offset, velocity } = info;
//     if (offset.x > 400 || (offset.x > 0 && velocity.x > 500)) {
//       handlePrevious();
//     } else if (offset.x < -400 || (offset.x < 0 && velocity.x < -500)) {
//       handleNext();
//     }
//   };

//   const handleDownload = () => {
//     if (currentImage?.fullImageUrl) {
//       const link = document.createElement('a');
//       link.href = currentImage.fullImageUrl;
//       link.download = `image-${currentImage.id}.jpg`;
//       link.click();
//       toast('Download started');
//     }
//   };

//   const handleShare = () => {
//     if (navigator.share) {
//       navigator.share({
//         title: 'Check out this image',
//         url: window.location.href,
//       });
//     } else {
//       navigator.clipboard.writeText(window.location.href);
//       toast('Link copied to clipboard');
//     }
//   };

//   const handleLike = () => {
//     setIsLiked(!isLiked);
//     toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
//   };

//   const handleBookmark = () => {
//     setIsBookmarked(!isBookmarked);
//     toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
//   };

//   const handleMouseMove = () => {
//     if (settings.showControls) {
//       setShowControls(true);
//       if (controlsTimeoutRef.current) {
//         clearTimeout(controlsTimeoutRef.current);
//       }
//       controlsTimeoutRef.current = setTimeout(() => {
//         setShowControls(false);
//       }, 3000);
//     }
//   };

//   const handleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       document.documentElement.requestFullscreen();
//     } else {
//       document.exitFullscreen();
//     }
//   };

//   const toggleSlideshow = () => {
//     setIsSlideshow(!isSlideshow);
//     if (!isSlideshow) {
//       // Start slideshow
//       handleNext();
//       slideshowTimeoutRef.current = setInterval(() => {
//         handleNext();
//       }, settings.slideshowSpeed);
//       toast('Slideshow started');
//     } else {
//       // Stop slideshow
//       if (slideshowTimeoutRef.current) {
//         clearInterval(slideshowTimeoutRef.current);
//       }
//       toast('Slideshow stopped');
//     }
//   };

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (!isOpen) return;

//       switch (e.key) {
//         case 'ArrowLeft':
//           handlePrevious();
//           break;
//         case 'ArrowRight':
//           handleNext();
//           break;
//         case 'Escape':
//           onClose();
//           break;
//         case ' ':
//           e.preventDefault();
//           if (currentImage.isVideo) {
//             setIsPlaying(!isPlaying);
//           } else {
//             toggleSlideshow();
//           }
//           break;
//         case 'r':
//           handleRandom();
//           break;
//         case 'f':
//           handleFullscreen();
//           break;
//         case 'd':
//           handleDownload();
//           break;
//         case 's':
//           handleShare();
//           break;
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [isOpen, isPlaying, isSlideshow, currentImage]);

//   useEffect(() => {
//     if (videoRef.current) {
//       if (isPlaying) {
//         videoRef.current.play();
//       } else {
//         videoRef.current.pause();
//       }
//     }
//   }, [isPlaying, index]);

//   useEffect(() => {
//     return () => {
//       if (controlsTimeoutRef.current) {
//         clearTimeout(controlsTimeoutRef.current);
//       }
//       if (slideshowTimeoutRef.current) {
//         clearInterval(slideshowTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Reset slideshow when changing images manually
//   useEffect(() => {
//     if (isSlideshow && slideshowTimeoutRef.current) {
//       clearInterval(slideshowTimeoutRef.current);
//       slideshowTimeoutRef.current = setInterval(() => {
//         handleNext();
//       }, settings.slideshowSpeed);
//     }
//   }, [index, isSlideshow, settings.slideshowSpeed]);

//   return (
//     <AnimatePresence>
//       {isOpen && currentImage && (
//         <Dialog.Root open={isOpen} onOpenChange={onClose}>
//           <Dialog.Portal>
//             <Dialog.Overlay className="fixed inset-0 bg-black z-50" />
//             <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none">
//               <div 
//                 className="relative w-full h-full flex items-center justify-center"
//                 onMouseMove={handleMouseMove}
//               >
//                 {/* Close Button */}
//                 <Dialog.Close asChild>
//                   <button className={`absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2 z-10 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}>
//                     <X className="h-6 w-6" />
//                   </button>
//                 </Dialog.Close>

//                 {/* Navigation Buttons */}
//                 <button
//                   onClick={handlePrevious}
//                   className={`absolute left-4 text-white hover:text-gray-300 transition-colors p-2 z-10 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}
//                   disabled={images.length <= 1}
//                 >
//                   <ChevronLeft className="w-8 h-8" />
//                 </button>

//                 <button
//                   onClick={handleNext}
//                   className={`absolute right-4 text-white hover:text-gray-300 transition-colors p-2 z-10 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}
//                   disabled={images.length <= 1}
//                 >
//                   <ChevronRight className="w-8 h-8" />
//                 </button>

//                 {/* Main Image */}
//                 <motion.div
//                   key={index}
//                   className="relative max-w-5xl max-h-[80vh]"
//                   drag="x"
//                   dragConstraints={{ left: 0, right: 0 }}
//                   onDragEnd={handleDragEnd}
//                 >
//                   {currentImage.isVideo ? (
//                     <div className="relative">
//                       <video
//                         ref={videoRef}
//                         src={currentImage.fullImageUrl || currentImage.imageUrl}
//                         className="max-w-full max-h-[80vh] rounded-lg"
//                         controls={false}
//                         muted={isMuted}
//                         loop
//                         autoPlay={settings.autoPlay}
//                         onClick={() => setIsPlaying(!isPlaying)}
//                       />
//                       <div className={`absolute bottom-4 left-4 right-4 flex items-center justify-between transition-opacity ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}>
//                         <button
//                           onClick={() => setIsPlaying(!isPlaying)}
//                           className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
//                         >
//                           {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
//                         </button>
//                         <button
//                           onClick={() => setIsMuted(!isMuted)}
//                           className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
//                         >
//                           {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
//                         </button>
//                       </div>
//                     </div>
//                   ) : (
//                     <img
//                       src={settings.highQuality ? (currentImage.fullImageUrl || currentImage.imageUrl) : currentImage.imageUrl}
//                       alt={`Image ${currentImage.id}`}
//                       className="max-w-full max-h-[80vh] object-contain rounded-lg"
//                     />
//                   )}

//                   {/* Image Info Bar */}
//                   <div className={`absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 transition-opacity ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}>
//                     <div className="flex items-center justify-between text-white">
//                       <div className="flex items-center space-x-4">
//                         <button 
//                           onClick={handleLike}
//                           className="flex items-center space-x-1 hover:text-red-400 transition-colors"
//                         >
//                           <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
//                           <span className="text-sm">{currentImage.likes?.toLocaleString()}</span>
//                         </button>
//                         <div className="flex items-center space-x-1">
//                           <Eye className="w-4 h-4" />
//                           <span className="text-sm">{currentImage.views?.toLocaleString()}</span>
//                         </div>
//                         <div className="flex items-center space-x-1">
//                           <MessageCircle className="w-4 h-4" />
//                           <span className="text-sm">{currentImage.comments}</span>
//                         </div>
//                         <span className="text-sm">{currentImage.uploadDate}</span>
//                       </div>

//                       <div className="flex items-center space-x-2">
//                         <button
//                           onClick={handleBookmark}
//                           className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
//                         >
//                           <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-500 text-blue-500' : ''}`} />
//                         </button>
//                         <button
//                           onClick={handleDownload}
//                           className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
//                         >
//                           <Download className="w-4 h-4" />
//                         </button>
//                         <button
//                           onClick={handleShare}
//                           className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
//                         >
//                           <Share2 className="w-4 h-4" />
//                         </button>
//                         <button 
//                           onClick={handleFullscreen}
//                           className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
//                         >
//                           <Maximize2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </motion.div>

//                 {/* Thumbnail Strip */}
//                 {settings.showThumbnails && (
//                   <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-2xl overflow-x-auto py-2 transition-opacity ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}>
//                     {images.map((img, i) => (
//                       <button
//                         key={i}
//                         onClick={() => setIndex(i)}
//                         className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
//                           i === index ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-75'
//                         }`}
//                       >
//                         <img
//                           src={img.thumbnailUrl || img.imageUrl}
//                           alt={`Thumbnail ${i}`}
//                           className="w-full h-full object-cover"
//                         />
//                       </button>
//                     ))}
//                   </div>
//                 )}

//                 {/* Control Panel */}
//                 <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-3 transition-opacity ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}>
//                   <button
//                     onClick={handlePrevious}
//                     className="p-1 rounded-full hover:bg-white/20 transition-colors"
//                     disabled={images.length <= 1}
//                   >
//                     <ChevronLeft className="w-4 h-4 text-white" />
//                   </button>

//                   <span className="text-white text-sm">
//                     {index + 1} / {images.length}
//                   </span>

//                   <button
//                     onClick={handleNext}
//                     className="p-1 rounded-full hover:bg-white/20 transition-colors"
//                     disabled={images.length <= 1}
//                   >
//                     <ChevronRight className="w-4 h-4 text-white" />
//                   </button>

//                   <div className="h-4 w-px bg-white/30" />

//                   <button
//                     onClick={toggleSlideshow}
//                     className={`p-1 rounded-full transition-colors ${isSlideshow ? 'bg-white/20' : 'hover:bg-white/20'}`}
//                   >
//                     <Play className="w-4 h-4 text-white" />
//                   </button>

//                   <button
//                     onClick={handleRandom}
//                     className="p-1 rounded-full hover:bg-white/20 transition-colors"
//                   >
//                     <Shuffle className="w-4 h-4 text-white" />
//                   </button>
//                 </div>
//               </div>
//             </Dialog.Content>
//           </Dialog.Portal>
//         </Dialog.Root>
//       )}
//     </AnimatePresence>
//   );
// };

// const WaterfallGallery = ({
//   items,
//   renderItem,
//   columnCount = 3,
//   hasNextPage,
//   fetchNextPage,
//   className = ""
// }: {
//   items: any[];
//   renderItem: (item: any, index: number) => React.ReactNode;
//   columnCount?: number;
//   hasNextPage?: boolean;
//   fetchNextPage?: () => void;
//   className?: string;
// }) => {
//   const [columns, setColumns] = useState<Array<any[]>>([]);
//   const { ref, inView } = useInView({
//     threshold: 0,
//     triggerOnce: false,
//   });
//   const { settings } = useSettings();

//   useEffect(() => {
//     const newColumns = Array.from({ length: columnCount }, () => []);
//     items.forEach((item, index) => {
//       const columnIndex = index % columnCount;
//       newColumns[columnIndex].push(item);
//     });
//     setColumns(newColumns);
//   }, [items, columnCount]);

//   useEffect(() => {
//     if (inView && hasNextPage && fetchNextPage && settings.infiniteScroll) {
//       fetchNextPage();
//     }
//   }, [inView, hasNextPage, fetchNextPage, settings.infiniteScroll]);

//   return (
//     <>
//       <div className={`grid gap-2 ${
//         columnCount === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
//       } md:grid-cols-2 grid-cols-1 ${className}`}>
//         {columns.map((column, columnIndex) => (
//           <div key={columnIndex} className="flex flex-col gap-2">
//             {column.map((item, itemIndex) => {
//               const originalIndex = items.indexOf(item);
//               return (
//                 <div key={item.id || originalIndex}>
//                   {renderItem(item, originalIndex)}
//                 </div>
//               );
//             })}
//           </div>
//         ))}
//       </div>

//       {hasNextPage && settings.infiniteScroll && (
//         <div ref={ref} className="flex justify-center py-4">
//           <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
//         </div>
//       )}

//       {hasNextPage && !settings.infiniteScroll && (
//         <div className="flex justify-center py-4">
//           <button
//             onClick={fetchNextPage}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             Load More
//           </button>
//         </div>
//       )}
//     </>
//   );
// };

// const Header = ({
//   title,
//   showBackButton,
//   onBackClick,
//   showThemeToggle = true,
//   showSearch = false,
//   searchValue = '',
//   onSearchChange = () => {},
//   onSearchClear = () => {},
//   showFilter = false,
//   onFilter = () => {},
//   currentView,
//   onViewChange,
//   onSettingsClick
// }: {
//   title: string;
//   showBackButton?: boolean;
//   onBackClick?: () => void;
//   showThemeToggle?: boolean;
//   showSearch?: boolean;
//   searchValue?: string;
//   onSearchChange?: (value: string) => void;
//   onSearchClear?: () => void;
//   showFilter?: boolean;
//   onFilter?: (filter: string) => void;
//   currentView?: 'trending' | 'profile';
//   onViewChange?: (view: 'trending' | 'profile') => void;
//   onSettingsClick?: () => void;
// }) => {
//   const { settings } = useSettings();

//   return (
//     <div className="sticky top-0 z-40 bg-gray-900/95 dark:bg-black/95 backdrop-blur-lg border-b border-gray-800">
//       <div className="container mx-auto px-4 py-2">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             {showBackButton && onBackClick && (
//               <motion.button
//                 onClick={onBackClick}
//                 className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <ArrowLeft className="h-4 w-4" />
//               </motion.button>
//             )}

//             {/* View Toggle */}
//             {onViewChange && (
//               <div className="flex bg-gray-800 rounded-lg p-0.5">
//                 <button
//                   onClick={() => onViewChange('trending')}
//                   className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
//                     currentView === 'trending' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
//                   }`}
//                 >
//                   <Home className="h-3 w-3" />
//                   <span className="hidden sm:block text-sm">Trending</span>
//                 </button>
//                 <button
//                   onClick={() => onViewChange('profile')}
//                   className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors ${
//                     currentView === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
//                   }`}
//                 >
//                   <UserIcon className="h-3 w-3" />
//                   <span className="hidden sm:block text-sm">Profile</span>
//                 </button>
//               </div>
//             )}

//             <h1 className={`${
//               settings.compactView ? 'text-lg' : 'text-xl'
//             } font-bold text-white flex items-center gap-2`}>
//               {title === 'Trending Profiles' && <TrendingUp className="h-4 w-4 text-blue-500" />}
//               {title}
//             </h1>
//           </div>

//           <div className="flex items-center gap-1">
//             {showSearch && (
//               <SearchBar
//                 value={searchValue}
//                 onChange={onSearchChange}
//                 onClear={onSearchClear}
//               />
//             )}
//             {showFilter && <FilterDropdown onFilter={onFilter} />}
//             {onSettingsClick && (
//               <motion.button
//                 onClick={onSettingsClick}
//                 className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <SlidersHorizontal className="h-4 w-4" />
//               </motion.button>
//             )}
//             {showThemeToggle && <ThemeToggle />}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Main Enhanced Component
// const FapelloEnhanced = () => {
//   const [currentView, setCurrentView] = useState<'trending' | 'profile'>('trending');
//   const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//   const [isImageModalOpen, setIsImageModalOpen] = useState(false);
//   const [searchValue, setSearchValue] = useState('');
//   const [currentFilter, setCurrentFilter] = useState('All');
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//   const { settings } = useSettings();

//   // Extract creator ID from profile URL
//   const getCreatorId = useCallback((profile: Profile) => {
//     // The profile URL format is: https://fapello.com/creator-name/ or /creator-name/
//     // We need to extract the creator-name part
//     if (!profile.profileUrl) return '';

//     // Remove leading/trailing slashes and split
//     const urlParts = profile.profileUrl.replace(/^\/+|\/+$/g, '').split('/');

//     // Get the last part that should be the creator ID
//     if (urlParts.length > 0) {
//       const lastPart = urlParts[urlParts.length - 1];
//       // Make sure it's not a file extension
//       if (lastPart && !lastPart.includes('.')) {
//         return lastPart;
//       }
//     }

//     // Fallback to profile ID if available
//     if (profile.id && !profile.id.includes('profile-')) {
//       return profile.id;
//     }

//     // Fallback to name
//     if (profile.name) {
//       return profile.name.toLowerCase().replace(/\s+/g, '-');
//     }

//     return '';
//   }, []);

//   // Fetch trending profiles
//   const {
//     data: trendingData,
//     fetchNextPage: fetchNextTrendingPage,
//     hasNextPage: hasNextTrendingPage,
//     isFetchingNextPage: isFetchingNextTrendingPage,
//     isLoading: isLoadingTrending,
//     error: trendingError
//   } = useInfiniteQuery({
//     queryKey: ['trendingProfiles', currentFilter],
//     queryFn: fetchTrendingProfiles,
//     getNextPageParam: (lastPage) => lastPage.nextPage,
//     initialPageParam: 1,
//   });

//   // Get creator ID from selected profile
//   const creatorId = useMemo(() => {
//     return selectedProfile ? getCreatorId(selectedProfile) : '';
//   }, [selectedProfile, getCreatorId]);

//   // Fetch creator profile and images when a profile is selected
//   const {
//     data: creatorProfile,
//     isLoading: isLoadingProfile,
//     error: profileError,
//     refetch: refetchProfile
//   } = useQuery({
//     queryKey: ['creatorProfile', creatorId],
//     queryFn: () => fetchCreatorProfile(creatorId),
//     enabled: !!creatorId && currentView === 'profile',
//     retry: 2,
//     retryDelay: 1000,
//   });

//   const {
//     data: creatorData,
//     fetchNextPage: fetchNextCreatorPage,
//     hasNextPage: hasNextCreatorPage,
//     isFetchingNextPage: isFetchingNextCreatorPage,
//     isLoading: isLoadingImages,
//     error: imagesError,
//     refetch: refetchImages
//   } = useInfiniteQuery({
//     queryKey: ['creatorImages', creatorId],
//     queryFn: ({ pageParam = 1 }) => fetchCreatorImages({ pageParam, creatorId }),
//     getNextPageParam: (lastPage) => lastPage.nextPage,
//     initialPageParam: 1,
//     enabled: !!creatorId && currentView === 'profile',
//     retry: 2,
//     retryDelay: 1000,
//   });

//   const handleProfileClick = useCallback((profile: Profile) => {
//     if (profile.isAd) return; // Don't open ads

//     setSelectedProfile(profile);
//     setCurrentView('profile');
//     // Scroll to top when switching to profile view
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   }, []);

//   const handleBackToTrending = useCallback(() => {
//     setCurrentView('trending');
//     setSelectedProfile(null);
//   }, []);

//   const handleImageClick = useCallback((image: Image, index: number) => {
//     setSelectedImageIndex(index);
//     setIsImageModalOpen(true);
//   }, []);

//   const handleModalClose = useCallback(() => {
//     setIsImageModalOpen(false);
//   }, []);

//   const handleFilter = useCallback((filter: string) => {
//     setCurrentFilter(filter);
//   }, []);

//   // Filter profiles based on search and filter
//   const trendingProfiles = useMemo(() => {
//     let profiles = trendingData?.pages.flatMap(page => page.profiles) || [];

//     if (searchValue) {
//       profiles = profiles.filter(p => 
//         p.name.toLowerCase().includes(searchValue.toLowerCase())
//       );
//     }

//     if (currentFilter !== 'All') {
//       switch (currentFilter) {
//         case 'Verified':
//           profiles = profiles.filter(p => p.verified);
//           break;
//         case 'Premium':
//           profiles = profiles.filter(p => p.premium);
//           break;
//         case 'New':
//           profiles = profiles.filter(p => p.postCount && p.postCount < 100);
//           break;
//         case 'Trending':
//           profiles = profiles.filter(p => p.postCount && p.postCount > 200);
//           break;
//       }
//     }

//     return profiles;
//   }, [trendingData, searchValue, currentFilter]);

//   const creatorImages = creatorData?.pages.flatMap(page => page.images) || [];
//   const creatorName = creatorProfile?.name || selectedProfile?.name || '';

//   // Refetch data when creatorId changes
//   useEffect(() => {
//     if (creatorId && currentView === 'profile') {
//       refetchProfile();
//       refetchImages();
//     }
//   }, [creatorId, currentView, refetchProfile, refetchImages]);

//   // Custom scrollbar styles
//   useEffect(() => {
//     const style = document.createElement('style');
//     style.textContent = `
//       ::-webkit-scrollbar {
//         width: 8px;
//         height: 8px;
//       }
//       ::-webkit-scrollbar-track {
//         background: rgba(0, 0, 0, 0.1);
//         border-radius: 4px;
//       }
//       ::-webkit-scrollbar-thumb {
//         background: rgba(156, 163, 175, 0.5);
//         border-radius: 4px;
//       }
//       ::-webkit-scrollbar-thumb:hover {
//         background: rgba(156, 163, 175, 0.7);
//       }
//       .dark ::-webkit-scrollbar-track {
//         background: rgba(0, 0, 0, 0.2);
//       }
//       .dark ::-webkit-scrollbar-thumb {
//         background: rgba(75, 85, 99, 0.5);
//       }
//       .dark ::-webkit-scrollbar-thumb:hover {
//         background: rgba(75, 85, 99, 0.7);
//       }
//     `;
//     document.head.appendChild(style);

//     return () => {
//       document.head.removeChild(style);
//     };
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-900 dark:bg-black overflow-y-auto">
//       {/* Header */}
//       <Header
//         title={currentView === 'trending' ? 'Trending Profiles' : creatorName}
//         showBackButton={currentView === 'profile'}
//         onBackClick={handleBackToTrending}
//         showSearch={currentView === 'trending'}
//         searchValue={searchValue}
//         onSearchChange={setSearchValue}
//         onSearchClear={() => setSearchValue('')}
//         showFilter={currentView === 'trending'}
//         onFilter={handleFilter}
//         currentView={currentView}
//         onViewChange={setCurrentView}
//         onSettingsClick={() => setIsSettingsOpen(true)}
//       />

//       {/* Main Content */}
//       <div className={`container mx-auto px-4 ${
//         settings.compactView ? 'py-2' : 'py-4'
//       }`}>
//         {currentView === 'trending' ? (
//           /* Trending View */
//           (isLoadingTrending ? (<div className='flex justify-center items-center h-64'>
//             <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
//           </div>) : trendingError ? (
//             <div className="text-center py-12">
//               <p className="text-red-500 mb-4">Failed to load trending profiles</p>
//               <button
//                 onClick={() => window.location.reload()}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//               >
//                 Try Again
//               </button>
//             </div>
//           ) : (
//             <>
//               {trendingProfiles.length === 0 ? (
//                 <div className="text-center py-12">
//                   <p className="text-gray-400">No profiles found</p>
//                 </div>
//               ) : (
//                 <WaterfallGallery
//                   items={trendingProfiles}
//                   renderItem={(profile: Profile, index: number) => (
//                     <ProfileCard
//                       profile={profile}
//                       index={index}
//                       onClick={() => handleProfileClick(profile)}
//                     />
//                   )}
//                   columnCount={settings.compactView ? 4 : 3}
//                   hasNextPage={!!hasNextTrendingPage}
//                   fetchNextPage={fetchNextTrendingPage}
//                 />
//               )}
//             </>
//           ))
//         ) : (
//           /* Profile View */
//           (<>
//             {isLoadingProfile ? (
//               <div className="flex justify-center items-center h-64">
//                 <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
//               </div>
//             ) : profileError ? (
//               <div className="text-center py-12">
//                 <p className="text-red-500 mb-4">Failed to load profile</p>
//                 <button
//                   onClick={handleBackToTrending}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//                 >
//                   Back to Trending
//                 </button>
//               </div>
//             ) : creatorProfile ? (
//               <>
//                 <ProfileHeader profile={creatorProfile} onClose={handleBackToTrending} />

//                 {isLoadingImages ? (
//                   <div className="flex justify-center items-center h-64">
//                     <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
//                   </div>
//                 ) : imagesError ? (
//                   <div className="text-center py-12">
//                     <p className="text-red-500 mb-4">Failed to load images</p>
//                     <button
//                       onClick={() => refetchImages()}
//                       className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//                     >
//                       Try Again
//                     </button>
//                   </div>
//                 ) : creatorImages.length === 0 ? (
//                   <div className="text-center py-12">
//                     <p className="text-gray-400">No images found for this creator</p>
//                   </div>
//                 ) : (
//                   <WaterfallGallery
//                     items={creatorImages}
//                     renderItem={(image: Image, index: number) => (
//                       <ImageCard
//                         image={image}
//                         index={index}
//                         onImageClick={handleImageClick}
//                       />
//                     )}
//                     columnCount={settings.compactView ? 5 : 4}
//                     hasNextPage={!!hasNextCreatorPage}
//                     fetchNextPage={fetchNextCreatorPage}
//                   />
//                 )}
//               </>
//             ) : null}
//           </>)
//         )}
//       </div>

//       {/* Image Modal */}
//       <ImageModal 
//         images={creatorImages}
//         currentIndex={selectedImageIndex}
//         isOpen={isImageModalOpen} 
//         onClose={handleModalClose} 
//       />

//       {/* Settings Panel */}
//       <SettingsPanel 
//         isOpen={isSettingsOpen}
//         onClose={() => setIsSettingsOpen(false)}
//       />
//     </div>
//   )
// };

// export default FapelloEnhanced;

// export const Route = createFileRoute('/fapello')({
//   component: FapelloEnhanced,
// });






// src/routes/fapello.tsx
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  Loader2, X, ArrowLeft, Download, Heart, Share2, Eye, User, Calendar,
  Image as ImageIcon, Bookmark, MoreVertical, Play, Pause, Volume2, VolumeX,
  Maximize2, Star, Check, ExternalLink, Clock, Search, Filter, TrendingUp,
  Home, User as UserIcon, MessageCircle, ZoomIn, ChevronLeft, ChevronRight,
  Shuffle, SlidersHorizontal, Settings
} from 'lucide-react';

// Types
interface Image {
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

interface CreatorProfile {
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

interface Profile {
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

// Hooks
// Hooks
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  settings: {
    autoPlay: boolean;
    showThumbnails: boolean;
    highQuality: boolean;
    compactView: boolean;
    infiniteScroll: boolean;
    slideshowSpeed: number;
    showControls: boolean;
    columnCount: number;
  };
  updateSetting: (key: string, value: any) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        autoPlay: false,
        showThumbnails: true,
        highQuality: true,
        compactView: false,
        infiniteScroll: true,
        slideshowSpeed: 3000,
        showControls: true,
        columnCount: 4,
      },
      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
    }),
    {
      name: 'fapello-settings',
    }
  )
);

const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fapello-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('fapello-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark(!isDark) };
};

const useSettings = () => {
  const { settings, updateSetting } = useSettingsStore();
  return { settings, updateSetting };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// API Services
const extractCreatorId = (profile: Profile): string => {
  if (profile.profileUrl) {
    try {
      // Remove protocol and domain to get path
      const urlObj = new URL(profile.profileUrl);
      const path = urlObj.pathname.replace(/^\/+|\/+$/g, '');
      const parts = path.split('/').filter(Boolean);

      // If the URL is like /username/postid/, we want username (parts[0])
      // If the URL is like /username/, we want username (parts[0])
      if (parts.length > 0) {
        return parts[0];
      }
    } catch (e) {
      // Fallback for relative URLs or invalid URLs
      const path = profile.profileUrl.replace(/^\/+|\/+$/g, '');
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) {
        return parts[0];
      }
    }
  }

  if (profile.imageUrl) {
    // Matches /content/x/y/username/
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

const fetchTrendingProfiles = async ({ pageParam = 1 }: { pageParam?: number }) => {
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

const fetchSearchResults = async ({ pageParam = 1, query }: { pageParam?: number, query: string }) => {
  try {
    const formattedQuery = query.trim().toLowerCase().replace(/\s+/g, '-');
    const { data } = await axios.get(`https://fapello.com/search/${formattedQuery}/`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');

    // Selectors based on provided HTML: div#content > div.my-3 > div(column) > div(card)
    // The previous selector .mt-6 > div, .my-3 > div covers .my-3 > div which are the columns
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

const fetchCreatorProfile = async (creatorId: string): Promise<CreatorProfile | null> => {
  try {
    if (!creatorId) return null;

    const { data } = await axios.get(`https://fapello.com/ajax/model/${creatorId}/page-1/`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');

    const firstImage = doc.querySelector('img');
    const imageUrl = firstImage?.getAttribute('src') || '';

    let creatorName = creatorId;
    // Matches /content/x/y/username/
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

const fetchCreatorImages = async ({ pageParam = 1, creatorId }: { pageParam?: number, creatorId: string }) => {
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

// Components
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isDark ? (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </motion.button>
  );
};

const SearchBar = ({ value, onChange, onClear }: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) => (
  <div className="relative max-w-md">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search creators..."
      className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
    />
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
    )}
  </div>
);

const LayoutSwitcher = () => {
  const { settings, updateSetting } = useSettings();
  const columns = settings.columnCount || 4;

  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
      {[2, 3, 4, 5, 6].map((cols) => (
        <button
          key={cols}
          onClick={() => updateSetting('columnCount', cols)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${columns === cols
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
        >
          {cols}
        </button>
      ))}
    </div>
  );
};

const FilterDropdown = ({ onFilter }: { onFilter: (filter: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filters = ['All', 'Trending', 'New', 'Verified', 'Premium'];
  const [selected, setSelected] = useState('All');

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="h-4 w-4" />
        <span>{selected}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
          >
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setSelected(filter);
                  onFilter(filter);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {filter}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingsPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { settings, updateSetting } = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Viewer Settings</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: 'autoPlay', label: 'Auto-play videos' },
                { key: 'showThumbnails', label: 'Show thumbnails' },
                { key: 'highQuality', label: 'High quality images' },
                { key: 'compactView', label: 'Compact view' },
                { key: 'infiniteScroll', label: 'Infinite scroll' },
                { key: 'showControls', label: 'Show controls' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-300">{label}</span>
                  <button
                    onClick={() => updateSetting(key, !settings[key as keyof typeof settings])}
                    className={`w-12 h-6 rounded-full transition-colors ${settings[key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                    />
                  </button>
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-700">
                <label className="block text-gray-300 mb-2">
                  Slideshow speed: {settings.slideshowSpeed / 1000}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={settings.slideshowSpeed}
                  onChange={(e) => updateSetting('slideshowSpeed', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProfileCard = ({ profile, index, onClick }: { profile: Profile; index: number; onClick: () => void }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { settings } = useSettings();

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
  }, [isLiked]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
  }, [isBookmarked]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: inView ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-md shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer ${settings.compactView ? 'h-32' : 'h-48'
        }`}
      onClick={onClick}
      whileHover={{ y: -3 }}
    >
      <div className="relative w-full h-full">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center p-2">
              <X className="h-6 w-6 mx-auto text-gray-500 mb-1" />
              <p className="text-xs text-gray-400">Failed to load</p>
            </div>
          </div>
        ) : (
          <img
            src={profile.imageUrl}
            alt={profile.name}
            className={`w-full h-full absolute object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={handleLike} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <button onClick={handleBookmark} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
              <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="flex items-center justify-between text-white text-xs mb-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <ImageIcon className="h-3 w-3" />
                  {profile.postCount}
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {profile.lastActive}
                </span>
              </div>
              {profile.rating && (
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{profile.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-1.5">
            {profile.avatarUrl && (
              <div className="relative">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className={`${settings.compactView ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border border-white/50 object-cover`}
                />
                {profile.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
                {profile.premium && (
                  <div className="absolute -top-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5">
                    <Star className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`${settings.compactView ? 'text-xs' : 'text-sm'} font-semibold text-white truncate`}>
                {profile.name}
              </h3>
              <div className="flex items-center gap-1">
                {profile.verified && <span className="text-xs text-blue-400">✓</span>}
                {profile.premium && <span className="text-xs text-yellow-400">★</span>}
                {profile.isAd && <span className="text-xs bg-red-500 text-white px-1 py-0 rounded">AD</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ImageCard = ({ image, index, onImageClick }: { image: Image; index: number; onImageClick: (image: Image, index: number) => void }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { settings } = useSettings();

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
  }, [isLiked]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
  }, [isBookmarked]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gray-800 w-full`}
      style={{ aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : '3/4' }}
      onClick={() => onImageClick(image, index)}
      whileHover={{ y: -3 }}
    >
      <div className="relative w-full h-full">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center p-2">
              <X className="h-6 w-6 mx-auto text-gray-500 mb-1" />
              <p className="text-xs text-gray-400">Failed to load</p>
            </div>
          </div>
        ) : (
          <img
            src={settings.highQuality ? (image.fullImageUrl || image.imageUrl) : image.imageUrl}
            alt={`Image ${image.id}`}
            className={`w-full h-full absolute object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {image.isVideo && (
          <div className="absolute top-2 left-2 bg-black/50 rounded-full p-1.5">
            <Play className="h-3 w-3 text-white" />
          </div>
        )}

        {image.duration && (
          <div className="absolute bottom-2 left-2 bg-black/50 rounded px-1.5 py-0.5">
            <span className="text-white text-xs">
              {Math.floor(image.duration / 60)}:{(image.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-white/90 rounded-full p-2">
                <ZoomIn className="w-4 h-4 text-gray-800" />
              </div>
              <div className="flex items-center space-x-3 text-white text-xs">
                <div className="flex items-center space-x-0.5">
                  <Heart className="w-3 h-3" />
                  <span>{image.likes?.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-0.5">
                  <Eye className="w-3 h-3" />
                  <span>{image.views?.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-0.5">
                  <MessageCircle className="w-3 h-3" />
                  <span>{image.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleLike} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
            <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <button onClick={handleBookmark} className="p-1.5 rounded-full bg-black/50 hover:bg-black/70">
            <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileHeader = ({ profile, onClose }: { profile: CreatorProfile; onClose: () => void }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const { settings } = useSettings();

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast(isFollowing ? 'Unfollowed' : 'Following');
  };

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4">
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

            {!settings.compactView && profile.categories && (
              <div className="flex flex-wrap justify-center md:justify-start gap-1 mb-2">
                {profile.categories.map((cat) => (
                  <span key={cat} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={handleFollow}
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${isFollowing ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
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
          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{profile.stats.totalLikes.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Total Likes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{profile.stats.totalViews.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{profile.stats.avgRating}</div>
              <div className="text-xs text-gray-400">Avg Rating</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ImageModal = ({
  images,
  currentIndex,
  isOpen,
  onClose
}: {
  images: Image[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [index, setIndex] = useState(currentIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { settings } = useSettings();
  const currentImage = images[index];

  const handlePrevious = () => setIndex((prev) => (prev - 1 + images.length) % images.length);
  const handleNext = () => setIndex((prev) => (prev + 1) % images.length);
  const handleRandom = () => setIndex(Math.floor(Math.random() * images.length));

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.x > 400 || (offset.x > 0 && velocity.x > 500)) {
      handlePrevious();
    } else if (offset.x < -400 || (offset.x < 0 && velocity.x < -500)) {
      handleNext();
    }
  };

  const handleDownload = () => {
    const url = currentImage?.fullImageUrl || currentImage?.imageUrl;
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      const extension = currentImage?.isVideo ? 'mp4' : 'jpg';
      link.download = `media-${currentImage?.id}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('Download started');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Check out this image', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Link copied to clipboard');
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked');
  };

  const handleMouseMove = () => {
    if (settings.showControls) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleFullscreen = () => {
    !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen();
  };

  const toggleSlideshow = () => {
    setIsSlideshow(!isSlideshow);
    if (!isSlideshow) {
      handleNext();
      slideshowTimeoutRef.current = setInterval(() => handleNext(), settings.slideshowSpeed);
      toast('Slideshow started');
    } else {
      if (slideshowTimeoutRef.current) clearInterval(slideshowTimeoutRef.current);
      toast('Slideshow stopped');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowLeft': handlePrevious(); break;
        case 'ArrowRight': handleNext(); break;
        case 'Escape': onClose(); break;
        case ' ': e.preventDefault();
          currentImage?.isVideo ? setIsPlaying(!isPlaying) : toggleSlideshow();
          break;
        case 'r': handleRandom(); break;
        case 'f': handleFullscreen(); break;
        case 'd': handleDownload(); break;
        case 's': handleShare(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, isSlideshow, currentImage]);

  useEffect(() => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.play() : videoRef.current.pause();
    }
  }, [isPlaying, index]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (slideshowTimeoutRef.current) clearInterval(slideshowTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isSlideshow && slideshowTimeoutRef.current) {
      clearInterval(slideshowTimeoutRef.current);
      slideshowTimeoutRef.current = setInterval(() => handleNext(), settings.slideshowSpeed);
    }
  }, [index, isSlideshow, settings.slideshowSpeed]);

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay
              asChild
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none">
              <div
                className="relative w-full h-full flex items-center justify-center"
                onMouseMove={handleMouseMove}
                onClick={(e) => {
                  // Close if clicked on background (not image/video)
                  if (e.target === e.currentTarget) onClose();
                }}
              >
                <Dialog.Close asChild>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute top-6 right-6 text-white/80 hover:text-white p-2 z-20 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-all ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </Dialog.Close>

                <button
                  onClick={handlePrevious}
                  className={`absolute left-4 text-white hover:text-gray-300 p-2 z-10 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-300`}
                  disabled={images.length <= 1}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                  onClick={handleNext}
                  className={`absolute right-4 text-white hover:text-gray-300 p-2 z-10 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-300`}
                  disabled={images.length <= 1}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <motion.div
                  key={index}
                  className="relative max-w-5xl max-h-[80vh]"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                >
                  {currentImage.isVideo ? (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        src={currentImage.fullImageUrl || currentImage.imageUrl}
                        className="max-w-full max-h-[80vh] rounded-lg"
                        controls={false}
                        muted={isMuted}
                        loop
                        autoPlay={settings.autoPlay}
                        onClick={() => setIsPlaying(!isPlaying)}
                      />
                      <div className={`absolute bottom-4 left-4 right-4 flex items-center justify-between ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'
                        }`}>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-full bg-black/50 hover:bg-black/70">
                          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                        </button>
                        <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full bg-black/50 hover:bg-black/70">
                          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={settings.highQuality ? (currentImage.fullImageUrl || currentImage.imageUrl) : currentImage.imageUrl}
                      alt={`Image ${currentImage.id}`}
                      className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />
                  )}

                </motion.div>

                {settings.showThumbnails && (
                  <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-2xl overflow-x-auto py-2 ${settings.showControls && showControls ? 'opacity-100' : 'opacity-0'
                    }`}>
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === index ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-75'
                          }`}
                      >
                        <img src={img.thumbnailUrl || img.imageUrl} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Info Overlay */}
                <AnimatePresence>
                  {settings.showControls && showControls && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 shadow-2xl z-20 min-w-[300px]"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-white/90">
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer" onClick={handleLike}>
                              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                              <span className="text-sm font-medium">{currentImage.likes?.toLocaleString()}</span>
                            </button>
                            <div className="flex items-center gap-1.5 text-white/70">
                              <Eye className="w-5 h-5" />
                              <span className="text-sm">{currentImage.views?.toLocaleString()}</span>
                            </div>
                          </div>
                          <span className="text-xs text-white/50 font-mono">{index + 1} / {images.length}</span>
                        </div>

                        <div className="h-px bg-white/10 w-full" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {currentImage.isVideo && (
                              <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                              </button>
                            )}
                            <button onClick={toggleSlideshow} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isSlideshow ? 'text-blue-400' : ''}`}>
                              {isSlideshow ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={handleDownload} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Download">
                              <Download className="w-5 h-5" />
                            </button>
                            <button onClick={handleFullscreen} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Fullscreen">
                              <Maximize2 className="w-5 h-5" />
                            </button>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors lg:hidden">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={handleRandom} className="p-1 rounded-full hover:bg-white/20">
                  <Shuffle className="w-4 h-4 text-white" />
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
};

const WaterfallGallery = ({
  items,
  renderItem,
  columnCount = 3,
  hasNextPage,
  fetchNextPage,
  className = ""
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  columnCount?: number;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  className?: string;
}) => {
  const [columns, setColumns] = useState<Array<any[]>>([]);
  const { ref, inView } = useInView({ rootMargin: '400px', threshold: 0, triggerOnce: false });
  const { settings } = useSettings();

  useEffect(() => {
    const newColumns: any[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
      const columnIndex = index % columnCount;
      newColumns[columnIndex].push(item);
    });
    setColumns(newColumns);
  }, [items, columnCount]);

  useEffect(() => {
    if (inView && hasNextPage && fetchNextPage && settings.infiniteScroll) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, settings.infiniteScroll]);

  return (
    <>
      <div
        className={`grid gap-2 ${className}`}
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-2">
            <AnimatePresence mode='popLayout'>
              {column.map((item, itemIndex) => {
                const originalIndex = items.indexOf(item);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={item.id || originalIndex}
                  >
                    {renderItem(item, originalIndex)}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {hasNextPage && settings.infiniteScroll && (
        <div ref={ref} className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      {hasNextPage && !settings.infiniteScroll && (
        <div className="flex justify-center py-4">
          <button onClick={fetchNextPage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Load More
          </button>
        </div>
      )}
    </>
  );
};

const Header = ({
  title,
  showBackButton,
  onBackClick,
  showThemeToggle = true,
  showSearch = false,
  searchValue = '',
  onSearchChange = () => { },
  onSearchClear = () => { },
  showFilter = false,
  onFilter = () => { },
  onSettingsClick
}: {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showThemeToggle?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
  showFilter?: boolean;
  onFilter?: (filter: string) => void;
  onSettingsClick?: () => void;
}) => {
  const { settings } = useSettings();

  return (
    <div className="flex-none z-40 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBackButton && onBackClick && (
              <motion.button
                onClick={onBackClick}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
            )}

            <h1 className={`${settings.compactView ? 'text-lg' : 'text-xl'} font-bold text-white flex items-center gap-2`}>
              {title === 'Trending Profiles' && <TrendingUp className="h-4 w-4 text-blue-500" />}
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {showSearch && <SearchBar value={searchValue} onChange={onSearchChange} onClear={onSearchClear} />}
            {showFilter && <FilterDropdown onFilter={onFilter} />}
            <div className="h-6 w-px bg-gray-700 mx-2" />
            <LayoutSwitcher />
            <div className="h-6 w-px bg-gray-700 mx-2" />
            {onSettingsClick && (
              <motion.button
                onClick={onSettingsClick}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="h-4 w-4" />
              </motion.button>
            )}
            {showThemeToggle && <ThemeToggle />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
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
        return fetchSearchResults({ pageParam: pageParam as number, query: debouncedSearchValue });
      }
      return fetchTrendingProfiles({ pageParam: pageParam as number });
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
    queryFn: () => fetchCreatorProfile(creatorId!),
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
    queryFn: ({ pageParam = 1 }) => fetchCreatorImages({ pageParam, creatorId: creatorId! }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!creatorId,
    retry: 2,
    retryDelay: 1000,
  });

  // Event handlers
  const handleProfileClick = useCallback((profile: Profile) => {
    if (profile.isAd) return;
    const id = extractCreatorId(profile);
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

    // Fallback client-side filtering if search is changing rapidly before debounce?
    // Or if we want to filter within the search results (unlikely needed for name)
    // But filters like 'Verified' etc should still apply.

    if (searchValue && searchValue !== debouncedSearchValue) {
      // While waiting for debounce, maybe filter current list?
      // But current list might be trending, so filtering it by name is okay.
      profiles = profiles.filter(p => p.name.toLowerCase().includes(searchValue.toLowerCase()));
    } else if (debouncedSearchValue) {
      // WE have search results, we don't need to filter by name again unless we want strict matching?
      // The server search usually works well.
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
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 dark:bg-black overflow-hidden">
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

      <div
        className="flex-1 overflow-y-auto scroll-smooth"
        ref={(el) => {
          // Optional: Expose scroll container if needed
        }}
      >
        <div className={`w-full px-2 ${settings.compactView ? 'py-1' : 'py-2'}`}>
          {!creatorId ? (
            // Trending View
            isLoadingTrending ? (
              <div className='flex justify-center items-center h-64'>
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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