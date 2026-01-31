import { Timestamp } from 'firebase/firestore';
import { UserRole } from './user';

export interface Rating {
  score: number; // 1-10
  comment?: string;
  ratedAt: Timestamp;
}

export interface Game {
  id: string; // Firestore document ID
  rawgId: number;
  name: string;
  slug: string;
  backgroundImage?: string;
  released: string; // Fecha de lanzamiento
  platforms: number[]; // IDs de plataformas
  genres: string[]; // IDs de géneros (guardados como strings)
  description?: string;
  metacritic?: number;
  
  // Metadata
  addedBy: string; // userId
  playedDate: Timestamp; // Fecha en que jugaron
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

export interface CreateGameInput {
  rawgId: number;
  name: string;
  slug: string;
  backgroundImage?: string;
  released: string;
  platforms: number[];
  genres: string[];
  description?: string;
  metacritic?: number;
  addedBy: string;
  playedDate: Date | Timestamp;
  initialRating?: {
    userRole: UserRole;
    score: number;
    comment?: string;
  };
}

export interface UpdateGameRatingInput {
  gameId: string;
  userRole: UserRole;
  score: number;
  comment?: string;
}

// Helper para calcular promedio
export function calculateAverageScore(ratings: Game['ratings']): number | undefined {
  const scores: number[] = [];
  
  if (ratings.user_1?.score !== undefined) scores.push(ratings.user_1.score);
  if (ratings.user_2?.score !== undefined) scores.push(ratings.user_2.score);
  
  if (scores.length === 0) return undefined;
  
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Number((sum / scores.length).toFixed(2));
}

export function checkBothRated(ratings: Game['ratings']): boolean {
  const hasUser1 = !!ratings.user_1 && typeof ratings.user_1.score === 'number';
  const hasUser2 = !!ratings.user_2 && typeof ratings.user_2.score === 'number';

  return hasUser1 && hasUser2;
}