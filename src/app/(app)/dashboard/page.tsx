'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { useMovies } from '@/lib/hooks/useMovies';
import { signOut } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MovieSearchDialog } from '@/components/movies/MovieSearchDialog';
import { TMDBMovie } from '@/types/tmdb';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardPage() {
  const { user: firebaseUser } = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: movies, isLoading: moviesLoading } = useMovies();
  const router = useRouter();
  
  // Estado para el diálogo de búsqueda
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleSelectMovie = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    toast.success(`Seleccionaste: ${movie.title}`);
    console.log('Película seleccionada:', movie);
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

        {/* NUEVO: Test de TMDB */}
        <div className="rounded-lg border p-6 bg-blue-50 dark:bg-blue-950/20">
          <h2 className="text-xl font-semibold mb-4">
            🧪 Test de Integración TMDB
          </h2>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prueba la búsqueda de películas usando la API de TMDB
            </p>
            
            <Button 
              onClick={() => setSearchDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              🔍 Abrir Búsqueda de Películas
            </Button>

            {selectedMovie && (
              <div className="mt-4 p-4 rounded-lg bg-background border">
                <h3 className="font-medium mb-2">Última película seleccionada:</h3>
                <div className="text-sm space-y-1">
                  <p>✓ Título: {selectedMovie.title}</p>
                  <p>✓ ID TMDB: {selectedMovie.id}</p>
                  <p>✓ Fecha: {selectedMovie.release_date || 'N/A'}</p>
                  <p>✓ Rating: ⭐ {selectedMovie.vote_average.toFixed(1)}/10</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Status */}
        <div className="rounded-lg bg-muted p-6">
          <h3 className="font-semibold mb-2">Estado del Proyecto:</h3>
          <div className="space-y-1 text-sm">
            <p>✅ Fase 0: Setup Inicial</p>
            <p>✅ Fase 1: Autenticación</p>
            <p>✅ Fase 2: Modelo de Datos</p>
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              🧪 Fase 3: Integración TMDB (Testing)
            </p>
            <div className="ml-4 mt-2 space-y-1">
              <p>✓ API Routes mejoradas</p>
              <p>✓ Cliente TMDB con reintentos</p>
              <p>✓ Hooks useTMDB creados</p>
              <p>✓ MovieSearchDialog implementado</p>
              <p className="text-amber-600 dark:text-amber-400">
                ⏳ Pendiente: Verificar funcionamiento completo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <MovieSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectMovie={handleSelectMovie}
      />
    </div>
  );
}