// src/lib/services/statsService.ts - VERSIÓN ACTUALIZADA

import { getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { 
  getMoviesCollection, 
  getSeriesCollection, 
  getGamesCollection,
  getStatsDoc 
} from '../firebase/firestore';
import { 
  GlobalStats, 
  ContentTypeStats, 
  UserStats, 
  AgreementStats,
  TopItem,
  ControversialItem,
  EvolutionPoint,
  createEmptyDistribution,
  createEmptyUserStats,
  createEmptyContentTypeStats,
  createEmptyAgreementStats,
  createEmptyGlobalStats,
} from '@/types/stats';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';
import { Game } from '@/types/game';
import { UserRole } from '@/types/user';

// ─── Tipo unificado para procesamiento interno ────────────────────────────
interface NormalizedItem {
  id: string;
  type: 'movie' | 'series' | 'game';
  title: string;
  posterPath: string | null;
  dateAdded: Timestamp;
  ratings: {
    user_1?: { score: number; comment?: string };
    user_2?: { score: number; comment?: string };
  };
  averageScore: number | undefined;
  bothRated: boolean;
}

export class StatsService {
  /**
   * 🔥 FUNCIÓN PRINCIPAL: Recalcular TODAS las estadísticas desde cero
   */
  async calculateAndSaveGlobalStats(): Promise<GlobalStats> {
    // 1. Obtener todos los datos
    const [movies, series, games] = await Promise.all([
      this.fetchMovies(),
      this.fetchSeries(),
      this.fetchGames(),
    ]);

    // 2. Normalizar para procesamiento uniforme
    const allItems = this.normalizeItems(movies, series, games);

    // 3. Calcular estadísticas
    const stats: GlobalStats = {
      totalItems: allItems.length,
      averageScore: this.calcGlobalAverage(allItems),
      
      movies: this.calcContentTypeStats(movies, 'movie'),
      series: this.calcContentTypeStats(series, 'series'),
      games: this.calcContentTypeStats(games, 'game'),
      
      agreement: this.calcAgreementStats(allItems),
      topRated: this.calcTopRated(allItems),
      mostControversial: this.calcMostControversial(allItems),
      averageEvolution: this.calcEvolution(allItems),
      
      lastUpdated: Timestamp.now(),
    };

    // 4. Guardar en Firestore
    await this.saveGlobalStats(stats);

    return stats;
  }

  /**
   * Alias para compatibilidad con código existente
   */
  async updateGlobalStats(): Promise<GlobalStats> {
    return this.calculateAndSaveGlobalStats();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════════════

  private async fetchMovies(): Promise<Movie[]> {
    const snapshot = await getDocs(getMoviesCollection());
    return snapshot.docs.map((d) => d.data());
  }

  private async fetchSeries(): Promise<Series[]> {
    const snapshot = await getDocs(getSeriesCollection());
    return snapshot.docs.map((d) => d.data());
  }

  private async fetchGames(): Promise<Game[]> {
    const snapshot = await getDocs(getGamesCollection());
    return snapshot.docs.map((d) => d.data());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NORMALIZACIÓN
  // ═══════════════════════════════════════════════════════════════════════

  private normalizeItems(
    movies: Movie[], 
    series: Series[], 
    games: Game[]
  ): NormalizedItem[] {
    const items: NormalizedItem[] = [];

    movies.forEach((m) => {
      items.push({
        id: m.id,
        type: 'movie',
        title: m.title,
        posterPath: m.posterPath ?? null,
        dateAdded: m.watchedDate,
        ratings: m.ratings,
        averageScore: m.averageScore,
        bothRated: m.bothRated,
      });
    });

    series.forEach((s) => {
      items.push({
        id: s.id,
        type: 'series',
        title: s.title,
        posterPath: s.posterPath ?? null,
        dateAdded: s.startedWatchingDate,
        ratings: s.ratings,
        averageScore: s.averageScore,
        bothRated: s.bothRated,
      });
    });

    games.forEach((g) => {
      items.push({
        id: g.id,
        type: 'game',
        title: g.name,
        posterPath: g.backgroundImage ?? null,
        dateAdded: g.startedPlayingDate || g.playedDate,
        ratings: g.ratings,
        averageScore: g.averageScore,
        bothRated: g.bothRated,
      });
    });

    return items;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CÁLCULOS PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Promedio global (de todos los items que tienen averageScore)
   */
  private calcGlobalAverage(items: NormalizedItem[]): number {
    const withAvg = items.filter((i) => i.averageScore !== undefined);
    if (withAvg.length === 0) return 0;
    const sum = withAvg.reduce((s, i) => s + (i.averageScore || 0), 0);
    return Number((sum / withAvg.length).toFixed(2));
  }

  /**
   * Stats por tipo de contenido
   */
  private calcContentTypeStats(
    items: (Movie | Series | Game)[],
    type: 'movie' | 'series' | 'game'
  ): ContentTypeStats {
    if (items.length === 0) {
      return createEmptyContentTypeStats();
    }

    const withAvg = items.filter((i) => i.averageScore !== undefined);
    const averageScore = withAvg.length > 0
      ? withAvg.reduce((s, i) => s + (i.averageScore || 0), 0) / withAvg.length
      : 0;

    // Normalizar items para calcular agreement
    const normalizedItems: NormalizedItem[] = items.map((item) => {
      if (type === 'movie') {
        const m = item as Movie;
        return {
          id: m.id,
          type: 'movie',
          title: m.title,
          posterPath: m.posterPath ?? null,
          dateAdded: m.watchedDate,
          ratings: m.ratings,
          averageScore: m.averageScore,
          bothRated: m.bothRated,
        };
      } else if (type === 'series') {
        const s = item as Series;
        return {
          id: s.id,
          type: 'series',
          title: s.title,
          posterPath: s.posterPath ?? null,
          dateAdded: s.startedWatchingDate,
          ratings: s.ratings,
          averageScore: s.averageScore,
          bothRated: s.bothRated,
        };
      } else {
        const g = item as Game;
        return {
          id: g.id,
          type: 'game',
          title: g.name,
          posterPath: g.backgroundImage ?? null,
          dateAdded: g.startedPlayingDate || g.playedDate,
          ratings: g.ratings,
          averageScore: g.averageScore,
          bothRated: g.bothRated,
        };
      }
    });

    return {
      total: items.length,
      averageScore: Number(averageScore.toFixed(2)),
      user_1: this.calcUserStatsForType(items, 'user_1'),
      user_2: this.calcUserStatsForType(items, 'user_2'),
      agreement: this.calcAgreementStats(normalizedItems),
    };
  }

  /**
   * Stats de un usuario para un tipo específico
   */
  private calcUserStatsForType(
    items: (Movie | Series | Game)[],
    role: UserRole
  ): UserStats {
    const rated = items.filter((i) => i.ratings[role] !== undefined);
    
    if (rated.length === 0) {
      return createEmptyUserStats();
    }

    const totalScore = rated.reduce((s, i) => s + (i.ratings[role]?.score || 0), 0);
    const averageScore = totalScore / rated.length;

    const distribution = createEmptyDistribution();
    rated.forEach((i) => {
      const score = i.ratings[role]?.score;
      if (score) {
        distribution[score as keyof typeof distribution]++;
      }
    });

    return {
      totalRatings: rated.length,
      averageScore: Number(averageScore.toFixed(2)),
      distribution,
    };
  }

  /**
   * Estadísticas de acuerdo/desacuerdo
   */
  private calcAgreementStats(items: NormalizedItem[]): AgreementStats {
    const bothRated = items.filter((i) => i.bothRated);
    
    if (bothRated.length === 0) {
      return createEmptyAgreementStats();
    }

    let perfect = 0, close = 0, moderate = 0, disagree = 0, totalDiff = 0;

    bothRated.forEach((i) => {
      const s1 = i.ratings.user_1?.score || 0;
      const s2 = i.ratings.user_2?.score || 0;
      const diff = Math.abs(s1 - s2);

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

  /**
   * Top 10 mejor valorados
   */
  private calcTopRated(items: NormalizedItem[]): TopItem[] {
    return items
      .filter((i) => i.averageScore !== undefined)
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
      .slice(0, 10)
      .map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        posterPath: i.posterPath,
        averageScore: i.averageScore!,
        user1Score: i.ratings.user_1?.score,
        user2Score: i.ratings.user_2?.score,
      }));
  }

  /**
   * Top 5 más controversiales
   */
  private calcMostControversial(items: NormalizedItem[]): ControversialItem[] {
    const bothRated = items.filter((i) => i.bothRated);

    return bothRated
      .map((i) => {
        const s1 = i.ratings.user_1?.score || 0;
        const s2 = i.ratings.user_2?.score || 0;
        return {
          id: i.id,
          type: i.type,
          title: i.title,
          posterPath: i.posterPath,
          difference: Math.abs(s1 - s2),
          user1Score: s1,
          user2Score: s2,
        };
      })
      .sort((a, b) => b.difference - a.difference)
      .slice(0, 5);
  }

  /**
   * Evolución temporal del promedio
   */
  private calcEvolution(items: NormalizedItem[]): EvolutionPoint[] {
    const sorted = [...items]
      .filter((i) => i.averageScore !== undefined)
      .sort((a, b) => a.dateAdded.toMillis() - b.dateAdded.toMillis());

    const byMonth: Record<string, { sum: number; count: number }> = {};

    sorted.forEach((i) => {
      const d = i.dateAdded.toDate();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      if (!byMonth[key]) {
        byMonth[key] = { sum: 0, count: 0 };
      }

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

  // ═══════════════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Guardar estadísticas en Firestore
   */
  private async saveGlobalStats(stats: GlobalStats): Promise<void> {
    const statsDoc = getStatsDoc('global');
    await setDoc(statsDoc, stats);
  }
}

export const statsService = new StatsService();