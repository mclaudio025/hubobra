import { NextRequest, NextResponse } from 'next/server';

/**
 * Normalizador Fonético Especializado para Construção Civil e E-commerce HubObra
 */
export function normalizeTextForTTS(text: string): string {
  if (!text) return '';

  return text
    // 1. Pronúncia oficial da Marca HubObra
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
    .replace(/(\d+)\s*sc\b/gi, '$1 sacos')

    // 4. Valores Monetários em Reais
    .replace(/R\$\s*(\d+)[,\.](\d{2})/g, '$1 reais e $2 centavos')
    .replace(/R\$\s*(\d+)/g, '$1 reais')

    // 5. Limpeza de formatação markdown e emojis
    .replace(/[*_~`#]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * Adiciona cabeçalho WAV padrão a um buffer PCM linear (16-bit, 24000Hz, mono)
 */
function createWavFromPcm(pcmData: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);

  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

/**
 * Executa síntese de voz usando a API da Kie.ai (Gemini 2.5 Pro TTS)
 */
async function generateWithKie(apiKey: string, text: string, voiceName: string): Promise<Buffer> {
  // 1. Criar tarefa na Kie
  const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2-5-pro-tts',
      input: {
        speakers: [
          {
            speaker_id: 'Speaker 1',
            voice_name: voiceName
          }
        ],
        dialogue_turns: [
          {
            speaker_id: 'Speaker 1',
            text: text
          }
        ]
      }
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Erro ao criar tarefa na Kie: ${errText}`);
  }

  const createData = await createRes.json();
  const taskId = createData.data?.taskId || createData.data?.recordId;

  if (!taskId) {
    throw new Error(`Kie não retornou taskId: ${JSON.stringify(createData)}`);
  }

  // 2. Polling até concluir
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    
    const infoRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (infoRes.ok) {
      const infoData = await infoRes.json();
      if (infoData.data?.state === 'success' && infoData.data?.response?.resultUrls?.[0]) {
        const audioUrl = infoData.data.response.resultUrls[0];
        const audioFetch = await fetch(audioUrl);
        const arrayBuf = await audioFetch.arrayBuffer();
        return Buffer.from(arrayBuf);
      }
      if (infoData.data?.state === 'failed') {
        throw new Error(`Falha na geração de áudio pela Kie: ${infoData.data?.failMsg || 'Erro desconhecido'}`);
      }
    }
  }

  throw new Error('Timeout aguardando processamento de áudio na Kie');
}

/**
 * Executa síntese de voz usando a API Direta do Google Gemini
 */
async function generateWithGoogle(apiKey: string, promptText: string, voiceName: string, model: string): Promise<Buffer> {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName
          }
        }
      }
    }
  };

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro no Google Gemini: ${err}`);
  }

  const result = await response.json();
  const candidate = result.candidates?.[0];
  const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);

  if (!audioPart || !audioPart.inlineData?.data) {
    throw new Error('Nenhum dado de áudio retornado pelo Google Gemini');
  }

  const mimeType = audioPart.inlineData.mimeType || 'audio/wav';
  const rawBuffer = Buffer.from(audioPart.inlineData.data, 'base64');

  if (mimeType.includes('pcm') || (!mimeType.includes('mp3') && !mimeType.includes('wav') && rawBuffer.slice(0, 4).toString('ascii') !== 'RIFF')) {
    return createWavFromPcm(rawBuffer, 24000, 1, 16);
  }

  return rawBuffer;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      text, 
      persona = 'lia', 
      voice, 
      apiKey: customApiKey,
      model = 'gemini-2.0-flash'
    } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

    const apiKey = customApiKey || process.env.KIE_API_KEY || process.env.GEMINI_API_KEY || 'b30b1489000ba908bd72cc04e0d6cc16';

    const phoneticText = normalizeTextForTTS(text);

    // Mapeamento oficial de vozes HubObra
    let selectedVoice = voice;
    if (!selectedVoice) {
      selectedVoice = persona === 'ze' ? 'Charon' : 'Aoede';
    }

    let audioBuffer: Buffer;

    // Detecta se a chave é da Kie (formato 32 caracteres hex) ou do Google (AIzaSy...)
    const isKieKey = apiKey.length === 32 && !apiKey.startsWith('AIzaSy');

    if (isKieKey) {
      audioBuffer = await generateWithKie(apiKey, phoneticText, selectedVoice);
    } else {
      const promptInstruction = persona === 'ze' 
        ? `Fale com autoridade técnica e clareza como o Zé da Obra da HubObra: "${phoneticText}"`
        : `Fale de forma simpática, entusiasmada e acolhedora como a Lia da HubObra: "${phoneticText}"`;
      audioBuffer = await generateWithGoogle(apiKey, promptInstruction, selectedVoice, model);
    }

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=86400',
        'X-Voice-Used': selectedVoice,
        'X-Engine': isKieKey ? 'Kie-Gemini-TTS' : 'Google-Gemini-TTS'
      }
    });

  } catch (error: any) {
    console.error('Erro na rota TTS:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno no processamento de TTS' 
    }, { status: 500 });
  }
}
