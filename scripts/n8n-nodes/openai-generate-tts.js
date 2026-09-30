// 🗣️ GERAR ÁUDIO GEMINI 2.5 PRO TTS VIA KIE.AI (COM FALLBACK RESILIENTE E HIGIENIZAÇÃO DE PREÇOS)
const item = $input.first().json;
let text = item.speechText || '';
const isZe = Boolean(item.isZePersona);
const voiceName = isZe ? 'Charon' : 'Aoede';
const apiKey = 'b30b1489000ba908bd72cc04e0d6cc16';

if (!text || text.trim().length === 0) {
  return [{ json: { ...item, audioGeneratedUrl: null, hasAudioUrl: false } }];
}

// Sanitização final de segurança contra "zero centavos" e números formatados
text = text
  .replace(/R\$\s*([0-9]+)[,\.]00\b/gi, '$1 reais')
  .replace(/R\$\s*([0-9]+)[,\.]([0-9]{1,2})\b/gi, (m, r, c) => parseInt(c, 10) === 0 ? r + ' reais' : r + ' reais e ' + c + ' centavos')
  .replace(/R\$\s*([0-9]+)/gi, '$1 reais')
  .replace(/\b([0-9]+)[,\.]00\s*reais\b/gi, '$1 reais')
  .replace(/\b([0-9]+)[,\.]00\b/g, '$1')
  .replace(/\s+e\s+(?:00|zero|0)\s+centavos\b/gi, '')
  .replace(/\s+(?:00|zero|0)\s+centavos\b/gi, '')
  .replace(/\s+vírgula\s+zero\s+zero\b/gi, '')
  .replace(/\s+virgula\s+zero\s+zero\b/gi, '')
  .trim();

return (async () => {
  let audioUrl = null;

  try {
    // 1. Criar tarefa na Kie
    const createRes = await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://api.kie.ai/api/v1/jobs/createTask',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: {
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
      },
      json: true,
      timeout: 15000
    });

    const taskId = createRes.data?.taskId || createRes.data?.recordId || createRes.taskId;
    
    if (taskId) {
      // 2. Polling com até 40 tentativas de 1.2s (48 segundos)
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 1200));
        try {
          const pollRes = await this.helpers.httpRequest({
            method: 'GET',
            url: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + taskId,
            headers: { 'Authorization': 'Bearer ' + apiKey },
            json: true,
            timeout: 10000
          });

          const d = pollRes?.data || pollRes;
          if (d && (d.state === 'success' || d.status === 'success')) {
            let urls = d.response?.resultUrls || d.resultUrls;
            if (!urls && d.resultJson) {
              try {
                const parsed = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : d.resultJson;
                urls = parsed?.resultUrls;
              } catch(_) {}
            }
            if (urls && urls[0]) {
              audioUrl = urls[0];
              console.log('✅ Áudio gerado com sucesso pela Kie:', audioUrl);
              break;
            }
          }
          if (d && (d.state === 'failed' || d.status === 'failed')) {
            console.error('Falha na Kie:', d.failMsg || d.msg);
            break;
          }
        } catch(pollErr) {
          console.error('Erro no polling Kie:', pollErr.message);
        }
      }
    }
  } catch(err) {
    console.error('Erro na criação de TTS Kie:', err.message);
  }

  // Retorna sempre com sucesso, garantindo que o fluxo prossiga mesmo se o áudio falhar
  return [{
    json: {
      ...item,
      speechText: text,
      audioGeneratedUrl: audioUrl,
      hasAudioUrl: Boolean(audioUrl),
      voiceUsed: voiceName,
      engine: 'Gemini-2.5-Pro-TTS'
    }
  }];
})();
