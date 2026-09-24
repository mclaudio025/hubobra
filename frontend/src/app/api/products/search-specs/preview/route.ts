import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products/search-specs/preview?${queryString}` : '/products/search-specs/preview';

    const response = await fetchBackend(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Erro ao buscar prévia de especificações';
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
    console.error('Erro no proxy de preview de specs:', error);
    return NextResponse.json(
      { message: error?.message || 'Erro interno ao buscar especificações' },
      { status: 500 }
    );
  }
}
