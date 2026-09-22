const axios = require('axios');

async function testAuth() {
  console.log('🔐 Testando autenticação completa...');
  
  const baseURL = 'http://localhost:8081';
  
  try {
    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginResponse.data.user.name);
    console.log('🔑 Token recebido:', loginResponse.data.access_token ? 'SIM' : 'NÃO');
    
    const token = loginResponse.data.access_token;
    
    // 2. Testar carrinho
    console.log('\n2️⃣ Testando acesso ao carrinho...');
    const cartResponse = await axios.get(`${baseURL}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Carrinho acessado com sucesso!');
    console.log('📦 Itens no carrinho:', cartResponse.data.items?.length || 0);
    console.log('💰 Total:', cartResponse.data.total || 0);
    
    // 3. Testar outras rotas protegidas
    console.log('\n3️⃣ Testando outras rotas protegidas...');
    
    const protectedRoutes = [
      '/auth/profile',
      '/orders/my-orders'
    ];
    
    for (const route of protectedRoutes) {
      try {
        const response = await axios.get(`${baseURL}${route}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`✅ ${route}: OK`);
      } catch (error) {
        console.log(`❌ ${route}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('\n🎯 Teste de autenticação concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste de autenticação:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Possíveis causas do erro 401:');
      console.log('   - Token JWT inválido ou expirado');
      console.log('   - Usuário não encontrado ou inativo');
      console.log('   - Problema na validação do JWT');
    }
  }
}

testAuth();