'use client';

import { use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSeriesById, useUpdateSeriesRating, useUpdateSeriesProgress, useSeries, useDeleteSeries } from '@/lib/hooks/useSeries';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { getTMDBImageUrl } from '@/types/tmdb';
import { getWatchStatusLabel } from '@/types/series';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingInput } from '@/components/movies/RatingInput';
import { 
  ArrowLeftIcon, 
  TvIcon, 
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
import { getGenreNames } from '@/lib/tmdb/genres';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { seriesService } from '@/lib/services/seriesService';
import { EditStartedWatchingDate } from '@/components/series/EditStartedWatchingDate';
import { EditFinishedWatchingDate } from '@/components/series/EditFinishedWatchingDate';

interface SeriesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: series, isLoading, error, refetch } = useSeriesById(id);
  const { data: allSeries } = useSeries();
  const { data: currentUser } = useCurrentUser();
  const { data: allUsers } = useAllUsers();
  const updateRating = useUpdateSeriesRating();
  const updateProgress = useUpdateSeriesProgress();
  const deleteSeries = useDeleteSeries();

  // Estados de edición
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [editRating, setEditRating] = useState(7);
  const [editComment, setEditComment] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [editProgress, setEditProgress] = useState({
    watchStatus: series?.watchStatus || 'watching' as const,
    currentSeason: series?.currentSeason || 1,
    currentEpisode: series?.currentEpisode || 1,
  });

  const genreNames = useMemo(() => {
    if (!series?.genres || series?.genres.length === 0) return [];
    return getGenreNames(series?.genres);
  }, [series?.genres]);

  // Navegación entre series
  const { prevSeries, nextSeries } = useMemo(() => {
    if (!allSeries || !series) return { prevSeries: null, nextSeries: null };

    const sortedSeries = [...allSeries].sort(
      (a, b) => b.startedWatchingDate.toMillis() - a.startedWatchingDate.toMillis()
    );

    const currentIndex = sortedSeries.findIndex((s) => s.id === series.id);

    return {
      prevSeries: currentIndex > 0 ? sortedSeries[currentIndex - 1] : null,
      nextSeries: currentIndex < sortedSeries.length - 1 ? sortedSeries[currentIndex + 1] : null,
    };
  }, [allSeries, series]);

  if (isLoading) {
    return <SeriesDetailSkeleton />;
  }

  if (error || !series) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Serie no encontrada</h1>
          <p className="text-muted-foreground">
            No pudimos cargar los detalles de esta serie
          </p>
          <Button onClick={() => router.push('/series')}>
            Volver a Series
          </Button>
        </div>
      </div>
    );
  }

  const posterUrl = getTMDBImageUrl(series.posterPath ?? null, 'w500');
  const backdropUrl = getTMDBImageUrl(series.backdropPath ?? null, 'original');
  const year = series.firstAirDate ? new Date(series.firstAirDate).getFullYear() : '';

  const currentUserRating = currentUser ? series.ratings[currentUser.role] : undefined;
  const hasCurrentUserRating = currentUserRating !== undefined;

  const handleStartEdit = () => {
    // VALIDACIÓN: Si la serie está pendiente, no permitimos editar
    if (series.watchStatus === 'plan_to_watch') {
        toast.error('No puedes valorar una serie que aún no has empezado a ver');
        return;
    }

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
        seriesId: series.id,
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

  const handleOpenProgressDialog = () => {
    setEditProgress({
      watchStatus: series.watchStatus,
      currentSeason: series.currentSeason || 1,
      currentEpisode: series.currentEpisode || 1,
    });
    setShowProgressDialog(true);
  };

  const handleSaveProgress = async () => {
    try {
      await updateProgress.mutateAsync({
        seriesId: series.id,
        ...editProgress,
      });

      toast.success('Progreso actualizado correctamente');
      setShowProgressDialog(false);
      refetch();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Error al actualizar el progreso');
    }
  };

  const otherUserRole: UserRole = currentUser?.role === 'user_1' ? 'user_2' : 'user_1';
  const otherUserRating = series.ratings[otherUserRole];

  const handleUpdateStartedWatchingDate = async (newDate: Date) => {
      try {
        await seriesService.updateStartedWatchingDate(series.id, newDate);
        toast.success('Fecha actualizada correctamente');
        // Refrescar los datos de la serie
        refetch();
      } catch (error) {
        console.error('Error updating date:', error);
        toast.error('Error al actualizar la fecha');
        throw error;
      }
    };

    const handleUpdateFinishedWatchingDate = async (newDate: Date) => {
        try {
            await seriesService.updateFinishedWatchingDate(series.id, newDate);
            toast.success('Fecha actualizada correctamente');
            // Refrescar los datos de la serie
            refetch();
        } catch (error) {
            console.error('Error updating date:', error);
            toast.error('Error al actualizar la fecha');
            throw error;
        }
    };

  const handleDelete = async () => {
    try {
      await deleteSeries.mutateAsync(series.id);
      toast.success('Serie eliminada correctamente');
      router.push('/series');
    } catch (error) {
      console.error('Error deleting series:', error);
      toast.error('Error al eliminar la serie');
    }
  };

  const getOtherUserName = () => {
    if (!allUsers || !currentUser) return otherUserRole === 'user_1' ? 'Usuario 1' : 'Usuario 2';
    const otherUser = allUsers.find(u => u.role === otherUserRole);
    return otherUser ? getUserDisplayName(otherUser) : otherUserRole === 'user_1' ? 'Usuario 1' : 'Usuario 2';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop Header */}
      {backdropUrl && (
        <div className="relative h-64 sm:h-80 bg-muted">
          <img
            src={backdropUrl}
            alt={series.title}
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
                onClick={() => prevSeries && router.push(`/series/${prevSeries.id}`)}
                disabled={!prevSeries}
                title="Serie anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nextSeries && router.push(`/series/${nextSeries.id}`)}
                disabled={!nextSeries}
                title="Serie siguiente"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/series')}
              className="shrink-0"
            >
              Ver todas
            </Button>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="md:col-span-1">
            <div className="sticky top-4">
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-2xl">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={series.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TvIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Título */}
            <div>
              <h1 className="text-4xl font-bold mb-2">{series.title}</h1>
              {year && (
                <p className="text-xl text-muted-foreground">{year}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm items-center">
              {series.startedWatchingDate && series.watchStatus !== 'plan_to_watch' && (
                <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                    Empezada el{' '}
                    {format(series.startedWatchingDate.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
                <EditStartedWatchingDate
                    currentDate={series.startedWatchingDate}
                    onSave={handleUpdateStartedWatchingDate}
                />
                </div>
            )}

            {/* Lógica Fecha de Fin: Si no es null Y el estado es 'completed' o 'dropped' */}
            {series.finishedWatchingDate && (series.watchStatus === 'completed' || series.watchStatus === 'dropped') && (
                <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                    {series.watchStatus === 'dropped' ? 'Abandonada el ' : 'Terminada el '}
                    {format(series.finishedWatchingDate.toDate(), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
                <EditFinishedWatchingDate
                    currentDate={series.finishedWatchingDate}
                    onSave={handleUpdateFinishedWatchingDate}
                />
                </div>
            )}

              {/* Estado de visualización */}
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {getWatchStatusLabel(series.watchStatus)}
              </div>

              {/* Géneros */}
              {genreNames.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {genreNames.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-1 rounded-full bg-muted text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                  {genreNames.length > 3 && (
                    <button
                      onClick={() => setShowAllGenres(true)}
                      className="px-2 py-1 rounded-full bg-muted text-xs hover:bg-accent transition-colors cursor-pointer"
                    >
                      +{genreNames.length - 3}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Progreso */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                    <CardTitle>Progreso</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenProgressDialog}
                    >
                        <EditIcon className="h-3 w-3 mr-2" />
                        Editar
                    </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Temporadas</p>
                        <p className="text-2xl font-bold">
                        {/* ✨ ACTUALIZADO: Mostrar "-" si es plan_to_watch */}
                        {series.watchStatus === 'plan_to_watch' 
                            ? '-' 
                            : series.currentSeason || '-'
                        } / {series.numberOfSeasons}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Episodios</p>
                        <p className="text-2xl font-bold">
                        {/* ✨ ACTUALIZADO: Mostrar "-" si es plan_to_watch */}
                        {series.watchStatus === 'plan_to_watch' 
                            ? '-' 
                            : series.currentEpisode || '-'
                        } / {series.numberOfEpisodes}
                        </p>
                    </div>
                    </div>
                    
                    {/* ✨ NUEVO: Barra de progreso visual */}
                    {series.watchStatus !== 'plan_to_watch' && series.numberOfEpisodes > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progreso total</span>
                        <span>
                            {Math.round(((series.currentEpisode || 0) / series.numberOfEpisodes) * 100)}%
                        </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ 
                            width: `${Math.min(100, ((series.currentEpisode || 0) / series.numberOfEpisodes) * 100)}%` 
                            }}
                        />
                        </div>
                    </div>
                    )}
                </CardContent>
            </Card>

            {/* Overview */}
            {series.overview && (
              <Card>
                <CardHeader>
                  <CardTitle>Sinopsis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{series.overview}</p>
                </CardContent>
              </Card>
            )}

            {/* Ratings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Valoraciones</CardTitle>
                  {series.bothRated && (
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
                        <div className="flex flex-col items-end gap-1">
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartEdit}
                            // ✨ Deshabilitar visualmente el botón
                            disabled={series.watchStatus === 'plan_to_watch'}
                            >
                            <EditIcon className="h-3 w-3 mr-1" />
                            {hasCurrentUserRating ? 'Editar' : 'Añadir'}
                            </Button>
                            
                            {/* ✨ Mostrar aviso si está pendiente */}
                            {series.watchStatus === 'plan_to_watch' && (
                            <span className="text-[10px] text-muted-foreground italic">
                                Debes empezar la serie para valorarla
                            </span>
                            )}
                        </div>
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
                        Aún no has valorado esta serie
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
                {series.averageScore && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Puntuación media</span>
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-5 w-5 fill-[#db6468] text-[#db6468]" />
                        <span className="text-2xl font-bold">
                          {series.averageScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                    
                    {series.bothRated && series.ratings.user_1 && series.ratings.user_2 && (
                      <div className="mt-3 p-3 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Diferencia:</span>
                          <RatingDifferenceBadge
                            score1={series.ratings.user_1.score}
                            score2={series.ratings.user_2.score}
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
        title="¿Eliminar serie?"
        description={`¿Estás seguro de que quieres eliminar "${series.title}"? Esta acción no se puede deshacer y se eliminarán todas las valoraciones.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={deleteSeries.isPending}
      />

      <Dialog open={showAllGenres} onOpenChange={setShowAllGenres}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Géneros de {series.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 p-4">
            {genreNames.map((genre) => (
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

      {/* Dialog de edición de progreso */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Editar Progreso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Estado de visualización</Label>
                <Select 
                value={editProgress.watchStatus} 
                onValueChange={(value: any) => {
                    setEditProgress(prev => ({ ...prev, watchStatus: value }));
                }}
                >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="watching">Viendo</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="dropped">Abandonada</SelectItem>
                    <SelectItem value="plan_to_watch">Pendiente</SelectItem>
                </SelectContent>
                </Select>
                
                {/* ✨ NUEVO: Mensaje informativo según el estado */}
                {editProgress.watchStatus === 'completed' && (
                <p className="text-xs text-muted-foreground">
                    ✅ Se marcará automáticamente como {series.numberOfSeasons}/{series.numberOfSeasons} temporadas y {series.numberOfEpisodes}/{series.numberOfEpisodes} episodios
                </p>
                )}
                {editProgress.watchStatus === 'plan_to_watch' && (
                <p className="text-xs text-muted-foreground">
                    ℹ️ El progreso se reiniciará
                </p>
                )}
                {editProgress.watchStatus === 'dropped' && (
                <p className="text-xs text-muted-foreground">
                    ⏸️ Se mantendrá el progreso actual
                </p>
                )}
            </div>

            {/* ✨ ACTUALIZADO: Solo mostrar campos si está "watching" */}
            {editProgress.watchStatus === 'watching' && (
                <>
                <div className="space-y-2">
                    <Label htmlFor="editSeason">
                    Temporada actual (máx: {series.numberOfSeasons})
                    </Label>
                    <Input
                    id="editSeason"
                    type="number"
                    min="1"
                    max={series.numberOfSeasons}
                    value={editProgress.currentSeason}
                    onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        // ✨ VALIDACIÓN en tiempo real
                        const clampedValue = Math.max(1, Math.min(value, series.numberOfSeasons));
                        setEditProgress(prev => ({ ...prev, currentSeason: clampedValue }));
                    }}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="editEpisode">
                    Episodio actual (máx: {series.numberOfEpisodes})
                    </Label>
                    <Input
                    id="editEpisode"
                    type="number"
                    min="1"
                    max={series.numberOfEpisodes}
                    value={editProgress.currentEpisode}
                    onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        // ✨ VALIDACIÓN en tiempo real
                        const clampedValue = Math.max(1, Math.min(value, series.numberOfEpisodes));
                        setEditProgress(prev => ({ ...prev, currentEpisode: clampedValue }));
                    }}
                    />
                </div>
                </>
            )}
            </div>
            <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                Cancelar
            </Button>
            <Button onClick={handleSaveProgress} disabled={updateProgress.isPending}>
                {updateProgress.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
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

function SeriesDetailSkeleton() {
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