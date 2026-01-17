import { NextRequest, NextResponse } from 'next/server';
import { tmdbClient } from '@/lib/tmdb/client';

// Cache de detalles de películas (más largo porque no cambian)
const detailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

function getCachedDetails(movieId: string) {
  const cached = detailsCache.get(movieId);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    detailsCache.delete(movieId);
    return null;
  }

  return cached.data;
}

function setCachedDetails(movieId: string, data: any) {
  detailsCache.set(movieId, {
    data,
    timestamp: Date.now(),
  });

  // Limitar tamaño del cache
  if (detailsCache.size > 200) {
    const firstKey = detailsCache.keys().next().value;
    if (firstKey) detailsCache.delete(firstKey);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id);

    // Validación
    if (isNaN(movieId) || movieId <= 0) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }

    // Revisar cache
    const cacheKey = id;
    const cachedData = getCachedDetails(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }

    // Llamada a TMDB
    const movie = await tmdbClient.getMovieDetails(movieId);

    // Guardar en cache
    setCachedDetails(cacheKey, movie);

    return NextResponse.json(movie, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=3600', // 1 hora
      },
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);

    // Si es un error 404 de TMDB (película no existe)
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    // Error de TMDB
    if (error instanceof Error && error.message.includes('TMDB API Error')) {
      return NextResponse.json(
        { error: 'External API error. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}