import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user_1' | 'user_2';

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
  };
}

export interface CreateUserInput {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
}

// Helper para determinar el rol basado en email
export function getUserRoleFromEmail(email: string): UserRole {
  const allowedEmails = process.env.NEXT_PUBLIC_ALLOWED_EMAILS?.split(',') || [];
  const index = allowedEmails.findIndex((e) => e.trim() === email);
  
  if (index === 0) return 'user_1';
  if (index === 1) return 'user_2';
  
  // Fallback (no debería pasar si la allowlist funciona)
  return 'user_1';
}