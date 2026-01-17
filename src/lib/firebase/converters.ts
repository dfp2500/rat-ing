import {
  FirestoreDataConverter,
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from 'firebase/firestore';
import { User } from '@/types/user';
import { Movie } from '@/types/movie';
import { GlobalStats } from '@/types/stats';

// Converter para Users
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || null,
      role: user.role,
      createdAt: user.createdAt,
      preferences: user.preferences || null,
    };
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
      photoURL: data.photoURL || undefined,
      role: data.role,
      createdAt: data.createdAt,
      preferences: data.preferences || undefined,
    };
  },
};

// Converter para Movies
export const movieConverter: FirestoreDataConverter<Movie> = {
  // Cambiamos el tipo del argumento a WithFieldValue<Movie>
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
      // Usamos as any o validamos manualmente porque WithFieldValue 
      // hace que los objetos anidados sean complejos de tipar profundamente
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

// Converter para GlobalStats
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