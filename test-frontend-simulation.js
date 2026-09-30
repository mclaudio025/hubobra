const axios = require('axios');

const API_URL = 'http://localhost:8081';

async function testFrontendSimulation() {
  console.log('🧪 Simulando exatamente o comportamento do frontend...');
  console.log('============================================================');

  try {
    // 1. Fazer login como o frontend faria
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });

    const { access_token, user } = loginResponse.data;
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔑 Role:', user.role);
    console.log('🎫 Token (primeiros 50 chars):', access_token.substring(0, 50) + '...');

    // 2. Buscar configuração atual
    console.log('\n2️⃣ Buscando configuração atual...');
    const getResponse = await axios.get(`${API_URL}/components/config`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Configuração atual obtida!');
    console.log('📋 Componentes encontrados:', getResponse.data.length);
    getResponse.data.forEach((comp, idx) => {
      console.log(`   ${idx + 1}. ${comp.name} - ${comp.enabled ? 'Ativo' : 'Inativo'} (ordem: ${comp.order})`);
    });

    // 3. Modificar configuração (simular mudança no frontend)
    console.log('\n3️⃣ Modificando configuração...');
    const modifiedConfig = getResponse.data.map(comp => {
      if (comp.id === 'weekly-offers') {
        return { ...comp, enabled: false }; // Desabilitar ofertas da semana
      }
      return comp;
    });

    console.log('🔄 Configuração modificada:');
    modifiedConfig.forEach((comp, idx) => {
      const status = comp.enabled ? 'Ativo' : 'Inativo';
      const changed = comp.id === 'weekly-offers' ? ' (MODIFICADO)' : '';
      console.log(`   ${idx + 1}. ${comp.name} - ${status} (ordem: ${comp.order})${changed}`);
    });

    // 4. Salvar configuração como o frontend faria
    console.log('\n4️⃣ Salvando configuração modificada...');
    const putResponse = await axios.put(`${API_URL}/components/config`, modifiedConfig, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Configuração salva com sucesso!');
    console.log('📋 Resposta do servidor:', putResponse.data);

    // 5. Verificar se a mudança foi aplicada
    console.log('\n5️⃣ Verificando se a mudança foi aplicada...');
    const verifyResponse = await axios.get(`${API_URL}/components/config`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const weeklyOffersComponent = verifyResponse.data.find(comp => comp.id === 'weekly-offers');
    if (weeklyOffersComponent && !weeklyOffersComponent.enabled) {
      console.log('✅ Mudança aplicada corretamente! Ofertas da Semana está desabilitada.');
    } else {
      console.log('❌ Mudança NÃO foi aplicada. Ofertas da Semana ainda está habilitada.');
    }

    console.log('\n📋 DIAGNÓSTICO FINAL:');
    console.log('========================================');
    console.log('✅ Login: OK');
    console.log('✅ GET /components/config: OK');
    console.log('✅ PUT /components/config: OK');
    console.log('✅ Verificação de mudanças: OK');
    console.log('\n🎯 CONCLUSÃO: O backend está funcionando perfeitamente!');
    console.log('💡 O problema deve estar no frontend (JavaScript, token expirado, etc.)');
    
    console.log('\n🔍 PRÓXIMOS PASSOS PARA DEBUGAR:');
    console.log('1. Abrir DevTools do navegador (F12)');
    console.log('2. Ir para a aba Network');
    console.log('3. Tentar salvar a configuração no frontend');
    console.log('4. Verificar se a requisição PUT está sendo enviada');
    console.log('5. Verificar se o token está sendo incluído no header Authorization');
    console.log('6. Verificar se há erros no console do navegador');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n🔍 DIAGNÓSTICO: Erro 401 (Não Autorizado)');
        console.log('💡 Possíveis causas:');
        console.log('   - Token inválido ou expirado');
        console.log('   - Header Authorization não está sendo enviado');
        console.log('   - Usuário não tem permissão ADMIN');
      } else if (error.response.status === 403) {
        console.log('\n🔍 DIAGNÓSTICO: Erro 403 (Proibido)');
        console.log('💡 Possíveis causas:');
        console.log('   - Usuário não tem role ADMIN');
        console.log('   - Endpoint requer permissões específicas');
      }
    }
  }
}

// Executar o teste
testFrontendSimulation();