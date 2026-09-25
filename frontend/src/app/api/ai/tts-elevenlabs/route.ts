import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_67f8bd0467303175138623ceb61f5480d5807e1cf5eef5e4';

export async function POST(req: NextRequest) {
  try {
    const { text, persona } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

    // Voice IDs do ElevenLabs
    // Sarah/Bella para Lia (Feminino acolhedor comercial)
    // Adam/Roger para Zé da Obra (Masculino técnico confiante)
    const voiceId = persona === 'ze' 
      ? 'pNInz6obpgDQGcFmaJgB' // Adam
      : 'EXAVITQu4vr4xnSDxMaL'; // Sarah / Bella

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
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
