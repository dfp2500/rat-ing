'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircleIcon, RefreshCwIcon, HomeIcon } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircleIcon className="h-10 w-10 text-destructive" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 rounded-lg bg-muted text-left">
              <summary className="cursor-pointer text-xs font-mono mb-2">
                Detalles del error
              </summary>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
            <HomeIcon className="h-4 w-4 mr-2" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}