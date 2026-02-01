// src/lib/firebase/converters.ts

import {
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from 'firebase/firestore';
import { User } from '@/types/user';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';
import { Game } from '@/types/game';
import { GlobalStats } from '@/types/stats';

// Converter para Users - CORREGIDO
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: WithFieldValue<Partial<User>>): DocumentData {
    // Filtrar solo los campos que están definidos
    const data: DocumentData = {};
    
    if (user.email !== undefined) data.email = user.email;
    if (user.displayName !== undefined) data.displayName = user.displayName;
    if (user.customDisplayName !== undefined) data.customDisplayName = user.customDisplayName;
    if (user.photoURL !== undefined) data.photoURL = user.photoURL;
    if (user.role !== undefined) data.role = user.role;
    if (user.createdAt !== undefined) data.createdAt = user.createdAt;
    if (user.preferences !== undefined) data.preferences = user.preferences;

    return data;
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      email: data.email,
      displayName: data.displayName,
      customDisplayName: data.customDisplayName,
      photoURL: data.photoURL || undefined,
      role: data.role,
      createdAt: data.createdAt,
      preferences: data.preferences || undefined,
    };
  },
};

// El resto de converters permanecen igual...
export const movieConverter: FirestoreDataConverter<Movie> = {
  toFirestore(movie: WithFieldValue<Movie>): DocumentData {
    return {
      tmdbId: movie.tmdbId,
      title: movie.title,
      posterPath: movie.posterPath ?? null,
      backdropPath: movie.backdropPath ?? null,
      releaseDate: movie.releaseDate,
      genres: movie.genres,
      overview: movie.overview ?? null,
      addedBy: movie.addedBy,
      watchedDate: movie.watchedDate,
      createdAt: movie.createdAt,
      ratings: movie.ratings || {
        user_1: null,
        user_2: null,
      },
      averageScore: movie.averageScore ?? null,
      bothRated: movie.bothRated,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Movie {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      tmdbId: data.tmdbId,
      title: data.title,
      posterPath: data.posterPath ?? undefined,
      backdropPath: data.backdropPath ?? undefined,
      releaseDate: data.releaseDate,
      genres: data.genres || [],
      overview: data.overview ?? undefined,
      addedBy: data.addedBy,
      watchedDate: data.watchedDate,
      createdAt: data.createdAt,
      ratings: {
        user_1: data.ratings?.user_1 ?? undefined,
        user_2: data.ratings?.user_2 ?? undefined,
      },
      averageScore: data.averageScore ?? undefined,
      bothRated: data.bothRated || false,
    };
  },
};

export const statsConverter: FirestoreDataConverter<GlobalStats> = {
  toFirestore(stats: GlobalStats): DocumentData {
    return {
      totalMovies: stats.totalMovies,
      averageScore: stats.averageScore,
      user_1: stats.user_1,
      user_2: stats.user_2,
      lastUpdated: stats.lastUpdated,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): GlobalStats {
    const data = snapshot.data(options);
    return {
      totalMovies: data.totalMovies || 0,
      averageScore: data.averageScore || 0,
      user_1: data.user_1,
      user_2: data.user_2,
      lastUpdated: data.lastUpdated,
    };
  },
};

export const seriesConverter: FirestoreDataConverter<Series> = {
  toFirestore(series: WithFieldValue<Series>): DocumentData {
    return {
      tmdbId: series.tmdbId,
      title: series.title,
      originalTitle: series.originalTitle,
      posterPath: series.posterPath ?? null,
      backdropPath: series.backdropPath ?? null,
      firstAirDate: series.firstAirDate,
      lastAirDate: series.lastAirDate ?? null,
      genres: series.genres,
      overview: series.overview ?? null,
      status: series.status,
      watchStatus: series.watchStatus,
      numberOfSeasons: series.numberOfSeasons,
      numberOfEpisodes: series.numberOfEpisodes,
      currentSeason: series.currentSeason ?? null,
      currentEpisode: series.currentEpisode ?? null,
      addedBy: series.addedBy,
      startedWatchingDate: series.startedWatchingDate,
      finishedWatchingDate: series.finishedWatchingDate ?? null,
      createdAt: series.createdAt,
      lastUpdated: series.lastUpdated,
      ratings: series.ratings || {
        user_1: null,
        user_2: null,
      },
      averageScore: series.averageScore ?? null,
      bothRated: series.bothRated,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Series {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      tmdbId: data.tmdbId,
      title: data.title,
      originalTitle: data.originalTitle,
      posterPath: data.posterPath ?? undefined,
      backdropPath: data.backdropPath ?? undefined,
      firstAirDate: data.firstAirDate,
      lastAirDate: data.lastAirDate ?? undefined,
      genres: data.genres || [],
      overview: data.overview ?? undefined,
      status: data.status,
      watchStatus: data.watchStatus,
      numberOfSeasons: data.numberOfSeasons,
      numberOfEpisodes: data.numberOfEpisodes,
      currentSeason: data.currentSeason ?? undefined,
      currentEpisode: data.currentEpisode ?? undefined,
      addedBy: data.addedBy,
      startedWatchingDate: data.startedWatchingDate,
      finishedWatchingDate: data.finishedWatchingDate ?? undefined,
      createdAt: data.createdAt,
      lastUpdated: data.lastUpdated,
      ratings: {
        user_1: data.ratings?.user_1 ?? undefined,
        user_2: data.ratings?.user_2 ?? undefined,
      },
      averageScore: data.averageScore ?? undefined,
      bothRated: data.bothRated || false,
    };
  },
};

export const gameConverter: FirestoreDataConverter<Game> = {
  toFirestore(game: WithFieldValue<Game>): DocumentData {
    return {
      rawgId: game.rawgId,
      name: game.name,
      slug: game.slug,
      backgroundImage: game.backgroundImage ?? null,
      released: game.released,
      platforms: game.platforms || [],
      genres: game.genres || [],
      description: game.description ?? null,
      metacritic: game.metacritic ?? null,
      addedBy: game.addedBy,
      playedDate: game.playedDate,
      createdAt: game.createdAt,
      ratings: game.ratings || {
        user_1: null,
        user_2: null,
      },
      averageScore: game.averageScore ?? null,
      bothRated: game.bothRated,
      startedPlayingDate: game.startedPlayingDate ?? null,
      finishedPlayingDate: game.finishedPlayingDate ?? null,
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Game {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      rawgId: data.rawgId,
      name: data.name,
      slug: data.slug,
      backgroundImage: data.backgroundImage ?? undefined,
      released: data.released,
      platforms: data.platforms || [],
      genres: data.genres || [],
      description: data.description ?? undefined,
      metacritic: data.metacritic ?? undefined,
      addedBy: data.addedBy,
      playedDate: data.playedDate,
      createdAt: data.createdAt,
      ratings: {
        user_1: data.ratings?.user_1 ?? undefined,
        user_2: data.ratings?.user_2 ?? undefined,
      },
      averageScore: data.averageScore ?? undefined,
      bothRated: data.bothRated || false,
      startedPlayingDate: data.startedPlayingDate ?? undefined,
      finishedPlayingDate: data.finishedPlayingDate ?? undefined,
    };
  },
};