import { NextRequest, NextResponse } from 'next/server';

interface UpdatePaymentRequest {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  transactionId?: string;
  notes?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body: UpdatePaymentRequest = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    if (!body.status) {
      return NextResponse.json(
        { error: 'Status do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    // Chamar o backend para atualizar o status do pagamento
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/payment`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erro ao atualizar pagamento' },
        { status: backendResponse.status }
      );
    }

    const updatedOrder = await backendResponse.json();

    return NextResponse.json(updatedOrder);

  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}