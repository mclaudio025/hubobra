import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

// Cache em memória de alta performance no servidor Next.js (TTL 60 segundos)
const serverProductsCache = new Map<string, { data: any; expiresAt: number }>();
const PRODUCTS_CACHE_TTL = 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';

    const auth = request.headers.get('Authorization') || request.headers.get('authorization');
    const isCacheable = !auth || auth.trim().length === 0;

    // 1. Resposta instantânea (0ms) do cache em memória se disponível
    if (isCacheable) {
      const cached = serverProductsCache.get(endpoint);
      if (cached && Date.now() < cached.expiresAt) {
        return NextResponse.json(cached.data, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
      const error = await response.json().catch(() => ({ message: 'Erro ao buscar produtos' }));
      return NextResponse.json({ error: error.message || 'Erro nos produtos' }, { status: response.status });
    }

    const data = await response.json();
    const productsArray = Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];
    const totalCount = data?.total ?? data?.totalProducts ?? productsArray.length;

    const payload = {
      ...data,
      products: productsArray,
      total: totalCount,
      totalProducts: totalCount,
    };

    // Salva no cache em memória
    if (isCacheable && productsArray.length > 0) {
      serverProductsCache.set(endpoint, {
        data: payload,
        expiresAt: Date.now() + PRODUCTS_CACHE_TTL,
      });
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.error('Erro na rota GET /api/products:', error?.message || error);
    return NextResponse.json(
      { products: [], total: 0, error: 'Erro ao carregar produtos do servidor' },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao processar produto' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota POST /api/products:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar produto' },
      { status: 500 }
    );
  }
}
