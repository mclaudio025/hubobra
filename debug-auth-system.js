const axios = require('axios');

async function debugAuthSystem() {
  console.log('🔍 Debug do Sistema de Autenticação...\n');

  const baseURL = 'http://localhost:3001';

  // Teste 1: Verificar se o backend está respondendo
  console.log('🌐 Teste 1: Verificando conectividade do backend...');
  try {
    const response = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend respondendo:', response.status);
    console.log('📋 Health data:', response.data);
  } catch (error) {
    console.log('❌ Backend não está respondendo:', error.message);
    return;
  }

  // Teste 2: Verificar endpoint de auth
  console.log('\n🔐 Teste 2: Verificando endpoint de auth...');
  try {
    const response = await axios.post(`${baseURL}/auth/login`, {
      email: 'test@invalid.com',
      password: 'invalid'
    });
    console.log('⚠️ Login inválido aceito (não deveria acontecer)');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Endpoint de auth funcionando (rejeitou login inválido)');
    } else {
      console.log('❌ Erro inesperado:', error.response?.status, error.response?.data);
    }
  }

  // Teste 3: Tentar login com admin
  console.log('\n👤 Teste 3: Tentando login com admin...');
  try {
    const response = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    console.log('✅ Login admin realizado com sucesso!');
    console.log('📋 User data:', {
      id: response.data.user?.id,
      name: response.data.user?.name,
      email: response.data.user?.email,
      role: response.data.user?.role
    });
    
    const token = response.data.access_token;
    console.log('🔑 Token recebido:', token ? 'SIM' : 'NÃO');
    
    if (token) {
      // Teste 4: Usar token para acessar rota protegida
      console.log('\n🛡️ Teste 4: Testando rota protegida...');
      try {
        const protectedResponse = await axios.get(`${baseURL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Rota protegida acessada com sucesso!');
        console.log('📋 Profile data:', protectedResponse.data);
        
      } catch (protectedError) {
        console.log('❌ Erro ao acessar rota protegida:', protectedError.response?.status, protectedError.response?.data);
      }
    }
    
  } catch (error) {
    console.log('❌ Erro no login admin:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Possíveis causas:');
      console.log('   - Usuário admin não foi criado no seed');
      console.log('   - Senha incorreta');
      console.log('   - Problema na hash da senha');
    }
  }

  // Teste 5: Verificar se existem usuários no banco
  console.log('\n👥 Teste 5: Verificando usuários no sistema...');
  try {
    // Tentar acessar endpoint público de usuários (se existir)
    const usersResponse = await axios.get(`${baseURL}/users`);
    console.log('✅ Endpoint de usuários acessível');
    console.log('📊 Total de usuários:', usersResponse.data.length);
  } catch (error) {
    console.log('❌ Endpoint de usuários não acessível:', error.response?.status);
    console.log('💡 Isso é normal se o endpoint for protegido');
  }

  // Teste 6: Verificar outros endpoints públicos
  console.log('\n🏪 Teste 6: Verificando endpoints públicos...');
  const publicEndpoints = [
    '/products',
    '/categories',
    '/banners'
  ];

  for (const endpoint of publicEndpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status} (${response.data.length || 'N/A'} items)`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status || 'NETWORK ERROR'}`);
    }
  }

  console.log('\n🎯 Debug do sistema de autenticação concluído!');
}

debugAuthSystem();