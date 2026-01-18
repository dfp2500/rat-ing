'use client';

import { useRouter } from 'next/navigation';
import { useMovies } from '@/lib/hooks/useMovies';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CompactMovieCard } from '@/components/dashboard/CompactMovieCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FilmIcon,
  StarIcon,
  TrendingUpIcon,
  ClockIcon,
  PlusIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { useMemo } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: movies, isLoading: moviesLoading } = useMovies();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!movies || !currentUser) {
      return {
        total: 0,
        averageScore: 0,
        userAverage: 0,
        pending: 0,
        recentMovies: [],
        pendingMovies: [],
      };
    }

    const total = movies.length;
    
    // Películas con valoración del usuario actual
    const userRatedMovies = movies.filter(
      (m) => m.ratings[currentUser.role] !== undefined
    );
    
    // Promedio del usuario
    const userAverage = userRatedMovies.length > 0
      ? userRatedMovies.reduce(
          (sum, m) => sum + (m.ratings[currentUser.role]?.score || 0),
          0
        ) / userRatedMovies.length
      : 0;

    // Promedio general de todas las películas con rating completo
    const moviesWithAverage = movies.filter((m) => m.averageScore !== undefined);
    const averageScore = moviesWithAverage.length > 0
      ? moviesWithAverage.reduce((sum, m) => sum + (m.averageScore || 0), 0) /
        moviesWithAverage.length
      : 0;

    // Películas pendientes
    const pendingMovies = movies.filter(
      (m) => m.ratings[currentUser.role] === undefined
    );

    // Últimas 5 películas
    const recentMovies = [...movies]
      .sort((a, b) => b.watchedDate.toMillis() - a.watchedDate.toMillis())
      .slice(0, 5);

    return {
      total,
      averageScore,
      userAverage,
      pending: pendingMovies.length,
      recentMovies,
      pendingMovies: pendingMovies.slice(0, 3),
    };
  }, [movies, currentUser]);

  const isLoading = moviesLoading || userLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasMovies = movies && movies.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Bienvenido, {currentUser?.displayName}
              </p>
            </div>
            <Button onClick={() => router.push('/movies/add')} size="lg">
              <PlusIcon className="h-4 w-4 mr-2" />
              Añadir Película
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {!hasMovies ? (
          <EmptyDashboard onAddMovie={() => router.push('/movies/add')} />
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Películas"
                value={stats.total}
                icon={FilmIcon}
                description="Películas vistas juntos"
                onClick={() => router.push('/movies')}
                variant="primary"
              />

              <StatsCard
                title="Promedio General"
                value={stats.averageScore.toFixed(1)}
                icon={StarIcon}
                description="Media de valoraciones"
                variant="default"
              />

              <StatsCard
                title="Tu Promedio"
                value={stats.userAverage.toFixed(1)}
                icon={TrendingUpIcon}
                description="Tu media de puntuaciones"
                variant="success"
              />

              <StatsCard
                title="Pendientes"
                value={stats.pending}
                icon={ClockIcon}
                description="Por valorar"
                onClick={() =>
                  router.push('/movies?filter=pending')
                }
                variant={stats.pending > 0 ? 'warning' : 'default'}
              />
            </div>

            {/* Recent Movies */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Últimas Películas</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/movies')}
                  >
                    Ver todas
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.recentMovies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay películas recientes
                  </p>
                ) : (
                  stats.recentMovies.map((movie) => (
                    <CompactMovieCard
                      key={movie.id}
                      movie={movie}
                      currentUserRole={currentUser?.role}
                      onClick={() => router.push(`/movies/${movie.id}`)}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Pending Movies */}
            {stats.pending > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Pendientes de Valorar
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
                        {stats.pending}
                      </span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push('/movies?filter=pending')
                      }
                    >
                      Ver todas
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.pendingMovies.map((movie) => (
                    <CompactMovieCard
                      key={movie.id}
                      movie={movie}
                      currentUserRole={currentUser?.role}
                      onClick={() => router.push(`/movies/${movie.id}`)}
                      showDate={false}
                    />
                  ))}
                  {stats.pending > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Y {stats.pending - 3} más...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4"
                    onClick={() => router.push('/movies/add')}
                  >
                    <PlusIcon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Añadir Película</div>
                      <div className="text-xs text-muted-foreground">
                        Registra una nueva película vista
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4"
                    onClick={() => router.push('/movies')}
                  >
                    <FilmIcon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Ver Historial</div>
                      <div className="text-xs text-muted-foreground">
                        Explora todas las películas
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4"
                    onClick={() => router.push('/movies?filter=pending')}
                  >
                    <ClockIcon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Valorar Pendientes</div>
                      <div className="text-xs text-muted-foreground">
                        {stats.pending} películas sin valorar
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4"
                    onClick={() => router.push('/stats')}
                    disabled
                  >
                    <TrendingUpIcon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Ver Estadísticas</div>
                      <div className="text-xs text-muted-foreground">
                        Próximamente
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyDashboard({ onAddMovie }: { onAddMovie: () => void }) {
  return (
    <div className="text-center py-12 max-w-2xl mx-auto">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
        <FilmIcon className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-3">¡Bienvenido a Rat-Ing!</h2>
      <p className="text-muted-foreground mb-8">
        Comienza añadiendo la primera película que hayáis visto juntos.
        Podrás valorarla, añadir comentarios y llevar un registro completo
        de vuestras películas favoritas.
      </p>
      <Button onClick={onAddMovie} size="lg">
        <PlusIcon className="h-5 w-5 mr-2" />
        Añadir Primera Película
      </Button>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
        <div className="p-4 rounded-lg border">
          <FilmIcon className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Registra películas</h3>
          <p className="text-xs text-muted-foreground">
            Busca y añade películas desde TMDB con toda su información
          </p>
        </div>
        <div className="p-4 rounded-lg border">
          <StarIcon className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Valora y comenta</h3>
          <p className="text-xs text-muted-foreground">
            Cada uno puede poner su nota y escribir comentarios
          </p>
        </div>
        <div className="p-4 rounded-lg border">
          <TrendingUpIcon className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Compara estadísticas</h3>
          <p className="text-xs text-muted-foreground">
            Ve promedios, diferencias y películas mejor valoradas
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}