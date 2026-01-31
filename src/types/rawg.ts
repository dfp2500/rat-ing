// RAWG Game Search Result
export interface RAWGSearchResult {
  count: number;
  next: string | null;
  previous: string | null;
  results: RAWGGame[];
}

// RAWG Game (básico - en búsquedas)
export interface RAWGGame {
  id: number;
  slug: string;
  name: string;
  released: string;
  background_image: string | null;
  rating: number;
  ratings_count: number;
  metacritic: number | null;
  playtime: number;
  platforms: RAWGPlatformInfo[];
  genres: RAWGGenre[];
  short_screenshots?: RAWGScreenshot[];
}

// RAWG Game Details (completo)
export interface RAWGGameDetails {
  id: number;
  slug: string;
  name: string;
  name_original: string;
  description: string;
  description_raw: string;
  released: string;
  background_image: string | null;
  background_image_additional: string | null;
  rating: number;
  ratings_count: number;
  metacritic: number | null;
  playtime: number;
  
  platforms: RAWGPlatformInfo[];
  genres: RAWGGenre[];
  developers: RAWGDeveloper[];
  publishers: RAWGPublisher[];
  esrb_rating: RAWGESRBRating | null;
  
  website: string;
  screenshots_count: number;
}

export interface RAWGPlatformInfo {
  platform: RAWGPlatform;
  released_at: string;
}

export interface RAWGPlatform {
  id: number;
  name: string;
  slug: string;
}

export interface RAWGGenre {
  id: number;
  name: string;
  slug: string;
}

export interface RAWGDeveloper {
  id: number;
  name: string;
  slug: string;
}

export interface RAWGPublisher {
  id: number;
  name: string;
  slug: string;
}

export interface RAWGESRBRating {
  id: number;
  name: string;
  slug: string;
}

export interface RAWGScreenshot {
  id: number;
  image: string;
}

// Helper para construir URLs de imágenes
export function getRAWGImageUrl(
  path: string | null,
  size: 'thumb' | 'small' | 'medium' | 'large' | 'original' = 'medium'
): string | null {
  if (!path) return null;
  
  // RAWG devuelve URLs completas, pero podemos optimizar el tamaño
  const sizeMap = {
    thumb: '/resize/150/-/',
    small: '/resize/420/-/',
    medium: '/resize/640/-/',
    large: '/resize/1280/-/',
    original: '',
  };
  
  // Insertar resize en la URL si no es original
  if (size !== 'original' && path.includes('media/')) {
    return path.replace('/media/', `/media${sizeMap[size]}`);
  }
  
  return path;
}
