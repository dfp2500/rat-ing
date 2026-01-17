import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// Collection references
export const collections = {
  users: 'users',
  movies: 'movies',
  stats: 'stats',
} as const;

// Helper functions
export async function getDocument<T extends object>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, documentId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

export async function getDocuments<T extends object>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as T)
  );
}

export async function createDocument<T extends object>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  // Firestore ahora sabe que 'data' es un objeto válido
  await setDoc(docRef, data); 
}

export async function updateDocument<T extends object>(
  collectionName: string,
  documentId: string,
  data: Partial<T> // Partial permite enviar solo algunos campos
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  // Usamos un cast a UpdateData para mayor seguridad
  await updateDoc(docRef, data as import('firebase/firestore').UpdateData<T>);
}

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
}

// Export commonly used Firestore functions
export { collection, doc, query, where, orderBy, limit };