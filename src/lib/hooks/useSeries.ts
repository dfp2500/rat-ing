import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesService } from '../services/seriesService';
import {
  Series,
  CreateSeriesInput,
  UpdateSeriesRatingInput,
  UpdateSeriesProgressInput,
} from '@/types/series';
import { UserRole } from '@/types/user';

/**
 * Hook para obtener todas las series
 */
export function useSeries() {
  return useQuery({
    queryKey: ['series'],
    queryFn: () => seriesService.getAllSeries(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para obtener una serie específica
 */
export function useSeriesById(seriesId: string | null) {
  return useQuery({
    queryKey: ['series', seriesId],
    queryFn: () => seriesService.getSeriesById(seriesId!),
    enabled: !!seriesId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener series por estado de visualización
 */
export function useSeriesByStatus(watchStatus: Series['watchStatus'] | null) {
  return useQuery({
    queryKey: ['series', 'status', watchStatus],
    queryFn: () => seriesService.getSeriesByWatchStatus(watchStatus!),
    enabled: !!watchStatus,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para obtener series pendientes de rating
 */
export function usePendingSeries(userRole: UserRole | null) {
  return useQuery({
    queryKey: ['series', 'pending', userRole],
    queryFn: () => seriesService.getPendingSeries(userRole!),
    enabled: !!userRole,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para crear una nueva serie
 */
export function useCreateSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSeriesInput) => seriesService.createSeries(data),
    onSuccess: (newSeries) => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      queryClient.setQueryData(['series', newSeries.id], newSeries);
    },
  });
}

/**
 * Hook para actualizar rating de una serie
 */
export function useUpdateSeriesRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSeriesRatingInput) => seriesService.updateRating(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['series', data.seriesId] });

      const previousSeries = queryClient.getQueryData<Series>(['series', data.seriesId]);

      if (previousSeries) {
        queryClient.setQueryData<Series>(['series', data.seriesId], {
          ...previousSeries,
          ratings: {
            ...previousSeries.ratings,
            [data.userRole]: {
              score: data.score,
              comment: data.comment,
              ratedAt: previousSeries.ratings[data.userRole]?.ratedAt || null as any,
            },
          },
        });
      }

      return { previousSeries };
    },
    onError: (err, data, context) => {
      if (context?.previousSeries) {
        queryClient.setQueryData(['series', data.seriesId], context.previousSeries);
      }
    },
    onSuccess: (updatedSeries) => {
      queryClient.setQueryData(['series', updatedSeries.id], updatedSeries);
      queryClient.invalidateQueries({ queryKey: ['series'] });
    },
  });
}

/**
 * Hook para actualizar progreso de visualización
 */
export function useUpdateSeriesProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSeriesProgressInput) => seriesService.updateProgress(data),
    onSuccess: (updatedSeries) => {
      queryClient.setQueryData(['series', updatedSeries.id], updatedSeries);
      queryClient.invalidateQueries({ queryKey: ['series'] });
    },
  });
}

/**
 * Hook para verificar si una serie existe
 */
export function useSeriesExists(tmdbId: number | null) {
  return useQuery({
    queryKey: ['series', 'exists', tmdbId],
    queryFn: () => seriesService.seriesExistsByTMDBId(tmdbId!),
    enabled: !!tmdbId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para eliminar una serie
 */
export function useDeleteSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seriesId: string) => seriesService.deleteSeries(seriesId),
    onSuccess: (_, seriesId) => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
      queryClient.removeQueries({ queryKey: ['series', seriesId] });
    },
  });
}