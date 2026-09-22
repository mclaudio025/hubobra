import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetch(`${API_BASE_URL}/components/home-sections/admin`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao buscar seções admin' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota GET /api/components/home-sections/admin:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
