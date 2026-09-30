const axios = require('axios');

async function testSpecificRoutes() {
  console.log('🔍 Testando rotas específicas que estão falhando...\n');

  const baseURL = 'http://localhost:8081';

  // Fazer login primeiro
  let token = null;
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    token = loginResponse.data.access_token;
    console.log('✅ Login admin realizado');
  } catch (error) {
    console.log('❌ Erro no login admin:', error.message);
    return;
  }

  // Testar diferentes variações da rota de produtos
  const productRoutes = [
    '/products',
    '/product',
    '/api/products',
    '/products?page=1&limit=10'
  ];

  console.log('\n📦 Testando rotas de produtos:');
  for (const route of productRoutes) {
    try {
      const response = await axios.get(`${baseURL}${route}`);
      console.log(`✅ ${route}: ${response.status} - ${response.data.length || 'OK'}`);
    } catch (error) {
      console.log(`❌ ${route}: ${error.response?.status || 'ERRO'} - ${error.response?.data?.message || error.message}`);
    }
  }

  // Testar rotas de usuário
  const userRoutes = [
    '/users/profile',
    '/user/profile',
    '/auth/profile',
    '/users/me'
  ];

  console.log('\n👤 Testando rotas de usuário:');
  for (const route of userRoutes) {
    try {
      const response = await axios.get(`${baseURL}${route}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ ${route}: ${response.status} - OK`);
    } catch (error) {
      console.log(`❌ ${route}: ${error.response?.status || 'ERRO'} - ${error.response?.data?.message || error.message}`);
    }
  }

  // Listar todas as rotas disponíveis
  console.log('\n🗺️ Tentando descobrir rotas disponíveis...');
  try {
    // Algumas rotas que sabemos que existem
    const knownRoutes = [
      '/health',
      '/categories',
      '/cart',
      '/orders/my-orders',
      '/auth/login'
    ];

    for (const route of knownRoutes) {
      try {
        const response = await axios.get(`${baseURL}${route}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        console.log(`✅ ${route}: Disponível`);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.log(`⚠️ ${route}: ${error.response?.status} (existe mas com erro)`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Erro ao testar rotas conhecidas:', error.message);
  }
}

testSpecificRoutes();