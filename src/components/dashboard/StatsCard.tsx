'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  compact?: boolean; // Nueva prop para modo compacto
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  onClick,
  variant = 'default',
  compact = false,
}: StatsCardProps) {
  const variantStyles = {
    default: 'bg-card hover:bg-accent/50',
    primary: 'bg-primary/5 hover:bg-primary/10 border-primary/20',
    success: 'bg-green-500/5 hover:bg-green-500/10 border-green-500/20',
    warning: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-600 dark:text-green-500',
    warning: 'text-amber-600 dark:text-amber-500',
  };

  // Versión COMPACTA para móvil (3 columnas)
  if (compact) {
    return (
      <Card
        className={cn(
          'transition-all duration-200 overflow-hidden',
          variantStyles[variant],
          onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]'
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex flex-col items-center text-center gap-1.5">
            {/* Icono arriba */}
            <div className={cn('p-1.5 rounded-md bg-background/50', iconStyles[variant])}>
              <Icon className="h-4 w-4" />
            </div>
            
            {/* Valor grande */}
            <h3 className="text-xl font-bold tracking-tight leading-none">
              {value}
            </h3>
            
            {/* Título pequeño */}
            <p className="text-[10px] font-medium text-muted-foreground leading-tight">
              {title}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Versión NORMAL para desktop y grid 2x2 móvil
  return (
    <Card
      className={cn(
        'transition-all duration-200 overflow-hidden',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          
          {/* Icono */}
          <div
            className={cn(
              'p-2 sm:p-2.5 rounded-lg bg-background/50 shrink-0',
              iconStyles[variant]
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {value}
              </h3>
              
              {trend && (
                <span
                  className={cn(
                    'text-xs font-semibold px-1.5 py-0.5 rounded',
                    trend.isPositive
                      ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                      : 'text-red-600 dark:text-red-400 bg-red-500/10'
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'}{Math.abs(trend.value)}%
                </span>
              )}
            </div>

            {description && (
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}