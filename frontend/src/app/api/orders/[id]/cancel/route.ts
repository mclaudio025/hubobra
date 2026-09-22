import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
    const backendResponse = await fetch(
      `${API_BASE_URL}/orders/${orderId}/cancel`,
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
      return NextResponse.json(
        { error: errorData.message || 'Erro ao cancelar pedido' },
        { status: backendResponse.status }
      );
    }

    const cancelledOrder = await backendResponse.json();

    return NextResponse.json(cancelledOrder);

  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}