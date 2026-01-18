'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMovie, useUpdateRating, useMovies } from '@/lib/hooks/useMovies';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { movieService } from '@/lib/services/movieService';
import { getTMDBImageUrl } from '@/types/tmdb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingInput } from '@/components/movies/RatingInput';
import { EditWatchedDate } from '@/components/movies/EditWatchedDate';
import { ArrowLeftIcon, CalendarIcon, StarIcon, EditIcon, CheckIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { UserRole } from '@/types/user';

interface MovieDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: movie, isLoading, error, refetch } = useMovie(id);
  const { data: allMovies } = useMovies();
  const { data: currentUser } = useCurrentUser();
  const updateRating = useUpdateRating();

  // Estados de edición
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [editRating, setEditRating] = useState(7);
  const [editComment, setEditComment] = useState('');

  // Navegación entre películas
  const { prevMovie, nextMovie } = useMemo(() => {
    if (!allMovies || !movie) return { prevMovie: null, nextMovie: null };

    const sortedMovies = [...allMovies].sort(
      (a, b) => b.watchedDate.toMillis() - a.watchedDate.toMillis()
    );

    const currentIndex = sortedMovies.findIndex((m) => m.id === movie.id);

    return {
      prevMovie: currentIndex > 0 ? sortedMovies[currentIndex - 1] : null,
      nextMovie: currentIndex < sortedMovies.length - 1 ? sortedMovies[currentIndex + 1] : null,
    };
  }, [allMovies, movie]);

  if (isLoading) {
    return <MovieDetailSkeleton />;
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Película no encontrada</h1>
          <p className="text-muted-foreground">
            No pudimos cargar los detalles de esta película
          </p>
          <Button onClick={() => router.push('/movies')}>
            Volver a Películas
          </Button>
        </div>
      </div>
    );
  }

  const posterUrl = getTMDBImageUrl(movie.posterPath ?? null, 'w500');
  const backdropUrl = getTMDBImageUrl(movie.backdropPath ?? null, 'original');
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';

  const currentUserRating = currentUser ? movie.ratings[currentUser.role] : undefined;
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
        movieId: movie.id,
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
  const otherUserRating = movie.ratings[otherUserRole];

  const handleUpdateWatchedDate = async (newDate: Date) => {
    try {
      await movieService.updateWatchedDate(movie.id, newDate);
      toast.success('Fecha actualizada correctamente');
      // Refrescar los datos de la película
      refetch();
    } catch (error) {
      console.error('Error updating date:', error);
      toast.error('Error al actualizar la fecha');
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop Header */}
      {backdropUrl && (
        <div className="relative h-64 sm:h-80 bg-muted">
          <img
            src={backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 pb-12">
        {/* Breadcrumb y acciones */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex gap-2">
            {/* Navegación entre películas */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => prevMovie && router.push(`/movies/${prevMovie.id}`)}
                disabled={!prevMovie}
                title="Película anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nextMovie && router.push(`/movies/${nextMovie.id}`)}
                disabled={!nextMovie}
                title="Película siguiente"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/movies')}
            >
              Ver todas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="md:col-span-1">
            <div className="sticky top-4">
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-2xl">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CalendarIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Título */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
              {year && (
                <p className="text-xl text-muted-foreground">{year}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm items-center">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  Visto el{' '}
                  {movie.watchedDate && typeof movie.watchedDate.toDate === 'function'
                    ? format(movie.watchedDate.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es })
                    : 'Fecha desconocida'}
                </span>
                <EditWatchedDate
                  currentDate={movie.watchedDate}
                  onSave={handleUpdateWatchedDate}
                />
              </div>

              {movie.genres.length > 0 && (
                <div className="flex gap-2">
                  {movie.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-1 rounded-full bg-muted text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Overview */}
            {movie.overview && (
              <Card>
                <CardHeader>
                  <CardTitle>Sinopsis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{movie.overview}</p>
                </CardContent>
              </Card>
            )}

            {/* Ratings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Valoraciones</CardTitle>
                  {movie.bothRated && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckIcon className="h-3 w-3 text-green-500" />
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Tu valoración</span>
                        {hasCurrentUserRating && currentUserRating.ratedAt && (
                          <span className="text-xs text-muted-foreground">
                            ({format(currentUserRating.ratedAt.toDate(), "d MMM yyyy", { locale: es })})
                          </span>
                        )}
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
                        Aún no has valorado esta película
                      </p>
                    )}
                  </div>
                )}

                {/* Other User Rating */}
                {otherUserRating ? (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {otherUserRole === 'user_1' ? 'Usuario 1' : 'Usuario 2'}
                        </span>
                        {hasCurrentUserRating && currentUserRating.ratedAt && (
                          <span className="text-xs text-muted-foreground">
                            ({format(currentUserRating.ratedAt.toDate(), "d MMM yyyy", { locale: es })})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-lg font-bold">
                          {otherUserRating.score}/10
                        </span>
                      </div>
                    </div>
                    {otherUserRating.comment && (
                      <p className="text-sm text-muted-foreground">
                        {`"${otherUserRating.comment}"`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                      {otherUserRole === 'user_1' ? 'Usuario 1' : 'Usuario 2'} aún no ha valorado
                    </p>
                  </div>
                )}

                {/* Average */}
                {movie.averageScore && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Puntuación media</span>
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-5 w-5 fill-amber-500 text-amber-500" />
                        <span className="text-2xl font-bold">
                          {movie.averageScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                    
                    {/* Diferencia entre ratings */}
                    {movie.bothRated && movie.ratings.user_1 && movie.ratings.user_2 && (
                      <div className="mt-3 p-3 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Diferencia:</span>
                          <RatingDifferenceBadge
                            score1={movie.ratings.user_1.score}
                            score2={movie.ratings.user_2.score}
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

function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Skeleton className="h-64 sm:h-80 w-full" />
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="aspect-[2/3] rounded-lg" />
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