import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

// Cache em memória no servidor Next.js (TTL 120 segundos)
const serverBannersCache = new Map<string, { data: any; expiresAt: number }>();
const BANNERS_CACHE_TTL = 120 * 1000;

const SEED_BANNERS = [
  {
    id: 'banner-ofertas-obra',
    title: 'Festival da Construção HubObra',
    subtitle: 'Tudo para sua obra com entrega expressa',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&auto=format&fit=crop&q=80',
    link: '/produtos',
    isActive: true,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/banners?${queryString}` : '/banners';

  const auth = request.headers.get('Authorization') || request.headers.get('authorization');
  const isCacheable = !auth || auth.trim().length === 0;

  if (isCacheable) {
    const cached = serverBannersCache.get(endpoint);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
          'X-Cache': 'HIT-MEMORY',
        },
      });
    }
  }

  try {
    const response = await fetchBackend(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend banners returned ${response.status}`);
    }

    const data = await response.json();
    const bannersArray = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    if (isCacheable && bannersArray.length > 0) {
      serverBannersCache.set(endpoint, {
        data: bannersArray,
        expiresAt: Date.now() + BANNERS_CACHE_TTL,
      });
    }

    return NextResponse.json(bannersArray, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.warn('[Fallback Resiliente] Erro na API de banners, usando seed:', error);
    return NextResponse.json(SEED_BANNERS, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=600',
        'X-Cache': 'OFFLINE-SNAPSHOT',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/banners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar banner' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao criar banner:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
