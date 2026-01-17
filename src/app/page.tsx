'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user, loading, isAllowed } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && isAllowed) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, isAllowed, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}