import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const N8N_WEBHOOK_URL = process.env.N8N_LIA_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Se houver Webhook do n8n configurado, envia para o n8n primeiro (Multimodal: Áudio, Imagem e Texto)
    if (N8N_WEBHOOK_URL) {
      try {
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: body.message || body.text || '',
            persona: body.persona || 'lia',
            userId: body.userId || 'guest',
            conversationId: body.conversationId || '',
            audioBase64: body.audioBase64 || null,
            imageBase64: body.imageBase64 || null,
            imageUrl: body.imageUrl || null,
            context: body.context || {},
            timestamp: new Date().toISOString(),
          }),
        });

        if (n8nResponse.ok) {
          const n8nData = await n8nResponse.json();
          return NextResponse.json({
            success: true,
            response: n8nData.response || n8nData.output || n8nData.text || n8nData.message || '',
            products: n8nData.products || [],
            source: 'n8n',
          });
        } else {
          console.warn('n8n Webhook retornou status:', n8nResponse.status, '- usando fallback backend');
        }
      } catch (n8nErr) {
        console.warn('Erro ao conectar com n8n Webhook, usando fallback backend:', n8nErr);
      }
    }

    // 2. Fallback para o Backend NestJS / Supabase AI
    const response = await fetch(`${BACKEND_URL}/ai-personas/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Fallback local caso o backend não esteja respondendo
      return NextResponse.json({
        success: true,
        response: `Olá! Sou a ${body.persona === 'ze' ? 'Zé da Obra' : 'Lia'} da HubObra. Recebi sua mensagem e estou pronta para ajudar com materiais, cotações e entrega rápida em até 24h na sua obra! Como posso ajudar você agora?`,
        source: 'local_fallback',
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in personas chat API:', error);
    return NextResponse.json(
      { 
        success: true,
        response: 'Olá! Sou a Lia da HubObra. Como posso ajudar com sua obra hoje?',
        source: 'safe_fallback'
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'AI Personas Chat API is running',
    n8nConfigured: !!N8N_WEBHOOK_URL
  });
}
