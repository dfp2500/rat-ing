'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchGames } from '@/lib/hooks/useRAWG';
import { RAWGGame, getRAWGImageUrl } from '@/types/rawg';
import { getPlatformNames } from '@/lib/rawg/platforms';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchIcon, XIcon, GamepadIcon, StarIcon } from 'lucide-react';

interface GameSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGame: (game: RAWGGame) => void;
}

export function GameSearchDialog({
  open,
  onOpenChange,
  onSelectGame,
}: GameSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useSearchGames(debouncedQuery);

  const handleSelectGame = useCallback(
    (game: RAWGGame) => {
      onSelectGame(game);
      onOpenChange(false);
      setSearchQuery('');
    },
    [onSelectGame, onOpenChange]
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
          <DialogTitle>Buscar Videojuego</DialogTitle>
          <DialogDescription>
            Busca el juego que has jugado para añadirlo a tu lista
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
                Escribe el título de un videojuego para comenzar
              </p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <GameResultSkeleton key={i} />
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-sm text-destructive mb-2">
                Error al buscar videojuegos
              </p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
            </div>
          )}

          {!isLoading && debouncedQuery && data?.results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-sm text-muted-foreground">
                No se encontraron juegos con &quot;{debouncedQuery}&quot;
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Intenta con otro título
              </p>
            </div>
          )}

          {!isLoading && data && data.results.length > 0 && (
            <div className="space-y-2">
              {data.results.map((game) => (
                <GameResult
                  key={game.id}
                  game={game}
                  onSelect={handleSelectGame}
                />
              ))}

              {data.count > 20 && (
                <p className="text-xs text-center text-muted-foreground pt-4">
                  Mostrando {Math.min(20, data.count)} de{' '}
                  {data.count} resultados
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GameResult({
  game,
  onSelect,
}: {
  game: RAWGGame;
  onSelect: (game: RAWGGame) => void;
}) {
  const imageUrl = getRAWGImageUrl(game.background_image, 'medium');
  const year = game.released ? new Date(game.released).getFullYear() : '';
  const platforms = getPlatformNames(game.platforms.map(p => p.platform.id));

  return (
    <button
      onClick={() => onSelect(game)}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
    >
      <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <GamepadIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
          {game.name}
        </h3>
        {year && (
          <p className="text-sm text-muted-foreground">{year}</p>
        )}
        {platforms.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
            {platforms.slice(0, 3).join(', ')}
            {platforms.length > 3 && ` +${platforms.length - 3}`}
          </p>
        )}
      </div>

      {game.rating > 0 && (
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-sm font-medium">
            <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
            <span>{game.rating.toFixed(1)}</span>
          </div>
        </div>
      )}
    </button>
  );
}

function GameResultSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="flex-shrink-0 w-16 h-16 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}