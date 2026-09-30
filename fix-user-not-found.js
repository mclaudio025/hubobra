const axios = require('axios');

async function fixUserNotFound() {
  console.log('🔧 Corrigindo problema "Usuário não encontrado"...');
  console.log('=' .repeat(60));

  const baseURL = 'http://localhost:8082';

  // 1. Verificar se backend está funcionando
  console.log('\n1️⃣ Verificando backend...');
  try {
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Backend está funcionando:', healthResponse.status);
  } catch (error) {
    console.log('❌ Backend não está respondendo:', error.message);
    return;
  }

  // 2. Tentar fazer login
  console.log('\n2️⃣ Tentando login...');
  let loginError = null;
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    console.log('✅ Login funcionou, mas pode haver problema com o token...');
    console.log('🆔 ID do usuário no token:', loginResponse.data.user.id);
    
    // Testar se o usuário realmente existe
    try {
      const profileResponse = await axios.get(`${baseURL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.access_token}`
        }
      });
      console.log('✅ Usuário existe no banco, problema resolvido!');
      return;
    } catch (profileError) {
      console.log('❌ Usuário do token não existe no banco:', profileError.response?.data?.message);
      loginError = profileError;
    }
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data?.message || error.message);
    loginError = error;
  }

  // 3. Se chegou aqui, há problema com o usuário. Vamos recriar.
  console.log('\n3️⃣ Recriando usuário admin...');
  
  try {
    // Primeiro, tentar registrar um novo usuário admin
    const registerResponse = await axios.post(`${baseURL}/auth/register`, {
      name: 'Administrador',
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    console.log('✅ Novo usuário admin criado com sucesso!');
    console.log('👤 Dados do usuário:', {
      id: registerResponse.data.user.id,
      name: registerResponse.data.user.name,
      email: registerResponse.data.user.email,
      role: registerResponse.data.user.role
    });
    
    // Testar o novo token
    const newToken = registerResponse.data.access_token;
    const profileResponse = await axios.get(`${baseURL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${newToken}`
      }
    });
    
    console.log('✅ Novo token funciona corretamente!');
    console.log('📋 Perfil do usuário:', profileResponse.data);
    
  } catch (registerError) {
    console.log('❌ Erro ao registrar novo usuário:', registerError.response?.data?.message || registerError.message);
    
    if (registerError.response?.data?.message?.includes('já existe')) {
      console.log('\n💡 O email já existe, mas o usuário não está acessível.');
      console.log('🔧 Isso indica um problema no banco de dados.');
      console.log('\n📋 Soluções possíveis:');
      console.log('   1. Limpar o localStorage do navegador');
      console.log('   2. Fazer logout e login novamente');
      console.log('   3. Verificar se o usuário está ativo no banco');
      console.log('   4. Recriar o banco de dados se necessário');
      
      // Gerar script para o navegador
      console.log('\n🌐 Script para executar no console do navegador (F12):');
      console.log('```javascript');
      console.log('// Limpar todos os dados de autenticação');
      console.log('localStorage.removeItem("auth_token");');
      console.log('localStorage.removeItem("auth_user");');
      console.log('localStorage.removeItem("token");');
      console.log('localStorage.removeItem("user");');
      console.log('sessionStorage.clear();');
      console.log('console.log("✅ Dados de autenticação limpos. Recarregue a página e faça login novamente.");');
      console.log('```');
    }
  }

  console.log('\n✅ Processo de correção concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Limpe o localStorage do navegador');
  console.log('   2. Recarregue a página do frontend');
  console.log('   3. Faça login novamente');
  console.log('   4. Teste a atualização de banners');
}

fixUserNotFound();