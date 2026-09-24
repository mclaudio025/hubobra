import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetchBackend('/products/images/download-from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = 'Erro ao baixar imagem no backend';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // ignore json parse error
      }
      return NextResponse.json({ message: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro no proxy de download de imagens:', error);
    return NextResponse.json(
      { message: error?.message || 'Erro interno ao baixar imagem' },
      { status: 500 }
    );
  }
}
