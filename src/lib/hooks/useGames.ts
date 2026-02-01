import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameService } from '../services/gameService';
import {
  Game,
  CreateGameInput,
  UpdateGameRatingInput,
} from '@/types/game';
import { UserRole } from '@/types/user';

/**
 * Hook para obtener todos los juegos
 */
export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: () => gameService.getAllGames(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para obtener un juego específico
 */
export function useGameById(gameId: string | null) {
  return useQuery({
    queryKey: ['games', gameId],
    queryFn: () => gameService.getGameById(gameId!),
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener juegos pendientes de rating
 */
export function usePendingGames(userRole: UserRole | null) {
  return useQuery({
    queryKey: ['games', 'pending', userRole],
    queryFn: () => gameService.getPendingGames(userRole!),
    enabled: !!userRole,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para crear un nuevo juego
 */
export function useCreateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGameInput) => gameService.createGame(data),
    onSuccess: (newGame) => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.setQueryData(['games', newGame.id], newGame);
    },
  });
}

/**
 * Hook para actualizar rating de un juego
 */
export function useUpdateGameRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGameRatingInput) => gameService.updateRating(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['games', data.gameId] });

      const previousGame = queryClient.getQueryData<Game>(['games', data.gameId]);

      if (previousGame) {
        queryClient.setQueryData<Game>(['games', data.gameId], {
          ...previousGame,
          ratings: {
            ...previousGame.ratings,
            [data.userRole]: {
              score: data.score,
              comment: data.comment,
              ratedAt: previousGame.ratings[data.userRole]?.ratedAt || null as any,
            },
          },
        });
      }

      return { previousGame };
    },
    onError: (err, data, context) => {
      if (context?.previousGame) {
        queryClient.setQueryData(['games', data.gameId], context.previousGame);
      }
    },
    onSuccess: (updatedGame) => {
      queryClient.setQueryData(['games', updatedGame.id], updatedGame);
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/**
 * Hook para verificar si un juego existe
 */
export function useGameExists(rawgId: number | null) {
  return useQuery({
    queryKey: ['games', 'exists', rawgId],
    queryFn: async () => {
      if (!rawgId) return null;
      const exists = await gameService.gameExistsByRAWGId(rawgId);
      if (!exists) return null;
      
      const allGames = await gameService.getAllGames();
      return allGames.find(g => g.rawgId === rawgId) || null;
    },
    enabled: !!rawgId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para eliminar un juego
 */
export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gameId: string) => gameService.deleteGame(gameId),
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.removeQueries({ queryKey: ['games', gameId] });
    },
  });
}