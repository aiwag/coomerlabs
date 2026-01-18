// src/hooks/useRedGifs.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { redGifsApiWithFallback } from '@/services/redgifs'
import { useRedGifsAuth } from './useRedGifsAuth'

export const useTrending = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['redgifs', 'trending'],
    queryFn: ({ pageParam }: { pageParam?: number }) => redGifsApiWithFallback.getTrending(pageParam || 1),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1
      return undefined
    },
    initialPageParam: 1,
    enabled: enabled,
    retry: 1,
    retryDelay: 1000,
  })
}

export const useCreators = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['redgifs', 'creators'],
    queryFn: ({ pageParam }: { pageParam?: number }) => redGifsApiWithFallback.getCreators(pageParam || 1),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1
      return undefined
    },
    initialPageParam: 1,
    enabled: enabled,
    retry: 1,
    retryDelay: 1000,
  })
}

export const useUserContent = (username: string, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['redgifs', 'user', username],
    queryFn: ({ pageParam }: { pageParam?: number }) => redGifsApiWithFallback.getUserContent(username, pageParam || 1),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1
      return undefined
    },
    initialPageParam: 1,
    enabled: enabled && !!username,
    retry: 1,
    retryDelay: 1000,
  })
}

export const useNiches = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['redgifs', 'niches'],
    queryFn: ({ pageParam }: { pageParam?: number }) => redGifsApiWithFallback.getNiches(pageParam || 1),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1
      return undefined
    },
    initialPageParam: 1,
    enabled: enabled,
    retry: 1,
    retryDelay: 1000,
  })
}

export const useNicheContent = (nicheId: string, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['redgifs', 'niche', nicheId],
    queryFn: ({ pageParam }: { pageParam?: number }) => redGifsApiWithFallback.getNicheContent(nicheId, pageParam || 1),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) return lastPage.page + 1
      return undefined
    },
    initialPageParam: 1,
    enabled: enabled && !!nicheId,
    retry: 1,
    retryDelay: 1000,
  })
}

export const useSearchCreators = (query: string, enabled = true) => {
  const { isAuthenticated } = useRedGifsAuth()
  
  return useQuery({
    queryKey: ['redgifs', 'search-creators', query],
    queryFn: () => redGifsApiWithFallback.searchCreators(query),
    enabled: enabled && !!query, // Remove the isAuthenticated check for now
    retry: 1, // Reduce retry count
    retryDelay: 1000,
  })
}