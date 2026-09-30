const axios = require('axios');

async function testLogin() {
  console.log('🔐 Testando login do usuário admin...\n');

  try {
    // Tentar fazer login com o usuário admin criado no seed
    const response = await axios.post('http://localhost:8081/auth/login', {
      email: 'admin@loja.com',
      password: 'admin123'
    });

    console.log('✅ Login realizado com sucesso!');
    console.log('📋 Dados do usuário:', {
      id: response.data.user.id,
      name: response.data.user.name,
      email: response.data.user.email,
      role: response.data.user.role
    });
    console.log('🔑 Token JWT:', response.data.access_token.substring(0, 50) + '...');

    // Testar uma chamada autenticada
    console.log('\n🛒 Testando carrinho com autenticação...');
    const cartResponse = await axios.get('http://localhost:8081/cart', {
      headers: {
        'Authorization': `Bearer ${response.data.access_token}`
      }
    });

    console.log('✅ Carrinho acessado com sucesso!');
    console.log('📦 Itens no carrinho:', cartResponse.data.items?.length || 0);

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Dica: Verifique se o usuário admin foi criado no seed');
    }
  }
}

testLogin();