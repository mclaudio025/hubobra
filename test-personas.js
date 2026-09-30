const axios = require('axios');

const BASE_URL = 'http://localhost:8081';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPersonas() {
  log('🤖 Testando Sistema de Personas: Lia + Zé da Obra\n', 'cyan');

  const sessionId = `test_${Date.now()}`;
  
  const testScenarios = [
    {
      name: '👋 Saudação - Deve ser atendida pela Lia',
      messages: ['Olá!'],
      expectedPersona: 'lia'
    },
    {
      name: '📦 Informações Gerais - Lia deve responder',
      messages: ['Qual o horário de funcionamento?', 'Como faço um pedido?'],
      expectedPersona: 'lia'
    },
    {
      name: '🔧 Questão Técnica - Deve transferir para Zé da Obra',
      messages: ['Quanto cimento preciso para uma laje de 20m²?'],
      expectedPersona: 'ze'
    },
    {
      name: '📐 Cálculos Específicos - Zé da Obra especialista',
      messages: ['Preciso calcular material para uma casa de 100m²', 'Que tipo de tijolo você recomenda?'],
      expectedPersona: 'ze'
    },
    {
      name: '🔄 Volta para Lia - Informações gerais novamente',
      messages: ['Vocês fazem entrega?'],
      expectedPersona: 'lia'
    }
  ];

  for (const scenario of testScenarios) {
    log(`\n${scenario.name}`, 'yellow');
    log('─'.repeat(60), 'yellow');

    for (const message of scenario.messages) {
      try {
        log(`\n💬 Usuário: "${message}"`, 'white');
        
        const response = await axios.post(`${BASE_URL}/ai-personas/chat`, {
          message,
          sessionId,
          userName: 'João',
          channel: 'test'
        });

        const data = response.data;
        const persona = data.persona === 'lia' ? '👩‍💼 Lia' : '👨‍🔧 Zé da Obra';
        
        log(`${persona}: ${data.response}`, data.persona === 'lia' ? 'cyan' : 'green');
        
        if (data.shouldTransfer) {
          log(`🔄 Transferindo: ${data.transferReason}`, 'yellow');
        }
        
        if (data.suggestedActions && data.suggestedActions.length > 0) {
          log(`💡 Sugestões: ${data.suggestedActions.join(', ')}`, 'blue');
        }

        // Verificar se a persona está correta
        const isCorrect = data.persona === scenario.expectedPersona;
        log(`✅ Persona esperada: ${scenario.expectedPersona} | Recebida: ${data.persona} ${isCorrect ? '✓' : '✗'}`, 
            isCorrect ? 'green' : 'red');

        // Pequena pausa entre mensagens
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        log(`❌ Erro: ${error.message}`, 'red');
      }
    }
  }

  // Testar contexto da conversa
  log('\n📊 Verificando contexto da conversa...', 'cyan');
  try {
    const contextResponse = await axios.get(`${BASE_URL}/ai-personas/conversation/${sessionId}`);
    const context = contextResponse.data;
    
    log(`Session ID: ${context.sessionId}`, 'white');
    log(`Persona Atual: ${context.currentPersona}`, 'white');
    log(`Mensagens na conversa: ${context.conversationLength}`, 'white');
    log(`Precisa de especialista: ${context.needsSpecialist ? 'Sim' : 'Não'}`, 'white');
    
  } catch (error) {
    log(`❌ Erro ao buscar contexto: ${error.message}`, 'red');
  }

  log('\n🎉 Teste de personas concluído!', 'green');
}

async function testScenarios() {
  log('📋 Cenários de Teste Disponíveis\n', 'cyan');
  
  try {
    const response = await axios.get(`${BASE_URL}/ai-personas/test/scenarios`);
    const scenarios = response.data.scenarios;
    
    scenarios.forEach((scenario, index) => {
      log(`${index + 1}. ${scenario.name}`, 'yellow');
      log(`   Persona esperada: ${scenario.expectedPersona}`, 'white');
      log(`   Descrição: ${scenario.description}`, 'blue');
      log(`   Mensagens de teste: ${scenario.messages.join(', ')}`, 'cyan');
      log('');
    });
    
  } catch (error) {
    log(`❌ Erro ao buscar cenários: ${error.message}`, 'red');
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await testPersonas();
      break;
    case 'scenarios':
      await testScenarios();
      break;
    default:
      log('🤖 Teste do Sistema de Personas\n', 'cyan');
      log('Comandos disponíveis:', 'white');
      log('  node test-personas.js test       # Executar teste completo', 'cyan');
      log('  node test-personas.js scenarios # Ver cenários de teste', 'cyan');
      break;
  }
}

main().catch(console.error);