const axios = require('axios');

async function debugUserToken() {
  console.log('🔍 Debugando problema de "Usuário não encontrado"...\n');

  const baseURL = 'http://localhost:8081';

  try {
    // 1. Fazer login para obter token
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso!');
    console.log('🔑 Token obtido:', token.substring(0, 50) + '...');
    console.log('👤 Usuário logado:', loginResponse.data.user.name);
    console.log('📧 Email:', loginResponse.data.user.email);
    console.log('🆔 ID:', loginResponse.data.user.id);

    // 2. Verificar se usuário existe no banco
    console.log('\n2️⃣ Verificando se usuário existe no banco...');
    const userId = loginResponse.data.user.id;
    try {
      const userResponse = await axios.get(`${baseURL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Usuário encontrado no banco:', {
        id: userResponse.data.id,
        email: userResponse.data.email,
        name: userResponse.data.name,
        active: userResponse.data.active
      });
    } catch (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.response?.data || userError.message);
    }

    // 3. Testar carrinho com token válido
    console.log('\n3️⃣ Testando carrinho com token...');
    try {
      const cartResponse = await axios.get(`${baseURL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Carrinho acessado com sucesso!');
      console.log('📦 Dados do carrinho:', {
        items: cartResponse.data.items?.length || 0,
        total: cartResponse.data.total || 0,
        totalItems: cartResponse.data.totalItems || 0
      });
    } catch (cartError) {
      console.log('❌ Erro ao acessar carrinho:', cartError.response?.data || cartError.message);
      
      // Se for erro 401, o problema está na autenticação
      if (cartError.response?.status === 401) {
        console.log('\n🔍 Erro 401 detectado - problema na autenticação');
        console.log('📋 Detalhes do erro:', cartError.response.data);
      }
    }

    // 4. Verificar se há tokens antigos no localStorage (simulação)
    console.log('\n4️⃣ Verificações adicionais...');
    console.log('⚠️ Possíveis causas do erro:');
    console.log('  - Token expirado');
    console.log('  - Usuário foi deletado do banco');
    console.log('  - Usuário foi desativado');
    console.log('  - Token corrompido no localStorage');
    console.log('  - Problema de sincronização entre frontend e backend');

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

debugUserToken();