import { useQuery } from '@tanstack/react-query';
import { TMDBSeriesSearchResult, TMDBSeriesDetails } from '@/types/tmdb-series';

/**
 * Hook para buscar series
 */
export function useSearchSeries(query: string, page: number = 1) {
  return useQuery({
    queryKey: ['tmdb', 'series', 'search', query, page],
    queryFn: async (): Promise<TMDBSeriesSearchResult> => {
      const params = new URLSearchParams({
        query,
        page: page.toString(),
      });

      const response = await fetch(`/api/tmdb/series/search?${params}`);

      if (!response.ok) {
        throw new Error('Failed to search series');
      }

      return response.json();
    },
    enabled: query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener detalles de una serie
 */
export function useSeriesDetails(seriesId: number | null) {
  return useQuery({
    queryKey: ['tmdb', 'series', seriesId],
    queryFn: async (): Promise<TMDBSeriesDetails> => {
      const response = await fetch(`/api/tmdb/series/${seriesId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch series details');
      }

      return response.json();
    },
    enabled: seriesId !== null,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}