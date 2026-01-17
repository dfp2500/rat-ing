import { useQuery } from '@tanstack/react-query';
import { TMDBSearchResult, TMDBMovieDetails } from '@/types/tmdb';

/**
 * Hook para buscar películas
 */
export function useSearchMovies(query: string, page: number = 1) {
  return useQuery({
    queryKey: ['tmdb', 'search', query, page],
    queryFn: async (): Promise<TMDBSearchResult> => {
      const params = new URLSearchParams({
        query,
        page: page.toString(),
      });

      const response = await fetch(`/api/tmdb/search?${params}`);

      if (!response.ok) {
        throw new Error('Failed to search movies');
      }

      return response.json();
    },
    enabled: query.trim().length > 0, // Solo buscar si hay query
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener detalles de una película
 */
export function useMovieDetails(movieId: number | null) {
  return useQuery({
    queryKey: ['tmdb', 'movie', movieId],
    queryFn: async (): Promise<TMDBMovieDetails> => {
      const response = await fetch(`/api/tmdb/movie/${movieId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }

      return response.json();
    },
    enabled: movieId !== null, // Solo buscar si hay ID
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}