import { NextRequest, NextResponse } from 'next/server';
import { POST as ttsGeminiHandler } from '../tts/route';

/**
 * Rota de compatibilidade retroativa
 * Encaminha chamadas do legado para o novo motor nativo Gemini Flash TTS
 */
export async function POST(req: NextRequest) {
  try {
    return await ttsGeminiHandler(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro no processamento de TTS' }, { status: 500 });
  }
}
