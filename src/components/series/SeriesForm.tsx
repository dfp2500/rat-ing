'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTMDBImageUrl } from '@/types/tmdb';
import { TMDBSeries } from '@/types/tmdb-series';
import { useSeriesDetails } from '@/lib/hooks/useTMDBSeries';
import { useCreateSeries } from '@/lib/hooks/useSeries';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { normalizeTMDBStatus } from '@/types/tmdb-series';
import { DatePicker } from '@/components/movies/DatePicker';
import { RatingInput } from '@/components/movies/RatingInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { StarIcon, CalendarIcon, CheckIcon, TvIcon, Loader2Icon } from 'lucide-react';
import { getWatchStatusLabel } from '@/types/series';

interface SeriesFormProps {
  series: TMDBSeries;
  onCancel: () => void;
}

export function SeriesForm({ series, onCancel }: SeriesFormProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const createSeries = useCreateSeries();
  
  // Obtener detalles completos de la serie
  const { data: seriesDetails, isLoading: detailsLoading } = useSeriesDetails(series.id);

  // Estados del formulario
  const [startedWatchingDate, setStartedWatchingDate] = useState(new Date());
  const [watchStatus, setWatchStatus] = useState<'watching' | 'completed' | 'dropped' | 'plan_to_watch'>('watching');
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [rateNow, setRateNow] = useState(false);
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState<string>("");

  const posterUrl = getTMDBImageUrl(series.poster_path, 'w500');
  const year = series.first_air_date ? new Date(series.first_air_date).getFullYear() : '';

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
        currentSeason: watchStatus === 'watching' ? currentSeason : undefined,
        currentEpisode: watchStatus === 'watching' ? currentEpisode : undefined,
        addedBy: currentUser.id,
        startedWatchingDate,
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
            <Select value={watchStatus} onValueChange={(value: any) => setWatchStatus(value)}>
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

          {/* Progreso (solo si está "watching") */}
          {watchStatus === 'watching' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentSeason">Temporada actual</Label>
                <Input
                  id="currentSeason"
                  type="number"
                  min="1"
                  max={seriesDetails.number_of_seasons}
                  value={currentSeason}
                  onChange={(e) => setCurrentSeason(parseInt(e.target.value) || 1)}
                  disabled={createSeries.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentEpisode">Episodio actual</Label>
                <Input
                  id="currentEpisode"
                  type="number"
                  min="1"
                  value={currentEpisode}
                  onChange={(e) => setCurrentEpisode(parseInt(e.target.value) || 1)}
                  disabled={createSeries.isPending}
                />
              </div>
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
              <TabsTrigger value="now">Valorar ahora</TabsTrigger>
            </TabsList>

            <TabsContent value="later" className="space-y-4 pt-4">
              <div className="text-center py-8 text-muted-foreground">
                <CheckIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  La serie se añadirá sin valoración.
                  <br />
                  Podrás valorarla más tarde desde su página de detalle.
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