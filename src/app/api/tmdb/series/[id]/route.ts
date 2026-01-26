import { NextRequest, NextResponse } from 'next/server';
import { tmdbSeriesClient } from '@/lib/tmdb/series-client';

const detailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

function getCachedDetails(seriesId: string) {
  const cached = detailsCache.get(seriesId);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    detailsCache.delete(seriesId);
    return null;
  }

  return cached.data;
}

function setCachedDetails(seriesId: string, data: any) {
  detailsCache.set(seriesId, {
    data,
    timestamp: Date.now(),
  });

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
    const seriesId = parseInt(id);

    if (isNaN(seriesId) || seriesId <= 0) {
      return NextResponse.json(
        { error: 'Invalid series ID' },
        { status: 400 }
      );
    }

    const cacheKey = id;
    const cachedData = getCachedDetails(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }

    const series = await tmdbSeriesClient.getSeriesDetails(seriesId);

    setCachedDetails(cacheKey, series);

    return NextResponse.json(series, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching series details:', error);

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('TMDB API Error')) {
      return NextResponse.json(
        { error: 'External API error. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch series details' },
      { status: 500 }
    );
  }
}