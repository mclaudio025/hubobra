import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.hubobra.com.br';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const authHeader = request.headers.get('authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(
      `${API_BASE_URL}/products/extractor/search?query=${encodeURIComponent(query)}`,
      { headers }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Falha ao buscar nos Home Centers' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro interno no proxy do extrator' },
      { status: 500 }
    );
  }
}
