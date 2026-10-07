import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

// Cache em memória no servidor Next.js (TTL 120 segundos)
const serverHomeSectionsCache = { data: null as any, expiresAt: 0 };
const HOME_SECTIONS_CACHE_TTL = 120 * 1000;

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('Authorization') || request.headers.get('authorization');
    const isCacheable = !auth || auth.trim().length === 0;

    if (isCacheable && serverHomeSectionsCache.data && Date.now() < serverHomeSectionsCache.expiresAt) {
      return NextResponse.json(serverHomeSectionsCache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
          'X-Cache': 'HIT-MEMORY',
        },
      });
    }

    const response = await fetchBackend('/components/home-sections', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao buscar seções da home' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();

    if (isCacheable && data) {
      serverHomeSectionsCache.data = data;
      serverHomeSectionsCache.expiresAt = Date.now() + HOME_SECTIONS_CACHE_TTL;
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Erro na rota GET /api/components/home-sections:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetchBackend('/components/home-sections', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao atualizar seções da home' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota PUT /api/components/home-sections:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetchBackend('/components/home-sections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao adicionar seção na home' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota POST /api/components/home-sections:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
