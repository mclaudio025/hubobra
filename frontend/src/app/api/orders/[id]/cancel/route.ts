import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

interface CancelOrderRequest {
  reason?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body: CancelOrderRequest = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    // Chamar o backend para cancelar o pedido
    const backendResponse = await fetchBackend(
      `/orders/${orderId}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      const errorMessage = Array.isArray(errorData?.message)
        ? errorData.message.join(', ')
        : (errorData?.message || errorData?.error || 'Erro ao cancelar pedido');
      return NextResponse.json(
        { error: errorMessage, message: errorMessage },
        { status: backendResponse.status }
      );
    }

    const cancelledOrder = await backendResponse.json();
    return NextResponse.json(cancelledOrder);

  } catch (error: any) {
    console.error('Erro ao cancelar pedido:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}