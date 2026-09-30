const axios = require('axios');

async function createTestUser() {
  console.log('👤 Criando usuário de teste...\n');

  const baseURL = 'http://localhost:8081';

  try {
    // Tentar criar um usuário de teste
    const userData = {
      name: 'Usuário Teste',
      email: 'teste@loja.com',
      password: 'teste123'
    };

    console.log('📝 Criando usuário:', userData.email);
    
    const registerResponse = await axios.post(`${baseURL}/auth/register`, userData);
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('📋 Dados:', {
      id: registerResponse.data.user.id,
      name: registerResponse.data.user.name,
      email: registerResponse.data.user.email,
      role: registerResponse.data.user.role
    });

    // Fazer login com o usuário criado
    console.log('\n🔐 Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: userData.email,
      password: userData.password
    });

    console.log('✅ Login realizado com sucesso!');
    console.log('🔑 Token:', loginResponse.data.access_token.substring(0, 50) + '...');

    // Testar carrinho
    console.log('\n🛒 Testando carrinho...');
    const cartResponse = await axios.get(`${baseURL}/cart`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.access_token}`
      }
    });

    console.log('✅ Carrinho acessado com sucesso!');
    console.log('📦 Itens no carrinho:', cartResponse.data.items?.length || 0);

    console.log('\n🎯 Usuário de teste pronto para uso!');
    console.log('📧 Email: teste@loja.com');
    console.log('🔒 Senha: teste123');

  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Usuário já existe, tentando fazer login...');
      
      try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
          email: 'teste@loja.com',
          password: 'teste123'
        });
        
        console.log('✅ Login realizado com sucesso!');
        console.log('🎯 Usuário de teste disponível!');
        console.log('📧 Email: teste@loja.com');
        console.log('🔒 Senha: teste123');
      } catch (loginError) {
        console.error('❌ Erro no login:', loginError.response?.data || loginError.message);
      }
    } else {
      console.error('❌ Erro ao criar usuário:', error.response?.data || error.message);
    }
  }
}

createTestUser();