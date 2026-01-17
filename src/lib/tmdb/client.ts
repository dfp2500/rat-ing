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

  private async request<T>(
    endpoint: string,
    params?: Record<string, string>,
    retries: number = 3
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('language', 'es-ES');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          // Timeout de 10 segundos
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          // Casos especiales de error
          if (response.status === 404) {
            throw new Error(`TMDB API Error: 404 Not Found`);
          }
          
          if (response.status === 429) {
            // Rate limit - esperar antes de reintentar
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
            
            if (attempt < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }

          throw new Error(
            `TMDB API Error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;

        // Si es el último intento, lanzar error
        if (attempt === retries - 1) {
          break;
        }

        // Esperar antes de reintentar (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError || new Error('TMDB API request failed');
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

  async getTopRatedMovies(page: number = 1): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/movie/top_rated', {
      page: page.toString(),
    });
  }

  async getUpcomingMovies(page: number = 1): Promise<TMDBSearchResult> {
    return this.request<TMDBSearchResult>('/movie/upcoming', {
      page: page.toString(),
    });
  }
}

// Validar que existe la API key
if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY no está configurada en las variables de entorno');
}

export const tmdbClient = new TMDBClient(TMDB_API_KEY);