import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth } from './config';

// Allowlist de usuarios
const ALLOWED_EMAILS = process.env.NEXT_PUBLIC_ALLOWED_EMAILS?.split(',') || [];

export function isEmailAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email);
}

export async function signInWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  if (!isEmailAllowed(userCredential.user.email || '')) {
    await firebaseSignOut(auth);
    throw new Error('Usuario no autorizado. Contacta al administrador.');
  }

  return userCredential.user;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isEmailAllowed(email)) {
    throw new Error('Usuario no autorizado. Contacta al administrador.');
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);

  if (!isEmailAllowed(userCredential.user.email || '')) {
    await firebaseSignOut(auth);
    throw new Error('Usuario no autorizado. Contacta al administrador.');
  }

  return userCredential.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}