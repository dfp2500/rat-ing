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
    staleTime: 30 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
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
      await queryClient.cancelQueries({ queryKey: ['movies', data.movieId] });

      const previousMovie = queryClient.getQueryData<Movie>(['movies', data.movieId]);

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
      if (context?.previousMovie) {
        queryClient.setQueryData(['movies', data.movieId], context.previousMovie);
      }
    },
    onSuccess: (updatedMovie) => {
      queryClient.setQueryData(['movies', updatedMovie.id], updatedMovie);
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/**
 * Hook para verificar si una película existe
 */
export function useMovieExists(tmdbId: number | null) {
  return useQuery({
    queryKey: ['movies', 'exists', tmdbId],
    queryFn: async () => {
      if (!tmdbId) return null;
      const exists = await movieService.movieExistsByTMDBId(tmdbId);
      if (!exists) return null;
      
      // Si existe, obtener la serie completa
      const allMovies = await movieService.getAllMovies();
      return allMovies.find(s => s.tmdbId === tmdbId) || null;
    },
    enabled: !!tmdbId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para eliminar una película
 */
export function useDeleteMovie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: string) => movieService.deleteMovie(movieId),
    onSuccess: (_, movieId) => {
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Eliminar del cache
      queryClient.removeQueries({ queryKey: ['movies', movieId] });
    },
  });
}