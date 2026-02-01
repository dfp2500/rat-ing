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
        'transition-all duration-200 overflow-hidden',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]' // Feedback táctil en móvil
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Icono - Más compacto en móvil */}
          <div
            className={cn(
              'p-2 sm:p-2.5 rounded-lg bg-background/50 shrink-0',
              iconStyles[variant]
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          
          {/* Contenido - Flex para mejor distribución */}
          <div className="flex-1 min-w-0">
            {/* Título más pequeño en móvil */}
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            
            <div className="flex items-baseline gap-2">
              {/* Valor principal */}
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {value}
              </h3>
              
              {/* Tendencia (si existe) */}
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

            {/* Descripción - Oculta en móvil muy pequeño, visible desde sm */}
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