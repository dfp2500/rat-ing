'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAllowed } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAllowed) {
        // Usuario autenticado pero no autorizado
        router.push('/login');
      }
    }
  }, [user, loading, isAllowed, router]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario o no está permitido, no mostrar nada
  // (el useEffect redirigirá)
  if (!user || !isAllowed) {
    return null;
  }

  // Usuario autenticado y autorizado
  return <>{children}</>;
}