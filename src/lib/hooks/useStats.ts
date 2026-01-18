import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDoc } from 'firebase/firestore';
import { getStatsDoc } from '../firebase/firestore';
import { statsService } from '../services/statsService';
import { useMovies } from './useMovies';
import { GlobalStats } from '@/types/stats';
import { useMemo } from 'react';

/**
 * Hook para obtener estadísticas globales desde Firestore
 */
export function useGlobalStats() {
  return useQuery({
    queryKey: ['stats', 'global'],
    queryFn: async () => {
      const statsDoc = getStatsDoc('global');
      const snapshot = await getDoc(statsDoc);
      
      if (!snapshot.exists()) {
        // Si no existen stats, calcularlas por primera vez
        return await statsService.updateGlobalStats();
      }
      
      return snapshot.data() as GlobalStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para recalcular y actualizar estadísticas
 */
export function useUpdateGlobalStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => statsService.updateGlobalStats(),
    onSuccess: (newStats) => {
      // Actualizar cache
      queryClient.setQueryData(['stats', 'global'], newStats);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/**
 * Hook para estadísticas calculadas en tiempo real
 * (no guardadas en Firestore, calculadas desde las películas)
 */
export function useComputedStats() {
  const { data: movies } = useMovies();

  return useMemo(() => {
    if (!movies || movies.length === 0) {
      return {
        agreementStats: null,
        topRated: [],
        mostControversial: [],
        moviesByMonth: {},
        averageEvolution: [],
      };
    }

    // Calcular agreementStats de forma síncrona (sin async)
    const bothRated = movies.filter((m) => m.bothRated);
    
    let agreementStats = {
      totalBothRated: 0,
      perfectAgreement: 0,
      closeAgreement: 0,
      moderateAgreement: 0,
      disagreement: 0,
      averageDifference: 0,
    };

    if (bothRated.length > 0) {
      let perfectAgreement = 0;
      let closeAgreement = 0;
      let moderateAgreement = 0;
      let disagreement = 0;
      let totalDifference = 0;

      bothRated.forEach((movie) => {
        const score1 = movie.ratings.user_1?.score || 0;
        const score2 = movie.ratings.user_2?.score || 0;
        const diff = Math.abs(score1 - score2);

        totalDifference += diff;

        if (diff === 0) {
          perfectAgreement++;
        } else if (diff <= 1) {
          closeAgreement++;
        } else if (diff <= 2) {
          moderateAgreement++;
        } else {
          disagreement++;
        }
      });

      agreementStats = {
        totalBothRated: bothRated.length,
        perfectAgreement,
        closeAgreement,
        moderateAgreement,
        disagreement,
        averageDifference: Number((totalDifference / bothRated.length).toFixed(2)),
      };
    }

    return {
      agreementStats,
      topRated: statsService.getTopRatedMovies(movies, 10),
      mostControversial: statsService.getMostControversialMovies(movies, 5),
      moviesByMonth: statsService.getMoviesByMonth(movies),
      averageEvolution: statsService.getAverageEvolution(movies),
    };
  }, [movies]);
}

/**
 * Hook para estadísticas de un usuario específico
 */
export function useUserStats(userRole: 'user_1' | 'user_2') {
  const { data: globalStats } = useGlobalStats();

  return useMemo(() => {
    if (!globalStats) return null;
    return globalStats[userRole];
  }, [globalStats, userRole]);
}

/**
 * Hook combinado con todas las estadísticas
 */
export function useAllStats() {
  const { data: globalStats, isLoading: globalLoading } = useGlobalStats();
  const computed = useComputedStats();

  return {
    global: globalStats,
    computed,
    isLoading: globalLoading,
  };
}