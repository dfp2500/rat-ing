import { useQuery } from '@tanstack/react-query';
import { RAWGSearchResult, RAWGGameDetails } from '@/types/rawg';

/**
 * Hook para buscar juegos
 */
export function useSearchGames(query: string, page: number = 1) {
  return useQuery({
    queryKey: ['rawg', 'search', query, page],
    queryFn: async (): Promise<RAWGSearchResult> => {
      const params = new URLSearchParams({
        query,
        page: page.toString(),
      });

      const response = await fetch(`/api/rawg/search?${params}`);

      if (!response.ok) {
        throw new Error('Failed to search games');
      }

      return response.json();
    },
    enabled: query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener detalles de un juego
 */
export function useGameDetails(gameId: number | null) {
  return useQuery({
    queryKey: ['rawg', 'game', gameId],
    queryFn: async (): Promise<RAWGGameDetails> => {
      const response = await fetch(`/api/rawg/game/${gameId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch game details');
      }

      return response.json();
    },
    enabled: gameId !== null,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}
