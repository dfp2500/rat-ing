import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user_1' | 'user_2';

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string; // Ahora es editable
  customDisplayName?: string; // Nombre personalizado por el usuario
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

// Helper para obtener el nombre para mostrar
export function getUserDisplayName(user: User): string {
  return user.customDisplayName || user.displayName || 'Usuario';
}

// Helper para obtener las iniciales
export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user);
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}