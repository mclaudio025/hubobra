import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/backend-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const authHeader = request.headers.get('Authorization') || '';

    const headers: Record<string, string> = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetchBackend('/upload/images/multiple', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro no upload' }));
      const errorMessage = response.status === 401 
        ? 'Sessão expirada ou não autorizada. Faça login novamente no painel.' 
        : (error.message || error.error || `Erro ${response.status} no upload`);
      return NextResponse.json({ message: errorMessage, error: errorMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro no proxy de upload de múltiplas imagens:', error);
    return NextResponse.json(
      { message: error?.message || 'Erro interno do servidor no upload', error: error?.message },
      { status: 500 }
    );
  }
}
