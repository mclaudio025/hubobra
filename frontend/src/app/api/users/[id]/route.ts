import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetchBackend(`/users/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao buscar usuário' }));
      const errorMessage = Array.isArray(error?.message)
        ? error.message.join(', ')
        : (error?.message || error?.error || `Erro ${response.status}`);
      return NextResponse.json({ error: errorMessage, message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend(`/users/${params.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao atualizar usuário' }));
      const errorMessage = Array.isArray(error?.message)
        ? error.message.join(', ')
        : (error?.message || error?.error || `Erro ${response.status}`);
      return NextResponse.json({ error: errorMessage, message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetchBackend(`/users/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao deletar usuário' }));
      const errorMessage = Array.isArray(error?.message)
        ? error.message.join(', ')
        : (error?.message || error?.error || `Erro ${response.status}`);
      return NextResponse.json({ error: errorMessage, message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}