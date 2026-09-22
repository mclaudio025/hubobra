import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetch(`${API_BASE_URL}/components/home-sections/reset-default`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao restaurar seções padrão' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota POST /api/components/home-sections/reset-default:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
