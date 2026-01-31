import { NextRequest, NextResponse } from 'next/server';
import { rawgClient } from '@/lib/rawg/client';

const detailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

function getCachedDetails(gameId: string) {
  const cached = detailsCache.get(gameId);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    detailsCache.delete(gameId);
    return null;
  }

  return cached.data;
}

function setCachedDetails(gameId: string, data: any) {
  detailsCache.set(gameId, {
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
    const gameId = parseInt(id);

    if (isNaN(gameId) || gameId <= 0) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
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

    const game = await rawgClient.getGameDetails(gameId);

    setCachedDetails(cacheKey, game);

    return NextResponse.json(game, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching game details:', error);

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('RAWG API Error')) {
      return NextResponse.json(
        { error: 'External API error. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}
