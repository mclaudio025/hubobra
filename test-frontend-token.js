const axios = require('axios');

async function testFrontendToken() {
  console.log('🔍 Testando problema de token no frontend...\n');

  const baseURL = 'http://localhost:8081';

  try {
    // 1. Simular o que o frontend faz - fazer login
    console.log('1️⃣ Simulando login do frontend...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso!');
    console.log('🔑 Token válido obtido');

    // 2. Testar carrinho imediatamente após login
    console.log('\n2️⃣ Testando carrinho imediatamente após login...');
    try {
      const cartResponse = await axios.get(`${baseURL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Carrinho acessado com sucesso!');
      console.log('📦 Dados:', cartResponse.data);
    } catch (cartError) {
      console.log('❌ Erro no carrinho:', cartError.response?.data || cartError.message);
    }

    // 3. Simular delay como no frontend (100ms)
    console.log('\n3️⃣ Simulando delay do frontend (100ms)...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const cartResponse2 = await axios.get(`${baseURL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Carrinho após delay acessado com sucesso!');
      console.log('📦 Dados:', cartResponse2.data);
    } catch (cartError2) {
      console.log('❌ Erro no carrinho após delay:', cartError2.response?.data || cartError2.message);
    }

    // 4. Testar com token inválido (simular problema)
    console.log('\n4️⃣ Testando com token inválido...');
    try {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';
      const cartResponse3 = await axios.get(`${baseURL}/cart`, {
        headers: {
          'Authorization': `Bearer ${invalidToken}`
        }
      });
      console.log('✅ Carrinho com token inválido:', cartResponse3.data);
    } catch (cartError3) {
      console.log('❌ Erro esperado com token inválido:', cartError3.response?.data?.message || cartError3.message);
    }

    // 5. Testar sem token
    console.log('\n5️⃣ Testando sem token...');
    try {
      const cartResponse4 = await axios.get(`${baseURL}/cart`);
      console.log('✅ Carrinho sem token:', cartResponse4.data);
    } catch (cartError4) {
      console.log('❌ Erro esperado sem token:', cartError4.response?.data?.message || cartError4.message);
    }

    // 6. Verificar se o problema é race condition
    console.log('\n6️⃣ Testando múltiplas chamadas simultâneas...');
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        axios.get(`${baseURL}/cart`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(response => {
          console.log(`✅ Chamada ${i + 1} bem-sucedida`);
          return response.data;
        }).catch(error => {
          console.log(`❌ Chamada ${i + 1} falhou:`, error.response?.data?.message || error.message);
          return null;
        })
      );
    }

    const results = await Promise.all(promises);
    console.log('📊 Resultados das chamadas simultâneas:', results.filter(r => r !== null).length, 'sucessos de', promises.length);

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testFrontendToken();