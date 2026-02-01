// src/lib/hooks/useStats.ts - VERSIÓN SIMPLIFICADA

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDoc } from 'firebase/firestore';
import { getStatsDoc } from '../firebase/firestore';
import { statsService } from '../services/statsService';
import { GlobalStats, ContentTypeStats } from '@/types/stats';

/**
 * 📊 Hook principal: Obtener estadísticas globales desde Firestore
 * 
 * Ya no calcula nada localmente - simplemente lee el documento /stats/global
 * que se actualiza automáticamente en cada operación CRUD.
 */
export function useGlobalStats() {
  return useQuery({
    queryKey: ['stats', 'global'],
    queryFn: async () => {
      const statsDoc = getStatsDoc('global');
      const snapshot = await getDoc(statsDoc);

      if (!snapshot.exists()) {
        // Si no existe, calcular por primera vez
        console.log('📊 Calculando estadísticas iniciales...');
        return await statsService.calculateAndSaveGlobalStats();
      }

      return snapshot.data() as GlobalStats;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - las stats se actualizan automáticamente
    gcTime: 30 * 60 * 1000,     // 30 minutos en caché
  });
}

/**
 * 🔄 Hook para forzar recálculo manual de estadísticas
 * 
 * Útil si necesitas regenerar las stats por alguna razón
 * (normalmente no es necesario porque se actualizan automáticamente)
 */
export function useRecalculateStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      console.log('🔄 Recalculando estadísticas manualmente...');
      return statsService.calculateAndSaveGlobalStats();
    },
    onSuccess: (newStats) => {
      queryClient.setQueryData(['stats', 'global'], newStats);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      console.log('✅ Estadísticas recalculadas');
    },
    onError: (error) => {
      console.error('❌ Error recalculando estadísticas:', error);
    },
  });
}

/**
 * 📈 Helper: Obtener stats de un tipo específico de contenido
 */
export function useContentTypeStats(
  type: 'movies' | 'series' | 'games'
): ContentTypeStats | undefined {
  const { data: stats } = useGlobalStats();
  return stats?.[type];
}

/**
 * 🎯 Helper: Obtener stats de acuerdo
 */
export function useAgreementStats() {
  const { data: stats } = useGlobalStats();
  return stats?.agreement;
}

/**
 * 🏆 Helper: Obtener top rated items
 */
export function useTopRated() {
  const { data: stats } = useGlobalStats();
  return stats?.topRated || [];
}

/**
 * ⚡ Helper: Obtener items más controversiales
 */
export function useMostControversial() {
  const { data: stats } = useGlobalStats();
  return stats?.mostControversial || [];
}

/**
 * 📊 Helper: Obtener evolución temporal
 */
export function useAverageEvolution() {
  const { data: stats } = useGlobalStats();
  return stats?.averageEvolution || [];
}

/**
 * Alias para compatibilidad con código antiguo
 * @deprecated Use useRecalculateStats instead
 */
export const useUpdateGlobalStats = useRecalculateStats;