const axios = require('axios');

async function testFrontendAPIs() {
  console.log('🧪 Testando APIs que o frontend usa...\n');

  const baseURL = 'http://localhost:8081';

  // Testes sem autenticação (devem funcionar)
  const publicTests = [
    { name: 'Categorias', endpoint: '/categories' },
    { name: 'Produtos', endpoint: '/products' },
    { name: 'Health Check', endpoint: '/health' },
  ];

  console.log('📋 Testando APIs públicas:');
  for (const test of publicTests) {
    try {
      const response = await axios.get(`${baseURL}${test.endpoint}`);
      console.log(`✅ ${test.name}: ${response.status} - ${response.data.length || 'OK'}`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'ERRO'} - ${error.message}`);
    }
  }

  // Fazer login para testar APIs autenticadas
  console.log('\n🔐 Fazendo login...');
  let token = null;
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso!');
  } catch (error) {
    console.log('❌ Erro no login:', error.message);
    return;
  }

  // Testes com autenticação
  const authTests = [
    { name: 'Carrinho', endpoint: '/cart' },
    { name: 'Pedidos', endpoint: '/orders/my-orders' },
    { name: 'Perfil', endpoint: '/users/profile' },
  ];

  console.log('\n🔒 Testando APIs autenticadas:');
  for (const test of authTests) {
    try {
      const response = await axios.get(`${baseURL}${test.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ ${test.name}: ${response.status} - OK`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'ERRO'} - ${error.response?.data?.message || error.message}`);
    }
  }

  console.log('\n🎯 Teste concluído!');
}

testFrontendAPIs();