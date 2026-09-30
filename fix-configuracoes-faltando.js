const axios = require('axios');

async function fixConfiguracoesFaltando() {
  console.log('🔧 Corrigindo configurações faltando no sistema\n');

  const baseURL = 'http://localhost:8081';
  let token = null;

  // 1. Verificar se o backend está rodando
  console.log('🌐 Verificando backend...');
  try {
    const response = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend respondendo:', response.status);
  } catch (error) {
    console.log('❌ Backend não está respondendo');
    console.log('💡 Execute: node restart-backend.js');
    return;
  }

  // 2. Fazer login para obter token de admin
  console.log('\n🔐 Fazendo login como admin...');
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso');
    
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data?.message);
    return;
  }

  // 3. Verificar configurações atuais
  console.log('\n📋 Verificando configurações atuais...');
  try {
    const settingsResponse = await axios.get(`${baseURL}/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ ${settingsResponse.data.length} configurações encontradas`);
    
    // Verificar se carousel_autoplay_interval existe
    const carouselConfig = settingsResponse.data.find(s => s.key === 'carousel_autoplay_interval');
    if (carouselConfig) {
      console.log('✅ Configuração carousel_autoplay_interval já existe');
    } else {
      console.log('❌ Configuração carousel_autoplay_interval NÃO encontrada');
    }

  } catch (error) {
    console.log('❌ Erro ao verificar configurações:', error.response?.status, error.response?.data?.message);
  }

  // 4. Inicializar configurações padrão
  console.log('\n🔧 Inicializando configurações padrão...');
  try {
    // Verificar se existe endpoint para inicializar configurações
    const initResponse = await axios.post(`${baseURL}/settings/initialize`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Configurações padrão inicializadas:', initResponse.data.message);

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️ Endpoint de inicialização não encontrado');
      console.log('💡 Vou criar as configurações manualmente...');
      
      // Criar configurações manualmente
      await criarConfiguracoesManuais(baseURL, token);
    } else {
      console.log('❌ Erro ao inicializar configurações:', error.response?.data?.message);
    }
  }

  // 5. Verificar se as configurações foram criadas
  console.log('\n🔍 Verificando configurações após correção...');
  try {
    const verifyResponse = await axios.get(`${baseURL}/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`✅ Total de configurações: ${verifyResponse.data.length}`);
    
    const carouselConfig = verifyResponse.data.find(s => s.key === 'carousel_autoplay_interval');
    if (carouselConfig) {
      console.log('✅ Configuração carousel_autoplay_interval agora existe!');
      console.log(`   - Valor: ${carouselConfig.value}ms`);
      console.log(`   - Categoria: ${carouselConfig.category}`);
    } else {
      console.log('❌ Configuração ainda não foi criada');
    }

  } catch (error) {
    console.log('❌ Erro ao verificar configurações:', error.response?.data?.message);
  }

  console.log('\n🏁 Correção concluída!');
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Recarregue a página do admin');
  console.log('   2. O erro de configuração não deve mais aparecer');
  console.log('   3. As configurações do sistema devem funcionar normalmente');
}

async function criarConfiguracoesManuais(baseURL, token) {
  const configuracoesPadrao = [
    {
      key: 'carousel_autoplay_interval',
      value: '5000',
      type: 'NUMBER',
      category: 'GENERAL',
      label: 'Intervalo do Carrossel (ms)',
      description: 'Tempo em milissegundos entre as transições automáticas do carrossel principal',
      required: true,
      order: 2
    },
    {
      key: 'store_name',
      value: 'Loja Moderna',
      type: 'TEXT',
      category: 'GENERAL',
      label: 'Nome da Loja',
      description: 'Nome da loja exibido no sistema',
      required: true,
      order: 1
    },
    {
      key: 'ai_provider',
      value: 'openai',
      type: 'TEXT',
      category: 'AI',
      label: 'Provedor de IA',
      description: 'Provedor de IA a ser usado (openai, gemini, anthropic)',
      required: true,
      order: 1
    }
  ];

  console.log('📝 Criando configurações essenciais...');
  
  for (const config of configuracoesPadrao) {
    try {
      const createResponse = await axios.post(`${baseURL}/settings`, config, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Configuração '${config.key}' criada`);
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠️ Configuração '${config.key}' já existe`);
      } else {
        console.log(`❌ Erro ao criar '${config.key}':`, error.response?.data?.message);
      }
    }
  }
}

// Executar correção
fixConfiguracoesFaltando().catch(console.error);