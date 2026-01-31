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
  getGamesCollection,
  getGameDoc,
} from '../firebase/firestore';
import {
  Game,
  CreateGameInput,
  UpdateGameRatingInput,
  calculateAverageScore,
  checkBothRated,
} from '@/types/game';
import { UserRole } from '@/types/user';
import { statsService } from './statsService';

export class GameService {
  /**
   * Crear un nuevo juego
   */
  async createGame(data: CreateGameInput): Promise<Game> {
    const gamesCollection = getGamesCollection();

    const ratings: Game['ratings'] = {};
    
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

    const playedDateValue = data.playedDate instanceof Timestamp 
      ? data.playedDate.toDate() 
      : data.playedDate;

    const newGame: Omit<Game, 'id'> = {
      rawgId: data.rawgId,
      name: data.name,
      slug: data.slug,
      backgroundImage: data.backgroundImage,
      released: data.released,
      platforms: data.platforms,
      genres: data.genres,
      description: data.description,
      metacritic: data.metacritic,
      addedBy: data.addedBy,
      playedDate: Timestamp.fromDate(playedDateValue),
      createdAt: Timestamp.now(),
      ratings,
      averageScore: calculateAverageScore(ratings),
      bothRated: checkBothRated(ratings),
    };

    const docRef = await addDoc(gamesCollection, newGame as Game);

    try {
      await statsService.updateGlobalStats();
    } catch (e) {
      console.error("Error actualizando estadísticas globales:", e);
    }

    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error("Error al crear el juego");
    }

    return snapshot.data() as Game;
  }

  /**
   * Obtener juego por ID
   */
  async getGameById(gameId: string): Promise<Game | null> {
    const gameDoc = getGameDoc(gameId);
    const snapshot = await getDoc(gameDoc);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data();
  }

  /**
   * Obtener todos los juegos (ordenados por fecha jugada)
   */
  async getAllGames(): Promise<Game[]> {
    const gamesCollection = getGamesCollection();
    const q = query(
      gamesCollection,
      orderBy('playedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Obtener juegos con límite
   */
  async getGames(limitCount: number = 20): Promise<Game[]> {
    const gamesCollection = getGamesCollection();
    const q = query(
      gamesCollection,
      orderBy('playedDate', 'desc'),
      firestoreLimit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Obtener juegos pendientes de rating por un usuario
   */
  async getPendingGames(userRole: UserRole): Promise<Game[]> {
    const gamesCollection = getGamesCollection();
    const q = query(
      gamesCollection,
      where(`ratings.${userRole}`, '==', null),
      orderBy('playedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  /**
   * Actualizar o añadir rating de un usuario
   */
  async updateRating(data: UpdateGameRatingInput): Promise<Game> {
    const gameDoc = getGameDoc(data.gameId);
    const snapshot = await getDoc(gameDoc);

    if (!snapshot.exists()) {
      throw new Error('Juego no encontrado');
    }

    const game = snapshot.data();

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
      ...game.ratings,
      [data.userRole]: newRating,
    };

    const averageScore = calculateAverageScore(updatedRatings);
    const bothRated = checkBothRated(updatedRatings);

    await updateDoc(gameDoc, {
      [`ratings.${data.userRole}`]: newRating,
      averageScore: averageScore ?? null,
      bothRated,
    });

    try {
      await statsService.updateGlobalStats();
    } catch (e) {
      console.error("Error actualizando estadísticas globales:", e);
    }

    const updatedSnapshot = await getDoc(gameDoc);
    return updatedSnapshot.data()!;
  }

  /**
   * Actualizar fecha jugada
   */
  async updatePlayedDate(gameId: string, playedDate: Date): Promise<void> {
    const gameDoc = getGameDoc(gameId);
    await updateDoc(gameDoc, {
      playedDate: Timestamp.fromDate(playedDate),
    });
  }

  /**
   * Verificar si un juego ya existe por RAWG ID
   */
  async gameExistsByRAWGId(rawgId: number): Promise<boolean> {
    const gamesCollection = getGamesCollection();
    const q = query(
      gamesCollection,
      where('rawgId', '==', rawgId),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /**
   * Eliminar un juego
   */
  async deleteGame(gameId: string): Promise<void> {
    const gameDoc = getGameDoc(gameId);
    
    const snapshot = await getDoc(gameDoc);
    if (!snapshot.exists()) {
      throw new Error('Juego no encontrado');
    }

    await deleteDoc(gameDoc);

    try {
      await statsService.updateGlobalStats();
    } catch (e) {
      console.error("Error actualizando estadísticas globales:", e);
    }
  }
}

export const gameService = new GameService();