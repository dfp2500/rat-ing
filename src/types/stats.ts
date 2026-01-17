import { Timestamp } from 'firebase/firestore';

export interface UserStats {
  totalRatings: number;
  averageScore: number;
  distribution: ScoreDistribution; // Distribución de puntuaciones 1-10
}

export interface ScoreDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9: number;
  10: number;
}

export interface GlobalStats {
  totalMovies: number;
  averageScore: number;
  user_1: UserStats;
  user_2: UserStats;
  lastUpdated: Timestamp;
}

// Stats calculadas en el cliente (no guardadas en Firestore)
export interface ComputedStats {
  totalMovies: number;
  averageScore: number;
  moviesPendingRating: number;
  agreementRate: number; // % de películas donde la diferencia es <= 2
  mostControversial?: {
    movieId: string;
    title: string;
    difference: number;
  };
  topRated: Array<{
    movieId: string;
    title: string;
    averageScore: number;
  }>;
}

// Helper para crear distribución vacía
export function createEmptyDistribution(): ScoreDistribution {
  return {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
  };
}