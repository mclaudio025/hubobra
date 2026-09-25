import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    
    const response = await fetchBackend(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao buscar usuários' }));
      const errorMessage = Array.isArray(error?.message)
        ? error.message.join(', ')
        : (error?.message || error?.error || `Erro ${response.status}`);
      return NextResponse.json({ error: errorMessage, message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro na API de usuários GET:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar usuário' }));
      const errorMessage = Array.isArray(error?.message)
        ? error.message.join(', ')
        : (error?.message || error?.error || `Erro ${response.status}`);
      return NextResponse.json({ error: errorMessage, message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao criar usuário POST:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
