import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const auth = request.headers.get('Authorization') || request.headers.get('authorization');
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

    return NextResponse.json({
      ...data,
      products: productsArray,
      total: totalCount,
      totalProducts: totalCount,
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
