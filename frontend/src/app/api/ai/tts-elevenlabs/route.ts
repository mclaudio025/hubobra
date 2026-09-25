import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_67f8bd0467303175138623ceb61f5480d5807e1cf5eef5e4';

/**
 * Normalizador Fonético para Síntese de Voz (TTS)
 * Garante pronúncia 100% natural de marcas, unidades de medida e valores monetários.
 */
export function normalizeTextForTTS(text: string): string {
  if (!text) return '';
  
  return text
    // 1. Pronúncia oficial da Marca HubObra (Opção 2: Hub em inglês + pausa + Obra em português)
    .replace(/HubObra/gi, 'Hub, Obra')
    .replace(/Hub\s*Obra/gi, 'Hub, Obra')
    .replace(/Hub\s*Construções/gi, 'Hub, Construções')
    .replace(/Hub\s*Construcoes/gi, 'Hub, Construções')
    
    // 2. Termos tecnológicos e pagamentos
    .replace(/\bPIX\b/g, 'Pícs')
    .replace(/\bPix\b/g, 'Pícs')
    .replace(/\bWhatsApp\b/gi, 'Uatizap')
    .replace(/\bWhats\b/gi, 'Uats')
    
    // 3. Unidades de Medida da Construção Civil
    .replace(/(\d+)\s*m²\b/gi, '$1 metros quadrados')
    .replace(/(\d+)\s*m³\b/gi, '$1 metros cúbicos')
    .replace(/(\d+)\s*kg\b/gi, '$1 quilos')
    .replace(/(\d+)\s*un\b/gi, '$1 unidades')
    .replace(/(\d+)\s*cx\b/gi, '$1 caixas')
    
    // 4. Valores em Reais
    .replace(/R\$\s*(\d+)[,\.](\d{2})/g, '$1 reais e $2 centavos')
    .replace(/R\$\s*(\d+)/g, '$1 reais')
    
    // 5. Limpeza de emojis e markdown para áudio limpo
    .replace(/[*_~`#]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
}

export async function POST(req: NextRequest) {
  try {
    const { text, persona } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

    // Aplica a normalização fonética antes de enviar para o ElevenLabs
    const phoneticText = normalizeTextForTTS(text);

    // Voice IDs do ElevenLabs
    const voiceId = persona === 'ze' 
      ? 'pNInz6obpgDQGcFmaJgB' // Adam (Voz do Zé da Obra)
      : 'EXAVITQu4vr4xnSDxMaL'; // Sarah/Bella (Voz da Lia)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: phoneticText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: persona === 'ze' ? 0.55 : 0.45,
          similarity_boost: 0.85,
          style: 0.35,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: 'Erro no ElevenLabs', details: err }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
