import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

interface SearchFilters {
  query: string;
  duration: "all" | "short" | "medium" | "long";
  quality: "all" | "hd" | "fullhd";
  category: string;
  sortBy: "newest" | "oldest" | "mostviewed" | "rating";
}

export interface VideoData {
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
  videoUrl?: string;
}

const ADVANCED_SEARCH_DEBOUNCE = 300;

type SortType = "main" | "top_favorites" | "uncensored" | "most_viewed" | "top_rated" | "being_watched" | "search";

interface UseAdvancedSearchOptions {
  sortType?: SortType;
  initialQuery?: string;
}

export const useAdvancedSearch = (options: UseAdvancedSearchOptions = {}) => {
  const { sortType = "main", initialQuery = "" } = options;

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    duration: "all",
    quality: "all",
    category: "",
    sortBy: "newest",
  });

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["javtube-videos", sortType, debouncedQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: String(pageParam) });
      if (sortType !== "main") params.append("sort", sortType);
      if (sortType === "search" && debouncedQuery) params.append("q", debouncedQuery);

      const response = await fetch(`http://127.0.0.1:8080/api/videos?${params}`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage && lastPage.length > 0) {
        return allPages.length + 1;
      }
      return undefined;
    },
  });

  const allVideos = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        setDebouncedQuery(searchQuery);
      }, ADVANCED_SEARCH_DEBOUNCE);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, debouncedQuery]);

  const filteredVideos = useMemo(() => {
    if (!debouncedQuery.trim() || sortType === "search") return allVideos;

    const queryLower = debouncedQuery.toLowerCase();
    return allVideos.filter(
      (video) =>
        video.title.toLowerCase().includes(queryLower) ||
        video.code.toLowerCase().includes(queryLower)
    );
  }, [allVideos, debouncedQuery, sortType]);

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
    setSearchQuery,
    debouncedQuery,
    allVideos,
    filteredVideos,
    loading: isLoading,
    error: isError ? "Failed to load videos" : null,
    handleFilterChange,
    clearFilters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
};
