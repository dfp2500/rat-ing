import { NextRequest, NextResponse } from 'next/server';
import { tmdbSeriesClient } from '@/lib/tmdb/series-client';

// Simple in-memory cache
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Rate limiting simple (por IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

function getCachedData(cacheKey: string) {
  const cached = searchCache.get(cacheKey);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    searchCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function setCachedData(cacheKey: string, data: any) {
  searchCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  if (searchCache.size > 100) {
    const firstKey = searchCache.keys().next().value;
    if (firstKey) searchCache.delete(firstKey);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = (forwarded ? forwarded.split(',')[0] : realIp) ?? '127.0.0.1';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
          }
        }
      );
    }

    // Validar parámetros
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 500) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    // Cache key
    const cacheKey = `search:${query.toLowerCase()}:${page}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }

    // Llamada a TMDB
    const results = await tmdbSeriesClient.searchSeries(query, pageNum);

    // Guardar en cache
    setCachedData(cacheKey, results);

    return NextResponse.json(results, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Error searching series:', error);
    
    if (error instanceof Error && error.message.includes('TMDB API Error')) {
      return NextResponse.json(
        { error: 'External API error. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search series' },
      { status: 500 }
    );
  }
}