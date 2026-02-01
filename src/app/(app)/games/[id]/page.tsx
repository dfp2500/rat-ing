'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGameById, useUpdateGameRating, useGames, useDeleteGame } from '@/lib/hooks/useGames';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { getRAWGImageUrl } from '@/types/rawg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingInput } from '@/components/movies/RatingInput';
import { 
  ArrowLeftIcon, 
  GamepadIcon, 
  StarIcon, 
  EditIcon, 
  CheckIcon, 
  XIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  TrashIcon,
  CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { UserRole } from '@/types/user';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAllUsers } from '@/lib/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserDisplayName, getUserInitials } from '@/types/user';
import { getPlatformNames } from '@/lib/rawg/platforms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { gameService } from '@/lib/services/gameService';
import { EditStartedPlayingDate } from '@/components/games/EditStartedPlayingDate';
import { EditFinishedPlayingDate } from '@/components/games/EditFinishedPlayingDate';
import { ExpandableDescription } from '@/components/shared/ExpandableDescription';

interface GameDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function GameDetailPage({ params }: GameDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: game, isLoading, error, refetch } = useGameById(id);
  const { data: allGames } = useGames();
  const { data: currentUser } = useCurrentUser();
  const { data: allUsers } = useAllUsers();
  const updateRating = useUpdateGameRating();
  const deleteGame = useDeleteGame();

  // Estados de edición
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [editRating, setEditRating] = useState(7);
  const [editComment, setEditComment] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const platformNames = useMemo(() => {
    if (!game?.platforms || game?.platforms.length === 0) return [];
    return getPlatformNames(game?.platforms);
  }, [game?.platforms]);

  // Navegación entre juegos
  const { prevGame, nextGame } = useMemo(() => {
    if (!allGames || !game) return { prevGame: null, nextGame: null };

    const sortedGames = [...allGames].sort(
      (a, b) => {
        const aDate = a.startedPlayingDate || a.playedDate;
        const bDate = b.startedPlayingDate || b.playedDate;
        return bDate.toMillis() - aDate.toMillis();
      }
    );

    const currentIndex = sortedGames.findIndex((g) => g.id === game.id);

    return {
      prevGame: currentIndex > 0 ? sortedGames[currentIndex - 1] : null,
      nextGame: currentIndex < sortedGames.length - 1 ? sortedGames[currentIndex + 1] : null,
    };
  }, [allGames, game]);

  if (isLoading) {
    return <GameDetailSkeleton />;
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Juego no encontrado</h1>
          <p className="text-muted-foreground">
            No pudimos cargar los detalles de este juego
          </p>
          <Button onClick={() => router.push('/games')}>
            Volver a Juegos
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = getRAWGImageUrl(game.backgroundImage ?? null, 'medium');
  const backdropUrl = getRAWGImageUrl(game.backgroundImage ?? null, 'original');
  const year = game.released ? new Date(game.released).getFullYear() : '';

  const currentUserRating = currentUser ? game.ratings[currentUser.role] : undefined;
  const hasCurrentUserRating = currentUserRating !== undefined;

  const handleStartEdit = () => {
    if (currentUserRating) {
      setEditRating(currentUserRating.score);
      setEditComment(currentUserRating.comment || '');
    } else {
      setEditRating(7);
      setEditComment('');
    }
    setIsEditingRating(true);
  };

  const handleCancelEdit = () => {
    setIsEditingRating(false);
  };

  const handleSaveRating = async () => {
    if (!currentUser) return;

    try {
      await updateRating.mutateAsync({
        gameId: game.id,
        userRole: currentUser.role,
        score: editRating,
        comment: editComment || undefined,
      });

      toast.success(
        hasCurrentUserRating
          ? 'Valoración actualizada'
          : 'Valoración añadida'
      );
      setIsEditingRating(false);
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Error al guardar la valoración');
    }
  };

  const otherUserRole: UserRole = currentUser?.role === 'user_1' ? 'user_2' : 'user_1';
  const otherUserRating = game.ratings[otherUserRole];

  const handleUpdateStartedPlayingDate = async (newDate: Date) => {
    try {
      await gameService.updateStartedPlayingDate(game.id, newDate);
      toast.success('Fecha actualizada correctamente');
      refetch();
    } catch (error) {
      console.error('Error updating date:', error);
      toast.error('Error al actualizar la fecha');
      throw error;
    }
  };

  const handleUpdateFinishedPlayingDate = async (newDate: Date | null) => {
    try {
      await gameService.updateFinishedPlayingDate(game.id, newDate);
      toast.success('Fecha actualizada correctamente');
      refetch();
    } catch (error) {
      console.error('Error updating date:', error);
      toast.error('Error al actualizar la fecha');
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGame.mutateAsync(game.id);
      toast.success('Juego eliminado correctamente');
      router.push('/games');
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Error al eliminar el juego');
    }
  };

  const getOtherUserName = () => {
    if (!allUsers || !currentUser) return otherUserRole === 'user_1' ? 'Usuario 1' : 'Usuario 2';
    const otherUser = allUsers.find(u => u.role === otherUserRole);
    return otherUser ? getUserDisplayName(otherUser) : otherUserRole === 'user_1' ? 'Usuario 1' : 'Usuario 2';
  };

  // Usar startedPlayingDate si existe, sino playedDate
  const displayStartDate = game.startedPlayingDate || game.playedDate;

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop Header */}
      {backdropUrl && (
        <div className="relative h-64 sm:h-80 bg-muted">
          <img
            src={backdropUrl}
            alt={game.name}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 pb-12">
        {/* Breadcrumb y acciones */}
        <div className="mb-6 space-y-3">
          {/* Primera fila */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:bg-destructive/10 shrink-0"
            >
              <TrashIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
          </div>

          {/* Segunda fila */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => prevGame && router.push(`/games/${prevGame.id}`)}
                disabled={!prevGame}
                title="Juego anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nextGame && router.push(`/games/${nextGame.id}`)}
                disabled={!nextGame}
                title="Juego siguiente"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/games')}
              className="shrink-0"
            >
              Ver todos
            </Button>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="md:col-span-1">
            <div className="sticky top-4">
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted shadow-2xl">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GamepadIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Título */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{game.name}</h1>
              {year && (
                <p className="text-xl text-muted-foreground">{year}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm items-center">
              {displayStartDate && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Jugado el{' '}
                    {format(displayStartDate.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                  <EditStartedPlayingDate
                    currentDate={displayStartDate}
                    onSave={handleUpdateStartedPlayingDate}
                  />
                </div>
              )}

              {game.finishedPlayingDate && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Terminado el{' '}
                    {format(game.finishedPlayingDate.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                  <EditFinishedPlayingDate
                    currentDate={game.finishedPlayingDate}
                    onSave={handleUpdateFinishedPlayingDate}
                  />
                </div>
              )}

              {!game.finishedPlayingDate && displayStartDate && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateFinishedPlayingDate(new Date())}
                  >
                    + Añadir fecha de finalización
                  </Button>
                </div>
              )}

              {/* Plataformas */}
              {platformNames.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {platformNames.slice(0, 3).map((platform) => (
                    <span
                      key={platform}
                      className="px-2 py-1 rounded-full bg-muted text-xs"
                    >
                      {platform}
                    </span>
                  ))}
                  {platformNames.length > 3 && (
                    <button
                      onClick={() => setShowAllPlatforms(true)}
                      className="px-2 py-1 rounded-full bg-muted text-xs hover:bg-accent transition-colors cursor-pointer"
                    >
                      +{platformNames.length - 3}
                    </button>
                  )}
                </div>
              )}

              {/* Géneros */}
              {game.genres.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {game.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                  {game.genres.length > 3 && (
                    <button
                      onClick={() => setShowAllGenres(true)}
                      className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      +{game.genres.length - 3}
                    </button>
                  )}
                </div>
              )}

              {/* Metacritic */}
              {game.metacritic && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Metacritic:</span>
                  <span className="px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold">
                    {game.metacritic}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {game.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpandableDescription text={game.description} />
                </CardContent>
              </Card>
            )}

            {/* Ratings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Valoraciones</CardTitle>
                  {game.bothRated && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckIcon className="h-3 w-3 text-[#db6468]" />
                      Ambos habéis valorado
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current User Rating */}
                {currentUser && (
                  <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={currentUser.photoURL} alt={getUserDisplayName(currentUser)} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(currentUser)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <span className="font-medium">{getUserDisplayName(currentUser)}</span>
                          {hasCurrentUserRating && currentUserRating.ratedAt && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({format(currentUserRating.ratedAt.toDate(), "d MMM yyyy", { locale: es })})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!isEditingRating && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStartEdit}
                        >
                          <EditIcon className="h-3 w-3 mr-1" />
                          {hasCurrentUserRating ? 'Editar' : 'Añadir'}
                        </Button>
                      )}
                    </div>

                    {isEditingRating ? (
                      <div className="space-y-4">
                        <RatingInput
                          value={editRating}
                          onChange={setEditRating}
                          comment={editComment}
                          onCommentChange={setEditComment}
                          disabled={updateRating.isPending}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveRating}
                            disabled={updateRating.isPending}
                            className="flex-1"
                          >
                            {updateRating.isPending ? (
                              <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <CheckIcon className="h-4 w-4 mr-2" />
                                Guardar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateRating.isPending}
                          >
                            <XIcon className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : hasCurrentUserRating ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <StarIcon className="h-5 w-5 fill-primary text-primary" />
                          <span className="text-2xl font-bold">
                            {currentUserRating.score}/10
                          </span>
                        </div>
                        {currentUserRating.comment && (
                          <p className="text-sm text-muted-foreground italic">
                            {`"${currentUserRating.comment}"`}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aún no has valorado este juego
                      </p>
                    )}
                  </div>
                )}

                {/* Other User Rating */}
                {otherUserRating ? (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={allUsers?.find(u => u.role === otherUserRole)?.photoURL} 
                            alt={getOtherUserName()} 
                          />
                          <AvatarFallback className="text-xs">
                            {allUsers?.find(u => u.role === otherUserRole) 
                              ? getUserInitials(allUsers.find(u => u.role === otherUserRole)!)
                              : otherUserRole === 'user_1' ? 'U1' : 'U2'
                            }
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <span className="font-medium">{getOtherUserName()}</span>
                          {otherUserRating.ratedAt && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({format(otherUserRating.ratedAt.toDate(), "d MMM yyyy", { locale: es })})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <StarIcon className="h-5 w-5 fill-primary text-primary" />
                      <span className="text-2xl font-bold">
                        {otherUserRating.score}/10
                      </span>
                    </div>
                    
                    {otherUserRating.comment && (
                      <p className="text-sm text-muted-foreground italic">
                        {`"${otherUserRating.comment}"`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={allUsers?.find(u => u.role === otherUserRole)?.photoURL} 
                          alt={getOtherUserName()} 
                        />
                        <AvatarFallback className="text-xs">
                          {allUsers?.find(u => u.role === otherUserRole) 
                            ? getUserInitials(allUsers.find(u => u.role === otherUserRole)!)
                            : otherUserRole === 'user_1' ? 'U1' : 'U2'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{getOtherUserName()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Aún no ha valorado
                    </p>
                  </div>
                )}

                {/* Average */}
                {game.averageScore && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Puntuación media</span>
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-5 w-5 fill-[#db6468] text-[#db6468]" />
                        <span className="text-2xl font-bold">
                          {game.averageScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                    
                    {game.bothRated && game.ratings.user_1 && game.ratings.user_2 && (
                      <div className="mt-3 p-3 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Diferencia:</span>
                          <RatingDifferenceBadge
                            score1={game.ratings.user_1.score}
                            score2={game.ratings.user_2.score}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="¿Eliminar juego?"
        description={`¿Estás seguro de que quieres eliminar "${game.name}"? Esta acción no se puede deshacer y se eliminarán todas las valoraciones.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={deleteGame.isPending}
      />

      <Dialog open={showAllGenres} onOpenChange={setShowAllGenres}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Géneros de {game.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 p-4">
            {game.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAllPlatforms} onOpenChange={setShowAllPlatforms}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Plataformas de {game.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 p-4">
            {platformNames.map((platform) => (
              <span
                key={platform}
                className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium"
              >
                {platform}
              </span>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RatingDifferenceBadge({
  score1,
  score2,
}: {
  score1: number;
  score2: number;
}) {
  const difference = Math.abs(score1 - score2);
  
  let bgColor = 'bg-green-500/10 text-green-700 dark:text-green-400';
  let label = '¡Muy de acuerdo!';
  
  if (difference >= 4) {
    bgColor = 'bg-red-500/10 text-red-700 dark:text-red-400';
    label = 'Opiniones muy diferentes';
  } else if (difference >= 2) {
    bgColor = 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
    label = 'Algo de desacuerdo';
  } else if (difference >= 1) {
    bgColor = 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    label = 'Bastante de acuerdo';
  }
  
  return (
    <div className={`px-2 py-1 rounded-md text-xs font-medium ${bgColor}`}>
      {difference === 0 ? (
        '¡Totalmente de acuerdo! 🎯'
      ) : (
        <>
          {label} ({difference} {difference === 1 ? 'punto' : 'puntos'})
        </>
      )}
    </div>
  );
}

function GameDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-64 sm:h-80 w-full" />
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="aspect-[16/9] rounded-lg" />
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}