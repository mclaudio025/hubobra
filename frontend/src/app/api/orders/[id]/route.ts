import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    const response = await fetchBackend(`/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Pedido não encontrado' }));
      const errorMessage = Array.isArray(error?.message)
        ? error.message.join(', ')
        : (error?.message || error?.error || `Erro ${response.status}`);
      return NextResponse.json({ error: errorMessage, message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro na rota GET /api/orders/[id]:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor ao carregar pedido' },
      { status: 500 }
    );
  }
}