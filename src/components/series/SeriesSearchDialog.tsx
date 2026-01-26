'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchSeries } from '@/lib/hooks/useTMDBSeries';
import { getTMDBImageUrl } from '@/types/tmdb';
import { TMDBSeries } from '@/types/tmdb-series';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchIcon, XIcon, CalendarIcon, StarIcon } from 'lucide-react';

interface SeriesSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSeries: (series: TMDBSeries) => void;
}

export function SeriesSearchDialog({
  open,
  onOpenChange,
  onSelectSeries,
}: SeriesSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useSearchSeries(debouncedQuery);

  const handleSelectSeries = useCallback(
    (series: TMDBSeries) => {
      onSelectSeries(series);
      onOpenChange(false);
      setSearchQuery('');
    },
    [onSelectSeries, onOpenChange]
  );

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
          <DialogTitle>Buscar Serie</DialogTitle>
          <DialogDescription>
            Busca la serie que estás viendo para añadirla a tu lista
          </DialogDescription>
        </DialogHeader>

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

        <div className="flex-1 overflow-y-auto">
          {!debouncedQuery && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <SearchIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Escribe el título de una serie para comenzar
              </p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <SeriesResultSkeleton key={i} />
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-sm text-destructive mb-2">
                Error al buscar series
              </p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          )}

          {!isLoading && debouncedQuery && data?.results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-sm text-muted-foreground">
                No se encontraron series con &quot;{debouncedQuery}&quot;
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Intenta con otro título
              </p>
            </div>
          )}

          {!isLoading && data && data.results.length > 0 && (
            <div className="space-y-2">
              {data.results.map((series) => (
                <SeriesResult
                  key={series.id}
                  series={series}
                  onSelect={handleSelectSeries}
                />
              ))}

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

function SeriesResult({
  series,
  onSelect,
}: {
  series: TMDBSeries;
  onSelect: (series: TMDBSeries) => void;
}) {
  const posterUrl = getTMDBImageUrl(series.poster_path, 'w154');
  const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : '';

  return (
    <button
      onClick={() => onSelect(series)}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
    >
      <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden bg-muted">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={series.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <CalendarIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
          {series.name}
        </h3>
        {year && (
          <p className="text-sm text-muted-foreground">{year}</p>
        )}
        {series.overview && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {series.overview}
          </p>
        )}
      </div>

      {series.vote_average > 0 && (
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-sm font-medium">
            <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
            <span>{series.vote_average.toFixed(1)}</span>
          </div>
        </div>
      )}
    </button>
  );
}

function SeriesResultSkeleton() {
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