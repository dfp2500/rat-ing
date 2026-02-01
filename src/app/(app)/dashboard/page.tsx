'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { useGlobalStats } from '@/lib/hooks/useStats';
import { useDashboardData } from '@/lib/hooks/useDashboard';
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
  ArrowRightIcon,
  ActivityIcon,
  HandPlatterIcon,
} from 'lucide-react';
import { Movie } from '@/types/movie';
import { Series } from '@/types/series';
import { Game } from '@/types/game';

export default function DashboardPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: globalStats, isLoading: statsLoading } = useGlobalStats();
  const { recentActivity, pending, latest, isLoading: dashboardLoading } = useDashboardData(currentUser?.role);

  const isLoading = userLoading || statsLoading || dashboardLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasContent = globalStats ? globalStats.totalItems > 0 : false;

  // Obtener stats del usuario actual desde globalStats
  const currentUserStats = currentUser && globalStats
    ? (currentUser.role === 'user_1' ? {
        totalRatings: globalStats.movies.user_1.totalRatings + 
                      globalStats.series.user_1.totalRatings + 
                      globalStats.games.user_1.totalRatings,
        averageScore: globalStats.averageScore,
      } : {
        totalRatings: globalStats.movies.user_2.totalRatings + 
                      globalStats.series.user_2.totalRatings + 
                      globalStats.games.user_2.totalRatings,
        averageScore: globalStats.averageScore,
      })
    : { totalRatings: 0, averageScore: 0 };

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
                value={globalStats?.totalItems || 0}
                icon={ActivityIcon}
                description={`${globalStats?.movies.total || 0} películas, ${globalStats?.series.total || 0} series, ${globalStats?.games.total || 0} juegos`}
                variant="primary"
                compact
              />

              <StatsCard
                title="Promedio Pareja"
                value={(globalStats?.averageScore || 0).toFixed(1)}
                icon={StarIcon}
                description="Media de todas las valoraciones"
                variant="success"
                compact
              />

              <StatsCard
                title="Tu Promedio"
                value={currentUserStats.averageScore.toFixed(1)}
                icon={TrendingUpIcon}
                description={`De ${currentUserStats.totalRatings} rateos`}
                compact
              />

              <StatsCard
                title="Pendientes"
                value={pending.total}
                icon={ClockIcon}
                description="Por valorar"
                variant={pending.total > 0 ? 'warning' : 'default'}
                compact
              />
            </div>

            {/* Tabs de contenido */}
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
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay actividad reciente
                      </p>
                    ) : (
                      recentActivity.map((item) => (
                        <div key={`${item.type}-${item.data.id}`}>
                          {(() => {
                            switch (item.type) {
                              case 'movie':
                                return (
                                  <CompactMovieCard
                                    movie={item.data as Movie}
                                    currentUserRole={currentUser?.role}
                                    onClick={() => router.push(`/movies/${item.data.id}`)}
                                  />
                                );
                              case 'series':
                                return (
                                  <CompactSeriesCard
                                    series={item.data as Series}
                                    currentUserRole={currentUser?.role}
                                    onClick={() => router.push(`/series/${item.data.id}`)}
                                  />
                                );
                              case 'game':
                                return (
                                  <CompactGameCard
                                    game={item.data as Game}
                                    currentUserRole={currentUser?.role}
                                    onClick={() => router.push(`/games/${item.data.id}`)}
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
                    value={globalStats?.movies.total || 0}
                    icon={FilmIcon}
                    description="Total vistas"
                    onClick={() => router.push('/movies')}
                    compact
                  />
                  <StatsCard
                    title="Promedio"
                    value={(globalStats?.movies.averageScore || 0).toFixed(1)}
                    icon={StarIcon}
                    description="De películas"
                    compact
                  />
                  <StatsCard
                    title="Pendientes"
                    value={pending.movies.length}
                    icon={ClockIcon}
                    description="Sin valorar"
                    onClick={() => router.push('/movies?filter=pending')}
                    variant={pending.movies.length > 0 ? 'warning' : 'default'}
                    compact
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
                    {latest.movies.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay películas todavía
                      </p>
                    ) : (
                      latest.movies.map((movie) => (
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
              </TabsContent>

              {/* Tab: Series */}
              <TabsContent value="series" className="space-y-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <StatsCard
                    title="Series"
                    value={globalStats?.series.total || 0}
                    icon={TvIcon}
                    description="Total agregadas"
                    onClick={() => router.push('/series')}
                    compact
                  />
                  <StatsCard
                    title="Promedio"
                    value={(globalStats?.series.averageScore || 0).toFixed(1)}
                    icon={StarIcon}
                    description="De series"
                    compact
                  />
                  <StatsCard
                    title="Pendientes"
                    value={pending.series.length}
                    icon={ClockIcon}
                    description="Sin valorar"
                    onClick={() => router.push('/series?filter=pending')}
                    variant={pending.series.length > 0 ? 'warning' : 'default'}
                    compact
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
                    {latest.series.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay series todavía
                      </p>
                    ) : (
                      latest.series.map((s) => (
                        <CompactSeriesCard
                          key={s.id}
                          series={s}
                          currentUserRole={currentUser?.role}
                          onClick={() => router.push(`/series/${s.id}`)}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Juegos */}
              <TabsContent value="games" className="space-y-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <StatsCard
                    title="Juegos"
                    value={globalStats?.games.total || 0}
                    icon={GamepadIcon}
                    description="Total jugados"
                    onClick={() => router.push('/games')}
                    compact
                  />
                  <StatsCard
                    title="Promedio"
                    value={(globalStats?.games.averageScore || 0).toFixed(1)}
                    icon={StarIcon}
                    description="De juegos"
                    compact
                  />
                  <StatsCard
                    title="Pendientes"
                    value={pending.games.length}
                    icon={ClockIcon}
                    description="Sin valorar"
                    onClick={() => router.push('/games?filter=pending')}
                    variant={pending.games.length > 0 ? 'warning' : 'default'}
                    compact
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
                    {latest.games.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No hay juegos todavía
                      </p>
                    ) : (
                      latest.games.map((game) => (
                        <CompactGameCard
                          key={game.id}
                          game={game}
                          currentUserRole={currentUser?.role}
                          onClick={() => router.push(`/games/${game.id}`)}
                        />
                      ))
                    )}
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
          <GamepadIcon className="h-5 w-5 mr-2" />
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