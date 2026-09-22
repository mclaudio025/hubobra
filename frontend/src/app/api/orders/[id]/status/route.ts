import { NextRequest, NextResponse } from 'next/server';

interface UpdateOrderStatusRequest {
  status: string;
  notes?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body: UpdateOrderStatusRequest = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    if (!body.status) {
      return NextResponse.json(
        { error: 'Status do pedido é obrigatório' },
        { status: 400 }
      );
    }

    // Chamar o backend para atualizar o status do pedido
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/status`,
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
        { error: errorData.message || 'Erro ao atualizar status do pedido' },
        { status: backendResponse.status }
      );
    }

    const updatedOrder = await backendResponse.json();

    return NextResponse.json(updatedOrder);

  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}