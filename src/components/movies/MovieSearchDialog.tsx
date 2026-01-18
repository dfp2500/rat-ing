'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchMovies } from '@/lib/hooks/useTMDB';
import { TMDBMovie, getTMDBImageUrl } from '@/types/tmdb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchIcon, XIcon, CalendarIcon } from 'lucide-react';
import { StarIcon } from 'lucide-react';

interface MovieSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMovie: (movie: TMDBMovie) => void;
}

export function MovieSearchDialog({
  open,
  onOpenChange,
  onSelectMovie,
}: MovieSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce del search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useSearchMovies(debouncedQuery);

  const handleSelectMovie = useCallback(
    (movie: TMDBMovie) => {
      onSelectMovie(movie);
      onOpenChange(false);
      setSearchQuery(''); // Reset search
    },
    [onSelectMovie, onOpenChange]
  );

  // Reset al cerrar
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSearchQuery('');
        setDebouncedQuery('');
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Película</DialogTitle>
          <DialogDescription>
            Busca la película que viste para añadirla a tu lista
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {/* Empty State */}
          {!debouncedQuery && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <SearchIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Escribe el título de una película para comenzar
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <MovieResultSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-sm text-destructive mb-2">
                Error al buscar películas
              </p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && debouncedQuery && data?.results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <p className="text-sm text-muted-foreground">
                    {`No se encontraron películas con "${debouncedQuery}"`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Intenta con otro título
                </p>
            </div>
          )}

          {/* Results List */}
          {!isLoading && data && data.results.length > 0 && (
            <div className="space-y-2">
              {data.results.map((movie) => (
                <MovieResult
                  key={movie.id}
                  movie={movie}
                  onSelect={handleSelectMovie}
                />
              ))}

              {/* Pagination Info */}
              {data.total_results > 20 && (
                <p className="text-xs text-center text-muted-foreground pt-4">
                  Mostrando {Math.min(20, data.total_results)} de{' '}
                  {data.total_results} resultados
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente para cada resultado
function MovieResult({
  movie,
  onSelect,
}: {
  movie: TMDBMovie;
  onSelect: (movie: TMDBMovie) => void;
}) {
  const posterUrl = getTMDBImageUrl(movie.poster_path, 'w154');
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  return (
    <button
      onClick={() => onSelect(movie)}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
    >
      {/* Poster */}
      <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden bg-muted">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <CalendarIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
          {movie.title}
        </h3>
        {year && (
          <p className="text-sm text-muted-foreground">{year}</p>
        )}
        {movie.overview && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {movie.overview}
          </p>
        )}
      </div>

      {/* Rating */}
      {movie.vote_average > 0 && (
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-sm font-medium">
            {/* Usando el valor arbitrario [#db6468] */}
            <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
            <span>{movie.vote_average.toFixed(1)}</span>
          </div>
        </div>
      )}
    </button>
  );
}

// Skeleton para loading
function MovieResultSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="flex-shrink-0 w-16 h-24 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}