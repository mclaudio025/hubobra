import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8081';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const backendUrl = `${API_BASE_URL}/products/images/bulk-fetch-missing`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = 'Erro ao processar varredura de imagens no backend';
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
    console.error('Erro no proxy de bulk-fetch-missing:', error);
    return NextResponse.json(
      { message: error?.message || 'Erro interno ao processar varredura' },
      { status: 500 }
    );
  }
}
