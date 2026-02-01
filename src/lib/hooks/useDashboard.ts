// src/lib/hooks/useDashboard.ts - NUEVO ARCHIVO

import { useQuery } from '@tanstack/react-query';
import { getDocs, query, where, orderBy, limit as firestoreLimit, or } from 'firebase/firestore';
import { getMoviesCollection, getSeriesCollection, getGamesCollection } from '../firebase/firestore';
import { UserRole } from '@/types/user';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';
import { Game } from '@/types/game';

/**
 * 🎯 Hook optimizado: Solo trae actividad reciente (últimos N items)
 * En lugar de cargar 1000 docs y ordenar en cliente, trae solo los necesarios
 */
export function useRecentActivity(limit: number = 8) {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: async () => {
      // Traer los últimos N de cada tipo
      const [moviesSnap, seriesSnap, gamesSnap] = await Promise.all([
        getDocs(
          query(
            getMoviesCollection(),
            orderBy('watchedDate', 'desc'),
            firestoreLimit(limit)
          )
        ),
        getDocs(
          query(
            getSeriesCollection(),
            orderBy('startedWatchingDate', 'desc'),
            firestoreLimit(limit)
          )
        ),
        getDocs(
          query(
            getGamesCollection(),
            orderBy('startedPlayingDate', 'desc'),
            firestoreLimit(limit)
          )
        ),
      ]);

      const movies = moviesSnap.docs.map(d => d.data());
      const series = seriesSnap.docs.map(d => d.data());
      const games = gamesSnap.docs.map(d => d.data());

      // Combinar y ordenar
      const combined = [
        ...movies.map(m => ({ type: 'movie' as const, date: m.watchedDate.toMillis(), data: m })),
        ...series.map(s => ({ type: 'series' as const, date: s.startedWatchingDate.toMillis(), data: s })),
        ...games.map(g => ({ type: 'game' as const, date: (g.startedPlayingDate || g.createdAt).toMillis(), data: g })),
      ];

      return combined
        .sort((a, b) => b.date - a.date)
        .slice(0, limit);
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * 🎯 Hook optimizado: Solo trae items pendientes del usuario actual
 */
export function usePendingItems(userRole: UserRole | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'pending', userRole],
    queryFn: async () => {
      if (!userRole) return { movies: [], series: [], games: [], total: 0 };

      // Query para items donde el usuario NO ha valorado
      const [moviesSnap, seriesSnap, gamesSnap] = await Promise.all([
        getDocs(
          query(
            getMoviesCollection(),
            where(`ratings.${userRole}`, '==', null),
            orderBy('watchedDate', 'desc'),
            firestoreLimit(10) // Solo los primeros 10
          )
        ),
        getDocs(
          query(
            getSeriesCollection(),
            where(`ratings.${userRole}`, '==', null),
            orderBy('startedWatchingDate', 'desc'),
            firestoreLimit(10)
          )
        ),
        getDocs(
          query(
            getGamesCollection(),
            where(`ratings.${userRole}`, '==', null),
            orderBy('startedPlayingDate', 'desc'),
            firestoreLimit(10)
          )
        ),
      ]);

      const movies = moviesSnap.docs.map(d => d.data());
      const series = seriesSnap.docs.map(d => d.data());
      const games = gamesSnap.docs.map(d => d.data());

      return {
        movies,
        series,
        games,
        total: movies.length + series.length + games.length,
      };
    },
    enabled: !!userRole, // Solo ejecutar si hay usuario
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * 🎯 Hook optimizado: Trae las últimas 5 de cada tipo para mostrar en tabs
 */
export function useLatestByType() {
  return useQuery({
    queryKey: ['dashboard', 'latest-by-type'],
    queryFn: async () => {
      const [moviesSnap, seriesSnap, gamesSnap] = await Promise.all([
        getDocs(
          query(
            getMoviesCollection(),
            orderBy('watchedDate', 'desc'),
            firestoreLimit(5)
          )
        ),
        getDocs(
          query(
            getSeriesCollection(),
            orderBy('startedWatchingDate', 'desc'),
            firestoreLimit(5)
          )
        ),
        getDocs(
          query(
            getGamesCollection(),
            orderBy('startedPlayingDate', 'desc'),
            firestoreLimit(5)
          )
        ),
      ]);

      return {
        movies: moviesSnap.docs.map(d => d.data()),
        series: seriesSnap.docs.map(d => d.data()),
        games: gamesSnap.docs.map(d => d.data()),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * 🎯 Hook combinado: Trae todo lo necesario para el dashboard de forma optimizada
 */
export function useDashboardData(userRole: UserRole | undefined) {
  const recentActivity = useRecentActivity(8);
  const pendingItems = usePendingItems(userRole);
  const latestByType = useLatestByType();

  return {
    recentActivity: recentActivity.data || [],
    pending: pendingItems.data || { movies: [], series: [], games: [], total: 0 },
    latest: latestByType.data || { movies: [], series: [], games: [] },
    isLoading: recentActivity.isLoading || pendingItems.isLoading || latestByType.isLoading,
    error: recentActivity.error || pendingItems.error || latestByType.error,
  };
}