import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Search, X, Filter, Clock, ChevronDown } from "lucide-react";

interface SearchFilters {
  query: string;
  duration: "all" | "short" | "medium" | "long";
  quality: "all" | "hd" | "fullhd";
  category: string;
  sortBy: "newest" | "oldest" | "mostviewed" | "rating";
}

interface VideoData {
  id: string;
  code: string;
  title: string;
  thumbnail: string;
  duration: string;
  quality: string;
  views?: string;
  rating?: number;
  tags?: string[];
  actresses?: string[];
  uploadedAt: string;
}

interface SearchSuggestions {
  query: string;
  suggestions: string[];
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  results: number;
}

const ADVANCED_SEARCH_DEBOUNCE = 300;

export const useAdvancedSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    duration: "all",
    quality: "all",
    category: "",
    sortBy: "newest",
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestions[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock video data for now
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/videos");
        if (!response.ok) throw new Error("Failed to fetch videos");

        const videos = await response.json();
        setAllVideos(videos);
        setFilteredVideos(videos);
        setLoading(false);
      } catch (error) {
        console.error("Search error:", error);
        setError("Failed to load videos");
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      searchTimeoutRef.current = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        performSearch();
      }, ADVANCED_SEARCH_DEBOUNCE);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, debouncedQuery]);

  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setFilteredVideos(allVideos);
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    setSearchHistory((prev) => [
      {
        id: Date.now().toString(),
        query: debouncedQuery,
        timestamp: new Date(),
        results: 0,
      },
      ...prev.slice(0, 9),
    ]);

    try {
      // Enhanced search with title, code, and tags
      const queryLower = debouncedQuery.toLowerCase();
      const results = allVideos.filter(
        (video) =>
          video.title.toLowerCase().includes(queryLower) ||
          video.code.toLowerCase().includes(queryLower) ||
          video.tags?.some((tag) => tag.toLowerCase().includes(queryLower)) ||
          video.actresses?.some((actress) =>
            actress.toLowerCase().includes(queryLower),
          ),
      );

      setFilteredVideos(results);

      // Generate suggestions
      const uniqueTitles = Array.from(
        new Set(allVideos.map((v) => v.title.toLowerCase())),
      );
      const uniqueCodes = Array.from(
        new Set(allVideos.map((v) => v.code.toLowerCase())),
      );

      const textSuggestions = uniqueTitles
        .filter((title) => title.includes(queryLower))
        .slice(0, 5)
        .map((title) => ({ query: debouncedQuery, suggestions: [title] }));

      const codeSuggestions = uniqueCodes
        .filter((code) => code.includes(queryLower))
        .slice(0, 3)
        .map((code) => ({ query: debouncedQuery, suggestions: [code] }));

      setSuggestions([...textSuggestions, ...codeSuggestions]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [allVideos, debouncedQuery]);

  // Apply filters
  const filteredVideosWithFilters = useMemo(() => {
    let filtered = [...filteredVideos];

    if (filters.duration !== "all") {
      const durationMap = {
        short: [0, 600],
        medium: [601, 1800],
        long: [1801, 999999],
      };
      const [min, max] = durationMap[filters.duration] || [0, 999999];
      filtered = filtered.filter((video) => {
        const duration = parseInt(video.duration) || 0;
        return duration >= min && duration <= max;
      });
    }

    if (filters.quality !== "all") {
      const qualityOrder = ["360p", "480p", "720p", "fullhd"];
      const qualityIndex = qualityOrder.indexOf(filters.quality);
      if (qualityIndex > -1) {
        filtered = filtered.filter((video) => {
          const videoQuality = video.quality.toLowerCase().replace("p", "");
          return qualityOrder.includes(videoQuality);
        });
      }
    }

    if (filters.category) {
      filtered = filtered.filter((video) => {
        const tags = video.tags || [];
        return tags.some((tag) =>
          tag.toLowerCase().includes(filters.category.toLowerCase()),
        );
      });
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
        );
        break;
      case "mostviewed":
        filtered.sort(
          (a, b) =>
            (parseInt(b.views || "0") || 0) - (parseInt(a.views || "0") || 0),
        );
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return filtered;
  }, [filteredVideos, filters, allVideos]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      duration: "all",
      quality: "all",
      category: "",
      sortBy: "newest",
    });
    setSearchQuery("");
    setDebouncedQuery("");
  };

  return {
    filters,
    searchQuery,
    debouncedQuery,
    searchHistory,
    suggestions,
    isSearching,
    filteredVideos,
    showFilters,
    allVideos,
    loading,
    error,
    handleFilterChange,
    clearFilters,
    performSearch,
  };
};
