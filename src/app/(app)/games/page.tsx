'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGames } from '@/lib/hooks/useGames';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { GameCard } from '@/components/games/GameCard';
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

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc';
type FilterOption = 'all' | 'rated' | 'pending';

export default function GamesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: games, isLoading } = useGames();
  const { data: currentUser } = useCurrentUser();

  const initialFilter = (searchParams.get('filter') as FilterOption) || 'all';

  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>(initialFilter);
  const [displayCount, setDisplayCount] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filtrar y ordenar juegos
  const filteredAndSortedGames = useMemo(() => {
    if (!games) return [];

    let result = [...games];

    // Aplicar filtros
    if (filterBy === 'rated' && currentUser) {
      result = result.filter((g) => g.ratings[currentUser.role] !== undefined);
    } else if (filterBy === 'pending' && currentUser) {
      result = result.filter((g) => g.ratings[currentUser.role] === undefined);
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.playedDate.toMillis() - a.playedDate.toMillis();
        case 'date-asc':
          return a.playedDate.toMillis() - b.playedDate.toMillis();
        case 'rating-desc':
          return (b.averageScore || 0) - (a.averageScore || 0);
        case 'rating-asc':
          return (a.averageScore || 0) - (b.averageScore || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [games, sortBy, filterBy, currentUser]);

  const displayedGames = filteredAndSortedGames.slice(0, displayCount);
  const hasMore = displayCount < filteredAndSortedGames.length;

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
    return <GamesPageSkeleton />;
  }

  const hasGames = games && games.length > 0;

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
              <h1 className="text-2xl font-bold">Videojuegos</h1>
              <p className="text-sm text-muted-foreground">
                {hasGames
                  ? `${filteredAndSortedGames.length} de ${games.length} juegos`
                  : 'Aún no hay juegos'}
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
              <Button onClick={() => router.push('/games/add')}>
                <PlusIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Añadir</span>
              </Button>
            </div>
          </div>

          {/* Filtros */}
          {hasGames && (
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
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="rated">Valorados por mí</SelectItem>
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
                  <SelectItem value="date-asc">Más antiguos</SelectItem>
                  <SelectItem value="rating-desc">Mejor valorados</SelectItem>
                  <SelectItem value="rating-asc">Peor valorados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {!hasGames ? (
          <EmptyState onAddGame={() => router.push('/games/add')} />
        ) : filteredAndSortedGames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay juegos que coincidan con los filtros seleccionados
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
            {displayedGames.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                currentUserRole={currentUser?.role}
                onClick={() => router.push(`/games/${g.id}`)}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-8 text-center">
            <Loader2Icon className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">
              Cargando más juegos...
            </p>
          </div>
        )}

        {/* Stats */}
        {!hasGames ? null : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Mostrando {displayedGames.length} de {filteredAndSortedGames.length} juegos
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAddGame }: { onAddGame: () => void }) {
  return (
    <div className="text-center py-12 max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <PlusIcon className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No hay juegos todavía</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Empieza añadiendo el primer juego que hayáis jugado juntos
      </p>
      <Button onClick={onAddGame} size="lg">
        <PlusIcon className="h-4 w-4 mr-2" />
        Añadir Primer Juego
      </Button>
    </div>
  );
}

function GamesPageSkeleton() {
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
            <Skeleton key={i} className="aspect-[16/10] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}