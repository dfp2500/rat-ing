'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TMDBSeries } from '@/types/tmdb-series';
import { SeriesSearchDialog } from '@/components/series/SeriesSearchDialog';
import { SeriesForm } from '@/components/series/SeriesForm';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, SearchIcon } from 'lucide-react';

export default function AddSeriesPage() {
  const router = useRouter();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<TMDBSeries | null>(null);

  const handleSelectSeries = (series: TMDBSeries) => {
    setSelectedSeries(series);
    setSearchDialogOpen(false);
  };

  const handleBack = () => {
    if (selectedSeries) {
      if (confirm('¿Seguro que quieres salir? Los datos no guardados se perderán.')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Añadir Serie</h1>
              <p className="text-sm text-muted-foreground">
                Busca y añade una serie que estés viendo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {!selectedSeries ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <SearchIcon className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Busca una serie
                </h2>
                <p className="text-sm text-muted-foreground">
                  Usa nuestra búsqueda para encontrar la serie que estás viendo.
                  Luego podrás añadir tu progreso, valoración y comentarios.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => setSearchDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                Buscar Serie
              </Button>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Busca por el título original o en español.
                  La búsqueda incluye miles de series de TMDB.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <SeriesForm
            series={selectedSeries}
            onCancel={() => setSelectedSeries(null)}
          />
        )}
      </div>

      {/* Search Dialog */}
      <SeriesSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectSeries={handleSelectSeries}
      />
    </div>
  );
}