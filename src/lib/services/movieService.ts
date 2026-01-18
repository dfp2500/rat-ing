import {
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  getMoviesCollection,
  getMovieDoc,
} from '../firebase/firestore';
import {
  Movie,
  CreateMovieInput,
  UpdateRatingInput,
  calculateAverageScore,
  checkBothRated,
} from '@/types/movie';
import { UserRole } from '@/types/user';

export class MovieService {
  /**
   * Crear una nueva película
   */
  async createMovie(data: CreateMovieInput): Promise<Movie> {
    const moviesCollection = getMoviesCollection();

    const ratings: Movie['ratings'] = {};
    
    if (data.initialRating) {
      // Creamos el objeto de rating base
      const ratingObj: any = {
        score: data.initialRating.score,
        ratedAt: Timestamp.now(),
      };

      // Solo añadimos el comentario si realmente tiene contenido
      if (data.initialRating.comment && data.initialRating.comment.trim() !== "") {
        ratingObj.comment = data.initialRating.comment.trim();
      } else {
        ratingObj.comment = ""; // O simplemente no lo asignes si prefieres que no exista el campo
      }

      ratings[data.initialRating.userRole] = ratingObj;
    }

    const watchedDateValue = data.watchedDate instanceof Timestamp 
    ? data.watchedDate.toDate() 
    : data.watchedDate;

    const newMovie: Omit<Movie, 'id'> = {
      tmdbId: data.tmdbId,
      title: data.title,
      posterPath: data.posterPath,
      backdropPath: data.backdropPath,
      releaseDate: data.releaseDate,
      genres: data.genres,
      overview: data.overview,
      addedBy: data.addedBy,
      watchedDate: Timestamp.fromDate(watchedDateValue),
      createdAt: Timestamp.now(),
      ratings,
      averageScore: calculateAverageScore(ratings),
      bothRated: checkBothRated(ratings),
    };

    const docRef = await addDoc(moviesCollection, newMovie as Movie);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        throw new Error("Error al crear la película");
    }

    return snapshot.data() as Movie;
  }

  /**
   * Obtener película por ID
   */
  async getMovieById(movieId: string): Promise<Movie | null> {
    const movieDoc = getMovieDoc(movieId);
    const snapshot = await getDoc(movieDoc);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data();
  }

  /**
   * Obtener todas las películas (ordenadas por fecha vista)
   */
  async getAllMovies(): Promise<Movie[]> {
    const moviesCollection = getMoviesCollection();
    const q = query(
      moviesCollection,
      orderBy('watchedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Obtener películas con límite
   */
  async getMovies(limitCount: number = 20): Promise<Movie[]> {
    const moviesCollection = getMoviesCollection();
    const q = query(
      moviesCollection,
      orderBy('watchedDate', 'desc'),
      firestoreLimit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Obtener películas pendientes de rating por un usuario
   */
  async getPendingMovies(userRole: UserRole): Promise<Movie[]> {
    const moviesCollection = getMoviesCollection();
    const q = query(
      moviesCollection,
      where(`ratings.${userRole}`, '==', null),
      orderBy('watchedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Actualizar o añadir rating de un usuario
   */
  async updateRating(data: UpdateRatingInput): Promise<Movie> {
    const movieDoc = getMovieDoc(data.movieId);
    const snapshot = await getDoc(movieDoc);

    if (!snapshot.exists()) {
      throw new Error('Película no encontrada');
    }

    const movie = snapshot.data();

    // Crear el nuevo rating (sin undefined)
    const newRating: {
      score: number;
      comment?: string;
      ratedAt: Timestamp;
    } = {
      score: data.score,
      ratedAt: Timestamp.now(),
    };

    // Solo añadir comment si existe y no está vacío
    if (data.comment && data.comment.trim().length > 0) {
      newRating.comment = data.comment.trim();
    }

    const updatedRatings = {
      ...movie.ratings,
      [data.userRole]: newRating,
    };

    // Recalcular campos
    const averageScore = calculateAverageScore(updatedRatings);
    const bothRated = checkBothRated(updatedRatings);

    // Actualizar documento usando dot notation para evitar sobrescribir
    await updateDoc(movieDoc, {
      [`ratings.${data.userRole}`]: newRating,
      averageScore: averageScore ?? null,
      bothRated,
    });

    // Obtener documento actualizado
    const updatedSnapshot = await getDoc(movieDoc);
    return updatedSnapshot.data()!;
  }

  /**
   * Actualizar fecha vista
   */
  async updateWatchedDate(movieId: string, watchedDate: Date): Promise<void> {
    const movieDoc = getMovieDoc(movieId);
    await updateDoc(movieDoc, {
      watchedDate: Timestamp.fromDate(watchedDate),
    });
  }

  /**
   * Verificar si una película ya existe por TMDB ID
   */
  async movieExistsByTMDBId(tmdbId: number): Promise<boolean> {
    const moviesCollection = getMoviesCollection();
    const q = query(
      moviesCollection,
      where('tmdbId', '==', tmdbId),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
}

export const movieService = new MovieService();