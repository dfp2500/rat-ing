'use client';

import { useRouter } from 'next/navigation';
import { useMovies } from '@/lib/hooks/useMovies';
import { useSeries } from '@/lib/hooks/useSeries';
import { useGames } from '@/lib/hooks/useGames';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CompactMovieCard } from '@/components/dashboard/CompactMovieCard';
import { CompactSeriesCard } from '@/components/series/CompactSeriesCard';
import { CompactGameCard } from '@/components/games/CompactGameCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FilmIcon,
  TvIcon,
  GamepadIcon,
  StarIcon,
  TrendingUpIcon,
  ClockIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ActivityIcon,
  HandPlatterIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';
import { Game } from '@/types/game';

// Tipo unificado para la actividad reciente
type ActivityItem = {
  id: string;
  type: 'movie' | 'series' | 'game';
  title: string;
  posterPath?: string; // Aquí guardaremos tanto posterPath como backgroundImage
  date: number;
  averageScore?: number;
  userHasRated: boolean;
  data: Movie | Series | Game;
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: movies, isLoading: moviesLoading } = useMovies();
  const { data: series, isLoading: seriesLoading } = useSeries();
  const { data: games, isLoading: gamesLoading } = useGames();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  // Calcular estadísticas unificadas
  const stats = useMemo(() => {
    if (!currentUser) {
      return {
        totalItems: 0,
        totalMovies: 0,
        totalSeries: 0,
        totalGames: 0,
        overallAverage: 0,
        userAverage: 0,
        totalPending: 0,
        completionRate: 0,
        recentActivity: [] as ActivityItem[],
        pendingMovies: [] as Movie[],
        pendingSeries: [] as Series[],
        pendingGames: [] as Game[],
      };
    }

    const totalMovies = movies?.length || 0;
    const totalSeries = series?.length || 0;
    const totalGames = games?.length || 0;
    const totalItems = totalMovies + totalSeries + totalGames;

    // Películas con valoración del usuario
    const userRatedMovies = movies?.filter(
      (m) => m.ratings[currentUser.role] !== undefined
    ) || [];

    // Series con valoración del usuario
    const userRatedSeries = series?.filter(
      (s) => s.ratings[currentUser.role] !== undefined
    ) || [];

    // Juegos con valoración del usuario
    const userRatedGames = games?.filter(
      (m) => m.ratings[currentUser.role] !== undefined
    ) || [];

    // Promedio del usuario (combinado)
    const totalUserRatings = userRatedMovies.length + userRatedSeries.length + userRatedGames.length;
    const userAverage = totalUserRatings > 0
      ? (
          userRatedMovies.reduce((sum, m) => sum + (m.ratings[currentUser.role]?.score || 0), 0) +
          userRatedSeries.reduce((sum, s) => sum + (s.ratings[currentUser.role]?.score || 0), 0) +
          userRatedGames.reduce((sum, s) => sum + (s.ratings[currentUser.role]?.score || 0), 0)
        ) / totalUserRatings
      : 0;

    // Promedio general
    const moviesWithAverage = movies?.filter((m) => m.averageScore !== undefined) || [];
    const seriesWithAverage = series?.filter((s) => s.averageScore !== undefined) || [];
    const gamesWithAverage = games?.filter((s) => s.averageScore !== undefined) || [];
    const totalWithAverage = moviesWithAverage.length + seriesWithAverage.length + gamesWithAverage.length;
    
    const overallAverage = totalWithAverage > 0
      ? (
          moviesWithAverage.reduce((sum, m) => sum + (m.averageScore || 0), 0) +
          seriesWithAverage.reduce((sum, s) => sum + (s.averageScore || 0), 0) +
          gamesWithAverage.reduce((sum, s) => sum + (s.averageScore || 0), 0)
        ) / totalWithAverage
      : 0;

    // Items pendientes
    const pendingMovies = movies?.filter(
      (m) => m.ratings[currentUser.role] === undefined
    ) || [];
    
    const pendingSeries = series?.filter(
      (s) => s.ratings[currentUser.role] === undefined
    ) || [];

    const pendingGames = games?.filter(
      (s) => s.ratings[currentUser.role] === undefined
    ) || [];
    
    const totalPending = pendingMovies.length + pendingSeries.length + pendingGames.length;

    // Tasa de completitud
    const completionRate = totalItems > 0 
      ? ((totalUserRatings / totalItems) * 100) 
      : 0;

    // Actividad reciente (películas y series mezcladas)
    const movieActivity: ActivityItem[] = (movies || []).map(m => ({
      id: m.id,
      type: 'movie' as const,
      title: m.title,
      posterPath: m.posterPath,
      date: m.watchedDate.toMillis(),
      averageScore: m.averageScore,
      userHasRated: m.ratings[currentUser.role] !== undefined,
      data: m,
    }));

    const seriesActivity: ActivityItem[] = (series || []).map(s => ({
      id: s.id,
      type: 'series' as const,
      title: s.title,
      posterPath: s.posterPath,
      date: s.startedWatchingDate.toMillis(),
      averageScore: s.averageScore,
      userHasRated: s.ratings[currentUser.role] !== undefined,
      data: s,
    }));

    const gameActivity: ActivityItem[] = (games || []).map(g => ({
      id: g.id,
      type: 'game' as const,
      title: g.name, // En Game es 'name', no 'title'
      posterPath: g.backgroundImage, // En Game es 'backgroundImage', no 'posterPath'
      // Usamos startedPlayingDate para la cronología de actividad
      date: g.startedPlayingDate?.toMillis() || g.createdAt.toMillis(), 
      averageScore: g.averageScore,
      userHasRated: !!(currentUser && g.ratings[currentUser.role]),
      data: g,
    }));

    const recentActivity = [...movieActivity, ...seriesActivity, ...gameActivity]
      .sort((a, b) => b.date - a.date)
      .slice(0, 8);

    return {
      totalItems,
      totalMovies,
      totalSeries,
      totalGames,
      overallAverage,
      userAverage,
      totalPending,
      completionRate,
      recentActivity,
      pendingMovies: pendingMovies.slice(0, 3),
      pendingSeries: pendingSeries.slice(0, 3),
      pendingGames: pendingGames.slice(0, 3),
    };
  }, [movies, series, games, currentUser]);

  const isLoading = moviesLoading || seriesLoading || gamesLoading || userLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasContent = stats.totalItems > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {!hasContent ? (
          <EmptyDashboard />
        ) : (
          <div className="space-y-8">

            {/* Stats Grid - Vista general - 4 columnas compactas en móvil */}
            <div className="grid grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-4">
              <StatsCard
                title="Total Rateadas"
                value={stats.totalItems}
                icon={ActivityIcon}
                description={`${stats.totalMovies} películas, ${stats.totalSeries} series, ${stats.totalGames} juegos`}
                variant="primary"
                compact // ← Activar modo compacto
              />

              <StatsCard
                title="Promedio Pareja"
                value={stats.overallAverage.toFixed(1)}
                icon={StarIcon}
                description="Media de todas tus valoraciones"
                variant="success"
                compact // ← Activar modo compacto
              />

              <StatsCard
                title="Tu Promedio"
                value={stats.userAverage.toFixed(1)}
                icon={TrendingUpIcon}
                description={`De ${stats.totalItems} rateos`}
                compact // ← Activar modo compacto
              />

              <StatsCard
                title="Pendientes"
                value={stats.totalPending}
                icon={ClockIcon}
                description="Por valorar"
                variant={stats.totalPending > 0 ? 'warning' : 'default'}
                compact // ← Activar modo compacto
              />
            </div>

            {/* Tabs de contenido - Ancho completo con scroll si es necesario */}
            <Tabs defaultValue="recent" className="space-y-6">
              <div className="w-full overflow-x-auto scrollbar-hide">
                <TabsList className="w-full grid grid-cols-4 min-w-full">
                  <TabsTrigger value="recent" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <ActivityIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Reciente</span>
                  </TabsTrigger>
                  <TabsTrigger value="movies" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <FilmIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Películas</span>
                  </TabsTrigger>
                  <TabsTrigger value="series" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <TvIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Series</span>
                  </TabsTrigger>
                  <TabsTrigger value="games" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <GamepadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Juegos</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab: Actividad Reciente */}
              <TabsContent value="recent" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {stats.recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay actividad reciente
                      </p>
                    ) : (
                      stats.recentActivity.map((item) => (
                        <div key={`${item.type}-${item.id}`}>
                          {(() => {
                            // Usamos una función autoinvocada para manejar múltiples tipos
                            switch (item.type) {
                              case 'movie':
                                return (
                                  <CompactMovieCard
                                    movie={item.data as Movie}
                                    currentUserRole={currentUser?.role}
                                    onClick={() => router.push(`/movies/${item.id}`)}
                                  />
                                );
                              case 'series':
                                return (
                                  <CompactSeriesCard
                                    series={item.data as Series}
                                    currentUserRole={currentUser?.role}
                                    onClick={() => router.push(`/series/${item.id}`)}
                                  />
                                );
                              case 'game':
                                return (
                                  <CompactGameCard
                                    game={item.data as Game}
                                    currentUserRole={currentUser?.role}
                                    onClick={() => router.push(`/games/${item.id}`)}
                                  />
                                );
                              default:
                                return null;
                            }
                          })()}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Películas */}
              <TabsContent value="movies" className="space-y-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <StatsCard
                    title="Películas"
                    value={stats.totalMovies}
                    icon={FilmIcon}
                    description="Total vistas"
                    onClick={() => router.push('/movies')}
                    compact // ← MODO COMPACTO
                  />
                  <StatsCard
                    title="Promedio"
                    value={
                      movies && movies.length > 0
                        ? (movies
                            .filter(m => m.averageScore)
                            .reduce((sum, m) => sum + (m.averageScore || 0), 0) / 
                          movies.filter(m => m.averageScore).length
                          ).toFixed(1)
                        : '0.0'
                    }
                    icon={StarIcon}
                    description="De películas"
                    compact // ← MODO COMPACTO
                  />
                  <StatsCard
                    title="Pendientes"
                    value={stats.pendingMovies.length}
                    icon={ClockIcon}
                    description="Sin valorar"
                    onClick={() => router.push('/movies?filter=pending')}
                    variant={stats.pendingMovies.length > 0 ? 'warning' : 'default'}
                    compact // ← MODO COMPACTO
                  />
                </div>

                {/* Últimas películas */}
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
                    {(movies || []).slice(0, 5).map((movie) => (
                      <CompactMovieCard
                        key={movie.id}
                        movie={movie}
                        currentUserRole={currentUser?.role}
                        onClick={() => router.push(`/movies/${movie.id}`)}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Series */}
              <TabsContent value="series" className="space-y-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <StatsCard
                    title="Series"
                    value={stats.totalSeries}
                    icon={TvIcon}
                    description="Total agregadas"
                    onClick={() => router.push('/series')}
                    compact // ← MODO COMPACTO
                  />
                  <StatsCard
                    title="Promedio"
                    value={
                      series && series.length > 0
                        ? (series
                            .filter(s => s.averageScore)
                            .reduce((sum, s) => sum + (s.averageScore || 0), 0) / 
                          series.filter(s => s.averageScore).length
                          ).toFixed(1)
                        : '0.0'
                    }
                    icon={StarIcon}
                    description="De series"
                    compact // ← MODO COMPACTO
                  />
                  <StatsCard
                    title="Pendientes"
                    value={stats.pendingSeries.length}
                    icon={ClockIcon}
                    description="Sin valorar"
                    onClick={() => router.push('/series?filter=pending')}
                    variant={stats.pendingSeries.length > 0 ? 'warning' : 'default'}
                    compact // ← MODO COMPACTO
                  />
                </div>

                {/* Últimas series */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Últimas Series</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/series')}
                      >
                        Ver todas
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(series || []).slice(0, 5).map((s) => (
                      <CompactSeriesCard
                        key={s.id}
                        series={s}
                        currentUserRole={currentUser?.role}
                        onClick={() => router.push(`/series/${s.id}`)}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Juegos */}
              <TabsContent value="games" className="space-y-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <StatsCard
                    title="Juegos"
                    value={stats.totalGames}
                    icon={GamepadIcon}
                    description="Total jugados"
                    onClick={() => router.push('/games')}
                    compact // ← MODO COMPACTO
                  />
                  <StatsCard
                    title="Promedio"
                    value={
                      games && games.length > 0
                        ? (games
                            .filter(s => s.averageScore)
                            .reduce((sum, s) => sum + (s.averageScore || 0), 0) / 
                          games.filter(s => s.averageScore).length
                          ).toFixed(1)
                        : '0.0'
                    }
                    icon={StarIcon}
                    description="De juegos"
                    compact // ← MODO COMPACTO
                  />
                  <StatsCard
                    title="Pendientes"
                    value={stats.pendingGames.length}
                    icon={ClockIcon}
                    description="Sin valorar"
                    onClick={() => router.push('/games?filter=pending')}
                    variant={stats.pendingGames.length > 0 ? 'warning' : 'default'}
                    compact // ← MODO COMPACTO
                  />
                </div>

                {/* Últimos juegos */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Últimos Juegos</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/games')}
                      >
                        Ver todos
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(games || []).slice(0, 5).map((game) => (
                      <CompactGameCard
                        key={game.id}
                        game={game}
                        currentUserRole={currentUser?.role}
                        onClick={() => router.push(`/games/${game.id}`)}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2"
                    onClick={() => router.push('/movies/add')}
                  >
                    <FilmIcon className="h-6 w-6 text-primary" />
                    <span className="text-sm font-semibold">Añadir Película</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2"
                    onClick={() => router.push('/series/add')}
                  >
                    <TvIcon className="h-6 w-6 text-blue-500" />
                    <span className="text-sm font-semibold">Añadir Serie</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2"
                    onClick={() => router.push('/games/add')}
                  >
                    <GamepadIcon className="h-6 w-6 text-green-500" />
                    <span className="text-sm font-semibold">Añadir Juego</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2 relative"
                    disabled
                  >
                    <HandPlatterIcon className="h-6 w-6 text-purple-500 opacity-50" />
                    <span className="text-sm font-semibold opacity-50">Restaurantes</span>
                    <span className="absolute top-2 right-2 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      PRÓXIMAMENTE
                    </span>
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

function EmptyDashboard() {
  const router = useRouter();

  return (
    <div className="text-center py-12 max-w-3xl mx-auto">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
        <ActivityIcon className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-3xl font-bold mb-3">¡Bienvenido a Rat-Ing!</h2>
      <p className="text-muted-foreground mb-8 text-lg">
        Empieza a registrar las películas, series y videojuegos que disfrutas.
        <br />
        Valora, comenta y compara opiniones.
      </p>

      <div className="flex gap-3 justify-center flex-wrap mb-12">
        <Button onClick={() => router.push('/movies/add')} size="lg">
          <FilmIcon className="h-5 w-5 mr-2" />
          Añadir Película
        </Button>
        <Button onClick={() => router.push('/series/add')} size="lg" variant="outline">
          <TvIcon className="h-5 w-5 mr-2" />
          Añadir Serie
        </Button>
        <Button onClick={() => router.push('/games/add')} size="lg" variant="outline">
          <TvIcon className="h-5 w-5 mr-2" />
          Añadir Juego
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-12">
        <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <FilmIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Múltiples Categorías</h3>
          <p className="text-sm text-muted-foreground">
            Películas, series y videojuegos
          </p>
        </div>

        <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
            <StarIcon className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="font-semibold mb-2">Valora en Pareja</h3>
          <p className="text-sm text-muted-foreground">
            Cada uno da su puntuación y añade comentarios
          </p>
        </div>

        <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
            <TrendingUpIcon className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="font-semibold mb-2">Estadísticas Detalladas</h3>
          <p className="text-sm text-muted-foreground">
            Compara gustos, encuentra patrones y descubre tendencias
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}