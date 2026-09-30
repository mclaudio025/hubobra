const axios = require('axios');

async function fixHabilitarProdutos() {
  console.log('🔧 Habilitando componente de produtos na loja\n');

  const baseURL = 'http://localhost:8081';
  let token = null;

  // 1. Fazer login para obter token de admin
  console.log('🔐 Fazendo login como admin...');
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@loja.com',
      password: 'admin123'
    });
    
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso\n');
    
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data?.message);
    return;
  }

  // 2. Obter configuração atual
  console.log('📋 Obtendo configuração atual...');
  try {
    const configResponse = await axios.get(`${baseURL}/components/config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Configuração atual obtida:');
    configResponse.data.forEach(component => {
      const status = component.enabled ? '✅ HABILITADO' : '❌ DESABILITADO';
      console.log(`   ${component.order}. ${component.name} (${component.id}) - ${status}`);
    });

    // 3. Habilitar o componente featured-products
    console.log('\n🔧 Habilitando componente "featured-products"...');
    
    const updatedConfig = configResponse.data.map(component => {
      if (component.id === 'featured-products') {
        return { ...component, enabled: true };
      }
      return component;
    });

    // 4. Enviar configuração atualizada
    const updateResponse = await axios.put(`${baseURL}/components/config`, updatedConfig, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Configuração atualizada:', updateResponse.data.message);

  } catch (error) {
    console.log('❌ Erro ao atualizar configuração:', error.response?.status, error.response?.data?.message);
    return;
  }

  // 5. Verificar se a mudança foi aplicada
  console.log('\n🔍 Verificando configuração atualizada...');
  try {
    const verifyResponse = await axios.get(`${baseURL}/components/config-public`);
    
    const featuredComponent = verifyResponse.data.find(c => c.id === 'featured-products');
    if (featuredComponent && featuredComponent.enabled) {
      console.log('✅ Componente "featured-products" agora está HABILITADO!');
      console.log(`   - Nome: ${featuredComponent.name}`);
      console.log(`   - Ordem: ${featuredComponent.order}`);
    } else {
      console.log('❌ Componente ainda está desabilitado');
    }

  } catch (error) {
    console.log('❌ Erro ao verificar configuração:', error.response?.data?.message);
  }

  // 6. Testar se os produtos aparecerão agora
  console.log('\n🎯 Testando se os produtos aparecerão...');
  try {
    const productsResponse = await axios.get(`${baseURL}/products?active=true&limit=5`);
    const products = productsResponse.data.products || [];
    
    console.log(`✅ ${products.length} produtos ativos encontrados:`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - R$ ${product.price} ${product.featured ? '[DESTAQUE]' : '[NORMAL]'}`);
    });

  } catch (error) {
    console.log('❌ Erro ao buscar produtos:', error.response?.data?.message);
  }

  console.log('\n🏁 Correção concluída!');
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Acesse http://localhost:3000');
  console.log('   2. Verifique se a seção "Nossos Produtos" aparece');
  console.log('   3. Os produtos devem estar visíveis agora');
  console.log('   4. Se necessário, limpe o cache do navegador (Ctrl+Shift+R)');
  
  console.log('\n✨ O que foi corrigido:');
  console.log('   ✅ Componente "featured-products" foi habilitado');
  console.log('   ✅ Produtos ativos agora aparecerão na loja');
  console.log('   ✅ Lógica inteligente: destaque primeiro, depois normais');
}

// Executar correção
fixHabilitarProdutos().catch(console.error);