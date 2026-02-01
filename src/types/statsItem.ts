import { Timestamp } from 'firebase/firestore';
import { Movie } from './movie';
import { Series } from './series';
import { Game } from './game';
import { UserRole } from './user';

// ─── Content type identifiers ──────────────────────────────────────────────
export type ContentType = 'movie' | 'series' | 'game';

// ─── Labels & icons config ─────────────────────────────────────────────────
export const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; emoji: string; plural: string }> = {
  movie:  { label: 'Película',  emoji: '🎬', plural: 'Películas' },
  series: { label: 'Serie',     emoji: '📺', plural: 'Series' },
  game:   { label: 'Juego',     emoji: '🎮', plural: 'Juegos' },
};

// ─── Normalized item ───────────────────────────────────────────────────────
export interface NormalizedStatsItem {
  id: string;
  type: ContentType;
  title: string;
  posterPath: string | null;
  /** Unified date: movies → watchedDate, series → startedWatchingDate, games → startedPlayingDate */
  dateAdded: Timestamp;
  /** Year string for display: movies → releaseDate, series → firstAirDate, games → released */
  releaseYear: string;
  ratings: {
    user_1?: { score: number; comment?: string };
    user_2?: { score: number; comment?: string };
  };
  averageScore: number | undefined;
  bothRated: boolean;
}

// ─── Converters ────────────────────────────────────────────────────────────
export function movieToStatsItem(movie: Movie): NormalizedStatsItem {
  return {
    id: movie.id,
    type: 'movie',
    title: movie.title,
    posterPath: movie.posterPath ?? null,
    dateAdded: movie.watchedDate,
    releaseYear: movie.releaseDate ? String(new Date(movie.releaseDate).getFullYear()) : '',
    ratings: movie.ratings,
    averageScore: movie.averageScore,
    bothRated: movie.bothRated,
  };
}

export function seriesToStatsItem(series: Series): NormalizedStatsItem {
  return {
    id: series.id,
    type: 'series',
    title: series.title,
    posterPath: series.posterPath ?? null,
    dateAdded: series.startedWatchingDate,
    releaseYear: series.firstAirDate ? String(new Date(series.firstAirDate).getFullYear()) : '',
    ratings: series.ratings,
    averageScore: series.averageScore,
    bothRated: series.bothRated,
  };
}

export function gameToStatsItem(game: Game): NormalizedStatsItem {
  return {
    id: game.id,
    type: 'game',
    title: game.name,
    posterPath: game.backgroundImage ?? null,
    dateAdded: game.startedPlayingDate || game.playedDate,
    releaseYear: game.released ? String(new Date(game.released).getFullYear()) : '',
    ratings: game.ratings,
    averageScore: game.averageScore,
    bothRated: game.bothRated,
  };
}

// ─── Filter helper ─────────────────────────────────────────────────────────
/** 'all' returns everything; otherwise filters by ContentType */
export type ContentFilter = 'all' | ContentType;

export function filterByContentType(
  items: NormalizedStatsItem[],
  filter: ContentFilter
): NormalizedStatsItem[] {
  return filter === 'all' ? items : items.filter((i) => i.type === filter);
}