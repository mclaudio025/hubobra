const https = require('https');

const CHATWOOT_URL = 'https://atendimento-chatwoot.q6zw3x.easypanel.host';
const CHATWOOT_TOKEN = 'EE8HZn79o6Hdp5h2gAcqbFgu';
const ACCOUNT_ID = 1;

function req(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(CHATWOOT_URL + endpoint);
    const options = {
      method,
      headers: {
        'api_access_token': CHATWOOT_TOKEN,
        'Content-Type': 'application/json'
      }
    };
    const r = https.request(u, options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, raw: data }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function setup() {
  console.log('🚀 Iniciando configuração da Caixa de Entrada no Chatwoot...');
  
  // 1. Listar caixas de entrada
  const inboxesRes = await req('/api/v1/accounts/' + ACCOUNT_ID + '/inboxes');
  let inbox = (inboxesRes.data?.payload || []).find(i => i.name === 'WhatsApp HubObra');
  
  if (!inbox) {
    console.log('Criando nova caixa de entrada "WhatsApp HubObra"...');
    const createRes = await req('/api/v1/accounts/' + ACCOUNT_ID + '/inboxes', 'POST', {
      name: 'WhatsApp HubObra',
      channel: {
        type: 'api',
        webhook_url: 'https://n8n-n8n.q6zw3x.easypanel.host/webhook/chatwoot-events'
      }
    });
    console.log('Status da criação da Inbox:', createRes.status);
    inbox = createRes.data;
  } else {
    console.log('Caixa de entrada já existente:', inbox.name, '(ID:', inbox.id, ')');
  }

  const inboxId = inbox?.id;
  console.log('✅ Inbox ID:', inboxId);

  // 2. Associar usuário Claudio à Inbox
  if (inboxId) {
    const addMember = await req('/api/v1/accounts/' + ACCOUNT_ID + '/inbox_members', 'POST', {
      inbox_id: inboxId,
      user_ids: [1]
    });
    console.log('Membro Claudio adicionado à Caixa de Entrada:', addMember.status);
  }

  // 3. Criar Etiquetas no Chatwoot
  const labels = [
    { title: 'IA - Lia', color: '#10B981', description: 'Atendido pela IA Lia' },
    { title: 'Orçamento', color: '#F59E0B', description: 'Orçamento em andamento' },
    { title: 'Pedido Fechado', color: '#3B82F6', description: 'Pedido fechado / pago' },
    { title: 'Atendimento Humano', color: '#EF4444', description: 'Transbordo humano ativo' },
    { title: 'Urgente', color: '#DC2626', description: 'Prioridade alta' }
  ];

  for (const l of labels) {
    const lRes = await req('/api/v1/accounts/' + ACCOUNT_ID + '/labels', 'POST', {
      title: l.title,
      description: l.description,
      color: l.color,
      show_on_sidebar: true
    });
    console.log(`Etiqueta [${l.title}] criada/verificada: status ${lRes.status}`);
  }

  console.log('\n🎉 CONFIGURAÇÃO DO CHATWOOT CONCLUÍDA COM SUCESSO!');
  console.log('Detalhes:');
  console.log('- URL:', CHATWOOT_URL);
  console.log('- Account ID:', ACCOUNT_ID);
  console.log('- Inbox ID:', inboxId);
  console.log('- Inbox Name:', inbox?.name);
}

setup();
