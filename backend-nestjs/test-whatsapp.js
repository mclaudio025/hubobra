const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8081';
const EVOLUTION_URL = process.env.EVOLUTION_URL || 'http://localhost:8080';
const INSTANCE_NAME = process.env.INSTANCE_NAME || 'loja-moderna';
const API_KEY = process.env.API_KEY || 'your-api-key';

async function testWhatsAppIntegration() {
  console.log('🤖 Testando integração WhatsApp + IA...\n');

  try {
    // 1. Verificar Evolution API
    console.log('📱 Verificando Evolution API...');
    const evolutionStatus = await axios.get(EVOLUTION_URL);
    console.log(`✅ Evolution API: ${evolutionStatus.data.message}`);
    console.log(`   Versão: ${evolutionStatus.data.version}\n`);

    // 2. Verificar backend
    console.log('🔧 Verificando backend...');
    const backendHealth = await axios.get(`${BACKEND_URL}/health/status`);
    console.log(`✅ Backend: ${backendHealth.data.status}\n`);

    // 3. Criar instância WhatsApp
    console.log('📲 Criando instância WhatsApp...');
    try {
      const createInstance = await axios.post(`${BACKEND_URL}/whatsapp/create-instance`, {}, {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN', // Substitua por um token válido
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Instância criada com sucesso');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Instância não criada (precisa de token admin)');
      } else {
        console.log('⚠️ Instância pode já existir ou erro:', error.message);
      }
    }

    // 4. Verificar status da instância
    console.log('\n📊 Verificando status da instância...');
    try {
      const instanceStatus = await axios.get(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': API_KEY }
      });
      console.log(`✅ Status da instância: ${instanceStatus.data.instance?.state || 'unknown'}`);
    } catch (error) {
      console.log('⚠️ Não foi possível verificar status da instância');
    }

    // 5. Simular webhook de mensagem
    console.log('\n💬 Simulando recebimento de mensagem...');
    const webhookPayload = {
      event: 'messages.upsert',
      instance: INSTANCE_NAME,
      data: {
        messages: [{
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'test-message-id'
          },
          message: {
            conversation: 'Olá, preciso de cimento para minha obra'
          },
          messageTimestamp: Date.now(),
          pushName: 'Cliente Teste'
        }]
      }
    };

    const webhookResponse = await axios.post(`${BACKEND_URL}/whatsapp/webhook`, webhookPayload);
    console.log('✅ Webhook processado com sucesso');

    // 6. Testar diferentes tipos de mensagem
    console.log('\n🧪 Testando diferentes tipos de mensagem...');
    
    const testMessages = [
      'Oi, bom dia!',
      'Preciso de tinta para pintar minha casa',
      'Quantos tijolos preciso para uma parede de 3x2 metros?',
      'Qual o preço do cimento?',
      'Como calcular a quantidade de areia?'
    ];

    for (const [index, message] of testMessages.entries()) {
      console.log(`\n   Teste ${index + 1}: "${message}"`);
      
      const testPayload = {
        event: 'messages.upsert',
        instance: INSTANCE_NAME,
        data: {
          messages: [{
            key: {
              remoteJid: `551199999999${index}@s.whatsapp.net`,
              fromMe: false,
              id: `test-message-${index}`
            },
            message: {
              conversation: message
            },
            messageTimestamp: Date.now(),
            pushName: `Cliente ${index + 1}`
          }]
        }
      };

      try {
        await axios.post(`${BACKEND_URL}/whatsapp/webhook`, testPayload);
        console.log('   ✅ Processado com sucesso');
      } catch (error) {
        console.log('   ❌ Erro:', error.message);
      }
    }

    console.log('\n🎉 Teste de integração concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Configure um token de admin válido');
    console.log('2. Escaneie o QR Code para conectar o WhatsApp');
    console.log('3. Envie mensagens para o número conectado');
    console.log('4. Monitore os logs do backend para ver as respostas');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Dicas:');
      console.log('- Verifique se o Evolution API está rodando na porta 8080');
      console.log('- Verifique se o backend está rodando na porta 8081');
      console.log('- Execute: docker ps | grep evolution');
    }
  }
}

async function showQRCode() {
  console.log('📱 Obtendo QR Code para conectar WhatsApp...\n');
  
  try {
    const response = await axios.get(`${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`, {
      headers: { 'apikey': API_KEY }
    });
    
    if (response.data.base64) {
      console.log('✅ QR Code obtido com sucesso!');
      console.log('📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
      console.log(response.data.base64);
    } else {
      console.log('⚠️ QR Code não disponível. A instância pode já estar conectada.');
    }
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error.message);
  }
}

async function sendTestMessage() {
  const phone = process.argv[3];
  const message = process.argv[4] || 'Olá! Esta é uma mensagem de teste do Zé da Obra 2.0! 🤖';
  
  if (!phone) {
    console.log('❌ Número de telefone é obrigatório');
    console.log('Uso: node test-whatsapp.js send 5511999999999 "Mensagem de teste"');
    return;
  }
  
  console.log(`📤 Enviando mensagem de teste para ${phone}...\n`);
  
  try {
    const response = await axios.post(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, {
      number: phone,
      text: message
    }, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      }
    });
    
    console.log('✅ Mensagem enviada com sucesso!');
    console.log('📱 Verifique o WhatsApp do destinatário');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
  }
}

// CLI
const command = process.argv[2];

switch (command) {
  case 'test':
    testWhatsAppIntegration();
    break;
  case 'qr':
    showQRCode();
    break;
  case 'send':
    sendTestMessage();
    break;
  default:
    console.log('🤖 Teste de Integração WhatsApp + IA\n');
    console.log('Comandos disponíveis:');
    console.log('  node test-whatsapp.js test                    # Teste completo');
    console.log('  node test-whatsapp.js qr                      # Mostrar QR Code');
    console.log('  node test-whatsapp.js send <phone> [message]  # Enviar mensagem teste');
    console.log('\nExemplos:');
    console.log('  node test-whatsapp.js send 5511999999999 "Olá!"');
    break;
}