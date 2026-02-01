'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useComputedStats } from '@/lib/hooks/useStats';
import { useCurrentUser, useAllUsers } from '@/lib/hooks/useUser';
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
  FilmIcon, // ← AÑADIR
  TvIcon,   // ← AÑADIR
  GamepadIcon, // ← AÑADIR
} from 'lucide-react';
import { getTMDBImageUrl } from '@/types/tmdb';
import { getUserDisplayName } from '@/types/user';
import { UserRole } from '@/types/user';
import {
  ContentFilter,
  ContentType,
  CONTENT_TYPE_CONFIG,
  NormalizedStatsItem,
} from '@/types/statsItem';
import { useNormalizedItems } from '@/lib/hooks/useStats';
import { cn } from '@/lib/utils';

// ─── Available filters ──────────────────────────────────────────────────────
const FILTERS: { value: ContentFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'all',    label: 'Todo',       icon: StarIcon },    // ← CAMBIAR
  { value: 'movie',  label: 'Películas',  icon: FilmIcon },        // ← CAMBIAR
  { value: 'series', label: 'Series',     icon: TvIcon },          // ← CAMBIAR
  { value: 'game',   label: 'Juegos',     icon: GamepadIcon },    // ← CAMBIAR
];

export default function StatsPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: allUsers } = useAllUsers();
  const allItems = useNormalizedItems();

  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const stats = useComputedStats(contentFilter);

  const isLoading = false;

  // ── Hide filters that have zero items ──
  const availableFilters = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    allItems.forEach((i) => { typeCounts[i.type] = (typeCounts[i.type] || 0) + 1; });
    return FILTERS.filter((f) => f.value === 'all' || (typeCounts[f.value] || 0) > 0);
  }, [allItems]);

  const getUserName = (role: UserRole) => {
    if (!allUsers) return role === 'user_1' ? 'Usuario 1' : 'Usuario 2';
    const user = allUsers.find((u) => u.role === role);
    return user ? getUserDisplayName(user) : role === 'user_1' ? 'Usuario 1' : 'Usuario 2';
  };

  // ── Empty state ──
  if (allItems.length === 0) {
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

  // ── Filtered-empty state ──
  if (stats.totalItems === 0 && contentFilter !== 'all') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <StatsHeader
          availableFilters={availableFilters}
          contentFilter={contentFilter}
          setContentFilter={setContentFilter}
        />
        <div className="text-center py-16">
          <AlertCircleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            No hay datos para este filtro todavía
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header + filter pills */}
      <StatsHeader
        availableFilters={availableFilters}
        contentFilter={contentFilter}
        setContentFilter={setContentFilter}
      />

      {/* Overview cards - Compactas en móvil */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatsCard
          title={contentFilter === 'all' ? 'Total Rateadas' : CONTENT_TYPE_CONFIG[contentFilter as ContentType]?.plural || 'Total'}
          value={stats.totalItems}
          icon={StarIcon}
          variant="primary"
          compact
        />
        <StatsCard
          title="Promedio Pareja"
          value={stats.averageScore.toFixed(1)}
          icon={TrendingUpIcon}
          description="Media de todas las valoraciones"
          variant="success"
          compact
        />
        <StatsCard
          title="Tu Promedio"
          value={
            currentUser
              ? (currentUser.role === 'user_1' ? stats.user_1 : stats.user_2).averageScore.toFixed(1)
              : '-'
          }
          icon={TargetIcon}
          description={`${currentUser ? (currentUser.role === 'user_1' ? stats.user_1 : stats.user_2).totalRatings : 0} valoraciones`}
          compact
        />
        <StatsCard
          title="Diferencia Media"
          value={stats.agreementStats?.averageDifference.toFixed(1) || '-'}
          icon={UsersIcon}
          description="Entre ambos"
          variant={
            !stats.agreementStats ? 'default'
            : stats.agreementStats.averageDifference < 1.5 ? 'success'
            : stats.agreementStats.averageDifference < 2.5 ? 'warning'
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
                user1Distribution={stats.user_1.distribution}
                user2Distribution={stats.user_2.distribution}
                user1Label={getUserName('user_1')}
                user2Label={getUserName('user_2')}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UserSummaryCard label={getUserName('user_1')} data={stats.user_1} />
            <UserSummaryCard label={getUserName('user_2')} data={stats.user_2} />
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
              {stats.agreementStats ? (
                <AgreementChart
                  perfectAgreement={stats.agreementStats.perfectAgreement}
                  closeAgreement={stats.agreementStats.closeAgreement}
                  moderateAgreement={stats.agreementStats.moderateAgreement}
                  disagreement={stats.agreementStats.disagreement}
                />
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Necesitas que ambos valoren al menos un elemento para ver el acuerdo
                </p>
              )}
            </CardContent>
          </Card>

          {stats.mostControversial.length > 0 && (
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
                  {stats.mostControversial.map(({ item, difference }) => (
                    <ControversialRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      difference={difference}
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
              <EvolutionChart data={stats.averageEvolution} label="Promedio General" />
            </CardContent>
          </Card>

          {stats.topRated.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-[#db6468]" />
                  Top 10 Mejor Valorados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topRated.map((item, index) => (
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

function StatsHeader({
  availableFilters,
  contentFilter,
  setContentFilter,
}: {
  availableFilters: typeof FILTERS;
  contentFilter: ContentFilter;
  setContentFilter: (f: ContentFilter) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold mb-1">Estadísticas</h1>
        <p className="text-muted-foreground">Análisis completo de vuestras valoraciones</p>
      </div>

      {availableFilters.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {availableFilters.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                onClick={() => setContentFilter(f.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2',
                  contentFilter === f.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-muted hover:border-primary/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {f.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserSummaryCard({
  label,
  data,
}: {
  label: string;
  data: { totalRatings: number; averageScore: number; distribution: Record<number, number> };
}) {
  const mostUsed = getMostUsedScore(data.distribution as Record<string, number>);

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

/** Badge that shows the content type with icon */
function TypeBadge({ type }: { type: ContentType }) {
  const cfg = CONTENT_TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

/** Route helper */
function getItemRoute(item: NormalizedStatsItem): string {
  switch (item.type) {
    case 'movie':  return `/movies/${item.id}`;
    case 'series': return `/series/${item.id}`;
    case 'game':   return `/games/${item.id}`;
    default: return `/dashboard`;
  }
}

/** Helper para obtener URL de imagen según tipo */
function getImageUrl(item: NormalizedStatsItem, size: string = 'w92'): string | null {
  if (!item.posterPath) return null;
  
  // Para juegos (RAWG), la URL ya viene completa
  if (item.type === 'game') {
    return item.posterPath;
  }
  
  // Para movies y series (TMDB), usar el helper
  return getTMDBImageUrl(item.posterPath, size);
}

function ControversialRow({
  item,
  difference,
  router,
}: {
  item: NormalizedStatsItem;
  difference: number;
  router: ReturnType<typeof useRouter>;
}) {
  const posterUrl = getImageUrl(item); // ← USAR HELPER

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
          U1: {item.ratings.user_1?.score || '-'} | U2: {item.ratings.user_2?.score || '-'}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-red-500">Δ {difference}</p>
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
  item: NormalizedStatsItem;
  index: number;
  router: ReturnType<typeof useRouter>;
}) {
  const posterUrl = getImageUrl(item); // ← USAR HELPER

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
        <p className="text-xs text-muted-foreground">
          {item.releaseYear}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1">
          <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
          <span className="text-lg font-bold">{item.averageScore?.toFixed(1)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          U1: {item.ratings.user_1?.score || '-'} | U2: {item.ratings.user_2?.score || '-'}
        </p>
      </div>
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