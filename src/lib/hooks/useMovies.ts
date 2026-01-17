import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movieService } from '../services/movieService';
import {
  Movie,
  CreateMovieInput,
  UpdateRatingInput,
} from '@/types/movie';
import { UserRole } from '@/types/user';

/**
 * Hook para obtener todas las películas
 */
export function useMovies() {
  return useQuery({
    queryKey: ['movies'],
    queryFn: () => movieService.getAllMovies(),
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para obtener una película específica
 */
export function useMovie(movieId: string | null) {
  return useQuery({
    queryKey: ['movies', movieId],
    queryFn: () => movieService.getMovieById(movieId!),
    enabled: !!movieId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener películas pendientes de rating
 */
export function usePendingMovies(userRole: UserRole | null) {
  return useQuery({
    queryKey: ['movies', 'pending', userRole],
    queryFn: () => movieService.getPendingMovies(userRole!),
    enabled: !!userRole,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para crear una nueva película
 */
export function useCreateMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMovieInput) => movieService.createMovie(data),
    onSuccess: (newMovie) => {
      // Invalidar queries para refrescar listas
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      
      // Añadir película nueva al cache
      queryClient.setQueryData(['movies', newMovie.id], newMovie);
    },
  });
}

/**
 * Hook para actualizar rating
 */
export function useUpdateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRatingInput) => movieService.updateRating(data),
    onMutate: async (data) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['movies', data.movieId] });

      // Snapshot del valor anterior
      const previousMovie = queryClient.getQueryData<Movie>(['movies', data.movieId]);

      // Optimistic update
      if (previousMovie) {
        queryClient.setQueryData<Movie>(['movies', data.movieId], {
          ...previousMovie,
          ratings: {
            ...previousMovie.ratings,
            [data.userRole]: {
              score: data.score,
              comment: data.comment,
              ratedAt: previousMovie.ratings[data.userRole]?.ratedAt || null as any,
            },
          },
        });
      }

      return { previousMovie };
    },
    onError: (err, data, context) => {
      // Revertir en caso de error
      if (context?.previousMovie) {
        queryClient.setQueryData(['movies', data.movieId], context.previousMovie);
      }
    },
    onSuccess: (updatedMovie) => {
      // Actualizar cache con datos del servidor
      queryClient.setQueryData(['movies', updatedMovie.id], updatedMovie);
      
      // Invalidar lista de películas
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

/**
 * Hook para verificar si una película existe
 */
export function useMovieExists(tmdbId: number | null) {
  return useQuery({
    queryKey: ['movies', 'exists', tmdbId],
    queryFn: () => movieService.movieExistsByTMDBId(tmdbId!),
    enabled: !!tmdbId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}