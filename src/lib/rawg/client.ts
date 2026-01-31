import {
  RAWGSearchResult,
  RAWGGameDetails,
} from '@/types/rawg';

const RAWG_BASE_URL = 'https://api.rawg.io/api';
const RAWG_API_KEY = process.env.RAWG_API_KEY;

class RAWGClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = RAWG_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    params?: Record<string, string>,
    retries: number = 3
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('key', this.apiKey);

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
            throw new Error(`RAWG API Error: 404 Not Found`);
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
            `RAWG API Error: ${response.status} ${response.statusText}`
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

    throw lastError || new Error('RAWG API request failed');
  }

  async searchGames(query: string, page: number = 1): Promise<RAWGSearchResult> {
    return this.request<RAWGSearchResult>('/games', {
      search: query,
      page: page.toString(),
      page_size: '20',
    });
  }

  async getGameDetails(gameId: number): Promise<RAWGGameDetails> {
    return this.request<RAWGGameDetails>(`/games/${gameId}`);
  }

  async getPopularGames(page: number = 1): Promise<RAWGSearchResult> {
    return this.request<RAWGSearchResult>('/games', {
      page: page.toString(),
      page_size: '20',
      ordering: '-rating',
    });
  }

  async getRecentGames(page: number = 1): Promise<RAWGSearchResult> {
    return this.request<RAWGSearchResult>('/games', {
      page: page.toString(),
      page_size: '20',
      ordering: '-released',
      dates: `${new Date().getFullYear() - 1}-01-01,${new Date().toISOString().split('T')[0]}`,
    });
  }

  async getUpcomingGames(page: number = 1): Promise<RAWGSearchResult> {
    return this.request<RAWGSearchResult>('/games', {
      page: page.toString(),
      page_size: '20',
      ordering: '-added',
      dates: `${new Date().toISOString().split('T')[0]},${new Date().getFullYear() + 1}-12-31`,
    });
  }
}

// Validar que existe la API key
if (!RAWG_API_KEY) {
  throw new Error('RAWG_API_KEY no está configurada en las variables de entorno');
}

export const rawgClient = new RAWGClient(RAWG_API_KEY);