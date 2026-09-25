import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetchBackend('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar pagamento' }));
      const errorMessage = Array.isArray(error?.message)
        ? error.message.join(', ')
        : (error?.message || error?.error || `Erro ${response.status}`);
      return NextResponse.json({ error: errorMessage, message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro na criação de pagamento POST /api/payments/create:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao registrar pagamento' },
      { status: 500 }
    );
  }
}
