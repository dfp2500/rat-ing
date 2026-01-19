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
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  onClick,
  variant = 'default',
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

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      {/* Mobile: Diseño compacto */}
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          {/* Icono - Más pequeño en móvil */}
          <div
            className={cn(
              'p-2 sm:p-3 rounded-lg bg-background/50 shrink-0',
              iconStyles[variant]
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0 text-right sm:text-left">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate mb-0.5 sm:mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-1 sm:gap-2 justify-end sm:justify-start">
              <h3 className="text-xl sm:text-3xl font-bold tracking-tight">
                {value}
              </h3>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-red-600 dark:text-red-500'
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate hidden sm:block">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}