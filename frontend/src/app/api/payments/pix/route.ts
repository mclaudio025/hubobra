import { NextRequest, NextResponse } from 'next/server';

interface PixPaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  description: string;
}

interface PixPaymentResponse {
  id: string;
  qrCode: string;
  qrCodeText: string;
  expiresAt: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
}

export async function POST(request: NextRequest) {
  try {
    const body: PixPaymentRequest = await request.json();
    
    const { orderId, amount, customerName, customerEmail, description } = body;

    // Validar dados obrigatórios
    if (!orderId || !amount || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Chamar o backend para criar o pagamento PIX
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        customerName,
        customerEmail,
        description,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erro ao criar pagamento PIX' },
        { status: backendResponse.status }
      );
    }

    const pixPayment: PixPaymentResponse = await backendResponse.json();

    return NextResponse.json(pixPayment);

  } catch (error) {
    console.error('Erro na API de PIX:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/pix/${paymentId}`);

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erro ao consultar pagamento PIX' },
        { status: backendResponse.status }
      );
    }

    const pixPayment = await backendResponse.json();

    return NextResponse.json(pixPayment);

  } catch (error) {
    console.error('Erro na consulta PIX:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
