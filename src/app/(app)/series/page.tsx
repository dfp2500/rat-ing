'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSeries } from '@/lib/hooks/useSeries';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { SeriesCard } from '@/components/series/SeriesCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, FilterIcon, Loader2Icon } from 'lucide-react';
import { Series } from '@/types/series';

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc';
type FilterOption = 'all' | 'watching' | 'completed' | 'dropped' | 'plan_to_watch' | 'rated' | 'pending';

export default function SeriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: series, isLoading } = useSeries();
  const { data: currentUser } = useCurrentUser();

  const initialFilter = (searchParams.get('filter') as FilterOption) || 'all';

  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>(initialFilter);
  const [displayCount, setDisplayCount] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filtrar y ordenar series
  const filteredAndSortedSeries = useMemo(() => {
    if (!series) return [];

    let result = [...series];

    // Aplicar filtros
    if (filterBy === 'rated' && currentUser) {
      result = result.filter((s) => s.ratings[currentUser.role] !== undefined);
    } else if (filterBy === 'pending' && currentUser) {
      result = result.filter((s) => s.ratings[currentUser.role] === undefined);
    } else if (['watching', 'completed', 'dropped', 'plan_to_watch'].includes(filterBy)) {
      result = result.filter((s) => s.watchStatus === filterBy);
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.startedWatchingDate.toMillis() - a.startedWatchingDate.toMillis();
        case 'date-asc':
          return a.startedWatchingDate.toMillis() - b.startedWatchingDate.toMillis();
        case 'rating-desc':
          return (b.averageScore || 0) - (a.averageScore || 0);
        case 'rating-asc':
          return (a.averageScore || 0) - (b.averageScore || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [series, sortBy, filterBy, currentUser]);

  const displayedSeries = filteredAndSortedSeries.slice(0, displayCount);
  const hasMore = displayCount < filteredAndSortedSeries.length;

  // Infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setDisplayCount((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [hasMore, displayCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <SeriesPageSkeleton />;
  }

  const hasSeries = series && series.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Refresh Indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-2">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Actualizando...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Series</h1>
              <p className="text-sm text-muted-foreground">
                {hasSeries
                  ? `${filteredAndSortedSeries.length} de ${series.length} series`
                  : 'Aún no hay series'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="sm:hidden"
              >
                <Loader2Icon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => router.push('/series/add')}>
                <PlusIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Añadir</span>
              </Button>
            </div>
          </div>

          {/* Filtros */}
          {hasSeries && (
            <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select
                  value={filterBy}
                  onValueChange={(value) => setFilterBy(value as FilterOption)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="watching">Viendo</SelectItem>
                    <SelectItem value="completed">Completadas</SelectItem>
                    <SelectItem value="dropped">Abandonadas</SelectItem>
                    <SelectItem value="plan_to_watch">Pendientes</SelectItem>
                    <SelectItem value="rated">Valoradas por mí</SelectItem>
                    <SelectItem value="pending">Sin valorar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Más recientes</SelectItem>
                  <SelectItem value="date-asc">Más antiguas</SelectItem>
                  <SelectItem value="rating-desc">Mejor valoradas</SelectItem>
                  <SelectItem value="rating-asc">Peor valoradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {!hasSeries ? (
          <EmptyState onAddSeries={() => router.push('/series/add')} />
        ) : filteredAndSortedSeries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay series que coincidan con los filtros seleccionados
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setFilterBy('all');
                setSortBy('date-desc');
              }}
              className="mt-4"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {displayedSeries.map((s) => (
              <SeriesCard
                key={s.id}
                series={s}
                currentUserRole={currentUser?.role}
                onClick={() => router.push(`/series/${s.id}`)}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-8 text-center">
            <Loader2Icon className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">
              Cargando más series...
            </p>
          </div>
        )}

        {/* Stats */}
        {!hasSeries ? null : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Mostrando {displayedSeries.length} de {filteredAndSortedSeries.length} series
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAddSeries }: { onAddSeries: () => void }) {
  return (
    <div className="text-center py-12 max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <PlusIcon className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No hay series todavía</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Empieza añadiendo la primera serie que estéis viendo juntos
      </p>
      <Button onClick={onAddSeries} size="lg">
        <PlusIcon className="h-4 w-4 mr-2" />
        Añadir Primera Serie
      </Button>
    </div>
  );
}

function SeriesPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 flex gap-3">
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-[180px]" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}