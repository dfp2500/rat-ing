'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useMovie } from '@/lib/hooks/useMovies';
import { getTMDBImageUrl } from '@/types/tmdb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon, CalendarIcon, StarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MovieDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: movie, isLoading, error } = useMovie(id);

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
          <Button onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const posterUrl = getTMDBImageUrl(movie.posterPath ?? null, 'w500');
  const backdropUrl = getTMDBImageUrl(movie.backdropPath ?? null, 'original');
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';

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
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        {/* Header con botón atrás */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver
          </Button>
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
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                    Visto el{' '}
                    {movie.watchedDate ? format(movie.watchedDate.toDate(), "d 'de' MMMM 'de' yyyy", {
                        locale: es,
                    }) : 'Fecha desconocida'}
                </span>
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
                <CardTitle>Valoraciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User 1 Rating */}
                {movie.ratings.user_1 ? (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Usuario 1</span>
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-lg font-bold">
                          {movie.ratings.user_1.score}/10
                        </span>
                      </div>
                    </div>
                    {movie.ratings.user_1.comment && (
                      <p className="text-sm text-muted-foreground">
                       {`"${movie.ratings.user_1.comment}"`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                      Usuario 1 aún no ha valorado esta película
                    </p>
                  </div>
                )}

                {/* User 2 Rating */}
                {movie.ratings.user_2 ? (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Usuario 2</span>
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-lg font-bold">
                          {movie.ratings.user_2.score}/10
                        </span>
                      </div>
                    </div>
                    {movie.ratings.user_2.comment && (
                      <p className="text-sm text-muted-foreground">
                        {`"${movie.ratings.user_2.comment}"`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                      Usuario 2 aún no ha valorado esta película
                    </p>
                  </div>
                )}

                {/* Average */}
                {movie.averageScore && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Puntuación media</span>
                      <div className="flex items-center gap-2">
                        <StarIcon className="h-5 w-5 fill-amber-500 text-amber-500" />
                        <span className="text-2xl font-bold">
                          {movie.averageScore.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
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