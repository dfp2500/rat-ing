import {
  TMDBSeriesSearchResult,
  TMDBSeriesDetails,
} from '@/types/tmdb-series';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

class TMDBSeriesClient {
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
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`TMDB API Error: 404 Not Found`);
          }
          
          if (response.status === 429) {
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

        if (attempt === retries - 1) {
          break;
        }

        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError || new Error('TMDB API request failed');
  }

  async searchSeries(query: string, page: number = 1): Promise<TMDBSeriesSearchResult> {
    return this.request<TMDBSeriesSearchResult>('/search/tv', {
      query,
      page: page.toString(),
      include_adult: 'false',
    });
  }

  async getSeriesDetails(seriesId: number): Promise<TMDBSeriesDetails> {
    return this.request<TMDBSeriesDetails>(`/tv/${seriesId}`);
  }

  async getPopularSeries(page: number = 1): Promise<TMDBSeriesSearchResult> {
    return this.request<TMDBSeriesSearchResult>('/tv/popular', {
      page: page.toString(),
    });
  }

  async getTopRatedSeries(page: number = 1): Promise<TMDBSeriesSearchResult> {
    return this.request<TMDBSeriesSearchResult>('/tv/top_rated', {
      page: page.toString(),
    });
  }

  async getOnTheAirSeries(page: number = 1): Promise<TMDBSeriesSearchResult> {
    return this.request<TMDBSeriesSearchResult>('/tv/on_the_air', {
      page: page.toString(),
    });
  }

  async getAiringTodaySeries(page: number = 1): Promise<TMDBSeriesSearchResult> {
    return this.request<TMDBSeriesSearchResult>('/tv/airing_today', {
      page: page.toString(),
    });
  }

  // Método para obtener detalles de una temporada específica
  async getSeasonDetails(seriesId: number, seasonNumber: number): Promise<any> {
    return this.request(`/tv/${seriesId}/season/${seasonNumber}`);
  }
}

// Validar que existe la API key
if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY no está configurada en las variables de entorno');
}

export const tmdbSeriesClient = new TMDBSeriesClient(TMDB_API_KEY);