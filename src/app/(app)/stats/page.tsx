'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalStats } from '@/lib/hooks/useStats';
import { useCurrentUser, useAllUsers } from '@/lib/hooks/useUser';
import { ContentTypeStats } from '@/types/stats';
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
  TargetIcon,
  UsersIcon,
  TrophyIcon,
  AlertCircleIcon,
  FilmIcon,
  TvIcon,
  GamepadIcon,
} from 'lucide-react';
import { getTMDBImageUrl } from '@/types/tmdb';
import { getUserDisplayName } from '@/types/user';
import { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';

// ─── Available filters ──────────────────────────────────────────────────────
const FILTERS: { 
  value: 'all' | 'movies' | 'series' | 'games'; 
  label: string; 
  icon: React.ComponentType<{ className?: string }> 
}[] = [
  { value: 'all',    label: 'Todo',       icon: StarIcon },
  { value: 'movies', label: 'Películas',  icon: FilmIcon },
  { value: 'series', label: 'Series',     icon: TvIcon },
  { value: 'games',  label: 'Juegos',     icon: GamepadIcon },
];

export default function StatsPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: allUsers } = useAllUsers();
  const { data: globalStats, isLoading } = useGlobalStats();

  const [contentFilter, setContentFilter] = useState<'all' | 'movies' | 'series' | 'games'>('all');

  const getUserName = (role: UserRole) => {
    if (!allUsers) return role === 'user_1' ? 'Usuario 1' : 'Usuario 2';
    const user = allUsers.find((u) => u.role === role);
    return user ? getUserDisplayName(user) : role === 'user_1' ? 'Usuario 1' : 'Usuario 2';
  };

  // ── Calcular diferencia media según filtro activo ──
  const averageDifference = !globalStats ? 0 : (
    contentFilter === 'all'
      ? globalStats.agreement.averageDifference
      : (globalStats[contentFilter] as ContentTypeStats).agreement.averageDifference
  );

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  // ── Empty state ──
  if (!globalStats || globalStats.totalItems === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircleIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Estadísticas no disponibles</h2>
          <p className="text-muted-foreground">
            Añade películas, series o juegos para ver estadísticas detalladas
          </p>
        </div>
      </div>
    );
  }

  // ── Determinar qué stats mostrar según filtro ──
  const activeStats: { 
    total: number; 
    averageScore: number; 
    user_1: { totalRatings: number; averageScore: number; distribution: any }; 
    user_2: { totalRatings: number; averageScore: number; distribution: any }; 
  } = contentFilter === 'all' 
    ? {
        total: globalStats.totalItems,
        averageScore: globalStats.averageScore,
        user_1: {
          // Para "all", sumamos los totales de cada tipo
          totalRatings: globalStats.movies.user_1.totalRatings + 
                        globalStats.series.user_1.totalRatings + 
                        globalStats.games.user_1.totalRatings,
          // Promedio ponderado o simplemente el global
          averageScore: globalStats.averageScore,
          distribution: globalStats.movies.user_1.distribution, // Simplificado
        },
        user_2: {
          totalRatings: globalStats.movies.user_2.totalRatings + 
                        globalStats.series.user_2.totalRatings + 
                        globalStats.games.user_2.totalRatings,
          averageScore: globalStats.averageScore,
          distribution: globalStats.movies.user_2.distribution, // Simplificado
        },
      }
    : globalStats[contentFilter];

  const currentUserStats = currentUser?.role === 'user_1' 
    ? activeStats.user_1 
    : activeStats.user_2;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header + filter pills */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Estadísticas</h1>
          <p className="text-muted-foreground">Análisis completo de vuestras valoraciones</p>
        </div>

        <div className="w-full overflow-x-auto scrollbar-hide">
          <div 
            className="p-1 bg-muted rounded-lg grid grid-cols-4 w-full gap-1"
            style={{ minWidth: "400px" }}
          >
            {FILTERS.map((f) => {
              const Icon = f.icon;
              const isActive = contentFilter === f.value;
              
              // Ocultar filtro si total es 0
              const hasItems = f.value === 'all' 
                ? globalStats.totalItems > 0 
                : (globalStats[f.value] as ContentTypeStats).total > 0;
              
              if (!hasItems && f.value !== 'all') return null;
              
              return (
                <button
                  key={f.value}
                  onClick={() => setContentFilter(f.value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 text-xs sm:text-sm font-medium transition-all rounded-md whitespace-nowrap",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0",
                    isActive ? "text-[#db6468]" : "text-muted-foreground"
                  )} />
                  <span className="truncate">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatsCard
          title={contentFilter === 'all' ? 'Total Rateadas' : FILTERS.find(f => f.value === contentFilter)?.label || 'Total'}
          value={activeStats.total}
          icon={StarIcon}
          variant="primary"
          compact
        />
        <StatsCard
          title="Promedio Pareja"
          value={activeStats.averageScore.toFixed(1)}
          icon={TrendingUpIcon}
          description="Media de todas las valoraciones"
          variant="success"
          compact
        />
        <StatsCard
          title="Tu Promedio"
          value={currentUserStats?.averageScore.toFixed(1) || '-'}
          icon={TargetIcon}
          description={`${currentUserStats?.totalRatings || 0} valoraciones`}
          compact
        />
        <StatsCard
          title="Diferencia Media"
          value={averageDifference.toFixed(1)}
          icon={UsersIcon}
          description="Entre ambos"
          variant={
            averageDifference < 1.5 ? 'success'
            : averageDifference < 2.5 ? 'warning'
            : 'default'
          }
          compact
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
          <TabsTrigger value="agreement">Acuerdo</TabsTrigger>
          <TabsTrigger value="evolution">Evolución</TabsTrigger>
        </TabsList>

        {/* ══════ DISTRIBUTION ══════ */}
        <TabsContent value="distribution" className="space-y-6">
          <Card className="select-none">
            <CardHeader>
              <CardTitle>Distribución de Puntuaciones</CardTitle>
              <CardDescription>Comparación de cómo puntúa cada usuario</CardDescription>
            </CardHeader>
            <CardContent className="select-none">
              <DistributionChart
                user1Distribution={activeStats.user_1.distribution}
                user2Distribution={activeStats.user_2.distribution}
                user1Label={getUserName('user_1')}
                user2Label={getUserName('user_2')}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UserSummaryCard 
              label={getUserName('user_1')} 
              data={activeStats.user_1} 
            />
            <UserSummaryCard 
              label={getUserName('user_2')} 
              data={activeStats.user_2} 
            />
          </div>
        </TabsContent>

        {/* ══════ AGREEMENT ══════ */}
        <TabsContent value="agreement" className="space-y-6">
          <Card className="select-none">
            <CardHeader>
              <CardTitle>Nivel de Acuerdo</CardTitle>
              <CardDescription>Análisis de las diferencias en vuestras valoraciones</CardDescription>
            </CardHeader>
            <CardContent className="select-none">
              <AgreementChart
                perfectAgreement={globalStats.agreement.perfectAgreement}
                closeAgreement={globalStats.agreement.closeAgreement}
                moderateAgreement={globalStats.agreement.moderateAgreement}
                disagreement={globalStats.agreement.disagreement}
              />
            </CardContent>
          </Card>

          {globalStats.mostControversial.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircleIcon className="h-5 w-5" />
                  Más Controversiales
                </CardTitle>
                <CardDescription>Elementos con mayor diferencia de opinión</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {globalStats.mostControversial.map((item) => (
                    <ControversialRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      router={router}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══════ EVOLUTION ══════ */}
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
                data={globalStats.averageEvolution} 
                label="Promedio General" 
              />
            </CardContent>
          </Card>

          {globalStats.topRated.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-[#db6468]" />
                  Top 10 Mejor Valorados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {globalStats.topRated.map((item, index) => (
                    <TopRatedRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      index={index}
                      router={router}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function UserSummaryCard({
  label,
  data,
}: {
  label: string;
  data: { totalRatings: number; averageScore: number; distribution: any };
}) {
  const mostUsed = getMostUsedScore(data.distribution || {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total valoraciones:</span>
          <span className="font-bold">{data.totalRatings}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Promedio:</span>
          <span className="font-bold">{data.averageScore.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Puntuación más usada:</span>
          <span className="font-bold">{mostUsed}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TypeBadge({ type }: { type: 'movie' | 'series' | 'game' }) {
  const icons = { movie: FilmIcon, series: TvIcon, game: GamepadIcon };
  const labels = { movie: 'Película', series: 'Serie', game: 'Juego' };
  const Icon = icons[type];
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
      <Icon className="h-3 w-3" />
      {labels[type]}
    </span>
  );
}

function getItemRoute(item: { type: 'movie' | 'series' | 'game'; id: string }): string {
  switch (item.type) {
    case 'movie':  return `/movies/${item.id}`;
    case 'series': return `/series/${item.id}`;
    case 'game':   return `/games/${item.id}`;
  }
}

function getImageUrl(posterPath: string | null, type: 'movie' | 'series' | 'game'): string | null {
  if (!posterPath) return null;
  
  // Para juegos, la URL ya viene completa
  if (type === 'game') return posterPath;
  
  // Para movies/series, usar TMDB helper
  return getTMDBImageUrl(posterPath, 'w92');
}

function ControversialRow({
  item,
  router,
}: {
  item: { 
    id: string; 
    type: 'movie' | 'series' | 'game'; 
    title: string; 
    posterPath: string | null; 
    difference: number; 
    user1Score: number; 
    user2Score: number; 
  };
  router: ReturnType<typeof useRouter>;
}) {
  const posterUrl = getImageUrl(item.posterPath, item.type);

  return (
    <div
      onClick={() => router.push(getItemRoute(item))}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
    >
      <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
        {posterUrl ? (
          <img src={posterUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium truncate">{item.title}</p>
          <TypeBadge type={item.type} />
        </div>
        <p className="text-xs text-muted-foreground">
          U1: {item.user1Score} | U2: {item.user2Score}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-red-500">Δ {item.difference}</p>
        <p className="text-xs text-muted-foreground">puntos</p>
      </div>
    </div>
  );
}

function TopRatedRow({
  item,
  index,
  router,
}: {
  item: {
    id: string;
    type: 'movie' | 'series' | 'game';
    title: string;
    posterPath: string | null;
    averageScore: number;
    user1Score?: number;
    user2Score?: number;
  };
  index: number;
  router: ReturnType<typeof useRouter>;
}) {
  const posterUrl = getImageUrl(item.posterPath, item.type);

  return (
    <div
      onClick={() => router.push(getItemRoute(item))}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
    >
      <span className="text-2xl font-bold text-muted-foreground w-8 text-center">
        #{index + 1}
      </span>
      <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
        {posterUrl ? (
          <img src={posterUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium truncate">{item.title}</p>
          <TypeBadge type={item.type} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1">
          <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
          <span className="text-lg font-bold">{item.averageScore.toFixed(1)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          U1: {item.user1Score || '-'} | U2: {item.user2Score || '-'}
        </p>
      </div>
    </div>
  );
}

function getMostUsedScore(distribution: any): number {
  if (!distribution || typeof distribution !== 'object') return 0;
  
  const entries = Object.entries(distribution);
  if (entries.length === 0) return 0;
  
  const max = entries.reduce((prev, current) =>
    (current[1] as number) > (prev[1] as number) ? current : prev
  );
  
  return parseInt(max[0]);
}