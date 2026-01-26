'use client';

import { Series, getWatchStatusLabel } from '@/types/series';
import { UserRole } from '@/types/user';
import { getTMDBImageUrl } from '@/types/tmdb';
import { Card } from '@/components/ui/card';
import { StarIcon, TvIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getUserDisplayName, getUserInitials } from '@/types/user';
import { useAllUsers } from '@/lib/hooks/useUser';

interface CompactSeriesCardProps {
  series: Series;
  currentUserRole?: UserRole;
  onClick?: () => void;
  showDate?: boolean;
}

export function CompactSeriesCard({
  series,
  currentUserRole,
  onClick,
  showDate = true,
}: CompactSeriesCardProps) {
  const posterUrl = getTMDBImageUrl(series.posterPath ?? null, 'w154');
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

  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-md hover:scale-[1.01] p-0"
    >
      <div className="flex gap-3 p-3">
        {/* Poster miniatura */}
        <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={series.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TvIcon className="h-6 w-6 text-muted-foreground opacity-50" />
            </div>
          )}

          {/* Badge de score */}
          {series.averageScore && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold flex items-center gap-0.5">
              <StarIcon className="h-2.5 w-2.5 fill-[#db6468] text-[#db6468]" />
              {series.averageScore.toFixed(1)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Título */}
          <div>
            <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {series.title}
            </h4>
            {year && (
              <p className="text-xs text-muted-foreground">{year}</p>
            )}
          </div>

          {/* Footer */}
          <div className="space-y-1">
            {showDate && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ClockIcon className="h-2.5 w-2.5" />
                <span>
                  {format(series.startedWatchingDate.toDate(), "d MMM yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            )}

            {/* Mini badges de ratings */}
            <div className="flex gap-1">
              <MiniRatingBadge
                label={getUserLabel('user_1')}
                score={series.ratings.user_1?.score}
                isCurrentUser={currentUserRole === 'user_1'}
              />
              <MiniRatingBadge
                label={getUserLabel('user_2')}
                score={series.ratings.user_2?.score}
                isCurrentUser={currentUserRole === 'user_2'}
              />
            </div>
          </div>
        </div>

        {/* Badge de estado */}
        <div className="flex flex-col items-end gap-1">
          {!hasUserRating && (
            <div className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-medium">
              Pendiente
            </div>
          )}
          <div className="px-2 py-1 rounded-md bg-muted text-[10px] font-medium">
            {getWatchStatusLabel(series.watchStatus)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MiniRatingBadge({
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
        'px-1.5 py-0.5 rounded text-[10px] font-medium',
        hasScore
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
        isCurrentUser && hasScore && 'ring-1 ring-primary'
      )}
    >
      {hasScore ? `${label}:${score}` : `${label}:-`}
    </div>
  );
}