import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDoc } from 'firebase/firestore';
import { getStatsDoc } from '../firebase/firestore';
import { statsService } from '../services/statsService';
import { useMovies } from './useMovies';
import { useSeries } from './useSeries';
import { GlobalStats } from '@/types/stats';
import {
  NormalizedStatsItem,
  ContentFilter,
  movieToStatsItem,
  seriesToStatsItem,
  filterByContentType,
} from '@/types/statsItem';
import { useMemo } from 'react';

// ─── Global stats from Firestore (unchanged) ──────────────────────────────
export function useGlobalStats() {
  return useQuery({
    queryKey: ['stats', 'global'],
    queryFn: async () => {
      const statsDoc = getStatsDoc('global');
      const snapshot = await getDoc(statsDoc);

      if (!snapshot.exists()) {
        return await statsService.updateGlobalStats();
      }

      return snapshot.data() as GlobalStats;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Recalculate & persist ─────────────────────────────────────────────────
export function useUpdateGlobalStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => statsService.updateGlobalStats(),
    onSuccess: (newStats) => {
      queryClient.setQueryData(['stats', 'global'], newStats);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// ─── Normalized items pool ─────────────────────────────────────────────────
/**
 * Merges movies + series (+ future types) into a single NormalizedStatsItem[].
 * Memoised so downstream hooks only recompute when source data changes.
 */
export function useNormalizedItems() {
  const { data: movies } = useMovies();
  const { data: series } = useSeries();

  return useMemo(() => {
    const items: NormalizedStatsItem[] = [];
    if (movies) items.push(...movies.map(movieToStatsItem));
    if (series) items.push(...series.map(seriesToStatsItem));
    return items;
  }, [movies, series]);
}

// ─── Core computed stats (content-type agnostic) ───────────────────────────
/**
 * Given a set of NormalizedStatsItems, compute every stat the page needs.
 * Pure function – no side effects, no Firestore calls.
 */
export function computeStats(items: NormalizedStatsItem[]) {
  if (items.length === 0) {
    return {
      totalItems: 0,
      averageScore: 0,
      user_1: { totalRatings: 0, averageScore: 0, distribution: emptyDist() },
      user_2: { totalRatings: 0, averageScore: 0, distribution: emptyDist() },
      agreementStats: null,
      topRated: [] as NormalizedStatsItem[],
      mostControversial: [] as { item: NormalizedStatsItem; difference: number }[],
      averageEvolution: [] as { month: string; average: number; count: number }[],
    };
  }

  // ── Per-user stats ──
  const u1 = userStats(items, 'user_1');
  const u2 = userStats(items, 'user_2');

  // ── Global average (only items that have at least one rating) ──
  const rated = items.filter((i) => i.averageScore !== undefined);
  const averageScore =
    rated.length > 0
      ? rated.reduce((s, i) => s + (i.averageScore || 0), 0) / rated.length
      : 0;

  // ── Agreement ──
  const bothRated = items.filter((i) => i.bothRated);
  let agreementStats: ReturnType<typeof calcAgreement> | null = null;
  if (bothRated.length > 0) {
    agreementStats = calcAgreement(bothRated);
  }

  // ── Top rated (need averageScore) ──
  const topRated = [...items]
    .filter((i) => i.averageScore !== undefined)
    .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
    .slice(0, 10);

  // ── Most controversial (need bothRated) ──
  const mostControversial = bothRated
    .map((item) => {
      const s1 = item.ratings.user_1?.score || 0;
      const s2 = item.ratings.user_2?.score || 0;
      return { item, difference: Math.abs(s1 - s2) };
    })
    .sort((a, b) => b.difference - a.difference)
    .slice(0, 5);

  // ── Evolution by month ──
  const averageEvolution = calcEvolution(items);

  return {
    totalItems: items.length,
    averageScore: Number(averageScore.toFixed(2)),
    user_1: u1,
    user_2: u2,
    agreementStats,
    topRated,
    mostControversial,
    averageEvolution,
  };
}

// ─── Hook: filtered computed stats ─────────────────────────────────────────
/**
 * Main hook for the stats page.
 * Pass the active ContentFilter to get stats scoped to that type (or 'all').
 */
export function useComputedStats(filter: ContentFilter = 'all') {
  const allItems = useNormalizedItems();

  return useMemo(() => {
    const filtered = filterByContentType(allItems, filter);
    return computeStats(filtered);
  }, [allItems, filter]);
}

// ─── Combined hook (mirrors old useAllStats signature) ────────────────────
export function useAllStats(filter: ContentFilter = 'all') {
  const { data: globalStats, isLoading: globalLoading } = useGlobalStats();
  const computed = useComputedStats(filter);

  return {
    global: globalStats,
    computed,
    isLoading: globalLoading,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Private helpers
// ═══════════════════════════════════════════════════════════════════════════

function emptyDist() {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
}

function userStats(items: NormalizedStatsItem[], role: 'user_1' | 'user_2') {
  const mine = items.filter((i) => i.ratings[role] !== undefined);
  if (mine.length === 0) {
    return { totalRatings: 0, averageScore: 0, distribution: emptyDist() };
  }

  const total = mine.reduce((s, i) => s + (i.ratings[role]?.score || 0), 0);
  const dist = emptyDist();
  mine.forEach((i) => {
    const score = i.ratings[role]?.score;
    if (score) dist[score as keyof typeof dist]++;
  });

  return {
    totalRatings: mine.length,
    averageScore: Number((total / mine.length).toFixed(2)),
    distribution: dist,
  };
}

function calcAgreement(bothRated: NormalizedStatsItem[]) {
  let perfect = 0, close = 0, moderate = 0, disagree = 0, totalDiff = 0;

  bothRated.forEach((i) => {
    const diff = Math.abs((i.ratings.user_1?.score || 0) - (i.ratings.user_2?.score || 0));
    totalDiff += diff;
    if (diff === 0) perfect++;
    else if (diff <= 1) close++;
    else if (diff <= 2) moderate++;
    else disagree++;
  });

  return {
    totalBothRated: bothRated.length,
    perfectAgreement: perfect,
    closeAgreement: close,
    moderateAgreement: moderate,
    disagreement: disagree,
    averageDifference: Number((totalDiff / bothRated.length).toFixed(2)),
  };
}

function calcEvolution(items: NormalizedStatsItem[]) {
  const sorted = [...items]
    .filter((i) => i.averageScore !== undefined)
    .sort((a, b) => a.dateAdded.toMillis() - b.dateAdded.toMillis());

  const byMonth: Record<string, { sum: number; count: number }> = {};

  sorted.forEach((i) => {
    const d = i.dateAdded.toDate();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { sum: 0, count: 0 };
    byMonth[key].sum += i.averageScore || 0;
    byMonth[key].count++;
  });

  return Object.entries(byMonth)
    .map(([month, data]) => ({
      month,
      average: Number((data.sum / data.count).toFixed(2)),
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}