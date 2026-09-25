import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

interface PixPaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PixPaymentRequest = await request.json();
    const { orderId, amount, customerName, customerEmail, description } = body;

    // Validar dados obrigatórios
    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos para geração do PIX' },
        { status: 400 }
      );
    }

    // Chamar o backend para criar o pagamento PIX
    const backendResponse = await fetchBackend('/payments/pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        orderId,
        amount,
        customerName: customerName || 'Cliente HubObra',
        customerEmail: customerEmail || 'cliente@hubobra.com.br',
        description: description || `Pedido HubObra`,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      const errorMessage = Array.isArray(errorData?.message)
        ? errorData.message.join(', ')
        : (errorData?.message || errorData?.error || 'Erro ao criar pagamento PIX');
      return NextResponse.json(
        { error: errorMessage, message: errorMessage },
        { status: backendResponse.status }
      );
    }

    const pixPayment = await backendResponse.json();
    return NextResponse.json(pixPayment);

  } catch (error: any) {
    console.error('Erro na API de PIX POST:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor ao gerar PIX' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento não fornecido' },
        { status: 400 }
      );
    }

    // Consultar status do pagamento PIX no backend
    const backendResponse = await fetchBackend(`/payments/pix/${paymentId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      const errorMessage = Array.isArray(errorData?.message)
        ? errorData.message.join(', ')
        : (errorData?.message || errorData?.error || 'Erro ao consultar pagamento PIX');
      return NextResponse.json(
        { error: errorMessage, message: errorMessage },
        { status: backendResponse.status }
      );
    }

    const pixPayment = await backendResponse.json();
    return NextResponse.json(pixPayment);

  } catch (error: any) {
    console.error('Erro na consulta PIX GET:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor ao consultar PIX' },
      { status: 500 }
    );
  }
}
