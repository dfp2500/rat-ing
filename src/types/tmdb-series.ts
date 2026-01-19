// TMDB Series Search Result
export interface TMDBSeriesSearchResult {
  page: number;
  results: TMDBSeries[];
  total_pages: number;
  total_results: number;
}

// TMDB Series (básico - en búsquedas)
export interface TMDBSeries {
  id: number;
  name: string; // Título de la serie
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  origin_country: string[];
  original_language: string;
}

// TMDB Series Details (completo)
export interface TMDBSeriesDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  tagline: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  genres: TMDBGenre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  
  // Específico de series
  status: 'Returning Series' | 'Ended' | 'Canceled' | 'In Production' | 'Planned';
  type: string; // 'Scripted', 'Reality', 'Documentary', etc.
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[]; // Duración promedio de episodios
  
  // Temporadas
  seasons: TMDBSeason[];
  
  // Información adicional
  created_by: TMDBCreator[];
  networks: TMDBNetwork[];
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  spoken_languages: TMDBSpokenLanguage[];
  origin_country: string[];
  original_language: string;
  in_production: boolean;
  languages: string[];
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface TMDBCreator {
  id: number;
  name: string;
  profile_path: string | null;
  credit_id: string;
}

export interface TMDBNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

// Helper para normalizar el status de TMDB a nuestro formato
export function normalizeTMDBStatus(tmdbStatus: TMDBSeriesDetails['status']): 'returning' | 'ended' | 'canceled' | 'in_production' {
  switch (tmdbStatus) {
    case 'Returning Series':
      return 'returning';
    case 'Ended':
      return 'ended';
    case 'Canceled':
      return 'canceled';
    case 'In Production':
    case 'Planned':
      return 'in_production';
    default:
      return 'returning';
  }
}