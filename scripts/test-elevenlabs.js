const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.argv[2] || process.env.ELEVENLABS_API_KEY || 'sk_c8998ff0e39c59bb5ba7dea591a8f08bca37b24acbc27be6';

function requestElevenLabs(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1' + endpoint,
      method,
      headers: {
        'xi-api-key': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      if (res.headers['content-type']?.includes('audio/')) {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks) }));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log('\n======================================================');
  console.log('🎙️ TESTE DE VOZ ELEVENLABS - HUBOBRA');
  console.log('======================================================\n');

  // IDs Padrão Mundiais do ElevenLabs:
  // Rachel (Feminino - Suave/Profissional): 21m00Tcm4TlvDq8ikWAM
  // Bella (Feminino - Jovem/Expressiva): EXAVITQu4vr4xnSDxMaL
  // Adam (Masculino - Firme/Natural): pNInz6obpgDQGcFmaJgB
  // Antoni (Masculino - Amigável/Técnico): ErXwobaYiN019PkySvjV
  const LIA_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella (ótima para Lia)
  const ZE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';  // Adam (ótima para Zé da Obra)

  const audioOutputDir = path.join(__dirname, '..', 'frontend', 'public', 'audio');
  if (!fs.existsSync(audioOutputDir)) {
    fs.mkdirSync(audioOutputDir, { recursive: true });
  }

  // Textos realistas de atendimento HubObra
  const liaText = "Olá, Claudio! Tudo bem? Aqui é a Lia da HubObra! Separei os 30 sacos de cimento e a argamassa que você pediu com 10% de desconto no PIX. Já organizei tudo e consigo colocar no caminhão que sai hoje à tarde para sua obra em Fortaleza! Quer que eu envie a chave copia e cola?";
  const zeText = "Fala parceiro! Zé da Obra na área. Pra esse reboco de 100 metros quadrados, o traço ideal é 1 saco de cimento para 3 carrinhos de areia média lavada e 100 ml de aditivo plastificante. Já deixei a conta certinha pra não faltar material nem ter desperdício!";

  console.log('1️⃣ Gerando áudio de teste da 🙋‍♀️ LIA (Voz Bella - Eleven Multilingual v2)...');
  const liaRes = await requestElevenLabs(`/text-to-speech/${LIA_VOICE_ID}`, 'POST', {
    text: liaText,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.85,
      style: 0.35,
      use_speaker_boost: true
    }
  });

  if (liaRes.buffer) {
    const liaPath = path.join(audioOutputDir, 'lia_elevenlabs.mp3');
    fs.writeFileSync(liaPath, liaRes.buffer);
    console.log(`   ✅ Áudio da Lia gerado com sucesso! (${(liaRes.buffer.length / 1024).toFixed(1)} KB)`);
    console.log(`   📁 Salvo em: ${liaPath}`);
  } else {
    console.error('   ❌ Falha ao gerar áudio da Lia:', liaRes.data || liaRes.raw);
  }

  console.log('\n2️⃣ Gerando áudio de teste do 👷‍♂️ ZÉ DA OBRA (Voz Adam - Eleven Multilingual v2)...');
  const zeRes = await requestElevenLabs(`/text-to-speech/${ZE_VOICE_ID}`, 'POST', {
    text: zeText,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.8,
      style: 0.25,
      use_speaker_boost: true
    }
  });

  if (zeRes.buffer) {
    const zePath = path.join(audioOutputDir, 'ze_elevenlabs.mp3');
    fs.writeFileSync(zePath, zeRes.buffer);
    console.log(`   ✅ Áudio do Zé da Obra gerado com sucesso! (${(zeRes.buffer.length / 1024).toFixed(1)} KB)`);
    console.log(`   📁 Salvo em: ${zePath}`);
  } else {
    console.error('   ❌ Falha ao gerar áudio do Zé da Obra:', zeRes.data || zeRes.raw);
  }

  console.log('\n======================================================');
  console.log('🎉 TESTE FINALIZADO!');
  console.log('======================================================\n');
}

runTest().catch(console.error);
