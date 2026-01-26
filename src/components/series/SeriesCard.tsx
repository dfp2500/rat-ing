'use client';

import { memo } from 'react';
import { Series, getWatchStatusLabel } from '@/types/series';
import { UserRole } from '@/types/user';
import { getTMDBImageUrl } from '@/types/tmdb';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { StarIcon, TvIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAllUsers } from '@/lib/hooks/useUser';
import { getUserDisplayName, getUserInitials } from '@/types/user';

interface SeriesCardProps {
  series: Series;
  currentUserRole?: UserRole;
  onClick?: () => void;
}

export const SeriesCard = memo(function SeriesCard({ 
  series, 
  currentUserRole, 
  onClick 
}: SeriesCardProps) {
  const posterUrl = getTMDBImageUrl(series.posterPath ?? null, 'w342');
  const year = series.firstAirDate ? new Date(series.firstAirDate).getFullYear() : '';
  const { data: allUsers } = useAllUsers();
  
  const hasUserRating = currentUserRole 
    ? series.ratings[currentUserRole] !== undefined 
    : false;

  const getUserLabel = (role: UserRole) => {
    if (!allUsers) return role === 'user_1' ? 'U1' : 'U2';
    const user = allUsers.find(u => u.role === role);
    if (!user) return role === 'user_1' ? 'U1' : 'U2';
    
    const name = getUserDisplayName(user);
    return name.length > 8 ? getUserInitials(user) : name;
  };

  const getWatchStatusColor = (status: Series['watchStatus']) => {
    switch (status) {
      case 'watching': return 'bg-blue-500/90';
      case 'completed': return 'bg-green-500/90';
      case 'dropped': return 'bg-red-500/90';
      case 'plan_to_watch': return 'bg-amber-500/90';
      default: return 'bg-muted';
    }
  };

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.03] p-0"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        <OptimizedImage
          src={posterUrl}
          alt={series.title}
          className="w-full h-full"
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <TvIcon className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
          }
        />

        {/* Badges overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end"> {/* <--- items-end es la clave */}
        
        {/* Estado de visualización */}
        <div className={cn(
            "w-fit px-2 py-1 rounded-md text-white text-xs font-medium backdrop-blur-sm",
            getWatchStatusColor(series.watchStatus)
        )}>
            {getWatchStatusLabel(series.watchStatus)}
        </div>

        {!hasUserRating && (
            <div className="w-fit px-2 py-1 rounded-md bg-amber-500/90 text-white text-xs font-medium backdrop-blur-sm">
            Pendiente
            </div>
        )}

        {series.averageScore && (
            <div className="w-fit px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1">
            <StarIcon className="h-3 w-3 fill-[#db6468] text-[#db6468]" />
            {series.averageScore.toFixed(1)}
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
            {series.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {year && <span>{year}</span>}
            {series.numberOfSeasons && (
              <>
                <span>•</span>
                <span>{series.numberOfSeasons} temp.</span>
              </>
            )}
          </div>
        </div>

        {/* Started watching date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3" />
          <span>
            Inicio: {format(series.startedWatchingDate.toDate(), "d MMM yyyy", {
              locale: es,
            })}
          </span>
        </div>

        {/* Ratings */}
        <div className="flex gap-2">
          <RatingBadge
            label={getUserLabel('user_1')}
            score={series.ratings.user_1?.score}
            isCurrentUser={currentUserRole === 'user_1'}
          />
          <RatingBadge
            label={getUserLabel('user_2')}
            score={series.ratings.user_2?.score}
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