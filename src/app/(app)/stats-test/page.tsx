'use client';

import { useAllStats, useUpdateGlobalStats } from '@/lib/hooks/useStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCwIcon, AlertTriangleIcon } from 'lucide-react';

export default function StatsTestPage() {
  const { global, computed, isLoading } = useAllStats();
  const updateStats = useUpdateGlobalStats();

  const handleRecalculate = async () => {
    try {
      await updateStats.mutateAsync();
      console.log('Stats recalculadas exitosamente');
    } catch (error) {
      console.error('Error recalculando stats:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasGlobalStats = global !== null && global !== undefined;

  // Función auxiliar para manejar fechas de Firestore o Strings
  const getYear = (dateInput: any) => {
    if (!dateInput) return '';
    const date = dateInput.seconds ? new Date(dateInput.seconds * 1000) : new Date(dateInput);
    return isNaN(date.getTime()) ? '' : date.getFullYear();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prueba de Estadísticas</h1>
          <p className="text-muted-foreground">Debug de stats backend y cálculos locales</p>
        </div>
        <div className="flex items-center gap-2">
          {!hasGlobalStats && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              Stats no inicializadas
            </div>
          )}
          <Button
            onClick={handleRecalculate}
            disabled={updateStats.isPending}
            size="sm"
          >
            {updateStats.isPending ? (
              <>
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                {hasGlobalStats ? 'Recalculando...' : 'Inicializando...'}
              </>
            ) : (
              <>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                {hasGlobalStats ? 'Recalcular Stats' : 'Inicializar Stats'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerta de Inicialización */}
      {!hasGlobalStats && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <RefreshCwIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Las estadísticas aún no han sido calculadas
                </h3>
                <p className="text-sm text-amber-800/80 dark:text-amber-400/80 mb-4">
                    Haz click en &quot;Inicializar Stats&quot; para calcular las estadísticas por primera vez. 
                    Esto creará el documento en Firestore basado en tus películas actuales.
                </p>
                <Button onClick={handleRecalculate} variant="outline" size="sm" className="border-amber-500/50 hover:bg-amber-500/10">
                  Inicializar Ahora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Stats (Firestore) - CORREGIDO: Ahora envuelto en Card */}
        {hasGlobalStats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Estadísticas Globales (Firestore)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-[10px] bg-muted p-4 rounded-lg overflow-auto max-h-[300px] leading-tight">
                {JSON.stringify(global, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Agreement Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estadísticas de Acuerdo (Computed)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-[10px] bg-muted p-4 rounded-lg overflow-auto max-h-[300px] leading-tight">
              {JSON.stringify(computed?.agreementStats, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Top Rated */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Top 10 Mejor Valoradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {computed?.topRated?.map((movie: any, index: number) => (
                <div key={movie.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-transparent hover:border-border transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-muted-foreground/30 w-6">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{movie.title}</p>
                      <p className="text-xs text-muted-foreground">{getYear(movie.releaseDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary leading-none">
                      {movie.averageScore?.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-medium tracking-taller">
                      U1: {movie.ratings?.user_1?.score || '-'} | U2: {movie.ratings?.user_2?.score || '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Controversial */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Más Controversiales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {computed?.mostControversial?.map(({ movie, difference }: any, index: number) => (
                <div key={movie.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-muted-foreground/30 w-6">{index + 1}</span>
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{movie.title}</p>
                      <p className="text-xs text-muted-foreground">
                        U1: {movie.ratings?.user_1?.score || '-'} vs U2: {movie.ratings?.user_2?.score || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive leading-none">
                      Δ {difference}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase">Diferencia</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Otras gráficas/JSON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Películas por Mes</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-[10px] bg-muted p-4 rounded overflow-auto max-h-[200px]">
              {JSON.stringify(computed?.moviesByMonth, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Evolución de Promedios</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-[10px] bg-muted p-4 rounded overflow-auto max-h-[200px]">
              {JSON.stringify(computed?.averageEvolution, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}