import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetch(`${API_BASE_URL}/components/home-sections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao atualizar seção' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Erro na rota PUT /api/components/home-sections/${params.id}:`, error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetch(`${API_BASE_URL}/components/home-sections/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao excluir seção' }));
      return NextResponse.json({ error: error.message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Erro na rota DELETE /api/components/home-sections/${params.id}:`, error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
