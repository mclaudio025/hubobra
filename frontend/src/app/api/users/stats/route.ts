import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || '';

    const response = await fetchBackend('/users/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao buscar estatísticas de usuários' }));
      const errorMessage = Array.isArray(error?.message)
        ? error.message.join(', ')
        : (error?.message || error?.error || `Erro ${response.status}`);
      return NextResponse.json({ error: errorMessage, message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro na API de stats de usuários:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
