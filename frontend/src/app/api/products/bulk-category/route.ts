import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/products/bulk-category', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao atualizar categorias em massa' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota /api/products/bulk-category:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
