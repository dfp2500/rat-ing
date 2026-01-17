'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { useMovies } from '@/lib/hooks/useMovies';
import { signOut } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user: firebaseUser } = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: movies, isLoading: moviesLoading } = useMovies();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido, {user?.displayName || firebaseUser?.email}
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Cerrar sesión
          </Button>
        </div>

        {/* User Info */}
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">
            👤 Información del Usuario
          </h2>
          <div className="space-y-2 text-sm">
            <p>✓ Email: {user?.email}</p>
            <p>✓ Rol: {user?.role}</p>
            <p>✓ UID: {user?.id}</p>
            <p>✓ Creado: {user?.createdAt.toDate().toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        {/* Movies Stats */}
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">
            🎬 Películas
          </h2>
          {moviesLoading ? (
            <p className="text-sm text-muted-foreground">Cargando películas...</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>✓ Total de películas: {movies?.length || 0}</p>
              {movies && movies.length > 0 ? (
                <>
                  <p>✓ Última película: {movies[0]?.title}</p>
                  <p>
                    ✓ Películas con ambos ratings:{' '}
                    {movies.filter((m) => m.bothRated).length}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Aún no has agregado películas.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Test Status */}
        <div className="rounded-lg bg-muted p-6">
          <h3 className="font-semibold mb-2">Estado de la Fase 2:</h3>
          <div className="space-y-1 text-sm">
            <p>✓ Tipos TypeScript definidos</p>
            <p>✓ Firestore Converters configurados</p>
            <p>✓ UserService implementado</p>
            <p>✓ MovieService implementado</p>
            <p>✓ Custom Hooks creados</p>
            <p>✓ Usuario cargado desde Firestore</p>
            <p>✓ Películas sincronizadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}