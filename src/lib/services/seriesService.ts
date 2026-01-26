import {
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  getSeriesCollection,
  getSeriesDoc,
} from '../firebase/firestore';
import {
  Series,
  CreateSeriesInput,
  UpdateSeriesRatingInput,
  UpdateSeriesProgressInput,
  calculateAverageScore,
  checkBothRated,
} from '@/types/series';
import { UserRole } from '@/types/user';

export class SeriesService {
  /**
   * Crear una nueva serie
   */
  async createSeries(data: CreateSeriesInput): Promise<Series> {
    const seriesCollection = getSeriesCollection();

    const ratings: Series['ratings'] = {};
    
    if (data.initialRating) {
      const ratingObj: any = {
        score: data.initialRating.score,
        ratedAt: Timestamp.now(),
      };

      if (data.initialRating.comment && data.initialRating.comment.trim() !== "") {
        ratingObj.comment = data.initialRating.comment.trim();
      } else {
        ratingObj.comment = "";
      }

      ratings[data.initialRating.userRole] = ratingObj;
    }

    const startedWatchingDateValue = data.startedWatchingDate instanceof Timestamp 
      ? data.startedWatchingDate.toDate() 
      : data.startedWatchingDate;

    const newSeries: Omit<Series, 'id'> = {
      tmdbId: data.tmdbId,
      title: data.title,
      originalTitle: data.originalTitle,
      posterPath: data.posterPath,
      backdropPath: data.backdropPath,
      firstAirDate: data.firstAirDate,
      lastAirDate: data.lastAirDate,
      genres: data.genres,
      overview: data.overview,
      status: data.status,
      watchStatus: data.watchStatus,
      numberOfSeasons: data.numberOfSeasons,
      numberOfEpisodes: data.numberOfEpisodes,
      currentSeason: data.currentSeason,
      currentEpisode: data.currentEpisode,
      addedBy: data.addedBy,
      startedWatchingDate: Timestamp.fromDate(startedWatchingDateValue),
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      ratings,
      averageScore: calculateAverageScore(ratings),
      bothRated: checkBothRated(ratings),
    };

    const docRef = await addDoc(seriesCollection, newSeries as Series);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error("Error al crear la serie");
    }

    return snapshot.data() as Series;
  }

  /**
   * Obtener serie por ID
   */
  async getSeriesById(seriesId: string): Promise<Series | null> {
    const seriesDoc = getSeriesDoc(seriesId);
    const snapshot = await getDoc(seriesDoc);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data();
  }

  /**
   * Obtener todas las series
   */
  async getAllSeries(): Promise<Series[]> {
    const seriesCollection = getSeriesCollection();
    const q = query(
      seriesCollection,
      orderBy('lastUpdated', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Obtener series por estado
   */
  async getSeriesByWatchStatus(
    watchStatus: Series['watchStatus']
  ): Promise<Series[]> {
    const seriesCollection = getSeriesCollection();
    const q = query(
      seriesCollection,
      where('watchStatus', '==', watchStatus),
      orderBy('lastUpdated', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Obtener series pendientes de rating
   */
  async getPendingSeries(userRole: UserRole): Promise<Series[]> {
    const seriesCollection = getSeriesCollection();
    const q = query(
      seriesCollection,
      where(`ratings.${userRole}`, '==', null),
      orderBy('lastUpdated', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Actualizar rating
   */
  async updateRating(data: UpdateSeriesRatingInput): Promise<Series> {
    const seriesDoc = getSeriesDoc(data.seriesId);
    const snapshot = await getDoc(seriesDoc);

    if (!snapshot.exists()) {
      throw new Error('Serie no encontrada');
    }

    const series = snapshot.data();

    const newRating: {
      score: number;
      comment?: string;
      ratedAt: Timestamp;
    } = {
      score: data.score,
      ratedAt: Timestamp.now(),
    };

    if (data.comment && data.comment.trim().length > 0) {
      newRating.comment = data.comment.trim();
    }

    const updatedRatings = {
      ...series.ratings,
      [data.userRole]: newRating,
    };

    const averageScore = calculateAverageScore(updatedRatings);
    const bothRated = checkBothRated(updatedRatings);

    await updateDoc(seriesDoc, {
      [`ratings.${data.userRole}`]: newRating,
      averageScore: averageScore ?? null,
      bothRated,
      lastUpdated: Timestamp.now(),
    });

    const updatedSnapshot = await getDoc(seriesDoc);
    return updatedSnapshot.data()!;
  }

  /**
   * ✨ ACTUALIZADO: Actualizar progreso de visualización con lógica mejorada
   */
  async updateProgress(data: UpdateSeriesProgressInput): Promise<Series> {
    const seriesDoc = getSeriesDoc(data.seriesId);
    const snapshot = await getDoc(seriesDoc);
    
    if (!snapshot.exists()) {
      throw new Error('Serie no encontrada');
    }

    const series = snapshot.data();
    
    const updateData: any = {
      lastUpdated: Timestamp.now(),
    };

    // Actualizar estado de visualización
    if (data.watchStatus !== undefined) {
      updateData.watchStatus = data.watchStatus;

      // ✨ AUTO-COMPLETADO: Si marca como "completed", establecer progreso al máximo
      if (data.watchStatus === 'completed') {
        updateData.currentSeason = series.numberOfSeasons;
        updateData.currentEpisode = series.numberOfEpisodes;
        updateData.finishedWatchingDate = Timestamp.now();
      }
      // ✨ RESET: Si marca como "plan_to_watch", limpiar progreso
      else if (data.watchStatus === 'plan_to_watch') {
        updateData.currentSeason = null;
        updateData.currentEpisode = null;
        updateData.finishedWatchingDate = null;
      }
      // ✨ RESET: Si marca como "dropped", mantener el progreso actual pero marcar fecha
      else if (data.watchStatus === 'dropped') {
        updateData.finishedWatchingDate = Timestamp.now();
      }
      // Si vuelve a "watching", limpiar fecha de finalización
      else if (data.watchStatus === 'watching') {
        updateData.finishedWatchingDate = null;
        // Solo actualizar si se proporcionan valores específicos
        if (data.currentSeason !== undefined) {
          // ✨ VALIDACIÓN: No permitir más de las temporadas disponibles
          updateData.currentSeason = Math.min(data.currentSeason, series.numberOfSeasons);
        }
        if (data.currentEpisode !== undefined) {
          // ✨ VALIDACIÓN: No permitir más de los episodios disponibles
          updateData.currentEpisode = Math.min(data.currentEpisode, series.numberOfEpisodes);
        }
      }
    } else {
      // Si solo se actualiza progreso sin cambiar estado
      if (data.currentSeason !== undefined) {
        updateData.currentSeason = Math.min(data.currentSeason, series.numberOfSeasons);
      }
      if (data.currentEpisode !== undefined) {
        updateData.currentEpisode = Math.min(data.currentEpisode, series.numberOfEpisodes);
      }
    }

    // Fecha de finalización manual (si se proporciona)
    if (data.finishedWatchingDate) {
      updateData.finishedWatchingDate = Timestamp.fromDate(data.finishedWatchingDate);
    }

    await updateDoc(seriesDoc, updateData);

    const updatedSnapshot = await getDoc(seriesDoc);
    return updatedSnapshot.data()!;
  }

  /**
   * Verificar si una serie ya existe por TMDB ID
   */
  async seriesExistsByTMDBId(tmdbId: number): Promise<boolean> {
    const seriesCollection = getSeriesCollection();
    const q = query(
      seriesCollection,
      where('tmdbId', '==', tmdbId),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /**
   * Eliminar una serie
   */
  async deleteSeries(seriesId: string): Promise<void> {
    const seriesDoc = getSeriesDoc(seriesId);
    
    const snapshot = await getDoc(seriesDoc);
    if (!snapshot.exists()) {
      throw new Error('Serie no encontrada');
    }

    await deleteDoc(seriesDoc);
  }

  /**
   * Actualizar fecha comenzado a ver
   */
  async updateStartedWatchingDate(seriesId: string, watchingDate: Date): Promise<void> {
    const seriesDoc = getSeriesDoc(seriesId);
    await updateDoc(seriesDoc, {
      startedWatchingDate: Timestamp.fromDate(watchingDate),
    });
  }

  /**
   * Actualizar fecha finalizado
   */
  async updateFinishedWatchingDate(seriesId: string, finishedDate: Date): Promise<void> {
    const seriesDoc = getSeriesDoc(seriesId);
    await updateDoc(seriesDoc, {
      finishedWatchingDate: Timestamp.fromDate(finishedDate),
    });
  }
}

export const seriesService = new SeriesService();