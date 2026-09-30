const axios = require('axios');

async function testAdminAuth() {
  console.log('🔐 Testando autenticação de admin para salvar configurações...');
  console.log('=' .repeat(60));
  
  const backendUrl = 'http://localhost:8081';
  
  // 1. Verificar se o backend está rodando
  console.log('\n1️⃣ Verificando backend...');
  try {
    const healthResponse = await axios.get(`${backendUrl}/health`, { timeout: 5000 });
    console.log('✅ Backend está rodando');
  } catch (error) {
    console.log('❌ Backend não está acessível:', error.message);
    return;
  }
  
  // 2. Tentar fazer login como admin
  console.log('\n2️⃣ Fazendo login como admin...');
  let adminToken = null;
  try {
    const loginResponse = await axios.post(`${backendUrl}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    adminToken = loginResponse.data.access_token;
    console.log('✅ Login admin realizado com sucesso!');
    console.log('👤 Usuário:', loginResponse.data.user.name);
    console.log('📧 Email:', loginResponse.data.user.email);
    console.log('🔑 Role:', loginResponse.data.user.role);
    console.log('🎫 Token obtido:', adminToken ? 'SIM' : 'NÃO');
    
    if (loginResponse.data.user.role !== 'ADMIN') {
      console.log('⚠️ ATENÇÃO: Usuário não tem role ADMIN!');
    }
    
  } catch (error) {
    console.log('❌ Erro no login admin:', error.response?.data || error.message);
    
    // Tentar criar usuário admin se não existir
    console.log('\n🔧 Tentando criar usuário admin...');
    try {
      const registerResponse = await axios.post(`${backendUrl}/auth/register`, {
        name: 'Admin User',
        email: 'admin@loja.com',
        password: 'admin123'
      });
      
      console.log('✅ Usuário admin criado!');
      console.log('⚠️ ATENÇÃO: Role padrão é USER, não ADMIN');
      console.log('💡 Você precisa alterar manualmente no banco de dados');
      
    } catch (registerError) {
      console.log('❌ Erro ao criar admin:', registerError.response?.data || registerError.message);
    }
    return;
  }
  
  // 3. Testar acesso ao endpoint protegido de configurações (GET)
  console.log('\n3️⃣ Testando acesso ao endpoint protegido (GET)...');
  try {
    const getConfigResponse = await axios.get(`${backendUrl}/components/config`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Endpoint GET /components/config acessível!');
    console.log('📋 Configurações recebidas:', getConfigResponse.data.length, 'componentes');
    
  } catch (error) {
    console.log('❌ Erro ao acessar GET /components/config:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🚫 Token inválido ou expirado');
    } else if (error.response?.status === 403) {
      console.log('🚫 Usuário não tem permissões de ADMIN');
    }
    return;
  }
  
  // 4. Testar salvamento de configurações (PUT)
  console.log('\n4️⃣ Testando salvamento de configurações (PUT)...');
  const testConfig = [
    { id: 'hero-carousel', name: 'Carrossel Principal', enabled: true, order: 1 },
    { id: 'weekly-offers', name: 'Ofertas da Semana', enabled: false, order: 2 },
    { id: 'promotional-banners', name: 'Banners Promocionais', enabled: true, order: 3 },
    { id: 'featured-products', name: 'Produtos em Destaque', enabled: true, order: 4 },
    { id: 'carousel', name: 'Carrossel Secundário', enabled: true, order: 5 },
    { id: 'department-shortcuts', name: 'Atalhos de Departamentos', enabled: true, order: 6 },
    { id: 'footer', name: 'Rodapé', enabled: true, order: 7 }
  ];
  
  try {
    const putConfigResponse = await axios.put(`${backendUrl}/components/config`, testConfig, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Configurações salvas com sucesso!');
    console.log('📋 Resposta:', putConfigResponse.data);
    
    // Verificar se as mudanças foram aplicadas
    console.log('\n5️⃣ Verificando se as mudanças foram aplicadas...');
    const verifyResponse = await axios.get(`${backendUrl}/components/config-public`);
    const weeklyOffers = verifyResponse.data.find(c => c.id === 'weekly-offers');
    
    if (weeklyOffers && !weeklyOffers.enabled) {
      console.log('✅ Mudanças aplicadas corretamente! (Ofertas da Semana desabilitadas)');
    } else {
      console.log('⚠️ Mudanças não foram aplicadas como esperado');
    }
    
  } catch (error) {
    console.log('❌ Erro ao salvar configurações:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('🚫 Token inválido ou expirado');
      console.log('💡 Verifique se o token JWT está sendo enviado corretamente');
    } else if (error.response?.status === 403) {
      console.log('🚫 Usuário não tem permissões de ADMIN');
      console.log('💡 Verifique se o usuário tem role ADMIN no banco de dados');
    }
  }
  
  console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
  console.log('=' .repeat(40));
  console.log('1. Se o login falhou: Usuário admin não existe ou senha incorreta');
  console.log('2. Se GET funcionou mas PUT falhou: Problema de permissões');
  console.log('3. Se ambos falharam com 401: Problema no token JWT');
  console.log('4. Se ambos falharam com 403: Usuário não tem role ADMIN');
  console.log('\n💡 SOLUÇÕES:');
  console.log('- Verificar se existe usuário com email admin@loja.com');
  console.log('- Verificar se o usuário tem role ADMIN no banco');
  console.log('- Limpar localStorage do navegador');
  console.log('- Fazer logout e login novamente no frontend');
}

testAdminAuth();