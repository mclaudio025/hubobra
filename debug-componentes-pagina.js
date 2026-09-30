const axios = require('axios');

async function debugComponentesPagina() {
  console.log('🔍 Debug: Componentes da página inicial\n');

  const baseURL = 'http://localhost:8081';
  const frontendURL = 'http://localhost:3000';

  // 1. Verificar configuração de componentes
  console.log('⚙️ Verificando configuração de componentes...');
  try {
    const response = await axios.get(`${baseURL}/components/config-public`);
    
    console.log('✅ Configuração de componentes obtida:');
    response.data.forEach(component => {
      const status = component.enabled ? '✅ HABILITADO' : '❌ DESABILITADO';
      console.log(`   ${component.order}. ${component.name} (${component.id}) - ${status}`);
    });

    // Verificar especificamente o featured-products
    const featuredComponent = response.data.find(c => c.id === 'featured-products');
    if (featuredComponent) {
      console.log(`\n🎯 Componente "featured-products":`);
      console.log(`   - Habilitado: ${featuredComponent.enabled ? 'SIM' : 'NÃO'}`);
      console.log(`   - Ordem: ${featuredComponent.order}`);
      console.log(`   - Nome: ${featuredComponent.name}`);
    } else {
      console.log('\n❌ Componente "featured-products" não encontrado na configuração!');
    }

  } catch (error) {
    console.log('❌ Erro ao obter configuração:', error.response?.status, error.response?.data?.message);
    
    if (error.response?.status === 404) {
      console.log('💡 Rota de configuração não existe - usando configuração padrão');
      console.log('✅ Configuração padrão (featured-products habilitado por padrão)');
    }
  }

  // 2. Testar se o FeaturedProductsCarousel está funcionando
  console.log('\n🎨 Testando FeaturedProductsCarousel...');
  try {
    // Simular as requisições que o componente faz
    console.log('1️⃣ Testando busca de produtos em destaque...');
    const featuredResponse = await axios.get(`${baseURL}/products?featured=true&active=true&limit=10`);
    const featuredProducts = featuredResponse.data.products || [];
    console.log(`   ✅ Produtos em destaque: ${featuredProducts.length}`);

    console.log('2️⃣ Testando busca de produtos ativos...');
    const activeResponse = await axios.get(`${baseURL}/products?active=true&limit=10`);
    const activeProducts = activeResponse.data.products || [];
    console.log(`   ✅ Produtos ativos: ${activeProducts.length}`);

    // Simular a lógica do componente
    let totalProducts = featuredProducts;
    if (featuredProducts.length < 6) {
      const additionalProducts = activeProducts.filter(product => 
        !featuredProducts.some(fp => fp.id === product.id)
      );
      totalProducts = [...featuredProducts, ...additionalProducts.slice(0, 10 - featuredProducts.length)];
    }

    console.log(`\n📊 Total de produtos que deveriam aparecer: ${totalProducts.length}`);
    
    if (totalProducts.length > 0) {
      console.log('📋 Produtos que deveriam aparecer:');
      totalProducts.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - R$ ${product.price} ${product.featured ? '[DESTAQUE]' : '[NORMAL]'}`);
      });
      if (totalProducts.length > 5) {
        console.log(`   ... e mais ${totalProducts.length - 5} produtos`);
      }
    } else {
      console.log('❌ Nenhum produto deveria aparecer (problema!)');
    }

  } catch (error) {
    console.log('❌ Erro ao testar componente:', error.response?.data?.message);
  }

  // 3. Verificar se o frontend está acessível
  console.log('\n🌐 Verificando frontend...');
  try {
    const response = await axios.get(frontendURL, { timeout: 5000 });
    console.log('✅ Frontend acessível');
  } catch (error) {
    console.log('❌ Frontend não acessível:', error.message);
    console.log('💡 Certifique-se de que o frontend está rodando');
    return;
  }

  // 4. Verificar se há erros no console do navegador
  console.log('\n🔍 Dicas para debug no navegador:');
  console.log('   1. Abra http://localhost:3000');
  console.log('   2. Pressione F12 para abrir DevTools');
  console.log('   3. Vá na aba Console e procure por erros');
  console.log('   4. Vá na aba Network e veja se as requisições estão sendo feitas');
  console.log('   5. Procure por requisições para /products');

  // 5. Verificar possíveis problemas
  console.log('\n💡 Possíveis causas do problema:');
  
  try {
    const componentsResponse = await axios.get(`${baseURL}/components/config-public`);
    const featuredComponent = componentsResponse.data.find(c => c.id === 'featured-products');
    
    if (!featuredComponent || !featuredComponent.enabled) {
      console.log('   ❌ Componente "featured-products" está desabilitado na configuração');
      console.log('   💡 Solução: Habilite o componente no admin ou na configuração');
    } else {
      console.log('   ✅ Componente "featured-products" está habilitado');
    }
    
  } catch (error) {
    console.log('   ⚠️ Não foi possível verificar configuração de componentes');
  }

  console.log('\n🔧 Soluções possíveis:');
  console.log('   1. Verifique se o componente está habilitado na configuração');
  console.log('   2. Limpe o cache do navegador (Ctrl+Shift+R)');
  console.log('   3. Verifique se há erros no console do navegador');
  console.log('   4. Certifique-se de que há produtos ativos no banco');
  console.log('   5. Verifique se o backend está respondendo corretamente');

  console.log('\n🏁 Debug concluído!');
}

// Executar debug
debugComponentesPagina().catch(console.error);