'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useSearchMovies } from '@/lib/hooks/useTMDB';
import { getTMDBImageUrl } from '@/types/tmdb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading, error } = useSearchMovies(query);

  const firebaseStatus = {
    auth: !!auth,
    firestore: !!db,
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchQuery);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Rat-Ing</h1>
          <p className="text-muted-foreground">Movie Rating Tracker</p>
        </div>

        {/* Firebase Status */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-center">Estado de Firebase:</p>
          <div className="flex gap-4 justify-center">
            <div
              className={`px-4 py-2 rounded text-sm ${
                firebaseStatus.auth
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-red-500/20 text-red-700 dark:text-red-400'
              }`}
            >
              Auth: {firebaseStatus.auth ? '✓' : '✗'}
            </div>
            <div
              className={`px-4 py-2 rounded text-sm ${
                firebaseStatus.firestore
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-red-500/20 text-red-700 dark:text-red-400'
              }`}
            >
              Firestore: {firebaseStatus.firestore ? '✓' : '✗'}
            </div>
          </div>
        </div>

        {/* TMDB Test */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Prueba de TMDB API</h2>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Buscar película... (ej: Inception)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>

          {error && (
            <div className="text-red-500 text-sm">
              Error: {(error as Error).message}
            </div>
          )}

          {data && data.results.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {data.total_results} resultados encontrados
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.results.slice(0, 8).map((movie) => (
                  <div
                    key={movie.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {movie.poster_path ? (
                      <img
                        src={getTMDBImageUrl(movie.poster_path, 'w342') || ''}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">Sin imagen</p>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-1">
                        {movie.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {movie.release_date?.split('-')[0] || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data && data.results.length === 0 && query && (
            <p className="text-muted-foreground text-sm">
              No se encontraron películas para &quot;{query}&quot;
            </p>
          )}
        </div>

        {/* Status */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>✓ Fase 0.1 completada</p>
          <p>✓ Fase 0.2 completada</p>
          <p>✓ Fase 0.3 completada</p>
        </div>
      </div>
    </main>
  );
}