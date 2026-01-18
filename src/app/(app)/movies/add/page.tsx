'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TMDBMovie } from '@/types/tmdb';
import { MovieSearchDialog } from '@/components/movies/MovieSearchDialog';
import { MovieForm } from '@/components/movies/MovieForm';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, SearchIcon } from 'lucide-react';

export default function AddMoviePage() {
  const router = useRouter();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  const handleSelectMovie = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setSearchDialogOpen(false);
  };

  const handleBack = () => {
    if (selectedMovie) {
      // Si ya seleccionó una película, confirmar antes de salir
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
              <h1 className="text-2xl font-bold">Añadir Película</h1>
              <p className="text-sm text-muted-foreground">
                Busca y añade una película que hayas visto
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {!selectedMovie ? (
          // Estado inicial: Sin película seleccionada
          <div className="text-center py-12">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <SearchIcon className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Busca una película
                </h2>
                <p className="text-sm text-muted-foreground">
                  Usa nuestra búsqueda para encontrar la película que viste.
                  Luego podrás añadir la fecha, tu valoración y comentarios.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => setSearchDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                Buscar Película
              </Button>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Busca por el título original o en español.
                  La búsqueda incluye miles de películas de TMDB.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Película seleccionada: Mostrar formulario
          <MovieForm
            movie={selectedMovie}
            onCancel={() => setSelectedMovie(null)}
          />
        )}
      </div>

      {/* Search Dialog */}
      <MovieSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectMovie={handleSelectMovie}
      />
    </div>
  );
}