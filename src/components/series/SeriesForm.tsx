'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTMDBImageUrl } from '@/types/tmdb';
import { TMDBSeries } from '@/types/tmdb-series';
import { useSeriesDetails } from '@/lib/hooks/useTMDBSeries';
import { useCreateSeries, useSeriesExists } from '@/lib/hooks/useSeries';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { normalizeTMDBStatus } from '@/types/tmdb-series';
import { DatePicker } from '@/components/shared/DatePicker';
import { RatingInput } from '@/components/movies/RatingInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { StarIcon, CalendarIcon, CheckIcon, TvIcon, Loader2Icon, AlertCircleIcon } from 'lucide-react';
import { getWatchStatusLabel } from '@/types/series';

interface SeriesFormProps {
  series: TMDBSeries;
  onCancel: () => void;
}

export function SeriesForm({ series, onCancel }: SeriesFormProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const createSeries = useCreateSeries();
  
  const { data: existingSeries, isLoading: checkingExists } = useSeriesExists(series.id);

  // Obtener detalles completos de la serie
  const { data: seriesDetails, isLoading: detailsLoading } = useSeriesDetails(series.id);

  // Estados del formulario
  const [startedWatchingDate, setStartedWatchingDate] = useState(new Date());
  const [finishedWatchingDate, setFinishedWatchingDate] = useState(new Date());
  const [watchStatus, setWatchStatus] = useState<'watching' | 'completed' | 'dropped' | 'plan_to_watch'>('watching');
  const [userSeason, setUserSeason] = useState<number>(1);
  const [userEpisode, setUserEpisode] = useState<number>(1);
  const [rateNow, setRateNow] = useState(false);
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState<string>("");

  const posterUrl = getTMDBImageUrl(series.poster_path, 'w500');
  const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : '';

  // ✨ DERIVAR el progreso según el estado (sin useEffect)
  const currentSeason = watchStatus === 'completed' && seriesDetails
    ? seriesDetails.number_of_seasons
    : userSeason;
  
  const currentEpisode = watchStatus === 'completed' && seriesDetails
    ? seriesDetails.number_of_episodes
    : userEpisode;

  if (existingSeries && !checkingExists) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-500/10">
              <AlertCircleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Esta serie ya existe
              </h3>
              <p className="text-sm text-amber-800/80 dark:text-amber-400/80 mb-4">
                Ya has añadido &quot;{series.name}&quot; anteriormente. ¿Quieres ir a su página de detalle?
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => router.push(`/series/${existingSeries.id}`)} 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-500/50 hover:bg-amber-500/10"
                >
                  Ver Serie
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
    if (!currentUser || !seriesDetails) {
      toast.error('No se pudo identificar el usuario o cargar detalles');
      return;
    }

    try {
      const newSeries = await createSeries.mutateAsync({
        tmdbId: series.id,
        title: series.name,
        originalTitle: series.original_name,
        posterPath: series.poster_path || undefined,
        backdropPath: series.backdrop_path || undefined,
        firstAirDate: series.first_air_date,
        lastAirDate: seriesDetails.last_air_date || undefined,
        genres: series.genre_ids.map(id => String(id)),
        overview: series.overview,
        status: normalizeTMDBStatus(seriesDetails.status),
        watchStatus,
        numberOfSeasons: seriesDetails.number_of_seasons,
        numberOfEpisodes: seriesDetails.number_of_episodes,
        // ✨ ACTUALIZADO: Incluir progreso según el estado
        currentSeason: (watchStatus === 'watching' || watchStatus === 'dropped' || watchStatus === 'completed') ? currentSeason : undefined,
        currentEpisode: (watchStatus === 'watching' || watchStatus === 'dropped' || watchStatus === 'completed') ? currentEpisode : undefined,
        addedBy: currentUser.id,
        startedWatchingDate,
        // ✨ NUEVO: Incluir fecha de finalización si corresponde
        finishedWatchingDate: (watchStatus === 'completed' || watchStatus === 'dropped') ? finishedWatchingDate : undefined,
        initialRating: rateNow
          ? {
              userRole: currentUser.role,
              score: rating,
              comment: comment.trim() || "",
            }
          : undefined,
      });

      toast.success(
        rateNow
          ? `¡"${series.name}" añadida con tu valoración!`
          : `¡"${series.name}" añadida! Podrás valorarla más tarde.`
      );

      router.push(`/series/${newSeries.id}`);
    } catch (error) {
      console.error('Error adding series:', error);
      toast.error('Error al añadir la serie. Inténtalo de nuevo.');
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

  if (!seriesDetails) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar los detalles de la serie
        </p>
        <Button onClick={onCancel} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview de la serie */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-48 rounded-lg overflow-hidden bg-muted">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={series.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <TvIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1">{series.name}</h2>
              {year && (
                <p className="text-muted-foreground mb-3">{year}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <TvIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{seriesDetails.number_of_seasons} temporadas</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{seriesDetails.number_of_episodes} episodios</span>
                </div>
              </div>
              
              {series.vote_average > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
                  <span className="text-sm font-medium">
                    {series.vote_average.toFixed(1)} / 10
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({series.vote_count.toLocaleString()} votos)
                  </span>
                </div>
              )}

              {series.overview && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {series.overview}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de visualización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fecha de inicio */}
          <DatePicker
            date={startedWatchingDate}
            onDateChange={setStartedWatchingDate}
            label="Fecha de inicio"
            disabled={createSeries.isPending}
          />

          <Separator />

          {/* Estado de visualización */}
          <div className="space-y-2">
            <Label>Estado de visualización</Label>
            <Select 
                value={watchStatus} 
                onValueChange={(value: any) => {
                setWatchStatus(value);
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
          </div>

          {/* ✨ NUEVO: Fecha de finalización (solo para completed/dropped) */}
          {(watchStatus === 'completed' || watchStatus === 'dropped') && (
            <>
              <Separator />
              <DatePicker
                date={finishedWatchingDate}
                onDateChange={setFinishedWatchingDate}
                label={watchStatus === 'completed' ? 'Fecha de finalización' : 'Fecha de abandono'}
                disabled={createSeries.isPending}
              />
            </>
          )}

          {/* ✨ ACTUALIZADO: Progreso (para watching y dropped) */}
          {(watchStatus === 'watching' || watchStatus === 'dropped') && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentSeason">Temporada actual</Label>
                  <Input
                    id="currentSeason"
                    type="number"
                    min="1"
                    max={seriesDetails.number_of_seasons}
                    value={userSeason}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setUserSeason(Math.max(1, Math.min(value, seriesDetails.number_of_seasons)));
                    }}
                    disabled={createSeries.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentEpisode">Episodio actual</Label>
                  <Input
                    id="currentEpisode"
                    type="number"
                    min="1"
                    max={seriesDetails.number_of_episodes}
                    value={userEpisode}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setUserEpisode(Math.max(1, Math.min(value, seriesDetails.number_of_episodes)));
                    }}
                    disabled={createSeries.isPending}
                  />
                </div>
              </div>
            </>
          )}

          {/* ✨ NUEVO: Mensajes informativos según el estado */}
          {watchStatus === 'completed' && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✅ Se marcará automáticamente como {seriesDetails.number_of_seasons}/{seriesDetails.number_of_seasons} temporadas y {seriesDetails.number_of_episodes}/{seriesDetails.number_of_episodes} episodios completados
              </p>
            </div>
          )}

          {watchStatus === 'dropped' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                ⏸️ Se guardará el progreso actual: Temporada {userSeason}, Episodio {userEpisode}
              </p>
            </div>
          )}

          {watchStatus === 'plan_to_watch' && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                ℹ️ Las series pendientes no tienen progreso asociado hasta que comiences a verlas
              </p>
            </div>
          )}

          <Separator />

          {/* Valoración */}
            <Tabs
            value={rateNow ? 'now' : 'later'}
            onValueChange={(value) => setRateNow(value === 'now')}
            >
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="later">Valorar después</TabsTrigger>
                <TabsTrigger 
                value="now" 
                disabled={watchStatus === 'plan_to_watch'}
                title={watchStatus === 'plan_to_watch' ? "No puedes valorar una serie pendiente" : ""}
                >
                Valorar ahora
                </TabsTrigger>
            </TabsList>

            <TabsContent value="later" className="space-y-4 pt-4">
                <div className="text-center py-8 text-muted-foreground">
                <CheckIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                    {watchStatus === 'plan_to_watch' 
                    ? 'Las series pendientes se añaden sin valoración.' 
                    : 'La serie se añadirá sin valoración.'}
                    <br />
                    Podrás valorarla cuando empieces a verla.
                </p>
                </div>
            </TabsContent>

            <TabsContent value="now" className="space-y-4 pt-4">
                <RatingInput
                value={rating}
                onChange={setRating}
                comment={comment}
                onCommentChange={setComment}
                disabled={createSeries.isPending}
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
          disabled={createSeries.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createSeries.isPending}
        >
          {createSeries.isPending ? (
            <>
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              {rateNow ? 'Añadir con valoración' : 'Añadir serie'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}