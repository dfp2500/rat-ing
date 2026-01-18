import { getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getMoviesCollection, getStatsDoc } from '../firebase/firestore';
import { GlobalStats, UserStats, ScoreDistribution, createEmptyDistribution } from '@/types/stats';
import { Movie } from '@/types/movie';
import { UserRole } from '@/types/user';

export class StatsService {
  /**
   * Calcular todas las estadísticas desde cero
   */
  async calculateGlobalStats(): Promise<GlobalStats> {
    const moviesCollection = getMoviesCollection();
    const snapshot = await getDocs(moviesCollection);
    const movies = snapshot.docs.map((doc) => doc.data());

    // Stats de user_1
    const user1Stats = this.calculateUserStats(movies, 'user_1');
    
    // Stats de user_2
    const user2Stats = this.calculateUserStats(movies, 'user_2');

    // Total de películas y promedio general
    const moviesWithAverage = movies.filter((m) => m.averageScore !== undefined);
    const totalMovies = movies.length;
    const averageScore = moviesWithAverage.length > 0
      ? moviesWithAverage.reduce((sum, m) => sum + (m.averageScore || 0), 0) / moviesWithAverage.length
      : 0;

    return {
      totalMovies,
      averageScore: Number(averageScore.toFixed(2)),
      user_1: user1Stats,
      user_2: user2Stats,
      lastUpdated: Timestamp.now(),
    };
  }

  /**
   * Calcular estadísticas de un usuario específico
   */
  private calculateUserStats(movies: Movie[], userRole: UserRole): UserStats {
    const userMovies = movies.filter((m) => m.ratings[userRole] !== undefined);
    
    if (userMovies.length === 0) {
      return {
        totalRatings: 0,
        averageScore: 0,
        distribution: createEmptyDistribution(),
      };
    }

    // Calcular promedio
    const totalScore = userMovies.reduce(
      (sum, m) => sum + (m.ratings[userRole]?.score || 0),
      0
    );
    const averageScore = totalScore / userMovies.length;

    // Calcular distribución
    const distribution = createEmptyDistribution();
    userMovies.forEach((movie) => {
      const score = movie.ratings[userRole]?.score;
      if (score) {
        distribution[score as keyof ScoreDistribution]++;
      }
    });

    return {
      totalRatings: userMovies.length,
      averageScore: Number(averageScore.toFixed(2)),
      distribution,
    };
  }

  /**
   * Guardar estadísticas en Firestore
   */
  async saveGlobalStats(stats: GlobalStats): Promise<void> {
    const statsDoc = getStatsDoc('global');
    await setDoc(statsDoc, stats);
  }

  /**
   * Recalcular y guardar estadísticas
   */
  async updateGlobalStats(): Promise<GlobalStats> {
    const stats = await this.calculateGlobalStats();
    await this.saveGlobalStats(stats);
    return stats;
  }

  /**
   * Calcular estadísticas de acuerdo/desacuerdo
   */
  async calculateAgreementStats(movies: Movie[]): Promise<{
    totalBothRated: number;
    perfectAgreement: number;
    closeAgreement: number; // diff <= 1
    moderateAgreement: number; // diff <= 2
    disagreement: number; // diff > 2
    averageDifference: number;
  }> {
    const bothRated = movies.filter((m) => m.bothRated);
    
    if (bothRated.length === 0) {
      return {
        totalBothRated: 0,
        perfectAgreement: 0,
        closeAgreement: 0,
        moderateAgreement: 0,
        disagreement: 0,
        averageDifference: 0,
      };
    }

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

    return {
      totalBothRated: bothRated.length,
      perfectAgreement,
      closeAgreement,
      moderateAgreement,
      disagreement,
      averageDifference: Number((totalDifference / bothRated.length).toFixed(2)),
    };
  }

  /**
   * Obtener películas mejor valoradas
   */
  getTopRatedMovies(movies: Movie[], limit: number = 10): Movie[] {
    return movies
      .filter((m) => m.averageScore !== undefined)
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
      .slice(0, limit);
  }

  /**
   * Obtener películas más controversiales
   */
  getMostControversialMovies(movies: Movie[], limit: number = 10): Array<{
    movie: Movie;
    difference: number;
  }> {
    return movies
      .filter((m) => m.bothRated)
      .map((movie) => {
        const score1 = movie.ratings.user_1?.score || 0;
        const score2 = movie.ratings.user_2?.score || 0;
        const difference = Math.abs(score1 - score2);
        return { movie, difference };
      })
      .sort((a, b) => b.difference - a.difference)
      .slice(0, limit);
  }

  /**
   * Calcular tendencias por mes
   */
  getMoviesByMonth(movies: Movie[]): Record<string, number> {
    const byMonth: Record<string, number> = {};

    movies.forEach((movie) => {
      const date = movie.watchedDate.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    });

    return byMonth;
  }

  /**
   * Calcular evolución de promedios
   */
  getAverageEvolution(movies: Movie[], userRole?: UserRole): Array<{
    month: string;
    average: number;
    count: number;
  }> {
    const sortedMovies = [...movies]
      .filter((m) => {
        if (userRole) {
          return m.ratings[userRole] !== undefined;
        }
        return m.averageScore !== undefined;
      })
      .sort((a, b) => a.watchedDate.toMillis() - b.watchedDate.toMillis());

    const byMonth: Record<string, { sum: number; count: number }> = {};

    sortedMovies.forEach((movie) => {
      const date = movie.watchedDate.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const score = userRole
        ? (movie.ratings[userRole]?.score || 0)
        : (movie.averageScore || 0);

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { sum: 0, count: 0 };
      }

      byMonth[monthKey].sum += score;
      byMonth[monthKey].count++;
    });

    return Object.entries(byMonth)
      .map(([month, data]) => ({
        month,
        average: Number((data.sum / data.count).toFixed(2)),
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}

export const statsService = new StatsService();