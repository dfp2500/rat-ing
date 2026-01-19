// Actualización para src/app/(app)/movies/page.tsx
// Añadir soporte para parámetros de URL

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMovies } from '@/lib/hooks/useMovies';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { MovieCard } from '@/components/movies/MovieCard';
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
import { Movie } from '@/types/movie';

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc';
type FilterOption = 'all' | 'rated' | 'pending';

export default function MoviesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: movies, isLoading } = useMovies();
  const { data: currentUser } = useCurrentUser();

  // Leer filtro inicial de URL
  const initialFilter = (searchParams.get('filter') as FilterOption) || 'all';

  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>(initialFilter);
  const [displayCount, setDisplayCount] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filtrar y ordenar películas
  const filteredAndSortedMovies = useMemo(() => {
    if (!movies) return [];

    let result = [...movies];

    // Aplicar filtros
    if (filterBy === 'rated' && currentUser) {
      result = result.filter((m) => m.ratings[currentUser.role] !== undefined);
    } else if (filterBy === 'pending' && currentUser) {
      result = result.filter((m) => m.ratings[currentUser.role] === undefined);
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.watchedDate.toMillis() - a.watchedDate.toMillis();
        case 'date-asc':
          return a.watchedDate.toMillis() - b.watchedDate.toMillis();
        case 'rating-desc':
          return (b.averageScore || 0) - (a.averageScore || 0);
        case 'rating-asc':
          return (a.averageScore || 0) - (b.averageScore || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [movies, sortBy, filterBy, currentUser]);

  // Películas a mostrar (con límite)
  const displayedMovies = filteredAndSortedMovies.slice(0, displayCount);
  const hasMore = displayCount < filteredAndSortedMovies.length;

  // Intersection Observer para infinite scroll
  // --- INFINITE SCROLL CORREGIDO ---
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Validamos que exista la entrada y que esté intersectando
        if (entries[0]?.isIntersecting) {
          setDisplayCount((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [hasMore, displayCount]); // Añadido displayCount para que el observer se refresque correctamente

  // Pull to refresh (simulado)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Estados de carga y vacío
  if (isLoading) {
    return <MoviesPageSkeleton />;
  }

  const hasMovies = movies && movies.length > 0;

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
              <h1 className="text-2xl font-bold">Películas</h1>
              <p className="text-sm text-muted-foreground">
                {hasMovies
                  ? `${filteredAndSortedMovies.length} de ${movies.length} películas`
                  : 'Aún no hay películas'}
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
              <Button onClick={() => router.push('/movies/add')}>
                <PlusIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Añadir</span>
              </Button>
            </div>
          </div>

          {/* Filtros y ordenamiento */}
          {hasMovies && (
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
                    <SelectItem value="rated">Valoradas por mí</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
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
        {!hasMovies ? (
          <EmptyState onAddMovie={() => router.push('/movies/add')} />
        ) : filteredAndSortedMovies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay películas que coincidan con los filtros seleccionados
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
            {displayedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                currentUserRole={currentUser?.role}
                onClick={() => router.push(`/movies/${movie.id}`)}
              />
            ))}
          </div>
        )}

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-8 text-center">
            <Loader2Icon className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">
              Cargando más películas...
            </p>
          </div>
        )}

        {/* Stats Footer */}
        {!hasMovies ? null : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Mostrando {displayedMovies.length} de {filteredAndSortedMovies.length} películas
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAddMovie }: { onAddMovie: () => void }) {
  return (
    <div className="text-center py-12 max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <PlusIcon className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No hay películas todavía</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Empieza añadiendo la primera película que hayáis visto juntos
      </p>
      <Button onClick={onAddMovie} size="lg">
        <PlusIcon className="h-4 w-4 mr-2" />
        Añadir Primera Película
      </Button>
    </div>
  );
}

function MoviesPageSkeleton() {
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