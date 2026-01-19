'use client';

import { useRouter } from 'next/navigation';
import { useAllStats } from '@/lib/hooks/useStats';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DistributionChart } from '@/components/stats/DistributionChart';
import { AgreementChart } from '@/components/stats/AgreementChart';
import { EvolutionChart } from '@/components/stats/EvolutionChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
  TargetIcon,
  TrophyIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { getTMDBImageUrl } from '@/types/tmdb';
import { useAllUsers } from '@/lib/hooks/useUser';
import { getUserDisplayName } from '@/types/user';
import { UserRole } from '@/types/user';

export default function StatsPage() {
  const router = useRouter();
  const { global, computed, isLoading } = useAllStats();
  const { data: currentUser } = useCurrentUser();
  const { data: allUsers } = useAllUsers();

  if (isLoading) {
    return <StatsPageSkeleton />;
  }

  if (!global) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircleIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            Estadísticas no disponibles
          </h2>
          <p className="text-muted-foreground">
            Añade más películas para ver estadísticas detalladas
          </p>
        </div>
      </div>
    );
  }

  const userStats = currentUser ? global[currentUser.role] : null;
  const otherUserRole = currentUser?.role === 'user_1' ? 'user_2' : 'user_1';
  const otherUserStats = global[otherUserRole];

  const getUserName = (role: UserRole) => {
    if (!allUsers) return role === 'user_1' ? 'Usuario 1' : 'Usuario 2';
    const user = allUsers.find(u => u.role === role);
    return user ? getUserDisplayName(user) : role === 'user_1' ? 'Usuario 1' : 'Usuario 2';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Estadísticas</h1>
        <p className="text-muted-foreground">
          Análisis completo de vuestras valoraciones
        </p>
      </div>

      {/* Stats Overview - 2x2 en móvil, 4 columnas en desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatsCard
          title="Total Películas"
          value={global.totalMovies}
          icon={StarIcon}
          variant="primary"
        />
        <StatsCard
          title="Promedio General"
          value={global.averageScore.toFixed(1)}
          icon={TrendingUpIcon}
          description="Media de todas las valoraciones"
          variant="success"
        />
        <StatsCard
          title="Tu Promedio"
          value={userStats?.averageScore.toFixed(1) || '-'}
          icon={TargetIcon}
          description={`${userStats?.totalRatings || 0} valoraciones`}
        />
        <StatsCard
          title="Diferencia Media"
          value={computed.agreementStats?.averageDifference.toFixed(1) || '-'}
          icon={UsersIcon}
          description="Entre ambos usuarios"
          variant={
            (computed.agreementStats?.averageDifference || 0) < 1.5
              ? 'success'
              : (computed.agreementStats?.averageDifference || 0) < 2.5
              ? 'warning'
              : 'default'
          }
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
          <TabsTrigger value="agreement">Acuerdo</TabsTrigger>
          <TabsTrigger value="evolution">Evolución</TabsTrigger>
        </TabsList>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <Card className="select-none">
            <CardHeader>
              <CardTitle>Distribución de Puntuaciones</CardTitle>
              <CardDescription>
                Comparación de cómo puntúa cada usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="select-none">
              <DistributionChart
                user1Distribution={global.user_1.distribution}
                user2Distribution={global.user_2.distribution}
                user1Label={getUserName('user_1')}
                user2Label={getUserName('user_2')}
              />
            </CardContent>
          </Card>

          {/* Individual Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{getUserName('user_1')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total valoraciones:</span>
                  <span className="font-bold">{global.user_1.totalRatings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Promedio:</span>
                  <span className="font-bold">{global.user_1.averageScore.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Puntuación más usada:</span>
                  <span className="font-bold">
                    {getMostUsedScore(global.user_1.distribution as unknown as Record<string, number>)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{getUserName('user_2')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total valoraciones:</span>
                  <span className="font-bold">{global.user_2.totalRatings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Promedio:</span>
                  <span className="font-bold">{global.user_2.averageScore.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Puntuación más usada:</span>
                  <span className="font-bold">
                    {getMostUsedScore(global.user_2.distribution as unknown as Record<string, number>)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agreement Tab */}
        <TabsContent value="agreement" className="space-y-6">
          <Card className="select-none">
            <CardHeader>
              <CardTitle>Nivel de Acuerdo</CardTitle>
              <CardDescription>
                Análisis de las diferencias en vuestras valoraciones
              </CardDescription>
            </CardHeader>
            <CardContent className="select-none">
              {computed.agreementStats && (
                <AgreementChart
                  perfectAgreement={computed.agreementStats.perfectAgreement}
                  closeAgreement={computed.agreementStats.closeAgreement}
                  moderateAgreement={computed.agreementStats.moderateAgreement}
                  disagreement={computed.agreementStats.disagreement}
                />
              )}
            </CardContent>
          </Card>

          {/* Most Controversial */}
          {computed.mostControversial.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircleIcon className="h-5 w-5" />
                  Películas Más Controversiales
                </CardTitle>
                <CardDescription>
                  Películas con mayor diferencia de opinión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {computed.mostControversial.slice(0, 5).map(({ movie, difference }) => {
                    const posterUrl = getTMDBImageUrl(movie.posterPath ?? null, 'w92');
                    return (
                      <div
                        key={movie.id}
                        onClick={() => router.push(`/movies/${movie.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          {posterUrl ? (
                            <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              ?
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{movie.title}</p>
                          <p className="text-xs text-muted-foreground">
                            U1: {movie.ratings.user_1?.score || '-'} | U2: {movie.ratings.user_2?.score || '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-500">Δ {difference}</p>
                          <p className="text-xs text-muted-foreground">puntos</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="space-y-6">
          <Card className="select-none">
            <CardHeader>
              <CardTitle>Evolución del Promedio</CardTitle>
              <CardDescription>
                Cómo ha variado vuestra valoración promedio con el tiempo
              </CardDescription>
            </CardHeader>
            <CardContent className="select-none">
              <EvolutionChart
                data={computed.averageEvolution}
                label="Promedio General"
              />
            </CardContent>
          </Card>

          {/* Top Rated */}
          {computed.topRated.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-[#db6468]" />
                  Top 10 Mejor Valoradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {computed.topRated.slice(0, 10).map((movie, index) => {
                    const posterUrl = getTMDBImageUrl(movie.posterPath ?? null, 'w92');
                    return (
                      <div
                        key={movie.id}
                        onClick={() => router.push(`/movies/${movie.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <span className="text-2xl font-bold text-muted-foreground w-8 text-center">
                          #{index + 1}
                        </span>
                        <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          {posterUrl ? (
                            <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              ?
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{movie.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
                            <span className="text-lg font-bold">{movie.averageScore?.toFixed(1)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            U1: {movie.ratings.user_1?.score || '-'} | U2: {movie.ratings.user_2?.score || '-'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getMostUsedScore(distribution: Record<string, number>): number {
  const entries = Object.entries(distribution);
  if (entries.length === 0) return 0;
  
  const max = entries.reduce((prev, current) => 
    current[1] > prev[1] ? current : prev
  );
  
  return parseInt(max[0]);
}

function StatsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}