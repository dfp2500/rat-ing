'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TMDBMovie, getTMDBImageUrl } from '@/types/tmdb';
import { useCreateMovie } from '@/lib/hooks/useMovies';
import { useCurrentUser } from '@/lib/hooks/useUser';
import { DatePicker } from './DatePicker';
import { RatingInput } from './RatingInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { StarIcon, CalendarIcon, CheckIcon } from 'lucide-react';

interface MovieFormProps {
  movie: TMDBMovie;
  onCancel: () => void;
}

export function MovieForm({ movie, onCancel }: MovieFormProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const createMovie = useCreateMovie();

  // Estados del formulario
  const [watchedDate, setWatchedDate] = useState(new Date());
  const [rateNow, setRateNow] = useState(false);
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState<string>("");

  const posterUrl = getTMDBImageUrl(movie.poster_path, 'w500');
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('No se pudo identificar el usuario');
      return;
    }

    try {
      const newMovie = await createMovie.mutateAsync({
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path || undefined,
        backdropPath: movie.backdrop_path || undefined,
        releaseDate: movie.release_date,
        genres: movie.genre_ids.map(id => String(id)), // ← IMPORTANTE: Convertir a strings
        overview: movie.overview,
        addedBy: currentUser.id,
        watchedDate,
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
          ? `¡"${movie.title}" añadida con tu valoración!`
          : `¡"${movie.title}" añadida! Podrás valorarla más tarde.`
      );

      router.push(`/movies/${newMovie.id}`);
    } catch (error) {
      console.error('Error adding movie:', error);
      toast.error('Error al añadir la película. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview de la película */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Poster */}
            <div className="flex-shrink-0">
              <div className="w-32 h-48 rounded-lg overflow-hidden bg-muted">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <CalendarIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-1">{movie.title}</h2>
              {year && (
                <p className="text-muted-foreground mb-3">{year}</p>
              )}
              
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <StarIcon className="h-4 w-4 fill-[#db6468] text-[#db6468]" />
                  <span className="text-sm font-medium">
                    {movie.vote_average.toFixed(1)} / 10
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({movie.vote_count.toLocaleString()} votos)
                  </span>
                </div>
              )}

              {movie.overview && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {movie.overview}
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
          {/* Fecha vista */}
          <DatePicker
            date={watchedDate}
            onDateChange={setWatchedDate}
            disabled={createMovie.isPending}
          />

          <Separator />

          {/* Tabs: Valorar ahora o después */}
          <Tabs
            value={rateNow ? 'now' : 'later'}
            onValueChange={(value) => setRateNow(value === 'now')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="later">
                Valorar después
              </TabsTrigger>
              <TabsTrigger value="now">
                Valorar ahora
              </TabsTrigger>
            </TabsList>

            <TabsContent value="later" className="space-y-4 pt-4">
              <div className="text-center py-8 text-muted-foreground">
                <CheckIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  La película se añadirá sin valoración.
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
                disabled={createMovie.isPending}
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
          disabled={createMovie.isPending}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMovie.isPending}
        >
          {createMovie.isPending ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Guardando...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              {rateNow ? 'Añadir con valoración' : 'Añadir película'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}