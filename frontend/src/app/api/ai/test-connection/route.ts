import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, api_key, model } = body;

    if (!provider || !api_key) {
      return NextResponse.json(
        { error: 'Provedor e chave API são obrigatórios' },
        { status: 400 }
      );
    }

    // Testar conexão baseado no provedor
    let testResult = false;
    let errorMessage = '';

    if (provider === 'openai') {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${api_key}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          testResult = true;
        } else {
          const error = await response.json();
          errorMessage = error.error?.message || 'Erro na API OpenAI';
        }
      } catch (error) {
        errorMessage = 'Erro de conexão com OpenAI';
      }
    } else if (provider === 'gemini') {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${api_key}`);
        
        if (response.ok) {
          testResult = true;
        } else {
          const error = await response.json();
          errorMessage = error.error?.message || 'Erro na API Gemini';
        }
      } catch (error) {
        errorMessage = 'Erro de conexão com Gemini';
      }
    } else {
      errorMessage = 'Provedor não suportado';
    }

    if (testResult) {
      return NextResponse.json({
        success: true,
        message: `Conexão com ${provider} funcionando corretamente!`,
        provider,
        model
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          provider 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao testar conexão IA:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
