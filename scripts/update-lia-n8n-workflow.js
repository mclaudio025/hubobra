const fs = require('fs');
const https = require('https');

const raw = fs.readFileSync('n8n_current_lia_workflow.json', 'utf8');
const wf = JSON.parse(raw);

// Sincronizador com o DESKCOMM CRM
const deskcommSyncCode = `
// 💬 SINCRONIZAÇÃO COMPLETA COM O DESKCOMM CRM HUBOBRA
const initialData = $('⚙️ Normalizar Mensagem').first().json;
const formatData = $('📝 Formatar Resposta WhatsApp').first().json;
const agentData = $('Agente IA Lia e Zé da Obra').first().json;

let rawPhone = String(initialData.phone || initialData.from || '').replace(/\\D/g, '');
if (!rawPhone.startsWith('55') && rawPhone.length <= 11) {
  rawPhone = '55' + rawPhone;
}
const senderName = initialData.name || 'Cliente WhatsApp';
const clientMessage = initialData.messageText || formatData.clientText || 'Áudio recebido do cliente';
const liaResponse = formatData.respostaFormatada || agentData.output || 'Mensagem enviada pela Lia';

const DESKCOMM_WEBHOOK_URL = 'https://atendimento-deskcomm.q6zw3x.easypanel.host/api/v1/webhooks/uazapi';

return (async () => {
  try {
    // 1. Sincronizar Mensagem do Cliente no Deskcomm CRM
    await this.helpers.httpRequest({
      method: 'POST',
      url: DESKCOMM_WEBHOOK_URL,
      headers: { 'Content-Type': 'application/json' },
      body: {
        instance: 'hubobra',
        from: rawPhone,
        senderName: senderName,
        text: clientMessage,
        fromMe: false
      },
      json: true,
      timeout: 8000
    });

    // 2. Sincronizar Resposta da Lia no Deskcomm CRM
    await this.helpers.httpRequest({
      method: 'POST',
      url: DESKCOMM_WEBHOOK_URL,
      headers: { 'Content-Type': 'application/json' },
      body: {
        instance: 'hubobra',
        from: rawPhone,
        senderName: 'Lia (IA)',
        text: liaResponse,
        fromMe: true
      },
      json: true,
      timeout: 8000
    });

    console.log('✅ Mensagens do Cliente e da Lia sincronizadas no Deskcomm CRM para:', rawPhone);
    return [{ json: { success: true, phone: rawPhone } }];
  } catch(err) {
    console.error('Erro ao sincronizar com Deskcomm CRM:', err.message);
    return [{ json: { success: false, error: err.message } }];
  }
})();
`;

// Remover nós antigos chatwoot e adicionar o nó Deskcomm
wf.nodes = wf.nodes.filter(n => !n.id.startsWith('chatwoot-'));

wf.nodes.push({
  parameters: {
    jsCode: deskcommSyncCode
  },
  id: 'deskcomm-sync-unified',
  name: '💬 Sincronizar com Deskcomm CRM',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1920, 736]
});

// Limpar conexões antigas do Chatwoot
delete wf.connections['💬 Chatwoot: Criar/Obter Contato'];
delete wf.connections['💬 Chatwoot: Abrir Conversa'];
delete wf.connections['💬 Chatwoot: Mensagem Cliente'];
delete wf.connections['💬 Chatwoot: Resposta Lia'];
delete wf.connections['💬 Sincronizar com Chatwoot / Balcão'];

// Ajustar conexões válidas
wf.connections['📤 Enviar Foto + Legenda'] = {
  main: [[{ node: '💬 Sincronizar com Deskcomm CRM', type: 'main', index: 0 }]]
};

wf.connections['📤 Enviar Texto'] = {
  main: [[{ node: '💬 Sincronizar com Deskcomm CRM', type: 'main', index: 0 }]]
};

if (wf.connections['Precisa de Texto ou Foto?']) {
  wf.connections['Precisa de Texto ou Foto?'].main[1] = [{ node: '💬 Sincronizar com Deskcomm CRM', type: 'main', index: 0 }];
}

wf.connections['💬 Sincronizar com Deskcomm CRM'] = {
  main: [[{ node: '💾 Salvar/Atualizar Memória do Cliente (Supabase)', type: 'main', index: 0 }]]
};

// Salvar payload atualizado
const payload = JSON.stringify({
  name: wf.name,
  nodes: wf.nodes,
  connections: wf.connections,
  settings: wf.settings || {}
});

const options = {
  hostname: 'n8n-n8n.q6zw3x.easypanel.host',
  port: 443,
  path: '/api/v1/workflows/IL2N96Rp8RSv6Hyz',
  method: 'PUT',
  headers: {
    'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMjFkYmNlOC0zNzMyLTQ1YTItODlhNy04YTQyOTEzZGQ4YzciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMTE0NTgwOTctNjkyOS00N2E1LTk2NDctODY1MGRhOTVhZTljIiwiaWF0IjoxNzkxMjQyMzE5LCJleHAiOjE3OTM3Njg0MDB9.aBKYL-y14lcImYwFrnBOr3j6w6l-ept0GHDGovmrY6k',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS UPDATE N8N:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ WORKFLOW DA LIA 100% DIRECIONADO PARA O DESKCOMM CRM!');
    } else {
      console.log('RESPOSTA:', data.slice(0, 500));
    }
  });
});
req.on('error', (e) => console.error('ERRO:', e));
req.write(payload);
req.end();
