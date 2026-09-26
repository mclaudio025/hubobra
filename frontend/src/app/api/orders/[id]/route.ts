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

    const authHeader = request.headers.get('Authorization') || '';
    const endpoint = authHeader ? `/orders/${orderId}` : `/orders/${orderId}/public`;

    let response = await fetchBackend(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    if (!response.ok && response.status === 401) {
      // Fallback para endpoint público caso o token esteja expirado ou ausente
      response = await fetchBackend(`/orders/${orderId}/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

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