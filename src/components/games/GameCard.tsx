'use client';

import { memo } from 'react';
import { Game } from '@/types/game';
import { UserRole } from '@/types/user';
import { getRAWGImageUrl } from '@/types/rawg';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/shared/OptimizedImage';
import { StarIcon, GamepadIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAllUsers } from '@/lib/hooks/useUser';
import { getUserDisplayName, getUserInitials } from '@/types/user';
import { getPlatformNames } from '@/lib/rawg/platforms';

interface GameCardProps {
  game: Game;
  currentUserRole?: UserRole;
  onClick?: () => void;
}

export const GameCard = memo(function GameCard({ 
  game, 
  currentUserRole, 
  onClick 
}: GameCardProps) {
  const imageUrl = getRAWGImageUrl(game.backgroundImage ?? null, 'medium');
  const year = game.released ? new Date(game.released).getFullYear() : '';
  const { data: allUsers } = useAllUsers();
  const platforms = getPlatformNames(game.platforms);
  
  const hasUserRating = currentUserRole 
    ? game.ratings[currentUserRole] !== undefined 
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
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.03] p-0"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        <OptimizedImage
          src={imageUrl}
          alt={game.name}
          className="w-full h-full"
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <GamepadIcon className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
          }
        />

        {/* Badges overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
          {!hasUserRating && (
            <div className="w-fit px-2 py-1 rounded-md bg-amber-500/90 text-white text-xs font-medium backdrop-blur-sm">
              Pendiente
            </div>
          )}

          {game.averageScore && (
            <div className="w-fit px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1">
              <StarIcon className="h-3 w-3 fill-[#db6468] text-[#db6468]" />
              {game.averageScore.toFixed(1)}
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold line-clamp-2 transition-colors group-hover:text-primary">
            {game.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {year && <span>{year}</span>}
            {platforms.length > 0 && (
              <>
                <span>•</span>
                <span className="truncate">{platforms.slice(0, 2).join(', ')}</span>
              </>
            )}
          </div>
        </div>

        {/* Played date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3" />
          <span>
            Jugado: {format(game.playedDate.toDate(), "d MMM yyyy", {
              locale: es,
            })}
          </span>
        </div>

        {/* Ratings */}
        <div className="flex gap-2">
          <RatingBadge
            label={getUserLabel('user_1')}
            score={game.ratings.user_1?.score}
            isCurrentUser={currentUserRole === 'user_1'}
          />
          <RatingBadge
            label={getUserLabel('user_2')}
            score={game.ratings.user_2?.score}
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