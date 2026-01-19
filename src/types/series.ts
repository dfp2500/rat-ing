// src/types/series.ts
import { Timestamp } from 'firebase/firestore';
import { UserRole } from './user';

export interface Rating {
  score: number; // 1-10
  comment?: string;
  ratedAt: Timestamp;
}

export interface Series {
  id: string; // Firestore document ID
  tmdbId: number;
  title: string;
  originalTitle: string;
  posterPath?: string;
  backdropPath?: string;
  firstAirDate: string; // Fecha de estreno
  lastAirDate?: string; // Fecha del último episodio
  genres: string[];
  overview?: string;
  
  // Estado de la serie
  status: 'returning' | 'ended' | 'canceled' | 'in_production'; // Estado en TMDB
  watchStatus: 'watching' | 'completed' | 'dropped' | 'plan_to_watch'; // Estado del usuario
  
  // Información de temporadas
  numberOfSeasons: number;
  numberOfEpisodes: number;
  currentSeason?: number; // Temporada actual que están viendo
  currentEpisode?: number; // Episodio actual
  
  // Metadata
  addedBy: string; // userId
  startedWatchingDate: Timestamp; // Cuando empezaron a verla
  finishedWatchingDate?: Timestamp; // Cuando la terminaron (si aplica)
  createdAt: Timestamp;
  lastUpdated: Timestamp;

  // Ratings - igual que películas
  ratings: {
    user_1?: Rating;
    user_2?: Rating;
  };

  // Campos calculados
  averageScore?: number;
  bothRated: boolean;
}

export interface CreateSeriesInput {
  tmdbId: number;
  title: string;
  originalTitle: string;
  posterPath?: string;
  backdropPath?: string;
  firstAirDate: string;
  lastAirDate?: string;
  genres: string[];
  overview?: string;
  status: Series['status'];
  numberOfSeasons: number;
  numberOfEpisodes: number;
  addedBy: string;
  startedWatchingDate: Date | Timestamp;
  watchStatus: Series['watchStatus'];
  currentSeason?: number;
  currentEpisode?: number;
  initialRating?: {
    userRole: UserRole;
    score: number;
    comment?: string;
  };
}

export interface UpdateSeriesRatingInput {
  seriesId: string;
  userRole: UserRole;
  score: number;
  comment?: string;
}

export interface UpdateSeriesProgressInput {
  seriesId: string;
  currentSeason?: number;
  currentEpisode?: number;
  watchStatus?: Series['watchStatus'];
  finishedWatchingDate?: Date;
}

// Helper para calcular promedio
export function calculateAverageScore(ratings: Series['ratings']): number | undefined {
  const scores: number[] = [];
  
  if (ratings.user_1?.score !== undefined) scores.push(ratings.user_1.score);
  if (ratings.user_2?.score !== undefined) scores.push(ratings.user_2.score);
  
  if (scores.length === 0) return undefined;
  
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Number((sum / scores.length).toFixed(2));
}

export function checkBothRated(ratings: Series['ratings']): boolean {
  const hasUser1 = !!ratings.user_1 && typeof ratings.user_1.score === 'number';
  const hasUser2 = !!ratings.user_2 && typeof ratings.user_2.score === 'number';

  return hasUser1 && hasUser2;
}

// Helper para obtener el label del estado
export function getWatchStatusLabel(status: Series['watchStatus']): string {
  const labels: Record<Series['watchStatus'], string> = {
    watching: 'Viendo',
    completed: 'Completada',
    dropped: 'Abandonada',
    plan_to_watch: 'Pendiente',
  };
  return labels[status];
}

// Helper para obtener el progreso en porcentaje
export function getProgressPercentage(series: Series): number {
  if (!series.currentSeason || !series.currentEpisode || series.numberOfEpisodes === 0) {
    return 0;
  }
  
  // Esto es una aproximación simple
  // Para ser exacto necesitarías saber cuántos episodios tiene cada temporada
  const estimatedCurrentEpisode = ((series.currentSeason - 1) * (series.numberOfEpisodes / series.numberOfSeasons)) + series.currentEpisode;
  return Math.min(100, Math.round((estimatedCurrentEpisode / series.numberOfEpisodes) * 100));
}