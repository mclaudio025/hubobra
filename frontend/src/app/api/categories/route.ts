import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

// Cache em memória no servidor Next.js (TTL 120 segundos)
const serverCategoriesCache = new Map<string, { data: any; expiresAt: number }>();
const CATEGORIES_CACHE_TTL = 120 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const endpoint = active ? `/categories?active=${active}` : '/categories';

    const auth = request.headers.get('Authorization') || request.headers.get('authorization');
    const isCacheable = !auth || auth.trim().length === 0;

    if (isCacheable) {
      const cached = serverCategoriesCache.get(endpoint);
      if (cached && Date.now() < cached.expiresAt) {
        return NextResponse.json(cached.data, {
          headers: {
            'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
            'X-Cache': 'HIT-MEMORY',
          },
        });
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth && auth.trim().length > 0) {
      headers['Authorization'] = auth;
    }

    const response = await fetchBackend(endpoint, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn(`Backend categories returned status ${response.status}`);
      return NextResponse.json([], { status: 200 });
    }

    const data = await response.json();

    if (isCacheable && Array.isArray(data) && data.length > 0) {
      serverCategoriesCache.set(endpoint, {
        data,
        expiresAt: Date.now() + CATEGORIES_CACHE_TTL,
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.warn('Erro ao conectar com API de categorias (usando fallback):', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar categoria' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/categories', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao atualizar categoria' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      );
    }
    
    const response = await fetchBackend(`/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao deletar categoria' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
