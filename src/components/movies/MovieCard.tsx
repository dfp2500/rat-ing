'use client';

import { memo } from 'react';
import { Movie } from '@/types/movie';
import { UserRole } from '@/types/user';
import { getTMDBImageUrl } from '@/types/tmdb';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { StarIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  currentUserRole?: UserRole;
  onClick?: () => void;
}

export const MovieCard = memo(function MovieCard({ 
  movie, 
  currentUserRole, 
  onClick 
}: MovieCardProps) {
  const posterUrl = getTMDBImageUrl(movie.posterPath ?? null, 'w342');
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';
  
  const hasUserRating = currentUserRole 
    ? movie.ratings[currentUserRole] !== undefined 
    : false;

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.03] p-0"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        <OptimizedImage
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full"
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <CalendarIcon className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
          }
        />

        {/* Badges overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {!hasUserRating && (
            <div className="px-2 py-1 rounded-md bg-amber-500/90 text-white text-xs font-medium backdrop-blur-sm">
              Pendiente
            </div>
          )}

          {movie.averageScore && (
            <div className="px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1">
              <StarIcon className="h-3 w-3 fill-amber-500 text-amber-500" />
              {movie.averageScore.toFixed(1)}
            </div>
          )}
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold line-clamp-2 transition-colors group-hover:text-primary">
            {movie.title}
          </h3>
          {year && (
            <p className="text-sm text-muted-foreground">{year}</p>
          )}
        </div>

        {/* Watched date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3" />
          <span>
            {format(movie.watchedDate.toDate(), "d 'de' MMM 'de' yyyy", {
              locale: es,
            })}
          </span>
        </div>

        {/* Ratings */}
        <div className="flex gap-2">
          <RatingBadge
            label="U1"
            score={movie.ratings.user_1?.score}
            isCurrentUser={currentUserRole === 'user_1'}
          />
          <RatingBadge
            label="U2"
            score={movie.ratings.user_2?.score}
            isCurrentUser={currentUserRole === 'user_2'}
          />
        </div>
      </div>
    </Card>
  );
});

const RatingBadge = memo(function RatingBadge({
  label,
  score,
  isCurrentUser,
}: {
  label: string;
  score?: number;
  isCurrentUser: boolean;
}) {
  const hasScore = score !== undefined;

  return (
    <div
      className={cn(
        'flex-1 px-2 py-1.5 rounded-md text-xs text-center font-medium transition-all',
        hasScore
          ? 'bg-primary/10 text-primary dark:bg-primary/20'
          : 'bg-muted text-muted-foreground',
        isCurrentUser && hasScore && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {hasScore ? (
        <div className="flex items-center justify-center gap-1">
          <span className="opacity-70">{label}:</span>
          <span className="font-bold">{score}</span>
        </div>
      ) : (
        <span className="opacity-70">{label}: -</span>
      )}
    </div>
  );
});