import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    if (!query.trim()) {
      return NextResponse.json({ query: '', total: 0, stores: {}, products: [] });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetchBackend(
      `/products/extractor/search?query=${encodeURIComponent(query.trim())}`,
      { headers }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const error = await response.json().catch(() => ({ message: 'Erro na busca do extrator' }));
    return NextResponse.json({ error: error.message }, { status: response.status });
  } catch (error: any) {
    console.error('Erro no proxy de busca do extrator:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno no proxy do extrator' },
      { status: 500 }
    );
  }
}
