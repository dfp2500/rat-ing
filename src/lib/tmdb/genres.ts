/**
 * Mapa de géneros de TMDB para PELÍCULAS
 * Fuente: https://developer.themoviedb.org/reference/genre-movie-list
 */
export const TMDB_MOVIE_GENRES: Record<number, string> = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familiar',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia ficción',
  10770: 'Película de TV',
  53: 'Suspense',
  10752: 'Bélica',
  37: 'Western',
};

/**
 * Mapa de géneros de TMDB para SERIES
 * Fuente: https://developer.themoviedb.org/reference/genre-tv-list
 */
export const TMDB_TV_GENRES: Record<number, string> = {
  10759: 'Acción y Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familiar',
  10762: 'Infantil',
  9648: 'Misterio',
  10763: 'Noticias',
  10764: 'Reality',
  10765: 'Sci-Fi y Fantasía',
  10766: 'Telenovela',
  10767: 'Talk Show',
  10768: 'Guerra y Política',
  37: 'Western',
};

/**
 * Mapa combinado de todos los géneros
 */
export const TMDB_GENRES: Record<number, string> = {
  ...TMDB_MOVIE_GENRES,
  ...TMDB_TV_GENRES,
};

/**
 * Convierte un array de IDs de género a sus nombres
 */
export function getGenreNames(genreIds: (string | number)[]): string[] {
  return genreIds
    .map(id => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      return TMDB_GENRES[numId] || `Género ${id}`;
    })
    .filter(Boolean);
}

/**
 * Convierte un solo ID de género a su nombre
 */
export function getGenreName(genreId: string | number): string {
  const numId = typeof genreId === 'string' ? parseInt(genreId, 10) : genreId;
  return TMDB_GENRES[numId] || `Género ${genreId}`;
}

/**
 * Obtiene nombres de géneros para películas específicamente
 */
export function getMovieGenreNames(genreIds: (string | number)[]): string[] {
  return genreIds
    .map(id => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      return TMDB_MOVIE_GENRES[numId] || `Género ${id}`;
    })
    .filter(Boolean);
}

/**
 * Obtiene nombres de géneros para series específicamente
 */
export function getTVGenreNames(genreIds: (string | number)[]): string[] {
  return genreIds
    .map(id => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      return TMDB_TV_GENRES[numId] || `Género ${id}`;
    })
    .filter(Boolean);
}