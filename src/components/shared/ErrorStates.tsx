'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: 'page' | 'inline' | 'card';
}

export function ErrorState({
  title = 'Algo salió mal',
  message,
  onRetry,
  variant = 'page',
}: ErrorStateProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
        <AlertCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs opacity-90">{message}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCwIcon className="h-3 w-3 mr-2" />
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertCircleIcon className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircleIcon className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} size="lg">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}