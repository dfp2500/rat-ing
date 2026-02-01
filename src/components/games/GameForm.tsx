'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRAWGImageUrl } from '@/types/rawg';
import { RAWGGame } from '@/types/rawg';
import { useGameDetails } from '@/lib/hooks/useRAWG';
import { useCreateGame, useGameExists } from '@/lib/hooks/useGames';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { DatePicker } from '@/components/shared/DatePicker';
import { RatingInput } from '@/components/movies/RatingInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { StarIcon, GamepadIcon, Loader2Icon, AlertCircleIcon, CheckIcon } from 'lucide-react';
import { getPlatformNames } from '@/lib/rawg/platforms';

interface GameFormProps {
  game: RAWGGame;
  onCancel: () => void;
}

export function GameForm({ game, onCancel }: GameFormProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const createGame = useCreateGame();
  
  const { data: existingGame, isLoading: checkingExists } = useGameExists(game.id);

  // Obtener detalles completos del juego
  const { data: gameDetails, isLoading: detailsLoading } = useGameDetails(game.id);

  // Estados del formulario
  const [playedDate, setPlayedDate] = useState(new Date());
  const [startedPlayingDate, setStartedPlayingDate] = useState(new Date());
  const [finishedPlayingDate, setFinishedPlayingDate] = useState(new Date());
  const [rateNow, setRateNow] = useState(false);
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState<string>('');

  const imageUrl = getRAWGImageUrl(game.background_image, 'medium');
  const year = game.released ? new Date(game.released).getFullYear() : '';
  const platforms = gameDetails?.platforms 
    ? getPlatformNames(gameDetails.platforms.map(p => p.platform.id)) // Solo enviamos el ID
    : [];

  if (existingGame && !checkingExists) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-500/10">
              <AlertCircleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Este juego ya existe
              </h3>
              <p className="text-sm text-amber-800/80 dark:text-amber-400/80 mb-4">
                Ya has añadido &quot;{game.name}&quot; anteriormente. ¿Quieres ir a su página de detalle?
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => router.push(`/games/${existingGame.id}`)} 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-500/50 hover:bg-amber-500/10"
                >
                  Ver Juego
                </Button>
                <Button 
                  onClick={onCancel} 
                  variant="ghost" 
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (!currentUser || !gameDetails) {
      toast.error('No se pudo identificar el usuario o cargar detalles');
      return;
    }

    try {
      const newGame = await createGame.mutateAsync({
        rawgId: gameDetails.id,
        name: gameDetails.name,
        slug: gameDetails.slug,
        description: gameDetails.description_raw,
        released: gameDetails.released,
        backgroundImage: gameDetails.background_image || undefined,
        platforms: gameDetails.platforms?.map(p => p.platform.id) ?? [],
        genres: gameDetails.genres?.map(g => g.name) ?? [],
        addedBy: currentUser.id,
        playedDate,
        startedPlayingDate,
        finishedPlayingDate,
        initialRating: rateNow
          ? {
              userRole: currentUser.role,
              score: rating,
              comment: comment.trim() || '',
            }
          : undefined,
      });

      toast.success(
        rateNow
          ? `¡"${game.name}" añadido con tu valoración!`
          : `¡"${game.name}" añadido! Podrás valorarlo más tarde.`
      );

      router.push(`/games/${newGame.id}`);
    } catch (error) {
      console.error('Error adding game:', error);
      toast.error('Error al añadir el juego. Inténtalo de nuevo.');
    }
  };

  if (detailsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground ml-3">Cargando detalles...</p>
      </div>
    );
  }

  if (!gameDetails) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar los detalles del juego
        </p>
        <Button onClick={onCancel} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview del juego */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-48 h-32 rounded-lg overflow-hidden bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <GamepadIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1">{game.name}</h2>
              {year && (
                <p className="text-muted-foreground mb-3">{year}</p>
              )}
              
              {/* Plataformas */}
              {platforms.length > 0 && (
                <div className="flex items-center gap-2 text-sm mb-3">
                  <GamepadIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{platforms.slice(0, 3).join(', ')}</span>
                </div>
              )}
              
              {game.rating > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
                  <span className="text-sm font-medium">
                    {game.rating.toFixed(1)} / 5
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({game.ratings_count.toLocaleString()} valoraciones)
                  </span>
                </div>
              )}

              {gameDetails.description_raw && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {gameDetails.description_raw}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de partida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fecha de juego */}
          <DatePicker
            date={startedPlayingDate}
            onDateChange={setStartedPlayingDate}
            label="Fecha de comienzo"
            disabled={createGame.isPending}
          />

          <Separator />
            <DatePicker
            date={finishedPlayingDate}
            onDateChange={setFinishedPlayingDate}
            label={'Fecha de finalización'}
            disabled={createGame.isPending}
            />

          <Separator />

          {/* Valoración */}
          <Tabs
            value={rateNow ? 'now' : 'later'}
            onValueChange={(value) => setRateNow(value === 'now')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="later">Valorar después</TabsTrigger>
              <TabsTrigger value="now">Valorar ahora</TabsTrigger>
            </TabsList>

            <TabsContent value="later" className="space-y-4 pt-4">
              <div className="text-center py-8 text-muted-foreground">
                <CheckIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  El juego se añadirá sin valoración.
                  <br />
                  Podrás valorarlo más tarde.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="now" className="space-y-4 pt-4">
              <RatingInput
                value={rating}
                onChange={setRating}
                comment={comment}
                onCommentChange={setComment}
                disabled={createGame.isPending}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={createGame.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createGame.isPending}
        >
          {createGame.isPending ? (
            <>
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              {rateNow ? 'Añadir con valoración' : 'Añadir juego'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}