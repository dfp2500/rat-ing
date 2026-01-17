import {
  TMDBSearchResult,
  TMDBMovieDetails,
} from '@/types/tmdb';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

class TMDBClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = TMDB_BASE_URL;
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('language', 'es-ES');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async searchMovies(query: string, page: number = 1): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/search/movie', {
      query,
      page: page.toString(),
      include_adult: 'false',
    });
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    return this.request<TMDBMovieDetails>(`/movie/${movieId}`);
  }

  async getPopularMovies(page: number = 1): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/movie/popular', {
      page: page.toString(),
    });
  }

  async getNowPlayingMovies(page: number = 1): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/movie/now_playing', {
      page: page.toString(),
    });
  }
}

// Crear instancia solo si hay API key
if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY no está configurada en las variables de entorno');
}

export const tmdbClient = new TMDBClient(TMDB_API_KEY);