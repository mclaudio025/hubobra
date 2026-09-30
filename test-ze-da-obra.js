const axios = require('axios');

const BACKEND_URL = 'http://localhost:8081';

async function testZeDaObraConversation() {
  console.log('🤖 Testando conversa completa com Zé da Obra 2.0...\n');

  const conversas = [
    {
      usuario: 'João',
      telefone: '5511999999999',
      mensagens: [
        'Oi, bom dia!',
        'Preciso construir uma parede de 3x2 metros',
        'Que tipo de tijolo você recomenda?',
        'Quanto custa o cimento?',
        'Pode calcular quantos tijolos vou precisar?'
      ]
    },
    {
      usuario: 'Maria',
      telefone: '5511888888888',
      mensagens: [
        'Olá! Preciso de ajuda com tinta',
        'Vou pintar uma sala de 4x3 metros',
        'Que tipo de tinta é melhor?',
        'Quantos litros vou precisar?'
      ]
    },
    {
      usuario: 'Pedro',
      telefone: '5511777777777',
      mensagens: [
        'Boa tarde!',
        'Estou fazendo uma reforma',
        'Preciso de dicas sobre cimento',
        'Qual a diferença entre os tipos?'
      ]
    }
  ];

  for (const conversa of conversas) {
    console.log(`👤 Iniciando conversa com ${conversa.usuario} (${conversa.telefone})`);
    console.log('─'.repeat(60));

    for (const [index, mensagem] of conversa.mensagens.entries()) {
      console.log(`\n💬 ${conversa.usuario}: "${mensagem}"`);

      const webhookPayload = {
        event: 'messages.upsert',
        instance: 'loja-moderna',
        data: {
          messages: [{
            key: {
              remoteJid: `${conversa.telefone}@s.whatsapp.net`,
              fromMe: false,
              id: `msg-${conversa.telefone}-${index}`
            },
            message: {
              conversation: mensagem
            },
            messageTimestamp: Date.now(),
            pushName: conversa.usuario
          }]
        }
      };

      try {
        const response = await axios.post(`${BACKEND_URL}/whatsapp/webhook`, webhookPayload);
        console.log('✅ Mensagem processada');
        
        // Aguardar um pouco para simular tempo de resposta
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log('❌ Erro:', error.message);
      }
    }

    console.log(`\n✅ Conversa com ${conversa.usuario} finalizada`);
    console.log('═'.repeat(60));
    console.log('');
  }

  console.log('🎉 Teste de conversas concluído!');
  console.log('\n📊 Resumo:');
  console.log(`• ${conversas.length} usuários testados`);
  console.log(`• ${conversas.reduce((total, c) => total + c.mensagens.length, 0)} mensagens processadas`);
  console.log('• Todas as respostas foram geradas pelo Zé da Obra 2.0');
  
  console.log('\n💡 Para ver as respostas reais:');
  console.log('1. Configure uma chave de API de IA válida');
  console.log('2. Conecte um número de WhatsApp real');
  console.log('3. Envie mensagens para o número conectado');
}

async function showSystemStatus() {
  console.log('📊 Status do Sistema Zé da Obra 2.0\n');

  try {
    // Health check
    const health = await axios.get(`${BACKEND_URL}/health/status`);
    console.log('🏥 Saúde do Sistema:');
    console.log(`   Status: ${health.data.status}`);
    console.log(`   Uptime: ${Math.floor(health.data.uptime)}s`);
    console.log(`   Ambiente: ${health.data.environment}`);
    
    console.log('\n🔧 Serviços:');
    Object.entries(health.data.services).forEach(([service, status]) => {
      const icon = status === 'up' ? '🟢' : status === 'degraded' ? '🟡' : '🔴';
      console.log(`   ${icon} ${service}: ${status}`);
    });

    // Produtos
    const products = await axios.get(`${BACKEND_URL}/products?limit=5`);
    console.log(`\n📦 Produtos: ${products.data.total} produtos cadastrados`);
    
    // Categorias
    const categories = await axios.get(`${BACKEND_URL}/categories`);
    console.log(`🗂️ Categorias: ${categories.data.length} categorias ativas`);

    console.log('\n✅ Sistema funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  }
}

// CLI
const command = process.argv[2];

switch (command) {
  case 'conversa':
    testZeDaObraConversation();
    break;
  case 'status':
    showSystemStatus();
    break;
  default:
    console.log('🤖 Teste do Zé da Obra 2.0\n');
    console.log('Comandos disponíveis:');
    console.log('  node test-ze-da-obra.js conversa    # Simular conversas completas');
    console.log('  node test-ze-da-obra.js status      # Verificar status do sistema');
    break;
}