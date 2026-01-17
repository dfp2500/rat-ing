import { Timestamp } from 'firebase/firestore';
import { UserRole } from './user';

export interface Rating {
  score: number; // 1-10
  comment?: string;
  ratedAt: Timestamp;
}

export interface Movie {
  id: string; // Firestore document ID
  tmdbId: number;
  title: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate: string;
  genres: string[];
  overview?: string;

  // Metadata
  addedBy: string; // userId
  watchedDate: Timestamp; // Fecha en que vieron la película
  createdAt: Timestamp;

  // Ratings - estructura plana para queries eficientes
  ratings: {
    user_1?: Rating;
    user_2?: Rating;
  };

  // Campos calculados (para queries)
  averageScore?: number;
  bothRated: boolean; // true si ambos usuarios han puntuado
}

export interface CreateMovieInput {
  tmdbId: number;
  title: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate: string;
  genres: string[];
  overview?: string;
  addedBy: string;
  watchedDate: Date | Timestamp;
  initialRating?: {
    userRole: UserRole;
    score: number;
    comment?: string;
  };
}

export interface UpdateRatingInput {
  movieId: string;
  userRole: UserRole;
  score: number;
  comment?: string;
}

// Helper para calcular promedio
export function calculateAverageScore(ratings: Movie['ratings']): number | undefined {
  const scores: number[] = [];
  
  // Comprobación explícita contra undefined/null
  if (ratings.user_1?.score !== undefined) scores.push(ratings.user_1.score);
  if (ratings.user_2?.score !== undefined) scores.push(ratings.user_2.score);
  
  if (scores.length === 0) return undefined;
  
  const sum = scores.reduce((acc, score) => acc + score, 0);
  // Redondear a 1 o 2 decimales suele ser buena idea para promedios
  return Number((sum / scores.length).toFixed(2));
}

/**
 * Verifica si ambos usuarios han puntuado la película.
 * En Firestore, una propiedad ausente o null se considera "no puntuada".
 */
export function checkBothRated(ratings: Movie['ratings']): boolean {
  // Comprobamos la existencia de ambos objetos y que tengan un score definido
  const hasUser1 = !!ratings.user_1 && typeof ratings.user_1.score === 'number';
  const hasUser2 = !!ratings.user_2 && typeof ratings.user_2.score === 'number';

  return hasUser1 && hasUser2;
}