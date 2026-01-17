import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { getUserDoc, getUsersCollection } from '../firebase/firestore';
import { User, CreateUserInput, getUserRoleFromEmail } from '@/types/user';

export class UserService {
  /**
   * Obtener o crear usuario en Firestore
   */
  async getOrCreateUser(firebaseUser: FirebaseUser): Promise<User> {
    const userDoc = getUserDoc(firebaseUser.uid);
    const snapshot = await getDoc(userDoc);

    if (snapshot.exists()) {
      return snapshot.data();
    }

    // Crear nuevo usuario
    const role = getUserRoleFromEmail(firebaseUser.email || '');
    
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
      photoURL: firebaseUser.photoURL || undefined,
      role,
      createdAt: Timestamp.now(),
    };

    await setDoc(userDoc, newUser);
    return newUser;
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const userDoc = getUserDoc(userId);
    const snapshot = await getDoc(userDoc);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data();
  }

  /**
   * Actualizar datos del usuario
   */
  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const userDoc = getUserDoc(userId);
    await setDoc(userDoc, data, { merge: true });
  }

  /**
   * Actualizar preferencias del usuario
   */
  async updatePreferences(
    userId: string,
    preferences: User['preferences']
  ): Promise<void> {
    const userDoc = getUserDoc(userId);
    await setDoc(userDoc, { preferences }, { merge: true });
  }
}

export const userService = new UserService();