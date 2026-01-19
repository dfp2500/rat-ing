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
        onClick && 'cursor-pointer hover:shadow-md active:scale-95' // Feedback táctil en móvil
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-6">
        {/* Cambiamos a flex-col en móvil y flex-row en sm (desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          
          {/* Contenedor del Icono: Centrado en móvil, a la izquierda en PC */}
          <div
            className={cn(
              'p-2 rounded-lg bg-background/50 w-fit sm:shrink-0',
              iconStyles[variant]
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          
          {/* Info: Alineada a la izquierda siempre para evitar el "serpenteo" visual */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider sm:normal-case mb-0.5">
              {title}
            </p>
            
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-lg sm:text-2xl font-bold tracking-tight">
                {value}
              </h3>
              
              {trend && (
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-bold px-1 rounded bg-background/50',
                    trend.isPositive
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-red-600 dark:text-red-500'
                  )}
                >
                  {trend.isPositive ? '↑' : '↓'}{Math.abs(trend.value)}%
                </span>
              )}
            </div>

            {/* Descripción: Solo visible si hay espacio (PC) */}
            {description && (
              <p className="text-xs text-muted-foreground mt-1 truncate hidden lg:block">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}